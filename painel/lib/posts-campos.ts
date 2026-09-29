/**
 * lib/posts-campos.ts — o que a API aceita de um post e com que valores
 * iniciais nasce (SÓ servidor). Um lugar só, usado por POST /api/posts e
 * pelo PATCH que cria um post novo: os dois nascem IGUAIS (válidos para o
 * schema do site) em vez de cada um inventar os seus campos.
 */
import { faqCompleto, listaLimpa, painelParaFrontmatter } from "@/lib/frontmatter-post";
import fs from "fs";
import path from "path";
import { getContentDir, removerChavesFrontmatter, slugify } from "@/lib/fs";
import { caminhoPost } from "@/lib/posts-fs";
import { salvarUsuarios } from "@/lib/usuarios";
import {
  META_MAX, META_MIN, TITULO_MAX, TITULO_MIN, TITULO_PROVISORIO, statusVaiAoAr, tituloValido,
} from "@/lib/posts-regras";
import { slugParaAssinar, slugPublicavel } from "@/lib/sync-autores";
import { slugDoCategoria } from "@/lib/sync-categorias";
import type { Ator } from "@/lib/auth";
import type { Usuario } from "@/lib/usuarios";
import type { Categoria } from "@/mock/types";
import { hojeISOBrasil } from "@/lib/data-br";

const STATUS_ACEITOS = ["publicado", "pronto", "rascunho", "revisao", "revisão", "agendado"];

export function hojeISO(): string {
  return hojeISOBrasil();
}

/** Erro de validação (mensagem em português + status HTTP), ou null se estiver tudo certo. */
export interface ErroCampos { erro: string; status: 400 | 409 | 422 }

/**
 * Valida os campos que o corpo da requisição traz. `fm` já está no nome do
 * site (saída de painelParaFrontmatter). `metaFinal` = a meta que o post terá
 * depois da gravação (a nova, ou a que já está no arquivo).
 */
export function validarCamposPost(fm: Record<string, unknown>, metaFinal: string): ErroCampos | null {
  if (fm.titulo !== undefined && !tituloValido(fm.titulo)) {
    return { erro: `O título precisa ter de ${TITULO_MIN} a ${TITULO_MAX} caracteres.`, status: 400 };
  }
  if (fm.metaDescription !== undefined && String(fm.metaDescription).length > META_MAX) {
    return { erro: `A meta description passa de ${META_MAX} caracteres.`, status: 400 };
  }
  if (fm.publicadoEm !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(fm.publicadoEm))) {
    return { erro: "Data inválida: use o formato AAAA-MM-DD.", status: 400 };
  }
  if (fm.status !== undefined) {
    const s = String(fm.status).trim().toLowerCase();
    if (s === "lixeira") {
      return { erro: "Para mandar um post à lixeira use a ação Lixeira (o arquivo sai do site).", status: 400 };
    }
    if (!STATUS_ACEITOS.includes(s)) return { erro: `Status inválido: "${s}".`, status: 400 };
    if (statusVaiAoAr(s) && (metaFinal.length < META_MIN || metaFinal.length > META_MAX)) {
      return {
        erro: `Para publicar, a meta description precisa ter de ${META_MIN} a ${META_MAX} caracteres (hoje tem ${metaFinal.length}). O post continua como está.`,
        status: 422,
      };
    }
  }
  return null;
}

const LIM = { seoTitle: 70, resumo: 300, canonical: 500, capa: 500, capaAlt: 300, faq: 30, pergunta: 300, resposta: 3000, kws: 30, kw: 100 };

/**
 * Tipo e tamanho dos campos extras do corpo da requisição. Nada é aceito pela
 * metade: valor de tipo errado é recusado com a mensagem (400), nunca ignorado.
 */
export function validarCorpoRequisicao(body: Record<string, unknown>, usuarios: Usuario[]): ErroCampos | null {
  const bad = (erro: string): ErroCampos => ({ erro, status: 400 });
  const texto = (chave: string, max: number, nome: string): ErroCampos | null => {
    const v = body[chave];
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return bad(`${nome}: precisa ser um texto.`);
    if (v.trim().length > max) return bad(`${nome}: passa de ${max} caracteres.`);
    return null;
  };
  const e =
    texto("seoTitle", LIM.seoTitle, "Título SEO") ||
    texto("resumo", LIM.resumo, "Resumo") ||
    texto("canonical", LIM.canonical, "Canonical") ||
    texto("capa", LIM.capa, "Imagem de capa") ||
    texto("imagemCapa", LIM.capa, "Imagem de capa") ||
    texto("capaAlt", LIM.capaAlt, "Texto alternativo da capa") ||
    texto("imagemCapaAlt", LIM.capaAlt, "Texto alternativo da capa");
  if (e) return e;

  const canonical = typeof body.canonical === "string" ? body.canonical.trim() : "";
  if (canonical) {
    let ok = false;
    try {
      const u = new URL(canonical);
      ok = u.protocol === "https:" || u.protocol === "http:";
    } catch { /* inválida */ }
    if (!ok) return bad("Canonical: use um endereço completo, começando com https://.");
  }
  for (const chave of ["capa", "imagemCapa"]) {
    const v = typeof body[chave] === "string" ? String(body[chave]).trim() : "";
    if (v && !/^(https?:\/\/|\/(?!\/))/i.test(v)) return bad("Imagem de capa: use um endereço que comece com / ou https://.");
  }
  for (const chave of ["noindex", "geradoPorIA"]) {
    if (body[chave] !== undefined && typeof body[chave] !== "boolean") return bad(`${chave}: precisa ser verdadeiro ou falso.`);
  }
  if (body.faq !== undefined) {
    if (!Array.isArray(body.faq)) return bad("FAQ: precisa ser uma lista de perguntas e respostas.");
    if (body.faq.length > LIM.faq) return bad(`FAQ: no máximo ${LIM.faq} perguntas.`);
    for (const f of body.faq) {
      if (!f || typeof f !== "object") return bad("FAQ: cada item precisa ter pergunta e resposta.");
      const { pergunta, resposta } = f as Record<string, unknown>;
      if ((pergunta !== undefined && typeof pergunta !== "string") || (resposta !== undefined && typeof resposta !== "string")) {
        return bad("FAQ: pergunta e resposta precisam ser textos.");
      }
      if (String(pergunta ?? "").trim().length > LIM.pergunta) return bad(`FAQ: pergunta passa de ${LIM.pergunta} caracteres.`);
      if (String(resposta ?? "").trim().length > LIM.resposta) return bad(`FAQ: resposta passa de ${LIM.resposta} caracteres.`);
    }
  }
  if (body.kwSecundarias !== undefined) {
    if (!Array.isArray(body.kwSecundarias) || body.kwSecundarias.some((k) => typeof k !== "string")) {
      return bad("Palavras-chave secundárias: precisa ser uma lista de textos.");
    }
    if (body.kwSecundarias.length > LIM.kws) return bad(`Palavras-chave secundárias: no máximo ${LIM.kws}.`);
    if (body.kwSecundarias.some((k: string) => k.trim().length > LIM.kw)) return bad(`Palavras-chave secundárias: cada uma com até ${LIM.kw} caracteres.`);
  }
  // Autor: só slug/id de autor que pode assinar (o arquivo nunca guarda id de usuário).
  const pedido = body.autor ?? body.autorId;
  if (pedido !== undefined && pedido !== null && String(pedido).trim() !== "" && slugPublicavel(String(pedido), usuarios) === null) {
    return bad("Autor inválido: escolha alguém com perfil público de autor (nome e endereço próprio).");
  }
  return null;
}

/** Aceita "2026-09-26" e "2026-09-26T10:30…" (edição rápida antiga); devolve AAAA-MM-DD. */
export function normalizarData(v: unknown): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : String(v);
}

/** Campos do site a partir do corpo da requisição (nome do site, slugs de autor/categoria). */
export function camposDoCorpo(
  body: Record<string, unknown>,
  usuarios: Usuario[],
  categorias: Categoria[],
): Record<string, unknown> {
  const fm = painelParaFrontmatter(body);
  if (typeof fm.publicadoEm === "string") fm.publicadoEm = normalizarData(fm.publicadoEm);
  if (typeof fm.autor === "string") {
    const slug = slugPublicavel(fm.autor, usuarios); // nunca id de usuário no arquivo
    if (slug) fm.autor = slug;
    else delete fm.autor;
  }
  if (typeof fm.categoria === "string") fm.categoria = slugDoCategoria(fm.categoria, categorias);
  if (typeof body.imagemHero === "string" && body.imagemHero) fm.imagemHero = body.imagemHero;
  return fm;
}

/**
 * Autor com que o post nasce: o slug do perfil do usuário logado. Se ele pode
 * assinar mas ainda não tem slug, o slug é gerado do nome e gravado no perfil
 * dele. Se não pode assinar, devolve undefined (o post nasce sem `autor`).
 */
export function autorPadrao(ator: Ator | null, usuarios: Usuario[]): string | undefined {
  if (ator?.via !== "sessao") return undefined;
  const u = usuarios.find((x) => x.id === ator.id);
  if (!u) return undefined;
  return slugParaAssinar(u, usuarios, salvarUsuarios, slugify) ?? undefined;
}

export const ERRO_AUTOR_SEM_PERFIL =
  "Seu perfil ainda não tem nome público de autor, então não dá para assinar posts. Peça a um administrador para completar o seu perfil em Usuários.";

/**
 * Frontmatter de um post NOVO, sempre válido para o schema do site:
 * título (provisório se faltar), status rascunho, publicadoEm, autor.
 */
export function frontmatterInicial(
  campos: Record<string, unknown>,
  ator: Ator | null,
  usuarios: Usuario[],
): Record<string, unknown> {
  const hoje = hojeISO();
  const fm: Record<string, unknown> = {
    titulo: TITULO_PROVISORIO,
    metaDescription: "",
    publicadoEm: hoje,
    status: "rascunho",
    destaque: false,
    ...campos,
    atualizadoEm: hoje,
  };
  if (!fm.autor) {
    const a = autorPadrao(ator, usuarios);
    if (a) fm.autor = a;
  }
  return fm;
}

/**
 * Campos que o usuário ESVAZIOU de propósito (desmarcou a categoria, apagou a
 * palavra-chave). O tradutor do painel ignora string vazia para não gravar
 * `categoria:` em branco; aqui a linha é REMOVIDA do arquivo — sem isso a
 * categoria desmarcada voltava a aparecer ao recarregar.
 */
export function camposParaLimpar(body: Record<string, unknown>): string[] {
  const limpar: string[] = [];
  const vazio = (v: unknown) => typeof v === "string" && v.trim() === "";
  if (body.categoriaId === "" || body.categoria === "") limpar.push("categoria");
  if (body.kwPrimaria === "" || body.palavraChave === "") limpar.push("kwPrimaria", "palavraChave");
  if (Array.isArray(body.relacionados) && (listaLimpa(body.relacionados)?.length ?? 0) === 0) limpar.push("relacionados");
  if (vazio(body.pilar)) limpar.push("pilar");
  if (vazio(body.autorId) || vazio(body.autor)) limpar.push("autor");
  if (vazio(body.seoTitle)) limpar.push("seoTitle");
  if (vazio(body.resumo)) limpar.push("resumo");
  if (vazio(body.canonical)) limpar.push("canonical");
  if (vazio(body.capa) || vazio(body.imagemCapa)) limpar.push("imagemCapa");
  if (vazio(body.capaAlt) || vazio(body.imagemCapaAlt)) limpar.push("imagemCapaAlt");
  if (body.noindex === false) limpar.push("noindex");
  if (body.geradoPorIA === false) limpar.push("geradoPorIA");
  if (faqCompleto(body.faq)?.length === 0) limpar.push("faq");
  if (listaLimpa(body.kwSecundarias)?.length === 0) limpar.push("kwSecundarias");
  // Sem imagem não há texto alternativo sobrando.
  if ((vazio(body.capa) || vazio(body.imagemCapa)) && body.capaAlt === undefined && body.imagemCapaAlt === undefined) limpar.push("imagemCapaAlt");
  return limpar;
}

/** Tira do frontmatter as linhas de primeiro nível com as chaves dadas (e o bloco de cada uma). */
export function removerCamposFrontmatter(raw: string, chaves: string[]): string {
  return removerChavesFrontmatter(raw, chaves);
}

/** Máximo de posts relacionados escolhidos à mão (o site usa até 3). */
export const MAX_RELACIONADOS = 3;

/** Slugs dos serviços/páginas pilar que existem (content/servicos). */
export function slugsDeServicos(): string[] {
  const dir = path.join(getContentDir(), "servicos");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort();
}

/**
 * `relacionados` e `pilar` do corpo da requisição: tipo certo e slugs que existem.
 * `slugAtual` = o post que está sendo salvo (não pode listar a si mesmo).
 */
export function validarVinculos(body: Record<string, unknown>, slugAtual?: string): ErroCampos | null {
  const bad = (erro: string): ErroCampos => ({ erro, status: 400 });
  if (body.relacionados !== undefined) {
    if (!Array.isArray(body.relacionados) || body.relacionados.some((s) => typeof s !== "string")) {
      return bad("Posts relacionados: precisa ser uma lista de endereços (slugs) de posts.");
    }
    const lista = listaLimpa(body.relacionados) ?? [];
    if (lista.length > MAX_RELACIONADOS) return bad(`Posts relacionados: no máximo ${MAX_RELACIONADOS}.`);
    for (const s of lista) {
      if (s === slugAtual) return bad("Posts relacionados: um artigo não pode indicar a si mesmo.");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) || !fs.existsSync(caminhoPost(s))) {
        return bad(`Posts relacionados: o post "${s}" não existe.`);
      }
    }
  }
  if (body.pilar !== undefined && body.pilar !== null) {
    if (typeof body.pilar !== "string") return bad("Conteúdo pilar: precisa ser o endereço (slug) de uma página de serviço.");
    const s = body.pilar.trim();
    if (s && !slugsDeServicos().includes(s)) return bad(`Conteúdo pilar: a página "${s}" não existe entre os serviços do site.`);
  }
  return null;
}
