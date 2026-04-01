"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
// Use API route instead of server action
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

const FUND_LABELS: Record<string, string> = {
  salary: "Salaire / Revenus professionnels",
  real_estate: "Vente immobilière",
  inheritance: "Héritage / Donation",
  investment: "Investissement / Plus-value",
  business: "Activité commerciale",
  other: "Autre",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // PDFs: read directly as base64
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Images: compress to max 1600px wide, JPEG 85% quality
    // Saves bandwidth + Claude API tokens
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 1600;
      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function PersonFundsStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file) return;
    update({ fundsFile: file });
    setAnalyzing(true);
    setExtracted(false);

    try {
      const base64 = await fileToBase64(file);
      // Images are compressed to JPEG, PDFs stay as-is
      const mediaType = file.type === "application/pdf" ? "application/pdf" : "image/jpeg";

      // Call AI with timeout
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 45000));
      const extractPromise = fetch("/api/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "funds", base64, mediaType }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });
      const result = await Promise.race([extractPromise, timeoutPromise]);

      if (result && result.confidence > 0) {
        update({
          fundsSource: result.sourceType ?? "other",
          fundsAmount: result.amount ?? "",
          aiExtractions: {
            ...data.aiExtractions,
            funds_confidence: String(result.confidence),
            funds_type_detected: result.sourceType ?? "",
            funds_employer: result.employer ?? "",
            funds_period: result.period ?? "",
          },
        });
      } else {
        setEditMode(true);
      }
    } catch {
      setEditMode(true);
    }
    setAnalyzing(false);
    setExtracted(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Source des fonds</h2>
        <p className="text-[12px] text-muted-foreground">
          Uploadez un justificatif (fiche de paie, acte de vente, relevé...). L&apos;IA détecte le type de revenu et extrait les montants.
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          Vous pouvez passer cette étape et fournir le justificatif plus tard depuis la fiche client.
        </p>
      </div>

      {/* Upload — drag & drop */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-4 rounded-md border-2 border-dashed px-6 py-8 transition-all",
          analyzing ? "border-foreground/30 bg-muted/20" :
          dragOver ? "border-foreground bg-foreground/5 scale-[1.01]" :
          data.fundsFile ? "border-emerald-300 bg-emerald-50/50" :
          "border-border hover:border-foreground/20 hover:bg-muted/10",
        )}
      >
        {analyzing ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium">Analyse du justificatif...</p>
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                <p>Détection du type de revenu...</p>
                <p>Extraction des montants...</p>
                <p>Identification de l&apos;employeur / source...</p>
              </div>
            </div>
          </>
        ) : data.fundsFile ? (
          <>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div className="text-center">
              <p className="text-[13px] font-medium">{data.fundsFile.name}</p>
              <p className="mt-0.5 text-[11px] text-emerald-600">Analysé · Cliquez pour remplacer</p>
            </div>
          </>
        ) : dragOver ? (
          <><Upload className="h-8 w-8 text-foreground" /><p className="text-[13px] font-medium">Déposez ici</p></>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium">Glissez-déposez le justificatif</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Fiche de paie, acte notarié, relevé de portefeuille, bilan...</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">ou cliquez · PDF, JPG, PNG</p>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="hidden" />
      </div>

      {/* Extracted */}
      {extracted && (
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Extraction IA</span>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-data text-[10px] font-medium text-emerald-600">
                {data.aiExtractions.funds_confidence}%
              </span>
            </div>
            <button onClick={() => setEditMode(!editMode)}
              className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors",
                editMode ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Pencil className="h-3 w-3" />{editMode ? "Valider" : "Corriger"}
            </button>
          </div>
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="w-40 text-[11px] text-muted-foreground">Type de revenu</span>
              <span className="text-[12px] font-medium text-foreground">{FUND_LABELS[data.fundsSource] ?? data.fundsSource}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="w-40 text-[11px] text-muted-foreground">Montant</span>
              {editMode ? (
                <input value={data.fundsAmount} onChange={(e) => update({ fundsAmount: e.target.value })}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-right font-data text-[12px] focus:border-foreground/30 focus:outline-none" />
              ) : (
                <span className="font-data text-[13px] font-medium text-foreground">{data.fundsAmount}</span>
              )}
            </div>
            {data.aiExtractions.funds_employer && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="w-40 text-[11px] text-muted-foreground">Employeur / Source</span>
                <span className="text-[12px] text-foreground">{data.aiExtractions.funds_employer}</span>
              </div>
            )}
            {data.aiExtractions.funds_period && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="w-40 text-[11px] text-muted-foreground">Période</span>
                <span className="font-data text-[12px] text-foreground">{data.aiExtractions.funds_period}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <div className="flex items-center gap-2">
          {!extracted && (
            <button onClick={next} className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
              Passer pour l&apos;instant
            </button>
          )}
          <Button size="sm" onClick={next} disabled={false} className="h-8 text-[11px]">
            {extracted ? "Continuer" : "Continuer sans justificatif"}
          </Button>
        </div>
      </div>
    </div>
  );
}
