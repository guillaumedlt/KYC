"use client";

import { Button } from "@/components/ui/button";
import { FolderOpen, Search, Zap, Upload, Link2 } from "lucide-react";

interface Props { entityId: string; entityName: string; hasOpenCase: boolean }

export function EntityActions({ entityId, entityName, hasOpenCase }: Props) {
  return (
    <div className="flex gap-1">
      {!hasOpenCase && (
        <Button size="sm" className="h-6 rounded px-2 text-[10px]">
          <FolderOpen className="mr-1 h-3 w-3" />KYC
        </Button>
      )}
      <Button variant="outline" size="sm" className="h-6 rounded px-2 text-[10px]">
        <Search className="mr-1 h-3 w-3" />Screen
      </Button>
      <Button variant="outline" size="sm" className="h-6 rounded px-2 text-[10px]">
        <Zap className="mr-1 h-3 w-3" />Risque
      </Button>
      <Button variant="outline" size="sm" className="h-6 rounded px-2 text-[10px]">
        <Upload className="mr-1 h-3 w-3" />Doc
      </Button>
      <Button variant="outline" size="sm" className="h-6 rounded px-2 text-[10px]">
        <Link2 className="mr-1 h-3 w-3" />Lien
      </Button>
    </div>
  );
}
