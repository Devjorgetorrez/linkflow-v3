/**
 * app/api/config/paginas/route.ts — título/meta description de home, sobre,
 * contato e da página-guia (pilar próprio de alguns temas): `site.paginas.
 * <pagina>.{titulo,metaDescription}` no config/site.ts.
 *
 * Esse bloco NÃO existia no config/site.ts (as páginas fixas tinham
 * título/meta fixos no .astro de cada tema — ver _astro/src/pages/{index,
 * sobre,contato}.astro). Esta rota cria `site.paginas` como bloco NOVO e
 * opcional (lib/site-config.ts já suporta objeto aninhado ausente —
 * definirValorNoCaminho cria `{}` em cada nível que faltar). O motor Astro
 * já lê este bloco (_astro/src/lib/paginaFixa.ts, usado nas páginas de cada
 * tema) — campo vazio cai no texto fixo que a página já tinha.
 *
 * "guia": 4 dos 6 temas (03, 04, 05, 07) têm uma página pilar própria, extra,
 * do nicho da demonstração (ex.: tema-04 → /higienizacao-de-estofados). Não é
 * post nem serviço — é a única página desse tipo por site, então usa uma
 * chave genérica. `GUIA_POR_TEMA` mapeia o tema ativo pro slug real; nos
 * temas sem essa página (base, 06) `guiaSlug` sai null e a tela some.
 *
 * GET   /api/config/paginas          → { home, sobre, contato, guia: {...} | null, guiaSlug }
 * PATCH /api/config/paginas  { pagina: "home"|"sobre"|"contato"|"guia", titulo?, metaDescription? }
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getConfigPath, getTemaAtivo } from "@/lib/fs";
import { gravarAtomico } from "@/lib/posts-fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { definirValorNoCaminho, lerValorNoCaminho } from "@/lib/site-config";

const PAGINAS = ["home", "sobre", "contato", "guia"] as const;
type PaginaFixa = (typeof PAGINAS)[number];

/** slug real da página-guia por tema (ver _astro/src/pages/<tema>/<slug>.astro). */
const GUIA_POR_TEMA: Record<string, string> = {
  "tema-03": "contabilidade-consultiva",
  "tema-04": "higienizacao-de-estofados",
  "tema-05": "direito-previdenciario",
  "tema-07": "como-escolher-plano-de-saude",
};

function guiaSlugAtivo(): string | null {
  const tema = getTemaAtivo();
  return tema ? (GUIA_POR_TEMA[tema] ?? null) : null;
}

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
    const guiaSlug = guiaSlugAtivo();
    const out: Record<PaginaFixa, { titulo: string; metaDescription: string }> = {} as never;
    for (const p of PAGINAS) {
      if (p === "guia" && !guiaSlug) continue; // tema sem página-guia: nem devolve o campo
      out[p] = {
        titulo: txt(lerValorNoCaminho(raw, ["paginas", p, "titulo"])),
        metaDescription: txt(lerValorNoCaminho(raw, ["paginas", p, "metaDescription"])),
      };
    }
    return NextResponse.json({ ok: true, paginas: out, guiaSlug });
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
      return NextResponse.json({ ok: false, erro: "Página inválida: use home, sobre, contato ou guia." }, { status: 400 });
    }
    if (pagina === "guia" && !guiaSlugAtivo()) {
      return NextResponse.json({ ok: false, erro: "Este layout não tem página-guia." }, { status: 400 });
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
