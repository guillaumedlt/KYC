export default function ReportsPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">
          Tous
        </button>
        <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          KYC complet
        </button>
        <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          Export AMSF
        </button>
      </div>

      <div className="rounded-lg bg-secondary/30 py-12 text-center">
        <p className="text-[13px] text-muted-foreground">Aucun rapport</p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          Les rapports seront générés à partir des dossiers KYC
        </p>
      </div>
    </div>
  );
}
