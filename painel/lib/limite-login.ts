/**
 * lib/limite-login.ts — limite de tentativas de login (em memória, PURO).
 *
 * 5 falhas por chave (e-mail+IP) → bloqueio de 15 min. Sucesso zera a chave.
 * Em memória: reinicia com o processo (aceitável para um painel de 1 cliente).
 */

export const MAX_FALHAS = 5;
export const JANELA_MS = 15 * 60 * 1000;
export const MENSAGEM_BLOQUEIO = "Muitas tentativas. Tente em alguns minutos.";

interface Registro { falhas: number; desde: number; bloqueadoAte: number }

export function criarLimitador(agora: () => number = Date.now) {
  const mapa = new Map<string, Registro>();

  function limpar() {
    const t = agora();
    for (const [k, r] of mapa) {
      if (r.bloqueadoAte <= t && t - r.desde > JANELA_MS) mapa.delete(k);
    }
  }

  return {
    bloqueado(chave: string): boolean {
      limpar();
      const r = mapa.get(chave);
      return !!r && r.bloqueadoAte > agora();
    },
    falha(chave: string): void {
      limpar();
      const t = agora();
      const r = mapa.get(chave) ?? { falhas: 0, desde: t, bloqueadoAte: 0 };
      if (r.bloqueadoAte && r.bloqueadoAte <= t) { r.falhas = 0; r.desde = t; r.bloqueadoAte = 0; }
      r.falhas += 1;
      if (r.falhas >= MAX_FALHAS) r.bloqueadoAte = t + JANELA_MS;
      mapa.set(chave, r);
    },
    sucesso(chave: string): void {
      mapa.delete(chave);
    },
    tamanho: () => mapa.size,
  };
}
