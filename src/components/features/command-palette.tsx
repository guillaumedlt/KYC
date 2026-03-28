"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Search,
  Zap,
  FileText,
  ClipboardList,
  Settings,
  Plus,
  Sparkles,
  ArrowRight,
  User,
  Building2,
} from "lucide-react";
import { MOCK_ENTITIES, MOCK_CASES } from "@/lib/mock-data";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une entité, un dossier, une action..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        {/* Quick actions */}
        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => go("/entities?create=ai")}>
            <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Nouvelle entité (extraction IA)</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/entities?create=manual")}>
            <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Nouvelle entité (manuelle)</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/screening")}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Lancer un screening PEP/Sanctions</span>
          </CommandItem>
        </CommandGroup>

        {/* Entities */}
        <CommandGroup heading="Entités">
          {MOCK_ENTITIES.map((entity) => (
            <CommandItem
              key={entity.id}
              onSelect={() => go(`/entities/${entity.id}`)}
            >
              {entity.type === "person" ? (
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
              ) : (
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              <span>{entity.display_name}</span>
              {entity.risk_level === "high" || entity.risk_level === "critical" ? (
                <span className="ml-auto rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
                  {entity.risk_score}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Cases */}
        <CommandGroup heading="Dossiers KYC">
          {MOCK_CASES.map((kycCase) => {
            const entity = MOCK_ENTITIES.find((e) => e.id === kycCase.entity_id);
            return (
              <CommandItem
                key={kycCase.id}
                onSelect={() => go(`/cases`)}
              >
                <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-data">{kycCase.case_number}</span>
                <span className="ml-2 text-muted-foreground">
                  {entity?.display_name}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/entities")}>
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            Entités
          </CommandItem>
          <CommandItem onSelect={() => go("/cases")}>
            <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
            Dossiers KYC
          </CommandItem>
          <CommandItem onSelect={() => go("/screening")}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            Screening
          </CommandItem>
          <CommandItem onSelect={() => go("/risk")}>
            <Zap className="mr-2 h-4 w-4 text-muted-foreground" />
            Risques
          </CommandItem>
          <CommandItem onSelect={() => go("/documents")}>
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            Documents
          </CommandItem>
          <CommandItem onSelect={() => go("/reports")}>
            <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
            Rapports
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            Paramètres
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
