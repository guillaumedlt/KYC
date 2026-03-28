import Link from "next/link";
import { Upload, CheckCircle, Clock, Sparkles, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock documents
const MOCK_DOCUMENTS = [
  {
    id: "d1", entity_id: "e1", entity_name: "Jean-Pierre Moretti",
    name: "Passeport_Moretti.pdf", type: "passport",
    status: "verified" as const, verified_by: "ai_agent" as const,
    extraction_confidence: 96, file_size: 2400000,
    created_at: "2026-03-20T10:15:00Z",
  },
  {
    id: "d2", entity_id: "e1", entity_name: "Jean-Pierre Moretti",
    name: "Justificatif_domicile_MC.pdf", type: "proof_of_address",
    status: "verified" as const, verified_by: "human_reviewer" as const,
    extraction_confidence: 88, file_size: 1800000,
    created_at: "2026-03-20T10:20:00Z",
  },
  {
    id: "d3", entity_id: "e3", entity_name: "Monaco Trading SAM",
    name: "Extrait_RCI_Monaco_Trading.pdf", type: "company_registration",
    status: "extracted" as const, verified_by: null,
    extraction_confidence: 94, file_size: 3200000,
    created_at: "2026-03-22T11:30:00Z",
  },
  {
    id: "d4", entity_id: "e5", entity_name: "Dmitri Volkov",
    name: "Passport_Volkov.jpg", type: "passport",
    status: "processing" as const, verified_by: null,
    extraction_confidence: null, file_size: 4100000,
    created_at: "2026-03-27T09:00:00Z",
  },
  {
    id: "d5", entity_id: "e3", entity_name: "Monaco Trading SAM",
    name: "Statuts_MonacoTrading.pdf", type: "articles_of_association",
    status: "uploaded" as const, verified_by: null,
    extraction_confidence: null, file_size: 5600000,
    created_at: "2026-03-28T08:00:00Z",
  },
  {
    id: "d6", entity_id: "e2", entity_name: "Elena Vasquez",
    name: "CI_Vasquez.pdf", type: "national_id",
    status: "verified" as const, verified_by: "ai_agent" as const,
    extraction_confidence: 99, file_size: 1200000,
    created_at: "2026-01-05T08:30:00Z",
  },
];

const TYPE_LABELS: Record<string, string> = {
  passport: "Passeport",
  national_id: "Carte d'identité",
  proof_of_address: "Justificatif domicile",
  company_registration: "Extrait RCI",
  articles_of_association: "Statuts",
  bank_statement: "Relevé bancaire",
  source_of_funds: "Origine des fonds",
};

const STATUS_CONFIG = {
  uploaded: { label: "En attente", icon: Clock, className: "text-muted-foreground" },
  processing: { label: "Extraction IA...", icon: Sparkles, className: "text-blue-600" },
  extracted: { label: "Extrait — à vérifier", icon: FileText, className: "text-amber-600" },
  verified: { label: "Vérifié", icon: CheckCircle, className: "text-emerald-600" },
  rejected: { label: "Rejeté", icon: AlertCircle, className: "text-red-600" },
};

const pendingCount = MOCK_DOCUMENTS.filter((d) => d.status !== "verified").length;

export default function DocumentsPage() {
  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Total</span>
          <span className="font-data text-2xl font-semibold">{MOCK_DOCUMENTS.length}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Vérifiés</span>
          <span className="font-data text-2xl font-semibold text-emerald-600">
            {MOCK_DOCUMENTS.filter((d) => d.status === "verified").length}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-amber-600">En attente</span>
          <span className="font-data text-2xl font-semibold text-amber-600">{pendingCount}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Taux IA</span>
          <span className="font-data text-2xl font-semibold">
            {Math.round(MOCK_DOCUMENTS.filter((d) => d.verified_by === "ai_agent").length / MOCK_DOCUMENTS.filter((d) => d.status === "verified").length * 100)}%
          </span>
        </div>
      </div>

      <div className="my-6 border-t border-dashed border-border" />

      {/* Upload zone */}
      <div className="mb-6 flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border px-4 py-4 transition-colors hover:border-foreground/20 hover:bg-secondary/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-foreground">Déposer des documents</p>
          <p className="text-[11px] text-muted-foreground">
            L&apos;IA extraira et classifiera automatiquement
          </p>
        </div>
      </div>

      {/* Documents table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Document</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Entité</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Type</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Extraction</th>
              <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DOCUMENTS.map((doc) => {
              const statusConf = STATUS_CONFIG[doc.status];
              const StatusIcon = statusConf.icon;
              return (
                <tr key={doc.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[13px] text-foreground">{doc.name}</span>
                      <span className="font-data text-[10px] text-muted-foreground">
                        {(doc.file_size / 1000000).toFixed(1)} Mo
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/entities/${doc.entity_id}`} className="text-[13px] text-foreground hover:underline">
                      {doc.entity_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-foreground">
                    {TYPE_LABELS[doc.type] ?? doc.type}
                  </td>
                  <td className="px-4 py-2.5">
                    {doc.extraction_confidence != null ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-12 rounded-full bg-secondary">
                          <div
                            className={cn(
                              "h-1 rounded-full",
                              doc.extraction_confidence >= 90 ? "bg-emerald-500" : doc.extraction_confidence >= 70 ? "bg-amber-500" : "bg-red-500",
                            )}
                            style={{ width: `${doc.extraction_confidence}%` }}
                          />
                        </div>
                        <span className="font-data text-[11px] text-muted-foreground">
                          {doc.extraction_confidence}%
                        </span>
                        {doc.verified_by === "ai_agent" && (
                          <span className="rounded bg-secondary px-1 py-px text-[9px] text-muted-foreground">IA</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", statusConf.className)}>
                      <StatusIcon className={cn("h-3 w-3", doc.status === "processing" && "animate-pulse")} />
                      {statusConf.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <span className="font-data text-[11px] text-muted-foreground">{MOCK_DOCUMENTS.length} documents</span>
      </div>
    </div>
  );
}
