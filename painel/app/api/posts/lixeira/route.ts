/**
 * app/api/posts/lixeira/route.ts — lixeira real dos posts.
 *
 * A lixeira fica em $LINKFLOW_DIR/dados/lixeira/posts/, FORA de
 * _astro/src/content: o que está lá não entra no build nem no site.
 *
 * GET    /api/posts/lixeira                 → lista os posts na lixeira
 * POST   /api/posts/lixeira  { slug }       → restaura (volta como está; se o endereço
 *                                             estiver ocupado, ganha sufixo -2, -3…)
 * DELETE /api/posts/lixeira?slug=…          → exclui DEFINITIVAMENTE um post da lixeira
 * DELETE /api/posts/lixeira?todos=1         → esvazia a lixeira
 *
 * Posts antigos com `status: lixeira` dentro de content/posts (do modelo
 * anterior) também aparecem aqui e saem por estas mesmas ações.
 */
import { NextRequest, NextResponse } from "next/server";
import { atualizarFrontmatter, lerArquivo, listarArquivos } from "@/lib/fs";
import { exigirPapel, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { lerUsuarios } from "@/lib/usuarios";
import { lerDados } from "@/lib/dados";
import { postParaApi } from "@/lib/posts-api";
import { hojeISO } from "@/lib/posts-campos";
import {
  caminhoLixeira, caminhoPost, chavesDaLixeira, dirPosts, excluirDaLixeira, gravarAtomico, restaurarDaLixeira,
} from "@/lib/posts-fs";
import { lerStatusPost } from "@/lib/status-post";
import { parseMd } from "@/lib/fs";
import fs from "fs";
import type { Categoria } from "@/mock/types";

/** Posts antigos (status: lixeira ainda em content/posts). */
function chavesLegadas(): string[] {
  return listarArquivos(dirPosts(), ".md")
    .map((a) => a.replace(/\.md$/, ""))
    .filter((slug) => {
      const raw = lerArquivo(caminhoPost(slug));
      return !!raw && lerStatusPost(parseMd(raw).frontmatter.status) === "lixeira";
    });
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["posts/lixeira:GET"]);
  if (auth) return auth;
  try {
    const usuarios = lerUsuarios();
    const categorias = lerDados<Categoria[]>("categorias.json", []);
    const itens = [
      ...chavesDaLixeira().map((chave) => ({ chave, raw: lerArquivo(caminhoLixeira(chave)) })),
      ...chavesLegadas().map((chave) => ({ chave, raw: lerArquivo(caminhoPost(chave)) })),
    ];
    const posts = itens
      .filter((i): i is { chave: string; raw: string } => !!i.raw)
      .map((i) => ({ ...postParaApi(i.chave, i.raw, usuarios, categorias), status: "lixeira" as const }));
    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    console.error("[api/posts/lixeira GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["posts/lixeira:POST"]);
  if (auth) return auth;
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug || !validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }
    const restaurado = restaurarDaLixeira(slug);
    if (restaurado) return NextResponse.json({ ok: true, slug: restaurado });

    // Post antigo com status: lixeira dentro de content/posts: volta como rascunho.
    if (chavesLegadas().includes(slug)) {
      const raw = lerArquivo(caminhoPost(slug))!;
      gravarAtomico(caminhoPost(slug), atualizarFrontmatter(raw, { status: "rascunho", atualizadoEm: hojeISO() }));
      return NextResponse.json({ ok: true, slug });
    }
    return NextResponse.json({ ok: false, erro: "Post não encontrado na lixeira" }, { status: 404 });
  } catch (err) {
    console.error("[api/posts/lixeira POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["posts/lixeira:DELETE"]);
  if (auth) return auth;
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("todos") === "1") {
      let apagados = 0;
      for (const chave of chavesDaLixeira()) if (excluirDaLixeira(chave)) apagados++;
      for (const chave of chavesLegadas()) {
        fs.unlinkSync(caminhoPost(chave));
        apagados++;
      }
      return NextResponse.json({ ok: true, apagados });
    }
    const slug = url.searchParams.get("slug") ?? "";
    if (!validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }
    if (excluirDaLixeira(slug)) return NextResponse.json({ ok: true, slug });
    // Só apaga de content/posts se o post JÁ está marcado como lixeira (nunca um post vivo).
    if (chavesLegadas().includes(slug)) {
      fs.unlinkSync(caminhoPost(slug));
      return NextResponse.json({ ok: true, slug });
    }
    return NextResponse.json({ ok: false, erro: "Post não encontrado na lixeira" }, { status: 404 });
  } catch (err) {
    console.error("[api/posts/lixeira DELETE]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
