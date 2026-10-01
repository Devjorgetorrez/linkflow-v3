/**
 * app/api/formularios/route.ts
 * GET  /api/formularios  → lista formulários (semeia o "contato" na primeira leitura)
 * POST /api/formularios  → cria formulário (validado; id único a partir do nome)
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados } from "@/lib/dados";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { slugify } from "@/lib/fs";
import { comContadores, gravarFormularios, lerFormularios } from "@/lib/formularios-dados";
import { idUnico, validarFormulario } from "@/lib/formularios-regras";
import type { Formulario, Lead } from "@/mock/types";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["formularios:GET"]);
  if (auth) return auth;

  const formularios = comContadores(lerFormularios(), lerDados<Lead[]>("leads.json", []));
  return NextResponse.json({ ok: true, formularios });
}

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["formularios:POST"]);
  if (auth) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "Corpo da requisição inválido." }, { status: 400 });
  }
  const v = validarFormulario(body);
  if (!v.ok || !v.valor) {
    return NextResponse.json({ ok: false, erro: v.erro, campos: v.erros }, { status: 400 });
  }

  try {
    // ler → alterar → gravar sem await no meio (sem corrida dentro do processo)
    const formularios = lerFormularios();
    const dup = formularios.find((f) => f.nome.trim().toLowerCase() === v.valor!.nome.toLowerCase());
    if (dup) {
      return NextResponse.json(
        { ok: false, erro: `Já existe um formulário chamado "${dup.nome}".`, campos: { nome: "Já existe um formulário com este nome." } },
        { status: 409 },
      );
    }
    const novo: Formulario = {
      id: idUnico(v.valor.nome, formularios.map((f) => f.id), slugify),
      ...v.valor,
      usadoEm: [],
      envios30d: 0,
    };
    formularios.push(novo);
    gravarFormularios(formularios);
    return NextResponse.json({ ok: true, formulario: novo });
  } catch (err) {
    console.error("[api/formularios POST]", err);
    return NextResponse.json({ ok: false, erro: "Não foi possível salvar o formulário." }, { status: 500 });
  }
}
