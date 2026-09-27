"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useSiteInfo } from "@/lib/useSiteInfo";
import { urlAutor, urlCategoria, urlPost } from "@/lib/urls-publicas";
import { cn } from "@/lib/utils";
import {
  gerarGraphAutor,
  gerarGraphCategoria,
  gerarGraphPagina,
  gerarGraphPost,
  type SchemaGraph,
} from "@/motor/schema-graph";
import type { Autor, Categoria, Pagina, Post } from "@/mock/types";

/* ------------------------------------------------------------------ */
/* Tipos locais                                                         */
/* ------------------------------------------------------------------ */

type StatusItem = "completo" | "aviso" | "incompleto";
type TipoEntidade = "pagina" | "post" | "categoria" | "autor";
type StatusPasso = "ok" | "aviso" | "pendente";

interface ProblemaValidacao {
  mensagem: string;
  href: string;
  labelLink: string;
}

interface ItemAuditoria {
  id: string;
  titulo: string;
  url: string;
  tipoEntidade: TipoEntidade;
  frase: string;
  fraseTooltip: string;
  status: StatusItem;
  problemas: ProblemaValidacao[];
  graph: SchemaGraph;
}

/* ------------------------------------------------------------------ */
/* Derivação de frase em português                                     */
/* ------------------------------------------------------------------ */

function listarTiposDoGraph(g: SchemaGraph): string[] {
  return g["@graph"].map((n) =>
    Array.isArray(n["@type"]) ? n["@type"][0] : n["@type"],
  );
}

function frasePorTipos(
  tipos: string[],
  tipoEntidade: TipoEntidade,
  schema?: string,
  tipoPagina?: string,
): { frase: string; tooltip: string } {
  if (tipoEntidade === "autor") {
    return {
      frase: "Descrita como perfil de autor com credenciais profissionais",
      tooltip: "ProfilePage + Person — página /autor/<slug>, referenciada pelos artigos",
    };
  }
  if (tipoEntidade === "categoria") {
    return {
      frase: "Descrita como coleção de conteúdos",
      tooltip: "CollectionPage — resultado rico no Google",
    };
  }
  if (tipoEntidade === "post") {
    const temFaq = tipos.includes("FAQPage");
    const temHowTo = tipos.includes("HowTo");
    if (temHowTo && temFaq) {
      return {
        frase: "Descrito como artigo com passo a passo e perguntas frequentes",
        tooltip:
          "BlogPosting + HowTo + FAQPage — HowTo sem resultado rico desde 09/2023; FAQPage sem resultado rico desde 07/2026; ambos ainda extraídos por IAs",
      };
    }
    if (temHowTo) {
      return {
        frase: "Descrito como artigo com passo a passo",
        tooltip:
          "BlogPosting + HowTo — HowTo sem resultado rico desde 09/2023; ainda extraído por IAs (ChatGPT, Perplexity, Claude)",
      };
    }
    if (temFaq) {
      return {
        frase: "Descrito como artigo com perguntas frequentes",
        tooltip:
          "BlogPosting + FAQPage — FAQPage sem resultado rico desde 07/2026; ainda extraído por IAs (ChatGPT, Perplexity, Claude)",
      };
    }
    return {
      frase: "Descrito como artigo, com autor e data de publicação",
      tooltip: "BlogPosting — resultado rico no Google com autor e data",
    };
  }

  // pagina
  const s = schema ?? "";
  if (s.includes("Contact")) {
    return {
      frase: "Descrita como página de contato",
      tooltip: "ContactPage — resultado rico no Google",
    };
  }
  if (s.includes("About")) {
    return {
      frase: "Descrita como página institucional",
      tooltip: "AboutPage — resultado rico no Google",
    };
  }
  if (tipoPagina === "money" || s.includes("Service")) {
    return {
      frase: "Descrita como serviço oferecido pelo consultório",
      tooltip: "Service — resultado rico no Google",
    };
  }
  if (tipoPagina === "pilar") {
    return {
      frase: "Descrita como página de conteúdo principal",
      tooltip: "WebPage",
    };
  }
  if (s.includes("LocalBusiness") || s.includes("Psychologist") || s.includes("Physician")) {
    return {
      frase: "Descrita como a página principal do consultório",
      tooltip: "LocalBusiness + Psychologist — resultado rico no Google",
    };
  }
  return {
    frase: "Descrita como página do site",
    tooltip: "WebPage",
  };
}

/* ------------------------------------------------------------------ */
/* Validação em português                                              */
/* ------------------------------------------------------------------ */

function calcularStatusPagina(
  p: Pagina,
): { status: StatusItem; problemas: ProblemaValidacao[] } {
  const problemas: ProblemaValidacao[] = [];
  if (p.seoTitle.length < 3 || p.seoTitle.length > 70)
    problemas.push({
      mensagem: "O título está fora do tamanho ideal para busca (máx. 70 caracteres).",
      href: "/paginas",
      labelLink: "Abrir em Páginas",
    });
  if (p.metaDescription.length < 80 || p.metaDescription.length > 165)
    problemas.push({
      mensagem: "A descrição está fora do tamanho ideal (entre 80 e 165 caracteres).",
      href: "/paginas",
      labelLink: "Abrir em Páginas",
    });
  return { status: problemas.length > 0 ? "incompleto" : "completo", problemas };
}

function calcularStatusPost(
  p: Post,
): { status: StatusItem; problemas: ProblemaValidacao[] } {
  const bloqueantes: ProblemaValidacao[] = [];
  const tituloBusca = p.seoTitle || p.titulo; // título SEO vazio = o site usa o título do artigo
  if (tituloBusca.length < 3 || tituloBusca.length > 70)
    bloqueantes.push({
      mensagem: "O título está fora do tamanho ideal para busca (máx. 70 caracteres).",
      href: "/posts",
      labelLink: "Abrir o editor",
    });
  if (p.metaDescription.length < 80 || p.metaDescription.length > 165)
    bloqueantes.push({
      mensagem: "A descrição está fora do tamanho ideal (entre 80 e 165 caracteres).",
      href: "/posts",
      labelLink: "Abrir o editor",
    });
  if (!p.capaAlt?.trim())
    bloqueantes.push({
      mensagem:
        "Falta o texto alternativo da imagem de capa. Sem ele o Google não descreve a foto e o artigo perde pontos de acessibilidade.",
      href: "/posts",
      labelLink: "Abrir o editor",
    });
  if (bloqueantes.length > 0) return { status: "incompleto", problemas: bloqueantes };

  if (p.schemaTipo === "FAQPage" && p.faq.length === 0) {
    return {
      status: "aviso",
      problemas: [
        {
          mensagem:
            "O post está marcado como perguntas frequentes, mas não tem nenhuma pergunta cadastrada.",
          href: "/posts",
          labelLink: "Abrir o editor",
        },
      ],
    };
  }
  return { status: "completo", problemas: [] };
}

function calcularStatusCategoria(
  c: Categoria,
): { status: StatusItem; problemas: ProblemaValidacao[] } {
  const problemas: ProblemaValidacao[] = [];
  const seoTitle = c.seoTitle || c.nome;
  if (seoTitle.length < 3 || seoTitle.length > 70)
    problemas.push({
      mensagem: "O título da categoria está fora do tamanho ideal para busca.",
      href: "/categorias",
      labelLink: "Ir para Categorias",
    });
  if (c.metaDescription.length < 80 || c.metaDescription.length > 165)
    problemas.push({
      mensagem: "A descrição da categoria está fora do tamanho ideal (entre 80 e 165 caracteres).",
      href: "/categorias",
      labelLink: "Ir para Categorias",
    });
  return { status: problemas.length > 0 ? "incompleto" : "completo", problemas };
}

function calcularStatusAutor(
  a: Autor,
): { status: StatusItem; problemas: ProblemaValidacao[] } {
  const problemas: ProblemaValidacao[] = [];
  if (!a.conselho?.trim() || !a.registro?.trim())
    problemas.push({
      mensagem:
        "Credencial profissional incompleta. O Google usa o número do conselho para avaliar a autoridade do autor em saúde.",
      href: "/usuarios",
      labelLink: "Ver usuários",
    });
  if (a.bioCurta.length < 40)
    problemas.push({
      mensagem: "A bio curta está muito curta para aparecer bem nos resultados de busca.",
      href: "/usuarios",
      labelLink: "Ver usuários",
    });
  return { status: problemas.length > 0 ? "aviso" : "completo", problemas };
}

/* ------------------------------------------------------------------ */
/* Tipo profissional do site                                           */
/* ------------------------------------------------------------------ */

const TIPO_PT: Record<string, string> = {
  Psychologist: "Psicólogo(a)",
  Physician: "Médico(a)",
  Dentist: "Dentista",
  LegalService: "Serviço jurídico",
  AccountingService: "Contador(a)",
  LocalBusiness: "Negócio local",
};

function derivarTipoProfissional(
  schemaHome?: string,
): { pt: string; en: string } | null {
  if (!schemaHome) return null;
  for (const [en, pt] of Object.entries(TIPO_PT)) {
    if (schemaHome.includes(en)) return { pt, en };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Componentes visuais                                                 */
/* ------------------------------------------------------------------ */

function BadgeStatus({ status }: { status: StatusItem }) {
  const map: Record<StatusItem, { label: string; classes: string }> = {
    completo: {
      label: "Completo",
      classes:
        "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]",
    },
    aviso: {
      label: "Aviso",
      classes: "bg-[color-mix(in_srgb,#d97706_12%,transparent)] text-[#d97706]",
    },
    incompleto: {
      label: "Incompleto",
      classes:
        "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]",
    },
  };
  const { label, classes } = map[status];
  return (
    <span className={cn("rounded px-2 py-0.5 text-[11px] font-semibold", classes)}>
      {label}
    </span>
  );
}

function IconePasso({ status }: { status: StatusPasso }) {
  if (status === "ok")
    return <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--success)]" />;
  if (status === "aviso")
    return <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#d97706]" />;
  return <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />;
}

/* ------------------------------------------------------------------ */
/* Página principal                                                    */
/* ------------------------------------------------------------------ */

export default function DadosEstruturadosPage() {
  const { paginas: paginasMock, posts: postsMock, autores, categorias, midia, aparencia } = useStore();
  const [paginas, setPaginas] = useState<typeof paginasMock>([]);
  const [posts, setPosts] = useState<typeof postsMock>([]);
  const nomeSite = aparencia.nomeSite || "este site";
  const siteInfo = useSiteInfo();

  useEffect(() => {
    fetch("/api/paginas")
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.paginas)) setPaginas(data.paginas);
        else setPaginas(paginasMock);
      })
      .catch(() => setPaginas(paginasMock));
    fetch("/api/posts")
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.posts)) setPosts(data.posts);
        else setPosts(postsMock);
      })
      .catch(() => setPosts(postsMock));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [expandido, setExpandido] = useState<{
    id: string;
    tipo: "validacao" | "codigo";
  } | null>(null);

  function toggleExpandido(id: string, tipo: "validacao" | "codigo") {
    setExpandido((prev) =>
      prev?.id === id && prev.tipo === tipo ? null : { id, tipo },
    );
  }

  const postsPublicados = posts.filter((p) => p.status === "publicado");
  const autoresAtivos = autores.filter((a) => a.ativo !== false);

  /* ── Passo 1: tipo do site ── */
  const homePage = paginas.find((p) => p.url === "/");
  const tipoProfissional = derivarTipoProfissional(homePage?.schema);
  const passo1Status: StatusPasso = tipoProfissional ? "ok" : "pendente";

  /* ── Passo 2: autores e credenciais ── */
  const autoresComCredencial = autoresAtivos.filter(
    (a) => a.conselho?.trim() && a.registro?.trim(),
  );
  const autoresComPostPublicado = new Set(postsPublicados.map((p) => p.autorId));
  const semCredencialComPost = autoresAtivos.filter(
    (a) =>
      autoresComPostPublicado.has(a.id) &&
      (!a.conselho?.trim() || !a.registro?.trim()),
  );
  const passo2Status: StatusPasso =
    semCredencialComPost.length > 0 ? "aviso" : "ok";

  /* ── Itens de auditoria ── */
  const itens: ItemAuditoria[] = useMemo(() => {
    const lista: ItemAuditoria[] = [];
    const ativos = autores.filter((a) => a.ativo !== false);
    const publicados = posts.filter((p) => p.status === "publicado");

    for (const p of paginas.filter((pg) => pg.status === "publicado")) {
      const graph = gerarGraphPagina(p, siteInfo);
      const tipos = listarTiposDoGraph(graph);
      const { frase, tooltip } = frasePorTipos(tipos, "pagina", p.schema, p.tipo);
      const { status, problemas } = calcularStatusPagina(p);
      lista.push({
        id: `pag-${p.id}`,
        titulo: p.titulo,
        url: p.url,
        tipoEntidade: "pagina",
        frase,
        fraseTooltip: tooltip,
        status,
        problemas,
        graph,
      });
    }

    for (const p of publicados) {
      const autor = autores.find((a) => a.id === p.autorId);
      const imagemMidia = midia.find((m) => m.id === p.capa || m.id === p.ogImagem);
      const imagemUrl = imagemMidia?.url ?? "";
      const graph = gerarGraphPost(p, autor, categorias, imagemUrl, siteInfo);
      const tipos = listarTiposDoGraph(graph);
      const { frase, tooltip } = frasePorTipos(tipos, "post");
      const { status, problemas } = calcularStatusPost(p);
      lista.push({
        id: `post-${p.id}`,
        titulo: p.titulo,
        url: urlPost(p.slug),
        tipoEntidade: "post",
        frase,
        fraseTooltip: tooltip,
        status,
        problemas,
        graph,
      });
    }

    for (const c of categorias.filter((cat) => cat.slug)) {
      const artigosDaCategoria = publicados.filter((p) => p.categoriaId === c.id);
      const graph = gerarGraphCategoria(c, artigosDaCategoria, siteInfo);
      const tipos = listarTiposDoGraph(graph);
      const { frase, tooltip } = frasePorTipos(tipos, "categoria");
      const { status, problemas } = calcularStatusCategoria(c);
      lista.push({
        id: `cat-${c.id}`,
        titulo: c.nome,
        url: urlCategoria(c.slug),
        tipoEntidade: "categoria",
        frase,
        fraseTooltip: tooltip,
        status,
        problemas,
        graph,
      });
    }

    for (const a of ativos) {
      const graph = gerarGraphAutor(a, siteInfo);
      const tipos = listarTiposDoGraph(graph);
      const { frase, tooltip } = frasePorTipos(tipos, "autor");
      const { status, problemas } = calcularStatusAutor(a);
      lista.push({
        id: `autor-${a.id}`,
        titulo: a.nome,
        url: urlAutor(a.slug),
        tipoEntidade: "autor",
        frase,
        fraseTooltip: tooltip,
        status,
        problemas,
        graph,
      });
    }

    return lista;
  }, [paginas, posts, autores, categorias, midia, siteInfo]);

  /* ── Passo 3 ── */
  const totalIncompletos = itens.filter((i) => i.status === "incompleto").length;
  const passo3Status: StatusPasso = totalIncompletos > 0 ? "aviso" : "ok";

  function jsonLdStr(graph: SchemaGraph): string {
    return `<script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n</script>`;
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-[var(--line)] bg-[var(--surface)] px-6">
        <h1 className="text-[15px] font-semibold text-[var(--ink)]">
          Dados estruturados
        </h1>
      </header>

      <main className="space-y-8 p-6">

        {/* ── B: Como o site se identifica ── */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold text-[var(--ink)]">
            Como o seu site se identifica
          </h2>
          <div className="divide-y divide-[var(--line)] overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">

            {/* Passo 1 */}
            <div className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[10px] font-bold text-[var(--ink-muted)]">
                1
              </span>
              <IconePasso status={passo1Status} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[12.5px] font-semibold text-[var(--ink)]">
                  O que este site representa
                </p>
                {tipoProfissional ? (
                  <p className="text-[12px] text-[var(--ink-muted)]">
                    {nomeSite} é{" "}
                    <span className="font-medium text-[var(--ink)]">
                      {tipoProfissional.pt}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-[12px] text-[var(--ink-muted)]">
                    O tipo de profissional ainda não foi definido.
                  </p>
                )}
              </div>
              <span className="mt-0.5 flex shrink-0 items-center gap-1 text-[12px] text-[var(--ink-muted)] italic">
                Configurações — tela ainda não construída
              </span>
            </div>

            {/* Passo 2 */}
            <div className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[10px] font-bold text-[var(--ink-muted)]">
                2
              </span>
              <IconePasso status={passo2Status} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[12.5px] font-semibold text-[var(--ink)]">
                  Quem assina o conteúdo
                </p>
                <p className="text-[12px] text-[var(--ink-muted)]">
                  {autoresAtivos.length}{" "}
                  {autoresAtivos.length === 1
                    ? "autor cadastrado"
                    : "autores cadastrados"}
                  ,{" "}
                  <span
                    className={cn(
                      "font-medium",
                      autoresComCredencial.length < autoresAtivos.length
                        ? "text-[#d97706]"
                        : "text-[var(--ink)]",
                    )}
                  >
                    {autoresComCredencial.length} com registro profissional preenchido
                  </span>
                  .
                  {semCredencialComPost.length > 0 && (
                    <span className="ml-1 text-[#d97706]">
                      {semCredencialComPost.length === 1
                        ? "1 autor com post publicado"
                        : `${semCredencialComPost.length} autores com post publicado`}{" "}
                      sem credencial.
                    </span>
                  )}
                </p>
              </div>
              <Link
                href="/usuarios"
                className="mt-0.5 flex shrink-0 items-center gap-1 text-[12px] text-[var(--primary)] hover:underline"
              >
                Ver usuários <ArrowRight size={11} />
              </Link>
            </div>

            {/* Passo 3 */}
            <div className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[10px] font-bold text-[var(--ink-muted)]">
                3
              </span>
              <IconePasso status={passo3Status} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[12.5px] font-semibold text-[var(--ink)]">
                  O que cada página declara
                </p>
                <p className="text-[12px] text-[var(--ink-muted)]">
                  {itens.length}{" "}
                  {itens.length === 1 ? "página descrita" : "páginas descritas"}.{" "}
                  {totalIncompletos > 0 ? (
                    <span className="font-medium text-[var(--danger)]">
                      {totalIncompletos}{" "}
                      {totalIncompletos === 1 ? "incompleta" : "incompletas"}.
                    </span>
                  ) : (
                    <span className="font-medium text-[var(--success)]">Todas completas.</span>
                  )}
                </p>
              </div>
              <button
                onClick={() =>
                  document.getElementById("auditoria")?.scrollIntoView({ behavior: "smooth" })
                }
                className="mt-0.5 flex shrink-0 items-center gap-1 text-[12px] text-[var(--primary)] hover:underline"
              >
                Ver auditoria <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </section>

        {/* ── C: O que o Google entende ── */}
        <section className="space-y-4">
          <h2 className="text-[13px] font-semibold text-[var(--ink)]">
            O que o Google entende do seu site
          </h2>

          <p className="text-[12.5px] leading-relaxed text-[var(--ink-muted)]">
            Toda página deste site diz ao Google três coisas: que {nomeSite} existe,
            que o site pertence a esse negócio, e o que aquela página específica trata.
            Isso é montado automaticamente a partir do que você preenche em Identidade,
            Contato e no editor de cada conteúdo. Não há nada para configurar aqui.
          </p>

          {/* Origem por camada */}
          <div className="divide-y divide-[var(--line)] overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
            {[
              {
                camada: "O negócio",
                origem: "Configurações › Identidade e Contato",
                href: undefined,
              },
              { camada: "O autor", origem: "Usuários", href: "/usuarios" },
              {
                camada: "Cada conteúdo",
                origem: "Derivado do tipo de página e do que ela contém",
                href: undefined,
              },
            ].map(({ camada, origem, href }) => (
              <div key={camada} className="flex items-center gap-3 px-5 py-3">
                <span className="w-32 shrink-0 text-[12px] font-semibold text-[var(--ink)]">
                  {camada}
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">←</span>
                {href ? (
                  <Link
                    href={href}
                    className="text-[12px] text-[var(--primary)] hover:underline"
                  >
                    {origem}
                  </Link>
                ) : (
                  <span className="text-[12px] text-[var(--ink-muted)]">{origem}</span>
                )}
              </div>
            ))}
          </div>

          {/* O que sai automaticamente */}
          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-[var(--ink)]">
              O que sai automaticamente conforme o conteúdo
            </p>
            <div className="divide-y divide-[var(--line)] overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
              {[
                {
                  tipo: "Post de blog",
                  descricao: "Descrito como artigo, com autor e data de publicação.",
                  tooltip: "BlogPosting — resultado rico no Google com autor e data",
                },
                {
                  tipo: "Página de serviço",
                  descricao: "Descrita como serviço prestado pelo consultório.",
                  tooltip: "Service — resultado rico no Google",
                },
                {
                  tipo: "Página com perguntas",
                  descricao:
                    "As perguntas viram conteúdo estruturado para o Google extrair respostas diretas.",
                  tooltip:
                    "FAQPage — sem resultado rico na busca desde 07/2026; ainda extraído por IAs (ChatGPT, Perplexity, Claude)",
                },
                {
                  tipo: "Página com passos",
                  descricao: "Os passos viram conteúdo estruturado para tutoriais.",
                  tooltip:
                    "HowTo — sem resultado rico na busca desde 09/2023; ainda extraído por IAs",
                },
                {
                  tipo: "Listagem do blog",
                  descricao: "Descrita como coleção de conteúdos.",
                  tooltip: "CollectionPage — resultado rico no Google",
                },
              ].map(({ tipo, descricao, tooltip }) => (
                <div key={tipo} className="flex items-start gap-4 px-5 py-3">
                  <span className="w-40 shrink-0 text-[12px] font-medium text-[var(--ink)]">
                    {tipo}
                  </span>
                  <span
                    className="flex-1 cursor-help text-[12px] text-[var(--ink-muted)]"
                    title={tooltip}
                  >
                    {descricao}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Avaliações e estrelas ── */}
        <section>
          <div className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-5 py-4">
            <Lock size={14} className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
            <div className="space-y-1">
              <p className="text-[12.5px] font-semibold text-[var(--ink)]">
                Avaliações e estrelas no Google
              </p>
              <p className="text-[12px] leading-relaxed text-[var(--ink-muted)]">
                Avaliações publicadas no próprio site nunca geram estrelas nos resultados de
                busca — o Google não aceita avaliações de quem avalia a si mesmo. O dado
                ainda alimenta respostas de IAs e não é inerte, mas não aparece como estrela
                destacada na busca. Esta restrição está ativa neste site.
              </p>
            </div>
          </div>
        </section>

        {/* ── D: Auditoria por URL ── */}
        <section id="auditoria" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[var(--ink)]">
              Descrição por página
            </h2>
            <span className="text-[12px] text-[var(--ink-muted)]">
              {itens.length} endereços
            </span>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)]">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    Página
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    Como está descrita
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    Validação
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    Código
                  </th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => {
                  const validacaoAberta =
                    expandido?.id === item.id && expandido.tipo === "validacao";
                  const codigoAberto =
                    expandido?.id === item.id && expandido.tipo === "codigo";

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="border-b border-[var(--line)] bg-[var(--surface)] transition-colors hover:bg-[var(--surface-2)]/50 last:border-0">
                        {/* Página */}
                        <td className="max-w-[200px] px-4 py-3">
                          <div
                            className="truncate text-[12.5px] font-medium text-[var(--ink)]"
                            title={item.titulo}
                          >
                            {item.titulo}
                          </div>
                          <div
                            className="truncate font-mono text-[11px] text-[var(--ink-muted)]"
                            title={item.url || "Sem página própria no site"}
                          >
                            {item.url || "sem página própria — Person nos artigos"}
                          </div>
                        </td>

                        {/* Descrição em português */}
                        <td className="max-w-[280px] px-4 py-3">
                          <span
                            className="cursor-help text-[12px] text-[var(--ink-muted)]"
                            title={item.fraseTooltip}
                          >
                            {item.frase}
                          </span>
                        </td>

                        {/* Validação */}
                        <td className="px-4 py-3">
                          {item.status === "completo" ? (
                            <BadgeStatus status="completo" />
                          ) : (
                            <button
                              onClick={() => toggleExpandido(item.id, "validacao")}
                              className="flex items-center gap-1"
                            >
                              <BadgeStatus status={item.status} />
                              {validacaoAberta ? (
                                <ChevronUp size={12} className="text-[var(--ink-muted)]" />
                              ) : (
                                <ChevronDown size={12} className="text-[var(--ink-muted)]" />
                              )}
                            </button>
                          )}
                        </td>

                        {/* Ver código */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleExpandido(item.id, "codigo")}
                            className="flex items-center gap-1 rounded px-2 py-1 text-[11.5px] font-medium text-[var(--primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                          >
                            {codigoAberto ? "Fechar" : "Ver código"}
                            {codigoAberto ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expansão: validação */}
                      {validacaoAberta && (
                        <tr className="border-b border-[var(--line)] bg-[color-mix(in_srgb,#f59e0b_5%,transparent)]">
                          <td colSpan={4} className="px-5 py-4">
                            <div className="space-y-3">
                              {item.problemas.map((pr, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                  <AlertTriangle
                                    size={13}
                                    className="mt-0.5 shrink-0 text-[#d97706]"
                                  />
                                  <div>
                                    <p className="text-[12px] text-[var(--ink)]">
                                      {pr.mensagem}
                                    </p>
                                    <Link
                                      href={pr.href}
                                      className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[var(--primary)] hover:underline"
                                    >
                                      {pr.labelLink} <ArrowRight size={10} />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Expansão: código */}
                      {codigoAberto && (
                        <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                          <td colSpan={4} className="px-5 py-4">
                            <div className="space-y-2">
                              <p className="text-[10.5px] text-[var(--ink-muted)]">
                                Emitido no{" "}
                                <code className="rounded bg-[var(--surface)] px-1 font-mono">
                                  &lt;head&gt;
                                </code>{" "}
                                de{" "}
                                <code className="rounded bg-[var(--surface)] px-1 font-mono">
                                  {item.url || "cada artigo deste autor"}
                                </code>
                                . Padrão @graph: todos os nodos são referenciados entre si
                                por{" "}
                                <code className="rounded bg-[var(--surface)] px-1 font-mono">
                                  @id
                                </code>
                                , evitando duplicação — WebSite, Organization e
                                BreadcrumbList estão presentes em todas as páginas.
                              </p>
                              <div className="overflow-x-auto rounded border border-[var(--line)] bg-[var(--surface)] p-3">
                                <pre className="whitespace-pre font-mono text-[11px] leading-relaxed text-[var(--ink)]">
                                  {jsonLdStr(item.graph)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
