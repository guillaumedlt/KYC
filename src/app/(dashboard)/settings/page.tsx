export default function SettingsPage() {
  return (
    <div className="max-w-lg space-y-4">
      <Section title="Général">
        <Row label="Organisation" value="Non configuré" />
        <Row label="Utilisateurs" value="0" mono />
        <Row label="Supabase" value="Connecté" tag="fjwzus...kdqi" />
      </Section>
      <Section title="Compliance">
        <Row label="Politique de vigilance" value="Défaut AMSF" />
        <Row label="Listes de screening" value="4 listes" mono tag="UN, EU, MC, OFAC" />
        <Row label="Rétention audit" value="7 ans" mono />
        <Row label="Conservation documents" value="5 ans post-relation" mono />
      </Section>
      <Section title="IA">
        <Row label="Modèle extraction" value="Claude Sonnet 4" />
        <Row label="Modèle screening" value="Claude Opus 4" />
        <Row label="Auto-classification" value="Activé" />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
      <div className="rounded border border-border divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono, tag }: { label: string; value: string; mono?: boolean; tag?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-[11px] text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {tag && <span className="font-data text-[9px] text-muted-foreground">{tag}</span>}
        <span className={`text-[11px] text-muted-foreground ${mono ? "font-data" : ""}`}>{value}</span>
      </div>
    </div>
  );
}
