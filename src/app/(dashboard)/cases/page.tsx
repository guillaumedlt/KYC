import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MOCK_CASES, getEntityById } from "@/lib/mock-data";
import { CaseStatusBadge } from "@/components/features/status-badge";

const VIGILANCE_LABELS: Record<string, string> = {
  simplified: "Simplifiée",
  standard: "Standard",
  enhanced: "Renforcée",
};

export default function CasesPage() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">
            Tous
          </button>
          <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Ouverts
          </button>
          <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            En revue
          </button>
          <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Terminés
          </button>
        </div>
        <Button size="sm" className="h-7 w-fit rounded-full px-3 text-[12px]">
          <Plus className="mr-1 h-3 w-3" />
          Nouveau
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Dossier</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Entité</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Vigilance</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Échéance</th>
              <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CASES.map((kycCase) => {
              const entity = getEntityById(kycCase.entity_id);
              return (
                <tr
                  key={kycCase.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/cases/${kycCase.id}`}
                      className="font-data text-[13px] font-medium text-foreground hover:underline"
                    >
                      {kycCase.case_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    {entity && (
                      <Link
                        href={`/entities/${entity.id}`}
                        className="text-[13px] text-foreground hover:underline"
                      >
                        {entity.display_name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-muted-foreground">
                    {VIGILANCE_LABELS[kycCase.vigilance_level]}
                  </td>
                  <td className="px-4 py-2.5 font-data text-[12px] text-muted-foreground">
                    {kycCase.due_date
                      ? new Date(kycCase.due_date).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <CaseStatusBadge status={kycCase.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <span className="font-data text-[11px] text-muted-foreground">
          {MOCK_CASES.length} dossiers
        </span>
      </div>
    </div>
  );
}
