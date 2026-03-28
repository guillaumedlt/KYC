"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_ENTITIES } from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge } from "@/components/features/status-badge";
import { CreateEntityDialog } from "@/components/features/create-entity-dialog";
import { User, Building2, Landmark, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

type Filter = "all" | "person" | "company" | "structure";

const FILTERS: { key: Filter; label: string; types: string[] }[] = [
  { key: "all", label: "Tous", types: [] },
  { key: "person", label: "Personnes", types: ["person"] },
  { key: "company", label: "Sociétés", types: ["company"] },
  { key: "structure", label: "Structures", types: ["trust", "foundation", "spv", "fund"] },
];

const TYPE_ICON: Record<string, typeof User> = {
  person: User, company: Building2, trust: Landmark, foundation: Landmark, spv: Landmark, fund: Landmark,
};

const TYPE_LABEL: Record<string, string> = {
  person: "Personne", company: "Société", trust: "Trust", foundation: "Fondation",
};

const FLAGS: Record<string, string> = {
  MC: "🇲🇨", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", RU: "🇷🇺", GB: "🇬🇧", US: "🇺🇸", CH: "🇨🇭",
};

function getNat(entity: (typeof MOCK_ENTITIES)[number]) {
  if ("person" in entity && entity.person?.nationality) return entity.person.nationality;
  if ("company" in entity && entity.company?.jurisdiction) return entity.company.jurisdiction;
  return null;
}

export default function EntitiesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = MOCK_ENTITIES.filter((e) => {
    if (filter === "all") return true;
    return FILTERS.find((f) => f.key === filter)?.types.includes(e.type);
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="mr-2 text-[11px] text-muted-foreground">{filtered.length} entités</span>
          <span className="text-[11px] text-muted-foreground/40">·</span>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] transition-colors",
                filter === f.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <CreateEntityDialog />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-8 px-2 py-1.5" />
              <th className="w-7 px-1 py-1.5" />
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Nom</th>
              <th className="w-20 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="w-16 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pays</th>
              <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Risque</th>
              <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">KYC</th>
              <th className="w-24 px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Revue</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entity) => {
              const Icon = TYPE_ICON[entity.type] ?? User;
              const nat = getNat(entity);
              return (
                <tr key={entity.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-0">
                    <input type="checkbox" className="h-3 w-3 rounded border-border" />
                  </td>
                  <td className="px-1 py-0">
                    <Star className="h-3 w-3 text-muted-foreground/30 hover:text-amber-400" strokeWidth={1.5} />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      <Link href={`/entities/${entity.id}`} className="text-[12px] font-medium text-foreground hover:underline">
                        {entity.display_name}
                      </Link>
                      {entity.tags.map((tag) => (
                        <span key={tag} className={cn(
                          "rounded px-1 py-px text-[9px]",
                          tag === "pep" ? "bg-amber-100 text-amber-700" :
                          tag === "sanctions-match" ? "bg-red-100 text-red-700" :
                          "bg-muted text-muted-foreground",
                        )}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-muted-foreground">
                    {TYPE_LABEL[entity.type] ?? entity.type}
                  </td>
                  <td className="px-2 py-1.5 text-[11px]">
                    {nat && <span>{FLAGS[nat] ?? ""} {nat}</span>}
                  </td>
                  <td className="px-2 py-1.5">
                    {entity.risk_level ? (
                      <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />
                    ) : <span className="text-[11px] text-muted-foreground">—</span>}
                  </td>
                  <td className="px-2 py-1.5">
                    <KycStatusBadge status={entity.kyc_status} />
                  </td>
                  <td className="px-2 py-1.5 text-right font-data text-[11px] text-muted-foreground">
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
