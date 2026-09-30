import type { Redirect } from "@/mock/types";
import type { Indexavel } from "./indexaveis";
import { normalizarUrl } from "@/lib/urls-publicas";

/**
 * bloqueia  = erro: algo que deveria estar no Google e não está.
 * aviso     = fora do Google DE PROPÓSITO (ex: Money Page em rascunho/noindex): explica, não acusa.
 * prejudica = piora o ranqueamento.
 * verificar = baixa urgência / conferência.
 */
export type Severidade = "bloqueia" | "aviso" | "prejudica" | "verificar";
export type Procedencia = "calculado_no_build" | "requer_search_console";

export interface Problema {
  id: string;
  tipo: string;
  severidade: Severidade;
  titulo: string;
  detalhe: string;
  node_ids: string[];
  /** Tela do painel onde dá para agir; "" = não há tela para isso (o detalhe diz o que fazer). */
  href_conserto: string;
  /** Texto do link; só aparece junto de href_conserto (que aponta para tela existente). */
  label_conserto?: string;
  procedencia: Procedencia;
  badge_tipo?: string; // "money" | "pilar" | "blog" | "categoria" | "autor" | "supporting" | "institucional"
}

// Páginas raiz que nunca são consideradas órfãs
const URLS_RAIZ = new Set(["/", "/blog", "/servicos", "/planos", "/sobre", "/contato"]);

function hrefParaNo(ix: Indexavel): string {
  if (ix.tipo === "post") return `/posts/${ix.node_id.replace("post-", "")}`;
  if (ix.tipo === "categoria") return "/categorias";
  // "Autor" não tem tela própria — é o campo de autoria do usuário
  // (lib/store.tsx, app/api/autores/route.ts). A credencial se edita em
  // Usuários, não numa rota "/autores" que nunca existiu (erro 74,
  // Relatório de Testes 5).
  if (ix.tipo === "autor") return `/usuarios/${ix.node_id.replace("autor-", "")}`;
  if (ix.node_id.startsWith("pagina-")) return `/paginas/${ix.node_id.slice("pagina-".length)}`;
  return "/paginas";
}

/** O que fazer, dito sem prometer botão que não existe. */
function comoCorrigir(ix: Indexavel): string {
  if (ix.tipo === "post") return "Corrija no editor do post e publique de novo.";
  if (ix.tipo === "pagina") {
    return "Páginas do site não têm editor no painel: peça o ajuste ao agente (/link-flow conteudo <slug>) e publique.";
  }
  return "Corrija na tela correspondente e publique de novo.";
}

/** Imagens sem alt: contagem real do HTML nas páginas; lista do painel nos demais. */
function imagensSemAlt(ix: Indexavel): number {
  if (ix.real) return ix.real.imagens.semAlt;
  return ix.imagens.filter((img) => img.src && !img.alt.trim()).length;
}

const LIM_TITLE = 60;
const LIM_META = 160;
const MIN_META = 80;

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
   * `linksReaisDisponiveis`: true só quando `indexaveis` foi montado com o grafo
   * REAL de links do HTML (lib/links-internos.ts). Sem ele, "ninguém linka para
   * cá" é só a ausência de dado, não um achado — então a regra de órfã não roda.
   * `quebrados`: links internos cujo destino não existe (grafo real).
   * `sitemapUrls`: URLs do sitemap do site lido (null = site sem sitemap;
   * undefined = não conseguiu ler o site, regra não roda).
   * `integracoes`: o que o site configura (lib/legal-site.ts integracoesAtivas);
   * undefined = config não carregou (nenhuma regra de GA roda, nem cobra nem elogia).
   * `bingVerificacao`: valor do config (undefined = config não carregou).
   * `dominio`: domínio real (compara com o host do canonical).
   */
  opts: {
    linksReaisDisponiveis?: boolean;
    quebrados?: Record<string, string[]>;
    sitemapUrls?: string[] | null;
    integracoes?: { analiticos: boolean; marketing: boolean; nomes: string[] };
    bingVerificacao?: string;
    dominio?: string;
  } = {},
): Problema[] {
  const linksReaisDisponiveis = opts.linksReaisDisponiveis ?? false;
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
          tipo: alvoid.startsWith("cat-") ? "referencia_categoria" : alvoid.startsWith("autor-") ? "referencia_autor" : "referencia_sem_destino",
          severidade: "prejudica",
          titulo: alvoid.startsWith("cat-")
            ? "Artigo com categoria que não existe"
            : alvoid.startsWith("autor-")
              ? "Artigo com autor que não existe"
              : "Referência interna sem destino",
          detalhe: `"${ix.title}" (${ix.url}) está ligado a ${alvoid.startsWith("cat-") ? "uma categoria" : alvoid.startsWith("autor-") ? "um autor" : "um item"} que não existe mais no painel (${alvoid}). ${comoCorrigir(ix)} Escolha uma categoria/autor existente.`,
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
        label_conserto: ix.tipo === "post" ? "Abrir o editor" : undefined,
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

  // ── 6. Imagem sem alt (contagem real do HTML nas páginas) ─────────────
  for (const ix of indexaveis) {
    const n = imagensSemAlt(ix);
    if (n > 0) {
      const nome = ix.title || ix.h1 || ix.url;
      problemas.push({
        id: `alt-vazio-${ix.node_id}`,
        tipo: "imagem_sem_alt",
        severidade: "prejudica",
        titulo: "Imagem sem texto alternativo",
        detalhe: `"${nome}" (${ix.url}) tem ${n} imagem${n > 1 ? "ns" : ""} sem alt. Prejudica acessibilidade e indexação de imagens. ${ix.tipo === "post" ? "Preencha o texto alternativo da imagem no editor do post." : ix.tipo === "pagina" ? "Suba a imagem com texto alternativo na Mídia e peça ao agente para trocar na página." : "Preencha o texto alternativo da imagem."}`,
        node_ids: [ix.node_id],
        href_conserto: ix.tipo === "post" ? hrefParaNo(ix) : "/midia",
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 6b. Página cujo HTML não pôde ser lido ────────────────────────────
  for (const ix of indexaveis) {
    if (ix.real?.erroLeitura) {
      problemas.push({
        id: `leitura-${ix.node_id}`,
        tipo: "html_ilegivel",
        severidade: "verificar",
        titulo: "Não foi possível verificar esta página",
        detalhe: `"${ix.url}": ${ix.real.erroLeitura}. As regras de title, meta, H1, noindex e imagens não rodaram para ela. Publique o site de novo; se persistir, o arquivo no servidor está com problema.`,
        node_ids: [ix.node_id],
        href_conserto: "",
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 7. Title: ausente ou maior que 60 chars (número real do HTML) ─────
  for (const ix of indexaveis) {
    // Categoria ainda não tem página pública no site (lib/urls-publicas.ts)
    // — não existe title/meta publicado para auditar.
    if (ix.tipo === "categoria") continue;
    if (ix.real?.erroLeitura) continue;
    // Página de autor (e possivelmente outras) pode chegar sem title —
    // sem a guarda, essa checagem travava a Visão geral de SEO inteira
    // (erro 86, Relatório de Testes 6).
    const len = (ix.title ?? "").length;
    if (len < 3 || len > LIM_TITLE) {
      const nome = ix.title || ix.h1 || ix.url;
      problemas.push({
        id: `title-${ix.node_id}`,
        tipo: len === 0 ? "title_ausente" : len < 3 ? "title_curto" : "title_longo",
        severidade: "prejudica",
        titulo: len === 0 ? "Title SEO ausente" : len < 3 ? "Title SEO muito curto" : "Title SEO muito longo",
        detalhe: len === 0
          ? `${ix.url} não tem <title>. ${comoCorrigir(ix)}`
          : `"${nome.slice(0, 55)}${nome.length > 55 ? "…" : ""}" (${ix.url}) tem ${len} caracteres (o Google costuma mostrar até ${LIM_TITLE}). ${comoCorrigir(ix)}`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 8. Meta description: ausente, < 80 ou > 160 (número real do HTML) ─
  for (const ix of indexaveis) {
    if (ix.tipo === "categoria") continue;
    if (ix.real?.erroLeitura) continue;
    const len = ix.meta_description.length;
    if (len === 0 || len < MIN_META || len > LIM_META) {
      const msg =
        len === 0
          ? "Meta description ausente"
          : len < MIN_META
            ? "Meta description muito curta"
            : "Meta description muito longa";
      const nome = ix.title || ix.h1 || ix.url;
      problemas.push({
        id: `meta-${ix.node_id}`,
        tipo: len === 0 ? "meta_ausente" : len < MIN_META ? "meta_curta" : "meta_longa",
        severidade: "prejudica",
        titulo: msg,
        detalhe:
          len === 0
            ? `"${nome}" (${ix.url}) não tem meta description. O Google pode usar texto aleatório do conteúdo. ${comoCorrigir(ix)}`
            : `"${nome}" (${ix.url}) tem meta description de ${len} caracteres (ideal: ${MIN_META}–${LIM_META}). ${comoCorrigir(ix)}`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 8b. H1 ausente (páginas, lido do HTML) ────────────────────────────
  for (const ix of indexaveis) {
    if (ix.tipo !== "pagina" || !ix.real || ix.real.erroLeitura) continue;
    if (!ix.h1.trim()) {
      problemas.push({
        id: `h1-${ix.node_id}`,
        tipo: "h1_ausente",
        severidade: "prejudica",
        titulo: "Página sem H1",
        detalhe: `${ix.url} não tem nenhum título H1 no HTML publicado. O H1 diz ao Google e ao visitante sobre o que é a página. ${comoCorrigir(ix)}`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 8c. noindex e nofollow REAIS (meta robots do HTML publicado) ──────
  // Money Page nasce noindex de propósito (rascunho até a Fase 3 escrever o
  // conteúdo real — skills/fase2-site-astro ETAPA 4.3): AVISO explicativo.
  // Vira ERRO quando é página que deveria estar no Google (home, pilar,
  // institucionais...) ou quando o noindex vem de onde o conteúdo não pede.
  for (const ix of indexaveis) {
    if (ix.tipo !== "pagina" || !ix.real || ix.real.erroLeitura) continue;
    const nome = ix.title || ix.h1 || ix.url;
    const meta = ix.real.robotsMeta.join(" | ");
    if (ix.real.noindex) {
      if (ix.tipo_pagina === "money" && ix.real.noindexNoConteudo === true) {
        problemas.push({
          id: `noindex-rascunho-${ix.node_id}`,
          tipo: "noindex_rascunho",
          severidade: "aviso",
          titulo: "Página ainda fora do Google (noindex)",
          detalhe: `"${nome}" (${ix.url}) está marcada como noindex (${meta}); o Google não vai indexá-la até você liberar. É o esperado enquanto o conteúdo real da Fase 3 não foi escrito e aprovado. Para liberar: conclua a Fase 3 desta página (/link-flow conteudo <slug>) e publique.`,
          node_ids: [ix.node_id],
          href_conserto: hrefParaNo(ix),
          procedencia: "calculado_no_build",
          badge_tipo: badgeTipoDoNo(ix),
        });
      } else if (ix.tipo_pagina === "supporting") {
        // O motor marca noindex em página de autor ou de categoria sem artigos
        // (pages/autor/[slug].astro, pages/[slug].astro): página rala, que sai
        // do noindex sozinha quando houver conteúdo. Não é erro.
        problemas.push({
          id: `noindex-apoio-${ix.node_id}`,
          tipo: "noindex_apoio",
          severidade: "aviso",
          titulo: "Página de apoio fora do Google (noindex)",
          detalhe: `"${nome}" (${ix.url}) está marcada como noindex (${meta}). O site faz isso de propósito com páginas de apoio ainda sem conteúdo, como autor ou categoria sem artigos; ela sai do noindex sozinha quando houver artigos. Se esta página já tem conteúdo e deveria aparecer no Google, peça ao agente para revisar.`,
          node_ids: [ix.node_id],
          href_conserto: hrefParaNo(ix),
          procedencia: "calculado_no_build",
          badge_tipo: badgeTipoDoNo(ix),
        });
      } else {
        const origemDoNoindex =
          ix.tipo_pagina === "money"
            ? ix.real.noindexNoConteudo === false
              ? "O arquivo de conteúdo desta página NÃO pede noindex, então a marca vem de outro lugar (tema ou configuração do site)."
              : "Não encontrei o arquivo de conteúdo desta página para saber se o noindex é intencional."
            : "Esta página deveria aparecer no Google.";
        problemas.push({
          id: `noindex-inesperado-${ix.node_id}`,
          tipo: "noindex_inesperado",
          severidade: "bloqueia",
          titulo: "Página bloqueada para o Google (noindex)",
          detalhe: `"${nome}" (${ix.url}) está com meta robots noindex (${meta}) e o Google não vai indexá-la. ${origemDoNoindex} Peça ao agente para remover o noindex e publique.`,
          node_ids: [ix.node_id],
          href_conserto: hrefParaNo(ix),
          procedencia: "calculado_no_build",
          badge_tipo: badgeTipoDoNo(ix),
        });
      }
    }
    if (ix.real.nofollow) {
      problemas.push({
        id: `nofollow-${ix.node_id}`,
        tipo: "nofollow_pagina",
        severidade: "verificar",
        titulo: "Página com nofollow",
        detalhe: `"${nome}" (${ix.url}) tem meta robots com nofollow (${meta}): o Google não segue os links desta página. Se não foi de propósito, peça ao agente para remover.`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 8d. Canonical real ─────────────────────────────────────────────────
  const dominioBase = (opts.dominio ?? "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  for (const ix of indexaveis) {
    if (ix.tipo !== "pagina" || !ix.real || ix.real.erroLeitura) continue;
    const nome = ix.title || ix.h1 || ix.url;
    const c = ix.real.canonical;
    if (!c) {
      problemas.push({
        id: `canonical-ausente-${ix.node_id}`,
        tipo: "canonical_ausente",
        severidade: "verificar",
        titulo: "Página sem canonical",
        detalhe: `"${nome}" (${ix.url}) não declara <link rel="canonical">. Sem ele o Google escolhe sozinho qual endereço considerar o oficial. ${comoCorrigir(ix)}`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
      continue;
    }
    let caminho = c;
    let host = "";
    try {
      const u = new URL(c, "http://relativo.local");
      caminho = u.pathname;
      host = u.hostname === "relativo.local" ? "" : u.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      /* mantém cru */
    }
    if (normalizarUrl(caminho) !== normalizarUrl(ix.url)) {
      problemas.push({
        id: `canonical-diverge-${ix.node_id}`,
        tipo: "canonical_divergente",
        severidade: "prejudica",
        titulo: "Canonical aponta para outra URL",
        detalhe: `"${nome}" (${ix.url}) declara canonical ${c}, que não é o próprio endereço da página. O Google tende a ignorar esta página em favor da outra. ${comoCorrigir(ix)}`,
        node_ids: [ix.node_id],
        href_conserto: hrefParaNo(ix),
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    } else if (dominioBase && host && host !== dominioBase) {
      problemas.push({
        id: `canonical-host-${ix.node_id}`,
        tipo: "canonical_dominio",
        severidade: "verificar",
        titulo: "Canonical em outro domínio",
        detalhe: `"${nome}" (${ix.url}) declara canonical em ${host}, mas o domínio configurado do site é ${dominioBase}. Confira o endereço do site nas Configurações e publique de novo.`,
        node_ids: [ix.node_id],
        href_conserto: "",
        procedencia: "calculado_no_build",
        badge_tipo: badgeTipoDoNo(ix),
      });
    }
  }

  // ── 8e. Links internos quebrados (grafo real) ─────────────────────────
  if (opts.quebrados) {
    const origensRedirect = new Set(redirects.map((r) => normalizarUrl(r.origem)));
    const porUrl = new Map(indexaveis.filter((ix) => ix.url).map((ix) => [normalizarUrl(ix.url), ix]));
    for (const [origem, destinos] of Object.entries(opts.quebrados)) {
      const alvos = destinos.filter((d) => !origensRedirect.has(normalizarUrl(d)));
      if (alvos.length === 0) continue;
      const ix = porUrl.get(normalizarUrl(origem));
      const nome = ix ? ix.title || ix.h1 || ix.url : origem;
      problemas.push({
        id: `link-quebrado-real-${origem}`,
        tipo: "link_quebrado_real",
        severidade: "prejudica",
        titulo: "Link interno quebrado",
        detalhe: `"${nome}" (${origem}) tem ${alvos.length} link${alvos.length > 1 ? "s" : ""} para endereços que não existem no site: ${alvos.slice(0, 5).join(", ")}${alvos.length > 5 ? ` e mais ${alvos.length - 5}` : ""}. Corrija o link na página ou peça ao agente (Claude Code) para criar um redirecionamento.`,
        node_ids: ix ? [ix.node_id] : [],
        href_conserto: ix ? hrefParaNo(ix) : "",
        procedencia: "calculado_no_build",
        badge_tipo: ix ? badgeTipoDoNo(ix) : undefined,
      });
    }
  }

  // ── 8f. Sitemap coerente com noindex ──────────────────────────────────
  if (opts.sitemapUrls === null) {
    problemas.push({
      id: "sitemap-ausente",
      tipo: "sitemap_ausente",
      severidade: "verificar",
      titulo: "O site não tem sitemap.xml",
      detalhe: "Não encontrei sitemap no site lido. Sem ele o Google descobre as páginas só pelos links. Republique o site; o sitemap é gerado no build.",
      node_ids: [],
      href_conserto: "/seo/sitemap",
      procedencia: "calculado_no_build",
    });
  } else if (opts.sitemapUrls) {
    const noSitemap = new Set(opts.sitemapUrls.map(normalizarUrl));
    for (const ix of indexaveis) {
      if (ix.tipo !== "pagina" || !ix.real || ix.real.erroLeitura) continue;
      const nome = ix.title || ix.h1 || ix.url;
      const listada = noSitemap.has(normalizarUrl(ix.url));
      if (ix.real.noindex && listada) {
        problemas.push({
          id: `sitemap-noindex-${ix.node_id}`,
          tipo: "sitemap_lista_noindex",
          severidade: "verificar",
          titulo: "Sitemap lista página noindex",
          detalhe: `"${nome}" (${ix.url}) está no sitemap mas tem noindex: são sinais contraditórios para o Google. Republique o site para o sitemap ser gerado de novo.`,
          node_ids: [ix.node_id],
          href_conserto: "/seo/sitemap",
          procedencia: "calculado_no_build",
          badge_tipo: badgeTipoDoNo(ix),
        });
      } else if (!ix.real.noindex && !listada) {
        problemas.push({
          id: `sitemap-falta-${ix.node_id}`,
          tipo: "sitemap_sem_pagina",
          severidade: "verificar",
          titulo: "Página indexável fora do sitemap",
          detalhe: `"${nome}" (${ix.url}) pode ser indexada mas não está no sitemap do site. Republique o site para o sitemap ser gerado de novo.`,
          node_ids: [ix.node_id],
          href_conserto: "/seo/sitemap",
          procedencia: "calculado_no_build",
          badge_tipo: badgeTipoDoNo(ix),
        });
      }
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
        href_conserto: `/usuarios/${ix.node_id.replace("autor-", "")}`,
        label_conserto: "Editar credencial",
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

  // ── 12. Google Analytics / GTM — só se o site de fato carrega ─────────
  // Fonte única: integracoesAtivas (config do site) + o que o HTML realmente
  // tem (real.rastreadores). Sem ID e sem gtag no HTML: nada é dito aqui — a
  // tela mostra "não configurado" como estado neutro (nem falha, nem sucesso).
  if (opts.integracoes) {
    const noHtml = new Set<string>();
    for (const ix of indexaveis) for (const r of ix.real?.rastreadores ?? []) noHtml.add(r);
    const semPixel = (n: string) => !/pixel/i.test(n);
    const nomes = new Set([...opts.integracoes.nomes.filter(semPixel), ...[...noHtml].filter(semPixel)]);
    if (opts.integracoes.analiticos || nomes.size > 0) {
      problemas.push({
        id: "analytics-cookies",
        tipo: "lgpd_cookies",
        severidade: "verificar",
        titulo: `${[...nomes].join(" e ") || "Medição de visitas"} em uso: confirme o aviso de cookies`,
        detalhe:
          "O site carrega uma ferramenta de medição, que grava cookies de rastreamento. Confira em Privacidade > Cookies que a categoria Analíticos está descrita e que o site informa o visitante (LGPD).",
        node_ids: [],
        href_conserto: "/privacidade/cookies",
        label_conserto: "Abrir Cookies",
        procedencia: "calculado_no_build",
      });
    }
  }

  // ── 13. Bing Webmaster Tools (só se o config já carregou) ─────────────
  if (opts.bingVerificacao !== undefined && !opts.bingVerificacao.trim()) {
    problemas.push({
      id: "bing-webmaster",
      tipo: "webmaster_tools",
      severidade: "verificar",
      titulo: "Bing Webmaster Tools sem código de verificação",
      detalhe:
        "O site não tem o código de verificação do Bing configurado, então não há dados de rastreamento e cobertura do Bing. Cole o código em SEO > Verificações.",
      node_ids: [],
      href_conserto: "/seo/verificacoes",
      procedencia: "calculado_no_build",
    });
  }

  // Ordenar por consequência: money → pilar → blog → resto
  // O sort estável preserva a ordem relativa dentro de mesmo prioTipo.
  problemas.sort((a, b) => prioTipo(a.badge_tipo) - prioTipo(b.badge_tipo));

  return problemas;
}
