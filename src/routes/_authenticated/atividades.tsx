import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/atividades")({
  head: () => ({ meta: [{ title: "Lista de atividades — Trilha" }, { name: "description", content: "Todas as questões em ordem." }, { property: "og:title", content: "Lista de atividades" }, { property: "og:description", content: "Todas as questões em ordem." }] }),
  component: Atividades,
});

function Atividades() {
  const { data } = useQuery({
    queryKey: ["all-activities"],
    queryFn: async () => (await supabase.from("subjects").select("id,name,icon,position, lessons(id,title,position, questions(id,prompt,image_url,options,position))").order("position")).data ?? [],
  });
  let n = 0;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold">📋 Lista geral de atividades</h1>
      <p className="mt-2 text-muted-foreground">Todas as questões em ordem, da primeira de Português até a última de Inglês.</p>
      {data?.map((s) => (
        <section key={s.id} className="mt-10">
          <h2 className="text-2xl font-bold">{s.icon} {s.name}</h2>
          {[...s.lessons].sort((a, b) => a.position - b.position).map((l) => (
            <div key={l.id} className="mt-4 rounded-2xl border bg-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-bold">{l.title}</h3>
                <Button asChild size="sm"><Link to="/aula/$lessonId" params={{ lessonId: l.id }}>Responder</Link></Button>
              </div>
              <ol className="space-y-3">
                {[...l.questions].sort((a, b) => a.position - b.position).map((q) => {
                  n += 1;
                  return (
                    <li key={q.id} className="border-t pt-3">
                      {q.image_url && <img src={q.image_url} alt="" className="mb-2 max-h-56 rounded-lg" />}
                      <p><span className="mr-2 font-display font-bold text-primary">Questão {n}:</span>{q.prompt}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{(q.options as string[]).map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("   ")}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
