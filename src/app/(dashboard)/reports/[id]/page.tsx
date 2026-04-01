import { notFound } from "next/navigation";
import { getCaseById, getScreeningsForEntity, getActivitiesForEntity, getDocumentsForEntity } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";
import { cn } from "@/lib/utils";

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Passeport", national_id: "Carte d'identité", residence_permit: "Titre de séjour",
  driving_license: "Permis de conduire", identity_additional: "Pièce d'identité (add.)",
  proof_of_address: "Justificatif de domicile", proof_of_address_electricity: "Facture électricité",
  proof_of_address_water: "Facture eau", proof_of_address_gas: "Facture gaz",
  proof_of_address_telecom: "Facture télécom", proof_of_address_tax: "Avis d'imposition",
  source_of_funds: "Source des fonds", company_registration: "Immatriculation",
  governance: "Gouvernance", shareholding: "Actionnariat", financial_statement: "Document financier",
  articles_of_association: "Statuts", bank_statement: "Relevé bancaire", payslip: "Fiche de paie",
  other: "Autre document",
};

const VIGILANCE_LABELS: Record<string, string> = {
  enhanced: "Renforcée (Art. 12-2 à 17-3 Loi 1.362)",
  standard: "Standard (Art. 4-1 à 7-1 Loi 1.362)",
  simplified: "Simplifiée (Art. 11 à 12-1 Loi 1.362)",
};

const RISK_LEVEL_LABELS: Record<string, string> = {
  low: "Faible", medium: "Moyen", high: "Élevé", critical: "Critique",
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kc = await getCaseById(id);
  if (!kc) notFound();

  const entity = kc.entities as Record<string, unknown>;
  const [screenings, activities, documents] = await Promise.all([
    getScreeningsForEntity(kc.entity_id),
    getActivitiesForEntity(kc.entity_id),
    getDocumentsForEntity(kc.entity_id),
  ]);

  // Get person/company details
  const supabase = await createClient();
  const isPerson = entity.type === "person";
  let person: Record<string, unknown> | null = null;
  let company: Record<string, unknown> | null = null;

  if (isPerson) {
    const { data } = await supabase.from("entity_people").select("*").eq("entity_id", kc.entity_id).single();
    person = data;
  } else {
    const { data } = await supabase.from("entity_companies").select("*").eq("entity_id", kc.entity_id).single();
    company = data;
  }

  const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  let sectionNum = 0;
  const nextSection = () => { sectionNum++; return sectionNum; };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Rapport KYC — {kc.case_number}
        </span>
        <PrintButton />
      </div>

      <div id="report" className="rounded border border-border bg-white p-6 text-[11px] text-foreground print:border-0 print:p-0">
        {/* Header */}
        <div className="mb-6 border-b border-border pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[16px] font-bold">Rapport de Vérification KYC</h1>
              <p className="mt-0.5 text-[12px] text-muted-foreground">Conformité Loi n° 1.362 du 3 août 2009 — AMSF Monaco</p>
            </div>
            <div className="text-right">
              <p className="font-data text-[12px] font-semibold">{kc.case_number}</p>
              <p className="text-[10px] text-muted-foreground">Généré le {now}</p>
            </div>
          </div>
        </div>

        {/* 1. Identification */}
        <Section title={`${nextSection()}. Identification du client (Art. 4-1 Loi 1.362)`}>
          <Row label="Nom / Raison sociale" value={entity.display_name as string} />
          <Row label="Type" value={isPerson ? "Personne physique" : "Personne morale"} />

          {isPerson && person && (
            <>
              {person.first_name && <Row label="Prénom(s)" value={person.first_name as string} />}
              {person.last_name && <Row label="Nom" value={person.last_name as string} />}
              {person.date_of_birth && <Row label="Date de naissance" value={person.date_of_birth as string} />}
              {person.nationality && <Row label="Nationalité" value={person.nationality as string} />}
              {person.address && <Row label="Adresse" value={person.address as string} />}
            </>
          )}

          {!isPerson && company && (
            <>
              {company.legal_name && <Row label="Raison sociale" value={company.legal_name as string} />}
              {company.company_type && <Row label="Forme juridique" value={String(company.company_type).toUpperCase()} />}
              {company.jurisdiction && <Row label="Juridiction" value={company.jurisdiction as string} />}
              {company.registration_number && <Row label="N° registre" value={company.registration_number as string} />}
              {company.capital && <Row label="Capital" value={company.capital as string} />}
              {company.industry && <Row label="Objet social / Activité" value={company.industry as string} />}
            </>
          )}

          <Row label="Score de risque" value={entity.risk_score != null ? `${entity.risk_score}/100` : "Non évalué"} />
          <Row label="Niveau de risque" value={RISK_LEVEL_LABELS[entity.risk_level as string] ?? "Non évalué"} />
        </Section>

        {/* 2. Dossier */}
        <Section title={`${nextSection()}. Dossier de vérification`}>
          <Row label="Numéro de dossier" value={kc.case_number} />
          <Row label="Niveau de vigilance" value={VIGILANCE_LABELS[kc.vigilance_level] ?? kc.vigilance_level} />
          <Row label="Statut" value={kc.status} />
          <Row label="Date d'ouverture" value={new Date(kc.created_at).toLocaleDateString("fr-FR")} />
        </Section>

        {/* 3. Pièces analysées */}
        <Section title={`${nextSection()}. Pièces justificatives analysées`}>
          {documents.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Type</th>
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Fichier</th>
                  <th className="w-16 py-1 text-left text-[10px] font-medium text-muted-foreground">Taille</th>
                  <th className="w-20 py-1 text-left text-[10px] font-medium text-muted-foreground">Confiance IA</th>
                  <th className="w-16 py-1 text-left text-[10px] font-medium text-muted-foreground">Statut</th>
                  <th className="w-24 py-1 text-left text-[10px] font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d: Record<string, unknown>) => (
                  <tr key={d.id as string} className="border-b border-border/50">
                    <td className="py-1 font-medium">{DOC_TYPE_LABELS[d.type as string] ?? (d.type as string)}</td>
                    <td className="py-1 text-[10px] text-muted-foreground">{d.name as string}</td>
                    <td className="py-1 font-data text-[10px]">{d.file_size ? `${((d.file_size as number) / 1024).toFixed(0)} Ko` : "—"}</td>
                    <td className="py-1 font-data text-[10px]">{d.extraction_confidence != null ? `${d.extraction_confidence}%` : "—"}</td>
                    <td className="py-1 text-[10px]">{d.status as string}</td>
                    <td className="py-1 font-data text-[10px]">{d.created_at ? new Date(d.created_at as string).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">Aucun document analysé</p>
          )}
          <p className="mt-2 text-[9px] text-muted-foreground">
            {documents.length} document(s) au dossier. Les documents sont conservés pendant 5 ans après la fin de la relation d&apos;affaires (Art. 22 Loi 1.362).
          </p>
        </Section>

        {/* 4. Screening */}
        <Section title={`${nextSection()}. Résultats du screening (Art. 6 + Guide AMSF n°3)`}>
          {screenings.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Type</th>
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Listes vérifiées</th>
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Résultat</th>
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Revue</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map((s: Record<string, unknown>) => (
                  <tr key={s.id as string} className="border-b border-border/50">
                    <td className="py-1">{(s.screening_type as string) === "pep" ? "PEP (Personnes Politiquement Exposées)" : (s.screening_type as string) === "sanctions" ? "Sanctions (ONU, UE, Monaco, OFAC)" : "Adverse media"}</td>
                    <td className="py-1 font-data text-[10px]">{(s.lists_checked as string[])?.join(", ") || "—"}</td>
                    <td className="py-1">
                      <span className={cn("font-medium", s.match_found ? "text-red-600" : "text-emerald-600")}>
                        {s.match_found ? "MATCH DÉTECTÉ" : "Aucun match"}
                      </span>
                    </td>
                    <td className="py-1">{(s.review_decision as string) ?? "En attente"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">Aucun screening effectué. Le screening PEP/sanctions est obligatoire (Art. 6 Loi 1.362).</p>
          )}
        </Section>

        {/* 5. Évaluation des risques détaillée */}
        <Section title={`${nextSection()}. Évaluation des risques (Art. 5 — Approche fondée sur les risques)`}>
          <p className="mb-2 text-[10px] text-muted-foreground">
            Conformément à l&apos;Art. 3 de la Loi 1.362 et aux Lignes Directrices SICCFIN, l&apos;évaluation des risques
            prend en compte les 5 facteurs obligatoires définis par le GAFI et transposés en droit monégasque.
          </p>

          <div className="mb-3 rounded bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[9px] text-muted-foreground">Score global</span>
                <p className={cn("font-data text-[18px] font-bold",
                  (entity.risk_score as number) >= 80 ? "text-red-600" :
                  (entity.risk_score as number) >= 60 ? "text-orange-600" :
                  (entity.risk_score as number) >= 40 ? "text-amber-600" : "text-emerald-600"
                )}>{entity.risk_score != null ? String(entity.risk_score) : "—"}/100</p>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground">Niveau</span>
                <p className="text-[13px] font-semibold">{RISK_LEVEL_LABELS[entity.risk_level as string] ?? "Non évalué"}</p>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground">Vigilance applicable</span>
                <p className="text-[11px]">{VIGILANCE_LABELS[kc.vigilance_level] ?? kc.vigilance_level}</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-medium mb-1">Facteurs de risque évalués :</p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Facteur (Art. 3 Loi 1.362)</th>
                <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Évaluation</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-1">1. Nature des produits/services</td>
                <td className="py-1 text-muted-foreground">Évalué selon le type de relation d&apos;affaires</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1">2. Conditions de transactions</td>
                <td className="py-1 text-muted-foreground">Moyens de paiement, montants, complexité</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1">3. Canaux de distribution</td>
                <td className="py-1 text-muted-foreground">{isPerson ? "Relation directe" : "Via intermédiaire / à distance"}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1">4. Caractéristiques de la clientèle</td>
                <td className="py-1 text-muted-foreground">
                  {isPerson ? `Personne physique — ${person?.nationality ?? "nationalité non renseignée"}` : `Personne morale — ${company?.jurisdiction ?? "juridiction non renseignée"}`}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1">5. Pays et zones géographiques</td>
                <td className="py-1 text-muted-foreground">
                  {isPerson ? (person?.nationality as string ?? "Non renseigné") : (company?.jurisdiction as string ?? "Non renseigné")}
                  {" "}— évaluation GAFI/Moneyval
                </td>
              </tr>
            </tbody>
          </table>

          <p className="mt-2 text-[9px] text-muted-foreground">
            Fréquence de revue recommandée : {(entity.risk_level as string) === "high" || (entity.risk_level as string) === "critical" ? "1 an" : (entity.risk_level as string) === "medium" ? "2 ans" : "3 ans"} (Lignes Directrices SICCFIN p.44).
          </p>
        </Section>

        {/* 6. AI recommendation */}
        {kc.ai_recommendation && (
          <Section title={`${nextSection()}. Recommandation IA`}>
            <Row label="Recommandation" value={kc.ai_recommendation === "approve" ? "Approuver" : kc.ai_recommendation === "reject" ? "Rejeter" : "Escalader"} />
            <Row label="Confiance" value={`${kc.ai_confidence}%`} />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Note : L&apos;IA fournit une recommandation indicative. La décision finale est TOUJOURS prise par un compliance officer humain conformément au principe human-in-the-loop (Art. 3 Loi 1.362).
            </p>
          </Section>
        )}

        {/* 7. Decision */}
        {kc.decision_status && (
          <Section title={`${nextSection()}. Décision finale (human-in-the-loop)`}>
            <Row label="Décision" value={kc.decision_status === "approved" ? "APPROUVÉ" : kc.decision_status === "rejected" ? "REJETÉ" : "ESCALADÉ"} />
            {kc.decision_justification && <Row label="Justification" value={kc.decision_justification} />}
            {kc.decided_at && <Row label="Date de décision" value={new Date(kc.decided_at).toLocaleDateString("fr-FR")} />}
          </Section>
        )}

        {/* 8. Audit trail */}
        <Section title={`${nextSection()}. Historique — Audit Trail (Art. 22 Loi 1.362)`}>
          {activities.length > 0 ? activities.map((a: Record<string, unknown>) => (
            <div key={a.id as string} className="flex gap-2 border-b border-border/50 py-1">
              <span className="w-24 shrink-0 font-data text-[10px] text-muted-foreground">
                {new Date(a.created_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <span>{a.title as string}</span>
              {a.agent_id != null && <span className="text-muted-foreground">(IA : {a.agent_id as string})</span>}
            </div>
          )) : <p className="text-muted-foreground">Aucune activité enregistrée</p>}
        </Section>

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4 text-[10px] text-muted-foreground">
          <p className="font-medium">Ce rapport a été généré automatiquement par la plateforme KYC Monaco (kyc.mc).</p>
          <p>Conformité : Loi n° 1.362 du 3 août 2009 modifiée · Ordonnance Souveraine n° 2.318 modifiée · Guides pratiques AMSF 2025</p>
          <p>Conservation : 5 ans après la fin de la relation d&apos;affaires (Art. 22-24 Loi 1.362). Audit logs : 7 ans (append-only).</p>
          <p className="mt-1">L&apos;utilisation de l&apos;IA dans ce processus est documentée conformément aux exigences de transparence AMSF.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 text-[12px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-border/50 py-1">
      <span className="w-44 shrink-0 text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
