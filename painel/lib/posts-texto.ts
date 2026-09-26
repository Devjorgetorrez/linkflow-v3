/** Contagem de palavras de um corpo em HTML (sem tags, sem &nbsp;). Puro. */
export function contarPalavrasHtml(html: string): number {
  const texto = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  return texto ? texto.split(/\s+/).length : 0;
}
