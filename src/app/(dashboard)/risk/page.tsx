import Link from "next/link";
import { getEntities } from "@/lib/supabase/queries";
import { getRiskFactors } from "@/lib/mock-data";
import { RiskBadge } from "@/components/features/status-badge";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

export default async function RiskPage() {
  const entities = await getEntities();
  const sorted = [...entities]
    .filter((e: Record<string, unknown>) => e.risk_score != null)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.risk_score as number) - (a.risk_score as number));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["critical", "high", "medium", "low"] as const).map((lvl) => {
          const n = entities.filter((e: Record<string, unknown>) => e.risk_level === lvl).length;
          const color = lvl === "critical" ? "text-red-600" : lvl === "high" ? "text-orange-600" : lvl === "medium" ? "text-amber-600" : "text-emerald-600";
          const label = lvl === "critical" ? "Critique" : lvl === "high" ? "Élevé" : lvl === "medium" ? "Moyen" : "Faible";
          return (
            <div key={lvl} className="rounded-md border border-border bg-card px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
              <p className={cn("mt-1 font-data text-[24px] font-semibold leading-none", color)}>{n}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {sorted.map((entity: Record<string, unknown>) => {
          const factors = getRiskFactors(entity.id as string);
          const w = entity.risk_score as number;
          return (
            <div key={entity.id as string} className="rounded-md border border-border bg-card">
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Link href={`/entities/${entity.id}`} className="text-[12px] font-medium text-foreground hover:underline">{entity.display_name as string}</Link>
                  <span className="text-[11px] text-muted-foreground">{(entity.type as string) === "person" ? "Personne" : "Société"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden h-1.5 w-24 rounded-full bg-muted sm:block">
                    <div className={cn("h-1.5 rounded-full", w >= 80 ? "bg-red-500" : w >= 60 ? "bg-orange-500" : w >= 40 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${w}%` }} />
                  </div>
                  <RiskBadge level={entity.risk_level as RiskLevel} score={w} />
                </div>
              </div>
              {factors.length > 0 && (
                <div className="border-t border-border px-4 py-2">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {factors.map((f, i) => (
                      <span key={i} className="text-[11px] text-muted-foreground">
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
