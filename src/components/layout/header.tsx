"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/entities": "Entités",
  "/cases": "Dossiers",
  "/screening": "Screening",
  "/risk": "Risques",
  "/documents": "Documents",
  "/reports": "Rapports",
  "/settings": "Paramètres",
};

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

export function Header() {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] ?? "");
  const title = PAGE_TITLES[base] ?? "";

  return (
    <header className="flex h-10 items-center justify-between border-b border-border px-3 sm:px-4">
      <div className="flex items-center gap-2 pl-8 lg:pl-0">
        <span className="text-[12px] font-medium text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={triggerCmdK}
          className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <Search className="h-3 w-3" />
          <span className="hidden sm:inline">Rechercher...</span>
          <kbd className="ml-1 font-mono text-[9px] text-muted-foreground/50">⌘K</kbd>
        </button>
        <div className="h-6 w-6 rounded bg-foreground text-center text-[10px] font-medium leading-6 text-background">
          G
        </div>
      </div>
    </header>
  );
}
