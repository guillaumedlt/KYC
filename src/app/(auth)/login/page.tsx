"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-[28px] text-foreground">KYC Monaco</h1>
          <p className="mt-1 text-[11px] tracking-wider text-muted-foreground">CONFORMITÉ AMSF · LOI N° 1.362</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[11px]">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="avocat@cabinet.mc" required className="h-9 text-[12px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[11px]">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required className="h-9 text-[12px]" />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[11px] text-red-700">{error}</p>}

          <Button type="submit" disabled={loading} className="h-9 w-full text-[12px]">
            {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          Pas encore de compte ?{" "}
          <a href="/signup" className="text-foreground hover:underline">Créer un compte</a>
        </p>

        <div className="mt-10 border-t border-border pt-4 text-center text-[9px] text-muted-foreground/60">
          Plateforme sécurisée · Données chiffrées · RGPD
        </div>
      </div>
    </div>
  );
}
