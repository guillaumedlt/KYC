import Link from "next/link";
import { FileText, Printer } from "lucide-react";
import { getCases } from "@/lib/supabase/queries";
import { CaseStatusBadge } from "@/components/features/status-badge";
import type { CaseStatus } from "@/types";
import { cn } from "@/lib/utils";

export default async function ReportsPage() {
  const cases = await getCases();
  const completedCases = cases.filter((c: Record<string, unknown>) =>
    ["approved", "rejected", "escalated"].includes(c.status as string),
  );
  const allCases = cases;

  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b border-border pb-2">
        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Rapports disponibles</span>
          <p className="font-data text-[18px] font-semibold">{completedCases.length}</p>
        </div>
        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Dossiers total</span>
          <p className="font-data text-[18px] font-semibold text-muted-foreground">{allCases.length}</p>
        </div>
      </div>

      {/* Completed — can generate reports */}
      {completedCases.length > 0 && (
        <div>
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Rapports KYC
          </span>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Dossier</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entité</th>
                <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Décision</th>
                <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="w-20 px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rapport</th>
              </tr></thead>
              <tbody>
                {completedCases.map((c: Record<string, unknown>) => (
                  <tr key={c.id as string} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-2 py-1.5 font-data text-[11px] font-medium">{c.case_number as string}</td>
                    <td className="px-2 py-1.5 text-[11px]">
                      {(c.entities as Record<string, unknown>)?.display_name as string}
                    </td>
                    <td className="px-2 py-1.5"><CaseStatusBadge status={c.status as CaseStatus} /></td>
                    <td className="px-2 py-1.5 font-data text-[10px] text-muted-foreground">
                      {c.decided_at ? new Date(c.decided_at as string).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Link
                        href={`/reports/${c.id}`}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Printer className="h-3 w-3" />
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All open cases */}
      {cases.filter((c: Record<string, unknown>) => !["approved", "rejected", "escalated", "closed"].includes(c.status as string)).length > 0 && (
        <div>
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Dossiers en cours (rapport disponible après décision)
          </span>
          <div className="space-y-1">
            {cases.filter((c: Record<string, unknown>) => !["approved", "rejected", "escalated", "closed"].includes(c.status as string)).map((c: Record<string, unknown>) => (
              <div key={c.id as string} className="flex items-center justify-between rounded bg-muted/30 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="font-data text-[11px]">{c.case_number as string}</span>
                  <span className="text-[10px] text-muted-foreground">{(c.entities as Record<string, unknown>)?.display_name as string}</span>
                </div>
                <CaseStatusBadge status={c.status as CaseStatus} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
