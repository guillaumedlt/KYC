import { createClient } from "@/lib/supabase/server";
import { requireUser, getPermissions } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Shield, Users, Database, Scale, Sparkles } from "lucide-react";
import { InviteUserForm } from "./invite-user-form";

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  admin: { label: "Admin", cls: "bg-foreground text-background" },
  compliance_officer: { label: "Compliance Officer", cls: "bg-amber-100 text-amber-800" },
  analyst: { label: "Analyste", cls: "bg-blue-100 text-blue-800" },
  viewer: { label: "Lecteur", cls: "bg-muted text-muted-foreground" },
};

export default async function SettingsPage() {
  const user = await requireUser();
  const perms = getPermissions(user.role);
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("tenant_id", user.tenant_id)
    .order("created_at");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", user.tenant_id)
    .single();

  return (
    <div className="max-w-lg space-y-4">
      {/* Org */}
      <Section icon={Shield} title="Organisation">
        <Row label="Nom" value={tenant?.name ?? "—"} />
        <Row label="Type" value={tenant?.type ?? "—"} />
        <Row label="Votre rôle" value={ROLE_LABELS[user.role]?.label ?? user.role} badge={ROLE_LABELS[user.role]?.cls} />
      </Section>

      {/* Users */}
      <Section icon={Users} title={`Utilisateurs (${users?.length ?? 0})`}>
        {users?.map((u) => {
          const rl = ROLE_LABELS[u.role];
          return (
            <div key={u.id} className="flex items-center justify-between px-3 py-1.5">
              <div>
                <span className="text-[11px] font-medium text-foreground">{u.full_name}</span>
                <span className="ml-2 text-[10px] text-muted-foreground">{u.email}</span>
              </div>
              <span className={cn("rounded px-1.5 py-px text-[9px] font-medium", rl?.cls ?? "bg-muted text-muted-foreground")}>
                {rl?.label ?? u.role}
              </span>
            </div>
          );
        })}
        {perms.canManageUsers && <InviteUserForm tenantId={user.tenant_id} />}
      </Section>

      {/* DB */}
      <Section icon={Database} title="Base de données">
        <Row label="Supabase" value="Connecté" sub="fjwzus...kdqi" />
        <Row label="Tables" value="11" mono />
        <Row label="RLS" value="Activé" />
      </Section>

      {/* Compliance */}
      <Section icon={Scale} title="Compliance AMSF">
        <Row label="Vigilance" value="Défaut AMSF" />
        <Row label="Screening" value="UN, EU, MC, OFAC" mono />
        <Row label="Rétention audit" value="7 ans" mono />
        <Row label="Conservation docs" value="5 ans post-relation" mono />
      </Section>

      {/* AI */}
      <Section icon={Sparkles} title="Intelligence artificielle">
        <Row label="Extraction docs" value="Claude Sonnet 4" />
        <Row label="Screening" value="Claude Opus 4" />
        <Row label="Auto-classification" value="Activé" />
      </Section>
    </div>
  );
}

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
