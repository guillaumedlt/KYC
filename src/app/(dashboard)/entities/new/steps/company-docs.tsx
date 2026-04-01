"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, FileText, Sparkles, AlertTriangle, Pencil, Building2, X, Plus, ChevronDown, ChevronRight, Users, PieChart, Landmark, BookOpen } from "lucide-react";
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
  icon: typeof Building2;
}

interface FileExtraction {
  success: boolean;
  details: string;
  raw: Record<string, unknown> | null;
}

const BLOCKS: DocBlock[] = [
  { key: "constitutionFiles", title: "Constitution / Immatriculation", desc: "Statuts, Kbis, extrait RCI, certificat d'incorporation", docType: "registration", required: true, icon: Landmark },
  { key: "governanceFiles", title: "Gouvernance", desc: "Liste dirigeants, PV nomination, pouvoirs de signature", docType: "governance", required: false, icon: Users },
  { key: "shareholdingFiles", title: "Actionnariat", desc: "Registre actionnaires, organigramme, pacte d'actionnaires", docType: "shareholding", required: false, icon: PieChart },
  { key: "financialFiles", title: "Financier", desc: "Bilan, relevé bancaire, business plan", docType: "financial", required: false, icon: BookOpen },
];

const COMPANY_TYPE_LABELS: Record<string, string> = {
  sam: "SAM", sarl: "SARL", sci: "SCI", sa: "SA", sas: "SAS", sca: "SCA", snc: "SNC",
  ltd: "Ltd", llc: "LLC", gmbh: "GmbH", ag: "AG", bv: "BV", other: "Autre",
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
  const [fileExtractions, setFileExtractions] = useState<Record<string, FileExtraction>>({});
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const hasExtracted = !!data.companyName;

  function toggleExpand(fileId: string) {
    setExpandedFiles((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  }

  // ─── Process a single file ─────────────────────────────────────
  async function processFile(blockKey: DocBlock["key"], file: File, docType: string) {
    if (file.size > 20 * 1024 * 1024) return;

    const fileId = `${blockKey}-${file.name}-${Date.now()}`;
    setAnalyzingFile(fileId);

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

        if (result.companyName && !data.companyName) updates.companyName = result.companyName;
        if (result.registrationNumber && !data.regNumber) updates.regNumber = result.registrationNumber;
        if (result.jurisdiction && !data.jurisdiction) updates.jurisdiction = result.jurisdiction;
        if (result.companyType && !data.companyType) updates.companyType = result.companyType;
        if (result.capital && !data.capital) updates.capital = result.capital;
        if (result.businessObject && !data.industry) updates.industry = result.businessObject;

        // Merge persons
        if (result.persons?.length > 0) {
          const existing = (data.ubos || []).map((u) => u.name.toLowerCase());
          const newPersons = result.persons
            .filter((p: { name: string }) => !existing.includes(p.name.toLowerCase()))
            .map((p: { name: string; role: string; nationality?: string }) => ({
              name: p.name, percentage: 0, completed: false, role: p.role, nationality: p.nationality,
            }));
          if (newPersons.length > 0) updates.ubos = [...(data.ubos || []), ...newPersons];
        }

        // Merge shareholders
        if (result.shareholders?.length > 0) {
          const existing = (updates.ubos || data.ubos || []).map((u) => u.name.toLowerCase());
          const newOnes = result.shareholders
            .filter((s: { name: string }) => !existing.includes(s.name.toLowerCase()))
            .map((s: { name: string; percentage: number; type: string }) => ({
              name: s.name, percentage: s.percentage, completed: false,
              role: s.type === "company" ? "Actionnaire (société)" : "Actionnaire",
            }));
          if (newOnes.length > 0) updates.ubos = [...(updates.ubos || data.ubos || []), ...newOnes];
        }

        updates.aiExtractions = {
          ...data.aiExtractions,
          [`${docType}_${file.name}_confidence`]: String(result.confidence),
          ...(result.registeredAddress ? { registered_address: result.registeredAddress } : {}),
          ...(result.businessObject ? { business_object: result.businessObject } : {}),
        };
        if (result.warnings?.length > 0) {
          updates.aiWarnings = [...(data.aiWarnings || []), ...result.warnings];
        }
        update(updates);

        setFileExtractions((r) => ({ ...r, [fileId]: { success: true, details: `Confiance ${result.confidence}%`, raw: result } }));
        setExpandedFiles((prev) => ({ ...prev, [fileId]: true }));
      } else {
        setFileExtractions((r) => ({ ...r, [fileId]: { success: false, details: "Extraction limitée", raw: result } }));
      }
    } catch {
      setFileExtractions((r) => ({ ...r, [fileId]: { success: false, details: "Erreur — document conservé", raw: null } }));
    } finally {
      setAnalyzingFile(null);
    }
  }

  function handleFiles(blockKey: DocBlock["key"], files: FileList, docType: string) {
    Array.from(files).forEach((file) => processFile(blockKey, file, docType));
  }

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
          Glissez-déposez par catégorie. Cliquez sur un fichier analysé pour voir les champs extraits.
        </p>
        <p className="mt-1 font-data text-[11px] text-muted-foreground">{totalFiles} document(s) uploadé(s)</p>
      </div>

      {/* ─── Upload blocks ───────────────────────────────────────── */}
      <div className="space-y-3">
        {BLOCKS.map((block) => {
          const files = (data[block.key] as File[]) || [];
          const isDragOver = dragOver === block.key;
          const BlockIcon = block.icon;

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
                    {files.length > 0 ? <CheckCircle className="h-4 w-4" /> : <BlockIcon className="h-4 w-4" />}
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

              {/* File list with expandable extractions */}
              {files.length > 0 && (
                <div className="border-t border-emerald-200/30">
                  {files.map((file, i) => {
                    const fileId = Object.keys(fileExtractions).find((k) => k.startsWith(`${block.key}-${file.name}`)) ?? `${block.key}-${file.name}`;
                    const isAnalyzing = analyzingFile === fileId || (analyzingFile?.startsWith(`${block.key}-${file.name}`) ?? false);
                    const extraction = fileExtractions[fileId];
                    const isExpanded = expandedFiles[fileId] && extraction?.raw;
                    const raw = extraction?.raw as Record<string, unknown> | null;

                    return (
                      <div key={i} className="border-b border-emerald-200/20 last:border-0">
                        {/* File row */}
                        <div
                          className={cn("flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/10", isExpanded && "bg-muted/5")}
                          onClick={() => extraction?.raw && toggleExpand(fileId)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isAnalyzing ? (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-foreground" />
                            ) : extraction?.success ? (
                              isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            ) : extraction ? (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate text-[11px] text-foreground">{file.name}</span>
                            <span className="shrink-0 font-data text-[9px] text-muted-foreground">{(file.size / 1024).toFixed(0)} Ko</span>
                            {isAnalyzing && <span className="shrink-0 text-[9px] text-muted-foreground">Analyse Opus...</span>}
                            {extraction?.success && !isExpanded && (
                              <span className="shrink-0 text-[9px] text-emerald-600">{extraction.details} — cliquez pour voir</span>
                            )}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeFile(block.key, i); }}
                            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Expanded extraction details */}
                        {isExpanded && raw && (() => {
                          const r = raw as Record<string, string | number | boolean | { name: string; role?: string; nationality?: string; percentage?: number; type?: string }[] | string[]>;
                          const persons = (Array.isArray(r.persons) ? r.persons : []) as { name: string; role: string; nationality?: string }[];
                          const shareholders = (Array.isArray(r.shareholders) ? r.shareholders : []) as { name: string; percentage: number; type: string }[];
                          const warnings = (Array.isArray(r.warnings) ? r.warnings : []) as string[];

                          return (
                          <div className="border-t border-border/30 bg-muted/5 px-4 py-3 space-y-2">
                            {(r.companyName || r.registrationNumber || r.capital || r.registeredAddress || r.businessObject) && (
                              <div>
                                <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Informations société</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  {r.companyName && <ExtractField label="Raison sociale" value={String(r.companyName)} />}
                                  {r.registrationNumber && <ExtractField label="N° registre" value={String(r.registrationNumber)} mono />}
                                  {r.companyType && <ExtractField label="Forme" value={COMPANY_TYPE_LABELS[String(r.companyType)] || String(r.companyType)} />}
                                  {r.jurisdiction && <ExtractField label="Juridiction" value={COUNTRY_LABELS[String(r.jurisdiction)] || String(r.jurisdiction)} />}
                                  {r.capital && <ExtractField label="Capital" value={String(r.capital)} mono />}
                                  {r.registeredAddress && <ExtractField label="Siège social" value={String(r.registeredAddress)} full />}
                                  {r.businessObject && <ExtractField label="Objet social" value={String(r.businessObject)} full />}
                                </div>
                              </div>
                            )}

                            {persons.length > 0 && (
                              <div>
                                <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                  Personnes identifiées ({persons.length})
                                </p>
                                <div className="space-y-1">
                                  {persons.map((p, pi) => (
                                    <div key={pi} className="flex items-center justify-between rounded bg-background px-2 py-1">
                                      <div>
                                        <span className="text-[11px] font-medium text-foreground">{p.name}</span>
                                        <span className="ml-2 text-[9px] text-muted-foreground">{p.role}{p.nationality ? ` · ${p.nationality}` : ""}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Ownership chain */}
                            {r.ownershipChain && (
                              <div>
                                <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Chaîne de détention</p>
                                <div className="rounded bg-background px-3 py-2 font-data text-[10px] text-foreground leading-relaxed whitespace-pre-wrap">
                                  {String(r.ownershipChain)}
                                </div>
                              </div>
                            )}

                            {shareholders.length > 0 && (
                              <div>
                                <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                  Actionnariat ({shareholders.length})
                                </p>
                                <div className="space-y-1">
                                  {shareholders.map((s, si) => {
                                    const typeLabel = s.type === "company" ? "Société" : s.type === "trust" ? "Trust" : s.type === "foundation" ? "Fondation" : "Personne";
                                    const typeIcon = s.type === "company" || s.type === "trust" || s.type === "foundation" ? <Building2 className="h-3 w-3 text-muted-foreground" /> : <Users className="h-3 w-3 text-muted-foreground" />;
                                    const sData = s as Record<string, unknown>;
                                    const subs = Array.isArray(sData.subsidiaries) ? sData.subsidiaries as { name: string; percentage: number; type: string }[] : [];
                                    return (
                                    <div key={si}>
                                      <div className="flex items-center justify-between rounded bg-background px-2 py-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          {typeIcon}
                                          <div className="min-w-0">
                                            <span className="text-[11px] text-foreground">{s.name}</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[9px] text-muted-foreground">{typeLabel}</span>
                                              {String(sData.jurisdiction || "") !== "" && <span className="text-[9px] text-muted-foreground">· {String(sData.jurisdiction)}</span>}
                                              {String(sData.heldThrough || "") !== "" && <span className="text-[9px] text-amber-600">via {String(sData.heldThrough)}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        <span className={cn("font-data text-[11px] shrink-0", s.percentage >= 25 ? "font-medium text-foreground" : "text-muted-foreground")}>
                                          {s.percentage}%
                                        </span>
                                      </div>
                                      {/* Sub-shareholders (cascade) */}
                                      {subs.length > 0 && (
                                        <div className="ml-6 border-l-2 border-border/50 pl-2 space-y-0.5">
                                          {subs.map((sub, subi) => (
                                            <div key={subi} className="flex items-center justify-between text-[10px] py-0.5">
                                              <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground">↳</span>
                                                <span className="text-foreground">{sub.name}</span>
                                                <span className="text-[8px] text-muted-foreground">{sub.type === "company" ? "Société" : "Personne"}</span>
                                              </div>
                                              <span className="font-data text-muted-foreground">{sub.percentage}%</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Beneficial Owners (UBO) */}
                            {(() => {
                              const ubos = Array.isArray(r.beneficialOwners) ? r.beneficialOwners as { name: string; effectivePercentage: number; detentionType: string; chain: string; isUBO: boolean; nationality?: string }[] : [];
                              if (ubos.length === 0) return null;
                              const confirmedUBOs = ubos.filter((u) => u.isUBO);
                              return (
                                <div>
                                  <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                    Bénéficiaires effectifs (Art. 4-2 Loi 1.362 — seuil ≥25%)
                                  </p>
                                  <div className="space-y-1.5">
                                    {ubos.map((u, ui) => (
                                      <div key={ui} className={cn("rounded px-2.5 py-1.5", u.isUBO ? "bg-foreground/5 border border-foreground/10" : "bg-background")}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            {u.isUBO ? (
                                              <span className="rounded bg-foreground px-1 py-px text-[8px] font-bold text-background">UBO</span>
                                            ) : (
                                              <span className="rounded bg-muted px-1 py-px text-[8px] text-muted-foreground">&lt;25%</span>
                                            )}
                                            <span className={cn("text-[11px]", u.isUBO ? "font-medium text-foreground" : "text-muted-foreground")}>{u.name}</span>
                                            {u.nationality && <span className="text-[9px] text-muted-foreground">{String(u.nationality)}</span>}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className={cn("rounded px-1.5 py-px text-[9px]",
                                              u.detentionType === "direct" ? "bg-emerald-50 text-emerald-700" :
                                              u.detentionType === "indirect" ? "bg-amber-50 text-amber-700" :
                                              "bg-blue-50 text-blue-700"
                                            )}>
                                              {u.detentionType === "direct" ? "Direct" : u.detentionType === "indirect" ? "Indirect" : "Mixte"}
                                            </span>
                                            <span className={cn("font-data text-[12px] font-semibold", u.isUBO ? "text-foreground" : "text-muted-foreground")}>
                                              {u.effectivePercentage.toFixed(1)}%
                                            </span>
                                          </div>
                                        </div>
                                        {u.chain && (
                                          <p className="mt-0.5 font-data text-[9px] text-muted-foreground leading-relaxed">{u.chain}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  {confirmedUBOs.length > 0 && (
                                    <p className="mt-1.5 text-[9px] text-emerald-600 font-medium">
                                      {confirmedUBOs.length} bénéficiaire(s) effectif(s) identifié(s) (≥25%)
                                    </p>
                                  )}
                                  {confirmedUBOs.length === 0 && (
                                    <p className="mt-1.5 text-[9px] text-amber-600 font-medium">
                                      Aucun UBO ≥25% identifié — le dirigeant principal doit être désigné comme UBO par défaut
                                    </p>
                                  )}
                                </div>
                              );
                            })()}

                            {warnings.length > 0 && (
                              <div className="space-y-0.5">
                                {warnings.map((w, wi) => (
                                  <div key={wi} className="flex items-center gap-1.5 text-[9px] text-amber-600">
                                    <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Consolidated company info ────────────────────────────── */}
      {hasExtracted && (
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Synthèse consolidée</span>
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
            {data.aiExtractions.registered_address && (
              <FieldRow label="Siège social" value={data.aiExtractions.registered_address} editing={editMode} onEdit={(v) => update({ aiExtractions: { ...data.aiExtractions, registered_address: v } })} />
            )}
            <FieldRow label="Objet social / Activité" value={data.industry} editing={editMode} onEdit={(v) => update({ industry: v })} />
          </div>
          {data.ubos.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Toutes les personnes identifiées ({data.ubos.length})</p>
              {data.ubos.map((ubo, i) => (
                <div key={i} className="flex items-center justify-between py-1 text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-foreground">{ubo.name}</span>
                    {ubo.role && <span className="text-[9px] text-muted-foreground">{ubo.role}{ubo.nationality ? ` · ${ubo.nationality}` : ""}</span>}
                  </div>
                  <span className="font-data text-muted-foreground shrink-0">
                    {ubo.percentage > 0 ? `${ubo.percentage}%` : ""}
                  </span>
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

// ─── Extract field (inline display) ─────────────────────────────────
function ExtractField({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={cn("py-0.5", full && "col-span-2")}>
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <p className={cn("text-[11px] text-foreground leading-tight", mono && "font-data")}>{value}</p>
    </div>
  );
}

// ─── Field row (consolidated view) ──────────────────────────────────
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
