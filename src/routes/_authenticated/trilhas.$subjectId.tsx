import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/trilhas/$subjectId")({
  head: () => ({ meta: [{ title: "Matéria — Trilha" }, { name: "description", content: "Tópicos da matéria." }, { property: "og:title", content: "Matéria — Trilha" }, { property: "og:description", content: "Tópicos da matéria." }] }),
  component: Subject,
});

function Subject() {
  const { subjectId } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: async () => (await supabase.from("subjects").select("*, lessons(id,title,caption,position)").eq("id", subjectId).single()).data,
  });
  const { data: attempts } = useQuery({ queryKey: ["attempts-full"], queryFn: async () => (await supabase.from("quiz_attempts").select("*")).data ?? [] });
  if (!data) return null;
  const lessons = [...data.lessons].sort((a, b) => a.position - b.position);
  return (
    <div>
      <Link to="/trilhas" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Trilhas</Link>
      <h1 className="mt-3 text-4xl font-extrabold">{data.icon} {data.name}</h1>
      <ol className="mt-8 space-y-3">
        {lessons.map((l, i) => {
          const a = attempts?.find((x) => x.lesson_id === l.id);
          return (
            <li key={l.id}>
              <Link to="/aula/$lessonId" params={{ lessonId: l.id }} className="flex items-center gap-4 rounded-2xl border bg-card p-5 hover:border-primary">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold text-primary-foreground" style={{ background: data.color }}>{i + 1}</span>
                <div className="flex-1"><div className="font-bold">{l.title}</div>{l.caption && <div className="text-sm text-muted-foreground">{l.caption}</div>}</div>
                {a && <span className="flex items-center gap-1 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" />{a.score}/{a.total}</span>}
              </Link>
            </li>
          );
        })}
        {lessons.length === 0 && <p className="text-muted-foreground">Nenhum tópico ainda.</p>}
      </ol>
    </div>
  );
}
