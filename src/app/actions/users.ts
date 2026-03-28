"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function inviteUser(tenantId: string, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as string;

  if (!email || !fullName || !role) {
    return { error: "Tous les champs sont requis" };
  }

  // Check if user already exists in this tenant
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .single();

  if (existing) {
    return { error: "Cet email est déjà dans l'équipe" };
  }

  // Create user record (auth account will be created on first login)
  const { error } = await supabase.from("users").insert({
    tenant_id: tenantId,
    email,
    full_name: fullName,
    role,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function removeUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
