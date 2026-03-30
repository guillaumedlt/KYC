"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, Circle, AlertTriangle, Sparkles, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

interface CheckItem { label: string; status: "green" | "orange" | "red" }

function getChecklist(data: WizardData): CheckItem[] {
  if (data.kind === "person") {
    return [
      { label: "Document d'identité", status: data.documentFile ? "green" : "red" },
      { label: "Extraction IA", status: data.firstName ? "green" : "red" },
      { label: "Vérification biométrique", status: "orange" },
      { label: "Preuve d'adresse", status: data.addressFile ? "green" : "red" },
      { label: "Source des fonds", status: data.fundsSource ? "green" : data.fundsFile ? "orange" : "red" },
      { label: "Screening PEP", status: "orange" },
      { label: "Screening sanctions", status: "orange" },
      { label: "Adverse media", status: "orange" },
    ];
  }
  return [
    { label: "Informations société", status: data.companyName ? "green" : "red" },
    { label: "Constitution / Statuts", status: data.constitutionFile ? "green" : "red" },
    { label: "Gouvernance / Dirigeants", status: data.governanceFile ? "green" : "orange" },
    { label: "Actionnariat", status: data.shareholdingFile ? "green" : "red" },
    { label: "UBO identifiés", status: data.ubos.length > 0 ? (data.ubos.every((u) => u.completed) ? "green" : "orange") : "red" },
    { label: "Documents financiers", status: data.financialFile ? "green" : "orange" },
    { label: "Screening société", status: "orange" },
    { label: "Screening dirigeants", status: "orange" },
  ];
}

export function ReviewStep({ data, back }: { data: WizardData; back: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const checklist = getChecklist(data);
  const greenCount = checklist.filter((c) => c.status === "green").length;
  const orangeCount = checklist.filter((c) => c.status === "orange").length;
  const redCount = checklist.filter((c) => c.status === "red").length;

  // Simulated risk score
  const riskScore = data.kind === "person" ? 42 : 58;

  function handleSubmit() {
    setSubmitting(true);
    // TODO: Server action → create entity + case + documents in Supabase
    setTimeout(() => {
      router.push("/entities");
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Revue du dossier</h2>
        <p className="text-[12px] text-muted-foreground">
          {data.kind === "person"
            ? `${data.firstName} ${data.lastName}`
            : data.companyName
          } — vérifiez la complétude avant soumission.
        </p>
      </div>

      {/* Completeness dashboard */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-center">
          <p className="font-data text-[20px] font-semibold text-emerald-600">{greenCount}</p>
          <p className="text-[10px] text-emerald-700">Validé</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50/50 px-4 py-3 text-center">
          <p className="font-data text-[20px] font-semibold text-amber-600">{orangeCount}</p>
          <p className="text-[10px] text-amber-700">En attente</p>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50/50 px-4 py-3 text-center">
          <p className="font-data text-[20px] font-semibold text-red-600">{redCount}</p>
          <p className="text-[10px] text-red-700">Manquant</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border px-4 py-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Checklist de complétude</span>
        </div>
        <div className="divide-y divide-border/50">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2">
              {item.status === "green" ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> :
               item.status === "orange" ? <Circle className="h-3.5 w-3.5 text-amber-500" /> :
               <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
              <span className={cn("text-[12px]",
                item.status === "green" ? "text-foreground" : item.status === "orange" ? "text-amber-700" : "text-red-700"
              )}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk score preview */}
      <div className="rounded-md border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Score de risque provisoire</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "font-data text-[28px] font-semibold",
            riskScore >= 80 ? "text-red-600" : riskScore >= 60 ? "text-orange-600" : riskScore >= 40 ? "text-amber-600" : "text-emerald-600",
          )}>{riskScore}</span>
          <div>
            <p className="text-[12px] font-medium text-foreground">
              {riskScore >= 80 ? "Critique" : riskScore >= 60 ? "Élevé" : riskScore >= 40 ? "Moyen" : "Faible"}
            </p>
            <p className="text-[11px] text-muted-foreground">Score provisoire — sera consolidé après screening complet</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div className={cn("h-1.5 rounded-full transition-all",
            riskScore >= 80 ? "bg-red-500" : riskScore >= 60 ? "bg-orange-500" : riskScore >= 40 ? "bg-amber-500" : "bg-emerald-500",
          )} style={{ width: `${riskScore}%` }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between border-t border-border pt-4">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px]">Sauvegarder brouillon</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || redCount > 0} className="h-8 text-[11px]">
            {submitting ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Shield className="mr-1.5 h-3 w-3" />}
            Soumettre le dossier
          </Button>
        </div>
      </div>

      {redCount > 0 && (
        <p className="text-[10px] text-red-600">
          {redCount} élément{redCount > 1 ? "s" : ""} manquant{redCount > 1 ? "s" : ""} — complétez-les avant de soumettre.
        </p>
      )}
    </div>
  );
}
