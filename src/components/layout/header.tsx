"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  compliance_officer: "CO",
  analyst: "Analyste",
  viewer: "Lecteur",
};

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

export function Header({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = "/" + (pathname.split("/")[1] ?? "");
  const title = PAGE_TITLES[base] ?? "";
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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

        {/* User badge */}
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded bg-foreground text-center text-[10px] font-medium leading-6 text-background">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-medium leading-none text-foreground">{userName}</p>
            <p className="text-[9px] leading-none text-muted-foreground">{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Déconnexion"
          className="rounded border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-3 w-3" />
        </button>
      </div>
    </header>
  );
}
