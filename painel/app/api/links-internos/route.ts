/**
 * app/api/links-internos/route.ts
 * GET /api/links-internos → grafo real de links internos, lido do HTML em
 * _astro/dist/ (fonte da regra de página órfã da auditoria de SEO).
 *
 * `disponivel: false` quando o site ainda não foi buildado: nesse caso NÃO
 * existe dado real, e a auditoria não pode tratar "sem dados" como "sem links".
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getLinkflowDir } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { lerGrafoLinks } from "@/lib/links-internos";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["links-internos:GET"]);
  if (auth) return auth;

  try {
    const grafo = lerGrafoLinks(path.join(getLinkflowDir(), "_astro/dist"));
    if (!grafo) return NextResponse.json({ ok: true, disponivel: false, links: {} });
    return NextResponse.json({ ok: true, disponivel: true, links: grafo.links });
  } catch (err) {
    console.error("[api/links-internos GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
