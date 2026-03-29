"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { submitDecision } from "@/app/actions/cases";

export function DecisionForm({ caseId }: { caseId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDecision(decision: string) {
    const justification = (document.getElementById("justification") as HTMLTextAreaElement)?.value;
    if (!justification || justification.length < 10) {
      setError("Justification requise (min. 10 caractères)");
      return;
    }

    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.set("decision", decision);
    fd.set("justification", justification);

    const result = await submitDecision(caseId, fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="rounded border-2 border-dashed border-border p-4">
      <span className="mb-2 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Décision</span>
      <p className="mb-2 text-[10px] text-muted-foreground">Art. 3, Loi 1.362 — la décision finale est toujours humaine.</p>
      <textarea
        id="justification"
        placeholder="Justification de la décision (obligatoire)..."
        className="mb-2 w-full rounded border border-border bg-background px-3 py-2 text-[11px] focus:border-foreground focus:outline-none"
        rows={2}
      />
      {error && <p className="mb-2 text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-1">
        <button
          onClick={() => handleDecision("approved")}
          disabled={loading}
          className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Approuver
        </button>
        <button
          onClick={() => handleDecision("rejected")}
          disabled={loading}
          className="rounded bg-red-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Rejeter
        </button>
        <button
          onClick={() => handleDecision("escalated")}
          disabled={loading}
          className="rounded border border-border px-3 py-1 text-[11px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Escalader
        </button>
      </div>
    </div>
  );
}
