import type { Redirect } from "@/mock/types";
import type { Indexavel } from "./indexaveis";

export type Severidade = "bloqueia" | "prejudica" | "verificar";
export type Procedencia = "calculado_no_build" | "requer_search_console";

export interface Problema {
  id: string;
  tipo: string;
  severidade: Severidade;
  titulo: string;
  detalhe: string;
  node_ids: string[];
  href_conserto: string;
  label_conserto?: string; // default "Ver" quando ausente
  procedencia: Procedencia;
  badge_tipo?: string; // "money" | "pilar" | "blog" | "categoria" | "autor" | "supporting" | "institucional"
}

// Páginas raiz que nunca são consideradas órfãs
const URLS_RAIZ = new Set(["/", "/blog", "/servicos", "/sobre", "/contato"]);

function hrefParaNo(ix: Indexavel): string {
  if (ix.tipo === "post") return `/posts/${ix.node_id.replace("post-", "")}`;
  if (ix.tipo === "categoria") return "/categorias";
  if (ix.tipo === "autor") return "/autores";
  return "/paginas";
}

function badgeTipoDoNo(ix: Indexavel): string | undefined {
  if (ix.tipo === "post") return "blog";
  if (ix.tipo === "pagina") return ix.tipo_pagina;
  if (ix.tipo === "categoria") return "categoria";
  if (ix.tipo === "autor") return "autor";
  return undefined;
}

// Parse simples do robots.txt: extrai caminhos Disallowed para User-agent: *
function parsearRobotsBloqueados(robots: string): string[] {
  const bloqueados: string[] = [];
  let dentroEstrela = false;
  for (const linha of robots.split("\n")) {
    const l = linha.trim();
    if (l.toLowerCase().startsWith("user-agent:")) {
      dentroEstrela = l.endsWith("*");
    }
    if (dentroEstrela && l.toLowerCase().startsWith("disallow:")) {
      const path = l.slice("disallow:".length).trim();
      if (path && path !== "/") bloqueados.push(path);
    }
  }
  return bloqueados;
}

function robotsBloqueado(url: string, bloqueados: string[]): boolean {
  for (const b of bloqueados) {
    if (b.endsWith("*")) {
      if (url.startsWith(b.slice(0, -1))) return true;
    } else if (!b.includes("*")) {
      if (url === b || url.startsWith(b.endsWith("/") ? b : `${b}/`)) return true;
    }
  }
  return false;
}

function prioTipo(badge?: string): number {
  if (badge === "money") return 0;
  if (badge === "pilar") return 1;
  if (badge === "blog") return 2;
  return 3;
}

export function auditarTecnica(
  indexaveis: Indexavel[],
  redirects: Redirect[],
  robots: string,
  /**
   * true só quando `indexaveis` foi montado com o grafo REAL de links do HTML
   * (lib/links-internos.ts). Sem ele, "ninguém linka para cá" é só a ausência
   * de dado, não um achado — então a regra de órfã não roda.
   */
  linksReaisDisponiveis = false,
): Problema[] {
  const problemas: Problema[] = [];
  const mapa = new Map(indexaveis.map((ix) => [ix.node_id, ix]));

  // ── 1. Link saindo → nó com status != publicado ──────────────────────
  for (const ix of indexaveis) {
    for (const alvoid of ix.links_saindo) {
      const no = mapa.get(alvoid);
      if (no && no.status !== "publicado") {
        problemas.push({
          id: `link-rascunho-${ix.node_id}-${alvoid}`,
          tipo: "link_para_rascunho",
          severidade: "prejudica",
          titulo: "Link interno aponta para conteúdo não publicado",
          detalhe: `"${ix.title}" aponta para "${no.title}" (${no.status}). Crawlers retornam soft 404.`,
          node_ids: [ix.node_id, alvoid],
          href_conserto: hrefParaNo(ix),
          procedencia: "calculado_no_build",
          badge_tipo: badgeTipoDoNo(ix),
        });
      }
    }
  }

  // ── 2. Link saindo → node_id inexistente ─────────────────────────────
  for (const ix of indexaveis) {
    for (const alvoid of ix.links_saindo) {
      if (!mapa.has(alvoid)) {
        problemas.push({
          id: `link-quebrado-${ix.node_id}-${alvoid}`,
          tipo: "link_quebrado",
          severidade: "prejudica",
          titulo: "Link interno quebrado",
          detalhe: `"${ix.title}" aponta para o nó "${alvoid}" que não existe no site.`,
          node_ids: [ix.node_id],
          href_conserto: hrefParaNo(ix),
          procedencia: "calculado_no_build",
          badge_tipo: badgeTipoDoNo(ix),
        });
      }
    }
  }

  // ── 3a. Link obrigatório não aplicado ────────────────────────────────
  // Primeiro: coleta todos os alvos que alguém deveria linkar
  const todosObrigatorios = new Set<string>();
  for (const ix of indexaveis) {
    for (const alvoId of ix.links_internos_obrigatorios) {
      todosObrigatorios.add(alvoId);
    }
  }

  for (const ix of indexaveis) {
    for (const alvoId of ix.links_internos_obrigatorios) {
      if (ix.links_saindo.includes(alvoId)) continue; // link já existe no corpo
      const alvo = mapa.get(alvoId);
      const alvoTitle = alvo ? `"${alvo.title}"` : `nó ${alvoId}`;
      const alvoUrl = alvo?.url ?? alvoId;
      problemas.push({
        id: `link-obr-${ix.node_id}-${alvoId}`,
        tipo: "link_obrigatorio_nao_aplicado",
        severidade: "prejudica",
        titulo: "Link obrigatório não aplicado",
        detalhe: `"${ix.title}" (${ix.url}) deve linkar para ${alvoTitle} (${alvoUrl}), mas o link não está no corpo.`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        label_conserto: "Abrir o editor",
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 3b. Conteúdo órfão ────────────────────────────────────────────────
  // Dividido em dois: "sem destino previsto" (lacuna de arquitetura) vs
  // o caso com link obrigatório já reportado em 3a.
  // Só roda com o grafo real de links: com o plano apenas (pai/filho,
  // categoria, autor), menu/rodapé/home não contam e toda página sem pai
  // marcado sairia como órfã (falso alarme, relatório de testes #28).
  if (!linksReaisDisponiveis) {
    problemas.push({
      id: "orfaos-nao-verificados",
      tipo: "orfaos_nao_verificados",
      severidade: "verificar",
      titulo: "Páginas órfãs não verificadas",
      detalhe: "Não há site gerado para ler os links internos reais. Publique ou gere o site (build) para conferir se alguma página está sem link apontando para ela.",
      node_ids: [],
      href_conserto: "",
      procedencia: "calculado_no_build",
    });
  }
  for (const ix of linksReaisDisponiveis ? indexaveis : []) {
    if (ix.links_entrando.length === 0 && ix.indexavel && !URLS_RAIZ.has(ix.url)) {
      if (todosObrigatorios.has(ix.node_id)) {
        // Já coberto pelo check 3a: alguém deveria linkar mas não linkou.
        // Não duplicar — o problema está na origem, não aqui.
        continue;
      }
      problemas.push({
        id: `orfao-${ix.node_id}`,
        tipo: "orfao_sem_destino_previsto",
        severidade: "prejudica",
        titulo: "Conteúdo órfão sem destino previsto",
        detalhe: `Nenhuma página está encarregada de linkar para "${ix.title}" (${ix.url}). Isso é uma lacuna do plano de arquitetura, não do conteúdo.`,
        node_ids: [ix.node_id],
        href_conserto: "", // sem conserto no painel — voltar ao LinkFlow
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 4. Cadeia de redirects e loops ───────────────────────────────────
  const mapaRedir: Record<string, string> = {};
  redirects.forEach((r) => { mapaRedir[r.origem] = r.destino; });
  const cadeiasMostradas = new Set<string>();

  for (const r of redirects) {
    const chain: string[] = [r.origem];
    let cur = r.origem;
    const visitados = new Set([cur]);
    let loop = false;
    while (mapaRedir[cur]) {
      cur = mapaRedir[cur];
      if (visitados.has(cur)) { loop = true; break; }
      visitados.add(cur);
      chain.push(cur);
    }
    const chave = chain.join("→");
    if (cadeiasMostradas.has(chave)) continue;
    cadeiasMostradas.add(chave);

    if (loop) {
      problemas.push({
        id: `loop-redirect-${r.id}`,
        tipo: "loop_redirect",
        severidade: "bloqueia",
        titulo: "Loop de redirect detectado",
        detalhe: `Cadeia circular: ${chain.join(" → ")} — crawlers abandonam após algumas tentativas.`,
        node_ids: [],
        href_conserto: "/seo/redirects",
        procedencia: "calculado_no_build",
      });
    } else if (chain.length > 2) {
      problemas.push({
        id: `chain-redirect-${r.id}`,
        tipo: "cadeia_redirect",
        severidade: "bloqueia",
        titulo: `Cadeia de redirect em ${chain.length - 1} salto${chain.length - 1 > 1 ? "s" : ""}`,
        detalhe: chain.join(" → "),
        node_ids: [],
        href_conserto: "/seo/redirects",
        procedencia: "calculado_no_build",
      });
    }
  }

  // ── 5. Canibalização de palavra-chave ─────────────────────────────────
  const kwMap: Record<string, Indexavel[]> = {};
  for (const ix of indexaveis) {
    const kw = ix.kw_primaria.trim();
    if (!kw) continue;
    kwMap[kw] = kwMap[kw] ?? [];
    kwMap[kw].push(ix);
  }
  for (const [kw, nos] of Object.entries(kwMap)) {
    if (nos.length > 1) {
      problemas.push({
        id: `canibalizacao-${kw.slice(0, 40).replace(/\s/g, "-")}`,
        tipo: "canibalizacao_kw",
        severidade: "prejudica",
        titulo: "Canibalização de palavra-chave",
        detalhe: `"${kw}" é KW primária de ${nos.length} conteúdos: ${nos.map((n) => `"${n.title}"`).join(", ")}.`,
        node_ids: nos.map((n) => n.node_id),
        href_conserto: hrefParaNo(nos[0]),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(nos[0]),
      });
    }
  }

  // ── 6. Imagem com alt vazio ───────────────────────────────────────────
  for (const ix of indexaveis) {
    const semAlt = ix.imagens.filter((img) => img.src && !img.alt.trim());
    if (semAlt.length > 0) {
      const nome = ix.title || ix.h1 || ix.url;
      problemas.push({
        id: `alt-vazio-${ix.node_id}`,
        tipo: "imagem_sem_alt",
        severidade: "prejudica",
        titulo: "Imagem sem texto alternativo",
        detalhe: `"${nome}" tem ${semAlt.length} imagem${semAlt.length > 1 ? "ns" : ""} sem alt. Prejudica acessibilidade e indexação de imagens.`,
        node_ids: [ix.node_id],
        href_conserto: ix.tipo === "post" ? hrefParaNo(ix) : "/midia",
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 7. Title fora de 3–70 chars ──────────────────────────────────────
  for (const ix of indexaveis) {
    // Categoria ainda não tem página pública no site (lib/urls-publicas.ts)
    // — não existe title/meta publicado para auditar.
    if (ix.tipo === "categoria") continue;
    const len = ix.title.length;
    if (len < 3 || len > 70) {
      const nome = ix.title || ix.h1 || ix.url;
      problemas.push({
        id: `title-${ix.node_id}`,
        tipo: "title_fora_limite",
        severidade: "prejudica",
        titulo: len < 3 ? "Title SEO muito curto" : "Title SEO muito longo",
        detalhe: `"${nome.slice(0, 55)}${nome.length > 55 ? "…" : ""}" (${ix.url}) tem ${len} chars (limite: 3–70).`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 8. Meta description ausente ou fora de 80–165 ────────────────────
  for (const ix of indexaveis) {
    // Categoria ainda não tem página pública no site (lib/urls-publicas.ts)
    // — não existe title/meta publicado para auditar.
    if (ix.tipo === "categoria") continue;
    const len = ix.meta_description.length;
    if (len === 0 || len < 80 || len > 165) {
      const msg =
        len === 0
          ? "Meta description ausente"
          : len < 80
            ? "Meta description muito curta"
            : "Meta description muito longa";
      const nome = ix.title || ix.h1 || ix.url;
      problemas.push({
        id: `meta-${ix.node_id}`,
        tipo: "meta_description_invalida",
        severidade: "prejudica",
        titulo: msg,
        detalhe:
          len === 0
            ? `"${nome}" (${ix.url}) não tem meta description. O Google pode usar texto aleatório do conteúdo.`
            : `"${nome}" (${ix.url}) tem meta description de ${len} chars (ideal: 80–165).`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 9. Post publicado sem fontes (E-E-A-T) ────────────────────────────
  for (const ix of indexaveis) {
    if (ix.tipo === "post" && ix.status === "publicado" && (ix.fontes_count ?? 0) === 0) {
      problemas.push({
        id: `sem-fontes-${ix.node_id}`,
        tipo: "post_sem_fontes",
        severidade: "verificar",
        titulo: "Post publicado sem fontes citadas",
        detalhe: `"${ix.title}" não tem fontes. Fontes com autoridade reforçam E-E-A-T, especialmente em conteúdo de saúde.`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: "blog",
      });
    }
  }

  // ── 10. Autor sem credencial preenchida ───────────────────────────────
  for (const ix of indexaveis) {
    if (ix.tipo === "autor" && ix.credencial_ok === false) {
      problemas.push({
        id: `sem-credencial-${ix.node_id}`,
        tipo: "autor_sem_credencial",
        severidade: "verificar",
        titulo: "Autor sem credencial profissional preenchida",
        detalhe: `"${ix.h1}" não tem Conselho e Registro preenchidos. Para conteúdo de saúde, isso enfraquece E-E-A-T.`,
        node_ids: [ix.node_id],
        href_conserto: "/autores",
        procedencia: "calculado_no_build",
        badge_tipo: "autor",
      });
    }
  }

  // ── 11. robots.txt bloqueando nó indexável ────────────────────────────
  const robotsBloq = parsearRobotsBloqueados(robots);
  for (const ix of indexaveis) {
    if (ix.indexavel && robotsBloqueado(ix.url, robotsBloq)) {
      problemas.push({
        id: `robots-bloq-${ix.node_id}`,
        tipo: "robots_bloqueando_indexavel",
        severidade: "bloqueia",
        titulo: "robots.txt bloqueia página indexável",
        detalhe: `"${ix.title}" (${ix.url}) está marcada como indexável mas é bloqueada pelo robots.txt.`,
        node_ids: [ix.node_id],
        href_conserto: "/seo/robots",
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 12. GA4 sem banner de cookies ────────────────────────────────────
  problemas.push({
    id: "ga4-sem-cookie-banner",
    tipo: "lgpd_cookies",
    severidade: "prejudica",
    titulo: "GA4 ativo sem banner de cookies configurado",
    detalhe:
      "GA4 define cookies de rastreamento. Sem banner ativo, o site pode estar em desconformidade com a LGPD e perder dados de sessão em navegadores com bloqueio.",
    node_ids: [],
    href_conserto: "/privacidade/cookies",
    procedencia: "calculado_no_build",
  });

  // ── 13. IndexNow não ativado ──────────────────────────────────────────
  problemas.push({
    id: "indexnow-off",
    tipo: "indexnow",
    severidade: "verificar",
    titulo: "IndexNow não ativado",
    detalhe:
      "Bing, Yandex e outros participantes não recebem notificação imediata de mudanças no conteúdo. Pode atrasar a reindexação de posts atualizados.",
    node_ids: [],
    href_conserto: "/seo/verificacoes",
    procedencia: "calculado_no_build",
  });

  // ── 14. Bing Webmaster Tools não configurado ──────────────────────────
  problemas.push({
    id: "bing-webmaster",
    tipo: "webmaster_tools",
    severidade: "verificar",
    titulo: "Bing Webmaster Tools não configurado",
    detalhe:
      "Sem propriedade verificada no Bing, não há dados de rastreamento, cobertura ou diagnóstico de erros para o segundo buscador mais usado no Brasil.",
    node_ids: [],
    href_conserto: "/seo/verificacoes",
    procedencia: "calculado_no_build",
  });

  // Ordenar por consequência: money → pilar → blog → resto
  // O sort estável preserva a ordem relativa dentro de mesmo prioTipo.
  problemas.sort((a, b) => prioTipo(a.badge_tipo) - prioTipo(b.badge_tipo));

  return problemas;
}
