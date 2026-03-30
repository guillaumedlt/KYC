"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

const FUND_SOURCES = [
  { value: "salary", label: "Salaire / Revenus professionnels", doc: "Fiches de paie ou contrat de travail" },
  { value: "real_estate", label: "Vente immobilière", doc: "Acte de vente notarié" },
  { value: "inheritance", label: "Héritage / Donation", doc: "Certificat de succession ou acte de donation" },
  { value: "investment", label: "Investissement / Plus-value", doc: "Relevé de portefeuille ou attestation" },
  { value: "business", label: "Activité commerciale", doc: "Bilans comptables, relevés bancaires" },
  { value: "other", label: "Autre", doc: "Tout justificatif pertinent" },
];

export function PersonFundsStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = FUND_SOURCES.find((f) => f.value === data.fundsSource);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    update({ fundsFile: file });
    setAnalyzing(true);
    setTimeout(() => {
      update({ fundsAmount: "285 000 €", aiExtractions: { ...data.aiExtractions, funds_extracted: "true" } });
      setAnalyzing(false);
    }, 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Source des fonds</h2>
        <p className="text-[12px] text-muted-foreground">
          Quelle est l&apos;origine des fonds ? L&apos;IA adapte le document demandé.
        </p>
      </div>

      {/* Source selection */}
      <div className="space-y-2">
        {FUND_SOURCES.map((f) => (
          <button key={f.value} onClick={() => update({ fundsSource: f.value })}
            className={cn(
              "flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition-all",
              data.fundsSource === f.value ? "border-foreground bg-muted/20" : "border-border hover:border-foreground/20",
            )}>
            <div>
              <p className="text-[12px] font-medium text-foreground">{f.label}</p>
              <p className="text-[11px] text-muted-foreground">{f.doc}</p>
            </div>
            {data.fundsSource === f.value && <CheckCircle className="h-4 w-4 text-foreground" />}
          </button>
        ))}
      </div>

      {/* Document upload */}
      {data.fundsSource && (
        <div>
          <Label className="mb-1.5 block text-[11px]">Justificatif — {selected?.doc}</Label>
          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed px-6 py-5 transition-colors",
              data.fundsFile ? "border-emerald-300 bg-emerald-50/50" : "border-border hover:border-foreground/20",
            )}>
            {analyzing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /><p className="text-[12px]">Extraction des montants...</p></>
            ) : data.fundsFile ? (
              <><CheckCircle className="h-5 w-5 text-emerald-600" /><p className="text-[12px]">{data.fundsFile.name}</p></>
            ) : (
              <><Upload className="h-5 w-5 text-muted-foreground" /><p className="text-[12px]">Glissez ou cliquez</p></>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} className="hidden" />
          </div>
        </div>
      )}

      {/* Extracted amount */}
      {data.fundsAmount && (
        <div className="rounded-md border border-border bg-card p-4">
          <Label className="mb-1.5 block text-[11px]">Montant extrait</Label>
          <Input value={data.fundsAmount} onChange={(e) => update({ fundsAmount: e.target.value })} className="h-8 font-data text-[13px] font-medium" />
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={!data.fundsSource} className="h-8 text-[11px]">Continuer</Button>
      </div>
    </div>
  );
}
