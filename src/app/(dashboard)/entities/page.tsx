import { getEntities } from "@/lib/supabase/queries";
import { EntitiesClient } from "./entities-client";

export default async function EntitiesPage() {
  const entities = await getEntities();
  return <EntitiesClient entities={entities} />;
}
