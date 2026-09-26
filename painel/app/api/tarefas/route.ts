/**
 * app/api/tarefas/route.ts
 * GET  /api/tarefas  → lista tarefas
 * POST /api/tarefas  → cria tarefa
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import type { Tarefa } from "@/mock/types";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["tarefas:GET"]);
  if (auth) return auth;

  const tarefas = lerDados<Tarefa[]>("tarefas.json", []);
  return NextResponse.json({ ok: true, tarefas });
}

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["tarefas:POST"]);
  if (auth) return auth;

  try {
    const body = await req.json();
    const tarefas = lerDados<Tarefa[]>("tarefas.json", []);

    const nova: Tarefa = {
      id: `t${Date.now()}`,
      titulo: String(body.titulo ?? "Nova tarefa"),
      projeto: String(body.projeto ?? ""),
      descricao: String(body.descricao ?? ""),
      status: body.status ?? "nao-iniciado",
      prioridade: body.prioridade ?? "media",
      responsavelId: String(body.responsavelId ?? ""),
      prazo: String(body.prazo ?? ""),
      origem: body.origem ?? "manual",
      checklist: Array.isArray(body.checklist) ? body.checklist : [],
    };

    tarefas.push(nova);
    salvarDados("tarefas.json", tarefas);

    return NextResponse.json({ ok: true, tarefa: nova });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
