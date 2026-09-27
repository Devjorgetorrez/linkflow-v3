/**
 * app/api/aparencia/cores/route.ts
 * GET /api/aparencia/cores → cores REAIS do layout ativo deste cliente.
 *
 * Fonte única: _astro/src/styles/tokens.css do próprio cliente (LINKFLOW_DIR).
 * Esse arquivo define, para cada tema, o bloco `html[data-tema="tema-0X"] { --color-*: ... }`
 * que o layout ativo usa de fato (ver Tema0XBase.astro: `<html data-tema="tema-0X">`).
 * O tema "base" (sem promoção, ou tema-01) não tem bloco com escopo — usa os
 * valores padrão do bloco `@theme { ... }` no topo do arquivo.
 *
 * Não inventa cor: se o arquivo ou o bloco do tema ativo não existir, devolve
 * ok:false — a tela mostra que não conseguiu ler, nunca uma paleta genérica.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getLinkflowDir, getTemaAtivo } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

// Mesma ordem/chaves de painel/lib/store.tsx (CHAVES_TOKENS) — mantidas em
// duplicidade proposital: esta rota roda no servidor e não deve importar de
// um módulo "use client".
const CHAVES_TOKENS = [
  "primary",
  "primary-ink",
  "secondary",
  "accent",
  "ink",
  "ink-muted",
  "surface",
  "surface-2",
  "line",
  "success",
  "danger",
] as const;

type ChaveToken = (typeof CHAVES_TOKENS)[number];

function getTokensCssPath(): string {
  return path.join(getLinkflowDir(), "_astro", "src", "styles", "tokens.css");
}

/** Extrai o conteúdo entre `{` e `}` do primeiro bloco cujo cabeçalho bate com `seletorRegex`. */
function extrairBloco(css: string, seletorRegex: RegExp): string | null {
  const m = css.match(seletorRegex);
  if (!m) return null;
  const inicioChave = css.indexOf("{", m.index! + m[0].length - 1);
  if (inicioChave === -1) return null;
  const fimChave = css.indexOf("}", inicioChave);
  if (fimChave === -1) return null;
  return css.slice(inicioChave + 1, fimChave);
}

/** Lê `--color-<chave>: <valor>;` dentro de um bloco de CSS. */
function lerCoresDoBloco(bloco: string): Partial<Record<ChaveToken, string>> {
  const tokens: Partial<Record<ChaveToken, string>> = {};
  for (const chave of CHAVES_TOKENS) {
    const m = bloco.match(new RegExp(`--color-${chave}\\s*:\\s*([^;]+);`));
    if (m) tokens[chave] = m[1].trim();
  }
  return tokens;
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["aparencia/cores:GET"]);
  if (auth) return auth;

  const tema = getTemaAtivo(); // "base" | "tema-03".."tema-07" | null

  const cssPath = getTokensCssPath();
  let css: string;
  try {
    css = fs.readFileSync(cssPath, "utf-8");
  } catch {
    return NextResponse.json(
      { ok: false, erro: "Não consegui ler o arquivo de cores do site (tokens.css)." },
      { status: 500 },
    );
  }

  const temaEfetivo = tema && tema !== "base" ? tema : "base";
  const bloco =
    temaEfetivo === "base"
      ? extrairBloco(css, /@theme\s*\{/)
      : extrairBloco(css, new RegExp(`html\\[data-tema=["']${temaEfetivo}["']\\]\\s*\\{`));

  if (!bloco) {
    return NextResponse.json(
      {
        ok: false,
        erro:
          temaEfetivo === "base"
            ? "Não encontrei o bloco @theme padrão em tokens.css."
            : `Não encontrei o bloco de cores do tema "${temaEfetivo}" em tokens.css.`,
      },
      { status: 500 },
    );
  }

  const tokens = lerCoresDoBloco(bloco);
  const faltando = CHAVES_TOKENS.filter((c) => !tokens[c]);
  if (faltando.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        erro: `tokens.css não define: ${faltando.map((c) => `--color-${c}`).join(", ")}`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    tema: temaEfetivo,
    temaMarcado: tema, // valor cru de getTemaAtivo(), sem normalizar "null" → "base"
    tokens,
  });
}
