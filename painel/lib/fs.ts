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

  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (!key) continue;

    // Tipos básicos
    if (val === "true") frontmatter[key] = true;
    else if (val === "false") frontmatter[key] = false;
    else if (val === "null" || val === "") frontmatter[key] = null;
    else if (!isNaN(Number(val)) && val !== "") frontmatter[key] = Number(val);
    else frontmatter[key] = desaspar(val);
  }

  return { frontmatter, content: content.trim() };
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
    if (idx >= 0) linhas[idx] = nova;
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
