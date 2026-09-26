/**
 * lib/auth.ts — Autenticação da API do painel
 *
 * Dois caminhos de acesso:
 * 1. API key (x-api-key header) — para automação server-to-server (Claude Code, scripts)
 * 2. Sessão NextAuth — para o navegador do usuário logado no painel
 *
 * verificarApiKey()  → só aceita API key (rotas de bootstrap e internas)
 * verificarAcesso()  → aceita API key OU sessão válida (rotas chamadas pelo browser)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "./auth-options";
import { buscarPorId, UsuariosIlegiveisError, type PapelUsuario } from "./usuarios";

// ─── API key ──────────────────────────────────────────────────────────────────

export function verificarApiKey(req: NextRequest): NextResponse | null {
  const apiKey = process.env.PAINEL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, erro: "PAINEL_API_KEY não configurada no servidor" },
      { status: 503 }
    );
  }

  const keyRecebida = req.headers.get("x-api-key");
  if (!keyRecebida || keyRecebida !== apiKey) {
    return NextResponse.json(
      { ok: false, erro: "Não autorizado" },
      { status: 401 }
    );
  }

  return null;
}

// ─── Sessão ou API key ────────────────────────────────────────────────────────

/**
 * Aceita API key (automação) OU sessão NextAuth (browser).
 * Usar nas rotas chamadas tanto pelo Claude Code quanto pelas telas do painel.
 */
export async function verificarAcesso(req: NextRequest): Promise<NextResponse | null> {
  // Tentar API key primeiro (requests de automação)
  const apiKey = process.env.PAINEL_API_KEY;
  const keyRecebida = req.headers.get("x-api-key");

  if (apiKey && keyRecebida && keyRecebida === apiKey) {
    return null; // autorizado por API key
  }

  // Tentar sessão NextAuth (requests do browser)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return null; // autorizado por sessão
  }

  return NextResponse.json(
    { ok: false, erro: "Não autorizado" },
    { status: 401 }
  );
}

// ─── Papel (autorização) ──────────────────────────────────────────────────────

export type Ator =
  | { via: "apikey" }
  | { via: "sessao"; id: string; papel: PapelUsuario; email: string };

function apiKeyConfere(req: NextRequest): boolean {
  const apiKey = process.env.PAINEL_API_KEY;
  const recebida = req.headers.get("x-api-key");
  if (!apiKey || !recebida) return false;
  const a = Buffer.from(apiKey);
  const b = Buffer.from(recebida);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Quem está chamando: API key (automação, acesso total) ou o usuário da sessão,
 * REVALIDADO no usuarios.json a cada chamada (desativado/removido/rebaixado
 * vale na hora, não só quando o cookie expira). null = sem acesso.
 * Lança UsuariosIlegiveisError se o cadastro estiver corrompido.
 */
export async function obterAtor(req: NextRequest): Promise<Ator | null> {
  if (apiKeyConfere(req)) return { via: "apikey" };
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  const u = buscarPorId(id);
  if (!u || !u.acesso?.ativo || u.podeAcessar === false) return null;
  return { via: "sessao", id, papel: u.acesso.papel, email: u.acesso.emailLogin };
}

/**
 * Guarda de papel. API key passa sempre; sessão só se o papel ATUAL do usuário
 * estiver em `papeis` (ver lib/permissoes.ts). Devolve a resposta de erro
 * (401/403/503) ou null quando autorizado.
 */
export async function exigirPapel(
  req: NextRequest,
  papeis: readonly PapelUsuario[],
): Promise<NextResponse | null> {
  let ator: Ator | null;
  try {
    ator = await obterAtor(req);
  } catch (err) {
    if (err instanceof UsuariosIlegiveisError) {
      return NextResponse.json({ ok: false, erro: err.message }, { status: 503 });
    }
    throw err;
  }
  if (!ator) return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });
  if (ator.via === "apikey" || papeis.includes(ator.papel)) return null;
  return NextResponse.json(
    { ok: false, erro: "Seu papel não tem permissão para esta ação" },
    { status: 403 },
  );
}

// ─── Validação de slug ────────────────────────────────────────────────────────

/**
 * Valida slug para uso seguro em caminhos de arquivo e comandos shell.
 * Permite apenas letras minúsculas, números e hífens.
 */
export function validarSlug(slug: string): boolean {
  return /^[a-z0-9-]{1,100}$/.test(slug);
}
