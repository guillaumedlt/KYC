"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge } from "@/components/features/status-badge";
import { DataTable } from "@/components/features/data-table";
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
const col = createColumnHelper<any>();

const columns = [
  col.accessor("case_number", {
    header: "Dossier",
    size: 150,
    cell: (info) => <Link href={`/cases/${info.row.original.id}`} className="font-data text-[12px] font-medium text-foreground hover:underline">{info.getValue()}</Link>,
  }),
  col.accessor((row) => row.entities?.display_name ?? "", {
    id: "entity",
    header: "Entité",
    size: 200,
    cell: (info) => {
      const c = info.row.original;
      return c.entities ? <Link href={`/entities/${c.entity_id}`} className="text-[12px] text-foreground hover:underline">{c.entities.display_name}</Link> : <span className="text-[11px] text-muted-foreground">—</span>;
    },
  }),
  col.accessor("vigilance_level", {
    header: "Vigilance",
    size: 110,
    cell: (info) => <span className="text-[12px] text-muted-foreground">{VIG[info.getValue()] ?? info.getValue()}</span>,
  }),
  col.accessor("due_date", {
    header: "Échéance",
    size: 110,
    cell: (info) => <span className="font-data text-[11px] text-muted-foreground">{info.getValue() ? new Date(info.getValue() as string).toLocaleDateString("fr-FR") : "—"}</span>,
  }),
  col.accessor("status", {
    header: "Statut",
    size: 110,
    cell: (info) => <CaseStatusBadge status={info.getValue() as CaseStatus} />,
  }),
  col.accessor("ai_recommendation", {
    header: "IA",
    size: 80,
    cell: (info) => {
      const v = info.getValue();
      if (!v) return <span className="text-[11px] text-muted-foreground">—</span>;
      return <span className={cn("text-[11px] font-medium", v === "approve" ? "text-emerald-600" : v === "reject" ? "text-red-600" : "text-amber-600")}>
        {v === "approve" ? "Approuver" : v === "reject" ? "Rejeter" : "Escalader"}
      </span>;
    },
  }),
  col.accessor("created_at", {
    header: "Créé le",
    size: 110,
    cell: (info) => <span className="font-data text-[11px] text-muted-foreground">{new Date(info.getValue() as string).toLocaleDateString("fr-FR")}</span>,
  }),
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CasesClient({ cases }: { cases: any[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = cases.filter((c) => filter === "all" || FILTERS.find((f) => f.key === filter)?.statuses.includes(c.status));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={cn("rounded-md px-2.5 py-1 text-[11px] transition-colors", filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>{f.label}</button>
          ))}
        </div>
        <Button size="sm" className="h-7 rounded-md px-3 text-[11px]"><Plus className="mr-1 h-3 w-3" />Nouveau</Button>
      </div>

      <DataTable columns={columns} data={filtered} searchPlaceholder="Filtrer les dossiers..." />
    </div>
  );
}
