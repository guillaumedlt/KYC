"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface DocumentReUploadProps {
  entityId: string;
  entityType: "person" | "company";
  currentData: Record<string, string | null>;
}

type DocType = "identity" | "address" | "funds" | "company";

interface FieldDiff {
  key: string;
  label: string;
  dbColumn: string;
  current: string | null;
  extracted: string | null;
  useNew: boolean;
  changed: boolean;
}

type Phase = "idle" | "uploading" | "extracting" | "diff" | "applying" | "done";

// =============================================================================
// Field mapping — extraction keys -> DB column names + display labels
// =============================================================================

const PERSON_IDENTITY_FIELDS: { key: string; label: string; dbColumn: string }[] = [
  { key: "firstName", label: "Pr\u00e9nom(s)", dbColumn: "first_name" },
  { key: "lastName", label: "Nom", dbColumn: "last_name" },
  { key: "nationality", label: "Nationalit\u00e9", dbColumn: "nationality" },
  { key: "dateOfBirth", label: "Date de naissance", dbColumn: "date_of_birth" },
  { key: "placeOfBirth", label: "Lieu de naissance", dbColumn: "place_of_birth" },
  { key: "gender", label: "Genre", dbColumn: "gender" },
  { key: "documentNumber", label: "N\u00b0 document", dbColumn: "document_number" },
  { key: "documentExpiry", label: "Expiration", dbColumn: "document_expiry" },
  { key: "issuingCountry", label: "Pays d\u2019\u00e9mission", dbColumn: "issuing_country" },
];

const PERSON_ADDRESS_FIELDS: { key: string; label: string; dbColumn: string }[] = [
  { key: "address", label: "Adresse", dbColumn: "address" },
];

const PERSON_FUNDS_FIELDS: { key: string; label: string; dbColumn: string }[] = [
  { key: "sourceType", label: "Type de source", dbColumn: "funds_source_type" },
  { key: "amount", label: "Montant", dbColumn: "funds_amount" },
  { key: "employer", label: "Employeur", dbColumn: "employer" },
];

const COMPANY_FIELDS: { key: string; label: string; dbColumn: string }[] = [
  { key: "companyName", label: "Raison sociale", dbColumn: "legal_name" },
  { key: "registrationNumber", label: "N\u00b0 registre", dbColumn: "registration_number" },
  { key: "jurisdiction", label: "Juridiction", dbColumn: "jurisdiction" },
  { key: "companyType", label: "Forme juridique", dbColumn: "company_type" },
  { key: "capital", label: "Capital", dbColumn: "capital" },
  { key: "registeredAddress", label: "Adresse si\u00e8ge", dbColumn: "address" },
];

function getFieldsForDocType(
  docType: DocType,
  entityType: "person" | "company",
): { key: string; label: string; dbColumn: string }[] {
  if (entityType === "company") return COMPANY_FIELDS;
  switch (docType) {
    case "identity":
      return PERSON_IDENTITY_FIELDS;
    case "address":
      return PERSON_ADDRESS_FIELDS;
    case "funds":
      return PERSON_FUNDS_FIELDS;
    case "company":
      return COMPANY_FIELDS;
    default:
      return PERSON_IDENTITY_FIELDS;
  }
}

// =============================================================================
// Helpers
// =============================================================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("encode failed"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

const DOC_TYPE_OPTIONS: { value: DocType; label: string; personOnly?: boolean; companyOnly?: boolean }[] = [
  { value: "identity", label: "Identit\u00e9", personOnly: true },
  { value: "address", label: "Adresse", personOnly: true },
  { value: "funds", label: "Source de fonds", personOnly: true },
  { value: "company", label: "Document soci\u00e9t\u00e9", companyOnly: true },
];

// =============================================================================
// Component
// =============================================================================

export function DocumentReUpload({
  entityId,
  entityType,
  currentData,
}: DocumentReUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [docType, setDocType] = useState<DocType>(
    entityType === "company" ? "company" : "identity",
  );
  const [diffs, setDiffs] = useState<FieldDiff[]>([]);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Filter doc type options based on entity type
  const availableDocTypes = DOC_TYPE_OPTIONS.filter((o) => {
    if (entityType === "person" && o.companyOnly) return false;
    if (entityType === "company" && o.personOnly) return false;
    return true;
  });

  // ── Upload & extract ──────────────────────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 20 * 1024 * 1024) {
        setError("Fichier trop volumineux (max 20 Mo)");
        return;
      }

      setError(null);
      setPhase("uploading");

      try {
        const base64 = await fileToBase64(file);
        setPhase("extracting");

        const res = await fetch("/api/entity-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityId,
            action: "extract",
            docType,
            base64,
            mediaType: file.type,
            clientContext: currentData,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
          throw new Error(err.error ?? "Erreur lors de l\u2019extraction");
        }

        const { extracted, documentId: docId } = await res.json();
        setDocumentId(docId);

        // Build diff
        const fields = getFieldsForDocType(docType, entityType);
        const diffList: FieldDiff[] = fields.map((f) => {
          const currentVal = currentData[f.dbColumn] ?? null;
          const extractedVal =
            extracted[f.key] != null ? String(extracted[f.key]) : null;
          const changed =
            extractedVal != null &&
            extractedVal !== "" &&
            normalizeValue(extractedVal) !== normalizeValue(currentVal);

          return {
            key: f.key,
            label: f.label,
            dbColumn: f.dbColumn,
            current: currentVal,
            extracted: extractedVal,
            useNew: changed, // default to new value if changed
            changed,
          };
        });

        setDiffs(diffList);
        setPhase("diff");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setPhase("idle");
      }
    },
    [entityId, docType, entityType, currentData],
  );

  // ── Apply selected changes ────────────────────────────────────────
  async function handleApply() {
    setPhase("applying");
    setError(null);

    const selectedDiffs = diffs.filter((d) => d.useNew && d.changed);
    if (selectedDiffs.length === 0) {
      setError("Aucun champ s\u00e9lectionn\u00e9");
      setPhase("diff");
      return;
    }

    const table =
      entityType === "company" ? "entity_companies" : "entity_people";
    const updates: Record<string, Record<string, string | null>> = {
      [table]: {},
    };
    for (const d of selectedDiffs) {
      updates[table][d.dbColumn] = d.extracted;
    }

    try {
      const res = await fetch("/api/entity-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId,
          action: "apply",
          updates,
          documentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        throw new Error(err.error ?? "Erreur lors de la mise \u00e0 jour");
      }

      setPhase("done");
      // Refresh the page data after a short delay so user can see success
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase("diff");
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────
  function handleReset() {
    setPhase("idle");
    setDiffs([]);
    setDocumentId(null);
    setError(null);
  }

  // ── Counts ────────────────────────────────────────────────────────
  const changedCount = diffs.filter((d) => d.changed).length;
  const selectedCount = diffs.filter((d) => d.useNew && d.changed).length;

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="mb-4 rounded-md border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Re-upload de document
        </span>
        {phase !== "idle" && phase !== "done" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Recommencer
          </button>
        )}
      </div>

      <div className="p-4">
        {/* ── Phase: idle — doc type selector + dropzone ─────────────── */}
        {phase === "idle" && (
          <div className="space-y-3">
            {/* Doc type pills */}
            <div className="flex flex-wrap gap-1.5">
              {availableDocTypes.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDocType(opt.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    docType === opt.value
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Dropzone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed px-4 py-3 transition-all",
                dragOver
                  ? "border-foreground bg-foreground/5 scale-[1.01]"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-muted/10",
              )}
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[12px] font-medium text-foreground">
                  Glissez ou cliquez pour uploader un nouveau document
                </p>
                <p className="text-[10px] text-muted-foreground">
                  PDF, JPG, PNG — max 20 Mo
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* ── Phase: uploading / extracting ──────────────────────────── */}
        {(phase === "uploading" || phase === "extracting") && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            <div>
              <p className="text-[12px] font-medium text-foreground">
                {phase === "uploading"
                  ? "Upload en cours..."
                  : "Extraction IA en cours..."}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {phase === "extracting"
                  ? "Analyse du document par Claude"
                  : "Envoi du fichier"}
              </p>
            </div>
          </div>
        )}

        {/* ── Phase: diff — show extracted fields ────────────────────── */}
        {phase === "diff" && (
          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Champs extraits du nouveau document
            </p>

            <div className="rounded-md border border-border divide-y divide-border/50">
              {diffs.map((d) => (
                <DiffRow
                  key={d.key}
                  diff={d}
                  onToggle={() => {
                    if (!d.changed) return;
                    setDiffs((prev) =>
                      prev.map((item) =>
                        item.key === d.key
                          ? { ...item, useNew: !item.useNew }
                          : item,
                      ),
                    );
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {changedCount === 0
                  ? "Aucune diff\u00e9rence d\u00e9tect\u00e9e"
                  : `${selectedCount} champ(s) modifi\u00e9(s) s\u00e9lectionn\u00e9(s)`}
              </span>
              <button
                onClick={handleApply}
                disabled={selectedCount === 0}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors",
                  selectedCount > 0
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "cursor-not-allowed bg-muted text-muted-foreground",
                )}
              >
                Appliquer les modifications
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: applying ────────────────────────────────────────── */}
        {phase === "applying" && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            <p className="text-[12px] font-medium text-foreground">
              Mise \u00e0 jour en cours...
            </p>
          </div>
        )}

        {/* ── Phase: done ────────────────────────────────────────────── */}
        {phase === "done" && (
          <div className="flex items-center gap-3 py-4">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-[12px] font-medium text-emerald-700">
                Fiche mise \u00e0 jour avec succ\u00e8s
              </p>
              <p className="text-[10px] text-muted-foreground">
                La page va se rafra\u00eechir automatiquement
              </p>
            </div>
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="mt-2 rounded bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Diff Row
// =============================================================================

function DiffRow({
  diff,
  onToggle,
}: {
  diff: FieldDiff;
  onToggle: () => void;
}) {
  const { label, current, extracted, useNew, changed } = diff;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 transition-colors",
        changed ? "bg-card" : "bg-muted/20",
      )}
    >
      {/* Label */}
      <span
        className={cn(
          "w-28 shrink-0 text-[11px]",
          changed ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>

      {/* Current value */}
      <span
        className={cn(
          "min-w-[80px] flex-1 truncate text-[11px]",
          changed ? "text-muted-foreground line-through" : "text-muted-foreground",
        )}
      >
        {current ?? "\u2014"}
      </span>

      {/* Arrow */}
      {changed && (
        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
      )}

      {/* New value */}
      <span
        className={cn(
          "min-w-[80px] flex-1 truncate text-[11px]",
          changed ? "font-medium text-emerald-700" : "text-muted-foreground",
        )}
      >
        {extracted ?? "\u2014"}
      </span>

      {/* Toggle */}
      <button
        onClick={onToggle}
        disabled={!changed}
        className={cn(
          "shrink-0 rounded px-2 py-0.5 text-[9px] font-medium transition-colors",
          !changed
            ? "cursor-default bg-muted/30 text-muted-foreground/50"
            : useNew
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        {!changed ? "= Identique" : useNew ? "\u2713 Nouveau" : "Ancien"}
      </button>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function normalizeValue(val: string | null | undefined): string {
  if (val == null) return "";
  return val.trim().toLowerCase().replace(/\s+/g, " ");
}
