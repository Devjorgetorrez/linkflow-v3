/**
 * lib/site-config-cliente.ts — lado das TELAS do contrato de /api/config.
 *
 * Módulo sem React (testável em Node). Concentra o que as telas de
 * Configurações repetiriam: montar o PATCH só com o que mudou (+ `limpar` para o
 * que o usuário apagou de propósito) e interpretar a resposta sem nunca mostrar
 * "Salvo" quando o servidor recusou.
 */

import {
  DIAS_SEMANA,
  juntarNumero,
  patchDeBody,
  validarPatch,
  type Funcionamento,
} from "./site-config";

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

/* ------------------------------------------------------------------ */
/* Listas, objetos aninhados, mídia e validação (campos restaurados)   */
/* ------------------------------------------------------------------ */

/**
 * Endereço para MOSTRAR a mídia dentro do painel. O painel roda em outro endereço que o
 * site, então "/midia/x.png" (ou a URL pública) não abre nele: a prévia passa pela rota
 * autenticada /api/midia/arquivo/. URL de outro domínio (que não seja /midia/) fica como está.
 */
export function urlPreviaMidia(url: string): string {
  if (!url) return url;
  let caminho = url.trim();
  if (/^https?:\/\//i.test(caminho)) {
    try { caminho = new URL(caminho).pathname; } catch { return url; }
  }
  return caminho.startsWith("/midia/") ? `/api/midia/arquivo/${caminho.slice("/midia/".length)}` : url;
}

/** A API de mídia devolve URL absoluta; o site.ts guarda o CAMINHO (`/midia/logo.png`). */
export function caminhoDaMidia(url: string): string {
  const t = url.trim();
  if (!/^https?:\/\//i.test(t)) return t;
  try {
    return new URL(t).pathname;
  } catch {
    return t;
  }
}

/** { nome, "logo.src": x } → { nome, logo: { src: x } } (formato que o PATCH aceita). */
export function aninhar(flat: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    const i = k.indexOf(".");
    if (i === -1) out[k] = v;
    else {
      const pai = k.slice(0, i);
      const obj = (out[pai] ?? {}) as Record<string, string>;
      obj[k.slice(i + 1)] = v;
      out[pai] = obj;
    }
  }
  return out;
}

/** diffCampos + aninhamento: devolve os campos alterados no formato do PATCH e o `limpar`. */
export function montarPatchPlano(
  original: Record<string, string>,
  atual: Record<string, string>,
): { body: Record<string, unknown>; limpar: string[] } {
  const { alterados, limpar } = diffCampos(original, atual, "");
  return { body: aninhar(alterados), limpar };
}

const limpaLista = (l: string[]) => [...new Set(l.map((x) => x.trim()).filter(Boolean))];

/** Compara duas listas de texto (sem vazios/duplicados); `limpar` só se a lista foi esvaziada. */
export function diffLista(original: string[], atual: string[]): { mudou: boolean; lista: string[]; esvaziou: boolean } {
  const o = limpaLista(original);
  const a = limpaLista(atual);
  return { mudou: JSON.stringify(o) !== JSON.stringify(a), lista: a, esvaziou: a.length === 0 && o.length > 0 };
}

/** Forma canônica de um período de funcionamento (a mesma que o servidor grava). */
export function normalizarFuncionamento(lista: Funcionamento[]): Funcionamento[] {
  return lista.map((f) => {
    const dias = DIAS_SEMANA.filter((d) => (f.dias ?? []).includes(d));
    return f.fechado
      ? { dias, fechado: true }
      : { dias, abre: (f.abre ?? "").trim().padStart(5, "0"), fecha: (f.fecha ?? "").trim().padStart(5, "0") };
  }) as Funcionamento[];
}

/** Valida o corpo do PATCH com os MESMOS validadores do servidor (chaves de erro iguais). */
export function validarBody(body: Record<string, unknown>): Record<string, string> {
  return validarPatch(patchDeBody(body).patch);
}

export type CampoContato =
  | "telefone" | "telefone2" | "whatsapp" | "email"
  | "logradouro" | "complemento" | "bairro" | "cidade" | "uf" | "cep";

export interface EntradaContato {
  /** NAP como o site guarda (logradouro JÁ com o número: "Av. Dom Pedro II, 980"). */
  original: Record<CampoContato, string>;
  /** NAP editado; `logradouro` = rua sem número. */
  atual: Record<CampoContato, string>;
  numero: string;
  funcOriginal: Funcionamento[];
  func: Funcionamento[];
  areaOriginal: string[];
  area: string[];
  onlineOriginal: boolean;
  online: boolean;
}

/**
 * Monta o PATCH da tela Contato só com o que mudou. O número fica junto do
 * logradouro no site, então o diff é feito sobre o valor COMPOSTO. `funcionamento`
 * vai sem `horarios`: o servidor deriva o texto exibido.
 */
export function montarPatchContato(e: EntradaContato): { body: Record<string, unknown>; erros: Record<string, string> } {
  const erros: Record<string, string> = {};
  const composto = { ...e.atual, logradouro: juntarNumero(e.atual.logradouro, e.numero) };
  if (!e.atual.logradouro.trim() && e.numero.trim()) erros["nap.logradouro"] = "Informe o logradouro antes do número.";

  const { alterados, limpar } = diffCampos(e.original, composto, "nap.");
  const body: Record<string, unknown> = { ...alterados };

  const fo = normalizarFuncionamento(e.funcOriginal);
  const fa = normalizarFuncionamento(e.func);
  if (JSON.stringify(fo) !== JSON.stringify(fa)) {
    body.funcionamento = fa;
    if (fa.length === 0 && fo.length > 0) limpar.push("funcionamento");
  }

  const area = diffLista(e.areaOriginal, e.area);
  if (area.mudou) {
    body.areaAtendimento = area.lista;
    if (area.esvaziou) limpar.push("areaAtendimento");
  }
  if (e.online !== e.onlineOriginal) body.atendimentoOnline = e.online;

  if (limpar.length) body.limpar = limpar;
  Object.assign(erros, validarBody(body));
  return { body, erros };
}
