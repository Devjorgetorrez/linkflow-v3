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
import { urlPost } from "@/lib/urls-publicas";
import { cn } from "@/lib/utils";
import type { JsonldBloco } from "@/lib/html-pagina";
import type { Pagina, Post } from "@/mock/types";

/* ------------------------------------------------------------------ */
/* Tipos locais                                                         */
/* ------------------------------------------------------------------ */

type StatusItem = "completo" | "aviso" | "incompleto";
type TipoEntidade = "pagina" | "post";
type StatusPasso = "ok" | "aviso" | "pendente";
type NivelProblema = "erro" | "aviso";

interface ProblemaBloco {
  nivel: NivelProblema;
  mensagem: string;
}

interface ItemAuditoria {
  id: string;
  titulo: string;
  url: string;
  tipoEntidade: TipoEntidade;
  origem: "publicado" | "previa" | null;
  blocos: JsonldBloco[];
  /** @type reais, união de todos os blocos válidos deste item */
  tipos: string[];
  status: StatusItem;
  problemas: ProblemaBloco[];
}

/* ------------------------------------------------------------------ */
/* Validação do que o site REALMENTE emite (não do "previsto")         */
/* ------------------------------------------------------------------ */

/** Tipos cujo `name` + `address` fazem sentido cobrar (negócio/organização deste site). */
const TIPOS_NEGOCIO = new Set([
  "LocalBusiness",
  "Organization",
  "Psychologist",
  "Physician",
  "Dentist",
  "LegalService",
  "AccountingService",
]);

const ROTULOS_TIPO: Record<string, string> = {
  BlogPosting: "artigo",
  Article: "artigo",
  Service: "serviço",
  WebPage: "página",
  FAQPage: "perguntas frequentes",
  HowTo: "passo a passo",
  CollectionPage: "coleção de conteúdos",
  ContactPage: "página de contato",
  AboutPage: "página institucional",
  ProfilePage: "perfil de autor",
  Person: "pessoa",
  Organization: "organização",
  LocalBusiness: "negócio local",
  Psychologist: "psicólogo(a)",
  Physician: "médico(a)",
  Dentist: "dentista",
  LegalService: "serviço jurídico",
  AccountingService: "contador(a)",
  WebSite: "site",
  BreadcrumbList: "trilha de navegação",
};

function campoVazio(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Achata @graph e arrays; devolve cada nó com @type junto do objeto (pra checar campos). */
function nosComTipo(no: unknown, saida: { tipo: string; node: Record<string, unknown> }[]): void {
  if (Array.isArray(no)) {
    for (const n of no) nosComTipo(n, saida);
    return;
  }
  if (!no || typeof no !== "object") return;
  const obj = no as Record<string, unknown>;
  const t = obj["@type"];
  const lista = typeof t === "string" ? [t] : Array.isArray(t) ? t.filter((x): x is string => typeof x === "string") : [];
  for (const tipo of lista) saida.push({ tipo, node: obj });
  if (obj["@graph"] !== undefined) nosComTipo(obj["@graph"], saida);
}

/**
 * Valida só o que dá para checar de forma genérica a partir do que o bloco
 * realmente contém: JSON quebrado, @type ausente, e — apenas para os tipos
 * abaixo, que já aparecem neste site — campos comumente exigidos ausentes.
 * Nenhuma outra regra de schema.org é aplicada (evita tabela gigante e
 * palpite sobre o que "deveria" ter).
 */
function validarBloco(bloco: JsonldBloco): ProblemaBloco[] {
  if (!bloco.valido) {
    return [
      {
        nivel: "erro",
        mensagem: `JSON-LD inválido${bloco.erro ? ` — ${bloco.erro}` : ""}.`,
      },
    ];
  }
  const nos: { tipo: string; node: Record<string, unknown> }[] = [];
  nosComTipo(bloco.dado, nos);
  if (nos.length === 0) {
    return [{ nivel: "erro", mensagem: "Bloco de dados estruturados sem nenhum @type." }];
  }
  const problemas: ProblemaBloco[] = [];
  for (const { tipo, node } of nos) {
    if (/Article$/.test(tipo)) {
      if (campoVazio(node.headline)) problemas.push({ nivel: "erro", mensagem: `${tipo}: falta o campo "headline".` });
      if (campoVazio(node.datePublished)) problemas.push({ nivel: "erro", mensagem: `${tipo}: falta o campo "datePublished".` });
    } else if (TIPOS_NEGOCIO.has(tipo)) {
      if (campoVazio(node.name)) problemas.push({ nivel: "erro", mensagem: `${tipo}: falta o campo "name".` });
      if (campoVazio(node.address)) problemas.push({ nivel: "erro", mensagem: `${tipo}: falta o campo "address".` });
    } else if (tipo === "Person") {
      if (campoVazio(node.name)) problemas.push({ nivel: "erro", mensagem: `Person: falta o campo "name".` });
    } else if (tipo === "FAQPage") {
      if (campoVazio(node.mainEntity)) problemas.push({ nivel: "erro", mensagem: `FAQPage: falta o campo "mainEntity".` });
    } else if (tipo === "Product") {
      if (campoVazio(node.name)) problemas.push({ nivel: "erro", mensagem: `Product: falta o campo "name".` });
    }
  }
  return problemas;
}

function montarItem(
  base: { id: string; titulo: string; url: string; tipoEntidade: TipoEntidade },
  origem: "publicado" | "previa" | null,
  blocos: JsonldBloco[],
): ItemAuditoria {
  if (blocos.length === 0) {
    return {
      ...base,
      origem,
      blocos,
      tipos: [],
      status: "aviso",
      problemas: [{ nivel: "aviso", mensagem: "Nenhum bloco de dados estruturados foi encontrado nesta página." }],
    };
  }
  const problemas = blocos.flatMap(validarBloco);
  const tipos = [...new Set(blocos.flatMap((b) => b.tipos))];
  const status: StatusItem = problemas.some((p) => p.nivel === "erro") ? "incompleto" : "completo";
  return { ...base, origem, blocos, tipos, status, problemas };
}

function fraseDosTipos(tipos: string[]): string {
  if (tipos.length === 0) return "Sem dados estruturados";
  const labels = [...new Set(tipos.map((t) => ROTULOS_TIPO[t] ?? t))];
  return `Descrita como ${labels.join(", ")}`;
}

/* ------------------------------------------------------------------ */
/* Tipo profissional do site (a partir do JSON-LD real da home)        */
/* ------------------------------------------------------------------ */

const TIPO_PT: Record<string, string> = {
  Psychologist: "Psicólogo(a)",
  Physician: "Médico(a)",
  Dentist: "Dentista",
  LegalService: "Serviço jurídico",
  AccountingService: "Contador(a)",
  LocalBusiness: "Negócio local",
};

function derivarTipoProfissional(tipos: string[]): { pt: string; en: string } | null {
  for (const [en, pt] of Object.entries(TIPO_PT)) {
    if (tipos.includes(en)) return { pt, en };
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
  const { autores, aparencia } = useStore();
  const [paginas, setPaginas] = useState<Pagina[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [erroPaginas, setErroPaginas] = useState(false);
  const [erroPosts, setErroPosts] = useState(false);
  const [origemSite, setOrigemSite] = useState<{ origem: string; rotulo: string } | null>(null);
  const nomeSite = aparencia.nomeSite || "este site";

  useEffect(() => {
    fetch("/api/paginas")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.paginas)) {
          setPaginas(data.paginas);
          setOrigemSite({ origem: data.origem, rotulo: data.origemRotulo });
          setErroPaginas(false);
        } else {
          setPaginas([]);
          setErroPaginas(true);
        }
      })
      .catch(() => {
        setPaginas([]);
        setErroPaginas(true);
      });
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.posts)) {
          setPosts(data.posts);
          setErroPosts(false);
        } else {
          setPosts([]);
          setErroPosts(true);
        }
      })
      .catch(() => {
        setPosts([]);
        setErroPosts(true);
      });
  }, []);

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
  const tipoProfissional = derivarTipoProfissional(homePage?.real?.schemaTipos ?? []);
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

  /* ── Itens de auditoria: o que o HTML publicado REALMENTE emite ── */
  const itens: ItemAuditoria[] = useMemo(() => {
    const lista: ItemAuditoria[] = [];

    for (const p of paginas) {
      lista.push(
        montarItem(
          { id: `pag-${p.id}`, titulo: p.titulo || p.url, url: p.url, tipoEntidade: "pagina" },
          p.real?.origem ?? null,
          p.real?.jsonldBlocosDetalhe ?? [],
        ),
      );
    }

    for (const post of posts.filter((p) => p.status === "publicado")) {
      lista.push(
        montarItem(
          { id: `post-${post.id}`, titulo: post.titulo, url: urlPost(post.slug), tipoEntidade: "post" },
          post.real?.origem ?? null,
          post.real?.jsonldBlocosDetalhe ?? [],
        ),
      );
    }

    return lista;
  }, [paginas, posts]);

  /* ── Passo 3 ── */
  const totalIncompletos = itens.filter((i) => i.status === "incompleto").length;
  const totalSemDados = itens.filter((i) => i.blocos.length === 0).length;
  const passo3Status: StatusPasso = totalIncompletos > 0 ? "aviso" : "ok";

  function blocoParaTexto(b: JsonldBloco): string {
    return b.valido ? JSON.stringify(b.dado, null, 2) : (b.bruto ?? "");
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-[52px] z-10 flex h-14 items-center border-b border-[var(--line)] bg-[var(--surface)] px-6">
        <h1 className="text-[15px] font-semibold text-[var(--ink)]">
          Dados estruturados
        </h1>
      </header>

      <main className="space-y-8 p-6">

        {(erroPaginas || erroPosts) && (
          <div className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 text-[12.5px] text-[var(--danger)]">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              Não foi possível carregar{" "}
              {erroPaginas && erroPosts ? "as páginas e os artigos" : erroPaginas ? "as páginas" : "os artigos"}{" "}
              do site. Recarregue a tela para tentar de novo.
            </span>
          </div>
        )}

        {!erroPaginas && origemSite?.origem === "nenhuma" && (
          <div className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[12.5px] text-[var(--ink-muted)]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>O site ainda não foi publicado — ainda não há HTML para auditar dados estruturados.</span>
          </div>
        )}

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
                  {totalSemDados > 0 && (
                    <span className="ml-1 text-[#d97706]">
                      {totalSemDados}{" "}
                      {totalSemDados === 1 ? "sem dados estruturados" : "sem dados estruturados"}.
                    </span>
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

        {/* ── D: Auditoria por URL — o que o HTML publicado REALMENTE emite ── */}
        <section id="auditoria" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[var(--ink)]">
              Descrição por página
            </h2>
            <span className="text-[12px] text-[var(--ink-muted)]">
              {itens.length} endereços
              {origemSite && origemSite.origem !== "nenhuma" && ` · lido de: ${origemSite.rotulo}`}
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
                    O que o HTML emite
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
                            title={item.url}
                          >
                            {item.url}
                          </div>
                        </td>

                        {/* O que o HTML emite */}
                        <td className="max-w-[280px] px-4 py-3">
                          <span
                            className="cursor-help text-[12px] text-[var(--ink-muted)]"
                            title={item.tipos.join(", ")}
                          >
                            {fraseDosTipos(item.tipos)}
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
                            disabled={item.blocos.length === 0}
                            className="flex items-center gap-1 rounded px-2 py-1 text-[11.5px] font-medium text-[var(--primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] disabled:cursor-not-allowed disabled:text-[var(--ink-muted)] disabled:hover:bg-transparent"
                          >
                            {item.blocos.length === 0
                              ? "Sem blocos"
                              : codigoAberto
                                ? "Fechar"
                                : "Ver código"}
                            {item.blocos.length > 0 &&
                              (codigoAberto ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
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
                                  {pr.nivel === "erro" ? (
                                    <AlertCircle
                                      size={13}
                                      className="mt-0.5 shrink-0 text-[var(--danger)]"
                                    />
                                  ) : (
                                    <AlertTriangle
                                      size={13}
                                      className="mt-0.5 shrink-0 text-[#d97706]"
                                    />
                                  )}
                                  <p className="text-[12px] text-[var(--ink)]">
                                    {pr.mensagem}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Expansão: código */}
                      {codigoAberto && item.blocos.length > 0 && (
                        <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                          <td colSpan={4} className="px-5 py-4">
                            <div className="space-y-3">
                              <p className="text-[10.5px] text-[var(--ink-muted)]">
                                Exatamente como emitido no{" "}
                                <code className="rounded bg-[var(--surface)] px-1 font-mono">
                                  &lt;head&gt;
                                </code>{" "}
                                / corpo de{" "}
                                <code className="rounded bg-[var(--surface)] px-1 font-mono">
                                  {item.url}
                                </code>{" "}
                                — lido do HTML publicado, não gerado por aqui.
                                {item.blocos.length > 1 && ` ${item.blocos.length} blocos encontrados.`}
                              </p>
                              {item.blocos.map((b, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center gap-2 text-[10.5px] text-[var(--ink-muted)]">
                                    <span className="font-semibold text-[var(--ink)]">
                                      Bloco {i + 1}
                                    </span>
                                    {b.valido ? (
                                      <span>{b.tipos.length > 0 ? b.tipos.join(", ") : "sem @type"}</span>
                                    ) : (
                                      <span className="text-[var(--danger)]">JSON inválido</span>
                                    )}
                                  </div>
                                  <div className="overflow-x-auto rounded border border-[var(--line)] bg-[var(--surface)] p-3">
                                    <pre className="whitespace-pre font-mono text-[11px] leading-relaxed text-[var(--ink)]">
                                      {`<script type="application/ld+json">\n${blocoParaTexto(b)}\n</script>`}
                                    </pre>
                                  </div>
                                </div>
                              ))}
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
