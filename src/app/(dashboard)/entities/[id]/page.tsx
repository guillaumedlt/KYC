import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getEntityById,
  getRelationsForEntity,
  getCasesForEntity,
  getActivitiesForEntity,
  MOCK_ENTITIES,
} from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge, CaseStatusBadge } from "@/components/features/status-badge";
import { EntityActions } from "@/components/features/entity-actions";
import type { RiskLevel } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  person: "Personne physique",
  company: "Société",
  trust: "Trust",
  foundation: "Fondation",
};

const RELATION_LABELS: Record<string, string> = {
  ubo: "Bénéficiaire effectif",
  shareholder: "Actionnaire",
  director: "Dirigeant",
  officer: "Officer",
  family_spouse: "Conjoint",
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

  const person = "person" in entity ? entity.person : null;
  const company = "company" in entity ? entity.company : null;

  return (
    <div>
      {/* Back */}
      <Link
        href="/entities"
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Entités
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-foreground text-[15px] font-semibold text-background">
            {entity.display_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {entity.display_name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-muted-foreground">
                {TYPE_LABELS[entity.type] ?? entity.type}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <KycStatusBadge status={entity.kyc_status} />
              {entity.risk_level && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />
                </>
              )}
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <EntityActions
          entityId={id}
          entityName={entity.display_name}
          hasOpenCase={cases.some(
            (c) => !["approved", "rejected", "closed"].includes(c.status),
          )}
        />
      </div>

      {/* Content grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left — main info */}
        <div className="space-y-8">
          {/* Details */}
          <section>
            <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Informations
            </span>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {person && (
                <>
                  <Field label="Prénom" value={person.first_name} />
                  <Field label="Nom" value={person.last_name} />
                  <Field label="Date de naissance" value={person.date_of_birth} mono />
                  <Field label="Nationalité" value={person.nationality} />
                  <Field label="Résidence" value={person.country_of_residence} />
                  <Field label="PEP" value={person.is_pep ? "Oui" : "Non"} />
                </>
              )}
              {company && (
                <>
                  <Field label="Raison sociale" value={company.legal_name} />
                  <Field label="Nom commercial" value={company.trading_name} />
                  <Field label="N° registre" value={company.registration_number} mono />
                  <Field label="Juridiction" value={company.jurisdiction} />
                  <Field label="Forme juridique" value={company.company_type} />
                  <Field label="Secteur" value={company.industry} />
                </>
              )}
            </div>
          </section>

          {/* Relations */}
          {relations.length > 0 && (
            <section>
              <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Relations ({relations.length})
              </span>
              <div className="space-y-2">
                {relations.map((rel) => {
                  const isFrom = rel.from_entity_id === id;
                  const otherEntityId = isFrom ? rel.to_entity_id : rel.from_entity_id;
                  const otherEntity = MOCK_ENTITIES.find((e) => e.id === otherEntityId);
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-[11px] font-medium">
                          {otherEntity?.display_name.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <Link
                            href={`/entities/${otherEntityId}`}
                            className="text-[13px] font-medium text-foreground hover:underline"
                          >
                            {otherEntity?.display_name ?? otherEntityId}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {RELATION_LABELS[rel.relation_type] ?? rel.relation_type}
                            {rel.ownership_percentage != null && (
                              <span className="font-data"> · {rel.ownership_percentage}%</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cases */}
          {cases.length > 0 && (
            <section>
              <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Dossiers KYC ({cases.length})
              </span>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Dossier</th>
                      <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Vigilance</th>
                      <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2 font-data text-[13px]">{c.case_number}</td>
                        <td className="px-4 py-2 text-[13px] text-muted-foreground">
                          {c.vigilance_level}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <CaseStatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Right — timeline */}
        <div>
          <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Timeline
          </span>
          <div className="space-y-0">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 border-b border-border/50 py-3 last:border-0"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div className="flex-1">
                    <p className="text-[12px] text-foreground">{activity.title}</p>
                    {activity.description && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                    <p className="mt-1 font-data text-[10px] text-muted-foreground/60">
                      {new Date(activity.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {activity.agent_id && " · IA"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-muted-foreground">Aucune activité</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <p className={`text-[13px] text-foreground ${mono ? "font-data" : ""}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}
