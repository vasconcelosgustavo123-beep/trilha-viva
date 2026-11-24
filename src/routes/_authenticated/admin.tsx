import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useProfiles } from "@/lib/session";
import { uploadMedia } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizEditor, type EditQuestion } from "@/components/app/QuizEditor";
import { FileText, Trash2, UploadCloud, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel admin — Trilha" },
      { name: "description", content: "Gerencie conteúdo, tema e moderação." },
      { property: "og:title", content: "Painel admin" },
      { property: "og:description", content: "Gerencie conteúdo, tema e moderação." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data: me } = useMe();

  if (!me) return null;
  if (!me.isAdmin) return <p>Acesso restrito a administradores.</p>;

  return (
    <div>
      <h1 className="text-4xl font-extrabold">🛡️ Painel admin</h1>
      <Tabs defaultValue="content" className="mt-6">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="library">Biblioteca de PDFs</TabsTrigger>
          <TabsTrigger value="reports">Denúncias</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="theme">Tema</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Content uid={me.user.id} />
        </TabsContent>
        <TabsContent value="library"><PdfLibrary uid={me.user.id} /></TabsContent>
        <TabsContent value="reports"><Reports /></TabsContent>
        <TabsContent value="users"><Users /></TabsContent>
        <TabsContent value="theme"><Theme /></TabsContent>
      </Tabs>
    </div>
  );
}

function Content({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      // Busca matérias e tópicos separadamente para não depender de uma
      // relação reversa que não está declarada nos tipos gerados do Supabase.
      const { data: subjectRows, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, name, icon, position")
        .order("position", { ascending: true });
      if (subjectsError) throw subjectsError;

      const { data: lessonRows, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, subject_id, title, position")
        .order("position", { ascending: true });
      if (lessonsError) throw lessonsError;

      return (subjectRows ?? []).map((subject) => ({
        ...subject,
        lessons: (lessonRows ?? []).filter((lesson) => lesson.subject_id === subject.id),
      }));
    },
  });
  const [lessonId, setLessonId] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-subjects"] });
    void qc.invalidateQueries({ queryKey: ["subjects-with-count"] });
  };

  async function addSubject() {
    const name = prompt("Nome da matéria")?.trim();
    if (!name) return;

    const { error } = await supabase.from("subjects").insert({
      name,
      position: (subjects?.length ?? 0) + 1,
    });
    if (error) return toast.error(`Não foi possível criar a matéria: ${error.message}`);
    toast.success("Matéria criada.");
    refresh();
  }

  async function addLesson(subject_id: string, count: number) {
    const title = prompt("Título do tópico")?.trim();
    if (!title) return;

    const { data, error } = await supabase
      .from("lessons")
      .insert({ subject_id, title, position: count + 1 })
      .select()
      .single();

    if (error) return toast.error(`Não foi possível criar o tópico: ${error.message}`);
    refresh();
    if (data) setLessonId(data.id);
  }

  async function delSubject(id: string) {
    if (!confirm("Excluir matéria e todos os tópicos?")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return toast.error(`Não foi possível excluir a matéria: ${error.message}`);
    if (lessonId) setLessonId(null);
    toast.success("Matéria excluída.");
    refresh();
  }

  if (isLoading) return <p className="mt-4 text-muted-foreground">Carregando conteúdo...</p>;
  if (error) return <p className="mt-4 text-destructive">Erro ao carregar matérias: {error.message}</p>;

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        {subjects?.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="flex-1 font-bold">{s.icon} {s.name}</span>
              <button
                className="text-xs text-destructive"
                onClick={() => void delSubject(s.id)}
              >
                excluir
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {[...(s.lessons ?? [])]
                .sort((a, b) => a.position - b.position)
                .map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => setLessonId(l.id)}
                      className={`w-full rounded px-2 py-1 text-left text-sm ${
                        lessonId === l.id ? "bg-accent" : "hover:bg-muted"
                      }`}
                    >
                      {l.title}
                    </button>
                  </li>
                ))}
            </ul>
            <button
              className="mt-1 text-xs text-primary underline"
              onClick={() => void addLesson(s.id, s.lessons?.length ?? 0)}
            >
              + tópico
            </button>
          </div>
        ))}
        <Button variant="outline" className="w-full" onClick={() => void addSubject()}>
          + Matéria
        </Button>
      </aside>

      {lessonId ? (
        <LessonEditor
          key={lessonId}
          id={lessonId}
          uid={uid}
          onSaved={refresh}
          onDeleted={() => {
            setLessonId(null);
            refresh();
          }}
        />
      ) : (
        <p className="text-muted-foreground">Selecione um tópico para editar.</p>
      )}
    </div>
  );
}

function LessonEditor({
  id,
  uid,
  onSaved,
  onDeleted,
}: {
  id: string;
  uid: string;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    caption: "",
    theory: "",
    video_url: "",
    pdf_url: "",
  });
  const [qs, setQs] = useState<EditQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLesson() {
      setLoading(true);
      const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", id)
        .single();

      if (!active) return;
      if (lessonError) {
        toast.error(`Não foi possível carregar o tópico: ${lessonError.message}`);
        setLoading(false);
        return;
      }

      if (lesson) {
        setForm({
          title: lesson.title ?? "",
          caption: lesson.caption ?? "",
          theory: lesson.theory ?? "",
          video_url: lesson.video_url ?? "",
          pdf_url: lesson.pdf_url ?? "",
        });
      }

      const { data: questions, error: questionsError } = await supabase.rpc(
        "admin_questions",
        { _lesson: id },
      );

      if (!active) return;
      if (questionsError) {
        toast.error(`Não foi possível carregar as perguntas: ${questionsError.message}`);
      } else {
        setQs(
          (questions ?? []).map((q) => ({
            id: q.id,
            prompt: q.prompt,
            image_url: q.image_url,
            options: Array.isArray(q.options)
              ? q.options.filter((option): option is string => typeof option === "string")
              : [],
            correct_index: q.correct_index,
          })),
        );
      }
      setLoading(false);
    }

    void loadLesson();
    return () => {
      active = false;
    };
  }, [id]);

  async function save() {
    if (uploadingPdf) {
      toast.error("Aguarde o envio do PDF terminar.");
      return;
    }

    setSaving(true);
    try {
      const { error: lessonError } = await supabase
        .from("lessons")
        .update({
          ...form,
          caption: form.caption || null,
          video_url: form.video_url || null,
          pdf_url: form.pdf_url || null,
        })
        .eq("id", id);

      if (lessonError) {
        toast.error(`Erro ao salvar o tópico: ${lessonError.message}`);
        return;
      }

      const { error: deleteQuestionsError } = await supabase
        .from("questions")
        .delete()
        .eq("lesson_id", id);

      if (deleteQuestionsError) {
        toast.error(`Tópico salvo, mas não foi possível atualizar as perguntas: ${deleteQuestionsError.message}`);
        return;
      }

      const rows = qs
        .filter((q) => q.prompt.trim())
        .map((q, index) => ({
          id: q.id,
          lesson_id: id,
          prompt: q.prompt,
          image_url: q.image_url,
          options: q.options.filter((option) => option.trim()),
          correct_index: q.correct_index,
          position: index + 1,
        }));

      if (rows.length) {
        const { error: insertQuestionsError } = await supabase
          .from("questions")
          .insert(rows);
        if (insertQuestionsError) {
          toast.error(`Tópico salvo, mas houve erro ao salvar as perguntas: ${insertQuestionsError.message}`);
          return;
        }
      }

      toast.success("Tópico salvo!");
      onSaved();
      void qc.invalidateQueries();
    } finally {
      setSaving(false);
    }
  }

  async function handlePdfUpload(file?: File) {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Selecione um arquivo PDF.");
      return;
    }

    setUploadingPdf(true);
    try {
      const url = await uploadMedia(file, uid, "pdfs");
      if (!url) throw new Error("O serviço de envio não retornou um endereço para o PDF.");

      setForm((current) => ({ ...current, pdf_url: url }));
      toast.success("PDF enviado. Clique em “Salvar tópico” para vincular à aula.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Falha no envio do PDF: ${message}`);
    } finally {
      setUploadingPdf(false);
    }
  }

  async function deleteLesson() {
    if (!confirm("Excluir tópico?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return toast.error(`Não foi possível excluir o tópico: ${error.message}`);
    toast.success("Tópico excluído.");
    onDeleted();
  }

  if (loading) return <p className="text-muted-foreground">Carregando tópico...</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Título</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
          />
        </div>
        <div>
          <Label>Legenda</Label>
          <Input
            value={form.caption}
            onChange={(e) => setForm((current) => ({ ...current, caption: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label>Texto teórico (use **negrito** e listas com "- ")</Label>
        <Textarea
          rows={8}
          value={form.theory}
          onChange={(e) => setForm((current) => ({ ...current, theory: e.target.value }))}
        />
      </div>

      <div>
        <Label>Link da vídeo-aula (YouTube/Vimeo)</Label>
        <Input
          value={form.video_url}
          onChange={(e) => setForm((current) => ({ ...current, video_url: e.target.value }))}
        />
      </div>

      <div className="space-y-2 rounded-xl border p-3">
        <Label>PDF da aula</Label>
        <Input
          placeholder="Cole o link do PDF ou envie um arquivo"
          value={form.pdf_url}
          onChange={(e) => setForm((current) => ({ ...current, pdf_url: e.target.value }))}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="file"
            accept=".pdf,application/pdf"
            className="max-w-56"
            disabled={uploadingPdf || saving}
            onChange={(e) => {
              const file = e.target.files?.[0];
              void handlePdfUpload(file);
              e.currentTarget.value = "";
            }}
          />
          {uploadingPdf && <span className="text-sm text-muted-foreground">Enviando PDF...</span>}
          {form.pdf_url && (
            <>
              <a
                href={form.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline"
              >
                Abrir PDF atual
              </a>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={uploadingPdf || saving}
                onClick={() => {
                  setForm((current) => ({ ...current, pdf_url: "" }));
                  toast.info("Link removido do formulário. Salve o tópico para aplicar a alteração.");
                }}
              >
                Remover vínculo
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Depois de enviar ou alterar o link, clique em “Salvar tópico”. Remover o vínculo não apaga o arquivo do armazenamento.
        </p>
      </div>

      <h3 className="pt-2 text-xl font-bold">Perguntas do quiz ({qs.length}/10)</h3>
      <QuizEditor value={qs} onChange={setQs} userId={uid} />

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save()} disabled={saving || uploadingPdf}>
          {saving ? "Salvando..." : "Salvar tópico"}
        </Button>
        <Button
          variant="ghost"
          className="text-destructive"
          onClick={() => void deleteLesson()}
          disabled={saving || uploadingPdf}
        >
          Excluir tópico
        </Button>
      </div>
    </div>
  );
}


type LibraryPdf = {
  id: string;
  title: string;
  category: string;
  file_url: string;
  storage_path: string;
  created_at: string;
};

function PdfLibrary({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Materiais gerais");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: pdfs, isLoading, error } = useQuery({
    queryKey: ["admin-library-pdfs"],
    queryFn: async (): Promise<LibraryPdf[]> => {
      const { data, error } = await supabase
        .from("library_pdfs")
        .select("id, title, category, file_url, storage_path, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LibraryPdf[];
    },
  });

  async function addPdf() {
    if (!file) return toast.error("Escolha um arquivo PDF primeiro.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return toast.error("O arquivo precisa estar no formato PDF.");
    }
    if (file.size > 50 * 1024 * 1024) {
      return toast.error("O PDF deve ter no máximo 50 MB.");
    }

    setUploading(true);
    const storagePath = `${uid}/library/${crypto.randomUUID()}.pdf`;
    let uploaded = false;
    try {
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, file, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;
      uploaded = true;

      const { data: signed, error: signedError } = await supabase.storage
        .from("media")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);
      if (signedError || !signed) throw signedError ?? new Error("Não foi possível gerar o link do PDF.");

      const { error: insertError } = await supabase.from("library_pdfs").insert({
        title: title.trim() || file.name.replace(/\.pdf$/i, ""),
        category: category.trim() || "Materiais gerais",
        file_url: signed.signedUrl,
        storage_path: storagePath,
        created_by: uid,
      });
      if (insertError) {
        await supabase.storage.from("media").remove([storagePath]);
        throw insertError;
      }

      setFile(null);
      setTitle("");
      toast.success("PDF adicionado à biblioteca!");
      await qc.invalidateQueries({ queryKey: ["admin-library-pdfs"] });
      await qc.invalidateQueries({ queryKey: ["materials-library"] });
      const input = document.getElementById("library-pdf-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (err) {
      if (uploaded) {
        await supabase.storage.from("media").remove([storagePath]);
      }
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Não foi possível adicionar o PDF: ${message}`);
    } finally {
      setUploading(false);
    }
  }

  async function removePdf(pdf: LibraryPdf) {
    if (!confirm(`Remover “${pdf.title}” da biblioteca?`)) return;
    setDeletingId(pdf.id);
    try {
      const { error: rowError } = await supabase.from("library_pdfs").delete().eq("id", pdf.id);
      if (rowError) throw rowError;
      const { error: storageError } = await supabase.storage.from("media").remove([pdf.storage_path]);
      if (storageError) {
        toast.error(`O registro foi removido, mas o arquivo armazenado não foi excluído: ${storageError.message}`);
      } else {
        toast.success("PDF removido da biblioteca.");
      }
      await qc.invalidateQueries({ queryKey: ["admin-library-pdfs"] });
      await qc.invalidateQueries({ queryKey: ["materials-library"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Não foi possível remover o PDF: ${message}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-4 space-y-6">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-2xl font-bold">Biblioteca de PDFs</h2>
        <p className="text-sm text-muted-foreground">Adicione materiais diretamente à biblioteca, sem precisar criar uma matéria ou tópico.</p>
      </div>

      <div className="max-w-3xl space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="library-pdf-file">Arquivo PDF</Label>
          <Input id="library-pdf-file" type="file" accept=".pdf,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <p className="text-xs text-muted-foreground">Tamanho máximo: 50 MB.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="library-pdf-title">Nome do material</Label>
            <Input id="library-pdf-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Apostila de funções" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="library-pdf-category">Matéria ou categoria</Label>
            <Input id="library-pdf-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex.: Matemática" />
          </div>
        </div>
        <Button onClick={() => void addPdf()} disabled={!file || uploading}>
          <UploadCloud className="mr-2 h-4 w-4" />
          {uploading ? "Enviando PDF..." : "Adicionar à biblioteca"}
        </Button>
      </div>

      <div className="max-w-4xl space-y-3">
        <h3 className="text-lg font-semibold">PDFs cadastrados ({pdfs?.length ?? 0})</h3>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando PDFs...</p>}
        {error && <p className="text-sm text-destructive">Erro ao carregar PDFs: {error.message}</p>}
        {!isLoading && !error && pdfs?.length === 0 && (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nenhum PDF adicionado ainda.</p>
        )}
        <div className="space-y-2">
          {pdfs?.map((pdf) => (
            <div key={pdf.id} className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{pdf.title}</p>
                <p className="text-xs text-muted-foreground">{pdf.category} · {new Date(pdf.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline"><a href={pdf.file_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Abrir</a></Button>
                <Button size="sm" variant="destructive" onClick={() => void removePdf(pdf)} disabled={deletingId === pdf.id}>
                  <Trash2 className="mr-1 h-4 w-4" />{deletingId === pdf.id ? "Removendo..." : "Remover"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reports() {
  const qc = useQueryClient();
  const { data: profiles } = useProfiles();
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function act(
    report: NonNullable<typeof data>[number],
    action: "archived" | "banned",
  ) {
    if (report.target_type === "comment") {
      const { error } = await supabase
        .from("comments")
        .update({ archived: true })
        .eq("id", report.target_id);
      if (error) return toast.error(error.message);
    }

    if (report.target_type === "message" && action === "archived") {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", report.target_id);
      if (error) return toast.error(error.message);
    }

    if (action === "banned" && report.target_user_id) {
      const { error } = await supabase.rpc("admin_set_ban", {
        _user: report.target_user_id,
        _banned: true,
      });
      if (error) return toast.error(error.message);
    }

    const { error } = await supabase
      .from("reports")
      .update({ status: action })
      .eq("id", report.id);
    if (error) return toast.error(error.message);

    toast.success(action === "banned" ? "Usuário banido" : "Arquivado");
    void qc.invalidateQueries();
  }

  return (
    <ul className="mt-4 space-y-3">
      {data?.map((report) => (
        <li key={report.id} className="rounded-xl border bg-card p-4">
          <div className="text-xs font-bold uppercase text-muted-foreground">
            {report.target_type} · por {profiles?.byId[report.reporter_id]?.display_name}
          </div>
          <div className="mt-1">
            Alvo: <b>{report.target_user_id ? profiles?.byId[report.target_user_id]?.display_name : report.target_id}</b>
          </div>
          <p className="mt-1 text-sm">“{report.reason}”</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void act(report, "archived")}>
              Arquivar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void act(report, "banned")}
              disabled={!report.target_user_id}
            >
              Banir usuário
            </Button>
          </div>
        </li>
      ))}
      {data?.length === 0 && (
        <p className="text-muted-foreground">Nenhuma denúncia pendente. 🎉</p>
      )}
    </ul>
  );
}

function Users() {
  const qc = useQueryClient();
  const { data } = useProfiles();

  return (
    <ul className="mt-4 divide-y rounded-xl border bg-card">
      {data?.list.map((profile) => (
        <li key={profile.id} className="flex items-center gap-3 px-4 py-2">
          <span className="flex-1">
            {profile.display_name}{" "}
            <span className="text-sm text-muted-foreground">· {profile.points} pts</span>
          </span>
          <Button
            size="sm"
            variant={profile.banned ? "outline" : "destructive"}
            onClick={async () => {
              const { error } = await supabase.rpc("admin_set_ban", {
                _user: profile.id,
                _banned: !profile.banned,
              });
              if (error) return toast.error(error.message);
              toast.success(profile.banned ? "Usuário desbanido." : "Usuário banido.");
              void qc.invalidateQueries({ queryKey: ["profiles"] });
            }}
          >
            {profile.banned ? "Desbanir" : "Banir"}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function Theme() {
  const [primary, setPrimary] = useState("#2563eb");
  const [accent, setAccent] = useState("#f59e0b");

  useEffect(() => {
    let active = true;
    supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error(`Não foi possível carregar o tema: ${error.message}`);
          return;
        }
        if (data) {
          setPrimary(data.primary_color);
          setAccent(data.accent_color);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    const { error } = await supabase
      .from("app_settings")
      .update({ primary_color: primary, accent_color: accent })
      .eq("id", 1);

    if (error) return toast.error(error.message);

    const root = document.documentElement.style;
    root.setProperty("--primary", primary);
    root.setProperty("--ring", primary);
    root.setProperty("--highlight", accent);
    toast.success("Tema aplicado para todos!");
  }

  return (
    <div className="mt-4 max-w-sm space-y-4">
      <div>
        <Label>Cor principal</Label>
        <Input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
      </div>
      <div>
        <Label>Cor de destaque</Label>
        <Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
      </div>
      <Button onClick={() => void save()}>Salvar tema</Button>
    </div>
  );
}
