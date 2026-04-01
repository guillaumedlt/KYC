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
  Loader2,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge } from "@/components/features/status-badge";
import { DocumentReUpload } from "@/components/features/document-reupload";
import { updatePerson, updateCompany } from "@/app/actions/entities";
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

type Tab = "info" | "documents" | "relations" | "screening" | "cases" | "timeline";

interface DocRecord {
  id: string;
  name: string;
  type: string;
  status: string;
  file_size: number | null;
  mime_type: string | null;
  extraction_confidence: number | null;
  verified_by: string | null;
  created_at: string;
  storage_path: string | null;
}

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
  documents?: DocRecord[];
}

const TABS: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "info", label: "Informations", icon: FileText },
  { key: "documents", label: "Documents", icon: FileText },
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
                "flex shrink-0 items-center gap-1 border-b-2 px-3 py-1.5 text-[11px] transition-colors",
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
      {tab === "documents" && <DocumentsTab documents={props.documents ?? []} entityId={props.entityId} entityType={props.entityType} person={props.person} company={props.company} />}
      {tab === "relations" && <RelationsTab {...props} />}
      {tab === "screening" && <ScreeningTab screenings={props.screenings} entityId={props.entityId} entityName={(props.person?.last_name ? `${props.person.first_name} ${props.person.last_name}` : props.company?.legal_name ?? "") as string} entityType={props.entityType} nationality={(props.person?.nationality ?? props.company?.jurisdiction ?? null) as string | null} />}
      {tab === "cases" && <CasesTab cases={props.cases} />}
      {tab === "timeline" && <TimelineTab activities={props.activities} />}
    </div>
  );
}

// =============================================================================
// INFO TAB — with edit mode
// =============================================================================

function InfoTab({ entityId, person, company, riskFactors }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave() {
    if (!formRef.current) return;
    setSaving(true);
    const formData = new FormData(formRef.current);
    if (person) await updatePerson(entityId, formData);
    if (company) await updateCompany(entityId, formData);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      {saved && (
        <div className="rounded bg-emerald-50 px-3 py-1.5 text-[10px] font-medium text-emerald-700">
          Modifications enregistrées
        </div>
      )}
      <form ref={formRef}>
      {/* Person info */}
      {person && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <User className="h-3 w-3 text-blue-500" />
              Identité
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={() => editing ? handleSave() : setEditing(true)}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-colors",
                editing
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {editing ? <><Save className="h-3 w-3" />Enregistrer</> : <><Pencil className="h-3 w-3" />Modifier</>}
            </button>
          </div>
          <div className="rounded border border-border">
            <EditableField label="Prénom" name="firstName" value={person.first_name} editing={editing} />
            <EditableField label="Nom" name="lastName" value={person.last_name} editing={editing} />
            <EditableField label="Nationalité" name="nationality" value={person.nationality} editing={editing} />
            <EditableField label="Résidence" name="residence" value={person.country_of_residence} editing={editing} />
            <EditableField label="Adresse" name="address" value={person.address} editing={editing} />
            <EditableField label="Téléphone" name="phone" value={person.phone} editing={editing} mono sensitive />
            <EditableField label="Email" name="email" value={person.email} editing={editing} />
            <EditableField label="Profession" name="profession" value={person.profession} editing={editing} />
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
        </div>
      )}

      {/* Company info */}
      {company && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3 w-3 text-violet-500" />
              Société
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={() => editing ? handleSave() : setEditing(true)}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-colors",
                editing
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {editing ? <><Save className="h-3 w-3" />Enregistrer</> : <><Pencil className="h-3 w-3" />Modifier</>}
            </button>
          </div>
          <div className="rounded border border-border">
            <EditableField label="Raison sociale" name="legalName" value={company.legal_name} editing={editing} />
            <EditableField label="Nom commercial" name="tradingName" value={company.trading_name} editing={editing} />
            <EditableField label="N° registre" name="regNumber" value={company.registration_number} editing={editing} mono />
            <EditableField label="Juridiction" name="jurisdiction" value={company.jurisdiction} editing={editing} />
            <EditableField label="Forme juridique" name="companyType" value={company.company_type} editing={editing} />
            <EditableField label="Secteur" name="industry" value={company.industry} editing={editing} />
            <EditableField label="Adresse" name="address" value={company.address} editing={editing} />
            <EditableField label="Téléphone" name="phone" value={company.phone} editing={editing} mono sensitive />
            <EditableField label="Email" name="email" value={company.email} editing={editing} />
            <EditableField label="Site web" name="website" value={company.website} editing={editing} />
            <EditableField label="Capital" name="capital" value={company.capital} editing={editing} mono last />
          </div>
        </div>
      )}
      </form>

      {/* Risk factors */}
      {riskFactors.length > 0 && (
        <div>
          <span className="mb-3 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Facteurs de risque · <span className="font-data">{riskFactors.reduce((s, f) => s + f.impact, 0)} pts</span>
          </span>
          <div className="space-y-1.5">
            {riskFactors.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded bg-muted/40 px-3 py-1.5">
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
  name,
  mono,
  sensitive,
  highlight,
  last,
}: {
  label: string;
  name?: string;
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
          name={name}
          defaultValue={value ?? ""}
          placeholder="—"
          className={cn(
            "flex-1 rounded border border-border bg-background px-2 py-0.5 text-right text-[11px] text-foreground focus:border-foreground focus:outline-none",
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
  if (relations.length === 0) return <Empty text="Aucune relation" sub="Ajoutez un UBO, actionnaire ou dirigeant via le bouton Lien" />;
  return (
    <div className="space-y-2">
      {relations.map((rel) => {
        const isFrom = rel.from_entity_id === entityId;
        const otherId = isFrom ? rel.to_entity_id : rel.from_entity_id;
        const other = allEntities.find((e) => e.id === otherId);
        const isCompany = other?.type === "company";
        return (
          <div key={rel.id} className="flex items-center justify-between rounded bg-muted/40 px-3 py-2">
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

function ScreeningTab({ screenings, entityId, entityName, entityType, nationality }: {
  screenings: Screening[]; entityId: string; entityName: string; entityType: string; nationality: string | null;
}) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [sourcesChecked, setSourcesChecked] = useState<{ name: string; type: string; url: string; result: string }[]>([]);
  const [showSources, setShowSources] = useState(false);

  async function launchScreening() {
    setRunning(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId,
          name: entityName,
          type: entityType === "person" ? "person" : "company",
          nationality,
          jurisdiction: entityType !== "person" ? nationality : undefined,
          screeningType: "all",
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      const result = await res.json();
      setLastResult(result.summary ?? "Screening terminé");
      if (result.sourcesChecked) setSourcesChecked(result.sourcesChecked);
      setShowSources(true);
      setTimeout(() => window.location.reload(), 3000);
    } catch {
      setLastResult("Erreur lors du screening");
    } finally {
      setRunning(false);
    }
  }

  const TYPE_LABELS: Record<string, string> = {
    pep: "PEP — Personnes Politiquement Exposées",
    sanctions: "Sanctions internationales (ONU, UE, OFAC, UK HMT, Monaco)",
    adverse_media: "Adverse Media — Médias défavorables",
  };

  return (
    <div className="space-y-4">
      {/* Launch button */}
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
        <div>
          <p className="text-[12px] font-medium text-foreground">Screening complet</p>
          <p className="text-[10px] text-muted-foreground">PEP + Sanctions + Adverse Media + Risque Pays — Art. 6 Loi 1.362</p>
        </div>
        <Button size="sm" onClick={launchScreening} disabled={running} className="h-7 text-[10px]">
          {running ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Search className="mr-1.5 h-3 w-3" />}
          {running ? "Analyse en cours..." : "Lancer le screening"}
        </Button>
      </div>

      {lastResult && (
        <div className="rounded-md bg-muted/30 px-4 py-2 text-[11px] text-foreground">
          <p>{lastResult}</p>
          {sourcesChecked.length > 0 && (
            <button onClick={() => setShowSources(!showSources)} className="mt-1 text-[10px] text-muted-foreground underline hover:text-foreground">
              {showSources ? "Masquer" : "Voir"} les {sourcesChecked.length} sources vérifiées
            </button>
          )}
        </div>
      )}

      {showSources && sourcesChecked.length > 0 && (
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Sources et bases de données vérifiées ({sourcesChecked.length})
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {sourcesChecked.map((src, i) => {
              const isMatch = src.result.toLowerCase().includes("match") && !src.result.toLowerCase().includes("aucun");
              const isClean = src.result.toLowerCase().includes("aucun") || src.result.toLowerCase().includes("no match") || src.result.toLowerCase().includes("négatif");
              return (
                <div key={i} className="flex items-center justify-between px-4 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                      isMatch ? "bg-red-500" : isClean ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <a href={src.url} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-foreground hover:underline truncate">
                          {src.name}
                        </a>
                        <span className="shrink-0 rounded bg-muted px-1 py-px text-[8px] text-muted-foreground">
                          {src.type === "pep_database" ? "PEP" : src.type === "sanctions_list" ? "Sanctions" : src.type === "media" ? "Média" : src.type === "registry" ? "Registre" : src.type === "fatf" ? "GAFI" : "Autre"}
                        </span>
                      </div>
                      <a href={src.url} target="_blank" rel="noopener noreferrer"
                        className="text-[9px] text-muted-foreground hover:underline truncate block">
                        {src.url}
                      </a>
                    </div>
                  </div>
                  <span className={cn("shrink-0 text-[9px] ml-2",
                    isMatch ? "text-red-600 font-medium" : isClean ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {src.result}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {screenings.length === 0 ? (
        <Empty text="Aucun screening effectué" sub="Cliquez sur 'Lancer le screening' pour analyser cette entité" />
      ) : (
        <div className="space-y-2">
          {screenings.map((s) => {
            const matches = (Array.isArray(s.matches) ? s.matches : []) as Record<string, unknown>[];
            const firstMatch = matches[0];
            return (
              <div key={s.id} className={cn(
                "rounded-md border px-4 py-3",
                s.match_found ? "border-red-200 bg-red-50/50" : s.status === "processing" ? "border-blue-200 bg-blue-50/50" : "border-emerald-200 bg-emerald-50/50",
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {s.match_found ? <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> :
                     s.status === "processing" ? <Circle className="h-3.5 w-3.5 animate-pulse text-blue-600" /> :
                     <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
                    <span className="text-[12px] font-medium">
                      {TYPE_LABELS[s.screening_type] ?? s.screening_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-medium",
                      s.match_found ? "bg-red-100 text-red-700" :
                      s.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700",
                    )}>
                      {s.match_found ? "MATCH DÉTECTÉ" : s.status === "processing" ? "En cours" : "Aucun match"}
                    </span>
                  </div>
                </div>

                {/* Lists checked */}
                {s.lists_checked.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {s.lists_checked.map((l) => (
                      <span key={l} className="rounded bg-background px-1.5 py-0.5 font-data text-[9px] text-muted-foreground">{l.toUpperCase()}</span>
                    ))}
                  </div>
                )}

                {/* Match details */}
                {s.match_found && matches.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {matches.map((m, mi) => (
                      <div key={mi} className="rounded bg-white/80 px-3 py-2 border border-red-100">
                        <p className="text-[11px] font-medium text-foreground">
                          {String(m.name ?? m.title ?? m.function ?? "")}
                        </p>
                        {String(m.summary ?? "") !== "" && <p className="mt-0.5 text-[10px] text-muted-foreground">{String(m.summary)}</p>}
                        <div className="mt-0.5 flex flex-wrap gap-1.5">
                          {String(m.level ?? "") !== "" && <span className="text-[9px] text-red-600">Niveau : {String(m.level)}</span>}
                          {String(m.country ?? "") !== "" && <span className="text-[9px] text-muted-foreground">Pays : {String(m.country)}</span>}
                          {String(m.list ?? "") !== "" && <span className="text-[9px] text-muted-foreground">Liste : {String(m.list)}</span>}
                          {String(m.source ?? "") !== "" && <span className="text-[9px] text-muted-foreground">Source : {String(m.source)}</span>}
                          {String(m.date ?? "") !== "" && <span className="font-data text-[9px] text-muted-foreground">{String(m.date)}</span>}
                          {m.confidence != null && <span className="font-data text-[9px] text-muted-foreground">Confiance : {String(m.confidence)}%</span>}
                          {m.relevance != null && <span className="font-data text-[9px] text-muted-foreground">Pertinence : {String(m.relevance)}%</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Review status */}
                {s.review_decision && (
                  <div className="mt-2">
                    <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium",
                      s.review_decision === "confirmed_match" ? "bg-red-100 text-red-700" :
                      s.review_decision === "false_positive" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                    )}>
                      {s.review_decision === "confirmed_match" ? "Match confirmé" :
                       s.review_decision === "false_positive" ? "Faux positif" : "En attente de revue"}
                    </span>
                  </div>
                )}

                <p className="mt-2 font-data text-[9px] text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CASES TAB
// =============================================================================

function CasesTab({ cases }: { cases: KycCase[] }) {
  if (cases.length === 0) return <Empty text="Aucun dossier KYC" sub="Ouvrez un dossier de vérification via le bouton KYC" />;
  return (
    <div className="space-y-2">
      {cases.map((c) => (
        <Link key={c.id} href={`/cases/${c.id}`}
          className="flex items-center justify-between rounded bg-muted/40 px-3 py-2 transition-colors hover:bg-secondary/60">
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

function Empty({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded bg-muted/30 py-10">
      <p className="text-[11px] text-muted-foreground">{text}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

// ─── Documents Tab ──────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Passeport",
  national_id: "Carte d'identité",
  residence_permit: "Titre de séjour",
  driving_license: "Permis de conduire",
  identity_additional: "Pièce d'identité (add.)",
  proof_of_address: "Justificatif de domicile",
  proof_of_address_electricity: "Facture électricité",
  proof_of_address_water: "Facture eau",
  proof_of_address_gas: "Facture gaz",
  proof_of_address_telecom: "Facture télécom",
  proof_of_address_tax: "Avis d'imposition",
  proof_of_address_rent: "Quittance de loyer",
  proof_of_address_insurance: "Attestation assurance",
  source_of_funds: "Source des fonds",
  company_registration: "Immatriculation société",
  governance: "Gouvernance",
  shareholding: "Actionnariat",
  articles_of_association: "Statuts",
  financial_statement: "Document financier",
  bank_statement: "Relevé bancaire",
  payslip: "Fiche de paie",
  other: "Autre document",
};

const DOC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  uploaded: { label: "Uploadé", color: "text-muted-foreground" },
  processing: { label: "Analyse IA...", color: "text-blue-600" },
  extracted: { label: "Extrait", color: "text-amber-600" },
  verified: { label: "Vérifié", color: "text-emerald-600" },
  rejected: { label: "Rejeté", color: "text-red-600" },
};

const DOC_CATEGORIES: { label: string; types: string[] }[] = [
  { label: "Identité", types: ["passport", "national_id", "residence_permit", "driving_license", "identity_additional"] },
  { label: "Domicile", types: ["proof_of_address", "proof_of_address_electricity", "proof_of_address_water", "proof_of_address_gas", "proof_of_address_telecom", "proof_of_address_tax", "proof_of_address_rent", "proof_of_address_insurance"] },
  { label: "Revenus / Fonds", types: ["source_of_funds", "payslip", "bank_statement"] },
  { label: "Société", types: ["company_registration", "governance", "shareholding", "articles_of_association", "financial_statement"] },
];

function DocumentsTab({ documents, entityId, entityType, person, company }: { documents: DocRecord[]; entityId: string; entityType: string; person: EntityPerson | null; company: EntityCompany | null }) {
  // Build currentData from person or company for the re-upload component
  const currentData: Record<string, string | null> = {};
  if (person) {
    const personRecord = person as unknown as Record<string, string | null>;
    currentData.first_name = person.first_name ?? null;
    currentData.last_name = person.last_name ?? null;
    currentData.nationality = person.nationality ?? null;
    currentData.date_of_birth = person.date_of_birth ?? null;
    currentData.place_of_birth = personRecord.place_of_birth ?? null;
    currentData.gender = personRecord.gender ?? null;
    currentData.document_number = personRecord.document_number ?? null;
    currentData.document_expiry = personRecord.document_expiry ?? null;
    currentData.issuing_country = personRecord.issuing_country ?? null;
    currentData.address = person.address ?? null;
    currentData.country_of_residence = person.country_of_residence ?? null;
    currentData.phone = person.phone ?? null;
    currentData.email = person.email ?? null;
    currentData.profession = person.profession ?? null;
  }
  if (company) {
    currentData.legal_name = company.legal_name ?? null;
    currentData.trading_name = company.trading_name ?? null;
    currentData.registration_number = company.registration_number ?? null;
    currentData.jurisdiction = company.jurisdiction ?? null;
    currentData.company_type = company.company_type ?? null;
    currentData.industry = company.industry ?? null;
    currentData.address = company.address ?? null;
    currentData.phone = company.phone ?? null;
    currentData.email = company.email ?? null;
    currentData.website = company.website ?? null;
    currentData.capital = company.capital ?? null;
  }

  const reUploadType: "person" | "company" = entityType === "company" ? "company" : "person";

  if (documents.length === 0) {
    return (
      <div className="space-y-4">
        <DocumentReUpload entityId={entityId} entityType={reUploadType} currentData={currentData} />
        <Empty text="Aucun document" sub="Les documents uploadés lors du parcours KYC apparaîtront ici" />
      </div>
    );
  }

  // Group by category
  const grouped: { label: string; docs: DocRecord[] }[] = DOC_CATEGORIES
    .map((cat) => ({
      label: cat.label,
      docs: documents.filter((d) => cat.types.includes(d.type)),
    }))
    .filter((g) => g.docs.length > 0);

  // Uncategorized
  const categorizedTypes = DOC_CATEGORIES.flatMap((c) => c.types);
  const uncategorized = documents.filter((d) => !categorizedTypes.includes(d.type));
  if (uncategorized.length > 0) grouped.push({ label: "Autres", docs: uncategorized });

  return (
    <div className="space-y-4">
      <DocumentReUpload entityId={entityId} entityType={reUploadType} currentData={currentData} />

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{documents.length} document(s)</p>
      </div>

      {grouped.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{group.label}</p>
          <div className="rounded-md border border-border bg-card divide-y divide-border/50">
            {group.docs.map((doc) => {
              const typeLabel = DOC_TYPE_LABELS[doc.type] ?? doc.type;
              const statusInfo = DOC_STATUS_LABELS[doc.status] ?? DOC_STATUS_LABELS.uploaded;
              const sizeStr = doc.file_size ? (doc.file_size > 1e6 ? `${(doc.file_size / 1e6).toFixed(1)} Mo` : `${(doc.file_size / 1024).toFixed(0)} Ko`) : "";
              const dateStr = doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

              return (
                <div key={doc.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[11px] font-medium text-foreground">{typeLabel}</span>
                        <span className="shrink-0 font-data text-[9px] text-muted-foreground">{sizeStr}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground truncate block">{doc.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {doc.extraction_confidence != null && (
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-8 rounded-full bg-muted">
                          <div className={cn("h-1 rounded-full", doc.extraction_confidence >= 90 ? "bg-emerald-500" : doc.extraction_confidence >= 70 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${doc.extraction_confidence}%` }} />
                        </div>
                        <span className="font-data text-[9px] text-muted-foreground">{doc.extraction_confidence}%</span>
                      </div>
                    )}
                    <span className={cn("text-[9px]", statusInfo.color)}>{statusInfo.label}</span>
                    <span className="font-data text-[9px] text-muted-foreground">{dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
