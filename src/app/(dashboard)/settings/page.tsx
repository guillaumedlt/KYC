export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Général
        </span>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Organisation
              </p>
              <p className="text-[11px] text-muted-foreground">
                Nom, type et informations du tenant
              </p>
            </div>
            <span className="text-[12px] text-muted-foreground">
              Non configuré
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Utilisateurs
              </p>
              <p className="text-[11px] text-muted-foreground">
                Gérer les membres et les rôles
              </p>
            </div>
            <span className="font-data text-[12px] text-muted-foreground">
              0
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Supabase
              </p>
              <p className="text-[11px] text-muted-foreground">
                Connexion base de données
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
              Déconnecté
            </span>
          </div>
        </div>
      </div>

      <div>
        <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Compliance
        </span>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Politique de vigilance
              </p>
              <p className="text-[11px] text-muted-foreground">
                Seuils et niveaux de risque
              </p>
            </div>
            <span className="text-[12px] text-muted-foreground">Défaut</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Listes de screening
              </p>
              <p className="text-[11px] text-muted-foreground">
                ONU, UE, Monaco, OFAC
              </p>
            </div>
            <span className="font-data text-[12px] text-muted-foreground">
              4 listes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
