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

/** Valor de um literal simples (string, número, booleano, null, array, objeto); undefined se não der para ler. */
function valorDe(s: string, ini: number, fim: number): unknown {
  const t = s.slice(ini, fim);
  if (!t.trim()) return undefined;
  const q = t[0];
  if (q === "'" || q === '"' || q === "`") {
    if (t.length < 2 || t[t.length - 1] !== q || (q === "`" && t.includes("${"))) return undefined;
    return desescapar(t.slice(1, -1));
  }
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (q === "[") {
    const { elementos } = elementosDoArray(s, ini);
    const r: unknown[] = [];
    for (const el of elementos) {
      const v = valorDe(s, el.ini, el.fim);
      if (v === undefined) return undefined;
      r.push(v);
    }
    return r;
  }
  if (q === "{") {
    const o = objetoEm(s, ini);
    const r: Record<string, unknown> = {};
    for (const e of o.entradas) {
      const v = valorDe(s, e.iniValor, e.fimValor);
      if (v !== undefined) r[e.chave] = v;
    }
    return r;
  }
  return undefined;
}

/** Escreve um valor JSON-like como literal TypeScript (aspas simples, listas curtas numa linha). */
function renderValor(v: unknown, ind: string): string {
  if (v === null) return "null";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (typeof v === "string") return literal(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.every((x) => typeof x === "string")) {
      const uma = "[" + v.map((x) => literal(x as string)).join(", ") + "]";
      if (uma.length <= 90) return uma;
      return "[\n" + v.map((x) => `${ind}  ${literal(x as string)},`).join("\n") + `\n${ind}]`;
    }
    return "[\n" + v.map((x) => `${ind}  ${renderValor(x, ind + "  ")},`).join("\n") + `\n${ind}]`;
  }
  if (v && typeof v === "object") {
    const ent = Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined);
    if (!ent.length) return "{}";
    const uma = "{ " + ent.map(([k, x]) => `${k}: ${renderValor(x, ind)}`).join(", ") + " }";
    if (uma.length <= 110 && !uma.includes("\n")) return uma;
    return "{\n" + ent.map(([k, x]) => `${ind}  ${k}: ${renderValor(x, ind + "  ")},`).join("\n") + `\n${ind}}`;
  }
  return "null";
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

// ─── Edição genérica por caminho (usada pelo bloco `legal` e por qualquer sub-objeto) ───

function eqJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Posição do "{" do objeto em `caminho` (a partir de `site`); undefined se algum trecho não for objeto. */
function abreEm(s: string, caminho: string[]): number | undefined {
  let o = objetoSite(s);
  for (const seg of caminho) {
    const e = achar(o, seg);
    if (!e || s[e.iniValor] !== "{") return undefined;
    o = objetoEm(s, e.iniValor);
  }
  return o.abre;
}

/** Garante que `caminho` exista como objetos aninhados, criando `{}` onde faltar. */
function garantirCaminho(s: string, caminho: string[]): string {
  for (let i = 1; i <= caminho.length; i++) {
    const parcial = caminho.slice(0, i);
    if (abreEm(s, parcial) !== undefined) continue;
    const abrePai = abreEm(s, parcial.slice(0, -1));
    if (abrePai === undefined) throw new Error(`site-config: '${parcial.slice(0, -1).join(".")}' não é um objeto no config/site.ts`);
    s = definirEmObjeto(s, abrePai, parcial[parcial.length - 1], "{}").s;
  }
  return s;
}

/** Valor em `caminho` (objetos aninhados a partir de `site`), parseado; undefined se ausente. */
export function lerValorNoCaminho(s: string, caminho: string[]): unknown {
  const pai = caminho.length > 1 ? abreEm(s, caminho.slice(0, -1)) : objetoSite(s).abre;
  if (pai === undefined) return undefined;
  const e = achar(objetoEm(s, pai), caminho[caminho.length - 1]);
  return e ? valorDe(s, e.iniValor, e.fimValor) : undefined;
}

/** Define o valor em `caminho` (cria objetos e a chave se faltarem). Devolve o texto novo e se mudou. */
export function definirValorNoCaminho(s: string, caminho: string[], valor: unknown): { s: string; mudou: boolean } {
  s = garantirCaminho(s, caminho.slice(0, -1));
  const abre = caminho.length > 1 ? (abreEm(s, caminho.slice(0, -1)) as number) : objetoSite(s).abre;
  const o = objetoEm(s, abre);
  const chave = caminho[caminho.length - 1];
  const e = achar(o, chave);
  if (e) {
    if (eqJson(valorDe(s, e.iniValor, e.fimValor), valor)) return { s, mudou: false };
    return { s: s.slice(0, e.iniValor) + renderValor(valor, indentacaoDe(s, e.iniChave)) + s.slice(e.fimValor), mudou: true };
  }
  const ult = o.entradas[o.entradas.length - 1];
  const ind = ult ? indentacaoDe(s, ult.iniChave) : indentacaoDe(s, abre) + "  ";
  return { s: definirEmObjeto(s, abre, chave, renderValor(valor, ind)).s, mudou: true };
}

function arrayEm(s: string, caminho: string[]): { ini: number; elementos: Elemento[]; fecha: number } | undefined {
  const pai = caminho.length > 1 ? abreEm(s, caminho.slice(0, -1)) : objetoSite(s).abre;
  if (pai === undefined) return undefined;
  const e = achar(objetoEm(s, pai), caminho[caminho.length - 1]);
  if (!e || s[e.iniValor] !== "[") return undefined;
  const { elementos, fecha } = elementosDoArray(s, e.iniValor);
  return { ini: e.iniValor, elementos, fecha };
}

/** Elementos (objetos) da lista em `caminho`, já parseados. */
export function lerListaNoCaminho(s: string, caminho: string[]): Record<string, unknown>[] {
  const a = arrayEm(s, caminho);
  if (!a) return [];
  return a.elementos.map((el) => (valorDe(s, el.ini, el.fim) ?? {}) as Record<string, unknown>);
}

/** Atualiza campos (string) do elemento `idx` da lista em `caminho`. */
export function atualizarElementoNaLista(s: string, caminho: string[], idx: number, campos: Record<string, string>): { s: string; mudou: boolean } {
  let mudou = false;
  for (const [k, v] of Object.entries(campos)) {
    const a = arrayEm(s, caminho);
    if (!a || !a.elementos[idx] || s[a.elementos[idx].ini] !== "{") throw new Error(`site-config: elemento ${idx} de '${caminho.join(".")}' não encontrado`);
    const r = definirEmObjeto(s, a.elementos[idx].ini, k, literal(v));
    s = r.s;
    if (r.acao !== "igual") mudou = true;
  }
  return { s, mudou };
}

/** Acrescenta um elemento (objeto de strings) ao fim da lista em `caminho`; cria a lista se faltar. */
export function acrescentarElementoNaLista(s: string, caminho: string[], obj: Record<string, string>): string {
  const item = renderValor(obj, "");
  let a = arrayEm(s, caminho);
  if (!a) {
    s = definirValorNoCaminho(s, caminho, [obj]).s;
    return s;
  }
  const chave = caminho[caminho.length - 1];
  const pai = caminho.length > 1 ? (abreEm(s, caminho.slice(0, -1)) as number) : objetoSite(s).abre;
  const eArr = achar(objetoEm(s, pai), chave) as Entrada;
  const ind = a.elementos.length ? indentacaoDe(s, a.elementos[a.elementos.length - 1].ini) : indentacaoDe(s, eArr.iniChave) + "  ";
  if (!a.elementos.length) {
    return s.slice(0, a.ini + 1) + `\n${ind}${item},\n${indentacaoDe(s, eArr.iniChave)}` + s.slice(a.fecha);
  }
  const ult = a.elementos[a.elementos.length - 1];
  const temVirg = s[ult.fimComVirgula - 1] === ",";
  return s.slice(0, ult.fimComVirgula) + (temVirg ? "" : ",") + `\n${ind}${item},` + s.slice(ult.fimComVirgula);
}

/**
 * Percorre os `href` (literais de string) dentro das listas do site indicadas em `chaves`
 * (ex.: "nav", "navFooterColunas"), em qualquer profundidade (filhos, itens). Para cada um chama
 * `troca(href, label)`: se devolver outro texto, só aquele literal é reescrito (mesma aspa, mesma
 * posição); o resto do arquivo fica byte a byte igual. Devolve o texto novo e todos os hrefs vistos.
 */
export function percorrerHrefsDoMenu(
  s: string,
  chaves: string[],
  troca?: (href: string, label: string) => string | null | undefined,
): { s: string; hrefs: { href: string; label: string; lista: string }[]; alterados: number } {
  const hrefs: { href: string; label: string; lista: string }[] = [];
  const subs: { ini: number; fim: number; novo: string }[] = [];

  const visitar = (ini: number, lista: string) => {
    const c = s[ini];
    if (c === "[") {
      for (const el of elementosDoArray(s, ini).elementos) visitar(el.ini, lista);
    } else if (c === "{") {
      const o = objetoEm(s, ini);
      const lab = o.entradas.find((e) => e.chave === "label" || e.chave === "titulo");
      const label = lab ? lerString(s, lab) ?? "" : "";
      for (const e of o.entradas) {
        if (e.chave === "href") {
          const href = lerString(s, e);
          if (href === undefined) continue;
          hrefs.push({ href, label, lista });
          const novo = troca?.(href, label);
          if (novo && novo !== href) {
            const q = s[e.iniValor];
            const lit = q === "'" ? literal(novo) : q === '"' ? JSON.stringify(novo) : "`" + novo.replace(/[`\\$]/g, "\\$&") + "`";
            subs.push({ ini: e.iniValor, fim: e.fimValor, novo: lit });
          }
        } else if (s[e.iniValor] === "[" || s[e.iniValor] === "{") visitar(e.iniValor, lista);
      }
    }
  };

  const site = objetoSite(s);
  for (const chave of chaves) {
    const e = achar(site, chave);
    if (e && (s[e.iniValor] === "[" || s[e.iniValor] === "{")) visitar(e.iniValor, chave);
  }
  let r = s;
  for (const x of subs.sort((a, b) => b.ini - a.ini)) r = r.slice(0, x.ini) + x.novo + r.slice(x.fim);
  return { s: r, hrefs, alterados: subs.length };
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

export type DiaSemana = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
export const DIAS_SEMANA: DiaSemana[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
export interface Funcionamento { dias: DiaSemana[]; abre: string; fecha: string; fechado?: boolean }
export interface LogoSite { src?: string; srcEscuro?: string; alt?: string }
export interface CredencialSite { conselho?: string; registro?: string; responsavel?: string }

/** Campos de texto simples na raiz do site (identidade, SEO, mídia). */
export const CAMPOS_TEXTO = ["razaoSocial", "descricao", "favicon", "ogImagem", "especialidade", "faixaPreco"] as const;
export type CampoTexto = (typeof CAMPOS_TEXTO)[number];

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
  razaoSocial?: string;
  descricao?: string;
  favicon?: string;
  ogImagem?: string;
  especialidade?: string;
  faixaPreco?: string;
  logo?: LogoSite;
  credencial?: CredencialSite;
  schemaTipo?: string[];
  areaAtendimento?: string[];
  funcionamento?: Funcionamento[];
  atendimentoOnline?: boolean;
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
  const val = (k: string) => { const e = achar(o, k); return e ? valorDe(s, e.iniValor, e.fimValor) : undefined; };
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
    razaoSocial: str("razaoSocial"),
    descricao: str("descricao"),
    favicon: str("favicon"),
    ogImagem: str("ogImagem"),
    especialidade: str("especialidade"),
    faixaPreco: str("faixaPreco"),
    logo: val("logo") as LogoSite | undefined,
    credencial: val("credencial") as CredencialSite | undefined,
    schemaTipo: val("schemaTipo") as string[] | undefined,
    areaAtendimento: val("areaAtendimento") as string[] | undefined,
    funcionamento: val("funcionamento") as Funcionamento[] | undefined,
    atendimentoOnline: val("atendimentoOnline") as boolean | undefined,
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

export function caminhoMidiaValido(v: string): boolean {
  const t = v.trim();
  return (t.startsWith("/") || /^https?:\/\//i.test(t)) && /\.(png|jpe?g|webp|svg|gif|avif|ico)(\?.*)?$/i.test(t);
}
export function horaValida(v: string): boolean {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(v.trim());
}

/** "Rua A, 123" → { rua: "Rua A", numero: "123" }. O número vai junto do logradouro no site. */
export function separarNumero(logradouro: string): { rua: string; numero: string } {
  const m = /^(.*?),\s*(\d+[A-Za-z]?(?:[-/]\d+)?|s\/n|S\/N)\s*$/.exec(logradouro.trim());
  return m ? { rua: m[1].trim(), numero: m[2] } : { rua: logradouro.trim(), numero: "" };
}
export function juntarNumero(rua: string, numero: string): string {
  const r = rua.trim();
  const n = numero.trim();
  return n ? `${r}, ${n}` : r;
}

const NOME_DIA: Record<DiaSemana, string> = {
  seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo",
};
function rotuloDias(dias: DiaSemana[]): string {
  const idx = [...new Set(dias)].map((d) => DIAS_SEMANA.indexOf(d)).filter((i) => i >= 0).sort((a, b) => a - b);
  if (!idx.length) return "";
  const nome = (i: number) => NOME_DIA[DIAS_SEMANA[i]];
  if (idx.length === 1) return nome(idx[0]);
  if (idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)) return `${nome(idx[0])} a ${nome(idx[idx.length - 1])}`;
  const nomes = idx.map(nome);
  return nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
}
function horaCurta(v: string): string {
  const [h, m] = v.split(":");
  return `${Number(h)}h${m && m !== "00" ? m : ""}`;
}
/** Texto que as páginas exibem ({dia, hora}) a partir do editor estruturado. */
export function derivarHorarios(func: Funcionamento[]): Horario[] {
  return func
    .filter((f) => f.dias?.length)
    .map((f) => ({ dia: rotuloDias(f.dias), hora: f.fechado ? "Fechado" : `${horaCurta(f.abre)} às ${horaCurta(f.fecha)}` }));
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
  razaoSocial?: string;
  descricao?: string;
  favicon?: string;
  ogImagem?: string;
  especialidade?: string;
  faixaPreco?: string;
  logo?: LogoSite;
  credencial?: CredencialSite;
  schemaTipo?: string[];
  areaAtendimento?: string[];
  /** Editor estruturado de horários. Se vier sem `horarios`, o texto exibido é derivado dele. */
  funcionamento?: Funcionamento[];
  atendimentoOnline?: boolean;
  /** Campos que o usuário APAGOU de propósito ("nap.bairro", "redes.instagram", "horarios"). */
  limpar?: string[];
}

const NOMES_REDES: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", linkedin: "LinkedIn",
  tiktok: "TikTok", twitter: "Twitter", pinterest: "Pinterest", threads: "Threads",
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
  for (const k of CAMPOS_TEXTO) if (body[k] !== undefined) patch[k] = str(body[k]);
  if (body.logo && typeof body.logo === "object") patch.logo = body.logo as LogoSite;
  if (body.credencial && typeof body.credencial === "object") patch.credencial = body.credencial as CredencialSite;
  if (Array.isArray(body.schemaTipo)) patch.schemaTipo = body.schemaTipo.map(String);
  if (Array.isArray(body.areaAtendimento)) patch.areaAtendimento = body.areaAtendimento.map(String);
  if (Array.isArray(body.funcionamento)) patch.funcionamento = body.funcionamento as Funcionamento[];
  if (typeof body.atendimentoOnline === "boolean") patch.atendimentoOnline = body.atendimentoOnline;

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
    "limpar", "legalPainel", "logo", "credencial", "schemaTipo", "areaAtendimento", "funcionamento", "atendimentoOnline",
    ...CAMPOS_TEXTO, ...CAMPOS_NAP, ...CAMPOS_INTEGRACAO, ...Object.keys(NOMES_REDES),
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
  if (!vazio(p.razaoSocial) && p.razaoSocial!.trim().length < 2) e.razaoSocial = "Razão social inválida.";
  if (p.descricao !== undefined && p.descricao.trim().length > 320) e.descricao = "Descrição muito longa (máximo 320 caracteres).";
  if (!vazio(p.especialidade) && p.especialidade!.trim().length > 120) e.especialidade = "Especialidade muito longa.";
  if (!vazio(p.faixaPreco) && p.faixaPreco!.trim().length > 20) e.faixaPreco = "Faixa de preço muito longa (ex.: $$).";
  for (const k of ["favicon", "ogImagem"] as const) {
    if (!vazio(p[k]) && !caminhoMidiaValido(p[k]!)) e[k] = "Escolha uma imagem da biblioteca de mídia (png, jpg, webp, svg, ico).";
  }
  for (const k of ["src", "srcEscuro"] as const) {
    const v = p.logo?.[k];
    if (!vazio(v) && !caminhoMidiaValido(v!)) e[`logo.${k}`] = "Escolha uma imagem da biblioteca de mídia.";
  }
  if (p.credencial) {
    if ((p.credencial.conselho ?? "").length > 30) e["credencial.conselho"] = "Conselho muito longo.";
    if ((p.credencial.registro ?? "").length > 40) e["credencial.registro"] = "Registro muito longo.";
    if ((p.credencial.responsavel ?? "").length > 80) e["credencial.responsavel"] = "Nome do responsável muito longo.";
  }
  if (p.schemaTipo) {
    if (p.schemaTipo.length > 5) e.schemaTipo = "Use no máximo 5 tipos.";
    else if (p.schemaTipo.some((x) => x.trim() && !/^[A-Z][A-Za-z]+$/.test(x.trim()))) e.schemaTipo = "Tipo schema.org inválido (ex.: Dentist, LocalBusiness).";
  }
  if (p.areaAtendimento && p.areaAtendimento.length > 40) e.areaAtendimento = "Lista de áreas muito longa.";
  for (const [i, f] of (p.funcionamento ?? []).entries()) {
    const k = `funcionamento.${i}`;
    if (!Array.isArray(f.dias) || !f.dias.length || f.dias.some((d) => !DIAS_SEMANA.includes(d))) e[k] = "Escolha ao menos um dia da semana.";
    else if (!f.fechado) {
      if (!horaValida(f.abre ?? "") || !horaValida(f.fecha ?? "")) e[k] = "Horário inválido — use HH:MM.";
      else if ((f.abre ?? "") >= (f.fecha ?? "")) e[k] = "O horário de abertura deve ser antes do fechamento.";
    }
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

  // ── campos novos da raiz (texto, objetos, listas, booleano) ─────────────
  const igualJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const definirTop = (chave: string, valor: unknown) => {
    const o = objetoSite(s);
    const e = achar(o, chave);
    if (e) {
      const atual = valorDe(s, e.iniValor, e.fimValor);
      if (igualJson(atual, valor)) return;
      s = s.slice(0, e.iniValor) + renderValor(valor, indentacaoDe(s, e.iniChave)) + s.slice(e.fimValor);
    } else {
      const ult = o.entradas[o.entradas.length - 1];
      const ind = ult ? indentacaoDe(s, ult.iniChave) : "  ";
      s = definirEmObjeto(s, o.abre, chave, renderValor(valor, ind)).s;
    }
    alterados.push(chave);
    esperado.push({ ler: (x) => (x as unknown as Record<string, unknown>)[chave], valor, nome: chave });
  };

  for (const k of CAMPOS_TEXTO) {
    if (p[k] === undefined) continue;
    const v = p[k]!.trim();
    const atual = (antes[k] as string | undefined) ?? "";
    if (v === "" && atual !== "" && !ehLimpar(p, k)) {
      ignorados.push({ campo: k, motivo: "veio vazio sobre um valor existente sem confirmação de que foi apagado" });
      continue;
    }
    if (v === "" && atual === "") continue;
    definirTop(k, v);
  }

  for (const [chave, permitidos] of [["logo", ["src", "srcEscuro", "alt"]], ["credencial", ["conselho", "registro", "responsavel"]]] as const) {
    const pObj = p[chave] as Record<string, string> | undefined;
    if (!pObj) continue;
    const atualObj = ((antes[chave] as Record<string, string> | undefined) ?? {});
    const novo: Record<string, string> = { ...atualObj };
    for (const k of permitidos) {
      if (pObj[k] === undefined) continue;
      const v = String(pObj[k]).trim();
      if (v === "") {
        if (atualObj[k] && !ehLimpar(p, `${chave}.${k}`, chave)) {
          ignorados.push({ campo: `${chave}.${k}`, motivo: "veio vazio sobre um valor existente sem confirmação de que foi apagado" });
          continue;
        }
        delete novo[k];
      } else novo[k] = v;
    }
    if (Object.keys(novo).length === 0 && Object.keys(atualObj).length === 0) continue;
    definirTop(chave, novo);
  }

  for (const chave of ["schemaTipo", "areaAtendimento"] as const) {
    if (p[chave] === undefined) continue;
    const lista = [...new Set(p[chave]!.map((x) => x.trim()).filter(Boolean))];
    const atual = (antes[chave] as string[] | undefined) ?? [];
    if (lista.length === 0 && atual.length > 0 && !ehLimpar(p, chave)) {
      ignorados.push({ campo: chave, motivo: "lista vazia sobre valores existentes sem confirmação" });
      continue;
    }
    if (lista.length === 0 && atual.length === 0 && !(chave in antes)) continue;
    definirTop(chave, lista);
  }

  let horariosDerivados: Horario[] | undefined;
  if (p.funcionamento !== undefined) {
    const func = p.funcionamento.map((f) => {
      const dias = DIAS_SEMANA.filter((d) => f.dias.includes(d));
      return f.fechado
        ? { dias, fechado: true }
        : { dias, abre: f.abre.trim().padStart(5, "0"), fecha: f.fecha.trim().padStart(5, "0") };
    }) as Funcionamento[];
    const atual = antes.funcionamento ?? [];
    if (func.length === 0 && atual.length > 0 && !ehLimpar(p, "funcionamento")) {
      ignorados.push({ campo: "funcionamento", motivo: "lista vazia sobre horários existentes sem confirmação" });
    } else if (!(func.length === 0 && atual.length === 0 && !("funcionamento" in antes))) {
      definirTop("funcionamento", func);
      if (p.horarios === undefined) horariosDerivados = derivarHorarios(func);
    }
  }

  if (p.atendimentoOnline !== undefined) definirTop("atendimentoOnline", p.atendimentoOnline);

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
  const horariosPedidos = p.horarios ?? horariosDerivados;
  if (horariosPedidos !== undefined) {
    const novos = horariosPedidos.map((h) => ({ dia: h.dia.trim(), hora: h.hora.trim() }));
    if (novos.length === 0 && antes.horarios.length > 0 && !ehLimpar(p, "horarios") && p.funcionamento === undefined) {
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
  const chavesRaiz: (keyof SiteLido)[] = [
    "nome", "nomeBreve", "slogan", "dominio", "cnpj", "anoFundacao", "googleAnalyticsId", "metaPixelId",
    "googleTagManagerId", "googleVerificacao", "bingVerificacao", "razaoSocial", "descricao", "favicon", "ogImagem",
    "especialidade", "faixaPreco", "logo", "credencial", "schemaTipo", "areaAtendimento", "funcionamento", "atendimentoOnline",
  ];
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
