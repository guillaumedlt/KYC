"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DIRIGEANT_TYPES = ["director", "officer", "legal_representative", "authorized_signatory", "trustee"];

const RELATION_LABELS: Record<string, string> = {
  director: "Dirigeant",
  officer: "Officer",
  legal_representative: "Representant legal",
  authorized_signatory: "Signataire autorise",
  trustee: "Trustee",
};

const DOC_STATUS_COLORS: Record<string, string> = {
  uploaded: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  extracted: "bg-violet-50 text-violet-700",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

interface Props {
  relations: Record<string, unknown>[];
  entityId: string;
  screenings: Record<string, unknown>[];
  documents: Record<string, unknown>[];
}

export function DirigeantsTab({ relations, entityId, screenings, documents }: Props) {
  const dirigeants = relations.filter((r) => DIRIGEANT_TYPES.includes(r.relation_type as string));

  if (dirigeants.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border py-8 text-center">
        <Users className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
        <p className="text-[12px] font-medium text-muted-foreground">Aucun dirigeant enregistre</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Ajoutez des dirigeants via la fiche entite ou le wizard de creation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-1.5">
        <Users className="h-3 w-3 text-blue-500" />
        <span className="font-heading text-[13px] font-semibold text-foreground">Dirigeants et representants</span>
        <span className="font-data text-[10px] text-muted-foreground">{dirigeants.length}</span>
      </div>
      {dirigeants.map((rel) => (
        <DirigantCard
          key={rel.id as string}
          relation={rel}
          entityId={entityId}
          screenings={screenings}
          documents={documents}
        />
      ))}
    </div>
  );
}

function DirigantCard({
  relation,
  entityId,
  screenings,
  documents,
}: {
  relation: Record<string, unknown>;
  entityId: string;
  screenings: Record<string, unknown>[];
  documents: Record<string, unknown>[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [screening, setScreening] = useState(false);

  // Determine the related entity (the dirigeant)
  const isFrom = (relation.from_entity_id as string) === entityId;
  const relatedEntity = isFrom
    ? (relation.to_entity as Record<string, unknown>)
    : (relation.from_entity as Record<string, unknown>);

  const relatedId = isFrom ? (relation.to_entity_id as string) : (relation.from_entity_id as string);
  const person = relatedEntity?.entity_people as Record<string, unknown> | null;
  const name = (relatedEntity?.display_name as string) ?? relatedId;
  const nationality = (person?.nationality as string) ?? null;
  const role = RELATION_LABELS[relation.relation_type as string] ?? (relation.relation_type as string);

  // Filter screenings and docs for this dirigeant
  const personScreenings = screenings.filter((s) => s.entity_id === relatedId);
  const personDocs = documents.filter((d) => d.entity_id === relatedId);

  async function handleScreening() {
    setScreening(true);
    try {
      await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: relatedId,
          name,
          type: "person",
          nationality,
          screeningType: "all",
        }),
      });
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      // silently fail
    } finally {
      setScreening(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card">
      {/* Header (always visible) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <User className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-foreground">{name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{role}</span>
              {nationality && (
                <span className="font-data text-[10px] text-muted-foreground">{nationality}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {personScreenings.some((s) => s.match_found) && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-700">Match</span>
          )}
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-3">
          {/* Documents */}
          {personDocs.length > 0 && (
            <div>
              <span className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Documents ({personDocs.length})</span>
              <div className="space-y-1">
                {personDocs.map((doc) => (
                  <div key={doc.id as string} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-foreground">{doc.name as string}</span>
                    </div>
                    <span className={cn("rounded px-1 py-0.5 text-[8px] font-medium", DOC_STATUS_COLORS[doc.status as string] ?? "bg-muted text-muted-foreground")}>
                      {doc.status as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenings */}
          {personScreenings.length > 0 && (
            <div>
              <span className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Screening ({personScreenings.length})</span>
              <div className="space-y-1">
                {personScreenings.map((s) => (
                  <div
                    key={s.id as string}
                    className={cn(
                      "flex items-center justify-between rounded px-2 py-1",
                      s.match_found ? "bg-orange-50" : s.status === "processing" ? "bg-blue-50" : "bg-emerald-50"
                    )}
                  >
                    <span className="text-[10px] font-medium">
                      {(s.screening_type as string) === "pep" ? "PEP" : (s.screening_type as string) === "sanctions" ? "Sanctions" : "Adverse media"}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-medium",
                        s.match_found ? "text-orange-600" : s.status === "processing" ? "text-blue-600" : "text-emerald-600"
                      )}
                    >
                      {s.match_found ? "Match" : s.status === "processing" ? "En cours" : "Clean"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleScreening} disabled={screening} className="h-6 text-[9px]">
              {screening ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Search className="mr-1 h-3 w-3" />}
              Lancer screening
            </Button>
            <Link
              href={`/entities/${relatedId}`}
              className="flex items-center gap-1 rounded px-2 py-1 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Voir la fiche
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
