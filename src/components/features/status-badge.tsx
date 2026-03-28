import { cn } from "@/lib/utils";
import type { KycStatus, RiskLevel, CaseStatus } from "@/types";

const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; className: string }> = {
  not_started: { label: "Non démarré", className: "bg-zinc-100 text-zinc-500" },
  in_progress: { label: "En cours", className: "bg-amber-50 text-amber-700" },
  pending_review: { label: "En revue", className: "bg-blue-50 text-blue-700" },
  approved: { label: "Approuvé", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejeté", className: "bg-red-50 text-red-700" },
  expired: { label: "Expiré", className: "bg-zinc-100 text-zinc-500" },
};

const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Faible", className: "bg-emerald-50 text-emerald-700" },
  medium: { label: "Moyen", className: "bg-amber-50 text-amber-700" },
  high: { label: "Élevé", className: "bg-orange-50 text-orange-700" },
  critical: { label: "Critique", className: "bg-red-50 text-red-700" },
};

const CASE_STATUS_CONFIG: Record<CaseStatus, { label: string; className: string }> = {
  open: { label: "Ouvert", className: "bg-blue-50 text-blue-700" },
  documents_pending: { label: "Documents", className: "bg-amber-50 text-amber-700" },
  screening: { label: "Screening", className: "bg-violet-50 text-violet-700" },
  risk_review: { label: "Risque", className: "bg-orange-50 text-orange-700" },
  pending_decision: { label: "Décision", className: "bg-blue-50 text-blue-700" },
  approved: { label: "Approuvé", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejeté", className: "bg-red-50 text-red-700" },
  escalated: { label: "Escaladé", className: "bg-red-50 text-red-700" },
  closed: { label: "Fermé", className: "bg-zinc-100 text-zinc-500" },
};

export function KycStatusBadge({ status }: { status: KycStatus }) {
  const c = KYC_STATUS_CONFIG[status];
  return <span className={cn("inline-block rounded px-1.5 py-px text-[10px] font-medium", c.className)}>{c.label}</span>;
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number | null }) {
  const c = RISK_LEVEL_CONFIG[level];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-medium", c.className)}>
      {score != null && <span className="font-data">{score}</span>}
      {c.label}
    </span>
  );
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const c = CASE_STATUS_CONFIG[status];
  return <span className={cn("inline-block rounded px-1.5 py-px text-[10px] font-medium", c.className)}>{c.label}</span>;
}
