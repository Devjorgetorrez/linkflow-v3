/**
 * lib/posts-fs.ts — arquivos de post no servidor (SÓ servidor).
 *
 * - Posts vivos: $LINKFLOW_DIR/_astro/src/content/posts/<slug>.md
 * - Lixeira:     $LINKFLOW_DIR/dados/lixeira/posts/<chave>.md — FORA de
 *   _astro/src/content, então o build do site nunca lê o que está na lixeira.
 * Toda gravação é atômica (temporário + rename).
 */
import fs from "fs";
import path from "path";
import { getContentDir, getLinkflowDir } from "@/lib/fs";
import { SLUGS_RESERVADOS } from "@/lib/posts-regras";

export function dirPosts(): string {
  return path.join(getContentDir(), "posts");
}

export function dirLixeira(): string {
  return path.join(getLinkflowDir(), "dados", "lixeira", "posts");
}

export function caminhoPost(slug: string): string {
  return path.join(dirPosts(), `${slug}.md`);
}

export function caminhoLixeira(chave: string): string {
  return path.join(dirLixeira(), `${chave}.md`);
}

/** Grava sem nunca deixar o arquivo pela metade (temporário + rename). */
export function gravarAtomico(destino: string, conteudo: string): void {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmp, conteudo, "utf-8");
    fs.renameSync(tmp, destino);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* já não existe */ }
    throw err;
  }
}

/** Grava um arquivo NOVO; falha (false) se o destino já existe (sem sobrescrever). */
export function gravarNovoAtomico(destino: string, conteudo: string): boolean {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmp, conteudo, "utf-8");
    // link falha com EEXIST se o destino apareceu no meio do caminho.
    fs.linkSync(tmp, destino);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw err;
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* já não existe */ }
  }
}

export function slugOcupado(slug: string): boolean {
  return SLUGS_RESERVADOS.includes(slug) || fs.existsSync(caminhoPost(slug));
}

/** `base`, `base-2`, `base-3`… o primeiro que não existe (nem é reservado). */
export function slugLivre(base: string, ignorar?: string): string {
  const raiz = base || "post";
  const livre = (s: string) => s === ignorar || !slugOcupado(s);
  if (livre(raiz)) return raiz;
  for (let n = 2; n < 1000; n++) {
    const candidato = `${raiz}-${n}`;
    if (livre(candidato)) return candidato;
  }
  return `${raiz}-${Date.now()}`;
}

/** Chave livre na lixeira para o slug (mesmo slug excluído duas vezes). */
function chaveLivreNaLixeira(slug: string): string {
  if (!fs.existsSync(caminhoLixeira(slug))) return slug;
  for (let n = 2; n < 1000; n++) {
    if (!fs.existsSync(caminhoLixeira(`${slug}-${n}`))) return `${slug}-${n}`;
  }
  return `${slug}-${Date.now()}`;
}

/** Move o post para a lixeira. Devolve a chave na lixeira, ou null se o post não existe. */
export function moverParaLixeira(slug: string): string | null {
  const origem = caminhoPost(slug);
  if (!fs.existsSync(origem)) return null;
  const chave = chaveLivreNaLixeira(slug);
  const destino = caminhoLixeira(chave);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  try {
    fs.renameSync(origem, destino);
  } catch {
    // outro volume: copia e só depois apaga a origem
    fs.copyFileSync(origem, destino);
    fs.unlinkSync(origem);
  }
  return chave;
}

/** Tira da lixeira de volta para os posts, sem sobrescrever ninguém. Devolve o slug final. */
export function restaurarDaLixeira(chave: string): string | null {
  const origem = caminhoLixeira(chave);
  if (!fs.existsSync(origem)) return null;
  const slug = slugLivre(chave);
  const conteudo = fs.readFileSync(origem, "utf-8");
  if (!gravarNovoAtomico(caminhoPost(slug), conteudo)) return restaurarDaLixeira(chave); // corrida: tenta o próximo livre
  fs.unlinkSync(origem);
  return slug;
}

export function excluirDaLixeira(chave: string): boolean {
  const alvo = caminhoLixeira(chave);
  if (!fs.existsSync(alvo)) return false;
  fs.unlinkSync(alvo);
  return true;
}

export function chavesDaLixeira(): string[] {
  const dir = dirLixeira();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort();
}
