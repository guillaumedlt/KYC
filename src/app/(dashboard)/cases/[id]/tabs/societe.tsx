"use client";

import { Building2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  entity: Record<string, unknown>;
  documents: Record<string, unknown>[];
}

const DOC_CATEGORIES: Record<string, { label: string; types: string[] }> = {
  constitution: {
    label: "Documents constitutifs",
    types: ["company_registration", "articles_of_association"],
  },
  financial: {
    label: "Documents financiers",
    types: ["financial_statement", "bank_statement", "tax_return"],
  },
  structure: {
    label: "Structure et actionnariat",
    types: ["shareholder_register"],
  },
  other: {
    label: "Autres documents",
    types: ["other", "source_of_funds", "source_of_wealth"],
  },
};

const DOC_STATUS_COLORS: Record<string, string> = {
  uploaded: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  extracted: "bg-violet-50 text-violet-700",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export function SocieteTab({ entity, documents }: Props) {
  const company = entity?.entity_companies as Record<string, unknown> | null;

  // Filter docs belonging to the main entity
  const entityDocs = documents.filter((d) => d.entity_id === entity?.id);

  return (
    <div className="space-y-6">
      {/* Company info */}
      <div>
        <div className="mb-3 flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-violet-500" />
          <span className="font-heading text-[13px] font-semibold text-foreground">Societe</span>
        </div>
        <div className="rounded-md border border-border">
          <InfoRow label="Raison sociale" value={company?.legal_name as string} />
          <InfoRow label="Nom commercial" value={company?.trading_name as string} />
          <InfoRow label="N. registre (RCI)" value={company?.registration_number as string} mono />
          <InfoRow label="Juridiction" value={company?.jurisdiction as string} />
          <InfoRow label="Forme juridique" value={company?.company_type as string} />
          <InfoRow label="Date constitution" value={company?.incorporation_date ? new Date(company.incorporation_date as string).toLocaleDateString("fr-FR") : null} />
          <InfoRow label="Secteur" value={company?.industry as string} />
          <InfoRow label="Siege social" value={company?.address as string} />
          <InfoRow label="Telephone" value={company?.phone as string} mono />
          <InfoRow label="Email" value={company?.email as string} />
          <InfoRow label="Site web" value={company?.website as string} />
          <InfoRow label="Capital" value={company?.capital as string} mono last />
        </div>
      </div>

      {/* Documents grouped by category */}
      {entityDocs.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-blue-500" />
            <span className="font-heading text-[13px] font-semibold text-foreground">Documents</span>
            <span className="font-data text-[10px] text-muted-foreground">{entityDocs.length}</span>
          </div>
          {Object.entries(DOC_CATEGORIES).map(([catKey, cat]) => {
            const catDocs = entityDocs.filter((d) => cat.types.includes(d.type as string));
            if (catDocs.length === 0) return null;
            return (
              <div key={catKey} className="mb-3">
                <span className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  {cat.label}
                </span>
                <div className="space-y-1">
                  {catDocs.map((doc) => (
                    <div key={doc.id as string} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-foreground">{doc.name as string}</span>
                      </div>
                      <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", DOC_STATUS_COLORS[doc.status as string] ?? "bg-muted text-muted-foreground")}>
                        {doc.status as string}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {entityDocs.length === 0 && (
        <div className="rounded-md border border-dashed border-border py-6 text-center">
          <FileText className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
          <p className="text-[11px] text-muted-foreground">Aucun document pour cette societe</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, last }: { label: string; value: string | null | undefined; mono?: boolean; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-2", !last && "border-b border-border/50")}>
      <span className="w-36 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className={cn("text-right text-[12px]", value ? "text-foreground" : "text-muted-foreground", mono && "font-data")}>
        {value ?? "\u2014"}
      </span>
    </div>
  );
}
