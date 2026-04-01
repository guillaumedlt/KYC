"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  User,
  Users,
  PieChart,
  Search,
  Gavel,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SyntheseTab } from "./tabs/synthese";
import { SocieteTab } from "./tabs/societe";
import { IdentiteTab } from "./tabs/identite";
import { DirigeantsTab } from "./tabs/dirigeants";
import { ActionnariatTab } from "./tabs/actionnariat";
import { ScreeningTab } from "./tabs/screening";
import { DecisionTab } from "./tabs/decision";
import { RapportTab } from "./tabs/rapport";
import type { RiskFactor } from "@/lib/mock-data";

type CompanyTab = "synthese" | "societe" | "dirigeants" | "actionnariat" | "screening" | "decision" | "rapport";
type PersonTab = "synthese" | "identite" | "documents" | "screening" | "decision" | "rapport";

const COMPANY_TABS: { key: CompanyTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "synthese", label: "Synthese", icon: LayoutDashboard },
  { key: "societe", label: "Societe", icon: Building2 },
  { key: "dirigeants", label: "Dirigeants", icon: Users },
  { key: "actionnariat", label: "Actionnariat", icon: PieChart },
  { key: "screening", label: "Screening", icon: Search },
  { key: "decision", label: "Decision", icon: Gavel },
  { key: "rapport", label: "Rapport", icon: FileText },
];

const PERSON_TABS: { key: PersonTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "synthese", label: "Synthese", icon: LayoutDashboard },
  { key: "identite", label: "Identite", icon: User },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "screening", label: "Screening", icon: Search },
  { key: "decision", label: "Decision", icon: Gavel },
  { key: "rapport", label: "Rapport", icon: FileText },
];

interface Props {
  caseId: string;
  kycCase: Record<string, unknown>;
  entity: Record<string, unknown>;
  entityType: string;
  relations: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  screenings: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  riskFactors: RiskFactor[];
}

export function DossierTabs(props: Props) {
  const isCompany = props.entityType !== "person";
  const tabs = isCompany ? COMPANY_TABS : PERSON_TABS;
  const [activeTab, setActiveTab] = useState<string>("synthese");

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex gap-0.5 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-1 border-b-2 px-3 py-1.5 text-[11px] transition-colors",
              activeTab === t.key
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "synthese" && (
        <SyntheseTab
          kycCase={props.kycCase}
          entity={props.entity}
          relations={props.relations}
          documents={props.documents}
          screenings={props.screenings}
          activities={props.activities}
          riskFactors={props.riskFactors}
        />
      )}

      {activeTab === "societe" && isCompany && (
        <SocieteTab entity={props.entity} documents={props.documents} />
      )}

      {activeTab === "identite" && !isCompany && (
        <IdentiteTab entity={props.entity} documents={props.documents} />
      )}

      {activeTab === "documents" && !isCompany && (
        <IdentiteTab entity={props.entity} documents={props.documents} showDocsOnly />
      )}

      {activeTab === "dirigeants" && isCompany && (
        <DirigeantsTab
          relations={props.relations}
          entityId={props.kycCase.entity_id as string}
          screenings={props.screenings}
          documents={props.documents}
        />
      )}

      {activeTab === "actionnariat" && isCompany && (
        <ActionnariatTab
          relations={props.relations}
          entityId={props.kycCase.entity_id as string}
        />
      )}

      {activeTab === "screening" && (
        <ScreeningTab
          screenings={props.screenings}
          relations={props.relations}
          entityId={props.kycCase.entity_id as string}
          entity={props.entity}
        />
      )}

      {activeTab === "decision" && (
        <DecisionTab
          caseId={props.caseId}
          kycCase={props.kycCase}
        />
      )}

      {activeTab === "rapport" && (
        <RapportTab
          caseId={props.caseId}
          kycCase={props.kycCase}
          entity={props.entity}
        />
      )}
    </div>
  );
}
