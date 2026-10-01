/**
 * lib/auditoria-seo.ts — carrega TUDO que a auditoria de SEO precisa e só
 * então calcula. Sem React, sem fs: recebe o `buscar` (fetch do navegador, ou
 * um falso nos testes).
 *
 * Contador estável (defeito A16): o resumo e a contagem só existem depois de
 * TODOS os fetches terminarem (Promise.allSettled) e são calculados uma única
 * vez, sobre um conjunto fechado de dados. Nada vem de estado que carrega
 * "depois" (o store global carregava autores/categorias de forma assíncrona e
 * o número mudava com o tempo — por isso esta tela busca tudo por conta
 * própria). Mesma entrada => mesmo resultado, qualquer que seja a ordem em
 * que as respostas chegam. Falha de um fetch vira "não foi possível verificar
 * X" e não derruba o resto; a contagem passa a ser marcada como parcial.
 */

import type { Autor, Categoria, Pagina, Post, Redirect } from "@/mock/types";
import { gerarIndexaveis } from "@/motor/indexaveis";
import { auditarTecnica, type Problema } from "@/motor/auditoria-tecnica";
import type { GrafoLinks } from "@/lib/links-internos";

export type Buscar = (url: string) => Promise<unknown>;

interface Fonte {
  url: string;
  /** frase depois de "não foi possível verificar" */
  rotulo: string;
}

const FONTES = {
  links: { url: "/api/links-internos", rotulo: "os links internos do site" },
  posts: { url: "/api/posts", rotulo: "os artigos" },
  paginas: { url: "/api/paginas", rotulo: "as páginas do site" },
  redirects: { url: "/api/redirects", rotulo: "os redirecionamentos" },
  robots: { url: "/api/robots", rotulo: "o robots.txt" },
  config: { url: "/api/config", rotulo: "as configurações do site (domínio, Analytics, Bing)" },
  autores: { url: "/api/autores", rotulo: "os autores" },
  categorias: { url: "/api/categorias", rotulo: "as categorias" },
} satisfies Record<string, Fonte>;

type Chave = keyof typeof FONTES;

export interface IntegracoesConfig {
  analiticos: boolean;
  marketing: boolean;
  nomes: string[];
}

export interface ResultadoAuditoria {
  problemas: Problema[];
  /** Fontes que falharam: "não foi possível verificar <rotulo>". */
  falhas: string[];
  /** De onde veio o HTML lido ("site publicado", "última prévia local (dist)"), se conhecido. */
  origemRotulo: string | null;
  /** null = a config não carregou (a tela não afirma nada sobre integrações). */
  integracoes: IntegracoesConfig | null;
  /** Analytics/GTM que o HTML realmente carrega (vazio = nenhum). */
  rastreadoresNoHtml: string[];
}

function lista<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export async function carregarAuditoria(buscar: Buscar): Promise<ResultadoAuditoria> {
  const chaves = Object.keys(FONTES) as Chave[];
  const resultados = await Promise.allSettled(
    chaves.map(async (k) => {
      const data = (await buscar(FONTES[k].url)) as { ok?: boolean; erro?: string } | null;
      if (!data || data.ok !== true) throw new Error(data?.erro ?? "resposta inválida");
      return data as Record<string, unknown>;
    }),
  );

  const dado = {} as Partial<Record<Chave, Record<string, unknown>>>;
  const falhas: string[] = [];
  chaves.forEach((k, i) => {
    const r = resultados[i];
    if (r.status === "fulfilled") dado[k] = r.value;
    else falhas.push(`Não foi possível verificar ${FONTES[k].rotulo}.`);
  });

  const paginas = lista<Pagina>(dado.paginas?.paginas);
  const posts = lista<Post>(dado.posts?.posts);
  const autores = lista<Autor>(dado.autores?.autores);
  const categorias = lista<Categoria>(dado.categorias?.categorias);
  const redirects = lista<Redirect>(dado.redirects?.redirects);
  const robots = typeof dado.robots?.conteudo === "string" ? (dado.robots.conteudo as string) : "";

  const config = (dado.config?.config ?? null) as {
    dominioHost?: string;
    integracoesAtivas?: IntegracoesConfig;
    bingVerificacao?: string;
  } | null;

  const linksDisponiveis = dado.links?.disponivel === true;
  const grafo = linksDisponiveis ? (dado.links?.links as GrafoLinks) : null;
  const quebrados = linksDisponiveis ? (dado.links?.quebrados as Record<string, string[]> | undefined) : undefined;

  const indexaveis = gerarIndexaveis({
    posts,
    paginas,
    categorias,
    autores,
    dominio: config?.dominioHost ?? "",
    linksReais: grafo,
  });

  const paginasLidas = dado.paginas !== undefined && dado.paginas.origem !== "nenhuma";
  const problemas = auditarTecnica(indexaveis, redirects, robots, {
    linksReaisDisponiveis: grafo !== null,
    quebrados,
    // undefined = não deu para ler o site (regra de sitemap não roda)
    sitemapUrls: paginasLidas ? ((dado.paginas?.sitemapUrls as string[] | null | undefined) ?? null) : undefined,
    integracoes: config?.integracoesAtivas,
    bingVerificacao: config ? (config.bingVerificacao ?? "") : undefined,
    dominio: config?.dominioHost,
  });

  const rastreadores = new Set<string>();
  for (const p of paginas) for (const r of p.real?.rastreadores ?? []) rastreadores.add(r);

  return {
    problemas,
    falhas,
    origemRotulo:
      (typeof dado.paginas?.origemRotulo === "string" ? (dado.paginas.origemRotulo as string) : null) ??
      (typeof dado.links?.origemRotulo === "string" ? (dado.links.origemRotulo as string) : null),
    integracoes: config?.integracoesAtivas ?? null,
    rastreadoresNoHtml: [...rastreadores],
  };
}
