import Link from "next/link";
import { Upload, CheckCircle, Clock, Sparkles, FileText, AlertCircle } from "lucide-react";
import { getDocuments } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const TL: Record<string, string> = {
  passport: "Passeport", national_id: "CNI", proof_of_address: "Domicile",
  company_registration: "RCI", articles_of_association: "Statuts",
  bank_statement: "Relevé", source_of_funds: "Origine fonds", other: "Autre",
};

const ST: Record<string, { label: string; icon: typeof CheckCircle; cls: string }> = {
  uploaded: { label: "En attente", icon: Clock, cls: "text-muted-foreground" },
  processing: { label: "Extraction...", icon: Sparkles, cls: "text-blue-600" },
  extracted: { label: "À vérifier", icon: FileText, cls: "text-amber-600" },
  verified: { label: "Vérifié", icon: CheckCircle, cls: "text-emerald-600" },
  rejected: { label: "Rejeté", icon: AlertCircle, cls: "text-red-600" },
};

export default async function DocumentsPage() {
  const docs = await getDocuments();
  const verified = docs.filter((d: Record<string, unknown>) => d.status === "verified").length;
  const pending = docs.length - verified;

  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b border-border pb-2">
        <Stat label="Total" value={docs.length} />
        <Stat label="Vérifiés" value={verified} color="text-emerald-600" />
        <Stat label="En attente" value={pending} color={pending > 0 ? "text-amber-600" : undefined} />
      </div>

      <div className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:border-foreground/20 hover:bg-muted/30">
        <Upload className="h-3 w-3" /> Déposer des documents — extraction IA automatique
      </div>

      {docs.length > 0 ? (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full min-w-[640px]">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Document</th>
              <th className="w-32 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entité</th>
              <th className="w-20 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Extraction</th>
              <th className="w-24 px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Statut</th>
            </tr></thead>
            <tbody>
              {docs.map((d: Record<string, unknown>) => {
                const st = ST[(d.status as string)] ?? ST.uploaded;
                const StIcon = st.icon;
                const conf = d.extraction_confidence as number | null;
                return (
                  <tr key={d.id as string} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-foreground">{d.name as string}</span>
                        {d.file_size != null && <span className="font-data text-[9px] text-muted-foreground">{((d.file_size as number) / 1e6).toFixed(1)}M</span>}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <Link href={`/entities/${d.entity_id}`} className="text-[11px] text-foreground hover:underline">
                        {(d.entities as Record<string, unknown>)?.display_name as string}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{TL[(d.type as string)] ?? (d.type as string)}</td>
                    <td className="px-2 py-1.5">
                      {conf != null ? (
                        <div className="flex items-center gap-1">
                          <div className="h-1 w-10 rounded-full bg-muted">
                            <div className={cn("h-1 rounded-full", conf >= 90 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${conf}%` }} />
                          </div>
                          <span className="font-data text-[9px] text-muted-foreground">{conf}%</span>
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
      ) : (
        <div className="rounded border border-border py-12 text-center">
          <p className="text-[11px] text-muted-foreground">Aucun document</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div><span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span><p className={cn("font-data text-[18px] font-semibold", color ?? "text-foreground")}>{value}</p></div>;
}
