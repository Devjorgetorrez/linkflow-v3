/**
 * app/api/redirects/route.ts
 * GET  /api/redirects  → lista redirects
 * POST /api/redirects  → cria redirect e atualiza nginx/astro
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { lerDados, salvarDados } from "@/lib/dados";
import { getLinkflowDir, getSiteSlug } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import type { Redirect } from "@/mock/types";

function gerarArquivoRedirects(redirects: Redirect[]): void {
  // Gerar arquivo _redirects para o site (compatível com Netlify/Cloudflare)
  // e também um arquivo nginx-redirects.conf para o Nginx no VPS
  const siteDir = `/var/www/${getSiteSlug()}`;
  const linhasNetlify = redirects
    .filter((r) => r.codigo !== 410)
    .map((r) => `${r.origem}  ${r.destino}  ${r.codigo}`);
  const linhasGone = redirects
    .filter((r) => r.codigo === 410)
    .map((r) => `${r.origem}  /410  410`);

  const conteudoNetlify = [...linhasNetlify, ...linhasGone].join("\n");

  try {
    if (fs.existsSync(siteDir)) {
      fs.writeFileSync(path.join(siteDir, "_redirects"), conteudoNetlify, "utf-8");
    }
  } catch { /* silencioso se não tiver permissão */ }
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["redirects:GET"]);
  if (auth) return auth;

  const redirects = lerDados<Redirect[]>("redirects.json", []);
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

    const redirects = lerDados<Redirect[]>("redirects.json", []);

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
    salvarDados("redirects.json", redirects);
    gerarArquivoRedirects(redirects);

    return NextResponse.json({ ok: true, redirect: novo });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
