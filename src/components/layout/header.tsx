"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Dashboard", description: "Vue d'ensemble" },
  "/entities": { title: "Entités", description: "Personnes et sociétés" },
  "/cases": { title: "Dossiers", description: "Vérifications KYC" },
  "/screening": { title: "Screening", description: "PEP & Sanctions" },
  "/risk": { title: "Risques", description: "Scoring & évaluation" },
  "/documents": { title: "Documents", description: "Pièces justificatives" },
  "/reports": { title: "Rapports", description: "Exports AMSF" },
  "/settings": { title: "Paramètres", description: "Configuration" },
};

export function Header() {
  const pathname = usePathname();
  const page = PAGE_TITLES[pathname] ?? { title: "", description: "" };

  return (
    <header className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Page title — offset on mobile for hamburger */}
      <div className="flex items-baseline gap-3 pl-10 lg:pl-0">
        <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
          {page.title}
        </h1>
        <span className="hidden text-[12px] text-muted-foreground sm:inline">
          {page.description}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search — hidden on small mobile */}
        <button className="hidden items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground sm:flex">
          <Search className="h-3 w-3" />
          <span>Rechercher</span>
          <kbd className="ml-2 font-mono text-[10px] text-muted-foreground/60">
            ⌘K
          </kbd>
        </button>
        {/* Mobile search icon */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground sm:hidden">
          <Search className="h-3.5 w-3.5" />
        </button>

        <div className="h-7 w-7 rounded-full bg-foreground text-center text-[11px] font-medium leading-7 text-background">
          G
        </div>
      </div>
    </header>
  );
}
