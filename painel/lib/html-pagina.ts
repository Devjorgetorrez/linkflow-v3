/**
 * lib/html-pagina.ts — leitura (pura, sem fs) do que o HTML PUBLICADO de uma
 * página realmente diz. Nada aqui é inferido: se o dado não está no HTML, o
 * campo sai null / vazio / 0 e a tela mostra "—".
 *
 * Extrai: <title> completo (entidades decodificadas, sem cortar em hífen),
 * meta description, meta robots (inclusive `googlebot`), canonical, primeiro
 * H1, todos os blocos JSON-LD (tipos achatados, inclusive @graph, e também o
 * conteúdo BRUTO de cada bloco — `jsonldBlocos` — para quem precisa do que o
 * site realmente emite, não só a contagem), Open Graph mínimo, nº de palavras
 * do texto visível e imagens sem alt.
 *
 * "Texto visível" = conteúdo de <body> sem <script>, <style>, <noscript>,
 * <template>, <svg> e comentários; conta todo o texto que o visitante vê
 * (menu e rodapé incluídos), separado por espaço.
 */

export interface DadosHtml {
  title: string | null;
  metaDescription: string | null;
  /** Conteúdo cru das metas robots/googlebot, ex: ["robots: noindex, follow"]. Vazio = sem meta. */
  robotsMeta: string[];
  noindex: boolean;
  nofollow: boolean;
  canonical: string | null;
  h1: string | null;
  jsonld: { blocos: number; invalidos: number; tipos: string[] };
  /**
   * Cada bloco <script type="application/ld+json"> como ele REALMENTE é no
   * HTML: se o JSON é válido, `dado` traz o objeto inteiro (com @graph, sem
   * achatar) e `tipos` os @type encontrados nele; se é inválido, `bruto` traz
   * o texto cru e `erro` um motivo curto. Ordem = ordem no documento.
   */
  jsonldBlocos: JsonldBloco[];
  og: { title: string | null; description: string | null; image: string | null; type: string | null };
  palavras: number;
  imagens: { total: number; semAlt: number };
  /** rastreadores que o HTML realmente carrega (vazio = nenhum) */
  rastreadores: string[];
}

export interface JsonldBloco {
  valido: boolean;
  /** @type achatados (inclusive @graph) só deste bloco; vazio se inválido ou sem @type */
  tipos: string[];
  /** objeto parseado (com @graph intacto), só quando `valido` */
  dado?: unknown;
  /** texto cru do bloco, só quando inválido */
  bruto?: string;
  /** motivo curto do erro de parse, só quando inválido */
  erro?: string;
}

const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  hellip: "…", laquo: "«", raquo: "»", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  middot: "·", bull: "•", copy: "©", reg: "®", trade: "™", deg: "°", ordm: "º", ordf: "ª",
  aacute: "á", agrave: "à", acirc: "â", atilde: "ã", auml: "ä", eacute: "é", egrave: "è",
  ecirc: "ê", iacute: "í", oacute: "ó", ocirc: "ô", otilde: "õ", uacute: "ú", ucirc: "û",
  uuml: "ü", ccedil: "ç", ntilde: "ñ",
  Aacute: "Á", Agrave: "À", Acirc: "Â", Atilde: "Ã", Eacute: "É", Ecirc: "Ê", Iacute: "Í",
  Oacute: "Ó", Ocirc: "Ô", Otilde: "Õ", Uacute: "Ú", Ccedil: "Ç",
};

export function decodificarEntidades(s: string): string {
  return s.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([A-Za-z][A-Za-z0-9]*));/g, (m, dec, hex, nome) => {
    try {
      if (dec) return String.fromCodePoint(Number(dec));
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return m;
    }
    return ENTIDADES[nome] ?? m;
  });
}

function limpar(s: string): string {
  return decodificarEntidades(s).replace(/\s+/g, " ").trim();
}

function semTags(s: string): string {
  return limpar(s.replace(/<[^>]*>/g, " "));
}

/** Atributos de uma tag (aspas duplas, simples ou sem aspas); chaves em minúsculas. */
function atributos(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  // pula o nome da tag
  const corpo = tag.replace(/^<\s*[^\s>\/]+/, "").replace(/\/?>$/, "");
  let m: RegExpExecArray | null;
  while ((m = re.exec(corpo))) {
    const k = m[1].toLowerCase();
    if (!(k in attrs)) attrs[k] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

function tiposDoNo(no: unknown, saida: string[]): void {
  if (Array.isArray(no)) {
    for (const n of no) tiposDoNo(n, saida);
    return;
  }
  if (!no || typeof no !== "object") return;
  const obj = no as Record<string, unknown>;
  const t = obj["@type"];
  if (typeof t === "string") saida.push(t);
  else if (Array.isArray(t)) for (const x of t) if (typeof x === "string") saida.push(x);
  if (obj["@graph"]) tiposDoNo(obj["@graph"], saida);
}

export function analisarHtml(html: string): DadosHtml {
  const cabeca = html.match(/<head[\s>][\s\S]*?<\/head\s*>/i)?.[0] ?? html;

  // <title>
  const t = cabeca.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i);
  const title = t ? limpar(t[1]) : null;

  // metas e links
  let metaDescription: string | null = null;
  const robotsMeta: string[] = [];
  let noindex = false;
  let nofollow = false;
  const og: DadosHtml["og"] = { title: null, description: null, image: null, type: null };
  for (const tag of cabeca.match(/<meta\b[^>]*>/gi) ?? []) {
    const a = atributos(tag);
    const nome = (a.name ?? "").toLowerCase();
    const prop = (a.property ?? "").toLowerCase();
    const conteudo = a.content !== undefined ? limpar(a.content) : null;
    if (nome === "description" && metaDescription === null && conteudo !== null) metaDescription = conteudo;
    if ((nome === "robots" || nome === "googlebot") && conteudo !== null) {
      robotsMeta.push(`${nome}: ${conteudo}`);
      const tokens = conteudo.toLowerCase().split(/[\s,]+/).filter(Boolean);
      if (tokens.includes("noindex") || tokens.includes("none")) noindex = true;
      if (tokens.includes("nofollow") || tokens.includes("none")) nofollow = true;
    }
    if (conteudo !== null) {
      if (prop === "og:title" && og.title === null) og.title = conteudo;
      if (prop === "og:description" && og.description === null) og.description = conteudo;
      if (prop === "og:image" && og.image === null) og.image = conteudo;
      if (prop === "og:type" && og.type === null) og.type = conteudo;
    }
  }
  let canonical: string | null = null;
  for (const tag of cabeca.match(/<link\b[^>]*>/gi) ?? []) {
    const a = atributos(tag);
    if ((a.rel ?? "").toLowerCase().split(/\s+/).includes("canonical") && a.href !== undefined) {
      canonical = limpar(a.href);
      break;
    }
  }

  // corpo sem ruído
  const corpoBruto = html.match(/<body[\s>][\s\S]*<\/body\s*>/i)?.[0] ?? html.replace(cabeca, "");
  const corpo = corpoBruto
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, " ");

  // H1 (primeiro)
  const h = corpo.match(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i);
  const h1 = h ? semTags(h[1]) || null : null;

  // JSON-LD (todos os blocos, em qualquer parte do documento)
  const tipos: string[] = [];
  const jsonldBlocos: JsonldBloco[] = [];
  let blocos = 0;
  let invalidos = 0;
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if ((atributos(`<script ${m[1]}>`).type ?? "").toLowerCase() !== "application/ld+json") continue;
    blocos++;
    const bruto = m[2].trim();
    try {
      const dado = JSON.parse(bruto);
      const tiposBloco: string[] = [];
      tiposDoNo(dado, tiposBloco);
      for (const t of tiposBloco) tipos.push(t);
      jsonldBlocos.push({ valido: true, tipos: [...new Set(tiposBloco)], dado });
    } catch (e) {
      invalidos++;
      jsonldBlocos.push({ valido: false, tipos: [], bruto, erro: e instanceof Error ? e.message : String(e) });
    }
  }

  // palavras
  const texto = limpar(corpo.replace(/<[^>]*>/g, " "));
  const palavras = texto ? texto.split(" ").filter((p) => /[\p{L}\p{N}]/u.test(p)).length : 0;

  // imagens
  let total = 0;
  let semAlt = 0;
  for (const tag of corpo.match(/<img\b[^>]*>/gi) ?? []) {
    total++;
    const a = atributos(tag);
    if (a.alt === undefined || !a.alt.trim()) semAlt++;
  }

  const rastreadores: string[] = [];
  if (/gtag\s*\(|googletagmanager\.com\/gtag|google-analytics\.com/i.test(html)) rastreadores.push("Google Analytics");
  if (/googletagmanager\.com\/(gtm\.js|ns\.html)|['"]GTM-[A-Z0-9]+['"]/i.test(html)) rastreadores.push("Google Tag Manager");
  if (/connect\.facebook\.net\/[^"']*fbevents|fbq\s*\(/i.test(html)) rastreadores.push("Meta Pixel");

  return {
    title,
    metaDescription,
    robotsMeta,
    noindex,
    nofollow,
    canonical,
    h1,
    jsonld: { blocos, invalidos, tipos: [...new Set(tipos)] },
    jsonldBlocos,
    og,
    palavras,
    imagens: { total, semAlt },
    rastreadores,
  };
}
