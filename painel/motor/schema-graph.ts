import type { Autor, Categoria, Pagina, Post } from "@/mock/types";
import { idAutorSchema, urlAutor, urlPost } from "@/lib/urls-publicas";

// ── Informações do site (recebidas de fora — nunca hardcoded) ─────────────────

export interface SiteInfo {
  dominio: string;        // ex: "torrezdesentupidora.com.br" (sem protocolo)
  nomeSite: string;
  logoUrl?: string;
  sameAs?: string[];       // links de redes sociais
  endereco?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telefone?: string;
}

const LANG = "pt-BR";

function urlBase(site: SiteInfo): string {
  return site.dominio ? `https://${site.dominio}` : "";
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface NodoGraph {
  "@type": string | string[];
  "@id": string;
  [key: string]: unknown;
}

export interface SchemaGraph {
  "@context": "https://schema.org";
  "@graph": NodoGraph[];
}

// ── Nodos permanentes (emitidos em todas as páginas) ──────────────────────────

function nodoWebSite(site: SiteInfo): NodoGraph {
  const DOMINIO = urlBase(site);
  return {
    "@type": "WebSite",
    "@id": `${DOMINIO}/#website`,
    url: DOMINIO,
    name: site.nomeSite,
    inLanguage: LANG,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${DOMINIO}/busca?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

function nodoOrganization(site: SiteInfo): NodoGraph {
  const DOMINIO = urlBase(site);
  const nodo: NodoGraph = {
    "@type": "Organization",
    "@id": `${DOMINIO}/#organization`,
    name: site.nomeSite,
    url: DOMINIO,
  };

  if (site.logoUrl) {
    nodo.logo = {
      "@type": "ImageObject",
      "@id": `${DOMINIO}/#logo`,
      url: site.logoUrl,
      contentUrl: site.logoUrl,
      caption: site.nomeSite,
    };
  }

  if (site.sameAs && site.sameAs.length > 0) {
    nodo.sameAs = site.sameAs;
  }

  if (site.endereco && (site.endereco.streetAddress || site.endereco.addressLocality)) {
    nodo.address = {
      "@type": "PostalAddress",
      ...site.endereco,
      addressCountry: site.endereco.addressCountry ?? "BR",
    };
  }

  if (site.telefone) {
    nodo.telephone = site.telefone;
  }

  return nodo;
}

// ── Nodo Person (autor) ───────────────────────────────────────────────────────

function nodoAutor(autor: Autor, site: SiteInfo): NodoGraph {
  const DOMINIO = urlBase(site);
  // Mesmo @id e url que a página /autor/<slug> do site declara.
  const nodo: NodoGraph = {
    "@type": "Person",
    "@id": idAutorSchema(DOMINIO, autor.slug),
    name: autor.nome,
    url: `${DOMINIO}${urlAutor(autor.slug)}`,
    description: autor.bioCurta,
    jobTitle: autor.cargo,
    worksFor: { "@id": `${DOMINIO}/#organization` },
  };
  if (autor.foto) {
    nodo.image = {
      "@type": "ImageObject",
      url: autor.foto,
      description: autor.fotoAlt ?? autor.nome,
    };
  }
  if (autor.conselho && autor.registro) {
    nodo.hasCredential = `${autor.conselho} ${autor.registro}`;
  }
  const redes = Object.values(autor.redes).filter(Boolean);
  if (redes.length) nodo.sameAs = redes;
  return nodo;
}

// ── Nodo BreadcrumbList ───────────────────────────────────────────────────────

interface ItemBreadcrumb {
  name: string;
  item: string;
}

function nodoBreadcrumb(url: string, items: ItemBreadcrumb[], site: SiteInfo): NodoGraph {
  const absUrl = `${urlBase(site)}${url}`;
  return {
    "@type": "BreadcrumbList",
    "@id": `${absUrl}/#breadcrumb`,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

// ── Nodo WebPage genérico ─────────────────────────────────────────────────────

function nodoWebPage(opts: {
  url: string;
  tipo?: string;
  title: string;
  description: string;
  imagemUrl?: string;
  imagemAlt?: string;
}, site: SiteInfo): NodoGraph {
  const DOMINIO = urlBase(site);
  const absUrl = `${DOMINIO}${opts.url}`;
  const nodo: NodoGraph = {
    "@type": opts.tipo ?? "WebPage",
    "@id": `${absUrl}/#webpage`,
    url: absUrl,
    name: opts.title,
    description: opts.description,
    inLanguage: LANG,
    isPartOf: { "@id": `${DOMINIO}/#website` },
    breadcrumb: { "@id": `${absUrl}/#breadcrumb` },
    about: { "@id": `${DOMINIO}/#organization` },
  };
  if (opts.imagemUrl) {
    nodo.primaryImageOfPage = {
      "@type": "ImageObject",
      url: opts.imagemUrl,
      description: opts.imagemAlt ?? "",
    };
  }
  return nodo;
}

// ── Nodo BlogPosting / Article ────────────────────────────────────────────────

function nodoArticle(post: Post, autorId: string, imagemUrl: string, site: SiteInfo): NodoGraph {
  const DOMINIO = urlBase(site);
  const absUrl = `${DOMINIO}${urlPost(post.slug)}`; // URL plana: /<slug>
  const nodo: NodoGraph = {
    "@type": post.schemaTipo === "HowTo" || post.schemaTipo === "Recipe"
      ? post.schemaTipo
      : "BlogPosting",
    "@id": `${absUrl}/#article`,
    headline: post.seoTitle || post.titulo,
    description: post.metaDescription || post.resumo,
    datePublished: post.data,
    dateModified: post.data,
    inLanguage: LANG,
    isPartOf: { "@id": `${absUrl}/#webpage` },
    mainEntityOfPage: { "@id": `${absUrl}/#webpage` },
    author: { "@id": autorId },
    publisher: { "@id": `${DOMINIO}/#organization` },
  };
  if (imagemUrl) {
    nodo.image = {
      "@type": "ImageObject",
      url: imagemUrl,
      description: post.capaAlt ?? "",
    };
  }
  if (post.fontes?.length) {
    nodo.citation = post.fontes.map((f) => ({
      "@type": "CreativeWork",
      name: f.titulo ?? f.url,
      url: f.url,
    }));
  }
  if (post.schemaTipo === "HowTo" && post.faq.length) {
    nodo.step = post.faq.map((f, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: f.pergunta,
      text: f.resposta,
    }));
  }
  return nodo;
}

// ── Nodo FAQPage (se o post tiver FAQ) ───────────────────────────────────────

function nodoFaq(url: string, faq: Post["faq"], site: SiteInfo): NodoGraph | null {
  if (!faq.length) return null;
  const absUrl = `${urlBase(site)}${url}`;
  return {
    "@type": "FAQPage",
    "@id": `${absUrl}/#faq`,
    isPartOf: { "@id": `${absUrl}/#webpage` },
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.pergunta,
      acceptedAnswer: { "@type": "Answer", text: f.resposta },
    })),
  };
}

// ── Entrypoints públicos ──────────────────────────────────────────────────────
// Todos recebem `site: SiteInfo` com os dados reais do cliente (nunca hardcoded).

export function gerarGraphPost(
  post: Post,
  autor: Autor | undefined,
  categorias: Categoria[],
  imagemUrl: string,
  site: SiteInfo,
): SchemaGraph {
  const DOMINIO = urlBase(site);
  const url = urlPost(post.slug); // URL plana: /<slug>, nunca /blog/<slug>
  const absUrl = `${DOMINIO}${url}`;

  // Mesmo breadcrumb que o site publica (Início › Blog › Artigo). A
  // categoria não entra: ela não está na URL e não tem página própria.
  // `categorias` segue na assinatura por compatibilidade com quem chama.
  void categorias;
  const breadcrumbs: ItemBreadcrumb[] = [
    { name: "Início", item: DOMINIO },
    { name: "Blog", item: `${DOMINIO}/blog` },
    { name: post.seoTitle || post.titulo, item: absUrl },
  ];

  const autorSlug = autor?.slug ?? "autor";
  const autorNodeId = idAutorSchema(DOMINIO, autorSlug);

  const graph: NodoGraph[] = [
    nodoWebSite(site),
    nodoOrganization(site),
    nodoBreadcrumb(url, breadcrumbs, site),
    nodoWebPage({
      url,
      title: post.seoTitle || post.titulo,
      description: post.metaDescription || post.resumo,
      imagemUrl,
      imagemAlt: post.capaAlt,
    }, site),
    nodoArticle(post, autorNodeId, imagemUrl, site),
  ];

  if (autor) graph.push(nodoAutor(autor, site));

  const faqNode = nodoFaq(url, post.faq, site);
  if (faqNode && post.schemaTipo === "FAQPage") graph.push(faqNode);

  return { "@context": "https://schema.org", "@graph": graph };
}

export function gerarGraphPagina(pagina: Pagina, site: SiteInfo): SchemaGraph {
  const DOMINIO = urlBase(site);
  const breadcrumbs: ItemBreadcrumb[] = [
    { name: "Início", item: DOMINIO },
    { name: pagina.h1 || pagina.titulo, item: `${DOMINIO}${pagina.url}` },
  ];

  const graph: NodoGraph[] = [
    nodoWebSite(site),
    nodoOrganization(site),
    nodoBreadcrumb(pagina.url, breadcrumbs, site),
    nodoWebPage({
      url: pagina.url,
      tipo: pagina.schema || "WebPage",
      title: pagina.seoTitle,
      description: pagina.metaDescription,
    }, site),
  ];

  return { "@context": "https://schema.org", "@graph": graph };
}

// gerarGraphCategoria foi removida: categoria não tem página pública no
// site (sem rota /categoria), então não existe CollectionPage a descrever.

export function gerarGraphAutor(autor: Autor, site: SiteInfo): SchemaGraph {
  // Espelha o que pages/autor/[slug].astro emite: ProfilePage + Person +
  // breadcrumb (Home › Blog › Autor).
  const DOMINIO = urlBase(site);
  const url = urlAutor(autor.slug);
  const breadcrumbs: ItemBreadcrumb[] = [
    { name: "Início", item: DOMINIO },
    { name: "Blog", item: `${DOMINIO}/blog` },
    { name: autor.nome, item: `${DOMINIO}${url}` },
  ];
  const graph: NodoGraph[] = [
    nodoWebSite(site),
    nodoOrganization(site),
    nodoBreadcrumb(url, breadcrumbs, site),
    nodoWebPage({
      url,
      tipo: "ProfilePage",
      title: `${autor.nome} — ${site.nomeSite}`,
      description: autor.bioCurta,
      imagemUrl: autor.foto || undefined,
      imagemAlt: autor.fotoAlt ?? autor.nome,
    }, site),
    nodoAutor(autor, site),
  ];

  return { "@context": "https://schema.org", "@graph": graph };
}
