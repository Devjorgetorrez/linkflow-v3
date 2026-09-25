/**
 * lib/sync-categorias.ts — espelha as categorias do painel no site.
 *
 * No painel, categoria vem de categorias.json (lib/dados.ts). O site
 * (Astro) não enxerga esse arquivo: ele lê content/categorias/<slug>.md
 * para montar /<slug> (raiz) e o selo de categoria no artigo. Esta função
 * grava um arquivo por categoria e é chamada a cada salvamento
 * (POST/PATCH/DELETE de /api/categorias), igual a sync-autores.ts faz
 * para usuarios.json.
 *
 * Arquivos marcados `gerenciadoPor: painel` são do painel: se a categoria
 * deixa de existir, o arquivo sai. Arquivo sem essa marca (escrito pelo
 * agente) nunca é apagado por aqui — só é sobrescrito se o painel tiver
 * uma categoria com o MESMO slug (o cadastro do painel prevalece).
 *
 * Identificação: o painel usa o id da categoria (`cat-...`); o site usa o
 * slug. slugDoCategoria e idDoCategoria fazem a conversão nas rotas de posts.
 */
import fs from "fs";
import path from "path";
import { getContentDir, linhaYaml } from "./fs";
import type { Categoria } from "@/mock/types";

const MARCA = "painel";
const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function dirCategorias(): string {
  return path.join(getContentDir(), "categorias");
}

function montarArquivo(c: Categoria): { slug: string; conteudo: string } | null {
  const slug = (c.slug ?? "").trim();
  const nome = (c.nome ?? "").trim();
  if (!SLUG_VALIDO.test(slug) || nome.length < 2) return null;

  const escalares: [string, unknown][] = [
    ["nome", nome],
    ["descricao", c.descricao ?? ""],
    ["seoTitle", c.seoTitle || undefined],
    ["metaDescription", c.metaDescription ?? ""],
    ["imagem", c.imagem || undefined],
    ["ordem", c.ordem ?? 99],
    ["gerenciadoPor", MARCA],
  ];
  const linhas = ["---"];
  for (const [k, v] of escalares) {
    if (v === undefined) continue;
    const l = linhaYaml(k, v);
    if (l) linhas.push(l);
  }
  linhas.push("---", "");
  return { slug, conteudo: linhas.join("\n") };
}

export function sincronizarCategorias(categorias: Categoria[]): { gravados: string[]; removidos: string[] } {
  const dir = dirCategorias();
  fs.mkdirSync(dir, { recursive: true });

  const gravados: string[] = [];
  const slugsDoPainel = new Set<string>();

  for (const c of categorias) {
    const arq = montarArquivo(c);
    if (!arq || slugsDoPainel.has(arq.slug)) continue; // slug repetido: vale o primeiro
    slugsDoPainel.add(arq.slug);
    const destino = path.join(dir, `${arq.slug}.md`);
    const atual = fs.existsSync(destino) ? fs.readFileSync(destino, "utf-8") : null;
    if (atual !== arq.conteudo) {
      fs.writeFileSync(destino, arq.conteudo, "utf-8");
      gravados.push(arq.slug);
    }
  }

  const removidos: string[] = [];
  for (const nome of fs.readdirSync(dir)) {
    if (!nome.endsWith(".md")) continue;
    const slug = nome.replace(/\.md$/, "");
    if (slugsDoPainel.has(slug)) continue;
    const texto = fs.readFileSync(path.join(dir, nome), "utf-8");
    if (/^gerenciadoPor:\s*"?painel"?\s*$/m.test(texto)) {
      fs.unlinkSync(path.join(dir, nome));
      removidos.push(slug);
    }
  }
  return { gravados, removidos };
}

/**
 * Slugs já usados por serviços e artigos no site (fora de categorias) —
 * pra avisar na hora de salvar uma categoria, sem esperar o build/guardião
 * acusar depois. Página fixa nem passa por content/, então não entra aqui
 * (checada à parte, ver PAGINAS_FIXAS em avisoColisaoSlug).
 */
function slugsExistentes(subpasta: string): Set<string> {
  const dir = path.join(getContentDir(), subpasta);
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs.readdirSync(dir)
      .filter((n) => n.endsWith(".md"))
      .map((n) => n.replace(/\.md$/, "")),
  );
}

const PAGINAS_FIXAS = new Set([
  "sobre", "contato", "servicos", "blog", "autor",
  "politica-de-privacidade", "termos-de-uso",
]);

/** Aviso (não bloqueia o salvamento) se o slug da categoria colide com
 *  página fixa, serviço ou artigo — mesma regra do guardiao_construtor.py. */
export function avisoColisaoSlug(slug: string): string | null {
  const s = slug.trim();
  if (!s) return null;
  if (PAGINAS_FIXAS.has(s)) {
    return `Slug "${s}" colide com uma página fixa do site (${s}) — a categoria não vai ter página própria.`;
  }
  if (slugsExistentes("servicos").has(s)) {
    return `Slug "${s}" colide com um serviço já existente — a categoria não vai ter página própria (serviço tem prioridade).`;
  }
  if (slugsExistentes("posts").has(s)) {
    return `Slug "${s}" colide com um artigo já existente — quando a categoria for publicada, o artigo vai parar de ter página própria.`;
  }
  return null;
}

/** id da categoria (ou o próprio slug) → slug do site, para gravar no post. */
export function slugDoCategoria(valor: string, categorias: Categoria[]): string {
  const v = valor.trim();
  const c = categorias.find((x) => x.id === v) ?? categorias.find((x) => x.slug === v);
  return c?.slug || v;
}

/** slug gravado no post → id da categoria, para o painel selecionar a categoria. */
export function idDoCategoria(valor: string, categorias: Categoria[]): string {
  const v = valor.trim();
  const c = categorias.find((x) => x.slug === v) ?? categorias.find((x) => x.id === v);
  return c?.id ?? v;
}
