/**
 * app/api/leads/[id]/route.ts
 * PATCH  /api/leads/:id  → atualiza status do lead
 * DELETE /api/leads/:id  → remove lead
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import type { Lead, StatusLead } from "@/mock/types";

const STATUS_VALIDOS: StatusLead[] = ["novo", "em_contato", "convertido", "descartado"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["leads/[id]:PATCH"]);
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

    // Só o status é editável (nada de sobrescrever nome, contato ou aceite LGPD por PATCH).
    if (!body.status) {
      return NextResponse.json({ ok: false, erro: "Informe o status." }, { status: 400 });
    }
    leads[idx] = { ...leads[idx], status: body.status };
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
  const auth = await exigirPapel(req, MATRIZ["leads/[id]:DELETE"]);
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
