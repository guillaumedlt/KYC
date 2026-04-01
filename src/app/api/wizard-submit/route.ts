import { NextRequest, NextResponse } from "next/server";
import { createReadOnlyClient as createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const data = await request.json();

    // Handle file upload action (separate from entity creation)
    if (data.action === "upload-file" && data.entityId && data.file) {
      const file = data.file;
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${TENANT_ID}/${data.entityId}/${file.docType || "other"}/${new Date().toISOString().slice(0, 10)}_${sanitizedName}`;
      const buffer = Buffer.from(file.base64, "base64");

      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(storagePath, buffer, {
          contentType: file.type?.includes("pdf") ? "application/pdf" : "image/jpeg",
        });

      if (!uploadErr) {
        await supabase.from("documents").insert({
          tenant_id: TENANT_ID,
          entity_id: data.entityId,
          name: file.name,
          type: file.docType || "other",
          status: "extracted",
          storage_path: storagePath,
          file_size: buffer.length,
          mime_type: file.type?.includes("pdf") ? "application/pdf" : "image/jpeg",
          verified_by: "ai_agent",
          extraction_confidence: file.confidence || null,
        });
      }

      return NextResponse.json({ ok: true });
    }

    const isPerson = data.kind === "person";
    const displayName = isPerson
      ? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()
      : data.companyName ?? "Sans nom";

    // 0. Ensure user exists in users table
    const { data: existingUser } = await supabase.from("users").select("id").eq("id", user.id).single();
    let userId: string | null = existingUser?.id ?? null;
    if (!userId) {
      // Create user record from auth user
      const { data: newUser } = await supabase.from("users").insert({
        id: user.id,
        tenant_id: TENANT_ID,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur",
        role: "admin",
      }).select("id").single();
      userId = newUser?.id ?? null;
    }

    // 0.5 Check for duplicate entity (same name + same type)
    const { data: existingEntity } = await supabase
      .from("entities")
      .select("id")
      .eq("display_name", displayName)
      .eq("type", isPerson ? "person" : data.kind === "structure" ? "trust" : "company")
      .eq("tenant_id", TENANT_ID)
      .single();

    if (existingEntity) {
      return NextResponse.json({ error: `Une entité "${displayName}" existe déjà`, entityId: existingEntity.id, duplicate: true }, { status: 409 });
    }

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
        created_by: userId,
      })
      .select("id")
      .single();

    if (entityErr || !entity) {
      return NextResponse.json({ error: entityErr?.message ?? "Erreur création entité" }, { status: 500 });
    }
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
      });
    }

    // 3. Upload files to Supabase Storage
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        if (!file.base64) continue;
        const storagePath = `${TENANT_ID}/${entityId}/${Date.now()}_${file.name}`;
        const buffer = Buffer.from(file.base64, "base64");

        const { error: uploadErr } = await supabase.storage
          .from("documents")
          .upload(storagePath, buffer, {
            contentType: file.type?.includes("pdf") ? "application/pdf" : "image/jpeg",
          });

        if (!uploadErr) {
          await supabase.from("documents").insert({
            tenant_id: TENANT_ID,
            entity_id: entityId,
            name: file.name,
            type: file.docType || "other",
            status: "extracted",
            storage_path: storagePath,
            file_size: buffer.length,
            mime_type: file.type?.includes("pdf") ? "application/pdf" : "image/jpeg",
            verified_by: "ai_agent",
            extraction_confidence: file.confidence || null,
          });
        }
      }
    }

    // 4. Create KYC case
    const caseNumber = `KYC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const vigilance = (data.riskScore ?? 0) >= 60 ? "enhanced" : (data.riskScore ?? 0) >= 26 ? "standard" : "simplified";

    const { data: kycCase } = await supabase.from("kyc_cases").insert({
      tenant_id: TENANT_ID,
      entity_id: entityId,
      case_number: caseNumber,
      vigilance_level: vigilance,
      status: "screening",
      created_by: userId,
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    }).select("id").single();

    const caseId = kycCase?.id ?? null;

    // 5. Create UBO relations
    if (!isPerson && data.ubos && data.ubos.length > 0) {
      for (const ubo of data.ubos) {
        const { data: uboEntity } = await supabase
          .from("entities")
          .insert({
            tenant_id: TENANT_ID,
            type: ubo.role?.includes("société") ? "company" : "person",
            display_name: ubo.name,
            kyc_status: "not_started",
            source: "screening",
          })
          .select("id")
          .single();

        if (uboEntity) {
          const relationType = ubo.percentage > 0 ? "ubo" : "director";
          await supabase.from("entity_relations").insert({
            tenant_id: TENANT_ID,
            from_entity_id: uboEntity.id,
            to_entity_id: entityId,
            relation_type: relationType,
            ownership_percentage: ubo.percentage || null,
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
      created_by: userId,
      agent_id: "kyc-wizard",
    });

    revalidatePath("/entities");
    revalidatePath("/dashboard");
    revalidatePath("/cases");
    revalidatePath("/documents");

    return NextResponse.json({ entityId, caseId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Wizard Submit] FAILED:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
