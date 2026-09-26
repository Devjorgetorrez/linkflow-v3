/**
 * lib/links-internos.ts — grafo REAL de links internos do site publicado,
 * lido do HTML gerado em _astro/dist/.
 *
 * Fonte única para tudo que precisa saber "quem linka para quem" (contagem
 * de links recebidos por página e regra de página órfã da auditoria de SEO).
 * O grafo planejado (pai/filho, categoria, autor) não serve para isso: menu,
 * rodapé, home e cards não existem nele, então toda página sem pai marcado
 * parecia órfã mesmo recebendo link de todas as outras.
 */

import fs from "fs";
import path from "path";
import { normalizarUrl } from "@/lib/urls-publicas";

/** origem (URL da página) → destino (URL da página) → nº de links */
export type GrafoLinks = Record<string, Record<string, number>>;

export interface LeituraLinks {
  /** URLs de todas as páginas encontradas no dist (ex: "/", "/servicos") */
  urls: string[];
  links: GrafoLinks;
}

function semWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * Resolve um href para a URL de uma página do site, ou null se não for um
 * link interno para página (âncora, mailto, tel, domínio externo, etc).
 * `hostsProprios` (sem www) permite reconhecer link absoluto para o próprio
 * domínio, que é interno de verdade.
 */
export function resolverHref(
  href: string,
  urlOrigem: string,
  hostsProprios: Set<string>,
): string | null {
  const h = href.trim();
  if (!h || h.startsWith("#")) return null;
  if (/^(mailto|tel|sms|javascript|data|whatsapp):/i.test(h)) return null;

  let u: URL;
  try {
    // A origem é servida como diretório (/servicos/index.html), então o
    // relativo resolve contra "/servicos/".
    const base = `http://interno.local${urlOrigem === "/" ? "/" : `${urlOrigem}/`}`;
    u = new URL(h, base);
  } catch {
    return null;
  }

  if (u.hostname !== "interno.local" && !hostsProprios.has(semWww(u.hostname))) {
    return null;
  }
  return normalizarUrl(u.pathname);
}

function listarPaginas(dir: string, base: string, saida: { url: string; arquivo: string }[]) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name === "midia") continue;
    if (entry.isDirectory()) {
      listarPaginas(path.join(dir, entry.name), `${base}/${entry.name}`, saida);
    } else if (entry.name === "index.html") {
      saida.push({ url: base || "/", arquivo: path.join(dir, entry.name) });
    }
  }
}

/** Hosts do próprio site, pela <link rel="canonical"> de cada página. */
function hostsDasCanonicals(htmls: string[]): Set<string> {
  const hosts = new Set<string>();
  for (const html of htmls) {
    const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
      ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    if (!m) continue;
    try {
      hosts.add(semWww(new URL(m[1]).hostname));
    } catch {
      /* canonical relativa: sem host a aprender */
    }
  }
  return hosts;
}

/**
 * Lê o dist e monta o grafo. Devolve null se o dist não existe ou não tem
 * nenhuma página (site ainda não buildado): nesse caso NÃO há dado real, e
 * quem chama não pode tratar "sem dados" como "sem links".
 * Auto-links (página linkando para si mesma) são ignorados.
 */
export function lerGrafoLinks(distDir: string): LeituraLinks | null {
  const paginas: { url: string; arquivo: string }[] = [];
  listarPaginas(distDir, "", paginas);
  if (paginas.length === 0) return null;

  const htmls = paginas.map((p) => fs.readFileSync(p.arquivo, "utf-8"));
  const hosts = hostsDasCanonicals(htmls);
  const conhecidas = new Set(paginas.map((p) => normalizarUrl(p.url)));

  const links: GrafoLinks = {};
  paginas.forEach((p, i) => {
    const origem = normalizarUrl(p.url);
    for (const m of htmls[i].matchAll(/<a\s[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const destino = resolverHref(m[1] ?? m[2] ?? "", origem, hosts);
      if (!destino || destino === origem || !conhecidas.has(destino)) continue;
      links[origem] ??= {};
      links[origem][destino] = (links[origem][destino] ?? 0) + 1;
    }
  });

  return { urls: [...conhecidas], links };
}

/** Quantos links cada página recebe das OUTRAS páginas. */
export function contarRecebidos(links: GrafoLinks): Map<string, number> {
  const recebidos = new Map<string, number>();
  for (const destinos of Object.values(links)) {
    for (const [destino, n] of Object.entries(destinos)) {
      recebidos.set(destino, (recebidos.get(destino) ?? 0) + n);
    }
  }
  return recebidos;
}

/**
 * Profundidade real: menor número de cliques a partir da home ("/" = 0).
 * Página que nenhum caminho de links alcança não aparece no mapa.
 */
export function profundidadeDeCliques(links: GrafoLinks, origem = "/"): Map<string, number> {
  const prof = new Map<string, number>([[origem, 0]]);
  const fila = [origem];
  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i];
    for (const destino of Object.keys(links[atual] ?? {})) {
      if (prof.has(destino)) continue;
      prof.set(destino, (prof.get(atual) ?? 0) + 1);
      fila.push(destino);
    }
  }
  return prof;
}
