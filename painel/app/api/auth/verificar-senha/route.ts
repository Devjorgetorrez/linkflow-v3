/**
 * POST /api/auth/verificar-senha
 * Verifica se a senha atual do usuário está correta.
 * Usada pela tela de perfil antes de permitir a troca.
 * Exige sessão válida — não usa API key.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buscarPorEmail, verificarSenha } from "@/lib/usuarios";

export async function POST(req: NextRequest) {
  // Exige sessão ativa
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });
  }

  try {
    const { email, senha } = await req.json();

    // Garantir que o e-mail bate com a sessão (não deixar verificar senha de outro usuário)
    if (email !== session.user.email) {
      return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 403 });
    }

    const usuario = buscarPorEmail(email);
    if (!usuario) {
      return NextResponse.json({ ok: false, erro: "Usuário não encontrado" }, { status: 404 });
    }

    if (!usuario.senhaHash) {
      return NextResponse.json({ ok: false, erro: "Usuário não tem senha definida" }, { status: 400 });
    }

    const ok = await verificarSenha(senha, usuario.senhaHash);
    if (!ok) {
      return NextResponse.json({ ok: false, erro: "Senha incorreta" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
