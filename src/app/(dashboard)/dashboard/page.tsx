import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { MOCK_ENTITIES, MOCK_CASES, MOCK_ACTIVITIES } from "@/lib/mock-data";
import { RiskBadge, CaseStatusBadge, KycStatusBadge } from "@/components/features/status-badge";
import type { RiskLevel } from "@/types";

const openCases = MOCK_CASES.filter((c) => !["approved", "rejected", "closed"].includes(c.status));
const highRisk = MOCK_ENTITIES.filter((e) => e.risk_level === "high" || e.risk_level === "critical");
const deadlines = MOCK_CASES
  .filter((c) => c.due_date && !["approved", "rejected", "closed"].includes(c.status))
  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

export default function DashboardPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        {/* Stats inline */}
        <div className="flex gap-6 border-b border-border pb-3">
          <Stat label="Entités" value={MOCK_ENTITIES.length} />
          <Stat label="Ouverts" value={openCases.length} />
          <Stat label="Risque élevé" value={highRisk.length} color={highRisk.length > 0 ? "text-orange-600" : undefined} />
          <Stat label="Approuvés" value={MOCK_CASES.filter((c) => c.status === "approved").length} />
        </div>

        {/* Alerts */}
        {(highRisk.length > 0 || deadlines.length > 0) && (
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-orange-600">
              <AlertTriangle className="h-3 w-3" /> À traiter
            </span>
            {highRisk.map((e) => (
              <Link key={e.id} href={`/entities/${e.id}`}
                className="flex items-center justify-between rounded border border-orange-200 bg-orange-50 px-3 py-1.5 transition-colors hover:bg-orange-100/80">
                <span className="text-[11px] font-medium text-foreground">{e.display_name}</span>
                <RiskBadge level={e.risk_level as RiskLevel} score={e.risk_score} />
              </Link>
            ))}
            {deadlines.map((c) => {
              const entity = MOCK_ENTITIES.find((e) => e.id === c.entity_id);
              const days = Math.ceil((new Date(c.due_date!).getTime() - Date.now()) / 86400000);
              return (
                <Link key={c.id} href={`/cases/${c.id}`}
                  className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span className="font-data text-[11px] text-foreground">{c.case_number}</span>
                    <span className="text-[11px] text-muted-foreground">{entity?.display_name}</span>
                  </div>
                  <span className="text-[10px] text-amber-700">{days > 0 ? `${days}j` : "dépassée"}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Entities table */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entités</span>
            <Link href="/entities" className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground">
              Tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Nom</th>
                  <th className="w-20 px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Risque</th>
                  <th className="w-20 px-2 py-1 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">KYC</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ENTITIES.slice(0, 5).map((e) => (
                  <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-2 py-1">
                      <Link href={`/entities/${e.id}`} className="text-[11px] font-medium text-foreground hover:underline">{e.display_name}</Link>
                    </td>
                    <td className="px-2 py-1">
                      {e.risk_level && <RiskBadge level={e.risk_level as RiskLevel} score={e.risk_score} />}
                    </td>
                    <td className="px-2 py-1 text-right"><KycStatusBadge status={e.kyc_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline */}
        <div>
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pipeline</span>
          <div className="flex gap-1">
            {[
              { label: "Attente", keys: ["open"] },
              { label: "Docs", keys: ["documents_pending"] },
              { label: "Screen", keys: ["screening"] },
              { label: "Revue", keys: ["risk_review", "pending_decision"] },
              { label: "Fait", keys: ["approved", "rejected", "closed"] },
            ].map((s) => {
              const n = MOCK_CASES.filter((c) => s.keys.includes(c.status)).length;
              return (
                <div key={s.label} className="flex flex-1 flex-col items-center rounded border border-border py-2">
                  <span className="font-data text-[14px] font-semibold">{n}</span>
                  <span className="text-[9px] text-muted-foreground">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right — Activity */}
      <div className="border-l border-border pl-4">
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Activité</span>
        {MOCK_ACTIVITIES.map((a) => {
          const entity = MOCK_ENTITIES.find((e) => e.id === a.entity_id);
          return (
            <div key={a.id} className="border-b border-border/50 py-2 last:border-0">
              <p className="text-[11px] text-foreground">{a.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {entity?.display_name}
                {a.agent_id && <span className="ml-1 rounded bg-muted px-1 py-px text-[8px]">IA</span>}
              </p>
              <p className="font-data text-[9px] text-muted-foreground/50">
                {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className={cn("font-data text-[18px] font-semibold", color ?? "text-foreground")}>{value}</p>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
