import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toEmbedUrl } from "@/lib/media";
import { QuizPlayer, type QuizResult } from "@/components/app/QuizPlayer";
import { Theory } from "@/components/app/Theory";
import { Discussion } from "@/components/app/Discussion";

export const Route = createFileRoute("/_authenticated/aula/$lessonId")({
  head: () => ({ meta: [{ title: "Aula — Trilha" }, { name: "description", content: "Teoria, vídeo, PDF e quiz." }, { property: "og:title", content: "Aula — Trilha" }, { property: "og:description", content: "Teoria, vídeo, PDF e quiz." }] }),
  component: Lesson,
});

function Lesson() {
  const { lessonId } = Route.useParams();
  const qc = useQueryClient();
  const { data: lesson } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => (await supabase.from("lessons").select("*, subjects(id,name,icon,color)").eq("id", lessonId).single()).data,
  });
  const { data: questions } = useQuery({
    queryKey: ["questions", lessonId],
    queryFn: async () => (await supabase.from("questions").select("id,prompt,image_url,options,position").eq("lesson_id", lessonId).order("position").order("id")).data ?? [],
  });
  if (!lesson || !questions) return null;
  const embed = toEmbedUrl(lesson.video_url);

  async function grade(answers: number[]): Promise<QuizResult | null> {
    const { data, error } = await supabase.rpc("submit_quiz", { _lesson: lessonId, _answers: answers });
    if (error) { toast.error(error.message); return null; }
    qc.invalidateQueries({ queryKey: ["me"] });
    qc.invalidateQueries({ queryKey: ["attempts"] });
    qc.invalidateQueries({ queryKey: ["attempts-full"] });
    return data as unknown as QuizResult;
  }

  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <div>
        {lesson.subjects && <Link to="/trilhas/$subjectId" params={{ subjectId: lesson.subjects.id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> {lesson.subjects.icon} {lesson.subjects.name}</Link>}
        <h1 className="mt-3 text-4xl font-extrabold">{lesson.title}</h1>
        {lesson.caption && <p className="mt-1 text-lg text-muted-foreground">{lesson.caption}</p>}
      </div>
      <section className="rounded-2xl border bg-card p-6"><h2 className="mb-3 text-xl font-bold">Texto explicativo</h2><Theory text={lesson.theory || "Conteúdo em breve."} /></section>
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Video className="h-5 w-5" /> Vídeo-aula</h2>
        {embed ? (
          <div className="aspect-video overflow-hidden rounded-2xl border bg-muted">
            <iframe src={embed} title="Vídeo-aula" className="h-full w-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        ) : <p className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">Vídeo ainda não adicionado.</p>}
      </section>
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><FileText className="h-5 w-5" /> Apostila em PDF</h2>
        {lesson.pdf_url ? (
          <div className="space-y-2">
            <iframe src={lesson.pdf_url} title="PDF" className="h-[600px] w-full rounded-2xl border" />
            <a href={lesson.pdf_url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Download className="h-4 w-4" /> Baixar PDF</a>
          </div>
        ) : <p className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">PDF ainda não adicionado.</p>}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">📝 Quiz de {questions.length} questões</h2>
        <QuizPlayer key={lessonId} questions={questions.map((q) => ({ ...q, options: q.options as string[] }))} onSubmit={grade} />
      </section>
      <section><h2 className="mb-3 text-xl font-bold">Reações e comentários</h2><Discussion targetId={lessonId} /></section>
    </article>
  );
}
