import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, FlaskConical, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Trilha Viva — Aprenda, pratique e crie" },
    { name: "description", content: "Estudos guiados, quizzes, projetos e simuladores interativos em um só lugar." },
    { property: "og:title", content: "Trilha Viva — Aprenda, pratique e crie" },
    { property: "og:description", content: "Uma plataforma para aprender, praticar e acompanhar sua evolução." },
    { property: "og:type", content: "website" },
  ] }),
  component: Landing,
});

const SUBJECTS = [
  ["📖", "Português", "Leitura e interpretação"],
  ["➗", "Matemática", "Raciocínio e prática"],
  ["🧲", "Física", "Leis e experimentos"],
  ["⚗️", "Química", "Matéria e transformação"],
  ["🇬🇧", "Inglês", "Vocabulário e compreensão"],
];

function Landing() {
  return (
    <div className="tv-landing min-h-screen text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3 font-display text-lg font-extrabold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400 text-xl text-slate-950 shadow-lg shadow-sky-500/20">✦</span><span>TRILHA VIVA<small className="block text-[10px] font-semibold uppercase tracking-[.2em] text-slate-400">Learning club</small></span></Link>
        <div className="flex items-center gap-2"><Link to="/auth" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">Entrar</Link><Button asChild className="rounded-xl"><Link to="/auth">Criar conta <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
      </header>
      <main className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <section className="tv-hero relative mt-5 overflow-hidden rounded-[30px] border border-sky-300/20 px-6 py-12 shadow-2xl sm:px-12 sm:py-16 lg:mt-10 lg:grid lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-10">
          <div className="relative z-10"><span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[.17em] text-sky-200"><span>✦</span> Aprender · explorar · construir</span><h1 className="mt-7 max-w-3xl font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">Seu próximo conhecimento <span className="text-sky-300">começa aqui.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Guia de estudos, quizzes bem elaborados, projetos e laboratório virtual: tudo reunido para você aprender no seu ritmo e acompanhar seu progresso.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="rounded-xl"><Link to="/auth">Começar minha jornada <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"><Link to="/auth">Já tenho uma conta</Link></Button></div></div>
          <div className="relative mt-12 grid grid-cols-2 gap-3 lg:mt-0">{SUBJECTS.map(([icon, name, subtitle], i) => <div key={name} className={`rounded-2xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur sm:p-5 ${i === 4 ? "col-span-2" : ""}`}><div className="text-3xl">{icon}</div><div className="mt-3 font-display text-lg font-bold">{name}</div><div className="mt-1 text-xs text-slate-400">{subtitle}</div></div>)}</div>
        </section>
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <FeatureCard icon={<BookOpen className="h-5 w-5" />} eyebrow="Estude com método" title="Guias que ajudam a avançar" description="Trilhas por matéria, aulas com explicações, vídeos, PDFs e atividades para praticar cada tópico." href="/auth" action="Explorar trilhas" />
          <FeatureCard icon={<Trophy className="h-5 w-5" />} eyebrow="Pratique e evolua" title="Quizzes com ranking" description="Responda questões, acompanhe seu progresso e compare resultados com a comunidade." href="/auth" action="Ver quizzes" />
          <FeatureCard icon={<FlaskConical className="h-5 w-5" />} eyebrow="Aprendizagem prática" title="Projetos modelo e simuladores" description="Explore a ponte de palitos e as rotações com quatérnios no laboratório virtual." href="/auth" action="Acessar laboratório" />
        </section>
        <section className="mt-14 flex flex-col justify-between gap-5 rounded-3xl border border-white/10 bg-white/[.035] p-6 sm:flex-row sm:items-center sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-lime-300">Seu progresso, no seu espaço</p><h2 className="mt-2 font-display text-2xl font-extrabold">Estude. Jogue. Construa. Repita.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Entre para salvar seus resultados e acessar suas trilhas, perfil, projetos e recursos da comunidade.</p></div><Button asChild size="lg" className="shrink-0 rounded-xl"><Link to="/auth">Entrar ou criar conta <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, eyebrow, title, description, href, action }: { icon: React.ReactNode; eyebrow: string; title: string; description: string; href: "/auth"; action: string }) {
  return <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 transition hover:-translate-y-1 hover:border-sky-300/30"><div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300">{icon}</div><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-sky-300">{eyebrow}</p><h2 className="mt-2 font-display text-xl font-bold">{title}</h2><p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-400">{description}</p><Link to={href} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-sky-300">{action}<ArrowRight className="h-4 w-4" /></Link></article>;
}
