/**
 * lib/frontmatter-post.ts — tradução entre o Post do painel e o frontmatter
 * que o site Astro lê (schema `posts` em _astro/src/content.config.ts).
 *
 * O painel usa nomes próprios (metaDescription, categoriaId, autorId, data)
 * e o site usa outros (metaDescription, categoria, autor, publicadoEm).
 * Antes desta camada, criar um post pelo painel gravava `descricao` no lugar
 * de `metaDescription` — campo obrigatório no site — e o build do site
 * inteiro quebrava no primeiro post criado. A edição, por sua vez, espalhava
 * no arquivo qualquer campo do painel com o nome do painel.
 *
 * Regra: só campos que o site conhece são gravados, sempre com o nome do
 * site. Campo ausente no patch não é tocado (a edição preserva o resto).
 */

type Entrada = Record<string, unknown>;

function texto(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v);
  return s;
}

/** Converte um patch/objeto do painel em campos de frontmatter do site. */
export function painelParaFrontmatter(entrada: Entrada): Record<string, unknown> {
  const fm: Record<string, unknown> = {};
  const def = (chave: string, valor: unknown) => {
    if (valor !== undefined) fm[chave] = valor;
  };

  def("titulo", texto(entrada.titulo));
  def("metaDescription", texto(entrada.metaDescription ?? entrada.descricao));
  def("publicadoEm", texto(entrada.publicadoEm ?? entrada.data));
  def("categoria", texto(entrada.categoria ?? entrada.categoriaId));
  def("autor", texto(entrada.autor ?? entrada.autorId));
  def("status", texto(entrada.status));
  def("palavraChave", texto(entrada.palavraChave ?? entrada.kwPrimaria));
  if (entrada.destaque !== undefined) fm.destaque = Boolean(entrada.destaque);

  // Strings vazias não sobrescrevem nada útil — melhor omitir do que gravar
  // "categoria:" em branco. Exceção: metaDescription/titulo vazios são
  // gravados, para o site acusar a pendência em vez de manter texto antigo.
  for (const chave of ["categoria", "autor", "palavraChave", "publicadoEm", "status"]) {
    if (fm[chave] === "") delete fm[chave];
  }
  return fm;
}
