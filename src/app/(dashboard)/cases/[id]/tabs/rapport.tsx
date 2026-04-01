"use client";

import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open: { label: "Ouvert", cls: "text-blue-700" },
  documents_pending: { label: "Documents en attente", cls: "text-amber-700" },
  screening: { label: "Screening", cls: "text-violet-700" },
  risk_review: { label: "Revue des risques", cls: "text-orange-700" },
  pending_decision: { label: "Decision en attente", cls: "text-blue-700" },
  approved: { label: "Approuve", cls: "text-emerald-700" },
  rejected: { label: "Rejete", cls: "text-red-700" },
  escalated: { label: "Esclade", cls: "text-red-700" },
  closed: { label: "Ferme", cls: "text-muted-foreground" },
};

interface Props {
  caseId: string;
  kycCase: Record<string, unknown>;
  entity: Record<string, unknown>;
}

export function RapportTab({ caseId, kycCase, entity }: Props) {
  const status = STATUS_LABELS[kycCase.status as string] ?? STATUS_LABELS.open;

  return (
    <div className="space-y-4">
      {/* Quick preview */}
      <div className="rounded-md border border-border bg-card px-4 py-3">
        <div className="mb-3 flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-blue-500" />
          <span className="font-heading text-[13px] font-semibold text-foreground">Apercu du rapport</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">N. dossier</span>
            <span className="font-data text-[12px] text-foreground">{kycCase.case_number as string}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Entite</span>
            <span className="text-[12px] text-foreground">{entity?.display_name as string}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Statut</span>
            <span className={cn("text-[12px] font-medium", status.cls)}>{status.label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Date creation</span>
            <span className="font-data text-[12px] text-foreground">
              {new Date(kycCase.created_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          {!!kycCase.decided_at && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Date decision</span>
              <span className="font-data text-[12px] text-foreground">
                {new Date(kycCase.decided_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Link to full report */}
      <div className="flex items-center gap-3">
        <Link href={`/reports/${caseId}`}>
          <Button size="sm" className="h-8 text-[11px]">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Voir le rapport complet
          </Button>
        </Link>
        <p className="text-[10px] text-muted-foreground">
          Le rapport complet inclut toutes les informations du dossier, les resultats de screening et la decision.
        </p>
      </div>
    </div>
  );
}
