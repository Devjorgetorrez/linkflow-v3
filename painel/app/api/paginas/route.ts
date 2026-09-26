/**
 * app/api/paginas/route.ts
 * GET /api/paginas → lista páginas do site lendo _astro/dist/ do Astro
 *
 * Campos estruturais (composicao, secoes, paiId, linksRecebidos) usam
 * defaults seguros — esses dados não existem no HTML gerado, só no projeto.md.
 * nivel = cliques reais a partir da home (grafo de links do HTML); sem grafo ou
 * página inalcançável, cai no nível planejado da árvore de silos.
 * linksRecebidos é calculado a partir dos links reais do HTML (lib/links-internos.ts).
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getContentDir, getLinkflowDir, getRotaPilar } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { lerGrafoLinks, contarRecebidos, profundidadeDeCliques } from "@/lib/links-internos";
import { normalizarUrl } from "@/lib/urls-publicas";
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

function classificar(url: string, servicos: Set<string>, slugPilar: string): {
  tipo: TipoPagina;
  paiId: string | null;
  nivel: number;
} {
  if (url === "/") return { tipo: "home", paiId: null, nivel: 0 };
  const slug = url.replace(/^\//, "").replace(/\/+$/, "");
  // O pilar é /servicos na maioria dos layouts e /planos no tema-07; a coleção
  // de conteúdo é sempre `servicos`. Cada item da coleção é filho do pilar.
  if (slug === slugPilar) return { tipo: "pilar", paiId: "home", nivel: 1 };
  if (servicos.has(slug)) return { tipo: "money", paiId: slugPilar, nivel: 2 };
  if (INSTITUCIONAIS.has(slug)) return { tipo: "institucional", paiId: "home", nivel: 1 };
  return { tipo: "supporting", paiId: "home", nivel: 1 };
}

// Inferir Intencao a partir do tipo
function inferirIntencao(tipo: TipoPagina, url: string): Intencao {
  if (tipo === "money") return "T";         // Transacional (serviço + cidade = busca de contratação)
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
  const auth = await exigirPapel(req, MATRIZ["paginas:GET"]);
  if (auth) return auth;

  try {
    // dist/ inteiro é o site (pós-promoção) — nunca dist/<slug>/
    const distDir = path.join(getLinkflowDir(), "_astro/dist");
    const servicos = slugsDaColecao("servicos");
    const slugPilar = getRotaPilar().slice(1);
    const posts = slugsDaColecao("posts");
    // Artigos saem daqui: são listados por /api/posts. Sem este filtro, com
    // URL plana, cada artigo apareceria duas vezes (como página e como post).
    const rawTodas = varrerDist(distDir, "");
    const rawPaginas = rawTodas.filter(
      (p) => !posts.has(p.url.replace(/^\//, "").toLowerCase()),
    );

    // linksRecebidos vem do grafo REAL de links do HTML gerado (mesma fonte
    // da auditoria de SEO — lib/links-internos.ts). Link de artigo para
    // serviço conta; link da própria página para ela mesma não.
    const grafo = lerGrafoLinks(distDir);
    const linksRecebidosMap = grafo ? contarRecebidos(grafo.links) : new Map<string, number>();

    const cliques = grafo ? profundidadeDeCliques(grafo.links) : new Map<string, number>();

    const paginas: Pagina[] = rawPaginas.map((p) => {
      const { tipo, paiId, nivel: nivelPlanejado } = classificar(p.url, servicos, slugPilar);
      const nivel = cliques.get(normalizarUrl(p.url)) ?? nivelPlanejado;
      return {
        // id = slug da URL ("/" -> "home"). paiId aponta para esse mesmo id:
        // serviço interno -> slug do pilar ("servicos" ou "planos"), o resto -> "home".
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
        linksRecebidos: linksRecebidosMap.get(normalizarUrl(p.url)) ?? 0,
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
