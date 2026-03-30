"use client";

import { useState } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { KycStatusBadge, RiskBadge } from "@/components/features/status-badge";
import { DataTable } from "@/components/features/data-table";
import { User, Building2, Landmark, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel, KycStatus } from "@/types";

type Filter = "all" | "person" | "company" | "structure";
const FILTERS: { key: Filter; label: string; types: string[] }[] = [
  { key: "all", label: "Tous", types: [] },
  { key: "person", label: "Personnes", types: ["person"] },
  { key: "company", label: "Sociétés", types: ["company"] },
  { key: "structure", label: "Structures", types: ["trust", "foundation", "spv", "fund"] },
];
const TYPE_ICON: Record<string, typeof User> = { person: User, company: Building2, trust: Landmark, foundation: Landmark };
const TYPE_LABEL: Record<string, string> = { person: "Personne", company: "Société", trust: "Trust", foundation: "Fondation" };
const FLAGS: Record<string, string> = { MC: "🇲🇨", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", RU: "🇷🇺", GB: "🇬🇧", US: "🇺🇸", CH: "🇨🇭" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNat(entity: any) {
  if (entity.entity_people?.nationality) return entity.entity_people.nationality;
  if (entity.entity_companies?.jurisdiction) return entity.entity_companies.jurisdiction;
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const col = createColumnHelper<any>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns = [
  col.accessor("display_name", {
    header: "Nom",
    size: 280,
    cell: (info) => {
      const entity = info.row.original;
      const Icon = TYPE_ICON[entity.type] ?? User;
      return (
        <div className="flex items-center gap-2.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <Link href={`/entities/${entity.id}`} className="text-[12px] font-medium text-foreground hover:underline">{info.getValue()}</Link>
          {entity.tags?.map((tag: string) => (
            <span key={tag} className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-medium",
              tag === "pep" ? "bg-amber-50 text-amber-700" : tag === "sanctions-match" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground"
            )}>{tag}</span>
          ))}
        </div>
      );
    },
  }),
  col.accessor("type", {
    header: "Type",
    size: 100,
    cell: (info) => <span className="text-[11px] text-muted-foreground">{TYPE_LABEL[info.getValue()] ?? info.getValue()}</span>,
  }),
  col.accessor((row) => getNat(row), {
    id: "country",
    header: "Pays",
    size: 80,
    cell: (info) => {
      const nat = info.getValue() as string | null;
      return nat ? <span className="text-[11px]">{FLAGS[nat] ?? ""} {nat}</span> : <span className="text-[11px] text-muted-foreground">—</span>;
    },
  }),
  col.accessor("risk_score", {
    header: "Risque",
    size: 110,
    cell: (info) => {
      const entity = info.row.original;
      return entity.risk_level ? <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} /> : <span className="text-[11px] text-muted-foreground">—</span>;
    },
  }),
  col.accessor("kyc_status", {
    header: "KYC",
    size: 110,
    cell: (info) => <KycStatusBadge status={info.getValue() as KycStatus} />,
  }),
  col.accessor("last_reviewed_at", {
    header: "Dernière revue",
    size: 120,
    cell: (info) => (
      <span className="font-data text-[11px] text-muted-foreground">
        {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString("fr-FR") : "—"}
      </span>
    ),
  }),
  col.accessor("updated_at", {
    header: "Mis à jour",
    size: 120,
    cell: (info) => (
      <span className="font-data text-[11px] text-muted-foreground">
        {new Date(info.getValue() as string).toLocaleDateString("fr-FR")}
      </span>
    ),
  }),
  col.accessor("source", {
    header: "Source",
    size: 80,
    cell: (info) => <span className="text-[11px] text-muted-foreground">{info.getValue()}</span>,
  }),
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EntitiesClient({ entities }: { entities: any[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = entities.filter((e) => filter === "all" || FILTERS.find((f) => f.key === filter)?.types.includes(e.type));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn("rounded-md px-2.5 py-1 text-[11px] transition-colors",
                filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
              {f.label}
            </button>
          ))}
        </div>
        <Link href="/entities/new" className="flex h-7 items-center gap-1.5 rounded-md bg-foreground px-3 text-[11px] font-medium text-background transition-colors hover:bg-foreground/90">
          <Plus className="h-3 w-3" /> Nouvelle vérification
        </Link>
      </div>

      <DataTable columns={columns} data={filtered} searchPlaceholder="Filtrer les entités..." />
    </div>
  );
}
