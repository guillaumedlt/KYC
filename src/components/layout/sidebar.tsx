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
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/entities", label: "Entités", icon: Users },
      { href: "/cases", label: "Dossiers", icon: FolderOpen },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/screening", label: "Screening", icon: Search },
      { href: "/risk", label: "Risques", icon: Zap },
      { href: "/reports", label: "Rapports", icon: ClipboardList },
    ],
  },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3.5 z-40 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Mobile: fixed overlay
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-transform duration-200 ease-out lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: collapsible width
          collapsed ? "lg:w-[52px]" : "lg:w-[232px]",
          // Always full width on mobile when open
          "w-[260px]",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground">
              <span className="font-mono text-[11px] font-bold leading-none text-background">
                K
              </span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold leading-none text-foreground">
                  KYC Monaco
                </span>
                <span className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                  kyc.mc
                </span>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 pt-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <span className="mb-1.5 block px-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {section.label}
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] transition-all duration-150",
                        isActive
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className="h-[15px] w-[15px] shrink-0"
                        strokeWidth={isActive ? 2 : 1.5}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col gap-0.5 px-2.5 pb-3">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] transition-all duration-150",
              pathname.startsWith("/settings")
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Settings className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Paramètres</span>}
          </Link>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground lg:flex"
          >
            {collapsed ? (
              <ChevronsRight className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
            ) : (
              <>
                <ChevronsLeft className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
                <span>Réduire</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
