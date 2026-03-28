import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MOCK_ENTITIES } from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge } from "@/components/features/status-badge";
import type { RiskLevel } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  person: "Personne",
  company: "Société",
  trust: "Trust",
  foundation: "Fondation",
  spv: "SPV",
  fund: "Fonds",
};

export default function EntitiesPage() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">
            Toutes
          </button>
          <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Personnes
          </button>
          <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Sociétés
          </button>
          <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Structures
          </button>
        </div>
        <Button size="sm" className="h-7 w-fit rounded-full px-3 text-[12px]">
          <Plus className="mr-1 h-3 w-3" />
          Ajouter
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Nom</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Type</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Risque</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">KYC</th>
              <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Dernière revue</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ENTITIES.map((entity) => (
              <tr
                key={entity.id}
                className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/30"
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/entities/${entity.id}`}
                    className="text-[13px] font-medium text-foreground hover:underline"
                  >
                    {entity.display_name}
                  </Link>
                  {entity.tags.length > 0 && (
                    <div className="mt-0.5 flex gap-1">
                      {entity.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-[13px] text-muted-foreground">
                  {TYPE_LABELS[entity.type] ?? entity.type}
                </td>
                <td className="px-4 py-2.5">
                  {entity.risk_level && (
                    <RiskBadge
                      level={entity.risk_level as RiskLevel}
                      score={entity.risk_score}
                    />
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <KycStatusBadge status={entity.kyc_status} />
                </td>
                <td className="px-4 py-2.5 text-right font-data text-[12px] text-muted-foreground">
                  {entity.last_reviewed_at
                    ? new Date(entity.last_reviewed_at).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <span className="font-data text-[11px] text-muted-foreground">
          {MOCK_ENTITIES.length} entités
        </span>
      </div>
    </div>
  );
}
