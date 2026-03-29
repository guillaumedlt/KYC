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
    <div className="w-full">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <StatCard label="Entités" value={entities.length} />
        <StatCard label="Dossiers ouverts" value={openCases.length} />
        <StatCard label="Risque élevé" value={highRisk.length} accent={highRisk.length > 0} />
        <StatCard label="Approuvés" value={cases.filter((c: Record<string, unknown>) => c.status === "approved").length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {/* Alerts */}
          {(highRisk.length > 0 || deadlines.length > 0) && (
            <section>
              <SectionTitle icon={AlertTriangle} label="À traiter" accent />
              <div className="mt-2 space-y-1.5">
                {highRisk.map((e: Record<string, unknown>) => (
                  <Link key={e.id as string} href={`/entities/${e.id}`} className="flex items-center justify-between rounded-md bg-orange-50/80 px-4 py-2.5 transition-colors hover:bg-orange-50">
                    <span className="text-[12px] font-medium text-foreground">{e.display_name as string}</span>
                    <RiskBadge level={e.risk_level as RiskLevel} score={e.risk_score as number} />
                  </Link>
                ))}
                {deadlines.map((c: Record<string, unknown>) => {
                  const entity = entities.find((e: Record<string, unknown>) => e.id === c.entity_id);
                  const days = Math.ceil((new Date(c.due_date as string).getTime() - Date.now()) / 86400000);
                  return (
                    <Link key={c.id as string} href={`/cases/${c.id}`} className="flex items-center justify-between rounded-md bg-amber-50/80 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span className="font-data text-[12px] text-foreground">{c.case_number as string}</span>
                        <span className="text-[12px] text-muted-foreground">{(entity as Record<string, unknown>)?.display_name as string}</span>
                      </div>
                      <span className="text-[11px] text-amber-700">{days > 0 ? `${days}j` : "dépassée"}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Pipeline */}
          <section>
            <SectionTitle label="Pipeline KYC" />
            <div className="mt-2 flex gap-2">
              {[
                { label: "Attente", keys: ["open"] },
                { label: "Documents", keys: ["documents_pending"] },
                { label: "Screening", keys: ["screening"] },
                { label: "Revue", keys: ["risk_review", "pending_decision"] },
                { label: "Terminé", keys: ["approved", "rejected", "closed"] },
              ].map((s) => (
                <div key={s.label} className="flex flex-1 flex-col items-center rounded-md border border-border bg-card px-3 py-3">
                  <span className="font-data text-[16px] font-semibold">{cases.filter((c: Record<string, unknown>) => s.keys.includes(c.status as string)).length}</span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Entities */}
          <section>
            <div className="flex items-center justify-between">
              <SectionTitle label="Entités récentes" />
              <Link href="/entities" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">Tout voir <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="mt-2 overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Nom</th>
                  <th className="w-24 px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Risque</th>
                  <th className="w-24 px-4 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">KYC</th>
                </tr></thead>
                <tbody>
                  {entities.slice(0, 5).map((e: Record<string, unknown>) => (
                    <tr key={e.id as string} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2.5"><Link href={`/entities/${e.id}`} className="text-[12px] font-medium text-foreground hover:underline">{e.display_name as string}</Link></td>
                      <td className="px-4 py-2.5">{e.risk_level ? <RiskBadge level={e.risk_level as RiskLevel} score={e.risk_score as number} /> : <span className="text-[11px] text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-2.5 text-right"><KycStatusBadge status={e.kyc_status as KycStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Activity */}
        <aside>
          <SectionTitle label="Activité récente" />
          <div className="mt-2 space-y-0">
            {activities.map((a: Record<string, unknown>) => (
              <div key={a.id as string} className="border-b border-border/40 py-2.5 last:border-0">
                <p className="text-[11px] text-foreground">{a.title as string}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {(a.entities as Record<string, unknown>)?.display_name as string}
                  {a.agent_id != null ? <span className="ml-1.5 rounded-sm bg-muted px-1 py-px text-[8px]">IA</span> : null}
                </p>
                <p className="mt-0.5 font-data text-[9px] text-muted-foreground/50">{new Date(a.created_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-data text-[24px] font-semibold leading-none", accent ? "text-orange-600" : "text-foreground")}>{value}</p>
    </div>
  );
}

function SectionTitle({ label, icon: Icon, accent }: { label: string; icon?: typeof AlertTriangle; accent?: boolean }) {
  return (
    <span className={cn("flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em]", accent ? "text-orange-600" : "text-muted-foreground")}>
      {Icon && <Icon className="h-3 w-3" />}{label}
    </span>
  );
}
