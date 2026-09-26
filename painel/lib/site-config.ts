/**
 * lib/site-config.ts — leitura e escrita do config/site.ts do cliente.
 *
 * Fonte ÚNICA para tudo que o painel lê ou grava no `site.ts`. Substitui os
 * regex soltos que havia em /api/config, que:
 *   - casavam a primeira ocorrência de `nome:`/`cnpj:` no arquivo (funcionava
 *     por sorte de ordem);
 *   - não inseriam a chave quando ela não existia (`telefone2`) e ainda
 *     respondiam "ok";
 *   - gravavam "" por cima de campos que a tela nem tinha carregado
 *     (apagou o bairro);
 *   - removiam `$ { } \` dos valores (corrompia "R$", URLs);
 *   - aceitavam CEP "abcde".
 *
 * Como funciona: um scanner que entende strings, comentários e aninhamento
 * localiza cada chave POR CAMINHO (nap.bairro, redes[Instagram].href) e edita
 * só o valor pedido — o resto do arquivo (comentários, ordem, alinhamento,
 * blocos que o painel não conhece, como `legal`, `faq`, `nav`) fica byte a byte
 * igual. Antes de devolver, relê o resultado e confere que só mudou o que devia.
 *
 * Módulo PURO (sem fs, sem imports): roda no servidor e no navegador, e as
 * telas reaproveitam as validações.
 */

// ─── Scanner ─────────────────────────────────────────────────────────────────

interface Entrada {
  chave: string;
  iniChave: number;
  iniValor: number;
  fimValor: number; // exclusivo, sem espaço/comentário no fim
  fimEntrada: number; // posição da vírgula que fecha a entrada, ou fimValor se não houver
}

interface Objeto {
  abre: number; // posição do "{"
  fecha: number; // posição do "}"
  entradas: Entrada[];
}

function pularString(s: string, i: number): number {
  const q = s[i];
  if (q === "`") return pularTemplate(s, i);
  let j = i + 1;
  while (j < s.length) {
    if (s[j] === "\\") j += 2;
    else if (s[j] === q) return j + 1;
    else j++;
  }
  return s.length;
}

function pularTemplate(s: string, i: number): number {
  let j = i + 1;
  while (j < s.length) {
    if (s[j] === "\\") j += 2;
    else if (s[j] === "`") return j + 1;
    else if (s[j] === "$" && s[j + 1] === "{") {
      let d = 1;
      j += 2;
      while (j < s.length && d > 0) {
        const c = s[j];
        if (c === "'" || c === '"' || c === "`") { j = pularString(s, j); continue; }
        if (c === "{") d++;
        else if (c === "}") d--;
        j++;
      }
    } else j++;
  }
  return s.length;
}

/** Avança sobre espaços e comentários. */
function pularEspaco(s: string, i: number): number {
  let j = i;
  for (;;) {
    while (j < s.length && /\s/.test(s[j])) j++;
    if (s[j] === "/" && s[j + 1] === "/") {
      while (j < s.length && s[j] !== "\n") j++;
    } else if (s[j] === "/" && s[j + 1] === "*") {
      const f = s.indexOf("*/", j + 2);
      j = f === -1 ? s.length : f + 2;
    } else return j;
  }
}

/** Fim do valor que começa em `i`: para na vírgula ou no fechamento do contêiner. */
function fimDoValor(s: string, i: number): { fimValor: number; parou: number } {
  let j = i;
  let d = 0;
  let ultimo = i;
  while (j < s.length) {
    const c = s[j];
    if (c === "'" || c === '"' || c === "`") { j = pularString(s, j); ultimo = j; continue; }
    if (c === "/" && (s[j + 1] === "/" || s[j + 1] === "*")) { j = pularEspaco(s, j); continue; }
    if (c === "{" || c === "[" || c === "(") d++;
    else if (c === "}" || c === "]" || c === ")") {
      if (d === 0) return { fimValor: ultimo, parou: j };
      d--;
    } else if (c === "," && d === 0) return { fimValor: ultimo, parou: j };
    if (!/\s/.test(c)) ultimo = j + 1;
    j++;
  }
  return { fimValor: ultimo, parou: s.length };
}

function lerChave(s: string, i: number): { chave: string; fim: number } | null {
  if (s[i] === "'" || s[i] === '"') {
    const f = pularString(s, i);
    return { chave: desescapar(s.slice(i + 1, f - 1)), fim: f };
  }
  const m = /^[A-Za-z_$][\w$]*/.exec(s.slice(i, i + 80));
  return m ? { chave: m[0], fim: i + m[0].length } : null;
}

function objetoEm(s: string, abre: number): Objeto {
  if (s[abre] !== "{") throw new Error("site-config: esperava um objeto '{'");
  const entradas: Entrada[] = [];
  let i = abre + 1;
  for (;;) {
    i = pularEspaco(s, i);
    if (i >= s.length) throw new Error("site-config: objeto sem fechamento");
    if (s[i] === "}") return { abre, fecha: i, entradas };
    if (s[i] === ",") { i++; continue; }
    const k = lerChave(s, i);
    if (!k) { // spread, método etc.: pula até a próxima vírgula
      const { parou } = fimDoValor(s, i);
      i = parou;
      continue;
    }
    let j = pularEspaco(s, k.fim);
    if (s[j] !== ":") { // atalho `{ a, b }`
      const { parou } = fimDoValor(s, i);
      i = parou;
      continue;
    }
    j = pularEspaco(s, j + 1);
    const { fimValor, parou } = fimDoValor(s, j);
    entradas.push({
      chave: k.chave,
      iniChave: i,
      iniValor: j,
      fimValor,
      fimEntrada: s[parou] === "," ? parou : fimValor,
    });
    i = parou;
  }
}

function achar(o: Objeto, chave: string): Entrada | undefined {
  return o.entradas.find((e) => e.chave === chave);
}

/** Objeto `site` de `export const site = { ... }`. */
function objetoSite(s: string): Objeto {
  const m = /export\s+const\s+site\b[^=]*=\s*\{/.exec(s);
  if (!m) throw new Error("site-config: 'export const site = {' não encontrado no config/site.ts");
  return objetoEm(s, m.index + m[0].length - 1);
}

interface Elemento { ini: number; fim: number; fimComVirgula: number }

function elementosDoArray(s: string, abre: number): { elementos: Elemento[]; fecha: number } {
  if (s[abre] !== "[") throw new Error("site-config: esperava um array '['");
  const elementos: Elemento[] = [];
  let i = abre + 1;
  for (;;) {
    i = pularEspaco(s, i);
    if (i >= s.length) throw new Error("site-config: array sem fechamento");
    if (s[i] === "]") return { elementos, fecha: i };
    if (s[i] === ",") { i++; continue; }
    const { fimValor, parou } = fimDoValor(s, i);
    elementos.push({ ini: i, fim: fimValor, fimComVirgula: s[parou] === "," ? parou + 1 : fimValor });
    i = parou;
  }
}

// ─── Literais ─────────────────────────────────────────────────────────────────

function desescapar(t: string): string {
  return t.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, c: string) => {
    if (c[0] === "u" && c.length === 5) return String.fromCharCode(parseInt(c.slice(1), 16));
    if (c[0] === "x" && c.length === 3) return String.fromCharCode(parseInt(c.slice(1), 16));
    if (c === "n") return "\n";
    if (c === "t") return "\t";
    return c;
  });
}

/** Valor string de um literal ('..', "..", `..` sem ${}); undefined se não for string simples. */
function lerString(s: string, e: Entrada): string | undefined {
  const t = s.slice(e.iniValor, e.fimValor);
  const q = t[0];
  if ((q !== "'" && q !== '"' && q !== "`") || t[t.length - 1] !== q || t.length < 2) return undefined;
  if (q === "`" && t.includes("${")) return undefined;
  return desescapar(t.slice(1, -1));
}

function lerNumero(s: string, e: Entrada): number | null | undefined {
  const t = s.slice(e.iniValor, e.fimValor).trim();
  if (t === "null") return null;
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : undefined;
}

/** Literal de string em aspas simples, com escape correto (não remove nada). */
export function literal(v: string): string {
  return "'" + v.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " ") + "'";
}

// ─── Edição ───────────────────────────────────────────────────────────────────

function indentacaoDe(s: string, pos: number): string {
  const ini = s.lastIndexOf("\n", pos - 1) + 1;
  const m = /^[ \t]*/.exec(s.slice(ini, pos));
  return m ? m[0] : "";
}

/** Define `chave: <lit>` no objeto que abre em `abre`. Devolve o texto novo e o que aconteceu. */
function definirEmObjeto(
  s: string,
  abre: number,
  chave: string,
  lit: string,
): { s: string; acao: "alterado" | "inserido" | "igual" } {
  const o = objetoEm(s, abre);
  const e = achar(o, chave);
  if (e) {
    if (s.slice(e.iniValor, e.fimValor) === lit) return { s, acao: "igual" };
    return { s: s.slice(0, e.iniValor) + lit + s.slice(e.fimValor), acao: "alterado" };
  }
  const ultimo = o.entradas[o.entradas.length - 1];
  const indentPai = indentacaoDe(s, abre === -1 ? 0 : abre);
  if (!ultimo) {
    const ind = indentPai + "  ";
    return { s: s.slice(0, abre + 1) + `\n${ind}${chave}: ${lit},\n${indentPai}` + s.slice(abre + 1), acao: "inserido" };
  }
  const ind = indentacaoDe(s, ultimo.iniChave);
  let corte = ultimo.fimEntrada;
  let prefixo = "";
  if (s[ultimo.fimEntrada] !== ",") prefixo = ","; // última entrada sem vírgula final
  else corte = ultimo.fimEntrada + 1;
  const ponto = prefixo ? ultimo.fimValor : corte;
  return {
    s: s.slice(0, ponto) + prefixo + `\n${ind}${chave}: ${lit},` + s.slice(ponto),
    acao: "inserido",
  };
}

function definirNoObjetoAninhado(
  s: string,
  caminho: string[],
  lit: string,
): { s: string; acao: "alterado" | "inserido" | "igual" } {
  let o = objetoSite(s);
  for (let i = 0; i < caminho.length - 1; i++) {
    const e = achar(o, caminho[i]);
    if (!e || s[e.iniValor] !== "{") {
      throw new Error(`site-config: '${caminho.slice(0, i + 1).join(".")}' não existe no config/site.ts como objeto`);
    }
    o = objetoEm(s, e.iniValor);
  }
  return definirEmObjeto(s, o.abre, caminho[caminho.length - 1], lit);
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

export interface Horario { dia: string; hora: string }
export interface Rede { nome: string; href: string }

export const CAMPOS_NAP = [
  "logradouro", "complemento", "bairro", "cidade", "uf", "cep",
  "telefone", "telefone2", "whatsapp", "email",
] as const;
export type CampoNap = (typeof CAMPOS_NAP)[number];

export const CAMPOS_INTEGRACAO = [
  "googleAnalyticsId", "metaPixelId", "googleTagManagerId", "googleVerificacao", "bingVerificacao",
] as const;

export interface SiteLido {
  nome?: string;
  nomeBreve?: string;
  slogan?: string;
  dominio?: string;
  cnpj?: string | null;
  anoFundacao?: number | null;
  nap: Partial<Record<CampoNap, string>> & { enderecoFormatado?: string };
  horarios: Horario[];
  redes: Rede[];
  googleAnalyticsId?: string;
  metaPixelId?: string;
  googleTagManagerId?: string;
  googleVerificacao?: string;
  bingVerificacao?: string;
}

function lerObjetoDeStrings(s: string, abre: number): Record<string, string> {
  const o = objetoEm(s, abre);
  const r: Record<string, string> = {};
  for (const e of o.entradas) {
    const v = lerString(s, e);
    if (v !== undefined) r[e.chave] = v;
  }
  return r;
}

function lerLista(s: string, e: Entrada | undefined): Record<string, string>[] {
  if (!e || s[e.iniValor] !== "[") return [];
  return elementosDoArray(s, e.iniValor).elementos
    .filter((el) => s[el.ini] === "{")
    .map((el) => lerObjetoDeStrings(s, el.ini));
}

export function lerSite(s: string): SiteLido {
  const o = objetoSite(s);
  const str = (k: string) => { const e = achar(o, k); return e ? lerString(s, e) : undefined; };
  const cnpjE = achar(o, "cnpj");
  const anoE = achar(o, "anoFundacao");
  const napE = achar(o, "nap");
  return {
    nome: str("nome"),
    nomeBreve: str("nomeBreve"),
    slogan: str("slogan"),
    dominio: str("dominio"),
    cnpj: cnpjE ? (lerString(s, cnpjE) ?? (s.slice(cnpjE.iniValor, cnpjE.fimValor).trim() === "null" ? null : undefined)) : undefined,
    anoFundacao: anoE ? lerNumero(s, anoE) : undefined,
    nap: napE && s[napE.iniValor] === "{" ? lerObjetoDeStrings(s, napE.iniValor) : {},
    horarios: lerLista(s, achar(o, "horarios")).map((h) => ({ dia: h.dia ?? "", hora: h.hora ?? "" })),
    redes: lerLista(s, achar(o, "redes")).map((r) => ({ nome: r.nome ?? "", href: r.href ?? "" })),
    googleAnalyticsId: str("googleAnalyticsId"),
    metaPixelId: str("metaPixelId"),
    googleTagManagerId: str("googleTagManagerId"),
    googleVerificacao: str("googleVerificacao"),
    bingVerificacao: str("bingVerificacao"),
  };
}

// ─── Validação (usada também pelas telas) ────────────────────────────────────

const digitos = (v: string) => v.replace(/\D/g, "");

export function cepValido(v: string): boolean {
  return /^\d{5}-?\d{3}$/.test(v.trim());
}
export function telefoneValido(v: string): boolean {
  const d = digitos(v);
  return d.length === 10 || d.length === 11;
}
export function whatsappValido(v: string): boolean {
  const d = digitos(v);
  return d.length >= 10 && d.length <= 13;
}
export function emailValido(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
export function ufValida(v: string): boolean {
  return /^[A-Za-z]{2}$/.test(v.trim());
}
export function urlValida(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return (u.protocol === "http:" || u.protocol === "https:") && !!u.hostname.includes(".");
  } catch {
    return false;
  }
}
export function cnpjValido(v: string): boolean {
  const d = digitos(v);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv = (base: string, pesos: number[]) => {
    const soma = base.split("").reduce((a, n, i) => a + Number(n) * pesos[i], 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, ...p1];
  return dv(d.slice(0, 12), p1) === Number(d[12]) && dv(d.slice(0, 13), p2) === Number(d[13]);
}
/** "não possui" é resposta válida para quem não tem CNPJ (regra da Fase 2). */
export function semCnpj(v: string): boolean {
  return /^n[ãa]o possui$/i.test(v.trim());
}

export function normalizarCep(v: string): string {
  const d = digitos(v);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : v.trim();
}
export function normalizarDominio(v: string): string {
  const t = v.trim().replace(/\/+$/, "");
  return t && !/^https?:\/\//i.test(t) ? `https://${t}` : t;
}

// ─── Patch ────────────────────────────────────────────────────────────────────

export interface PatchSite {
  nome?: string;
  nomeBreve?: string;
  slogan?: string;
  dominio?: string;
  cnpj?: string;
  anoFundacao?: number | string | null;
  nap?: Partial<Record<CampoNap, string>>;
  horarios?: Horario[];
  /** chave em minúsculas (instagram, facebook…) → URL. "" remove a rede (com `limpar`). */
  redes?: Record<string, string>;
  googleAnalyticsId?: string;
  metaPixelId?: string;
  googleTagManagerId?: string;
  googleVerificacao?: string;
  bingVerificacao?: string;
  /** Campos que o usuário APAGOU de propósito ("nap.bairro", "redes.instagram", "horarios"). */
  limpar?: string[];
}

const NOMES_REDES: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", linkedin: "LinkedIn",
  tiktok: "TikTok", twitter: "Twitter", pinterest: "Pinterest",
};

/**
 * Converte o corpo que as telas mandam (campos soltos na raiz e/ou aninhados,
 * `tagline` como apelido de `slogan`) num PatchSite. Devolve também o que foi
 * recebido mas NÃO é gravável no site.ts, para a tela avisar em vez de mostrar
 * "Salvo" à toa.
 */
export function patchDeBody(body: Record<string, unknown>): { patch: PatchSite; naoSuportados: string[] } {
  const patch: PatchSite = {};
  const naoSuportados: string[] = [];
  const nap: Partial<Record<CampoNap, string>> = {};
  const napBody = (body.nap ?? {}) as Record<string, unknown>;
  const redesBody = (body.redes ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

  for (const c of CAMPOS_NAP) {
    const v = body[c] !== undefined ? body[c] : napBody[c];
    if (v !== undefined) nap[c] = str(v);
  }
  if (Object.keys(nap).length) patch.nap = nap;

  for (const k of ["nome", "nomeBreve", "dominio", "cnpj", ...CAMPOS_INTEGRACAO] as const) {
    if (body[k] !== undefined) (patch as Record<string, unknown>)[k] = str(body[k]);
  }
  const slogan = body.slogan !== undefined ? body.slogan : body.tagline;
  if (slogan !== undefined) patch.slogan = str(slogan);
  if (body.anoFundacao !== undefined) patch.anoFundacao = body.anoFundacao as number | string | null;

  if (Array.isArray(body.horarios)) patch.horarios = body.horarios as Horario[];

  const redes: Record<string, string> = {};
  for (const k of Object.keys(NOMES_REDES)) {
    const v = body[k] !== undefined ? body[k] : redesBody[k];
    if (v !== undefined) redes[k] = str(v);
  }
  if (Object.keys(redes).length) patch.redes = redes;

  if (Array.isArray(body.limpar)) patch.limpar = body.limpar.map(String);

  // O que chegou mas não vira campo do site.ts
  const conhecidos = new Set([
    "nome", "nomeBreve", "slogan", "tagline", "dominio", "cnpj", "anoFundacao", "nap", "redes", "horarios",
    "limpar", "legalPainel", ...CAMPOS_NAP, ...CAMPOS_INTEGRACAO, ...Object.keys(NOMES_REDES),
  ]);
  for (const k of Object.keys(body)) if (!conhecidos.has(k)) naoSuportados.push(k);

  return { patch, naoSuportados };
}

export function validarPatch(p: PatchSite): Record<string, string> {
  const e: Record<string, string> = {};
  const vazio = (v: unknown) => v === undefined || v === null || String(v).trim() === "";

  if (p.nome !== undefined && p.nome.trim().length < 2) e.nome = "Informe o nome do negócio (mínimo 2 caracteres).";
  if (!vazio(p.dominio) && !urlValida(normalizarDominio(p.dominio!))) e.dominio = "Domínio inválido (ex.: meusite.com.br).";
  if (!vazio(p.cnpj) && !semCnpj(p.cnpj!) && !cnpjValido(p.cnpj!)) e.cnpj = "CNPJ inválido — confira os 14 dígitos (ou escreva \"não possui\").";
  if (!vazio(p.anoFundacao)) {
    const a = Number(p.anoFundacao);
    if (!Number.isInteger(a) || a < 1800 || a > new Date().getFullYear()) e.anoFundacao = "Ano de fundação inválido.";
  }
  const n = p.nap ?? {};
  if (!vazio(n.cep) && !cepValido(n.cep!)) e["nap.cep"] = "CEP inválido — use 8 dígitos (ex.: 13201-000).";
  if (!vazio(n.telefone) && !telefoneValido(n.telefone!)) e["nap.telefone"] = "Telefone inválido — use DDD + número.";
  if (!vazio(n.telefone2) && !telefoneValido(n.telefone2!)) e["nap.telefone2"] = "Telefone secundário inválido — use DDD + número.";
  if (!vazio(n.whatsapp) && !whatsappValido(n.whatsapp!)) e["nap.whatsapp"] = "WhatsApp inválido — use DDD + número (com 55, se preferir).";
  if (!vazio(n.email) && !emailValido(n.email!)) e["nap.email"] = "E-mail inválido.";
  if (!vazio(n.uf) && !ufValida(n.uf!)) e["nap.uf"] = "UF inválida — use 2 letras (ex.: SP).";
  if (n.cidade !== undefined && !vazio(n.cidade) && n.cidade.trim().length < 2) e["nap.cidade"] = "Cidade inválida.";
  for (const [k, v] of Object.entries(p.redes ?? {})) {
    if (!vazio(v) && !urlValida(v)) e[`redes.${k}`] = "Endereço inválido — use o link completo (https://...).";
  }
  for (const [i, h] of (p.horarios ?? []).entries()) {
    if (vazio(h.dia) || vazio(h.hora)) e[`horarios.${i}`] = "Preencha o dia e o horário.";
  }
  for (const k of CAMPOS_INTEGRACAO) {
    const v = p[k];
    if (!vazio(v) && !/^[\w.\-]+$/.test(String(v).trim())) e[k] = "Identificador inválido (sem espaços ou símbolos).";
  }
  return e;
}

export interface ResultadoPatch {
  src: string;
  alterados: string[];
  /** Campos que chegaram vazios sobre valor existente, sem confirmação de que o usuário apagou. */
  ignorados: { campo: string; motivo: string }[];
  erros: Record<string, string>;
}

/** Monta o endereço formatado que o site usa nos links de mapa (mesmo padrão dos layouts). */
export function enderecoFormatado(n: Partial<Record<CampoNap, string>>): string {
  const p1 = [n.logradouro, n.complemento].map((x) => (x ?? "").trim()).filter(Boolean).join(" — ");
  let local = [n.bairro, n.cidade].map((x) => (x ?? "").trim()).filter(Boolean).join(", ");
  const uf = (n.uf ?? "").trim().toUpperCase();
  if (uf) local += local ? ` — ${uf}` : uf;
  let r = [p1, local].filter(Boolean).join(", ");
  const cep = (n.cep ?? "").trim();
  if (cep) r += ` · CEP ${cep}`;
  return r;
}

function ehLimpar(p: PatchSite, ...nomes: string[]): boolean {
  return (p.limpar ?? []).some((l) => nomes.includes(l));
}

/**
 * Aplica o patch ao texto do site.ts. Não grava nada: devolve o texto novo, o
 * que mudou, o que foi ignorado e os erros de validação (com erros, `src` volta
 * IGUAL ao original). Lança se o resultado não passar na conferência de
 * integridade — nesse caso nada deve ser gravado.
 */
export function aplicarPatch(original: string, patchEntrada: PatchSite): ResultadoPatch {
  const erros = validarPatch(patchEntrada);
  const alterados: string[] = [];
  const ignorados: { campo: string; motivo: string }[] = [];
  if (Object.keys(erros).length) return { src: original, alterados, ignorados, erros };

  const antes = lerSite(original);
  let s = original;
  const esperado: { ler: (x: SiteLido) => unknown; valor: unknown; nome: string }[] = [];

  const definirStr = (caminho: string[], valor: string, nome: string, ler: (x: SiteLido) => unknown) => {
    const r = definirNoObjetoAninhado(s, caminho, literal(valor));
    s = r.s;
    if (r.acao !== "igual") alterados.push(nome);
    esperado.push({ ler, valor, nome });
  };

  // ── raiz ────────────────────────────────────────────────────────────────
  const p = patchEntrada;
  if (p.nome !== undefined) definirStr(["nome"], p.nome.trim(), "nome", (x) => x.nome);
  if (p.nomeBreve !== undefined) definirStr(["nomeBreve"], p.nomeBreve.trim(), "nomeBreve", (x) => x.nomeBreve);
  if (p.slogan !== undefined) definirStr(["slogan"], p.slogan.trim(), "slogan", (x) => x.slogan);
  if (p.dominio !== undefined && p.dominio.trim()) {
    definirStr(["dominio"], normalizarDominio(p.dominio), "dominio", (x) => x.dominio);
  }
  if (p.cnpj !== undefined) {
    const v = p.cnpj.trim();
    if (v) definirStr(["cnpj"], v, "cnpj", (x) => x.cnpj);
    else if (antes.cnpj) {
      const r = definirNoObjetoAninhado(s, ["cnpj"], "null");
      s = r.s;
      if (r.acao !== "igual") alterados.push("cnpj");
      esperado.push({ ler: (x) => x.cnpj, valor: null, nome: "cnpj" });
    }
  }
  if (p.anoFundacao !== undefined) {
    const vazio = p.anoFundacao === null || String(p.anoFundacao).trim() === "";
    const lit = vazio ? "null" : String(Number(p.anoFundacao));
    const r = definirNoObjetoAninhado(s, ["anoFundacao"], lit);
    s = r.s;
    if (r.acao !== "igual") alterados.push("anoFundacao");
    esperado.push({ ler: (x) => x.anoFundacao, valor: vazio ? null : Number(p.anoFundacao), nome: "anoFundacao" });
  }
  for (const k of CAMPOS_INTEGRACAO) {
    if (p[k] !== undefined) definirStr([k], String(p[k]).trim(), k, (x) => x[k]);
  }

  // ── nap ─────────────────────────────────────────────────────────────────
  let napMudou = false;
  for (const c of CAMPOS_NAP) {
    let v = p.nap?.[c];
    if (v === undefined) continue;
    v = v.trim();
    const atual = antes.nap[c] ?? "";
    if (v === "" && atual !== "" && !ehLimpar(p, `nap.${c}`, c)) {
      ignorados.push({ campo: `nap.${c}`, motivo: "veio vazio sobre um valor existente sem confirmação de que foi apagado" });
      continue;
    }
    if (v === "" && atual === "" && !(c in antes.nap)) continue; // não cria chave vazia
    if (c === "uf") v = v.toUpperCase();
    if (c === "cep") v = normalizarCep(v);
    const antesLen = alterados.length;
    definirStr(["nap", c], v, `nap.${c}`, (x) => x.nap[c]);
    if (alterados.length > antesLen && ["logradouro", "complemento", "bairro", "cidade", "uf", "cep"].includes(c)) napMudou = true;
  }
  if (napMudou) {
    const atualNap = lerSite(s).nap;
    if (atualNap.enderecoFormatado !== undefined) {
      const novo = enderecoFormatado(atualNap);
      if (novo && novo !== atualNap.enderecoFormatado) {
        definirStr(["nap", "enderecoFormatado"], novo, "nap.enderecoFormatado", (x) => x.nap.enderecoFormatado);
      }
    }
  }

  // ── horários ────────────────────────────────────────────────────────────
  if (p.horarios !== undefined) {
    const novos = p.horarios.map((h) => ({ dia: h.dia.trim(), hora: h.hora.trim() }));
    if (novos.length === 0 && antes.horarios.length > 0 && !ehLimpar(p, "horarios")) {
      ignorados.push({ campo: "horarios", motivo: "lista vazia sobre horários existentes sem confirmação" });
    } else if (JSON.stringify(novos) !== JSON.stringify(antes.horarios)) {
      const o = objetoSite(s);
      const e = achar(o, "horarios");
      const ind = indentacaoDe(s, (e ?? o.entradas[0]).iniChave);
      const lit = novos.length
        ? "[\n" + novos.map((h) => `${ind}  { dia: ${literal(h.dia)}, hora: ${literal(h.hora)} },`).join("\n") + `\n${ind}]`
        : "[]";
      if (e) s = s.slice(0, e.iniValor) + lit + s.slice(e.fimValor);
      else s = definirEmObjeto(s, o.abre, "horarios", lit).s;
      alterados.push("horarios");
      esperado.push({ ler: (x) => x.horarios, valor: novos, nome: "horarios" });
    }
  }

  // ── redes ───────────────────────────────────────────────────────────────
  for (const [chave, hrefBruto] of Object.entries(p.redes ?? {})) {
    const nomeRede = NOMES_REDES[chave];
    if (!nomeRede) continue;
    const href = hrefBruto.trim();
    const o = objetoSite(s);
    const e = achar(o, "redes");
    if (!e || s[e.iniValor] !== "[") {
      throw new Error("site-config: campo 'redes' não é um array no config/site.ts");
    }
    const { elementos, fecha } = elementosDoArray(s, e.iniValor);
    const idx = elementos.findIndex((el) => {
      if (s[el.ini] !== "{") return false;
      const n = lerObjetoDeStrings(s, el.ini).nome;
      return (n ?? "").toLowerCase() === nomeRede.toLowerCase();
    });
    const atual = idx >= 0 ? (lerObjetoDeStrings(s, elementos[idx].ini).href ?? "") : "";
    if (href === "") {
      if (idx >= 0 && atual !== "") {
        if (!ehLimpar(p, `redes.${chave}`, chave)) {
          ignorados.push({ campo: `redes.${chave}`, motivo: "veio vazio sobre uma rede existente sem confirmação de que foi apagada" });
          continue;
        }
        // remove o elemento (e a linha, se ele estiver sozinho nela)
        const el = elementos[idx];
        let ini = el.ini;
        const ls = s.lastIndexOf("\n", ini - 1) + 1;
        if (/^[ \t]*$/.test(s.slice(ls, ini))) ini = ls;
        const fimLinha = s[el.fimComVirgula] === "\n" ? el.fimComVirgula + 1 : el.fimComVirgula;
        s = s.slice(0, ini) + s.slice(fimLinha);
        alterados.push(`redes.${chave}`);
        esperado.push({ ler: (x) => x.redes.find((r) => r.nome.toLowerCase() === nomeRede.toLowerCase())?.href, valor: undefined, nome: `redes.${chave}` });
      }
      continue;
    }
    if (!urlValida(href)) continue; // já barrado na validação
    if (idx >= 0) {
      const r = definirEmObjeto(s, elementos[idx].ini, "href", literal(href));
      s = r.s;
      if (r.acao !== "igual") alterados.push(`redes.${chave}`);
    } else {
      const novoEl = `{ nome: ${literal(nomeRede)}, href: ${literal(href)} }`;
      const ult = elementos[elementos.length - 1];
      if (!ult) {
        s = s.slice(0, fecha) + `\n${indentacaoDe(s, e.iniChave)}  ${novoEl},\n${indentacaoDe(s, e.iniChave)}` + s.slice(fecha);
      } else {
        const ind = indentacaoDe(s, ult.ini);
        const temVirg = s[ult.fimComVirgula - 1] === ",";
        const ponto = ult.fimComVirgula;
        s = s.slice(0, ponto) + (temVirg ? "" : ",") + `\n${ind}${novoEl},` + s.slice(ponto);
      }
      alterados.push(`redes.${chave}`);
    }
    esperado.push({ ler: (x) => x.redes.find((r) => r.nome.toLowerCase() === nomeRede.toLowerCase())?.href, valor: href, nome: `redes.${chave}` });
  }

  // ── conferência de integridade ──────────────────────────────────────────
  if (s === original) return { src: original, alterados, ignorados, erros };
  const depois = lerSite(s); // lança se o arquivo deixou de ser lido
  for (const ex of esperado) {
    const lido = ex.ler(depois);
    if (JSON.stringify(lido) !== JSON.stringify(ex.valor)) {
      throw new Error(`site-config: conferência falhou em '${ex.nome}' (esperava ${JSON.stringify(ex.valor)}, leu ${JSON.stringify(lido)}) — nada foi gravado`);
    }
  }
  // o que NÃO foi pedido não pode ter mudado
  const tocados = new Set(esperado.map((x) => x.nome.split(".")[0]));
  const chavesRaiz: (keyof SiteLido)[] = ["nome", "nomeBreve", "slogan", "dominio", "cnpj", "anoFundacao", "googleAnalyticsId", "metaPixelId", "googleTagManagerId", "googleVerificacao", "bingVerificacao"];
  for (const k of chavesRaiz) {
    if (!tocados.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(depois[k])) {
      throw new Error(`site-config: '${k}' mudou sem ter sido pedido — nada foi gravado`);
    }
  }
  for (const c of CAMPOS_NAP) {
    if (!alterados.includes(`nap.${c}`) && antes.nap[c] !== depois.nap[c]) {
      throw new Error(`site-config: 'nap.${c}' mudou sem ter sido pedido — nada foi gravado`);
    }
  }
  return { src: s, alterados, ignorados, erros };
}
