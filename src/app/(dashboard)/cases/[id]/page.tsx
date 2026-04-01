import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Building2, Landmark, Clock } from "lucide-react";
import { getDossierById } from "@/lib/supabase/queries";
import { getRiskFactors } from "@/lib/mock-data";
import { KycStatusBadge, RiskBadge, CaseStatusBadge } from "@/components/features/status-badge";
import { DossierTabs } from "./dossier-tabs";
import { cn } from "@/lib/utils";
import type { RiskLevel, CaseStatus } from "@/types";

const TYPE_C: Record<string, { label: string; icon: typeof User }> = {
  person: { label: "Personne", icon: User },
  company: { label: "Societe", icon: Building2 },
  trust: { label: "Trust", icon: Landmark },
  foundation: { label: "Fondation", icon: Landmark },
};

const VIG_C: Record<string, { label: string; cls: string }> = {
  simplified: { label: "Simplifiee", cls: "bg-emerald-50 text-emerald-700" },
  standard: { label: "Standard", cls: "bg-blue-50 text-blue-700" },
  enhanced: { label: "Renforcee", cls: "bg-orange-50 text-orange-700" },
};

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dossier = await getDossierById(id);
  if (!dossier) notFound();

  const { kycCase, entity, relations, documents, screenings, activities } = dossier;
  const riskFactors = getRiskFactors(kycCase.entity_id);

  const entityType = (entity?.type as string) ?? "person";
  const tc = TYPE_C[entityType] ?? TYPE_C.person;
  const Icon = tc.icon;
  const vig = VIG_C[kycCase.vigilance_level] ?? VIG_C.standard;

  return (
    <div>
      <Link href="/cases" className="mb-3 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" />Dossiers
      </Link>

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-data text-[14px] font-semibold">{kycCase.case_number}</h2>
              <CaseStatusBadge status={kycCase.status as CaseStatus} />
              <span className={cn("rounded px-1.5 py-px text-[10px] font-medium", vig.cls)}>{vig.label}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <Link href={`/entities/${kycCase.entity_id}`} className="text-[12px] text-foreground hover:underline">
                {entity?.display_name as string}
              </Link>
              <span className="text-[10px] text-muted-foreground">{tc.label}</span>
              {entity?.kyc_status != null && <KycStatusBadge status={entity.kyc_status as import("@/types").KycStatus} />}
              {entity?.risk_level != null && <RiskBadge level={entity.risk_level as RiskLevel} score={entity.risk_score as number} />}
            </div>
            {kycCase.due_date && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600">
                <Clock className="h-3 w-3" />
                Echeance {new Date(kycCase.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DossierTabs
        caseId={id}
        kycCase={kycCase}
        entity={entity}
        entityType={entityType}
        relations={relations}
        documents={documents}
        screenings={screenings}
        activities={activities}
        riskFactors={riskFactors}
      />
    </div>
  );
}
