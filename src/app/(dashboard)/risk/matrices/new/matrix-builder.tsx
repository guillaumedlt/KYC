"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AMSF_FACTOR_IDS,
  AMSF_FACTOR_DEFINITIONS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  VIGILANCE_LABELS,
  VIGILANCE_COLORS,
  computeOverallLevel,
  riskLevelToVigilance,
  riskLevelToReviewFrequency,
} from "@/lib/risk-matrices";
import type { RiskLevel, AmsfFactorId } from "@/lib/risk-matrices";
import { cn } from "@/lib/utils";

interface FactorDraft {
  id: AmsfFactorId;
  level: RiskLevel;
  justification: string;
}

const RISK_LEVELS: RiskLevel[] = ["faible", "moyen", "eleve"];

const SECTORS = [
  { value: "immobilier", label: "Immobilier" },
  { value: "societe", label: "Creation de societe" },
  { value: "patrimoine", label: "Gestion de patrimoine" },
  { value: "banque", label: "Banque privee" },
  { value: "trust", label: "Trust & Fondation" },
  { value: "crypto", label: "Crypto-actifs" },
  { value: "assurance", label: "Assurance" },
  { value: "autre", label: "Autre" },
];

export function MatrixBuilder() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📋");
  const [sector, setSector] = useState("autre");
  const [expandedFactor, setExpandedFactor] = useState<AmsfFactorId | null>(AMSF_FACTOR_IDS[0]);

  const [factors, setFactors] = useState<FactorDraft[]>(
    AMSF_FACTOR_IDS.map((id) => ({
      id,
      level: "moyen" as RiskLevel,
      justification: "",
    }))
  );

  function updateFactor(id: AmsfFactorId, field: keyof Omit<FactorDraft, "id">, value: string) {
    setFactors(factors.map((f) =>
      f.id === id ? { ...f, [field]: value } : f
    ));
  }

  const overallLevel = useMemo(
    () => computeOverallLevel(factors),
    [factors]
  );

  const vigilanceLevel = riskLevelToVigilance(overallLevel);
  const reviewFrequency = riskLevelToReviewFrequency(overallLevel);
  const overallColors = RISK_LEVEL_COLORS[overallLevel];
  const vigColors = VIGILANCE_COLORS[vigilanceLevel];

  const allJustified = factors.every((f) => f.justification.trim().length >= 10);

  function handleSave() {
    if (!name || !allJustified) return;
    setSaving(true);
    const matrix = {
      id: `matrix-custom-${Date.now()}`,
      name,
      description,
      icon,
      sector,
      isPreset: false,
      factors: factors.map((f) => {
        const def = AMSF_FACTOR_DEFINITIONS[f.id];
        return {
          id: f.id,
          name: def.name,
          description: def.description,
          level: f.level,
          justification: f.justification,
          examples: def.examples[f.level],
        };
      }),
      overallLevel,
      vigilanceLevel,
      reviewFrequency,
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("custom_matrices") ?? "[]");
    existing.push(matrix);
    localStorage.setItem("custom_matrices", JSON.stringify(existing));
    setSaving(false);
    router.push("/risk/matrices");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/risk/matrices" className="mb-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Matrices
      </Link>

      <h1 className="mb-1 font-heading text-[22px] text-foreground">Nouvelle matrice de risque</h1>
      <p className="mb-6 text-[12px] text-muted-foreground">
        Evaluez les 5 facteurs de risque obligatoires AMSF/SICCFIN. Pour chaque facteur, selectionnez un niveau (Faible, Moyen, Eleve) et justifiez votre evaluation.
      </p>

      <div className="space-y-6">
        {/* General info */}
        <section className="rounded-md border border-border bg-card p-4">
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Informations generales</span>
          <div className="grid grid-cols-[60px_1fr] gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Icone</Label>
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
            <Label className="text-[11px]">Secteur d&apos;activite</Label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-[12px] focus:border-foreground/30 focus:outline-none"
            >
              {SECTORS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* 5 AMSF Factors */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              5 facteurs de risque AMSF ({factors.filter((f) => f.justification.trim().length >= 10).length}/5 justifies)
            </span>
          </div>

          <div className="space-y-2">
            {factors.map((f) => {
              const def = AMSF_FACTOR_DEFINITIONS[f.id];
              const colors = RISK_LEVEL_COLORS[f.level];
              const isExpanded = expandedFactor === f.id;
              const isJustified = f.justification.trim().length >= 10;

              return (
                <div key={f.id} className={cn(
                  "rounded-md border bg-card transition-all",
                  isJustified ? colors.border : "border-border",
                )}>
                  {/* Factor header — clickable */}
                  <button
                    onClick={() => setExpandedFactor(isExpanded ? null : f.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-foreground">{def.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{def.description}</p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
                        colors.bg, colors.text,
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                        {RISK_LEVEL_LABELS[f.level]}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: "inherit" }}>
                      {/* Level selector */}
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Niveau de risque</Label>
                        <div className="mt-1.5 flex gap-1.5">
                          {RISK_LEVELS.map((lvl) => {
                            const lvlColors = RISK_LEVEL_COLORS[lvl];
                            const isActive = f.level === lvl;
                            return (
                              <button
                                key={lvl}
                                onClick={() => updateFactor(f.id, "level", lvl)}
                                className={cn(
                                  "flex-1 rounded-md border py-2 text-center text-[11px] font-medium transition-all",
                                  isActive
                                    ? cn(lvlColors.bg, lvlColors.text, lvlColors.border)
                                    : "border-border text-muted-foreground hover:border-foreground/20",
                                )}
                              >
                                {RISK_LEVEL_LABELS[lvl]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Examples for the selected level */}
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">
                          Exemples AMSF ({RISK_LEVEL_LABELS[f.level]})
                        </Label>
                        <ul className="mt-1 space-y-0.5">
                          {def.examples[f.level].map((ex, i) => (
                            <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                              <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", colors.dot)} />
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Justification */}
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">
                          Justification (obligatoire, min. 10 car.)
                        </Label>
                        <textarea
                          value={f.justification}
                          onChange={(e) => updateFactor(f.id, "justification", e.target.value)}
                          placeholder="Expliquez pourquoi ce niveau de risque a ete retenu pour ce facteur..."
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-[11px] leading-relaxed focus:border-foreground/30 focus:outline-none"
                          rows={3}
                        />
                        {f.justification.length > 0 && f.justification.length < 10 && (
                          <p className="mt-1 text-[10px] text-red-500">Minimum 10 caracteres requis</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Overall determination (auto-computed) */}
        <section className="rounded-md border border-border bg-card p-4">
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Determination automatique
          </span>

          <div className="grid grid-cols-3 gap-3">
            <div className={cn("rounded-md border p-3", overallColors.border, overallColors.bg)}>
              <p className="text-[10px] text-muted-foreground">Risque global</p>
              <p className={cn("mt-1 text-[16px] font-semibold", overallColors.text)}>
                {RISK_LEVEL_LABELS[overallLevel]}
              </p>
            </div>
            <div className={cn("rounded-md border p-3", vigColors.border, vigColors.bg)}>
              <p className="text-[10px] text-muted-foreground">Vigilance</p>
              <p className={cn("mt-1 text-[16px] font-semibold", vigColors.text)}>
                {VIGILANCE_LABELS[vigilanceLevel]}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-[10px] text-muted-foreground">Revue</p>
              <p className="mt-1 text-[16px] font-semibold text-foreground">
                {reviewFrequency}
              </p>
            </div>
          </div>

          {/* Factor visualization */}
          <div className="mt-3 flex gap-0.5">
            {factors.map((f) => {
              const fc = RISK_LEVEL_COLORS[f.level];
              return (
                <div key={f.id} className={cn("h-2 flex-1 rounded-full", fc.dot)} title={AMSF_FACTOR_DEFINITIONS[f.id].name} />
              );
            })}
          </div>

          <p className="mt-2 text-[10px] text-muted-foreground">
            Regle AMSF : si un facteur est Eleve, le risque global est au minimum Moyen. Si 2+ facteurs sont Eleve, le risque global est Eleve.
          </p>
        </section>

        {/* Actions */}
        <div className="flex justify-between border-t border-border pt-4">
          <Link href="/risk/matrices" className="text-[11px] text-muted-foreground hover:text-foreground">Annuler</Link>
          <Button size="sm" onClick={handleSave} disabled={!name || !allJustified || saving} className="h-8 text-[11px]">
            {saving && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            Creer la matrice
          </Button>
        </div>
      </div>
    </div>
  );
}
