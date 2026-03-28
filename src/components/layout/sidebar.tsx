"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Search,
  Zap,
  FileText,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { section: null, items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "CRM", items: [
    { href: "/entities", label: "Entités", icon: Users },
    { href: "/cases", label: "Dossiers", icon: FolderOpen },
    { href: "/documents", label: "Documents", icon: FileText },
  ]},
  { section: "Compliance", items: [
    { href: "/screening", label: "Screening", icon: Search },
    { href: "/risk", label: "Risques", icon: Zap },
    { href: "/reports", label: "Rapports", icon: ClipboardList },
  ]},
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-2 top-2 z-40 flex h-7 w-7 items-center justify-center rounded bg-secondary text-muted-foreground lg:hidden"
      >
        <Menu className="h-3.5 w-3.5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/10" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-150 lg:relative lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-10" : "lg:w-[180px]",
        "w-[200px]",
      )}>
        {/* Logo */}
        <div className="flex h-10 items-center justify-between border-b border-sidebar-border px-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-foreground">
              <span className="font-mono text-[9px] font-bold leading-none text-background">K</span>
            </div>
            {!collapsed && (
              <span className="text-[11px] font-semibold text-foreground">KYC Monaco</span>
            )}
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-muted-foreground lg:hidden">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-1.5 py-2">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && !collapsed && (
                <span className="mb-1 block px-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {group.section}
                </span>
              )}
              <div className="flex flex-col">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex h-7 items-center gap-2 rounded px-1.5 text-[11px] transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={active ? 2 : 1.5} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border px-1.5 py-1.5">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex h-7 items-center gap-2 rounded px-1.5 text-[11px] transition-colors",
              pathname.startsWith("/settings")
                ? "bg-sidebar-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Paramètres</span>}
          </Link>
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="hidden h-7 w-full items-center gap-2 rounded px-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground lg:flex"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <><ChevronLeft className="h-3 w-3" /><span>Réduire</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
