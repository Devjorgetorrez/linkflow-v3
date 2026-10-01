/**
 * lib/data-br.ts — data/hora no fuso do Brasil, um lugar só.
 *
 * `new Date().toISOString()` sempre usa UTC: um post/serviço/redirect criado
 * entre 21h e 23h59 de Brasília nascia com a data do dia seguinte gravada no
 * arquivo (erro 82, Relatório de Testes 5). en-CA formata como AAAA-MM-DD —
 * mesmo formato do ISO, já no fuso certo.
 */
export const FUSO_BRASIL = "America/Sao_Paulo";

export function hojeISOBrasil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_BRASIL }).format(new Date());
}
