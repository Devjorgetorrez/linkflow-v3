"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  GripVertical,
  Info,
  Lock,
  Star,
  TreeDeciduous,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { usePaginasReais } from "@/lib/usePaginasReais";
import type { Pagina, TipoPagina } from "@/mock/types";

/* ---------------------------------------------------------------- helpers */

const TIPO_ICONE: Record<TipoPagina, typeof Globe> = {
  home: Globe,
  money: Star,
  pilar: TreeDeciduous,
  supporting: FileText,
  institucional: Globe,
};

const TIPO_COR: Record<TipoPagina, string> = {
  home: "text-success",
  money: "text-danger",
  pilar: "text-primary",
  supporting: "text-success",
  institucional: "text-ink-muted",
};

interface NoPagina {
  pagina: Pagina;
  filhos: NoPagina[];
}

function buildTree(paginas: Pagina[]): NoPagina[] {
  const map = new Map<string, NoPagina>();
  for (const p of paginas) {
    map.set(p.id, { pagina: p, filhos: [] });
  }
  const raizes: NoPagina[] = [];
  for (const no of map.values()) {
    const paiId = no.pagina.paiId;
    if (!paiId || !map.has(paiId)) {
      raizes.push(no);
    } else {
      map.get(paiId)!.filhos.push(no);
    }
  }
  return raizes;
}

/* ---------------------------------------------------------------- diagnostics */

interface Diagnostico {
  tipo: "erro" | "aviso" | "info";
  mensagem: string;
  paginas: string[];
}

function calcularDiagnosticos(paginas: Pagina[]): Diagnostico[] {
  const diags: Diagnostico[] = [];

  const moneyProfundas = paginas.filter((p) => p.tipo === "money" && p.nivel >= 3);
  if (moneyProfundas.length > 0) {
    diags.push({
      tipo: "erro",
      mensagem: "Money pages a mais de 2 cliques da home (muito enterradas)",
      paginas: moneyProfundas.map((p) => p.titulo),
    });
  }

  const orfas = paginas.filter((p) => p.linksRecebidos === 0);
  if (orfas.length > 0) {
    diags.push({
      tipo: "erro",
      mensagem: "Páginas que nenhuma outra página linka (órfãs)",
      paginas: orfas.map((p) => p.titulo),
    });
  }

  const pilaresEncontrados = paginas.filter((p) => p.tipo === "pilar");
  for (const pilar of pilaresEncontrados) {
    const filhosMoneyCount = paginas.filter(
      (p) => p.paiId === pilar.id && p.tipo === "money",
    ).length;
    if (filhosMoneyCount === 0) {
      diags.push({
        tipo: "info",
        mensagem: `Pilar "${pilar.titulo}" sem money pages filhas`,
        paginas: [],
      });
    }
  }

  return diags;
}

/* ---------------------------------------------------------------- page */

export default function EstruturaPaginasPage() {
  const { paginas, carregando, origemRotulo, erro } = usePaginasReais();

  const arvore = useMemo(() => buildTree(paginas), [paginas]);
  const diagnosticos = useMemo(() => calcularDiagnosticos(paginas), [paginas]);

  return (
    <div className="flex flex-col gap-0">
      {/* cabeçalho */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
            Estrutura do site
          </h1>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">
            {carregando
              ? "Lendo o site…"
              : `Silos pela coleção de conteúdo de cada página; nível e links são os reais do site${origemRotulo ? ` (lido de: ${origemRotulo})` : ""}`}
          </p>
        </div>
        <Link
          href="/paginas"
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-line bg-surface-2 px-3 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          ← Lista de páginas
        </Link>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        {/* árvore */}
        <div className="border-r border-line">
          {/* aviso drag */}
          <div className="flex items-center gap-2 border-b border-line bg-accent/5 px-6 py-2.5">
            <Lock size={12} className="shrink-0 text-accent" />
            <p className="text-[11.5px] text-accent">
              Mover página na árvore altera a arquitetura. Solicite ao LinkFlow.
            </p>
          </div>

          {/* legenda de tipos */}
          <div className="flex items-center gap-4 border-b border-line px-6 py-2">
            {(["home", "money", "pilar", "supporting", "institucional"] as TipoPagina[]).map((t) => {
              const Icone = TIPO_ICONE[t];
              const labels: Record<TipoPagina, string> = {
                home: "Home",
                money: "Money",
                pilar: "Pilar",
                supporting: "Supporting",
                institucional: "Institucional",
              };
              return (
                <span key={t} className="flex items-center gap-1 text-[11px] text-ink-muted">
                  <Icone size={11} className={TIPO_COR[t]} />
                  {labels[t]}
                </span>
              );
            })}
          </div>

          {/* nós da árvore */}
          <div className="p-4">
            {arvore.map((no) => (
              <NoArvore key={no.pagina.id} no={no} profundidade={0} />
            ))}
          </div>
        </div>

        {/* painel lateral */}
        <div className="flex flex-col gap-0 divide-y divide-line">
          {/* diagnósticos */}
          <div className="p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Diagnóstico
            </p>
            {erro ? (
              <p className="text-[12px] text-[#b45309]">{erro}</p>
            ) : carregando ? (
              <p className="text-[12px] text-ink-muted">Lendo o site…</p>
            ) : paginas.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Nenhuma página: o site ainda não foi gerado.</p>
            ) : diagnosticos.length === 0 ? (
              <p className="text-[12px] text-success">Nenhum problema encontrado</p>
            ) : (
              <div className="space-y-2.5">
                {diagnosticos.map((d, i) => (
                  <div key={i} className="rounded-[var(--radius)] border border-line bg-surface p-2.5">
                    <div className="flex items-start gap-2">
                      {d.tipo === "erro" ? (
                        <AlertTriangle size={13} className="mt-[1px] shrink-0 text-danger" />
                      ) : d.tipo === "aviso" ? (
                        <AlertTriangle size={13} className="mt-[1px] shrink-0 text-accent" />
                      ) : (
                        <Info size={13} className="mt-[1px] shrink-0 text-primary" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-medium text-ink">{d.mensagem}</p>
                        {d.paginas.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {d.paginas.map((titulo) => (
                              <li key={titulo} className="text-[10.5px] text-ink-muted">
                                · {titulo}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* legenda drag */}
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-[var(--radius)] border border-dashed border-line p-3">
              <GripVertical size={13} className="shrink-0 text-ink-muted/40" />
              <p className="text-[11px] text-ink-muted">
                Reorganização da hierarquia desabilitada. Solicite ao LinkFlow para mover páginas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- tree node */

function NoArvore({ no, profundidade }: { no: NoPagina; profundidade: number }) {
  const [aberto, setAberto] = useState(true);
  const temFilhos = no.filhos.length > 0;
  const { pagina } = no;
  const Icone = TIPO_ICONE[pagina.tipo];

  return (
    <div className="min-w-0">
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-[var(--radius)] py-1.5 pr-2 text-[12.5px] transition-colors hover:bg-secondary/60",
        )}
        style={{ paddingLeft: `${profundidade * 20 + 4}px` }}
      >
        {/* expandir */}
        {temFilhos ? (
          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-ink-muted hover:text-ink"
          >
            {aberto ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}

        {/* ícone de tipo */}
        <Icone size={13} className={cn("shrink-0", TIPO_COR[pagina.tipo])} />

        {/* título */}
        <Link
          href={`/paginas/${pagina.id}`}
          className="min-w-0 flex-1 truncate font-medium text-ink hover:text-primary"
        >
          {pagina.titulo}
        </Link>

        {/* url */}
        <span className="hidden truncate font-mono text-[10.5px] text-ink-muted lg:block" style={{ maxWidth: 160 }}>
          {pagina.url}
        </span>

        {/* badges */}
        <div className="flex shrink-0 items-center gap-1">
          {/* nível real: cliques a partir da home */}
          <span
            title={`${pagina.nivel} clique${pagina.nivel === 1 ? "" : "s"} a partir da home`}
            className="font-mono text-[10px] text-ink-muted/60"
          >
            n{pagina.nivel}
          </span>

          {/* status */}
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              pagina.status === "publicado" ? "bg-success" : "bg-ink-muted/40",
            )}
            title={pagina.status}
          />

          {/* links recebidos */}
          <span
            title={`${pagina.linksRecebidos} links internos recebidos`}
            className={cn(
              "font-mono text-[10px]",
              pagina.linksRecebidos === 0 ? "text-danger" : "text-ink-muted/60",
            )}
          >
            ↑{pagina.linksRecebidos}
          </span>
        </div>
      </div>

      {/* filhos */}
      {temFilhos && aberto && (
        <div>
          {no.filhos.map((filho) => (
            <NoArvore key={filho.pagina.id} no={filho} profundidade={profundidade + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
