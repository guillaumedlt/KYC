import Link from "next/link";
import { Upload, CheckCircle, Clock, Sparkles, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS = [
  { id: "d1", entity_id: "e1", entity_name: "Jean-Pierre Moretti", name: "Passeport_Moretti.pdf", type: "passport", status: "verified" as const, verified_by: "ai_agent", confidence: 96, size: 2400000, date: "2026-03-20" },
  { id: "d2", entity_id: "e1", entity_name: "Jean-Pierre Moretti", name: "Justificatif_domicile_MC.pdf", type: "proof_of_address", status: "verified" as const, verified_by: "human", confidence: 88, size: 1800000, date: "2026-03-20" },
  { id: "d3", entity_id: "e3", entity_name: "Monaco Trading SAM", name: "Extrait_RCI_Monaco_Trading.pdf", type: "company_registration", status: "extracted" as const, verified_by: null, confidence: 94, size: 3200000, date: "2026-03-22" },
  { id: "d4", entity_id: "e5", entity_name: "Dmitri Volkov", name: "Passport_Volkov.jpg", type: "passport", status: "processing" as const, verified_by: null, confidence: null, size: 4100000, date: "2026-03-27" },
  { id: "d5", entity_id: "e3", entity_name: "Monaco Trading SAM", name: "Statuts_MonacoTrading.pdf", type: "articles_of_association", status: "uploaded" as const, verified_by: null, confidence: null, size: 5600000, date: "2026-03-28" },
  { id: "d6", entity_id: "e2", entity_name: "Elena Vasquez", name: "CI_Vasquez.pdf", type: "national_id", status: "verified" as const, verified_by: "ai_agent", confidence: 99, size: 1200000, date: "2026-01-05" },
];

const TYPE_L: Record<string, string> = { passport: "Passeport", national_id: "CNI", proof_of_address: "Domicile", company_registration: "RCI", articles_of_association: "Statuts" };
const STATUS: Record<string, { label: string; icon: typeof CheckCircle; cls: string }> = {
  uploaded: { label: "En attente", icon: Clock, cls: "text-muted-foreground" },
  processing: { label: "Extraction...", icon: Sparkles, cls: "text-blue-600" },
  extracted: { label: "À vérifier", icon: FileText, cls: "text-amber-600" },
  verified: { label: "Vérifié", icon: CheckCircle, cls: "text-emerald-600" },
  rejected: { label: "Rejeté", icon: AlertCircle, cls: "text-red-600" },
};

export default function DocumentsPage() {
  return (
    <div>
      <div className="mb-3 flex gap-6 border-b border-border pb-2">
        <Stat label="Total" value={DOCS.length} />
        <Stat label="Vérifiés" value={DOCS.filter((d) => d.status === "verified").length} color="text-emerald-600" />
        <Stat label="En attente" value={DOCS.filter((d) => d.status !== "verified").length} color="text-amber-600" />
      </div>

      {/* Upload */}
      <div className="mb-3 flex cursor-pointer items-center gap-2 rounded border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted/30">
        <Upload className="h-3.5 w-3.5" /> Déposer des documents — extraction IA automatique
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Document</th>
              <th className="w-32 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entité</th>
              <th className="w-20 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="w-20 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Extraction</th>
              <th className="w-24 px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {DOCS.map((d) => {
              const st = STATUS[d.status];
              const StIcon = st.icon;
              return (
                <tr key={d.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-foreground">{d.name}</span>
                      <span className="font-data text-[9px] text-muted-foreground">{(d.size / 1e6).toFixed(1)}M</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <Link href={`/entities/${d.entity_id}`} className="text-[11px] text-foreground hover:underline">{d.entity_name}</Link>
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{TYPE_L[d.type] ?? d.type}</td>
                  <td className="px-2 py-1.5">
                    {d.confidence != null ? (
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-10 rounded-full bg-muted">
                          <div className={cn("h-1 rounded-full", d.confidence >= 90 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${d.confidence}%` }} />
                        </div>
                        <span className="font-data text-[9px] text-muted-foreground">{d.confidence}%</span>
                        {d.verified_by === "ai_agent" && <span className="rounded bg-muted px-0.5 text-[8px] text-muted-foreground">IA</span>}
                      </div>
                    ) : <span className="text-[10px] text-muted-foreground">—</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <span className={cn("inline-flex items-center gap-1 text-[10px]", st.cls)}>
                      <StIcon className={cn("h-3 w-3", d.status === "processing" && "animate-pulse")} />{st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className={cn("font-data text-[18px] font-semibold", color ?? "text-foreground")}>{value}</p>
    </div>
  );
}
