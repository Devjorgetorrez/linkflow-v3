/**
 * app/api/paginas/route.ts
 * GET /api/paginas → páginas do site, com o que o HTML PUBLICADO realmente diz.
 *
 * ORIGEM DO HTML (lib/site-lido.ts): o site publicado (LINKFLOW_SITE_DIR ||
 * /var/www/<slug>, a pasta que o build copia); só se ela não existir cai na
 * última prévia local (_astro/dist). A resposta diz qual foi usada:
 * `origem` ("publicado" | "previa" | "nenhuma") e `origemRotulo`
 * ("site publicado" / "última prévia local (dist)"). Cache por mtime+tamanho
 * por arquivo; HTML gigante é lido só até o limite (`real.parcial`) e arquivo
 * ilegível vira `real.erroLeitura`, sem derrubar as outras páginas.
 *
 * Por página (lib/html-pagina.ts): title completo, meta description, meta
 * robots (robots/googlebot), canonical, H1, JSON-LD real (todos os blocos,
 * tipos achatados, e o conteúdo bruto de cada bloco em
 * `real.jsonldBlocosDetalhe` — o que o site realmente emite, não o
 * "previsto"), Open Graph, palavras do texto visível, imagens sem alt,
 * links recebidos/enviados (grafo real de links) e nível = cliques a partir da
 * home. NADA é inferido: intenção de busca, composição, seções e "schema
 * previsto" não existem no HTML e por isso NÃO são devolvidos (a UI mostra "—"
 * ou omite). `tipo`/`paiId` vêm da coleção de conteúdo de onde o slug saiu
 * (servicos → money), fato estrutural e não palpite.
 * Somente leitura.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getContentDir, getRotaPilar, lerArquivo, parseMd } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { lerGrafoLinks, contarRecebidos, profundidadeDeCliques } from "@/lib/links-internos";
import { lerPaginaCache, listarPaginas, lerSitemap, resolverOrigemSite } from "@/lib/site-lido";
import { normalizarUrl } from "@/lib/urls-publicas";
import type { Pagina, TipoPagina } from "@/mock/types";

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

/** noindex declarado no frontmatter do arquivo de conteúdo (Money Page = rascunho até a Fase 3). */
function noindexDoConteudo(colecao: string, slug: string): boolean | null {
  const raw = lerArquivo(path.join(getContentDir(), colecao, `${slug}.md`));
  if (raw === null) return null;
  try {
    const v = parseMd(raw).frontmatter.noindex;
    return v === true || v === "true";
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["paginas:GET"]);
  if (auth) return auth;

  try {
    const o = resolverOrigemSite();
    if (!o.dir || o.origem === "nenhuma") {
      return NextResponse.json({
        ok: true, paginas: [], origem: "nenhuma", origemRotulo: o.rotulo, sitemapUrls: null,
      });
    }
    const origem: "publicado" | "previa" = o.origem;
    const servicos = slugsDaColecao("servicos");
    const slugPilar = getRotaPilar().slice(1);
    const posts = slugsDaColecao("posts");

    const arquivos = listarPaginas(o.dir)
      // Artigos saem daqui: são listados por /api/posts. Sem este filtro, com
      // URL plana, cada artigo apareceria duas vezes (como página e como post).
      .filter((p) => !posts.has(p.url.replace(/^\//, "").toLowerCase()))
      // Autor sai daqui pelo mesmo motivo — gerarIndexaveis() já tem um laço
      // próprio pra autor (tipo "autor", via /api/autores). Sem este filtro,
      // a página /autor/<slug> aparecia duas vezes: aqui como "supporting" e
      // lá como "autor" — a tela somava 1 URL extra no sitemap (achado real,
      // Verificação 3009 V2, item 79 — reaparece porque esse autor passou a
      // ter página de verdade só depois do fix anterior desta mesma rodada).
      .filter((p) => !/^\/autor\//.test(p.url));

    // linksRecebidos/nível vêm do grafo REAL de links do HTML (mesma fonte da
    // auditoria de SEO — lib/links-internos.ts).
    const grafo = lerGrafoLinks(o.dir);
    const linksRecebidosMap = grafo ? contarRecebidos(grafo.links) : new Map<string, number>();
    const cliques = grafo ? profundidadeDeCliques(grafo.links) : new Map<string, number>();

    let maisRecente = 0;
    const paginas: Pagina[] = arquivos.map((p) => {
      const lida = lerPaginaCache(p.arquivo);
      const d = lida.dados;
      const { tipo, paiId, nivel: nivelPlanejado } = classificar(p.url, servicos, slugPilar);
      const nivel = cliques.get(normalizarUrl(p.url)) ?? nivelPlanejado;
      const slug = p.url.replace(/^\//, "");
      const mt = lida.mtime ? Date.parse(lida.mtime) : 0;
      if (mt > maisRecente) maisRecente = mt;
      const enviados = Object.values(grafo?.links[normalizarUrl(p.url)] ?? {}).reduce((a, n) => a + n, 0);
      return {
        // id = slug da URL ("/" -> "home"). paiId aponta para esse mesmo id:
        // serviço interno -> slug do pilar ("servicos" ou "planos"), o resto -> "home".
        id: p.url === "/" ? "home" : slug.replace(/\//g, "--"),
        titulo: d?.h1 || d?.title || p.url,
        url: p.url,
        paiId,
        tipo,
        status: "publicado" as const,
        h1: d?.h1 ?? "",
        seoTitle: d?.title ?? "",
        metaDescription: d?.metaDescription ?? "",
        schema: "", // o JSON-LD real está em real.schemaTipos
        composicao: "", // não existe no HTML: a UI não exibe
        secoes: [],
        nivel,
        linksRecebidos: linksRecebidosMap.get(normalizarUrl(p.url)) ?? 0,
        ultimaMod: lida.mtime ? lida.mtime.split("T")[0] : undefined,
        real: {
          origem,
          robotsMeta: d?.robotsMeta ?? [],
          noindex: d?.noindex ?? false,
          nofollow: d?.nofollow ?? false,
          canonical: d?.canonical ?? null,
          schemaTipos: d?.jsonld.tipos ?? [],
          jsonldBlocos: d?.jsonld.blocos ?? 0,
          jsonldInvalidos: d?.jsonld.invalidos ?? 0,
          jsonldBlocosDetalhe: d?.jsonldBlocos ?? [],
          og: d?.og ?? { title: null, description: null, image: null, type: null },
          palavras: d?.palavras ?? 0,
          imagens: d?.imagens ?? { total: 0, semAlt: 0 },
          linksEnviados: enviados,
          rastreadores: d?.rastreadores ?? [],
          noindexNoConteudo: tipo === "money" ? noindexDoConteudo("servicos", slug) : null,
          ...(lida.parcial ? { parcial: true } : {}),
          ...(lida.erro ? { erroLeitura: lida.erro } : {}),
        },
      };
    });

    // Ordenar: home primeiro, depois por URL
    paginas.sort((a, b) => {
      if (a.url === "/") return -1;
      if (b.url === "/") return 1;
      return a.url.localeCompare(b.url);
    });

    return NextResponse.json({
      ok: true,
      paginas,
      origem,
      origemRotulo: o.rotulo,
      geradoEm: maisRecente ? new Date(maisRecente).toISOString() : null,
      sitemapUrls: lerSitemap(o.dir),
    });
  } catch (err) {
    console.error("[api/paginas GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
