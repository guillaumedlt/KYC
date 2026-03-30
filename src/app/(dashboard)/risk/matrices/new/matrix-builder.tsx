"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_LABELS } from "@/lib/risk-matrices";
import { cn } from "@/lib/utils";

interface FactorDraft {
  id: string;
  category: string;
  name: string;
  description: string;
  weight: number;
  conditions: string;
}

interface ThresholdDraft {
  level: string;
  label: string;
  minScore: number;
  maxScore: number;
  reviewFrequency: string;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS);

const DEFAULT_THRESHOLDS: ThresholdDraft[] = [
  { level: "simplified", label: "Simplifiée", minScore: 0, maxScore: 25, reviewFrequency: "Tous les 3 ans" },
  { level: "standard", label: "Standard", minScore: 26, maxScore: 59, reviewFrequency: "Annuelle" },
  { level: "enhanced", label: "Renforcée", minScore: 60, maxScore: 79, reviewFrequency: "Semestrielle" },
  { level: "prohibited", label: "Interdite", minScore: 80, maxScore: 100, reviewFrequency: "Rejet" },
];

const ENTITY_TYPES = [
  { value: "person", label: "Personne" },
  { value: "company", label: "Société" },
  { value: "trust", label: "Trust" },
  { value: "foundation", label: "Fondation" },
];

export function MatrixBuilder() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📋");
  const [entityTypes, setEntityTypes] = useState<string[]>(["person", "company"]);
  const [factors, setFactors] = useState<FactorDraft[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdDraft[]>(DEFAULT_THRESHOLDS);

  function addFactor() {
    setFactors([...factors, {
      id: `f-${Date.now()}`,
      category: "client",
      name: "",
      description: "",
      weight: 10,
      conditions: "",
    }]);
  }

  function updateFactor(id: string, field: keyof FactorDraft, value: string | number) {
    setFactors(factors.map((f) => f.id === id ? { ...f, [field]: value } : f));
  }

  function removeFactor(id: string) {
    setFactors(factors.filter((f) => f.id !== id));
  }

  function updateThreshold(index: number, field: keyof ThresholdDraft, value: string | number) {
    const updated = [...thresholds];
    updated[index] = { ...updated[index], [field]: value };
    setThresholds(updated);
  }

  function toggleEntityType(type: string) {
    setEntityTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  }

  function handleSave() {
    if (!name || factors.length === 0) return;
    setSaving(true);
    // TODO: persist to Supabase (for now, save to localStorage as demo)
    const matrix = {
      id: `matrix-custom-${Date.now()}`,
      name,
      description,
      icon,
      isPreset: false,
      entityTypes,
      factors: factors.map((f) => ({
        id: f.id,
        category: f.category,
        name: f.name,
        description: f.description,
        weight: f.weight,
        conditions: f.conditions.split(",").map((c) => c.trim()).filter(Boolean),
      })),
      thresholds: thresholds.map((t) => ({
        ...t,
        requiredDocs: [],
        color: t.level === "simplified" ? "emerald" : t.level === "standard" ? "blue" : t.level === "enhanced" ? "orange" : "red",
      })),
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("custom_matrices") ?? "[]");
    existing.push(matrix);
    localStorage.setItem("custom_matrices", JSON.stringify(existing));
    setSaving(false);
    router.push("/risk/matrices");
  }

  const totalMaxWeight = factors.reduce((s, f) => s + f.weight, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/risk/matrices" className="mb-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Matrices
      </Link>

      <h1 className="mb-1 font-heading text-[22px] text-foreground">Nouvelle matrice de risque</h1>
      <p className="mb-6 text-[12px] text-muted-foreground">Définissez les facteurs de risque, leurs poids et les seuils de vigilance.</p>

      <div className="space-y-6">
        {/* General info */}
        <section className="rounded-md border border-border bg-card p-4">
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Informations</span>
          <div className="grid grid-cols-[60px_1fr] gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Icône</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="h-9 text-center text-[18px]" maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Nom de la matrice</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Crypto-actifs Monaco" className="h-9 text-[12px]" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label className="text-[11px]">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Focus sur..." className="h-9 text-[12px]" />
          </div>
          <div className="mt-3 space-y-1.5">
            <Label className="text-[11px]">S&apos;applique à</Label>
            <div className="flex gap-2">
              {ENTITY_TYPES.map((et) => (
                <button key={et.value} onClick={() => toggleEntityType(et.value)}
                  className={cn("rounded-md border px-3 py-1.5 text-[11px] transition-all",
                    entityTypes.includes(et.value) ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/20")}>
                  {et.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Factors */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Facteurs de risque ({factors.length})</span>
              {totalMaxWeight > 0 && <span className="ml-2 font-data text-[10px] text-muted-foreground">Poids total max: {totalMaxWeight}</span>}
            </div>
            <Button size="sm" variant="outline" onClick={addFactor} className="h-7 rounded-md px-2 text-[11px]">
              <Plus className="mr-1 h-3 w-3" /> Ajouter un facteur
            </Button>
          </div>

          {factors.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-card px-6 py-8 text-center">
              <p className="text-[12px] text-muted-foreground">Aucun facteur défini</p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">Ajoutez les critères de risque et leur pondération</p>
              <Button size="sm" variant="outline" onClick={addFactor} className="mt-3 h-7 rounded-md px-3 text-[11px]">
                <Plus className="mr-1 h-3 w-3" /> Premier facteur
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {factors.map((f) => (
                <div key={f.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/30" />
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-[120px_1fr_60px] gap-2">
                        <select value={f.category} onChange={(e) => updateFactor(f.id, "category", e.target.value)}
                          className="h-8 rounded-md border border-border bg-background px-2 text-[11px] focus:border-foreground/30 focus:outline-none">
                          {CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <Input value={f.name} onChange={(e) => updateFactor(f.id, "name", e.target.value)} placeholder="Nom du facteur" className="h-8 text-[11px]" />
                        <div className="relative">
                          <Input type="number" min={0} max={30} value={f.weight} onChange={(e) => updateFactor(f.id, "weight", parseInt(e.target.value) || 0)} className="h-8 pr-6 font-data text-[11px]" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">pts</span>
                        </div>
                      </div>
                      <Input value={f.description} onChange={(e) => updateFactor(f.id, "description", e.target.value)} placeholder="Description" className="h-7 text-[10px]" />
                      <Input value={f.conditions} onChange={(e) => updateFactor(f.id, "conditions", e.target.value)} placeholder="Conditions (séparées par des virgules)" className="h-7 text-[10px]" />
                    </div>
                    <button onClick={() => removeFactor(f.id)} className="mt-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Thresholds */}
        <section className="rounded-md border border-border bg-card p-4">
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Seuils de vigilance</span>
          <div className="space-y-2">
            {thresholds.map((t, i) => (
              <div key={t.level} className={cn("flex items-center gap-3 rounded-md px-3 py-2",
                t.level === "simplified" ? "bg-emerald-50/50" : t.level === "standard" ? "bg-blue-50/50" : t.level === "enhanced" ? "bg-orange-50/50" : "bg-red-50/50",
              )}>
                <span className="w-20 text-[11px] font-medium">{t.label}</span>
                <div className="flex items-center gap-1">
                  <Input type="number" min={0} max={100} value={t.minScore} onChange={(e) => updateThreshold(i, "minScore", parseInt(e.target.value) || 0)} className="h-7 w-14 font-data text-[11px]" />
                  <span className="text-[10px] text-muted-foreground">—</span>
                  <Input type="number" min={0} max={100} value={t.maxScore} onChange={(e) => updateThreshold(i, "maxScore", parseInt(e.target.value) || 0)} className="h-7 w-14 font-data text-[11px]" />
                </div>
                <Input value={t.reviewFrequency} onChange={(e) => updateThreshold(i, "reviewFrequency", e.target.value)} className="h-7 flex-1 text-[11px]" />
              </div>
            ))}
          </div>

          {/* Score bar preview */}
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
            {thresholds.map((t) => (
              <div key={t.level} className={cn("h-full",
                t.level === "simplified" ? "bg-emerald-400" : t.level === "standard" ? "bg-blue-400" : t.level === "enhanced" ? "bg-orange-400" : "bg-red-400",
              )} style={{ width: `${t.maxScore - t.minScore + 1}%` }} />
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-between border-t border-border pt-4">
          <Link href="/risk/matrices" className="text-[11px] text-muted-foreground hover:text-foreground">Annuler</Link>
          <Button size="sm" onClick={handleSave} disabled={!name || factors.length === 0 || saving} className="h-8 text-[11px]">
            {saving && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            Créer la matrice
          </Button>
        </div>
      </div>
    </div>
  );
}
