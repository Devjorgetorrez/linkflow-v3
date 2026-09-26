/**
 * app/api/posts/[slug]/route.ts
 * GET    /api/posts/:slug   → lê um post
 * PATCH  /api/posts/:slug   → atualiza um post
 * DELETE /api/posts/:slug   → deleta um post
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getContentDir, lerArquivo, escreverArquivo, deletarArquivo, parseMd, stringifyMd, atualizarFrontmatter } from "@/lib/fs";
import { exigirPapel, obterAtor, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { ehPostDoUsuario } from "@/lib/usuarios-regras";
import { painelParaFrontmatter } from "@/lib/frontmatter-post";
import { buscarPorId, lerUsuarios } from "@/lib/usuarios";
import { slugDoAutor } from "@/lib/sync-autores";
import { lerDados } from "@/lib/dados";
import { slugDoCategoria } from "@/lib/sync-categorias";
import type { Categoria } from "@/mock/types";

/** Autor só mexe nos PRÓPRIOS posts. Devolve true se a sessão é de um autor que NÃO é dono do post. */
async function autorNaoEDono(req: NextRequest, raw: string | null): Promise<boolean> {
  const ator = await obterAtor(req);
  if (ator?.via !== "sessao" || ator.papel !== "autor") return false;
  const eu = buscarPorId(ator.id);
  if (!eu || !raw) return true;
  return !ehPostDoUsuario(parseMd(raw).frontmatter.autor, eu);
}

function postPath(slug: string): string {
  // Validação já foi feita antes de chegar aqui, mas path.join resolve ../ etc
  return path.join(getContentDir(), "posts", `${slug}.md`);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["posts/[slug]:GET"]);
  if (auth) return auth;

  const { slug } = await params;

  if (!validarSlug(slug)) {
    return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
  }

  const raw = lerArquivo(postPath(slug));
  if (!raw) {
    return NextResponse.json({ ok: false, erro: "Post não encontrado" }, { status: 404 });
  }
  if (await autorNaoEDono(req, raw)) {
    return NextResponse.json({ ok: false, erro: "Autor só acessa os próprios posts" }, { status: 403 });
  }
  const { frontmatter, content } = parseMd(raw);
  return NextResponse.json({ ok: true, post: { slug, ...frontmatter, corpo: content } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["posts/[slug]:PATCH"]);
  if (auth) return auth;

  try {
    const { slug } = await params;

    if (!validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }

    const filePath = postPath(slug);
    const raw = lerArquivo(filePath);
    const body = await req.json();
    if (await autorNaoEDono(req, raw)) {
      return NextResponse.json({ ok: false, erro: "Autor só edita os próprios posts" }, { status: 403 });
    }
    // Autor não publica nem reatribui: status e autor ficam como estão.
    const ator = await obterAtor(req);
    if (ator?.via === "sessao" && ator.papel === "autor") {
      delete body.status;
      delete body.autor;
      delete body.autorId;
    }
    const { corpo } = body;
    // Só campos que o site conhece, com o nome do site (lib/frontmatter-post.ts)
    const camposFrontmatter = painelParaFrontmatter(body);
    if (typeof camposFrontmatter.autor === "string") {
      camposFrontmatter.autor = slugDoAutor(camposFrontmatter.autor, lerUsuarios()); // site usa o slug
    }
    if (typeof camposFrontmatter.categoria === "string") {
      camposFrontmatter.categoria = slugDoCategoria(camposFrontmatter.categoria, lerDados<Categoria[]>("categorias.json", [])); // site usa o slug
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
  const auth = await exigirPapel(req, MATRIZ["posts/[slug]:DELETE"]);
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
