import { createClient } from "@/lib/supabase/server";

// =============================================================================
// ENTITIES
// =============================================================================

export async function getEntities() {
  const supabase = await createClient();
  const { data: entities } = await supabase
    .from("entities")
    .select("*, entity_people!entity_people_entity_id_fkey(*), entity_companies!entity_companies_entity_id_fkey(*)")
    .order("updated_at", { ascending: false });
  return entities ?? [];
}

export async function getEntityById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entities")
    .select("*, entity_people!entity_people_entity_id_fkey(*), entity_companies!entity_companies_entity_id_fkey(*)")
    .eq("id", id)
    .single();
  return data;
}

// =============================================================================
// RELATIONS
// =============================================================================

export async function getRelationsForEntity(entityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entity_relations")
    .select("*")
    .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
    .eq("is_active", true);
  return data ?? [];
}

// =============================================================================
// KYC CASES
// =============================================================================

export async function getCases() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kyc_cases")
    .select("*, entities(display_name, type)")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getCaseById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kyc_cases")
    .select("*, entities(display_name, type, risk_score, risk_level)")
    .eq("id", id)
    .single();
  return data;
}

export async function getCasesForEntity(entityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kyc_cases")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// =============================================================================
// SCREENINGS
// =============================================================================

export async function getScreenings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("screenings")
    .select("*, entities(display_name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getScreeningsForEntity(entityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("screenings")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// =============================================================================
// ACTIVITIES
// =============================================================================

export async function getActivities(limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*, entities(display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getActivitiesForEntity(entityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// =============================================================================
// DOCUMENTS
// =============================================================================

export async function getDocuments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*, entities(display_name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getDocumentsForEntity(entityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
