"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePaginasReais } from "@/lib/usePaginasReais";
import { urlCategoria, urlPost } from "@/lib/urls-publicas";
import { Alternador, Botao } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Categoria, Pagina, Post } from "@/mock/types";

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
const RESUMO_DEFAULT =
  "";
const HOJE = new Date();
const CORTE_12M = new Date(HOJE);
CORTE_12M.setFullYear(CORTE_12M.getFullYear() - 1);
const LIMITE = 5;
const LIMITE_AVISO_MANUAL = 15;

/* ------------------------------------------------------------------ */
/* Lógica de seleção automática                                         */
/* ------------------------------------------------------------------ */

type Motivo =
  | "noindex"
  | "post_antigo"
  | "corte_5"
  | "fora_top5_categorias";

interface ItemExcluido {
  titulo: string;
  motivo: Motivo;
}

interface Selecao {
  paginas: Pagina[];
  posts: Post[];
  categorias: Categoria[];
  excluidos: ItemExcluido[];
}

function motivoLabel(m: Motivo): string {
  switch (m) {
    case "noindex": return "noindex ativo";
    case "post_antigo": return "publicado há mais de 12 meses";
    case "corte_5": return "fora do corte de 5";
    case "fora_top5_categorias": return "fora das 5 categorias com mais conteúdo";
  }
}

const TIPO_PRIORIDADE: Record<string, number> = {
  home: 0,
  money: 0,
  pilar: 1,
  institucional: 2,
  supporting: 3,
};

function selecionarAutomatico(
  paginas: Pagina[],
  posts: Post[],
  categorias: Categoria[],
): Selecao {
  const excluidos: ItemExcluido[] = [];

  // Páginas: publicadas, sem equivalente noindex (Pagina não tem campo noindex)
  const paginasPublicadas = paginas.filter((p) => p.status === "publicado");
  const paginasOrdenadas = [...paginasPublicadas].sort(
    (a, b) => (TIPO_PRIORIDADE[a.tipo] ?? 9) - (TIPO_PRIORIDADE[b.tipo] ?? 9),
  );
  const paginasSel = paginasOrdenadas.slice(0, LIMITE);
  paginasOrdenadas.slice(LIMITE).forEach((p) =>
    excluidos.push({ titulo: p.titulo, motivo: "corte_5" }),
  );

  // Posts: publicados, não noindex, últimos 12 meses, sort por data DESC, top 5
  const postsPublicados = posts.filter((p) => p.status === "publicado");
  const postsNoindex = postsPublicados.filter((p) => p.noindex);
  postsNoindex.forEach((p) =>
    excluidos.push({ titulo: p.titulo, motivo: "noindex" }),
  );
  const postsIndexaveis = postsPublicados.filter((p) => !p.noindex);
  const postsRecentes = postsIndexaveis.filter((p) => {
    const d = new Date(p.data);
    return d >= CORTE_12M;
  });
  const postsAntigos = postsIndexaveis.filter((p) => new Date(p.data) < CORTE_12M);
  postsAntigos.forEach((p) =>
    excluidos.push({ titulo: p.titulo, motivo: "post_antigo" }),
  );
  const postsOrdenados = [...postsRecentes].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
  const postsSel = postsOrdenados.slice(0, LIMITE);
  postsOrdenados.slice(LIMITE).forEach((p) =>
    excluidos.push({ titulo: p.titulo, motivo: "corte_5" }),
  );

  // Categorias: top 5 por contagem de posts associados
  const contagem: Record<string, number> = {};
  for (const p of postsPublicados) {
    contagem[p.categoriaId] = (contagem[p.categoriaId] ?? 0) + 1;
  }
  const catOrdenadas = [...categorias].sort(
    (a, b) => (contagem[b.id] ?? 0) - (contagem[a.id] ?? 0),
  );
  const catSel = catOrdenadas.slice(0, LIMITE);
  catOrdenadas.slice(LIMITE).forEach((c) =>
    excluidos.push({ titulo: c.nome, motivo: "fora_top5_categorias" }),
  );

  return { paginas: paginasSel, posts: postsSel, categorias: catSel, excluidos };
}

/* ------------------------------------------------------------------ */
/* Geração do arquivo                                                   */
/* ------------------------------------------------------------------ */

function gerarLlms(
  nomeSite: string,
  resumo: string,
  paginas: Pagina[],
  posts: Post[],
  categorias: Categoria[],
  baseUrl: string,
): string {
  const linhas: string[] = [];
  linhas.push(`# ${nomeSite}`);
  linhas.push("");
  linhas.push(`> ${resumo}`);
  linhas.push("");

  if (paginas.length) {
    linhas.push("## Páginas principais");
    for (const p of paginas) {
      const desc = p.metaDescription ? `: ${p.metaDescription}` : "";
      linhas.push(`- [${p.titulo}](${baseUrl}${p.url})${desc}`);
    }
    linhas.push("");
  }

  if (posts.length) {
    linhas.push("## Conteúdo recente");
    for (const p of posts) {
      const desc = p.metaDescription ? `: ${p.metaDescription}` : "";
      linhas.push(`- [${p.titulo}](${baseUrl}${urlPost(p.slug)})${desc}`);
    }
    linhas.push("");
  }

  const categoriasComSlug = categorias.filter((c) => c.slug);
  if (categoriasComSlug.length) {
    linhas.push("## Categorias do blog");
    for (const c of categoriasComSlug) {
      const desc = c.metaDescription || c.descricao ? `: ${c.metaDescription || c.descricao}` : "";
      linhas.push(`- [${c.nome}](${baseUrl}${urlCategoria(c.slug)})${desc}`);
    }
    linhas.push("");
  }

  linhas.push(`O sitemap XML deste site está em ${baseUrl}/sitemap.xml.`);

  return linhas.join("\n").trimEnd();
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

type Modo = "automatico" | "manual";

export default function LlmsPage() {
  const { setLlms, posts, categorias, aparencia } = useStore();
  // Páginas reais do site (dist/), nunca o mock do store: o llms.txt gerado
  // aqui é PUBLICADO no site do cliente (api/llms grava em public/llms.txt).
  const { paginas } = usePaginasReais();
  const [BASE_URL, setBaseUrl] = useState("https://seudominio.com.br");
  const URL_PUBLICADO = `${BASE_URL}/llms.txt`;

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { if (data.ok && data.config?.dominioHost) setBaseUrl(`https://${data.config.dominioHost}`); })
      .catch(console.error);
  }, []);
  const nomeSite = aparencia.nomeSite || "";

  const [ativo, setAtivo] = useState(true);
  const [resumo, setResumo] = useState(RESUMO_DEFAULT);
  const [modo, setModo] = useState<Modo>("automatico");
  const [manualSel, setManualSel] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [pubStatus, setPubStatus] = useState<number | null>(null);
  const [pubData, setPubData] = useState<string | null>(null);
  const [pubConteudo, setPubConteudo] = useState<string | null>(null);

  // Seleção automática
  const selecao = useMemo(
    () => selecionarAutomatico(paginas, posts, categorias),
    [paginas, posts, categorias],
  );

  // Itens para o modo manual (todas as páginas + posts publicados)
  const todosItensManual = useMemo(() => {
    const pgs = paginas
      .filter((p) => p.status === "publicado")
      .map((p) => ({ id: `pag:${p.id}`, label: p.titulo, url: `${BASE_URL}${p.url}`, desc: p.metaDescription }));
    const ps = posts
      .filter((p) => p.status === "publicado" && !p.noindex)
      .map((p) => ({ id: `post:${p.id}`, label: p.titulo, url: `${BASE_URL}${urlPost(p.slug)}`, desc: p.metaDescription }));
    return [...pgs, ...ps];
  }, [paginas, posts, BASE_URL]);

  // Arquivo gerado
  const gerado = useMemo(() => {
    if (!ativo) return "";
    if (modo === "automatico") {
      return gerarLlms(nomeSite, resumo, selecao.paginas, selecao.posts, selecao.categorias, BASE_URL);
    }
    // manual: itens selecionados → build flat list
    const sel = todosItensManual.filter((i) => manualSel.has(i.id));
    const selPags = sel.filter((i) => i.id.startsWith("pag:")).map((i) => ({ titulo: i.label, url: i.url.replace(BASE_URL, ""), metaDescription: i.desc } as Pagina));
    const selPosts = sel.filter((i) => i.id.startsWith("post:")).map((i) => ({ titulo: i.label, slug: i.url.replace(`${BASE_URL}/`, ""), metaDescription: i.desc } as Post));
    return gerarLlms(nomeSite, resumo, selPags as Pagina[], selPosts as Post[], [], BASE_URL);
  }, [ativo, modo, nomeSite, resumo, selecao, manualSel, todosItensManual, BASE_URL]);

  const countSel = manualSel.size;

  function toggleManual(id: string) {
    setManualSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

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

  const divergente =
    pubStatus === 200 &&
    pubConteudo !== null &&
    pubConteudo.trim() !== gerado.trim();

  // Carregar llms.txt real ao montar
  useEffect(() => {
    fetch("/api/llms")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.conteudo) {
          setLlms(data.conteudo);
          setAtivo(data.conteudo.length > 0);
        }
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function salvar() {
    setSalvando(true);
    const conteudoFinal = ativo ? gerado : "";
    setLlms(conteudoFinal);
    // Persistir no arquivo real
    fetch("/api/llms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo: conteudoFinal }),
    }).catch(console.error);
    setTimeout(() => setSalvando(false), 800);
  }

  const totalIncluso = selecao.paginas.length + selecao.posts.length + selecao.categorias.length;
  const totalExcluido = selecao.excluidos.length;

  return (
    <div className="flex min-h-full flex-col">
      {/* header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <h1 className="text-[14px] font-semibold text-ink">llms.txt</h1>
        <Botao variante="primario" tamanho="sm" onClick={salvar}>
          {salvando ? "Salvo ✓" : "Salvar"}
        </Botao>
      </div>

      <div className="grid flex-1 grid-cols-[520px_1fr] divide-x divide-line">
        {/* ── coluna esquerda — controles ── */}
        <div className="overflow-y-auto p-6 space-y-5">

          {/* A1 — info como texto corrido, sem card */}
          <p className="text-[12px] leading-relaxed text-ink-muted">
            O llms.txt destaca o conteúdo mais importante para assistentes de IA — não lista tudo.
            Google não usa. Claude e Perplexity leem. Destaque e sitemap são complementares.
          </p>

          {/* A2 — toggle: linha simples, sem card */}
          <Alternador ativo={ativo} onChange={setAtivo} label="Gerar llms.txt" />

          <div className={cn("space-y-5 transition-opacity", !ativo && "pointer-events-none opacity-40")}>

            {/* resumo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium text-ink">Resumo do negócio</p>
                <span className={cn("font-mono text-[10.5px]", resumo.length > 300 ? "text-danger" : "text-ink-muted")}>
                  {resumo.length}/300
                </span>
              </div>
              <textarea
                value={resumo}
                onChange={(e) => setResumo(e.target.value.slice(0, 300))}
                rows={3}
                className="w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-2 text-[12px] text-ink placeholder:text-ink-muted/50 resize-y focus:border-primary focus:outline-none"
                placeholder="Descreva o negócio em até 300 caracteres…"
              />
            </div>

            {/* A3 — modo: radio buttons empilhados */}
            <div className="space-y-2">
              <p className="text-[12px] font-medium text-ink">Modo de seleção</p>
              <div className="space-y-1.5">
                {(
                  [
                    { value: "automatico", label: "Automático", desc: "as páginas são escolhidas pela regra abaixo" },
                    { value: "manual", label: "Manual", desc: "você escolhe uma a uma" },
                  ] as { value: Modo; label: string; desc: string }[]
                ).map(({ value, label, desc }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="radio"
                      name="modo-llms"
                      value={value}
                      checked={modo === value}
                      onChange={() => setModo(value)}
                      className="shrink-0 accent-[var(--primary)]"
                    />
                    <span className="text-[12px] font-medium text-ink">{label}</span>
                    <span className="text-[12px] text-ink-muted">— {desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* A4 — regra sempre visível, peso normal */}
            <p className="text-[12px] text-ink">
              5 páginas (money e pilares primeiro) · 5 posts recentes (≤ 12 meses) ·
              5 categorias com mais conteúdo · noindex excluído sempre.
            </p>

            {/* ── AUTOMÁTICO: resumo do que entrou ── */}
            {modo === "automatico" && (
              <>
                {/* A5 — título do bloco, fora do card */}
                <p className="text-[12px] font-semibold text-ink">
                  {totalIncluso} incluídos
                  <span className="font-normal text-ink-muted"> · {totalExcluido} excluídos</span>
                </p>

                <div className="rounded-[var(--radius)] border border-line bg-surface-2 divide-y divide-line">
                {[
                  { label: "Páginas", items: selecao.paginas.map((p) => p.titulo) },
                  { label: "Posts", items: selecao.posts.map((p) => p.titulo) },
                  { label: "Categorias", items: selecao.categorias.map((c) => c.nome) },
                ].map(({ label, items }) => (
                  <div key={label} className="px-4 py-2.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
                      {label}
                    </p>
                    {items.length === 0 ? (
                      <p className="text-[11px] text-ink-muted italic">Nenhum</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {items.map((t) => (
                          <li key={t} className="flex items-baseline gap-1.5">
                            <span className="text-[10px] text-success">✓</span>
                            <span className="text-[11.5px] text-ink">{t}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {selecao.excluidos.length > 0 && (
                  <div className="px-4 py-2.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
                      Excluídos
                    </p>
                    <ul className="space-y-0.5">
                      {selecao.excluidos.map((e, i) => (
                        <li key={i} className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-ink-muted">–</span>
                          <span className="text-[11.5px] text-ink-muted">
                            {e.titulo}{" "}
                            <span className="italic">({motivoLabel(e.motivo)})</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
              </>
            )}

            {/* ── MANUAL: lista de checkboxes ── */}
            {modo === "manual" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-ink">
                    Selecionar páginas / posts / categorias
                  </p>
                  <span
                    className={cn(
                      "text-[11px]",
                      countSel > LIMITE_AVISO_MANUAL ? "font-semibold text-danger" : "text-ink-muted",
                    )}
                  >
                    {countSel} selecionado{countSel !== 1 ? "s" : ""}
                  </span>
                </div>

                {countSel > LIMITE_AVISO_MANUAL && (
                  <div className="flex items-start gap-2 rounded-[var(--radius)] border border-accent/40 bg-accent/8 px-3 py-2">
                    <Info size={12} className="mt-0.5 shrink-0 text-accent" />
                    <p className="text-[11px] text-ink">
                      Quanto mais páginas, menos o arquivo cumpre sua função de destacar o que importa.
                    </p>
                  </div>
                )}

                <div className="rounded-[var(--radius)] border border-line bg-surface-2 divide-y divide-line max-h-72 overflow-y-auto">
                  {todosItensManual.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-surface transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={manualSel.has(item.id)}
                        onChange={() => toggleManual(item.id)}
                        className="mt-0.5 accent-[var(--primary)]"
                      />
                      <div className="min-w-0">
                        <p className="text-[12px] text-ink leading-tight">{item.label}</p>
                        <p className="font-mono text-[10.5px] text-ink-muted truncate">{item.url.replace(BASE_URL, "")}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── coluna direita — preview ── */}
        <div className="flex flex-col bg-surface-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="font-mono text-[12px] font-medium text-ink">llms.txt</p>
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

          <div className="relative flex-1 overflow-hidden">
            <pre
              className={cn(
                "h-full overflow-y-auto p-5 font-mono text-[11.5px] leading-relaxed text-ink whitespace-pre-wrap",
                !ativo && "opacity-30 select-none",
              )}
            >
              {ativo
                ? (gerado || "Nenhum item selecionado.")
                : "# Arquivo desabilitado\n\nO llms.txt não será gerado enquanto o toggle estiver desligado."}
            </pre>
            {!ativo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-[var(--radius)] border border-line bg-surface px-4 py-2 text-[12px] font-medium text-ink-muted shadow-sm">
                  Arquivo desabilitado
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
