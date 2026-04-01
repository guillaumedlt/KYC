import { NextRequest, NextResponse } from "next/server";
import { screenEntity } from "@/lib/ai/claude";
import { createReadOnlyClient as createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Generate DIRECT SEARCH URLs with entity name (not just homepage)
    const searchName = encodeURIComponent(name);
    const directSearchLinks: { name: string; type: string; url: string; searchUrl: string; result: string }[] = [
      // PEP databases
      { name: "Google — recherche PEP", type: "pep_database", url: "https://www.google.com", searchUrl: `https://www.google.com/search?q="${searchName}"+PEP+politically+exposed+person`, result: "" },
      { name: "HATVP France — déclarations", type: "pep_database", url: "https://www.hatvp.fr", searchUrl: `https://www.hatvp.fr/consulter-les-declarations/?search=${searchName}`, result: "" },
      { name: "OpenSanctions — PEP/Sanctions", type: "pep_database", url: "https://www.opensanctions.org", searchUrl: `https://www.opensanctions.org/search/?q=${searchName}`, result: "" },
      // Sanctions lists
      { name: "ONU — Liste consolidée sanctions", type: "sanctions_list", url: "https://www.un.org", searchUrl: `https://www.un.org/securitycouncil/content/un-sc-consolidated-list`, result: "" },
      { name: "UE — Carte des sanctions", type: "sanctions_list", url: "https://www.sanctionsmap.eu", searchUrl: `https://www.sanctionsmap.eu/#/main?search=%7B%22value%22:%22${searchName}%22%7D`, result: "" },
      { name: "OFAC — SDN Search (US)", type: "sanctions_list", url: "https://sanctionssearch.ofac.treas.gov", searchUrl: `https://sanctionssearch.ofac.treas.gov/Details.aspx?id=${searchName}`, result: "" },
      { name: "UK — HMT Sanctions Search", type: "sanctions_list", url: "https://www.gov.uk", searchUrl: `https://www.gov.uk/government/publications/the-uk-sanctions-list`, result: "" },
      { name: "Monaco — Gel des fonds", type: "sanctions_list", url: "https://service-public-entreprises.gouv.mc", searchUrl: `https://service-public-entreprises.gouv.mc/En-cours-d-activite/Obligations-legales-et-comptables/Mesures-de-gel-de-fonds/Liste-nationale-de-gel-des-fonds-et-des-ressources-economiques`, result: "" },
      // Registries
      { name: "OpenCorporates — recherche société", type: "registry", url: "https://opencorporates.com", searchUrl: `https://opencorporates.com/companies?q=${searchName}`, result: "" },
      { name: "ICIJ — Offshore Leaks Database", type: "media", url: "https://offshoreleaks.icij.org", searchUrl: `https://offshoreleaks.icij.org/search?q=${searchName}`, result: "" },
      // Media
      { name: "Google News — médias", type: "media", url: "https://news.google.com", searchUrl: `https://news.google.com/search?q="${searchName}"+fraude+OR+blanchiment+OR+corruption+OR+sanctions`, result: "" },
      { name: "Google — adverse media", type: "media", url: "https://www.google.com", searchUrl: `https://www.google.com/search?q="${searchName}"+fraud+OR+money+laundering+OR+corruption+OR+sanctions+OR+criminal`, result: "" },
      // FATF
      { name: "GAFI — Juridictions à haut risque", type: "fatf", url: "https://www.fatf-gafi.org", searchUrl: `https://www.fatf-gafi.org/en/countries/detail/${nationality?.toLowerCase() ?? "monaco"}.html`, result: "" },
      { name: "Transparency International — CPI", type: "media", url: "https://www.transparency.org", searchUrl: `https://www.transparency.org/en/cpi/2023`, result: "" },
    ];

    // Merge AI sources with our generated direct links
    // AI sources have analysis results, direct links have search URLs
    const aiSources = result.sourcesChecked ?? [];
    const mergedSources = directSearchLinks.map((link) => {
      // Find matching AI source by name similarity
      const aiMatch = aiSources.find((s: { name: string; result: string }) =>
        s.name.toLowerCase().includes(link.name.split("—")[0].trim().toLowerCase().slice(0, 10)) ||
        link.name.toLowerCase().includes(s.name.toLowerCase().slice(0, 10))
      );
      return {
        name: link.name,
        type: link.type,
        url: link.searchUrl, // Use the SEARCH URL, not homepage
        result: aiMatch?.result ?? "Vérification manuelle requise — cliquez pour vérifier",
      };
    });

    // Add any AI sources that weren't matched
    for (const aiSrc of aiSources) {
      if (!mergedSources.some((m) => m.name.toLowerCase().includes((aiSrc as { name: string }).name.toLowerCase().slice(0, 10)))) {
        mergedSources.push(aiSrc as { name: string; type: string; url: string; result: string });
      }
    }

    // Build full result payload
    const fullPayload = {
      summary: result.summary,
      recommendations: result.recommendations,
      sourcesChecked: mergedSources,
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

    // Save screenings to DB — REPLACE existing ones (don't accumulate)
    console.log(`[Screening] Saving ${screeningsToSave.length} screenings, mergedSources count: ${mergedSources.length}`);
    for (const screening of screeningsToSave) {
      // Delete previous screening of same type for same entity
      await supabase.from("screenings")
        .delete()
        .eq("entity_id", screening.entity_id)
        .eq("screening_type", screening.screening_type);

      // Insert new one
      const { error: insertErr } = await supabase.from("screenings").insert(screening);
      if (insertErr) console.error(`[Screening] Insert failed for ${screening.screening_type}:`, insertErr.message);
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
      sourcesChecked: mergedSources, // Override with our direct search URLs
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

    const body = await request.json();
    const { screeningId, decision } = body;

    if (!screeningId || !decision) {
      return NextResponse.json({ error: "Missing screeningId or decision" }, { status: 400 });
    }

    if (!["confirmed_match", "false_positive", "pending"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const { error } = await supabase
      .from("screenings")
      .update({
        review_decision: decision,
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
        description: `Revue manuelle sur ${(screening.entities as Record<string, unknown>)?.display_name ?? screening.entity_id}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
