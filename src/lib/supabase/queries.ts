import { createClient } from "@/lib/supabase/server";

// Queries will be added as features are built
export async function ping() {
  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("name").limit(1).single();
  return data?.name ?? null;
}
