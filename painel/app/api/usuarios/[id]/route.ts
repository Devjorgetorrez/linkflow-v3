/**
 * app/api/usuarios/[id]/route.ts
 * GET    /api/usuarios/:id   → lê usuário (admin, ou o próprio)
 * PATCH  /api/usuarios/:id   → atualiza usuário (acesso + autoria)
 * DELETE /api/usuarios/:id   → desativa usuário
 */

import { NextRequest, NextResponse } from "next/server";
import { lerUsuarios, salvarUsuarios, hashSenha, verificarSenha, toPublico, UsuariosIlegiveisError, type PapelUsuario, type Usuario } from "@/lib/usuarios";
import { exigirPapel, obterAtor, type Ator } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { PAPEIS_VALIDOS, SENHA_MIN, alteracaoRemoveUltimoAdmin, ehUltimoAdminAtivo, emailValido, mesmoEmail } from "@/lib/usuarios-regras";

const PAPEIS: PapelUsuario[] = [...PAPEIS_VALIDOS];
const MSG_ULTIMO_ADMIN =
  "Este é o único Administrador ativo. Não é possível rebaixar, desativar, remover o acesso ou trocar o e-mail dele.";

/** Quem chama (API key ou sessão revalidada no arquivo) ou a resposta de erro. */
async function identificar(req: NextRequest): Promise<{ ator: Ator } | { resp: NextResponse }> {
  try {
    const ator = await obterAtor(req);
    if (!ator) return { resp: NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 }) };
    return { ator };
  } catch (err) {
    if (err instanceof UsuariosIlegiveisError) {
      return { resp: NextResponse.json({ ok: false, erro: err.message }, { status: 503 }) };
    }
    throw err;
  }
}

function respostaErro(err: unknown): NextResponse {
  if (err instanceof UsuariosIlegiveisError) {
    return NextResponse.json({ ok: false, erro: err.message }, { status: 503 });
  }
  return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const quem = await identificar(req);
  if ("resp" in quem) return quem.resp;

  try {
    const { id } = await params;
    const isAdmin = quem.ator.via === "apikey" || quem.ator.papel === "administrador";
    const isProprioUsuario = quem.ator.via === "sessao" && quem.ator.id === id;

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
    return respostaErro(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const quem = await identificar(req);
  if ("resp" in quem) return quem.resp;
  const ator = quem.ator;

  try {
    const { id } = await params;
    const isAdmin = ator.via === "apikey" || ator.papel === "administrador";
    const isProprioUsuario = ator.via === "sessao" && ator.id === id; // id da SESSÃO, não um id fixo

    if (!isAdmin && !isProprioUsuario) {
      return NextResponse.json({ ok: false, erro: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const usuarios = lerUsuarios();
    const idx = usuarios.findIndex((u) => u.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Usuário não encontrado" }, { status: 404 });
    }

    // Retrato do estado anterior (para a trava de "último admin") e cópia de trabalho.
    const antes: Usuario[] = JSON.parse(JSON.stringify(usuarios));
    const u: Usuario = JSON.parse(JSON.stringify(usuarios[idx]));

    // ── Campos de acesso ───────────────────────────────────────────────────────

    // podeAcessar e podeAssinar (admin ou próprio)
    if (body.podeAcessar !== undefined) {
      // Acesso ao painel é decisão do administrador: o próprio usuário não pode se tirar (nem se dar) o acesso.
      if (!isAdmin && Boolean(body.podeAcessar) !== (u.podeAcessar !== false)) {
        return NextResponse.json({ ok: false, erro: "Apenas administradores podem alterar dados de acesso" }, { status: 403 });
      }
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
        emailLogin: typeof body.acesso.emailLogin === "string" ? body.acesso.emailLogin.trim() : (u.acesso?.emailLogin ?? ""),
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
      // A PRÓPRIA senha exige a senha atual; admin trocando a de OUTRO usuário (ou API key) não.
      if (isProprioUsuario) {
        if (typeof body.senhaAtual !== "string" || !body.senhaAtual) {
          return NextResponse.json({ ok: false, erro: "Informe a senha atual para trocar a sua senha" }, { status: 400 });
        }
        if (!u.senhaHash || !(await verificarSenha(body.senhaAtual, u.senhaHash))) {
          return NextResponse.json({ ok: false, erro: "Senha atual incorreta" }, { status: 403 });
        }
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

    // ── Validações finais (e-mail, senha de conta ativa, último admin) ─────────

    const emailAntes = antes[idx].acesso?.emailLogin ?? "";
    const emailDepois = u.acesso?.emailLogin ?? "";
    const ativoAntes = antes[idx].podeAcessar !== false && antes[idx].acesso?.ativo === true;
    const ativoDepois = u.podeAcessar !== false && u.acesso?.ativo === true;

    // E-mail: válido e único quando a conta acessa o painel e (mudou ou está ativa).
    if (u.podeAcessar !== false && u.acesso && (!mesmoEmail(emailAntes, emailDepois) || ativoDepois)) {
      if (!emailValido(emailDepois)) {
        return NextResponse.json({ ok: false, erro: "Informe um e-mail de login válido." }, { status: 400 });
      }
      if (usuarios.some((o, i) => i !== idx && mesmoEmail(o.acesso?.emailLogin, emailDepois))) {
        return NextResponse.json({ ok: false, erro: "E-mail já cadastrado." }, { status: 409 });
      }
    }
    if (ativoDepois && !ativoAntes && !u.senhaHash) {
      return NextResponse.json({ ok: false, erro: "Defina uma senha antes de ativar a conta." }, { status: 400 });
    }

    // Trava de "último admin" no SERVIDOR (a tela só avisa).
    const depois = antes.map((o, i) => (i === idx ? u : o));
    if (
      ehUltimoAdminAtivo(antes, id) &&
      (alteracaoRemoveUltimoAdmin(antes, depois, id) || !mesmoEmail(emailAntes, emailDepois))
    ) {
      return NextResponse.json({ ok: false, erro: MSG_ULTIMO_ADMIN }, { status: 409 });
    }

    usuarios[idx] = u;
    salvarUsuarios(usuarios);

    return NextResponse.json({ ok: true, usuario: toPublico(u) });
  } catch (err) {
    console.error("[api/usuarios PATCH]", err);
    return respostaErro(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const negado = await exigirPapel(req, MATRIZ["usuarios/[id]:DELETE"]);
  if (negado) return negado;

  try {
    const { id } = await params;

    const ator = await obterAtor(req);
    if (ator?.via === "sessao" && ator.id === id) {
      return NextResponse.json({ ok: false, erro: "Você não pode desativar sua própria conta" }, { status: 400 });
    }

    const usuarios = lerUsuarios();
    const idx = usuarios.findIndex((u) => u.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Usuário não encontrado" }, { status: 404 });
    }

    if (ehUltimoAdminAtivo(usuarios, id)) {
      return NextResponse.json({ ok: false, erro: MSG_ULTIMO_ADMIN }, { status: 409 });
    }

    if (usuarios[idx].acesso) {
      usuarios[idx].acesso!.ativo = false;
    }
    salvarUsuarios(usuarios);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return respostaErro(err);
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
