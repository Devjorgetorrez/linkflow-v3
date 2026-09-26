/**
 * app/api/midia/arquivo/[...caminho]/route.ts
 * GET /api/midia/arquivo/<pasta>/<nome> → entrega o arquivo da biblioteca para a PRÉVIA do painel.
 *
 * O painel roda em outro endereço que o site (painel.<dominio> no servidor,
 * localhost:3210 no computador), então `/midia/x.png` não existe nele. Esta rota
 * lê da mesma pasta que o Nginx serve ao site ($LINKFLOW_DIR/midia) e exige login.
 * Só entrega tipos de mídia seguros (nunca SVG/HTML) e nunca sai da pasta.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { getMidiaDir } from "@/lib/midia-upload";

const TIPOS: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", avif: "image/avif", pdf: "application/pdf", mp4: "video/mp4", webm: "video/webm",
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ caminho: string[] }> }) {
  const auth = await exigirPapel(req, MATRIZ["midia:GET"]);
  if (auth) return auth;

  const { caminho } = await ctx.params;
  const raiz = path.resolve(getMidiaDir());
  const alvo = path.resolve(raiz, ...(caminho ?? []).map((p) => decodeURIComponent(p)));
  if (alvo !== raiz && !alvo.startsWith(raiz + path.sep)) {
    return NextResponse.json({ ok: false, erro: "Caminho inválido." }, { status: 400 });
  }
  const tipo = TIPOS[path.extname(alvo).slice(1).toLowerCase()];
  if (!tipo || !fs.existsSync(alvo) || !fs.statSync(alvo).isFile()) {
    return NextResponse.json({ ok: false, erro: "Arquivo não encontrado." }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(fs.readFileSync(alvo)), {
    headers: {
      "Content-Type": tipo,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300",
    },
  });
}
