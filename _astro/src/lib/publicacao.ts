/**
 * Regra única de "o que vai para o site" nos posts do blog.
 *
 * O vocabulário de status não é uniforme entre quem grava o frontmatter:
 * o painel usa `publicado` / `rascunho` / `revisao`, a skill site-publicar
 * orienta `pronto`, e posts antigos (e os de exemplo dos temas) não têm
 * status nenhum. Por isso a regra é por EXCLUSÃO explícita: só fica fora
 * do site o que está marcado como não pronto (rascunho, revisão, agendado
 * ou lixeira — os estados do painel). Status ausente = publicado. A mesma
 * regra vale no painel: painel/lib/status-post.ts.
 *
 * Usado como filtro em todo getCollection('posts' | 'postsT3' | 'postsT4')
 * — páginas de artigo, listagens, relacionados e home. Assim nenhum
 * rascunho vira página, aparece em listagem ou entra no sitemap.
 */
const NAO_PUBLICADOS = new Set(['rascunho', 'revisao', 'revisão', 'agendado', 'lixeira'])

export function ehPublicado({ data }: { data: { status?: string } }): boolean {
  return !NAO_PUBLICADOS.has(String(data.status ?? '').trim().toLowerCase())
}

/**
 * Serviço em rascunho (noindex: true) só devia sair do Google — mas a home
 * e a listagem de serviços usavam getCollection('servicos') sem filtro
 * nenhum, então o cartão (com o texto provisório, tipo "[CAMPO] rascunho
 * ainda sendo escrito") aparecia pro visitante normal mesmo assim. Como
 * todo serviço nasce em rascunho (erro 108), isso valia pra QUALQUER
 * serviço recém-criado no painel, antes de ter texto de verdade.
 *
 * Só filtra LISTAGEM (cartão na home, grade de serviços) — a página
 * própria do serviço continua existindo e acessível por link direto,
 * só sem indexar (mesmo padrão já usado para autor sem artigo).
 * Usado em getCollection('servicos' | 'servicosT3'..'servicosT7') nas
 * páginas de listagem; NUNCA no getStaticPaths() de [slug].astro, que
 * precisa gerar a página de todo serviço, rascunho ou não.
 */
export function ehServicoListavel({ data }: { data: { noindex?: boolean } }): boolean {
  return data.noindex !== true
}
