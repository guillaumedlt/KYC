"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Upload,
  FileText,
  Sparkles,
  PenLine,
  User,
  Building2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "ai" | "manual";
type EntityKind = "person" | "company";

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.webp";

export function CreateEntityDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("ai");
  const [kind, setKind] = useState<EntityKind>("person");
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }

  function handleAnalyze() {
    setAnalyzing(true);
    // TODO: Upload to Supabase Storage → trigger Claude extraction
    setTimeout(() => {
      setAnalyzing(false);
      setOpen(false);
      router.push("/entities");
    }, 2000);
  }

  function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: Server action → Supabase insert
    setOpen(false);
    router.push("/entities");
  }

  function resetState() {
    setMode("ai");
    setKind("person");
    setFiles([]);
    setAnalyzing(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" className="h-6 rounded px-2 text-[10px]">
            <Plus className="mr-1 h-3 w-3" />
            Ajouter
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">
            Nouvelle entité
          </DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setMode("ai")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] transition-all",
              mode === "ai"
                ? "bg-foreground font-medium text-background"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Sparkles className="h-3 w-3" />
            Extraction IA
          </button>
          <button
            onClick={() => setMode("manual")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] transition-all",
              mode === "manual"
                ? "bg-foreground font-medium text-background"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <PenLine className="h-3 w-3" />
            Saisie manuelle
          </button>
        </div>

        {/* ====================== AI MODE ====================== */}
        {mode === "ai" && (
          <div className="space-y-4 pt-2">
            <p className="text-[12px] text-muted-foreground">
              Déposez un passeport, carte d&apos;identité, Kbis ou extrait de registre.
              L&apos;IA extraira automatiquement les informations.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border px-6 py-8 transition-colors hover:border-foreground/20 hover:bg-secondary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-foreground">
                  Glissez vos documents ici
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  PDF, JPG, PNG — max 20 Mo par fichier
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[12px] text-foreground">{file.name}</span>
                      <span className="font-data text-[10px] text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} Ko
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <DialogClose render={<Button variant="ghost" size="sm" className="h-6 text-[10px]" />}>
                Annuler
              </DialogClose>
              <Button
                onClick={handleAnalyze}
                disabled={files.length === 0 || analyzing}
                size="sm"
                className="h-6 text-[10px]"
              >
                {analyzing ? (
                  <>
                    <span className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    Analyser ({files.length} {files.length === 1 ? "fichier" : "fichiers"})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ====================== MANUAL MODE ====================== */}
        {mode === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-5 pt-2">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind("person")}
                className={cn(
                  "flex items-center gap-2.5 rounded border px-3 py-2 text-left text-[11px] transition-all",
                  kind === "person"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                <User className="h-4 w-4" />
                <div>
                  <p className="font-medium">Personne</p>
                  <p className="text-[11px] opacity-70">Physique</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setKind("company")}
                className={cn(
                  "flex items-center gap-2.5 rounded border px-3 py-2 text-left text-[11px] transition-all",
                  kind === "company"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                <Building2 className="h-4 w-4" />
                <div>
                  <p className="font-medium">Société</p>
                  <p className="text-[11px] opacity-70">Morale</p>
                </div>
              </button>
            </div>

            {/* Person fields */}
            {kind === "person" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[12px]">Prénom</Label>
                  <Input id="firstName" placeholder="Jean-Pierre" required className="h-7 text-[11px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[12px]">Nom</Label>
                  <Input id="lastName" placeholder="Moretti" required className="h-7 text-[11px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nationality" className="text-[12px]">Nationalité</Label>
                  <Input id="nationality" placeholder="FR" className="h-7 text-[11px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="residence" className="text-[12px]">Résidence</Label>
                  <Input id="residence" placeholder="MC" className="h-7 text-[11px]" />
                </div>
              </div>
            )}

            {/* Company fields */}
            {kind === "company" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="legalName" className="text-[12px]">Raison sociale</Label>
                  <Input id="legalName" placeholder="Monaco Trading SAM" required className="h-7 text-[11px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="regNumber" className="text-[12px]">N° registre</Label>
                  <Input id="regNumber" placeholder="RC 2024B..." className="h-9 font-data text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jurisdiction" className="text-[12px]">Juridiction</Label>
                  <Input id="jurisdiction" placeholder="MC" className="h-7 text-[11px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyType" className="text-[12px]">Forme</Label>
                  <Input id="companyType" placeholder="SAM, SARL, SCI..." className="h-7 text-[11px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="industry" className="text-[12px]">Secteur</Label>
                  <Input id="industry" placeholder="Finance, Immobilier..." className="h-7 text-[11px]" />
                </div>
              </div>
            )}

            {/* Document upload in manual mode */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">
                Documents <span className="text-muted-foreground">(optionnel)</span>
              </Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-[12px] text-muted-foreground transition-colors hover:border-foreground/20"
              >
                <Upload className="h-3.5 w-3.5" />
                Ajouter des pièces justificatives
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                onChange={handleFiles}
                className="hidden"
              />
              {files.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {files.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="flex items-center justify-between rounded bg-secondary/50 px-2 py-1">
                      <span className="text-[11px] text-foreground">{file.name}</span>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <DialogClose render={<Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" />}>
                Annuler
              </DialogClose>
              <Button type="submit" size="sm" className="h-6 text-[10px]">
                Créer l&apos;entité
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
