/**
 * app/api/redirects/route.ts
 * GET  /api/redirects  → lista redirects
 * POST /api/redirects  → cria redirect e atualiza nginx/astro
 */

import { NextRequest, NextResponse } from "next/server";
import { lerRedirects, salvarRedirects } from "@/lib/redirects";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import type { Redirect } from "@/mock/types";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["redirects:GET"]);
  if (auth) return auth;

  const redirects = lerRedirects();
  return NextResponse.json({ ok: true, redirects });
}

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["redirects:POST"]);
  if (auth) return auth;

  try {
    const body = await req.json();

    if (!body.origem || !body.destino) {
      return NextResponse.json({ ok: false, erro: "origem e destino obrigatórios" }, { status: 400 });
    }

    const codigos = [301, 302, 410];
    if (body.codigo && !codigos.includes(body.codigo)) {
      return NextResponse.json({ ok: false, erro: "Código inválido (301, 302 ou 410)" }, { status: 400 });
    }

    const redirects = lerRedirects();

    // Verificar duplicata de origem
    if (redirects.some((r) => r.origem === body.origem)) {
      return NextResponse.json({ ok: false, erro: "Já existe redirect para essa origem" }, { status: 409 });
    }

    const novo: Redirect = {
      id: `r${Date.now()}`,
      origem: String(body.origem),
      destino: String(body.destino),
      codigo: body.codigo ?? 301,
      criadoPor: body.criadoPor ?? "manual",
      hits: 0,
      data: new Date().toISOString().split("T")[0],
    };

    redirects.push(novo);
    salvarRedirects(redirects);

    return NextResponse.json({ ok: true, redirect: novo });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
