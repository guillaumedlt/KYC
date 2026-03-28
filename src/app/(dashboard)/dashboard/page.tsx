const STATS = [
  { label: "Entités", value: "0", sub: "total" },
  { label: "Dossiers ouverts", value: "0", sub: "en cours" },
  { label: "Risque élevé", value: "0", sub: "à traiter" },
  { label: "Approuvés", value: "0", sub: "ce mois" },
] as const;

const PIPELINE = [
  { label: "En attente", count: 0 },
  { label: "Documents", count: 0 },
  { label: "Screening", count: 0 },
  { label: "Revue", count: 0 },
  { label: "Décision", count: 0 },
] as const;

export default function DashboardPage() {
  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {stat.label}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-data text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="my-8 border-t border-dashed border-border" />

      {/* Pipeline */}
      <div className="mb-8">
        <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Pipeline KYC
        </span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {PIPELINE.map((stage) => (
            <div
              key={stage.label}
              className="flex flex-col items-center gap-2 rounded-lg bg-secondary/50 px-3 py-4"
            >
              <span className="font-data text-lg font-semibold text-foreground">
                {stage.count}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Activité récente
        </span>
        <div className="rounded-lg bg-secondary/30 py-12 text-center">
          <p className="text-[13px] text-muted-foreground">
            Aucune activité pour le moment
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            Les événements apparaîtront ici une fois Supabase connecté
          </p>
        </div>
      </div>
    </div>
  );
}
