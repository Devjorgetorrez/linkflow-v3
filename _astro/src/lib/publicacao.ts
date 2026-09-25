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
