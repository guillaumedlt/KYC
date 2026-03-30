"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Create account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(
        signUpError.message === "User already registered"
          ? "Cet email est déjà utilisé"
          : signUpError.message.includes("invalid")
            ? "Email invalide"
            : signUpError.message,
      );
      setLoading(false);
      return;
    }

    // If session exists (email confirmation disabled), go to dashboard
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // If no session, try to sign in immediately (works if email is auto-confirmed via trigger)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // If sign in fails, show email confirmation message
    setLoading(false);
    setError(null);
    // Show success with email confirmation info
    document.getElementById("signup-form")?.classList.add("hidden");
    document.getElementById("success-msg")?.classList.remove("hidden");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-[28px] text-foreground">Créer un compte</h1>
          <p className="mt-1 text-[11px] tracking-wider text-muted-foreground">KYC MONACO · CONFORMITÉ AMSF</p>
        </div>

        {/* Success message (hidden by default) */}
        <div id="success-msg" className="hidden text-center">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
            <span className="text-[18px]">✓</span>
          </div>
          <h2 className="text-[14px] font-semibold text-foreground">Compte créé</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Vérifiez votre email <strong>{email}</strong> pour confirmer votre compte.
          </p>
          <a href="/login" className="mt-4 inline-block text-[11px] text-foreground hover:underline">
            Aller à la connexion
          </a>
        </div>

        {/* Signup form */}
        <form id="signup-form" onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-[11px]">Nom complet</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Maître Dupont" required className="h-9 text-[12px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[11px]">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="avocat@cabinet.mc" required className="h-9 text-[12px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[11px]">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 caractères" required minLength={8} className="h-9 text-[12px]" />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[11px] text-red-700">{error}</p>}

          <Button type="submit" disabled={loading} className="h-9 w-full text-[12px]">
            {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Créer le compte
          </Button>
        </form>

        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          Déjà un compte ?{" "}
          <a href="/login" className="text-foreground hover:underline">Se connecter</a>
        </p>

        <div className="mt-10 border-t border-border pt-4 text-center text-[9px] text-muted-foreground/60">
          Plateforme sécurisée · Données chiffrées · RGPD
        </div>
      </div>
    </div>
  );
}
