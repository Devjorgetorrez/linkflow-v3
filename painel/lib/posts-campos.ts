/**
 * lib/posts-campos.ts — o que a API aceita de um post e com que valores
 * iniciais nasce (SÓ servidor). Um lugar só, usado por POST /api/posts e
 * pelo PATCH que cria um post novo: os dois nascem IGUAIS (válidos para o
 * schema do site) em vez de cada um inventar os seus campos.
 */
import { painelParaFrontmatter } from "@/lib/frontmatter-post";
import {
  META_MAX, META_MIN, TITULO_MAX, TITULO_MIN, TITULO_PROVISORIO, statusVaiAoAr, tituloValido,
} from "@/lib/posts-regras";
import { ehAutorPublicavel, slugDoAutor } from "@/lib/sync-autores";
import { slugDoCategoria } from "@/lib/sync-categorias";
import type { Ator } from "@/lib/auth";
import type { Usuario } from "@/lib/usuarios";
import type { Categoria } from "@/mock/types";

const STATUS_ACEITOS = ["publicado", "pronto", "rascunho", "revisao", "revisão", "agendado"];

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
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
  if (typeof fm.autor === "string") fm.autor = slugDoAutor(fm.autor, usuarios);
  if (typeof fm.categoria === "string") fm.categoria = slugDoCategoria(fm.categoria, categorias);
  if (typeof body.imagemHero === "string" && body.imagemHero) fm.imagemHero = body.imagemHero;
  return fm;
}

/** Autor com que o post nasce: o próprio usuário logado (slug do site quando ele assina). */
export function autorPadrao(ator: Ator | null, usuarios: Usuario[]): string | undefined {
  if (ator?.via !== "sessao") return undefined;
  const u = usuarios.find((x) => x.id === ator.id);
  if (!u) return undefined;
  if (ehAutorPublicavel(u)) return u.autoria!.slug.trim();
  // Autor (papel) sem perfil público ainda: o id mantém a posse do post.
  return ator.papel === "autor" ? u.id : undefined;
}

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
  if (body.categoriaId === "" || body.categoria === "") limpar.push("categoria");
  if (body.kwPrimaria === "" || body.palavraChave === "") limpar.push("palavraChave");
  return limpar;
}

/** Tira do frontmatter as linhas de primeiro nível com as chaves dadas. */
export function removerCamposFrontmatter(raw: string, chaves: string[]): string {
  if (chaves.length === 0) return raw;
  const texto = raw.replace(/\r\n/g, "\n");
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return raw;
  const linhas = m[1].split("\n").filter((l) => !chaves.some((k) => l.startsWith(`${k}:`)));
  return `---\n${linhas.join("\n")}\n---${texto.slice(m[0].length)}`;
}
