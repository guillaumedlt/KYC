import Link from "next/link";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { getScreenings } from "@/lib/supabase/queries";
import { ScreeningReviewButtons } from "./review-buttons";
import { cn } from "@/lib/utils";

const TYPE_L: Record<string, string> = { pep: "PEP", sanctions: "Sanctions", adverse_media: "Adverse media" };

export default async function ScreeningPage() {
  const screenings = await getScreenings();
  const matchCount = screenings.filter((s: Record<string, unknown>) => s.match_found).length;
  const pendingReview = screenings.filter((s: Record<string, unknown>) => s.review_decision === "pending").length;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={screenings.length} />
        <StatCard label="Matches" value={matchCount} color="text-orange-600" />
        <StatCard label="À revoir" value={pendingReview} color={pendingReview > 0 ? "text-red-600" : undefined} />
        <StatCard label="Clean" value={screenings.filter((s: Record<string, unknown>) => s.status === "completed" && !s.match_found).length} color="text-emerald-600" />
      </div>

      {pendingReview > 0 && (
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-red-600"><AlertTriangle className="h-3 w-3" />Revue requise</span>
          {screenings.filter((s: Record<string, unknown>) => s.review_decision === "pending").map((s: Record<string, unknown>) => {
            const matches = s.matches as Record<string, unknown>[];
            const match = matches?.[0];
            return (
              <div key={s.id as string} className="flex items-center justify-between rounded-md bg-red-50/80 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Link href={`/entities/${s.entity_id}`} className="text-[12px] font-medium text-foreground hover:underline">{(s.entities as Record<string, unknown>)?.display_name as string}</Link>
                  <span className="text-[11px] text-muted-foreground">{TYPE_L[s.screening_type as string]}</span>
                  {match && <span className="text-[11px] text-red-700">{String((match as Record<string, unknown>).name ?? (match as Record<string, unknown>).title ?? "")}</span>}
                </div>
                <ScreeningReviewButtons screeningId={s.id as string} />
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[640px]">
          <thead><tr className="border-b border-border">
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Entité</th>
            <th className="w-20 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Type</th>
            <th className="w-28 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Listes</th>
            <th className="w-16 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Résultat</th>
            <th className="w-20 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Revue</th>
            <th className="w-20 px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Date</th>
          </tr></thead>
          <tbody>
            {screenings.map((s: Record<string, unknown>) => (
              <tr key={s.id as string} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
                <td className="px-4 py-2.5"><Link href={`/entities/${s.entity_id}`} className="text-[12px] font-medium text-foreground hover:underline">{(s.entities as Record<string, unknown>)?.display_name as string}</Link></td>
                <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{TYPE_L[s.screening_type as string]}</td>
                <td className="px-4 py-2.5 font-data text-[11px] text-muted-foreground">{(s.lists_checked as string[])?.map((l: string) => l.toUpperCase()).join(", ") || "—"}</td>
                <td className="px-4 py-2.5">
                  {s.status === "processing" ? <span className="flex items-center gap-1 text-[11px] text-blue-600"><Loader2 className="h-3 w-3 animate-spin" />...</span> :
                   s.match_found ? <span className="flex items-center gap-1 text-[11px] font-medium text-orange-600"><AlertTriangle className="h-3 w-3" />Match</span> :
                   <span className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle className="h-3 w-3" />Clean</span>}
                </td>
                <td className="px-4 py-2.5 text-[11px]">
                  {s.review_decision === "confirmed_match" ? <span className="text-red-600">Confirmé</span> :
                   s.review_decision === "false_positive" ? <span className="text-emerald-600">Faux +</span> :
                   s.review_decision === "pending" ? <span className="font-medium text-red-600">À revoir</span> :
                   <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-2.5 text-right font-data text-[11px] text-muted-foreground">{new Date(s.created_at as string).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
