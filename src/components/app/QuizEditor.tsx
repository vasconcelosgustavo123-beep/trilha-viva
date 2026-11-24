import { Plus, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadMedia } from "@/lib/media";

export type EditQuestion = { id: string; prompt: string; image_url: string | null; options: string[]; correct_index: number };

export const blankQuestion = (): EditQuestion => ({ id: crypto.randomUUID(), prompt: "", image_url: null, options: ["", "", "", ""], correct_index: 0 });

/** Quiz-Party-style card editor shared by admin and user spaces. */
export function QuizEditor({ value, onChange, userId }: { value: EditQuestion[]; onChange: (q: EditQuestion[]) => void; userId: string }) {
  const set = (i: number, patch: Partial<EditQuestion>) => onChange(value.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  async function img(i: number, f?: File) {
    if (!f) return;
    try { set(i, { image_url: await uploadMedia(f, userId, "questions") }); } catch { toast.error("Falha ao enviar imagem"); }
  }
  return (
    <div className="space-y-4">
      {value.map((q, i) => (
        <div key={q.id} className="rounded-2xl border-2 bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display font-bold text-primary">Pergunta {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          {q.image_url ? (
            <div className="relative mb-2"><img src={q.image_url} alt="" className="max-h-48 rounded-lg" /><button className="text-xs underline" onClick={() => set(i, { image_url: null })}>remover imagem</button></div>
          ) : (
            <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground"><ImagePlus className="h-4 w-4" /> Imagem no início da pergunta (opcional)<input type="file" accept="image/*" className="hidden" onChange={(e) => img(i, e.target.files?.[0])} /></label>
          )}
          <Textarea placeholder="Enunciado" value={q.prompt} onChange={(e) => set(i, { prompt: e.target.value })} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {q.options.map((o, oi) => (
              <div key={oi} className={`flex items-center gap-2 rounded-xl border-2 p-1 pl-2 ${q.correct_index === oi ? "border-success bg-success/10" : ""}`}>
                <input type="radio" name={`c-${q.id}`} checked={q.correct_index === oi} onChange={() => set(i, { correct_index: oi })} aria-label="Correta" />
                <Input className="border-0 bg-transparent" placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`} value={o} onChange={(e) => set(i, { options: q.options.map((x, k) => (k === oi ? e.target.value : x)) })} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={() => onChange([...value, blankQuestion()])}><Plus className="mr-1 h-4 w-4" /> Adicionar pergunta</Button>
    </div>
  );
}
