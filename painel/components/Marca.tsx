"use client";

import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Marca do painel.
 *
 * Prop `escuro={true}`: força o SVG de contingência com texto branco —
 * usado na sidebar escura, onde PNGs com fundo branco não funcionam.
 * Sem essa prop, tenta carregar o arquivo PNG de public/marca/.
 *
 *   public/marca/linkflow.png          → símbolo isolado
 *   public/marca/linkflow-completa.png → lockup horizontal (login, etc.)
 */

const ARQUIVO = {
  simbolo: "/marca/linkflow.png",
  completa: "/marca/linkflow-completa.png",
};

export function Marca({
  tamanho = 26,
  variante = "simbolo",
  escuro = false,
  apenasSVG = false,
  className,
}: {
  tamanho?: number;
  variante?: "simbolo" | "completa";
  escuro?: boolean;
  apenasSVG?: boolean;
  className?: string;
}) {
  const [semArquivo, setSemArquivo] = useState(false);

  const conferir = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setSemArquivo(true);
  }, []);

  if (escuro || semArquivo || apenasSVG) {
    return <MarcaSVG tamanho={tamanho} variante={variante} escuro={escuro} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={conferir}
      src={ARQUIVO[variante]}
      alt="SiteFlow"
      height={tamanho}
      style={{ height: tamanho, width: "auto" }}
      className={cn("select-none", className)}
      onError={() => setSemArquivo(true)}
      draggable={false}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SVG — símbolo com gradiente da marca + wordmark opcional             */
/* ------------------------------------------------------------------ */

const CABECA_A = { x: 50, y: 24 };
const CAUDA_A = { x: 27.46, y: 64.2 };
const TOPO_B = { x: 71.9, y: 36.3 };
const CABECA_B = { x: 49.36, y: 76.5 };
const CANAL_A = { x1: 41.18, y1: 39.73, x2: 29.42, y2: 60.7 };
const CANAL_B = { x1: 69.94, y1: 39.8, x2: 58.18, y2: 60.77 };
const LARGURA_ELO = 16.8;
const LARGURA_CANAL = 6;
const RAIO_CABECA = 11.5;
const RAIO_FURO = 4.6;

function Simbolo({ tamanho, className }: { tamanho: number; className?: string }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="SiteFlow"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient
          id="marca-a"
          x1={CABECA_A.x}
          y1={CABECA_A.y}
          x2={CAUDA_A.x}
          y2={CAUDA_A.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--marca-a1)" />
          <stop offset="50%" stopColor="var(--marca-a2)" />
          <stop offset="82%" stopColor="var(--marca-a3)" />
          <stop offset="100%" stopColor="var(--marca-a4)" />
        </linearGradient>
        <linearGradient
          id="marca-b"
          x1={TOPO_B.x}
          y1={TOPO_B.y}
          x2={CABECA_B.x}
          y2={CABECA_B.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--marca-b1)" />
          <stop offset="32%" stopColor="var(--marca-b2)" />
          <stop offset="62%" stopColor="var(--marca-b3)" />
          <stop offset="100%" stopColor="var(--marca-b4)" />
        </linearGradient>

        <mask id="marca-vazado-a">
          <rect width="100" height="100" fill="white" />
          <circle cx={CABECA_A.x} cy={CABECA_A.y} r={RAIO_FURO} fill="black" />
          <line
            x1={CANAL_A.x1}
            y1={CANAL_A.y1}
            x2={CANAL_A.x2}
            y2={CANAL_A.y2}
            stroke="black"
            strokeWidth={LARGURA_CANAL}
            strokeLinecap="round"
          />
        </mask>
        <mask id="marca-vazado-b">
          <rect width="100" height="100" fill="white" />
          <circle cx={CABECA_B.x} cy={CABECA_B.y} r={RAIO_FURO} fill="black" />
          <line
            x1={CANAL_B.x1}
            y1={CANAL_B.y1}
            x2={CANAL_B.x2}
            y2={CANAL_B.y2}
            stroke="black"
            strokeWidth={LARGURA_CANAL}
            strokeLinecap="round"
          />
        </mask>
      </defs>

      <g mask="url(#marca-vazado-a)">
        <line
          x1={CABECA_A.x}
          y1={CABECA_A.y}
          x2={CAUDA_A.x}
          y2={CAUDA_A.y}
          stroke="url(#marca-a)"
          strokeWidth={LARGURA_ELO}
          strokeLinecap="round"
        />
        <circle cx={CABECA_A.x} cy={CABECA_A.y} r={RAIO_CABECA} fill="url(#marca-a)" />
      </g>

      <g mask="url(#marca-vazado-b)">
        <line
          x1={TOPO_B.x}
          y1={TOPO_B.y}
          x2={CABECA_B.x}
          y2={CABECA_B.y}
          stroke="url(#marca-b)"
          strokeWidth={LARGURA_ELO}
          strokeLinecap="round"
        />
        <circle cx={CABECA_B.x} cy={CABECA_B.y} r={RAIO_CABECA} fill="url(#marca-b)" />
      </g>
    </svg>
  );
}

function MarcaSVG({
  tamanho,
  variante,
  escuro,
  className,
}: {
  tamanho: number;
  variante: "simbolo" | "completa";
  escuro: boolean;
  className?: string;
}) {
  if (variante === "completa") {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        <Simbolo tamanho={tamanho} />
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            escuro ? "text-white" : "text-ink",
          )}
          style={{ fontSize: tamanho * 0.72, lineHeight: 1 }}
        >
          SiteFlow
        </span>
      </span>
    );
  }

  return <Simbolo tamanho={tamanho} className={className} />;
}
