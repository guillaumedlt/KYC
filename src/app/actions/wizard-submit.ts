"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

interface WizardSubmission {
  kind: "person" | "company" | "structure";
  // Person fields
  firstName?: string;
  lastName?: string;
  nationality?: string;
  residence?: string;
  dateOfBirth?: string;
  documentType?: string;
  documentNumber?: string;
  documentExpiry?: string;
  address?: string;
  fundsSource?: string;
  fundsAmount?: string;
  // Company fields
  companyName?: string;
  companyType?: string;
  jurisdiction?: string;
  regNumber?: string;
  industry?: string;
  capital?: string;
  incorporationDate?: string;
  // UBOs
  ubos?: { name: string; percentage: number }[];
  // AI data
  riskScore?: number;
  aiExtractions?: Record<string, string>;
  // Files (base64)
  files?: { name: string; type: string; base64: string }[];
}

export async function submitWizard(data: WizardSubmission) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const isPerson = data.kind === "person";
  const displayName = isPerson
    ? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()
    : data.companyName ?? "Sans nom";

  // 1. Create entity
  const { data: entity, error: entityErr } = await supabase
    .from("entities")
    .insert({
      tenant_id: TENANT_ID,
      type: isPerson ? "person" : data.kind === "structure" ? "trust" : "company",
      display_name: displayName,
      kyc_status: "in_progress",
      risk_score: data.riskScore ?? null,
      risk_level: data.riskScore != null
        ? data.riskScore >= 80 ? "critical" : data.riskScore >= 60 ? "high" : data.riskScore >= 40 ? "medium" : "low"
        : null,
      source: "manual",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (entityErr || !entity) return { error: entityErr?.message ?? "Erreur création entité" };
  const entityId = entity.id;

  // 2. Create person/company details
  if (isPerson) {
    await supabase.from("entity_people").insert({
      entity_id: entityId,
      tenant_id: TENANT_ID,
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: data.dateOfBirth,
      nationality: data.nationality,
      country_of_residence: data.residence,
      address: data.address,
    });
  } else {
    await supabase.from("entity_companies").insert({
      entity_id: entityId,
      tenant_id: TENANT_ID,
      legal_name: data.companyName,
      company_type: data.companyType,
      jurisdiction: data.jurisdiction,
      registration_number: data.regNumber,
      industry: data.industry,
      capital: data.capital,
      incorporation_date: data.incorporationDate || null,
    });
  }

  // 3. Upload files to Supabase Storage + create document records
  if (data.files && data.files.length > 0) {
    for (const file of data.files) {
      const storagePath = `${TENANT_ID}/${entityId}/${Date.now()}_${file.name}`;
      const buffer = Buffer.from(file.base64, "base64");

      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(storagePath, buffer, {
          contentType: file.type.includes("pdf") ? "application/pdf" : "image/jpeg",
        });

      if (!uploadErr) {
        await supabase.from("documents").insert({
          tenant_id: TENANT_ID,
          entity_id: entityId,
          name: file.name,
          type: guessDocType(file.name),
          status: "extracted",
          storage_path: storagePath,
          file_size: buffer.length,
          mime_type: file.type.includes("pdf") ? "application/pdf" : "image/jpeg",
          verified_by: "ai_agent",
          extraction_confidence: parseInt(data.aiExtractions?.identity_confidence ?? data.aiExtractions?.address_confidence ?? "0") || null,
        });
      }
    }
  }

  // 4. Create KYC case
  const caseNumber = `KYC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const vigilance = (data.riskScore ?? 0) >= 60 ? "enhanced" : (data.riskScore ?? 0) >= 26 ? "standard" : "simplified";

  await supabase.from("kyc_cases").insert({
    tenant_id: TENANT_ID,
    entity_id: entityId,
    case_number: caseNumber,
    vigilance_level: vigilance,
    status: "screening",
    created_by: user.id,
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  // 5. Create UBO relations (for companies)
  if (!isPerson && data.ubos && data.ubos.length > 0) {
    for (const ubo of data.ubos) {
      // Create a person entity for each UBO
      const { data: uboEntity } = await supabase
        .from("entities")
        .insert({
          tenant_id: TENANT_ID,
          type: "person",
          display_name: ubo.name,
          kyc_status: "not_started",
          source: "screening",
        })
        .select("id")
        .single();

      if (uboEntity) {
        await supabase.from("entity_relations").insert({
          tenant_id: TENANT_ID,
          from_entity_id: uboEntity.id,
          to_entity_id: entityId,
          relation_type: "ubo",
          ownership_percentage: ubo.percentage,
        });
      }
    }
  }

  // 6. Activity log
  await supabase.from("activities").insert({
    tenant_id: TENANT_ID,
    entity_id: entityId,
    type: "entity_created",
    title: "Entité créée via le parcours KYC",
    description: `${displayName} — parcours ${isPerson ? "personne physique" : "société"} complété`,
    created_by: user.id,
    agent_id: "kyc-wizard",
  });

  revalidatePath("/entities");
  revalidatePath("/dashboard");
  revalidatePath("/cases");
  revalidatePath("/documents");
  redirect(`/entities/${entityId}`);
}

function guessDocType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("passeport") || lower.includes("passport")) return "passport";
  if (lower.includes("cni") || lower.includes("identit")) return "national_id";
  if (lower.includes("domicile") || lower.includes("adresse") || lower.includes("address")) return "proof_of_address";
  if (lower.includes("rci") || lower.includes("registre") || lower.includes("kbis")) return "company_registration";
  if (lower.includes("statut")) return "articles_of_association";
  if (lower.includes("bilan") || lower.includes("financ")) return "financial_statement";
  if (lower.includes("paie") || lower.includes("salaire") || lower.includes("fonds")) return "source_of_funds";
  return "other";
}
