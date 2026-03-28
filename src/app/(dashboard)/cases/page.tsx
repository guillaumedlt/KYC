"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_CASES, getEntityById } from "@/lib/mock-data";
import { CaseStatusBadge } from "@/components/features/status-badge";
import { cn } from "@/lib/utils";

type Filter = "all" | "open" | "review" | "done";

const FILTERS: { key: Filter; label: string; statuses: string[] }[] = [
  { key: "all", label: "Tous", statuses: [] },
  { key: "open", label: "Ouverts", statuses: ["open", "documents_pending", "screening"] },
  { key: "review", label: "En revue", statuses: ["risk_review", "pending_decision", "escalated"] },
  { key: "done", label: "Terminés", statuses: ["approved", "rejected", "closed"] },
];

const VIG: Record<string, string> = { simplified: "Simplifiée", standard: "Standard", enhanced: "Renforcée" };

export default function CasesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = MOCK_CASES.filter((c) => {
    if (filter === "all") return true;
    return FILTERS.find((f) => f.key === filter)?.statuses.includes(c.status);
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="mr-2 text-[11px] text-muted-foreground">{filtered.length} dossiers</span>
          <span className="text-muted-foreground/40">·</span>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn("rounded px-2 py-0.5 text-[11px] transition-colors",
                filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary")}>
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="h-6 rounded px-2 text-[11px]">
          <Plus className="mr-1 h-3 w-3" />Nouveau
        </Button>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Dossier</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entité</th>
              <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vigilance</th>
              <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Échéance</th>
              <th className="w-24 px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const entity = getEntityById(c.entity_id);
              return (
                <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-1.5">
                    <Link href={`/cases/${c.id}`} className="font-data text-[11px] font-medium text-foreground hover:underline">{c.case_number}</Link>
                  </td>
                  <td className="px-2 py-1.5">
                    {entity && <Link href={`/entities/${entity.id}`} className="text-[11px] text-foreground hover:underline">{entity.display_name}</Link>}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-muted-foreground">{VIG[c.vigilance_level]}</td>
                  <td className="px-2 py-1.5 font-data text-[11px] text-muted-foreground">
                    {c.due_date ? new Date(c.due_date).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right"><CaseStatusBadge status={c.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
