/**
 * Roda uma vez no boot do servidor (Next 15, sem flag). Sem LINKFLOW_DIR o
 * painel apontaria para a pasta errada; sem NEXTAUTH_SECRET as sessões não
 * são assinadas com segredo próprio; sem PAINEL_API_KEY a automação (Claude
 * Code) fica sem acesso e o bootstrap do 1º admin não funciona. Em produção
 * qualquer um deles derruba o boot com mensagem clara; em dev só avisa.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const exigidas: [string, string][] = [
    ["LINKFLOW_DIR", "configure a pasta do site deste cliente no .env do painel."],
    ["NEXTAUTH_SECRET", "defina um segredo longo e aleatório no .env do painel (assina as sessões)."],
    ["PAINEL_API_KEY", "defina a chave de automação no .env do painel."],
  ];
  const faltando = exigidas.filter(([nome]) => !process.env[nome]);
  if (faltando.length === 0) return;

  const msg = faltando.map(([nome, dica]) => `${nome} não definido — ${dica}`).join(" | ");
  if (process.env.NODE_ENV === "production") {
    throw new Error(msg);
  }
  console.warn(`[painel] AVISO: ${msg}`);
}
