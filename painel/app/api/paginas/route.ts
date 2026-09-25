/**
 * app/api/paginas/route.ts
 * GET /api/paginas → lista páginas do site lendo _astro/dist/ do Astro
 *
 * Campos estruturais (composicao, secoes, paiId, linksRecebidos) usam
 * defaults seguros — esses dados não existem no HTML gerado, só no projeto.md.
 * nivel é derivado da profundidade da URL.
 * linksRecebidos é calculado cruzando links internos entre todas as páginas.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getContentDir, getLinkflowDir } from "@/lib/fs";
import { verificarAcesso } from "@/lib/auth";
import type { Pagina, TipoPagina, Intencao } from "@/mock/types";

// ─── Classificação pelo CONTEÚDO, não pela URL ──────────────────────────────
// Com URL plana (regra do Jorge), serviço interno e artigo moram ambos em
// /<slug> — a URL não diz mais o que a página é. Quem diz é a coleção de
// onde o slug veio: content/servicos/ → serviço (money, filho de /servicos);
// content/posts/ → artigo, que NÃO entra nesta lista (vem de /api/posts).

const INSTITUCIONAIS = new Set(["sobre", "contato", "politica-de-privacidade", "termos-de-uso"]);

function slugsDaColecao(colecao: string): Set<string> {
  const dir = path.join(getContentDir(), colecao);
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs.readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, "").toLowerCase()),
  );
}

function classificar(url: string, servicos: Set<string>): {
  tipo: TipoPagina;
  paiId: string | null;
  nivel: number;
} {
  if (url === "/") return { tipo: "supporting", paiId: null, nivel: 0 };
  const slug = url.replace(/^\//, "").replace(/\/+$/, "");
  if (slug === "servicos") return { tipo: "pilar", paiId: "home", nivel: 1 };
  if (servicos.has(slug)) return { tipo: "money", paiId: "servicos", nivel: 2 };
  if (INSTITUCIONAIS.has(slug)) return { tipo: "institucional", paiId: "home", nivel: 1 };
  return { tipo: "supporting", paiId: "home", nivel: 1 };
}

// Inferir Intencao a partir do tipo
function inferirIntencao(tipo: TipoPagina, url: string): Intencao {
  if (tipo === "money") return "C";         // Converter
  if (tipo === "institucional") return "N"; // Navegar
  if (url === "/blog") return "I";          // Informar
  return "T";                               // Transacional
}

interface PaginaRaw {
  url: string;
  titulo: string;
  metaDescription: string;
  h1: string;
  ultimaMod: string;
}

function varrerDist(dir: string, base: string): PaginaRaw[] {
  const paginas: PaginaRaw[] = [];
  if (!fs.existsSync(dir)) return paginas;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name === "midia") continue;

    if (entry.isDirectory()) {
      paginas.push(...varrerDist(path.join(dir, entry.name), `${base}/${entry.name}`));
    } else if (entry.name === "index.html") {
      const url = base || "/";
      const filePath = path.join(dir, entry.name);
      const raw = fs.readFileSync(filePath, "utf-8");
      const stat = fs.statSync(filePath);

      const titleMatch = raw.match(/<title>([^<]*)<\/title>/);
      const metaMatch = raw.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
      const h1Match = raw.match(/<h1[^>]*>([^<]*)<\/h1>/i);

      const titulo = (titleMatch?.[1] ?? url).replace(/\s*[|–-].*$/, "").trim();

      paginas.push({
        url,
        titulo,
        metaDescription: metaMatch?.[1] ?? "",
        h1: h1Match?.[1]?.trim() ?? titulo,
        ultimaMod: stat.mtime.toISOString().split("T")[0],
      });
    }
  }

  return paginas;
}

export async function GET(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    // dist/ inteiro é o site (pós-promoção) — nunca dist/<slug>/
    const distDir = path.join(getLinkflowDir(), "_astro/dist");
    const servicos = slugsDaColecao("servicos");
    const posts = slugsDaColecao("posts");
    // Artigos saem daqui: são listados por /api/posts. Sem este filtro, com
    // URL plana, cada artigo apareceria duas vezes (como página e como post).
    const rawTodas = varrerDist(distDir, "");
    const rawPaginas = rawTodas.filter(
      (p) => !posts.has(p.url.replace(/^\//, "").toLowerCase()),
    );

    const todasUrls = rawTodas.map((p) => p.url);

    // Calcular linksRecebidos cruzando links internos (simplificado) — varre
    // TODAS as páginas geradas, artigos inclusive: link de artigo para
    // serviço conta como link recebido pelo serviço.
    const linksRecebidosMap = new Map<string, number>();
    for (const p of rawTodas) {
      const filePath = path.join(distDir, p.url === "/" ? "" : p.url, "index.html");
      if (!fs.existsSync(filePath)) continue;
      const html = fs.readFileSync(filePath, "utf-8");
      const hrefs = [...html.matchAll(/href="([^"#?]+)"/g)].map((m) => m[1]);
      for (const href of hrefs) {
        if (href.startsWith("/") && todasUrls.includes(href)) {
          linksRecebidosMap.set(href, (linksRecebidosMap.get(href) ?? 0) + 1);
        }
      }
    }

    const paginas: Pagina[] = rawPaginas.map((p) => {
      const { tipo, paiId, nivel } = classificar(p.url, servicos);
      return {
        // id = slug da URL ("/" -> "home"). paiId aponta para esse mesmo id:
        // serviço interno -> "servicos" (a pilar), o resto -> "home".
        id: p.url === "/" ? "home" : p.url.replace(/^\//, "").replace(/\//g, "--"),
        titulo: p.titulo,
        url: p.url,
        paiId,
        tipo,
        intencao: inferirIntencao(tipo, p.url),
        status: "publicado" as const,
        h1: p.h1,
        seoTitle: p.titulo,
        metaDescription: p.metaDescription,
        schema: "",
        composicao: "",   // não disponível no HTML gerado
        secoes: [],       // não disponível no HTML gerado
        nivel,
        linksRecebidos: linksRecebidosMap.get(p.url) ?? 0,
        ultimaMod: p.ultimaMod,
      };
    });

    // Ordenar: home primeiro, depois por URL
    paginas.sort((a, b) => {
      if (a.url === "/") return -1;
      if (b.url === "/") return 1;
      return a.url.localeCompare(b.url);
    });

    return NextResponse.json({ ok: true, paginas });
  } catch (err) {
    console.error("[api/paginas GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
