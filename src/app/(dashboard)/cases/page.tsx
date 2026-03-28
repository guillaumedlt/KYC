import { getCases } from "@/lib/supabase/queries";
import { CasesClient } from "./cases-client";

export default async function CasesPage() {
  const cases = await getCases();
  return <CasesClient cases={cases} />;
}
