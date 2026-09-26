/**
 * lib/sync-autores.ts — espelha os autores do painel no site.
 *
 * No painel, "autor" é o usuário com podeAssinar + autoria (usuarios.json).
 * O site (Astro) não enxerga o usuarios.json: ele lê content/autores/<slug>.md
 * para montar /autor/<slug> e a assinatura dos artigos. Esta função grava um
 * arquivo por autor e é chamada a cada salvamento de usuário
 * (salvarUsuarios), então o site fica sempre igual ao cadastro.
 *
 * Arquivos marcados `gerenciadoPor: painel` são do painel: se o autor deixa
 * de existir (ou perde podeAssinar), o arquivo sai. Arquivo sem essa marca
 * (escrito pelo agente) nunca é apagado por aqui — só é sobrescrito se o
 * painel tiver um autor com o MESMO slug (o cadastro do painel prevalece).
 *
 * Identificação: o painel usa o id do usuário; o site usa o slug. slugDoAutor
 * e idDoAutor fazem a conversão nas rotas de posts.
 */
import fs from "fs";
import path from "path";
import { getContentDir, linhaYaml } from "./fs";
import type { Usuario } from "./usuarios";

const MARCA = "painel";
const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function dirAutores(): string {
  return path.join(getContentDir(), "autores");
}

function naoVazios(lista: unknown): string[] {
  return Array.isArray(lista) ? lista.map((s) => String(s).trim()).filter(Boolean) : [];
}

/** Autor que existe de verdade no site: assina, slug válido e nome com 2+ letras (rascunho não conta). */
export function ehAutorPublicavel(u: Usuario): boolean {
  const a = u.autoria;
  if (!u.podeAssinar || !a) return false;
  return SLUG_VALIDO.test((a.slug ?? "").trim()) && (a.nomePublico ?? "").trim().length >= 2;
}

function montarArquivo(u: Usuario): { slug: string; conteudo: string } | null {
  if (!ehAutorPublicavel(u)) return null;
  const a = u.autoria!;
  const slug = (a.slug ?? "").trim();
  const nome = (a.nomePublico ?? "").trim();

  const redes = Object.fromEntries(
    Object.entries(a.redes ?? {}).filter(([, v]) => typeof v === "string" && v.trim() !== ""),
  );

  const escalares: [string, unknown][] = [
    ["nome", nome],
    ["cargo", a.cargo ?? ""],
    ["foto", a.foto || undefined],
    ["fotoAlt", a.fotoAlt || undefined],
    ["bioCurta", a.bioCurta ?? ""],
    ["bioLonga", a.bioLonga ?? ""],
    ["conselho", a.conselho ?? ""],
    ["registro", a.registro ?? ""],
    ["email", a.emailPublico || undefined],
    ["ativo", u.acesso?.ativo !== false],
    ["gerenciadoPor", MARCA],
  ];
  const linhas = ["---"];
  for (const [k, v] of escalares) {
    if (v === undefined) continue;
    const l = linhaYaml(k, v);
    if (l) linhas.push(l);
  }
  // Listas e objetos em estilo "flow" (JSON é YAML válido): uma linha só,
  // sem depender de indentação.
  linhas.push(`especialidades: ${JSON.stringify(naoVazios(a.especialidades))}`);
  linhas.push(`formacao: ${JSON.stringify(naoVazios(a.formacao))}`);
  linhas.push(`redes: ${JSON.stringify(redes)}`);
  linhas.push("---", "");
  return { slug, conteudo: linhas.join("\n") };
}

export function sincronizarAutores(usuarios: Usuario[]): { gravados: string[]; removidos: string[] } {
  const dir = dirAutores();
  fs.mkdirSync(dir, { recursive: true });

  const gravados: string[] = [];
  const slugsDoPainel = new Set<string>();

  for (const u of usuarios) {
    const arq = montarArquivo(u);
    if (!arq || slugsDoPainel.has(arq.slug)) continue; // slug repetido: vale o primeiro
    slugsDoPainel.add(arq.slug);
    const destino = path.join(dir, `${arq.slug}.md`);
    const atual = fs.existsSync(destino) ? fs.readFileSync(destino, "utf-8") : null;
    if (atual !== arq.conteudo) {
      fs.writeFileSync(destino, arq.conteudo, "utf-8");
      gravados.push(arq.slug);
    }
  }

  const removidos: string[] = [];
  for (const nome of fs.readdirSync(dir)) {
    if (!nome.endsWith(".md")) continue;
    const slug = nome.replace(/\.md$/, "");
    if (slugsDoPainel.has(slug)) continue;
    const texto = fs.readFileSync(path.join(dir, nome), "utf-8");
    if (/^gerenciadoPor:\s*"?painel"?\s*$/m.test(texto)) {
      fs.unlinkSync(path.join(dir, nome));
      removidos.push(slug);
    }
  }
  return { gravados, removidos };
}

/** id do usuário (ou o próprio slug) → slug do autor, para gravar no post. */
export function slugDoAutor(valor: string, usuarios: Usuario[]): string {
  const v = valor.trim();
  const u = usuarios.find((x) => x.id === v) ?? usuarios.find((x) => x.autoria?.slug === v);
  return u?.autoria?.slug || v;
}

/** slug gravado no post → id do usuário, para o painel selecionar o autor. */
export function idDoAutor(valor: string, usuarios: Usuario[]): string {
  const v = valor.trim();
  const u = usuarios.find((x) => x.autoria?.slug === v) ?? usuarios.find((x) => x.id === v);
  return u?.id ?? v;
}
