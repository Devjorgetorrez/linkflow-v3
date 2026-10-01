/**
 * lib/links-slug.ts — integridade dos links internos quando um post muda de endereço ou vai para a lixeira
 * (SÓ servidor).
 *
 * Renomear slug: além do 301 (lib/redirects.ts), os OUTROS conteúdos do cliente passam a apontar direto
 * para o endereço novo (sem cadeia de redirect, sem gastar rastreio nem diluir autoridade):
 *   - `relacionados:` de outros posts;
 *   - links no corpo/frontmatter em Markdown `](/antigo)` e HTML `href="/antigo"` (com ou sem o domínio
 *     do site; âncora e query preservadas; `/antigo-2` e `/antigo/x` nunca casam);
 *   - `nav` e `navFooterColunas` do config/site.ts (pelas funções seguras de lib/site-config.ts).
 * Lixeira: só AVISA quem linka (referenciasDoPost) e tira o slug de `relacionados` dos outros posts;
 * links no corpo nunca são reescritos.
 * Toda gravação é atômica e só arquivos que realmente mudam são gravados.
 */
import fs from "fs";
import path from "path";
import { atualizarFrontmatter, getConfigPath, getContentDir, lerArquivo, parseMd, removerChavesFrontmatter } from "@/lib/fs";
import { gravarAtomico } from "@/lib/posts-fs";
import { lerSite, percorrerHrefsDoMenu } from "@/lib/site-config";

/** Coleções com corpo .md que podem linkar para um post. */
const COLECOES = ["posts", "servicos", "equipe", "depoimentos", "autores"] as const;

export interface LinksAtualizados { arquivo: string; quantidade: number }
export interface LinkNaoAtualizado { arquivo: string; motivo: string }
export interface ResultadoLinks {
  linksAtualizados: LinksAtualizados[];
  linksNaoAtualizados: LinkNaoAtualizado[];
}
export interface Referencia {
  tipo: "post" | "servico" | "equipe" | "depoimento" | "autor" | "menu";
  /** slug do conteúdo (ou rótulo do item de menu) */
  slug: string;
  titulo: string;
  /** o que aponta: campo "relacionados", link no corpo, item do menu */
  como: ("relacionados" | "link" | "menu")[];
  quantidade: number;
}

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Domínios do site (sem protocolo nem www), para reconhecer links absolutos para o próprio site. */
export function dominiosDoSite(): string[] {
  try {
    const dom = lerSite(fs.readFileSync(getConfigPath(), "utf-8")).dominio ?? "";
    const limpo = dom.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "");
    return limpo ? [limpo] : [];
  } catch {
    return [];
  }
}

function padrao(slug: string, dominios: string[]): RegExp {
  const origem = dominios.length ? `(?:https?:\\/\\/(?:www\\.)?(?:${dominios.map(esc).join("|")}))?` : "";
  return new RegExp(
    // 1: abertura do link (Markdown, HTML ou definição de referência) · 2: domínio · 3: barra final
    `(\\]\\(\\s*<?|\\bhref\\s*=\\s*["']|^[ \\t]{0,3}\\[[^\\]\\n]+\\]:\\s*<?)(${origem})\\/${esc(slug)}(\\/?)(?=[?#)\\s"'>]|$)`,
    "gm",
  );
}

/** Aplica `fn` só fora dos blocos de código cercado (```). */
function foraDeCodigo(texto: string, fn: (t: string) => string): string {
  return texto.split(/(```[\s\S]*?```)/).map((p, i) => (i % 2 === 1 ? p : fn(p))).join("");
}

/** Quantos links para /slug existem no texto (Markdown/HTML), fora de blocos de código. */
export function contarLinksNoTexto(texto: string, slug: string, dominios: string[]): number {
  let n = 0;
  foraDeCodigo(texto, (t) => {
    n += (t.match(padrao(slug, dominios)) ?? []).length;
    return t;
  });
  return n;
}

/** Troca os links de /antigo para /novo no texto. Devolve o texto e quantos foram trocados. */
export function reescreverLinksNoTexto(texto: string, antigo: string, novo: string, dominios: string[]): { texto: string; n: number } {
  let n = 0;
  const r = foraDeCodigo(texto, (t) =>
    t.replace(padrao(antigo, dominios), (_m, ab: string, dom: string, barra: string) => {
      n++;
      return `${ab}${dom ?? ""}/${novo}${barra}`;
    }),
  );
  return { texto: r, n };
}

function arquivosMd(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...arquivosMd(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out.sort();
}

interface Conteudo { colecao: (typeof COLECOES)[number]; slug: string; caminho: string; rotulo: string }

function conteudosDoCliente(): Conteudo[] {
  const base = getContentDir();
  const r: Conteudo[] = [];
  for (const colecao of COLECOES) {
    const dir = path.join(base, colecao);
    for (const caminho of arquivosMd(dir)) {
      const rel = path.relative(dir, caminho).replace(/\\/g, "/");
      r.push({ colecao, slug: rel.replace(/\.md$/, ""), caminho, rotulo: `${colecao}/${rel}` });
    }
  }
  return r;
}

function listaRelacionados(raw: string): string[] {
  const v = parseMd(raw).frontmatter.relacionados;
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}

/** Grava a lista `relacionados` (vazia remove a chave). */
function comRelacionados(raw: string, lista: string[]): string {
  if (lista.length === 0) return removerChavesFrontmatter(raw, ["relacionados"]);
  return atualizarFrontmatter(raw, { relacionados: lista });
}

const TITULOS: Record<Conteudo["colecao"], string> = { posts: "titulo", servicos: "titulo", equipe: "nome", depoimentos: "nome", autores: "nome" };
const TIPOS = { posts: "post", servicos: "servico", equipe: "equipe", depoimentos: "depoimento", autores: "autor" } as const;

/** O post mudou de endereço: reescreve, nos outros conteúdos e no menu, as referências ao endereço antigo. */
export function reescreverLinksDoSlug(antigo: string, novo: string): ResultadoLinks {
  const dominios = dominiosDoSite();
  const linksAtualizados: LinksAtualizados[] = [];
  const linksNaoAtualizados: LinkNaoAtualizado[] = [];

  for (const c of conteudosDoCliente()) {
    // (o post renomeado já está no endereço novo; se ele linka para si mesmo, também é atualizado)
    try {
      const raw = fs.readFileSync(c.caminho, "utf-8");
      let atual = raw;
      let quantidade = 0;
      if (c.colecao === "posts") {
        const rel = listaRelacionados(atual);
        if (rel.includes(antigo)) {
          const nova = [...new Set(rel.map((s) => (s === antigo ? novo : s)))].filter((s) => s !== c.slug);
          atual = comRelacionados(atual, nova);
          quantidade += 1;
        }
      }
      const r = reescreverLinksNoTexto(atual, antigo, novo, dominios);
      atual = r.texto;
      quantidade += r.n;
      if (atual !== raw) {
        gravarAtomico(c.caminho, atual);
        linksAtualizados.push({ arquivo: c.rotulo, quantidade: Math.max(quantidade, 1) });
      }
    } catch (err) {
      linksNaoAtualizados.push({ arquivo: c.rotulo, motivo: `não consegui reescrever: ${(err as Error).message}` });
    }
  }

  // nav / navFooterColunas do config/site.ts
  const cfg = getConfigPath();
  try {
    if (fs.existsSync(cfg)) {
      const src = fs.readFileSync(cfg, "utf-8");
      const r = percorrerHrefsDoMenu(src, ["nav", "navFooterColunas"], (href) => {
        const m = comoCaminho(href, dominios);
        return m && m.caminho === `/${antigo}` ? `${m.origem}/${novo}${m.resto}` : null;
      });
      if (r.alterados > 0) {
        gravarAtomico(cfg, r.s);
        linksAtualizados.push({ arquivo: "config/site.ts (menu)", quantidade: r.alterados });
      }
    }
  } catch (err) {
    linksNaoAtualizados.push({ arquivo: "config/site.ts (menu)", motivo: `não consegui reescrever: ${(err as Error).message}` });
  }
  return { linksAtualizados, linksNaoAtualizados };
}

/** Separa um href em origem (domínio do site, se houver), caminho sem barra final e resto (?query/#âncora/barra). */
function comoCaminho(href: string, dominios: string[]): { origem: string; caminho: string; resto: string } | null {
  let origem = "";
  let r = href.trim();
  const m = /^(https?:\/\/(?:www\.)?([^/?#]+))(.*)$/i.exec(r);
  if (m) {
    if (!dominios.some((d) => d.toLowerCase() === m[2].toLowerCase())) return null;
    origem = m[1];
    r = m[3] || "/";
  }
  if (!r.startsWith("/")) return null;
  const mm = /^(\/[^?#]*?)(\/?)([?#].*)?$/.exec(r);
  if (!mm) return null;
  return { origem, caminho: mm[1], resto: `${mm[2]}${mm[3] ?? ""}` };
}

/** Quem aponta para o post `slug` (relacionados de outros posts, links no corpo, menu do site). */
export function referenciasDoPost(slug: string): Referencia[] {
  const dominios = dominiosDoSite();
  const refs: Referencia[] = [];
  for (const c of conteudosDoCliente()) {
    if (c.colecao === "posts" && c.slug === slug) continue;
    const raw = lerArquivo(c.caminho);
    if (!raw) continue;
    const como: Referencia["como"] = [];
    let quantidade = 0;
    if (c.colecao === "posts" && listaRelacionados(raw).includes(slug)) {
      como.push("relacionados");
      quantidade++;
    }
    const n = contarLinksNoTexto(raw, slug, dominios);
    if (n > 0) {
      como.push("link");
      quantidade += n;
    }
    if (!como.length) continue;
    const fm = parseMd(raw).frontmatter;
    refs.push({ tipo: TIPOS[c.colecao], slug: c.slug, titulo: String(fm[TITULOS[c.colecao]] ?? "").trim() || c.slug, como, quantidade });
  }
  try {
    const cfg = getConfigPath();
    if (fs.existsSync(cfg)) {
      const r = percorrerHrefsDoMenu(fs.readFileSync(cfg, "utf-8"), ["nav", "navFooterColunas"]);
      for (const h of r.hrefs) {
        const m = comoCaminho(h.href, dominios);
        if (m && m.caminho === `/${slug}`) refs.push({ tipo: "menu", slug: h.label || h.href, titulo: `Menu (${h.lista === "nav" ? "topo" : "rodapé"}): ${h.label || h.href}`, como: ["menu"], quantidade: 1 });
      }
    }
  } catch { /* config ilegível: só não lista o menu */ }
  return refs;
}

/** O post foi para a lixeira: tira o slug de `relacionados` dos outros posts. Devolve quem mudou. */
export function removerDeRelacionados(slug: string): LinksAtualizados[] {
  const mudou: LinksAtualizados[] = [];
  for (const c of conteudosDoCliente()) {
    if (c.colecao !== "posts" || c.slug === slug) continue;
    try {
      const raw = fs.readFileSync(c.caminho, "utf-8");
      const rel = listaRelacionados(raw);
      if (!rel.includes(slug)) continue;
      gravarAtomico(c.caminho, comRelacionados(raw, rel.filter((s) => s !== slug)));
      mudou.push({ arquivo: c.rotulo, quantidade: 1 });
    } catch (err) {
      console.error("[links-slug] relacionados:", c.rotulo, err);
    }
  }
  return mudou;
}
