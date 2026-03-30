import Link from "next/link";
import { FileText, Printer, AlertTriangle } from "lucide-react";
import { getCases } from "@/lib/supabase/queries";
import { CaseStatusBadge } from "@/components/features/status-badge";
import type { CaseStatus } from "@/types";

export default async function ReportsPage() {
  const cases = await getCases();
  const completedCases = cases.filter((c: Record<string, unknown>) => ["approved", "rejected", "escalated"].includes(c.status as string));
  const openCases = cases.filter((c: Record<string, unknown>) => !["approved", "rejected", "escalated", "closed"].includes(c.status as string));

  return (
    <div className="w-full space-y-5">
      {/* Contextual hint */}
      {completedCases.length === 0 && openCases.length > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 px-4 py-2.5 text-[11px] text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span><strong className="font-data">{openCases.length}</strong> dossier{openCases.length > 1 ? "s" : ""} en cours — les rapports seront disponibles après décision (approuver/rejeter).</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Rapports disponibles</p>
          <p className="mt-1 font-data text-[24px] font-semibold leading-none">{completedCases.length}</p>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Dossiers total</p>
          <p className="mt-1 font-data text-[24px] font-semibold leading-none text-muted-foreground">{cases.length}</p>
        </div>
      </div>

      {completedCases.length > 0 && (
        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Rapports KYC</span>
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full">
              <thead><tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Dossier</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Entité</th>
                <th className="w-24 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Décision</th>
                <th className="w-24 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Date</th>
                <th className="w-20 px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Rapport</th>
              </tr></thead>
              <tbody>
                {completedCases.map((c: Record<string, unknown>) => (
                  <tr key={c.id as string} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-data text-[12px] font-medium">{c.case_number as string}</td>
                    <td className="px-4 py-2.5 text-[12px]">{(c.entities as Record<string, unknown>)?.display_name as string}</td>
                    <td className="px-4 py-2.5"><CaseStatusBadge status={c.status as CaseStatus} /></td>
                    <td className="px-4 py-2.5 font-data text-[11px] text-muted-foreground">{c.decided_at ? new Date(c.decided_at as string).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/reports/${c.id}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <Printer className="h-3 w-3" />Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openCases.length > 0 && (
        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Dossiers en cours</span>
          <div className="space-y-1.5">
            {openCases.map((c: Record<string, unknown>) => (
              <Link key={c.id as string} href={`/cases/${c.id}`}
                className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2.5 transition-colors hover:border-foreground/20">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-data text-[12px]">{c.case_number as string}</span>
                  <span className="text-[11px] text-muted-foreground">{(c.entities as Record<string, unknown>)?.display_name as string}</span>
                </div>
                <CaseStatusBadge status={c.status as CaseStatus} />
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Cliquez sur un dossier pour prendre une décision → le rapport sera généré automatiquement.</p>
        </div>
      )}
    </div>
  );
}
