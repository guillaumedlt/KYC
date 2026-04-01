"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Search,
  Shield,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskFactor } from "@/lib/mock-data";

const RISK_COLORS: Record<string, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

const RISK_BG: Record<string, string> = {
  low: "bg-emerald-50",
  medium: "bg-amber-50",
  high: "bg-orange-50",
  critical: "bg-red-50",
};

const VIG_LABELS: Record<string, { label: string; cls: string }> = {
  simplified: { label: "Simplifiee", cls: "bg-emerald-50 text-emerald-700" },
  standard: { label: "Standard", cls: "bg-blue-50 text-blue-700" },
  enhanced: { label: "Renforcee", cls: "bg-orange-50 text-orange-700" },
};

interface Props {
  kycCase: Record<string, unknown>;
  entity: Record<string, unknown>;
  relations: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  screenings: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  riskFactors: RiskFactor[];
}

export function SyntheseTab({ kycCase, entity, relations, documents, screenings, activities, riskFactors }: Props) {
  const riskScore = (entity?.risk_score as number) ?? 0;
  const riskLevel = (entity?.risk_level as string) ?? "low";
  const vig = VIG_LABELS[kycCase.vigilance_level as string] ?? VIG_LABELS.standard;

  const completedScreenings = screenings.filter((s) => s.status === "completed").length;
  const totalScreenings = screenings.length;
  const unreviewedMatches = screenings.filter(
    (s) => s.match_found === true && (s.review_decision === "pending" || s.review_decision == null)
  ).length;
  const isDone = ["approved", "rejected", "escalated", "closed"].includes(kycCase.status as string);

  const alerts: { type: "warning" | "error" | "info"; text: string }[] = [];
  if (unreviewedMatches > 0) {
    alerts.push({ type: "error", text: `${unreviewedMatches} match${unreviewedMatches > 1 ? "s" : ""} non revise${unreviewedMatches > 1 ? "s" : ""}` });
  }
  if (documents.length === 0) {
    alerts.push({ type: "warning", text: "Aucun document collecte" });
  }
  if (kycCase.due_date && new Date(kycCase.due_date as string) < new Date()) {
    alerts.push({ type: "error", text: "Echeance depassee" });
  }
  if (!isDone && kycCase.due_date) {
    const daysLeft = Math.ceil((new Date(kycCase.due_date as string).getTime() - Date.now()) / 86400000);
    if (daysLeft > 0 && daysLeft <= 7) {
      alerts.push({ type: "warning", text: `Echeance dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}` });
    }
  }

  const recentActivities = activities.slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left column: Risk + Vigilance + Progress */}
      <div className="space-y-4 lg:col-span-2">
        {/* Score + Vigilance row */}
        <div className="flex gap-3">
          {/* Risk score */}
          <div className={cn("flex flex-1 items-center gap-3 rounded-md border border-border px-4 py-3", RISK_BG[riskLevel])}>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-background/80">
              <span className={cn("font-data text-[22px] font-bold", RISK_COLORS[riskLevel])}>{riskScore}</span>
            </div>
            <div>
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Score de risque</span>
              <p className={cn("text-[12px] font-semibold capitalize", RISK_COLORS[riskLevel])}>{riskLevel}</p>
            </div>
          </div>

          {/* Vigilance */}
          <div className="flex flex-1 items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Vigilance</span>
              <p className={cn("rounded-sm px-1.5 py-0.5 text-[11px] font-medium", vig.cls)}>{vig.label}</p>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="grid grid-cols-3 gap-2">
          <ProgressCard
            icon={FileText}
            label="Documents"
            value={`${documents.length}`}
            sub={documents.length === 0 ? "Aucun" : `${documents.length} collecte${documents.length > 1 ? "s" : ""}`}
            color={documents.length > 0 ? "emerald" : "amber"}
          />
          <ProgressCard
            icon={Search}
            label="Screening"
            value={`${completedScreenings}/${totalScreenings}`}
            sub={totalScreenings === 0 ? "Non lance" : completedScreenings === totalScreenings ? "Termine" : "En cours"}
            color={completedScreenings === totalScreenings && totalScreenings > 0 ? "emerald" : "amber"}
          />
          <ProgressCard
            icon={TrendingUp}
            label="Decision"
            value={isDone ? "Fait" : "En attente"}
            sub={kycCase.decision_status ? String(kycCase.decision_status) : "Pas encore decide"}
            color={isDone ? "emerald" : "amber"}
          />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Alertes</span>
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-[11px]",
                  alert.type === "error" ? "bg-red-50 text-red-700" : alert.type === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                )}
              >
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {alert.text}
              </div>
            ))}
          </div>
        )}

        {/* Risk factors */}
        {riskFactors.length > 0 && (
          <div>
            <span className="mb-2 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Facteurs de risque
            </span>
            <div className="space-y-1">
              {riskFactors.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-1.5">
                  <span
                    className={cn(
                      "w-8 font-data text-[11px] font-semibold",
                      f.impact >= 20 ? "text-red-600" : f.impact >= 10 ? "text-amber-600" : "text-muted-foreground"
                    )}
                  >
                    +{f.impact}
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-foreground">{f.factor}</p>
                    <p className="text-[10px] text-muted-foreground">{f.details}</p>
                  </div>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{f.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right column: Timeline */}
      <div className="rounded-md border border-border bg-card px-3 py-3">
        <span className="mb-2 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          <Clock className="mr-1 inline h-3 w-3" />
          Activite recente
        </span>
        {recentActivities.length === 0 && (
          <p className="py-4 text-center text-[10px] text-muted-foreground">Aucune activite</p>
        )}
        {recentActivities.map((a) => (
          <div key={a.id as string} className="border-b border-border/50 py-1.5 last:border-0">
            <p className="text-[10px] text-foreground">{a.title as string}</p>
            {a.description != null && (
              <p className="text-[9px] text-muted-foreground">{a.description as string}</p>
            )}
            <p className="font-data text-[8px] text-muted-foreground/50">
              {new Date(a.created_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              {a.agent_id != null && <span className="ml-1 rounded bg-muted px-0.5 text-[7px]">IA</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  sub: string;
  color: "emerald" | "amber" | "red";
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3 w-3", color === "emerald" ? "text-emerald-500" : color === "red" ? "text-red-500" : "text-amber-500")} />
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 font-data text-[14px] font-semibold text-foreground">{value}</p>
      <p className={cn("text-[9px]", color === "emerald" ? "text-emerald-600" : color === "red" ? "text-red-600" : "text-amber-600")}>{sub}</p>
    </div>
  );
}
