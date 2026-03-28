"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";

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
      setError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground">
            <span className="font-mono text-[11px] font-bold text-background">K</span>
          </div>
          <div className="text-center">
            <h1 className="text-[14px] font-semibold text-foreground">KYC Monaco</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Conformité AMSF · kyc.mc</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[11px]">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="avocat@cabinet.mc"
              required
              className="h-8 text-[11px]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className="text-[11px]">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-8 text-[11px]"
            />
          </div>

          {error && (
            <p className="rounded bg-red-50 px-3 py-1.5 text-[10px] text-red-700">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="h-8 w-full text-[11px]">
            {loading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Shield className="mr-1.5 h-3 w-3" />}
            Se connecter
          </Button>
        </form>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Pas encore de compte ?{" "}
          <a href="/signup" className="text-foreground hover:underline">Créer un compte</a>
        </p>
      </div>
    </div>
  );
}
