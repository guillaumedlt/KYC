"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, FolderOpen, Search, Zap,
  FileText, ClipboardList, Settings, ChevronLeft, ChevronRight, Menu, X,
} from "lucide-react";

const NAV = [
  { section: null, items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="fixed left-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-md bg-card text-muted-foreground shadow-sm lg:hidden">
        <Menu className="h-4 w-4" />
      </button>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-foreground/5 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 lg:relative lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-[52px]" : "lg:w-[200px]",
        "w-[220px]",
      )}>
        {/* Logo */}
        <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2.5">
            <span className="font-heading text-[16px] text-foreground">K</span>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-foreground">KYC Monaco</span>
                <span className="text-[9px] tracking-wider text-muted-foreground">CONFORMITE AMSF</span>
              </div>
            )}
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-muted-foreground lg:hidden"><X className="h-4 w-4" /></button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 pt-4">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && !collapsed && (
                <span className="mb-1.5 block px-2 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                  {group.section}
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2.5 rounded-md px-2 text-[11px] transition-all duration-150",
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}>
                      <item.icon className="h-[14px] w-[14px] shrink-0" strokeWidth={active ? 2 : 1.5} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border px-2.5 py-2">
          <Link href="/settings" onClick={() => setMobileOpen(false)}
            className={cn("flex h-8 items-center gap-2.5 rounded-md px-2 text-[11px] transition-all duration-150",
              pathname.startsWith("/settings") ? "bg-foreground text-background" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}>
            <Settings className="h-[14px] w-[14px] shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Parametres</span>}
          </Link>
          <button onClick={() => setCollapsed((p) => !p)}
            className="hidden h-8 w-full items-center gap-2.5 rounded-md px-2 text-[11px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground lg:flex">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <><ChevronLeft className="h-3.5 w-3.5" /><span>Reduire</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
