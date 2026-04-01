"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, FileText, Sparkles, AlertTriangle, Pencil, Building2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────
interface DocBlock {
  key: "constitutionFiles" | "governanceFiles" | "shareholdingFiles" | "financialFiles";
  title: string;
  desc: string;
  docType: string;
  required: boolean;
}

const BLOCKS: DocBlock[] = [
  { key: "constitutionFiles", title: "Constitution / Immatriculation", desc: "Statuts, Kbis, extrait RCI, certificat d'incorporation", docType: "registration", required: true },
  { key: "governanceFiles", title: "Gouvernance", desc: "Liste dirigeants, PV nomination, pouvoirs de signature", docType: "governance", required: false },
  { key: "shareholdingFiles", title: "Actionnariat", desc: "Registre actionnaires, organigramme, pacte", docType: "shareholding", required: false },
  { key: "financialFiles", title: "Financier", desc: "Bilan, relevé bancaire, business plan", docType: "financial", required: false },
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) { reject(new Error("Failed to encode")); return; }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read"));
    reader.readAsDataURL(file);
  });
}

// ─── Component ──────────────────────────────────────────────────────
export function CompanyDocsStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [fileResults, setFileResults] = useState<Record<string, { success: boolean; details: string }>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const hasExtracted = !!data.companyName;

  // ─── Process a single file ─────────────────────────────────────
  async function processFile(blockKey: DocBlock["key"], file: File, docType: string) {
    if (file.size > 20 * 1024 * 1024) return;

    const fileId = `${blockKey}-${file.name}`;
    setAnalyzingFile(fileId);

    // Add file to the array
    const currentFiles = (data[blockKey] as File[]) || [];
    update({ [blockKey]: [...currentFiles, file] });

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

        // Auto-fill (merge — don't overwrite existing)
        if (result.companyName && !data.companyName) updates.companyName = result.companyName;
        if (result.registrationNumber && !data.regNumber) updates.regNumber = result.registrationNumber;
        if (result.jurisdiction && !data.jurisdiction) updates.jurisdiction = result.jurisdiction;
        if (result.incorporationDate && !data.incorporationDate) updates.incorporationDate = result.incorporationDate;
        if (result.companyType && !data.companyType) updates.companyType = result.companyType;
        if (result.capital && !data.capital) updates.capital = result.capital;

        // Merge directors
        if (result.directors?.length > 0) {
          const existing = (data.ubos || []).map((u) => u.name.toLowerCase());
          const newOnes = result.directors
            .filter((d: string) => !existing.includes(d.toLowerCase()))
            .map((d: string) => ({ name: d, percentage: 0, completed: false }));
          if (newOnes.length > 0) updates.ubos = [...(data.ubos || []), ...newOnes];
        }

        // Merge shareholders
        if (result.shareholders?.length > 0) {
          const existing = (updates.ubos || data.ubos || []).map((u) => u.name.toLowerCase());
          const newOnes = result.shareholders
            .filter((s: { name: string }) => !existing.includes(s.name.toLowerCase()))
            .map((s: { name: string; percentage: number }) => ({ name: s.name, percentage: s.percentage, completed: false }));
          if (newOnes.length > 0) updates.ubos = [...(updates.ubos || data.ubos || []), ...newOnes];
        }

        updates.aiExtractions = { ...data.aiExtractions, [`${docType}_${file.name}_confidence`]: String(result.confidence) };
        update(updates);

        const details = [
          result.companyName,
          result.registrationNumber && `N° ${result.registrationNumber}`,
          result.capital,
          result.directors?.length && `${result.directors.length} dirigeant(s)`,
          result.shareholders?.length && `${result.shareholders.length} actionnaire(s)`,
        ].filter(Boolean).join(" · ");

        setFileResults((r) => ({ ...r, [fileId]: { success: true, details } }));
      } else {
        setFileResults((r) => ({ ...r, [fileId]: { success: false, details: "Extraction limitée" } }));
      }
    } catch {
      setFileResults((r) => ({ ...r, [fileId]: { success: false, details: "Erreur — document conservé" } }));
    } finally {
      setAnalyzingFile(null);
    }
  }

  // ─── Handle multiple files (drag or input) ─────────────────────
  function handleFiles(blockKey: DocBlock["key"], files: FileList, docType: string) {
    Array.from(files).forEach((file) => processFile(blockKey, file, docType));
  }

  // ─── Remove a file ────────────────────────────────────────────
  function removeFile(blockKey: DocBlock["key"], index: number) {
    const currentFiles = (data[blockKey] as File[]) || [];
    update({ [blockKey]: currentFiles.filter((_, i) => i !== index) });
  }

  const totalFiles = BLOCKS.reduce((acc, b) => acc + ((data[b.key] as File[]) || []).length, 0);
  const canProceed = totalFiles >= 1 && !!data.companyName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Documents de la société</h2>
        <p className="text-[12px] text-muted-foreground">
          Glissez-déposez les documents par catégorie. Plusieurs fichiers par bloc autorisés.
        </p>
        <p className="mt-1 font-data text-[11px] text-muted-foreground">{totalFiles} document(s) uploadé(s)</p>
      </div>

      {/* ─── Upload blocks ───────────────────────────────────────── */}
      <div className="space-y-3">
        {BLOCKS.map((block) => {
          const files = (data[block.key] as File[]) || [];
          const isDragOver = dragOver === block.key;

          return (
            <div key={block.key} className={cn(
              "rounded-md border transition-all",
              isDragOver ? "border-foreground bg-foreground/5 scale-[1.005]" :
              files.length > 0 ? "border-emerald-200 bg-emerald-50/20" : "border-border bg-card",
            )}>
              {/* Header + drop zone */}
              <div
                onDrop={(e) => { e.preventDefault(); setDragOver(null); if (e.dataTransfer.files.length) handleFiles(block.key, e.dataTransfer.files, block.docType); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(block.key); }}
                onDragLeave={() => setDragOver(null)}
                onClick={() => fileRefs.current[block.key]?.click()}
                className="flex cursor-pointer items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    files.length > 0 ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground",
                  )}>
                    {files.length > 0 ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-foreground">
                      {block.title}
                      {block.required && <span className="ml-1 text-[9px] text-muted-foreground">(requis)</span>}
                      {files.length > 0 && <span className="ml-1.5 rounded bg-emerald-100 px-1 py-0.5 font-data text-[9px] text-emerald-700">{files.length}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{block.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground hover:border-foreground/20 hover:text-foreground">
                  <Plus className="h-3 w-3" /> Ajouter
                </div>
                <input
                  ref={(el) => { fileRefs.current[block.key] = el; }}
                  type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { if (e.target.files?.length) handleFiles(block.key, e.target.files, block.docType); e.target.value = ""; }}
                  className="hidden"
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="border-t border-emerald-200/30 px-4 py-1.5">
                  {files.map((file, i) => {
                    const fileId = `${block.key}-${file.name}`;
                    const isAnalyzing = analyzingFile === fileId;
                    const result = fileResults[fileId];

                    return (
                      <div key={i} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {isAnalyzing ? (
                            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-foreground" />
                          ) : result?.success ? (
                            <Sparkles className="h-3 w-3 shrink-0 text-emerald-500" />
                          ) : result ? (
                            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                          ) : (
                            <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate text-[11px] text-foreground">{file.name}</span>
                          <span className="shrink-0 font-data text-[9px] text-muted-foreground">{(file.size / 1024).toFixed(0)} Ko</span>
                          {isAnalyzing && <span className="shrink-0 text-[9px] text-muted-foreground">Analyse...</span>}
                          {result?.success && <span className="shrink-0 truncate text-[9px] text-emerald-600">{result.details}</span>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(block.key, i); }}
                          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* UBOs detected */}
              {block.key === "shareholdingFiles" && data.ubos.filter((u) => u.percentage > 0).length > 0 && (
                <div className="border-t border-emerald-200/30 px-4 py-2">
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

      {/* ─── Auto-filled company info ────────────────────────────── */}
      {hasExtracted && (
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Informations extraites</span>
            </div>
            <button onClick={() => setEditMode(!editMode)}
              className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors",
                editMode ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Pencil className="h-3 w-3" /> {editMode ? "Valider" : "Corriger"}
            </button>
          </div>
          <div className="divide-y divide-border/50">
            <FieldRow label="Raison sociale" value={data.companyName} editing={editMode} onEdit={(v) => update({ companyName: v })} />
            <FieldRow label="Forme juridique" value={COMPANY_TYPE_LABELS[data.companyType] || data.companyType} editing={editMode} onEdit={(v) => update({ companyType: v })} editValue={data.companyType} />
            <FieldRow label="Juridiction" value={COUNTRY_LABELS[data.jurisdiction] || data.jurisdiction} editing={editMode} onEdit={(v) => update({ jurisdiction: v })} editValue={data.jurisdiction} />
            <FieldRow label="N° registre" value={data.regNumber} mono editing={editMode} onEdit={(v) => update({ regNumber: v })} />
            <FieldRow label="Capital" value={data.capital} mono editing={editMode} onEdit={(v) => update({ capital: v })} />
            <FieldRow label="Date immatriculation" value={data.incorporationDate} mono editing={editMode} onEdit={(v) => update({ incorporationDate: v })} />
            <FieldRow label="Secteur" value={data.industry} editing={editMode} onEdit={(v) => update({ industry: v })} />
          </div>
          {data.ubos.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Personnes identifiées ({data.ubos.length})</p>
              {data.ubos.map((ubo, i) => (
                <div key={i} className="flex items-center justify-between py-0.5 text-[11px]">
                  <span className="text-foreground">{ubo.name}</span>
                  <span className="font-data text-muted-foreground">{ubo.percentage > 0 ? `${ubo.percentage}%` : "Dirigeant"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={!canProceed} className="h-8 text-[11px]">
          {data.ubos.length > 0 ? `Continuer — ${data.ubos.length} personne(s) à vérifier` : "Continuer"}
        </Button>
      </div>
    </div>
  );
}

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
