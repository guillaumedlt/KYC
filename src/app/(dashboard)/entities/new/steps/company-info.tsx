"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardData } from "../wizard";
import { cn } from "@/lib/utils";

const COMPANY_TYPES = [
  { value: "sam", label: "SAM", desc: "Monaco" }, { value: "sarl", label: "SARL", desc: "Monaco / France" },
  { value: "sci", label: "SCI", desc: "Immobilier" }, { value: "sa", label: "SA / SAS", desc: "France" },
  { value: "ltd", label: "Ltd", desc: "UK" }, { value: "llc", label: "LLC", desc: "US" },
  { value: "gmbh", label: "GmbH", desc: "Allemagne / Suisse" }, { value: "other", label: "Autre", desc: "" },
];

const COUNTRIES = [
  { code: "MC", name: "Monaco" }, { code: "FR", name: "France" }, { code: "GB", name: "Royaume-Uni" },
  { code: "US", name: "États-Unis" }, { code: "CH", name: "Suisse" }, { code: "LU", name: "Luxembourg" },
  { code: "IE", name: "Irlande" }, { code: "BVI", name: "Îles Vierges Brit." }, { code: "JE", name: "Jersey" },
  { code: "GG", name: "Guernesey" }, { code: "CY", name: "Chypre" }, { code: "AE", name: "EAU" },
];

export function CompanyInfoStep({ data, update, next, back }: {
  data: WizardData; update: (d: Partial<WizardData>) => void; next: () => void; back: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-[18px] text-foreground">Informations de la société</h2>
        <p className="text-[12px] text-muted-foreground">
          Type de structure et juridiction. L&apos;IA adaptera les documents requis.
        </p>
      </div>

      {/* Company type */}
      <div className="space-y-1.5">
        <Label className="text-[11px]">Forme juridique</Label>
        <div className="grid grid-cols-4 gap-2">
          {COMPANY_TYPES.map((ct) => (
            <button key={ct.value} onClick={() => update({ companyType: ct.value })}
              className={cn("rounded-md border px-3 py-2 text-left transition-all",
                data.companyType === ct.value ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/20")}>
              <p className="text-[12px] font-medium">{ct.label}</p>
              {ct.desc && <p className="text-[9px] opacity-70">{ct.desc}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Jurisdiction */}
      <div className="space-y-1.5">
        <Label className="text-[11px]">Juridiction d&apos;immatriculation</Label>
        <select value={data.jurisdiction} onChange={(e) => update({ jurisdiction: e.target.value })}
          className="h-9 w-full rounded-md border border-border bg-card px-3 text-[12px] focus:border-foreground/30 focus:outline-none">
          <option value="">Sélectionner...</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>

      {/* Company details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-[11px]">Raison sociale</Label>
          <Input value={data.companyName} onChange={(e) => update({ companyName: e.target.value })} placeholder="Monaco Trading SAM" className="h-9 text-[12px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">N° registre</Label>
          <Input value={data.regNumber} onChange={(e) => update({ regNumber: e.target.value })} placeholder="RC 2024B..." className="h-9 font-data text-[12px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Secteur d&apos;activité</Label>
          <Input value={data.industry} onChange={(e) => update({ industry: e.target.value })} placeholder="Trading, Immobilier..." className="h-9 text-[12px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Capital</Label>
          <Input value={data.capital} onChange={(e) => update({ capital: e.target.value })} placeholder="500 000 €" className="h-9 font-data text-[12px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Date d&apos;immatriculation</Label>
          <Input type="date" value={data.incorporationDate} onChange={(e) => update({ incorporationDate: e.target.value })} className="h-9 font-data text-[12px]" />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={back} className="h-8 text-[11px]">Retour</Button>
        <Button size="sm" onClick={next} disabled={!data.companyName || !data.jurisdiction} className="h-8 text-[11px]">Continuer</Button>
      </div>
    </div>
  );
}
