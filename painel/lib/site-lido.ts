/**
 * lib/site-lido.ts — de ONDE o painel lê o HTML do site, e a leitura em si.
 *
 * Fonte de verdade = o SITE PUBLICADO: a pasta que o build copia
 * (LINKFLOW_SITE_DIR || /var/www/<slug>, ver getSiteDir em lib/build-estado.ts).
 * Só se ela não existir (ou não tiver página) o painel cai na última prévia
 * local (`_astro/dist`), e as telas dizem de qual origem veio:
 *   "site publicado"  |  "última prévia local (dist)"  |  nenhuma.
 * Assim o número que o painel mostra (ex: caracteres da meta description) é o
 * do HTML que o Google vê, não o de uma prévia antiga.
 *
 * Cache por arquivo, chave = caminho + mtime + tamanho: só reparseia o que
 * mudou. Arquivo maior que LIMITE_BYTES é lido só até o limite (marcado
 * `parcial`); arquivo ilegível vira `erro`, sem derrubar as demais páginas.
 */

import fs from "fs";
import path from "path";
import { getLinkflowDir, getSiteSlug } from "@/lib/fs";
import { getSiteDir } from "@/lib/build-estado";
import { analisarHtml, type DadosHtml } from "@/lib/html-pagina";
import { normalizarUrl } from "@/lib/urls-publicas";

export type OrigemSite = "publicado" | "previa" | "nenhuma";

export interface OrigemResolvida {
  dir: string | null;
  origem: OrigemSite;
  rotulo: string;
}

const ROTULO: Record<OrigemSite, string> = {
  publicado: "site publicado",
  previa: "última prévia local (dist)",
  nenhuma: "nenhum site gerado ainda",
};

const LIMITE_BYTES = 4 * 1024 * 1024;

function temPagina(dir: string): boolean {
  try {
    return fs.statSync(path.join(dir, "index.html")).isFile();
  } catch {
    return false;
  }
}

export function resolverOrigemSite(): OrigemResolvida {
  let publicado: string | null = null;
  try {
    publicado = getSiteDir(getSiteSlug());
  } catch {
    publicado = null;
  }
  if (publicado && temPagina(publicado)) {
    return { dir: publicado, origem: "publicado", rotulo: ROTULO.publicado };
  }
  const dist = path.join(getLinkflowDir(), "_astro/dist");
  if (temPagina(dist)) return { dir: dist, origem: "previa", rotulo: ROTULO.previa };
  return { dir: null, origem: "nenhuma", rotulo: ROTULO.nenhuma };
}

export interface PaginaArquivo {
  url: string;
  arquivo: string;
}

/** Todas as páginas (index.html) do site; ignora `_astro/`, `_*` e `midia/`. */
export function listarPaginas(dir: string, base = "", saida: PaginaArquivo[] = []): PaginaArquivo[] {
  let entradas: fs.Dirent[];
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return saida;
  }
  for (const entry of entradas) {
    if (entry.name.startsWith("_") || entry.name === "midia") continue;
    if (entry.isDirectory()) {
      listarPaginas(path.join(dir, entry.name), `${base}/${entry.name}`, saida);
    } else if (entry.name === "index.html") {
      saida.push({ url: base || "/", arquivo: path.join(dir, entry.name) });
    }
  }
  return saida;
}

export interface PaginaLida {
  dados: DadosHtml | null;
  /** hrefs crus de todos os <a> da página */
  hrefs: string[];
  mtime: string; // ISO
  parcial: boolean;
  erro?: string;
}

interface Entrada {
  mtimeMs: number;
  size: number;
  lida: PaginaLida;
}

const g = globalThis as unknown as { __lfHtmlCache?: Map<string, Entrada> };
const cache = (g.__lfHtmlCache ??= new Map<string, Entrada>());
const CACHE_MAX = 3000;

export function lerPaginaCache(arquivo: string): PaginaLida {
  let st: fs.Stats;
  try {
    st = fs.statSync(arquivo);
  } catch (e) {
    return { dados: null, hrefs: [], mtime: "", parcial: false, erro: `arquivo ilegível (${(e as Error).message})` };
  }
  const hit = cache.get(arquivo);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.lida;

  let lida: PaginaLida;
  try {
    const parcial = st.size > LIMITE_BYTES;
    let html: string;
    if (parcial) {
      const fd = fs.openSync(arquivo, "r");
      try {
        const buf = Buffer.alloc(LIMITE_BYTES);
        const n = fs.readSync(fd, buf, 0, LIMITE_BYTES, 0);
        html = buf.subarray(0, n).toString("utf-8");
      } finally {
        fs.closeSync(fd);
      }
    } else {
      html = fs.readFileSync(arquivo, "utf-8");
    }
    const hrefs: string[] = [];
    for (const m of html.matchAll(/<a\s[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) hrefs.push(m[1] ?? m[2] ?? "");
    lida = { dados: analisarHtml(html), hrefs, mtime: st.mtime.toISOString(), parcial };
  } catch (e) {
    lida = { dados: null, hrefs: [], mtime: st.mtime.toISOString(), parcial: false, erro: `não foi possível ler o HTML (${(e as Error).message})` };
  }
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(arquivo, { mtimeMs: st.mtimeMs, size: st.size, lida });
  return lida;
}

/**
 * URLs (caminhos normalizados) listadas no sitemap do site lido. null = o site
 * não tem sitemap. Segue sitemap-index.xml para os sitemap-*.xml da mesma pasta.
 */
export function lerSitemap(dir: string): string[] | null {
  const ler = (nome: string): string | null => {
    try {
      const p = path.join(dir, nome);
      const st = fs.statSync(p);
      if (!st.isFile() || st.size > LIMITE_BYTES) return null;
      return fs.readFileSync(p, "utf-8");
    } catch {
      return null;
    }
  };
  const locs = (xml: string) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);
  const caminho = (u: string): string => {
    try {
      return normalizarUrl(new URL(u).pathname);
    } catch {
      return normalizarUrl(u);
    }
  };

  const indice = ler("sitemap-index.xml");
  const principal = ler("sitemap.xml");
  const fontes: string[] = [];
  const raiz = indice ?? principal;
  if (raiz === null) return null;
  if (/<sitemapindex/i.test(raiz)) {
    for (const u of locs(raiz)) {
      const nome = path.posix.basename(u.split("?")[0]);
      if (/^[\w.-]+\.xml$/.test(nome)) {
        const x = ler(nome);
        if (x) fontes.push(x);
      }
    }
  } else {
    fontes.push(raiz);
  }
  const urls = new Set<string>();
  for (const x of fontes) for (const u of locs(x)) urls.add(caminho(u));
  return [...urls];
}
