/**
 * lib/markdown-html.ts — conversor pequeno de Markdown para HTML (PURO: sem
 * fs, sem React, sem dependências). Serve ao editor do painel: os posts que as
 * skills escrevem são Markdown, o editor trabalha em HTML.
 *
 * Cobre o que os posts usam: títulos #–######, parágrafos, listas (ordenadas,
 * não ordenadas e aninhadas), negrito, itálico, tachado, código (em linha e
 * em bloco), links, imagens, citações, tabelas simples, linha horizontal e
 * blocos HTML já prontos (passam adiante, sem script/on*=/javascript:).
 * Texto solto é escapado (& < >), então "a < b" nunca vira tag.
 */

const BLOCO_HTML = /^<\/?(p|h[1-6]|ul|ol|li|blockquote|pre|table|thead|tbody|tr|th|td|figure|figcaption|div|section|aside|details|summary|hr|iframe)\b/i;

function escaparTexto(s: string): string {
  return s.replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escaparAttr(s: string): string {
  return s.replace(/&(?!#?\w+;)/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Só endereços que não executam nada. */
function urlSegura(u: string): string {
  const v = u.trim();
  if (/^\s*(javascript|data|vbscript):/i.test(v)) return "#";
  return v;
}

/** Tira script/style, atributos on*="" e javascript: de HTML que já vinha no Markdown. */
export function limparHtmlBruto(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?(script|style)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*(javascript|data|vbscript):[^"']*\2/gi, '$1="#"');
}

/** Formatação em linha: código, imagens, links, negrito, itálico, tachado. */
export function inlineParaHtml(texto: string): string {
  const guardados: string[] = [];
  const guardar = (html: string) => `\u0000${guardados.push(html) - 1}\u0000`;

  let s = texto;
  // código em linha primeiro: o que está dentro não recebe mais formatação
  s = s.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, __, cod: string) => guardar(`<code>${escaparTexto(cod.trim())}</code>`));
  // imagens e links
  s = s.replace(/!\[([^\]]*)\]\(\s*((?:[^()\s]|\([^()\s]*\))+)(?:\s+"([^"]*)")?\s*\)/g, (_, alt: string, src: string, titulo?: string) =>
    guardar(`<img src="${escaparAttr(urlSegura(src))}" alt="${escaparAttr(alt)}"${titulo ? ` title="${escaparAttr(titulo)}"` : ""}>`),
  );
  s = s.replace(/\[([^\]]+)\]\(\s*((?:[^()\s]|\([^()\s]*\))+)(?:\s+"([^"]*)")?\s*\)/g, (_, rotulo: string, href: string, titulo?: string) =>
    guardar(`<a href="${escaparAttr(urlSegura(href))}"${titulo ? ` title="${escaparAttr(titulo)}"` : ""}>${inlineParaHtml(rotulo)}</a>`),
  );
  // links soltos <https://…>
  s = s.replace(/<(https?:\/\/[^\s>]+)>/g, (_, u: string) => guardar(`<a href="${escaparAttr(u)}">${escaparTexto(u)}</a>`));
  // <br> escrito à mão
  s = s.replace(/<br\s*\/?>/gi, () => guardar("<br>"));

  s = escaparTexto(s);
  s = s.replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?![\w])/g, "$1<strong>$2</strong>");
  s = s.replace(/(^|[^*\w])\*(?=[^\s*])([\s\S]*?[^\s*])\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^\w])_(?=[^\s_])([\s\S]*?[^\s_])_(?![\w])/g, "$1<em>$2</em>");
  s = s.replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<s>$1</s>");
  // quebra forçada: dois espaços no fim da linha ou barra invertida
  s = s.replace(/(?: {2,}|\\)\n/g, "<br>\n");

  return s.replace(/\u0000(\d+)\u0000/g, (_, i: string) => guardados[Number(i)]);
}

const ehBranca = (l: string) => l.trim() === "";
const reTitulo = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const reHr = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const reFence = /^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/;
const reItem = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const reCitacao = /^ {0,3}>\s?(.*)$/;
const reLinhaTabela = /^\s*\|?.+\|.+\|?\s*$/;
const reSeparadorTabela = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function celulas(l: string): string[] {
  let t = l.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|") && !t.endsWith("\\|")) t = t.slice(0, -1);
  return t.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, "|").trim());
}

function alinhamentos(l: string): string[] {
  return celulas(l).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : c.startsWith(":") ? "left" : ""));
}

function tabelaParaHtml(cab: string, sep: string, corpo: string[]): string {
  const al = alinhamentos(sep);
  const cel = (tag: string, c: string, i: number) => `<${tag}${al[i] ? ` style="text-align:${al[i]}"` : ""}>${inlineParaHtml(c)}</${tag}>`;
  const th = celulas(cab).map((c, i) => cel("th", c, i)).join("");
  const linhas = corpo
    .map((l) => `<tr>${celulas(l).map((c, i) => cel("td", c, i)).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${th}</tr></thead>${linhas ? `<tbody>${linhas}</tbody>` : ""}</table>`;
}

/** Converte uma sequência de linhas de lista (já isoladas) em <ul>/<ol>, com aninhamento por indentação. */
function listaParaHtml(linhas: string[]): string {
  interface No { ordenada: boolean; indent: number; itens: { texto: string[]; filhos: string[] }[] }
  const abertos: No[] = [];
  let raiz = "";

  const fechar = (ate: number): string => {
    let html = "";
    while (abertos.length > ate) {
      const no = abertos.pop()!;
      const tag = no.ordenada ? "ol" : "ul";
      const lis = no.itens
        .map((it) => `<li>${inlineParaHtml(it.texto.join(" ").trim())}${it.filhos.join("")}</li>`)
        .join("");
      const bloco = `<${tag}>${lis}</${tag}>`;
      if (abertos.length > 0) {
        const pai = abertos[abertos.length - 1];
        pai.itens[pai.itens.length - 1].filhos.push(bloco);
      } else html += bloco;
    }
    return html;
  };

  for (const l of linhas) {
    const m = l.match(reItem);
    if (!m) {
      // continuação do texto do último item
      const topo = abertos[abertos.length - 1];
      if (topo && topo.itens.length) topo.itens[topo.itens.length - 1].texto.push(l.trim());
      continue;
    }
    const indent = m[1].replace(/\t/g, "    ").length;
    const ordenada = /\d/.test(m[2]);
    while (abertos.length && indent < abertos[abertos.length - 1].indent) raiz += fechar(abertos.length - 1);
    let topo = abertos[abertos.length - 1];
    if (topo && indent === topo.indent && topo.ordenada !== ordenada) {
      raiz += fechar(abertos.length - 1);
      topo = abertos[abertos.length - 1];
    }
    if (!topo || indent > topo.indent) {
      // filho: só se há pai; senão vira nível novo
      abertos.push({ ordenada, indent, itens: [] });
      topo = abertos[abertos.length - 1];
    }
    topo.itens.push({ texto: [m[3]], filhos: [] });
  }
  raiz += fechar(0);
  return raiz;
}

/** Markdown → HTML de blocos. */
export function markdownParaHtml(md: string): string {
  const linhas = String(md ?? "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  const saida: string[] = [];
  let i = 0;

  while (i < linhas.length) {
    const l = linhas[i];
    if (ehBranca(l)) { i++; continue; }

    // bloco de código
    const f = l.match(reFence);
    if (f) {
      const marca = f[1][0];
      const cod: string[] = [];
      i++;
      while (i < linhas.length && !new RegExp(`^ {0,3}${marca}{${f[1].length},}\\s*$`).test(linhas[i])) cod.push(linhas[i++]);
      i++; // fecha
      saida.push(`<pre><code${f[2] ? ` class="language-${escaparAttr(f[2])}"` : ""}>${escaparTexto(cod.join("\n"))}</code></pre>`);
      continue;
    }

    // título
    const t = l.match(reTitulo);
    if (t) {
      saida.push(`<h${t[1].length}>${inlineParaHtml(t[2])}</h${t[1].length}>`);
      i++;
      continue;
    }

    // linha horizontal (antes de lista: "---" e "***")
    if (reHr.test(l)) { saida.push("<hr>"); i++; continue; }

    // HTML já pronto: vai até a linha em branco
    if (BLOCO_HTML.test(l.trim())) {
      const bruto: string[] = [];
      while (i < linhas.length && !ehBranca(linhas[i])) bruto.push(linhas[i++]);
      saida.push(limparHtmlBruto(bruto.join("\n")));
      continue;
    }

    // citação
    if (reCitacao.test(l)) {
      const interno: string[] = [];
      while (i < linhas.length && (reCitacao.test(linhas[i]) || (!ehBranca(linhas[i]) && interno.length && !reItem.test(linhas[i]) && !reTitulo.test(linhas[i])))) {
        const m = linhas[i].match(reCitacao);
        interno.push(m ? m[1] : linhas[i]);
        i++;
      }
      saida.push(`<blockquote>${markdownParaHtml(interno.join("\n"))}</blockquote>`);
      continue;
    }

    // tabela
    if (reLinhaTabela.test(l) && i + 1 < linhas.length && reSeparadorTabela.test(linhas[i + 1]) && linhas[i + 1].includes("-")) {
      const cab = l;
      const sep = linhas[i + 1];
      i += 2;
      const corpo: string[] = [];
      while (i < linhas.length && !ehBranca(linhas[i]) && linhas[i].includes("|")) corpo.push(linhas[i++]);
      saida.push(tabelaParaHtml(cab, sep, corpo));
      continue;
    }

    // lista
    if (reItem.test(l)) {
      const bloco: string[] = [];
      while (i < linhas.length) {
        const x = linhas[i];
        if (ehBranca(x)) {
          // linha em branca dentro da lista: continua se a próxima ainda é item (ou continuação indentada)
          const prox = linhas[i + 1];
          if (prox !== undefined && (reItem.test(prox) || /^ {2,}\S/.test(prox)) && !reHr.test(prox)) { i++; continue; }
          break;
        }
        if (reHr.test(x) || reTitulo.test(x) || reFence.test(x)) break;
        if (!reItem.test(x) && !/^\s/.test(x) && bloco.length === 0) break;
        if (!reItem.test(x) && !/^\s/.test(x)) break; // parágrafo novo, sem indentação
        bloco.push(x);
        i++;
      }
      saida.push(listaParaHtml(bloco));
      continue;
    }

    // parágrafo: até linha em branco ou início de outro bloco
    const par: string[] = [];
    while (
      i < linhas.length &&
      !ehBranca(linhas[i]) &&
      !(par.length && (reTitulo.test(linhas[i]) || reFence.test(linhas[i]) || reHr.test(linhas[i]) || reCitacao.test(linhas[i]) || reItem.test(linhas[i]) || BLOCO_HTML.test(linhas[i].trim())))
    ) {
      par.push(linhas[i++]);
    }
    if (par.length === 0) { i++; continue; }
    saida.push(`<p>${inlineParaHtml(par.join("\n").replace(/\n(?!$)/g, "\n").trim()).replace(/\n/g, " ")}</p>`);
  }

  return saida.join("\n");
}
