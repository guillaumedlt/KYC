import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { MOCK_ENTITIES, MOCK_CASES, MOCK_ACTIVITIES } from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge, CaseStatusBadge } from "@/components/features/status-badge";
import type { RiskLevel } from "@/types";

// What matters to a compliance officer every morning
const openCases = MOCK_CASES.filter(
  (c) => !["approved", "rejected", "closed"].includes(c.status),
);
const highRiskEntities = MOCK_ENTITIES.filter(
  (e) => e.risk_level === "high" || e.risk_level === "critical",
);
const upcomingDeadlines = MOCK_CASES
  .filter((c) => c.due_date && !["approved", "rejected", "closed"].includes(c.status))
  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

const stats = [
  { label: "Entités", value: MOCK_ENTITIES.length },
  { label: "Dossiers ouverts", value: openCases.length },
  { label: "Risque élevé", value: highRiskEntities.length },
  { label: "Approuvés", value: MOCK_CASES.filter((c) => c.status === "approved").length },
];

const PIPELINE = [
  { label: "En attente", keys: ["open"] },
  { label: "Documents", keys: ["documents_pending"] },
  { label: "Screening", keys: ["screening"] },
  { label: "Revue", keys: ["risk_review", "pending_decision"] },
  { label: "Terminé", keys: ["approved", "rejected", "closed"] },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {s.label}
            </span>
            <span className="font-data text-3xl font-semibold tracking-tight">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="my-8 border-t border-dashed border-border" />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left */}
        <div className="space-y-8">
          {/* Urgent — what needs attention NOW */}
          {(highRiskEntities.length > 0 || upcomingDeadlines.length > 0) && (
            <section>
              <span className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                À traiter
              </span>
              <div className="space-y-2">
                {highRiskEntities.map((entity) => (
                  <Link
                    key={entity.id}
                    href={`/entities/${entity.id}`}
                    className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-3 transition-colors hover:bg-orange-100/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-[12px] font-semibold text-orange-700">
                        {entity.display_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">
                          {entity.display_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Risque {entity.risk_level} — {entity.kyc_status === "in_progress" ? "KYC en cours" : entity.kyc_status}
                        </p>
                      </div>
                    </div>
                    <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />
                  </Link>
                ))}
                {upcomingDeadlines.map((c) => {
                  const entity = MOCK_ENTITIES.find((e) => e.id === c.entity_id);
                  const daysLeft = Math.ceil(
                    (new Date(c.due_date!).getTime() - Date.now()) / 86400000,
                  );
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">
                            {c.case_number}
                            <span className="ml-2 font-normal text-muted-foreground">
                              {entity?.display_name}
                            </span>
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Échéance dans {daysLeft > 0 ? `${daysLeft}j` : "dépassée"}
                          </p>
                        </div>
                      </div>
                      <CaseStatusBadge status={c.status} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Pipeline */}
          <section>
            <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Pipeline
            </span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PIPELINE.map((stage) => {
                const count = MOCK_CASES.filter((c) => stage.keys.includes(c.status)).length;
                return (
                  <div key={stage.label} className="flex flex-col items-center gap-2 rounded-lg bg-secondary/50 px-3 py-4">
                    <span className="font-data text-lg font-semibold">{count}</span>
                    <span className="text-[11px] text-muted-foreground">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Entities overview */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Entités récentes
              </span>
              <Link href="/entities" className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                Tout voir <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Nom</th>
                    <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Risque</th>
                    <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">KYC</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ENTITIES.slice(0, 5).map((entity) => (
                    <tr key={entity.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-2">
                        <Link href={`/entities/${entity.id}`} className="text-[13px] font-medium text-foreground hover:underline">
                          {entity.display_name}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        {entity.risk_level && (
                          <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <KycStatusBadge status={entity.kyc_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right — Activity feed */}
        <div>
          <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Activité récente
          </span>
          <div>
            {MOCK_ACTIVITIES.map((activity) => {
              const entity = MOCK_ENTITIES.find((e) => e.id === activity.entity_id);
              return (
                <div
                  key={activity.id}
                  className="flex gap-3 border-b border-border/50 py-3 last:border-0"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div className="flex-1">
                    <p className="text-[12px] text-foreground">
                      {activity.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {entity?.display_name}
                      {activity.description && ` — ${activity.description}`}
                    </p>
                    <p className="mt-1 font-data text-[10px] text-muted-foreground/60">
                      {new Date(activity.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      })}
                      {activity.agent_id && (
                        <span className="ml-1.5 rounded bg-secondary px-1 py-px text-[9px]">IA</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
