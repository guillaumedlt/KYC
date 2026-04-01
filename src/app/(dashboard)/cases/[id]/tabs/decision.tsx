"use client";

import { Sparkles } from "lucide-react";
import { DecisionForm } from "../decision-form";
import { cn } from "@/lib/utils";

interface Props {
  caseId: string;
  kycCase: Record<string, unknown>;
}

export function DecisionTab({ caseId, kycCase }: Props) {
  const isDone = ["approved", "rejected", "escalated", "closed"].includes(kycCase.status as string);

  return (
    <div className="space-y-4">
      {/* AI Recommendation */}
      {!!kycCase.ai_recommendation && (
        <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Recommandation IA</span>
            {kycCase.ai_confidence != null && (
              <span className="font-data text-[10px] text-muted-foreground">Confiance : {String(kycCase.ai_confidence)}%</span>
            )}
          </div>
          <p
            className={cn(
              "text-[13px] font-semibold",
              kycCase.ai_recommendation === "approve"
                ? "text-emerald-600"
                : kycCase.ai_recommendation === "reject"
                  ? "text-red-600"
                  : "text-amber-600"
            )}
          >
            {kycCase.ai_recommendation === "approve" ? "Approuver" : kycCase.ai_recommendation === "reject" ? "Rejeter" : "Escalader"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Art. 3, Loi 1.362 -- la decision finale est toujours humaine.
          </p>
        </div>
      )}

      {/* Decision form (if not yet decided) */}
      {!isDone && <DecisionForm caseId={caseId} />}

      {/* Decision history */}
      {!!kycCase.decision_status && (
        <div className={cn("rounded-md border border-border px-4 py-3", kycCase.decision_status === "approved" ? "bg-emerald-50" : kycCase.decision_status === "rejected" ? "bg-red-50" : "bg-amber-50")}>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Decision rendue</span>
          <p
            className={cn(
              "mt-1 text-[13px] font-semibold",
              kycCase.decision_status === "approved"
                ? "text-emerald-700"
                : kycCase.decision_status === "rejected"
                  ? "text-red-700"
                  : "text-amber-700"
            )}
          >
            {kycCase.decision_status === "approved" ? "Approuve" : kycCase.decision_status === "rejected" ? "Rejete" : "Esclade"}
          </p>
          {!!kycCase.decision_justification && (
            <p className="mt-1 text-[11px] text-muted-foreground">{String(kycCase.decision_justification)}</p>
          )}
          {!!kycCase.decided_at && (
            <p className="mt-1 font-data text-[9px] text-muted-foreground/50">
              {new Date(kycCase.decided_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!kycCase.ai_recommendation && !kycCase.decision_status && isDone && (
        <div className="rounded-md border border-dashed border-border py-6 text-center">
          <p className="text-[11px] text-muted-foreground">Aucune decision enregistree.</p>
        </div>
      )}
    </div>
  );
}
