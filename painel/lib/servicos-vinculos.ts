/**
 * lib/servicos-vinculos.ts — integridade quando um SERVIÇO muda de endereço
 * ou vai para a lixeira (SÓ servidor).
 *
 * lib/links-slug.ts já cobre, para qualquer coleção (inclusive `servicos`,
 * que já está em COLECOES): links no corpo/frontmatter em Markdown/HTML e o
 * menu do config/site.ts (reescreverLinksDoSlug / referenciasDoPost).
 *
 * O que falta, específico de serviço: o campo `pilar:` de cada POST aponta
 * para o slug de um serviço (a página que o artigo apoia — ver
 * lib/posts-campos.ts). links-slug.ts não conhece esse campo (é só de posts),
 * então esta lib cuida dele à parte, com a mesma gravação atômica.
 */
import fs from "fs";
import path from "path";
import { atualizarFrontmatter, getContentDir, parseMd, removerChavesFrontmatter } from "@/lib/fs";
import { gravarAtomico } from "@/lib/posts-fs";

interface PostComPilar { caminho: string; slug: string; titulo: string }

function postsComPilar(pilarSlug: string): PostComPilar[] {
  const dir = path.join(getContentDir(), "posts");
  if (!fs.existsSync(dir)) return [];
  const out: PostComPilar[] = [];
  for (const arquivo of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const caminho = path.join(dir, arquivo);
    const raw = fs.readFileSync(caminho, "utf-8");
    const fm = parseMd(raw).frontmatter;
    if (String(fm.pilar ?? "").trim() === pilarSlug) {
      out.push({ caminho, slug: arquivo.replace(/\.md$/, ""), titulo: String(fm.titulo ?? "").trim() });
    }
  }
  return out;
}

/** O serviço mudou de endereço: `pilar:` dos posts que apontavam para ele acompanha. */
export function reescreverPilarDoServico(antigo: string, novo: string): { arquivo: string; titulo: string }[] {
  const mudou: { arquivo: string; titulo: string }[] = [];
  for (const p of postsComPilar(antigo)) {
    const raw = fs.readFileSync(p.caminho, "utf-8");
    gravarAtomico(p.caminho, atualizarFrontmatter(raw, { pilar: novo }));
    mudou.push({ arquivo: `posts/${p.slug}.md`, titulo: p.titulo });
  }
  return mudou;
}

/** O serviço foi para a lixeira: tira `pilar:` dos posts que apontavam para ele (não inventa outro). */
export function removerPilarDoServico(slug: string): { arquivo: string; titulo: string }[] {
  const mudou: { arquivo: string; titulo: string }[] = [];
  for (const p of postsComPilar(slug)) {
    const raw = fs.readFileSync(p.caminho, "utf-8");
    gravarAtomico(p.caminho, removerChavesFrontmatter(raw, ["pilar"]));
    mudou.push({ arquivo: `posts/${p.slug}.md`, titulo: p.titulo });
  }
  return mudou;
}

/** Quantos posts têm este serviço como pilar (para avisar antes de excluir/renomear). */
export function contarPostsComPilar(slug: string): number {
  return postsComPilar(slug).length;
}
