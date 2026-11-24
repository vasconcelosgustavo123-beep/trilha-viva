import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, Download, FileText, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/materiais")({
  component: BibliotecaPdfs,
});

type LessonMaterial = {
  id: string;
  title: string;
  pdf_url: string | null;
  position: number | null;
  category?: string;
};

type SubjectWithLessons = {
  id: string;
  name: string;
  icon: string | null;
  position: number | null;
  lessons: LessonMaterial[] | null;
};

type MaterialGroup = {
  id: string;
  nome: string;
  icone: string;
  pdfs: LessonMaterial[];
};

const FAVORITES_KEY = "trilha-favs";

function BibliotecaPdfs() {
  const [busca, setBusca] = useState("");
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  // Os PDFs são os mesmos cadastrados no painel admin, no campo lessons.pdf_url.
  const {
    data: libraryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["materials-library"],
    queryFn: async (): Promise<{ subjects: SubjectWithLessons[]; standalonePdfs: LessonMaterial[] }> => {
      // Duas consultas evitam depender de uma relação reversa ausente
      // nos tipos gerados do Supabase (subjects -> lessons).
      const { data: subjectRows, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, name, icon, position")
        .order("position", { ascending: true });
      if (subjectsError) throw subjectsError;

      const { data: lessonRows, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, subject_id, title, pdf_url, position")
        .order("position", { ascending: true });
      if (lessonsError) throw lessonsError;

      const { data: standaloneRows, error: standaloneError } = await supabase
        .from("library_pdfs")
        .select("id, title, category, file_url, created_at")
        .order("created_at", { ascending: false });
      if (standaloneError) throw standaloneError;

      return {
        subjects: (subjectRows ?? []).map((subject) => ({
          ...subject,
          lessons: (lessonRows ?? []).filter((lesson) => lesson.subject_id === subject.id),
        })),
        standalonePdfs: (standaloneRows ?? []).map((pdf) => ({
          id: pdf.id,
          title: pdf.title,
          pdf_url: pdf.file_url,
          position: 0,
          category: pdf.category,
        })),
      };
    },
  });

  const subjects = libraryData?.subjects ?? [];
  const standalonePdfs = libraryData?.standalonePdfs ?? [];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      setFavoritos(
        Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string")
          : [],
      );
    } catch {
      setFavoritos([]);
    } finally {
      setFavoritesLoaded(true);
    }
  }, []);

  function toggleFavorito(id: string) {
    setFavoritos((current) => {
      const updated = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch {
        // A biblioteca continua utilizável mesmo se o navegador bloquear o armazenamento.
      }
      return updated;
    });
  }

  const grupos = useMemo<MaterialGroup[]>(() => {
    const lessonGroups = subjects
      .map((subject) => ({
        id: subject.id,
        nome: subject.name,
        icone: subject.icon || "📚",
        pdfs: [...(subject.lessons ?? [])]
          .filter(
            (lesson) =>
              typeof lesson.pdf_url === "string" &&
              lesson.pdf_url.trim() !== "" &&
              lesson.pdf_url.trim() !== "#",
          )
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      }))
      .filter((group) => group.pdfs.length > 0);

    const standaloneGroups = Array.from(
      standalonePdfs.reduce((groups, pdf) => {
        const category = pdf.category || "Materiais gerais";
        const current = groups.get(category) ?? [];
        current.push(pdf);
        groups.set(category, current);
        return groups;
      }, new Map<string, LessonMaterial[]>()),
    ).map(([category, pdfs]) => ({
      id: `library-${category}`,
      nome: category,
      icone: "📄",
      pdfs,
    }));

    return [...standaloneGroups, ...lessonGroups];
  }, [subjects, standalonePdfs]);

  const query = busca.trim().toLocaleLowerCase("pt-BR");

  const gruposFiltrados = grupos
    .map((grupo) => ({
      ...grupo,
      pdfs: grupo.pdfs.filter((pdf) => {
        const correspondeBusca =
          pdf.title.toLocaleLowerCase("pt-BR").includes(query) ||
          grupo.nome.toLocaleLowerCase("pt-BR").includes(query);
        const correspondeFavorito = !soFavoritos || favoritos.includes(pdf.id);
        return correspondeBusca && correspondeFavorito;
      }),
    }))
    .filter((grupo) => grupo.pdfs.length > 0);

  const totalMateriais = grupos.reduce((total, grupo) => total + grupo.pdfs.length, 0);

  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <header>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Conhecimento organizado
        </span>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
          Biblioteca de Estudos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Apostilas e materiais cadastrados pela administração, separados por matéria.
          Marque com estrela para guardar seus favoritos.
        </p>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar material ou matéria..."
            className="pl-9"
          />
        </div>

        <button
          type="button"
          onClick={() => setSoFavoritos((current) => !current)}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            soFavoritos
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-foreground"
          }`}
        >
          <Star className={`h-4 w-4 ${soFavoritos ? "fill-current" : ""}`} />
          {soFavoritos ? "Mostrando favoritos" : "Todos os materiais"}
        </button>
      </section>

      {isLoading && (
        <div className="rounded-xl border p-6 text-center text-muted-foreground">
          Carregando biblioteca de PDFs...
        </div>
      )}

      {error && (
        <div className="space-y-3 rounded-xl border border-destructive/40 p-5">
          <p className="font-semibold text-destructive">
            Não foi possível carregar os PDFs.
          </p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm font-semibold text-primary underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoading && !error && gruposFiltrados.length === 0 && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="font-bold">
            {soFavoritos
              ? "Nenhum PDF favoritado encontrado"
              : busca
                ? "Nenhum material corresponde à busca"
                : "Ainda não há PDFs publicados"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {soFavoritos
              ? "Marque a estrela de um PDF para encontrá-lo aqui."
              : busca
                ? "Tente pesquisar por outro título ou matéria."
                : "Quando a administração adicionar PDFs à biblioteca ou aos tópicos, eles aparecerão aqui."}
          </p>
        </div>
      )}

      {!isLoading && !error && gruposFiltrados.length > 0 && (
        <div className="space-y-6">
          {gruposFiltrados.map((grupo) => (
            <section
              key={grupo.id}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <span className="text-2xl">{grupo.icone}</span>
                  {grupo.nome}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {grupo.pdfs.length}{" "}
                  {grupo.pdfs.length === 1 ? "material" : "materiais"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {grupo.pdfs.map((pdf) => {
                  const isFavorite = favoritos.includes(pdf.id);
                  const url = pdf.pdf_url?.trim();
                  if (!url) return null;

                  return (
                    <article
                      key={pdf.id}
                      className="flex min-w-0 items-center justify-between gap-2 rounded-xl border bg-background/50 p-3 transition hover:border-primary/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {pdf.title}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {grupo.nome}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleFavorito(pdf.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:text-amber-500"
                          title={
                            isFavorite
                              ? "Remover dos favoritos"
                              : "Adicionar aos favoritos"
                          }
                          aria-label={
                            isFavorite
                              ? "Remover dos favoritos"
                              : "Adicionar aos favoritos"
                          }
                        >
                          <Star
                            className={`h-4 w-4 ${
                              isFavorite
                                ? "fill-amber-500 text-amber-500"
                                : ""
                            }`}
                          />
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted-foreground hover:text-primary"
                          title="Abrir PDF em uma nova aba"
                          aria-label={`Abrir PDF: ${pdf.title}`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {!isLoading && !error && totalMateriais > 0 && favoritesLoaded && (
        <p className="text-center text-xs text-muted-foreground">
          {totalMateriais} {totalMateriais === 1 ? "PDF cadastrado" : "PDFs cadastrados"} na biblioteca.
        </p>
      )}
    </main>
  );
}
