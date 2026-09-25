"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Gauge,
  Info,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { gerarIndexaveis } from "@/motor/indexaveis";
import { auditarTecnica, type Problema, type Severidade } from "@/motor/auditoria-tecnica";

/* ------------------------------------------------------------------ */

const ROTULO_BADGE: Record<string, string> = {
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
  cor: "vermelho" | "ambar" | "cinza";
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

function CartaoCWV() {
  const metricas = [
    { sigla: "LCP", limite: "≤ 2,5 s", descricao: "Larger Contentful Paint" },
    { sigla: "INP", limite: "≤ 200 ms", descricao: "Interaction to Next Paint" },
    { sigla: "CLS", limite: "≤ 0,1", descricao: "Cumulative Layout Shift" },
  ];

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
        <Gauge size={15} className="text-[var(--ink-muted)]" />
        <span className="text-sm font-semibold text-[var(--ink)]">Core Web Vitals</span>
        <span className="ml-1 rounded px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide bg-[#f59e0b]/10 text-[#b45309]">
          GSC
        </span>
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
        >
          Abrir no GSC <ExternalLink size={10} />
        </a>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-start gap-2 rounded-[var(--radius)] bg-[var(--surface-2)] px-3 py-2.5 text-xs text-[var(--ink-muted)]">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            Dados de campo (CrUX) exigem volume mínimo de sessões reais. Sites novos ou com baixo
            tráfego ficam sem medição até atingir o limiar do Google. As métricas abaixo são
            referência de meta — não há dados coletados ainda.
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {metricas.map((m) => (
            <div
              key={m.sigla}
              className="rounded-[var(--radius)] border border-[var(--line)] p-3 text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                {m.sigla}
              </p>
              <p className="mt-1.5 text-lg font-bold text-[var(--ink-muted)]">—</p>
              <p className="mt-1 text-[10px] text-[var(--ink-muted)]">sem dados de campo</p>
              <p className="mt-2 border-t border-[var(--line)] pt-2 text-[10px] text-[var(--ink-muted)]">
                Meta: {m.limite}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const COR_SEVERIDADE: Record<Severidade, "vermelho" | "ambar" | "cinza"> = {
  bloqueia: "vermelho",
  prejudica: "ambar",
  verificar: "cinza",
};

export default function SeoVisaoGeral() {
  const { posts: postsMock, paginas: paginasMock, categorias, autores, redirects: redirectsMock, robots: robotsMock } = useStore();
  const [posts, setPosts] = useState<typeof postsMock>([]);
  const [paginas, setPaginas] = useState<typeof paginasMock>([]);
  const [redirects, setRedirects] = useState(redirectsMock);
  const [robots, setRobots] = useState(robotsMock);
  const [DOMAIN, setDomain] = useState("");

  useEffect(() => {
    fetch("/api/posts")
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.posts)) setPosts(data.posts);
        else setPosts(postsMock);
      })
      .catch(() => setPosts(postsMock));
    fetch("/api/paginas")
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.paginas)) setPaginas(data.paginas);
        else setPaginas(paginasMock);
      })
      .catch(() => setPaginas(paginasMock));
    fetch("/api/redirects")
      .then(r => r.json())
      .then(data => { if (data.ok && Array.isArray(data.redirects)) setRedirects(data.redirects); })
      .catch(console.error);
    fetch("/api/robots")
      .then(r => r.json())
      .then(data => { if (data.ok && data.conteudo) setRobots(data.conteudo); })
      .catch(console.error);
    fetch("/api/config")
      .then(r => r.json())
      .then(data => { if (data.ok && data.config?.dominioHost) setDomain(data.config.dominioHost); })
      .catch(console.error);
  }, []);

  const { bloqueia, prejudica, verificar, totalProblemas, temGSC } = useMemo(() => {
    const indexaveis = gerarIndexaveis({ posts, paginas, categorias, autores, dominio: DOMAIN });
    const lista = auditarTecnica(indexaveis, redirects, robots);

    return {
      bloqueia: lista.filter((p) => p.severidade === "bloqueia"),
      prejudica: lista.filter((p) => p.severidade === "prejudica"),
      verificar: lista.filter((p) => p.severidade === "verificar"),
      totalProblemas: lista.length,
      temGSC: lista.some((p) => p.procedencia === "requer_search_console"),
    };
  }, [posts, paginas, categorias, autores, redirects, robots, DOMAIN]);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Cabeçalho */}
      <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--surface)] px-6 py-4">
        <h1 className="text-base font-semibold text-[var(--ink)]">SEO — Visão geral</h1>
        <p className="text-xs text-[var(--ink-muted)]">
          {totalProblemas === 0
            ? "Nenhum problema identificado"
            : `${totalProblemas} problema${totalProblemas !== 1 ? "s" : ""} identificado${totalProblemas !== 1 ? "s" : ""}`}
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
        <BlocoSeveridade
          cor="vermelho"
          icone={AlertCircle}
          rotulo="Bloqueia indexação"
          subtitulo="Resolve primeiro"
          problemas={bloqueia}
          vazio="Nenhum problema que bloqueie indexação encontrado."
        />

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

        <CartaoCWV />

        <p className="pb-2 text-center text-xs text-[var(--ink-muted)]">
          Esta análise usa os dados do painel. Para auditorias completas use Google Search Console,
          Lighthouse e PageSpeed Insights.
        </p>
      </div>
    </div>
  );
}
