/**
 * lib/usuarios-regras.ts — regras PURAS de usuários (sem fs, sem React, sem
 * imports): usadas pelo servidor (rotas) e pela tela, e testáveis em Node
 * (`node --experimental-strip-types`).
 */

export const PAPEIS_VALIDOS = ["administrador", "editor", "autor"] as const;
export type PapelRegra = (typeof PAPEIS_VALIDOS)[number];

export const SENHA_MIN = 8;
export const NOME_MIN = 2;

/** Forma mínima que as regras precisam (serve para Usuario e UsuarioPublico). */
export interface UsuarioMin {
  id: string;
  podeAcessar?: boolean;
  acesso?: { emailLogin?: string; papel?: string; ativo?: boolean };
}

export function emailValido(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const e = email.trim();
  return e.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(e);
}

export function mesmoEmail(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Conta que consegue entrar no painel como administrador. */
export function ehAdminAtivo(u: UsuarioMin): boolean {
  return u.podeAcessar !== false && u.acesso?.papel === "administrador" && u.acesso?.ativo === true;
}

/** true se `id` é o ÚNICO administrador ativo da lista. */
export function ehUltimoAdminAtivo(usuarios: UsuarioMin[], id: string): boolean {
  const admins = usuarios.filter(ehAdminAtivo);
  return admins.length === 1 && admins[0].id === id;
}

export interface EntradaNovoUsuario {
  podeAcessar: boolean;
  emailLogin: string;
  senha?: string;
  ativo: boolean;
  nome: string;
}

export interface ErroValidacao { erro: string; status: 400 | 409 }

/** Erro em português (com o status HTTP) ou null. `existentes` = usuários já cadastrados. */
export function validarNovoUsuario(e: EntradaNovoUsuario, existentes: UsuarioMin[]): ErroValidacao | null {
  if (typeof e.nome !== "string" || e.nome.trim().length < NOME_MIN) {
    return { erro: `Informe o nome (mínimo ${NOME_MIN} caracteres).`, status: 400 };
  }
  if (e.podeAcessar) {
    if (!emailValido(e.emailLogin)) return { erro: "Informe um e-mail de login válido.", status: 400 };
    if (existentes.some((u) => mesmoEmail(u.acesso?.emailLogin, e.emailLogin))) {
      return { erro: "E-mail já cadastrado.", status: 409 };
    }
    if (e.ativo && (typeof e.senha !== "string" || e.senha.length < SENHA_MIN)) {
      return { erro: `A senha é obrigatória e deve ter pelo menos ${SENHA_MIN} caracteres.`, status: 400 };
    }
  }
  if (e.senha !== undefined && e.senha !== "" && (typeof e.senha !== "string" || e.senha.length < SENHA_MIN)) {
    return { erro: `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`, status: 400 };
  }
  return null;
}

/** Depois de uma alteração, ainda sobra algum admin ativo? (só se antes havia). */
export function alteracaoRemoveUltimoAdmin(antes: UsuarioMin[], depois: UsuarioMin[], id: string): boolean {
  return ehUltimoAdminAtivo(antes, id) && !depois.some(ehAdminAtivo);
}

/** O post (campo `autor` do frontmatter: slug ou id) é deste usuário? */
export function ehPostDoUsuario(
  autorDoPost: unknown,
  u: { id: string; autoria?: { slug?: string } },
): boolean {
  const v = String(autorDoPost ?? "").trim();
  if (!v) return false;
  return v === u.id || (!!u.autoria?.slug && v === u.autoria.slug);
}

const ALFABETO_SENHA = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";

/** Senha aleatória com crypto.getRandomValues (sem viés de módulo). */
export function gerarSenhaSegura(tamanho = 16): string {
  const n = ALFABETO_SENHA.length;
  const limite = 256 - (256 % n);
  let out = "";
  const buf = new Uint8Array(tamanho * 2);
  while (out.length < tamanho) {
    globalThis.crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < limite && out.length < tamanho) out += ALFABETO_SENHA[b % n];
    }
  }
  return out;
}
