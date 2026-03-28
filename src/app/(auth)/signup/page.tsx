"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-100">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-[14px] font-semibold text-foreground">Vérifiez votre email</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>
          </p>
          <a href="/login" className="mt-4 inline-block text-[11px] text-foreground hover:underline">
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground">
            <span className="font-mono text-[11px] font-bold text-background">K</span>
          </div>
          <div className="text-center">
            <h1 className="text-[14px] font-semibold text-foreground">Créer un compte</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">KYC Monaco · Conformité AMSF</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="fullName" className="text-[11px]">Nom complet</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Maître Dupont"
              required
              className="h-8 text-[11px]"
            />
          </div>
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
              placeholder="Min. 8 caractères"
              required
              minLength={8}
              className="h-8 text-[11px]"
            />
          </div>

          {error && (
            <p className="rounded bg-red-50 px-3 py-1.5 text-[10px] text-red-700">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="h-8 w-full text-[11px]">
            {loading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
            Créer le compte
          </Button>
        </form>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Déjà un compte ?{" "}
          <a href="/login" className="text-foreground hover:underline">Se connecter</a>
        </p>
      </div>
    </div>
  );
}
