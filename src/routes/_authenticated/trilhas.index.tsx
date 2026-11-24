import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenCheck, CheckCircle2, FlaskConical, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/trilhas/")({
  head: () => ({ meta: [{ title: "Guia de estudos — Trilha Viva" }, { name: "description", content: "Encontre uma trilha, organize seus estudos e acompanhe seu progresso." }, { property: "og:title", content: "Guia de estudos — Trilha Viva" }] }),
  component: Trilhas,
});

function Trilhas() {
  const [search, setSearch] = useState("");
  const { data: subjects = [], isLoading, error } = useQuery({
    queryKey: ["subjects-with-count"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("subjects").select("*, lessons(id)").order("position");
      if (queryError) throw queryError;
      return data ?? [];
    },
  });
  const { data: attempts = [] } = useQuery({
    queryKey: ["attempts"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("quiz_attempts").select("lesson_id");
      if (queryError) throw queryError;
      return data ?? [];
    },
  });
  const done = useMemo(() => new Set(attempts.map((attempt) => attempt.lesson_id)), [attempts]);
  const filtered = subjects.filter((subject) => `${subject.name} ${subject.icon ?? ""}`.toLowerCase().includes(search.toLowerCase().trim()));
  const totalLessons = subjects.reduce((total, subject) => total + subject.lessons.length, 0);
  const completedLessons = subjects.reduce((total, subject) => total + subject.lessons.filter((lesson) => done.has(lesson.id)).length, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-sky-300/20 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/50 p-6 text-white shadow-xl sm:p-9">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-sky-300"><BookOpenCheck className="h-4 w-4" /> Seu guia de estudos</p><h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Escolha sua próxima trilha.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Estude por matéria, avance tópico a tópico e consolide o conteúdo com atividades e quizzes. Seu progresso fica vinculado à sua conta.</p></div><div className="min-w-36 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-2xl font-extrabold">{completedLessons}<span className="text-base text-slate-400">/{totalLessons}</span></div><div className="mt-1 text-xs text-slate-400">tópicos concluídos</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime-300 transition-all" style={{ width: `${totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0}%` }} /></div></div></div>
      </section>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-2xl font-extrabold">Matérias</h2><p className="mt-1 text-sm text-muted-foreground">Selecione uma matéria para ver aulas, materiais e quizzes.</p></div><label className="w-full max-w-xs"><span className="sr-only">Buscar matéria</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar matéria…" className="w-full rounded-xl border bg-card px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary" /></label></div>
        {isLoading && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border bg-muted/50" />)}</div>}
        {error && <div role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar as matérias agora. Atualize a página ou tente novamente.</div>}
        {!isLoading && !error && filtered.length === 0 && <div className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{subjects.length ? "Nenhuma matéria corresponde à busca." : "As matérias aparecerão aqui assim que forem publicadas."}</div>}
        {!isLoading && !error && <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((subject) => {
          const total = subject.lessons.length;
          const completed = subject.lessons.filter((lesson) => done.has(lesson.id)).length;
          const percent = total ? Math.round((completed / total) * 100) : 0;
          return <Link key={subject.id} to="/trilhas/$subjectId" params={{ subjectId: subject.id }} className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"><div className="flex items-start justify-between"><div className="grid h-14 w-14 place-items-center rounded-2xl text-3xl" style={{ background: `${subject.color ?? "#0ea5e9"}22` }}>{subject.icon || "📚"}</div><ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div><h3 className="mt-5 font-display text-xl font-extrabold">{subject.name}</h3><p className="mt-1 text-sm text-muted-foreground">{completed} de {total} tópicos concluídos</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: subject.color ?? "var(--primary)" }} /></div>{percent === 100 && total > 0 && <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Trilha concluída</span>}</Link>;
        })}</div>}
      </section>
      <section className="grid gap-4 md:grid-cols-2"><Link to="/atividades" className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition hover:border-primary/40"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ListChecks className="h-6 w-6" /></span><span className="min-w-0 flex-1"><b className="block font-display text-lg">Lista de atividades</b><span className="mt-1 block text-sm text-muted-foreground">Pratique perguntas de diferentes matérias em sequência.</span></span><ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" /></Link><Link to="/simuladores" className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition hover:border-primary/40"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><FlaskConical className="h-6 w-6" /></span><span className="min-w-0 flex-1"><b className="block font-display text-lg">Laboratório virtual</b><span className="mt-1 block text-sm text-muted-foreground">Explore projetos modelo de engenharia e matemática.</span></span><ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" /></Link></section>
    </div>
  );
}
