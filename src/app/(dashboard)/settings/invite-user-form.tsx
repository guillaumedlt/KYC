"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { inviteUser } from "@/app/actions/users";

export function InviteUserForm({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await inviteUser(tenantId, fd);
    if (result?.error) setError(result.error);
    else { setOpen(false); e.currentTarget.reset(); }
    setLoading(false);
  }

  if (!open) {
    return (
      <div className="px-3 py-1.5">
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
          <Plus className="h-3 w-3" /> Inviter un utilisateur
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t border-border px-3 py-2">
      <div className="flex gap-2">
        <Input name="email" type="email" placeholder="email@cabinet.mc" required className="h-7 flex-1 text-[10px]" />
        <Input name="fullName" placeholder="Nom complet" required className="h-7 flex-1 text-[10px]" />
        <select name="role" defaultValue="analyst" className="h-7 rounded border border-border bg-background px-2 text-[10px] text-foreground">
          <option value="admin">Admin</option>
          <option value="compliance_officer">Compliance Officer</option>
          <option value="analyst">Analyste</option>
          <option value="viewer">Lecteur</option>
        </select>
      </div>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-1">
        <Button type="submit" size="sm" disabled={loading} className="h-6 rounded px-2 text-[10px]">
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Plus className="mr-1 h-3 w-3" />}
          Inviter
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-6 rounded px-2 text-[10px]">
          Annuler
        </Button>
      </div>
    </form>
  );
}
