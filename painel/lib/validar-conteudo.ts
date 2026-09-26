/**
 * lib/validar-conteudo.ts — valida os .md do site contra o schema ANTES do build.
 *
 * O Astro derruba o build inteiro no primeiro frontmatter fora do schema
 * (content.config.ts). Aqui as regras são conferidas antes, sem depender do
 * Astro, e cada problema sai como { arquivo, campo, mensagem } em português.
 *
 * As regras dos campos vêm do content.config.ts REAL do site (cada layout
 * promovido tem campos diferentes em servicos/equipe/...): lê as linhas
 * `campo: z.tipo()...` do primeiro nível de cada `schema: z.object({`.
 * Só entende campos escritos em uma linha (string/number/boolean/array/date e
 * min/max/optional/default); estruturas aninhadas (redes, quemPode...) ficam
 * de fora. As regras que o schema escreve em código (superRefine) estão aqui
 * à mão: metaDescription mínima de 80 só para o que vai ao ar; autor e
 * categoria do post precisam existir; slug único; publicadoEm em AAAA-MM-DD.
 */

import fs from "fs";
import path from "path";

export interface ErroConteudo {
  arquivo: string; // relativo a src/content, ex. "posts/meu-post.md"
  campo: string;
  mensagem: string;
}

type Tipo = "string" | "number" | "boolean" | "array" | "date" | "union-string-date" | "outro";

interface RegraCampo {
  campo: string;
  tipo: Tipo;
  obrigatorio: boolean;
  min?: number;
  max?: number;
}

const COLECOES = ["servicos", "equipe", "depoimentos", "posts", "autores", "categorias"] as const;

// Mesma lista do superRefine do schema e de lib/status-post.ts.
const FORA_DO_AR = ["rascunho", "revisao", "revisão", "agendado", "lixeira"];

// Regras de reserva se o content.config.ts não puder ser lido/entendido.
const RESERVA: Record<string, RegraCampo[]> = {
  posts: [
    { campo: "titulo", tipo: "string", obrigatorio: true, min: 3, max: 70 },
    { campo: "metaDescription", tipo: "string", obrigatorio: false, max: 165 },
    { campo: "publicadoEm", tipo: "union-string-date", obrigatorio: true },
    { campo: "status", tipo: "string", obrigatorio: false },
    { campo: "categoria", tipo: "string", obrigatorio: false },
    { campo: "autor", tipo: "string", obrigatorio: false },
    { campo: "destaque", tipo: "boolean", obrigatorio: false },
  ],
  autores: [{ campo: "nome", tipo: "string", obrigatorio: true, min: 2 }],
  categorias: [{ campo: "nome", tipo: "string", obrigatorio: true, min: 2 }],
};

// ─── Regras a partir do content.config.ts ─────────────────────────────────────

function extrairBloco(texto: string, colecao: string): string | null {
  const ini = texto.search(new RegExp(`const\\s+${colecao}\\s*=\\s*defineCollection`));
  if (ini < 0) return null;
  const sch = texto.indexOf("schema:", ini);
  if (sch < 0) return null;
  const abre = texto.indexOf("z.object({", sch);
  if (abre < 0) return null;
  // casa as chaves do z.object({ ... })
  const inicio = abre + "z.object(".length;
  let nivel = 0;
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];
    if (c === "{") nivel++;
    else if (c === "}") {
      nivel--;
      if (nivel === 0) return texto.slice(inicio + 1, i);
    }
  }
  return null;
}

function regrasDoBloco(bloco: string): RegraCampo[] {
  const regras: RegraCampo[] = [];
  let indent: number | null = null;
  for (const linha of bloco.split("\n")) {
    const m = linha.match(/^(\s+)(\w+):\s+(z\..*?),?\s*(\/\/.*)?$/);
    if (!m) continue;
    const espacos = m[1].length;
    if (indent === null) indent = espacos;
    if (espacos !== indent) continue; // campo aninhado
    const expr = m[3];
    if (/[({]\s*$/.test(expr)) continue; // objeto/array em várias linhas
    let tipo: Tipo = "outro";
    if (expr.startsWith("z.union([z.string(), z.date()])")) tipo = "union-string-date";
    else if (expr.startsWith("z.string(")) tipo = "string";
    else if (expr.startsWith("z.number(")) tipo = "number";
    else if (expr.startsWith("z.boolean(")) tipo = "boolean";
    else if (expr.startsWith("z.array(")) tipo = "array";
    else if (expr.startsWith("z.date(")) tipo = "date";
    const opcional = /\.optional\(\)|\.default\(/.test(expr);
    const min = expr.match(/\.min\((\d+)\)/)?.[1];
    const max = expr.match(/\.max\((\d+)\)/)?.[1];
    regras.push({
      campo: m[2],
      tipo,
      obrigatorio: !opcional,
      min: min !== undefined ? Number(min) : undefined,
      max: max !== undefined ? Number(max) : undefined,
    });
  }
  return regras;
}

function carregarRegras(astroDir: string): Record<string, RegraCampo[]> {
  let texto = "";
  try {
    texto = fs.readFileSync(path.join(astroDir, "src", "content.config.ts"), "utf-8").replace(/\r\n/g, "\n");
  } catch {
    /* sem config: só as regras de reserva */
  }
  const out: Record<string, RegraCampo[]> = {};
  for (const col of COLECOES) {
    const bloco = texto ? extrairBloco(texto, col) : null;
    const regras = bloco ? regrasDoBloco(bloco) : [];
    out[col] = regras.length > 0 ? regras : RESERVA[col] ?? [];
  }
  return out;
}

// ─── Frontmatter (só o primeiro nível, com tipo) ──────────────────────────────

type Valor =
  | { k: "string"; v: string }
  | { k: "number"; v: number }
  | { k: "boolean"; v: boolean }
  | { k: "date"; v: string }
  | { k: "array" }
  | { k: "object" }
  | { k: "null" };

function valorInline(bruto: string): Valor {
  const v = bruto.replace(/\s+#.*$/, "").trim();
  if (v === "" || v === "null" || v === "~") return { k: "null" };
  if (v === "true") return { k: "boolean", v: true };
  if (v === "false") return { k: "boolean", v: false };
  if (/^"(?:[^"\\]|\\.)*"$/.test(v)) return { k: "string", v: v.slice(1, -1).replace(/\\(["\\n])/g, (_, c) => (c === "n" ? "\n" : c)) };
  if (/^'(?:[^']|'')*'$/.test(v)) return { k: "string", v: v.slice(1, -1).replace(/''/g, "'") };
  if (v.startsWith("[")) return { k: "array" };
  if (v.startsWith("{")) return { k: "object" };
  if (/^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(v)) return { k: "number", v: Number(v.replace(/_/g, "")) };
  if (/^0x[0-9a-f]+$/i.test(v)) return { k: "number", v: parseInt(v, 16) };
  if (/^\d{4}-\d{2}-\d{2}([Tt ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(v)) return { k: "date", v };
  return { k: "string", v };
}

function lerFrontmatter(raw: string): Map<string, Valor> | null {
  const texto = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const m = texto.match(/^---\n([\s\S]*?)\n---\s*(?:\n[\s\S]*)?$/);
  if (!m) return null;
  const linhas = m[1].split("\n");
  const campos = new Map<string, Valor>();
  for (let i = 0; i < linhas.length; i++) {
    const c = linhas[i].match(/^([A-Za-z_][\w-]*):(?:\s+(.*)|\s*)$/);
    if (!c) continue; // linha aninhada, comentário ou lixo
    const chave = c[1];
    const resto = (c[2] ?? "").trim();
    if (/^[|>][+-]?$/.test(resto)) {
      campos.set(chave, { k: "string", v: "x" });
      continue;
    }
    if (resto === "") {
      // valor vem nas linhas seguintes (lista/objeto) ou é nulo
      const prox = linhas.slice(i + 1).find((l) => l.trim() !== "" && !l.trim().startsWith("#"));
      if (prox !== undefined && /^\s*-(\s|$)/.test(prox)) campos.set(chave, { k: "array" });
      else if (prox !== undefined && /^\s+\S/.test(prox)) campos.set(chave, { k: "object" });
      else campos.set(chave, { k: "null" });
      continue;
    }
    campos.set(chave, valorInline(resto));
  }
  return campos;
}

// ─── Validação ────────────────────────────────────────────────────────────────

function nomeTipo(v: Valor): string {
  switch (v.k) {
    case "string": return "texto";
    case "number": return "número";
    case "boolean": return "verdadeiro/falso";
    case "date": return "data";
    case "array": return "lista";
    case "object": return "bloco";
    default: return "vazio";
  }
}

function listarMd(dir: string, base = dir): string[] {
  const out: string[] = [];
  let itens: fs.Dirent[] = [];
  try {
    itens = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const it of itens) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) out.push(...listarMd(full, base));
    else if (it.isFile() && it.name.toLowerCase().endsWith(".md")) out.push(path.relative(base, full).replace(/\\/g, "/"));
  }
  return out.sort();
}

function validarCampos(
  arquivo: string,
  campos: Map<string, Valor>,
  regras: RegraCampo[],
  erros: ErroConteudo[],
) {
  for (const r of regras) {
    const v = campos.get(r.campo);
    if (v === undefined) {
      if (r.obrigatorio && r.tipo !== "outro")
        erros.push({ arquivo, campo: r.campo, mensagem: "Campo obrigatório ausente. Preencha o campo neste arquivo." });
      continue;
    }
    if (v.k === "null") {
      if (r.tipo === "outro") continue;
      erros.push({
        arquivo,
        campo: r.campo,
        mensagem: r.obrigatorio
          ? "Campo obrigatório está vazio."
          : "Campo está com valor vazio; o site só aceita o campo ausente ou preenchido. Preencha ou apague a linha.",
      });
      continue;
    }
    switch (r.tipo) {
      case "string":
        if (v.k !== "string") {
          erros.push({ arquivo, campo: r.campo, mensagem: `Deveria ser texto, mas veio ${nomeTipo(v)}. Coloque o valor entre aspas.` });
        } else {
          if (r.min !== undefined && v.v.length < r.min)
            erros.push({ arquivo, campo: r.campo, mensagem: `Muito curto: ${v.v.length} caractere(s), o mínimo é ${r.min}.` });
          if (r.max !== undefined && v.v.length > r.max)
            erros.push({ arquivo, campo: r.campo, mensagem: `Muito longo: ${v.v.length} caracteres, o máximo é ${r.max}.` });
        }
        break;
      case "union-string-date":
        if (v.k !== "string" && v.k !== "date")
          erros.push({ arquivo, campo: r.campo, mensagem: `Deveria ser uma data ou texto, mas veio ${nomeTipo(v)}.` });
        break;
      case "number":
        if (v.k !== "number") {
          erros.push({ arquivo, campo: r.campo, mensagem: `Deveria ser número, mas veio ${nomeTipo(v)}.` });
        } else {
          if (r.min !== undefined && v.v < r.min)
            erros.push({ arquivo, campo: r.campo, mensagem: `Valor ${v.v} abaixo do mínimo (${r.min}).` });
          if (r.max !== undefined && v.v > r.max)
            erros.push({ arquivo, campo: r.campo, mensagem: `Valor ${v.v} acima do máximo (${r.max}).` });
        }
        break;
      case "boolean":
        if (v.k !== "boolean")
          erros.push({ arquivo, campo: r.campo, mensagem: `Deveria ser verdadeiro ou falso (true/false), mas veio ${nomeTipo(v)}.` });
        break;
      case "array":
        if (v.k !== "array")
          erros.push({ arquivo, campo: r.campo, mensagem: `Deveria ser uma lista, mas veio ${nomeTipo(v)}.` });
        break;
      case "date":
        if (v.k !== "date")
          erros.push({ arquivo, campo: r.campo, mensagem: `Deveria ser uma data, mas veio ${nomeTipo(v)}.` });
        break;
    }
  }
}

function dataValida(s: string): boolean {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

export function validarConteudoSite(astroDir: string): { erros: ErroConteudo[]; arquivos: number } {
  const contentDir = path.join(astroDir, "src", "content");
  const regras = carregarRegras(astroDir);
  const erros: ErroConteudo[] = [];
  let total = 0;

  const slugs: Record<string, Set<string>> = {};
  for (const col of COLECOES) slugs[col] = new Set();
  const lidos: { col: string; arquivo: string; campos: Map<string, Valor> }[] = [];

  for (const col of COLECOES) {
    const dir = path.join(contentDir, col);
    if (!fs.existsSync(dir)) continue;
    const vistos = new Map<string, string>(); // slug minúsculo -> arquivo
    for (const rel of listarMd(dir)) {
      total++;
      const arquivo = `${col}/${rel}`;
      let raw = "";
      try {
        raw = fs.readFileSync(path.join(dir, rel), "utf-8");
      } catch (e) {
        erros.push({ arquivo, campo: "(arquivo)", mensagem: `Não foi possível ler o arquivo: ${String(e)}` });
        continue;
      }
      const slug = rel.replace(/\.md$/i, "");
      const outro = vistos.get(slug.toLowerCase());
      if (outro) {
        erros.push({ arquivo, campo: "(slug)", mensagem: `Endereço repetido: "${slug}" já existe em ${outro}. Cada item precisa de um nome de arquivo único.` });
      } else {
        vistos.set(slug.toLowerCase(), arquivo);
      }
      slugs[col].add(slug);

      const campos = lerFrontmatter(raw);
      if (!campos) {
        erros.push({ arquivo, campo: "(frontmatter)", mensagem: "Arquivo sem o cabeçalho entre --- e --- (frontmatter) ou com o cabeçalho mal fechado." });
        continue;
      }
      validarCampos(arquivo, campos, regras[col], erros);
      lidos.push({ col, arquivo, campos });
    }
  }

  // Regras que o schema escreve em código, e referências entre coleções
  for (const p of lidos) {
    if (p.col !== "posts") continue;
    const st = p.campos.get("status");
    const status = st && st.k === "string" ? st.v.trim().toLowerCase() : "";
    const foraDoAr = FORA_DO_AR.includes(status);

    const meta = p.campos.get("metaDescription");
    if (!foraDoAr && (!meta || meta.k === "string")) {
      const n = meta && meta.k === "string" ? meta.v.length : 0;
      if (n < 80)
        erros.push({ arquivo: p.arquivo, campo: "metaDescription", mensagem: `Precisa ter de 80 a 165 caracteres para publicar (tem ${n}). Complete o texto ou deixe o post como rascunho.` });
    }

    const pub = p.campos.get("publicadoEm");
    if (pub && (pub.k === "string" || pub.k === "date") && !dataValida(pub.v))
      erros.push({ arquivo: p.arquivo, campo: "publicadoEm", mensagem: `Data inválida ("${pub.v}"). Use o formato AAAA-MM-DD, por exemplo 2026-09-25.` });

    if (!foraDoAr) {
      const aut = p.campos.get("autor");
      if (aut && aut.k === "string" && aut.v && !slugs.autores.has(aut.v))
        erros.push({ arquivo: p.arquivo, campo: "autor", mensagem: `O autor "${aut.v}" não existe (falta autores/${aut.v}.md). Escolha um autor cadastrado.` });
      const cat = p.campos.get("categoria");
      if (cat && cat.k === "string" && cat.v && !slugs.categorias.has(cat.v))
        erros.push({ arquivo: p.arquivo, campo: "categoria", mensagem: `A categoria "${cat.v}" não existe (falta categorias/${cat.v}.md). Escolha uma categoria cadastrada.` });
    }
  }

  // agrupa por arquivo, mantendo a ordem em que os problemas foram achados
  const ordem = new Map<string, number>();
  erros.forEach((e) => { if (!ordem.has(e.arquivo)) ordem.set(e.arquivo, ordem.size); });
  erros.sort((a, b) => ordem.get(a.arquivo)! - ordem.get(b.arquivo)!);

  return { erros, arquivos: total };
}
