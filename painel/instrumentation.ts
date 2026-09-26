/**
 * Roda uma vez no boot do servidor (Next 15, sem flag). Sem LINKFLOW_DIR o
 * painel apontaria para a pasta errada: em produção derruba o boot com
 * mensagem clara; em dev só avisa.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.LINKFLOW_DIR) return;
  const msg =
    "LINKFLOW_DIR não definido — configure a pasta do site deste cliente no .env do painel.";
  if (process.env.NODE_ENV === "production") {
    throw new Error(msg);
  }
  console.warn(`[painel] AVISO: ${msg}`);
}
