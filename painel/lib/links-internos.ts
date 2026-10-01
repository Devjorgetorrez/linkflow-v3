/**
 * lib/links-internos.ts — grafo REAL de links internos do site publicado,
 * lido do HTML do site publicado (fallback: _astro/dist — lib/site-lido.ts).
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
import { lerPaginaCache, listarPaginas } from "@/lib/site-lido";

/** origem (URL da página) → destino (URL da página) → nº de links */
export type GrafoLinks = Record<string, Record<string, number>>;

export interface LeituraLinks {
  /** URLs de todas as páginas encontradas no dist (ex: "/", "/servicos") */
  urls: string[];
  links: GrafoLinks;
  /** origem → destinos internos que não existem no site */
  quebrados: Record<string, string[]>;
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

/** Existe no site lido um arquivo/página para este caminho? (asset, página ou .html) */
function caminhoExiste(dir: string, caminho: string): boolean {
  const raiz = path.resolve(dir);
  const rel = caminho.replace(/^\/+/, "");
  const candidatos = [rel, path.join(rel, "index.html"), `${rel}.html`];
  for (const c of candidatos) {
    const abs = path.resolve(raiz, c);
    if (abs !== raiz && !abs.startsWith(raiz + path.sep)) continue;
    try {
      if (fs.statSync(abs).isFile()) return true;
    } catch {
      /* não existe */
    }
  }
  return false;
}

/**
 * Lê o site (publicado ou prévia — ver lib/site-lido.ts) e monta o grafo.
 * Devolve null se a pasta não existe ou não tem nenhuma página (site ainda
 * não gerado): nesse caso NÃO há dado real, e quem chama não pode tratar
 * "sem dados" como "sem links".
 * Auto-links (página linkando para si mesma) são ignorados.
 * `quebrados`: links internos cujo destino não existe no site (nem página,
 * nem arquivo como imagem/PDF/sitemap).
 */
export function lerGrafoLinks(distDir: string): LeituraLinks | null {
  const paginas = listarPaginas(distDir);
  if (paginas.length === 0) return null;

  const lidas = paginas.map((p) => lerPaginaCache(p.arquivo));
  const hosts = new Set<string>();
  for (const l of lidas) {
    const c = l.dados?.canonical;
    if (!c) continue;
    try {
      hosts.add(semWww(new URL(c).hostname));
    } catch {
      /* canonical relativa: sem host a aprender */
    }
  }
  const conhecidas = new Set(paginas.map((p) => normalizarUrl(p.url)));

  const links: GrafoLinks = {};
  const quebrados: Record<string, string[]> = {};
  paginas.forEach((p, i) => {
    const origem = normalizarUrl(p.url);
    for (const href of lidas[i].hrefs) {
      const destino = resolverHref(href, origem, hosts);
      if (!destino || destino === origem) continue;
      if (conhecidas.has(destino)) {
        links[origem] ??= {};
        links[origem][destino] = (links[origem][destino] ?? 0) + 1;
      } else if (!caminhoExiste(distDir, destino)) {
        const lista = (quebrados[origem] ??= []);
        if (!lista.includes(destino)) lista.push(destino);
      }
    }
  });

  return { urls: [...conhecidas], links, quebrados };
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
