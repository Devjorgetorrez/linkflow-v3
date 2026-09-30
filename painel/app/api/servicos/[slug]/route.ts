/**
 * app/api/servicos/[slug]/route.ts
 * GET    /api/servicos/:slug   → lê um serviço
 * PATCH  /api/servicos/:slug   → atualiza um serviço; `slug` no corpo, diferente do da URL, RENOMEIA o arquivo
 * DELETE /api/servicos/:slug   → move o serviço para a lixeira própria (ver /api/servicos/lixeira)
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { lerArquivo, parseMd, stringifyMd, atualizarFrontmatter, removerChavesFrontmatter } from "@/lib/fs";
import { exigirPapel, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { servicoParaApi } from "@/lib/servicos-api";
import {
  camposParaLimparServico, painelParaFrontmatterServico, slugOcupadoGlobal,
  validarCamposObrigatoriosServico, validarCorpoRequisicaoServico, validarPublicacaoServico,
} from "@/lib/servicos-campos";
import {
  caminhoServico, gravarAtomico, gravarNovoAtomico, moverServicoParaLixeira, slugLivreServico,
} from "@/lib/servicos-fs";
import { SLUGS_RESERVADOS_SERVICO } from "@/lib/servicos-regras";
import { normalizarCorpo, slugDoTitulo } from "@/lib/posts-regras";
import { reescreverLinksDoSlug, referenciasDoPost, type LinkNaoAtualizado, type LinksAtualizados } from "@/lib/links-slug";
import { reescreverPilarDoServico, removerPilarDoServico } from "@/lib/servicos-vinculos";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await exigirPapel(req, MATRIZ["servicos/[slug]:GET"]);
  if (auth) return auth;

  const { slug } = await params;
  if (!validarSlug(slug)) {
    return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
  }
  const raw = lerArquivo(caminhoServico(slug));
  if (!raw) {
    return NextResponse.json({ ok: false, erro: "Serviço não encontrado" }, { status: 404 });
  }
  const servico = servicoParaApi(slug, raw);
  return NextResponse.json({ ok: true, servico });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await exigirPapel(req, MATRIZ["servicos/[slug]:PATCH"]);
  if (auth) return auth;

  try {
    const { slug } = await params;
    if (!validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }

    const filePath = caminhoServico(slug);
    const raw = lerArquivo(filePath);
    if (!raw) {
      return NextResponse.json({ ok: false, erro: "Serviço não encontrado" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const erroCorpo = validarCorpoRequisicaoServico(body);
    if (erroCorpo) return NextResponse.json({ ok: false, erro: erroCorpo.erro }, { status: erroCorpo.status });

    const campos = painelParaFrontmatterServico(body);
    const limpar = camposParaLimparServico(body);
    const corpo = typeof body.corpo === "string" ? normalizarCorpo(body.corpo, body.corpoFormato === "html") : undefined;

    // Validação: título/meta finais (patch aplicado sobre o que já existe no arquivo).
    const fmAtual = parseMd(raw).frontmatter;
    const fmFinal = { ...fmAtual, ...campos };
    for (const k of limpar) delete fmFinal[k];
    const invalido = validarCamposObrigatoriosServico(fmFinal);
    if (invalido) return NextResponse.json({ ok: false, erro: invalido.erro }, { status: invalido.status });

    const corpoFinal = corpo !== undefined ? corpo : parseMd(raw).content;
    const bloqueado = validarPublicacaoServico(fmFinal, corpoFinal);
    if (bloqueado) return NextResponse.json({ ok: false, erro: bloqueado.erro }, { status: bloqueado.status });

    // ── Slug novo? (renomear o arquivo) ──────────────────────────────────────
    let slugFinal = slug;
    if (typeof body.slug === "string" && body.slug.trim() && slugDoTitulo(body.slug) !== slug) {
      const pedido = slugDoTitulo(body.slug);
      if (!pedido || !validarSlug(pedido) || SLUGS_RESERVADOS_SERVICO.includes(pedido)) {
        return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
      }
      if (body.slugAuto === true) {
        slugFinal = slugLivreServico(pedido, slugOcupadoGlobal, slug);
      } else if (slugOcupadoGlobal(pedido)) {
        return NextResponse.json({ ok: false, erro: "Já existe uma página com esse endereço (slug)." }, { status: 409 });
      } else {
        slugFinal = pedido;
      }
    }

    const novo = removerChavesFrontmatter(atualizarFrontmatter(raw, campos, corpo), limpar);

    if (slugFinal === slug) {
      gravarAtomico(filePath, novo);
    } else {
      if (!gravarNovoAtomico(caminhoServico(slugFinal), novo)) {
        return NextResponse.json({ ok: false, erro: "Já existe uma página com esse endereço (slug)." }, { status: 409 });
      }
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        try { fs.unlinkSync(caminhoServico(slugFinal)); } catch { /* segue */ }
        throw err;
      }
    }

    // Endereço mudou: links internos (corpo/menu, via links-slug.ts — já cobre `servicos`) e o
    // campo `pilar:` de cada post que apoiava este serviço acompanham o endereço novo.
    let linksAtualizados: LinksAtualizados[] = [];
    let linksNaoAtualizados: LinkNaoAtualizado[] = [];
    let pilaresAtualizados: { arquivo: string; titulo: string }[] = [];
    if (slugFinal !== slug) {
      try {
        const r = reescreverLinksDoSlug(slug, slugFinal);
        linksAtualizados = r.linksAtualizados;
        linksNaoAtualizados = r.linksNaoAtualizados;
      } catch (err) {
        console.error("[api/servicos PATCH] links internos:", err);
        linksNaoAtualizados = [{ arquivo: "(todos)", motivo: "não consegui atualizar os links internos" }];
      }
      try {
        pilaresAtualizados = reescreverPilarDoServico(slug, slugFinal);
      } catch (err) {
        console.error("[api/servicos PATCH] pilar:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      slug: slugFinal,
      renomeado: slugFinal !== slug,
      ...(slugFinal !== slug ? { linksAtualizados, linksNaoAtualizados, pilaresAtualizados } : {}),
    });
  } catch (err) {
    console.error("[api/servicos PATCH]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await exigirPapel(req, MATRIZ["servicos/[slug]:DELETE"]);
  if (auth) return auth;

  try {
    const { slug } = await params;
    if (!validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }

    // Quem referencia o serviço ANTES de mandar pra lixeira (aviso, não bloqueio — igual a posts).
    let referencias: ReturnType<typeof referenciasDoPost> = [];
    try { referencias = referenciasDoPost(slug); } catch (err) { console.error("[api/servicos DELETE] referencias:", err); }

    const chave = moverServicoParaLixeira(slug);
    if (!chave) {
      return NextResponse.json({ ok: false, erro: "Serviço não encontrado" }, { status: 404 });
    }
    let pilaresLimpos: { arquivo: string; titulo: string }[] = [];
    try { pilaresLimpos = removerPilarDoServico(slug); } catch (err) { console.error("[api/servicos DELETE] pilar:", err); }

    return NextResponse.json({ ok: true, slug, chave, referencias, pilaresLimpos });
  } catch (err) {
    console.error("[api/servicos DELETE]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
