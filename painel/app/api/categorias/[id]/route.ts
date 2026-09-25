/**
 * app/api/categorias/[id]/route.ts
 * PATCH  /api/categorias/:id  → atualiza categoria
 * DELETE /api/categorias/:id  → remove categoria
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { verificarAcesso } from "@/lib/auth";
import { sincronizarCategorias, avisoColisaoSlug } from "@/lib/sync-categorias";
import type { Categoria } from "@/mock/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const categorias = lerDados<Categoria[]>("categorias.json", []);
    const idx = categorias.findIndex((c) => c.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Categoria não encontrada" }, { status: 404 });
    }

    categorias[idx] = { ...categorias[idx], ...body };
    salvarDados("categorias.json", categorias);

    try {
      sincronizarCategorias(categorias);
    } catch (err) {
      console.error("[categorias] falha ao sincronizar categorias no site:", err);
    }

    const aviso = avisoColisaoSlug(categorias[idx].slug);
    if (aviso) console.warn(`[categorias] ${aviso}`);

    return NextResponse.json({ ok: true, categoria: categorias[idx], aviso: aviso ?? undefined });
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
    const categorias = lerDados<Categoria[]>("categorias.json", []);
    const idx = categorias.findIndex((c) => c.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Categoria não encontrada" }, { status: 404 });
    }

    categorias.splice(idx, 1);
    salvarDados("categorias.json", categorias);

    try {
      sincronizarCategorias(categorias);
    } catch (err) {
      console.error("[categorias] falha ao sincronizar categorias no site:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
