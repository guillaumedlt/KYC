import Link from "next/link";
import { MOCK_ENTITIES, getRiskFactors } from "@/lib/mock-data";
import { RiskBadge } from "@/components/features/status-badge";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

const sorted = [...MOCK_ENTITIES]
  .filter((e) => e.risk_score != null)
  .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));

export default function RiskPage() {
  return (
    <div>
      {/* Distribution */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["critical", "high", "medium", "low"] as const).map((level) => {
          const count = MOCK_ENTITIES.filter((e) => e.risk_level === level).length;
          return (
            <div key={level} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {level === "critical" ? "Critique" : level === "high" ? "Élevé" : level === "medium" ? "Moyen" : "Faible"}
              </span>
              <span className={cn(
                "font-data text-2xl font-semibold",
                level === "critical" ? "text-red-600" : level === "high" ? "text-orange-600" : level === "medium" ? "text-amber-600" : "text-emerald-600",
              )}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="my-6 border-t border-dashed border-border" />

      {/* Entity risk cards */}
      <div className="space-y-4">
        {sorted.map((entity) => {
          const factors = getRiskFactors(entity.id);
          const barWidth = entity.risk_score ?? 0;
          return (
            <div key={entity.id} className="rounded-lg border border-border">
              {/* Entity header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-[12px] font-semibold">
                    {entity.display_name.charAt(0)}
                  </div>
                  <div>
                    <Link href={`/entities/${entity.id}`} className="text-[13px] font-medium text-foreground hover:underline">
                      {entity.display_name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {entity.type === "person" ? "Personne" : "Société"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Score bar */}
                  <div className="hidden w-32 sm:block">
                    <div className="h-1.5 w-full rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          barWidth >= 80 ? "bg-red-500" : barWidth >= 60 ? "bg-orange-500" : barWidth >= 40 ? "bg-amber-500" : "bg-emerald-500",
                        )}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />
                </div>
              </div>

              {/* Factors breakdown */}
              {factors.length > 0 && (
                <div className="border-t border-border bg-secondary/20 px-4 py-2.5">
                  <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                    {factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className={cn(
                          "font-data font-medium",
                          f.impact >= 20 ? "text-red-600" : f.impact >= 10 ? "text-amber-600" : "text-muted-foreground",
                        )}>
                          +{f.impact}
                        </span>
                        <span className="text-muted-foreground">{f.factor}</span>
                        <span className="hidden text-muted-foreground/50 sm:inline">
                          — {f.details}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <span className="font-data text-[11px] text-muted-foreground">{sorted.length} entités évaluées</span>
      </div>
    </div>
  );
}
