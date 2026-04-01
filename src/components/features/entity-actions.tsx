"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FolderOpen, Search, Zap, Upload, Link2, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface Props {
  entityId: string;
  entityName: string;
  entityType: string;
  nationality: string | null;
  dateOfBirth: string | null;
  hasOpenCase: boolean;
}

export function EntityActions({ entityId, entityName, entityType, nationality, dateOfBirth, hasOpenCase }: Props) {
  const [screening, setScreening] = useState(false);
  const [screenResult, setScreenResult] = useState<"idle" | "success" | "match" | "error">("idle");
  const router = useRouter();

  async function runScreening() {
    setScreening(true);
    setScreenResult("idle");

    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId,
          name: entityName,
          type: entityType === "person" ? "person" : "company",
          nationality,
          dateOfBirth,
          jurisdiction: entityType !== "person" ? nationality : undefined,
          screeningType: "all",
        }),
      });

      if (!res.ok) throw new Error("Screening failed");
      const result = await res.json();

      if (result.pep?.match || result.sanctions?.match || result.adverseMedia?.match) {
        setScreenResult("match");
      } else {
        setScreenResult("success");
      }

      // Refresh the page to show new screening results
      router.refresh();
    } catch {
      setScreenResult("error");
    } finally {
      setScreening(false);
    }
  }

  return (
    <div className="flex gap-1">
      {!hasOpenCase && (
        <Button size="sm" className="h-6 rounded px-2 text-[10px]">
          <FolderOpen className="mr-1 h-3 w-3" />KYC
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="h-6 rounded px-2 text-[10px]"
        onClick={runScreening}
        disabled={screening}
      >
        {screening ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : screenResult === "success" ? (
          <CheckCircle className="mr-1 h-3 w-3 text-emerald-500" />
        ) : screenResult === "match" ? (
          <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />
        ) : (
          <Search className="mr-1 h-3 w-3" />
        )}
        {screening ? "Screening..." : screenResult === "success" ? "Clean" : screenResult === "match" ? "Match !" : "Screening"}
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
