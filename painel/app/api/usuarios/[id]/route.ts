/**
 * app/api/usuarios/[id]/route.ts
 * PATCH  /api/usuarios/:id   → atualiza usuário (acesso + autoria)
 * DELETE /api/usuarios/:id   → desativa usuário
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { lerUsuarios, salvarUsuarios, hashSenha, toPublico, type PapelUsuario } from "@/lib/usuarios";

const PAPEIS: PapelUsuario[] = ["administrador", "editor", "autor"];
const SENHA_MIN = 8;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const sessionUserId = (session.user as { id?: string }).id;
    const sessionPapel = (session.user as { papel?: string }).papel;
    const isAdmin = sessionPapel === "administrador";
    const isProprioUsuario = sessionUserId === id;

    if (!isAdmin && !isProprioUsuario) {
      return NextResponse.json({ ok: false, erro: "Acesso negado" }, { status: 403 });
    }

    const usuarios = lerUsuarios();
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) {
      return NextResponse.json({ ok: false, erro: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, usuario: toPublico(usuario) });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const sessionUserId = (session.user as { id?: string }).id;
    const sessionPapel = (session.user as { papel?: string }).papel;
    const isAdmin = sessionPapel === "administrador";
    const isProprioUsuario = sessionUserId === id;

    if (!isAdmin && !isProprioUsuario) {
      return NextResponse.json({ ok: false, erro: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const usuarios = lerUsuarios();
    const idx = usuarios.findIndex((u) => u.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Usuário não encontrado" }, { status: 404 });
    }

    const u = { ...usuarios[idx] };

    // ── Campos de acesso ───────────────────────────────────────────────────────

    // podeAcessar e podeAssinar (admin ou próprio)
    if (body.podeAcessar !== undefined && (isAdmin || isProprioUsuario)) {
      u.podeAcessar = Boolean(body.podeAcessar);
    }
    if (body.podeAssinar !== undefined && (isAdmin || isProprioUsuario)) {
      u.podeAssinar = Boolean(body.podeAssinar);
    }

    // acesso: emailLogin, papel, ativo
    if (body.acesso !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ ok: false, erro: "Apenas administradores podem alterar dados de acesso" }, { status: 403 });
      }
      u.acesso = {
        emailLogin: body.acesso.emailLogin ?? u.acesso?.emailLogin ?? "",
        papel: PAPEIS.includes(body.acesso.papel) ? body.acesso.papel : (u.acesso?.papel ?? "autor"),
        ativo: body.acesso.ativo !== undefined ? Boolean(body.acesso.ativo) : (u.acesso?.ativo ?? true),
      };
    }

    // nome (shorthand para autoria.nomePublico — compatibilidade com tela de perfil)
    if (body.nome !== undefined && (isAdmin || isProprioUsuario)) {
      if (!u.autoria) u.autoria = autoriaPadrao();
      u.autoria.nomePublico = String(body.nome).trim();
    }

    // papel (shorthand — compatibilidade com tela de perfil)
    if (body.papel !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ ok: false, erro: "Apenas administradores podem alterar papéis" }, { status: 403 });
      }
      if (!PAPEIS.includes(body.papel)) {
        return NextResponse.json({ ok: false, erro: "Papel inválido" }, { status: 400 });
      }
      if (!u.acesso) u.acesso = { emailLogin: "", papel: body.papel, ativo: true };
      else u.acesso.papel = body.papel;
    }

    // ativo (shorthand)
    if (body.ativo !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ ok: false, erro: "Apenas administradores podem ativar/desativar contas" }, { status: 403 });
      }
      if (!u.acesso) u.acesso = { emailLogin: "", papel: "autor", ativo: Boolean(body.ativo) };
      else u.acesso.ativo = Boolean(body.ativo);
    }

    // senha
    if (body.senha !== undefined && (isAdmin || isProprioUsuario)) {
      if (typeof body.senha !== "string" || body.senha.length < SENHA_MIN) {
        return NextResponse.json(
          { ok: false, erro: `Senha deve ter pelo menos ${SENHA_MIN} caracteres` },
          { status: 400 }
        );
      }
      u.senhaHash = await hashSenha(body.senha);
    }

    // ── Campos de autoria (modelo completo do Jorge) ───────────────────────────

    if (body.autoria !== undefined && (isAdmin || isProprioUsuario)) {
      const a = body.autoria;
      if (!u.autoria) u.autoria = autoriaPadrao();

      if (a.nomePublico !== undefined) u.autoria.nomePublico = String(a.nomePublico);
      if (a.slug !== undefined) u.autoria.slug = String(a.slug);
      if (a.foto !== undefined) u.autoria.foto = String(a.foto);
      if (a.fotoAlt !== undefined) u.autoria.fotoAlt = String(a.fotoAlt);
      if (a.cargo !== undefined) u.autoria.cargo = String(a.cargo);
      if (a.bioCurta !== undefined) u.autoria.bioCurta = String(a.bioCurta);
      if (a.bioLonga !== undefined) u.autoria.bioLonga = String(a.bioLonga);
      if (a.conselho !== undefined) u.autoria.conselho = String(a.conselho);
      if (a.registro !== undefined) u.autoria.registro = String(a.registro);
      if (a.especialidades !== undefined) u.autoria.especialidades = Array.isArray(a.especialidades) ? a.especialidades : [];
      if (a.formacao !== undefined) u.autoria.formacao = Array.isArray(a.formacao) ? a.formacao : [];
      if (a.emailPublico !== undefined) u.autoria.emailPublico = String(a.emailPublico);
      if (a.urlExterna !== undefined) u.autoria.urlExterna = String(a.urlExterna);
      if (a.destaque !== undefined) u.autoria.destaque = Boolean(a.destaque);
      if (a.redes !== undefined) {
        u.autoria.redes = {
          instagram: a.redes.instagram ?? u.autoria.redes?.instagram ?? "",
          linkedin: a.redes.linkedin ?? u.autoria.redes?.linkedin ?? "",
          facebook: a.redes.facebook ?? u.autoria.redes?.facebook ?? "",
          x: a.redes.x ?? u.autoria.redes?.x,
          youtube: a.redes.youtube ?? u.autoria.redes?.youtube,
          tiktok: a.redes.tiktok ?? u.autoria.redes?.tiktok,
          site: a.redes.site ?? u.autoria.redes?.site,
          lattes: a.redes.lattes ?? u.autoria.redes?.lattes,
        };
      }
    }

    usuarios[idx] = u;
    salvarUsuarios(usuarios);

    return NextResponse.json({ ok: true, usuario: toPublico(u) });
  } catch (err) {
    console.error("[api/usuarios PATCH]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });
  }
  if ((session.user as { papel?: string }).papel !== "administrador") {
    return NextResponse.json({ ok: false, erro: "Apenas administradores podem desativar contas" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const sessionUserId = (session.user as { id?: string }).id;
    if (sessionUserId === id) {
      return NextResponse.json({ ok: false, erro: "Você não pode desativar sua própria conta" }, { status: 400 });
    }

    const usuarios = lerUsuarios();
    const idx = usuarios.findIndex((u) => u.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Usuário não encontrado" }, { status: 404 });
    }

    if (usuarios[idx].acesso) {
      usuarios[idx].acesso!.ativo = false;
    }
    salvarUsuarios(usuarios);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

function autoriaPadrao(): import("@/lib/usuarios").UsuarioAutoria {
  return {
    nomePublico: "",
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
  };
}
