import Link from "next/link";
import { AlertTriangle, Clock, Plus } from "lucide-react";
import { getCases } from "@/lib/supabase/queries";
import { CasesClient } from "./cases-client";
import { cn } from "@/lib/utils";

export default async function CasesPage() {
  const cases = await getCases();

  const needsDecision = cases.filter((c: Record<string, unknown>) => c.status === "pending_decision" || c.status === "risk_review");
  const overdue = cases.filter((c: Record<string, unknown>) => {
    if (!c.due_date || ["approved", "rejected", "closed"].includes(c.status as string)) return false;
    return new Date(c.due_date as string).getTime() < Date.now();
  });
  const nearDeadline = cases.filter((c: Record<string, unknown>) => {
    if (!c.due_date || ["approved", "rejected", "closed"].includes(c.status as string)) return false;
    const days = Math.ceil((new Date(c.due_date as string).getTime() - Date.now()) / 86400000);
    return days > 0 && days <= 7;
  });

  return (
    <div>
      {/* Header with CTA */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[18px] text-foreground">Dossiers KYC</h1>
          <p className="text-[11px] text-muted-foreground">{cases.length} dossier{cases.length > 1 ? "s" : ""}</p>
        </div>
        <Link href="/cases/new" className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[11px] font-medium text-background hover:bg-foreground/90 transition-colors">
          <Plus className="h-3 w-3" /> Nouveau dossier KYC
        </Link>
      </div>

      {/* Contextual alerts */}
      {(needsDecision.length > 0 || overdue.length > 0 || nearDeadline.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {overdue.length > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-[11px] text-red-700">
              <AlertTriangle className="h-3 w-3" /> <strong className="font-data">{overdue.length}</strong> dossier{overdue.length > 1 ? "s" : ""} en retard
            </span>
          )}
          {nearDeadline.length > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
              <Clock className="h-3 w-3" /> <strong className="font-data">{nearDeadline.length}</strong> échéance{nearDeadline.length > 1 ? "s" : ""} cette semaine
            </span>
          )}
          {needsDecision.length > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">
              <strong className="font-data">{needsDecision.length}</strong> décision{needsDecision.length > 1 ? "s" : ""} en attente
            </span>
          )}
        </div>
      )}
      <CasesClient cases={cases} />
    </div>
  );
}
