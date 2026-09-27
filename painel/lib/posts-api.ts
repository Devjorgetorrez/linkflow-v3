/**
 * lib/posts-api.ts — como um arquivo de post vira o JSON que o painel lê
 * (SÓ servidor). Usado pela lista, pela lixeira e por qualquer rota que
 * devolva post.
 */
import { parseMd } from "@/lib/fs";
import { lerStatusPost } from "@/lib/status-post";
import { resolverAutorDoPost } from "@/lib/sync-autores";
import { corpoParaEditor } from "@/lib/posts-corpo";
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

/** faq do frontmatter → [{id, pergunta, resposta}] (o painel precisa de id para editar a lista). */
export function faqDoFrontmatter(v: unknown): { id: string; pergunta: string; resposta: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .map((f, i) => ({ id: `f${i + 1}`, pergunta: txt(f.pergunta), resposta: txt(f.resposta) }))
    .filter((f) => f.pergunta !== "" || f.resposta !== "");
}

/** kwSecundarias do frontmatter → lista de textos. */
export function listaTextos(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => txt(x).trim()).filter(Boolean);
  const t = txt(v).trim();
  return t ? [t] : [];
}

export function postParaApi(
  chave: string,
  raw: string,
  usuarios: Usuario[],
  categorias: Categoria[],
) {
  const { frontmatter: fm, content } = parseMd(raw);
  const titulo = txt(fm.titulo ?? fm.title) || "(sem título)";
  const meta = txt(fm.metaDescription ?? fm.descricao ?? fm.description);
  // Markdown (skills) vira HTML para o editor; o título não fica dentro do corpo.
  const { html: corpo, formato } = corpoParaEditor(content, fm, titulo);
  const autor = resolverAutorDoPost(txt(fm.autor), usuarios);
  const faq = faqDoFrontmatter(fm.faq);
  return {
    id: chave,
    slug: chave,
    titulo,
    resumo: txt(fm.resumo),
    corpo,
    corpoFormato: formato,
    data: txt(fm.publicadoEm ?? fm.date),
    status: lerStatusPost(fm.status),
    destaque: fm.destaque === true,
    // `kwPrimaria` é o nome oficial; `palavraChave` (skills antigas) é lido como alias.
    kwPrimaria: txt(fm.kwPrimaria ?? fm.palavraChave),
    palavraChave: txt(fm.kwPrimaria ?? fm.palavraChave),
    relacionados: listaTextos(fm.relacionados),
    pilar: txt(fm.pilar).trim(),
    kwSecundarias: listaTextos(fm.kwSecundarias),
    seoTitle: txt(fm.seoTitle), // vazio = o site usa o título
    metaDescription: meta,
    canonical: txt(fm.canonical), // vazio = automático
    noindex: fm.noindex === true,
    ogImagem: txt(fm.imagemHero),
    capa: txt(fm.imagemCapa),
    capaAlt: txt(fm.imagemCapaAlt),
    schemaTipo: faq.length > 0 ? "FAQPage" : "Article",
    faq,
    fontes: [],
    palavras: contarPalavrasHtml(corpo),
    categoriaId: idDoCategoria(txt(fm.categoria), categorias),
    autorId: autor.id,
    autorNome: autor.nome,
    autorReconhecido: autor.reconhecido,
    geradoPorIA: veioDaIA(fm),
  };
}
