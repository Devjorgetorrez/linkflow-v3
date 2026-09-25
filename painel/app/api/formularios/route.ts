/**
 * app/api/formularios/route.ts
 * GET  /api/formularios  → lista formulários do site
 * POST /api/formularios  → cria formulário
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { verificarAcesso } from "@/lib/auth";
import type { Formulario } from "@/mock/types";

export async function GET(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  const formularios = lerDados<Formulario[]>("formularios.json", []);
  return NextResponse.json({ ok: true, formularios });
}

export async function POST(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const formularios = lerDados<Formulario[]>("formularios.json", []);

    const novo: Formulario = {
      id: `form-${Date.now()}`,
      nome: body.nome ?? "Novo formulário",
      campos: body.campos ?? [],
      destinoEmail: body.destinoEmail ?? { ativo: false, endereco: "", assunto: "" },
      destinoWhatsApp: body.destinoWhatsApp ?? { ativo: false, numero: "" },
      destinoWebhook: body.destinoWebhook ?? { ativo: false, url: "" },
      msgSucesso: body.msgSucesso ?? "Mensagem enviada com sucesso!",
      msgErro: body.msgErro ?? "Erro ao enviar. Tente novamente.",
      paginaObrigado: body.paginaObrigado ?? "",
      honeypot: body.honeypot ?? true,
      confirmarMarcacao: body.confirmarMarcacao ?? false,
      lgpdTexto: body.lgpdTexto ?? "",
      lgpdPoliticaUrl: body.lgpdPoliticaUrl ?? "",
      usadoEm: body.usadoEm ?? [],
      envios30d: 0,
      ativo: body.ativo ?? true,
    };

    formularios.push(novo);
    salvarDados("formularios.json", formularios);

    return NextResponse.json({ ok: true, formulario: novo });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
