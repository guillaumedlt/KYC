"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Called after signup to create the user profile in our users table.
 * The user won't see data until they have a profile linked to a tenant.
 */
export async function createUserProfile(authId: string, email: string, fullName: string) {
  const supabase = await createClient();

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .single();

  if (existing) return { success: true };

  const { error } = await supabase.from("users").insert({
    tenant_id: TENANT_ID,
    auth_id: authId,
    email,
    full_name: fullName,
    role: "analyst",
  });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
