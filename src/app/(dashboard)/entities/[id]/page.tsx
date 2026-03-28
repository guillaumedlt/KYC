import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Building2, Landmark } from "lucide-react";
import {
  getEntityById,
  getRelationsForEntity,
  getCasesForEntity,
  getActivitiesForEntity,
  getScreeningsForEntity,
  getRiskFactors,
  MOCK_ENTITIES,
} from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge } from "@/components/features/status-badge";
import { EntityActions } from "@/components/features/entity-actions";
import { EntityTabs } from "@/components/features/entity-tabs";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const TYPE_CONFIG: Record<string, { label: string; icon: typeof User; className: string }> = {
  person: { label: "Personne physique", icon: User, className: "bg-blue-50 text-blue-600" },
  company: { label: "Société", icon: Building2, className: "bg-violet-50 text-violet-600" },
  trust: { label: "Trust", icon: Landmark, className: "bg-amber-50 text-amber-600" },
  foundation: { label: "Fondation", icon: Landmark, className: "bg-amber-50 text-amber-600" },
};

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entity = getEntityById(id);
  if (!entity) notFound();

  const relations = getRelationsForEntity(id);
  const cases = getCasesForEntity(id);
  const activities = getActivitiesForEntity(id);
  const screenings = getScreeningsForEntity(id);
  const riskFactors = getRiskFactors(id);

  const person = "person" in entity ? entity.person : null;
  const company = "company" in entity ? entity.company : null;
  const typeConf = TYPE_CONFIG[entity.type] ?? TYPE_CONFIG.person;
  const TypeIcon = typeConf.icon;

  const matchCount = screenings.filter((s) => s.match_found).length;
  const cleanCount = screenings.filter((s) => s.status === "completed" && !s.match_found).length;
  const openCases = cases.filter((c) => !["approved", "rejected", "closed"].includes(c.status));

  return (
    <div>
      <Link
        href="/entities"
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Entités
      </Link>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            typeConf.className,
          )}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {entity.display_name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                typeConf.className,
              )}>
                {typeConf.label}
              </span>
              <KycStatusBadge status={entity.kyc_status} />
              {entity.risk_level && (
                <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />
              )}
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-medium",
                    tag === "pep" ? "bg-amber-50 text-amber-700" :
                    tag === "sanctions-match" ? "bg-red-50 text-red-700" :
                    "bg-secondary text-muted-foreground",
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <EntityActions
          entityId={id}
          entityName={entity.display_name}
          hasOpenCase={openCases.length > 0}
        />
      </div>

      {/* Summary strip — the 5-second overview */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Risque"
          value={entity.risk_score != null ? String(entity.risk_score) : "—"}
          sub={entity.risk_level ?? "non évalué"}
          color={
            entity.risk_level === "critical" ? "text-red-600" :
            entity.risk_level === "high" ? "text-orange-600" :
            entity.risk_level === "medium" ? "text-amber-600" :
            "text-emerald-600"
          }
        />
        <SummaryCard
          label="Screening"
          value={matchCount > 0 ? `${matchCount} match` : cleanCount > 0 ? "Clean" : "—"}
          sub={`${screenings.length} effectué${screenings.length !== 1 ? "s" : ""}`}
          color={matchCount > 0 ? "text-orange-600" : cleanCount > 0 ? "text-emerald-600" : "text-muted-foreground"}
        />
        <SummaryCard
          label="Relations"
          value={String(relations.length)}
          sub={`lien${relations.length !== 1 ? "s" : ""}`}
          color="text-foreground"
        />
        <SummaryCard
          label="Dossiers"
          value={String(cases.length)}
          sub={openCases.length > 0 ? `${openCases.length} ouvert${openCases.length !== 1 ? "s" : ""}` : "aucun ouvert"}
          color={openCases.length > 0 ? "text-blue-600" : "text-muted-foreground"}
        />
      </div>

      {/* Tabs */}
      <EntityTabs
        entityId={id}
        entityType={entity.type}
        person={person}
        company={company}
        relations={relations}
        cases={cases}
        activities={activities}
        screenings={screenings}
        riskFactors={riskFactors}
        allEntities={MOCK_ENTITIES}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-secondary/40 px-4 py-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <p className={cn("font-data text-xl font-semibold tracking-tight", color)}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
