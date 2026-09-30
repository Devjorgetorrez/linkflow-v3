/**
 * lib/servicos-campos.ts — o que a API de serviços aceita e com que valores
 * iniciais nasce (SÓ servidor). Espelha lib/posts-campos.ts + lib/frontmatter-post.ts
 * para a coleção `servicos` (_astro/src/content.config.ts).
 *
 * Diferença de posts: o schema de `servicos` não tem `status`/rascunho — título
 * e metaDescription são SEMPRE obrigatórios (ver lib/servicos-regras.ts).
 */
import { slugOcupado as slugOcupadoPorPost } from "@/lib/posts-fs";
import { slugOcupadoPorServico } from "@/lib/servicos-fs";
import {
  META_MAX, META_MIN, META_PROVISORIA_SERVICO, TITULO_MAX, TITULO_MIN, TITULO_PROVISORIO_SERVICO,
  metaValida, tituloValido,
} from "@/lib/servicos-regras";
import { hojeISOBrasil } from "@/lib/data-br";

export interface ErroCampos { erro: string; status: 400 | 409 | 422 }

export function hojeISO(): string {
  return hojeISOBrasil();
}

/** Um slug de serviço colide com QUALQUER coisa que more na raiz do site (outro serviço ou um post). */
export function slugOcupadoGlobal(slug: string): boolean {
  return slugOcupadoPorServico(slug) || slugOcupadoPorPost(slug);
}

const LIM = { icone: 60, imagem: 500, imagemAlt: 300, categoria: 80 };

/**
 * Tipo e tamanho dos campos do corpo da requisição. Nada é aceito pela
 * metade: valor de tipo errado é recusado com mensagem (400), nunca ignorado.
 */
export function validarCorpoRequisicaoServico(body: Record<string, unknown>): ErroCampos | null {
  const bad = (erro: string): ErroCampos => ({ erro, status: 400 });
  const texto = (chave: string, max: number, nome: string): ErroCampos | null => {
    const v = body[chave];
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return bad(`${nome}: precisa ser um texto.`);
    if (v.trim().length > max) return bad(`${nome}: passa de ${max} caracteres.`);
    return null;
  };
  const e =
    texto("icone", LIM.icone, "Ícone") ||
    texto("imagem", LIM.imagem, "Imagem") ||
    texto("imagemAlt", LIM.imagemAlt, "Texto alternativo da imagem") ||
    texto("categoria", LIM.categoria, "Categoria");
  if (e) return e;

  if (body.imagem !== undefined && body.imagem !== null && String(body.imagem).trim() !== "") {
    const v = String(body.imagem).trim();
    if (!/^(https?:\/\/|\/(?!\/))/i.test(v)) return bad("Imagem: use um endereço que comece com / ou https://.");
  }
  if (body.ordem !== undefined && (typeof body.ordem !== "number" || !Number.isFinite(body.ordem))) {
    return bad("Ordem: precisa ser um número.");
  }
  for (const chave of ["destaque", "noindex"] as const) {
    if (body[chave] !== undefined && typeof body[chave] !== "boolean") return bad(`${chave}: precisa ser verdadeiro ou falso.`);
  }
  return null;
}

/** Título e metaDescription — SEMPRE obrigatórios (não existe rascunho no schema de servicos). */
export function validarCamposObrigatoriosServico(fm: Record<string, unknown>): ErroCampos | null {
  if (!tituloValido(fm.titulo)) {
    return { erro: `O título precisa ter de ${TITULO_MIN} a ${TITULO_MAX} caracteres.`, status: 422 };
  }
  if (!metaValida(fm.metaDescription)) {
    return {
      erro: `A meta description precisa ter de ${META_MIN} a ${META_MAX} caracteres (hoje tem ${String(fm.metaDescription ?? "").trim().length}).`,
      status: 422,
    };
  }
  return null;
}

/**
 * Bloqueia deixar um serviço público (noindex: false) sem conteúdo de
 * verdade: título/meta ainda no texto provisório, marcador `[CAMPO]`
 * sobrando, ou corpo vazio. Sem isso o serviço ia ao Google com "Novo
 * serviço" e o texto de instrução na descrição de busca (erro 108,
 * Relatório de Testes 6). Só entra em vigor quando o resultado final é
 * público — ficar como rascunho (noindex: true) continua livre.
 */
export function validarPublicacaoServico(fm: Record<string, unknown>, corpo: string): ErroCampos | null {
  if (fm.noindex !== false) return null; // segue como rascunho, sem restrição de conteúdo
  const titulo = typeof fm.titulo === "string" ? fm.titulo.trim() : "";
  const meta = typeof fm.metaDescription === "string" ? fm.metaDescription : "";
  if (!titulo || titulo === TITULO_PROVISORIO_SERVICO) {
    return { erro: "Escreva o título real do serviço antes de tirar do rascunho (tire o \"Novo serviço\").", status: 422 };
  }
  if (meta.includes("[CAMPO]")) {
    return { erro: "A descrição de busca ainda tem o marcador [CAMPO] — escreva o texto real antes de publicar.", status: 422 };
  }
  if (corpo.trim() === "") {
    return { erro: "O serviço está sem texto no corpo. Escreva a descrição antes de tirar do rascunho.", status: 422 };
  }
  return null;
}

/** Painel → frontmatter do site: só campos que o schema `servicos` conhece, com o nome do site. */
export function painelParaFrontmatterServico(entrada: Record<string, unknown>): Record<string, unknown> {
  const fm: Record<string, unknown> = {};
  const def = (chave: string, valor: unknown) => {
    if (valor !== undefined) fm[chave] = valor;
  };
  const texto = (v: unknown) => (v === undefined || v === null ? undefined : String(v));
  const cheio = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);

  def("titulo", texto(entrada.titulo));
  def("metaDescription", texto(entrada.metaDescription));
  def("icone", cheio(entrada.icone));
  def("imagem", cheio(entrada.imagem));
  def("imagemAlt", cheio(entrada.imagemAlt));
  def("categoria", cheio(entrada.categoria));
  if (entrada.ordem !== undefined && typeof entrada.ordem === "number") fm.ordem = entrada.ordem;
  if (entrada.destaque !== undefined) fm.destaque = Boolean(entrada.destaque);
  if (entrada.noindex !== undefined) fm.noindex = Boolean(entrada.noindex);

  for (const chave of ["titulo", "metaDescription"]) {
    if (fm[chave] === "") delete fm[chave];
  }
  return fm;
}

/** Campos que o usuário esvaziou de propósito — a linha é REMOVIDA do arquivo (não fica `campo: ""`). */
export function camposParaLimparServico(body: Record<string, unknown>): string[] {
  const limpar: string[] = [];
  const vazio = (v: unknown) => typeof v === "string" && v.trim() === "";
  if (vazio(body.icone)) limpar.push("icone");
  if (vazio(body.imagem)) limpar.push("imagem");
  if (vazio(body.imagemAlt)) limpar.push("imagemAlt");
  if (vazio(body.categoria)) limpar.push("categoria");
  // Sem imagem não há texto alternativo sobrando.
  if (vazio(body.imagem) && body.imagemAlt === undefined) limpar.push("imagemAlt");
  return limpar;
}

/**
 * Frontmatter de um serviço NOVO — sempre válido para o schema do site
 * (título e meta provisórios, marcados `[CAMPO]`, nunca vazios: o schema não
 * aceita vazio e o build quebraria).
 */
export function frontmatterInicialServico(campos: Record<string, unknown>): Record<string, unknown> {
  return {
    titulo: TITULO_PROVISORIO_SERVICO,
    metaDescription: META_PROVISORIA_SERVICO,
    ordem: 99,
    destaque: false,
    // Nasce fora do Google: título e meta ainda são placeholder [CAMPO] e o
    // corpo está vazio. Sem isso a página ia ao ar indexável com esse texto
    // se o autor esquecesse de completar antes de publicar (erro 108,
    // Relatório de Testes 6). O usuário desliga o noindex na tela quando o
    // conteúdo estiver pronto.
    noindex: true,
    ...campos,
  };
}
