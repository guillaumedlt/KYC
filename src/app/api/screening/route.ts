import { NextRequest, NextResponse } from "next/server";
import { screenEntity } from "@/lib/ai/claude";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { entityId, screeningType } = body;

    if (!entityId) {
      return NextResponse.json({ error: "Missing entityId" }, { status: 400 });
    }

    // Fetch FULL entity context from DB — everything we know
    const { data: entity } = await supabase.from("entities").select("*").eq("id", entityId).single();
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const isPerson = entity.type === "person";
    let person: Record<string, unknown> | null = null;
    let company: Record<string, unknown> | null = null;

    if (isPerson) {
      const { data } = await supabase.from("entity_people").select("*").eq("entity_id", entityId).single();
      person = data;
    } else {
      const { data } = await supabase.from("entity_companies").select("*").eq("entity_id", entityId).single();
      company = data;
    }

    // Get relations (UBOs, directors, shareholders)
    const { data: relations } = await supabase
      .from("entity_relations")
      .select("*, from_entity:entities!entity_relations_from_entity_id_fkey(display_name, type), to_entity:entities!entity_relations_to_entity_id_fkey(display_name, type)")
      .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`);

    // Get existing documents
    const { data: documents } = await supabase
      .from("documents")
      .select("name, type, status")
      .eq("entity_id", entityId);

    // Build full context
    const name = entity.display_name;
    const type = isPerson ? "person" as const : "company" as const;
    const nationality = isPerson ? (person?.nationality as string ?? null) : null;
    const dateOfBirth = isPerson ? (person?.date_of_birth as string ?? null) : null;
    const jurisdiction = !isPerson ? (company?.jurisdiction as string ?? null) : null;
    const address = isPerson ? (person?.address as string ?? null) : null;

    // Build aliases from relations
    const relatedNames = (relations ?? []).map((r: Record<string, unknown>) => {
      const from = r.from_entity as Record<string, unknown> | null;
      const to = r.to_entity as Record<string, unknown> | null;
      return from?.display_name !== name ? (from?.display_name as string) : (to?.display_name as string);
    }).filter(Boolean) as string[];

    console.log(`[Screening] Starting full screening for: ${name} (${type}), context: nationality=${nationality}, dob=${dateOfBirth}, jurisdiction=${jurisdiction}, relations=${relatedNames.length}, documents=${(documents ?? []).length}`);

    // Run AI screening with FULL context
    const result = await screenEntity({
      name,
      type,
      nationality,
      dateOfBirth,
      jurisdiction,
      role: isPerson ? (person?.is_pep ? "PEP signalé" : null) : null,
      aliases: relatedNames.length > 0 ? relatedNames : undefined,
    });

    // Determine which screenings to save
    const screeningsToSave = [];

    // Build full result payload for each screening type — includes sources, summary, etc.
    const fullPayload = {
      summary: result.summary,
      recommendations: result.recommendations,
      sourcesChecked: result.sourcesChecked,
      countryRisk: result.countryRisk,
      overallRisk: result.overallRisk,
      confidence: result.confidence,
    };

    // PEP screening
    if (screeningType === "all" || screeningType === "pep" || !screeningType) {
      screeningsToSave.push({
        tenant_id: TENANT_ID,
        entity_id: entityId,
        screening_type: "pep",
        lists_checked: ["pep_domestic", "pep_foreign", "pep_international"],
        status: "completed",
        match_found: result.pep.match,
        matches: JSON.stringify({
          details: result.pep.match ? [{
            name,
            function: result.pep.function,
            level: result.pep.level,
            country: result.pep.country,
            since: result.pep.since,
            until: result.pep.until,
            familyLinks: result.pep.familyLinks,
          }] : [],
          sources: result.pep.sources,
          ...fullPayload,
        }),
        review_decision: null,
      });
    }

    // Sanctions screening
    if (screeningType === "all" || screeningType === "sanctions" || !screeningType) {
      screeningsToSave.push({
        tenant_id: TENANT_ID,
        entity_id: entityId,
        screening_type: "sanctions",
        lists_checked: ["un", "eu", "monaco", "ofac", "uk_hmt"],
        status: "completed",
        match_found: result.sanctions.match,
        matches: JSON.stringify({
          details: result.sanctions.lists,
          sanctionDetails: result.sanctions.details,
          sources: result.sanctions.sources,
          ...fullPayload,
        }),
        review_decision: null,
      });
    }

    // Adverse media screening
    if (screeningType === "all" || screeningType === "adverse_media" || !screeningType) {
      screeningsToSave.push({
        tenant_id: TENANT_ID,
        entity_id: entityId,
        screening_type: "adverse_media",
        lists_checked: [],
        status: "completed",
        match_found: result.adverseMedia.match,
        matches: JSON.stringify({
          details: result.adverseMedia.articles,
          ...fullPayload,
        }),
        review_decision: null,
      });
    }

    // Save screenings to DB
    for (const screening of screeningsToSave) {
      await supabase.from("screenings").insert(screening);
    }

    // Log activity
    const matchSummary = [
      result.pep.match ? "PEP match" : null,
      result.sanctions.match ? "Sanctions match" : null,
      result.adverseMedia.match ? "Adverse media" : null,
    ].filter(Boolean).join(", ");

    await supabase.from("activities").insert({
      tenant_id: TENANT_ID,
      entity_id: entityId,
      type: result.pep.match || result.sanctions.match ? "screening_match_found" : "screening_completed",
      title: matchSummary ? `Screening : ${matchSummary}` : "Screening complété — aucun match",
      description: result.summary,
      agent_id: "screening-agent",
    });

    // Update entity tags if matches found
    if (result.pep.match || result.sanctions.match) {
      const tags: string[] = [];
      if (result.pep.match) tags.push("pep");
      if (result.sanctions.match) tags.push("sanctions-match");

      const { data: currentEntity } = await supabase.from("entities").select("tags").eq("id", entityId).single();
      const existingTags = (currentEntity?.tags as string[]) ?? [];
      const newTags = [...new Set([...existingTags, ...tags])];
      await supabase.from("entities").update({ tags: newTags }).eq("id", entityId);
    }

    console.log(`[Screening] Completed: overallRisk=${result.overallRisk}, confidence=${result.confidence}`);

    return NextResponse.json({
      ...result,
      screeningsSaved: screeningsToSave.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Screening] FAILED:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH — Manual review of a screening
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { screeningId, decision } = body;

    if (!screeningId || !decision) {
      return NextResponse.json({ error: "Missing screeningId or decision" }, { status: 400 });
    }

    if (!["confirmed_match", "false_positive", "pending"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    // Get user ID from users table
    const { data: existingUser } = await supabase.from("users").select("id").eq("id", user.id).single();
    const userId = existingUser?.id ?? null;

    const { error } = await supabase
      .from("screenings")
      .update({
        review_decision: decision,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", screeningId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log activity
    const { data: screening } = await supabase.from("screenings").select("*, entities(display_name)").eq("id", screeningId).single();
    if (screening) {
      await supabase.from("activities").insert({
        tenant_id: TENANT_ID,
        entity_id: screening.entity_id,
        type: "screening_reviewed",
        title: `Screening ${screening.screening_type} revu — ${decision === "confirmed_match" ? "Match confirmé" : decision === "false_positive" ? "Faux positif" : "En attente"}`,
        description: `Revue manuelle par ${user.email} sur ${(screening.entities as Record<string, unknown>)?.display_name ?? screening.entity_id}`,
        created_by: userId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
