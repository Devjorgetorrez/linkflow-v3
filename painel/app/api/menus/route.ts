/**
 * app/api/menus/route.ts
 * GET   /api/menus  → lê nav e navFooterColunas do config/site.ts
 * PATCH /api/menus  → escreve nav e navFooterColunas no config/site.ts
 *
 * O nav suporta 1 nível de submenu (`filhos`) — usado pelo dropdown do
 * Header.astro (hover no desktop, expandido no mobile). O parser abaixo
 * respeita aninhamento de [ ] e { } de verdade (bracket-depth), porque um
 * regex não-guloso simples pararia no primeiro "]," que encontrasse — que
 * seria o de um array de `filhos` aninhado, não o do `nav` inteiro.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getConfigPath } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

interface ItemNav {
  label: string;
  href: string;
  filhos?: ItemNav[];
  /** Item some do <nav> renderizado mas continua no config (erro 91, Relatório de Testes 6). */
  oculto?: boolean;
}
interface ColunaFooter { titulo: string; itens: ItemNav[]; }

// ─── Parsing com aninhamento respeitado ────────────────────────────────────────

/**
 * A partir do índice de um '[' de abertura, retorna o conteúdo entre ele e
 * seu ']' correspondente, contando profundidade de [ ] e { } juntos —
 * único jeito seguro de lidar com arrays aninhados (filhos dentro de nav).
 */
function extrairArrayBalanceado(
  texto: string,
  indiceAbertura: number
): { conteudo: string; indiceFechamento: number } | null {
  if (texto[indiceAbertura] !== "[") return null;
  let depth = 0;
  for (let i = indiceAbertura; i < texto.length; i++) {
    const c = texto[i];
    if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) {
        return { conteudo: texto.slice(indiceAbertura + 1, i), indiceFechamento: i };
      }
    }
  }
  return null; // não fechou — arquivo malformado
}

/** Divide o conteúdo de um array de objetos { ... }, { ... } respeitando aninhamento. */
function splitTopLevelItems(conteudo: string): string[] {
  const itens: string[] = [];
  let depth = 0;
  let atual = "";
  let dentroItem = false;
  for (let i = 0; i < conteudo.length; i++) {
    const c = conteudo[i];
    if (c === "{" || c === "[") {
      depth++;
      if (c === "{" && depth === 1) {
        dentroItem = true;
        atual = "";
        continue;
      }
    }
    if (c === "}" || c === "]") {
      depth--;
      if (c === "}" && depth === 0 && dentroItem) {
        itens.push(atual);
        dentroItem = false;
        continue;
      }
    }
    if (dentroItem) atual += c;
  }
  return itens;
}

function parseItemNav(bloco: string): ItemNav | null {
  const labelMatch = bloco.match(/label:\s*['"`]([^'"`]*)['"`]/);
  const hrefMatch = bloco.match(/href:\s*['"`]([^'"`]*)['"`]/);
  if (!labelMatch || !hrefMatch) return null;

  const item: ItemNav = { label: labelMatch[1], href: hrefMatch[1] };

  // Só no CABEÇALHO do item (antes de "filhos:") — bloco inclui o texto bruto
  // dos filhos aninhados, e um `oculto: true` de um FILHO não pode marcar o
  // PAI como oculto também.
  const filhosIdx = bloco.search(/\bfilhos:\s*\[/);
  const cabecalho = filhosIdx >= 0 ? bloco.slice(0, filhosIdx) : bloco;
  if (/\boculto:\s*true\b/.test(cabecalho)) item.oculto = true;

  const filhosMatch = bloco.match(/filhos:\s*(\[)/);
  if (filhosMatch && filhosMatch.index !== undefined) {
    const aberturaIdx = filhosMatch.index + filhosMatch[0].length - 1;
    const sub = extrairArrayBalanceado(bloco, aberturaIdx);
    if (sub) {
      const subItens = splitTopLevelItems(sub.conteudo)
        .map(parseItemNav)
        .filter((x): x is ItemNav => x !== null);
      if (subItens.length > 0) item.filhos = subItens;
    }
  }

  return item;
}

function lerNav(raw: string): ItemNav[] {
  const inicio = raw.match(/\bnav:\s*\[/);
  if (!inicio || inicio.index === undefined) return [];
  const aberturaIdx = inicio.index + inicio[0].length - 1;
  const bloco = extrairArrayBalanceado(raw, aberturaIdx);
  if (!bloco) return [];
  return splitTopLevelItems(bloco.conteudo)
    .map(parseItemNav)
    .filter((x): x is ItemNav => x !== null);
}

function lerNavFooter(raw: string): ColunaFooter[] {
  const inicio = raw.match(/navFooterColunas:\s*\[/);
  if (!inicio || inicio.index === undefined) return [];
  const aberturaIdx = inicio.index + inicio[0].length - 1;
  const bloco = extrairArrayBalanceado(raw, aberturaIdx);
  if (!bloco) return [];

  const colunas: ColunaFooter[] = [];
  for (const blocoColuna of splitTopLevelItems(bloco.conteudo)) {
    const tituloMatch = blocoColuna.match(/titulo:\s*['"`]([^'"`]*)['"`]/);
    if (!tituloMatch) continue;
    const titulo = tituloMatch[1];

    const itensMatch = blocoColuna.match(/itens:\s*(\[)/);
    let itens: ItemNav[] = [];
    if (itensMatch && itensMatch.index !== undefined) {
      const itensAberturaIdx = itensMatch.index + itensMatch[0].length - 1;
      const itensBloco = extrairArrayBalanceado(blocoColuna, itensAberturaIdx);
      if (itensBloco) {
        itens = splitTopLevelItems(itensBloco.conteudo)
          .map(parseItemNav)
          .filter((x): x is ItemNav => x !== null);
      }
    }
    colunas.push({ titulo, itens });
  }
  return colunas;
}

// ─── Serialização ───────────────────────────────────────────────────────────────

function serializarItemNav(item: ItemNav, indent: string): string {
  const label = item.label.replace(/['\\]/g, "");
  const href = item.href.replace(/['\\]/g, "");
  const oculto = item.oculto ? " oculto: true," : "";

  if (item.filhos && item.filhos.length > 0) {
    const filhosStr = item.filhos
      .map((f) => `${indent}    ${serializarItemNav(f, "")}`)
      .join("\n");
    return `{\n${indent}  label: '${label}', href: '${href}',${oculto}\n${indent}  filhos: [\n${filhosStr}\n${indent}  ],\n${indent}},`;
  }
  return `{ label: '${label}', href: '${href}',${oculto} },`;
}

function serializarNav(itens: ItemNav[]): string {
  const linhas = itens.map((i) => `    ${serializarItemNav(i, "    ")}`);
  return `  nav: [\n${linhas.join("\n")}\n  ],`;
}

function serializarNavFooter(colunas: ColunaFooter[]): string {
  const colunasStr = colunas.map((c) => {
    const itensStr = c.itens
      .map((i) => `        ${serializarItemNav(i, "        ")}`)
      .join("\n");
    return `    {\n      titulo: '${c.titulo.replace(/['\\]/g, "")}',\n      itens: [\n${itensStr}\n      ],\n    },`;
  });
  return `  navFooterColunas: [\n${colunasStr.join("\n")}\n  ],`;
}

/**
 * Substitui um array (identificado por sua chave, ex: "nav") no texto do
 * config por um novo bloco serializado — usa o mesmo parser com aninhamento
 * respeitado, nunca um regex não-guloso (que pararia num "]," aninhado).
 *
 * Recorta a partir do INÍCIO DA LINHA da chave (não do índice da chave em
 * si) e descarta a indentação original — sem isso, a indentação de
 * serializarNav()/serializarNavFooter() (fixa, 2 espaços) se somaria à
 * indentação antiga a cada PATCH, crescendo sem limite a cada salvamento.
 */
function substituirArrayBalanceado(raw: string, chave: string, novoBloco: string): string {
  const regexAbertura = new RegExp(`\\b${chave}:\\s*\\[`);
  const inicio = raw.match(regexAbertura);
  if (!inicio || inicio.index === undefined) return raw; // chave ausente — não mexe
  const aberturaIdx = inicio.index + inicio[0].length - 1;
  const bloco = extrairArrayBalanceado(raw, aberturaIdx);
  if (!bloco) return raw;

  // Recuar até o início da linha (último "\n" antes da chave, ou início do
  // arquivo) para descartar qualquer indentação pré-existente na linha.
  const inicioLinha = raw.lastIndexOf("\n", inicio.index) + 1; // +1: depois do \n, ou 0 se não achar

  const antes = raw.slice(0, inicioLinha);
  let depois = raw.slice(bloco.indiceFechamento + 1);
  if (depois.startsWith(",")) depois = depois.slice(1); // novoBloco já termina com ","

  return antes + novoBloco + depois;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["menus:GET"]);
  if (auth) return auth;

  try {
    const filePath = getConfigPath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: false, erro: "Config não encontrado" }, { status: 404 });
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({
      ok: true,
      nav: lerNav(raw),
      navFooter: lerNavFooter(raw),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["menus:PATCH"]);
  if (auth) return auth;

  try {
    const filePath = getConfigPath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: false, erro: "Config não encontrado" }, { status: 404 });
    }

    let raw = fs.readFileSync(filePath, "utf-8");
    const body = await req.json();

    if (body.nav) {
      const novoNav = serializarNav(body.nav);
      raw = substituirArrayBalanceado(raw, "nav", novoNav);
    }

    if (body.navFooter) {
      const novoFooter = serializarNavFooter(body.navFooter);
      raw = substituirArrayBalanceado(raw, "navFooterColunas", novoFooter);
    }

    fs.writeFileSync(filePath, raw, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
