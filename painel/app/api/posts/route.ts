/**
 * app/api/posts/route.ts
 * GET  /api/posts   → lista os posts do cliente (a lixeira fica em /api/posts/lixeira)
 * POST /api/posts   → cria um post novo (já válido para o site) ou duplica um existente
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { listarArquivos, lerArquivo, stringifyMd, atualizarFrontmatter, parseMd } from "@/lib/fs";
import { exigirPapel, obterAtor, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { ehPostDoUsuario } from "@/lib/usuarios-regras";
import { buscarPorId, lerUsuarios } from "@/lib/usuarios";
import { lerDados } from "@/lib/dados";
import { postParaApi } from "@/lib/posts-api";
import { autorPadrao, camposDoCorpo, frontmatterInicial, hojeISO, validarCamposPost } from "@/lib/posts-campos";
import { caminhoPost, dirPosts, gravarNovoAtomico, slugLivre, slugOcupado } from "@/lib/posts-fs";
import {
  SLUGS_RESERVADOS, TITULO_MAX, TITULO_PROVISORIO, normalizarCorpo, slugDoTitulo,
} from "@/lib/posts-regras";
import type { Categoria } from "@/mock/types";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["posts:GET"]);
  if (auth) return auth;

  try {
    const dir = dirPosts();
    const arquivos = listarArquivos(dir, ".md");
    const usuarios = lerUsuarios(); // autor: slug no arquivo, id do usuário no painel
    const categorias = lerDados<Categoria[]>("categorias.json", []); // categoria: slug no arquivo, id no painel

    // Autor só enxerga os PRÓPRIOS posts (tabela de permissões da tela de usuários).
    const ator = await obterAtor(req);
    const eu = ator?.via === "sessao" && ator.papel === "autor" ? buscarPorId(ator.id) : null;

    const posts = arquivos
      .map((arquivo) => {
        const raw = lerArquivo(path.join(dir, arquivo));
        if (!raw) return null;
        return postParaApi(arquivo.replace(/\.md$/, ""), raw, usuarios, categorias);
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const visiveis = eu ? posts.filter((p) => ehPostDoUsuario(p.autorId, eu)) : posts;
    return NextResponse.json({ ok: true, posts: visiveis });
  } catch (err) {
    console.error("[api/posts GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["posts:POST"]);
  if (auth) return auth;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const ator = await obterAtor(req);
    const usuarios = lerUsuarios();
    const categorias = lerDados<Categoria[]>("categorias.json", []);
    const ehAutor = ator?.via === "sessao" && ator.papel === "autor";

    // ── Duplicar ────────────────────────────────────────────────────────────
    if (typeof body.duplicarDe === "string") {
      const origem = body.duplicarDe;
      if (!validarSlug(origem)) {
        return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
      }
      const raw = lerArquivo(caminhoPost(origem));
      if (!raw) return NextResponse.json({ ok: false, erro: "Post não encontrado" }, { status: 404 });
      const fmOrigem = parseMd(raw).frontmatter;
      if (ehAutor) {
        const eu = buscarPorId(ator.id);
        if (!eu || !ehPostDoUsuario(fmOrigem.autor, eu)) {
          return NextResponse.json({ ok: false, erro: "Autor só duplica os próprios posts" }, { status: 403 });
        }
      }
      const tituloOrigem = String(fmOrigem.titulo ?? TITULO_PROVISORIO);
      let titulo = `Cópia de ${tituloOrigem}`;
      if (titulo.length > TITULO_MAX) titulo = titulo.slice(0, TITULO_MAX).trim();
      const slug = slugLivre(slugDoTitulo(titulo));
      const campos: Record<string, unknown> = {
        titulo,
        status: "rascunho",
        publicadoEm: hojeISO(),
        atualizadoEm: hojeISO(),
        destaque: false,
        palavraChave: "", // a cópia não pode canibalizar a palavra-chave do original
      };
      const dono = autorPadrao(ator, usuarios);
      if (ehAutor && dono) campos.autor = dono;
      const novo = atualizarFrontmatter(raw, campos);
      if (!gravarNovoAtomico(caminhoPost(slug), novo)) {
        return NextResponse.json({ ok: false, erro: "Já existe um post com esse endereço." }, { status: 409 });
      }
      return NextResponse.json({ ok: true, slug, duplicadoDe: origem });
    }

    // ── Criar ───────────────────────────────────────────────────────────────
    // Autor cria só rascunho e sempre em seu próprio nome (não publica nem assina por outro).
    if (ehAutor) {
      body.status = "rascunho";
      delete body.autor;
      body.autorId = ator.id;
    }

    const campos = camposDoCorpo(body, usuarios, categorias);
    const fm = frontmatterInicial(campos, ator, usuarios);
    const invalido = validarCamposPost(fm, String(fm.metaDescription ?? ""));
    if (invalido) return NextResponse.json({ ok: false, erro: invalido.erro }, { status: invalido.status });

    // Slug: o pedido explícito não pode colidir; o derivado do título ganha sufixo -2, -3…
    let slug: string;
    if (typeof body.slug === "string" && body.slug.trim()) {
      slug = slugDoTitulo(body.slug);
      if (!slug || !validarSlug(slug) || SLUGS_RESERVADOS.includes(slug)) {
        return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
      }
      if (slugOcupado(slug)) {
        return NextResponse.json({ ok: false, erro: "Já existe um post com esse endereço (slug)." }, { status: 409 });
      }
    } else {
      slug = slugLivre(slugDoTitulo(String(fm.titulo)) || "post");
    }

    const corpo = normalizarCorpo(body.corpo, body.corpoFormato === "html");
    // gravarNovoAtomico nunca sobrescreve: se outro pedido pegou o slug no meio do caminho, recusa.
    if (!gravarNovoAtomico(caminhoPost(slug), stringifyMd(fm, corpo))) {
      return NextResponse.json({ ok: false, erro: "Já existe um post com esse endereço (slug)." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, slug, titulo: fm.titulo, status: fm.status });
  } catch (err) {
    console.error("[api/posts POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
