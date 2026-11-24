import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MailCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Trilha" },
      { name: "description", content: "Entre ou crie sua conta na Trilha." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // 1. LOGIN AUTOMÁTICO: Se já estiver logado no navegador, vai direto para as trilhas
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: "/trilhas" });
      }
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        // Cria a conta
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/trilhas`,
          },
        });
        if (error) throw error;

        // Se já retornou a sessão, entra direto
        if (data.session) {
          toast.success("Conta criada! Entrando...");
          return navigate({ to: "/trilhas" });
        }

        // Tenta fazer login imediato com a senha digitada
        const loginImediato = await supabase.auth.signInWithPassword({ email, password });
        if (loginImediato.data.session) {
          toast.success("Bem-vindo!");
          return navigate({ to: "/trilhas" });
        }

        // Se o backend ainda exigir validação por e-mail:
        setSentTo(email);
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos as instruções para o seu e-mail.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes("Email not confirmed") || error.message.includes("not confirmed")) {
            throw new Error("E-mail não confirmado. Verifique o spam ou desative a confirmação no backend.");
          }
          throw error;
        }
        navigate({ to: "/trilhas" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setBusy(false);
    }
  }

  // 2. Entrar rápido com Google
  async function google() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/trilhas` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao conectar com Google");
    }
  }

  if (sentTo)
    return (
      <Shell>
        <MailCheck className="h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold">Confira seu e-mail</h1>
        <p className="mt-2 text-muted-foreground">Enviamos uma confirmação para <b>{sentTo}</b>. Clique no link para ativar sua conta.</p>
        <Button variant="outline" className="mt-6" onClick={() => { setSentTo(null); setMode("login"); }}>Voltar ao login</Button>
      </Shell>
    );

  return (
    <Shell>
      <h1 className="text-3xl font-bold">{mode === "signup" ? "Criar conta" : mode === "forgot" ? "Recuperar senha" : "Entrar"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div><Label htmlFor="name">Nome de usuário</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /></div>
        )}
        <div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {mode !== "forgot" && (
          <div><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        )}
        <Button className="w-full" disabled={busy}>{mode === "signup" ? "Cadastrar e Entrar" : mode === "forgot" ? "Enviar link" : "Entrar"}</Button>
      </form>
      {mode !== "forgot" && (
        <>
          <div className="my-4 text-center text-xs text-muted-foreground">ou</div>
          <button type="button" onClick={google} className="flex w-full items-center justify-center gap-[10px] rounded-md border border-[#747775] bg-[#FFFFFF] px-3 py-2 text-sm font-medium text-[#1F1F1F]">
            <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continuar com Google
          </button>
        </>
      )}
      <div className="mt-6 flex justify-between text-sm">
        <button className="text-primary underline" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Já tenho conta" : "Criar conta"}</button>
        {mode === "login" && <button className="text-muted-foreground underline" onClick={() => setMode("forgot")}>Esqueci a senha</button>}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-foreground/80 bg-card p-8 shadow-[6px_6px_0_0_var(--foreground)]">{children}</div>
    </div>
  );
}
