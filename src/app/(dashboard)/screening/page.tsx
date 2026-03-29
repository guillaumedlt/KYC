import Link from "next/link";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { getScreenings } from "@/lib/supabase/queries";
import { ScreeningReviewButtons } from "./review-buttons";
import { ScreeningTable } from "./screening-table";
import { cn } from "@/lib/utils";

export default async function ScreeningPage() {
  const screenings = await getScreenings();
  const matchCount = screenings.filter((s: Record<string, unknown>) => s.match_found).length;
  const pendingReview = screenings.filter((s: Record<string, unknown>) => s.review_decision === "pending").length;

  return (
    <div className="space-y-5">
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
                  {match && <span className="text-[11px] text-red-700">{String((match as Record<string, unknown>).name ?? (match as Record<string, unknown>).title ?? "")}</span>}
                </div>
                <ScreeningReviewButtons screeningId={s.id as string} />
              </div>
            );
          })}
        </div>
      )}

      <ScreeningTable screenings={screenings} />
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
