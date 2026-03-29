"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

export async function generateReport(caseId: string) {
  const supabase = await createClient();

  // Get case with entity
  const { data: kycCase } = await supabase
    .from("kyc_cases")
    .select("*, entities(display_name, type)")
    .eq("id", caseId)
    .single();

  if (!kycCase) return { error: "Dossier introuvable" };

  // Check if report already exists
  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("case_id", caseId)
    .eq("type", "other")
    .eq("name", `Rapport_KYC_${kycCase.case_number}.pdf`)
    .single();

  if (existing) {
    revalidatePath("/reports");
    redirect(`/reports/${caseId}`);
  }

  // Create report record
  await supabase.from("documents").insert({
    tenant_id: TENANT_ID,
    entity_id: kycCase.entity_id,
    case_id: caseId,
    name: `Rapport_KYC_${kycCase.case_number}.pdf`,
    type: "other",
    status: "verified",
    storage_path: `reports/${caseId}.pdf`,
    verified_by: "ai_agent",
  });

  // Activity
  await supabase.from("activities").insert({
    tenant_id: TENANT_ID,
    entity_id: kycCase.entity_id,
    case_id: caseId,
    type: "document_uploaded",
    title: "Rapport KYC généré",
    description: `Rapport pour ${(kycCase.entities as Record<string, unknown>).display_name}`,
    agent_id: "report-agent",
  });

  revalidatePath("/reports");
  revalidatePath("/documents");
  redirect(`/reports/${caseId}`);
}
