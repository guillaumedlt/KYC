"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, CheckCircle, AlertTriangle, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiExtractAddress } from "@/app/actions/ai-extract";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

const FLAGS: Record<string, string> = {
  MC: "🇲🇨 Monaco", FR: "🇫🇷 France", IT: "🇮🇹 Italie", GB: "🇬🇧 Royaume-Uni", US: "🇺🇸 États-Unis",
};

export function PersonAddressStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    update({ addressFile: file });
    setAnalyzing(true);
    setExtracted(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const result = await aiExtractAddress(base64);

      if (result && result.confidence > 0) {
        update({
          addressExtracted: result.address ?? "",
          aiExtractions: {
            ...data.aiExtractions,
            address_confidence: String(result.confidence),
            address_date: result.documentDate ?? "",
            address_type: result.documentType ?? "",
            address_valid: result.isRecent ? "true" : "false",
          },
        });
      } else {
        update({ addressExtracted: "", aiExtractions: { ...data.aiExtractions, address_confidence: "0" } });
        setEditMode(true);
      }
      setAnalyzing(false);
      setExtracted(true);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Preuve d&apos;adresse</h2>
        <p className="text-[12px] text-muted-foreground">
          Uploadez le justificatif. L&apos;IA détecte le type de document, extrait l&apos;adresse et vérifie la date.
        </p>
      </div>

      {/* Context from previous step */}
      {data.residence && (
        <div className="rounded-md bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          Résidence détectée : <strong className="text-foreground">{FLAGS[data.residence] ?? data.residence}</strong> — les documents acceptés seront adaptés.
        </div>
      )}

      {/* Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-4 rounded-md border-2 border-dashed px-6 py-8 transition-all",
          analyzing ? "border-foreground/30 bg-muted/20" :
          data.addressFile ? "border-emerald-300 bg-emerald-50/50" :
          "border-border hover:border-foreground/20 hover:bg-muted/10",
        )}
      >
        {analyzing ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium">Analyse du justificatif...</p>
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                <p>Détection du type de document...</p>
                <p>Extraction de l&apos;adresse...</p>
                <p>Vérification de la date (&lt; 3 mois)...</p>
              </div>
            </div>
          </>
        ) : data.addressFile ? (
          <>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div className="text-center">
              <p className="text-[13px] font-medium">{data.addressFile.name}</p>
              <p className="mt-0.5 text-[11px] text-emerald-600">Analysé · Cliquez pour remplacer</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium">Déposez le justificatif de domicile</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Facture, attestation, relevé — moins de 3 mois</p>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} className="hidden" />
      </div>

      {/* Extracted data */}
      {extracted && (
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Extraction IA</span>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-data text-[10px] font-medium text-emerald-600">
                {data.aiExtractions.address_confidence}%
              </span>
            </div>
            <button onClick={() => setEditMode(!editMode)}
              className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors",
                editMode ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Pencil className="h-3 w-3" />{editMode ? "Valider" : "Corriger"}
            </button>
          </div>
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="w-40 text-[11px] text-muted-foreground">Type de document</span>
              <span className="text-[12px] text-foreground">{data.aiExtractions.address_type}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="w-40 text-[11px] text-muted-foreground">Adresse</span>
              {editMode ? (
                <input value={data.addressExtracted} onChange={(e) => update({ addressExtracted: e.target.value })}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-right text-[12px] focus:border-foreground/30 focus:outline-none" />
              ) : (
                <span className="text-[12px] text-foreground">{data.addressExtracted}</span>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="w-40 text-[11px] text-muted-foreground">Date du document</span>
              <span className="font-data text-[12px] text-foreground">{data.aiExtractions.address_date}</span>
            </div>
          </div>
          <div className="border-t border-border px-4 py-2">
            {data.aiExtractions.address_valid === "true" ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                <CheckCircle className="h-3 w-3" /> Document daté de moins de 3 mois · Adresse lisible
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                <AlertTriangle className="h-3 w-3" /> Document de plus de 3 mois — un justificatif récent est requis
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={!extracted} className="h-8 text-[11px]">Continuer</Button>
      </div>
    </div>
  );
}
