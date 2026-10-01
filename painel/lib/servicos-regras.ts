/**
 * lib/servicos-regras.ts — regras da coleção `servicos` compartilhadas entre
 * a API e as telas (PURO: sem fs, sem React). Espelha lib/posts-regras.ts,
 * mas para o schema `servicos` (_astro/src/content.config.ts).
 *
 * Diferença crítica em relação a posts: o schema de `servicos` NÃO tem
 * `status` nem um caminho de "rascunho" que relaxe os limites — título
 * (3–70) e metaDescription (80–165) são SEMPRE obrigatórios, senão o build
 * do site quebra assim que o arquivo é lido. Por isso um serviço novo nasce
 * com um texto provisório MARCADO como pendência (convenção `[CAMPO]` do
 * projeto), nunca com um texto curto que violaria o schema.
 */

export const TITULO_PROVISORIO_SERVICO = "Novo serviço";
export const TITULO_MIN = 3;
export const TITULO_MAX = 70;
export const META_MIN = 80;
export const META_MAX = 165;

/**
 * Meta description provisória de um serviço recém-criado: precisa ficar
 * dentro de 80–165 caracteres (senão o build do site quebra) mas não pode
 * fingir ser um texto de verdade — por isso o `[CAMPO]` na frente, igual ao
 * resto do projeto marca dado pendente. 132 caracteres.
 */
export const META_PROVISORIA_SERVICO =
  "[CAMPO] Escreva aqui a descrição deste serviço para os resultados de busca (80 a 165 caracteres) antes de publicar.";

/** Slugs que não podem virar serviço: colidem com rotas da API (/api/servicos/lixeira). */
export const SLUGS_RESERVADOS_SERVICO = ["lixeira", "novo"];

export function tituloValido(titulo: unknown): titulo is string {
  if (typeof titulo !== "string") return false;
  const n = titulo.trim().length;
  return n >= TITULO_MIN && n <= TITULO_MAX;
}

export function metaValida(meta: unknown): meta is string {
  if (typeof meta !== "string") return false;
  const n = meta.trim().length;
  return n >= META_MIN && n <= META_MAX;
}
