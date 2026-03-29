import Link from "next/link";
import { Upload, CheckCircle, Clock, Sparkles, FileText, AlertCircle } from "lucide-react";
import { getDocuments } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const TL: Record<string, string> = { passport: "Passeport", national_id: "CNI", proof_of_address: "Domicile", company_registration: "RCI", articles_of_association: "Statuts", bank_statement: "Relevé", source_of_funds: "Origine fonds", other: "Autre" };
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

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={docs.length} />
        <StatCard label="Vérifiés" value={verified} color="text-emerald-600" />
        <StatCard label="En attente" value={docs.length - verified} color={docs.length - verified > 0 ? "text-amber-600" : undefined} />
      </div>

      <div className="flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-border bg-card px-4 py-3 text-[12px] text-muted-foreground transition-colors hover:border-foreground/20">
        <Upload className="h-3.5 w-3.5" /> Déposer des documents — extraction IA automatique
      </div>

      {docs.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[640px]">
            <thead><tr className="border-b border-border">
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Document</th>
              <th className="w-32 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Entité</th>
              <th className="w-20 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Type</th>
              <th className="w-24 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Extraction</th>
              <th className="w-24 px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Statut</th>
            </tr></thead>
            <tbody>
              {docs.map((d: Record<string, unknown>) => {
                const st = ST[(d.status as string)] ?? ST.uploaded;
                const StIcon = st.icon;
                const conf = d.extraction_confidence as number | null;
                return (
                  <tr key={d.id as string} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[12px] text-foreground">{d.name as string}</span>
                        {d.file_size != null && <span className="font-data text-[10px] text-muted-foreground">{((d.file_size as number) / 1e6).toFixed(1)}M</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><Link href={`/entities/${d.entity_id}`} className="text-[12px] text-foreground hover:underline">{(d.entities as Record<string, unknown>)?.display_name as string}</Link></td>
                    <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{TL[(d.type as string)] ?? (d.type as string)}</td>
                    <td className="px-4 py-2.5">
                      {conf != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full bg-muted"><div className={cn("h-1.5 rounded-full", conf >= 90 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${conf}%` }} /></div>
                          <span className="font-data text-[10px] text-muted-foreground">{conf}%</span>
                          {d.verified_by === "ai_agent" && <span className="rounded-md bg-muted px-1 py-0.5 text-[8px] text-muted-foreground">IA</span>}
                        </div>
                      ) : <span className="text-[11px] text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right"><span className={cn("inline-flex items-center gap-1 text-[11px]", st.cls)}><StIcon className={cn("h-3 w-3", d.status === "processing" && "animate-pulse")} />{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card py-12 text-center">
          <p className="text-[12px] text-muted-foreground">Aucun document</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-data text-[24px] font-semibold leading-none", color ?? "text-foreground")}>{value}</p>
    </div>
  );
}
