/**
 * app/api/config/paginas/route.ts — título/meta description de home, sobre
 * e contato: `site.paginas.<pagina>.{titulo,metaDescription}` no config/site.ts.
 *
 * Esse bloco NÃO existia no config/site.ts (as páginas fixas tinham
 * título/meta fixos no .astro de cada tema — ver _astro/src/pages/{index,
 * sobre,contato}.astro). Esta rota cria `site.paginas` como bloco NOVO e
 * opcional (lib/site-config.ts já suporta objeto aninhado ausente —
 * definirValorNoCaminho cria `{}` em cada nível que faltar). O motor Astro
 * ainda NÃO lê este bloco: ver a observação no relatório da Fase 6 — é o
 * próximo passo, fora do escopo desta tela.
 *
 * GET   /api/config/paginas          → { home: {titulo, metaDescription}, sobre: {...}, contato: {...} }
 * PATCH /api/config/paginas  { pagina: "home"|"sobre"|"contato", titulo?, metaDescription? }
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getConfigPath } from "@/lib/fs";
import { gravarAtomico } from "@/lib/posts-fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { definirValorNoCaminho, lerValorNoCaminho } from "@/lib/site-config";

const PAGINAS = ["home", "sobre", "contato"] as const;
type PaginaFixa = (typeof PAGINAS)[number];

const TITULO_MAX = 70;
const META_MAX = 165;

function txt(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["config/paginas:GET"]);
  if (auth) return auth;
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    const out: Record<PaginaFixa, { titulo: string; metaDescription: string }> = {} as never;
    for (const p of PAGINAS) {
      out[p] = {
        titulo: txt(lerValorNoCaminho(raw, ["paginas", p, "titulo"])),
        metaDescription: txt(lerValorNoCaminho(raw, ["paginas", p, "metaDescription"])),
      };
    }
    return NextResponse.json({ ok: true, paginas: out });
  } catch (err) {
    console.error("[api/config/paginas GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["config/paginas:PATCH"]);
  if (auth) return auth;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const pagina = body.pagina;
    if (typeof pagina !== "string" || !PAGINAS.includes(pagina as PaginaFixa)) {
      return NextResponse.json({ ok: false, erro: "Página inválida: use home, sobre ou contato." }, { status: 400 });
    }
    if (body.titulo !== undefined && typeof body.titulo !== "string") {
      return NextResponse.json({ ok: false, erro: "Título: precisa ser um texto." }, { status: 400 });
    }
    if (body.metaDescription !== undefined && typeof body.metaDescription !== "string") {
      return NextResponse.json({ ok: false, erro: "Meta description: precisa ser um texto." }, { status: 400 });
    }
    if (typeof body.titulo === "string" && body.titulo.trim().length > TITULO_MAX) {
      return NextResponse.json({ ok: false, erro: `Título: passa de ${TITULO_MAX} caracteres.` }, { status: 400 });
    }
    if (typeof body.metaDescription === "string" && body.metaDescription.trim().length > META_MAX) {
      return NextResponse.json({ ok: false, erro: `Meta description: passa de ${META_MAX} caracteres.` }, { status: 400 });
    }

    const configPath = getConfigPath();
    let s = fs.readFileSync(configPath, "utf-8");
    let mudou = false;
    if (body.titulo !== undefined) {
      const r = definirValorNoCaminho(s, ["paginas", pagina, "titulo"], (body.titulo as string).trim());
      s = r.s;
      mudou = mudou || r.mudou;
    }
    if (body.metaDescription !== undefined) {
      const r = definirValorNoCaminho(s, ["paginas", pagina, "metaDescription"], (body.metaDescription as string).trim());
      s = r.s;
      mudou = mudou || r.mudou;
    }
    if (mudou) gravarAtomico(configPath, s);

    return NextResponse.json({
      ok: true,
      pagina,
      titulo: txt(lerValorNoCaminho(s, ["paginas", pagina, "titulo"])),
      metaDescription: txt(lerValorNoCaminho(s, ["paginas", pagina, "metaDescription"])),
    });
  } catch (err) {
    console.error("[api/config/paginas PATCH]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
