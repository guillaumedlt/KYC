import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield, AlertTriangle } from "lucide-react";
import { PRESET_MATRICES, CATEGORY_LABELS } from "@/lib/risk-matrices";
import { cn } from "@/lib/utils";

export default async function MatrixDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matrix = PRESET_MATRICES.find((m) => m.id === id);
  if (!matrix) notFound();

  // Group factors by category
  const grouped = matrix.factors.reduce<Record<string, typeof matrix.factors>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  const maxWeight = Math.max(...matrix.factors.map((f) => f.weight));

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
        <div className="space-y-5">
          <span className="block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Facteurs de risque ({matrix.factors.length})
          </span>

          {Object.entries(grouped).map(([cat, factors]) => (
            <div key={cat}>
              <span className="mb-2 block text-[11px] font-medium text-foreground">
                {CATEGORY_LABELS[cat]} ({factors.length})
              </span>
              <div className="space-y-1.5">
                {factors.sort((a, b) => b.weight - a.weight).map((f) => (
                  <div key={f.id} className="rounded-md border border-border bg-card px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-8 font-data text-[12px] font-semibold",
                          f.weight >= 25 ? "text-red-600" : f.weight >= 15 ? "text-orange-600" : f.weight >= 10 ? "text-amber-600" : "text-muted-foreground",
                        )}>
                          +{f.weight}
                        </span>
                        <div>
                          <p className="text-[12px] font-medium text-foreground">{f.name}</p>
                          <p className="text-[11px] text-muted-foreground">{f.description}</p>
                        </div>
                      </div>
                      {/* Weight bar */}
                      <div className="hidden w-20 sm:block">
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className={cn("h-1.5 rounded-full",
                            f.weight >= 25 ? "bg-red-500" : f.weight >= 15 ? "bg-orange-500" : f.weight >= 10 ? "bg-amber-500" : "bg-stone-300",
                          )} style={{ width: `${(f.weight / maxWeight) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    {/* Conditions */}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {f.conditions.map((c, i) => (
                        <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Thresholds */}
        <div>
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Seuils de vigilance
          </span>
          <div className="space-y-2">
            {matrix.thresholds.map((t) => (
              <div key={t.level} className={cn(
                "rounded-md border px-4 py-3",
                t.color === "emerald" ? "border-emerald-200 bg-emerald-50/50" :
                t.color === "blue" ? "border-blue-200 bg-blue-50/50" :
                t.color === "orange" ? "border-orange-200 bg-orange-50/50" :
                "border-red-200 bg-red-50/50",
              )}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-foreground">{t.label}</p>
                  <span className="font-data text-[11px] text-muted-foreground">{t.minScore}–{t.maxScore}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Revue : {t.reviewFrequency}</p>
                {t.requiredDocs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.requiredDocs.map((d) => (
                      <span key={d} className="rounded bg-white/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">{d.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Score visualization */}
          <div className="mt-4 rounded-md border border-border bg-card p-4">
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Échelle de score</span>
            <div className="flex h-3 overflow-hidden rounded-full">
              {matrix.thresholds.map((t) => {
                const width = t.maxScore - t.minScore + 1;
                return (
                  <div key={t.level} className={cn("h-full",
                    t.color === "emerald" ? "bg-emerald-400" : t.color === "blue" ? "bg-blue-400" : t.color === "orange" ? "bg-orange-400" : "bg-red-400",
                  )} style={{ width: `${width}%` }} title={`${t.label}: ${t.minScore}-${t.maxScore}`} />
                );
              })}
            </div>
            <div className="mt-1 flex justify-between font-data text-[9px] text-muted-foreground">
              <span>0</span><span>25</span><span>60</span><span>80</span><span>100</span>
            </div>
          </div>

          {/* Entity types */}
          <div className="mt-4">
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">S&apos;applique à</span>
            <div className="flex flex-wrap gap-1">
              {matrix.entityTypes.map((t) => (
                <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-foreground">
                  {t === "person" ? "Personne" : t === "company" ? "Société" : t === "trust" ? "Trust" : "Fondation"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
