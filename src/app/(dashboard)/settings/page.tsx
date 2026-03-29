import { requireUser, getPermissions } from "@/lib/auth";
import { SettingsTabs } from "./settings-tabs";
import { createClient } from "@/lib/supabase/server";

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

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("tenant_id", user.tenant_id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: activities } = await supabase
    .from("activities")
    .select("*, entities(display_name)")
    .eq("tenant_id", user.tenant_id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <SettingsTabs
      user={user}
      tenant={tenant}
      users={users ?? []}
      activities={activities ?? []}
      auditLogs={auditLogs ?? []}
      canManageUsers={perms.canManageUsers}
      canViewAuditLogs={perms.canViewAuditLogs}
    />
  );
}
