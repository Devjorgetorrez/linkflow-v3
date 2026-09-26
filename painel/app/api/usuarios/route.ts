/**
 * app/api/usuarios/route.ts
 * GET  /api/usuarios   → lista usuários (modelo completo do Jorge, sem senhaHash)
 * POST /api/usuarios   → cria novo usuário (modelo completo)
 */

import { NextRequest, NextResponse } from "next/server";
import { lerUsuarios, salvarUsuarios, hashSenha, novoIdUsuario, toPublico, UsuariosIlegiveisError, type PapelUsuario, type Usuario } from "@/lib/usuarios";
import { exigirPapel, verificarApiKey } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { PAPEIS_VALIDOS, validarNovoUsuario } from "@/lib/usuarios-regras";

const PAPEIS: PapelUsuario[] = [...PAPEIS_VALIDOS];

function erroCadastro(err: unknown): NextResponse | null {
  return err instanceof UsuariosIlegiveisError
    ? NextResponse.json({ ok: false, erro: err.message }, { status: 503 })
    : null;
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["usuarios:GET"]);
  if (auth) return auth;

  try {
    const usuarios = lerUsuarios().map(toPublico);
    return NextResponse.json({ ok: true, usuarios });
  } catch (err) {
    return erroCadastro(err) ?? NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let usuarios: Usuario[];
  try {
    usuarios = lerUsuarios();
  } catch (err) {
    // Cadastro corrompido NÃO reabre o bootstrap: erro claro e nada é gravado.
    return erroCadastro(err) ?? NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
  const bootstrap = usuarios.length === 0;

  // Bootstrap: sem usuários → aceita API key para criar o primeiro admin
  const auth = bootstrap ? verificarApiKey(req) : await exigirPapel(req, MATRIZ["usuarios:POST"]);
  if (auth) return auth;

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

    const ativo = podeAcessar ? (body.acesso?.ativo ?? true) !== false : false;
    if (!podeAcessar && !podeAssinar) {
      return NextResponse.json({ ok: false, erro: "Marque pelo menos uma faceta (acessar ou assinar)." }, { status: 400 });
    }
    // E-mail (formato + único, sem diferenciar maiúsculas), senha e nome: mesma regra da tela.
    const invalido = validarNovoUsuario(
      { podeAcessar, emailLogin: typeof emailLogin === "string" ? emailLogin.trim() : "", senha, ativo, nome: nomePublico },
      usuarios,
    );
    if (invalido) return NextResponse.json({ ok: false, erro: invalido.erro }, { status: invalido.status });
    if (bootstrap && !(podeAcessar && ativo && papel === "administrador")) {
      return NextResponse.json({ ok: false, erro: "O primeiro usuário precisa ser um administrador ativo." }, { status: 400 });
    }
    emailLogin = typeof emailLogin === "string" ? emailLogin.trim() : "";

    const senhaHash = senha ? await hashSenha(senha) : undefined;
    const novoId = novoIdUsuario();

    const novoUsuario: Usuario = {
      id: novoId,
      podeAcessar,
      acesso: podeAcessar ? { emailLogin, papel, ativo } : undefined,
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
    return erroCadastro(err) ?? NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
