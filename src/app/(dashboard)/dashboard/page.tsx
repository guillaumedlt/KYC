import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { getEntities, getCases, getActivities } from "@/lib/supabase/queries";
import { RiskBadge, CaseStatusBadge, KycStatusBadge } from "@/components/features/status-badge";
import type { RiskLevel, KycStatus, CaseStatus } from "@/types";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [entities, cases, activities] = await Promise.all([
    getEntities(), getCases(), getActivities(10),
  ]);

  const openCases = cases.filter((c: Record<string, unknown>) => !["approved", "rejected", "closed"].includes(c.status as string));
  const highRisk = entities.filter((e: Record<string, unknown>) => e.risk_level === "high" || e.risk_level === "critical");
  const deadlines = cases
    .filter((c: Record<string, unknown>) => c.due_date && !["approved", "rejected", "closed"].includes(c.status as string))
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime());

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      <div className="space-y-3">
        {/* Stats */}
        <div className="flex gap-6 border-b border-border pb-2">
          <Stat label="Entités" value={entities.length} />
          <Stat label="Ouverts" value={openCases.length} />
          <Stat label="Risque élevé" value={highRisk.length} color={highRisk.length > 0 ? "text-orange-600" : undefined} />
          <Stat label="Approuvés" value={cases.filter((c: Record<string, unknown>) => c.status === "approved").length} />
        </div>

        {/* Alerts */}
        {(highRisk.length > 0 || deadlines.length > 0) && (
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-orange-600">
              <AlertTriangle className="h-3 w-3" /> À traiter
            </span>
            {highRisk.map((e: Record<string, unknown>) => (
              <Link key={e.id as string} href={`/entities/${e.id}`} className="flex items-center justify-between rounded bg-orange-50 px-3 py-1.5 transition-colors hover:bg-orange-100/80">
                <span className="text-[11px] font-medium text-foreground">{e.display_name as string}</span>
                <RiskBadge level={e.risk_level as RiskLevel} score={e.risk_score as number} />
              </Link>
            ))}
            {deadlines.map((c: Record<string, unknown>) => {
              const entity = entities.find((e: Record<string, unknown>) => e.id === c.entity_id);
              const days = Math.ceil((new Date(c.due_date as string).getTime() - Date.now()) / 86400000);
              return (
                <Link key={c.id as string} href={`/cases/${c.id}`} className="flex items-center justify-between rounded bg-amber-50 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span className="font-data text-[11px] text-foreground">{c.case_number as string}</span>
                    <span className="text-[11px] text-muted-foreground">{(entity as Record<string, unknown>)?.display_name as string}</span>
                  </div>
                  <span className="text-[10px] text-amber-700">{days > 0 ? `${days}j` : "dépassée"}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Entities */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entités</span>
            <Link href="/entities" className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground">Tout <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Nom</th>
                <th className="w-20 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Risque</th>
                <th className="w-20 px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">KYC</th>
              </tr></thead>
              <tbody>
                {entities.slice(0, 5).map((e: Record<string, unknown>) => (
                  <tr key={e.id as string} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-2 py-1.5"><Link href={`/entities/${e.id}`} className="text-[11px] font-medium text-foreground hover:underline">{e.display_name as string}</Link></td>
                    <td className="px-2 py-1.5">{e.risk_level ? <RiskBadge level={e.risk_level as RiskLevel} score={e.risk_score as number} /> : <span className="text-[10px] text-muted-foreground">—</span>}</td>
                    <td className="px-2 py-1.5 text-right"><KycStatusBadge status={e.kyc_status as KycStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline */}
        <div>
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pipeline</span>
          <div className="flex gap-1">
            {[
              { label: "Attente", keys: ["open"] },
              { label: "Docs", keys: ["documents_pending"] },
              { label: "Screen", keys: ["screening"] },
              { label: "Revue", keys: ["risk_review", "pending_decision"] },
              { label: "Fait", keys: ["approved", "rejected", "closed"] },
            ].map((s) => (
              <div key={s.label} className="flex flex-1 flex-col items-center rounded border border-border py-2">
                <span className="font-data text-[14px] font-semibold">{cases.filter((c: Record<string, unknown>) => s.keys.includes(c.status as string)).length}</span>
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity sidebar */}
      <div className="border-l border-border pl-3">
        <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Activité</span>
        {activities.map((a: Record<string, unknown>) => (
          <div key={a.id as string} className="border-b border-border/50 py-1.5 last:border-0">
            <p className="text-[11px] text-foreground">{a.title as string}</p>
            <p className="text-[10px] text-muted-foreground">
              {(a.entities as Record<string, unknown>)?.display_name as string}
              {a.agent_id != null ? <span className="ml-1 rounded bg-muted px-0.5 py-px text-[8px]">IA</span> : null}
            </p>
            <p className="font-data text-[9px] text-muted-foreground/50">{new Date(a.created_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div><span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span><p className={cn("font-data text-[18px] font-semibold", color ?? "text-foreground")}>{value}</p></div>;
}
