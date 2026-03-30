import Link from "next/link";
import { ArrowLeft, Plus, Lock } from "lucide-react";
import { PRESET_MATRICES, CATEGORY_LABELS } from "@/lib/risk-matrices";
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
            Sélectionnez une matrice prédéfinie ou créez une matrice personnalisée. Chaque matrice définit les facteurs de risque, leurs poids et les seuils de vigilance.
          </p>
        </div>
        <Link href="/risk/matrices/new" className="flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-[11px] font-medium text-background hover:bg-foreground/90">
          <Plus className="h-3 w-3" /> Créer une matrice
        </Link>
      </div>

      {/* Preset matrices */}
      <div className="mb-8">
        <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Matrices prédéfinies AMSF
        </span>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRESET_MATRICES.map((matrix) => (
            <Link
              key={matrix.id}
              href={`/risk/matrices/${matrix.id}`}
              className="group rounded-md border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[20px]">{matrix.icon}</span>
                <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" /> Prédéfinie
                </span>
              </div>
              <h3 className="text-[13px] font-medium text-foreground">{matrix.name}</h3>
              <p className="mt-1 text-[11px] text-muted-foreground">{matrix.description}</p>

              <div className="mt-3 flex items-center gap-3">
                <span className="font-data text-[11px] text-muted-foreground">{matrix.factors.length} facteurs</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="font-data text-[11px] text-muted-foreground">{matrix.thresholds.length} seuils</span>
              </div>

              {/* Factor categories breakdown */}
              <div className="mt-3 flex flex-wrap gap-1">
                {Object.entries(
                  matrix.factors.reduce<Record<string, number>>((acc, f) => {
                    acc[f.category] = (acc[f.category] ?? 0) + 1;
                    return acc;
                  }, {}),
                ).map(([cat, count]) => (
                  <span key={cat} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    {CATEGORY_LABELS[cat]} ({count})
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Custom matrices (empty for now) */}
      <div>
        <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Matrices personnalisées
        </span>
        <div className="rounded-md border border-dashed border-border bg-card px-6 py-8 text-center">
          <p className="text-[12px] text-muted-foreground">Aucune matrice personnalisée</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            Créez une matrice adaptée à votre activité spécifique
          </p>
        </div>
      </div>
    </div>
  );
}
