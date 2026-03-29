"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

export async function submitDecision(caseId: string, formData: FormData) {
  const supabase = await createClient();

  const decision = formData.get("decision") as string;
  const justification = formData.get("justification") as string;

  if (!decision || !justification || justification.length < 10) {
    return { error: "Décision et justification (min. 10 caractères) requises" };
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Update case
  const { error } = await supabase
    .from("kyc_cases")
    .update({
      status: decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "escalated",
      decision_status: decision,
      decided_by: user?.id,
      decided_at: new Date().toISOString(),
      decision_justification: justification,
    })
    .eq("id", caseId);

  if (error) return { error: error.message };

  // Update entity kyc_status
  const { data: kycCase } = await supabase
    .from("kyc_cases")
    .select("entity_id")
    .eq("id", caseId)
    .single();

  if (kycCase) {
    await supabase
      .from("entities")
      .update({
        kyc_status: decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "pending_review",
      })
      .eq("id", kycCase.entity_id);
  }

  // Activity log
  await supabase.from("activities").insert({
    tenant_id: TENANT_ID,
    entity_id: kycCase?.entity_id,
    case_id: caseId,
    type: "decision_made",
    title: decision === "approved" ? "Dossier approuvé" : decision === "rejected" ? "Dossier rejeté" : "Dossier escaladé",
    description: justification,
    created_by: user?.id,
  });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCaseStatus(caseId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("kyc_cases")
    .update({ status })
    .eq("id", caseId);

  if (error) return { error: error.message };

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  return { success: true };
}
