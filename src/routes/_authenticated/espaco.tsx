import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Lock, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useProfiles } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizEditor, blankQuestion, type EditQuestion } from "@/components/app/QuizEditor";
import { UserAvatar } from "@/components/app/UserAvatar";

export const Route = createFileRoute("/_authenticated/espaco")({
  head: () => ({ meta: [{ title: "Meu espaço — Trilha" }, { name: "description", content: "Crie quizzes e publique para a comunidade." }, { property: "og:title", content: "Meu espaço" }, { property: "og:description", content: "Crie quizzes e publique para a comunidade." }] }),
  component: Espaco,
});

type Draft = { id?: string; title: string; description: string; questions: EditQuestion[]; published: boolean };

function Espaco() {
  const { data: me } = useMe();
  const { data: profiles } = useProfiles();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const { data: quizzes } = useQuery({ queryKey: ["user-quizzes"], queryFn: async () => (await supabase.from("user_quizzes").select("*").order("updated_at", { ascending: false })).data ?? [] });
  const uid = me?.user.id;
  const mine = quizzes?.filter((q) => q.owner_id === uid) ?? [];
  const community = quizzes?.filter((q) => q.published) ?? [];

  async function save() {
    if (!draft || !uid) return;
    if (!draft.title.trim()) return toast.error("Dê um título ao quiz");
    const row = { title: draft.title.trim(), description: draft.description, questions: draft.questions, published: draft.published, updated_at: new Date().toISOString() };
    const { error } = draft.id ? await supabase.from("user_quizzes").update(row).eq("id", draft.id) : await supabase.from("user_quizzes").insert({ ...row, owner_id: uid });
    if (error) return toast.error(me?.profile?.banned ? "Conta suspensa." : error.message);
    toast.success(draft.published ? "Publicado para a comunidade!" : "Rascunho salvo (privado).");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["user-quizzes"] });
  }
  async function remove(id: string) {
    await supabase.from("user_quizzes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["user-quizzes"] });
  }

  if (draft && uid)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-extrabold">{draft.id ? "Editar quiz" : "Novo quiz"}</h1>
        <Input placeholder="Título" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <Textarea placeholder="Descrição" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <QuizEditor value={draft.questions} onChange={(q) => setDraft({ ...draft, questions: q })} userId={uid} />
        <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-lg">
          <div className="flex rounded-lg border p-1">
            <button className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${!draft.published ? "bg-accent font-semibold" : ""}`} onClick={() => setDraft({ ...draft, published: false })}><Lock className="h-3.5 w-3.5" /> Privado</button>
            <button className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${draft.published ? "bg-accent font-semibold" : ""}`} onClick={() => setDraft({ ...draft, published: true })}><Globe className="h-3.5 w-3.5" /> Público</button>
          </div>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => setDraft(null)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </div>
      </div>
    );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-extrabold">🚀 Espaço</h1>
        <Button onClick={() => setDraft({ title: "", description: "", questions: [blankQuestion()], published: false })}>Criar quiz</Button>
      </div>
      <Tabs defaultValue="mine" className="mt-6">
        <TabsList><TabsTrigger value="mine">Meus projetos</TabsTrigger><TabsTrigger value="community">Comunidade</TabsTrigger></TabsList>
        <TabsContent value="mine" className="mt-4 grid gap-3 sm:grid-cols-2">
          {mine.map((q) => (
            <div key={q.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">{q.published ? <><Globe className="h-3 w-3" /> Publicado</> : <><Lock className="h-3 w-3" /> Rascunho privado</>}</div>
              <h3 className="mt-1 text-lg font-bold">{q.title}</h3>
              <p className="text-sm text-muted-foreground">{(q.questions as unknown[]).length} perguntas</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" asChild><Link to="/quiz/$quizId" params={{ quizId: q.id }}>Jogar</Link></Button>
                <Button size="sm" variant="outline" onClick={() => setDraft({ id: q.id, title: q.title, description: q.description, questions: q.questions as EditQuestion[], published: q.published })}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(q.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
          {mine.length === 0 && <p className="text-muted-foreground">Você ainda não criou nenhum quiz.</p>}
        </TabsContent>
        <TabsContent value="community" className="mt-4 grid gap-3 sm:grid-cols-2">
          {community.map((q) => {
            const p = profiles?.byId[q.owner_id];
            return (
              <Link key={q.id} to="/quiz/$quizId" params={{ quizId: q.id }} className="rounded-2xl border bg-card p-5 hover:border-primary">
                <div className="flex items-center gap-2"><UserAvatar profile={p} size={24} /><span className="text-sm text-muted-foreground">{p?.display_name}</span></div>
                <h3 className="mt-2 text-lg font-bold">{q.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{q.description}</p>
              </Link>
            );
          })}
          {community.length === 0 && <p className="text-muted-foreground">Nada publicado ainda.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
