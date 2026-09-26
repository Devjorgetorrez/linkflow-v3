/**
 * lib/urls-publicas.ts — ÚNICA fonte de URL pública no painel.
 *
 * Espelha exatamente as rotas que o site Astro publica (regra do Jorge,
 * tipo permalink do WordPress — nenhuma categoria no caminho):
 *
 *   Home ............ /
 *   Blog (índice) ... /blog
 *   Artigo .......... /<slug>          nunca /blog/<slug>
 *   Serviços (pilar)  /servicos
 *   Serviço interno . /<slug>          nunca /servicos/<slug>
 *   Autor ........... /autor/<slug>    (pages/autor/[slug].astro)
 *   Categoria ....... /<slug>          (pages/[slug].astro, mesma raiz de
 *                                       serviço e artigo — nunca /categoria/<slug>)
 */

/** "/servicos/" → "/servicos"; "/" continua "/". Compara URLs sem depender de barra final. */
export function normalizarUrl(u: string): string {
  let s = u;
  try {
    s = decodeURI(u);
  } catch {
    /* mantém como veio */
  }
  return s.length > 1 ? s.replace(/\/+$/, "") : s;
}

export const URL_HOME = "/";
export const URL_BLOG = "/blog";
export const URL_SERVICOS = "/servicos";

/** Artigo do blog — direto na raiz. */
export function urlPost(slug: string): string {
  return `/${slug}`;
}

/** Serviço interno — direto na raiz. */
export function urlServico(slug: string): string {
  return `/${slug}`;
}

/** Categoria do blog — direto na raiz, igual serviço e artigo. */
export function urlCategoria(slug: string): string {
  return `/${slug}`;
}

/** URL absoluta a partir do domínio sem protocolo (ex: "cliente.com.br"). */
export function urlAbsoluta(dominio: string, caminho: string): string {
  const base = dominio ? `https://${dominio.replace(/^https?:\/\//, "").replace(/\/+$/, "")}` : "";
  return `${base}${caminho}`;
}

/** Página do autor. */
export function urlAutor(slug: string): string {
  return `/autor/${slug}`;
}

/**
 * @id do autor no JSON-LD — o MESMO que a página /autor/<slug> do site
 * declara para o Person dela, para artigos e perfil apontarem para um nó só.
 */
export function idAutorSchema(dominioBase: string, slugAutor: string): string {
  return `${dominioBase}${urlAutor(slugAutor)}#person`;
}
