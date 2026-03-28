"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_ENTITIES } from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge } from "@/components/features/status-badge";
import { CreateEntityDialog } from "@/components/features/create-entity-dialog";
import { User, Building2, Landmark, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

type Filter = "all" | "person" | "company" | "structure";

const FILTERS: { key: Filter; label: string; icon: typeof User; types: string[] }[] = [
  { key: "all", label: "Toutes", icon: CircleDot, types: [] },
  { key: "person", label: "Personnes", icon: User, types: ["person"] },
  { key: "company", label: "Sociétés", icon: Building2, types: ["company"] },
  { key: "structure", label: "Structures", icon: Landmark, types: ["trust", "foundation", "spv", "fund"] },
];

const TYPE_CONFIG: Record<string, { label: string; icon: typeof User; className: string }> = {
  person: { label: "Personne", icon: User, className: "bg-blue-50 text-blue-600" },
  company: { label: "Société", icon: Building2, className: "bg-violet-50 text-violet-600" },
  trust: { label: "Trust", icon: Landmark, className: "bg-amber-50 text-amber-600" },
  foundation: { label: "Fondation", icon: Landmark, className: "bg-amber-50 text-amber-600" },
  spv: { label: "SPV", icon: Landmark, className: "bg-amber-50 text-amber-600" },
  fund: { label: "Fonds", icon: Landmark, className: "bg-amber-50 text-amber-600" },
};

const COUNTRY_FLAGS: Record<string, string> = {
  MC: "🇲🇨", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", RU: "🇷🇺", GB: "🇬🇧", US: "🇺🇸",
  CH: "🇨🇭", DE: "🇩🇪", BE: "🇧🇪", LU: "🇱🇺", PT: "🇵🇹", BR: "🇧🇷", LB: "🇱🇧",
};

function getSubline(entity: (typeof MOCK_ENTITIES)[number]) {
  if ("person" in entity && entity.person) {
    const p = entity.person;
    const parts: string[] = [];
    if (p.nationality) parts.push(`${COUNTRY_FLAGS[p.nationality] ?? ""} ${p.nationality}`);
    if (p.country_of_residence && p.country_of_residence !== p.nationality) {
      parts.push(`résident ${COUNTRY_FLAGS[p.country_of_residence] ?? ""} ${p.country_of_residence}`);
    }
    if (p.is_pep) parts.push("PEP");
    return parts.join(" · ");
  }
  if ("company" in entity && entity.company) {
    const c = entity.company;
    const parts: string[] = [];
    if (c.company_type) parts.push(c.company_type.toUpperCase());
    if (c.jurisdiction) parts.push(`${COUNTRY_FLAGS[c.jurisdiction] ?? ""} ${c.jurisdiction}`);
    if (c.industry) parts.push(c.industry);
    return parts.join(" · ");
  }
  return "";
}

export default function EntitiesPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = MOCK_ENTITIES.filter((e) => {
    if (filter === "all") return true;
    const f = FILTERS.find((f) => f.key === filter);
    return f?.types.includes(e.type);
  });

  const personCount = MOCK_ENTITIES.filter((e) => e.type === "person").length;
  const companyCount = MOCK_ENTITIES.filter((e) => e.type === "company").length;
  const structureCount = MOCK_ENTITIES.filter((e) =>
    ["trust", "foundation", "spv", "fund"].includes(e.type),
  ).length;

  return (
    <div>
      {/* Filters + actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const count =
              f.key === "all" ? MOCK_ENTITIES.length :
              f.key === "person" ? personCount :
              f.key === "company" ? companyCount : structureCount;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-all",
                  filter === f.key
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <f.icon className="h-3 w-3" />
                {f.label}
                <span className={cn(
                  "font-data text-[10px]",
                  filter === f.key ? "text-background/60" : "text-muted-foreground/50",
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <CreateEntityDialog />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Entité
              </th>
              <th className="w-24 px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Type
              </th>
              <th className="w-28 px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Risque
              </th>
              <th className="w-28 px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                KYC
              </th>
              <th className="w-32 px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Dernière revue
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <p className="text-[13px] text-muted-foreground">
                    Aucune entité dans cette catégorie
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((entity) => {
                const typeConf = TYPE_CONFIG[entity.type];
                const TypeIcon = typeConf?.icon ?? CircleDot;
                const subline = getSubline(entity);
                return (
                  <tr
                    key={entity.id}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          typeConf?.className ?? "bg-secondary text-muted-foreground",
                        )}>
                          <TypeIcon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <Link
                            href={`/entities/${entity.id}`}
                            className="text-[13px] font-medium text-foreground hover:underline"
                          >
                            {entity.display_name}
                          </Link>
                          {subline && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {subline}
                            </p>
                          )}
                          {entity.tags.length > 0 && (
                            <div className="mt-1 flex gap-1">
                              {entity.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[9px] font-medium",
                                    tag === "pep" ? "bg-amber-50 text-amber-700" :
                                    tag === "sanctions-match" ? "bg-red-50 text-red-700" :
                                    tag === "high-risk-country" ? "bg-orange-50 text-orange-700" :
                                    "bg-secondary text-muted-foreground",
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        typeConf?.className ?? "bg-secondary text-muted-foreground",
                      )}>
                        {typeConf?.label ?? entity.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entity.risk_level ? (
                        <RiskBadge
                          level={entity.risk_level as RiskLevel}
                          score={entity.risk_score}
                        />
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <KycStatusBadge status={entity.kyc_status} />
                    </td>
                    <td className="px-4 py-3 text-right font-data text-[11px] text-muted-foreground">
                      {entity.last_reviewed_at
                        ? new Date(entity.last_reviewed_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="font-data text-[11px] text-muted-foreground">
          {filtered.length} entité{filtered.length !== 1 ? "s" : ""}
          {filter !== "all" && ` (${MOCK_ENTITIES.length} total)`}
        </span>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-blue-500" /> {personCount}
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-violet-500" /> {companyCount}
          </span>
          {structureCount > 0 && (
            <span className="flex items-center gap-1">
              <Landmark className="h-3 w-3 text-amber-500" /> {structureCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
