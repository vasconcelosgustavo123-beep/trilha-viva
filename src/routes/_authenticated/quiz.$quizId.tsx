import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QuizPlayer } from "@/components/app/QuizPlayer";
import { Discussion } from "@/components/app/Discussion";
import type { EditQuestion } from "@/components/app/QuizEditor";

export const Route = createFileRoute("/_authenticated/quiz/$quizId")({
  head: () => ({ meta: [{ title: "Quiz da comunidade — Trilha" }, { name: "description", content: "Quiz criado pela comunidade." }, { property: "og:title", content: "Quiz da comunidade" }, { property: "og:description", content: "Quiz criado pela comunidade." }] }),
  component: PlayQuiz,
});

function PlayQuiz() {
  const { quizId } = Route.useParams();
  const { data } = useQuery({ queryKey: ["user-quiz", quizId], queryFn: async () => (await supabase.from("user_quizzes").select("*").eq("id", quizId).maybeSingle()).data });
  if (!data) return <p className="text-muted-foreground">Quiz não encontrado ou privado.</p>;
  const qs = (data.questions as EditQuestion[]).filter((q) => q.prompt);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link to="/espaco" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Espaço</Link>
      <div><h1 className="text-4xl font-extrabold">{data.title}</h1><p className="mt-1 text-muted-foreground">{data.description}</p><p className="mt-1 text-xs text-muted-foreground">Quizzes da comunidade são para treino e não somam pontos ao ranking.</p></div>
      <QuizPlayer
        questions={qs.map((q) => ({ id: q.id, prompt: q.prompt, image_url: q.image_url, options: q.options }))}
        submitLabel="Ver resultado"
        onSubmit={async (answers) => ({ score: answers.filter((a, i) => a === qs[i]?.correct_index).length, total: qs.length, correct: qs.map((q) => q.correct_index) })}
      />
      {data.published && <section><h2 className="mb-3 text-xl font-bold">Reações e comentários</h2><Discussion targetId={quizId} /></section>}
    </div>
  );
}
