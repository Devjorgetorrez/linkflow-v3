/**
 * app/api/servicos/lixeira/route.ts — lixeira PRÓPRIA dos serviços (não
 * reaproveita dados/lixeira/posts — coleções diferentes).
 *
 * GET    /api/servicos/lixeira                 → lista os serviços na lixeira
 * POST   /api/servicos/lixeira  { slug }       → restaura (sufixo -2, -3… se o endereço estiver ocupado)
 * DELETE /api/servicos/lixeira?slug=…          → exclui DEFINITIVAMENTE um serviço da lixeira
 * DELETE /api/servicos/lixeira?todos=1         → esvazia a lixeira
 */
import { NextRequest, NextResponse } from "next/server";
import { lerArquivo } from "@/lib/fs";
import { exigirPapel, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { servicoParaApi } from "@/lib/servicos-api";
import { slugOcupadoGlobal } from "@/lib/servicos-campos";
import {
  caminhoLixeiraServico, chavesDaLixeiraServicos, excluirServicoDaLixeira, restaurarServicoDaLixeira,
} from "@/lib/servicos-fs";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["servicos/lixeira:GET"]);
  if (auth) return auth;
  try {
    const servicos = chavesDaLixeiraServicos()
      .map((chave) => {
        const raw = lerArquivo(caminhoLixeiraServico(chave));
        return raw ? servicoParaApi(chave, raw) : null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    return NextResponse.json({ ok: true, servicos });
  } catch (err) {
    console.error("[api/servicos/lixeira GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["servicos/lixeira:POST"]);
  if (auth) return auth;
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug || !validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }
    const restaurado = restaurarServicoDaLixeira(slug, slugOcupadoGlobal);
    if (!restaurado) {
      return NextResponse.json({ ok: false, erro: "Serviço não encontrado na lixeira" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, slug: restaurado });
  } catch (err) {
    console.error("[api/servicos/lixeira POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["servicos/lixeira:DELETE"]);
  if (auth) return auth;
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("todos") === "1") {
      let apagados = 0;
      for (const chave of chavesDaLixeiraServicos()) if (excluirServicoDaLixeira(chave)) apagados++;
      return NextResponse.json({ ok: true, apagados });
    }
    const slug = url.searchParams.get("slug") ?? "";
    if (!validarSlug(slug)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }
    if (excluirServicoDaLixeira(slug)) return NextResponse.json({ ok: true, slug });
    return NextResponse.json({ ok: false, erro: "Serviço não encontrado na lixeira" }, { status: 404 });
  } catch (err) {
    console.error("[api/servicos/lixeira DELETE]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
