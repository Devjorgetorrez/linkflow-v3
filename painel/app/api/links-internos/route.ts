/**
 * app/api/links-internos/route.ts
 * GET /api/links-internos → grafo real de links internos, lido do HTML do
 * site PUBLICADO (fallback: última prévia em _astro/dist — lib/site-lido.ts).
 * Fonte da regra de página órfã e de link quebrado da auditoria de SEO.
 *
 * `disponivel: false` quando não há site gerado: nesse caso NÃO existe dado
 * real, e a auditoria não pode tratar "sem dados" como "sem links".
 * `origem` diz de onde veio ("publicado" | "previa" | "nenhuma").
 */

import { NextRequest, NextResponse } from "next/server";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { lerGrafoLinks } from "@/lib/links-internos";
import { resolverOrigemSite } from "@/lib/site-lido";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["links-internos:GET"]);
  if (auth) return auth;

  try {
    const o = resolverOrigemSite();
    const grafo = o.dir ? lerGrafoLinks(o.dir) : null;
    if (!grafo) {
      return NextResponse.json({ ok: true, disponivel: false, origem: o.origem, origemRotulo: o.rotulo, links: {}, quebrados: {} });
    }
    return NextResponse.json({
      ok: true,
      disponivel: true,
      origem: o.origem,
      origemRotulo: o.rotulo,
      links: grafo.links,
      quebrados: grafo.quebrados,
    });
  } catch (err) {
    console.error("[api/links-internos GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
