"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { DataTable } from "@/components/features/data-table";
import { cn } from "@/lib/utils";

const TYPE_L: Record<string, string> = { pep: "PEP", sanctions: "Sanctions", adverse_media: "Adverse media" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const col = createColumnHelper<any>();

const columns = [
  col.accessor((row) => (row.entities as Record<string, unknown>)?.display_name ?? "", {
    id: "entity",
    header: "Entité",
    size: 200,
    cell: (info) => <Link href={`/entities/${info.row.original.entity_id}`} className="text-[12px] font-medium text-foreground hover:underline">{String(info.getValue())}</Link>,
  }),
  col.accessor("screening_type", {
    header: "Type",
    size: 120,
    cell: (info) => <span className="text-[11px] text-muted-foreground">{TYPE_L[info.getValue()] ?? info.getValue()}</span>,
  }),
  col.accessor("lists_checked", {
    header: "Listes",
    size: 160,
    cell: (info) => <span className="font-data text-[11px] text-muted-foreground">{(info.getValue() as string[])?.map((l) => l.toUpperCase()).join(", ") || "—"}</span>,
  }),
  col.accessor("match_found", {
    header: "Résultat",
    size: 100,
    cell: (info) => {
      const s = info.row.original;
      if (s.status === "processing") return <span className="flex items-center gap-1 text-[11px] text-blue-600"><Loader2 className="h-3 w-3 animate-spin" />En cours</span>;
      return info.getValue()
        ? <span className="flex items-center gap-1 text-[11px] font-medium text-orange-600"><AlertTriangle className="h-3 w-3" />Match</span>
        : <span className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle className="h-3 w-3" />Clean</span>;
    },
  }),
  col.accessor("review_decision", {
    header: "Revue",
    size: 100,
    cell: (info) => {
      const v = info.getValue();
      if (v === "confirmed_match") return <span className="text-[11px] text-red-600">Confirmé</span>;
      if (v === "false_positive") return <span className="text-[11px] text-emerald-600">Faux +</span>;
      if (v === "pending") return <span className="text-[11px] font-medium text-red-600">À revoir</span>;
      return <span className="text-[11px] text-muted-foreground">—</span>;
    },
  }),
  col.accessor("created_at", {
    header: "Date",
    size: 110,
    cell: (info) => <span className="font-data text-[11px] text-muted-foreground">{new Date(info.getValue() as string).toLocaleDateString("fr-FR")}</span>,
  }),
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ScreeningTable({ screenings }: { screenings: any[] }) {
  return <DataTable columns={columns} data={screenings} searchPlaceholder="Filtrer les screenings..." />;
}
