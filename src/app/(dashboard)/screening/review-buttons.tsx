"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { reviewScreeningMatch } from "@/app/actions/screening";

export function ScreeningReviewButtons({ screeningId }: { screeningId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReview(decision: "confirmed_match" | "false_positive") {
    setLoading(true);
    await reviewScreeningMatch(screeningId, decision);
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handleReview("false_positive")}
        disabled={loading}
        className="rounded bg-white px-2 py-0.5 text-[10px] text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        Faux positif
      </button>
      <button
        onClick={() => handleReview("confirmed_match")}
        disabled={loading}
        className="flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        Confirmer
      </button>
    </div>
  );
}
