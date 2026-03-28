"use client";

import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Search,
  Zap,
  Upload,
  Link2,
  MoreHorizontal,
} from "lucide-react";

interface EntityActionsProps {
  entityId: string;
  entityName: string;
  hasOpenCase: boolean;
}

export function EntityActions({
  entityId,
  entityName,
  hasOpenCase,
}: EntityActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {!hasOpenCase && (
        <Button
          size="sm"
          className="h-7 rounded-full px-3 text-[12px]"
          onClick={() => {
            // TODO: Server action → create KYC case
          }}
        >
          <FolderOpen className="mr-1.5 h-3 w-3" />
          Ouvrir un dossier KYC
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-7 rounded-full px-3 text-[12px]"
        onClick={() => {
          // TODO: Trigger screening
        }}
      >
        <Search className="mr-1.5 h-3 w-3" />
        Screening
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-7 rounded-full px-3 text-[12px]"
        onClick={() => {
          // TODO: Trigger risk computation
        }}
      >
        <Zap className="mr-1.5 h-3 w-3" />
        Évaluer le risque
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-7 rounded-full px-3 text-[12px]"
        onClick={() => {
          // TODO: Open document upload
        }}
      >
        <Upload className="mr-1.5 h-3 w-3" />
        Document
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-7 rounded-full px-3 text-[12px]"
        onClick={() => {
          // TODO: Add relation
        }}
      >
        <Link2 className="mr-1.5 h-3 w-3" />
        Relation
      </Button>
    </div>
  );
}
