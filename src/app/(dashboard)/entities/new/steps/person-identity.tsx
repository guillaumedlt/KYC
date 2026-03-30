"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, CheckCircle, AlertTriangle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "MC", name: "Monaco" }, { code: "FR", name: "France" }, { code: "IT", name: "Italie" },
  { code: "GB", name: "Royaume-Uni" }, { code: "US", name: "États-Unis" }, { code: "CH", name: "Suisse" },
  { code: "DE", name: "Allemagne" }, { code: "ES", name: "Espagne" }, { code: "RU", name: "Russie" },
  { code: "LB", name: "Liban" }, { code: "AE", name: "Émirats Arabes Unis" }, { code: "BR", name: "Brésil" },
  { code: "CN", name: "Chine" }, { code: "SA", name: "Arabie Saoudite" }, { code: "LU", name: "Luxembourg" },
];

const DOC_TYPES = [
  { value: "passport", label: "Passeport" },
  { value: "national_id", label: "Carte d'identité" },
  { value: "residence_permit", label: "Titre de séjour" },
];

export function PersonIdentityStep({
  data, update, next, back,
}: {
  data: WizardData;
  update: (d: Partial<WizardData>) => void;
  next: () => void;
  back: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    update({ documentFile: file });

    // Simulate AI extraction
    setAnalyzing(true);
    setTimeout(() => {
      // TODO: Replace with Claude API call
      update({
        firstName: "Jean-Pierre",
        lastName: "Moretti",
        dateOfBirth: "15/03/1965",
        documentNumber: "MC1234567",
        documentExpiry: "12/2030",
        aiExtractions: {
          ...data.aiExtractions,
          identity_confidence: "96",
          mrz_valid: "true",
        },
      });
      setAnalyzing(false);
      setExtracted(true);
    }, 2000);
  }

  const canProceed = data.nationality && data.residence && data.firstName && data.lastName && data.documentFile;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Identité</h2>
        <p className="text-[12px] text-muted-foreground">
          Sélectionnez la nationalité puis uploadez le document d&apos;identité. L&apos;IA extraira automatiquement les informations.
        </p>
      </div>

      {/* Country selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[11px]">Nationalité</Label>
          <select value={data.nationality} onChange={(e) => update({ nationality: e.target.value })}
            className="h-9 w-full rounded-md border border-border bg-card px-3 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none">
            <option value="">Sélectionner...</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Pays de résidence</Label>
          <select value={data.residence} onChange={(e) => update({ residence: e.target.value })}
            className="h-9 w-full rounded-md border border-border bg-card px-3 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none">
            <option value="">Sélectionner...</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Document type */}
      <div className="space-y-1.5">
        <Label className="text-[11px]">Type de document</Label>
        <div className="flex gap-2">
          {DOC_TYPES.map((dt) => (
            <button key={dt.value} onClick={() => update({ documentType: dt.value })}
              className={cn("rounded-md border px-3 py-1.5 text-[11px] transition-all",
                data.documentType === dt.value ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/20")}>
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document upload */}
      <div className="space-y-2">
        <Label className="text-[11px]">Document d&apos;identité</Label>
        <div
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed px-6 py-6 transition-colors",
            data.documentFile ? "border-emerald-300 bg-emerald-50/50" : "border-border hover:border-foreground/20 hover:bg-muted/20",
          )}
        >
          {analyzing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-foreground" />
              <div className="text-center">
                <p className="text-[12px] font-medium text-foreground">Analyse IA en cours...</p>
                <p className="text-[11px] text-muted-foreground">OCR · Extraction · Vérification MRZ</p>
              </div>
            </>
          ) : data.documentFile ? (
            <>
              <CheckCircle className="h-6 w-6 text-emerald-600" />
              <div className="text-center">
                <p className="text-[12px] font-medium text-foreground">{data.documentFile.name}</p>
                <p className="text-[11px] text-emerald-600">Document analysé · Cliquez pour remplacer</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-[12px] font-medium text-foreground">Glissez ou cliquez</p>
                <p className="text-[11px] text-muted-foreground">PDF, JPG, PNG — max 20 Mo</p>
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocUpload} className="hidden" />
        </div>
      </div>

      {/* AI extracted fields */}
      {extracted && (
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Extraction IA</span>
            <span className="font-data text-[10px] text-emerald-600">{data.aiExtractions.identity_confidence}% confiance</span>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Prénom</Label>
              <Input value={data.firstName} onChange={(e) => update({ firstName: e.target.value })} className="h-8 text-[12px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Nom</Label>
              <Input value={data.lastName} onChange={(e) => update({ lastName: e.target.value })} className="h-8 text-[12px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Date de naissance</Label>
              <Input value={data.dateOfBirth} onChange={(e) => update({ dateOfBirth: e.target.value })} className="h-8 font-data text-[12px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">N° document</Label>
              <Input value={data.documentNumber} onChange={(e) => update({ documentNumber: e.target.value })} className="h-8 font-data text-[12px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Expiration</Label>
              <Input value={data.documentExpiry} onChange={(e) => update({ documentExpiry: e.target.value })} className="h-8 font-data text-[12px]" />
            </div>
          </div>
          {data.aiExtractions.mrz_valid === "true" && (
            <div className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-[11px] text-emerald-600">
              <CheckCircle className="h-3 w-3" /> MRZ vérifié · Cohérent avec les champs extraits
            </div>
          )}
        </div>
      )}

      {/* Selfie / Liveness */}
      {extracted && (
        <div className="rounded-md border border-dashed border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-[12px] font-medium text-foreground">Vérification biométrique</p>
              <p className="text-[11px] text-muted-foreground">Selfie + comparaison faciale avec le document</p>
            </div>
            <Button size="sm" className="ml-auto h-7 rounded-md px-3 text-[11px]">Lancer</Button>
          </div>
        </div>
      )}

      {/* AI warnings */}
      {data.aiWarnings.length > 0 && (
        <div className="space-y-1">
          {data.aiWarnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-amber-50 px-4 py-2 text-[11px] text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={!canProceed} className="h-8 text-[11px]">Continuer</Button>
      </div>
    </div>
  );
}
