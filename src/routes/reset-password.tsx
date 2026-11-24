import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha — Trilha" }, { name: "description", content: "Defina uma nova senha." }, { property: "og:title", content: "Nova senha — Trilha" }, { property: "og:description", content: "Defina uma nova senha." }] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function save() {
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/trilhas" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8">
        <h1 className="text-2xl font-bold">Nova senha</h1>
        <Input type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha" />
        <Button className="w-full" onClick={save} disabled={pw.length < 6}>Salvar</Button>
      </div>
    </div>
  );
}
