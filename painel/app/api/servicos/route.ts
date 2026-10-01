/**
 * app/api/servicos/route.ts
 * GET  /api/servicos   → lista os serviços do cliente (a lixeira fica em /api/servicos/lixeira)
 * POST /api/servicos   → cria um serviço novo (já válido para o site, com título/meta provisórios)
 */
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { listarArquivos, lerArquivo, stringifyMd } from "@/lib/fs";
import { exigirPapel, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { servicoParaApi } from "@/lib/servicos-api";
import {
  camposParaLimparServico, frontmatterInicialServico, painelParaFrontmatterServico,
  slugOcupadoGlobal, validarCamposObrigatoriosServico, validarCorpoRequisicaoServico,
} from "@/lib/servicos-campos";
import { dirServicos, caminhoServico, gravarNovoAtomico, slugLivreServico } from "@/lib/servicos-fs";
import { SLUGS_RESERVADOS_SERVICO } from "@/lib/servicos-regras";
import { normalizarCorpo, slugDoTitulo } from "@/lib/posts-regras";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["servicos:GET"]);
  if (auth) return auth;

  try {
    const dir = dirServicos();
    const arquivos = listarArquivos(dir, ".md");
    const servicos = arquivos
      .map((arquivo) => {
        const raw = lerArquivo(path.join(dir, arquivo));
        if (!raw) return null;
        return servicoParaApi(arquivo.replace(/\.md$/, ""), raw);
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, "pt-BR"));
    return NextResponse.json({ ok: true, servicos });
  } catch (err) {
    console.error("[api/servicos GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["servicos:POST"]);
  if (auth) return auth;

  try {
    const body = (await req.json()) as Record<string, unknown>;

    const erroCorpo = validarCorpoRequisicaoServico(body);
    if (erroCorpo) return NextResponse.json({ ok: false, erro: erroCorpo.erro }, { status: erroCorpo.status });

    const campos = painelParaFrontmatterServico(body);
    const limpar = camposParaLimparServico(body);
    const fm = frontmatterInicialServico(campos);
    for (const k of limpar) delete fm[k];

    const invalido = validarCamposObrigatoriosServico(fm);
    if (invalido) return NextResponse.json({ ok: false, erro: invalido.erro }, { status: invalido.status });

    // Slug: o pedido explícito não pode colidir; o derivado do título ganha sufixo -2, -3…
    let slug: string;
    if (typeof body.slug === "string" && body.slug.trim()) {
      slug = slugDoTitulo(body.slug);
      if (!slug || !validarSlug(slug) || SLUGS_RESERVADOS_SERVICO.includes(slug)) {
        return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
      }
      if (slugOcupadoGlobal(slug)) {
        return NextResponse.json({ ok: false, erro: "Já existe uma página com esse endereço (slug)." }, { status: 409 });
      }
    } else {
      slug = slugLivreServico(slugDoTitulo(String(fm.titulo)) || "servico", slugOcupadoGlobal);
    }

    const corpo = normalizarCorpo(body.corpo, body.corpoFormato === "html");
    if (!gravarNovoAtomico(caminhoServico(slug), stringifyMd(fm, corpo))) {
      return NextResponse.json({ ok: false, erro: "Já existe uma página com esse endereço (slug)." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, slug, titulo: fm.titulo });
  } catch (err) {
    console.error("[api/servicos POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
