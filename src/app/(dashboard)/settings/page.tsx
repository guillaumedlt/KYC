import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="max-w-lg space-y-3">
      <Section title="Général">
        <Row label="Organisation" value="Non configuré" />
        <Row label="Utilisateurs" value="0" mono />
        <Row label="Supabase" value="Connecté" sub="fjwzus...kdqi" />
      </Section>
      <Section title="Compliance">
        <Row label="Politique de vigilance" value="Défaut AMSF" />
        <Row label="Listes de screening" value="4 listes" sub="UN, EU, MC, OFAC" mono />
        <Row label="Rétention audit" value="7 ans" mono />
        <Row label="Conservation docs" value="5 ans post-relation" mono />
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
      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
      <div className="divide-y divide-border rounded border border-border">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, sub }: { label: string; value: string; mono?: boolean; sub?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5">
      <span className="text-[11px] text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {sub && <span className="font-data text-[9px] text-muted-foreground">{sub}</span>}
        <span className={cn("text-[11px] text-muted-foreground", mono && "font-data")}>{value}</span>
      </div>
    </div>
  );
}
