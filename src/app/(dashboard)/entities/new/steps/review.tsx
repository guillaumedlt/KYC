"use client";

import { useState } from "react";
import { CheckCircle, Circle, AlertTriangle, Sparkles, Loader2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

interface CheckItem { label: string; status: "green" | "orange" | "red" }

function getChecklist(data: WizardData): CheckItem[] {
  if (data.kind === "person") {
    return [
      { label: "Document d'identité", status: data.documentFile ? "green" : "red" },
      { label: "Extraction IA", status: data.firstName ? "green" : "red" },
      { label: "Preuve d'adresse", status: data.addressFile ? "green" : "red" },
      { label: "Source des fonds", status: data.fundsSource ? "green" : data.fundsFile ? "orange" : "orange" },
      { label: "Screening PEP/Sanctions", status: "orange" },
    ];
  }
  return [
    { label: "Informations société", status: data.companyName ? "green" : "red" },
    { label: "Documents constitution", status: data.constitutionFiles?.length ? "green" : "red" },
    { label: "Gouvernance", status: data.governanceFiles?.length ? "green" : "orange" },
    { label: "Actionnariat", status: data.shareholdingFiles?.length ? "green" : "red" },
    { label: "UBO identifiés", status: data.ubos.length > 0 ? (data.ubos.every((u) => u.completed) ? "green" : "orange") : "red" },
    { label: "Documents financiers", status: data.financialFiles?.length ? "green" : "orange" },
    { label: "Screening", status: "orange" },
  ];
}

function collectFiles(data: WizardData): { name: string; type: string; base64: string }[] {
  // We'll collect files in the submit handler via FileReader
  return [];
}

export function ReviewStep({ data, back }: { data: WizardData; back: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const router = useRouter();
  const checklist = getChecklist(data);
  const greenCount = checklist.filter((c) => c.status === "green").length;
  const orangeCount = checklist.filter((c) => c.status === "orange").length;
  const redCount = checklist.filter((c) => c.status === "red").length;

  const riskScore = data.riskScore ?? (data.kind === "person" ? 42 : 58);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create entity WITHOUT files (small payload)
      setProgress("Création de l'entité...");
      const res = await fetch("/api/wizard-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: data.kind,
          firstName: data.firstName,
          lastName: data.lastName,
          nationality: data.nationality,
          dateOfBirth: data.dateOfBirth,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          documentExpiry: data.documentExpiry,
          address: data.addressExtracted,
          fundsSource: data.fundsSource,
          fundsAmount: data.fundsAmount,
          companyName: data.companyName,
          companyType: data.companyType,
          jurisdiction: data.jurisdiction,
          regNumber: data.regNumber,
          industry: data.industry,
          capital: data.capital,
          ubos: data.ubos,
          riskScore,
          aiExtractions: data.aiExtractions,
          files: [], // No files in step 1
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur création entité (HTTP ${res.status})`);
      }

      const { entityId } = await res.json();

      // Step 2: Upload files ONE BY ONE (avoids body size limit)
      const allFiles: { file: File; docType: string }[] = [];
      if (data.documentFile) allFiles.push({ file: data.documentFile, docType: data.documentType || "passport" });
      for (const f of (data.additionalIdFiles || [])) allFiles.push({ file: f, docType: "identity_additional" });
      if (data.addressFile) allFiles.push({ file: data.addressFile, docType: "proof_of_address" });
      for (const f of (data.additionalAddressFiles || [])) allFiles.push({ file: f, docType: "proof_of_address" });
      if (data.fundsFile) allFiles.push({ file: data.fundsFile, docType: "source_of_funds" });
      for (const f of (data.constitutionFiles || [])) allFiles.push({ file: f, docType: "company_registration" });
      for (const f of (data.governanceFiles || [])) allFiles.push({ file: f, docType: "governance" });
      for (const f of (data.shareholdingFiles || [])) allFiles.push({ file: f, docType: "shareholding" });
      for (const f of (data.financialFiles || [])) allFiles.push({ file: f, docType: "financial_statement" });

      for (let i = 0; i < allFiles.length; i++) {
        setProgress(`Upload fichier ${i + 1}/${allFiles.length}...`);
        const { file, docType } = allFiles[i];
        try {
          const base64 = await fileToBase64(file);
          await fetch("/api/wizard-submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "upload-file",
              entityId,
              file: { name: file.name, type: file.type, base64, docType, confidence: 0 },
            }),
          });
        } catch {
          // File upload failed — continue with other files
          console.error(`Failed to upload ${file.name}`);
        }
      }

      setProgress("Redirection...");
      router.push(`/entities/${entityId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la soumission. Réessayez.");
      setSubmitting(false);
      setProgress("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Revue du dossier</h2>
        <p className="text-[12px] text-muted-foreground">
          {data.kind === "person" ? `${data.firstName} ${data.lastName}` : data.companyName} — vérifiez avant soumission.
        </p>
      </div>

      {/* Completeness */}
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
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Checklist</span>
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

      {/* Risk score */}
      <div className="rounded-md border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Score de risque provisoire</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("font-data text-[28px] font-semibold",
            riskScore >= 80 ? "text-red-600" : riskScore >= 60 ? "text-orange-600" : riskScore >= 40 ? "text-amber-600" : "text-emerald-600",
          )}>{riskScore}</span>
          <div>
            <p className="text-[12px] font-medium">{riskScore >= 80 ? "Critique" : riskScore >= 60 ? "Élevé" : riskScore >= 40 ? "Moyen" : "Faible"}</p>
            <p className="text-[11px] text-muted-foreground">Sera consolidé après screening complet</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div className={cn("h-1.5 rounded-full",
            riskScore >= 80 ? "bg-red-500" : riskScore >= 60 ? "bg-orange-500" : riskScore >= 40 ? "bg-amber-500" : "bg-emerald-500",
          )} style={{ width: `${riskScore}%` }} />
        </div>
      </div>

      {/* Error */}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[11px] text-red-700">{error}</p>}

      {/* Actions */}
      <div className="flex justify-between border-t border-border pt-4">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <div className="flex items-center gap-3">
          {progress && <span className="text-[10px] text-muted-foreground">{progress}</span>}
          <Button size="sm" onClick={handleSubmit} disabled={submitting} className="h-8 text-[11px]">
            {submitting ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Shield className="mr-1.5 h-3 w-3" />}
            {submitting ? "Soumission..." : "Soumettre le dossier"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  });
}
