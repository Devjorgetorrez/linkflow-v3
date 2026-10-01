/**
 * GET /api/midia/miniatura/<pasta>/<nome>?w=320 → miniatura sob demanda para a grade/lista/seletor.
 *
 * Autenticada e com o mesmo controle de caminho de /api/midia/arquivo. Só imagens raster
 * (jpg/png/webp/gif/avif); largura entre 16 e 1200. Usa `sharp` (dependência opcional que o Next
 * já traz); sem ele, ou se a conversão falhar, entrega o original com cache-control (fallback).
 * Cache em $LINKFLOW_DIR/dados/miniaturas (fora de midia/, não vai ao site); a chave inclui
 * mtime e tamanho do original, então trocar o arquivo invalida a miniatura.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { getMidiaDir } from "@/lib/midia-upload";
import { getLinkflowDir } from "@/lib/fs";

export const runtime = "nodejs";

const RASTER: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif",
};
const LARGURA_MAX = 1200;
const LARGURA_MIN = 16;

type Sharp = (entrada: string, opts?: Record<string, unknown>) => {
  rotate(): ReturnType<Sharp>;
  resize(o: Record<string, unknown>): ReturnType<Sharp>;
  webp(o: Record<string, unknown>): ReturnType<Sharp>;
  toBuffer(): Promise<Buffer>;
};

let sharpCache: Sharp | null | undefined;
async function carregarSharp(): Promise<Sharp | null> {
  if (sharpCache !== undefined) return sharpCache;
  try {
    const nome: string = "sharp"; // não literal: o build não exige o pacote
    const mod = await import(/* webpackIgnore: true */ nome);
    const fn = (mod.default ?? mod) as Sharp & { cache?: (o: boolean) => unknown };
    // Sem cache de arquivos abertos: o original pode ser trocado/apagado (no Windows o cache trava o arquivo).
    fn.cache?.(false);
    sharpCache = fn;
  } catch {
    sharpCache = null;
  }
  return sharpCache;
}

function servirOriginal(alvo: string, tipo: string) {
  return new NextResponse(new Uint8Array(fs.readFileSync(alvo)), {
    headers: {
      "Content-Type": tipo,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache",
      "X-Miniatura": "original",
    },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ caminho: string[] }> }) {
  const auth = await exigirPapel(req, MATRIZ["midia:GET"]);
  if (auth) return auth;

  const { caminho } = await ctx.params;
  const raiz = path.resolve(getMidiaDir());
  let alvo: string;
  try {
    alvo = path.resolve(raiz, ...(caminho ?? []).map((p) => decodeURIComponent(p)));
  } catch {
    return NextResponse.json({ ok: false, erro: "Caminho inválido." }, { status: 400 });
  }
  if (alvo !== raiz && !alvo.startsWith(raiz + path.sep)) {
    return NextResponse.json({ ok: false, erro: "Caminho inválido." }, { status: 400 });
  }
  const tipo = RASTER[path.extname(alvo).slice(1).toLowerCase()];
  if (!tipo) {
    return NextResponse.json({ ok: false, erro: "Só imagens JPG, PNG, WebP, GIF e AVIF têm miniatura." }, { status: 415 });
  }
  let st: fs.Stats;
  try {
    st = fs.statSync(alvo);
    if (!st.isFile()) throw new Error("não é arquivo");
  } catch {
    return NextResponse.json({ ok: false, erro: "Arquivo não encontrado." }, { status: 404 });
  }

  const pedida = Number(req.nextUrl.searchParams.get("w") ?? 320);
  const w = Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, Number.isFinite(pedida) ? Math.round(pedida) : 320));

  const sharp = await carregarSharp();
  if (!sharp) return servirOriginal(alvo, tipo);

  const rel = path.relative(raiz, alvo).split(path.sep).join("/");
  const hash = `${crypto.createHash("sha1").update(rel).digest("hex").slice(0, 16)}-`;
  const versao = `${Math.round(st.mtimeMs)}-${st.size}.webp`;
  const nome = `${hash}${w}-${versao}`;
  const dirCache = path.join(getLinkflowDir(), "dados", "miniaturas");
  const arqCache = path.join(dirCache, nome);
  const etag = `"${nome}"`;

  const cabecalhos = {
    "Content-Type": "image/webp",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-cache",
    ETag: etag,
  };
  if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: cabecalhos });

  try {
    if (fs.existsSync(arqCache)) {
      return new NextResponse(new Uint8Array(fs.readFileSync(arqCache)), { headers: cabecalhos });
    }
    const buf = await sharp(alvo).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    fs.mkdirSync(dirCache, { recursive: true });
    // Limpa miniaturas de versões antigas deste arquivo (original mudou) e grava atomicamente.
    for (const f of fs.readdirSync(dirCache)) {
      if (f.startsWith(hash) && f.endsWith(".webp") && !f.endsWith(`-${versao}`)) { try { fs.unlinkSync(path.join(dirCache, f)); } catch { /* */ } }
    }
    const tmp = `${arqCache}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, arqCache);
    return new NextResponse(new Uint8Array(buf), { headers: cabecalhos });
  } catch (err) {
    console.error("[api/midia/miniatura]", (err as Error).message);
    return servirOriginal(alvo, tipo);
  }
}
