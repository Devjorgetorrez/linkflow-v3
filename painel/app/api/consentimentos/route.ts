/**
 * app/api/consentimentos/route.ts
 * POST /api/consentimentos → endpoint PÚBLICO que o banner de cookies do SITE
 * chama quando `site.cookieBanner.registroConsentimento` está ligado (ver
 * _astro/src/scripts/consentimento-ui.ts).
 *
 * Mesmo padrão de segurança de /api/submissao: sem sessão, CORS restrito à
 * origem do site (origensPermitidas), corpo pequeno, limite por IP e global
 * (instância própria de criarLimiteSubmissao — não compete com o limite do
 * formulário de contato).
 *
 * Contrato (JSON): { escolha: "aceito"|"rejeitado"|"personalizado",
 *   categorias?: { analiticos, marketing, funcionais }, paginaOrigem }
 * Resposta: { ok:true } | { ok:false, erro }
 *
 * Grava em dados/consentimentos.json (lerDados/salvarDados — escrita atômica,
 * mesmo padrão de leads.json). O IP NUNCA é gravado em texto puro: só um hash
 * SHA-256 truncado a 16 caracteres — dá para detectar abuso/repetição vindo do
 * mesmo IP sem guardar o IP em si (minimização de dados, LGPD).
 *
 * GET /api/consentimentos → autenticado (sessão administrador ou x-api-key),
 * lista os registros pra tela de consulta/exportação do painel
 * (app/(painel)/privacidade/consentimentos) — Relatório de Testes 4, erro 45.
 */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { lerDados, salvarDados } from "@/lib/dados";
import { origensPermitidas } from "@/lib/formularios-dados";
import { criarLimiteSubmissao, ipDoCliente } from "@/lib/limite-submissao";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

const MAX_CORPO = 4 * 1024;
const limite = criarLimiteSubmissao();

const ESCOLHAS = ["aceito", "rejeitado", "personalizado", "informado"] as const;
type Escolha = (typeof ESCOLHAS)[number];

/**
 * Prazo de retenção dos registros de consentimento — PROVISÓRIO. O guia da
 * ANPD não fixa um número; 5 anos aqui só repete o prazo já usado como
 * padrão pra retenção de formulários (mesma ordem de grandeza de outras
 * obrigações civis/fiscais no Brasil). Confirmar com advogado antes de
 * qualquer cliente real depender disso — Relatório de Testes 4, erro 45.
 */
const RETENCAO_DIAS = 5 * 365;

interface RegistroConsentimento {
  id: string;
  data: string;
  escolha: Escolha;
  categorias?: { analiticos: boolean; marketing: boolean; funcionais: boolean };
  paginaOrigem: string;
  ipHash: string;
  /** Versão da política vigente no momento da escolha (site.legal.versaoPolitica). */
  versaoPolitica?: string;
  /** Id anônimo do navegador do visitante (localStorage) — correlaciona registros do mesmo visitante sem identificar a pessoa. */
  visitanteId?: string;
}

/** Descarta registros além do prazo de retenção. Rodada "de passagem" — sem cron, sem job separado. */
function purgarExpirados(lista: RegistroConsentimento[]): RegistroConsentimento[] {
  const limiteMs = Date.now() - RETENCAO_DIAS * 86400000;
  return lista.filter((r) => {
    const t = new Date(r.data).getTime();
    return Number.isNaN(t) || t >= limiteMs;
  });
}

function cabecalhosCors(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
  const origem = req.headers.get("origin");
  if (origem && origensPermitidas().includes(origem)) h["Access-Control-Allow-Origin"] = origem;
  return h;
}

function origemBloqueada(req: NextRequest): boolean {
  const origem = req.headers.get("origin");
  return !!origem && !origensPermitidas().includes(origem);
}

function resp(req: NextRequest, corpo: unknown, status = 200) {
  return NextResponse.json(corpo, { status, headers: cabecalhosCors(req) });
}

const campo = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Hash do IP — nunca o IP completo (minimização de dados, LGPD). */
function ipHash(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["consentimentos:GET"]);
  if (auth) return auth;

  const lista = purgarExpirados(lerDados<RegistroConsentimento[]>("consentimentos.json", []));
  return NextResponse.json({ ok: true, consentimentos: lista });
}

export async function POST(req: NextRequest) {
  try {
    if (origemBloqueada(req)) {
      return resp(req, { ok: false, erro: "Origem não autorizada." }, 403);
    }

    const bloqueio = limite.tentar(ipDoCliente(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip")));
    if (bloqueio) return resp(req, { ok: false, erro: bloqueio }, 429);

    const declarado = Number(req.headers.get("content-length") ?? 0);
    if (declarado > MAX_CORPO) return resp(req, { ok: false, erro: "Corpo grande demais." }, 413);
    const texto = await req.text();
    if (Buffer.byteLength(texto, "utf-8") > MAX_CORPO) {
      return resp(req, { ok: false, erro: "Corpo grande demais." }, 413);
    }

    let body: Record<string, unknown>;
    try {
      const j = JSON.parse(texto || "{}");
      if (!j || typeof j !== "object" || Array.isArray(j)) throw new Error("formato");
      body = j as Record<string, unknown>;
    } catch {
      return resp(req, { ok: false, erro: "Não entendi os dados enviados." }, 400);
    }

    const escolha = campo(body.escolha, 20);
    if (!(ESCOLHAS as readonly string[]).includes(escolha)) {
      return resp(req, { ok: false, erro: "Escolha inválida." }, 400);
    }

    let categorias: RegistroConsentimento["categorias"];
    if (body.categorias && typeof body.categorias === "object" && !Array.isArray(body.categorias)) {
      const c = body.categorias as Record<string, unknown>;
      categorias = {
        analiticos: c.analiticos === true,
        marketing: c.marketing === true,
        funcionais: c.funcionais === true,
      };
    }

    const ip = ipDoCliente(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip"));
    const registro: RegistroConsentimento = {
      id: `cons-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      data: new Date().toISOString(),
      escolha: escolha as Escolha,
      categorias,
      paginaOrigem: campo(body.paginaOrigem ?? req.headers.get("referer"), 300),
      ipHash: ipHash(ip),
      versaoPolitica: campo(body.versaoPolitica, 20) || undefined,
      visitanteId: campo(body.visitanteId, 60) || undefined,
    };

    const lista = purgarExpirados(lerDados<RegistroConsentimento[]>("consentimentos.json", []));
    lista.unshift(registro);
    salvarDados("consentimentos.json", lista);

    return resp(req, { ok: true });
  } catch (err) {
    console.error("[api/consentimentos]", err);
    return resp(req, { ok: false, erro: "Erro interno. Tente novamente." }, 500);
  }
}

export async function OPTIONS(req: NextRequest) {
  if (origemBloqueada(req)) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: cabecalhosCors(req) });
}
