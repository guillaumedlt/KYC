"use client";

import { User, Building2, Landmark } from "lucide-react";
import type { WizardData, EntityKind } from "../wizard";
import { cn } from "@/lib/utils";

const CHOICES: { kind: EntityKind; icon: typeof User; title: string; desc: string }[] = [
  { kind: "person", icon: User, title: "Personne physique", desc: "Client individuel — passeport, justificatif, source des fonds" },
  { kind: "company", icon: Building2, title: "Société / Personne morale", desc: "SAM, SCI, SAS, LLC — statuts, actionnariat, UBO" },
  { kind: "structure", icon: Landmark, title: "Trust / Fondation / Structure complexe", desc: "Parcours renforcé — identification de toute la chaîne" },
];

export function TypeStep({
  data, update, next,
}: {
  data: WizardData;
  update: (d: Partial<WizardData>) => void;
  next: () => void;
}) {
  function select(kind: EntityKind) {
    update({ kind });
    next();
  }

  return (
    <div>
      <h2 className="mb-2 font-heading text-[18px] text-foreground">Vous êtes ?</h2>
      <p className="mb-6 text-[12px] text-muted-foreground">
        Ce choix détermine les documents requis et le parcours de vérification.
      </p>

      <div className="space-y-3">
        {CHOICES.map((c) => (
          <button
            key={c.kind}
            onClick={() => select(c.kind)}
            className={cn(
              "flex w-full items-center gap-4 rounded-md border border-border bg-card px-5 py-4 text-left transition-all hover:border-foreground/20 hover:bg-muted/20",
              data.kind === c.kind && "border-foreground bg-muted/20",
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
              c.kind === "person" ? "bg-blue-50 text-blue-600" :
              c.kind === "company" ? "bg-violet-50 text-violet-600" :
              "bg-amber-50 text-amber-600",
            )}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">{c.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{c.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
