import type { Autor, Categoria, Pagina, Post, StatusPost } from "@/mock/types";
import { urlAutor, urlPost } from "@/lib/urls-publicas";

export interface ImagemIndexavel {
  src: string;
  alt: string;
}

export interface Indexavel {
  node_id: string;
  url: string;
  tipo: "pagina" | "post" | "categoria" | "autor";
  tipo_pagina?: "money" | "pilar" | "supporting" | "institucional"; // paginas only
  status: StatusPost;
  indexavel: boolean;
  title: string;
  meta_description: string;
  h1: string;
  kw_primaria: string;
  canonical_derivado: string;
  schemas_emitidos: string[];
  links_saindo: string[];               // node_ids que este conteúdo referencia
  links_entrando: string[];             // node_ids que referenciam este conteúdo (invertido)
  links_internos_obrigatorios: string[]; // node_ids que esta página deve linkar (planejado, pode não estar no corpo)
  ultima_mod: string;   // ISO date YYYY-MM-DD — fonte do lastmod no sitemap
  imagens: ImagemIndexavel[];
  fontes_count?: number;   // posts only — usado para checar E-E-A-T
  credencial_ok?: boolean; // autores only — conselho + registro preenchidos
}

// Extrai KW primária a partir de seoTitle: tudo antes do primeiro separador
function kwDeSeoTitle(seoTitle: string): string {
  return seoTitle.split(/[?!·|]/)[0].trim().toLowerCase();
}

export function gerarIndexaveis(dados: {
  posts: Post[];
  paginas: Pagina[];
  categorias: Categoria[];
  autores: Autor[];
  dominio: string; // domínio real do cliente, ex: "torrezdesentupidora.com.br"
  nomeSite?: string; // nome real do negócio, para títulos derivados
}): Indexavel[] {
  const { posts, paginas, categorias, autores, dominio, nomeSite } = dados;
  const DOMINIO = dominio ? `https://${dominio}` : "";
  const indexaveis: Indexavel[] = [];

  // ── Posts ──────────────────────────────────────────────────────────────
  for (const post of posts) {
    const url = urlPost(post.slug); // URL plana: /<slug>, nunca /blog/<slug>
    const schemas: string[] = [];
    if (post.schemaTipo) schemas.push(post.schemaTipo);
    if (post.faq.length > 0 && !schemas.includes("FAQPage")) schemas.push("FAQPage");

    // Posts referenciam sua categoria e seu autor — grafo mínimo do protótipo
    const linksS: string[] = [];
    if (post.categoriaId) linksS.push(`cat-${post.categoriaId}`);
    if (post.autorId) linksS.push(`autor-${post.autorId}`);

    indexaveis.push({
      node_id: `post-${post.id}`,
      url,
      tipo: "post",
      status: post.status,
      indexavel: !post.noindex && post.status === "publicado",
      title: post.seoTitle,
      meta_description: post.metaDescription,
      h1: post.titulo,
      kw_primaria: ((post as Post & { kwPrimaria?: string }).kwPrimaria ?? "").trim().toLowerCase(),
      canonical_derivado: `${DOMINIO}${url}`,
      schemas_emitidos: schemas,
      links_saindo: linksS,
      links_entrando: [],
      links_internos_obrigatorios: [],
      ultima_mod: post.data,
      imagens: post.capa ? [{ src: post.capa, alt: post.capaAlt ?? "" }] : [],
      fontes_count: post.fontes.length,
    });
  }

  // ── Páginas ────────────────────────────────────────────────────────────
  // Mapa de id → node_id das páginas para resolver links pai-filho
  const paginaIdParaNodeId = new Map(
    paginas.map((p) => [p.id, p.node_id ?? `pagina-${p.id}`]),
  );

  for (const pag of paginas) {
    const linksS: string[] = [];
    if (pag.paiId) {
      const paiNodeId = paginaIdParaNodeId.get(pag.paiId);
      if (paiNodeId) linksS.push(paiNodeId);
    }

    indexaveis.push({
      node_id: pag.node_id ?? `pagina-${pag.id}`,
      url: pag.url,
      tipo: "pagina",
      tipo_pagina: pag.tipo,
      status: pag.status,
      indexavel: pag.status === "publicado",
      title: pag.seoTitle,
      meta_description: pag.metaDescription,
      h1: pag.h1,
      kw_primaria: kwDeSeoTitle(pag.seoTitle),
      canonical_derivado: `${DOMINIO}${pag.url}`,
      schemas_emitidos: pag.schema ? [pag.schema] : [],
      links_saindo: linksS,
      links_entrando: [],
      links_internos_obrigatorios: pag.links_internos_obrigatorios ?? [],
      ultima_mod: pag.ultimaMod ?? "2026-01-01",
      imagens: [],
    });
  }

  // ── Categorias ─────────────────────────────────────────────────────────
  // Categoria NÃO tem página pública no site (não existe rota /categoria no
  // motor Astro — ver lib/urls-publicas.ts). Continua no grafo para as
  // auditorias internas, mas sem URL e fora de sitemap/indexação.
  for (const cat of categorias) {
    const url = "";
    const linksS: string[] = [];
    if (cat.paiId) linksS.push(`cat-${cat.paiId}`);

    indexaveis.push({
      node_id: `cat-${cat.id}`,
      url,
      tipo: "categoria",
      status: "publicado",
      indexavel: false,
      title: cat.seoTitle || cat.nome,
      meta_description: cat.metaDescription,
      h1: cat.nome,
      kw_primaria: cat.nome.toLowerCase(),
      canonical_derivado: "",
      schemas_emitidos: [],
      links_saindo: linksS,
      links_entrando: [],
      links_internos_obrigatorios: [],
      ultima_mod: "2026-01-01",
      imagens: cat.imagem ? [{ src: cat.imagem, alt: cat.nome }] : [],
    });
  }

  // ── Autores ────────────────────────────────────────────────────────────
  // Autor tem página própria no site: /autor/<slug>
  for (const autor of autores) {
    const url = urlAutor(autor.slug);
    indexaveis.push({
      node_id: `autor-${autor.id}`,
      url,
      tipo: "autor",
      status: "publicado",
      indexavel: autor.ativo !== false,
      title: nomeSite ? `${autor.nome} · ${nomeSite}` : autor.nome,
      meta_description: autor.bioCurta,
      h1: autor.nome,
      kw_primaria: autor.nome.toLowerCase(),
      canonical_derivado: `${DOMINIO}${url}`,
      schemas_emitidos: ["Person"],
      links_saindo: [],
      links_entrando: [],
      links_internos_obrigatorios: [],
      ultima_mod: "2026-01-01",
      imagens: autor.foto ? [{ src: autor.foto, alt: autor.fotoAlt ?? autor.nome }] : [],
      credencial_ok: !!(autor.conselho?.trim() && autor.registro?.trim()),
    });
  }

  // ── Inverter links_saindo → links_entrando ─────────────────────────────
  const mapa = new Map(indexaveis.map((ix) => [ix.node_id, ix]));
  for (const ix of indexaveis) {
    for (const alvoid of ix.links_saindo) {
      const no = mapa.get(alvoid);
      if (no) no.links_entrando.push(ix.node_id);
    }
  }

  return indexaveis;
}
