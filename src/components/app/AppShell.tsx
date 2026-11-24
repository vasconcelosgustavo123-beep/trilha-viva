import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, 
  ListOrdered, 
  Trophy, 
  MessagesSquare, 
  Rocket, 
  Shield, 
  LogOut, 
  FlaskConical, 
  FileText 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { UserAvatar } from "./UserAvatar";

const NAV = [
  { to: "/trilhas", label: "Trilhas de Estudo", icon: BookOpen },
  { to: "/materiais", label: "Biblioteca de PDFs", icon: FileText },
  { to: "/atividades", label: "Lista de Atividades", icon: ListOrdered },
  { to: "/ranking", label: "Ranking & Pódio", icon: Trophy },
  { to: "/espaco", label: "Espaço Comunitário", icon: Rocket },
  { to: "/simuladores", label: "Laboratório 3D", icon: FlaskConical },
  { to: "/chat", label: "Chat & Grupos", icon: MessagesSquare },
] as const;

export function AppShell() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const currentNav = NAV.find((n) => currentPath.startsWith(n.to));
  const currentPageTitle = currentNav ? currentNav.label : "Visão geral";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-[#e7eefb] font-sans">
      {/* SIDEBAR LATERAL FIXA (Estilo Trilha Viva) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#263650] bg-[#0c1321]/95 p-5 backdrop-blur-xl md:flex">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2 pb-6 pt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#2563eb] text-xl font-bold text-white shadow-[0_8px_24px_rgba(14,165,233,0.35)]">
            ✦
          </div>
          <div>
            <strong className="block text-base font-extrabold tracking-tight text-white font-display">
              TRILHA VIVA
            </strong>
            <small className="text-[10px] uppercase tracking-widest text-[#91a4c1]">
              Learning Club
            </small>
          </div>
        </div>

        {/* NAVEGAÇÃO / WORKSPACE */}
        <div className="px-2 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#647894]">
          Workspace
        </div>
        <nav className="mt-2 flex-1 space-y-1">
          {NAV.map((n) => {
            const active = currentPath.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  active
                    ? "border border-[#0ea5e9]/40 bg-gradient-to-r from-[#0ea5e9]/20 to-[#0ea5e9]/5 text-[#7dd3fc]"
                    : "text-[#aab9cf] hover:bg-[#18243a] hover:text-white"
                }`}
              >
                <n.icon className={`h-4 w-4 ${active ? "text-[#0ea5e9]" : "text-[#7dd3fc]/60"}`} />
                <span>{n.label}</span>
              </Link>
            );
          })}

          {me?.isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                currentPath.startsWith("/admin")
                  ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "text-[#aab9cf] hover:bg-[#18243a] hover:text-white"
              }`}
            >
              <Shield className="h-4 w-4 text-amber-400" />
              <span>Painel Admin</span>
            </Link>
          )}
        </nav>

        {/* CARD INFERIOR DA SIDEBAR */}
        <div className="mt-auto rounded-2xl border border-[#263650] bg-[#121a2b] p-3.5">
          <b className="flex items-center gap-1 text-xs text-white">
            <span className="text-[#0ea5e9]">✦</span> Seu espaço de estudo
          </b>
          <p className="mt-1 text-[11px] leading-relaxed text-[#91a4c1]">
            Aulas, simuladores 3D e quizzes integrados no mesmo ambiente.
          </p>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL COM TOPBAR */}
      <div className="flex flex-col md:pl-64">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#263650] bg-[#0c1321]/80 px-6 backdrop-blur-md">
          {/* Breadcrumb */}
          <div className="text-xs text-[#91a4c1]">
            Workspace <span className="text-[#50627c]"> / </span>
            <b className="text-white">{currentPageTitle}</b>
          </div>

          {/* Top Actions: Pontos, Perfil e Sair */}
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#263650] bg-[#121a2b] px-3 py-1 text-xs text-[#c4d2e7] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a3e635]"></span>
              Plataforma Ativa
            </span>

            <Link
              to="/perfil"
              className="flex items-center gap-2 rounded-full border border-[#263650] bg-[#121a2b] py-1 pl-1.5 pr-3 transition hover:border-[#0ea5e9]/50"
            >
              <UserAvatar profile={me?.profile} size={28} />
              <span className="text-xs font-bold text-[#a3e635]">
                {me?.profile?.points ?? 0} pts
              </span>
            </Link>

            <button
              onClick={signOut}
              className="rounded-lg p-2 text-[#91a4c1] transition hover:bg-[#18243a] hover:text-red-400"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* CONTEÚDO DAS PÁGINAS COM FUNDO RADIAL NEON */}
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-[radial-gradient(50rem_35rem_at_10%_-10%,rgba(14,165,233,0.15),transparent),radial-gradient(40rem_30rem_at_90%_5%,rgba(163,230,53,0.08),transparent)]">
          <Outlet />
        </main>
      </div>

      {/* NAVEGAÇÃO INFERIOR PARA TELAS MÓVEIS */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-[#263650] bg-[#0c1321] px-2 py-2 md:hidden">
        {NAV.slice(0, 5).map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-1 p-2 text-[10px] text-[#91a4c1]"
            activeProps={{ className: "text-[#0ea5e9] font-bold" }}
          >
            <n.icon className="h-4 w-4" />
            <span>{n.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
