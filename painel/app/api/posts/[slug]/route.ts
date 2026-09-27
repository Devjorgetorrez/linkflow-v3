/**
 * app/api/posts/[slug]/route.ts
 * GET    /api/posts/:slug   → lê um post
 * PATCH  /api/posts/:slug   → atualiza um post (ou cria, se ainda não existe)
 *                             `slug` no corpo, diferente do da URL, RENOMEIA o arquivo
 * DELETE /api/posts/:slug   → move o post para a lixeira (não apaga; ver /api/posts/lixeira)
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { lerArquivo, parseMd, stringifyMd, atualizarFrontmatter } from "@/lib/fs";
import { exigirPapel, obterAtor, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { ehPostDoUsuario } from "@/lib/usuarios-regras";
import { buscarPorId, lerUsuarios } from "@/lib/usuarios";
import { lerDados } from "@/lib/dados";
import {
  camposDoCorpo, camposParaLimpar, frontmatterInicial, hojeISO, removerCamposFrontmatter, validarCamposPost, validarCorpoRequisicao, validarVinculos,
} from "@/lib/posts-campos";
import { postParaApi } from "@/lib/posts-api";
import { liberarEnderecoDePost, postEstaNoSite, registrarRenomeacao } from "@/lib/redirects";
import { slugPublicavel } from "@/lib/sync-autores";
import { caminhoPost, gravarAtomico, gravarNovoAtomico, moverParaLixeira, slugLivre, slugOcupado } from "@/lib/posts-fs";
import { SLUGS_RESERVADOS, normalizarCorpo, slugDoTitulo } from "@/lib/posts-regras";
import type { Categoria } from "@/mock/types";

/** Autor só mexe nos PRÓPRIOS posts. Devolve true se a sessão é de um autor que NÃO é dono do post. */
async function autorNaoEDono(req: NextRequest, raw: string | null): Promise<boolean> {
  const ator = await obterAtor(req);
  if (ator?.via !== "sessao" || ator.papel !== "autor") return false;
  const eu = buscarPorId(ator.id);
  if (!eu || !raw) return true;
  return !ehPostDoUsuario(parseMd(raw).frontmatter.autor, eu);
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

  const raw = lerArquivo(caminhoPost(slug));
  if (!raw) {
    return NextResponse.json({ ok: false, erro: "Post não encontrado" }, { status: 404 });
  }
  if (await autorNaoEDono(req, raw)) {
    return NextResponse.json({ ok: false, erro: "Autor só acessa os próprios posts" }, { status: 403 });
  }
  const { frontmatter } = parseMd(raw);
  // frontmatter cru (compatível) + os campos já resolvidos como o painel os lê (corpo em HTML, autor, faq…)
  const post = postParaApi(slug, raw, lerUsuarios(), lerDados<Categoria[]>("categorias.json", []));
  return NextResponse.json({ ok: true, post: { ...frontmatter, ...post } });
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

    const filePath = caminhoPost(slug);
    const raw = lerArquivo(filePath);
    const body = (await req.json()) as Record<string, unknown>;
    if (await autorNaoEDono(req, raw)) {
      return NextResponse.json({ ok: false, erro: "Autor só edita os próprios posts" }, { status: 403 });
    }
    // Autor não publica nem reatribui: status e autor ficam como estão.
    const ator = await obterAtor(req);
    const ehAutor = ator?.via === "sessao" && ator.papel === "autor";
    if (ehAutor) {
      delete body.status;
      delete body.autor;
      delete body.autorId;
    }

    const usuarios = lerUsuarios();
    const categorias = lerDados<Categoria[]>("categorias.json", []);
    const erroCorpo = validarCorpoRequisicao(body, usuarios);
    if (erroCorpo) return NextResponse.json({ ok: false, erro: erroCorpo.erro }, { status: erroCorpo.status });
    const erroVinculos = validarVinculos(body, slug);
    if (erroVinculos) return NextResponse.json({ ok: false, erro: erroVinculos.erro }, { status: erroVinculos.status });
    // Só campos que o site conhece, com o nome do site (lib/frontmatter-post.ts)
    const campos = camposDoCorpo(body, usuarios, categorias);
    const corpo = typeof body.corpo === "string" ? normalizarCorpo(body.corpo, body.corpoFormato === "html") : undefined;

    // ── Post que ainda não existe: PATCH cria, com os MESMOS defaults do POST ──
    if (!raw) {
      if (SLUGS_RESERVADOS.includes(slug)) {
        return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
      }
      // (autor nunca chega aqui: sem post existente, autorNaoEDono já respondeu 403)
      const fm = frontmatterInicial(campos, ator, usuarios);
      const invalido = validarCamposPost(fm, String(fm.metaDescription ?? ""));
      if (invalido) return NextResponse.json({ ok: false, erro: invalido.erro }, { status: invalido.status });
      if (!gravarNovoAtomico(filePath, stringifyMd(fm, corpo ?? ""))) {
        return NextResponse.json({ ok: false, erro: "Já existe um post com esse endereço (slug)." }, { status: 409 });
      }
      liberarEnderecoDePost(slug);
      return NextResponse.json({ ok: true, slug, criado: true });
    }

    // ── Validação do que vai ser gravado ─────────────────────────────────────
    const fmAtual = parseMd(raw).frontmatter;
    const metaFinal = String(campos.metaDescription ?? fmAtual.metaDescription ?? "");
    // Status igual ao atual não é "publicar": não trava a edição de um post antigo.
    const paraValidar = { ...campos };
    const statusAtual = String(fmAtual.status ?? "publicado").trim().toLowerCase();
    if (paraValidar.status !== undefined && String(paraValidar.status).trim().toLowerCase() === statusAtual) {
      delete paraValidar.status;
    }
    const invalido = validarCamposPost(paraValidar, metaFinal);
    if (invalido) return NextResponse.json({ ok: false, erro: invalido.erro }, { status: invalido.status });

    // ── Slug novo? (renomear o arquivo) ──────────────────────────────────────
    let slugFinal = slug;
    if (typeof body.slug === "string" && body.slug.trim() && slugDoTitulo(body.slug) !== slug) {
      const pedido = slugDoTitulo(body.slug);
      if (!pedido || !validarSlug(pedido) || SLUGS_RESERVADOS.includes(pedido)) {
        return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
      }
      if (body.slugAuto === true) {
        slugFinal = slugLivre(pedido, slug); // slug que acompanha o título: ganha sufixo -2, -3… se colidir
      } else if (slugOcupado(pedido)) {
        return NextResponse.json({ ok: false, erro: "Já existe um post com esse endereço (slug)." }, { status: 409 });
      } else {
        slugFinal = pedido;
      }
    }

    // Post antigo sem data de publicação quebra o build: completa ao salvar.
    const extras: Record<string, unknown> = {};
    if (!fmAtual.publicadoEm && campos.publicadoEm === undefined) extras.publicadoEm = hojeISO();
    // Post antigo com id de usuário em `autor`: ao salvar, vira o slug do autor (quando ele assina).
    if (campos.autor === undefined && body.autorId === undefined && body.autor === undefined) {
      const atual = String(fmAtual.autor ?? "").trim();
      const slugAutor = atual ? slugPublicavel(atual, usuarios) : null;
      if (slugAutor && slugAutor !== atual) extras.autor = slugAutor;
    }
    // Post antigo com `palavraChave` (skills anteriores): ao salvar, migra para `kwPrimaria` e tira a linha antiga.
    const legadoKw = fmAtual.palavraChave !== undefined && fmAtual.palavraChave !== null ? String(fmAtual.palavraChave) : "";
    const limpar = camposParaLimpar(body);
    if (legadoKw) {
      if (campos.kwPrimaria === undefined && fmAtual.kwPrimaria === undefined && !limpar.includes("kwPrimaria")) extras.kwPrimaria = legadoKw;
      limpar.push("palavraChave");
    } else if (fmAtual.palavraChave !== undefined) {
      limpar.push("palavraChave");
    }
    const gravar = { ...campos, ...extras, atualizadoEm: hojeISO() };

    // Edição cirúrgica: só as linhas dos campos alterados mudam; o resto do
    // arquivo (inclusive o que o painel não entende) fica intacto.
    const novo = removerCamposFrontmatter(atualizarFrontmatter(raw, gravar, corpo), limpar);

    if (slugFinal === slug) {
      gravarAtomico(filePath, novo);
    } else {
      // Renomear sem perder nada: grava o arquivo NOVO (nunca por cima de outro)
      // e só depois remove o antigo. Se algo falhar no meio, o conteúdo existe.
      if (!gravarNovoAtomico(caminhoPost(slugFinal), novo)) {
        return NextResponse.json({ ok: false, erro: "Já existe um post com esse endereço (slug)." }, { status: 409 });
      }
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        // Não conseguiu remover o antigo: desfaz o novo para não duplicar o post.
        try { fs.unlinkSync(caminhoPost(slugFinal)); } catch { /* segue */ }
        throw err;
      }
    }

    // Endereço novo: quem já teve o endereço antigo no ar precisa ser redirecionado (301), sem cadeia nem laço.
    let redirecionamento: { origem: string; destino: string } | null = null;
    let avisoRedirect: string | undefined;
    if (slugFinal !== slug) {
      const estevNoAr = ["publicado", "pronto", "agendado"].includes(statusAtual) || postEstaNoSite(slug);
      try {
        if (estevNoAr) {
          redirecionamento = registrarRenomeacao(slug, slugFinal).criado;
        } else {
          liberarEnderecoDePost(slugFinal); // rascunho nunca no ar: só garante que não sobra redirect saindo do endereço novo
        }
      } catch (err) {
        console.error("[api/posts PATCH] redirecionamento:", err);
        avisoRedirect = "O post foi renomeado, mas não consegui criar o redirecionamento do endereço antigo. Crie em SEO > Redirecionamentos.";
      }
    }

    return NextResponse.json({
      ok: true,
      slug: slugFinal,
      renomeado: slugFinal !== slug,
      ...(redirecionamento ? { redirecionamento } : {}),
      ...(avisoRedirect ? { aviso: avisoRedirect } : {}),
    });
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

    // Vai para a lixeira (fora do que o site lê); apagar de vez só a partir de lá.
    const chave = moverParaLixeira(slug);
    if (!chave) {
      return NextResponse.json({ ok: false, erro: "Post não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, slug, chave });
  } catch (err) {
    console.error("[api/posts DELETE]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
