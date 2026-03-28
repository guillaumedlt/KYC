import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Circle, Sparkles, AlertTriangle, Clock } from "lucide-react";
import { MOCK_CASES, getEntityById, getScreeningsForEntity, getRiskFactors, getActivitiesForEntity } from "@/lib/mock-data";
import { RiskBadge, KycStatusBadge } from "@/components/features/status-badge";
import { cn } from "@/lib/utils";
import type { RiskLevel, CaseStatus } from "@/types";

const WORKFLOW_STEPS: { key: CaseStatus[]; label: string }[] = [
  { key: ["open"], label: "Ouvert" },
  { key: ["documents_pending"], label: "Documents" },
  { key: ["screening"], label: "Screening" },
  { key: ["risk_review"], label: "Risque" },
  { key: ["pending_decision"], label: "Décision" },
  { key: ["approved", "rejected", "escalated", "closed"], label: "Terminé" },
];

const VIGILANCE_LABELS: Record<string, { label: string; className: string }> = {
  simplified: { label: "Simplifiée", className: "bg-emerald-50 text-emerald-700" },
  standard: { label: "Standard", className: "bg-blue-50 text-blue-700" },
  enhanced: { label: "Renforcée", className: "bg-orange-50 text-orange-700" },
};

function getStepIndex(status: CaseStatus) {
  return WORKFLOW_STEPS.findIndex((s) => s.key.includes(status));
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kycCase = MOCK_CASES.find((c) => c.id === id);
  if (!kycCase) notFound();

  const entity = getEntityById(kycCase.entity_id);
  if (!entity) notFound();

  const screenings = getScreeningsForEntity(entity.id);
  const riskFactors = getRiskFactors(entity.id);
  const activities = getActivitiesForEntity(entity.id);
  const currentStep = getStepIndex(kycCase.status);
  const vigilance = VIGILANCE_LABELS[kycCase.vigilance_level];
  const isTerminal = ["approved", "rejected", "escalated", "closed"].includes(kycCase.status);

  return (
    <div>
      <Link
        href="/cases"
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Dossiers
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-data text-lg font-semibold tracking-tight">
              {kycCase.case_number}
            </h2>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", vigilance.className)}>
              {vigilance.label}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Link href={`/entities/${entity.id}`} className="text-[13px] text-foreground hover:underline">
              {entity.display_name}
            </Link>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-[12px] text-muted-foreground">
              {entity.type === "person" ? "Personne" : "Société"}
            </span>
            {entity.risk_level && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />
              </>
            )}
          </div>
          {kycCase.due_date && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600">
              <Clock className="h-3 w-3" />
              Échéance : {new Date(kycCase.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      </div>

      {/* Workflow progress */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex min-w-[500px] items-center gap-0">
          {WORKFLOW_STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition-all",
                    isDone ? "bg-foreground text-background" :
                    isCurrent ? "border-2 border-foreground bg-background text-foreground" :
                    "border border-border bg-secondary text-muted-foreground",
                  )}>
                    {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-[10px]",
                    isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                  )}>
                    {step.label}
                  </span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={cn(
                    "mx-1 h-px flex-1",
                    i < currentStep ? "bg-foreground" : "bg-border",
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left */}
        <div className="space-y-8">
          {/* AI Recommendation */}
          {kycCase.ai_recommendation && (
            <section className="rounded-lg border border-border bg-secondary/20 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Recommandation IA
                </span>
                <span className="font-data text-[11px] text-muted-foreground">
                  confiance {kycCase.ai_confidence}%
                </span>
              </div>
              <p className={cn(
                "text-[14px] font-medium",
                kycCase.ai_recommendation === "approve" ? "text-emerald-600" :
                kycCase.ai_recommendation === "reject" ? "text-red-600" : "text-amber-600",
              )}>
                {kycCase.ai_recommendation === "approve" ? "Approuver" :
                 kycCase.ai_recommendation === "reject" ? "Rejeter" : "Escalader"}
              </p>
              {kycCase.ai_recommendation === "reject" && (
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Sanctions match détecté, risque critique, revue senior requise
                </p>
              )}
              {kycCase.ai_recommendation === "escalate" && (
                <p className="mt-1 text-[12px] text-muted-foreground">
                  PEP détecté — vigilance renforcée requise, décision compliance officer
                </p>
              )}
            </section>
          )}

          {/* Screening summary */}
          <section>
            <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Screening ({screenings.length})
            </span>
            {screenings.length > 0 ? (
              <div className="space-y-2">
                {screenings.map((s) => (
                  <div key={s.id} className={cn(
                    "flex items-center justify-between rounded-lg px-4 py-2.5",
                    s.match_found ? "bg-orange-50" : s.status === "processing" ? "bg-blue-50" : "bg-emerald-50",
                  )}>
                    <div className="flex items-center gap-2">
                      {s.match_found ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                      ) : s.status === "processing" ? (
                        <Circle className="h-3.5 w-3.5 animate-pulse text-blue-600" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      )}
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
            ) : (
              <p className="text-[12px] text-muted-foreground">Aucun screening effectué</p>
            )}
          </section>

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

          {/* Decision */}
          {!isTerminal && (
            <section className="rounded-lg border-2 border-dashed border-border p-6">
              <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Décision
              </span>
              <p className="mb-4 text-[12px] text-muted-foreground">
                La décision finale est toujours humaine (Art. 3, Loi 1.362).
                Justifiez votre décision — elle sera conservée dans l&apos;audit trail.
              </p>
              <textarea
                placeholder="Justification de la décision..."
                className="mb-4 w-full rounded-lg border border-border bg-background px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-emerald-700">
                  Approuver
                </button>
                <button className="rounded-full bg-red-600 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-red-700">
                  Rejeter
                </button>
                <button className="rounded-full border border-border px-4 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary">
                  Escalader
                </button>
              </div>
            </section>
          )}

          {/* Past decision */}
          {kycCase.decision_status && (
            <section className={cn(
              "rounded-lg p-4",
              kycCase.decision_status === "approved" ? "bg-emerald-50" : "bg-red-50",
            )}>
              <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Décision rendue
              </span>
              <p className={cn(
                "text-[14px] font-medium",
                kycCase.decision_status === "approved" ? "text-emerald-700" : "text-red-700",
              )}>
                {kycCase.decision_status === "approved" ? "Approuvé" : "Rejeté"}
              </p>
              {kycCase.decision_justification && (
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {kycCase.decision_justification}
                </p>
              )}
              {kycCase.decided_at && (
                <p className="mt-2 font-data text-[10px] text-muted-foreground">
                  {new Date(kycCase.decided_at).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              )}
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
              {activities.map((a) => (
                <div key={a.id} className="flex gap-3 border-b border-border/50 py-3 last:border-0">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div className="flex-1">
                    <p className="text-[12px] text-foreground">{a.title}</p>
                    {a.description && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{a.description}</p>
                    )}
                    <p className="mt-1 font-data text-[10px] text-muted-foreground/60">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short",
                      })}
                      {a.agent_id && (
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
