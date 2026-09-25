/**
 * app/api/posts/route.ts
 * GET  /api/posts   → lista todos os posts do cliente
 * POST /api/posts   → cria um novo post
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getContentDir, listarArquivos, lerArquivo, escreverArquivo, parseMd, stringifyMd, slugify } from "@/lib/fs";
import { verificarAcesso, validarSlug } from "@/lib/auth";
import { painelParaFrontmatter } from "@/lib/frontmatter-post";
import { lerStatusPost } from "@/lib/status-post";
import { lerUsuarios } from "@/lib/usuarios";
import { idDoAutor, slugDoAutor } from "@/lib/sync-autores";
import { lerDados } from "@/lib/dados";
import { idDoCategoria, slugDoCategoria } from "@/lib/sync-categorias";
import type { Categoria } from "@/mock/types";

function postsDirAtivo(): string {
  return path.join(getContentDir(), "posts");
}

export async function GET(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const dir = postsDirAtivo();
    const arquivos = listarArquivos(dir, ".md");
    const usuarios = lerUsuarios(); // autor: slug no arquivo, id do usuário no painel
    const categorias = lerDados<Categoria[]>("categorias.json", []); // categoria: slug no arquivo, id no painel

    const posts = arquivos
      .map((arquivo) => {
        const raw = lerArquivo(path.join(dir, arquivo));
        if (!raw) return null;
        const { frontmatter, content } = parseMd(raw);
        const slug = arquivo.replace(/\.md$/, "");
        return {
          id: slug,
          slug,
          titulo: frontmatter.titulo ?? frontmatter.title ?? "(sem título)",
          resumo: frontmatter.metaDescription ?? frontmatter.descricao ?? frontmatter.description ?? "",
          corpo: content,
          data: frontmatter.publicadoEm ?? frontmatter.date ?? "",
          status: lerStatusPost(frontmatter.status),
          destaque: frontmatter.destaque ?? false,
          palavraChave: frontmatter.palavraChave ?? "",
          seoTitle: frontmatter.titulo ?? "",
          metaDescription: frontmatter.metaDescription ?? frontmatter.descricao ?? "",
          canonical: "",
          noindex: false,
          ogImagem: frontmatter.imagemHero ?? "",
          schemaTipo: "Article",
          faq: [],
          fontes: [],
          palavras: content.split(/\s+/).length,
          categoriaId: idDoCategoria(String(frontmatter.categoria ?? ""), categorias),
          autorId: idDoAutor(String(frontmatter.autor ?? ""), usuarios),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    console.error("[api/posts GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const { titulo, corpo, imagemHero } = body;

    if (!titulo) {
      return NextResponse.json({ ok: false, erro: "Título obrigatório" }, { status: 400 });
    }

    const slug = slugify(body.slug || titulo);

    // Validar slug antes de usar em caminho de arquivo
    if (!validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }

    const dir = postsDirAtivo();
    const filePath = path.join(dir, `${slug}.md`);

    // Nomes de campo do SITE (schema posts do Astro), nunca os do painel —
    // ver lib/frontmatter-post.ts. `metaDescription` é obrigatório no site.
    const hoje = new Date().toISOString().split("T")[0];
    const frontmatter: Record<string, unknown> = {
      metaDescription: "",
      publicadoEm: hoje,
      status: "rascunho",
      destaque: false,
      ...painelParaFrontmatter(body),
      atualizadoEm: hoje,
    };
    // O site referencia o autor pelo SLUG (content/autores/<slug>.md); o
    // painel manda o id do usuário.
    if (typeof frontmatter.autor === "string") {
      frontmatter.autor = slugDoAutor(frontmatter.autor, lerUsuarios());
    }
    // Mesma coisa pra categoria (content/categorias/<slug>.md vs id do painel).
    if (typeof frontmatter.categoria === "string") {
      frontmatter.categoria = slugDoCategoria(frontmatter.categoria, lerDados<Categoria[]>("categorias.json", []));
    }

    if (imagemHero) frontmatter.imagemHero = imagemHero;

    escreverArquivo(filePath, stringifyMd(frontmatter, corpo ?? ""));

    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    console.error("[api/posts POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
