/**
 * lib/servicos-api.ts — como um arquivo de serviço vira o JSON que o painel
 * lê (SÓ servidor). Espelha lib/posts-api.ts para a coleção `servicos`.
 */
import { parseMd } from "@/lib/fs";
import { corpoParaEditor } from "@/lib/posts-corpo";
import { contarPalavrasHtml } from "@/lib/posts-texto";
import { txt } from "@/lib/posts-api";

export interface ServicoApi {
  id: string;
  slug: string;
  titulo: string;
  metaDescription: string;
  corpo: string;
  corpoFormato: "html" | "markdown";
  icone: string;
  imagem: string;
  imagemAlt: string;
  ordem: number;
  destaque: boolean;
  categoria: string;
  noindex: boolean;
  palavras: number;
}

export function servicoParaApi(chave: string, raw: string): ServicoApi {
  const { frontmatter: fm, content } = parseMd(raw);
  const titulo = txt(fm.titulo) || "(sem título)";
  const { html: corpo, formato } = corpoParaEditor(content, fm, titulo);
  const ordemNum = Number(fm.ordem);
  return {
    id: chave,
    slug: chave,
    titulo,
    metaDescription: txt(fm.metaDescription),
    corpo,
    corpoFormato: formato,
    icone: txt(fm.icone),
    imagem: txt(fm.imagem),
    imagemAlt: txt(fm.imagemAlt),
    ordem: Number.isFinite(ordemNum) ? ordemNum : 99,
    destaque: fm.destaque === true,
    categoria: txt(fm.categoria),
    noindex: fm.noindex === true,
    palavras: contarPalavrasHtml(corpo),
  };
}
