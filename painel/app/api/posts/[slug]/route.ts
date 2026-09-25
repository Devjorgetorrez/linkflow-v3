/**
 * app/api/posts/[slug]/route.ts
 * GET    /api/posts/:slug   → lê um post
 * PATCH  /api/posts/:slug   → atualiza um post
 * DELETE /api/posts/:slug   → deleta um post
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getContentDir, lerArquivo, escreverArquivo, deletarArquivo, parseMd, stringifyMd, atualizarFrontmatter } from "@/lib/fs";
import { verificarAcesso, validarSlug } from "@/lib/auth";
import { painelParaFrontmatter } from "@/lib/frontmatter-post";
import { lerUsuarios } from "@/lib/usuarios";
import { slugDoAutor } from "@/lib/sync-autores";

function postPath(slug: string): string {
  // Validação já foi feita antes de chegar aqui, mas path.join resolve ../ etc
  return path.join(getContentDir(), "posts", `${slug}.md`);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  const { slug } = await params;

  if (!validarSlug(slug)) {
    return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
  }

  const raw = lerArquivo(postPath(slug));
  if (!raw) {
    return NextResponse.json({ ok: false, erro: "Post não encontrado" }, { status: 404 });
  }
  const { frontmatter, content } = parseMd(raw);
  return NextResponse.json({ ok: true, post: { slug, ...frontmatter, corpo: content } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const { slug } = await params;

    if (!validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }

    const filePath = postPath(slug);
    const raw = lerArquivo(filePath);
    const body = await req.json();
    const { corpo } = body;
    // Só campos que o site conhece, com o nome do site (lib/frontmatter-post.ts)
    const camposFrontmatter = painelParaFrontmatter(body);
    if (typeof camposFrontmatter.autor === "string") {
      camposFrontmatter.autor = slugDoAutor(camposFrontmatter.autor, lerUsuarios()); // site usa o slug
    }

    const campos = {
      ...camposFrontmatter,
      atualizadoEm: new Date().toISOString().split("T")[0],
    };

    // Edição cirúrgica: só as linhas dos campos alterados mudam; o resto do
    // arquivo (inclusive o que o painel não entende) fica intacto.
    const novo = raw
      ? atualizarFrontmatter(raw, campos, typeof corpo === "string" ? corpo : undefined)
      : stringifyMd(campos, typeof corpo === "string" ? corpo : "");

    escreverArquivo(filePath, novo);

    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    console.error("[api/posts PATCH]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const { slug } = await params;

    if (!validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }

    const ok = deletarArquivo(postPath(slug));
    if (!ok) {
      return NextResponse.json({ ok: false, erro: "Post não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    console.error("[api/posts DELETE]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
