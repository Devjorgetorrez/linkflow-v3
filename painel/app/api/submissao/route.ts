/**
 * app/api/submissao/route.ts
 * POST /api/submissao  → endpoint público que o formulário do SITE chama.
 *
 * Contrato (JSON): { formularioId, nome, email, telefone, mensagem, _hp,
 *   paginaOrigem, utm_source/medium/campaign/term/content, lgpdAceite, camposExtras }
 * Resposta: { ok:true, mensagem } | { ok:false, erro, campos? }
 *
 * Sem sessão (o visitante não tem login). Proteções: CORS restrito ao domínio do
 * site, honeypot silencioso, limite de tamanho, validação, limite por IP e global.
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { lerFormularios, origensPermitidas } from "@/lib/formularios-dados";
import { validarSubmissao } from "@/lib/formularios-regras";
import { criarLimiteSubmissao, ipDoCliente } from "@/lib/limite-submissao";
import type { Lead } from "@/mock/types";

const MAX_CORPO = 20 * 1024;
const limite = criarLimiteSubmissao();

function cabecalhosCors(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
  const origem = req.headers.get("origin");
  if (origem && origensPermitidas().includes(origem)) h["Access-Control-Allow-Origin"] = origem;
  return h;
}

/** Origem presente e fora da lista = bloqueada. Sem Origin (curl, servidor) passa. */
function origemBloqueada(req: NextRequest): boolean {
  const origem = req.headers.get("origin");
  return !!origem && !origensPermitidas().includes(origem);
}

function resp(req: NextRequest, corpo: unknown, status = 200) {
  return NextResponse.json(corpo, { status, headers: cabecalhosCors(req) });
}

const campo = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(req: NextRequest) {
  try {
    if (origemBloqueada(req)) {
      return resp(req, { ok: false, erro: "Origem não autorizada a enviar este formulário." }, 403);
    }

    const bloqueio = limite.tentar(ipDoCliente(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip")));
    if (bloqueio) return resp(req, { ok: false, erro: bloqueio }, 429);

    const declarado = Number(req.headers.get("content-length") ?? 0);
    if (declarado > MAX_CORPO) return resp(req, { ok: false, erro: "Mensagem grande demais." }, 413);
    const texto = await req.text();
    if (Buffer.byteLength(texto, "utf-8") > MAX_CORPO) {
      return resp(req, { ok: false, erro: "Mensagem grande demais." }, 413);
    }

    let body: Record<string, unknown>;
    try {
      const j = JSON.parse(texto);
      if (!j || typeof j !== "object" || Array.isArray(j)) throw new Error("formato");
      body = j as Record<string, unknown>;
    } catch {
      return resp(req, { ok: false, erro: "Não entendi os dados enviados." }, 400);
    }

    // Anti-spam: honeypot silencioso (parece sucesso, não grava nada).
    if (body._hp) return resp(req, { ok: true, mensagem: "Mensagem enviada com sucesso." });

    const formularioId = campo(body.formularioId, 50) || "contato";
    const formulario = lerFormularios().find((f) => f.id === formularioId);
    if (!formulario) return resp(req, { ok: false, erro: "Formulário não encontrado." }, 404);
    if (!formulario.ativo) {
      return resp(req, { ok: false, erro: "Este formulário está desativado no momento." }, 400);
    }

    const v = validarSubmissao(body, formulario);
    if (!v.ok) {
      return resp(req, { ok: false, erro: Object.values(v.erros)[0], campos: v.erros }, 400);
    }
    if (formulario.exigeLgpd && body.lgpdAceite !== true) {
      return resp(req, {
        ok: false,
        erro: "É preciso aceitar o uso dos dados para enviar.",
        campos: { lgpdAceite: "Marque a caixa de consentimento para enviar." },
      }, 400);
    }

    const aceite = body.lgpdAceite === true;
    const agora = new Date().toISOString();
    const lead: Lead = {
      id: `lead-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      formularioId,
      formularioNome: formulario.nome,
      nome: v.valor.nome,
      email: v.valor.email,
      telefone: v.valor.telefone,
      mensagem: v.valor.mensagem,
      paginaOrigem: campo(body.paginaOrigem ?? req.headers.get("referer"), 300),
      data: agora,
      status: "novo",
      utm: {
        source: campo(body.utm_source, 100),
        medium: campo(body.utm_medium, 100),
        campaign: campo(body.utm_campaign, 100),
        term: campo(body.utm_term, 100),
        content: campo(body.utm_content, 100),
      },
      lgpdAceite: aceite,
      lgpdData: aceite ? agora : "",
      camposExtras: v.valor.camposExtras,
    };

    // Leitura → alteração → gravação SEM await no meio: no Node isso é atômico dentro
    // do processo (não há intercalação), e salvarDados troca o arquivo de uma vez.
    const leads = lerDados<Lead[]>("leads.json", []);
    leads.unshift(lead);
    salvarDados("leads.json", leads);
    // envios30d é derivado dos leads na leitura (GET /api/formularios); nada a gravar aqui.

    return resp(req, { ok: true, mensagem: formulario.msgSucesso });
  } catch (err) {
    console.error("[api/submissao]", err);
    return resp(req, { ok: false, erro: "Erro interno. Tente novamente em instantes." }, 500);
  }
}

// GET só para a tela do painel/teste: devolve o formulário público (campos e textos).
export async function GET(req: NextRequest) {
  const id = campo(req.nextUrl.searchParams.get("formularioId"), 50) || "contato";
  const f = lerFormularios().find((x) => x.id === id && x.ativo);
  if (!f) return resp(req, { ok: false, erro: "Formulário não encontrado." }, 404);
  return resp(req, {
    ok: true,
    formulario: { id: f.id, nome: f.nome, campos: f.campos, exigeLgpd: f.exigeLgpd, lgpdTexto: f.lgpdTexto, lgpdPoliticaUrl: f.lgpdPoliticaUrl },
  });
}

export async function OPTIONS(req: NextRequest) {
  if (origemBloqueada(req)) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: cabecalhosCors(req) });
}
