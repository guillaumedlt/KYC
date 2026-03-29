"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function reviewScreeningMatch(screeningId: string, decision: "confirmed_match" | "false_positive") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("screenings")
    .update({
      review_decision: decision,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", screeningId);

  if (error) return { error: error.message };

  // Get screening for activity log
  const { data: screening } = await supabase
    .from("screenings")
    .select("entity_id, screening_type, tenant_id")
    .eq("id", screeningId)
    .single();

  if (screening) {
    await supabase.from("activities").insert({
      tenant_id: screening.tenant_id,
      entity_id: screening.entity_id,
      type: "screening_completed",
      title: decision === "confirmed_match" ? "Match confirmé" : "Faux positif",
      description: `Screening ${screening.screening_type} — revue manuelle`,
      created_by: user?.id,
    });
  }

  revalidatePath("/screening");
  revalidatePath("/dashboard");
  return { success: true };
}
