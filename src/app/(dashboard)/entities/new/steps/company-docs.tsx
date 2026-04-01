"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, FileText, Sparkles, AlertTriangle, Pencil, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

// ─── Document blocks ────────────────────────────────────────────────
interface DocBlock {
  key: keyof WizardData;
  title: string;
  desc: string;
  docType: string;
  required: boolean;
}

const BLOCKS: DocBlock[] = [
  { key: "constitutionFile", title: "Constitution / Immatriculation", desc: "Statuts, Kbis, extrait RCI, certificat d'incorporation", docType: "registration", required: true },
  { key: "governanceFile", title: "Gouvernance", desc: "Liste dirigeants, PV nomination, pouvoirs de signature", docType: "governance", required: false },
  { key: "shareholdingFile", title: "Actionnariat", desc: "Registre actionnaires, organigramme, pacte", docType: "shareholding", required: false },
  { key: "financialFile", title: "Financier", desc: "Bilan, relevé bancaire, business plan", docType: "financial", required: false },
];

const COMPANY_TYPE_LABELS: Record<string, string> = {
  sam: "SAM", sarl: "SARL", sci: "SCI", sa: "SA", sas: "SAS",
  ltd: "Ltd", llc: "LLC", gmbh: "GmbH", other: "Autre",
};

const COUNTRY_LABELS: Record<string, string> = {
  MC: "Monaco", FR: "France", GB: "Royaume-Uni", US: "États-Unis",
  CH: "Suisse", LU: "Luxembourg", IE: "Irlande", DE: "Allemagne",
  BVI: "Îles Vierges Brit.", JE: "Jersey", GG: "Guernesey", CY: "Chypre", AE: "EAU",
};

// ─── File utils ─────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) { reject(new Error("Failed to encode")); return; }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Component ──────────────────────────────────────────────────────
export function CompanyDocsStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [blockResults, setBlockResults] = useState<Record<string, { success: boolean; details: string }>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const hasExtracted = !!data.companyName;

  // ─── Upload & extract ───────────────────────────────────────────
  async function handleUpload(key: keyof WizardData, file: File, docType: string) {
    if (file.size > 20 * 1024 * 1024) return;

    update({ [key]: file } as Partial<WizardData>);
    setAnalyzing(key as string);

    try {
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "company", base64, mediaType: file.type, docType }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (result && result.confidence > 0) {
        const updates: Partial<WizardData> = {};

        // Auto-fill company info from extraction (only if empty)
        if (result.companyName) updates.companyName = result.companyName;
        if (result.registrationNumber) updates.regNumber = result.registrationNumber;
        if (result.jurisdiction) updates.jurisdiction = result.jurisdiction;
        if (result.incorporationDate) updates.incorporationDate = result.incorporationDate;
        if (result.companyType) updates.companyType = result.companyType;
        if (result.capital) updates.capital = result.capital;

        // Directors → add to UBOs list
        if (result.directors?.length > 0) {
          const existingNames = (data.ubos || []).map((u) => u.name.toLowerCase());
          const directors = result.directors
            .filter((d: string) => !existingNames.includes(d.toLowerCase()))
            .map((d: string) => ({ name: d, percentage: 0, completed: false }));
          if (directors.length > 0) {
            updates.ubos = [...(data.ubos || []), ...directors];
          }
        }

        // Shareholders → add to UBOs list (≥25% = UBO)
        if (result.shareholders?.length > 0) {
          const existingNames = (updates.ubos || data.ubos || []).map((u) => u.name.toLowerCase());
          const shareholders = result.shareholders
            .filter((s: { name: string; percentage: number }) => !existingNames.includes(s.name.toLowerCase()))
            .map((s: { name: string; percentage: number }) => ({
              name: s.name,
              percentage: s.percentage,
              completed: false,
            }));
          if (shareholders.length > 0) {
            updates.ubos = [...(updates.ubos || data.ubos || []), ...shareholders];
          }
        }

        // Store extraction metadata
        updates.aiExtractions = {
          ...data.aiExtractions,
          [`company_${docType}_confidence`]: String(result.confidence),
        };

        update(updates);

        const details = [
          result.companyName && `${result.companyName}`,
          result.registrationNumber && `N° ${result.registrationNumber}`,
          result.capital && result.capital,
          result.directors?.length && `${result.directors.length} dirigeant(s)`,
          result.shareholders?.length && `${result.shareholders.length} actionnaire(s)`,
        ].filter(Boolean).join(" · ");

        setBlockResults((r) => ({ ...r, [key as string]: { success: true, details } }));
      } else {
        setBlockResults((r) => ({ ...r, [key as string]: { success: false, details: "Extraction limitée — complétez manuellement" } }));
      }
    } catch {
      setBlockResults((r) => ({ ...r, [key as string]: { success: false, details: "Erreur d'analyse — document accepté" } }));
    } finally {
      setAnalyzing(null);
    }
  }

  const uploadedCount = BLOCKS.filter((b) => data[b.key]).length;
  const canProceed = uploadedCount >= 1 && !!data.companyName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Documents de la société</h2>
        <p className="text-[12px] text-muted-foreground">
          Glissez-déposez les documents. L&apos;IA extrait et remplit automatiquement toutes les informations.
        </p>
      </div>

      {/* ─── Upload blocks ───────────────────────────────────────── */}
      <div className="space-y-2">
        {BLOCKS.map((block) => {
          const file = data[block.key] as File | null;
          const isAnalyzing = analyzing === block.key;
          const result = blockResults[block.key as string];
          const isDragOver = dragOver === block.key;

          return (
            <div
              key={block.key as string}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(block.key, f, block.docType); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(block.key as string); }}
              onDragLeave={() => setDragOver(null)}
              onClick={() => !isAnalyzing && fileRefs.current[block.key as string]?.click()}
              className={cn(
                "cursor-pointer rounded-md border transition-all",
                isDragOver ? "border-foreground bg-foreground/5 scale-[1.005]" :
                isAnalyzing ? "cursor-wait border-foreground/30 bg-muted/20" :
                file && result?.success ? "border-emerald-200 bg-emerald-50/30" :
                file ? "border-amber-200 bg-amber-50/20" :
                "border-border bg-card hover:border-foreground/20",
              )}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    isAnalyzing ? "bg-muted text-foreground" :
                    file && result?.success ? "bg-emerald-100 text-emerald-600" :
                    file ? "bg-amber-100 text-amber-600" :
                    "bg-muted text-muted-foreground",
                  )}>
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> :
                     file ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-foreground">
                      {block.title}
                      {block.required && <span className="ml-1 text-[9px] text-muted-foreground">(requis)</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{block.desc}</p>
                  </div>
                </div>
                <span className={cn(
                  "shrink-0 rounded-md border px-2 py-1 text-[10px]",
                  isAnalyzing ? "border-foreground/20 text-foreground" :
                  file ? "border-emerald-200 text-emerald-600" : "border-border text-muted-foreground",
                )}>
                  {isAnalyzing ? "Analyse IA..." : file ? file.name.slice(0, 20) : "Glissez ou cliquez"}
                </span>
                <input
                  ref={(el) => { fileRefs.current[block.key as string] = el; }}
                  type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(block.key, f, block.docType); }}
                  className="hidden"
                />
              </div>

              {/* Extraction result */}
              {result && !isAnalyzing && (
                <div className={cn(
                  "flex items-center gap-1.5 border-t px-4 py-1.5 text-[10px]",
                  result.success ? "border-emerald-200/50 text-emerald-600" : "border-amber-200/50 text-amber-600",
                )}>
                  {result.success ? <Sparkles className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {result.details}
                </div>
              )}

              {/* UBOs detected from shareholding */}
              {block.key === "shareholdingFile" && data.ubos.filter((u) => u.percentage > 0).length > 0 && !isAnalyzing && (
                <div className="border-t border-emerald-200/50 px-4 py-2">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground">UBO détectés</p>
                  {data.ubos.filter((u) => u.percentage > 0).map((ubo, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 text-[11px]">
                      <span className="text-foreground">{ubo.name}</span>
                      <span className={cn("font-data", ubo.percentage >= 25 ? "text-foreground font-medium" : "text-muted-foreground")}>{ubo.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Auto-filled company info (read/edit) ────────────────── */}
      {hasExtracted && (
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Informations extraites</span>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors",
                editMode ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              <Pencil className="h-3 w-3" />
              {editMode ? "Valider" : "Corriger"}
            </button>
          </div>

          <div className="divide-y divide-border/50">
            <FieldRow label="Raison sociale" value={data.companyName} editing={editMode} onEdit={(v) => update({ companyName: v })} />
            <FieldRow label="Forme juridique" value={COMPANY_TYPE_LABELS[data.companyType] || data.companyType} editing={editMode} onEdit={(v) => update({ companyType: v })} editValue={data.companyType} />
            <FieldRow label="Juridiction" value={COUNTRY_LABELS[data.jurisdiction] || data.jurisdiction} editing={editMode} onEdit={(v) => update({ jurisdiction: v })} editValue={data.jurisdiction} />
            <FieldRow label="N° registre" value={data.regNumber} mono editing={editMode} onEdit={(v) => update({ regNumber: v })} />
            <FieldRow label="Capital" value={data.capital} mono editing={editMode} onEdit={(v) => update({ capital: v })} />
            <FieldRow label="Date d'immatriculation" value={data.incorporationDate} mono editing={editMode} onEdit={(v) => update({ incorporationDate: v })} />
            <FieldRow label="Secteur d'activité" value={data.industry} editing={editMode} onEdit={(v) => update({ industry: v })} />
          </div>

          {data.ubos.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Personnes identifiées ({data.ubos.length})
              </p>
              {data.ubos.map((ubo, i) => (
                <div key={i} className="flex items-center justify-between py-0.5 text-[11px]">
                  <span className="text-foreground">{ubo.name}</span>
                  <span className="font-data text-muted-foreground">
                    {ubo.percentage > 0 ? `${ubo.percentage}%` : "Dirigeant"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Navigation ──────────────────────────────────────────── */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={!canProceed} className="h-8 text-[11px]">
          {data.ubos.length > 0 ? `Continuer — ${data.ubos.length} personne(s) à vérifier` : "Continuer"}
        </Button>
      </div>
    </div>
  );
}

// ─── Field row (same pattern as person-identity) ────────────────────
function FieldRow({ label, value, mono, editing, onEdit, editValue }: {
  label: string; value: string; mono?: boolean; editing: boolean;
  onEdit?: (v: string) => void; editValue?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className="w-44 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      {editing && onEdit ? (
        <input value={editValue ?? value} onChange={(e) => onEdit(e.target.value)}
          className={cn("flex-1 rounded-md border border-border bg-background px-2 py-1 text-right text-[12px] focus:border-foreground/30 focus:outline-none", mono && "font-data")} />
      ) : (
        <span className={cn("text-right text-[12px] text-foreground", mono && "font-data")}>{value || "—"}</span>
      )}
    </div>
  );
}
