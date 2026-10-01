import type { Post } from "@/mock/types";

// ── Tipos exportados ──────────────────────────────────────────────────────────

export interface TesteKw {
  ok: boolean;
  rotulo: string;
  detalhe?: string;
}

export interface ResultadoSEO {
  score: number;
  obrigatorios: TesteKw[];
  recomendados: TesteKw[];
}

// ── Utilitários ───────────────────────────────────────────────────────────────

export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function extrairLinks(corpo: string, dominio: string): {
  internos: { href: string; texto: string }[];
  externos: { href: string; texto: string }[];
} {
  const re = /<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const internos: { href: string; texto: string }[] = [];
  const externos: { href: string; texto: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(corpo)) !== null) {
    const href = m[1];
    const texto = stripTags(m[2]);
    if (href.startsWith("/") || (dominio && href.includes(dominio))) {
      internos.push({ href, texto });
    } else if (href.startsWith("http")) {
      externos.push({ href, texto });
    }
  }
  return { internos, externos };
}

// ── Análise SEO — 8 testes §2.3.1 ────────────────────────────────────────────
//
// Obrigatórios (bloqueiam publicação):
//   1. KW no título (seoTitle ou titulo)
//   2. KW na meta description
//   3. KW no primeiro H2
//   4. Ao menos 1 link interno no corpo
//
// Recomendados (avisam):
//   5. KW no último H2
//   6. Densidade ≥ 0,5%
//   7. Ao menos 1 link externo
//   8. KW no primeiro parágrafo
//
// Score: 12,5 pontos por teste ok (8 × 12,5 = 100).

export function analisarSEO(
  kw: string,
  post: Post,
  links: ReturnType<typeof extrairLinks>,
  totalPalavras: number,
): ResultadoSEO | null {
  const kwLow = kw.toLowerCase().trim();
  if (!kwLow) return null;

  const corpo = post.corpo;
  const textoCompleto = stripTags(corpo);

  const reKw = new RegExp(kwLow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const ocorrencias = (textoCompleto.match(reKw) || []).length;
  const densidade = totalPalavras > 0 ? (ocorrencias / totalPalavras) * 100 : 0;

  const h2Matches = [...corpo.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const primeiroH2 = h2Matches.length > 0 ? stripTags(h2Matches[0][1]).toLowerCase() : "";
  const ultimoH2 =
    h2Matches.length > 0
      ? stripTags(h2Matches[h2Matches.length - 1][1]).toLowerCase()
      : "";

  const primeiroPMatch = corpo.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const primeiroParagrafo = primeiroPMatch ? stripTags(primeiroPMatch[1]).toLowerCase() : "";

  const titleRef = (post.seoTitle || post.titulo).toLowerCase();

  const obrigatorios: TesteKw[] = [
    {
      ok: titleRef.includes(kwLow),
      rotulo: "Palavra-chave no título",
      detalhe: !titleRef.includes(kwLow)
        ? "Ausente no title SEO ou no título do post"
        : undefined,
    },
    {
      ok: post.metaDescription.toLowerCase().includes(kwLow),
      rotulo: "Palavra-chave na meta description",
      detalhe: !post.metaDescription.toLowerCase().includes(kwLow)
        ? "Meta description não contém a palavra-chave"
        : undefined,
    },
    {
      ok: primeiroH2.includes(kwLow),
      rotulo: "Palavra-chave no primeiro H2",
      detalhe:
        h2Matches.length === 0
          ? "Nenhum H2 no corpo"
          : !primeiroH2.includes(kwLow)
            ? `Primeiro H2: "${stripTags(h2Matches[0][1])}"`
            : undefined,
    },
    {
      ok: links.internos.length >= 1,
      rotulo: "Ao menos 1 link interno",
      detalhe:
        links.internos.length === 0
          ? "Nenhum link interno no corpo"
          : `${links.internos.length} encontrado${links.internos.length !== 1 ? "s" : ""}`,
    },
  ];

  const recomendados: TesteKw[] = [
    {
      ok: h2Matches.length > 0 && ultimoH2.includes(kwLow),
      rotulo: "Palavra-chave no último H2",
      detalhe:
        h2Matches.length === 0
          ? "Nenhum H2 no corpo"
          : !ultimoH2.includes(kwLow)
            ? `Último H2: "${stripTags(h2Matches[h2Matches.length - 1][1])}"`
            : undefined,
    },
    {
      ok: densidade >= 0.5,
      rotulo: "Densidade ≥ 0,5%",
      detalhe: `${densidade.toFixed(1)}% — ${ocorrencias} ocorrência${ocorrencias !== 1 ? "s" : ""} em ${totalPalavras} palavras${densidade < 0.5 ? ". Mínimo 0,5%" : ""}`,
    },
    {
      ok: links.externos.length >= 1,
      rotulo: "Ao menos 1 link externo",
      detalhe:
        links.externos.length === 0
          ? "Nenhum link externo no corpo"
          : `${links.externos.length} encontrado${links.externos.length !== 1 ? "s" : ""}`,
    },
    {
      ok: primeiroParagrafo.includes(kwLow),
      rotulo: "Palavra-chave no primeiro parágrafo",
      detalhe: !primeiroParagrafo.includes(kwLow)
        ? primeiroParagrafo
          ? "KW ausente no primeiro parágrafo"
          : "Nenhum parágrafo no corpo"
        : undefined,
    },
  ];

  const todosOsTestes = [...obrigatorios, ...recomendados];
  const score = Math.round((todosOsTestes.filter((t) => t.ok).length / 8) * 100);

  return { score, obrigatorios, recomendados };
}
