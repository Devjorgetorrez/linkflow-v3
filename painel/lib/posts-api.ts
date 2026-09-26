/**
 * lib/posts-api.ts — como um arquivo de post vira o JSON que o painel lê
 * (SÓ servidor). Usado pela lista, pela lixeira e por qualquer rota que
 * devolva post.
 */
import { parseMd } from "@/lib/fs";
import { lerStatusPost } from "@/lib/status-post";
import { idDoAutor } from "@/lib/sync-autores";
import { idDoCategoria } from "@/lib/sync-categorias";
import { contarPalavrasHtml } from "@/lib/posts-texto";
import type { Usuario } from "@/lib/usuarios";
import type { Categoria } from "@/mock/types";

/** Qualquer valor do frontmatter → texto (o parser lê "2026" como número, "true" como booleano). */
export function txt(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

/** Só o marcador REAL de geração por IA conta para o selo "IA" (A74). */
export function veioDaIA(fm: Record<string, unknown>): boolean {
  if (fm.geradoPorIA === true) return true;
  const origem = txt(fm.origem).trim().toLowerCase();
  return origem === "ia" || origem === "agente";
}

export function postParaApi(
  chave: string,
  raw: string,
  usuarios: Usuario[],
  categorias: Categoria[],
) {
  const { frontmatter: fm, content } = parseMd(raw);
  return {
    id: chave,
    slug: chave,
    titulo: txt(fm.titulo ?? fm.title) || "(sem título)",
    resumo: txt(fm.metaDescription ?? fm.descricao ?? fm.description),
    corpo: content,
    data: txt(fm.publicadoEm ?? fm.date),
    status: lerStatusPost(fm.status),
    destaque: fm.destaque === true,
    palavraChave: txt(fm.palavraChave),
    seoTitle: txt(fm.titulo),
    metaDescription: txt(fm.metaDescription ?? fm.descricao ?? fm.description),
    canonical: "",
    noindex: false,
    ogImagem: txt(fm.imagemHero),
    schemaTipo: "Article",
    faq: [],
    fontes: [],
    palavras: contarPalavrasHtml(content),
    categoriaId: idDoCategoria(txt(fm.categoria), categorias),
    autorId: idDoAutor(txt(fm.autor), usuarios),
    geradoPorIA: veioDaIA(fm),
  };
}
