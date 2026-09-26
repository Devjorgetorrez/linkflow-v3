"use client";

import { useState, useMemo, useEffect } from "react";
import { ExternalLink, Copy, Check, RefreshCw, Send, Info, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePaginasReais } from "@/lib/usePaginasReais";
import { gerarIndexaveis } from "@/motor/indexaveis";
import { cn } from "@/lib/utils";

const MAX_URLS = 1_000;

/* ------------------------------------------------------------------ */

const CODIGOS_INDEXNOW: Record<number, { cor: string; msg: string }> = {
  200: { cor: "text-success", msg: "Lista recebida com sucesso." },
  202: { cor: "text-[#d97706]", msg: "Chave em validação — normal no primeiro envio." },
  400: { cor: "text-danger", msg: "Formato do pedido inválido." },
  403: { cor: "text-danger", msg: "Chave inválida ou arquivo inacessível." },
  422: { cor: "text-danger", msg: "Alguma URL não pertence ao domínio." },
  429: { cor: "text-danger", msg: "Envios em excesso — aguardar antes de reenviar." },
};

function gerarChave(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

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

interface UltimoEnvio {
  data: string;       // ISO datetime
  quantidade: number;
  codigoResposta: number;
  urls: string[];
}

/* ------------------------------------------------------------------ */

export default function SitemapPage() {
  const { posts, categorias, autores } = useStore();
  // Páginas reais do site (dist/), nunca o mock do store — ver lib/usePaginasReais.ts
  const { paginas } = usePaginasReais();
  const [DOMAIN, setDomain] = useState("seudominio.com.br");
  const SITEMAP_URL = `https://${DOMAIN}/sitemap.xml`;

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { if (data.ok && data.config?.dominioHost) setDomain(data.config.dominioHost); })
      .catch(console.error);
  }, []);

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
    const noindexCount = posts.filter((p) => p.noindex).length;

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
    navigator.clipboard.writeText(SITEMAP_URL).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  }

  // ── IndexNow ───────────────────────────────────────────────────────
  const [chave, setChave] = useState<string | null>(null);
  const [chaveCopiada, setChaveCopiada] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [verificacaoResult, setVerificacaoResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ultimoEnvio, setUltimoEnvio] = useState<UltimoEnvio | null>(null);
  const [erroEnvio, setErroEnvio] = useState<{ codigo: number; msg: string } | null>(null);

  const chaveUrl = chave ? `https://${DOMAIN}/${chave}.txt` : null;

  // URLs alteradas desde o último envio (por lastmod)
  const urlsAlteradas = useMemo(() => {
    if (!ultimoEnvio) return entradas; // tudo, se nunca enviou
    return entradas.filter((e) => e.ultimaMod > ultimoEnvio.data.slice(0, 10));
  }, [entradas, ultimoEnvio]);

  function gerarNovaChave() {
    setChave(gerarChave());
    setVerificacaoResult(null);
    setErroEnvio(null);
  }

  function copiarChaveUrl() {
    if (!chaveUrl) return;
    navigator.clipboard.writeText(chaveUrl).then(() => {
      setChaveCopiada(true);
      setTimeout(() => setChaveCopiada(false), 1500);
    });
  }

  function verificarArquivo() {
    if (!chave) return;
    setVerificando(true);
    setVerificacaoResult(null);
    // Simula GET ao arquivo da chave — no build real seria servido pela Vercel
    setTimeout(() => {
      setVerificando(false);
      setVerificacaoResult({ ok: true, msg: "200 OK — conteúdo correto" });
    }, 1200);
  }

  function enviarIndexNow() {
    if (!chave || urlsAlteradas.length === 0) return;
    setEnviando(true);
    setErroEnvio(null);
    const urlList = urlsAlteradas.map((e) => `https://${DOMAIN}${e.loc}`);

    // Simula POST para https://api.indexnow.org/indexnow
    setTimeout(() => {
      const codigo = 200; // mock: primeiro envio retorna 200
      setEnviando(false);
      setUltimoEnvio({
        data: new Date().toISOString(),
        quantidade: urlList.length,
        codigoResposta: codigo,
        urls: urlList,
      });
      if (codigo !== 200 && codigo !== 202) {
        setErroEnvio({ codigo, msg: CODIGOS_INDEXNOW[codigo]?.msg ?? "Erro desconhecido." });
      }
    }, 1500);
  }

  const labelEnvio = (() => {
    if (enviando) return "Enviando…";
    if (urlsAlteradas.length === 0)
      return ultimoEnvio
        ? `Nenhuma URL alterada desde ${formatarDataHora(ultimoEnvio.data)}`
        : "Nenhuma URL no sitemap";
    const ref = ultimoEnvio
      ? ` desde ${formatarData(ultimoEnvio.data.slice(0, 10))}`
      : "";
    return `Enviar ${urlsAlteradas.length} URL${urlsAlteradas.length > 1 ? "s" : ""} alterada${urlsAlteradas.length > 1 ? "s" : ""}${ref}`;
  })();

  const envioDesabilitado = enviando || urlsAlteradas.length === 0 || !chave;

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center border-b border-[var(--line)] bg-[var(--surface)] px-6 py-3">
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

            {!chave ? (
              <>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Um POST atinge todos os buscadores participantes (Bing, Yandex, Seznam, Naver). A chave autentica o domínio — o arquivo{" "}
                  <code className="rounded bg-[var(--surface)] px-1 font-mono text-[10.5px]">{"{chave}.txt"}</code>{" "}
                  precisa estar acessível na raiz antes do primeiro envio.
                </p>
                <button
                  onClick={gerarNovaChave}
                  className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--primary-ink)] hover:opacity-90 transition-opacity"
                >
                  Gerar chave de 32 caracteres
                </button>
              </>
            ) : (
              <>
                {/* Arquivo da chave */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-[var(--ink-muted)]">Arquivo da chave</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-hidden truncate rounded border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[10.5px] text-[var(--ink)]">
                      {chaveUrl}
                    </code>
                    <button
                      onClick={copiarChaveUrl}
                      title="Copiar URL do arquivo"
                      className="flex shrink-0 items-center gap-1 rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    >
                      {chaveCopiada ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                    </button>
                    <button
                      onClick={verificarArquivo}
                      disabled={verificando}
                      title="Verificar se o arquivo está acessível"
                      className="flex shrink-0 items-center gap-1 rounded border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-50"
                    >
                      <RefreshCw size={11} className={verificando ? "animate-spin" : ""} />
                      Verificar
                    </button>
                  </div>
                  {verificacaoResult && (
                    <p className={cn("text-[11px]", verificacaoResult.ok ? "text-success" : "text-danger")}>
                      {verificacaoResult.ok ? "✓" : "✗"} {verificacaoResult.msg}
                    </p>
                  )}
                </div>

                {/* Botão de envio */}
                <div className="space-y-1.5">
                  <button
                    onClick={enviarIndexNow}
                    disabled={envioDesabilitado}
                    className={cn(
                      "flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-1.5 text-[12px] font-medium transition-opacity",
                      envioDesabilitado
                        ? "cursor-not-allowed bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-muted)]"
                        : "bg-[var(--primary)] text-[var(--primary-ink)] hover:opacity-90",
                    )}
                  >
                    <Send size={12} />
                    {labelEnvio}
                  </button>
                  <p className="text-[10.5px] text-[var(--ink-muted)]">
                    O envio automático roda no deploy. Este botão é reforço manual. URLs despublicadas ou convertidas em 410 entram no próximo envio automaticamente.
                  </p>
                </div>

                {/* Erro de envio */}
                {erroEnvio && (
                  <div className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-[11px] text-danger">
                    <span className="font-medium">{erroEnvio.codigo}</span> — {erroEnvio.msg}
                  </div>
                )}

                {/* Último envio */}
                {ultimoEnvio && !erroEnvio && (
                  <div className="space-y-1">
                    <p className={cn("text-[11px] font-medium", CODIGOS_INDEXNOW[ultimoEnvio.codigoResposta]?.cor ?? "text-[var(--ink)]")}>
                      {ultimoEnvio.codigoResposta} — {CODIGOS_INDEXNOW[ultimoEnvio.codigoResposta]?.msg ?? "Resposta desconhecida."}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {formatarDataHora(ultimoEnvio.data)} · {ultimoEnvio.quantidade} URL{ultimoEnvio.quantidade > 1 ? "s" : ""}
                    </p>
                    <details className="group">
                      <summary className="cursor-pointer list-none text-[11px] text-[var(--primary)] hover:underline">
                        Ver URLs enviadas
                      </summary>
                      <ul className="mt-1 space-y-0.5">
                        {ultimoEnvio.urls.map((u) => (
                          <li key={u} className="font-mono text-[10.5px] text-[var(--ink-muted)]">{u}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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
              Implementação: o sitemap sai da mesma fonte que a Visão geral SEO, via{" "}
              <code className="rounded bg-[var(--surface)] px-1 font-mono text-[11px]">@astrojs/sitemap</code>{" "}
              com <code className="rounded bg-[var(--surface)] px-1 font-mono text-[11px]">filter</code> e{" "}
              <code className="rounded bg-[var(--surface)] px-1 font-mono text-[11px]">serialize</code>.
              Um arquivo único até 1.000 URLs.
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
