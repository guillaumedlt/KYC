import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Building2, Landmark } from "lucide-react";
import { getEntityById, getRelationsForEntity, getCasesForEntity, getActivitiesForEntity, getScreeningsForEntity, getRiskFactors, MOCK_ENTITIES } from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge } from "@/components/features/status-badge";
import { EntityActions } from "@/components/features/entity-actions";
import { EntityTabs } from "@/components/features/entity-tabs";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const TYPE_C: Record<string, { label: string; icon: typeof User }> = {
  person: { label: "Personne", icon: User },
  company: { label: "Société", icon: Building2 },
  trust: { label: "Trust", icon: Landmark },
  foundation: { label: "Fondation", icon: Landmark },
};

export default async function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const tc = TYPE_C[entity.type] ?? TYPE_C.person;
  const Icon = tc.icon;
  const matchCount = screenings.filter((s) => s.match_found).length;
  const openCases = cases.filter((c) => !["approved", "rejected", "closed"].includes(c.status));

  return (
    <div>
      <Link href="/entities" className="mb-3 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" />Entités
      </Link>

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-foreground">{entity.display_name}</h2>
              <span className="text-[10px] text-muted-foreground">{tc.label}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <KycStatusBadge status={entity.kyc_status} />
              {entity.risk_level && <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />}
              {entity.tags.map((t) => (
                <span key={t} className={cn("rounded px-1 py-px text-[9px]",
                  t === "pep" ? "bg-amber-100 text-amber-700" : t === "sanctions-match" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                )}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <EntityActions entityId={id} entityName={entity.display_name} hasOpenCase={openCases.length > 0} />
      </div>

      {/* Summary strip */}
      <div className="mb-3 flex gap-4 border-b border-border pb-3">
        <MiniStat label="Risque" value={entity.risk_score != null ? String(entity.risk_score) : "—"} />
        <MiniStat label="Screening" value={matchCount > 0 ? `${matchCount} match` : screenings.length > 0 ? "Clean" : "—"} />
        <MiniStat label="Relations" value={String(relations.length)} />
        <MiniStat label="Dossiers" value={String(cases.length)} />
      </div>

      {/* Tabs */}
      <EntityTabs
        entityId={id} entityType={entity.type}
        person={person} company={company}
        relations={relations} cases={cases} activities={activities}
        screenings={screenings} riskFactors={riskFactors} allEntities={MOCK_ENTITIES}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className="font-data text-[13px] font-semibold text-foreground">{value}</p>
    </div>
  );
}
