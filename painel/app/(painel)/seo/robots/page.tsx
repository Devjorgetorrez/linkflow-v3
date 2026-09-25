"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink, Lock, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePaginasReais } from "@/lib/usePaginasReais";
import { urlPost } from "@/lib/urls-publicas";
import { Alternador, Botao } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Dados fixos                                                         */
/* ------------------------------------------------------------------ */

const BUSCADORES_FIXOS = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
];

const BOTS_RESPOSTAS = [
  { id: "OAI-SearchBot",    descricao: "ChatGPT — respostas com fonte" },
  { id: "ChatGPT-User",     descricao: "ChatGPT — quando o usuário manda abrir uma página" },
  { id: "Claude-SearchBot", descricao: "Claude — respostas com fonte" },
  { id: "Claude-User",      descricao: "Claude — quando o usuário manda abrir uma página" },
  { id: "PerplexityBot",    descricao: "Perplexity — índice" },
  { id: "Perplexity-User",  descricao: "Perplexity — busca ao vivo" },
];

const BOTS_TREINAMENTO = [
  { id: "GPTBot",             descricao: "OpenAI" },
  { id: "ClaudeBot",          descricao: "Anthropic" },
  { id: "Google-Extended",    descricao: "Google" },
  { id: "Applebot-Extended",  descricao: "Apple" },
  { id: "Meta-ExternalAgent", descricao: "Meta" },
  { id: "CCBot",              descricao: "Common Crawl" },
  { id: "Bytespider",         descricao: "ByteDance / TikTok" },
  { id: "Amazonbot",          descricao: "Amazon" },
];

// URL_PUBLICADO calculada dentro do componente

function formatarDataHora(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initAtivados(bots: { id: string }[]): Record<string, boolean> {
  return Object.fromEntries(bots.map((b) => [b.id, true]));
}

function initDesativados(bots: { id: string }[]): Record<string, boolean> {
  return Object.fromEntries(bots.map((b) => [b.id, false]));
}

/* ------------------------------------------------------------------ */
/* Modos de IA                                                         */
/* ------------------------------------------------------------------ */

type ModoIA = "all" | "cite-only" | "none" | "custom";

const OPCOES_MODO: {
  value: ModoIA;
  label: string;
  descricao: string;
}[] = [
  {
    value: "all",
    label: "Permitir todos os assistentes de IA",
    descricao:
      "Seu site pode ser citado no ChatGPT, Claude e Perplexity, e pode ser usado no treinamento de modelos futuros.",
  },
  {
    value: "cite-only",
    label: "Permitir citação, bloquear treinamento",
    descricao:
      "Continua aparecendo nas respostas dos assistentes, mas o conteúdo não entra no treinamento de modelos.",
  },
  {
    value: "none",
    label: "Bloquear todos os assistentes de IA",
    descricao:
      "Seu site deixa de aparecer nas respostas do ChatGPT, do Claude e do Perplexity. Isso não afeta o Google, mas remove uma fonte de descoberta que hoje cresce.",
  },
];

function detectarModo(
  respostas: Record<string, boolean>,
  treinamento: Record<string, boolean>,
): ModoIA {
  const todosR = BOTS_RESPOSTAS.every((b) => respostas[b.id]);
  const nenhumR = BOTS_RESPOSTAS.every((b) => !respostas[b.id]);
  const todosT = BOTS_TREINAMENTO.every((b) => treinamento[b.id]);
  const nenhumT = BOTS_TREINAMENTO.every((b) => !treinamento[b.id]);
  if (todosR && todosT) return "all";
  if (todosR && nenhumT) return "cite-only";
  if (nenhumR && nenhumT) return "none";
  return "custom";
}

/* ------------------------------------------------------------------ */
/* Gerador                                                             */
/* ------------------------------------------------------------------ */

function gerarRobots(
  respostas: Record<string, boolean>,
  treinamento: Record<string, boolean>,
  paths: string[],
  dominio: string,
): string {
  const linhas: string[] = ["User-agent: *", "Allow: /"];
  for (const p of paths) linhas.push(`Disallow: ${p}`);

  for (const bot of BOTS_RESPOSTAS) {
    if (!respostas[bot.id]) {
      linhas.push("", `User-agent: ${bot.id}`, "Disallow: /");
    }
  }
  for (const bot of BOTS_TREINAMENTO) {
    if (!treinamento[bot.id]) {
      linhas.push("", `User-agent: ${bot.id}`, "Disallow: /");
    }
  }

  linhas.push("", `Sitemap: ${dominio}/sitemap.xml`);
  return linhas.join("\n");
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function RobotsPage() {
  const { setRobots, posts } = useStore();
  // Páginas reais do site (dist/), nunca o mock do store — ver lib/usePaginasReais.ts
  const { paginas } = usePaginasReais();
  const [DOMINIO, setDominio] = useState("https://seudominio.com.br");
  const URL_PUBLICADO = `${DOMINIO}/robots.txt`;

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { if (data.ok && data.config?.dominioHost) setDominio(`https://${data.config.dominioHost}`); })
      .catch(console.error);
  }, []);

  const [respostas, setRespostas] = useState(() => initAtivados(BOTS_RESPOSTAS));
  const [treinamento, setTreinamento] = useState(() => initAtivados(BOTS_TREINAMENTO));
  const [paths, setPaths] = useState<string[]>([]);
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [arquivoFisico, setArquivoFisico] = useState<string | null>(null);
  const [novoPath, setNovoPath] = useState("");
  const [erroCaminho, setErroCaminho] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<"idle" | "salvo">("idle");
  const [verificando, setVerificando] = useState(true);
  const [pubStatus, setPubStatus] = useState<number | null>(null);
  const [pubData, setPubData] = useState<string | null>(null);
  const [pubConteudo, setPubConteudo] = useState<string | null>(null);

  // Carrega configuração salva do servidor (via API local) ao montar
  useEffect(() => {
    fetch("/api/robots")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.conteudo) return;
        // O conteúdo salvo é texto livre — registra como pubConteudo para
        // acionar o indicador de divergência se diferir dos controles atuais
        setPubConteudo((prev) => prev ?? data.conteudo);
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Verifica o arquivo publicado no domínio real
  useEffect(() => {
    setVerificando(true);
    fetch(URL_PUBLICADO, { cache: "no-store" })
      .then(async (r) => {
        const status = r.status;
        const rawDate = r.headers.get("Last-Modified") ?? r.headers.get("Date");
        const data = rawDate ? formatarDataHora(new Date(rawDate)) : null;
        const texto = status === 200 ? await r.text() : null;
        setPubStatus(status);
        setPubData(data);
        setPubConteudo(texto);
      })
      .catch(() => setPubStatus(-1))
      .finally(() => setVerificando(false));
  }, []);

  // Detecta robots.txt físico em public/ — sobrescreve o arquivo gerado
  useEffect(() => {
    fetch("/robots.txt")
      .then((r) => {
        if (r.ok) return r.text();
      })
      .then((txt) => {
        if (txt && txt.includes("User-agent")) {
          setArquivoFisico("public/robots.txt");
        }
      })
      .catch(() => {});
  }, []);

  /* ── Modo de IA atual ── */
  const modoAtual = detectarModo(respostas, treinamento);

  function aplicarModo(modo: ModoIA) {
    if (modo === "all") {
      setRespostas(initAtivados(BOTS_RESPOSTAS));
      setTreinamento(initAtivados(BOTS_TREINAMENTO));
    } else if (modo === "cite-only") {
      setRespostas(initAtivados(BOTS_RESPOSTAS));
      setTreinamento(initDesativados(BOTS_TREINAMENTO));
    } else if (modo === "none") {
      setRespostas(initDesativados(BOTS_RESPOSTAS));
      setTreinamento(initDesativados(BOTS_TREINAMENTO));
    }
  }

  /* ── Conteúdo gerado ── */
  const conteudo = useMemo(
    () => gerarRobots(respostas, treinamento, paths, DOMINIO),
    [respostas, treinamento, paths, DOMINIO],
  );

  /* ── Estado dos bloqueios ── */
  const totalBloqueados = useMemo(
    () =>
      BOTS_RESPOSTAS.filter((b) => !respostas[b.id]).length +
      BOTS_TREINAMENTO.filter((b) => !treinamento[b.id]).length,
    [respostas, treinamento],
  );

  const labelEstado =
    totalBloqueados === 0
      ? "Nenhum rastreador bloqueado. O arquivo não precisa nomear ninguém."
      : `${totalBloqueados} rastreador${totalBloqueados > 1 ? "es" : ""} bloqueado${totalBloqueados > 1 ? "s" : ""}. Cada um vira um bloco no arquivo.`;

  /* ── Alertas de noindex × robots ── */
  const alertasNoindex = useMemo(() => {
    type Alerta = { path: string; titulo: string; url: string };
    const alertas: Alerta[] = [];
    for (const p of paths) {
      const prefixo = p.endsWith("*") ? p.slice(0, -1) : p;
      for (const post of posts) {
        if (!post.noindex) continue;
        const url = urlPost(post.slug);
        if (url === p || url.startsWith(prefixo)) {
          alertas.push({ path: p, titulo: post.titulo, url });
        }
      }
    }
    return alertas;
  }, [paths, posts]);

  /* ── Caminhos ── */
  function adicionarPath() {
    const p = novoPath.trim();
    setErroCaminho(null);

    if (!p || p === "/") {
      setErroCaminho("Não é possível bloquear a raiz «/».");
      return;
    }
    if (!p.startsWith("/")) {
      setErroCaminho("O caminho deve começar com «/».");
      return;
    }
    const prefixo = p.endsWith("*") ? p.slice(0, -1) : p;
    const afetada = paginas.find(
      (pg) =>
        pg.status === "publicado" &&
        (pg.url === p || pg.url.startsWith(prefixo)),
    );
    if (afetada) {
      setErroCaminho(
        `Este caminho bloquearia a página "${afetada.titulo}", que é indexável.`,
      );
      return;
    }
    if (paths.includes(p)) {
      setErroCaminho("Este caminho já está na lista.");
      return;
    }
    setPaths((prev) => [...prev, p]);
    setNovoPath("");
  }

  function removerPath(p: string) {
    setPaths((prev) => prev.filter((x) => x !== p));
  }

  function salvar() {
    setRobots(conteudo);
    // Persistir no arquivo real
    fetch("/api/robots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo }),
    }).catch(console.error);
    setSalvando("salvo");
    setTimeout(() => setSalvando("idle"), 2000);
  }

  const divergente =
    pubStatus === 200 &&
    pubConteudo !== null &&
    pubConteudo.trim() !== conteudo.trim();

  return (
    <div className="flex min-h-full flex-col">

      {/* header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-6 py-3">
        <h1 className="text-[14px] font-semibold text-[var(--ink)]">robots.txt</h1>
        <Botao variante="primario" tamanho="sm" onClick={salvar}>
          {salvando === "salvo" ? "Salvo ✓" : "Salvar"}
        </Botao>
      </div>

      {/* aviso arquivo físico */}
      {arquivoFisico && (
        <div className="flex items-start gap-3 border-b border-danger/40 bg-danger/8 px-6 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--danger)]" />
          <p className="text-[12px] text-[var(--ink)]">
            <span className="font-semibold text-[var(--danger)]">Arquivo físico detectado.</span>{" "}
            Existe um{" "}
            <code className="rounded bg-[var(--surface)] px-1 font-mono text-[11px]">
              {arquivoFisico}
            </code>{" "}
            no repositório. Ele sobrescreve o arquivo gerado aqui — estas configurações não valem
            enquanto o arquivo físico existir. Remova-o do repositório para que o painel volte a
            controlar.
          </p>
        </div>
      )}

      {/* body — duas colunas */}
      <div className="grid flex-1 grid-cols-[520px_1fr] divide-x divide-[var(--line)]">

        {/* ── coluna esquerda: controles ── */}
        <div className="space-y-5 overflow-y-auto p-6">

          {/* ── A: bloco de explicação ── */}
          <p className="text-[12.5px] leading-relaxed text-[var(--ink-muted)]">
            O robots.txt diz aos rastreadores quais caminhos deste site eles não devem buscar.
            É um pedido, não uma tranca, e não tira páginas da busca — quem faz isso é a marcação
            noindex de cada página.
            Se um caminho está liberado, ele não precisa ser escrito no arquivo: a regra geral já
            cobre todos os rastreadores.
          </p>

          {/* ── Buscadores tradicionais ── */}
          <section className="space-y-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <div>
              <p className="text-[12.5px] font-semibold text-[var(--ink)]">
                Buscadores tradicionais
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                Sempre permitidos. Cobertos por{" "}
                <code className="font-mono">User-agent: *</code>.
              </p>
            </div>

            <div className="rounded-[var(--radius)] border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-3 py-2">
              <p className="text-[11px] text-[var(--primary)]">
                Bloquear estes remove o site da busca. Não editável.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {BUSCADORES_FIXOS.map((bot) => (
                <span
                  key={bot}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]"
                >
                  <Lock size={9} className="shrink-0 opacity-50" />
                  {bot}
                </span>
              ))}
            </div>
          </section>

          {/* ── B: Assistentes de IA ── */}
          <section className="space-y-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-[12.5px] font-semibold text-[var(--ink)]">
              Assistentes de IA
            </p>

            {/* 3 opções de modo */}
            <div className="space-y-2">
              {OPCOES_MODO.map(({ value, label, descricao }) => {
                const ativo = modoAtual === value;
                return (
                  <button
                    key={value}
                    onClick={() => aplicarModo(value)}
                    className={cn(
                      "w-full rounded-[var(--radius)] border px-4 py-3 text-left transition-colors",
                      ativo
                        ? "border-[var(--primary)]/40 bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                        : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)]/50",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Radio visual */}
                      <div
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          ativo
                            ? "border-[var(--primary)] bg-[var(--primary)]"
                            : "border-[var(--line)] bg-[var(--surface)]",
                        )}
                      >
                        {ativo && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-[12.5px] font-medium text-[var(--ink)]">{label}</p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--ink-muted)]">
                          {descricao}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ajuste granular */}
            <div>
              <button
                onClick={() => setAjusteAberto((v) => !v)}
                className="flex items-center gap-1 text-[11.5px] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
              >
                {ajusteAberto ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
                Ajustar por assistente
              </button>

              {ajusteAberto && (
                <div className="mt-3 space-y-4">
                  {/* Respostas e citações */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                      Citação em respostas
                    </p>
                    <div className="rounded-[var(--radius)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-2">
                      <p className="text-[11px] text-[var(--danger)]">
                        Desligar qualquer um destes tira o site das respostas do assistente
                        correspondente.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {BOTS_RESPOSTAS.map((bot) => (
                        <div
                          key={bot.id}
                          className={cn(
                            "rounded-[var(--radius)] border px-3 py-2.5 transition-colors",
                            respostas[bot.id]
                              ? "border-[var(--line)] bg-[var(--surface)]"
                              : "border-[var(--danger)]/30 bg-[var(--danger)]/5",
                          )}
                        >
                          <Alternador
                            ativo={respostas[bot.id]}
                            onChange={(v) =>
                              setRespostas((prev) => ({ ...prev, [bot.id]: v }))
                            }
                            label={bot.id}
                            descricao={bot.descricao}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Treinamento */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                      Treinamento de modelo
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Desligar não afeta a busca do Google nem a citação em respostas de IA.
                    </p>
                    <div className="space-y-2">
                      {BOTS_TREINAMENTO.map((bot) => (
                        <div
                          key={bot.id}
                          className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5"
                        >
                          <Alternador
                            ativo={treinamento[bot.id]}
                            onChange={(v) =>
                              setTreinamento((prev) => ({ ...prev, [bot.id]: v }))
                            }
                            label={bot.id}
                            descricao={bot.descricao}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Caminhos bloqueados ── */}
          <section className="space-y-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <div>
              <p className="text-[12.5px] font-semibold text-[var(--ink)]">
                Caminhos bloqueados
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                Valem para todos os rastreadores cobertos por{" "}
                <code className="font-mono">User-agent: *</code>. Não remove da busca — só
                impede que o rastreador acesse o caminho.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {paths.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--ink)]"
                >
                  {p}
                  <button
                    onClick={() => removerPath(p)}
                    className="ml-0.5 text-[var(--ink-muted)]/60 hover:text-[var(--danger)]"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              {paths.length === 0 && (
                <span className="text-[11.5px] text-[var(--ink-muted)]">
                  Nenhum caminho bloqueado.
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={novoPath}
                onChange={(e) => {
                  setNovoPath(e.target.value);
                  setErroCaminho(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && adicionarPath()}
                placeholder="/caminho/a/bloquear"
                className="flex-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[12px] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/50 focus:border-[var(--primary)] focus:outline-none"
              />
              <Botao variante="secundario" tamanho="sm" onClick={adicionarPath}>
                <Plus size={13} />
                Adicionar
              </Botao>
            </div>
            {erroCaminho && (
              <p className="text-[11px] text-[var(--danger)]">{erroCaminho}</p>
            )}
          </section>
        </div>

        {/* ── coluna direita: preview ── */}
        <div className="flex flex-col bg-[var(--surface-2)]">

          {/* cabeçalho do preview */}
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
            <span className="font-mono text-[12px] font-semibold text-[var(--ink)]">
              robots.txt
            </span>
            <div className="flex items-center gap-3">
              {verificando ? (
                <span className="text-[11.5px] text-[var(--ink-muted)]">Verificando…</span>
              ) : divergente ? (
                <span className="text-[11.5px] font-medium text-[#d97706]">
                  ⚠ O arquivo no ar é de um deploy anterior. Publique para atualizar.
                </span>
              ) : pubStatus === 200 ? (
                <span className="text-[11.5px] text-[var(--success)]">
                  ✓ Publicado · 200{pubData ? ` · atualizado em ${pubData}` : ""}
                </span>
              ) : pubStatus === 404 ? (
                <span className="text-[11.5px] text-[var(--danger)]">
                  ✗ Não encontrado · 404 · o arquivo ainda não foi ao ar neste deploy
                </span>
              ) : null}
              <a
                href={URL_PUBLICADO}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11.5px] text-[var(--primary)] hover:underline"
              >
                Ver publicado <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* ── C: label de estado ── */}
          <div
            className={cn(
              "border-b border-[var(--line)] px-5 py-2.5",
              totalBloqueados === 0
                ? "bg-[var(--surface)]"
                : "bg-[color-mix(in_srgb,#f59e0b_6%,transparent)]",
            )}
          >
            <p
              className={cn(
                "text-[11.5px]",
                totalBloqueados === 0
                  ? "text-[var(--ink-muted)]"
                  : "text-[#b45309] font-medium",
              )}
            >
              {labelEstado}
            </p>
          </div>

          {/* conteúdo do arquivo */}
          <pre className="flex-1 overflow-y-auto whitespace-pre p-5 font-mono text-[12px] leading-relaxed text-[var(--ink)]">
            {conteudo}
          </pre>

          {/* ── D: alertas noindex × robots ── */}
          {alertasNoindex.length > 0 && (
            <div className="border-t border-[var(--danger)]/30 bg-[var(--danger)]/5 px-5 py-4 space-y-3">
              {alertasNoindex.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0 text-[var(--danger)]"
                  />
                  <p className="text-[12px] text-[var(--ink)]">
                    <span className="font-semibold text-[var(--danger)]">
                      Conflito noindex:
                    </span>{" "}
                    A página{" "}
                    <span className="font-medium">"{a.titulo}"</span> está marcada
                    para não aparecer na busca, mas o caminho{" "}
                    <code className="rounded bg-[var(--surface)] px-1 font-mono text-[11px]">
                      {a.path}
                    </code>{" "}
                    bloqueia o rastreador de ler essa marcação. O Google não consegue
                    processar o noindex e a página pode continuar indexada.{" "}
                    <span className="text-[var(--ink-muted)]">
                      Libere o rastreamento e mantenha só o noindex.
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
