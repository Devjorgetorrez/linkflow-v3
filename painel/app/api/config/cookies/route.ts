/**
 * app/api/config/cookies/route.ts — bloco `site.cookieBanner` do config/site.ts:
 * título, descrição, introdução do modal de preferências, posição e se o
 * consentimento é registrado no servidor (POST público em /api/consentimentos).
 *
 * Todos os campos são opcionais — ausência = o motor usa os padrões atuais do
 * banner (ver _astro/src/components/blocos/BannerCookies.astro e
 * _astro/src/lib/consentimento.ts), sem regressão para sites que nunca
 * mexeram nesta tela. Mesmo padrão de app/api/config/paginas/route.ts:
 * lerValorNoCaminho/definirValorNoCaminho (lib/site-config.ts) editam só o
 * bloco `cookieBanner`, o resto do site.ts fica byte a byte igual.
 *
 * GET   /api/config/cookies → { cookieBanner: { titulo?, descricao?, modalDescricao?,
 *                                                 posicaoH?, posicaoV?, registroConsentimento? } }
 *   Só devolve o que está salvo (campo ausente = nunca configurado). A TELA aplica
 *   o padrão visualmente — evita duplicar aqui os textos-padrão que já vivem no motor.
 * PATCH /api/config/cookies { titulo?, descricao?, modalDescricao?, posicaoH?, posicaoV?, registroConsentimento? }
 *   Grava só os campos enviados.
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getConfigPath } from "@/lib/fs";
import { gravarAtomico } from "@/lib/posts-fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { definirValorNoCaminho, lerValorNoCaminho } from "@/lib/site-config";

const TITULO_MAX = 80;
const DESCRICAO_MAX = 300;
const MODAL_DESCRICAO_MAX = 300;
const POSICOES_H = ["left", "center", "right"] as const;
const POSICOES_V = ["top", "middle", "bottom"] as const;

type PosicaoH = (typeof POSICOES_H)[number];
type PosicaoV = (typeof POSICOES_V)[number];

const CAMPOS_TEXTO = ["titulo", "descricao", "modalDescricao"] as const;

function txtOuUndefined(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["config/cookies:GET"]);
  if (auth) return auth;
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    const cookieBanner: Record<string, unknown> = {};
    for (const c of CAMPOS_TEXTO) {
      const v = txtOuUndefined(lerValorNoCaminho(raw, ["cookieBanner", c]));
      if (v !== undefined) cookieBanner[c] = v;
    }
    const posH = lerValorNoCaminho(raw, ["cookieBanner", "posicaoH"]);
    if (typeof posH === "string" && (POSICOES_H as readonly string[]).includes(posH)) cookieBanner.posicaoH = posH;
    const posV = lerValorNoCaminho(raw, ["cookieBanner", "posicaoV"]);
    if (typeof posV === "string" && (POSICOES_V as readonly string[]).includes(posV)) cookieBanner.posicaoV = posV;
    const reg = lerValorNoCaminho(raw, ["cookieBanner", "registroConsentimento"]);
    if (typeof reg === "boolean") cookieBanner.registroConsentimento = reg;

    return NextResponse.json({ ok: true, cookieBanner });
  } catch (err) {
    console.error("[api/config/cookies GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["config/cookies:PATCH"]);
  if (auth) return auth;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const erros: Record<string, string> = {};

    for (const c of CAMPOS_TEXTO) {
      if (body[c] !== undefined && typeof body[c] !== "string") erros[c] = "Precisa ser um texto.";
    }
    if (typeof body.titulo === "string" && body.titulo.trim().length > TITULO_MAX) {
      erros.titulo = `Título: passa de ${TITULO_MAX} caracteres.`;
    }
    if (typeof body.descricao === "string" && body.descricao.trim().length > DESCRICAO_MAX) {
      erros.descricao = `Descrição: passa de ${DESCRICAO_MAX} caracteres.`;
    }
    if (typeof body.modalDescricao === "string" && body.modalDescricao.trim().length > MODAL_DESCRICAO_MAX) {
      erros.modalDescricao = `Introdução do modal: passa de ${MODAL_DESCRICAO_MAX} caracteres.`;
    }
    if (body.posicaoH !== undefined && !(POSICOES_H as readonly unknown[]).includes(body.posicaoH)) {
      erros.posicaoH = "Posição horizontal inválida — use left, center ou right.";
    }
    if (body.posicaoV !== undefined && !(POSICOES_V as readonly unknown[]).includes(body.posicaoV)) {
      erros.posicaoV = "Posição vertical inválida — use top, middle ou bottom.";
    }
    if (body.registroConsentimento !== undefined && typeof body.registroConsentimento !== "boolean") {
      erros.registroConsentimento = "Precisa ser verdadeiro ou falso.";
    }
    if (Object.keys(erros).length) {
      return NextResponse.json({ ok: false, erro: "Há campos inválidos — nada foi salvo.", erros }, { status: 400 });
    }

    const configPath = getConfigPath();
    let s = fs.readFileSync(configPath, "utf-8");
    let mudou = false;

    for (const c of CAMPOS_TEXTO) {
      if (body[c] === undefined) continue;
      const r = definirValorNoCaminho(s, ["cookieBanner", c], (body[c] as string).trim());
      s = r.s;
      mudou = mudou || r.mudou;
    }
    if (body.posicaoH !== undefined) {
      const r = definirValorNoCaminho(s, ["cookieBanner", "posicaoH"], body.posicaoH as PosicaoH);
      s = r.s;
      mudou = mudou || r.mudou;
    }
    if (body.posicaoV !== undefined) {
      const r = definirValorNoCaminho(s, ["cookieBanner", "posicaoV"], body.posicaoV as PosicaoV);
      s = r.s;
      mudou = mudou || r.mudou;
    }
    if (body.registroConsentimento !== undefined) {
      const r = definirValorNoCaminho(s, ["cookieBanner", "registroConsentimento"], body.registroConsentimento as boolean);
      s = r.s;
      mudou = mudou || r.mudou;
    }
    if (mudou) gravarAtomico(configPath, s);

    const cookieBanner: Record<string, unknown> = {};
    for (const c of CAMPOS_TEXTO) {
      const v = txtOuUndefined(lerValorNoCaminho(s, ["cookieBanner", c]));
      if (v !== undefined) cookieBanner[c] = v;
    }
    const posH = lerValorNoCaminho(s, ["cookieBanner", "posicaoH"]);
    if (typeof posH === "string") cookieBanner.posicaoH = posH;
    const posV = lerValorNoCaminho(s, ["cookieBanner", "posicaoV"]);
    if (typeof posV === "string") cookieBanner.posicaoV = posV;
    const reg = lerValorNoCaminho(s, ["cookieBanner", "registroConsentimento"]);
    if (typeof reg === "boolean") cookieBanner.registroConsentimento = reg;

    return NextResponse.json({ ok: true, cookieBanner });
  } catch (err) {
    console.error("[api/config/cookies PATCH]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
