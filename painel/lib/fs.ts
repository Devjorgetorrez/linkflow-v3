/**
 * lib/fs.ts — Leitura e escrita de arquivos .md do cliente no servidor
 *
 * O painel roda no VPS e tem acesso direto ao sistema de arquivos.
 * LINKFLOW_DIR: pasta raiz do motor Astro isolado deste cliente
 * (obrigatória, sem default: um default apontaria para a pasta de OUTRO
 * cliente). Cada cliente já tem sua própria
 * cópia do motor com só o tema dele (promoção de tema, vps-setup) —
 * por isso os caminhos abaixo são fixos, sem aninhar por slug:
 * content/servicos/, content/posts/, config/site.ts, sempre os mesmos,
 * nunca content/<slug>/ nem config/<slug>.ts.
 */

import fs from "fs";
import path from "path";

// ─── Configuração ─────────────────────────────────────────────────────────────

export function getLinkflowDir(): string {
  const dir = process.env.LINKFLOW_DIR;
  if (!dir) {
    throw new Error(
      "LINKFLOW_DIR não definido — configure a pasta do site deste cliente no .env do painel.",
    );
  }
  return dir;
}

export function getSiteSlug(): string {
  return process.env.LINKFLOW_SLUG ?? "default";
}

export function getContentDir(): string {
  return path.join(getLinkflowDir(), "_astro/src/content");
}

export function getConfigPath(): string {
  return path.join(getLinkflowDir(), "_astro/src/config", "site.ts");
}

/**
 * Rota final do pilar de oferta do site: "/servicos" na maioria dos layouts,
 * "/planos" no tema-07 (campo `rotaPilar` do config/site.ts). Sempre com a
 * barra inicial e sem barra final.
 */
export function getRotaPilar(): string {
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    const m = raw.match(/rotaPilar\s*:\s*['"]([^'"]+)['"]/);
    if (m) {
      const rota = "/" + m[1].replace(/^\/+|\/+$/g, "");
      if (rota.length > 1) return rota;
    }
  } catch {
    /* sem config: cai no padrão */
  }
  return "/servicos";
}

/**
 * Layout (base do motor) que este site usa: "base" | "tema-03" … "tema-07".
 * Lido do marcador que scripts/promover_tema.py grava em _astro/tema-ativo.json.
 * null = site sem marcador (criado antes dele existir, ou ainda não promovido).
 */
export function getTemaAtivo(): string | null {
  try {
    const raw = fs.readFileSync(path.join(getLinkflowDir(), "_astro", "tema-ativo.json"), "utf-8");
    const tema = JSON.parse(raw)?.tema;
    return typeof tema === "string" && tema ? tema : null;
  } catch {
    return null;
  }
}

// ─── Frontmatter parser simples (sem dependências externas) ───────────────────

export interface ParsedMd {
  frontmatter: Record<string, unknown>;
  content: string;
}

export function parseMd(raw: string): ParsedMd {
  raw = raw.replace(/\r\n/g, "\n"); // arquivo salvo no Windows (CRLF)
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: raw };

  const [, yamlStr, content] = match;
  const frontmatter: Record<string, unknown> = {};
  const linhas = yamlStr.split("\n");

  for (let i = 0; i < linhas.length; i++) {
    const line = linhas[i];
    // Linha indentada, item de lista ou comentário pertence à chave anterior.
    if (/^\s/.test(line) || /^-(\s|$)/.test(line) || line.trim().startsWith("#")) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (!key) continue;

    // `chave:` vazia seguida de linhas indentadas / "- item" = lista ou objeto em bloco
    if (val === "") {
      let j = i + 1;
      while (j < linhas.length && (/^\s/.test(linhas[j]) || /^-(\s|$)/.test(linhas[j]) || linhas[j].trim() === "")) j++;
      const bloco = linhas.slice(i + 1, j).filter((l) => l.trim() !== "");
      if (bloco.length > 0) {
        frontmatter[key] = parseBlocoYaml(bloco);
        i = j - 1;
        continue;
      }
    }
    frontmatter[key] = valorEscalarYaml(val);
  }

  return { frontmatter, content: content.trim() };
}

/** Valor de uma linha `chave: valor`: tipos básicos, aspas e listas/objetos em linha ([..] / {..}). */
function valorEscalarYaml(val: string): unknown {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null" || val === "") return null;
  if ((val.startsWith("[") && val.endsWith("]")) || (val.startsWith("{") && val.endsWith("}"))) {
    try {
      return JSON.parse(val);
    } catch {
      if (val.startsWith("[")) return dividirFlow(val.slice(1, -1)).map((x) => valorEscalarYaml(x));
      return desaspar(val);
    }
  }
  if (!isNaN(Number(val)) && val !== "") return Number(val);
  return desaspar(val);
}

/** Divide `a, 'b, c', "d"` nas vírgulas de fora das aspas. */
function dividirFlow(s: string): string[] {
  const saida: string[] = [];
  let atual = "";
  let aspa = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (aspa) {
      atual += c;
      if (c === "\\" && aspa === '"' && i + 1 < s.length) atual += s[++i];
      else if (c === aspa) aspa = "";
    } else if (c === '"' || c === "'") {
      aspa = c;
      atual += c;
    } else if (c === ",") {
      saida.push(atual.trim());
      atual = "";
    } else atual += c;
  }
  if (atual.trim() !== "") saida.push(atual.trim());
  return saida.filter((x) => x !== "");
}

/** Bloco YAML simples: lista de escalares, lista de objetos de escalares ou objeto de escalares. */
function parseBlocoYaml(bloco: string[]): unknown {
  const par = (t: string): [string, string] | null => {
    const m = t.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    return m ? [m[1], m[2].trim()] : null;
  };
  const ehLista = /^\s*-(\s|$)/.test(bloco[0]);
  if (!ehLista) {
    const obj: Record<string, unknown> = {};
    for (const l of bloco) {
      const kv = par(l.trim());
      if (kv) obj[kv[0]] = valorEscalarYaml(kv[1]);
    }
    return obj;
  }
  const itens: unknown[] = [];
  let atual: Record<string, unknown> | null = null;
  for (const l of bloco) {
    const m = l.match(/^(\s*)-(?:\s+(.*))?$/);
    if (m) {
      const resto = (m[2] ?? "").trim();
      const kv = par(resto);
      if (kv) {
        atual = { [kv[0]]: valorEscalarYaml(kv[1]) };
        itens.push(atual);
      } else {
        atual = null;
        itens.push(valorEscalarYaml(resto));
      }
    } else if (atual) {
      const kv = par(l.trim());
      if (kv) atual[kv[0]] = valorEscalarYaml(kv[1]);
    }
  }
  return itens;
}

/** Tira as aspas de um valor YAML de uma linha e desfaz o escape que
 *  linhaYaml() aplica — sem isso, cada salvamento acumularia barras. */
function desaspar(val: string): string {
  if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
    return val.slice(1, -1).replace(/\\(["\\n])/g, (_, c) => (c === "n" ? "\n" : c));
  }
  if (val.length >= 2 && val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'");
  }
  return val;
}

/** Uma linha `chave: valor` em YAML, com aspas quando o valor poderia ser
 *  lido como outro tipo. Retorna null para tipos não suportados (listas,
 *  objetos), que não são gravados por aqui. */
export function linhaYaml(key: string, val: unknown): string | null {
  if (val === null || val === undefined) return `${key}:`;
  if (typeof val === "boolean" || typeof val === "number") return `${key}: ${val}`;
  // Listas e objetos: uma linha só em estilo "flow" (JSON é YAML válido), sem depender de indentação.
  if (Array.isArray(val) || (typeof val === "object" && val !== null)) return `${key}: ${JSON.stringify(val)}`;
  if (typeof val !== "string") return null;
  // Aspas sempre que o YAML poderia ler o texto como OUTRO tipo. Sem isso,
  // `publicadoEm: 2026-09-25` vira objeto Date no parser do Astro, o schema
  // (z.string) rejeita e o build do site INTEIRO quebra — era o que
  // acontecia a cada post criado ou editado pelo painel. Mesma coisa para
  // "true"/"null"/números ("2014" viraria number) e espaços nas pontas.
  const pareceOutroTipo =
    /^\d{4}-\d{2}-\d{2}/.test(val) ||                            // data / data-hora
    /^(true|false|yes|no|on|off|null|~)$/i.test(val) ||            // booleano / nulo
    /^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(val) ||   // número
    /^0x[0-9a-f]+$/i.test(val) ||                                   // hexadecimal
    val === "" || val !== val.trim();
  const precisaAspas =
    pareceOutroTipo || /[:#\[\]{},>|*&!%@`'"\\]/.test(val) || val.includes("\n");
  if (!precisaAspas) return `${key}: ${val}`;
  const escapado = val.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `${key}: "${escapado}"`;
}

export function stringifyMd(
  frontmatter: Record<string, unknown>,
  content: string
): string {
  const lines: string[] = ["---"];
  for (const [key, val] of Object.entries(frontmatter)) {
    const linha = linhaYaml(key, val);
    if (linha !== null) lines.push(linha);
  }
  lines.push("---");
  lines.push("");
  lines.push(content);
  return lines.join("\n");
}

/**
 * Edição cirúrgica: troca (ou acrescenta) só as linhas dos campos em
 * `campos`, preservando o resto do frontmatter exatamente como está —
 * listas, textos de várias linhas, comentários, ordem. Reescrever o arquivo
 * inteiro a partir do parseMd (que só entende `chave: valor` numa linha)
 * apagaria qualquer estrutura que ele não conhece.
 */
/** Quantas linhas logo abaixo de `linhas[idx]` pertencem à mesma chave (bloco indentado / lista "- item"). */
export function linhasDeContinuacao(linhas: string[], idx: number): number {
  let n = 0;
  while (idx + 1 + n < linhas.length) {
    const l = linhas[idx + 1 + n];
    if (/^\s/.test(l) || /^-(\s|$)/.test(l)) n++;
    else break;
  }
  return n;
}

/** Tira do frontmatter (texto do arquivo) as chaves de primeiro nível dadas, com o bloco de cada uma. */
export function removerChavesFrontmatter(raw: string, chaves: string[]): string {
  if (chaves.length === 0) return raw;
  const texto = raw.replace(/\r\n/g, "\n");
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return raw;
  const linhas = m[1].split("\n");
  for (const k of chaves) {
    for (
      let idx = linhas.findIndex((l) => l.startsWith(`${k}:`));
      idx >= 0;
      idx = linhas.findIndex((l) => l.startsWith(`${k}:`))
    ) {
      linhas.splice(idx, 1 + linhasDeContinuacao(linhas, idx));
    }
  }
  return `---\n${linhas.join("\n")}\n---${texto.slice(m[0].length)}`;
}

export function atualizarFrontmatter(
  raw: string,
  campos: Record<string, unknown>,
  corpo?: string,
): string {
  const texto = raw.replace(/\r\n/g, "\n");
  const m = texto.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return stringifyMd(campos, corpo ?? texto);

  const linhas = m[1].split("\n");
  for (const [key, val] of Object.entries(campos)) {
    const nova = linhaYaml(key, val);
    if (nova === null) continue;
    // só chave de primeiro nível (sem indentação) — nunca dentro de lista/objeto
    const idx = linhas.findIndex((l) => l.startsWith(`${key}:`));
    if (idx >= 0) linhas.splice(idx, 1 + linhasDeContinuacao(linhas, idx), nova); // troca a chave E o bloco dela
    else linhas.push(nova);
  }
  const conteudo = corpo ?? m[2].replace(/^\n/, "");
  return ["---", ...linhas, "---", "", conteudo].join("\n");
}

// ─── Operações de arquivo ──────────────────────────────────────────────────────

export function listarArquivos(dir: string, ext = ".md"): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort();
}

export function lerArquivo(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function escreverArquivo(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

export function deletarArquivo(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

// ─── Slugify ──────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
