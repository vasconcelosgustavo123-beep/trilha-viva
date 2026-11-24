import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlayQuestion = { id: string; prompt: string; image_url: string | null; options: string[] };
export type QuizResult = { score: number; total: number; correct: number[]; awarded?: number };

export function QuizPlayer({ questions, onSubmit, submitLabel = "Finalizar quiz e somar pontos" }: { questions: PlayQuestion[]; onSubmit: (answers: number[]) => Promise<QuizResult | null>; submitLabel?: string }) {
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const answered = answers.filter((a) => a >= 0).length;

  async function submit() {
    setBusy(true);
    const r = await onSubmit(answers);
    setBusy(false);
    if (r) setResult(r);
  }

  if (questions.length === 0) return <p className="text-muted-foreground">Este quiz ainda não tem perguntas.</p>;

  return (
    <div className="space-y-5">
      {result && (
        <div className="rounded-2xl border-2 border-highlight bg-highlight/15 p-5">
          <div className="font-display text-3xl font-bold">{result.score}/{result.total} acertos</div>
          {result.awarded !== undefined && (
            <p className="text-sm">{result.awarded > 0 ? `+${result.awarded} pontos adicionados ao seu perfil!` : "Pontos só contam na primeira tentativa — mas treinar sempre vale."}</p>
          )}
        </div>
      )}
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-2xl border bg-card p-5">
          {q.image_url && <img src={q.image_url} alt="" className="mb-4 max-h-72 w-full rounded-xl object-contain bg-muted" />}
          <p className="mb-3 font-semibold"><span className="mr-2 text-primary">{qi + 1}.</span>{q.prompt}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, oi) => {
              const chosen = answers[qi] === oi;
              const isCorrect = result && result.correct[qi] === oi;
              const isWrong = result && chosen && !isCorrect;
              return (
                <button
                  key={oi}
                  disabled={!!result}
                  onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm transition",
                    chosen && !result && "border-primary bg-accent font-semibold",
                    !chosen && !result && "hover:bg-muted",
                    isCorrect && "border-success bg-success/15 font-semibold",
                    isWrong && "border-destructive bg-destructive/10",
                  )}
                >
                  {String.fromCharCode(65 + oi)}) {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!result && (
        <Button size="lg" className="w-full" disabled={busy || answered < questions.length} onClick={submit}>
          {answered < questions.length ? `Responda todas (${answered}/${questions.length})` : submitLabel}
        </Button>
      )}
    </div>
  );
}
