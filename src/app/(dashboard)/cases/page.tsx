import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Dossier
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Entité
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Vigilance
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Assigné
              </th>
              <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="py-16 text-center">
                <p className="text-[13px] text-muted-foreground">
                  Aucun dossier
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/60">
                  Ouvrez un dossier KYC sur une entité
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <span className="font-data text-[11px] text-muted-foreground">
          0 dossiers
        </span>
      </div>
    </div>
  );
}
