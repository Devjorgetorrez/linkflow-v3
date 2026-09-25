/**
 * app/api/formularios/[id]/route.ts
 * PATCH  /api/formularios/:id  → atualiza formulário
 * DELETE /api/formularios/:id  → remove formulário
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { verificarAcesso } from "@/lib/auth";
import type { Formulario } from "@/mock/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const formularios = lerDados<Formulario[]>("formularios.json", []);
    const idx = formularios.findIndex((f) => f.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Formulário não encontrado" }, { status: 404 });
    }

    formularios[idx] = { ...formularios[idx], ...body };
    salvarDados("formularios.json", formularios);

    return NextResponse.json({ ok: true, formulario: formularios[idx] });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const formularios = lerDados<Formulario[]>("formularios.json", []);
    const idx = formularios.findIndex((f) => f.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Formulário não encontrado" }, { status: 404 });
    }

    formularios.splice(idx, 1);
    salvarDados("formularios.json", formularios);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
