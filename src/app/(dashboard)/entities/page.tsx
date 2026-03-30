import { getEntities } from "@/lib/supabase/queries";
import { EntitiesClient } from "./entities-client";

export default async function EntitiesPage() {
  const entities = await getEntities();

  // Compute actionable insights
  const withoutCase = entities.filter((e: Record<string, unknown>) => e.kyc_status === "not_started");
  const expired = entities.filter((e: Record<string, unknown>) => e.kyc_status === "expired");
  const highRisk = entities.filter((e: Record<string, unknown>) => e.risk_level === "high" || e.risk_level === "critical");

  const hints: { text: string; count: number; color: string }[] = [];
  if (withoutCase.length > 0) hints.push({ text: "sans dossier KYC", count: withoutCase.length, color: "text-amber-600" });
  if (expired.length > 0) hints.push({ text: "KYC expiré", count: expired.length, color: "text-red-600" });
  if (highRisk.length > 0) hints.push({ text: "risque élevé ou critique", count: highRisk.length, color: "text-orange-600" });

  return (
    <div>
      {/* Contextual hints */}
      {hints.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {hints.map((h, i) => (
            <span key={i} className={`text-[11px] ${h.color}`}>
              <strong className="font-data">{h.count}</strong> {h.text}
            </span>
          ))}
        </div>
      )}
      <EntitiesClient entities={entities} />
    </div>
  );
}
