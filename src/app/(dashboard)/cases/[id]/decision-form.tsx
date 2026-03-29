"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { submitDecision } from "@/app/actions/cases";

export function DecisionForm({ caseId }: { caseId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const router = useRouter();

  async function handleDecision(decision: string) {
    const justification = (document.getElementById("justification") as HTMLTextAreaElement)?.value;
    if (!justification || justification.length < 10) {
      setError("Justification requise (min. 10 caractères) — Art. 3 Loi 1.362");
      return;
    }

    // Show confirmation
    if (!confirming) {
      setConfirming(decision);
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
      setConfirming(null);
    } else {
      router.refresh();
    }
  }

  function cancelConfirm() {
    setConfirming(null);
  }

  return (
    <div className="rounded border-2 border-dashed border-border p-4">
      <span className="mb-2 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Décision</span>
      <p className="mb-2 text-[10px] text-muted-foreground">
        Art. 3, Loi 1.362 — la décision finale est toujours humaine. Votre justification sera conservée dans l&apos;audit trail pendant 7 ans.
      </p>
      <textarea
        id="justification"
        placeholder="Justification de la décision (obligatoire, min. 10 caractères)..."
        className="mb-2 w-full rounded border border-border bg-background px-3 py-2 text-[11px] focus:border-foreground focus:outline-none"
        rows={3}
      />
      {error && <p className="mb-2 rounded bg-red-50 px-2 py-1 text-[10px] text-red-600">{error}</p>}

      {confirming ? (
        <div className="rounded bg-amber-50 px-3 py-2">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span className="text-[11px] font-medium text-amber-800">
              Confirmer : {confirming === "approved" ? "APPROUVER" : confirming === "rejected" ? "REJETER" : "ESCALADER"} ce dossier ?
            </span>
          </div>
          <p className="mb-2 text-[10px] text-amber-700">Cette action est irréversible et sera enregistrée dans l&apos;audit trail.</p>
          <div className="flex gap-1">
            <button
              onClick={() => handleDecision(confirming)}
              disabled={loading}
              className="flex items-center gap-1 rounded bg-foreground px-3 py-1 text-[10px] font-medium text-background disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              Confirmer
            </button>
            <button onClick={cancelConfirm} className="rounded border border-border px-3 py-1 text-[10px] text-muted-foreground hover:bg-muted">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-1">
          <button onClick={() => handleDecision("approved")} className="rounded bg-emerald-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-emerald-700">Approuver</button>
          <button onClick={() => handleDecision("rejected")} className="rounded bg-red-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-red-700">Rejeter</button>
          <button onClick={() => handleDecision("escalated")} className="rounded border border-border px-3 py-1 text-[10px] font-medium text-foreground hover:bg-muted">Escalader</button>
        </div>
      )}
    </div>
  );
}
