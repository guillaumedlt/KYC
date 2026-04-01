import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight, Plus, FolderOpen, CheckCircle, Circle } from "lucide-react";
import { getEntities, getCases, getActivities, getScreenings } from "@/lib/supabase/queries";
import { RiskBadge, CaseStatusBadge, KycStatusBadge } from "@/components/features/status-badge";
import { requireUser } from "@/lib/auth";
import type { RiskLevel, KycStatus, CaseStatus } from "@/types";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [user, entities, cases, activities, screenings] = await Promise.all([
    requireUser(), getEntities(), getCases(), getActivities(15), getScreenings(),
  ]);

  const openCases = cases.filter((c: Record<string, unknown>) => !["approved", "rejected", "closed"].includes(c.status as string));
  const highRisk = entities.filter((e: Record<string, unknown>) => e.risk_level === "high" || e.risk_level === "critical");
  const pendingScreenings = screenings.filter((s: Record<string, unknown>) => s.review_decision === "pending");
  const deadlines = cases
    .filter((c: Record<string, unknown>) => c.due_date && !["approved", "rejected", "closed"].includes(c.status as string))
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime());

  // Build smart todo list — what the user should do RIGHT NOW
  const todos: { label: string; href: string; priority: "critical" | "high" | "normal"; type: string }[] = [];

  pendingScreenings.forEach((s: Record<string, unknown>) => {
    const name = (s.entities as Record<string, unknown>)?.display_name as string;
    todos.push({ label: `Revue screening — ${name}`, href: "/screening", priority: "critical", type: "screening" });
  });

  deadlines.forEach((c: Record<string, unknown>) => {
    const days = Math.ceil((new Date(c.due_date as string).getTime() - Date.now()) / 86400000);
    if (days <= 7) {
      todos.push({ label: `${c.case_number} échéance dans ${days}j`, href: `/cases/${c.id}`, priority: days <= 2 ? "critical" : "high", type: "deadline" });
    }
  });

  openCases.filter((c: Record<string, unknown>) => c.status === "pending_decision" || c.status === "risk_review").forEach((c: Record<string, unknown>) => {
    todos.push({ label: `Décision requise — ${c.case_number}`, href: `/cases/${c.id}`, priority: "high", type: "decision" });
  });

  highRisk.forEach((e: Record<string, unknown>) => {
    const hasCase = cases.some((c: Record<string, unknown>) => c.entity_id === e.id && !["approved", "rejected", "closed"].includes(c.status as string));
    if (!hasCase) {
      todos.push({ label: `${e.display_name} — risque ${e.risk_level}, pas de dossier`, href: `/entities/${e.id}`, priority: "high", type: "risk" });
    }
  });

  todos.sort((a, b) => {
    const p = { critical: 0, high: 1, normal: 2 };
    return p[a.priority] - p[b.priority];
  });

  const firstName = user.full_name.split(" ")[0];

  return (
    <div className="w-full">
      {/* Welcome + CTA */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-heading text-[20px] text-foreground">Bonjour, {firstName}</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {todos.length > 0
              ? `${todos.length} action${todos.length > 1 ? "s" : ""} en attente`
              : "Aucune action urgente"
            }
            {openCases.length > 0 && ` · ${openCases.length} dossier${openCases.length > 1 ? "s" : ""} en cours`}
          </p>
        </div>
        <Link href="/cases/new" className="flex h-9 items-center gap-2 rounded-md bg-foreground px-4 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90">
          <Plus className="h-3.5 w-3.5" /> Nouveau dossier KYC
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Smart todo list */}
          {todos.length > 0 && (
            <section>
              <SectionTitle label="À faire maintenant" icon={AlertTriangle} accent />
              <div className="mt-2 space-y-1.5">
                {todos.slice(0, 8).map((todo, i) => (
                  <Link key={i} href={todo.href} className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-2.5 transition-colors hover:opacity-80",
                    todo.priority === "critical" ? "bg-red-50/80" : todo.priority === "high" ? "bg-orange-50/80" : "bg-muted/30",
                  )}>
                    <Circle className={cn("h-3 w-3 shrink-0",
                      todo.priority === "critical" ? "text-red-500" : todo.priority === "high" ? "text-orange-500" : "text-muted-foreground",
                    )} />
                    <span className="text-[12px] text-foreground">{todo.label}</span>
                    <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Entités" value={entities.length} />
            <StatCard label="Dossiers ouverts" value={openCases.length} />
            <StatCard label="Risque élevé" value={highRisk.length} accent={highRisk.length > 0} />
            <StatCard label="Approuvés" value={cases.filter((c: Record<string, unknown>) => c.status === "approved").length} />
          </div>

          {/* Pipeline */}
          <section>
            <SectionTitle label="Pipeline KYC" />
            <div className="mt-2 flex gap-2">
              {[
                { label: "Attente", keys: ["open"], href: "/cases" },
                { label: "Documents", keys: ["documents_pending"], href: "/cases" },
                { label: "Screening", keys: ["screening"], href: "/cases" },
                { label: "Revue", keys: ["risk_review", "pending_decision"], href: "/cases" },
                { label: "Terminé", keys: ["approved", "rejected", "closed"], href: "/cases" },
              ].map((s) => {
                const count = cases.filter((c: Record<string, unknown>) => s.keys.includes(c.status as string)).length;
                return (
                  <Link key={s.label} href={s.href} className="flex flex-1 flex-col items-center rounded-md border border-border bg-card px-3 py-3 transition-colors hover:border-foreground/20">
                    <span className="font-data text-[16px] font-semibold">{count}</span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">{s.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent entities */}
          <section>
            <div className="flex items-center justify-between">
              <SectionTitle label="Dernières entités" />
              <Link href="/entities" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">Tout <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="mt-2 overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Nom</th>
                  <th className="w-24 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Risque</th>
                  <th className="w-24 px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">KYC</th>
                </tr></thead>
                <tbody>
                  {entities.slice(0, 5).map((e: Record<string, unknown>) => (
                    <tr key={e.id as string} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
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

        {/* Right — Activity feed */}
        <aside className="space-y-4">
          {/* Quick actions */}
          <div className="rounded-md border border-border bg-card p-3">
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Actions rapides</span>
            <div className="space-y-1">
              <Link href="/cases/new" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted/30">
                <Plus className="h-3 w-3 text-muted-foreground" /> Nouveau dossier KYC
              </Link>
              <Link href="/screening" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted/30">
                <FolderOpen className="h-3 w-3 text-muted-foreground" /> Screening en attente
                {pendingScreenings.length > 0 && <span className="ml-auto rounded-md bg-red-50 px-1.5 py-0.5 font-data text-[9px] text-red-600">{pendingScreenings.length}</span>}
              </Link>
              <Link href="/risk/matrices" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted/30">
                <CheckCircle className="h-3 w-3 text-muted-foreground" /> Matrices de risque
              </Link>
            </div>
          </div>

          {/* Activity feed */}
          <div>
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
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-data text-[22px] font-semibold leading-none", accent ? "text-orange-600" : "text-foreground")}>{value}</p>
    </div>
  );
}

function SectionTitle({ label, icon: Icon, accent }: { label: string; icon?: typeof AlertTriangle; accent?: boolean }) {
  return (
    <span className={cn("flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em]", accent ? "text-red-600" : "text-muted-foreground")}>
      {Icon && <Icon className="h-3 w-3" />}{label}
    </span>
  );
}
