"use client";

import { useState, useMemo, useEffect } from "react";
import { ExternalLink, Copy, Check, RefreshCw, Send, Info, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePaginasReais } from "@/lib/usePaginasReais";
import { gerarIndexaveis } from "@/motor/indexaveis";
import { cn } from "@/lib/utils";

const MAX_URLS = 1_000;

/* ------------------------------------------------------------------ */

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function derivarTipo(url: string, tipo: string, tipoPagina?: string): string {
  if (url === "/") return "Home";
  // URL plana: artigo e serviço ficam ambos em /<slug> — o tipo vem do nó,
  // não da URL.
  if (tipo === "post") return "Post";
  if (tipo === "autor") return "Autor";
  if (tipoPagina === "home") return "Home";
  if (tipoPagina === "money") return "Serviço";
  if (tipoPagina === "pilar") return "Pilar";
  if (tipoPagina === "institucional") return "Institucional";
  return "Página";
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

export default function SitemapPage() {
  const { posts, categorias, autores } = useStore();
  // Páginas reais do site (dist/), nunca o mock do store — ver lib/usePaginasReais.ts
  const { paginas } = usePaginasReais();
  const [DOMAIN, setDomain] = useState("");
  const SITEMAP_URL = DOMAIN ? `https://${DOMAIN}/sitemap.xml` : "domínio ainda não configurado";

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { if (data.ok && data.config?.dominioHost) setDomain(data.config.dominioHost); })
      .catch(console.error);
  }, []);

  // Contagem REAL: o sitemap.xml publicado não sai deste cálculo — é gerado
  // por um hook separado no build (_astro/integracoes/sitemap-canonico.mjs,
  // que varre dist/**/index.html). As duas fontes podem divergir (erro 79,
  // Relatório de Testes 5); em vez de confiar só no cálculo daqui, buscamos
  // o arquivo real publicado e avisamos se os números não baterem.
  const [totalUrlsPublicado, setTotalUrlsPublicado] = useState<number | null>(null);
  useEffect(() => {
    if (!DOMAIN) return;
    fetch(`https://${DOMAIN}/sitemap.xml`, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : null))
      .then((texto) => {
        if (texto == null) return setTotalUrlsPublicado(null);
        const n = (texto.match(/<loc>/g) ?? []).length;
        setTotalUrlsPublicado(n);
      })
      .catch(() => setTotalUrlsPublicado(null));
  }, [DOMAIN]);

  // Deriving sitemap entries from indexaveis — the single source of truth
  const { entradas, totalUrls, exclNoindex, exclTaxonomia } = useMemo(() => {
    const indexaveis = gerarIndexaveis({ posts, paginas, categorias, autores, dominio: DOMAIN });

    // Páginas, posts e autores entram no sitemap (categorias ainda não têm página no site)
    const sitemap = indexaveis.filter(
      (ix) =>
        ix.indexavel &&
        ix.status === "publicado" &&
        ix.tipo !== "categoria",
    );

    // Excluded by noindex: published posts where noindex = true
    const noindexCount =
      posts.filter((p) => p.noindex).length +
      indexaveis.filter((ix) => ix.tipo === "pagina" && ix.real?.noindex).length;

    // Excluded by taxonomy: all categoria nodes (excluded from sitemap by config)
    const taxonomiaCount = indexaveis.filter((ix) => ix.tipo === "categoria").length;

    const entradas = sitemap.map((ix) => ({
      loc: ix.url,
      ultimaMod: ix.ultima_mod,
      tipo: derivarTipo(ix.url, ix.tipo, ix.tipo_pagina),
    }));

    return {
      entradas,
      totalUrls: entradas.length,
      exclNoindex: noindexCount,
      exclTaxonomia: taxonomiaCount,
    };
  }, [posts, paginas, categorias, autores, DOMAIN]);

  // ── URL do sitemap copy ────────────────────────────────────────────
  const [copiado, setCopiado] = useState(false);

  function copiarUrl() {
    if (!DOMAIN) return;
    navigator.clipboard.writeText(SITEMAP_URL).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="sticky top-[52px] z-10 flex items-center border-b border-[var(--line)] bg-[var(--surface)] px-6 py-3">
        <h1 className="text-[14px] font-semibold text-[var(--ink)]">SEO — Sitemap</h1>
      </div>

      <div className="flex-1 space-y-5 p-6">

        {/* ── Bloco de ação: 2 colunas ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">

          {/* URL do sitemap */}
          <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-3">
            <p className="text-[12px] font-semibold text-[var(--ink)]">URL do sitemap</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-hidden rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[11.5px] text-[var(--ink)] truncate">
                {SITEMAP_URL}
              </code>
              <button
                onClick={copiarUrl}
                title="Copiar URL"
                className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[12px] text-[var(--ink-muted)] transition-colors hover:border-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                {copiado ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] text-[var(--ink-muted)]">
                Envie a URL no Google Search Console. O GSC importa automaticamente — não há botão de envio direto.
              </p>
              <a
                href={`https://search.google.com/search-console?resource_id=sc-domain:${DOMAIN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 flex shrink-0 items-center gap-1 text-[12px] text-[var(--primary)] hover:underline"
              >
                Abrir no GSC <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* IndexNow */}
          <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-3">
            <p className="text-[12px] font-semibold text-[var(--ink)]">IndexNow</p>
            <p className="text-[11px] text-[var(--ink-muted)]">
              O envio de URLs por IndexNow (Bing, Yandex, Seznam, Naver) ainda não está disponível no painel, e o site
              não tem uma chave IndexNow instalada. Nada é enviado por esta tela. Enquanto isso, o Google e o Bing
              descobrem as páginas pelo sitemap acima.
            </p>
          </div>
        </div>

        {/* ── Divergência com o sitemap.xml real ──────────────────── */}
        {totalUrlsPublicado !== null && totalUrlsPublicado !== totalUrls && (
          <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[#f59e0b]/40 bg-[#f59e0b]/8 px-4 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#d97706]" />
            <p className="text-[12px] text-[#b45309]">
              Esta tela calcula {totalUrls} URLs, mas o sitemap.xml publicado
              tem {totalUrlsPublicado}. As duas fontes podem divergir porque o
              arquivo real é gerado por um passo separado do build a partir do
              HTML final — o número abaixo é o calculado aqui, não
              necessariamente o que está no ar agora.
            </p>
          </div>
        )}

        {/* ── Contadores derivados do build ──────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total de URLs no sitemap", valor: totalUrls },
            { label: "Excluídas por noindex", valor: exclNoindex },
            { label: "Excluídas por taxonomia", valor: exclTaxonomia },
          ].map(({ label, valor }) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
            >
              <span className="text-[22px] font-bold text-[var(--ink)]">{valor}</span>
              <span className="text-[11.5px] text-[var(--ink-muted)]">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Nota sobre geração ─────────────────────────────────── */}
        <div className="flex gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
          <Info size={13} className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
          <div className="space-y-1 text-[12px] text-[var(--ink-muted)]">
            <p>
              Gerado no build a partir do conteúdo. Entra todo nó com{" "}
              <code className="rounded bg-[var(--surface)] px-1 font-mono text-[11px]">indexavel: true</code>.
              O lastmod vem da data real de atualização — datas falsas fazem o Google parar de confiar no lastmod do site inteiro.
            </p>
            <p>
              Implementação: o arquivo publicado é gerado por um passo próprio do
              build (<code className="rounded bg-[var(--surface)] px-1 font-mono text-[11px]">sitemap-canonico.mjs</code>),
              que varre o HTML final já gerado — não a biblioteca{" "}
              <code className="rounded bg-[var(--surface)] px-1 font-mono text-[11px]">@astrojs/sitemap</code>.
              Os números desta tela vêm de um cálculo próprio sobre o
              conteúdo (não leem o arquivo publicado) — por isso o aviso
              acima quando os dois não batem. Um arquivo único até 1.000 URLs.
            </p>
          </div>
        </div>

        {/* Aviso de limite */}
        {totalUrls > MAX_URLS && (
          <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[#f59e0b]/40 bg-[#f59e0b]/8 px-4 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#d97706]" />
            <p className="text-[12px] text-[#b45309]">
              O sitemap tem {totalUrls} URLs — acima do limite de {MAX_URLS.toLocaleString("pt-BR")} recomendado por arquivo. Considere quebrar em múltiplos sitemaps via índice.
            </p>
          </div>
        )}

        {/* ── Tabela ────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                <th className="px-4 py-2.5 text-left font-medium text-[var(--ink-muted)]">URL</th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--ink-muted)]">Tipo</th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--ink-muted)]">Última modificação</th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--ink-muted)]">Status no Google</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((entrada, i) => (
                <tr
                  key={entrada.loc}
                  className={cn(
                    "border-b border-[var(--line)] last:border-0",
                    i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]",
                  )}
                >
                  {/* URL */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11.5px]">
                        <span className="text-[var(--ink-muted)]">{DOMAIN}</span>
                        <span className="text-[var(--ink)]">{entrada.loc}</span>
                      </span>
                      <a
                        href={`https://${DOMAIN}${entrada.loc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[var(--ink-muted)] hover:text-[var(--primary)]"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{entrada.tipo}</td>

                  {/* Última modificação */}
                  <td className="px-4 py-2.5 font-mono text-[var(--ink-muted)]">
                    {formatarData(entrada.ultimaMod)}
                  </td>

                  {/* Status no Google — dado do GSC, não disponível no build */}
                  <td className="px-4 py-2.5 text-[11.5px] text-[var(--ink-muted)] italic">
                    requer Search Console
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
