/**
 * app/api/layout/route.ts
 * GET /api/layout → qual layout o site usa e onde abrir as demonstrações.
 *
 * `ativo`: base do motor em uso (marcador que scripts/promover_tema.py grava),
 *   ou null se o site não tem marcador.
 * `catalogoUrl`: endereço do motor de referência servindo as demonstrações.
 *   Só existe no computador onde o site é construído (o agente sobe o catálogo
 *   na porta 4322) e é conferido a cada chamada; no servidor de um cliente publicado ele é null, porque lá
 *   só existe o layout escolhido.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTemaAtivo } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

function catalogoUrl(): string | null {
  const definido = process.env.LINKFLOW_CATALOGO_URL?.trim();
  if (definido) return definido.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? null : "http://localhost:4322";
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["layout:GET"]);
  if (auth) return auth;

  // Só devolve o endereço se o catálogo está de fato no ar: link para um servidor
  // desligado abre "Failed to Load Page" e parece defeito do painel.
  let url = catalogoUrl();
  if (url) {
    try {
      const r = await fetch(`${url}/catalogo`, { method: "HEAD", signal: AbortSignal.timeout(800) });
      if (!r.ok) url = null;
    } catch {
      url = null;
    }
  }
  return NextResponse.json({ ok: true, ativo: getTemaAtivo(), catalogoUrl: url });
}
