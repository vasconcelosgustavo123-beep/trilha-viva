import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, ExternalLink, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/simuladores")({
  head: () => ({
    meta: [
      { title: "Laboratório Virtual 3D — Trilha Viva" },
      { name: "description", content: "Simuladores interativos de ponte de palitos e rotações com quatérnios." },
    ],
  }),
  component: SimuladoresPage,
});

export function SimuladoresPage() {
  const [activeSim, setActiveSim] = useState<"ponte" | "quaternios">("ponte");
  const [fullscreen, setFullscreen] = useState(false);

  const simUrl = activeSim === "ponte" ? "/simulador-ponte.html" : "/simulador-quaternios.html";
  const simTitle = activeSim === "ponte" ? "Ponte de Palitos 3D" : "Rotações com Quatérnios";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Experimente na prática
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Laboratório Virtual 3D
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse os simuladores interativos de engenharia e matemática da Trilha Viva.
        </p>
      </div>

      {/* Cards de Seleção dos Simuladores */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card Ponte */}
        <div
          onClick={() => setActiveSim("ponte")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            activeSim === "ponte"
              ? "border-primary bg-primary/10 shadow-lg ring-1 ring-primary/40"
              : "border-border bg-card/60 hover:border-primary/50"
          }`}
        >
          <div className="text-3xl">🌉</div>
          <h2 className="mt-3 text-lg font-bold text-foreground">Simulador de Ponte 3D</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Monte estruturas com palitos, ajuste o vão, aplique testes de carga e analise esforços em tempo real.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${activeSim === "ponte" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {activeSim === "ponte" ? "● Visualizando" : "Selecionar"}
            </span>
            <a
              href="/simulador-ponte.html"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition"
            >
              Nova aba <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Card Quatérnios */}
        <div
          onClick={() => setActiveSim("quaternios")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            activeSim === "quaternios"
              ? "border-primary bg-primary/10 shadow-lg ring-1 ring-primary/40"
              : "border-border bg-card/60 hover:border-primary/50"
          }`}
        >
          <div className="text-3xl">🌀</div>
          <h2 className="mt-3 text-lg font-bold text-foreground">Simulador de Quatérnios</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Visualize rotações espaciais tridimensionais sem Gimbal Lock e compreenda a álgebra hipercomplexa.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${activeSim === "quaternios" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {activeSim === "quaternios" ? "● Visualizando" : "Selecionar"}
            </span>
            <a
              href="/simulador-quaternios.html"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition"
            >
              Nova aba <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Janela de Visualização Integrada do Simulador */}
      <div className={`overflow-hidden rounded-2xl border border-border bg-[#0d131f] shadow-2xl transition-all ${fullscreen ? "fixed inset-4 z-50 m-0" : ""}`}>
        {/* Barra superior do player */}
        <div className="flex items-center justify-between border-b border-border/60 bg-[#121a2b] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-foreground">{simTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                const ifr = document.getElementById("sim-frame") as HTMLIFrameElement;
                if (ifr) ifr.src = ifr.src;
              }}
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Reiniciar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setFullscreen(!fullscreen)}
            >
              <Maximize2 className="mr-1 h-3 w-3" /> {fullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            </Button>
            <a
              href={simUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/30 transition"
            >
              Abrir em Nova Aba ↗
            </a>
          </div>
        </div>

        {/* Quadro IFrame com o Simulador 3D */}
        <div className="relative w-full bg-[#12141a]" style={{ height: fullscreen ? "calc(100vh - 80px)" : "620px" }}>
          <iframe
            id="sim-frame"
            src={simUrl}
            title={simTitle}
            className="h-full w-full border-0"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
