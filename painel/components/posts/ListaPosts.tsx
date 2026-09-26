"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  Plus,
  Settings2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDominio } from "@/lib/useDominio";
import type { Post as PostBase, StatusPost } from "@/mock/types";

// Tipo usado pelo ListaPosts: o tipo completo do Jorge + campos extras
// que o componente usa (oriundos do modelo anterior do mock).
// Todos os campos extras são opcionais para não quebrar posts reais.
export type { StatusPost };
export interface Post extends PostBase {
  // Campos extras do ListaPosts (opcionais — preenchidos com defaults na API)
  autor?: string;
  categorias?: string[];
  dataAgendamento?: string;
  palavraChave?: string;
  palavrasChaveSecundarias?: string[];
  pontuacaoSEO?: number | null;
  temSchema?: boolean;
  linksInternos?: number;
  titleSEO?: string;
  origemAgente?: boolean;
}

// Mocks de fallback (usados quando a API não está disponível)
const AUTORES_MOCK: { id: string; nome: string }[] = [
  { id: "u1", nome: "Operador" },
];
const CATEGORIAS_MOCK: string[] = ["Blog", "Serviços", "Notícias"];
const POSTS_MOCK: Post[] = [];

/* ------------------------------------------------------------------ */
/* Constantes                                                            */
/* ------------------------------------------------------------------ */

const COLUNAS_CONFIG = [
  { id: "autor", rotulo: "Autor" },
  { id: "categorias", rotulo: "Categorias" },
  { id: "data", rotulo: "Data" },
  { id: "palavraChave", rotulo: "Palavra-chave" },
  { id: "seo", rotulo: "SEO" },
  { id: "schema", rotulo: "Schema" },
  { id: "linksInternos", rotulo: "Links" },
] as const;

type ColunaId = (typeof COLUNAS_CONFIG)[number]["id"];

const COLUNAS_DEFAULT = new Set<ColunaId>([
  "autor",
  "categorias",
  "data",
  "palavraChave",
  "seo",
  "schema",
  "linksInternos",
]);

const ITENS_POR_PAGINA_OPCOES = [5, 10, 20, 50];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatarData(iso: string, curto = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  if (curto) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  }
  return new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "long",
  }).format(d);
}

function formatarMesAno(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return new Intl.DateTimeFormat("pt-BR", { year: "numeric", month: "long" }).format(
    new Date(Number(y), Number(m) - 1),
  );
}

function textoStatus(status: StatusPost): string {
  const mapa: Record<StatusPost, string> = {
    publicado: "Publicado",
    rascunho: "Rascunho",
    revisao: "Em revisão",
    agendado: "Agendado",
    lixeira: "Lixeira",
  };
  return mapa[status];
}


/* ------------------------------------------------------------------ */
/* SEO — 15 testes determinísticos                                       */
/* ------------------------------------------------------------------ */

function testesFalhosSEO(post: Post): string[] {
  const falhas: string[] = [];
  const kw = (post.palavraChave ?? "").toLowerCase().trim();
  const kwSlug = kw.replace(/\s+/g, "-");

  if (!kw)
    falhas.push("Palavra-chave não definida");
  if (kw && !post.titulo.toLowerCase().includes(kw))
    falhas.push("KW ausente no título");
  if (kw && post.slug && !post.slug.includes(kwSlug))
    falhas.push("KW ausente no slug");
  if (!post.titleSEO)
    falhas.push("Title SEO vazio");
  else if (post.titleSEO.length > 70)
    falhas.push("Title SEO longo (>70 chars)");
  else if (post.titleSEO.length < 30)
    falhas.push("Title SEO curto (<30 chars)");
  if (kw && post.titleSEO && !post.titleSEO.toLowerCase().includes(kw))
    falhas.push("KW ausente no title SEO");
  if (!post.metaDescription)
    falhas.push("Meta description vazia");
  else if (post.metaDescription.length > 165)
    falhas.push("Meta description longa (>165 chars)");
  else if (post.metaDescription.length < 120)
    falhas.push("Meta description curta (<120 chars)");
  if (kw && post.metaDescription && !post.metaDescription.toLowerCase().includes(kw))
    falhas.push("KW ausente na meta description");
  if (!post.temSchema)
    falhas.push("Schema não definido"); // temSchema ?? false já tratado aqui
  if ((post.linksInternos ?? 0) < 3)
    falhas.push(`Links internos insuficientes (${post.linksInternos ?? 0}/3)`);
  if ((post.categorias ?? []).length === 0)
    falhas.push("Sem categoria definida");
  if (!post.slug)
    falhas.push("Slug vazio");
  if ((post.palavrasChaveSecundarias ?? []).length === 0)
    falhas.push("Sem palavras-chave secundárias");

  return falhas;
}

/* ------------------------------------------------------------------ */
/* Sub-componentes                                                       */
/* ------------------------------------------------------------------ */

function FarolSEO({ post }: { post: Post }) {
  const kw = (post.palavraChave ?? "").trim();
  if (!kw) {
    return (
      <div className="group/farol relative inline-flex justify-center">
        <span className="inline-block h-4 w-4 cursor-default rounded-full bg-ink-muted/30" />
        <div className="pointer-events-none invisible absolute bottom-full right-0 z-50 mb-1.5 whitespace-nowrap rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] text-ink shadow-lg group-hover/farol:visible">
          Sem palavra-chave definida
        </div>
      </div>
    );
  }
  const falhas = testesFalhosSEO(post);
  const cor =
    falhas.length === 0
      ? "bg-success"
      : falhas.length <= 2
        ? "bg-accent"
        : "bg-danger";
  return (
    <div className="group/farol relative inline-flex justify-center">
      <span className={cn("inline-block h-4 w-4 cursor-default rounded-full", cor)} />
      {falhas.length > 0 && (
        <div className="pointer-events-none invisible absolute bottom-full right-0 z-50 mb-1.5 w-56 rounded-lg border border-line bg-surface-2 p-2.5 text-left text-[11px] shadow-lg group-hover/farol:visible">
          <p className="mb-1 font-semibold text-ink">
            {falhas.length} item{falhas.length > 1 ? "s" : ""} pendente{falhas.length > 1 ? "s" : ""}
          </p>
          <ul className="space-y-0.5">
            {falhas.map((f) => (
              <li key={f} className="text-danger">
                ✗ {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SemPalavraChave() {
  return (
    <div className="group/alerta relative inline-flex">
      <AlertTriangle size={13} className="text-amber-400" />
      <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] text-ink shadow-lg group-hover/alerta:visible">
        Sem palavra-chave definida
      </span>
    </div>
  );
}

function IndicadorSchema({ tem }: { tem: boolean }) {
  return tem ? (
    <CheckCircle2 size={15} className="text-success" />
  ) : (
    <AlertCircle size={15} className="text-danger" />
  );
}

/* ------------------------------------------------------------------ */
/* Edição rápida                                                         */
/* ------------------------------------------------------------------ */

interface EdicaoRapidaProps {
  post: Post;
  colspan: number;
  onSalvar: (id: string, dados: Partial<Post>) => Promise<void>;
  onCancelar: () => void;
}

function EdicaoRapida({ post, colspan, onSalvar, onCancelar }: EdicaoRapidaProps) {
  const dominio = useDominio();
  const [titulo, setTitulo] = useState(post.titulo);
  const [slug, setSlug] = useState(post.slug);
  const [status, setStatus] = useState<StatusPost>(post.status);
  const [autorId, setAutorId] = useState(post.autorId);
  const [categorias, setCategorias] = useState<string[]>(post.categorias ?? []);
  const [palavraChave, setPalavraChave] = useState(post.palavraChave ?? "");
  const [titleSEO, setTitleSEO] = useState(post.titleSEO ?? "");
  const [metaDescription, setMetaDescription] = useState(post.metaDescription);
  const [dataPublicacao, setDataPublicacao] = useState(
    post.data.slice(0, 16),
  );
  const [salvando, setSalvando] = useState(false);

  const toggleCategoria = (cat: string) =>
    setCategorias((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );

  const handleSalvar = async () => {
    setSalvando(true);
    await onSalvar(post.id, {
      titulo,
      slug,
      status,
      autorId,
      autor: AUTORES_MOCK.find((a) => a.id === autorId)?.nome ?? post.autor,
      categorias,
      palavraChave,
      titleSEO,
      metaDescription,
      data: new Date(dataPublicacao).toISOString(),
    });
    setSalvando(false);
  };

  return (
    <tr>
      <td
        colSpan={colspan}
        className="border-b border-line bg-secondary p-0"
      >
        <div className="border-t-2 border-primary px-4 py-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-3">
            {/* Título */}
            <div className="col-span-2 lg:col-span-2">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Título
              </label>
              <input
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Status
              </label>
              <select
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusPost)}
              >
                <option value="publicado">Publicado</option>
                <option value="rascunho">Rascunho</option>
                <option value="revisao">Em revisão</option>
                <option value="agendado">Agendado</option>
                <option value="lixeira">Lixeira</option>
              </select>
            </div>

            {/* Slug */}
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Slug
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-ink-muted">{dominio || "seudominio.com.br"}/</span>
                <input
                  className="min-w-0 flex-1 rounded border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-ink focus:border-primary focus:outline-none"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            {/* Autor */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Autor
              </label>
              <select
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={autorId}
                onChange={(e) => setAutorId(e.target.value)}
              >
                {AUTORES_MOCK.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Data
              </label>
              <input
                type="datetime-local"
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
              />
            </div>

            {/* Palavra-chave */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Palavra-chave
              </label>
              <input
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={palavraChave}
                onChange={(e) => setPalavraChave(e.target.value)}
              />
            </div>

            {/* Categorias */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Categorias
              </label>
              <div className="space-y-1">
                {CATEGORIAS_MOCK.map((cat) => (
                  <label key={cat} className="flex items-center gap-1.5 text-[12.5px]">
                    <input
                      type="checkbox"
                      checked={categorias.includes(cat)}
                      onChange={() => toggleCategoria(cat)}
                      className="accent-primary"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* Title SEO */}
            <div className="col-span-2 lg:col-span-2">
              <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                <span>Title SEO</span>
                <span className={titleSEO.length > 70 ? "text-danger" : ""}>
                  {titleSEO.length}/70
                </span>
              </label>
              <input
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={titleSEO}
                onChange={(e) => setTitleSEO(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Meta description */}
            <div className="col-span-2 lg:col-span-3">
              <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                <span>Meta description</span>
                <span
                  className={
                    metaDescription.length > 165 ? "text-danger" :
                    metaDescription.length > 0 && metaDescription.length < 80 ? "text-accent" : ""
                  }
                >
                  {metaDescription.length}/165
                </span>
              </label>
              <textarea
                rows={2}
                className="w-full resize-none rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-ink disabled:opacity-60"
            >
              {salvando && <Loader2 size={12} className="animate-spin" />}
              {salvando ? "Salvando…" : "Atualizar"}
            </button>
            <button
              onClick={onCancelar}
              className="px-3 py-1.5 text-[12.5px] text-ink-muted hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Toast                                                                 */
/* ------------------------------------------------------------------ */

function Toast({
  mensagem,
  tipo,
}: {
  mensagem: string;
  tipo: "sucesso" | "erro";
}) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium shadow-[var(--shadow-card)]",
        tipo === "sucesso" ? "bg-success text-white" : "bg-danger text-white",
      )}
    >
      {tipo === "sucesso" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {mensagem}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                  */
/* ------------------------------------------------------------------ */

export function ListaPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [abaCorrente, setAbaCorrente] = useState<StatusPost | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroAutor, setFiltroAutor] = useState("");
  const [filtroSEO, setFiltroSEO] = useState("");
  const [acaoEmMassa, setAcaoEmMassa] = useState("");

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [edicaoRapida, setEdicaoRapida] = useState<string | null>(null);

  const [opcoesTela, setOpcoesTela] = useState(false);
  const [colunasVisiveis, setColunasVisiveis] = useState<Set<ColunaId>>(COLUNAS_DEFAULT);
  const [itensPorPagina, setItensPorPagina] = useState(20);
  const [itensPorPaginaInput, setItensPorPaginaInput] = useState(20);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [ordenacao, setOrdenacao] = useState<{ col: string; dir: "asc" | "desc" }>({
    col: "data",
    dir: "desc",
  });

  const [toast, setToast] = useState<{ mensagem: string; tipo: "sucesso" | "erro" } | null>(null);

  const refOpcoes = useRef<HTMLDivElement>(null);

  /* Carregamento real via API */
  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.posts)) {
          const postsReais: Post[] = data.posts.map((p: Record<string, unknown>) => ({
            // Campos do tipo base do Jorge (todos obrigatórios)
            id: String(p.slug ?? p.id ?? ""),
            slug: String(p.slug ?? ""),
            titulo: String(p.titulo ?? p.title ?? "(sem título)"),
            resumo: String(p.resumo ?? p.descricao ?? ""),
            corpo: String(p.corpo ?? ""),
            autorId: String(p.autorId ?? p.autor ?? ""),
            categoriaId: String(p.categoriaId ?? p.categoria ?? ""),
            data: String(p.data ?? p.publicadoEm ?? ""),
            status: (p.status as StatusPost) ?? "rascunho",
            destaque: Boolean(p.destaque),
            seoTitle: String(p.seoTitle ?? p.titulo ?? ""),
            metaDescription: String(p.metaDescription ?? p.descricao ?? ""),
            canonical: String(p.canonical ?? ""),
            noindex: Boolean(p.noindex),
            ogImagem: String(p.ogImagem ?? ""),
            schemaTipo: (p.schemaTipo as Post["schemaTipo"]) ?? "Article",
            faq: Array.isArray(p.faq) ? p.faq : [],
            capa: String(p.capa ?? ""),
            capaAlt: String(p.capaAlt ?? ""),
            fontes: Array.isArray(p.fontes) ? p.fontes : [],
            palavras: Number(p.palavras ?? 0),
            kwPrimaria: String(p.palavraChave ?? ""),
            // Campos extras do ListaPosts (opcionais)
            palavraChave: String(p.palavraChave ?? ""),
            titleSEO: String(p.seoTitle ?? p.titulo ?? ""),
            categorias: p.categoriaId ? [String(p.categoriaId)] : [],
            pontuacaoSEO: null,
            temSchema: false,
            linksInternos: 0,
            palavrasChaveSecundarias: [],
            origemAgente: true,
          }));
          setPosts(postsReais);
        } else {
          setPosts(POSTS_MOCK);
        }
      })
      .catch(() => setPosts(POSTS_MOCK))
      .finally(() => setCarregando(false));
  }, []);

  /* Persistir opções de tela em localStorage */
  useEffect(() => {
    try {
      const c = localStorage.getItem("sf-posts-colunas");
      if (c) setColunasVisiveis(new Set(JSON.parse(c) as ColunaId[]));
      const i = localStorage.getItem("sf-posts-ipp");
      if (i) {
        setItensPorPagina(Number(i));
        setItensPorPaginaInput(Number(i));
      }
    } catch {}
  }, []);

  /* Fechar painel de opções ao clicar fora */
  useEffect(() => {
    if (!opcoesTela) return;
    const handler = (e: MouseEvent) => {
      if (!refOpcoes.current?.contains(e.target as Node)) setOpcoesTela(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [opcoesTela]);

  const mostrarToast = (mensagem: string, tipo: "sucesso" | "erro" = "sucesso") => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  /* Contagens por status — baseadas nos posts reais carregados */
  const contagens = useMemo(() => {
    return {
      todos: posts.length,
      publicado: posts.filter((p) => p.status === "publicado").length,
      rascunho: posts.filter((p) => p.status === "rascunho").length,
      revisao: posts.filter((p) => p.status === "revisao").length,
      agendado: posts.filter((p) => p.status === "agendado").length,
      lixeira: posts.filter((p) => p.status === "lixeira").length,
    };
  }, [posts]);

  /* Meses únicos para o filtro de data — baseados nos posts reais */
  const mesesUnicos = useMemo(() => {
    const set = new Set(posts.map((p) => p.data.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [posts]);

  /* Posts filtrados + ordenados */
  const postsFiltrados = useMemo(() => {
    let lista = [...posts];
    if (abaCorrente !== "todos") lista = lista.filter((p) => p.status === abaCorrente);
    if (filtroData) lista = lista.filter((p) => p.data.startsWith(filtroData));
    if (filtroCategoria) lista = lista.filter((p) => (p.categorias ?? []).includes(filtroCategoria));
    if (filtroAutor) lista = lista.filter((p) => p.autorId === filtroAutor);
    if (filtroSEO === "bom") lista = lista.filter((p) => p.palavraChave && testesFalhosSEO(p).length === 0);
    if (filtroSEO === "melhorar") lista = lista.filter((p) => { const n = testesFalhosSEO(p).length; return p.palavraChave && n >= 1 && n <= 2; });
    if (filtroSEO === "ruim") lista = lista.filter((p) => p.palavraChave && testesFalhosSEO(p).length >= 3);
    if (filtroSEO === "sem_analise") lista = lista.filter((p) => !p.palavraChave);
    if (busca) lista = lista.filter((p) => p.titulo.toLowerCase().includes(busca.toLowerCase()) || p.slug.includes(busca.toLowerCase()));

    lista.sort((a, b) => {
      const { col, dir } = ordenacao;
      let va: unknown, vb: unknown;
      if (col === "titulo") { va = a.titulo; vb = b.titulo; }
      else if (col === "data") { va = a.data; vb = b.data; }
      else if (col === "seo") { va = a.palavraChave ? -testesFalhosSEO(a).length : -99; vb = b.palavraChave ? -testesFalhosSEO(b).length : -99; }
      else if (col === "linksInternos") { va = a.linksInternos; vb = b.linksInternos; }
      else { va = a.data; vb = b.data; }
      if (va === vb) return 0;
      const cmp = (va as string | number) < (vb as string | number) ? -1 : 1;
      return dir === "asc" ? cmp : -cmp;
    });

    return lista;
  }, [posts, abaCorrente, filtroData, filtroCategoria, filtroAutor, filtroSEO, busca, ordenacao]);

  const totalPaginas = Math.max(1, Math.ceil(postsFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const postsPagina = postsFiltrados.slice(
    (paginaSegura - 1) * itensPorPagina,
    paginaSegura * itensPorPagina,
  );

  /* Número de colunas visíveis (para colspan) */
  const colunaVisivelCount = COLUNAS_CONFIG.filter((c) => colunasVisiveis.has(c.id)).length;
  const totalColunas = 2 + colunaVisivelCount; // checkbox + título + opcionais

  /* Seleção */
  const todasSelecionadas =
    postsPagina.length > 0 && postsPagina.every((p) => selecionados.has(p.id));

  const toggleTodas = () => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (todasSelecionadas) {
        postsPagina.forEach((p) => next.delete(p.id));
      } else {
        postsPagina.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const toggleItem = (id: string) =>
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* Atualizar post (simulado) */
  const simularSalvar = async (id: string, dados: Partial<Post>) => {
    await new Promise((res) => setTimeout(res, 700));
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...dados } : p)));
    setEdicaoRapida(null);
    mostrarToast("Post atualizado com sucesso.");
  };

  /* Ação em massa (simulada) */
  const aplicarAcao = async () => {
    if (!acaoEmMassa || selecionados.size === 0) return;
    await new Promise((res) => setTimeout(res, 600));
    if (acaoEmMassa === "lixeira") {
      setPosts((prev) =>
        prev.map((p) =>
          selecionados.has(p.id) ? { ...p, status: "lixeira" as StatusPost } : p,
        ),
      );
      mostrarToast(`${selecionados.size} post(s) movido(s) para a lixeira.`);
      setSelecionados(new Set());
    } else {
      mostrarToast(`Ação "${acaoEmMassa}" aplicada a ${selecionados.size} post(s).`);
    }
    setAcaoEmMassa("");
  };

  /* Ordenação com toggle */
  const ordenarPor = (col: string) => {
    setOrdenacao((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col, dir: "asc" },
    );
  };

  const Th = ({
    col,
    children,
    className,
  }: {
    col?: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={cn(
        "whitespace-nowrap border-b border-line px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted",
        col && "cursor-pointer select-none hover:text-ink",
        className,
      )}
      onClick={col ? () => ordenarPor(col) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {col && ordenacao.col === col && (
          ordenacao.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
        )}
      </span>
    </th>
  );

  const aplicarOpcoesTela = () => {
    setItensPorPagina(itensPorPaginaInput);
    setPaginaAtual(1);
    try {
      localStorage.setItem("sf-posts-colunas", JSON.stringify([...colunasVisiveis]));
      localStorage.setItem("sf-posts-ipp", String(itensPorPaginaInput));
    } catch {}
    setOpcoesTela(false);
  };

  const toggleColuna = (id: ColunaId) =>
    setColunasVisiveis((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ── Abas rápidas ── */
  const ABAS: { valor: StatusPost | "todos"; rotulo: string; count: number }[] = [
    { valor: "todos", rotulo: "Todos", count: contagens.todos },
    { valor: "publicado", rotulo: "Publicados", count: contagens.publicado },
    { valor: "rascunho", rotulo: "Rascunhos", count: contagens.rascunho },
    { valor: "revisao", rotulo: "Em revisão", count: contagens.revisao },
    { valor: "agendado", rotulo: "Agendados", count: contagens.agendado },
    { valor: "lixeira", rotulo: "Lixeira", count: contagens.lixeira },
  ];

  /* ── Paginação ── */
  const Paginacao = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center gap-1 text-[12.5px]", className)}>
      <span className="mr-1 text-ink-muted">
        {postsFiltrados.length} ite{postsFiltrados.length === 1 ? "m" : "ns"}
      </span>
      <button
        onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
        disabled={paginaSegura <= 1}
        className="rounded p-1 hover:bg-secondary disabled:opacity-40"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="min-w-[60px] text-center text-ink">
        {paginaSegura} / {totalPaginas}
      </span>
      <button
        onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
        disabled={paginaSegura >= totalPaginas}
        className="rounded p-1 hover:bg-secondary disabled:opacity-40"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );

  /* ── Render ── */
  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-ink">Posts</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/posts/novo"
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-ink"
          >
            <Plus size={13} />
            Adicionar novo
          </Link>
          <div className="relative" ref={refOpcoes}>
            <button
              onClick={() => setOpcoesTela((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-[12.5px] text-ink-muted hover:bg-secondary hover:text-ink",
                opcoesTela && "bg-secondary text-ink",
              )}
            >
              <Settings2 size={13} />
              Opções de tela
              {opcoesTela ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {/* Painel de opções */}
            {opcoesTela && (
              <div className="absolute right-0 top-full z-20 mt-1 w-80 rounded-lg border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Mostrar colunas
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {COLUNAS_CONFIG.map((col) => (
                    <label key={col.id} className="flex cursor-pointer items-center gap-2 text-[12.5px]">
                      <input
                        type="checkbox"
                        checked={colunasVisiveis.has(col.id)}
                        onChange={() => toggleColuna(col.id)}
                        className="accent-primary"
                      />
                      {col.rotulo}
                    </label>
                  ))}
                </div>
                <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Itens por página
                </p>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded border border-line bg-surface-2 px-2 py-1 text-[12.5px] text-ink"
                    value={itensPorPaginaInput}
                    onChange={(e) => setItensPorPaginaInput(Number(e.target.value))}
                  >
                    {ITENS_POR_PAGINA_OPCOES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={aplicarOpcoesTela}
                    className="rounded bg-primary px-3 py-1 text-[12px] font-semibold text-primary-ink"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Abas de status */}
      <div className="mb-3 flex flex-wrap gap-x-1 gap-y-1 text-[12.5px]">
        {ABAS.map((aba, i) => {
          const ativo = abaCorrente === aba.valor;
          return (
            <span key={aba.valor} className="flex items-center gap-1">
              {i > 0 && <span className="text-line">|</span>}
              {ativo ? (
                <span className="font-semibold text-ink">
                  {aba.rotulo} ({aba.count})
                </span>
              ) : (
                <button
                  onClick={() => {
                    setAbaCorrente(aba.valor);
                    setPaginaAtual(1);
                    setSelecionados(new Set());
                    setEdicaoRapida(null);
                  }}
                  className="text-primary hover:underline"
                >
                  {aba.rotulo} ({aba.count})
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Barra de filtros */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Ações em massa */}
        <select
          className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink"
          value={acaoEmMassa}
          onChange={(e) => setAcaoEmMassa(e.target.value)}
        >
          <option value="">Ações em massa</option>
          <option value="editar">Editar</option>
          <option value="lixeira">Mover para lixeira</option>
          <option value="alterar_autor">Alterar autor</option>
          <option value="alterar_categoria">Alterar categoria</option>
          <option value="alterar_status">Alterar status</option>
        </select>
        <button
          onClick={aplicarAcao}
          disabled={!acaoEmMassa || selecionados.size === 0}
          className="rounded border border-line px-3 py-1.5 text-[12.5px] text-ink hover:bg-secondary disabled:opacity-40"
        >
          Aplicar
        </button>

        {/* Filtros */}
        <select
          className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink"
          value={filtroData}
          onChange={(e) => { setFiltroData(e.target.value); setPaginaAtual(1); }}
        >
          <option value="">Todas as datas</option>
          {mesesUnicos.map((m) => (
            <option key={m} value={m}>
              {formatarMesAno(m)}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink"
          value={filtroCategoria}
          onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaAtual(1); }}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS_MOCK.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink"
          value={filtroAutor}
          onChange={(e) => { setFiltroAutor(e.target.value); setPaginaAtual(1); }}
        >
          <option value="">Todos os autores</option>
          {AUTORES_MOCK.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink"
          value={filtroSEO}
          onChange={(e) => { setFiltroSEO(e.target.value); setPaginaAtual(1); }}
        >
          <option value="">Status de SEO</option>
          <option value="bom">Tudo certo (0 pendentes)</option>
          <option value="melhorar">Quase lá (1–2 pendentes)</option>
          <option value="ruim">Precisa de ajustes (3+)</option>
          <option value="sem_analise">Sem palavra-chave</option>
        </select>

        {/* Busca */}
        <div className="flex flex-1 items-center gap-1">
          <input
            className="min-w-[180px] flex-1 rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            placeholder="Buscar posts…"
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setBusca(buscaInput); setPaginaAtual(1); }
            }}
          />
          <button
            onClick={() => { setBusca(buscaInput); setPaginaAtual(1); }}
            className="rounded border border-line px-3 py-1.5 text-[12.5px] text-ink hover:bg-secondary"
          >
            Filtrar
          </button>
          {busca && (
            <button
              onClick={() => { setBusca(""); setBuscaInput(""); setPaginaAtual(1); }}
              className="p-1 text-ink-muted hover:text-ink"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Paginação no topo */}
        <Paginacao />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-[var(--radius)] border border-line bg-surface-2 shadow-[var(--shadow-card)]">
        {carregando ? (
          /* Estado de carregamento */
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-muted">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-[13px]">Carregando posts…</p>
          </div>
        ) : postsPagina.length === 0 ? (
          /* Estado vazio */
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-ink-muted">
            <p className="text-[14px] font-medium text-ink">Nenhum post encontrado.</p>
            {(busca || filtroData || filtroCategoria || filtroAutor || filtroSEO || abaCorrente !== "todos") && (
              <button
                className="text-[12.5px] text-primary hover:underline"
                onClick={() => {
                  setBusca(""); setBuscaInput("");
                  setFiltroData(""); setFiltroCategoria("");
                  setFiltroAutor(""); setFiltroSEO("");
                  setAbaCorrente("todos"); setPaginaAtual(1);
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-[12.5px]">
            <thead className="bg-surface">
              <tr>
                <th className="w-8 border-b border-line px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={todasSelecionadas}
                    onChange={toggleTodas}
                    className="accent-primary"
                    aria-label="Selecionar todos"
                  />
                </th>
                <Th col="titulo">Título</Th>
                {colunasVisiveis.has("autor") && <Th>Autor</Th>}
                {colunasVisiveis.has("categorias") && <Th>Categorias</Th>}
                {colunasVisiveis.has("data") && <Th col="data">Data</Th>}
                {colunasVisiveis.has("palavraChave") && <Th>Palavra-chave</Th>}
                {colunasVisiveis.has("seo") && <Th col="seo" className="text-center">SEO</Th>}
                {colunasVisiveis.has("schema") && <Th className="text-center">Schema</Th>}
                {colunasVisiveis.has("linksInternos") && <Th col="linksInternos" className="text-center">Links</Th>}
              </tr>
            </thead>
            <tbody>
              {postsPagina.map((post) => {
                const selecionado = selecionados.has(post.id);
                const emEdicao = edicaoRapida === post.id;

                return (
                  <Fragment key={post.id}>
                    <tr
                      className={cn(
                        "group border-b border-line",
                        selecionado ? "bg-primary/5" : "hover:bg-surface",
                        emEdicao && "bg-secondary",
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 align-top">
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => toggleItem(post.id)}
                          className="mt-0.5 accent-primary"
                          aria-label={`Selecionar "${post.titulo}"`}
                        />
                      </td>

                      {/* Título */}
                      <td className="min-w-[280px] max-w-[520px] px-3 py-2.5 align-top">
                        <div>
                          <Link
                            href={`/posts/${post.id}`}
                            className="font-medium text-ink hover:text-primary"
                          >
                            {post.titulo}
                          </Link>
                          {post.origemAgente && (
                            <span className="ml-1.5 inline-block rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                              IA
                            </span>
                          )}
                          {post.destaque && (
                            <span className="ml-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              ★
                            </span>
                          )}
                          <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
                            /{post.slug}
                          </p>
                          {/* Ações no hover */}
                          <div className="mt-1.5 hidden items-center gap-3 group-hover:flex">
                            <Link
                              href={`/posts/${post.id}`}
                              className="text-[11.5px] text-primary hover:underline"
                            >
                              Editar
                            </Link>
                            <button
                              onClick={() =>
                                setEdicaoRapida(emEdicao ? null : post.id)
                              }
                              className="text-[11.5px] text-primary hover:underline"
                            >
                              Edição rápida
                            </button>
                            <a
                              href={`/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11.5px] text-ink-muted hover:text-ink hover:underline"
                            >
                              Ver
                            </a>
                            <button className="text-[11.5px] text-ink-muted hover:text-ink hover:underline">
                              Duplicar
                            </button>
                            <button
                              onClick={() =>
                                mostrarToast("Post movido para a lixeira.")
                              }
                              className="text-[11.5px] text-danger hover:underline"
                            >
                              Lixeira
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Autor */}
                      {colunasVisiveis.has("autor") && (
                        <td className="whitespace-nowrap px-3 py-2.5 align-top text-ink">
                          {post.autor}
                        </td>
                      )}

                      {/* Categorias */}
                      {colunasVisiveis.has("categorias") && (
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex flex-wrap gap-1">
                            {(post.categorias ?? []).map((c) => (
                              <span
                                key={c}
                                className="inline-block rounded bg-secondary px-1.5 py-0.5 text-[11px] text-ink"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}

                      {/* Data */}
                      {colunasVisiveis.has("data") && (
                        <td className="whitespace-nowrap px-3 py-2.5 align-top">
                          <div>
                            <p
                              className={cn(
                                "text-[11px] font-medium",
                                post.status === "publicado" && "text-success",
                                post.status === "rascunho" && "text-ink-muted",
                                post.status === "revisao" && "text-accent",
                                post.status === "agendado" && "text-primary",
                                post.status === "lixeira" && "text-danger",
                              )}
                            >
                              {post.status === "agendado"
                                ? "Agendado para"
                                : textoStatus(post.status)}
                            </p>
                            <p className="text-ink-muted">
                              {formatarData(post.dataAgendamento ?? post.data, true)}
                            </p>
                          </div>
                        </td>
                      )}

                      {/* Palavra-chave */}
                      {colunasVisiveis.has("palavraChave") && (
                        <td className="px-3 py-2.5 align-top">
                          {post.palavraChave ? (
                            <span className="text-ink">{post.palavraChave}</span>
                          ) : (
                            <SemPalavraChave />
                          )}
                        </td>
                      )}

                      {/* SEO */}
                      {colunasVisiveis.has("seo") && (
                        <td className="px-3 py-2.5 text-center align-top">
                          <FarolSEO post={post} />
                        </td>
                      )}

                      {/* Schema */}
                      {colunasVisiveis.has("schema") && (
                        <td className="px-3 py-2.5 text-center align-top">
                          <IndicadorSchema tem={post.temSchema ?? false} />
                        </td>
                      )}

                      {/* Links internos */}
                      {colunasVisiveis.has("linksInternos") && (
                        <td className="px-3 py-2.5 text-center align-top">
                          <span
                            className={
                              (post.linksInternos ?? 0) === 0 ? "text-danger" : "text-ink"
                            }
                          >
                            {post.linksInternos ?? 0}
                          </span>
                        </td>
                      )}
                    </tr>

                    {/* Edição rápida inline */}
                    {emEdicao && (
                      <EdicaoRapida
                        post={post}
                        colspan={totalColunas}
                        onSalvar={simularSalvar}
                        onCancelar={() => setEdicaoRapida(null)}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação inferior */}
      {!carregando && postsPagina.length > 0 && (
        <div className="mt-3 flex justify-end">
          <Paginacao />
        </div>
      )}

      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} />}
    </div>
  );
}
