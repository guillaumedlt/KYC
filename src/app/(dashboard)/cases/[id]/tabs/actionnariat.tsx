"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PieChart,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SHAREHOLDER_TYPES = ["ubo", "shareholder", "beneficiary"];

const RELATION_LABELS: Record<string, string> = {
  ubo: "Beneficiaire effectif",
  shareholder: "Actionnaire",
  beneficiary: "Beneficiaire",
};

interface Props {
  relations: Record<string, unknown>[];
  entityId: string;
}

export function ActionnariatTab({ relations, entityId }: Props) {
  const shareholders = relations.filter((r) => SHAREHOLDER_TYPES.includes(r.relation_type as string));

  if (shareholders.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border py-8 text-center">
        <PieChart className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
        <p className="text-[12px] font-medium text-muted-foreground">Aucun actionnaire enregistre</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Ajoutez des actionnaires/UBOs via la fiche entite ou le wizard de creation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-1.5">
        <PieChart className="h-3 w-3 text-violet-500" />
        <span className="font-heading text-[13px] font-semibold text-foreground">Actionnariat et beneficiaires effectifs</span>
        <span className="font-data text-[10px] text-muted-foreground">{shareholders.length}</span>
      </div>
      {shareholders.map((rel) => (
        <ShareholderCard key={rel.id as string} relation={rel} entityId={entityId} />
      ))}
    </div>
  );
}

function ShareholderCard({ relation, entityId }: { relation: Record<string, unknown>; entityId: string }) {
  const [expanded, setExpanded] = useState(false);

  const isFrom = (relation.from_entity_id as string) === entityId;
  const relatedEntity = isFrom
    ? (relation.to_entity as Record<string, unknown>)
    : (relation.from_entity as Record<string, unknown>);

  const relatedId = isFrom ? (relation.to_entity_id as string) : (relation.from_entity_id as string);
  const name = (relatedEntity?.display_name as string) ?? relatedId;
  const entityType = (relatedEntity?.type as string) ?? "person";
  const isCompany = entityType !== "person";
  const percentage = relation.ownership_percentage as number | null;
  const relType = RELATION_LABELS[relation.relation_type as string] ?? (relation.relation_type as string);
  const isUbo = percentage != null && percentage >= 25;

  const person = relatedEntity?.entity_people as Record<string, unknown> | null;
  const company = relatedEntity?.entity_companies as Record<string, unknown> | null;

  return (
    <div className="rounded-md border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            isCompany ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600",
          )}>
            {isCompany ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-foreground">{name}</span>
              {isUbo && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">UBO</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{relType}</span>
              {percentage != null && (
                <span className="font-data font-medium text-foreground">{percentage}%</span>
              )}
              <span className="rounded bg-muted px-1 py-px text-[8px]">
                {isCompany ? "Societe" : "Personne"}
              </span>
              <span className="rounded bg-muted px-1 py-px text-[8px]">
                Direct
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {percentage != null && (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", isUbo ? "bg-amber-500" : "bg-blue-500")}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
          {isCompany ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : null}
        </div>
      </button>

      {/* Expanded: show details */}
      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-2">
          {/* Person details */}
          {person && (
            <div className="space-y-0.5 text-[10px] text-muted-foreground">
              {!!person.nationality && <p>Nationalite : <span className="text-foreground">{String(person.nationality)}</span></p>}
              {!!person.profession && <p>Profession : <span className="text-foreground">{String(person.profession)}</span></p>}
              {(person.is_pep as boolean) && <p className="font-medium text-amber-700">PEP</p>}
            </div>
          )}

          {/* Company details */}
          {company && (
            <div className="space-y-0.5 text-[10px] text-muted-foreground">
              {!!company.jurisdiction && <p>Juridiction : <span className="text-foreground">{String(company.jurisdiction)}</span></p>}
              {!!company.company_type && <p>Forme : <span className="text-foreground">{String(company.company_type)}</span></p>}
              {!!company.registration_number && <p>RCI : <span className="font-data text-foreground">{String(company.registration_number)}</span></p>}
            </div>
          )}

          <Link
            href={`/entities/${relatedId}`}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Voir la fiche
          </Link>
        </div>
      )}
    </div>
  );
}
