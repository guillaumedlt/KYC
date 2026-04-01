"use client";

import { User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  entity: Record<string, unknown>;
  documents: Record<string, unknown>[];
  showDocsOnly?: boolean;
}

const PERSON_DOC_CATEGORIES: Record<string, { label: string; types: string[] }> = {
  identity: {
    label: "Pieces d'identite",
    types: ["passport", "national_id", "residence_permit"],
  },
  address: {
    label: "Justificatifs de domicile",
    types: ["proof_of_address"],
  },
  funds: {
    label: "Origine des fonds / patrimoine",
    types: ["source_of_funds", "source_of_wealth", "bank_statement", "tax_return"],
  },
  other: {
    label: "Autres documents",
    types: ["other", "company_registration", "articles_of_association", "shareholder_register", "financial_statement"],
  },
};

const DOC_STATUS_COLORS: Record<string, string> = {
  uploaded: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  extracted: "bg-violet-50 text-violet-700",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export function IdentiteTab({ entity, documents, showDocsOnly }: Props) {
  const person = entity?.entity_people as Record<string, unknown> | null;
  const entityDocs = documents.filter((d) => d.entity_id === entity?.id);

  return (
    <div className="space-y-6">
      {/* Person info (hidden if showDocsOnly) */}
      {!showDocsOnly && person && (
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <User className="h-3 w-3 text-blue-500" />
            <span className="font-heading text-[13px] font-semibold text-foreground">Identite</span>
          </div>
          <div className="rounded-md border border-border">
            <InfoRow label="Prenom" value={person.first_name as string} />
            <InfoRow label="Nom" value={person.last_name as string} />
            <InfoRow label="Date de naissance" value={person.date_of_birth as string} mono />
            <InfoRow label="Nationalite" value={person.nationality as string} />
            <InfoRow label="Residence" value={person.country_of_residence as string} />
            <InfoRow label="Adresse" value={person.address as string} />
            <InfoRow label="Telephone" value={person.phone as string} mono />
            <InfoRow label="Email" value={person.email as string} />
            <InfoRow label="Profession" value={person.profession as string} />
            <InfoRow label="PEP" value={(person.is_pep as boolean) ? "Oui" : "Non"} highlight={person.is_pep as boolean} last />
          </div>
          {!!(person.is_pep as boolean) && !!person.pep_details && (
            <div className="mt-3 rounded-md bg-amber-50 px-4 py-2.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-amber-700">Fonction PEP</span>
              <p className="text-[12px] font-medium text-amber-800">
                {(person.pep_details as Record<string, string>).position}
                {(person.pep_details as Record<string, string>).since && ` - depuis ${(person.pep_details as Record<string, string>).since}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      <div>
        <div className="mb-3 flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-blue-500" />
          <span className="font-heading text-[13px] font-semibold text-foreground">Documents</span>
          <span className="font-data text-[10px] text-muted-foreground">{entityDocs.length}</span>
        </div>
        {entityDocs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-6 text-center">
            <FileText className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
            <p className="text-[11px] text-muted-foreground">Aucun document</p>
          </div>
        ) : (
          Object.entries(PERSON_DOC_CATEGORIES).map(([catKey, cat]) => {
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
          })
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight, last }: { label: string; value: string | null | undefined; mono?: boolean; highlight?: boolean; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-2", !last && "border-b border-border/50")}>
      <span className="w-36 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className={cn(
        "text-right text-[12px]",
        value ? "text-foreground" : "text-muted-foreground",
        mono && "font-data",
        highlight && "font-medium text-amber-700",
      )}>
        {value ?? "\u2014"}
      </span>
    </div>
  );
}
