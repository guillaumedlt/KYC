import { MOCK_ENTITIES, MOCK_CASES, MOCK_ACTIVITIES } from "@/lib/mock-data";
import { KycStatusBadge } from "@/components/features/status-badge";

const stats = [
  { label: "Entités", value: MOCK_ENTITIES.length.toString(), sub: "total" },
  {
    label: "Dossiers ouverts",
    value: MOCK_CASES.filter((c) => !["approved", "rejected", "closed"].includes(c.status)).length.toString(),
    sub: "en cours",
  },
  {
    label: "Risque élevé",
    value: MOCK_ENTITIES.filter((e) => e.risk_level === "high" || e.risk_level === "critical").length.toString(),
    sub: "à traiter",
  },
  {
    label: "Approuvés",
    value: MOCK_CASES.filter((c) => c.status === "approved").length.toString(),
    sub: "ce mois",
  },
];

const PIPELINE_STATUSES = [
  { label: "En attente", statuses: ["open"] },
  { label: "Documents", statuses: ["documents_pending"] },
  { label: "Screening", statuses: ["screening"] },
  { label: "Revue", statuses: ["risk_review", "pending_decision"] },
  { label: "Terminé", statuses: ["approved", "rejected", "closed"] },
] as const;

export default function DashboardPage() {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {stat.label}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-data text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </span>
              <span className="text-[11px] text-muted-foreground">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="my-8 border-t border-dashed border-border" />

      {/* Pipeline */}
      <div className="mb-8">
        <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Pipeline KYC
        </span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {PIPELINE_STATUSES.map((stage) => {
            const count = MOCK_CASES.filter((c) =>
              (stage.statuses as readonly string[]).includes(c.status),
            ).length;
            return (
              <div key={stage.label} className="flex flex-col items-center gap-2 rounded-lg bg-secondary/50 px-3 py-4">
                <span className="font-data text-lg font-semibold text-foreground">{count}</span>
                <span className="text-[11px] text-muted-foreground">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Activité récente
        </span>
        <div className="space-y-0">
          {MOCK_ACTIVITIES.map((activity, i) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 border-b border-border/50 px-1 py-3 last:border-0"
            >
              <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              <div className="flex-1">
                <p className="text-[13px] text-foreground">{activity.title}</p>
                {activity.description && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {activity.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 font-data text-[11px] text-muted-foreground">
                {new Date(activity.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
