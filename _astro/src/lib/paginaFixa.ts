/**
 * paginaFixa.ts — título e meta description das páginas fixas (home, sobre,
 * contato), lidos do bloco OPCIONAL `site.paginas.<pagina>.{titulo,
 * metaDescription}` que o painel grava em config/site.ts (ver
 * painel/app/api/config/paginas/route.ts). O bloco pode não existir, e cada
 * sub-campo pode estar vazio — nesses casos cai no `padrao` que cada página
 * já calculava antes desta mudança (texto fixo, ou concatenado com
 * site.nome/site.nomeLongo/site.nap.cidade etc.), que segue valendo como piso.
 *
 * Tipado à parte de qualquer interface de `site`: como `paginas` é opcional,
 * qualquer config/site.ts (com ou sem o bloco) é aceito aqui sem erro de tipo.
 */

export type PaginaFixaChave = 'home' | 'sobre' | 'contato'

export interface SiteComPaginas {
  paginas?: Partial<Record<PaginaFixaChave, { titulo?: string; metaDescription?: string }>>
}

export function tituloOuPadrao(site: SiteComPaginas, pagina: PaginaFixaChave, padrao: string): string {
  const v = site.paginas?.[pagina]?.titulo?.trim()
  return v ? v : padrao
}

export function metaOuPadrao(site: SiteComPaginas, pagina: PaginaFixaChave, padrao: string): string {
  const v = site.paginas?.[pagina]?.metaDescription?.trim()
  return v ? v : padrao
}
