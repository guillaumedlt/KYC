"use client";

import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/locale";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ current }: { current: string }) {
  const router = useRouter();

  async function switchTo(locale: string) {
    await setLocale(locale);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border">
      <button
        onClick={() => switchTo("fr")}
        className={cn("rounded-l-md px-1.5 py-0.5 text-[10px] transition-colors",
          current === "fr" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
      >
        FR
      </button>
      <button
        onClick={() => switchTo("en")}
        className={cn("rounded-r-md px-1.5 py-0.5 text-[10px] transition-colors",
          current === "en" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
      >
        EN
      </button>
    </div>
  );
}
