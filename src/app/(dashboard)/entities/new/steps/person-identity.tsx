"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, CheckCircle, AlertTriangle, Camera, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Use API route instead of server action (avoids Next.js serialization limit on large base64)
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
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file) return;

    // Validate file
    if (file.size > 20 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 20 Mo)");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez JPG, PNG ou PDF.");
      return;
    }

    update({ documentFile: file });
    setAnalyzing(true);
    setExtracted(false);
    setError(null);

    try {
      const base64 = await fileToBase64(file);

      // Call AI via API route (avoids server action serialization limit)
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 60000));
      const extractPromise = fetch("/api/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "identity", base64, mediaType: file.type }),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      });
      const result = await Promise.race([extractPromise, timeoutPromise]);

      if (result && result.confidence > 0) {
        update({
          nationality: result.nationality ?? "",
          firstName: result.firstName ?? "",
          lastName: result.lastName ?? "",
          dateOfBirth: result.dateOfBirth ?? "",
          documentType: result.documentType ?? "passport",
          documentNumber: result.documentNumber ?? "",
          documentExpiry: result.documentExpiry ?? "",
          aiExtractions: {
            ...data.aiExtractions,
            identity_confidence: String(result.confidence),
            doc_type_detected: result.documentType ?? "unknown",
            nationality_detected: result.nationality ?? "",
            place_of_birth: result.placeOfBirth ?? "",
            gender: result.gender ?? "",
          },
          aiWarnings: result.warnings ?? [],
        });
        setExtracted(true);
      } else {
        // AI failed or timed out — let user fill manually
        setError(result === null
          ? "L'analyse a pris trop de temps. Remplissez manuellement."
          : "L'extraction IA n'a pas pu lire ce document. Remplissez manuellement."
        );
        setEditMode(true);
        setExtracted(true);
        update({
          aiExtractions: { ...data.aiExtractions, identity_confidence: "0" },
        });
      }
    } catch (err) {
      setError("Erreur lors de l'analyse. Remplissez manuellement.");
      setEditMode(true);
      setExtracted(true);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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

      {/* Upload zone */}
      <div
        onClick={() => !analyzing && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-4 rounded-md border-2 border-dashed px-6 py-8 transition-all",
          analyzing ? "cursor-wait border-foreground/30 bg-muted/20" :
          dragOver ? "border-foreground bg-foreground/5 scale-[1.01]" :
          data.documentFile && extracted ? "border-emerald-300 bg-emerald-50/50" :
          "border-border hover:border-foreground/20 hover:bg-muted/10",
        )}
      >
        {analyzing ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">Analyse IA en cours...</p>
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                <p>Lecture du document...</p>
                <p>Extraction des informations...</p>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/60">Peut prendre jusqu&apos;à 15 secondes</p>
            </div>
          </>
        ) : data.documentFile && extracted ? (
          <>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">{data.documentFile.name}</p>
              <p className="mt-0.5 text-[11px] text-emerald-600">Analysé · Cliquez pour remplacer</p>
            </div>
          </>
        ) : dragOver ? (
          <>
            <Upload className="h-8 w-8 text-foreground" />
            <p className="text-[13px] font-medium">Déposez ici</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">Glissez-déposez le document d&apos;identité</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Passeport, carte d&apos;identité ou titre de séjour</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">ou cliquez · JPG, PNG, PDF — max 20 Mo</p>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="hidden" />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 px-4 py-2.5 text-[11px] text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* AI extracted results */}
      {extracted && (
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {data.aiExtractions.identity_confidence !== "0" ? "Extraction IA" : "Saisie manuelle"}
              </span>
              {data.aiExtractions.identity_confidence && data.aiExtractions.identity_confidence !== "0" && (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-data text-[10px] font-medium text-emerald-600">
                  {data.aiExtractions.identity_confidence}%
                </span>
              )}
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

          <div className="divide-y divide-border/50">
            <FieldRow label="Prénom(s)" value={data.firstName} editing={editMode} onEdit={(v) => update({ firstName: v })} />
            <FieldRow label="Nom" value={data.lastName} editing={editMode} onEdit={(v) => update({ lastName: v })} />
            <FieldRow label="Date de naissance" value={data.dateOfBirth} mono editing={editMode} onEdit={(v) => update({ dateOfBirth: v })} />
            {data.aiExtractions.place_of_birth && (
              <FieldRow label="Lieu de naissance" value={data.aiExtractions.place_of_birth} editing={false} />
            )}
            <FieldRow label="Nationalité" value={data.nationality ? (FLAGS[data.nationality] ?? data.nationality) : ""} editing={editMode} onEdit={(v) => update({ nationality: v })} editValue={data.nationality} />
            {data.aiExtractions.gender && (
              <FieldRow label="Sexe" value={data.aiExtractions.gender === "M" ? "Masculin" : data.aiExtractions.gender === "F" ? "Féminin" : data.aiExtractions.gender} editing={false} />
            )}
            <FieldRow label="N° document" value={data.documentNumber} mono editing={editMode} onEdit={(v) => update({ documentNumber: v })} />
            <FieldRow label="Date d'expiration" value={data.documentExpiry} mono editing={editMode} onEdit={(v) => update({ documentExpiry: v })} />
          </div>

          {data.aiExtractions.identity_confidence && data.aiExtractions.identity_confidence !== "0" && (
            <div className="border-t border-border px-4 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                <CheckCircle className="h-3 w-3" /> Document analysé avec succès
              </div>
            </div>
          )}
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
  label: string; value: string; mono?: boolean; editing: boolean;
  onEdit?: (v: string) => void; editValue?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className="w-40 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      {editing && onEdit ? (
        <input value={editValue ?? value} onChange={(e) => onEdit(e.target.value)}
          className={cn("flex-1 rounded-md border border-border bg-background px-2 py-1 text-right text-[12px] focus:border-foreground/30 focus:outline-none", mono && "font-data")} />
      ) : (
        <span className={cn("text-right text-[12px] text-foreground", mono && "font-data")}>{value || "—"}</span>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Direct read — no compression, no canvas issues
    // 780Ko is fine for Claude API (max 20MB)
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
