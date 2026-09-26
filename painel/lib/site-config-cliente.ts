/**
 * lib/site-config-cliente.ts — lado das TELAS do contrato de /api/config.
 *
 * Módulo sem React (testável em Node). Concentra o que as telas de
 * Configurações repetiriam: montar o PATCH só com o que mudou (+ `limpar` para o
 * que o usuário apagou de propósito) e interpretar a resposta sem nunca mostrar
 * "Salvo" quando o servidor recusou.
 */

export interface RespostaConfig {
  ok: boolean;
  /** Mensagem geral de erro (rede, 500, 400 sem detalhe). */
  erro: string;
  /** Erros por campo, na chave que o servidor usa ("nap.cep", "cnpj", "redes.instagram"). */
  erros: Record<string, string>;
  /** Aviso curto sobre `ignorados`/`naoSuportados` (não impede o "salvo"). */
  aviso: string;
  alterados: string[];
}

/** Compara original x atual (com trim) e devolve só o que mudou e o que foi esvaziado. */
export function diffCampos(
  original: Record<string, string>,
  atual: Record<string, string>,
  prefixoLimpar: string,
): { alterados: Record<string, string>; limpar: string[] } {
  const alterados: Record<string, string> = {};
  const limpar: string[] = [];
  for (const k of Object.keys(atual)) {
    const a = (atual[k] ?? "").trim();
    const o = (original[k] ?? "").trim();
    if (a === o) continue;
    alterados[k] = a;
    if (a === "" && o !== "") limpar.push(`${prefixoLimpar}${k}`);
  }
  return { alterados, limpar };
}

/** Interpreta a resposta de PATCH /api/config. */
export function interpretarResposta(status: number, data: unknown): RespostaConfig {
  const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const erros = (d.erros && typeof d.erros === "object" ? d.erros : {}) as Record<string, string>;
  if (status < 200 || status >= 300 || d.ok !== true) {
    const erro = typeof d.erro === "string" && d.erro ? d.erro : `Não foi possível salvar (erro ${status}).`;
    return { ok: false, erro, erros, aviso: "", alterados: [] };
  }
  const partes: string[] = [];
  const ign = Array.isArray(d.ignorados) ? (d.ignorados as { campo?: string }[]) : [];
  if (ign.length) {
    partes.push(`Não gravado (campo vazio sobre valor existente): ${ign.map((i) => i.campo).join(", ")}.`);
  }
  const nao = Array.isArray(d.naoSuportados) ? (d.naoSuportados as string[]) : [];
  if (nao.length) partes.push(`Não suportado pelo site: ${nao.join(", ")}.`);
  const alterados = Array.isArray(d.alterados) ? (d.alterados as string[]) : [];
  return { ok: true, erro: "", erros: {}, aviso: partes.join(" "), alterados };
}

/** PATCH /api/config; nunca lança. */
export async function enviarConfig(body: Record<string, unknown>): Promise<RespostaConfig> {
  try {
    const res = await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* corpo não-JSON */
    }
    return interpretarResposta(res.status, data);
  } catch {
    return { ok: false, erro: "Sem conexão com o painel. Nada foi salvo.", erros: {}, aviso: "", alterados: [] };
  }
}
