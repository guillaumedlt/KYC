"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield, Users, Database, Scale, Sparkles, Clock,
  User, Building2, FileText,
} from "lucide-react";
import { InviteUserForm } from "./invite-user-form";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/auth";

type Tab = "general" | "users" | "compliance" | "history";

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  admin: { label: "Admin", cls: "bg-foreground text-background" },
  compliance_officer: { label: "Compliance Officer", cls: "bg-amber-100 text-amber-800" },
  analyst: { label: "Analyste", cls: "bg-blue-100 text-blue-800" },
  viewer: { label: "Lecteur", cls: "bg-muted text-muted-foreground" },
};

const ACTIVITY_ICONS: Record<string, typeof User> = {
  entity_created: User,
  entity_updated: User,
  case_opened: FileText,
  case_status_changed: FileText,
  decision_made: Shield,
  document_uploaded: FileText,
  document_verified: FileText,
  screening_completed: Shield,
  screening_match_found: Shield,
  risk_assessed: Shield,
  note: FileText,
  relation_added: Users,
  review_requested: Clock,
  escalated: Shield,
};

interface Props {
  user: AppUser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tenant: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activities: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auditLogs: any[];
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
}

const TABS: { key: Tab; label: string; icon: typeof Shield }[] = [
  { key: "general", label: "Général", icon: Shield },
  { key: "users", label: "Équipe", icon: Users },
  { key: "compliance", label: "Compliance", icon: Scale },
  { key: "history", label: "Historique", icon: Clock },
];

export function SettingsTabs({
  user, tenant, users, activities, auditLogs, canManageUsers, canViewAuditLogs,
}: Props) {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1 border-b-2 px-3 py-1.5 text-[11px] transition-colors",
              tab === t.key
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab user={user} tenant={tenant} />}
      {tab === "users" && <UsersTab users={users} currentUserId={user.id} canManage={canManageUsers} tenantId={user.tenant_id} />}
      {tab === "compliance" && <ComplianceTab />}
      {tab === "history" && <HistoryTab activities={activities} users={users} canViewAudit={canViewAuditLogs} />}
    </div>
  );
}

// =============================================================================
// GENERAL
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GeneralTab({ user, tenant }: { user: AppUser; tenant: any }) {
  const rl = ROLE_LABELS[user.role];
  return (
    <div className="max-w-lg space-y-4">
      <Section icon={Shield} title="Organisation">
        <Row label="Nom" value={tenant?.name ?? "Non configuré"} />
        <Row label="Type" value={tenant?.type ?? "—"} />
        <Row label="Slug" value={tenant?.slug ?? "—"} mono />
      </Section>
      <Section icon={User} title="Mon compte">
        <Row label="Nom" value={user.full_name} />
        <Row label="Email" value={user.email} mono />
        <Row label="Rôle" value={rl?.label ?? user.role} badge={rl?.cls} />
        <Row label="ID" value={user.id.slice(0, 8) + "..."} mono />
      </Section>
      <Section icon={Database} title="Infrastructure">
        <Row label="Supabase" value="Connecté" sub="fjwzus...kdqi" />
        <Row label="Vercel" value="Déployé" sub="kycmonaco.vercel.app" />
        <Row label="Tables" value="11" mono />
        <Row label="RLS" value="Activé" />
      </Section>
      <Section icon={Sparkles} title="Intelligence artificielle">
        <Row label="Extraction docs" value="Claude Sonnet 4" />
        <Row label="Screening" value="Claude Opus 4" />
        <Row label="Auto-classification" value="Activé" />
      </Section>
    </div>
  );
}

// =============================================================================
// USERS
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function UsersTab({ users, currentUserId, canManage, tenantId }: { users: any[]; currentUserId: string; canManage: boolean; tenantId: string }) {
  const active = users.filter((u) => u.is_active !== false);
  const inactive = users.filter((u) => u.is_active === false);

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex gap-6 border-b border-border pb-2">
        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Actifs</span>
          <p className="font-data text-[18px] font-semibold">{active.length}</p>
        </div>
        {inactive.length > 0 && (
          <div>
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Désactivés</span>
            <p className="font-data text-[18px] font-semibold text-muted-foreground">{inactive.length}</p>
          </div>
        )}
      </div>

      <div className="divide-y divide-border rounded border border-border">
        {active.map((u) => {
          const rl = ROLE_LABELS[u.role];
          const isMe = u.id === currentUserId;
          return (
            <div key={u.id} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-[10px] font-medium">
                  {u.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-foreground">{u.full_name}</span>
                    {isMe && <span className="rounded bg-muted px-1 py-px text-[8px] text-muted-foreground">vous</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{u.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded px-1.5 py-px text-[9px] font-medium", rl?.cls ?? "bg-muted text-muted-foreground")}>
                  {rl?.label ?? u.role}
                </span>
                <span className="font-data text-[9px] text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {canManage && <InviteUserForm tenantId={tenantId} />}
    </div>
  );
}

// =============================================================================
// COMPLIANCE
// =============================================================================

function ComplianceTab() {
  return (
    <div className="max-w-lg space-y-4">
      <Section icon={Scale} title="Politique de vigilance">
        <Row label="Simplifiée" value="Score 0-25" sub="Revue tous les 3 ans" />
        <Row label="Standard" value="Score 26-59" sub="Revue annuelle" />
        <Row label="Renforcée" value="Score 60-79" sub="Revue semestrielle" />
        <Row label="Interdite" value="Score 80-100" sub="Rejet automatique" />
      </Section>
      <Section icon={Shield} title="Listes de screening">
        <Row label="ONU" value="Activé" />
        <Row label="Union Européenne" value="Activé" />
        <Row label="Monaco" value="Activé" />
        <Row label="OFAC (US)" value="Activé" />
        <Row label="UK HMT" value="Désactivé" />
      </Section>
      <Section icon={Clock} title="Rétention des données (Art. 22)">
        <Row label="Dossiers KYC" value="5 ans post-relation" mono />
        <Row label="Documents" value="5 ans post-relation" mono />
        <Row label="Audit logs" value="7 ans (immutable)" mono />
        <Row label="Screenings" value="5 ans post-relation" mono />
      </Section>
    </div>
  );
}

// =============================================================================
// HISTORY — activity log per user
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HistoryTab({ activities, users, canViewAudit }: { activities: any[]; users: any[]; canViewAudit: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMap = new Map(users.map((u: any) => [u.id, u.full_name]));

  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b border-border pb-2">
        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Événements</span>
          <p className="font-data text-[18px] font-semibold">{activities.length}</p>
        </div>
      </div>

      {!canViewAudit && (
        <p className="rounded bg-amber-50 px-3 py-1.5 text-[10px] text-amber-700">
          Accès restreint — seuls les Compliance Officers et Admins peuvent voir l&apos;historique complet.
        </p>
      )}

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[600px]">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Date</th>
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Action</th>
            <th className="w-32 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entité</th>
            <th className="w-28 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Par</th>
            <th className="w-12 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Source</th>
          </tr></thead>
          <tbody>
            {activities.map((a) => {
              const Icon = ACTIVITY_ICONS[a.type] ?? FileText;
              const userName = a.created_by ? userMap.get(a.created_by) ?? "Utilisateur" : null;
              return (
                <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-1.5 font-data text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    <span className="ml-1 text-muted-foreground/50">
                      {new Date(a.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] text-foreground">{a.title}</p>
                        {a.description && <p className="text-[9px] text-muted-foreground">{a.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    {a.entities?.display_name ? (
                      <Link href={`/entities/${a.entity_id}`} className="text-[10px] text-foreground hover:underline">
                        {a.entities.display_name}
                      </Link>
                    ) : <span className="text-[10px] text-muted-foreground">—</span>}
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground">
                    {userName ?? "—"}
                  </td>
                  <td className="px-2 py-1.5">
                    {a.agent_id ? (
                      <span className="rounded bg-muted px-1 py-px text-[8px] text-muted-foreground">IA</span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">Manuel</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// SHARED
// =============================================================================

function Section({ icon: Icon, title, children }: { icon: typeof Shield; title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />{title}
      </span>
      <div className="divide-y divide-border rounded border border-border">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, sub, badge }: { label: string; value: string; mono?: boolean; sub?: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5">
      <span className="text-[11px] text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {sub && <span className="font-data text-[9px] text-muted-foreground">{sub}</span>}
        {badge ? (
          <span className={cn("rounded px-1.5 py-px text-[9px] font-medium", badge)}>{value}</span>
        ) : (
          <span className={cn("text-[11px] text-muted-foreground", mono && "font-data")}>{value}</span>
        )}
      </div>
    </div>
  );
}
