import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { MOCK_ENTITIES, MOCK_CASES, MOCK_ACTIVITIES } from "@/lib/mock-data";
import { RiskBadge, CaseStatusBadge, KycStatusBadge } from "@/components/features/status-badge";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

const openCases = MOCK_CASES.filter((c) => !["approved", "rejected", "closed"].includes(c.status));
const highRisk = MOCK_ENTITIES.filter((e) => e.risk_level === "high" || e.risk_level === "critical");
const deadlines = MOCK_CASES
  .filter((c) => c.due_date && !["approved", "rejected", "closed"].includes(c.status))
  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

export default function DashboardPage() {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      <div className="space-y-3">
        {/* Stats */}
        <div className="flex gap-6 border-b border-border pb-2">
          <Stat label="Entités" value={MOCK_ENTITIES.length} />
          <Stat label="Ouverts" value={openCases.length} />
          <Stat label="Risque élevé" value={highRisk.length} color={highRisk.length > 0 ? "text-orange-600" : undefined} />
          <Stat label="Approuvés" value={MOCK_CASES.filter((c) => c.status === "approved").length} />
        </div>

        {/* Alerts */}
        {(highRisk.length > 0 || deadlines.length > 0) && (
          <div className="space-y-1">
            <SectionLabel icon={AlertTriangle} label="À traiter" color="text-orange-600" />
            {highRisk.map((e) => (
              <Link key={e.id} href={`/entities/${e.id}`} className="flex items-center justify-between rounded bg-orange-50 px-3 py-1.5 transition-colors hover:bg-orange-100/80">
                <span className="text-[11px] font-medium text-foreground">{e.display_name}</span>
                <RiskBadge level={e.risk_level as RiskLevel} score={e.risk_score} />
              </Link>
            ))}
            {deadlines.map((c) => {
              const entity = MOCK_ENTITIES.find((e) => e.id === c.entity_id);
              const days = Math.ceil((new Date(c.due_date!).getTime() - Date.now()) / 86400000);
              return (
                <Link key={c.id} href={`/cases/${c.id}`} className="flex items-center justify-between rounded bg-amber-50 px-3 py-1.5">
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

        {/* Entities */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <SectionLabel label="Entités" />
            <Link href="/entities" className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground">Tout <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <Table
            cols={["Nom", { label: "Risque", w: "w-20" }, { label: "KYC", w: "w-20", right: true }]}
            rows={MOCK_ENTITIES.slice(0, 5).map((e) => ({
              key: e.id,
              cells: [
                <Link key="n" href={`/entities/${e.id}`} className="text-[11px] font-medium text-foreground hover:underline">{e.display_name}</Link>,
                e.risk_level ? <RiskBadge key="r" level={e.risk_level as RiskLevel} score={e.risk_score} /> : <span key="r" className="text-[10px] text-muted-foreground">—</span>,
                <KycStatusBadge key="s" status={e.kyc_status} />,
              ],
            }))}
          />
        </div>

        {/* Pipeline */}
        <div>
          <SectionLabel label="Pipeline" className="mb-1.5" />
          <div className="flex gap-1">
            {[
              { label: "Attente", keys: ["open"] },
              { label: "Docs", keys: ["documents_pending"] },
              { label: "Screen", keys: ["screening"] },
              { label: "Revue", keys: ["risk_review", "pending_decision"] },
              { label: "Fait", keys: ["approved", "rejected", "closed"] },
            ].map((s) => (
              <div key={s.label} className="flex flex-1 flex-col items-center rounded border border-border py-2">
                <span className="font-data text-[14px] font-semibold">{MOCK_CASES.filter((c) => s.keys.includes(c.status)).length}</span>
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity sidebar */}
      <div className="border-l border-border pl-3">
        <SectionLabel label="Activité" className="mb-1.5" />
        {MOCK_ACTIVITIES.map((a) => {
          const entity = MOCK_ENTITIES.find((e) => e.id === a.entity_id);
          return (
            <div key={a.id} className="border-b border-border/50 py-1.5 last:border-0">
              <p className="text-[11px] text-foreground">{a.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {entity?.display_name}
                {a.agent_id && <span className="ml-1 rounded bg-muted px-0.5 py-px text-[8px]">IA</span>}
              </p>
              <p className="font-data text-[9px] text-muted-foreground/50">{new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === SHARED PRIMITIVES ===

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className={cn("font-data text-[18px] font-semibold", color ?? "text-foreground")}>{value}</p>
    </div>
  );
}

function SectionLabel({ label, icon: Icon, color, className }: { label: string; icon?: typeof AlertTriangle; color?: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider", color ?? "text-muted-foreground", className)}>
      {Icon && <Icon className="h-3 w-3" />}{label}
    </span>
  );
}

function Table({ cols, rows }: {
  cols: (string | { label: string; w?: string; right?: boolean })[];
  rows: { key: string; cells: React.ReactNode[] }[];
}) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {cols.map((c, i) => {
              const col = typeof c === "string" ? { label: c, w: undefined, right: false } : c;
              return (
                <th key={i} className={cn("px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground", col.w, col.right ? "text-right" : "text-left")}>
                  {col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
              {row.cells.map((cell, i) => {
                const col = cols[i];
                const right = typeof col === "object" && col.right;
                return <td key={i} className={cn("px-2 py-1.5", right && "text-right")}>{cell}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
