/**
 * app/api/leads/[id]/route.ts
 * PATCH  /api/leads/:id  → atualiza status do lead
 * DELETE /api/leads/:id  → remove lead
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { verificarAcesso } from "@/lib/auth";
import type { Lead, StatusLead } from "@/mock/types";

const STATUS_VALIDOS: StatusLead[] = ["novo", "em_contato", "convertido", "descartado"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const leads = lerDados<Lead[]>("leads.json", []);
    const idx = leads.findIndex((l) => l.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Lead não encontrado" }, { status: 404 });
    }

    if (body.status && !STATUS_VALIDOS.includes(body.status)) {
      return NextResponse.json({ ok: false, erro: "Status inválido" }, { status: 400 });
    }

    leads[idx] = { ...leads[idx], ...body };
    salvarDados("leads.json", leads);

    return NextResponse.json({ ok: true, lead: leads[idx] });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const leads = lerDados<Lead[]>("leads.json", []);
    const idx = leads.findIndex((l) => l.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Lead não encontrado" }, { status: 404 });
    }

    leads.splice(idx, 1);
    salvarDados("leads.json", leads);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
