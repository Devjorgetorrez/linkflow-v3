/**
 * app/api/submissao/route.ts
 * POST /api/submissao  → endpoint público que o formulário do site chama
 *
 * Não exige autenticação — é chamado pelo visitante do site.
 * Proteções: honeypot, limite de tamanho por campo, rate limit básico por IP.
 */

import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import type { Formulario, Lead } from "@/mock/types";

// ─── Rate limit simples em memória ────────────────────────────────────────────
// Mapa: IP → { contagem, janela }. Reseta a cada hora.
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;        // máx 5 submissões por IP
const RATE_JANELA = 60 * 60 * 1000; // por hora

function checarRateLimit(ip: string): boolean {
  const agora = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || agora > entry.reset) {
    rateMap.set(ip, { count: 1, reset: agora + RATE_JANELA });
    return true; // ok
  }
  if (entry.count >= RATE_LIMIT) return false; // bloqueado
  entry.count++;
  return true;
}

// ─── Headers CORS ─────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonCors(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

// ─── Sanitização de string com limite de tamanho ──────────────────────────────
function campo(val: unknown, max = 500): string {
  return String(val ?? "").slice(0, max);
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Rate limit por IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";

    if (!checarRateLimit(ip)) {
      return jsonCors({ ok: false, erro: "Muitas tentativas. Tente novamente mais tarde." }, 429);
    }

    const body = await req.json();

    // Anti-spam: honeypot
    if (body._hp) {
      return jsonCors({ ok: true }); // silencioso
    }

    const formularioId = campo(body.formularioId, 50) || "contato";
    const formularios = lerDados<Formulario[]>("formularios.json", []);
    const formulario = formularios.find((f) => f.id === formularioId);

    // Criar o lead com campos sanitizados e limitados em tamanho
    const lead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      formularioId,
      formularioNome: formulario?.nome ?? "Contato",
      nome: campo(body.nome, 100),
      email: campo(body.email, 200),
      telefone: campo(body.telefone, 30),
      mensagem: campo(body.mensagem, 2000),
      paginaOrigem: campo(body.paginaOrigem ?? req.headers.get("referer"), 300),
      data: new Date().toISOString(),
      status: "novo",
      utm: {
        source: campo(body.utm_source, 100),
        medium: campo(body.utm_medium, 100),
        campaign: campo(body.utm_campaign, 100),
        term: campo(body.utm_term, 100),
        content: campo(body.utm_content, 100),
      },
      lgpdAceite: Boolean(body.lgpdAceite),
      lgpdData: body.lgpdAceite ? new Date().toISOString() : "",
      // camposExtras: limitar chaves e valores
      camposExtras: Object.fromEntries(
        Object.entries(body.camposExtras ?? {})
          .slice(0, 20)
          .map(([k, v]) => [campo(k, 50), campo(v, 500)])
      ),
    };

    const leads = lerDados<Lead[]>("leads.json", []);
    leads.unshift(lead);
    salvarDados("leads.json", leads);

    // Atualizar contador — calculado a partir dos dados reais (últimos 30 dias)
    if (formulario) {
      const idx = formularios.findIndex((f) => f.id === formularioId);
      const trintaDiasAtras = Date.now() - 30 * 24 * 60 * 60 * 1000;
      formularios[idx].envios30d = leads.filter(
        (l) => l.formularioId === formularioId && new Date(l.data).getTime() > trintaDiasAtras
      ).length;
      salvarDados("formularios.json", formularios);
    }

    return jsonCors({
      ok: true,
      mensagem: formulario?.msgSucesso ?? "Mensagem enviada com sucesso!",
    });
  } catch (err) {
    console.error("[api/submissao]", err);
    return jsonCors({ ok: false, erro: "Erro interno" }, 500);
  }
}

// ─── OPTIONS — preflight CORS ─────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
