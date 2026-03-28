"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Building2,
  Link2,
  Search,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  ExternalLink,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge } from "@/components/features/status-badge";
import { cn } from "@/lib/utils";
import type {
  EntityPerson,
  EntityCompany,
  EntityRelation,
  KycCase,
  Activity,
  Screening,
  Entity,
} from "@/types";
import type { RiskFactor } from "@/lib/mock-data";

const COUNTRY_FLAGS: Record<string, string> = {
  MC: "🇲🇨", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", RU: "🇷🇺", GB: "🇬🇧", US: "🇺🇸", CH: "🇨🇭", DE: "🇩🇪",
};

const RELATION_LABELS: Record<string, string> = {
  ubo: "Bénéficiaire effectif", shareholder: "Actionnaire", director: "Dirigeant",
  officer: "Officer", trustee: "Trustee", beneficiary: "Bénéficiaire",
  family_spouse: "Conjoint", legal_representative: "Représentant légal",
  authorized_signatory: "Signataire autorisé",
};

type Tab = "info" | "relations" | "screening" | "cases" | "timeline";

interface Props {
  entityId: string;
  entityType: string;
  person: EntityPerson | null;
  company: EntityCompany | null;
  relations: EntityRelation[];
  cases: KycCase[];
  activities: Activity[];
  screenings: Screening[];
  riskFactors: RiskFactor[];
  allEntities: Entity[];
}

const TABS: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "info", label: "Informations", icon: FileText },
  { key: "relations", label: "Relations", icon: Link2 },
  { key: "screening", label: "Screening", icon: Search },
  { key: "cases", label: "Dossiers", icon: FileText },
  { key: "timeline", label: "Historique", icon: Clock },
];

export function EntityTabs(props: Props) {
  const [tab, setTab] = useState<Tab>("info");

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => {
          const count =
            t.key === "relations" ? props.relations.length :
            t.key === "screening" ? props.screenings.length :
            t.key === "cases" ? props.cases.length :
            t.key === "timeline" ? props.activities.length : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-[12px] transition-colors",
                tab === t.key
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {count != null && count > 0 && (
                <span className={cn("font-data text-[10px]", tab === t.key ? "text-foreground/50" : "text-muted-foreground/50")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "info" && <InfoTab {...props} />}
      {tab === "relations" && <RelationsTab {...props} />}
      {tab === "screening" && <ScreeningTab screenings={props.screenings} />}
      {tab === "cases" && <CasesTab cases={props.cases} />}
      {tab === "timeline" && <TimelineTab activities={props.activities} />}
    </div>
  );
}

// =============================================================================
// INFO TAB — with edit mode
// =============================================================================

function InfoTab({ person, company, riskFactors }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-8">
      {/* Person info */}
      {person && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <User className="h-3 w-3 text-blue-500" />
              Identité
            </span>
            <button
              onClick={() => setEditing(!editing)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-colors",
                editing
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {editing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
              {editing ? "Annuler" : "Modifier"}
            </button>
          </div>
          <div className="rounded-lg border border-border">
            <EditableField label="Prénom" value={person.first_name} editing={editing} />
            <EditableField label="Nom" value={person.last_name} editing={editing} />
            <EditableField label="Date de naissance" value={person.date_of_birth} editing={editing} mono sensitive />
            <EditableField label="Nationalité" value={person.nationality ? `${COUNTRY_FLAGS[person.nationality] ?? ""} ${person.nationality}` : null} editing={editing} />
            <EditableField label="Résidence" value={person.country_of_residence ? `${COUNTRY_FLAGS[person.country_of_residence] ?? ""} ${person.country_of_residence}` : null} editing={editing} />
            <EditableField label="Adresse" value={person.address} editing={editing} />
            <EditableField label="Téléphone" value={person.phone} editing={editing} mono sensitive />
            <EditableField label="Email" value={person.email} editing={editing} />
            <EditableField label="Profession" value={person.profession} editing={editing} />
            <EditableField label="PEP" value={person.is_pep ? "Oui" : "Non"} editing={false} highlight={person.is_pep} last />
          </div>
          {person.is_pep && person.pep_details && (
            <div className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-amber-700">Fonction PEP</span>
              <p className="text-[12px] font-medium text-amber-800">
                {(person.pep_details as Record<string, string>).position}
                {(person.pep_details as Record<string, string>).since && ` · depuis ${(person.pep_details as Record<string, string>).since}`}
              </p>
            </div>
          )}
          {editing && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" className="h-7 text-[12px]" onClick={() => setEditing(false)}>
                <Save className="mr-1 h-3 w-3" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Company info */}
      {company && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <Building2 className="h-3 w-3 text-violet-500" />
              Société
            </span>
            <button
              onClick={() => setEditing(!editing)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-colors",
                editing
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {editing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
              {editing ? "Annuler" : "Modifier"}
            </button>
          </div>
          <div className="rounded-lg border border-border">
            <EditableField label="Raison sociale" value={company.legal_name} editing={editing} />
            <EditableField label="Nom commercial" value={company.trading_name} editing={editing} />
            <EditableField label="N° registre" value={company.registration_number} editing={editing} mono />
            <EditableField label="Juridiction" value={company.jurisdiction ? `${COUNTRY_FLAGS[company.jurisdiction] ?? ""} ${company.jurisdiction}` : null} editing={editing} />
            <EditableField label="Forme juridique" value={company.company_type?.toUpperCase()} editing={editing} />
            <EditableField label="Secteur" value={company.industry} editing={editing} />
            <EditableField label="Immatriculation" value={company.incorporation_date ? new Date(company.incorporation_date).toLocaleDateString("fr-FR") : null} editing={editing} mono />
            <EditableField label="Adresse" value={company.address} editing={editing} />
            <EditableField label="Téléphone" value={company.phone} editing={editing} mono sensitive />
            <EditableField label="Email" value={company.email} editing={editing} />
            <EditableField label="Site web" value={company.website} editing={editing} />
            <EditableField label="Capital" value={company.capital} editing={editing} mono last />
          </div>
          {editing && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" className="h-7 text-[12px]" onClick={() => setEditing(false)}>
                <Save className="mr-1 h-3 w-3" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Risk factors */}
      {riskFactors.length > 0 && (
        <div>
          <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Facteurs de risque · <span className="font-data">{riskFactors.reduce((s, f) => s + f.impact, 0)} pts</span>
          </span>
          <div className="space-y-1.5">
            {riskFactors.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-4 py-2">
                <span className={cn(
                  "w-8 font-data text-[12px] font-semibold",
                  f.impact >= 20 ? "text-red-600" : f.impact >= 10 ? "text-amber-600" : "text-muted-foreground",
                )}>
                  +{f.impact}
                </span>
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-foreground">{f.factor}</p>
                  <p className="text-[11px] text-muted-foreground">{f.details}</p>
                </div>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{f.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EDITABLE FIELD
// =============================================================================

function EditableField({
  label,
  value,
  editing,
  mono,
  sensitive,
  highlight,
  last,
}: {
  label: string;
  value: string | null | undefined;
  editing: boolean;
  mono?: boolean;
  sensitive?: boolean;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2.5",
      !last && "border-b border-border/50",
    )}>
      <span className="w-36 shrink-0 text-[12px] text-muted-foreground">{label}</span>
      {editing ? (
        <input
          type="text"
          defaultValue={value ?? ""}
          placeholder="—"
          className={cn(
            "flex-1 rounded-md border border-border bg-background px-2 py-1 text-right text-[13px] text-foreground focus:border-foreground focus:outline-none",
            mono && "font-data",
          )}
        />
      ) : (
        <span className={cn(
          "text-right text-[13px]",
          value ? "text-foreground" : "text-muted-foreground",
          mono && "font-data",
          highlight && "font-medium text-amber-700",
          sensitive && "tracking-wider",
        )}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// RELATIONS TAB
// =============================================================================

function RelationsTab({ relations, entityId, allEntities }: Props) {
  if (relations.length === 0) return <Empty text="Aucune relation" />;
  return (
    <div className="space-y-2">
      {relations.map((rel) => {
        const isFrom = rel.from_entity_id === entityId;
        const otherId = isFrom ? rel.to_entity_id : rel.from_entity_id;
        const other = allEntities.find((e) => e.id === otherId);
        const isCompany = other?.type === "company";
        return (
          <div key={rel.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                isCompany ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600",
              )}>
                {isCompany ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div>
                <Link href={`/entities/${otherId}`} className="text-[13px] font-medium text-foreground hover:underline">
                  {other?.display_name ?? otherId}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{isFrom ? "→" : "←"} {RELATION_LABELS[rel.relation_type] ?? rel.relation_type}</span>
                  {rel.ownership_percentage != null && (
                    <span className="font-data font-medium text-foreground">{rel.ownership_percentage}%</span>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/entities/${otherId}`} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// SCREENING TAB
// =============================================================================

function ScreeningTab({ screenings }: { screenings: Screening[] }) {
  if (screenings.length === 0) return <Empty text="Aucun screening effectué" />;
  return (
    <div className="space-y-2">
      {screenings.map((s) => {
        const match = s.matches[0] as Record<string, unknown> | undefined;
        return (
          <div key={s.id} className={cn(
            "rounded-lg px-4 py-3",
            s.match_found ? "bg-orange-50" : s.status === "processing" ? "bg-blue-50" : "bg-emerald-50",
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.match_found ? <AlertTriangle className="h-3.5 w-3.5 text-orange-600" /> :
                 s.status === "processing" ? <Circle className="h-3.5 w-3.5 animate-pulse text-blue-600" /> :
                 <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
                <span className="text-[13px] font-medium">
                  {s.screening_type === "pep" ? "PEP" : s.screening_type === "sanctions" ? "Sanctions" : "Adverse media"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-data text-[10px] text-muted-foreground">
                  {s.lists_checked.map((l) => l.toUpperCase()).join(", ")}
                </span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  s.match_found ? "bg-orange-100 text-orange-700" :
                  s.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700",
                )}>
                  {s.match_found ? "Match" : s.status === "processing" ? "En cours" : "Clean"}
                </span>
              </div>
            </div>
            {match && s.match_found && (
              <div className="mt-2 rounded-md bg-white/60 px-3 py-2">
                <p className="text-[12px] text-foreground">{String(match.name ?? match.title ?? "")}</p>
                {match.confidence != null && (
                  <p className="mt-0.5 font-data text-[11px] text-muted-foreground">
                    Confiance {String(match.confidence)}%
                    {match.list != null ? ` · ${String(match.list)}` : ""}
                    {match.source != null ? ` · ${String(match.source)}` : ""}
                  </p>
                )}
                {s.review_decision && (
                  <p className={cn("mt-1 text-[11px] font-medium",
                    s.review_decision === "confirmed_match" ? "text-red-600" :
                    s.review_decision === "false_positive" ? "text-emerald-600" : "text-amber-600",
                  )}>
                    {s.review_decision === "confirmed_match" ? "Match confirmé" :
                     s.review_decision === "false_positive" ? "Faux positif" : "En attente de revue"}
                  </p>
                )}
              </div>
            )}
            <p className="mt-2 font-data text-[10px] text-muted-foreground">
              {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// CASES TAB
// =============================================================================

function CasesTab({ cases }: { cases: KycCase[] }) {
  if (cases.length === 0) return <Empty text="Aucun dossier KYC" />;
  return (
    <div className="space-y-2">
      {cases.map((c) => (
        <Link key={c.id} href={`/cases/${c.id}`}
          className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60">
          <div>
            <span className="font-data text-[13px] font-medium text-foreground">{c.case_number}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Vigilance {c.vigilance_level}
              {c.due_date && ` · Échéance ${new Date(c.due_date).toLocaleDateString("fr-FR")}`}
            </p>
          </div>
          <CaseStatusBadge status={c.status} />
        </Link>
      ))}
    </div>
  );
}

// =============================================================================
// TIMELINE TAB
// =============================================================================

function TimelineTab({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return <Empty text="Aucune activité" />;
  return (
    <div className="max-w-xl">
      {activities.map((a, i) => (
        <div key={a.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />
            {i < activities.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="pb-6">
            <p className="text-[13px] font-medium text-foreground">{a.title}</p>
            {a.description && <p className="mt-0.5 text-[12px] text-muted-foreground">{a.description}</p>}
            <p className="mt-1.5 font-data text-[11px] text-muted-foreground/60">
              {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              {a.agent_id && <span className="ml-2 rounded bg-secondary px-1 py-px text-[9px] text-muted-foreground">IA</span>}
              {a.created_by && !a.agent_id && <span className="ml-2 text-muted-foreground">· Manuel</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-secondary/30 py-12">
      <p className="text-[13px] text-muted-foreground">{text}</p>
    </div>
  );
}
