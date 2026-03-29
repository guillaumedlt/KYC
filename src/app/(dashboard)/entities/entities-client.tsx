"use client";

import { useState } from "react";
import Link from "next/link";
import { KycStatusBadge, RiskBadge } from "@/components/features/status-badge";
import { CreateEntityDialog } from "@/components/features/create-entity-dialog";
import { User, Building2, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

type Filter = "all" | "person" | "company" | "structure";
const FILTERS: { key: Filter; label: string; types: string[] }[] = [
  { key: "all", label: "Tous", types: [] },
  { key: "person", label: "Personnes", types: ["person"] },
  { key: "company", label: "Sociétés", types: ["company"] },
  { key: "structure", label: "Structures", types: ["trust", "foundation", "spv", "fund"] },
];
const TYPE_ICON: Record<string, typeof User> = { person: User, company: Building2, trust: Landmark, foundation: Landmark, spv: Landmark, fund: Landmark };
const TYPE_LABEL: Record<string, string> = { person: "Personne", company: "Société", trust: "Trust", foundation: "Fondation" };
const FLAGS: Record<string, string> = { MC: "🇲🇨", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", RU: "🇷🇺", GB: "🇬🇧", US: "🇺🇸", CH: "🇨🇭" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNat(entity: any) {
  if (entity.entity_people?.nationality) return entity.entity_people.nationality;
  if (entity.entity_companies?.jurisdiction) return entity.entity_companies.jurisdiction;
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EntitiesClient({ entities }: { entities: any[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = entities.filter((e) => filter === "all" || FILTERS.find((f) => f.key === filter)?.types.includes(e.type));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="mr-2 text-[11px] text-muted-foreground">{filtered.length} entités</span>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn("rounded-md px-2.5 py-1 text-[11px] transition-colors",
                filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
              {f.label}
            </button>
          ))}
        </div>
        <CreateEntityDialog />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[640px]">
          <thead><tr className="border-b border-border">
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Nom</th>
            <th className="w-20 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Type</th>
            <th className="w-16 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Pays</th>
            <th className="w-24 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Risque</th>
            <th className="w-24 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">KYC</th>
            <th className="w-24 px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Revue</th>
          </tr></thead>
          <tbody>
            {filtered.map((entity) => {
              const Icon = TYPE_ICON[entity.type] ?? User;
              const nat = getNat(entity);
              return (
                <tr key={entity.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      <Link href={`/entities/${entity.id}`} className="text-[12px] font-medium text-foreground hover:underline">{entity.display_name}</Link>
                      {entity.tags?.map((tag: string) => (
                        <span key={tag} className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-medium",
                          tag === "pep" ? "bg-amber-50 text-amber-700" : tag === "sanctions-match" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground"
                        )}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{TYPE_LABEL[entity.type] ?? entity.type}</td>
                  <td className="px-4 py-2.5 text-[11px]">{nat && <span>{FLAGS[nat] ?? ""} {nat}</span>}</td>
                  <td className="px-4 py-2.5">
                    {entity.risk_level ? <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} /> : <span className="text-[11px] text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5"><KycStatusBadge status={entity.kyc_status} /></td>
                  <td className="px-4 py-2.5 text-right font-data text-[11px] text-muted-foreground">
                    {entity.last_reviewed_at ? new Date(entity.last_reviewed_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
