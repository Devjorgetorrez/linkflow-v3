/**
 * app/api/formularios/[id]/route.ts
 * PATCH  /api/formularios/:id  → atualiza formulário (validado; o id nunca muda)
 * DELETE /api/formularios/:id  → remove o formulário (os leads já recebidos ficam)
 */

import { NextRequest, NextResponse } from "next/server";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { gravarFormularios, lerFormularios } from "@/lib/formularios-dados";
import { validarFormulario } from "@/lib/formularios-regras";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["formularios/[id]:PATCH"]);
  if (auth) return auth;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const formularios = lerFormularios();
    const idx = formularios.findIndex((f) => f.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Formulário não encontrado" }, { status: 404 });
    }
    // Mescla com o atual e valida o conjunto: um PATCH parcial não pode deixar o formulário inválido.
    const v = validarFormulario({ ...formularios[idx], ...(body as object) });
    if (!v.ok || !v.valor) {
      return NextResponse.json({ ok: false, erro: v.erro, campos: v.erros }, { status: 400 });
    }
    const dup = formularios.find((f, i) => i !== idx && f.nome.trim().toLowerCase() === v.valor!.nome.toLowerCase());
    if (dup) {
      return NextResponse.json(
        { ok: false, erro: `Já existe um formulário chamado "${dup.nome}".`, campos: { nome: "Já existe um formulário com este nome." } },
        { status: 409 },
      );
    }
    formularios[idx] = { ...formularios[idx], ...v.valor, id: formularios[idx].id };
    gravarFormularios(formularios);
    return NextResponse.json({ ok: true, formulario: formularios[idx] });
  } catch (err) {
    console.error("[api/formularios PATCH]", err);
    return NextResponse.json({ ok: false, erro: "Não foi possível salvar o formulário." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["formularios/[id]:DELETE"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const formularios = lerFormularios();
    const idx = formularios.findIndex((f) => f.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Formulário não encontrado" }, { status: 404 });
    }
    formularios.splice(idx, 1);
    gravarFormularios(formularios);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/formularios DELETE]", err);
    return NextResponse.json({ ok: false, erro: "Não foi possível excluir o formulário." }, { status: 500 });
  }
}
