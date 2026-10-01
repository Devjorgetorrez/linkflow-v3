/**
 * lib/relacionados.ts — "Posts relacionados" e "Conteúdo pilar" do artigo,
 * num lugar só para os 6 layouts.
 *
 * Frontmatter (ambos opcionais; gravados pelo editor de post do painel):
 *   relacionados  lista de slugs de posts. Se houver ao menos um slug válido
 *                 (existe e está publicado), a lista MANUAL substitui o
 *                 automático, na ordem escolhida. Slug inexistente, de
 *                 rascunho/lixeira ou do próprio artigo é ignorado.
 *   pilar         slug do serviço/página pilar que o artigo apoia. Slug que
 *                 não existe na coleção de serviços do layout é ignorado.
 *
 * Automático (sem `relacionados` válido): mesma categoria primeiro, mais
 * recentes antes; se a categoria não completar 3, completa com os demais
 * publicados mais recentes. Exclui o próprio artigo e posts com noindex.
 * Máximo de 3.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export const MAX_RELACIONADOS = 3

type Entrada = { id: string; data: any }

const porDataDesc = (a: Entrada, b: Entrada) =>
  new Date(String(b.data.publicadoEm)).getTime() - new Date(String(a.data.publicadoEm)).getTime()

/** `publicados` já vem filtrado por ehPublicado (lib/publicacao.ts). */
export function escolherRelacionados<T extends Entrada>(entry: T, publicados: T[]): T[] {
  const outros = publicados.filter((p) => p.id !== entry.id)

  const manual: string[] = Array.isArray(entry.data.relacionados) ? entry.data.relacionados : []
  const vistos = new Set<string>()
  const escolhidos: T[] = []
  for (const bruto of manual) {
    const slug = String(bruto ?? '').trim()
    if (!slug || vistos.has(slug)) continue
    vistos.add(slug)
    const achado = outros.find((p) => p.id === slug)
    if (achado) escolhidos.push(achado)
    if (escolhidos.length >= MAX_RELACIONADOS) break
  }
  if (escolhidos.length) return escolhidos

  const visiveis = outros.filter((p) => p.data.noindex !== true).sort(porDataDesc)
  const cat = String(entry.data.categoria ?? '').trim()
  const mesma = cat ? visiveis.filter((p) => String(p.data.categoria ?? '').trim() === cat) : []
  const resto = visiveis.filter((p) => !mesma.includes(p))
  return [...mesma, ...resto].slice(0, MAX_RELACIONADOS)
}

/**
 * Serviço pilar do artigo, ou undefined. Devolve o `slug`; cada layout monta o
 * href com o próprio prefixo (`/${slug}` no base, `/tema-0X/${slug}` nos demais —
 * o promover_tema.py só reescreve esse padrão literal).
 */
export function resolverPilar(
  entry: Entrada,
  servicos: Entrada[],
): { titulo: string; slug: string } | undefined {
  const slug = String(entry.data.pilar ?? '').trim()
  if (!slug) return undefined
  const s = servicos.find((x) => x.id === slug)
  if (!s) return undefined
  return { titulo: String(s.data.titulo ?? s.data.nome ?? slug), slug: s.id }
}

/**
 * `isPartOf` do Article (JSON-LD): o artigo faz parte da página do serviço pilar.
 * `pilar.href` é o caminho que o layout já usa no box de pilar; vira URL absoluta com o
 * domínio do site. Sem pilar válido devolve undefined (o Article fica como era).
 */
export function pilarJsonLd(
  pilar: { titulo: string; href: string } | undefined,
  dominio: string,
): { '@type': 'WebPage'; '@id': string; url: string; name: string } | undefined {
  if (!pilar) return undefined
  const url = `${String(dominio).replace(/\/+$/, '')}${pilar.href}`
  return { '@type': 'WebPage', '@id': url, url, name: pilar.titulo }
}
