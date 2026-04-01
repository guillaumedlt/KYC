"use client";

import { useState } from "react";
import { Loader2, Search, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  pep: "PEP",
  sanctions: "Sanctions",
  adverse_media: "Adverse media",
};

interface Props {
  screenings: Record<string, unknown>[];
  relations: Record<string, unknown>[];
  entityId: string;
  entity: Record<string, unknown>;
}

export function ScreeningTab({ screenings, relations, entityId, entity }: Props) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Gather all entity IDs in this dossier
  const allEntityIds = [entityId, ...relations.map((r) => (r.from_entity_id as string) === entityId ? (r.to_entity_id as string) : (r.from_entity_id as string))];
  const uniqueEntityIds = [...new Set(allEntityIds)];

  // Group screenings by entity
  const screeningsByEntity: Record<string, Record<string, unknown>[]> = {};
  for (const s of screenings) {
    const eid = s.entity_id as string;
    if (!screeningsByEntity[eid]) screeningsByEntity[eid] = [];
    screeningsByEntity[eid].push(s);
  }

  // Get entity names from relations + main entity
  const entityNames: Record<string, string> = {};
  entityNames[entityId] = (entity?.display_name as string) ?? entityId;
  for (const r of relations) {
    const fromEntity = r.from_entity as Record<string, unknown> | null;
    const toEntity = r.to_entity as Record<string, unknown> | null;
    if (fromEntity) entityNames[fromEntity.id as string] = (fromEntity.display_name as string) ?? (fromEntity.id as string);
    if (toEntity) entityNames[toEntity.id as string] = (toEntity.display_name as string) ?? (toEntity.id as string);
  }

  async function launchGlobalScreening() {
    setRunning(true);
    setLastResult(null);
    try {
      // Screen all entities in parallel
      const promises = uniqueEntityIds.map((eid) => {
        const name = entityNames[eid] ?? eid;
        return fetch("/api/screening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityId: eid,
            name,
            type: "person",
            screeningType: "all",
          }),
        });
      });
      await Promise.all(promises);
      setLastResult(`Screening global lance pour ${uniqueEntityIds.length} entite${uniqueEntityIds.length > 1 ? "s" : ""}`);
      setTimeout(() => window.location.reload(), 3000);
    } catch {
      setLastResult("Erreur lors du screening global");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Global screening button */}
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
        <div>
          <p className="text-[12px] font-medium text-foreground">Screening global du dossier</p>
          <p className="text-[10px] text-muted-foreground">
            PEP + Sanctions + Adverse Media pour les {uniqueEntityIds.length} entite{uniqueEntityIds.length > 1 ? "s" : ""} du dossier
          </p>
        </div>
        <Button size="sm" onClick={launchGlobalScreening} disabled={running} className="h-7 text-[10px]">
          {running ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Search className="mr-1.5 h-3 w-3" />}
          {running ? "En cours..." : "Lancer screening global"}
        </Button>
      </div>

      {lastResult && (
        <div className="rounded-md bg-muted/30 px-4 py-2 text-[11px] text-foreground">{lastResult}</div>
      )}

      {/* Results by entity */}
      {screenings.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-6 text-center">
          <Search className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
          <p className="text-[11px] text-muted-foreground">Aucun screening effectue</p>
          <p className="text-[10px] text-muted-foreground">Lancez un screening global pour analyser toutes les entites du dossier.</p>
        </div>
      ) : (
        uniqueEntityIds.map((eid) => {
          const entityScreenings = screeningsByEntity[eid];
          if (!entityScreenings || entityScreenings.length === 0) return null;
          const name = entityNames[eid] ?? eid;
          const isMainEntity = eid === entityId;

          return (
            <div key={eid} className="rounded-md border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <span className="text-[11px] font-medium text-foreground">{name}</span>
                {isMainEntity && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground">Entite principale</span>
                )}
                <span className="font-data text-[10px] text-muted-foreground">{entityScreenings.length} screening{entityScreenings.length > 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-border/50">
                {entityScreenings.map((s) => {
                  const hasMatch = s.match_found === true;
                  const isProcessing = s.status === "processing";
                  const isClean = !hasMatch && s.status === "completed";
                  return (
                    <div key={s.id as string} className="flex items-center justify-between px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        {hasMatch ? (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        ) : isProcessing ? (
                          <Clock className="h-3 w-3 text-blue-500" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                        )}
                        <span className="text-[11px] text-foreground">
                          {TYPE_LABELS[s.screening_type as string] ?? (s.screening_type as string)}
                        </span>
                        {(s.lists_checked as string[])?.length > 0 && (
                          <span className="font-data text-[9px] text-muted-foreground">
                            {(s.lists_checked as string[]).map((l) => l.toUpperCase()).join(", ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-medium",
                            hasMatch ? "bg-orange-50 text-orange-700" : isProcessing ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {hasMatch ? "Match" : isProcessing ? "En cours" : "Clean"}
                        </span>
                        {!!s.review_decision && (
                          <span
                            className={cn(
                              "rounded px-1 py-0.5 text-[8px]",
                              s.review_decision === "confirmed_match" ? "bg-red-50 text-red-700" : s.review_decision === "false_positive" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            )}
                          >
                            {s.review_decision === "confirmed_match" ? "Confirme" : s.review_decision === "false_positive" ? "Faux positif" : "En attente"}
                          </span>
                        )}
                        <span className="font-data text-[8px] text-muted-foreground/50">
                          {new Date(s.created_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
