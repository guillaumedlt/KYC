"use client";

import { User, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

export function CompanyUboStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  const ubos = data.ubos;
  const allCompleted = ubos.length > 0 && ubos.every((u) => u.completed);

  function markCompleted(index: number) {
    const updated = [...ubos];
    updated[index] = { ...updated[index], completed: true };
    update({ ubos: updated });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Bénéficiaires effectifs (UBO)</h2>
        <p className="text-[12px] text-muted-foreground">
          L&apos;IA a identifié {ubos.length} UBO à partir de l&apos;actionnariat. Chaque UBO doit compléter le parcours personne physique.
        </p>
      </div>

      {ubos.length === 0 ? (
        <div className="rounded-md border border-border bg-card px-5 py-8 text-center">
          <p className="text-[12px] text-muted-foreground">Aucun UBO détecté</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Uploadez le registre des actionnaires à l&apos;étape précédente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ubos.map((ubo, i) => (
            <div key={i} className={cn(
              "flex items-center justify-between rounded-md border px-4 py-3 transition-all",
              ubo.completed ? "border-emerald-200 bg-emerald-50/30" : "border-border bg-card",
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md",
                  ubo.completed ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-600",
                )}>
                  {ubo.completed ? <CheckCircle className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-[12px] font-medium text-foreground">{ubo.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-data">{ubo.percentage}%</span>
                    <span>·</span>
                    <span>{ubo.completed ? "Vérifié" : "Vérification requise"}</span>
                  </div>
                </div>
              </div>

              {ubo.completed ? (
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">Complété</span>
              ) : (
                <Button size="sm" onClick={() => markCompleted(i)} className="h-7 rounded-md px-3 text-[11px]">
                  Vérifier <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Threshold info */}
      <div className="rounded-md bg-blue-50/80 px-4 py-2.5 text-[11px] text-blue-700">
        Seuil UBO : <strong>&gt;25%</strong> de détention directe ou indirecte (configurable par juridiction).
        Si une holding détient des parts, l&apos;IA remonte récursivement jusqu&apos;au bénéficiaire effectif ultime.
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={ubos.length > 0 && !allCompleted} className="h-8 text-[11px]">Continuer</Button>
      </div>
    </div>
  );
}
