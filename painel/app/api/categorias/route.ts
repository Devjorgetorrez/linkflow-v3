/**
 * app/api/categorias/route.ts
 * GET  /api/categorias  → lista categorias do cliente
 * POST /api/categorias  → cria categoria
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { verificarAcesso } from "@/lib/auth";
import { sincronizarCategorias, avisoColisaoSlug } from "@/lib/sync-categorias";
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

    // Espelha as categorias no site (content/categorias/). Falha aqui não
    // pode impedir o salvamento — só registra no log, igual usuarios/autores.
    try {
      sincronizarCategorias(categorias);
    } catch (err) {
      console.error("[categorias] falha ao sincronizar categorias no site:", err);
    }

    const aviso = avisoColisaoSlug(nova.slug);
    if (aviso) console.warn(`[categorias] ${aviso}`);

    return NextResponse.json({ ok: true, categoria: nova, aviso: aviso ?? undefined });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
