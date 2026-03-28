import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Building2, Landmark, ExternalLink } from "lucide-react";
import {
  getEntityById,
  getRelationsForEntity,
  getCasesForEntity,
  getActivitiesForEntity,
  getScreeningsForEntity,
  getRiskFactors,
  MOCK_ENTITIES,
} from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge, CaseStatusBadge } from "@/components/features/status-badge";
import { EntityActions } from "@/components/features/entity-actions";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const TYPE_CONFIG: Record<string, { label: string; icon: typeof User; className: string }> = {
  person: { label: "Personne physique", icon: User, className: "bg-blue-50 text-blue-600" },
  company: { label: "Société", icon: Building2, className: "bg-violet-50 text-violet-600" },
  trust: { label: "Trust", icon: Landmark, className: "bg-amber-50 text-amber-600" },
  foundation: { label: "Fondation", icon: Landmark, className: "bg-amber-50 text-amber-600" },
};

const RELATION_LABELS: Record<string, string> = {
  ubo: "Bénéficiaire effectif",
  shareholder: "Actionnaire",
  director: "Dirigeant",
  officer: "Officer",
  trustee: "Trustee",
  beneficiary: "Bénéficiaire",
  family_spouse: "Conjoint",
  legal_representative: "Représentant légal",
  authorized_signatory: "Signataire autorisé",
};

const COUNTRY_FLAGS: Record<string, string> = {
  MC: "🇲🇨", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", RU: "🇷🇺", GB: "🇬🇧", US: "🇺🇸", CH: "🇨🇭", DE: "🇩🇪",
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

      {/* Content */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Person details */}
          {person && (
            <section>
              <span className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                <User className="h-3 w-3 text-blue-500" />
                Informations personnelles
              </span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <Field label="Prénom" value={person.first_name} />
                <Field label="Nom" value={person.last_name} />
                <Field label="Date de naissance" value={person.date_of_birth} mono />
                <Field
                  label="Nationalité"
                  value={person.nationality ? `${COUNTRY_FLAGS[person.nationality] ?? ""} ${person.nationality}` : null}
                />
                <Field
                  label="Résidence"
                  value={person.country_of_residence ? `${COUNTRY_FLAGS[person.country_of_residence] ?? ""} ${person.country_of_residence}` : null}
                />
                <Field
                  label="PEP"
                  value={person.is_pep ? "Oui" : "Non"}
                  highlight={person.is_pep}
                />
                {person.is_pep && person.pep_details && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-[11px] text-muted-foreground">Fonction PEP</span>
                    <p className="rounded-md bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-800">
                      {(person.pep_details as Record<string, string>).position}
                      {(person.pep_details as Record<string, string>).since &&
                        ` (depuis ${(person.pep_details as Record<string, string>).since})`}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Company details */}
          {company && (
            <section>
              <span className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                <Building2 className="h-3 w-3 text-violet-500" />
                Informations société
              </span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <Field label="Raison sociale" value={company.legal_name} />
                <Field label="Nom commercial" value={company.trading_name} />
                <Field label="N° registre" value={company.registration_number} mono />
                <Field
                  label="Juridiction"
                  value={company.jurisdiction ? `${COUNTRY_FLAGS[company.jurisdiction] ?? ""} ${company.jurisdiction}` : null}
                />
                <Field label="Forme juridique" value={company.company_type?.toUpperCase()} />
                <Field label="Secteur" value={company.industry} />
                <Field label="Date d'immatriculation" value={
                  company.incorporation_date
                    ? new Date(company.incorporation_date).toLocaleDateString("fr-FR")
                    : null
                } mono />
              </div>
            </section>
          )}

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
                  const otherType = TYPE_CONFIG[otherEntity?.type ?? "person"];
                  const OtherIcon = otherType?.icon ?? User;
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          otherType?.className ?? "bg-secondary text-muted-foreground",
                        )}>
                          <OtherIcon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <Link
                            href={`/entities/${otherEntityId}`}
                            className="text-[13px] font-medium text-foreground hover:underline"
                          >
                            {otherEntity?.display_name ?? otherEntityId}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {isFrom ? "" : "← "}
                            {RELATION_LABELS[rel.relation_type] ?? rel.relation_type}
                            {rel.ownership_percentage != null && (
                              <span className="font-data font-medium"> · {rel.ownership_percentage}%</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/entities/${otherEntityId}`}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Screening results */}
          {screenings.length > 0 && (
            <section>
              <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Screening ({screenings.length})
              </span>
              <div className="space-y-2">
                {screenings.map((s) => (
                  <div key={s.id} className={cn(
                    "flex items-center justify-between rounded-lg px-4 py-2.5",
                    s.match_found ? "bg-orange-50" : s.status === "processing" ? "bg-blue-50" : "bg-emerald-50",
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium">
                        {s.screening_type === "pep" ? "PEP" : s.screening_type === "sanctions" ? "Sanctions" : "Adverse media"}
                      </span>
                      <span className="font-data text-[10px] text-muted-foreground">
                        {s.lists_checked.map((l) => l.toUpperCase()).join(", ")}
                      </span>
                    </div>
                    <span className={cn(
                      "text-[11px] font-medium",
                      s.match_found ? "text-orange-600" : s.status === "processing" ? "text-blue-600" : "text-emerald-600",
                    )}>
                      {s.match_found ? "Match" : s.status === "processing" ? "En cours" : "Clean"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Risk factors */}
          {riskFactors.length > 0 && (
            <section>
              <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Facteurs de risque
              </span>
              <div className="space-y-1.5">
                {riskFactors.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-4 py-2">
                    <span className={cn(
                      "font-data text-[12px] font-semibold",
                      f.impact >= 20 ? "text-red-600" : f.impact >= 10 ? "text-amber-600" : "text-muted-foreground",
                    )}>
                      +{f.impact}
                    </span>
                    <div>
                      <p className="text-[12px] font-medium text-foreground">{f.factor}</p>
                      <p className="text-[11px] text-muted-foreground">{f.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* KYC Cases */}
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
                      <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                        <td className="px-4 py-2">
                          <Link href={`/cases/${c.id}`} className="font-data text-[13px] font-medium hover:underline">
                            {c.case_number}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-[13px] text-muted-foreground">{c.vigilance_level}</td>
                        <td className="px-4 py-2 text-right"><CaseStatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Right — Timeline */}
        <div>
          <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Timeline
          </span>
          {activities.length > 0 ? (
            <div>
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 border-b border-border/50 py-3 last:border-0">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div className="flex-1">
                    <p className="text-[12px] text-foreground">{activity.title}</p>
                    {activity.description && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{activity.description}</p>
                    )}
                    <p className="mt-1 font-data text-[10px] text-muted-foreground/60">
                      {new Date(activity.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      {activity.agent_id && (
                        <span className="ml-1.5 rounded bg-secondary px-1 py-px text-[9px]">IA</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">Aucune activité</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <p className={cn(
        "text-[13px] text-foreground",
        mono && "font-data",
        highlight && "font-medium text-amber-700",
      )}>
        {value ?? "—"}
      </p>
    </div>
  );
}
