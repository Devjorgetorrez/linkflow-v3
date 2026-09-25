/**
 * Resolução do autor de um post — ÚNICA regra, usada por todas as páginas
 * dos 3 temas (artigo, listagens, página de autor).
 *
 * O post referencia o autor pelo SLUG em `autor:` (nome do arquivo em
 * content/autores/). Para não quebrar post antigo, também aceita o NOME
 * ("Dra. Camila Fontes") e usa os campos soltos do próprio post
 * (autorFoto, autorCargo, autorBio...) quando o autor não existe na coleção.
 *
 * Este arquivo não chama getCollection — recebe a lista pronta. Assim ele
 * não precisa saber se a coleção é `autores`, `autoresT3` ou `autoresT4`
 * (o promover_tema.py só renomeia coleção dentro de pages/ e
 * components/paginas/, nunca aqui).
 */

export interface DadosAutor {
  nome: string
  cargo?: string
  foto?: string
  fotoAlt?: string
  bioCurta?: string
  bioLonga?: string
  conselho?: string
  registro?: string
  especialidades?: string[]
  formacao?: string[]
  naMidia?: string[]
  email?: string
  redes?: Record<string, string | undefined>
  ativo?: boolean
}

export interface EntradaAutor {
  id: string
  data: DadosAutor
}

/** Campos de autor que um post pode trazer soltos (modelo antigo). */
export interface CamposAutorNoPost {
  autor?: string
  autorFoto?: string
  autorCargo?: string
  autorBio?: string
  autorLinkedin?: string
  autorInstagram?: string
  autorEmail?: string
}

export interface AutorResolvido {
  slug?: string          // só quando existe na coleção (e então tem página)
  href?: string          // /autor/<slug> — só para autor ativo da coleção
  nome: string
  foto?: string
  fotoAlt?: string
  cargo?: string
  bio?: string
  credencial?: string    // "CRM-SP 154.320"
  linkedin?: string
  instagram?: string
  email?: string
  sameAs: string[]       // redes, para o JSON-LD
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Link da página de autor. `prefixo` é o prefixo de rota do tema na
 *  demonstração ('/tema-03'); o promover_tema.py troca por '/' na
 *  promoção, e a junção abaixo evita '//autor/...'. */
export function hrefAutor(slug: string, prefixo = ''): string {
  return `${prefixo.replace(/\/+$/, '')}/autor/${slug}`
}

export function acharAutor(valor: string | undefined, autores: EntradaAutor[]): EntradaAutor | undefined {
  if (!valor) return undefined
  const alvo = normalizar(valor)
  return (
    autores.find((a) => a.id === valor) ??
    autores.find((a) => normalizar(a.id) === alvo) ??
    autores.find((a) => normalizar(a.data.nome) === alvo)
  )
}

export function resolverAutor(
  post: CamposAutorNoPost,
  autores: EntradaAutor[],
  prefixo = '',
): AutorResolvido | null {
  const entrada = acharAutor(post.autor, autores)

  if (entrada) {
    const d = entrada.data
    const redes = Object.values(d.redes ?? {}).filter((v): v is string => Boolean(v))
    const credencial = [d.conselho, d.registro].filter(Boolean).join(' ').trim()
    const ativo = d.ativo !== false
    return {
      slug: entrada.id,
      href: ativo ? hrefAutor(entrada.id, prefixo) : undefined,
      nome: d.nome,
      foto: d.foto || post.autorFoto,
      fotoAlt: d.fotoAlt || d.nome,
      cargo: d.cargo || post.autorCargo,
      bio: d.bioCurta || post.autorBio,
      credencial: credencial || undefined,
      linkedin: d.redes?.linkedin || post.autorLinkedin,
      instagram: d.redes?.instagram || post.autorInstagram,
      email: d.email || post.autorEmail,
      sameAs: redes,
    }
  }

  if (!post.autor) return null

  // Autor fora da coleção: mostra o que o post traz, sem link.
  return {
    nome: post.autor,
    foto: post.autorFoto,
    fotoAlt: post.autor,
    cargo: post.autorCargo,
    bio: post.autorBio,
    linkedin: post.autorLinkedin,
    instagram: post.autorInstagram,
    email: post.autorEmail,
    sameAs: [post.autorLinkedin, post.autorInstagram].filter((v): v is string => Boolean(v)),
  }
}

/** Nome para exibir em card/listagem. */
export function nomeAutor(post: CamposAutorNoPost, autores: EntradaAutor[]): string | undefined {
  return resolverAutor(post, autores)?.nome
}

/**
 * Artigos de um autor para a página /autor/<slug>, no modelo que o Jorge
 * mostrou (iDinheiro): "Seleção do autor" com 3 artigos e "Últimos artigos"
 * com os 7 seguintes — nunca a lista inteira, para a página não crescer sem
 * limite. A seleção prioriza os artigos marcados `destaque: true`.
 * Com até 3 artigos não há seleção: todos vão para "Últimos artigos".
 */
export function separarArtigosDoAutor<P extends { id: string; data: CamposAutorNoPost & { publicadoEm: string; destaque?: boolean } }>(
  posts: P[],
  autorId: string,
  autores: EntradaAutor[],
): { selecao: P[]; ultimos: P[]; total: number } {
  const doAutor = posts
    .filter((p) => acharAutor(p.data.autor, autores)?.id === autorId)
    .sort((a, b) => new Date(b.data.publicadoEm).getTime() - new Date(a.data.publicadoEm).getTime())

  if (doAutor.length <= 3) return { selecao: [], ultimos: doAutor, total: doAutor.length }

  const selecao = [...doAutor.filter((p) => p.data.destaque), ...doAutor.filter((p) => !p.data.destaque)].slice(0, 3)
  const ultimos = doAutor.filter((p) => !selecao.includes(p)).slice(0, 7)
  return { selecao, ultimos, total: doAutor.length }
}
