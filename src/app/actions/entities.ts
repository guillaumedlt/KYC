"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const TENANT_ID = "00000000-0000-0000-0000-000000000001"; // TODO: from auth context

// =============================================================================
// CREATE PERSON
// =============================================================================

export async function createPerson(formData: FormData) {
  const supabase = await createClient();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const nationality = (formData.get("nationality") as string) || null;
  const residence = (formData.get("residence") as string) || null;
  const address = (formData.get("address") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const profession = (formData.get("profession") as string) || null;

  if (!firstName || !lastName) {
    return { error: "Prénom et nom sont requis" };
  }

  const displayName = `${firstName} ${lastName}`;

  // Create entity
  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .insert({
      tenant_id: TENANT_ID,
      type: "person",
      display_name: displayName,
      source: "manual",
    })
    .select("id")
    .single();

  if (entityError || !entity) {
    return { error: entityError?.message ?? "Erreur création entité" };
  }

  // Create person details
  const { error: personError } = await supabase.from("entity_people").insert({
    entity_id: entity.id,
    tenant_id: TENANT_ID,
    first_name: firstName,
    last_name: lastName,
    nationality,
    country_of_residence: residence,
    address,
    phone,
    email,
    profession,
  });

  if (personError) {
    return { error: personError.message };
  }

  // Activity log
  await supabase.from("activities").insert({
    tenant_id: TENANT_ID,
    entity_id: entity.id,
    type: "entity_created",
    title: "Entité créée",
    description: `${displayName} ajouté(e) au système`,
  });

  revalidatePath("/entities");
  revalidatePath("/dashboard");
  redirect(`/entities/${entity.id}`);
}

// =============================================================================
// CREATE COMPANY
// =============================================================================

export async function createCompany(formData: FormData) {
  const supabase = await createClient();

  const legalName = formData.get("legalName") as string;
  const regNumber = (formData.get("regNumber") as string) || null;
  const jurisdiction = (formData.get("jurisdiction") as string) || null;
  const companyType = (formData.get("companyType") as string) || null;
  const industry = (formData.get("industry") as string) || null;
  const address = (formData.get("address") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const website = (formData.get("website") as string) || null;
  const capital = (formData.get("capital") as string) || null;

  if (!legalName) {
    return { error: "Raison sociale requise" };
  }

  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .insert({
      tenant_id: TENANT_ID,
      type: "company",
      display_name: legalName,
      source: "manual",
    })
    .select("id")
    .single();

  if (entityError || !entity) {
    return { error: entityError?.message ?? "Erreur création entité" };
  }

  const { error: companyError } = await supabase.from("entity_companies").insert({
    entity_id: entity.id,
    tenant_id: TENANT_ID,
    legal_name: legalName,
    registration_number: regNumber,
    jurisdiction,
    company_type: companyType,
    industry,
    address,
    phone,
    email,
    website,
    capital,
  });

  if (companyError) {
    return { error: companyError.message };
  }

  await supabase.from("activities").insert({
    tenant_id: TENANT_ID,
    entity_id: entity.id,
    type: "entity_created",
    title: "Entité créée",
    description: `${legalName} ajoutée au système`,
  });

  revalidatePath("/entities");
  revalidatePath("/dashboard");
  redirect(`/entities/${entity.id}`);
}

// =============================================================================
// UPDATE PERSON
// =============================================================================

export async function updatePerson(entityId: string, formData: FormData) {
  const supabase = await createClient();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  // Update entity display name
  if (firstName && lastName) {
    await supabase
      .from("entities")
      .update({ display_name: `${firstName} ${lastName}` })
      .eq("id", entityId);
  }

  // Update person details
  const updates: Record<string, string | null> = {};
  for (const [key, field] of [
    ["first_name", "firstName"],
    ["last_name", "lastName"],
    ["nationality", "nationality"],
    ["country_of_residence", "residence"],
    ["address", "address"],
    ["phone", "phone"],
    ["email", "email"],
    ["profession", "profession"],
  ]) {
    const val = formData.get(field) as string | null;
    if (val !== null) updates[key] = val || null;
  }

  const { error } = await supabase
    .from("entity_people")
    .update(updates)
    .eq("entity_id", entityId);

  if (error) return { error: error.message };

  revalidatePath(`/entities/${entityId}`);
  revalidatePath("/entities");
  return { success: true };
}

// =============================================================================
// UPDATE COMPANY
// =============================================================================

export async function updateCompany(entityId: string, formData: FormData) {
  const supabase = await createClient();

  const legalName = formData.get("legalName") as string;
  if (legalName) {
    await supabase
      .from("entities")
      .update({ display_name: legalName })
      .eq("id", entityId);
  }

  const updates: Record<string, string | null> = {};
  for (const [key, field] of [
    ["legal_name", "legalName"],
    ["trading_name", "tradingName"],
    ["registration_number", "regNumber"],
    ["jurisdiction", "jurisdiction"],
    ["company_type", "companyType"],
    ["industry", "industry"],
    ["address", "address"],
    ["phone", "phone"],
    ["email", "email"],
    ["website", "website"],
    ["capital", "capital"],
  ]) {
    const val = formData.get(field) as string | null;
    if (val !== null) updates[key] = val || null;
  }

  const { error } = await supabase
    .from("entity_companies")
    .update(updates)
    .eq("entity_id", entityId);

  if (error) return { error: error.message };

  revalidatePath(`/entities/${entityId}`);
  revalidatePath("/entities");
  return { success: true };
}
