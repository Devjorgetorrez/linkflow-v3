"use client";

import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  FileQuestion,
  GripVertical,
  ImageIcon,
  Link2,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { EditorCorpo, type EditorCorpoHandle } from "@/components/EditorCorpo";
import { SeletorMidia } from "@/components/SeletorMidia";
import {
  Alternador,
  AreaTexto,
  Badge,
  BadgeStatus,
  Botao,
  Campo,
  Contador,
  Entrada,
  Painel,
  PainelRecolhivel,
  Rotulo,
  Selecao,
  Thumb,
  Vazio,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { useSiteInfo } from "@/lib/useSiteInfo";
import { cn, contarPalavras, slugify } from "@/lib/utils";
import { urlPost } from "@/lib/urls-publicas";
import type { Post } from "@/mock/types";
import { analisarSEO, extrairLinks, stripTags, type ResultadoSEO, type TesteKw } from "@/motor/analise-seo";
import { gerarGraphPost } from "@/motor/schema-graph";

const TIPOS_SCHEMA: Post["schemaTipo"][] = ["Article", "FAQPage", "HowTo", "Recipe"];
const LIMITE_TITLE = 70;
const MINIMO_TITLE = 3;
const LIMITE_META = 165;
const MINIMO_META = 80;
const MIN_LINKS_INTERNOS = 3;


/* ------------------------------------------------------------------ */
/* Sub-componentes de análise                                           */
/* ------------------------------------------------------------------ */

function ItemChecklist({
  ok,
  rotulo,
  detalhe,
  obrigatorio,
}: {
  ok: boolean;
  rotulo: string;
  detalhe?: string;
  obrigatorio?: boolean;
}) {
  return (
    <li className="flex items-start gap-2 text-[12px]">
      <span
        className={cn(
          "mt-[3px] h-2.5 w-2.5 shrink-0 rounded-full",
          ok ? "bg-success" : obrigatorio ? "bg-danger" : "bg-ink-muted/35",
        )}
      />
      <span className={cn(!ok && obrigatorio ? "text-danger" : "text-ink")}>
        {rotulo}
        {detalhe && !ok && (
          <span className="ml-1 text-[10.5px] text-ink-muted">— {detalhe}</span>
        )}
      </span>
    </li>
  );
}

function GrupoChecklist({
  rotulo,
  testes,
  obrigatorio,
}: {
  rotulo: string;
  testes: TesteKw[];
  obrigatorio?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
        {rotulo}
      </p>
      <ul className="space-y-1.5">
        {testes.map((t, i) => (
          <ItemChecklist key={i} ok={t.ok} rotulo={t.rotulo} detalhe={t.detalhe} obrigatorio={obrigatorio} />
        ))}
      </ul>
    </div>
  );
}

function BarraProgresso({ atual, min, max }: { atual: number; min: number; max: number }) {
  if (atual === 0) return <div className="mt-1.5 h-1 rounded-full bg-line" />;
  const pct = Math.min(100, (atual / max) * 100);
  const ok = atual >= min && atual <= max;
  return (
    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
      <div
        className={cn("h-full rounded-full transition-all", ok ? "bg-success" : "bg-accent")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SignalHeader({
  falhas,
  sem,
  sempre,
}: {
  falhas: number;
  sem?: boolean;
  sempre?: boolean;
}) {
  if (sem) {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-[10.5px] text-ink-muted">
        <span className="h-3 w-3 rounded-full bg-ink-muted/40" />
      </span>
    );
  }
  if (falhas === 0 && !sempre) return null;
  const cor = falhas === 0 ? "bg-success" : falhas <= 2 ? "bg-accent" : "bg-danger";
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[10.5px] text-ink-muted">
      <span className={cn("h-3 w-3 rounded-full", cor)} />
      {falhas > 0 && `${falhas} ${falhas === 1 ? "pendente" : "pendentes"}`}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Página principal                                                     */
/* ------------------------------------------------------------------ */

export default function EditorPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { posts, autores, categorias, midia, atualizarPost } = useStore();

  const post = posts.find((p) => p.id === id);

  /* Refs para wiring teclado título ↔ corpo */
  const editorRef = useRef<EditorCorpoHandle>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  /* Estado local */
  const [palavraChave, setPalavraChave] = useState(post?.kwPrimaria ?? "");
  const [palavrasSecundarias, setPalavrasSecundarias] = useState("");

  // Sync quando o post carrega ou muda de ID
  useEffect(() => {
    if (post) setPalavraChave(post.kwPrimaria ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);
  const [kwAtivaIdx, setKwAtivaIdx] = useState(-1);
  const [conteudoPilar, setConteudoPilar] = useState(false);
  const [bibliotecaCapa, setBibliotecaCapa] = useState(false);
  const [salvo, setSalvo] = useState(false);

  /* Posts relacionados */
  const [relacionados, setRelacionados] = useState<string[]>([]);
  const [modoAuto, setModoAuto] = useState(true);
  const [buscaRel, setBuscaRel] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [triggers, setTriggers] = useState<Record<string, number>>({});
  const [previewModo, setPreviewModo] = useState<"desktop" | "mobile">("desktop");
  const [abaAtiva, setAbaAtiva] = useState<"seo" | "schema" | "redes">("seo");

  const abrirCard = (cardId: string) => {
    setTriggers((t) => ({ ...t, [cardId]: (t[cardId] ?? 0) + 1 }));
    setTimeout(() => {
      document.getElementById(`card-${cardId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  };

  const irParaPainel = (aba: "seo" | "schema" | "redes") => {
    setAbaAtiva(aba);
    setTimeout(() => {
      document.getElementById("painel-seo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  /* Derivados de KW */
  const secundarias = palavrasSecundarias
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const kwAnalisada =
    kwAtivaIdx >= 0 && kwAtivaIdx < secundarias.length
      ? secundarias[kwAtivaIdx]
      : palavraChave;

  const siteInfo = useSiteInfo();

  /* Análises computadas */
  const totalPalavras = useMemo(() => contarPalavras(post?.corpo ?? ""), [post?.corpo]);
  const links = useMemo(
    () => extrairLinks(post?.corpo ?? "", siteInfo.dominio),
    [post?.corpo, siteInfo.dominio],
  );
  const analiseKw = useMemo(
    () => (post ? analisarSEO(kwAnalisada, post, links, totalPalavras) : null),
    [kwAnalisada, post, links, totalPalavras],
  );

  const autor = autores.find((a) => a.id === post?.autorId);
  const capa = midia.find((m) => m.id === post?.capa);

  const graphLd = useMemo(
    () => (post ? gerarGraphPost(post, autor, categorias, capa?.url ?? "", siteInfo) : null),
    [post, autor, categorias, capa, siteInfo],
  );

  if (!post) {
    return (
      <Painel>
        <Vazio
          icone={<FileQuestion size={18} />}
          titulo="Post não encontrado"
          descricao="Este identificador não existe na sessão atual."
          acao={
            <Link href="/posts">
              <Botao tamanho="sm">Voltar para a lista</Botao>
            </Link>
          }
        />
      </Painel>
    );
  }

  const editar = (patch: Partial<Post>) => {
    atualizarPost(post.id, patch);
    setSalvo(false);
  };

  const salvar = () => {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2200);
  };

  const publicar = () => {
    editar({ status: "publicado" });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2200);
  };

  const dominio = siteInfo.dominio;

  // URL plana: o artigo fica direto na raiz (/<slug>), nunca /blog/<slug>
  const urlPublica = `${dominio ? `https://${dominio}` : "https://seudominio.com.br"}${urlPost(post.slug || "sem-slug")}`;

  /* Validação de publicação */
  const titleForaDaFaixa =
    post.seoTitle.length > 0 &&
    (post.seoTitle.length < MINIMO_TITLE || post.seoTitle.length > LIMITE_TITLE);
  const metaForaDaFaixa =
    post.metaDescription.length > 0 &&
    (post.metaDescription.length < MINIMO_META || post.metaDescription.length > LIMITE_META);

  const faltamPublicar: string[] = [];
  if (!post.capa) faltamPublicar.push("Imagem destacada");
  if (!post.capaAlt.trim()) faltamPublicar.push("Texto alternativo da imagem");
  if (!post.metaDescription.trim()) faltamPublicar.push("Meta description");
  if (!palavraChave.trim()) faltamPublicar.push("Palavra-chave principal");
  if (links.internos.length < 1) faltamPublicar.push("Sem link interno no artigo");
  if (analiseKw) {
    if (!analiseKw.obrigatorios[0].ok) faltamPublicar.push("KW ausente no título");
    if (post.metaDescription.trim() && !analiseKw.obrigatorios[1].ok)
      faltamPublicar.push("KW ausente na meta description");
    if (!analiseKw.obrigatorios[2].ok) faltamPublicar.push("KW ausente no primeiro H2");
  }
  const publicarBloqueado = faltamPublicar.length > 0;

  /* Sinais para cabeçalhos dos cards */
  const falhasImagem = (!post.capa ? 1 : 0) + (!post.capaAlt.trim() ? 1 : 0);
  const falhasCategorias = !post.categoriaId ? 1 : 0;
  const semKw = !palavraChave.trim();
  const falhasKw = analiseKw
    ? [...analiseKw.obrigatorios, ...analiseKw.recomendados].filter((t) => !t.ok).length
    : 0;
  const falhasSeo =
    (!post.metaDescription.trim() ? 1 : 0) +
    (titleForaDaFaixa ? 1 : 0) +
    (metaForaDaFaixa ? 1 : 0);
  const falhasLinks = Math.max(0, MIN_LINKS_INTERNOS - links.internos.length);

  const corGeral =
    faltamPublicar.length === 0
      ? "bg-success"
      : faltamPublicar.length <= 2
        ? "bg-accent"
        : "bg-danger";

  const primeiroCardComProblema = (): string | null => {
    if (falhasImagem > 0) return "imagem";
    if (falhasCategorias > 0) return "categorias";
    if (semKw || falhasKw > 0 || falhasSeo > 0) return "seo";
    if (falhasLinks > 0) return "links";
    return null;
  };

  /* Posts relacionados */
  const outrosPosts = posts.filter((p) => p.id !== post.id);
  const autoRelacionados = useMemo(() => {
    const mesmaCat = outrosPosts.filter(
      (p) => p.categoriaId && p.categoriaId === post.categoriaId,
    );
    return (mesmaCat.length > 0 ? mesmaCat : outrosPosts).slice(0, 4);
  }, [outrosPosts, post.categoriaId]);
  const resultadosBusca = buscaRel.trim()
    ? outrosPosts
        .filter((p) => p.titulo.toLowerCase().includes(buscaRel.toLowerCase()))
        .slice(0, 6)
    : [];

  return (
    <>
      {/* ---------------------------------------------------------------- cabeçalho */}
      <div className="mb-3 flex items-center gap-2">
        <Botao variante="fantasma" onClick={() => router.push("/posts")}>
          <ArrowLeft size={13} /> Posts
        </Botao>
        <Badge tom={post.status === "publicado" ? "sucesso" : "neutro"}>
          {post.status === "publicado"
            ? "no ar"
            : post.status === "rascunho"
              ? "rascunho"
              : post.status === "revisao"
                ? "revisão"
                : "agendado"}
        </Badge>
        <span className="truncate font-mono text-[10.5px] text-ink-muted">{urlPublica}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {salvo && <span className="text-[11px] text-success">Alterações aplicadas</span>}
          <Botao variante="secundario">
            <ExternalLink size={12} /> Ver
          </Botao>
          <Botao variante="secundario" onClick={salvar}>
            <Save size={12} /> Salvar
          </Botao>
          {/* Publicar — desabilitado com tooltip quando faltam requisitos */}
          <div className="group relative">
            <Botao
              variante="primario"
              style={publicarBloqueado ? { pointerEvents: "none" } : undefined}
              className={publicarBloqueado ? "cursor-not-allowed opacity-50" : ""}
              onClick={publicar}
            >
              <Send size={12} /> Publicar
            </Botao>
            {publicarBloqueado && (
              <div className="absolute right-0 top-full z-50 mt-1.5 hidden min-w-[240px] rounded-[var(--radius)] border border-line bg-surface-2 p-2.5 shadow-lg group-hover:block">
                <p className="mb-1.5 text-[11px] font-semibold text-ink">Faltam para publicar:</p>
                <ul className="space-y-0.5">
                  {faltamPublicar.map((f) => (
                    <li key={f} className="flex items-start gap-1 text-[10.5px] text-danger">
                      <span className="mt-[1px] shrink-0">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* -------------------------------------------------------------- conteúdo */}
        <div>
          <EditorCorpo
            ref={editorRef}
            valor={post.corpo}
            aoMudar={(corpo) => editar({ corpo })}
            aoRetornarParaTitulo={() => {
              titleInputRef.current?.focus();
              const len = titleInputRef.current?.value.length ?? 0;
              titleInputRef.current?.setSelectionRange(len, len);
            }}
            slotTitulo={
              <input
                ref={titleInputRef}
                value={post.titulo}
                onChange={(e) => {
                  const titulo = e.target.value;
                  editar({ titulo, slug: post.slug || slugify(titulo) });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    editorRef.current?.focarInicio();
                  }
                }}
                placeholder="Adicionar título"
                autoFocus={!post.titulo}
                className="w-full bg-transparent px-4 pb-3 pt-3 font-display text-[30px] font-bold leading-tight tracking-tight text-ink outline-none placeholder:text-ink-muted/30"
              />
            }
          />

          {/* ============================================= Painel SEO / Schema / Redes */}
          <div
            id="painel-seo"
            className="mt-3 overflow-hidden rounded-[var(--radius)] border border-line bg-surface-2 shadow-[var(--shadow-card)]"
          >
            {/* Abas */}
            <div className="flex border-b border-line">
              {(
                [
                  {
                    id: "seo" as const,
                    label: "SEO",
                    circulo: cn(
                      "h-2.5 w-2.5 rounded-full",
                      semKw
                        ? "bg-ink-muted/40"
                        : falhasKw === 0
                          ? "bg-success"
                          : falhasKw <= 2
                            ? "bg-accent"
                            : "bg-danger",
                    ),
                  },
                  {
                    id: "schema" as const,
                    label: "Schema",
                    circulo: "h-2.5 w-2.5 rounded-full bg-ink-muted/30",
                  },
                  {
                    id: "redes" as const,
                    label: "Redes Sociais",
                    circulo: cn("h-2.5 w-2.5 rounded-full", capa ? "bg-success" : "bg-ink-muted/30"),
                  },
                ] as { id: "seo" | "schema" | "redes"; label: string; circulo: string }[]
              ).map(({ id: abaId, label, circulo }) => (
                <button
                  key={abaId}
                  type="button"
                  onClick={() => setAbaAtiva(abaId)}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[12.5px] transition-colors",
                    abaAtiva === abaId
                      ? "border-primary font-semibold text-ink"
                      : "border-transparent text-ink-muted hover:text-ink",
                  )}
                >
                  <span className={circulo} />
                  {label}
                </button>
              ))}
            </div>

            {/* ---- Aba SEO ---- */}
            {abaAtiva === "seo" && (
              <div className="p-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Coluna esquerda: Campos */}
                  <div className="space-y-3">
                    <Campo label="Palavra-chave principal">
                      <Entrada
                        value={palavraChave}
                        onChange={(e) => {
                          setPalavraChave(e.target.value);
                          setKwAtivaIdx(-1);
                          editar({ kwPrimaria: e.target.value });
                        }}
                        placeholder="ex: como abrir uma empresa"
                      />
                      {(() => {
                        const kw = palavraChave.trim().toLowerCase();
                        if (!kw) return null;
                        const conflito = posts.find(
                          (p) =>
                            p.id !== post.id &&
                            (p.kwPrimaria ?? "").trim().toLowerCase() === kw,
                        );
                        if (!conflito) return null;
                        return (
                          <div className="mt-1.5 flex items-start gap-1.5 rounded-[var(--radius)] bg-danger/10 px-2.5 py-2 text-[11px] text-danger">
                            <AlertCircle size={12} className="mt-0.5 shrink-0" />
                            <span>
                              Canibalização: <Link href={`/posts/${conflito.id}`} className="font-medium underline underline-offset-2 hover:no-underline">"{conflito.titulo}"</Link> já usa esta palavra-chave.
                            </span>
                          </div>
                        );
                      })()}
                    </Campo>
                    <Campo label="Palavras-chave secundárias" dica="Uma por linha.">
                      <AreaTexto
                        rows={3}
                        value={palavrasSecundarias}
                        onChange={(e) => setPalavrasSecundarias(e.target.value)}
                        placeholder={"abrir empresa mei\ncustos para abrir empresa"}
                      />
                    </Campo>
                    <Alternador
                      ativo={conteudoPilar}
                      onChange={setConteudoPilar}
                      label="Conteúdo pilar"
                      descricao="Post principal de um cluster — receberá links dos satélites"
                    />
                    <div>
                      <div className="mb-1 flex items-baseline justify-between">
                        <Rotulo>Title</Rotulo>
                        <Contador atual={post.seoTitle.length} max={LIMITE_TITLE} min={MINIMO_TITLE} />
                      </div>
                      <Entrada
                        value={post.seoTitle}
                        onChange={(e) => editar({ seoTitle: e.target.value })}
                        placeholder={post.titulo || "Título que aparece no Google"}
                        aviso={titleForaDaFaixa}
                      />
                      <BarraProgresso atual={post.seoTitle.length} min={MINIMO_TITLE} max={LIMITE_TITLE} />
                    </div>
                    <Campo label="Slug">
                      <div className="flex items-center overflow-hidden rounded-[var(--radius)] border border-line bg-surface-2">
                        <span className="select-none border-r border-line bg-secondary px-2 py-1.5 font-mono text-[10.5px] text-ink-muted">
                          /
                        </span>
                        <input
                          value={post.slug}
                          onChange={(e) => editar({ slug: slugify(e.target.value) })}
                          placeholder="slug-do-post"
                          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-[10.5px] text-ink outline-none placeholder:text-ink-muted/50"
                        />
                      </div>
                    </Campo>
                    <div>
                      <div className="mb-1 flex items-baseline justify-between">
                        <Rotulo>Meta description</Rotulo>
                        <Contador atual={post.metaDescription.length} max={LIMITE_META} min={MINIMO_META} />
                      </div>
                      <AreaTexto
                        rows={3}
                        value={post.metaDescription}
                        onChange={(e) => editar({ metaDescription: e.target.value })}
                        placeholder="Resumo exibido no resultado de busca."
                        aviso={metaForaDaFaixa}
                      />
                      <BarraProgresso atual={post.metaDescription.length} min={MINIMO_META} max={LIMITE_META} />
                    </div>
                  </div>

                  {/* Coluna direita: Pré-visualização */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                        Pré-visualização
                      </p>
                      <div className="flex gap-0.5 rounded-[var(--radius)] border border-line bg-surface p-0.5">
                        <button
                          type="button"
                          onClick={() => setPreviewModo("desktop")}
                          className={cn(
                            "rounded px-2 py-0.5 text-[10.5px] transition-colors",
                            previewModo === "desktop"
                              ? "bg-secondary font-medium text-ink"
                              : "text-ink-muted hover:text-ink",
                          )}
                        >
                          Computador
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewModo("mobile")}
                          className={cn(
                            "rounded px-2 py-0.5 text-[10.5px] transition-colors",
                            previewModo === "mobile"
                              ? "bg-secondary font-medium text-ink"
                              : "text-ink-muted hover:text-ink",
                          )}
                        >
                          Celular
                        </button>
                      </div>
                    </div>
                    {previewModo === "desktop" ? (
                      <div className="rounded-[var(--radius)] border border-line bg-surface px-3 py-2.5">
                        <p className="mb-0.5 truncate font-mono text-[10px] text-ink-muted/70">
                          {urlPublica}
                        </p>
                        <p className="truncate text-[14px] leading-snug text-[color:var(--primary)]">
                          {post.seoTitle || post.titulo || "Título do post"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11.5px] text-ink-muted">
                          {post.metaDescription || post.resumo || "A meta description aparece aqui."}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-[var(--radius)] border border-line bg-surface px-3 py-2.5">
                        <div className="mx-auto max-w-[260px]">
                          <p className="mb-0.5 truncate font-mono text-[9px] text-ink-muted/70">
                            {urlPublica}
                          </p>
                          <p className="text-[15px] font-medium leading-snug text-[color:var(--primary)]">
                            {post.seoTitle || post.titulo || "Título do post"}
                          </p>
                          <p className="mt-0.5 line-clamp-3 text-[11px] text-ink-muted">
                            {post.metaDescription || post.resumo || "A meta description aparece aqui."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Análise — largura total */}
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  {analiseKw ? (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-5 w-5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              falhasKw === 0
                                ? "var(--success)"
                                : falhasKw <= 2
                                  ? "var(--accent)"
                                  : "var(--danger)",
                          }}
                        />
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[12.5px] font-semibold text-ink">
                            {falhasKw === 0 ? "Tudo certo" : falhasKw <= 2 ? "Quase lá" : "Precisa de ajustes"}
                          </span>
                          <span className="text-[10.5px] text-ink-muted">
                            {falhasKw === 0 ? "Todos os itens ok" : `${falhasKw} de 8 pendentes`}
                          </span>
                        </div>
                      </div>
                      {secundarias.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setKwAtivaIdx(-1)}
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                              kwAtivaIdx === -1
                                ? "border-primary bg-primary text-primary-ink"
                                : "border-line text-ink-muted hover:text-ink",
                            )}
                          >
                            {palavraChave}
                          </button>
                          {secundarias.map((s, i) => (
                            <button
                              type="button"
                              key={i}
                              onClick={() => setKwAtivaIdx(i)}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                                kwAtivaIdx === i
                                  ? "border-primary bg-primary text-primary-ink"
                                  : "border-line text-ink-muted hover:text-ink",
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <GrupoChecklist rotulo="Obrigatórios" testes={analiseKw.obrigatorios} obrigatorio />
                        <GrupoChecklist rotulo="Recomendados" testes={analiseKw.recomendados} />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 rounded-[var(--radius)] border border-dashed border-line bg-surface p-3 opacity-60">
                      <span className="h-5 w-5 shrink-0 rounded-full bg-ink-muted/30" />
                      <div>
                        <p className="text-[12px] font-medium text-ink-muted">Sem análise</p>
                        <p className="text-[10.5px] text-ink-muted">Defina a palavra-chave principal</p>
                      </div>
                    </div>
                  )}
                  {faltamPublicar.length > 0 && (
                    <div className="space-y-2 border-t border-line pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                        Pendências de publicação ({faltamPublicar.length})
                      </p>
                      <ul className="space-y-1.5">
                        {faltamPublicar.map((item) => {
                          const detalheMap: Record<string, string> = {
                            "Imagem destacada": "Adicione uma imagem no card lateral",
                            "Texto alternativo da imagem": "Preencha o alt text no card de imagem",
                            "Meta description": "Escreva uma meta description de 80–165 caracteres",
                            "Palavra-chave principal": "Defina a KW no campo acima",
                            "Sem link interno no artigo": "Adicione ao menos 1 link interno no corpo",
                            "KW ausente no título": "Inclua a KW no título do post ou no title SEO",
                            "KW ausente na meta description": "Mencione a KW na meta description",
                            "KW ausente no primeiro H2": "Use a KW no primeiro subtítulo H2",
                          };
                          return (
                            <li key={item} className="flex items-start gap-2 text-[12px]">
                              <span className="mt-[3px] h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />
                              <span className="text-ink">
                                {item}
                                {detalheMap[item] && (
                                  <span className="ml-1 text-[10.5px] text-ink-muted">
                                    — {detalheMap[item]}
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---- Aba Schema ---- */}
            {abaAtiva === "schema" && (
              <div className="p-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <Campo label="Tipo de schema">
                      <Selecao
                        value={post.schemaTipo}
                        onChange={(e) =>
                          editar({ schemaTipo: e.target.value as Post["schemaTipo"] })
                        }
                      >
                        {TIPOS_SCHEMA.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Selecao>
                    </Campo>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <Rotulo>
                          {post.schemaTipo === "HowTo" ? "Passos" : "Perguntas e respostas"}
                        </Rotulo>
                        <Botao
                          tamanho="sm"
                          variante="fantasma"
                          onClick={() =>
                            editar({
                              faq: [
                                ...post.faq,
                                { id: `f${Date.now()}`, pergunta: "", resposta: "" },
                              ],
                            })
                          }
                        >
                          <Plus size={11} /> Adicionar
                        </Botao>
                      </div>
                      {post.faq.length === 0 ? (
                        <p className="rounded-[var(--radius)] border border-dashed border-line px-3 py-3 text-center text-[11px] text-ink-muted">
                          Nenhum item. O JSON-LD sai sem bloco de perguntas.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {post.faq.map((item, i) => (
                            <li
                              key={item.id}
                              className="rounded-[var(--radius)] border border-line bg-surface p-2"
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <span className="font-mono text-[10px] text-ink-muted">
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <button
                                  type="button"
                                  title="Remover"
                                  onClick={() =>
                                    editar({ faq: post.faq.filter((f) => f.id !== item.id) })
                                  }
                                  className="text-ink-muted transition-colors hover:text-danger"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                              <Entrada
                                value={item.pergunta}
                                onChange={(e) =>
                                  editar({
                                    faq: post.faq.map((f) =>
                                      f.id === item.id ? { ...f, pergunta: e.target.value } : f,
                                    ),
                                  })
                                }
                                placeholder="Pergunta"
                                className="mb-1 h-7 py-0"
                              />
                              <AreaTexto
                                rows={2}
                                value={item.resposta}
                                onChange={(e) =>
                                  editar({
                                    faq: post.faq.map((f) =>
                                      f.id === item.id ? { ...f, resposta: e.target.value } : f,
                                    ),
                                  })
                                }
                                placeholder="Resposta"
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div>
                    <Rotulo>@graph gerado</Rotulo>
                    <pre className="max-h-[400px] overflow-auto rounded-[var(--radius)] border border-line bg-surface p-2.5 font-mono text-[10.5px] leading-relaxed text-ink-muted">
                      {`<script type="application/ld+json">\n${JSON.stringify(graphLd, null, 2)}\n</script>`}
                    </pre>
                    <p className="mt-1 text-[10.5px] text-ink-muted">
                      Padrão @graph — um bloco, todos os nodos costurados por @id. Somente leitura.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Aba Redes Sociais ---- */}
            {abaAtiva === "redes" && (
              <div className="p-4">
                <p className="mb-3 text-[11.5px] leading-snug text-ink-muted">
                  Pré-visualização do card ao compartilhar nas redes. Usa a imagem destacada.
                </p>
                {capa ? (
                  <div className="max-w-md">
                    <div className="overflow-hidden rounded-[var(--radius)] border border-line">
                      <Thumb
                        gradiente={capa.gradiente}
                        className="aspect-[1.91/1] w-full rounded-none border-0"
                      />
                      <div className="bg-surface px-2.5 py-1.5">
                        <p className="truncate text-[10px] text-ink-muted">{dominio || "seudominio.com.br"}</p>
                        <p className="truncate text-[12px] font-semibold text-ink">
                          {post.seoTitle || post.titulo || "Título do post"}
                        </p>
                        <p className="line-clamp-2 text-[10.5px] text-ink-muted">
                          {post.metaDescription || post.resumo || "Meta description do post."}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[10.5px] text-ink-muted">
                      Tamanho ideal: 1200 × 630 px. Se a imagem tiver outra proporção, será cortada pelas redes.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[var(--radius)] border border-dashed border-line px-3 py-8 text-center text-[11px] text-ink-muted">
                    Adicione uma imagem destacada para ver o card social.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- lateral */}
        <div className="space-y-2.5">

          {/* -------------------------------------------------- barra de status */}
          {faltamPublicar.length > 0 ? (
            <button
              type="button"
              onClick={() => irParaPainel("seo")}
              className={cn(
                "sticky top-3 z-10 flex w-full items-center gap-2 rounded-[var(--radius)] border px-3 py-2.5 text-left transition-opacity hover:opacity-80",
                faltamPublicar.length <= 2
                  ? "border-accent/30 bg-accent/10"
                  : "border-danger/30 bg-danger/10",
              )}
            >
              <span className={cn("h-3 w-3 shrink-0 rounded-full", corGeral)} />
              <span
                className={cn(
                  "text-[11.5px] font-semibold",
                  faltamPublicar.length <= 2 ? "text-accent" : "text-danger",
                )}
              >
                {`${faltamPublicar.length} ${faltamPublicar.length === 1 ? "item impede" : "itens impedem"} a publicação`}
              </span>
            </button>
          ) : (
            <div className="sticky top-3 z-10 flex items-center gap-2 rounded-[var(--radius)] border border-success/30 bg-success/10 px-3 py-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full bg-success" />
              <span className="text-[11.5px] font-semibold text-success">Pronto para publicar</span>
            </div>
          )}

          {/* ================================================ 1. Imagem destacada */}
          <PainelRecolhivel
            id="card-imagem"
            titulo="Imagem destacada"
            abrirTrigger={triggers["imagem"]}
            acessorio={<SignalHeader falhas={falhasImagem} sempre />}
          >
            <p className="mb-2.5 text-[11px] text-ink-muted leading-snug">
              Alimenta o card do blog, o Open Graph e o campo{" "}
              <code className="rounded bg-secondary px-1 font-mono">image</code> do schema.
            </p>

            {capa ? (
              <>
                <Thumb gradiente={capa.gradiente} className="aspect-[16/9] w-full" />
                <p className="mt-1.5 truncate font-mono text-[10.5px] text-ink-muted">
                  {capa.arquivo}
                </p>
              </>
            ) : (
              <div className="rounded-[var(--radius)] border border-dashed border-line px-3 py-5 text-center text-[11px] text-ink-muted">
                Nenhuma imagem escolhida.
              </div>
            )}

            <div className="mt-2 flex gap-1.5">
              <Botao tamanho="sm" onClick={() => setBibliotecaCapa(true)}>
                <ImageIcon size={11} /> {capa ? "Trocar imagem" : "Escolher da biblioteca"}
              </Botao>
              {capa && (
                <Botao
                  tamanho="sm"
                  variante="perigo"
                  onClick={() => editar({ capa: "", capaAlt: "" })}
                >
                  Remover
                </Botao>
              )}
            </div>

            <div className="mt-2.5">
              <Campo label="Texto alternativo" obrigatorio>
                <Entrada
                  value={post.capaAlt}
                  onChange={(e) => editar({ capaAlt: e.target.value })}
                  placeholder="Descreva a imagem para quem não a vê"
                  invalido={!!capa && !post.capaAlt.trim()}
                />
              </Campo>
              {!!capa && !post.capaAlt.trim() && (
                <p className="mt-1 text-[10.5px] text-danger">
                  Imagem sem alt bloqueia a publicação.
                </p>
              )}
            </div>
          </PainelRecolhivel>

          {/* ================================================ 2. Publicação */}
          <PainelRecolhivel titulo="Publicação">
            <div className="space-y-2.5">
              <Campo label="Status">
                <Selecao
                  value={post.status}
                  onChange={(e) => editar({ status: e.target.value as Post["status"] })}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="revisao">Em revisão</option>
                  <option value="agendado">Agendado</option>
                  <option value="publicado">Publicado</option>
                </Selecao>
              </Campo>
              <Campo label="Data">
                <Entrada
                  type="date"
                  value={post.data}
                  onChange={(e) => editar({ data: e.target.value })}
                />
              </Campo>
              <Campo label="Autor">
                <Selecao
                  value={post.autorId}
                  onChange={(e) => editar({ autorId: e.target.value })}
                >
                  {autores.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <div className="border-t border-line pt-2.5">
                <Alternador
                  ativo={post.destaque}
                  onChange={(v) => editar({ destaque: v })}
                  label="Destaque na home"
                  descricao="Aparece no bloco principal da página inicial"
                />
              </div>
            </div>
          </PainelRecolhivel>

          {/* ================================================ 3. Categorias */}
          <PainelRecolhivel
            id="card-categorias"
            titulo="Categorias"
            abrirTrigger={triggers["categorias"]}
            acessorio={<SignalHeader falhas={falhasCategorias} sempre />}
          >
            <div className="space-y-1">
              {categorias.map((cat) => {
                const marcada = post.categoriaId === cat.id;
                return (
                  <label
                    key={cat.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-[12.5px] hover:bg-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => editar({ categoriaId: marcada ? "" : cat.id })}
                      className="accent-primary"
                    />
                    {cat.nome}
                  </label>
                );
              })}
              {categorias.length === 0 && (
                <p className="text-[11px] text-ink-muted">Nenhuma categoria cadastrada.</p>
              )}
            </div>
          </PainelRecolhivel>

          {/* ================================================ 4. SEO (compacto) */}
          <button
            type="button"
            onClick={() => irParaPainel("seo")}
            className="w-full overflow-hidden rounded-[var(--radius)] border border-line bg-surface-2 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="text-[12px] font-semibold tracking-tight text-ink">SEO</span>
              <span className="text-[10.5px] text-primary">Ver análise ↗</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <span
                className={cn(
                  "h-4 w-4 shrink-0 rounded-full",
                  semKw
                    ? "bg-ink-muted/40"
                    : falhasKw === 0
                      ? "bg-success"
                      : falhasKw <= 2
                        ? "bg-accent"
                        : "bg-danger",
                )}
              />
              <div>
                <p className="text-[12px] font-medium text-ink">
                  {semKw
                    ? "Sem análise"
                    : falhasKw === 0
                      ? "Tudo certo"
                      : falhasKw <= 2
                        ? "Quase lá"
                        : "Precisa de ajustes"}
                </p>
                <p className="text-[10.5px] text-ink-muted">
                  {semKw
                    ? "Defina a palavra-chave"
                    : falhasKw === 0
                      ? "Todos os itens ok"
                      : `${falhasKw} de 8 pendentes`}
                </p>
              </div>
            </div>
          </button>

          {/* ================================================ 6. Resumo */}
          <PainelRecolhivel titulo="Resumo" inicialAberto={false}>
            <Campo label="Resumo do post" dica="Usado nas listagens do blog.">
              <AreaTexto
                rows={3}
                value={post.resumo}
                onChange={(e) => editar({ resumo: e.target.value })}
                placeholder="Uma ou duas frases que resumem o artigo."
              />
            </Campo>
          </PainelRecolhivel>

          {/* ================================================ 8. Links internos obrigatórios */}
          <PainelRecolhivel
            id="card-links"
            titulo="Links internos obrigatórios"
            inicialAberto={false}
            abrirTrigger={triggers["links"]}
            acessorio={<SignalHeader falhas={falhasLinks} sempre />}
          >
            <div className="space-y-3">
              {/* Contador e resumo */}
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] text-ink-muted">
                  Mínimo de {MIN_LINKS_INTERNOS} links para outros posts do cluster.
                </p>
                <Badge tom={links.internos.length >= MIN_LINKS_INTERNOS ? "sucesso" : "aviso"}>
                  {links.internos.length} de {MIN_LINKS_INTERNOS}
                </Badge>
              </div>

              {/* Lista de links encontrados */}
              {links.internos.length === 0 ? (
                <div className="rounded-[var(--radius)] border border-dashed border-line px-3 py-4 text-center text-[11px] text-ink-muted">
                  Nenhum link interno encontrado no corpo do artigo.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {links.internos.map((link, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Link2
                        size={11}
                        className="mt-[3px] shrink-0 text-success"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[10.5px] text-ink-muted">
                          {link.href}
                        </p>
                        {link.texto && (
                          <p className="truncate text-[11.5px] text-ink">{link.texto}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Links externos de bônus */}
              {links.externos.length > 0 && (
                <div className="border-t border-line pt-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    Links externos ({links.externos.length})
                  </p>
                  <ul className="space-y-1">
                    {links.externos.map((link, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ExternalLink size={11} className="mt-[3px] shrink-0 text-ink-muted" />
                        <p className="truncate font-mono text-[10.5px] text-ink-muted">
                          {link.href}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {links.internos.length < MIN_LINKS_INTERNOS && (
                <p className="text-[10.5px] text-ink-muted">
                  Adicione links{" "}
                  <code className="rounded bg-secondary px-1 font-mono">{"<a href=\"/slug-da-pagina\">"}</code>{" "}
                  no corpo do artigo. Quando destinos obrigatórios forem configurados no
                  LinkFlow, aparecerão aqui com indicador de presente ou ausente.
                </p>
              )}
            </div>
          </PainelRecolhivel>

          {/* ================================================ 10. Posts relacionados */}
          <PainelRecolhivel titulo="Posts relacionados" inicialAberto={false}>
            <p className="mb-3 text-[11.5px] text-ink-muted">
              Até 4 posts exibidos no rodapé do artigo como sugestão de leitura.
            </p>

            <div className="mb-3">
              <Alternador
                ativo={!modoAuto}
                onChange={(v) => setModoAuto(!v)}
                label="Seleção manual"
                descricao="Desligado = seleção automática por cluster"
              />
            </div>

            {modoAuto ? (
              <>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
                  Seleção automática por cluster
                </p>
                {autoRelacionados.length > 0 ? (
                  <ul className="space-y-1">
                    {autoRelacionados.map((p, i) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 rounded-[var(--radius)] border border-line bg-surface/60 px-2 py-1.5"
                      >
                        <span className="w-4 shrink-0 text-center font-mono text-[10px] text-ink-muted">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink">
                          {p.titulo}
                        </span>
                        <BadgeStatus status={p.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-ink-muted">
                    Nenhum post relacionado encontrado no cluster.
                  </p>
                )}
                <p className="mt-2 text-[10.5px] text-ink-muted">
                  Ative a seleção manual para personalizar a lista.
                </p>
              </>
            ) : (
              <>
                {/* Posts selecionados — drag-and-drop */}
                {relacionados.length > 0 && (
                  <ul className="mb-3 space-y-1">
                    {relacionados.map((rid, idx) => {
                      const rel = outrosPosts.find((p) => p.id === rid);
                      if (!rel) return null;
                      return (
                        <li
                          key={rid}
                          draggable
                          onDragStart={() => setDragIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragIdx !== null && dragIdx !== idx) {
                              const nova = [...relacionados];
                              const [item] = nova.splice(dragIdx, 1);
                              nova.splice(idx, 0, item);
                              setRelacionados(nova);
                            }
                            setDragIdx(null);
                          }}
                          onDragEnd={() => setDragIdx(null)}
                          className={cn(
                            "flex cursor-grab items-center gap-2 rounded-[var(--radius)] border border-line bg-surface px-2 py-1.5 active:cursor-grabbing",
                            dragIdx === idx && "opacity-40",
                          )}
                        >
                          <GripVertical size={12} className="shrink-0 text-ink-muted/50" />
                          <span className="w-4 shrink-0 text-center font-mono text-[10px] text-ink-muted">
                            {idx + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[12px] text-ink">
                            {rel.titulo}
                          </span>
                          <button
                            title="Remover"
                            onClick={() =>
                              setRelacionados(relacionados.filter((r) => r !== rid))
                            }
                            className="shrink-0 rounded p-0.5 text-ink-muted transition-colors hover:text-danger"
                          >
                            <X size={11} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Busca de novos posts */}
                {relacionados.length < 4 ? (
                  <>
                    <div className="relative mb-2">
                      <Search
                        size={12}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
                      />
                      <input
                        type="text"
                        placeholder="Buscar post por título…"
                        value={buscaRel}
                        onChange={(e) => setBuscaRel(e.target.value)}
                        className="w-full rounded-[var(--radius)] border border-line bg-surface-2 py-1.5 pl-8 pr-3 text-[12px] text-ink placeholder:text-ink-muted/70 outline-none focus:border-primary"
                      />
                    </div>

                    {resultadosBusca.length > 0 && (
                      <ul className="space-y-0.5">
                        {resultadosBusca
                          .filter((p) => !relacionados.includes(p.id))
                          .map((p) => (
                            <li key={p.id}>
                              <button
                                onClick={() => {
                                  setRelacionados([...relacionados, p.id]);
                                  setBuscaRel("");
                                }}
                                className="flex w-full items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-left text-[12px] text-ink transition-colors hover:bg-secondary"
                              >
                                <Plus size={11} className="shrink-0 text-ink-muted" />
                                <span className="min-w-0 flex-1 truncate">{p.titulo}</span>
                                <BadgeStatus status={p.status} />
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}

                    {buscaRel.trim() &&
                      resultadosBusca.filter((p) => !relacionados.includes(p.id)).length === 0 && (
                        <p className="text-center text-[11px] text-ink-muted">Nenhum resultado.</p>
                      )}

                    {relacionados.length === 0 && !buscaRel && (
                      <p className="text-[11px] text-ink-muted">
                        Busque posts acima para adicionar até 4 sugestões.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[10.5px] text-ink-muted">Máximo de 4 posts atingido.</p>
                )}
              </>
            )}
          </PainelRecolhivel>

          {/* ================================================ 11. Avançado */}
          <PainelRecolhivel titulo="Avançado" inicialAberto={false}>
            <div className="space-y-3">
              <Campo
                label="Canonical URL"
                dica="Use apenas quando este mesmo conteúdo já existe em outra URL — por exemplo, um artigo republicado em outro site. Vazio significa que esta página é a versão oficial."
              >
                <Entrada
                  value={post.canonical}
                  onChange={(e) => editar({ canonical: e.target.value })}
                  placeholder="https://outrosite.com.br/artigo-original"
                  className="font-mono text-[11px]"
                />
              </Campo>
              <div className="border-t border-line pt-2.5">
                <Alternador
                  ativo={post.noindex}
                  onChange={(v) => editar({ noindex: v })}
                  label="noindex"
                  descricao="Impede que o post apareça nos resultados de busca"
                />
              </div>
            </div>
          </PainelRecolhivel>

        </div>
      </div>

      <SeletorMidia
        aberto={bibliotecaCapa}
        aoFechar={() => setBibliotecaCapa(false)}
        selecionada={post.capa}
        aoEscolher={(m) => editar({ capa: m.id, capaAlt: m.alt || post.capaAlt })}
      />
    </>
  );
}
