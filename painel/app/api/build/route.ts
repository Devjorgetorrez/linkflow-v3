/**
 * app/api/build/route.ts
 * POST /api/build → valida o conteúdo e dispara o build do Astro em segundo plano
 *                   (202 iniciado · 409 já há build rodando · 422 conteúdo inválido)
 * GET  /api/build → estado do último build (lib/build-estado.ts)
 * GET  /api/build?log=1 → log completo do último build (texto puro)
 *
 * O estado fica em $LINKFLOW_DIR/dados/build-estado.json; a rota nunca diz
 * "publicado" antes do processo terminar de verdade.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getSiteSlug } from "@/lib/fs";
import { exigirPapel, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { caminhoLogUltimo, iniciarBuild, lerEstado } from "@/lib/build-estado";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["build:POST"]);
  if (auth) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const slugRaw = body?.slug ?? getSiteSlug();
    if (!validarSlug(slugRaw)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }

    const r = iniciarBuild(slugRaw as string);
    if (r.tipo === "ocupado") {
      return NextResponse.json(
        { ok: false, erro: "Já existe uma publicação em andamento. Aguarde ela terminar.", estado: r.estado },
        { status: 409 },
      );
    }
    if (r.tipo === "invalido") {
      return NextResponse.json(
        {
          ok: false,
          erro: `Publicação bloqueada: ${r.erros.length} problema(s) no conteúdo do site. Corrija e publique de novo.`,
          erros: r.erros,
          estado: r.estado,
        },
        { status: 422 },
      );
    }
    if (r.estado.status === "erro") {
      return NextResponse.json({ ok: false, erro: r.estado.resumo ?? "Falha ao iniciar a publicação.", estado: r.estado }, { status: 500 });
    }
    return NextResponse.json({ ok: true, estado: r.estado }, { status: 202 });
  } catch (err) {
    console.error("[api/build POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["build:GET"]);
  if (auth) return auth;

  try {
    if (new URL(req.url).searchParams.get("log")) {
      const arq = caminhoLogUltimo();
      if (!arq) return NextResponse.json({ ok: false, erro: "Nenhum log de publicação disponível." }, { status: 404 });
      return new NextResponse(fs.readFileSync(arq, "utf-8"), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json({ ok: true, estado: lerEstado() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/build GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
