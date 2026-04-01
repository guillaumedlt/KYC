import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield, Clock, Eye } from "lucide-react";
import {
  PRESET_MATRICES,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  VIGILANCE_LABELS,
  VIGILANCE_COLORS,
  AMSF_FACTOR_DEFINITIONS,
} from "@/lib/risk-matrices";
import type { RiskLevel } from "@/lib/risk-matrices";
import { cn } from "@/lib/utils";

export default async function MatrixDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matrix = PRESET_MATRICES.find((m) => m.id === id);
  if (!matrix) notFound();

  const overallColors = RISK_LEVEL_COLORS[matrix.overallLevel];
  const vigColors = VIGILANCE_COLORS[matrix.vigilanceLevel];

  return (
    <div>
      <Link href="/risk/matrices" className="mb-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Matrices
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-[28px]">{matrix.icon}</span>
          <div>
            <h1 className="font-heading text-[22px] text-foreground">{matrix.name}</h1>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{matrix.description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Factors */}
        <div className="space-y-4">
          <span className="block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            5 facteurs de risque AMSF/SICCFIN
          </span>

          {matrix.factors.map((factor) => {
            const colors = RISK_LEVEL_COLORS[factor.level];
            const allExamples = AMSF_FACTOR_DEFINITIONS[factor.id].examples;

            return (
              <div key={factor.id} className={cn("rounded-md border bg-card", colors.border)}>
                {/* Factor header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1">
                    <p className="text-[12px] font-medium text-foreground">{factor.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{factor.description}</p>
                  </div>
                  <span className={cn(
                    "ml-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
                    colors.bg, colors.text,
                  )}>
                    <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
                    {RISK_LEVEL_LABELS[factor.level]}
                  </span>
                </div>

                {/* Justification */}
                <div className="border-t px-4 py-3" style={{ borderColor: "inherit" }}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Justification</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">{factor.justification}</p>
                </div>

                {/* Examples for this level */}
                {factor.examples && factor.examples.length > 0 && (
                  <div className="border-t px-4 py-3" style={{ borderColor: "inherit" }}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                      Exemples ({RISK_LEVEL_LABELS[factor.level]})
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {factor.examples.map((ex, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                          <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", colors.dot)} />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3-level scale visualization */}
                <div className="border-t px-4 py-2.5" style={{ borderColor: "inherit" }}>
                  <div className="flex gap-1">
                    {(["faible", "moyen", "eleve"] as RiskLevel[]).map((lvl) => {
                      const isActive = lvl === factor.level;
                      const lvlColors = RISK_LEVEL_COLORS[lvl];
                      return (
                        <div key={lvl} className={cn(
                          "flex-1 rounded py-1 text-center text-[9px] font-medium transition-all",
                          isActive ? cn(lvlColors.bg, lvlColors.text) : "bg-muted/50 text-muted-foreground/40",
                        )}>
                          {RISK_LEVEL_LABELS[lvl]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar: Overall determination */}
        <div className="space-y-4">
          {/* Overall risk level */}
          <div className={cn("rounded-md border p-4", overallColors.border, overallColors.bg)}>
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Niveau de risque global
            </span>
            <div className="flex items-center gap-2">
              <span className={cn("h-3 w-3 rounded-full", overallColors.dot)} />
              <span className={cn("text-[20px] font-semibold", overallColors.text)}>
                {RISK_LEVEL_LABELS[matrix.overallLevel]}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-foreground/70">
              Determine par la combinaison des 5 facteurs AMSF. Si un facteur est Eleve, le niveau global est au minimum Moyen.
            </p>
          </div>

          {/* Vigilance level */}
          <div className={cn("rounded-md border p-4", vigColors.border, vigColors.bg)}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-current opacity-60" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Niveau de vigilance
              </span>
            </div>
            <p className={cn("mt-2 text-[16px] font-semibold", vigColors.text)}>
              {VIGILANCE_LABELS[matrix.vigilanceLevel]}
            </p>
            <p className="mt-1 text-[10px] text-foreground/60">
              {matrix.vigilanceLevel === "simplifiee" && "Mesures allegees conformement a l'Art. 15-1 Loi 1.362"}
              {matrix.vigilanceLevel === "standard" && "Mesures normales conformement a l'Art. 4 Loi 1.362"}
              {matrix.vigilanceLevel === "renforcee" && "Mesures renforcees obligatoires — Art. 15-2 Loi 1.362"}
            </p>
          </div>

          {/* Review frequency */}
          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Frequence de revue
              </span>
            </div>
            <p className="mt-2 text-[16px] font-semibold text-foreground">
              {matrix.reviewFrequency}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Faible = 3 ans · Moyen = 2 ans · Eleve = 1 an
            </p>
          </div>

          {/* Factor summary */}
          <div className="rounded-md border border-border bg-card p-4">
            <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Synthese des facteurs
            </span>
            <div className="space-y-2">
              {matrix.factors.map((f) => {
                const fc = RISK_LEVEL_COLORS[f.level];
                return (
                  <div key={f.id} className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground/80 truncate pr-2">
                      {f.name.split("/")[0].trim()}
                    </span>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium",
                      fc.bg, fc.text,
                    )}>
                      {RISK_LEVEL_LABELS[f.level]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Visual bar */}
            <div className="mt-3 flex gap-0.5">
              {matrix.factors.map((f) => {
                const fc = RISK_LEVEL_COLORS[f.level];
                return (
                  <div key={f.id} className={cn("h-2 flex-1 rounded-full", fc.dot)} />
                );
              })}
            </div>
          </div>

          {/* AMSF reference */}
          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Reference AMSF
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
              Matrice conforme aux lignes directrices AMSF/SICCFIN relatives a l'evaluation des risques BC/FT.
              Les 5 facteurs obligatoires sont evalues selon une approche qualitative a 3 niveaux
              (Loi n° 1.362, Art. 3 et 4).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
