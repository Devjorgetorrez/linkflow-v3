/**
 * GET /api/posts/:slug/referencias → quem aponta para o post: `relacionados` de outros posts,
 * links no corpo de posts/serviços/equipe/depoimentos/autores e itens do menu do site.
 * Usado pela tela ANTES de mover o post para a lixeira (mesmo papel do DELETE: administrador e editor).
 */
import { NextRequest, NextResponse } from "next/server";
import { exigirPapel, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { referenciasDoPost } from "@/lib/links-slug";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await exigirPapel(req, MATRIZ["posts/[slug]/referencias:GET"]);
  if (auth) return auth;
  try {
    const { slug } = await params;
    if (!validarSlug(slug)) return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    const referencias = referenciasDoPost(slug);
    return NextResponse.json({ ok: true, slug, total: referencias.length, referencias });
  } catch (err) {
    console.error("[api/posts/referencias GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
