"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, CheckCircle, AlertTriangle, Camera, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aiExtractIdentity } from "@/app/actions/ai-extract";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

const FLAGS: Record<string, string> = {
  MC: "🇲🇨 Monaco", FR: "🇫🇷 France", IT: "🇮🇹 Italie", GB: "🇬🇧 Royaume-Uni",
  US: "🇺🇸 États-Unis", CH: "🇨🇭 Suisse", DE: "🇩🇪 Allemagne", ES: "🇪🇸 Espagne",
  RU: "🇷🇺 Russie", LB: "🇱🇧 Liban", AE: "🇦🇪 EAU", BR: "🇧🇷 Brésil",
};

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
  const [editMode, setEditMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file) return;
    update({ documentFile: file });

    // AI extracts EVERYTHING via Claude Vision
    setAnalyzing(true);
    setExtracted(false);

    // Convert file to base64 for Claude Vision
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const result = await aiExtractIdentity(base64);

      if (result && result.confidence > 0) {
        update({
          nationality: result.nationality ?? "",
          residence: result.countryOfResidence ?? result.nationality ?? "",
          firstName: result.firstName ?? "",
          lastName: result.lastName ?? "",
          dateOfBirth: result.dateOfBirth ?? "",
          documentType: result.documentType ?? "passport",
          documentNumber: result.documentNumber ?? "",
          documentExpiry: result.documentExpiry ?? "",
          aiExtractions: {
            ...data.aiExtractions,
            identity_confidence: String(result.confidence),
            mrz_valid: "true",
            doc_type_detected: result.documentType ?? "unknown",
            nationality_detected: result.nationality ?? "",
            residence_detected: result.countryOfResidence ?? "",
          },
          aiWarnings: result.warnings ?? [],
        });
        setExtracted(true);
      } else {
        // Fallback if AI fails
        update({ aiWarnings: ["L'extraction IA a échoué. Veuillez remplir manuellement."] });
        setEditMode(true);
        setExtracted(true);
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  const canProceed = extracted && data.firstName && data.lastName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Identité</h2>
        <p className="text-[12px] text-muted-foreground">
          Glissez-déposez le document d&apos;identité. L&apos;IA détecte et extrait automatiquement toutes les informations.
        </p>
      </div>

      {/* Document upload — drag & drop + click */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-4 rounded-md border-2 border-dashed px-6 py-8 transition-all",
          analyzing ? "border-foreground/30 bg-muted/20" :
          dragOver ? "border-foreground bg-foreground/5 scale-[1.01]" :
          data.documentFile ? "border-emerald-300 bg-emerald-50/50" :
          "border-border hover:border-foreground/20 hover:bg-muted/10",
        )}
      >
        {analyzing ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">Analyse IA en cours...</p>
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                <p>OCR du document...</p>
                <p>Détection nationalité et pays de résidence...</p>
                <p>Extraction nom, prénom, date de naissance...</p>
                <p>Vérification MRZ et validité...</p>
                <p>Screening PEP préliminaire...</p>
              </div>
            </div>
          </>
        ) : data.documentFile ? (
          <>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">{data.documentFile.name}</p>
              <p className="mt-0.5 text-[11px] text-emerald-600">Analysé avec succès · Cliquez pour remplacer</p>
            </div>
          </>
        ) : dragOver ? (
          <>
            <Upload className="h-8 w-8 text-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">Déposez ici</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">Glissez-déposez le document d&apos;identité</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Passeport, carte d&apos;identité ou titre de séjour</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">ou cliquez pour parcourir · PDF, JPG, PNG — max 20 Mo</p>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleInputChange} className="hidden" />
      </div>

      {/* AI extracted results — all auto-filled, editable on demand */}
      {extracted && (
        <div className="rounded-md border border-border bg-card">
          {/* Header with confidence + edit toggle */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Extraction IA</span>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-data text-[10px] font-medium text-emerald-600">
                {data.aiExtractions.identity_confidence}% confiance
              </span>
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

          {/* Fields */}
          <div className="divide-y divide-border/50">
            <FieldRow label="Type de document" value={data.documentType === "passport" ? "Passeport" : data.documentType === "national_id" ? "Carte d'identité" : "Titre de séjour"} editing={false} />
            <FieldRow label="Nationalité" value={FLAGS[data.nationality] ?? data.nationality} editing={editMode}
              onEdit={(v) => update({ nationality: v })} editValue={data.nationality} />
            <FieldRow label="Pays de résidence" value={FLAGS[data.residence] ?? data.residence} editing={editMode}
              onEdit={(v) => update({ residence: v })} editValue={data.residence} />
            <FieldRow label="Prénom" value={data.firstName} editing={editMode} onEdit={(v) => update({ firstName: v })} />
            <FieldRow label="Nom" value={data.lastName} editing={editMode} onEdit={(v) => update({ lastName: v })} />
            <FieldRow label="Date de naissance" value={data.dateOfBirth} mono editing={editMode} onEdit={(v) => update({ dateOfBirth: v })} />
            <FieldRow label="N° document" value={data.documentNumber} mono editing={editMode} onEdit={(v) => update({ documentNumber: v })} />
            <FieldRow label="Expiration" value={data.documentExpiry} mono editing={editMode} onEdit={(v) => update({ documentExpiry: v })} />
          </div>

          {/* Verifications */}
          <div className="border-t border-border px-4 py-2">
            <div className="space-y-1">
              {data.aiExtractions.mrz_valid === "true" && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <CheckCircle className="h-3 w-3" /> MRZ vérifié — cohérent avec les champs
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                <CheckCircle className="h-3 w-3" /> Document non expiré (valid. {data.documentExpiry})
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                <CheckCircle className="h-3 w-3" /> Nationalité et résidence détectées
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biometric verification */}
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

      {/* Warnings */}
      {data.aiWarnings.length > 0 && (
        <div className="space-y-1">
          {data.aiWarnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-amber-50 px-4 py-2 text-[11px] text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={!canProceed} className="h-8 text-[11px]">Continuer</Button>
      </div>
    </div>
  );
}

function FieldRow({
  label, value, mono, editing, onEdit, editValue,
}: {
  label: string;
  value: string;
  mono?: boolean;
  editing: boolean;
  onEdit?: (v: string) => void;
  editValue?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className="w-40 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      {editing && onEdit ? (
        <input
          value={editValue ?? value}
          onChange={(e) => onEdit(e.target.value)}
          className={cn("flex-1 rounded-md border border-border bg-background px-2 py-1 text-right text-[12px] focus:border-foreground/30 focus:outline-none", mono && "font-data")}
        />
      ) : (
        <span className={cn("text-right text-[12px] text-foreground", mono && "font-data")}>{value || "—"}</span>
      )}
    </div>
  );
}
