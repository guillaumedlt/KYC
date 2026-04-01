"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, FileText, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

interface DocBlock {
  key: keyof WizardData;
  title: string;
  desc: string;
  docType: string;
  extractHint: string;
}

const BLOCKS: DocBlock[] = [
  { key: "constitutionFile", title: "Constitution", desc: "Statuts à jour, certificat d'immatriculation, extrait RCI", docType: "registration", extractHint: "Nom, numéro, date, objet social, capital" },
  { key: "governanceFile", title: "Gouvernance", desc: "Liste des dirigeants, PV de nomination, pouvoirs de signature", docType: "governance", extractHint: "Dirigeants et administrateurs identifiés" },
  { key: "shareholdingFile", title: "Actionnariat", desc: "Registre des actionnaires, organigramme de détention", docType: "shareholding", extractHint: "Arbre capitalistique et UBO détectés" },
  { key: "financialFile", title: "Financier", desc: "Derniers bilans, relevé bancaire, business plan si récente", docType: "financial", extractHint: "CA, résultat net, trésorerie extraits" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) { reject(new Error("Failed to encode file")); return; }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function CompanyDocsStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; details: string }>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
        // Update company data from extraction
        const updates: Partial<WizardData> = {};
        if (result.companyName && !data.companyName) updates.companyName = result.companyName;
        if (result.registrationNumber && !data.regNumber) updates.regNumber = result.registrationNumber;
        if (result.jurisdiction && !data.jurisdiction) updates.jurisdiction = result.jurisdiction;
        if (result.incorporationDate && !data.incorporationDate) updates.incorporationDate = result.incorporationDate;
        if (result.companyType && !data.companyType) updates.companyType = result.companyType;
        if (result.capital && !data.capital) updates.capital = result.capital;

        // Extract UBOs from shareholding document
        if (key === "shareholdingFile" && result.shareholders?.length > 0) {
          updates.ubos = result.shareholders
            .filter((s: { percentage: number }) => s.percentage >= 25)
            .map((s: { name: string; percentage: number }) => ({
              name: s.name,
              percentage: s.percentage,
              completed: false,
            }));
        }

        // Directors from governance doc — also add as UBOs if not already
        if (key === "governanceFile" && result.directors?.length > 0) {
          const existingNames = data.ubos.map((u) => u.name.toLowerCase());
          const newUbos = result.directors
            .filter((d: string) => !existingNames.includes(d.toLowerCase()))
            .map((d: string) => ({ name: d, percentage: 0, completed: false }));
          if (newUbos.length > 0) {
            updates.ubos = [...data.ubos, ...newUbos];
          }
        }

        if (Object.keys(updates).length > 0) update(updates);

        const details = [
          result.companyName && `Société: ${result.companyName}`,
          result.registrationNumber && `N°: ${result.registrationNumber}`,
          result.capital && `Capital: ${result.capital}`,
          result.directors?.length && `${result.directors.length} dirigeant(s)`,
          result.shareholders?.length && `${result.shareholders.length} actionnaire(s)`,
        ].filter(Boolean).join(" · ");

        setResults((r) => ({ ...r, [key as string]: { success: true, details: details || `Confiance: ${result.confidence}%` } }));
      } else {
        setResults((r) => ({ ...r, [key as string]: { success: false, details: "Extraction IA limitée — vérifiez manuellement" } }));
      }
    } catch {
      setResults((r) => ({ ...r, [key as string]: { success: false, details: "Erreur d'analyse — document accepté" } }));
    } finally {
      setAnalyzing(null);
    }
  }

  const uploadedCount = BLOCKS.filter((b) => data[b.key]).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Documents de la société</h2>
        <p className="text-[12px] text-muted-foreground">
          Glissez-déposez par bloc. L&apos;IA analyse et extrait automatiquement.
        </p>
        <p className="mt-1 font-data text-[11px] text-muted-foreground">{uploadedCount}/{BLOCKS.length} blocs complétés</p>
      </div>

      <div className="space-y-3">
        {BLOCKS.map((block) => {
          const file = data[block.key] as File | null;
          const isAnalyzing = analyzing === block.key;
          const result = results[block.key as string];
          const isDragOver = dragOver === block.key;

          return (
            <div
              key={block.key as string}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const f = e.dataTransfer.files?.[0];
                if (f) handleUpload(block.key, f, block.docType);
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(block.key as string); }}
              onDragLeave={() => setDragOver(null)}
              className={cn(
                "rounded-md border transition-all",
                isDragOver ? "border-foreground bg-foreground/5 scale-[1.01]" :
                file ? "border-emerald-200 bg-emerald-50/30" : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    file ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground",
                  )}>
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> :
                     file ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-foreground">{block.title}</p>
                    <p className="text-[11px] text-muted-foreground">{block.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => fileRefs.current[block.key as string]?.click()}
                  disabled={isAnalyzing}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-[11px] transition-colors",
                    isAnalyzing ? "cursor-wait opacity-50" :
                    file ? "border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                  )}
                >
                  {isAnalyzing ? "Analyse IA..." : file ? "Remplacer" : "Glissez ou cliquez"}
                </button>
                <input
                  ref={(el) => { fileRefs.current[block.key as string] = el; }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => e.target.files?.[0] && handleUpload(block.key, e.target.files[0], block.docType)}
                  className="hidden"
                />
              </div>

              {/* AI extraction result */}
              {result && !isAnalyzing && (
                <div className={cn(
                  "flex items-center gap-1.5 border-t px-4 py-1.5 text-[10px]",
                  result.success ? "border-emerald-200/50 text-emerald-600" : "border-amber-200/50 text-amber-600",
                )}>
                  {result.success ? <Sparkles className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {result.details}
                </div>
              )}

              {/* UBO detected from shareholding */}
              {block.key === "shareholdingFile" && data.ubos.length > 0 && !isAnalyzing && (
                <div className="border-t border-emerald-200/50 px-4 py-2">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground">UBO détectés par l&apos;IA</p>
                  {data.ubos.map((ubo, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 text-[11px]">
                      <span className="text-foreground">{ubo.name}</span>
                      <span className="font-data text-muted-foreground">{ubo.percentage > 0 ? `${ubo.percentage}%` : "Dirigeant"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={uploadedCount < 1} className="h-8 text-[11px]">Continuer</Button>
      </div>
    </div>
  );
}
