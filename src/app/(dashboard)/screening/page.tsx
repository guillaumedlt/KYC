import Link from "next/link";
import { MOCK_SCREENINGS, getEntityById } from "@/lib/mock-data";
import { AlertTriangle, CheckCircle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  pep: "PEP",
  sanctions: "Sanctions",
  adverse_media: "Adverse media",
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
  completed: { icon: CheckCircle, label: "Terminé", className: "text-muted-foreground" },
  processing: { icon: Loader2, label: "En cours", className: "text-blue-600" },
  pending: { icon: Clock, label: "En attente", className: "text-muted-foreground" },
  failed: { icon: AlertTriangle, label: "Erreur", className: "text-red-600" },
};

const matchCount = MOCK_SCREENINGS.filter((s) => s.match_found).length;
const pendingReview = MOCK_SCREENINGS.filter((s) => s.review_decision === "pending").length;

export default function ScreeningPage() {
  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Total</span>
          <span className="font-data text-2xl font-semibold">{MOCK_SCREENINGS.length}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Matches</span>
          <span className="font-data text-2xl font-semibold text-orange-600">{matchCount}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-red-600">Revue requise</span>
          <span className="font-data text-2xl font-semibold text-red-600">{pendingReview}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Clean</span>
          <span className="font-data text-2xl font-semibold text-emerald-600">
            {MOCK_SCREENINGS.filter((s) => s.status === "completed" && !s.match_found).length}
          </span>
        </div>
      </div>

      <div className="my-6 border-t border-dashed border-border" />

      {/* Matches requiring review — top priority */}
      {pendingReview > 0 && (
        <div className="mb-8">
          <span className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-red-600">
            <AlertTriangle className="h-3 w-3" />
            Revue requise ({pendingReview})
          </span>
          <div className="space-y-2">
            {MOCK_SCREENINGS.filter((s) => s.review_decision === "pending").map((screening) => {
              const entity = getEntityById(screening.entity_id);
              const match = screening.matches[0] as Record<string, unknown> | undefined;
              return (
                <div key={screening.id} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/entities/${screening.entity_id}`} className="text-[13px] font-medium text-foreground hover:underline">
                          {entity?.display_name}
                        </Link>
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                          {TYPE_LABELS[screening.screening_type]}
                        </span>
                      </div>
                      {match && (
                        <p className="mt-1 text-[12px] text-red-800">
                          {(match.name as string) ?? (match.title as string) ?? "Match trouvé"}
                          {match.confidence != null && (
                            <span className="ml-2 font-data text-[11px] text-red-600">
                              confiance {String(match.confidence)}%
                            </span>
                          )}
                        </p>
                      )}
                      {match?.list != null && (
                        <p className="mt-0.5 text-[11px] text-red-600">
                          Source : {String(match.list)}
                        </p>
                      )}
                      {match?.source != null && (
                        <p className="mt-0.5 text-[11px] text-red-600">
                          Source : {String(match.source)} — {String(match.date)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-md bg-white px-3 py-1.5 text-[11px] font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100">
                        Faux positif
                      </button>
                      <button className="rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-red-700">
                        Confirmer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All screenings table */}
      <div>
        <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Tous les screenings
        </span>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Entité</th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Type</th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Listes</th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Résultat</th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Revue</th>
                <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SCREENINGS.map((screening) => {
                const entity = getEntityById(screening.entity_id);
                const statusConf = STATUS_CONFIG[screening.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = statusConf.icon;
                return (
                  <tr key={screening.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-2.5">
                      <Link href={`/entities/${screening.entity_id}`} className="text-[13px] font-medium text-foreground hover:underline">
                        {entity?.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">
                        {TYPE_LABELS[screening.screening_type]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-data text-[11px] text-muted-foreground">
                      {screening.lists_checked.length > 0
                        ? screening.lists_checked.map((l) => l.toUpperCase()).join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {screening.status === "processing" ? (
                        <span className="flex items-center gap-1 text-[12px] text-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" /> En cours
                        </span>
                      ) : screening.match_found ? (
                        <span className="flex items-center gap-1 text-[12px] font-medium text-orange-600">
                          <AlertTriangle className="h-3 w-3" /> Match
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[12px] text-emerald-600">
                          <CheckCircle className="h-3 w-3" /> Clean
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[12px]">
                      {screening.review_decision === "confirmed_match" && (
                        <span className="text-red-600">Confirmé</span>
                      )}
                      {screening.review_decision === "false_positive" && (
                        <span className="text-emerald-600">Faux positif</span>
                      )}
                      {screening.review_decision === "pending" && (
                        <span className="font-medium text-red-600">À revoir</span>
                      )}
                      {!screening.review_decision && screening.match_found === false && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-data text-[11px] text-muted-foreground">
                      {new Date(screening.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <span className="font-data text-[11px] text-muted-foreground">{MOCK_SCREENINGS.length} screenings</span>
        </div>
      </div>
    </div>
  );
}
