/**
 * app/api/usuarios/route.ts
 * GET  /api/usuarios   → lista usuários (modelo completo do Jorge, sem senhaHash)
 * POST /api/usuarios   → cria novo usuário (modelo completo)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { lerUsuarios, salvarUsuarios, hashSenha, toPublico, type PapelUsuario } from "@/lib/usuarios";
import { verificarApiKey } from "@/lib/auth";

const PAPEIS: PapelUsuario[] = ["administrador", "editor", "autor"];
const SENHA_MIN = 8;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });
  }
  if ((session.user as { papel?: string }).papel !== "administrador") {
    return NextResponse.json({ ok: false, erro: "Acesso restrito a administradores" }, { status: 403 });
  }

  const usuarios = lerUsuarios().map(toPublico);
  return NextResponse.json({ ok: true, usuarios });
}

export async function POST(req: NextRequest) {
  const usuarios = lerUsuarios();

  // Bootstrap: sem usuários → aceita API key para criar o primeiro admin
  if (usuarios.length === 0) {
    const auth = verificarApiKey(req);
    if (auth) return auth;
  } else {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });
    }
    if ((session.user as { papel?: string }).papel !== "administrador") {
      return NextResponse.json({ ok: false, erro: "Acesso restrito a administradores" }, { status: 403 });
    }
  }

  try {
    const body = await req.json();

    // Suporte aos dois formatos:
    // 1. Formato simples (tela de novo usuário): { nome, email, senha, papel }
    // 2. Formato completo (modelo do Jorge): { podeAcessar, acesso: { emailLogin, papel }, autoria: {...} }
    const isFormatoCompleto = body.podeAcessar !== undefined || body.acesso !== undefined;

    let emailLogin: string;
    let papel: PapelUsuario;
    let senha: string | undefined;
    let podeAcessar: boolean;
    let podeAssinar: boolean;
    let nomePublico: string;

    if (isFormatoCompleto) {
      emailLogin = body.acesso?.emailLogin ?? "";
      papel = PAPEIS.includes(body.acesso?.papel) ? body.acesso.papel : "autor";
      senha = body.senha;
      podeAcessar = body.podeAcessar ?? true;
      podeAssinar = body.podeAssinar ?? true;
      nomePublico = body.autoria?.nomePublico ?? "";
    } else {
      // Formato simples
      emailLogin = body.email ?? "";
      papel = PAPEIS.includes(body.papel) ? body.papel : "autor";
      senha = body.senha;
      podeAcessar = true;
      podeAssinar = true;
      nomePublico = body.nome ?? "";
    }

    // E-mail de login só é obrigatório para quem acessa o painel — um autor
    // que só assina (podeAcessar: false) não loga, então não precisa dele.
    if (podeAcessar && !emailLogin) {
      return NextResponse.json({ ok: false, erro: "E-mail obrigatório" }, { status: 400 });
    }

    // Senha obrigatória só se podeAcessar
    if (podeAcessar && senha) {
      if (typeof senha !== "string" || senha.length < SENHA_MIN) {
        return NextResponse.json(
          { ok: false, erro: `Senha deve ter pelo menos ${SENHA_MIN} caracteres` },
          { status: 400 }
        );
      }
    }

    // E-mail duplicado
    if (usuarios.some((u) => u.acesso?.emailLogin.toLowerCase() === emailLogin.toLowerCase())) {
      return NextResponse.json({ ok: false, erro: "E-mail já cadastrado" }, { status: 409 });
    }

    const senhaHash = senha ? await hashSenha(senha) : undefined;
    const novoId = `u${Date.now()}`;

    const novoUsuario = {
      id: novoId,
      podeAcessar,
      acesso: podeAcessar ? { emailLogin, papel, ativo: body.acesso?.ativo ?? true } : undefined,
      podeAssinar,
      autoria: body.autoria ?? {
        nomePublico,
        slug: "",
        foto: "",
        cargo: "",
        bioCurta: "",
        bioLonga: "",
        conselho: "Nenhum",
        registro: "",
        especialidades: [],
        formacao: [],
        emailPublico: "",
        redes: { instagram: "", linkedin: "", facebook: "" },
        urlExterna: "",
        destaque: false,
      },
      senhaHash,
      criadoEm: new Date().toISOString().split("T")[0],
    };

    usuarios.push(novoUsuario);
    salvarUsuarios(usuarios);

    return NextResponse.json({ ok: true, usuario: toPublico(novoUsuario) });
  } catch (err) {
    console.error("[api/usuarios POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
