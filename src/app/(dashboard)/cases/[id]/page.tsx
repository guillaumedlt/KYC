import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Sparkles, AlertTriangle, Clock } from "lucide-react";
import { MOCK_CASES, getEntityById, getScreeningsForEntity, getRiskFactors, getActivitiesForEntity } from "@/lib/mock-data";
import { RiskBadge } from "@/components/features/status-badge";
import { cn } from "@/lib/utils";
import type { RiskLevel, CaseStatus } from "@/types";

const STEPS: { key: CaseStatus[]; label: string }[] = [
  { key: ["open"], label: "Ouvert" },
  { key: ["documents_pending"], label: "Docs" },
  { key: ["screening"], label: "Screen" },
  { key: ["risk_review"], label: "Risque" },
  { key: ["pending_decision"], label: "Décision" },
  { key: ["approved", "rejected", "escalated", "closed"], label: "Fait" },
];

const VIG_C: Record<string, { label: string; cls: string }> = {
  simplified: { label: "Simplifiée", cls: "bg-emerald-50 text-emerald-700" },
  standard: { label: "Standard", cls: "bg-blue-50 text-blue-700" },
  enhanced: { label: "Renforcée", cls: "bg-orange-50 text-orange-700" },
};

function stepIdx(status: CaseStatus) { return STEPS.findIndex((s) => s.key.includes(status)); }

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kc = MOCK_CASES.find((c) => c.id === id);
  if (!kc) notFound();
  const entity = getEntityById(kc.entity_id);
  if (!entity) notFound();

  const screenings = getScreeningsForEntity(entity.id);
  const riskFactors = getRiskFactors(entity.id);
  const activities = getActivitiesForEntity(entity.id);
  const cur = stepIdx(kc.status);
  const vig = VIG_C[kc.vigilance_level];
  const isDone = ["approved", "rejected", "escalated", "closed"].includes(kc.status);

  return (
    <div>
      <Link href="/cases" className="mb-3 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" />Dossiers
      </Link>

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-data text-[14px] font-semibold">{kc.case_number}</h2>
            <span className={cn("rounded px-1.5 py-px text-[10px] font-medium", vig.cls)}>{vig.label}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Link href={`/entities/${entity.id}`} className="text-[11px] text-foreground hover:underline">{entity.display_name}</Link>
            <span className="text-[10px] text-muted-foreground">{entity.type === "person" ? "Personne" : "Société"}</span>
            {entity.risk_level && <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score} />}
          </div>
          {kc.due_date && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600">
              <Clock className="h-3 w-3" />
              Échéance {new Date(kc.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      </div>

      {/* Workflow */}
      <div className="mb-4 flex items-center gap-0 overflow-x-auto border-b border-border pb-3">
        {STEPS.map((s, i) => {
          const done = i < cur;
          const active = i === cur;
          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium",
                  done ? "bg-foreground text-background" : active ? "border-2 border-foreground text-foreground" : "border border-border text-muted-foreground",
                )}>
                  {done ? <CheckCircle className="h-3 w-3" /> : i + 1}
                </div>
                <span className={cn("text-[9px]", active ? "font-medium text-foreground" : "text-muted-foreground")}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("mx-1 h-px flex-1", i < cur ? "bg-foreground" : "bg-border")} />}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          {/* AI Reco */}
          {kc.ai_recommendation && (
            <div className="rounded border border-border bg-muted/30 px-3 py-2">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Recommandation IA</span>
                <span className="font-data text-[9px] text-muted-foreground">{kc.ai_confidence}%</span>
              </div>
              <p className={cn("text-[12px] font-medium",
                kc.ai_recommendation === "approve" ? "text-emerald-600" :
                kc.ai_recommendation === "reject" ? "text-red-600" : "text-amber-600"
              )}>
                {kc.ai_recommendation === "approve" ? "Approuver" : kc.ai_recommendation === "reject" ? "Rejeter" : "Escalader"}
              </p>
            </div>
          )}

          {/* Screening */}
          {screenings.length > 0 && (
            <div>
              <span className="mb-1.5 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Screening ({screenings.length})</span>
              <div className="space-y-1">
                {screenings.map((s) => (
                  <div key={s.id} className={cn("flex items-center justify-between rounded px-3 py-1.5",
                    s.match_found ? "bg-orange-50" : s.status === "processing" ? "bg-blue-50" : "bg-emerald-50"
                  )}>
                    <span className="text-[11px] font-medium">
                      {s.screening_type === "pep" ? "PEP" : s.screening_type === "sanctions" ? "Sanctions" : "Adverse media"}
                    </span>
                    <span className={cn("text-[10px] font-medium",
                      s.match_found ? "text-orange-600" : s.status === "processing" ? "text-blue-600" : "text-emerald-600"
                    )}>
                      {s.match_found ? "Match" : s.status === "processing" ? "En cours" : "Clean"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk factors */}
          {riskFactors.length > 0 && (
            <div>
              <span className="mb-1.5 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Facteurs de risque</span>
              <div className="space-y-1">
                {riskFactors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded bg-muted/40 px-3 py-1.5">
                    <span className={cn("font-data text-[11px] font-semibold",
                      f.impact >= 20 ? "text-red-600" : f.impact >= 10 ? "text-amber-600" : "text-muted-foreground"
                    )}>+{f.impact}</span>
                    <span className="text-[11px] text-foreground">{f.factor}</span>
                    <span className="text-[10px] text-muted-foreground">— {f.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision */}
          {!isDone && (
            <div className="rounded border-2 border-dashed border-border p-4">
              <span className="mb-2 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Décision</span>
              <p className="mb-2 text-[10px] text-muted-foreground">Art. 3, Loi 1.362 — la décision finale est toujours humaine.</p>
              <textarea placeholder="Justification..." className="mb-2 w-full rounded border border-border bg-background px-3 py-2 text-[11px] focus:border-foreground focus:outline-none" rows={2} />
              <div className="flex gap-1">
                <button className="rounded bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-700">Approuver</button>
                <button className="rounded bg-red-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-red-700">Rejeter</button>
                <button className="rounded border border-border px-3 py-1 text-[11px] font-medium text-foreground hover:bg-muted">Escalader</button>
              </div>
            </div>
          )}

          {kc.decision_status && (
            <div className={cn("rounded px-3 py-2", kc.decision_status === "approved" ? "bg-emerald-50" : "bg-red-50")}>
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Décision</span>
              <p className={cn("text-[12px] font-medium", kc.decision_status === "approved" ? "text-emerald-700" : "text-red-700")}>
                {kc.decision_status === "approved" ? "Approuvé" : "Rejeté"}
              </p>
              {kc.decision_justification && <p className="mt-0.5 text-[10px] text-muted-foreground">{kc.decision_justification}</p>}
              {kc.decided_at && <p className="mt-1 font-data text-[9px] text-muted-foreground/50">{new Date(kc.decided_at).toLocaleDateString("fr-FR")}</p>}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="border-l border-border pl-3">
          <span className="mb-2 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Timeline</span>
          {activities.map((a) => (
            <div key={a.id} className="border-b border-border/50 py-1.5 last:border-0">
              <p className="text-[10px] text-foreground">{a.title}</p>
              {a.description && <p className="text-[9px] text-muted-foreground">{a.description}</p>}
              <p className="font-data text-[8px] text-muted-foreground/50">
                {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                {a.agent_id && <span className="ml-1 rounded bg-muted px-0.5 text-[7px]">IA</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
