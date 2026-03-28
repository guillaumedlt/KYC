export default function ScreeningPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">
          Tous
        </button>
        <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          PEP
        </button>
        <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          Sanctions
        </button>
        <button className="rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          Adverse media
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Entité</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Type</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Listes</th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Résultat</th>
              <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="py-16 text-center">
                <p className="text-[13px] text-muted-foreground">Aucun screening</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <span className="font-data text-[11px] text-muted-foreground">0 screenings</span>
      </div>
    </div>
  );
}
