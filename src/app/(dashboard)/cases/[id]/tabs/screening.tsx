"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronRight, ExternalLink, Shield, Globe, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  pep: "PEP — Personnes Politiquement Exposées",
  sanctions: "Sanctions internationales (ONU, UE, OFAC, UK HMT, Monaco)",
  adverse_media: "Adverse Media — Médias défavorables",
};

const TYPE_ICONS: Record<string, typeof Shield> = {
  pep: Shield,
  sanctions: Globe,
  adverse_media: Newspaper,
};

interface ScreeningResult {
  pep: Record<string, unknown>;
  sanctions: Record<string, unknown>;
  adverseMedia: Record<string, unknown>;
  countryRisk: Record<string, unknown>;
  sourcesChecked: { name: string; type: string; url: string; result: string }[];
  overallRisk: string;
  summary: string;
  recommendations: string[];
  confidence: number;
}

interface Props {
  screenings: Record<string, unknown>[];
  relations: Record<string, unknown>[];
  entityId: string;
  entity: Record<string, unknown>;
}

export function ScreeningTab({ screenings, relations, entityId, entity }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, ScreeningResult>>({});
  const [expandedScreenings, setExpandedScreenings] = useState<Record<string, boolean>>({});
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const allEntityIds = [entityId, ...relations.map((r) => (r.from_entity_id as string) === entityId ? (r.to_entity_id as string) : (r.from_entity_id as string))];
  const uniqueEntityIds = [...new Set(allEntityIds)];

  const screeningsByEntity: Record<string, Record<string, unknown>[]> = {};
  for (const s of screenings) {
    const eid = s.entity_id as string;
    if (!screeningsByEntity[eid]) screeningsByEntity[eid] = [];
    screeningsByEntity[eid].push(s);
  }

  const entityNames: Record<string, string> = {};
  entityNames[entityId] = (entity?.display_name as string) ?? entityId;
  for (const r of relations) {
    const fromEntity = r.from_entity as Record<string, unknown> | null;
    const toEntity = r.to_entity as Record<string, unknown> | null;
    if (fromEntity) entityNames[fromEntity.id as string] = (fromEntity.display_name as string) ?? "";
    if (toEntity) entityNames[toEntity.id as string] = (toEntity.display_name as string) ?? "";
  }

  async function launchGlobalScreening() {
    setRunning(true);
    try {
      const allResults: Record<string, ScreeningResult> = {};
      for (const eid of uniqueEntityIds) {
        const res = await fetch("/api/screening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityId: eid, screeningType: "all" }),
        });
        if (res.ok) {
          const data = await res.json();
          allResults[eid] = data;
        }
      }
      setResults(allResults);
      // Expand all results
      const expanded: Record<string, boolean> = {};
      for (const eid of Object.keys(allResults)) expanded[eid] = true;
      setExpandedScreenings(expanded);
    } catch {
      // Error handled per entity
    } finally {
      setRunning(false);
    }
  }

  async function launchSingleScreening(eid: string) {
    setRunning(true);
    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId: eid, screeningType: "all" }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults((prev) => ({ ...prev, [eid]: data }));
        setExpandedScreenings((prev) => ({ ...prev, [eid]: true }));
      }
    } catch {
      // Error
    } finally {
      setRunning(false);
    }
  }

  function toggleExpand(key: string) {
    setExpandedScreenings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleSources(key: string) {
    setExpandedSources((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-4">
      {/* Global screening button */}
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
        <div>
          <p className="text-[12px] font-medium text-foreground">Screening global du dossier</p>
          <p className="text-[10px] text-muted-foreground">
            PEP + Sanctions + Adverse Media + Risque Pays pour {uniqueEntityIds.length} entité{uniqueEntityIds.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={launchGlobalScreening} disabled={running} className="h-7 text-[10px]">
          {running ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Search className="mr-1.5 h-3 w-3" />}
          {running ? "Analyse en cours..." : "Lancer screening global"}
        </Button>
      </div>

      {/* Live results from current session */}
      {Object.keys(results).length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Résultats du screening en cours</p>
          {Object.entries(results).map(([eid, result]) => (
            <ScreeningResultCard
              key={eid}
              entityId={eid}
              entityName={entityNames[eid] ?? eid}
              isMainEntity={eid === entityId}
              result={result}
              expanded={expandedScreenings[eid] ?? false}
              sourcesExpanded={expandedSources[eid] ?? false}
              onToggle={() => toggleExpand(eid)}
              onToggleSources={() => toggleSources(eid)}
            />
          ))}
        </div>
      )}

      {/* Historical screenings from DB */}
      {screenings.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Historique des screenings</p>
          {uniqueEntityIds.map((eid) => {
            const entityScreenings = screeningsByEntity[eid];
            if (!entityScreenings?.length) return null;
            const name = entityNames[eid] ?? eid;
            const hasAnyMatch = entityScreenings.some((s) => s.match_found);
            const histKey = `hist-${eid}`;
            const isExpanded = expandedScreenings[histKey] ?? false;

            return (
              <div key={eid} className={cn("rounded-md border bg-card", hasAnyMatch ? "border-red-200" : "border-border")}>
                <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/10" onClick={() => toggleExpand(histKey)}>
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    {hasAnyMatch ? <AlertTriangle className="h-3 w-3 text-red-500" /> : <CheckCircle className="h-3 w-3 text-emerald-500" />}
                    <span className="text-[11px] font-medium text-foreground">{name}</span>
                    {eid === entityId && <span className="rounded bg-muted px-1 py-px text-[8px] text-muted-foreground">Principal</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-data text-[9px] text-muted-foreground">{entityScreenings.length} screening{entityScreenings.length > 1 ? "s" : ""}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", hasAnyMatch ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
                      {hasAnyMatch ? "Match détecté" : "Clean"}
                    </span>
                    <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[9px]" onClick={(e) => { e.stopPropagation(); launchSingleScreening(eid); }} disabled={running}>
                      <Search className="h-2.5 w-2.5 mr-0.5" />Re-screener
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/50 divide-y divide-border/30">
                    {entityScreenings.map((s) => {
                      // Parse the full payload from matches (new format has details, sources, summary)
                      const rawMatches = (() => { try { return typeof s.matches === "string" ? JSON.parse(s.matches as string) : s.matches; } catch { return {}; } })() as Record<string, unknown>;
                      const isNewFormat = rawMatches && !Array.isArray(rawMatches) && "sourcesChecked" in rawMatches;
                      const matchDetails = isNewFormat ? (rawMatches.details as Record<string, unknown>[]) ?? [] : (Array.isArray(rawMatches) ? rawMatches : []) as Record<string, unknown>[];
                      const storedSummary = isNewFormat ? String(rawMatches.summary ?? "") : "";
                      const storedSources = isNewFormat ? (rawMatches.sourcesChecked as { name: string; type: string; url: string; result: string }[]) ?? [] : [];
                      const storedRecommendations = isNewFormat ? (rawMatches.recommendations as string[]) ?? [] : [];
                      const hasMatch = s.match_found === true;
                      const TypeIcon = TYPE_ICONS[s.screening_type as string] ?? Search;
                      const screenKey = s.id as string;
                      const isScreenExpanded = expandedScreenings[screenKey] ?? hasMatch;
                      const sourcesKey = `src-${screenKey}`;
                      const isSourcesExpanded = expandedSources[sourcesKey] ?? false;

                      return (
                        <div key={s.id as string} className="px-3 py-2">
                          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(screenKey)}>
                            <div className="flex items-center gap-2">
                              {isScreenExpanded ? <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" /> : <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />}
                              <TypeIcon className={cn("h-3 w-3", hasMatch ? "text-red-500" : "text-emerald-500")} />
                              <span className="text-[11px] text-foreground">{TYPE_LABELS[s.screening_type as string] ?? (s.screening_type as string)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(s.lists_checked as string[])?.length > 0 && (
                                <div className="flex gap-0.5">
                                  {(s.lists_checked as string[]).map((l) => (
                                    <span key={l} className="rounded bg-muted px-1 py-px text-[7px] text-muted-foreground">{l.toUpperCase()}</span>
                                  ))}
                                </div>
                              )}
                              <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", hasMatch ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
                                {hasMatch ? "MATCH" : "Clean"}
                              </span>
                              {/* Manual check status */}
                              {String(s.review_decision ?? "") !== "" ? (
                                <span className={cn("rounded px-1 py-0.5 text-[8px] font-medium",
                                  s.review_decision === "confirmed_match" ? "bg-red-100 text-red-700" :
                                  s.review_decision === "false_positive" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                )}>
                                  ✓ {s.review_decision === "confirmed_match" ? "Confirmé" : s.review_decision === "false_positive" ? "Faux positif" : "En attente"}
                                </span>
                              ) : (
                                <span className="rounded bg-muted px-1 py-0.5 text-[8px] text-muted-foreground">Non revu</span>
                              )}
                              <span className="font-data text-[8px] text-muted-foreground">
                                {new Date(s.created_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>

                          {isScreenExpanded && (
                            <div className="mt-2 ml-5 space-y-2">
                              {/* Summary */}
                              {storedSummary && (
                                <div className="rounded bg-muted/30 px-3 py-1.5">
                                  <p className="text-[10px] text-foreground leading-relaxed">{storedSummary}</p>
                                </div>
                              )}

                              {/* Match details */}
                              {matchDetails.length > 0 && (
                                <div className="space-y-1">
                                  {matchDetails.map((m, mi) => (
                                    <div key={mi} className={cn("rounded px-3 py-2 text-[10px]", hasMatch ? "bg-red-50 border border-red-100" : "bg-muted/30")}>
                                      <p className="font-medium text-foreground">{String(m.name ?? m.title ?? m.function ?? m.list ?? "")}</p>
                                      {String(m.summary ?? "") !== "" && <p className="mt-0.5 text-muted-foreground">{String(m.summary)}</p>}
                                      <div className="mt-0.5 flex flex-wrap gap-1.5">
                                        {String(m.level ?? "") !== "" && <span className="text-[9px] text-red-600">Niveau : {String(m.level)}</span>}
                                        {String(m.country ?? "") !== "" && <span className="text-[9px] text-muted-foreground">Pays : {String(m.country)}</span>}
                                        {String(m.source ?? "") !== "" && <span className="text-[9px] text-muted-foreground">Source : {String(m.source)}</span>}
                                        {m.confidence != null && <span className="font-data text-[9px] text-muted-foreground">Confiance : {String(m.confidence)}%</span>}
                                        {m.relevance != null && <span className="font-data text-[9px] text-muted-foreground">Pertinence : {String(m.relevance)}%</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {!hasMatch && matchDetails.length === 0 && (
                                <p className="text-[10px] text-emerald-600">Aucun match trouvé dans les bases vérifiées.</p>
                              )}

                              {/* Recommendations */}
                              {storedRecommendations.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-medium text-muted-foreground mb-0.5">Recommandations :</p>
                                  {storedRecommendations.map((r, ri) => (
                                    <p key={ri} className="text-[9px] text-foreground">→ {r}</p>
                                  ))}
                                </div>
                              )}

                              {/* Sources checked from DB */}
                              {storedSources.length > 0 && (
                                <div>
                                  <button onClick={(e) => { e.stopPropagation(); toggleSources(sourcesKey); }} className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground">
                                    {isSourcesExpanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                                    <Search className="h-2.5 w-2.5" />
                                    {storedSources.length} sources vérifiées
                                  </button>
                                  {isSourcesExpanded && (
                                    <div className="mt-1 rounded border border-border/50 divide-y divide-border/30">
                                      {storedSources.map((src, si) => {
                                        const isM = src.result.toLowerCase().includes("match") && !src.result.toLowerCase().includes("aucun");
                                        const isC = src.result.toLowerCase().includes("aucun") || src.result.toLowerCase().includes("négatif");
                                        return (
                                          <div key={si} className="px-2.5 py-1">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isM ? "bg-red-500" : isC ? "bg-emerald-500" : "bg-amber-500")} />
                                                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-foreground hover:underline flex items-center gap-0.5 truncate">
                                                  {src.name} <ExternalLink className="h-2 w-2 shrink-0 text-muted-foreground" />
                                                </a>
                                                {String((src as Record<string, unknown>).screenshotUrl ?? "") !== "" && (
                                                  <a href={String((src as Record<string, unknown>).screenshotUrl)} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded bg-blue-50 px-1 py-px text-[7px] text-blue-600 hover:bg-blue-100">📷</a>
                                                )}
                                              </div>
                                              <span className={cn("shrink-0 text-[8px] ml-1", isM ? "text-red-600" : isC ? "text-emerald-600" : "text-amber-600")}>{src.result}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Manual review buttons */}
                              <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
                                <span className="text-[9px] text-muted-foreground mr-1">Revue manuelle :</span>
                                <ReviewButton screeningId={s.id as string} currentDecision={s.review_decision as string | null} decision="confirmed_match" label="✓ Confirmer" />
                                <ReviewButton screeningId={s.id as string} currentDecision={s.review_decision as string | null} decision="false_positive" label="✗ Faux positif" />
                                <ReviewButton screeningId={s.id as string} currentDecision={s.review_decision as string | null} decision="pending" label="⏳ En attente" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {screenings.length === 0 && Object.keys(results).length === 0 && (
        <div className="rounded-md border border-dashed border-border py-8 text-center">
          <Search className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
          <p className="text-[11px] text-muted-foreground">Aucun screening effectué</p>
          <p className="text-[10px] text-muted-foreground/70">Cliquez sur &quot;Lancer screening global&quot; pour analyser toutes les entités.</p>
        </div>
      )}
    </div>
  );
}

// ─── Full screening result card (from live results) ─────────────────

function ScreeningResultCard({ entityId, entityName, isMainEntity, result, expanded, sourcesExpanded, onToggle, onToggleSources }: {
  entityId: string; entityName: string; isMainEntity: boolean;
  result: ScreeningResult; expanded: boolean; sourcesExpanded: boolean;
  onToggle: () => void; onToggleSources: () => void;
}) {
  const hasMatch = result.pep?.match || result.sanctions?.match || result.adverseMedia?.match;
  const riskColors: Record<string, string> = {
    none: "bg-emerald-50 text-emerald-700", low: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700", high: "bg-orange-50 text-orange-700", critical: "bg-red-50 text-red-700",
  };

  return (
    <div className={cn("rounded-md border bg-card", hasMatch ? "border-red-200" : "border-emerald-200")}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/10" onClick={onToggle}>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {hasMatch ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
          <span className="text-[12px] font-medium text-foreground">{entityName}</span>
          {isMainEntity && <span className="rounded bg-muted px-1 py-px text-[8px] text-muted-foreground">Principal</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded px-2 py-0.5 text-[9px] font-medium", riskColors[result.overallRisk] ?? riskColors.none)}>
            Risque : {result.overallRisk}
          </span>
          <span className="font-data text-[9px] text-muted-foreground">Confiance {result.confidence}%</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3">
          {/* Summary */}
          <div className="rounded bg-muted/30 px-3 py-2">
            <p className="text-[11px] text-foreground leading-relaxed">{result.summary}</p>
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div>
              <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Recommandations</p>
              <ul className="space-y-0.5">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-foreground">
                    <span className="mt-0.5 text-muted-foreground">→</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Country risk */}
          {result.countryRisk && (
            <div className="flex items-center gap-2 text-[10px]">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Risque pays ({String((result.countryRisk as Record<string, unknown>).country ?? "")}) :</span>
              <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium",
                (result.countryRisk as Record<string, unknown>).gafiFatfStatus === "grey_list" ? "bg-amber-50 text-amber-700" :
                (result.countryRisk as Record<string, unknown>).gafiFatfStatus === "black_list" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              )}>
                {(result.countryRisk as Record<string, unknown>).gafiFatfStatus === "grey_list" ? "Liste grise GAFI" :
                 (result.countryRisk as Record<string, unknown>).gafiFatfStatus === "black_list" ? "Liste noire GAFI" : "OK"}
              </span>
              {String((result.countryRisk as Record<string, unknown>).details ?? "") !== "" && (
                <span className="text-[9px] text-muted-foreground">{String((result.countryRisk as Record<string, unknown>).details)}</span>
              )}
            </div>
          )}

          {/* Sources checked — always visible */}
          {result.sourcesChecked?.length > 0 && (
            <div>
              <button onClick={(e) => { e.stopPropagation(); onToggleSources(); }} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                {sourcesExpanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                <Search className="h-2.5 w-2.5" />
                {result.sourcesChecked.length} sources et bases vérifiées
              </button>

              {sourcesExpanded && (
                <div className="mt-1.5 rounded border border-border/50 divide-y divide-border/30">
                  {result.sourcesChecked.map((src, i) => {
                    const isMatch = src.result.toLowerCase().includes("match") && !src.result.toLowerCase().includes("aucun");
                    const isClean = src.result.toLowerCase().includes("aucun") || src.result.toLowerCase().includes("négatif") || src.result.toLowerCase().includes("no match");
                    return (
                      <div key={i} className="flex items-center justify-between px-3 py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isMatch ? "bg-red-500" : isClean ? "bg-emerald-500" : "bg-amber-500")} />
                          <div className="min-w-0">
                            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-foreground hover:underline flex items-center gap-0.5">
                              {src.name} <ExternalLink className="h-2 w-2 text-muted-foreground" />
                            </a>
                            <span className="text-[8px] text-muted-foreground">{src.url}</span>
                          </div>
                        </div>
                        <span className={cn("shrink-0 text-[9px] ml-2 max-w-[200px] text-right", isMatch ? "text-red-600" : isClean ? "text-emerald-600" : "text-amber-600")}>
                          {src.result}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Review Button (manual check) ───────────────────────────────────

function ReviewButton({ screeningId, currentDecision, decision, label }: {
  screeningId: string; currentDecision: string | null; decision: string; label: string;
}) {
  const [loading, setLoading] = useState(false);
  const reviewRouter = useRouter();
  const isActive = currentDecision === decision;

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isActive) return;
    setLoading(true);
    try {
      await fetch("/api/screening", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screeningId, decision }),
      });
      reviewRouter.refresh();
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }

  const colors: Record<string, string> = {
    confirmed_match: isActive ? "bg-red-100 text-red-700 border-red-200" : "border-border text-muted-foreground hover:border-red-200 hover:text-red-600",
    false_positive: isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "border-border text-muted-foreground hover:border-emerald-200 hover:text-emerald-600",
    pending: isActive ? "bg-amber-100 text-amber-700 border-amber-200" : "border-border text-muted-foreground hover:border-amber-200 hover:text-amber-600",
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || isActive}
      className={cn("rounded border px-1.5 py-0.5 text-[8px] transition-colors", colors[decision] ?? "border-border text-muted-foreground")}
    >
      {loading ? "..." : label}
    </button>
  );
}
