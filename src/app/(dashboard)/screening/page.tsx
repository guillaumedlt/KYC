import Link from "next/link";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { getScreenings } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const TYPE_L: Record<string, string> = { pep: "PEP", sanctions: "Sanctions", adverse_media: "Adverse media" };

export default async function ScreeningPage() {
  const screenings = await getScreenings();
  const matchCount = screenings.filter((s: Record<string, unknown>) => s.match_found).length;
  const pendingReview = screenings.filter((s: Record<string, unknown>) => s.review_decision === "pending").length;

  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b border-border pb-2">
        <Stat label="Total" value={screenings.length} />
        <Stat label="Matches" value={matchCount} color="text-orange-600" />
        <Stat label="À revoir" value={pendingReview} color={pendingReview > 0 ? "text-red-600" : undefined} />
        <Stat label="Clean" value={screenings.filter((s: Record<string, unknown>) => s.status === "completed" && !s.match_found).length} color="text-emerald-600" />
      </div>

      {pendingReview > 0 && (
        <div className="space-y-1">
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-red-600"><AlertTriangle className="h-3 w-3" />Revue requise</span>
          {screenings.filter((s: Record<string, unknown>) => s.review_decision === "pending").map((s: Record<string, unknown>) => {
            const matches = s.matches as Record<string, unknown>[];
            const match = matches?.[0];
            return (
              <div key={s.id as string} className="flex items-center justify-between rounded bg-red-50 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Link href={`/entities/${s.entity_id}`} className="text-[11px] font-medium text-foreground hover:underline">
                    {(s.entities as Record<string, unknown>)?.display_name as string}
                  </Link>
                  <span className="text-[10px] text-muted-foreground">{TYPE_L[s.screening_type as string]}</span>
                  {match && <span className="text-[10px] text-red-700">{String((match as Record<string, unknown>).name ?? (match as Record<string, unknown>).title ?? "")}</span>}
                </div>
                <div className="flex gap-1">
                  <button className="rounded bg-white px-2 py-0.5 text-[10px] text-red-700 hover:bg-red-100">Faux positif</button>
                  <button className="rounded bg-red-600 px-2 py-0.5 text-[10px] text-white hover:bg-red-700">Confirmer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[640px]">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Entité</th>
            <th className="w-20 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</th>
            <th className="w-28 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Listes</th>
            <th className="w-16 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Résultat</th>
            <th className="w-20 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Revue</th>
            <th className="w-20 px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Date</th>
          </tr></thead>
          <tbody>
            {screenings.map((s: Record<string, unknown>) => (
              <tr key={s.id as string} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="px-2 py-1.5"><Link href={`/entities/${s.entity_id}`} className="text-[11px] font-medium text-foreground hover:underline">{(s.entities as Record<string, unknown>)?.display_name as string}</Link></td>
                <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{TYPE_L[s.screening_type as string]}</td>
                <td className="px-2 py-1.5 font-data text-[10px] text-muted-foreground">{(s.lists_checked as string[])?.map((l: string) => l.toUpperCase()).join(", ") || "—"}</td>
                <td className="px-2 py-1.5">
                  {s.status === "processing" ? <span className="flex items-center gap-1 text-[10px] text-blue-600"><Loader2 className="h-3 w-3 animate-spin" />...</span> :
                   s.match_found ? <span className="flex items-center gap-1 text-[10px] font-medium text-orange-600"><AlertTriangle className="h-3 w-3" />Match</span> :
                   <span className="flex items-center gap-1 text-[10px] text-emerald-600"><CheckCircle className="h-3 w-3" />Clean</span>}
                </td>
                <td className="px-2 py-1.5 text-[10px]">
                  {s.review_decision === "confirmed_match" ? <span className="text-red-600">Confirmé</span> :
                   s.review_decision === "false_positive" ? <span className="text-emerald-600">Faux +</span> :
                   s.review_decision === "pending" ? <span className="font-medium text-red-600">À revoir</span> :
                   <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-2 py-1.5 text-right font-data text-[10px] text-muted-foreground">{new Date(s.created_at as string).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div><span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span><p className={cn("font-data text-[18px] font-semibold", color ?? "text-foreground")}>{value}</p></div>;
}
