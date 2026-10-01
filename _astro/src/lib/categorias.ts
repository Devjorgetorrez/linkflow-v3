/**
 * Resolução da categoria de um post — ÚNICA regra, usada por todas as
 * páginas dos 3 temas (artigo, página de categoria, [slug].astro).
 *
 * O post referencia a categoria pelo SLUG em `categoria:` (nome do arquivo
 * em content/categorias/). Para não quebrar post antigo, também aceita o
 * NOME ("Prevenção") como reserva, igual a lib/autores.ts faz com autor.
 *
 * Este arquivo não chama getCollection — recebe a lista pronta, pelo mesmo
 * motivo de lib/autores.ts: não precisa saber se a coleção é `categorias`,
 * `categoriasT3` ou `categoriasT4`.
 */

export interface DadosCategoria {
  nome: string
  descricao?: string
  seoTitle?: string
  metaDescription?: string
  imagem?: string
  ordem?: number
}

export interface EntradaCategoria {
  id: string
  data: DadosCategoria
}

export interface CategoriaResolvida {
  slug?: string   // só quando existe na coleção (e então tem página)
  href?: string   // /<slug> — só para categoria da coleção
  nome: string
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Link da página de categoria — raiz, sem prefixo /categoria/. `prefixo`
 *  é o prefixo de rota do tema na demonstração ('/tema-03'); o
 *  promover_tema.py troca por '/' na promoção. */
export function hrefCategoria(slug: string, prefixo = ''): string {
  return `${prefixo.replace(/\/+$/, '')}/${slug}`
}

export function acharCategoria(valor: string | undefined, categorias: EntradaCategoria[]): EntradaCategoria | undefined {
  if (!valor) return undefined
  const alvo = normalizar(valor)
  return (
    categorias.find((c) => c.id === valor) ??
    categorias.find((c) => normalizar(c.id) === alvo) ??
    categorias.find((c) => normalizar(c.data.nome) === alvo)
  )
}

/** Resolve a categoria de um post: se existir na coleção, tem link; senão,
 *  mostra só o texto solto que o post traz em `categoria:` (sem link). */
export function resolverCategoria(
  categoriaDoPost: string | undefined,
  categorias: EntradaCategoria[],
  prefixo = '',
): CategoriaResolvida | null {
  const entrada = acharCategoria(categoriaDoPost, categorias)

  if (entrada) {
    return {
      slug: entrada.id,
      href: hrefCategoria(entrada.id, prefixo),
      nome: entrada.data.nome,
    }
  }

  if (!categoriaDoPost) return null

  // Categoria fora da coleção (post antigo): mostra o texto, sem link.
  return { nome: categoriaDoPost }
}

/** Nome para exibir em card/listagem/selo. */
export function nomeCategoria(categoriaDoPost: string | undefined, categorias: EntradaCategoria[]): string | undefined {
  return resolverCategoria(categoriaDoPost, categorias)?.nome
}

/**
 * Os 12 artigos mais recentes de uma categoria, para a página /<slug> dela
 * — sem paginação (decisão do Jorge).
 */
export function artigosDaCategoria<P extends { id: string; data: { categoria?: string; publicadoEm: string } }>(
  posts: P[],
  categoriaId: string,
  categorias: EntradaCategoria[],
): P[] {
  return posts
    .filter((p) => acharCategoria(p.data.categoria, categorias)?.id === categoriaId)
    .sort((a, b) => new Date(b.data.publicadoEm).getTime() - new Date(a.data.publicadoEm).getTime())
    .slice(0, 12)
}
