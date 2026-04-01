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
    const { entityId, name, type, nationality, dateOfBirth, jurisdiction, role, screeningType } = body;

    if (!name || !entityId) {
      return NextResponse.json({ error: "Missing name or entityId" }, { status: 400 });
    }

    console.log(`[Screening] Starting ${screeningType ?? "full"} screening for: ${name}`);

    // Run AI screening
    const result = await screenEntity({
      name,
      type: type ?? "person",
      nationality,
      dateOfBirth,
      jurisdiction,
      role,
    });

    // Determine which screenings to save
    const screeningsToSave = [];

    // PEP screening
    if (screeningType === "all" || screeningType === "pep" || !screeningType) {
      screeningsToSave.push({
        tenant_id: TENANT_ID,
        entity_id: entityId,
        screening_type: "pep",
        lists_checked: ["pep_domestic", "pep_foreign", "pep_international"],
        status: "completed",
        match_found: result.pep.match,
        matches: result.pep.match ? JSON.stringify([{
          name: name,
          function: result.pep.function,
          level: result.pep.level,
          country: result.pep.country,
          since: result.pep.since,
          until: result.pep.until,
          familyLinks: result.pep.familyLinks,
          confidence: result.confidence,
        }]) : "[]",
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
        matches: result.sanctions.lists.length > 0 ? JSON.stringify(result.sanctions.lists) : "[]",
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
        matches: result.adverseMedia.articles.length > 0 ? JSON.stringify(result.adverseMedia.articles) : "[]",
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
