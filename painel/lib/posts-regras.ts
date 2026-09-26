/**
 * lib/posts-regras.ts — regras de post compartilhadas entre a API e as telas
 * (PURO: sem fs, sem React). Fonte única para título, slug e corpo.
 *
 * Limites vindos do schema `posts` do site (_astro/src/content.config.ts):
 * título 3–70, metaDescription até 165 (80–165 para o que vai ao ar).
 */

export const TITULO_PROVISORIO = "Novo post";
export const TITULO_MIN = 3;
export const TITULO_MAX = 70;
export const META_MIN = 80;
export const META_MAX = 165;

/** Slugs que não podem virar post: colidem com rotas da API (/api/posts/lixeira). */
export const SLUGS_RESERVADOS = ["lixeira", "novo"];

/** Status em que o site NÃO publica o post (mesma lista do schema do site). */
const FORA_DO_AR = ["rascunho", "revisao", "revisão", "agendado", "lixeira"];

export function statusVaiAoAr(status: unknown): boolean {
  return !FORA_DO_AR.includes(String(status ?? "").trim().toLowerCase());
}

/** Título → slug amigável: sem acento, minúsculo, hífens, até 80 caracteres. */
export function slugDoTitulo(titulo: string): string {
  let s = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > 80) s = s.slice(0, 80).replace(/-[^-]*$/, "") || s.slice(0, 80);
  return s.replace(/-+$/, "");
}

/** O slug ainda é o "automático" do título (com ou sem sufixo -2, -3…)? */
export function slugSegueTitulo(slug: string, titulo: string): boolean {
  if (!slug) return true;
  const base = slugDoTitulo(titulo || TITULO_PROVISORIO);
  const bases = [base, slugDoTitulo(TITULO_PROVISORIO)];
  return bases.some((b) => slug === b || new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d+$`).test(slug));
}

export function tituloValido(titulo: unknown): titulo is string {
  if (typeof titulo !== "string") return false;
  const n = titulo.trim().length;
  return n >= TITULO_MIN && n <= TITULO_MAX;
}

const TAG_BLOCO = /<(\/?)(p|h[1-6]|ul|ol|blockquote|pre|table|figure|hr|div|section|aside|details)\b[^>]*?(\/?)>/gi;
const TEM_BLOCO_HTML = /<(p|h[1-6]|ul|ol|blockquote|pre|table|figure|div)\b/i;
const P_VAZIO = /<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi;

/**
 * Corpo em HTML bem formado (A25): todo texto solto vira <p>, <div> vira <p>
 * e parágrafo vazio some. Só mexe em corpo que já é HTML de bloco (ou que o
 * editor do painel declarou como HTML); corpo em Markdown (escrito pelas
 * skills) passa intacto.
 */
export function normalizarCorpo(bruto: unknown, forcarHtml = false): string {
  let html = String(bruto ?? "").replace(/\r\n?/g, "\n");
  // Vindo do editor do painel (forcarHtml) o corpo é sempre HTML; sem isso, só o que já tem bloco HTML.
  if (!forcarHtml && !TEM_BLOCO_HTML.test(html)) return html.trim();

  html = html.replace(/<div\b[^>]*>/gi, "<p>").replace(/<\/div>/gi, "</p>");

  // Texto solto entre blocos de nível 0 vira parágrafo.
  const partes: string[] = [];
  let profundidade = 0;
  let ultimo = 0;
  const solto = (trecho: string) => {
    const t = trecho.trim();
    if (t) partes.push(`<p>${t}</p>`);
  };
  TAG_BLOCO.lastIndex = 0;
  let m: RegExpExecArray | null;
  let inicioBloco = 0;
  while ((m = TAG_BLOCO.exec(html)) !== null) {
    const fecha = m[1] === "/";
    const autoFecha = m[3] === "/" || m[2].toLowerCase() === "hr";
    if (profundidade === 0 && !fecha) {
      solto(html.slice(ultimo, m.index));
      inicioBloco = m.index;
    }
    if (autoFecha) {
      if (profundidade === 0) {
        partes.push(html.slice(inicioBloco, TAG_BLOCO.lastIndex));
        ultimo = TAG_BLOCO.lastIndex;
      }
      continue;
    }
    profundidade += fecha ? -1 : 1;
    if (profundidade < 0) profundidade = 0;
    if (profundidade === 0) {
      partes.push(html.slice(inicioBloco, TAG_BLOCO.lastIndex));
      ultimo = TAG_BLOCO.lastIndex;
    }
  }
  if (profundidade > 0) partes.push(html.slice(inicioBloco)); // bloco sem fechar: mantém
  else solto(html.slice(ultimo));

  let saida = partes.join("\n\n");
  let antes: string;
  do {
    antes = saida;
    saida = saida.replace(P_VAZIO, "");
  } while (saida !== antes);
  return saida.replace(/\n{3,}/g, "\n\n").trim();
}
