/**
 * app/api/categorias/route.ts
 * GET  /api/categorias  → lista categorias do cliente
 * POST /api/categorias  → cria categoria
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { verificarAcesso } from "@/lib/auth";
import type { Categoria } from "@/mock/types";

export async function GET(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  const categorias = lerDados<Categoria[]>("categorias.json", []);
  return NextResponse.json({ ok: true, categorias });
}

export async function POST(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const categorias = lerDados<Categoria[]>("categorias.json", []);

    const nova: Categoria = {
      id: `cat-${Date.now()}`,
      nome: String(body.nome ?? "Nova categoria"),
      slug: String(body.slug ?? ""),
      descricao: String(body.descricao ?? ""),
      seoTitle: String(body.seoTitle ?? body.nome ?? ""),
      metaDescription: String(body.metaDescription ?? ""),
      imagem: String(body.imagem ?? ""),
      paiId: body.paiId ?? null,
      ordem: Number(body.ordem ?? categorias.length),
      cluster: String(body.cluster ?? ""),
      intencao: body.intencao ?? "",
    };

    categorias.push(nova);
    salvarDados("categorias.json", categorias);

    return NextResponse.json({ ok: true, categoria: nova });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
