/**
 * lib/posts-corpo.ts — o corpo do post como o EDITOR precisa dele (PURO).
 *
 * As skills escrevem Markdown; o editor do painel trabalha em HTML. Sem
 * `corpoFormato: html` no frontmatter, o corpo é detectado: HTML de bloco
 * (o que o editor gravava antes de a marca existir) ou Markdown. Markdown é
 * convertido ao abrir; ao salvar o painel grava HTML + corpoFormato: html.
 * O título nunca fica no corpo: um H1 igual ao título, na primeira linha, sai.
 */
import { markdownParaHtml } from "./markdown-html";

export type FormatoCorpo = "html" | "markdown";

const TEM_BLOCO_HTML = /<(p|h[1-6]|ul|ol|blockquote|pre|table|figure|div)\b/i;
const LINHA_MARKDOWN = /^ {0,3}(#{1,6}\s+\S|[-*+]\s+\S|\d{1,9}[.)]\s+\S|>\s?\S|```|~~~|\|.+\|\s*$|(?:[-*_]\s*){3,}$)/m;

export function detectarFormato(corpo: string, fm: Record<string, unknown>): FormatoCorpo {
  const marca = String(fm.corpoFormato ?? "").trim().toLowerCase();
  if (marca === "html") return "html";
  if (marca === "markdown" || marca === "md") return "markdown";
  const t = corpo.trim();
  if (!t) return "html";
  if (TEM_BLOCO_HTML.test(t) && !LINHA_MARKDOWN.test(t.replace(/<[^>]*>/g, ""))) return "html";
  if (/^\s*<(p|h[1-6]|ul|ol|blockquote|table|figure|div)\b/i.test(t) && !/^#{1,6}\s/m.test(t)) return "html";
  return "markdown";
}

const semMarcas = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Tira o H1 do começo quando ele só repete o título (o título é campo próprio). */
export function removerH1DoTitulo(html: string, titulo: string): string {
  const m = html.match(/^\s*<h1\b[^>]*>([\s\S]*?)<\/h1>\s*/i);
  if (!m) return html;
  return semMarcas(m[1]) === semMarcas(titulo) ? html.slice(m[0].length) : html;
}

export function corpoParaEditor(
  corpo: string,
  fm: Record<string, unknown>,
  titulo: string,
): { html: string; formato: FormatoCorpo } {
  const formato = detectarFormato(corpo, fm);
  const html = formato === "markdown" ? markdownParaHtml(corpo) : corpo;
  return { html: removerH1DoTitulo(html, titulo), formato };
}
