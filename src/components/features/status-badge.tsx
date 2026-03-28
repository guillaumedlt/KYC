import { cn } from "@/lib/utils";
import type { KycStatus, RiskLevel, CaseStatus } from "@/types";

const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; className: string }> = {
  not_started: { label: "Non démarré", className: "bg-zinc-100 text-zinc-500" },
  in_progress: { label: "En cours", className: "bg-amber-50 text-amber-600" },
  pending_review: { label: "En revue", className: "bg-blue-50 text-blue-600" },
  approved: { label: "Approuvé", className: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "Rejeté", className: "bg-red-50 text-red-600" },
  expired: { label: "Expiré", className: "bg-zinc-100 text-zinc-500" },
};

const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Faible", className: "bg-emerald-50 text-emerald-600" },
  medium: { label: "Moyen", className: "bg-amber-50 text-amber-600" },
  high: { label: "Élevé", className: "bg-orange-50 text-orange-600" },
  critical: { label: "Critique", className: "bg-red-50 text-red-600" },
};

const CASE_STATUS_CONFIG: Record<CaseStatus, { label: string; className: string }> = {
  open: { label: "Ouvert", className: "bg-blue-50 text-blue-600" },
  documents_pending: { label: "Documents", className: "bg-amber-50 text-amber-600" },
  screening: { label: "Screening", className: "bg-violet-50 text-violet-600" },
  risk_review: { label: "Revue risque", className: "bg-orange-50 text-orange-600" },
  pending_decision: { label: "Décision", className: "bg-blue-50 text-blue-600" },
  approved: { label: "Approuvé", className: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "Rejeté", className: "bg-red-50 text-red-600" },
  escalated: { label: "Escaladé", className: "bg-red-50 text-red-600" },
  closed: { label: "Fermé", className: "bg-zinc-100 text-zinc-500" },
};

export function KycStatusBadge({ status }: { status: KycStatus }) {
  const config = KYC_STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", config.className)}>
      {config.label}
    </span>
  );
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number | null }) {
  const config = RISK_LEVEL_CONFIG[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", config.className)}>
      {score != null && <span className="font-data">{score}</span>}
      {config.label}
    </span>
  );
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const config = CASE_STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", config.className)}>
      {config.label}
    </span>
  );
}
