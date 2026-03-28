import Link from "next/link";
import { Upload, CheckCircle, Clock, Sparkles, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS = [
  { id: "d1", eid: "e1", en: "Jean-Pierre Moretti", name: "Passeport_Moretti.pdf", type: "passport", status: "verified" as const, vb: "ai_agent", conf: 96, size: 2.4 },
  { id: "d2", eid: "e1", en: "Jean-Pierre Moretti", name: "Justificatif_domicile_MC.pdf", type: "proof_of_address", status: "verified" as const, vb: "human", conf: 88, size: 1.8 },
  { id: "d3", eid: "e3", en: "Monaco Trading SAM", name: "Extrait_RCI_Monaco_Trading.pdf", type: "company_registration", status: "extracted" as const, vb: null, conf: 94, size: 3.2 },
  { id: "d4", eid: "e5", en: "Dmitri Volkov", name: "Passport_Volkov.jpg", type: "passport", status: "processing" as const, vb: null, conf: null, size: 4.1 },
  { id: "d5", eid: "e3", en: "Monaco Trading SAM", name: "Statuts_MonacoTrading.pdf", type: "articles_of_association", status: "uploaded" as const, vb: null, conf: null, size: 5.6 },
  { id: "d6", eid: "e2", en: "Elena Vasquez", name: "CI_Vasquez.pdf", type: "national_id", status: "verified" as const, vb: "ai_agent", conf: 99, size: 1.2 },
];

const TL: Record<string, string> = { passport: "Passeport", national_id: "CNI", proof_of_address: "Domicile", company_registration: "RCI", articles_of_association: "Statuts" };
const ST: Record<string, { label: string; icon: typeof CheckCircle; cls: string }> = {
  uploaded: { label: "En attente", icon: Clock, cls: "text-muted-foreground" },
  processing: { label: "Extraction...", icon: Sparkles, cls: "text-blue-600" },
  extracted: { label: "À vérifier", icon: FileText, cls: "text-amber-600" },
  verified: { label: "Vérifié", icon: CheckCircle, cls: "text-emerald-600" },
  rejected: { label: "Rejeté", icon: AlertCircle, cls: "text-red-600" },
};

export default function DocumentsPage() {
  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b border-border pb-2">
        <Stat label="Total" value={DOCS.length} />
        <Stat label="Vérifiés" value={DOCS.filter((d) => d.status === "verified").length} color="text-emerald-600" />
        <Stat label="En attente" value={DOCS.filter((d) => d.status !== "verified").length} color="text-amber-600" />
      </div>

      <div className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:border-foreground/20 hover:bg-muted/30">
        <Upload className="h-3 w-3" /> Déposer des documents — extraction IA automatique
      </div>

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
            {DOCS.map((d) => {
              const st = ST[d.status]; const I = st.icon;
              return (
                <tr key={d.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-1.5"><div className="flex items-center gap-1.5"><FileText className="h-3 w-3 text-muted-foreground" /><span className="text-[11px] text-foreground">{d.name}</span><span className="font-data text-[9px] text-muted-foreground">{d.size}M</span></div></td>
                  <td className="px-2 py-1.5"><Link href={`/entities/${d.eid}`} className="text-[11px] text-foreground hover:underline">{d.en}</Link></td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{TL[d.type] ?? d.type}</td>
                  <td className="px-2 py-1.5">{d.conf != null ? (
                    <div className="flex items-center gap-1"><div className="h-1 w-10 rounded-full bg-muted"><div className={cn("h-1 rounded-full", d.conf >= 90 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${d.conf}%` }} /></div><span className="font-data text-[9px] text-muted-foreground">{d.conf}%</span>{d.vb === "ai_agent" && <span className="rounded bg-muted px-0.5 text-[8px] text-muted-foreground">IA</span>}</div>
                  ) : <span className="text-[10px] text-muted-foreground">—</span>}</td>
                  <td className="px-2 py-1.5 text-right"><span className={cn("inline-flex items-center gap-1 text-[10px]", st.cls)}><I className={cn("h-3 w-3", d.status === "processing" && "animate-pulse")} />{st.label}</span></td>
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
  return <div><span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span><p className={cn("font-data text-[18px] font-semibold", color ?? "text-foreground")}>{value}</p></div>;
}
