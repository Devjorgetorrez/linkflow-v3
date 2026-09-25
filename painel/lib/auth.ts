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
import { authOptions } from "./auth-options";

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

// ─── Validação de slug ────────────────────────────────────────────────────────

/**
 * Valida slug para uso seguro em caminhos de arquivo e comandos shell.
 * Permite apenas letras minúsculas, números e hífens.
 */
export function validarSlug(slug: string): boolean {
  return /^[a-z0-9-]{1,100}$/.test(slug);
}
