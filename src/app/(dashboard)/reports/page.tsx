import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const REPORTS = [
  { id: "r1", type: "kyc_complete", entity: "Elena Vasquez", case_num: "KYC-2026-0003", date: "2026-01-10" },
  { id: "r2", type: "amsf_export", entity: null, case_num: null, date: "2026-03-01" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b border-border pb-2">
        <div><span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Rapports</span><p className="font-data text-[18px] font-semibold">{REPORTS.length}</p></div>
      </div>

      <div className="flex items-center gap-1">
        <button className="rounded bg-foreground px-2 py-0.5 text-[10px] text-background">Tous</button>
        <button className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted">KYC complet</button>
        <button className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted">Export AMSF</button>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rapport</th>
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entité / Dossier</th>
            <th className="w-24 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Date</th>
            <th className="w-10 px-2 py-1.5" />
          </tr></thead>
          <tbody>
            {REPORTS.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="px-2 py-1.5"><div className="flex items-center gap-1.5"><FileText className="h-3 w-3 text-muted-foreground" /><span className="text-[11px] font-medium text-foreground">{r.type === "kyc_complete" ? "Rapport KYC complet" : "Export AMSF"}</span></div></td>
                <td className="px-2 py-1.5 text-[11px] text-muted-foreground">{r.entity ?? "—"}{r.case_num && <span className="ml-1 font-data">({r.case_num})</span>}</td>
                <td className="px-2 py-1.5 font-data text-[10px] text-muted-foreground">{new Date(r.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-2 py-1.5 text-right"><button className="rounded border border-border p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Download className="h-3 w-3" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
