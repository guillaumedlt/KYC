import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  extractIdentity,
  extractAddress,
  extractFundsSource,
  extractCompanyDocument,
} from "@/lib/ai/claude";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

export const maxDuration = 60;

// -----------------------------------------------------------------------------
// POST /api/entity-update
//
// Two actions:
//   1. "extract"  — upload doc + run AI extraction, return diff data
//   2. "apply"    — apply selected field updates to entity
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    // =========================================================================
    // ACTION: extract — upload file, run AI, return extracted fields
    // =========================================================================
    if (action === "extract") {
      const { entityId, docType, base64, mediaType, clientContext } = body as {
        entityId: string;
        docType: "identity" | "address" | "funds" | "company";
        base64: string;
        mediaType: string;
        clientContext?: Record<string, string>;
      };

      if (!entityId || !docType || !base64) {
        return NextResponse.json(
          { error: "Missing entityId, docType or base64" },
          { status: 400 },
        );
      }

      // 0. Build FULL context from DB — everything we know about this entity
      const { data: entity } = await supabase.from("entities").select("*").eq("id", entityId).single();
      const isPerson = entity?.type === "person";

      let fullContext: Record<string, string> = {};
      if (isPerson) {
        const { data: person } = await supabase.from("entity_people").select("*").eq("entity_id", entityId).single();
        if (person) {
          fullContext = {
            firstName: (person.first_name as string) ?? "",
            lastName: (person.last_name as string) ?? "",
            nationality: (person.nationality as string) ?? "",
            dateOfBirth: (person.date_of_birth as string) ?? "",
            address: (person.address as string) ?? "",
            documentNumber: "",
          };
        }
      } else {
        const { data: company } = await supabase.from("entity_companies").select("*").eq("entity_id", entityId).single();
        if (company) {
          fullContext = {
            companyName: (company.legal_name as string) ?? "",
            jurisdiction: (company.jurisdiction as string) ?? "",
            registrationNumber: (company.registration_number as string) ?? "",
            companyType: (company.company_type as string) ?? "",
          };
        }
      }

      // Merge with any clientContext passed from frontend
      const mergedContext = { ...fullContext, ...clientContext };

      console.log(`[entity-update] Extracting ${docType} for ${entity?.display_name ?? entityId}, context keys: ${Object.keys(mergedContext).join(", ")}`);

      // 1. Run AI extraction with full context
      let extracted: Record<string, unknown>;

      switch (docType) {
        case "identity":
          extracted = await extractIdentity(base64, mediaType);
          break;
        case "address":
          extracted = await extractAddress(base64, mediaType, mergedContext);
          break;
        case "funds":
          extracted = await extractFundsSource(base64, mediaType, mergedContext);
          break;
        case "company":
          extracted = await extractCompanyDocument(base64, "registration", mergedContext);
          break;
        default:
          return NextResponse.json(
            { error: "Unknown docType" },
            { status: 400 },
          );
      }

      // 2. Upload file to Supabase Storage
      const sanitizedDate = new Date().toISOString().slice(0, 10);
      const storagePath = `${TENANT_ID}/${entityId}/${docType}/${sanitizedDate}_reupload_${Date.now()}`;
      const buffer = Buffer.from(base64, "base64");
      const contentType = mediaType?.includes("pdf")
        ? "application/pdf"
        : (mediaType ?? "image/jpeg");

      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(storagePath, buffer, { contentType });

      if (uploadErr) {
        console.error("[entity-update] Storage upload failed:", uploadErr.message);
      }

      // 3. Create document record
      const docTypeMap: Record<string, string> = {
        identity: "passport",
        address: "proof_of_address",
        funds: "source_of_funds",
        company: "company_registration",
      };

      const { data: docRecord, error: docErr } = await supabase
        .from("documents")
        .insert({
          tenant_id: TENANT_ID,
          entity_id: entityId,
          name: `Re-upload ${docType} — ${sanitizedDate}`,
          type: docTypeMap[docType] ?? "other",
          status: "extracted",
          storage_path: storagePath,
          file_size: buffer.length,
          mime_type: contentType,
          verified_by: "ai_agent",
          extraction_confidence:
            (extracted as { confidence?: number }).confidence ?? null,
        })
        .select("id")
        .single();

      if (docErr) {
        console.error("[entity-update] Document insert failed:", docErr.message);
      }

      return NextResponse.json({
        extracted,
        documentId: docRecord?.id ?? null,
      });
    }

    // =========================================================================
    // ACTION: apply — update entity fields with selected values
    // =========================================================================
    if (action === "apply") {
      const { entityId, updates, documentId } = body as {
        entityId: string;
        updates: {
          entity_people?: Record<string, string | null>;
          entity_companies?: Record<string, string | null>;
        };
        documentId?: string;
      };

      if (!entityId || !updates) {
        return NextResponse.json(
          { error: "Missing entityId or updates" },
          { status: 400 },
        );
      }

      // Update entity_people if provided
      if (updates.entity_people && Object.keys(updates.entity_people).length > 0) {
        const { error: personErr } = await supabase
          .from("entity_people")
          .update(updates.entity_people)
          .eq("entity_id", entityId)
          .eq("tenant_id", TENANT_ID);

        if (personErr) {
          console.error("[entity-update] Person update failed:", personErr.message);
          return NextResponse.json(
            { error: personErr.message },
            { status: 500 },
          );
        }

        // Update display_name if name changed
        const nameFields = ["first_name", "last_name"];
        const hasNameChange = nameFields.some(
          (f) => f in updates.entity_people!,
        );
        if (hasNameChange) {
          // Fetch current person to build new display name
          const { data: currentPerson } = await supabase
            .from("entity_people")
            .select("first_name, last_name")
            .eq("entity_id", entityId)
            .eq("tenant_id", TENANT_ID)
            .single();

          if (currentPerson) {
            const displayName =
              `${currentPerson.first_name ?? ""} ${currentPerson.last_name ?? ""}`.trim();
            await supabase
              .from("entities")
              .update({ display_name: displayName })
              .eq("id", entityId)
              .eq("tenant_id", TENANT_ID);
          }
        }
      }

      // Update entity_companies if provided
      if (
        updates.entity_companies &&
        Object.keys(updates.entity_companies).length > 0
      ) {
        const { error: companyErr } = await supabase
          .from("entity_companies")
          .update(updates.entity_companies)
          .eq("entity_id", entityId)
          .eq("tenant_id", TENANT_ID);

        if (companyErr) {
          console.error("[entity-update] Company update failed:", companyErr.message);
          return NextResponse.json(
            { error: companyErr.message },
            { status: 500 },
          );
        }

        // Update display_name if legal_name changed
        if ("legal_name" in updates.entity_companies) {
          await supabase
            .from("entities")
            .update({
              display_name: updates.entity_companies.legal_name ?? "Sans nom",
            })
            .eq("id", entityId)
            .eq("tenant_id", TENANT_ID);
        }
      }

      // Mark document as verified if provided
      if (documentId) {
        await supabase
          .from("documents")
          .update({ status: "verified" })
          .eq("id", documentId)
          .eq("tenant_id", TENANT_ID);
      }

      // Activity log
      await supabase.from("activities").insert({
        tenant_id: TENANT_ID,
        entity_id: entityId,
        type: "entity_updated",
        title: "Fiche mise \u00e0 jour \u2014 document re-upload\u00e9",
        description: `Champs modifi\u00e9s : ${Object.keys(updates.entity_people ?? updates.entity_companies ?? {}).join(", ")}`,
        created_by: user.id,
        agent_id: "entity-update",
      });

      revalidatePath(`/entities/${entityId}`);
      revalidatePath("/entities");

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[entity-update] FAILED:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
