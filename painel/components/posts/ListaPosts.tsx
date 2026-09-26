"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { useStore } from "@/lib/store";
import { useSiteInfo } from "@/lib/useSiteInfo";
import { urlPost } from "@/lib/urls-publicas";
import { TITULO_MAX, TITULO_PROVISORIO } from "@/lib/posts-regras";
import { extrairLinks } from "@/motor/analise-seo";
import type { Autor, Categoria, Post as PostBase, StatusPost } from "@/mock/types";

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
  linksInternos?: number;
  titleSEO?: string;
  /** Só true quando o arquivo tem o marcador real de geração por IA (geradoPorIA). */
  origemAgente?: boolean;
  /** Nome de exibição da categoria (o id fica em categoriaId). */
  categoriaNome?: string;
  /** Item da lixeira (fora do site). */
  naLixeira?: boolean;
}

/* ------------------------------------------------------------------ */
/* Constantes                                                            */
/* ------------------------------------------------------------------ */

const COLUNAS_CONFIG = [
  { id: "autor", rotulo: "Autor" },
  { id: "categorias", rotulo: "Categorias" },
  { id: "data", rotulo: "Data" },
  { id: "palavraChave", rotulo: "Palavra-chave" },
  { id: "seo", rotulo: "SEO" },
  { id: "linksInternos", rotulo: "Links" },
] as const;

type ColunaId = (typeof COLUNAS_CONFIG)[number]["id"];

const COLUNAS_DEFAULT = new Set<ColunaId>([
  "autor",
  "categorias",
  "data",
  "palavraChave",
  "seo",
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
  if ((post.linksInternos ?? 0) < 3)
    falhas.push(`Links internos insuficientes (${post.linksInternos ?? 0}/3)`);
  if ((post.categorias ?? []).length === 0)
    falhas.push("Sem categoria definida");
  if (!post.slug)
    falhas.push("Slug vazio");

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

/* ------------------------------------------------------------------ */
/* Edição rápida                                                         */
/* ------------------------------------------------------------------ */

interface EdicaoRapidaProps {
  post: Post;
  colspan: number;
  autores: Autor[];
  categorias: Categoria[];
  somenteLeituraStatusAutor: boolean;
  onSalvar: (post: Post, dados: Partial<Post> & { slugAuto?: boolean }) => Promise<boolean>;
  onCancelar: () => void;
}

function EdicaoRapida({ post, colspan, autores, categorias, somenteLeituraStatusAutor, onSalvar, onCancelar }: EdicaoRapidaProps) {
  const dominio = useDominio();
  const [titulo, setTitulo] = useState(post.titulo === TITULO_PROVISORIO ? "" : post.titulo);
  const [slug, setSlug] = useState(post.slug);
  const [status, setStatus] = useState<StatusPost>(post.status);
  const [autorId, setAutorId] = useState(post.autorId);
  const [categoriaId, setCategoriaId] = useState(post.categoriaId);
  const [palavraChave, setPalavraChave] = useState(post.palavraChave ?? "");
  const [metaDescription, setMetaDescription] = useState(post.metaDescription);
  const [dataPublicacao, setDataPublicacao] = useState(post.data.slice(0, 10));
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    // Só o que mudou vai para o servidor.
    const dados: Partial<Post> & { slugAuto?: boolean } = {};
    if (titulo.trim() && titulo !== post.titulo) dados.titulo = titulo.trim();
    if (slug !== post.slug) {
      dados.slug = slug;
      dados.slugAuto = false;
    }
    if (status !== post.status) dados.status = status;
    if (autorId !== post.autorId) dados.autorId = autorId;
    if (categoriaId !== post.categoriaId) dados.categoriaId = categoriaId;
    if (palavraChave !== (post.palavraChave ?? "")) dados.kwPrimaria = palavraChave;
    if (metaDescription !== post.metaDescription) dados.metaDescription = metaDescription;
    if (dataPublicacao && dataPublicacao !== post.data.slice(0, 10)) dados.data = dataPublicacao;
    setSalvando(true);
    const ok = await onSalvar(post, dados);
    setSalvando(false);
    if (ok) onCancelar();
  };

  const campo = "w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none disabled:opacity-60";
  const rotulo = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted";

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
              <label className={rotulo}>Título</label>
              <input
                className={campo}
                value={titulo}
                maxLength={TITULO_MAX}
                placeholder="Título do post"
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className={rotulo}>Status</label>
              <select
                className={campo}
                value={status}
                disabled={somenteLeituraStatusAutor}
                onChange={(e) => setStatus(e.target.value as StatusPost)}
              >
                <option value="publicado">Publicado</option>
                <option value="rascunho">Rascunho</option>
                <option value="revisao">Em revisão</option>
                <option value="agendado">Agendado</option>
              </select>
            </div>

            {/* Slug */}
            <div className="col-span-2">
              <label className={rotulo}>Slug</label>
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
              <label className={rotulo}>Autor</label>
              <select
                className={campo}
                value={autorId}
                disabled={somenteLeituraStatusAutor}
                onChange={(e) => setAutorId(e.target.value)}
              >
                {!autores.some((a) => a.id === autorId) && (
                  <option value={autorId}>{autorId || "(sem autor)"}</option>
                )}
                {autores.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className={rotulo}>Data</label>
              <input
                type="date"
                className={campo}
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
              />
            </div>

            {/* Palavra-chave */}
            <div>
              <label className={rotulo}>Palavra-chave</label>
              <input
                className={campo}
                value={palavraChave}
                onChange={(e) => setPalavraChave(e.target.value)}
              />
            </div>

            {/* Categoria */}
            <div>
              <label className={rotulo}>Categoria</label>
              <select className={campo} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                <option value="">Sem categoria</option>
                {!!categoriaId && !categorias.some((c) => c.id === categoriaId) && (
                  <option value={categoriaId}>{categoriaId}</option>
                )}
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Meta description */}
            <div className="col-span-2 lg:col-span-3">
              <label className={cn(rotulo, "flex items-center justify-between")}>
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
                maxLength={165}
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
  acao,
}: {
  mensagem: string;
  tipo: "sucesso" | "erro";
  acao?: { rotulo: string; onClick: () => void };
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
      {acao && (
        <button onClick={acao.onClick} className="ml-2 rounded bg-white/20 px-2 py-0.5 text-[12px] font-semibold hover:bg-white/30">
          {acao.rotulo}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                  */
/* ------------------------------------------------------------------ */

export function ListaPosts() {
  const {
    posts: postsStore,
    postsLixeira,
    postsCarregados,
    erroPosts,
    autores,
    categorias,
    salvamento,
    atualizarPost,
    salvarPost,
    duplicarPost,
    moverParaLixeira,
    restaurarPost,
    excluirDefinitivo,
    esvaziarLixeira,
    recarregarPosts,
  } = useStore();
  const router = useRouter();
  const { data: sessao } = useSession();
  const papel = (sessao?.user as { papel?: string } | undefined)?.papel;
  const ehAutor = papel === "autor";
  const siteInfo = useSiteInfo();
  const carregando = !postsCarregados;

  // Ao abrir a lista, relê do servidor: pega o que o agente publicou por fora e refaz a
  // leitura que falhou (o store carrega uma vez, ainda na tela de login, sem sessão).
  useEffect(() => {
    void recarregarPosts();
  }, [recarregarPosts]);

  /* Posts do store (dados reais do servidor) com o que a tabela mostra já resolvido */
  const posts: Post[] = useMemo(() => {
    const nomeAutor = (id: string) => autores.find((a) => a.id === id)?.nome ?? id;
    const nomeCat = (id: string) => categorias.find((c) => c.id === id)?.nome ?? id;
    const montar = (p: PostBase, naLixeira: boolean): Post => ({
      ...p,
      id: naLixeira ? `lixeira:${p.slug}` : p.id,
      status: naLixeira ? "lixeira" : p.status,
      naLixeira,
      autor: nomeAutor(p.autorId),
      categorias: p.categoriaId ? [nomeCat(p.categoriaId)] : [],
      categoriaNome: p.categoriaId ? nomeCat(p.categoriaId) : "",
      palavraChave: p.kwPrimaria ?? "",
      titleSEO: p.seoTitle,
      linksInternos: extrairLinks(p.corpo, siteInfo.dominio).internos.length,
      origemAgente: p.geradoPorIA === true,
    });
    const vivos = postsStore.map((p) => montar(p, false));
    return [...vivos, ...postsLixeira.map((p) => montar(p, true))];
  }, [postsStore, postsLixeira, autores, categorias, siteInfo.dominio]);

  const [abaCorrente, setAbaCorrente] = useState<StatusPost | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroAutor, setFiltroAutor] = useState("");
  const [filtroSEO, setFiltroSEO] = useState("");
  const [acaoEmMassa, setAcaoEmMassa] = useState("");
  const [aplicando, setAplicando] = useState(false);

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

  const [toast, setToast] = useState<{
    mensagem: string;
    tipo: "sucesso" | "erro";
    acao?: { rotulo: string; onClick: () => void };
  } | null>(null);
  const timerToast = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refOpcoes = useRef<HTMLDivElement>(null);

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

  const mostrarToast = (
    mensagem: string,
    tipo: "sucesso" | "erro" = "sucesso",
    acao?: { rotulo: string; onClick: () => void },
  ) => {
    if (timerToast.current) clearTimeout(timerToast.current);
    setToast({ mensagem, tipo, acao });
    timerToast.current = setTimeout(() => setToast(null), acao ? 9000 : 3500);
  };

  /* Erro de gravação do servidor vira aviso na tela (nunca engolido) */
  const ultimoErro = useRef("");
  useEffect(() => {
    if (salvamento.estado === "erro" && salvamento.erro && salvamento.erro !== ultimoErro.current) {
      ultimoErro.current = salvamento.erro;
      mostrarToast(salvamento.erro, "erro");
    }
    if (salvamento.estado !== "erro") ultimoErro.current = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salvamento]);

  /* Contagens por status — baseadas nos posts reais carregados */
  const contagens = useMemo(() => {
    return {
      todos: posts.filter((p) => p.status !== "lixeira").length, // "Todos" não conta a lixeira (padrão WP)
      publicado: posts.filter((p) => p.status === "publicado").length,
      rascunho: posts.filter((p) => p.status === "rascunho").length,
      revisao: posts.filter((p) => p.status === "revisao").length,
      agendado: posts.filter((p) => p.status === "agendado").length,
      lixeira: posts.filter((p) => p.status === "lixeira").length,
    };
  }, [posts]);

  /* Meses únicos para o filtro de data — baseados nos posts reais */
  const mesesUnicos = useMemo(() => {
    const set = new Set(posts.filter((p) => p.status !== "lixeira").map((p) => p.data.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [posts]);

  /* Posts filtrados + ordenados */
  const postsFiltrados = useMemo(() => {
    let lista = [...posts];
    lista = abaCorrente === "todos"
      ? lista.filter((p) => p.status !== "lixeira")
      : lista.filter((p) => p.status === abaCorrente);
    if (filtroData) lista = lista.filter((p) => p.data.startsWith(filtroData));
    if (filtroCategoria) lista = lista.filter((p) => p.categoriaId === filtroCategoria);
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

  /* Edição rápida: grava de verdade e só fecha quando o servidor confirma */
  const salvarEdicaoRapida = async (post: Post, dados: Partial<Post> & { slugAuto?: boolean }) => {
    if (Object.keys(dados).length === 0) return true;
    atualizarPost(post.id, dados);
    const ok = await salvarPost(post.id);
    if (ok) mostrarToast("Post atualizado.");
    return ok;
  };

  /* Restaurar / lixeira: chave = slug dentro da lixeira; id do post vivo = slug do arquivo */
  const restaurar = async (post: Post) => {
    const r = await restaurarPost(post.slug);
    if (r.ok) mostrarToast(`"${post.titulo}" voltou para os posts (rascunho ou o status que tinha).`);
    else mostrarToast(r.erro, "erro");
  };

  const paraLixeira = async (alvos: Post[]) => {
    const ids = alvos.map((p) => p.id);
    const movidos = await moverParaLixeira(ids);
    if (movidos.length === 0) {
      mostrarToast("Não consegui mover para a lixeira.", "erro");
      return;
    }
    setSelecionados(new Set());
    setEdicaoRapida(null);
    const titulos = alvos.filter((p) => movidos.includes(p.id));
    mostrarToast(
      movidos.length === 1 ? `"${titulos[0].titulo}" foi para a lixeira.` : `${movidos.length} posts foram para a lixeira.`,
      "sucesso",
      {
        rotulo: "Desfazer",
        onClick: async () => {
          let voltou = 0;
          // a lixeira tem o post com o mesmo slug (ou com sufixo se já havia outro igual)
          for (const t of titulos) {
            const r = await restaurarPost(t.slug);
            if (r.ok) voltou++;
          }
          mostrarToast(voltou === titulos.length ? "Pronto, voltou tudo." : `Voltaram ${voltou} de ${titulos.length}.`, voltou ? "sucesso" : "erro");
        },
      },
    );
  };

  const excluirDeVez = async (alvos: Post[]) => {
    const texto = alvos.length === 1
      ? `Excluir "${alvos[0].titulo}" para sempre? Não dá para desfazer.`
      : `Excluir ${alvos.length} posts para sempre? Não dá para desfazer.`;
    if (!window.confirm(texto)) return;
    let apagados = 0;
    for (const p of alvos) if (await excluirDefinitivo(p.slug)) apagados++;
    setSelecionados(new Set());
    if (apagados > 0) mostrarToast(apagados === 1 ? "Post excluído." : `${apagados} posts excluídos.`);
  };

  const esvaziar = async () => {
    if (!window.confirm("Esvaziar a lixeira? Todos os posts dela serão excluídos para sempre.")) return;
    if (await esvaziarLixeira()) {
      setSelecionados(new Set());
      mostrarToast("Lixeira esvaziada.");
    }
  };

  const duplicar = async (post: Post) => {
    const r = await duplicarPost(post.id);
    if (r.ok) {
      mostrarToast("Cópia criada como rascunho.", "sucesso", {
        rotulo: "Abrir",
        onClick: () => router.push(`/posts/${r.slug}`),
      });
    } else mostrarToast(r.erro, "erro");
  };

  /* Ação em massa: só o que grava de verdade */
  const aplicarAcao = async () => {
    if (!acaoEmMassa || selecionados.size === 0) return;
    const alvos = posts.filter((p) => selecionados.has(p.id));
    setAplicando(true);
    try {
      if (acaoEmMassa === "lixeira") await paraLixeira(alvos);
      else if (acaoEmMassa === "restaurar") {
        let n = 0;
        for (const p of alvos) if ((await restaurarPost(p.slug)).ok) n++;
        setSelecionados(new Set());
        mostrarToast(`${n} post(s) restaurado(s).`, n ? "sucesso" : "erro");
      } else if (acaoEmMassa === "excluir") await excluirDeVez(alvos);
    } finally {
      setAplicando(false);
      setAcaoEmMassa("");
    }
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
    ...(ehAutor ? [] : [{ valor: "lixeira" as const, rotulo: "Lixeira", count: contagens.lixeira }]),
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
        {!ehAutor && (
          <>
            <select
              className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink"
              value={acaoEmMassa}
              onChange={(e) => setAcaoEmMassa(e.target.value)}
            >
              <option value="">Ações em massa</option>
              {abaCorrente === "lixeira" ? (
                <>
                  <option value="restaurar">Restaurar</option>
                  <option value="excluir">Excluir definitivamente</option>
                </>
              ) : (
                <option value="lixeira">Mover para lixeira</option>
              )}
            </select>
            <button
              onClick={aplicarAcao}
              disabled={!acaoEmMassa || selecionados.size === 0 || aplicando}
              className="rounded border border-line px-3 py-1.5 text-[12.5px] text-ink hover:bg-secondary disabled:opacity-40"
            >
              {aplicando ? "Aplicando…" : "Aplicar"}
            </button>
          </>
        )}
        {abaCorrente === "lixeira" && !ehAutor && contagens.lixeira > 0 && (
          <button
            onClick={esvaziar}
            className="rounded border border-danger/40 px-3 py-1.5 text-[12.5px] text-danger hover:bg-danger/10"
          >
            Esvaziar lixeira
          </button>
        )}

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
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <select
          className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink"
          value={filtroAutor}
          onChange={(e) => { setFiltroAutor(e.target.value); setPaginaAtual(1); }}
        >
          <option value="">Todos os autores</option>
          {autores.map((a) => (
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
        ) : erroPosts ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20">
            <p className="text-[14px] font-medium text-danger">Não consegui carregar os posts.</p>
            <p className="text-[12.5px] text-ink-muted">{erroPosts}</p>
          </div>
        ) : postsPagina.length === 0 ? (
          /* Estado vazio */
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-ink-muted">
            <p className="text-[14px] font-medium text-ink">
              {abaCorrente === "lixeira" ? "A lixeira está vazia." : "Nenhum post encontrado."}
            </p>
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
                          {post.naLixeira ? (
                            <span className="font-medium text-ink-muted">{post.titulo}</span>
                          ) : (
                            <Link
                              href={`/posts/${post.id}`}
                              className="font-medium text-ink hover:text-primary"
                            >
                              {post.titulo === TITULO_PROVISORIO ? "Novo post (sem título)" : post.titulo}
                            </Link>
                          )}
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
                            {post.status === "lixeira" ? (
                              !ehAutor && (
                                <>
                                  <button
                                    onClick={() => restaurar(post)}
                                    className="text-[11.5px] text-primary hover:underline"
                                  >
                                    Restaurar
                                  </button>
                                  <button
                                    onClick={() => excluirDeVez([post])}
                                    className="text-[11.5px] text-danger hover:underline"
                                  >
                                    Excluir definitivamente
                                  </button>
                                </>
                              )
                            ) : (
                              <>
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
                                {post.status === "publicado" && siteInfo.dominio && (
                                  <a
                                    href={`https://${siteInfo.dominio}${urlPost(post.slug)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11.5px] text-ink-muted hover:text-ink hover:underline"
                                  >
                                    Ver
                                  </a>
                                )}
                                <button
                                  onClick={() => duplicar(post)}
                                  className="text-[11.5px] text-ink-muted hover:text-ink hover:underline"
                                >
                                  Duplicar
                                </button>
                                {!ehAutor && (
                                  <button
                                    onClick={() => paraLixeira([post])}
                                    className="text-[11.5px] text-danger hover:underline"
                                  >
                                    Lixeira
                                  </button>
                                )}
                              </>
                            )}
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
                        autores={autores}
                        categorias={categorias}
                        somenteLeituraStatusAutor={ehAutor}
                        onSalvar={salvarEdicaoRapida}
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

      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} acao={toast.acao} />}
    </div>
  );
}
