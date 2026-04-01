import Link from "next/link";
import { ArrowLeft, Plus, Lock } from "lucide-react";
import {
  PRESET_MATRICES,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  VIGILANCE_LABELS,
  VIGILANCE_COLORS,
} from "@/lib/risk-matrices";
import { cn } from "@/lib/utils";

export default function MatricesPage() {
  return (
    <div>
      <Link href="/risk" className="mb-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Risques
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-[22px] text-foreground">Matrices de risque</h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Matrices qualitatives AMSF/SICCFIN. 5 facteurs de risque obligatoires, 3 niveaux d'evaluation (Faible, Moyen, Eleve).
          </p>
        </div>
        <Link href="/risk/matrices/new" className="flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-[11px] font-medium text-background hover:bg-foreground/90">
          <Plus className="h-3 w-3" /> Creer une matrice
        </Link>
      </div>

      {/* Preset matrices */}
      <div className="mb-8">
        <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Matrices predefinies AMSF
        </span>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRESET_MATRICES.map((matrix) => {
            const levelColors = RISK_LEVEL_COLORS[matrix.overallLevel];
            const vigColors = VIGILANCE_COLORS[matrix.vigilanceLevel];
            return (
              <Link
                key={matrix.id}
                href={`/risk/matrices/${matrix.id}`}
                className="group rounded-md border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[20px]">{matrix.icon}</span>
                  <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    <Lock className="h-2.5 w-2.5" /> Predefinie
                  </span>
                </div>
                <h3 className="text-[13px] font-medium text-foreground">{matrix.name}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{matrix.description}</p>

                {/* Overall risk level badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
                    levelColors.bg, levelColors.text,
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", levelColors.dot)} />
                    Risque {RISK_LEVEL_LABELS[matrix.overallLevel]}
                  </span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-medium",
                    vigColors.bg, vigColors.text,
                  )}>
                    {VIGILANCE_LABELS[matrix.vigilanceLevel]}
                  </span>
                </div>

                {/* Factor levels summary */}
                <div className="mt-3 flex gap-1">
                  {matrix.factors.map((f) => {
                    const fc = RISK_LEVEL_COLORS[f.level];
                    return (
                      <div key={f.id} className="group/factor relative flex-1">
                        <div className={cn("h-1.5 rounded-full", fc.dot)} />
                        <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[8px] text-background group-hover/factor:block">
                          {f.name.split("/")[0].trim()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2.5 text-[10px] text-muted-foreground">
                  5 facteurs AMSF · Revue : {matrix.reviewFrequency}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Custom matrices (empty for now) */}
      <div>
        <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Matrices personnalisees
        </span>
        <div className="rounded-md border border-dashed border-border bg-card px-6 py-8 text-center">
          <p className="text-[12px] text-muted-foreground">Aucune matrice personnalisee</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            Creez une matrice adaptee a votre activite specifique
          </p>
        </div>
      </div>
    </div>
  );
}
