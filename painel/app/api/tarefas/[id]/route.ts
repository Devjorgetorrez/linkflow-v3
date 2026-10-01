/**
 * app/api/tarefas/[id]/route.ts
 * PATCH  /api/tarefas/:id  → atualiza tarefa
 * DELETE /api/tarefas/:id  → remove tarefa
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import type { Tarefa } from "@/mock/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["tarefas/[id]:PATCH"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const tarefas = lerDados<Tarefa[]>("tarefas.json", []);
    const idx = tarefas.findIndex((t) => t.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Tarefa não encontrada" }, { status: 404 });
    }

    tarefas[idx] = { ...tarefas[idx], ...body };
    salvarDados("tarefas.json", tarefas);

    return NextResponse.json({ ok: true, tarefa: tarefas[idx] });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["tarefas/[id]:DELETE"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const tarefas = lerDados<Tarefa[]>("tarefas.json", []);
    const idx = tarefas.findIndex((t) => t.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Tarefa não encontrada" }, { status: 404 });
    }

    tarefas.splice(idx, 1);
    salvarDados("tarefas.json", tarefas);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
