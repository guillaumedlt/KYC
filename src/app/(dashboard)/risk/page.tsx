import Link from "next/link";
import { MOCK_ENTITIES, getRiskFactors } from "@/lib/mock-data";
import { RiskBadge } from "@/components/features/status-badge";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

const sorted = [...MOCK_ENTITIES].filter((e) => e.risk_score != null).sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));

export default function RiskPage() {
  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b border-border pb-2">
        {(["critical", "high", "medium", "low"] as const).map((lvl) => {
          const n = MOCK_ENTITIES.filter((e) => e.risk_level === lvl).length;
          const color = lvl === "critical" ? "text-red-600" : lvl === "high" ? "text-orange-600" : lvl === "medium" ? "text-amber-600" : "text-emerald-600";
          const label = lvl === "critical" ? "Critique" : lvl === "high" ? "Élevé" : lvl === "medium" ? "Moyen" : "Faible";
          return <div key={lvl}><span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span><p className={cn("font-data text-[18px] font-semibold", color)}>{n}</p></div>;
        })}
      </div>

      <div className="space-y-1">
        {sorted.map((entity) => {
          const factors = getRiskFactors(entity.id);
          const w = entity.risk_score ?? 0;
          return (
            <div key={entity.id} className="rounded border border-border">
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Link href={`/entities/${entity.id}`} className="text-[11px] font-medium text-foreground hover:underline">{entity.display_name}</Link>
                  <span className="text-[10px] text-muted-foreground">{entity.type === "person" ? "Personne" : "Société"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden h-1 w-20 rounded-full bg-muted sm:block">
                    <div className={cn("h-1 rounded-full", w >= 80 ? "bg-red-500" : w >= 60 ? "bg-orange-500" : w >= 40 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${w}%` }} />
                  </div>
                  <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />
                </div>
              </div>
              {factors.length > 0 && (
                <div className="border-t border-border bg-muted/30 px-3 py-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {factors.map((f, i) => (
                      <span key={i} className="text-[10px] text-muted-foreground">
                        <span className={cn("font-data font-medium", f.impact >= 20 ? "text-red-600" : f.impact >= 10 ? "text-amber-600" : "text-muted-foreground")}>+{f.impact}</span> {f.factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
