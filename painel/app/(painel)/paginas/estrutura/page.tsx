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
import { useMemo, useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Intencao, Pagina, TipoPagina } from "@/mock/types";

/* ---------------------------------------------------------------- helpers */

const TIPO_ICONE: Record<TipoPagina, typeof Globe> = {
  money: Star,
  pilar: TreeDeciduous,
  supporting: FileText,
  institucional: Globe,
};

const TIPO_COR: Record<TipoPagina, string> = {
  money: "text-danger",
  pilar: "text-primary",
  supporting: "text-success",
  institucional: "text-ink-muted",
};

const INTENCAO_COR: Record<Intencao, string> = {
  T: "bg-danger/10 text-danger border-danger/30",
  C: "bg-accent/10 text-accent border-accent/30",
  I: "bg-primary/10 text-primary border-primary/30",
  N: "bg-success/10 text-success border-success/30",
};

const INTENCAO_DETALHE: Record<Intencao, string> = {
  T: "Transacional",
  C: "Comercial",
  I: "Informacional",
  N: "Navegacional",
};

/* LinkFlow targets (mocked) */
const METAS_INTENCAO: Record<Intencao, number> = { T: 4, C: 2, I: 3, N: 2 };

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
      mensagem: "Money pages com nível > 2 (muito enterradas na arquitetura)",
      paginas: moneyProfundas.map((p) => p.titulo),
    });
  }

  const orfas = paginas.filter((p) => p.linksRecebidos === 0);
  if (orfas.length > 0) {
    diags.push({
      tipo: "erro",
      mensagem: "Páginas sem links internos recebidos",
      paginas: orfas.map((p) => p.titulo),
    });
  }

  const clustersComPaginas = new Map<string, Pagina[]>();
  for (const p of paginas) {
    if (p.cluster) {
      if (!clustersComPaginas.has(p.cluster)) clustersComPaginas.set(p.cluster, []);
      clustersComPaginas.get(p.cluster)!.push(p);
    }
  }
  for (const [cluster, pags] of clustersComPaginas) {
    const temPilar = pags.some((p) => p.tipo === "pilar");
    if (!temPilar) {
      diags.push({
        tipo: "aviso",
        mensagem: `Cluster "${cluster}" sem página pilar`,
        paginas: [],
      });
    }
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
  const { paginas: paginasMock } = useStore();
  const [paginas, setPaginas] = useState<typeof paginasMock>([]);

  useEffect(() => {
    fetch("/api/paginas")
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.paginas)) {
          setPaginas(data.paginas);
        } else {
          setPaginas(paginasMock);
        }
      })
      .catch(() => setPaginas(paginasMock));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const arvore = useMemo(() => buildTree(paginas), [paginas]);
  const diagnosticos = useMemo(() => calcularDiagnosticos(paginas), [paginas]);

  const contIntencao = useMemo(() => {
    const c: Record<Intencao, number> = { T: 0, C: 0, I: 0, N: 0 };
    for (const p of paginas) c[p.intencao]++;
    return c;
  }, [paginas]);

  return (
    <div className="flex flex-col gap-0">
      {/* cabeçalho */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
            Estrutura do site
          </h1>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">
            Hierarquia de páginas definida pelo LinkFlow
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
            {(["money", "pilar", "supporting", "institucional"] as TipoPagina[]).map((t) => {
              const Icone = TIPO_ICONE[t];
              const labels: Record<TipoPagina, string> = {
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
          {/* distribuição de intenção */}
          <div className="p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Distribuição de intenção
            </p>
            <div className="space-y-2.5">
              {(["T", "C", "I", "N"] as Intencao[]).map((int) => {
                const atual = contIntencao[int];
                const meta = METAS_INTENCAO[int];
                const ok = atual >= meta;
                return (
                  <div key={int} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] text-ink">
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold",
                            INTENCAO_COR[int],
                          )}
                        >
                          {int}
                        </span>
                        {INTENCAO_DETALHE[int]}
                      </span>
                      <span className={cn("font-mono text-[11.5px]", ok ? "text-success" : "text-danger")}>
                        {atual} / {meta}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          ok ? "bg-success" : "bg-danger",
                        )}
                        style={{ width: `${Math.min(100, (atual / meta) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2.5 text-[10.5px] text-ink-muted">
              Metas definidas pelo LinkFlow
            </p>
          </div>

          {/* diagnósticos */}
          <div className="p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Diagnóstico
            </p>
            {diagnosticos.length === 0 ? (
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
          {/* intenção */}
          <span
            title={INTENCAO_DETALHE[pagina.intencao]}
            className={cn(
              "inline-flex h-[18px] w-[18px] items-center justify-center rounded border text-[9.5px] font-bold",
              INTENCAO_COR[pagina.intencao],
            )}
          >
            {pagina.intencao}
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
