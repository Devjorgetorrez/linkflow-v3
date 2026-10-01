/**
 * lib/limite-submissao.ts — limite de envios do formulário público (em memória, PURO).
 *
 * Por IP (janela de 1 h) e um teto GLOBAL por hora contra enxurrada vinda de
 * muitos IPs. Reinicia com o processo (aceitável: painel de 1 cliente).
 */

export const LIMITE_POR_IP = 10;
export const LIMITE_GLOBAL = 200;
export const JANELA_SUBMISSAO_MS = 60 * 60 * 1000;
export const MSG_LIMITE_IP = "Você enviou muitas mensagens em pouco tempo. Aguarde cerca de uma hora e tente de novo.";
export const MSG_LIMITE_GLOBAL = "O formulário está recebendo muitos envios no momento. Tente novamente em alguns minutos.";

export function criarLimiteSubmissao(
  agora: () => number = Date.now,
  porIp = LIMITE_POR_IP,
  global = LIMITE_GLOBAL,
) {
  const ips = new Map<string, { n: number; reset: number }>();
  let g = { n: 0, reset: 0 };

  return {
    /** Registra a tentativa. Devolve null se ok, ou a mensagem de bloqueio. */
    tentar(ip: string): string | null {
      const t = agora();
      for (const [k, v] of ips) if (t > v.reset) ips.delete(k);
      if (t > g.reset) g = { n: 0, reset: t + JANELA_SUBMISSAO_MS };
      const e = ips.get(ip);
      if (e && e.n >= porIp) return MSG_LIMITE_IP;
      if (g.n >= global) return MSG_LIMITE_GLOBAL;
      if (e) e.n++;
      else ips.set(ip, { n: 1, reset: t + JANELA_SUBMISSAO_MS });
      g.n++;
      return null;
    },
  };
}

/**
 * IP do visitante atrás do Nginx: o ÚLTIMO item do X-Forwarded-For (o que o
 * Nginx acrescenta; os anteriores podem ter sido forjados pelo cliente).
 */
export function ipDoCliente(xff: string | null, realIp: string | null): string {
  const itens = (xff ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return itens[itens.length - 1] || realIp?.trim() || "desconhecido";
}
