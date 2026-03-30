"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

const EXAMPLES: Record<string, string> = {
  MC: "Attestation de résidence de la Mairie",
  FR: "Facture EDF/GDF, avis d'imposition, quittance de loyer",
  GB: "Utility bill (gas, electricity, water), council tax",
  US: "Utility bill, bank statement, government letter",
  AE: "Attestation de résidence (Emirates ID)",
};

export function PersonAddressStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    update({ addressFile: file });
    setAnalyzing(true);
    setTimeout(() => {
      update({ addressExtracted: "27 Boulevard Albert 1er, 98000 Monaco" });
      setAnalyzing(false);
      setExtracted(true);
    }, 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Preuve d&apos;adresse</h2>
        <p className="text-[12px] text-muted-foreground">
          Justificatif de domicile de moins de 3 mois. L&apos;IA vérifie la date et extrait l&apos;adresse.
        </p>
      </div>

      {/* Country-specific hint */}
      {data.residence && EXAMPLES[data.residence] && (
        <div className="rounded-md bg-blue-50/80 px-4 py-2.5 text-[11px] text-blue-700">
          <strong>Documents acceptés pour {data.residence} :</strong> {EXAMPLES[data.residence]}
        </div>
      )}

      {/* Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed px-6 py-6 transition-colors",
          data.addressFile ? "border-emerald-300 bg-emerald-50/50" : "border-border hover:border-foreground/20",
        )}
      >
        {analyzing ? (
          <><Loader2 className="h-6 w-6 animate-spin text-foreground" /><p className="text-[12px] font-medium">Extraction de l&apos;adresse...</p></>
        ) : data.addressFile ? (
          <><CheckCircle className="h-6 w-6 text-emerald-600" /><p className="text-[12px] font-medium">{data.addressFile.name}</p></>
        ) : (
          <><Upload className="h-6 w-6 text-muted-foreground" /><p className="text-[12px] font-medium">Glissez ou cliquez</p><p className="text-[11px] text-muted-foreground">PDF, JPG, PNG — moins de 3 mois</p></>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} className="hidden" />
      </div>

      {/* Extracted address */}
      {extracted && (
        <div className="rounded-md border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Adresse extraite</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px]">Adresse</Label>
            <Input value={data.addressExtracted} onChange={(e) => update({ addressExtracted: e.target.value })} className="h-8 text-[12px]" />
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600">
            <CheckCircle className="h-3 w-3" /> Document daté de moins de 3 mois · Adresse lisible
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={!data.addressFile} className="h-8 text-[11px]">Continuer</Button>
      </div>
    </div>
  );
}
