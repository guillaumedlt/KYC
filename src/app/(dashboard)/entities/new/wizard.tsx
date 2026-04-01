"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TypeStep } from "./steps/type-step";
import { PersonIdentityStep } from "./steps/person-identity";
import { PersonAddressStep } from "./steps/person-address";
import { PersonFundsStep } from "./steps/person-funds";
import { CompanyDocsStep } from "./steps/company-docs";
import { CompanyUboStep } from "./steps/company-ubo";
import { ReviewStep } from "./steps/review";
import { cn } from "@/lib/utils";

export type EntityKind = "person" | "company" | "structure";

export interface WizardData {
  kind: EntityKind | null;
  // Person
  nationality: string;
  residence: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentType: string;
  documentNumber: string;
  documentExpiry: string;
  documentFile: File | null;
  selfieFile: File | null;
  addressFile: File | null;
  addressExtracted: string;
  fundsSource: string;
  fundsFile: File | null;
  fundsAmount: string;
  // Company
  companyName: string;
  companyType: string;
  jurisdiction: string;
  regNumber: string;
  incorporationDate: string;
  industry: string;
  capital: string;
  constitutionFiles: File[];
  governanceFiles: File[];
  shareholdingFiles: File[];
  financialFiles: File[];
  // UBOs detected
  ubos: { name: string; percentage: number; completed: boolean; role?: string; nationality?: string }[];
  // AI extractions
  aiExtractions: Record<string, string>;
  aiWarnings: string[];
  riskScore: number | null;
}

const INITIAL_DATA: WizardData = {
  kind: null,
  nationality: "", residence: "", firstName: "", lastName: "",
  dateOfBirth: "", documentType: "passport", documentNumber: "",
  documentExpiry: "", documentFile: null, selfieFile: null,
  addressFile: null, addressExtracted: "", fundsSource: "",
  fundsFile: null, fundsAmount: "",
  companyName: "", companyType: "", jurisdiction: "", regNumber: "",
  incorporationDate: "", industry: "", capital: "",
  constitutionFiles: [], governanceFiles: [],
  shareholdingFiles: [], financialFiles: [],
  ubos: [], aiExtractions: {}, aiWarnings: [], riskScore: null,
};

const PERSON_STEPS = ["Type", "Identité", "Adresse", "Fonds", "Revue"];
const COMPANY_STEPS = ["Type", "Documents", "UBO", "Revue"];

export function KycWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);

  const steps = data.kind === "company" || data.kind === "structure" ? COMPANY_STEPS : PERSON_STEPS;

  function update(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function next() { setStep((s) => Math.min(s + 1, steps.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back */}
      <Link href="/entities" className="mb-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Entités
      </Link>

      {/* Title */}
      <h1 className="mb-1 font-heading text-[22px] text-foreground">Nouvelle vérification KYC</h1>
      <p className="mb-6 text-[12px] text-muted-foreground">Parcours guidé — l&apos;IA extrait et vérifie automatiquement</p>

      {/* Progress */}
      {data.kind && (
        <div className="mb-8 flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium transition-all",
                  i < step ? "bg-foreground text-background" :
                  i === step ? "border-2 border-foreground text-foreground" :
                  "border border-border text-muted-foreground",
                )}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={cn("text-[10px]", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={cn("mx-2 h-px flex-1", i < step ? "bg-foreground" : "bg-border")} />}
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      {step === 0 && <TypeStep data={data} update={update} next={next} />}

      {data.kind === "person" && step === 1 && <PersonIdentityStep data={data} update={update} next={next} back={back} />}
      {data.kind === "person" && step === 2 && <PersonAddressStep data={data} update={update} next={next} back={back} />}
      {data.kind === "person" && step === 3 && <PersonFundsStep data={data} update={update} next={next} back={back} />}

      {(data.kind === "company" || data.kind === "structure") && step === 1 && <CompanyDocsStep data={data} update={update} next={next} back={back} />}
      {(data.kind === "company" || data.kind === "structure") && step === 2 && <CompanyUboStep data={data} update={update} next={next} back={back} />}

      {step === steps.length - 1 && step > 0 && <ReviewStep data={data} back={back} />}
    </div>
  );
}
