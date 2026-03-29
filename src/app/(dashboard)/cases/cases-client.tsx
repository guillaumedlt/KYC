"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge } from "@/components/features/status-badge";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/types";

type Filter = "all" | "open" | "review" | "done";
const FILTERS: { key: Filter; label: string; statuses: string[] }[] = [
  { key: "all", label: "Tous", statuses: [] },
  { key: "open", label: "Ouverts", statuses: ["open", "documents_pending", "screening"] },
  { key: "review", label: "En revue", statuses: ["risk_review", "pending_decision", "escalated"] },
  { key: "done", label: "Terminés", statuses: ["approved", "rejected", "closed"] },
];
const VIG: Record<string, string> = { simplified: "Simplifiée", standard: "Standard", enhanced: "Renforcée" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CasesClient({ cases }: { cases: any[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = cases.filter((c) => filter === "all" || FILTERS.find((f) => f.key === filter)?.statuses.includes(c.status));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="mr-2 text-[11px] text-muted-foreground">{filtered.length} dossiers</span>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={cn("rounded-md px-2.5 py-1 text-[11px] transition-colors", filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>{f.label}</button>
          ))}
        </div>
        <Button size="sm" className="h-7 rounded-md px-3 text-[11px]"><Plus className="mr-1 h-3 w-3" />Nouveau</Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[600px]">
          <thead><tr className="border-b border-border">
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Dossier</th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Entité</th>
            <th className="w-24 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Vigilance</th>
            <th className="w-24 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Échéance</th>
            <th className="w-24 px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Statut</th>
          </tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
                <td className="px-4 py-2.5"><Link href={`/cases/${c.id}`} className="font-data text-[12px] font-medium text-foreground hover:underline">{c.case_number}</Link></td>
                <td className="px-4 py-2.5">{c.entities && <Link href={`/entities/${c.entity_id}`} className="text-[12px] text-foreground hover:underline">{c.entities.display_name}</Link>}</td>
                <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{VIG[c.vigilance_level] ?? c.vigilance_level}</td>
                <td className="px-4 py-2.5 font-data text-[11px] text-muted-foreground">{c.due_date ? new Date(c.due_date).toLocaleDateString("fr-FR") : "—"}</td>
                <td className="px-4 py-2.5 text-right"><CaseStatusBadge status={c.status as CaseStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
