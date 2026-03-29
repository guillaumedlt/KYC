import { notFound } from "next/navigation";
import { getCaseById, getScreeningsForEntity, getActivitiesForEntity } from "@/lib/supabase/queries";
import { getRiskFactors } from "@/lib/mock-data";
import { PrintButton } from "./print-button";
import { cn } from "@/lib/utils";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kc = await getCaseById(id);
  if (!kc) notFound();

  const entity = kc.entities as Record<string, unknown>;
  const screenings = await getScreeningsForEntity(kc.entity_id);
  const activities = await getActivitiesForEntity(kc.entity_id);
  const riskFactors = getRiskFactors(kc.entity_id);
  const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Rapport KYC — {kc.case_number}
        </span>
        <PrintButton />
      </div>

      {/* Print-optimized report */}
      <div id="report" className="rounded border border-border bg-white p-6 text-[11px] text-foreground print:border-0 print:p-0">
        {/* Header */}
        <div className="mb-6 border-b border-border pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[16px] font-bold">Rapport de Vérification KYC</h1>
              <p className="mt-0.5 text-[12px] text-muted-foreground">Conformité Loi n° 1.362 — AMSF Monaco</p>
            </div>
            <div className="text-right">
              <p className="font-data text-[12px] font-semibold">{kc.case_number}</p>
              <p className="text-[10px] text-muted-foreground">Généré le {now}</p>
            </div>
          </div>
        </div>

        {/* Entity info */}
        <Section title="1. Identification du client">
          <Row label="Nom / Raison sociale" value={entity.display_name as string} />
          <Row label="Type" value={(entity.type as string) === "person" ? "Personne physique" : "Personne morale"} />
          <Row label="Score de risque" value={entity.risk_score != null ? `${entity.risk_score}/100 (${entity.risk_level})` : "Non évalué"} />
        </Section>

        {/* Case info */}
        <Section title="2. Dossier de vérification">
          <Row label="Numéro" value={kc.case_number} />
          <Row label="Niveau de vigilance" value={kc.vigilance_level === "enhanced" ? "Renforcée (Art. 6)" : kc.vigilance_level === "simplified" ? "Simplifiée" : "Standard"} />
          <Row label="Statut" value={kc.status} />
          <Row label="Date d'ouverture" value={new Date(kc.created_at).toLocaleDateString("fr-FR")} />
          {kc.due_date && <Row label="Échéance" value={new Date(kc.due_date).toLocaleDateString("fr-FR")} />}
        </Section>

        {/* Screening */}
        <Section title="3. Résultats du screening (Art. 6 + Guide AMSF n°3)">
          {screenings.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Type</th>
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Listes</th>
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Résultat</th>
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Revue</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map((s: Record<string, unknown>) => (
                  <tr key={s.id as string} className="border-b border-border/50">
                    <td className="py-1">{(s.screening_type as string) === "pep" ? "PEP" : (s.screening_type as string) === "sanctions" ? "Sanctions" : "Adverse media"}</td>
                    <td className="py-1 font-data text-[10px]">{(s.lists_checked as string[])?.join(", ") || "—"}</td>
                    <td className="py-1">
                      <span className={cn("font-medium", s.match_found ? "text-red-600" : "text-emerald-600")}>
                        {s.match_found ? "MATCH" : "Aucun match"}
                      </span>
                    </td>
                    <td className="py-1">{(s.review_decision as string) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">Aucun screening effectué</p>
          )}
        </Section>

        {/* Risk */}
        {riskFactors.length > 0 && (
          <Section title="4. Évaluation des risques (Art. 5)">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Facteur</th>
                  <th className="w-16 py-1 text-left text-[10px] font-medium text-muted-foreground">Impact</th>
                  <th className="py-1 text-left text-[10px] font-medium text-muted-foreground">Détail</th>
                </tr>
              </thead>
              <tbody>
                {riskFactors.map((f, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1 font-medium">{f.factor}</td>
                    <td className="py-1 font-data">+{f.impact}</td>
                    <td className="py-1 text-muted-foreground">{f.details}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="py-1">Total</td>
                  <td className="py-1 font-data">{riskFactors.reduce((s, f) => s + f.impact, 0)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </Section>
        )}

        {/* AI recommendation */}
        {kc.ai_recommendation && (
          <Section title="5. Recommandation IA">
            <Row label="Recommandation" value={kc.ai_recommendation === "approve" ? "Approuver" : kc.ai_recommendation === "reject" ? "Rejeter" : "Escalader"} />
            <Row label="Confiance" value={`${kc.ai_confidence}%`} />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Note : L&apos;IA fournit une recommandation indicative. La décision finale est toujours prise par un humain conformément à l&apos;Art. 3 de la Loi 1.362.
            </p>
          </Section>
        )}

        {/* Decision */}
        {kc.decision_status && (
          <Section title={kc.ai_recommendation ? "6. Décision finale" : "5. Décision finale"}>
            <Row label="Décision" value={kc.decision_status === "approved" ? "APPROUVÉ" : kc.decision_status === "rejected" ? "REJETÉ" : "ESCALADÉ"} />
            {kc.decision_justification && <Row label="Justification" value={kc.decision_justification} />}
            {kc.decided_at && <Row label="Date" value={new Date(kc.decided_at).toLocaleDateString("fr-FR")} />}
          </Section>
        )}

        {/* Timeline */}
        <Section title={`${kc.decision_status ? (kc.ai_recommendation ? "7" : "6") : (kc.ai_recommendation ? "6" : "5")}. Historique (Audit Trail)`}>
          {activities.map((a: Record<string, unknown>) => (
            <div key={a.id as string} className="flex gap-2 border-b border-border/50 py-1">
              <span className="w-20 shrink-0 font-data text-[10px] text-muted-foreground">
                {new Date(a.created_at as string).toLocaleDateString("fr-FR")}
              </span>
              <span>{a.title as string}</span>
              {a.agent_id != null ? <span className="text-muted-foreground">(IA)</span> : null}
            </div>
          ))}
        </Section>

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4 text-[10px] text-muted-foreground">
          <p>Ce rapport a été généré automatiquement par la plateforme KYC Monaco (kyc.mc).</p>
          <p>Conformité : Loi n° 1.362 du 3 août 2009 · Guides pratiques AMSF 2025</p>
          <p>Document conservé pendant 5 ans après la fin de la relation d&apos;affaires (Art. 22).</p>
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
      <span className="w-40 shrink-0 text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
