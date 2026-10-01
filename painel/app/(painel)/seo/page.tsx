"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Info,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { carregarAuditoria, type ResultadoAuditoria } from "@/lib/auditoria-seo";
import type { Problema } from "@/motor/auditoria-tecnica";

/* ------------------------------------------------------------------ */

const ROTULO_BADGE: Record<string, string> = {
  home: "home",
  money: "money",
  pilar: "pilar",
  blog: "blog",
  supporting: "supporting",
  institucional: "inst.",
  categoria: "categoria",
  autor: "autor",
};

function BadgeProcedencia({ p }: { p: Problema }) {
  const build = p.procedencia === "calculado_no_build";
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide",
        build
          ? "bg-surface-2 text-ink-muted"
          : "bg-[#f59e0b]/10 text-[#b45309]",
      )}
    >
      {build ? "build" : "GSC"}
    </span>
  );
}

function BadgeTipo({ tipo }: { tipo?: string }) {
  if (!tipo || !ROTULO_BADGE[tipo]) return null;
  const estilos: Record<string, string> = {
    home:        "bg-surface-2 text-ink-muted",
    money:       "bg-[#7c3aed]/10 text-[#6d28d9]",
    pilar:       "bg-[#0369a1]/10 text-[#0369a1]",
    blog:        "bg-[#16a34a]/10 text-[#15803d]",
    supporting:  "bg-surface-2 text-ink-muted",
    institucional: "bg-surface-2 text-ink-muted",
    categoria:   "bg-surface-2 text-ink-muted",
    autor:       "bg-surface-2 text-ink-muted",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide",
        estilos[tipo] ?? "bg-surface-2 text-ink-muted",
      )}
    >
      {ROTULO_BADGE[tipo]}
    </span>
  );
}

/* ------------------------------------------------------------------ */

function ItemProblema({
  p,
  estilos,
}: {
  p: Problema;
  estilos: { item: string };
}) {
  return (
    <div className={cn("px-4 py-3 pl-5", estilos.item)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-[var(--ink)]">{p.titulo}</p>
            <BadgeProcedencia p={p} />
            <BadgeTipo tipo={p.badge_tipo} />
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
            {p.detalhe}
          </p>
        </div>
        {p.href_conserto && (
          <Link
            href={p.href_conserto}
            className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-[var(--primary)] hover:underline"
          >
            {p.label_conserto ?? "Ver"} <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function BlocoSeveridade({
  cor,
  icone: Icone,
  rotulo,
  subtitulo,
  problemas,
  vazio,
}: {
  cor: "vermelho" | "ambar" | "cinza" | "azul";
  icone: React.ElementType;
  rotulo: string;
  subtitulo: string;
  problemas: Problema[];
  vazio: string;
}) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const estilos = {
    vermelho: {
      header: "bg-danger/10 border-danger/30 text-danger",
      item: "border-l-2 border-danger/40",
      icone: "text-danger",
      grupo: "border-l-2 border-danger/20 bg-danger/5",
    },
    ambar: {
      header: "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#d97706]",
      item: "border-l-2 border-[#f59e0b]/40",
      icone: "text-[#d97706]",
      grupo: "border-l-2 border-[#f59e0b]/20 bg-[#f59e0b]/5",
    },
    azul: {
      header: "bg-primary/10 border-primary/30 text-primary",
      item: "border-l-2 border-primary/40",
      icone: "text-primary",
      grupo: "border-l-2 border-primary/20 bg-primary/5",
    },
    cinza: {
      header: "bg-[var(--surface-2)] border-[var(--line)] text-ink-muted",
      item: "border-l-2 border-[var(--line)]",
      icone: "text-ink-muted",
      grupo: "border-l-2 border-[var(--line)] bg-[var(--surface-2)]/40",
    },
  }[cor];

  // Ordenar por consequência (money → pilar → blog → resto) e agrupar por tipo
  const grupos = useMemo(() => {
    const ordemTipo = (b?: string) => {
      if (b === "money") return 0;
      if (b === "pilar") return 1;
      if (b === "blog") return 2;
      return 3;
    };
    const sorted = [...problemas].sort(
      (a, b) => ordemTipo(a.badge_tipo) - ordemTipo(b.badge_tipo),
    );
    const mapa = new Map<string, Problema[]>();
    for (const p of sorted) {
      const lista = mapa.get(p.tipo) ?? [];
      lista.push(p);
      mapa.set(p.tipo, lista);
    }
    return [...mapa.entries()];
  }, [problemas]);

  const toggle = (tipo: string) =>
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(tipo)) next.delete(tipo);
      else next.add(tipo);
      return next;
    });

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
      <div className={cn("flex items-center gap-2.5 border-b px-4 py-3", estilos.header)}>
        <Icone size={15} className={estilos.icone} />
        <div>
          <span className="text-sm font-semibold">{rotulo}</span>
          <span className="ml-2 text-xs opacity-70">{subtitulo}</span>
        </div>
        <span className="ml-auto text-xs font-semibold tabular-nums opacity-60">
          {problemas.length > 0 ? problemas.length : ""}
        </span>
      </div>

      <div className="divide-y divide-[var(--line)]">
        {problemas.length === 0 ? (
          <p className="px-4 py-4 text-sm text-[var(--ink-muted)]">{vazio}</p>
        ) : (
          grupos.map(([tipo, items]) => {
            if (items.length === 1) {
              return <ItemProblema key={items[0].id} p={items[0]} estilos={estilos} />;
            }

            const expandido = expandidos.has(tipo);
            return (
              <div key={tipo}>
                {/* Linha de grupo colapsável */}
                <button
                  onClick={() => toggle(tipo)}
                  className={cn(
                    "w-full px-4 py-3 pl-5 text-left flex items-center gap-2",
                    estilos.grupo,
                  )}
                >
                  <span className="flex-1 text-sm font-medium text-[var(--ink)]">
                    {items[0].titulo}
                  </span>
                  <span className="text-xs tabular-nums text-[var(--ink-muted)]">
                    ({items.length})
                  </span>
                  <ChevronDown
                    size={13}
                    className={cn(
                      "shrink-0 text-[var(--ink-muted)] transition-transform",
                      expandido && "rotate-180",
                    )}
                  />
                </button>

                {/* Itens expandidos */}
                {expandido && (
                  <div className="divide-y divide-[var(--line)]">
                    {items.map((p) => (
                      <ItemProblema key={p.id} p={p} estilos={estilos} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Core Web Vitals removido em 28/09/2026 (Relatório de Testes 4, erro 47):
// era uma tela inteiramente fixa — traços, texto e metas escritos no
// código, sem nenhuma ligação com Search Console, PageSpeed ou CrUX.
// Volta quando houver integração real (PageSpeed Insights é o caminho
// mais simples).

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

/**
 * Integrações: estado neutro. "Não configurado" não é falha nem sucesso.
 *
 * O selo "configurado" reflete só a config real (googleAnalyticsId/
 * googleTagManagerId/metaPixelId) — nunca mais um "ou" com o que o HTML
 * parece carregar. Achado real (Relatório de Testes 4, erro 46): o painel
 * dava "configurado" mesmo sem nenhum ID cadastrado sempre que o HTML
 * "parecia" carregar um rastreador, e havia risco de falso positivo por
 * causa do próprio script de consentimento de cookies (presente em todo
 * site do LinkFlow). `rastreadoresNoHtml` continua útil, mas só como um
 * aviso à parte — script no ar sem registro na config é uma discrepância
 * a investigar, não motivo pra marcar como "configurado".
 */
function CartaoIntegracoes({ r }: { r: ResultadoAuditoria }) {
  const i = r.integracoes;
  const analiticoNoHtml = r.rastreadoresNoHtml.filter((n) => !/pixel/i.test(n));
  const pixelNoHtml = r.rastreadoresNoHtml.some((n) => /pixel/i.test(n));
  const linhas: { nome: string; ativo: boolean; noHtmlSemConfig: boolean }[] = [
    { nome: "Google Analytics / Tag Manager", ativo: !!i?.analiticos, noHtmlSemConfig: !i?.analiticos && analiticoNoHtml.length > 0 },
    { nome: "Meta Pixel", ativo: !!i?.marketing, noHtmlSemConfig: !i?.marketing && pixelNoHtml },
  ];
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
        <Info size={15} className="text-[var(--ink-muted)]" />
        <span className="text-sm font-semibold text-[var(--ink)]">Medição e rastreamento</span>
        <span className="text-xs text-[var(--ink-muted)]">informativo, não conta como problema</span>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {i === null ? (
          <p className="px-4 py-3 text-sm text-[var(--ink-muted)]">
            Não foi possível ler as configurações do site, então não dá para dizer o que está configurado.
          </p>
        ) : (
          linhas.map((l) => (
            <div key={l.nome} className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--ink)]">{l.nome}</span>
                <span className="rounded bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-muted)]">
                  {l.ativo ? "configurado" : "não configurado"}
                </span>
              </div>
              {l.noHtmlSemConfig && (
                <p className="mt-1 text-[11px] text-[var(--accent)]">
                  Algo parecido com este rastreador aparece no HTML publicado, mas não há ID
                  cadastrado na configuração — vale conferir se é um script residual.
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function noPlural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

export default function SeoVisaoGeral() {
  // Tudo é buscado aqui e o resultado só existe DEPOIS de todos os fetches
  // terminarem (lib/auditoria-seo.ts): o contador nasce uma vez e não muda.
  const [resultado, setResultado] = useState<ResultadoAuditoria | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarAuditoria(async (url) => {
      const r = await fetch(url, { cache: "no-store" });
      return r.json();
    }).then((r) => {
      if (ativo) setResultado(r);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const { avisos, bloqueia, prejudica, verificar, totalProblemas, temGSC } = useMemo(() => {
    const lista = resultado?.problemas ?? [];
    const b = lista.filter((p) => p.severidade === "bloqueia");
    const pr = lista.filter((p) => p.severidade === "prejudica");
    const v = lista.filter((p) => p.severidade === "verificar");
    return {
      avisos: lista.filter((p) => p.severidade === "aviso"),
      bloqueia: b,
      prejudica: pr,
      verificar: v,
      totalProblemas: b.length + pr.length + v.length,
      temGSC: lista.some((p) => p.procedencia === "requer_search_console"),
    };
  }, [resultado]);

  const carregando = resultado === null;
  const parcial = (resultado?.falhas.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Cabeçalho */}
      <div className="sticky top-[52px] z-10 border-b border-[var(--line)] bg-[var(--surface)] px-6 py-4">
        <h1 className="text-base font-semibold text-[var(--ink)]">SEO — Visão geral</h1>
        <p className="text-xs text-[var(--ink-muted)]">
          {carregando
            ? "Verificando o site…"
            : (totalProblemas === 0
                ? "Nenhum problema identificado"
                : noPlural(totalProblemas, "problema identificado", "problemas identificados")) +
              (avisos.length > 0 ? ` · ${noPlural(avisos.length, "aviso", "avisos")}` : "") +
              (parcial ? " (contagem parcial: veja o que não foi verificado abaixo)" : "") +
              (resultado?.origemRotulo ? ` · lido de: ${resultado.origemRotulo}` : "")}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] text-[var(--ink-muted)]">
          <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-medium uppercase tracking-wide">
            BUILD
          </span>
          <span>= calculado a partir dos arquivos do site</span>
          {temGSC && (
            <>
              <span className="opacity-40">·</span>
              <span className="rounded bg-[#f59e0b]/10 px-1.5 py-0.5 font-medium uppercase tracking-wide text-[#b45309]">
                GSC
              </span>
              <span>= requer conexão com o Google Search Console</span>
            </>
          )}
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
        {carregando && (
          <p className="rounded-[var(--radius)] border border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--ink-muted)]">
            Lendo as páginas, os links e as configurações do site. O resumo aparece quando terminar.
          </p>
        )}

        {resultado && resultado.falhas.length > 0 && (
          <div className="rounded-[var(--radius)] border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#b45309]">
            {resultado.falhas.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </div>
        )}

        {resultado && (<>
        <BlocoSeveridade
          cor="vermelho"
          icone={AlertCircle}
          rotulo="Bloqueia indexação"
          subtitulo="Resolve primeiro"
          problemas={bloqueia}
          vazio="Nenhuma página com erro de indexação encontrado."
        />

        {avisos.length > 0 && (
          <BlocoSeveridade
            cor="azul"
            icone={Info}
            rotulo="Fora do Google por enquanto"
            subtitulo="De propósito, até o conteúdo real ser liberado"
            problemas={avisos}
            vazio=""
          />
        )}

        <BlocoSeveridade
          cor="ambar"
          icone={AlertTriangle}
          rotulo="Prejudica ranqueamento"
          subtitulo="Resolve quando possível"
          problemas={prejudica}
          vazio="Nenhum problema de ranqueamento identificado."
        />

        <BlocoSeveridade
          cor="cinza"
          icone={Info}
          rotulo="Verificar"
          subtitulo="Baixa urgência"
          problemas={verificar}
          vazio="Nenhum item pendente de verificação."
        />

        <CartaoIntegracoes r={resultado} />
        </>)}

        <p className="pb-2 text-center text-xs text-[var(--ink-muted)]">
          Esta análise lê o HTML do site e as configurações do painel. Para auditorias completas use Google Search Console,
          Lighthouse e PageSpeed Insights.
        </p>
      </div>
    </div>
  );
}
