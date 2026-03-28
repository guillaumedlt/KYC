import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "compliance_officer" | "analyst" | "viewer";

export interface AppUser {
  id: string;
  auth_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  compliance_officer: 80,
  analyst: 60,
  viewer: 20,
};

/**
 * Get current authenticated user with app profile.
 * Redirects to /login if not authenticated.
 */
export async function requireUser(): Promise<AppUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: appUser } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!appUser) {
    // User exists in auth but not in our users table — first login, create profile
    const { data: newUser } = await supabase
      .from("users")
      .insert({
        tenant_id: "00000000-0000-0000-0000-000000000001", // TODO: from signup flow
        auth_id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name ?? user.email!,
        role: "analyst", // Default role for new users
      })
      .select("*")
      .single();

    if (!newUser) redirect("/login");
    return newUser as AppUser;
  }

  return appUser as AppUser;
}

/**
 * Check if user has minimum required role.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get permissions for a role.
 */
export function getPermissions(role: UserRole) {
  return {
    // Entities
    canCreateEntity: hasRole(role, "analyst"),
    canEditEntity: hasRole(role, "analyst"),
    canDeleteEntity: hasRole(role, "admin"),

    // Cases
    canCreateCase: hasRole(role, "analyst"),
    canAssignCase: hasRole(role, "compliance_officer"),
    canDecide: hasRole(role, "compliance_officer"), // approve/reject/escalate
    canOverrideAi: hasRole(role, "compliance_officer"),

    // Screening
    canRunScreening: hasRole(role, "analyst"),
    canReviewMatch: hasRole(role, "compliance_officer"),

    // Admin
    canManageUsers: hasRole(role, "admin"),
    canManageSettings: hasRole(role, "admin"),
    canExportAmsf: hasRole(role, "compliance_officer"),
    canViewAuditLogs: hasRole(role, "compliance_officer"),
  };
}
