"use client";

/**
 * Páginas — lista do que o site publicado realmente tem. Cada coluna vem do
 * HTML lido por /api/paginas (título, indexação real, palavras, links, nível
 * por cliques). Nada de intenção de busca, cluster ou composição inventados:
 * o HTML não traz esses dados, então a tela não os exibe.
 */

import { ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Botao } from "@/components/ui";
import { IndexacaoBadge } from "@/components/paginas/IndexacaoBadge";
import { usePaginasReais } from "@/lib/usePaginasReais";
import { useBaseSite } from "@/lib/useDominio";
import { cn } from "@/lib/utils";
import type { TipoPagina } from "@/mock/types";

/* ---------------------------------------------------------------- helpers */

const TIPO_LABEL: Record<TipoPagina, string> = {
  home: "Home",
  money: "Money",
  pilar: "Pilar",
  supporting: "Supporting",
  institucional: "Institucional",
};

const TIPO_TOM: Record<TipoPagina, string> = {
  home: "bg-success/10 text-success border-success/30",
  money: "bg-danger/10 text-danger border-danger/30",
  pilar: "bg-primary/10 text-primary border-primary/30",
  supporting: "bg-success/10 text-success border-success/30",
  institucional: "bg-accent/10 text-accent border-accent/30",
};

type FiltroIndexacao = "todas" | "indexavel" | "noindex";

/* ---------------------------------------------------------------- page */

export default function PaginasPage() {
  const { paginas, carregando, origemRotulo, erro } = usePaginasReais();
  const { base: baseSite } = useBaseSite();

  const [filtroIndexacao, setFiltroIndexacao] = useState<FiltroIndexacao>("todas");
  const [filtroTipo, setFiltroTipo] = useState<TipoPagina | "">("");
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    return paginas.filter((p) => {
      if (filtroIndexacao === "noindex" && !p.real?.noindex) return false;
      if (filtroIndexacao === "indexavel" && (p.real?.noindex ?? true)) return false;
      if (filtroTipo && p.tipo !== filtroTipo) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return p.titulo.toLowerCase().includes(q) || p.url.toLowerCase().includes(q);
      }
      return true;
    });
  }, [paginas, filtroIndexacao, filtroTipo, busca]);

  const contagens: Record<FiltroIndexacao, number> = useMemo(
    () => ({
      todas: paginas.length,
      indexavel: paginas.filter((p) => p.real && !p.real.noindex && !p.real.erroLeitura).length,
      noindex: paginas.filter((p) => p.real?.noindex).length,
    }),
    [paginas],
  );

  const ABAS: { id: FiltroIndexacao; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "indexavel", label: "Indexáveis" },
    { id: "noindex", label: "Não indexadas (noindex)" },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* cabeçalho */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">Páginas</h1>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">
            {carregando
              ? "Lendo o site…"
              : `${paginas.length} páginas${origemRotulo ? ` · lido de: ${origemRotulo}` : ""}`}
          </p>
        </div>
        <div className="group relative">
          <Botao variante="secundario" tamanho="sm" disabled className="cursor-not-allowed opacity-50">
            Adicionar página
          </Botao>
          <span className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 hidden w-64 rounded-[var(--radius)] border border-line bg-surface-2 px-2.5 py-2 text-[11px] leading-relaxed text-ink-muted shadow-lg group-hover:block">
            Páginas são criadas pelo construtor a partir da arquitetura do LinkFlow.
          </span>
        </div>
      </div>

      {erro && (
        <p className="border-b border-line bg-[#f59e0b]/10 px-6 py-2 text-[12px] text-[#b45309]">{erro}</p>
      )}

      {/* abas de filtro rápido */}
      <div className="flex items-center gap-0 border-b border-line px-6">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => setFiltroIndexacao(aba.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors",
              filtroIndexacao === aba.id
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {aba.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-[1px] text-[10px] font-semibold",
                filtroIndexacao === aba.id ? "bg-primary/15 text-primary" : "bg-secondary text-ink-muted",
              )}
            >
              {contagens[aba.id]}
            </span>
          </button>
        ))}
      </div>

      {/* barra de ações */}
      <div className="flex items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar páginas…"
            className="h-7 w-full rounded-[var(--radius)] border border-line bg-surface-2 pl-7 pr-3 text-[12px] text-ink placeholder:text-ink-muted/70 outline-none focus:border-primary"
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoPagina | "")}
          className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink outline-none focus:border-primary"
        >
          <option value="">Tipo: todos</option>
          <option value="money">Money</option>
          <option value="pilar">Pilar</option>
          <option value="home">Home</option>
          <option value="supporting">Supporting</option>
          <option value="institucional">Institucional</option>
        </select>

        <div className="ml-auto">
          <Link
            href="/paginas/estrutura"
            className="inline-flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-line bg-surface-2 px-2.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Ver estrutura →
          </Link>
        </div>
      </div>

      {/* tabela */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Título / URL</th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Tipo</th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted" title="Meta robots do HTML publicado">Indexação</th>
              <th className="px-3 py-2.5 text-center font-medium text-ink-muted" title="Cliques a partir da home">Nível</th>
              <th className="px-3 py-2.5 text-right font-medium text-ink-muted" title="Palavras do texto visível">Palavras</th>
              <th className="px-3 py-2.5 text-center font-medium text-ink-muted" title="Links de outras páginas para esta">Links recebidos</th>
              <th className="w-8 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visiveis.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[12px] text-ink-muted">
                  {carregando
                    ? "Lendo o site…"
                    : paginas.length === 0
                      ? "Nenhuma página encontrada: o site ainda não foi gerado."
                      : "Nenhuma página encontrada"}
                </td>
              </tr>
            ) : (
              visiveis.map((pagina) => (
                <tr key={pagina.id} className="group transition-colors hover:bg-secondary/60">
                  <td className="px-3 py-2.5">
                    <div className="min-w-0">
                      <Link
                        href={`/paginas/${pagina.id}`}
                        className="block truncate font-medium text-ink hover:text-primary"
                      >
                        {pagina.titulo}
                      </Link>
                      <span className="block truncate font-mono text-[10.5px] text-ink-muted">{pagina.url}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded border px-1.5 py-[1px] text-[10.5px] font-medium",
                        TIPO_TOM[pagina.tipo],
                      )}
                    >
                      {TIPO_LABEL[pagina.tipo]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <IndexacaoBadge pagina={pagina} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-[11.5px] text-ink-muted">{pagina.nivel}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-[11px] text-ink-muted">
                      {pagina.real && !pagina.real.erroLeitura ? pagina.real.palavras : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        pagina.linksRecebidos === 0 ? "text-danger" : "text-ink-muted",
                      )}
                    >
                      {pagina.linksRecebidos}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    {baseSite && (
                      <a
                        href={`${baseSite}${pagina.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no site"
                        className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-secondary hover:text-ink"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line px-6 py-3">
        <span className="text-[11.5px] text-ink-muted">
          Exibindo {visiveis.length} de {paginas.length} páginas
        </span>
      </div>
    </div>
  );
}
