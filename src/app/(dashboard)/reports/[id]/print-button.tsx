"use client";

import { Printer, Download } from "lucide-react";

export function PrintButton() {
  return (
    <div className="flex gap-1" data-print-hide>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Printer className="h-3 w-3" />
        Imprimer / PDF
      </button>
    </div>
  );
}
