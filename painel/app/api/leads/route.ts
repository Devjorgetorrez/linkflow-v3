/**
 * app/api/leads/route.ts
 * GET  /api/leads  → lista leads do site
 * POST /api/leads  → cria lead (interno — use /api/submissao para o site)
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import type { Lead } from "@/mock/types";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["leads:GET"]);
  if (auth) return auth;

  const leads = lerDados<Lead[]>("leads.json", []);
  return NextResponse.json({ ok: true, leads });
}

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["leads:POST"]);
  if (auth) return auth;

  try {
    const body = await req.json();
    const leads = lerDados<Lead[]>("leads.json", []);

    const novo: Lead = {
      id: `lead-${Date.now()}`,
      formularioId: body.formularioId ?? "",
      formularioNome: body.formularioNome ?? "Contato",
      nome: body.nome ?? "",
      email: body.email ?? "",
      telefone: body.telefone ?? "",
      mensagem: body.mensagem ?? "",
      paginaOrigem: body.paginaOrigem ?? "",
      data: new Date().toISOString(),
      status: "novo",
      utm: body.utm ?? { source: "", medium: "", campaign: "", term: "", content: "" },
      lgpdAceite: Boolean(body.lgpdAceite),
      lgpdData: body.lgpdAceite ? new Date().toISOString() : "",
      camposExtras: body.camposExtras ?? {},
    };

    leads.unshift(novo);
    salvarDados("leads.json", leads);

    return NextResponse.json({ ok: true, lead: novo });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
