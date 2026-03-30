"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

interface DocBlock {
  key: keyof WizardData;
  title: string;
  desc: string;
  examples: string;
}

const BLOCKS: DocBlock[] = [
  { key: "constitutionFile", title: "Constitution", desc: "Statuts à jour, certificat d'immatriculation, extrait RCI", examples: "L'IA extrait : nom, numéro, date, objet social, capital" },
  { key: "governanceFile", title: "Gouvernance", desc: "Liste des dirigeants, PV de nomination, pouvoirs de signature", examples: "L'IA crée automatiquement les fiches des dirigeants identifiés" },
  { key: "shareholdingFile", title: "Actionnariat", desc: "Registre des actionnaires, organigramme de détention", examples: "L'IA reconstruit l'arbre capitalistique et identifie les UBO" },
  { key: "financialFile", title: "Financier", desc: "Derniers bilans, relevé bancaire, business plan si récente", examples: "L'IA extrait CA, résultat net, trésorerie" },
];

export function CompanyDocsStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function handleUpload(key: keyof WizardData, file: File) {
    update({ [key]: file } as Partial<WizardData>);
    setAnalyzing(key as string);

    setTimeout(() => {
      // Simulate AI extraction
      if (key === "shareholdingFile") {
        update({
          ubos: [
            { name: "Jean-Pierre Moretti", percentage: 65, completed: false },
            { name: "Dmitri Volkov", percentage: 20, completed: false },
          ],
        });
      }
      setAnalyzing(null);
    }, 2000);
  }

  const uploadedCount = BLOCKS.filter((b) => data[b.key]).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Documents de la société</h2>
        <p className="text-[12px] text-muted-foreground">
          Uploadez par bloc. L&apos;IA analyse chaque document et extrait les informations clés.
        </p>
        <p className="mt-1 font-data text-[11px] text-muted-foreground">{uploadedCount}/{BLOCKS.length} blocs complétés</p>
      </div>

      <div className="space-y-3">
        {BLOCKS.map((block) => {
          const file = data[block.key] as File | null;
          const isAnalyzing = analyzing === block.key;
          return (
            <div key={block.key as string} className={cn(
              "rounded-md border transition-all",
              file ? "border-emerald-200 bg-emerald-50/30" : "border-border bg-card",
            )}>
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
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-[11px] transition-colors",
                    file ? "border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                  )}
                >
                  {isAnalyzing ? "Analyse..." : file ? "Remplacer" : "Uploader"}
                </button>
                <input
                  ref={(el) => { fileRefs.current[block.key as string] = el; }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleUpload(block.key, e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* AI extraction hint */}
              {file && !isAnalyzing && (
                <div className="flex items-center gap-1.5 border-t border-emerald-200/50 px-4 py-1.5 text-[10px] text-emerald-600">
                  <Sparkles className="h-3 w-3" /> {block.examples}
                </div>
              )}

              {/* UBO detected */}
              {block.key === "shareholdingFile" && data.ubos.length > 0 && !isAnalyzing && (
                <div className="border-t border-emerald-200/50 px-4 py-2">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground">UBO détectés</p>
                  {data.ubos.map((ubo, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 text-[11px]">
                      <span className="text-foreground">{ubo.name}</span>
                      <span className="font-data text-muted-foreground">{ubo.percentage}%</span>
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
