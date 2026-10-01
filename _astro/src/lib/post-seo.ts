/**
 * lib/post-seo.ts — SEO do post num lugar só, para os 6 layouts.
 *
 * O editor do painel grava no frontmatter dos posts campos opcionais que os
 * layouts leem por aqui (nenhum layout repete essa lógica):
 *   seoTitle      título da aba/Google. Usado como está (já é o título completo).
 *                 Sem ele: "<titulo> — <nome do site>", o padrão de sempre.
 *   resumo        texto do card/lista do blog; também serve de metaDescription
 *                 quando esta vier vazia (nunca o contrário).
 *   canonical     URL absoluta; inválida ou vazia = ignorada (vale o padrão).
 *   noindex       true = <meta robots noindex, follow>; o sitemap-canonico já
 *                 tira do sitemap.xml toda página com esse meta.
 *   faq           [{pergunta, resposta}] — vira JSON-LD FAQPage + seção visível.
 *   kwSecundarias uso interno, NUNCA renderizado.
 *   geradoPorIA   metadado; não muda o HTML.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface FaqItem { pergunta: string; resposta: string }

/** Perguntas com pergunta E resposta preenchidas; o resto é descartado. */
export function faqDoPost(data: any): FaqItem[] {
  const lista: any[] = Array.isArray(data?.faq) ? data.faq : []
  return lista
    .map((f) => ({ pergunta: String(f?.pergunta ?? '').trim(), resposta: String(f?.resposta ?? '').trim() }))
    .filter((f) => f.pergunta && f.resposta)
}

function urlAbsolutaValida(v: unknown): string | undefined {
  const s = String(v ?? '').trim()
  if (!s) return undefined
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:' ? s : undefined
  } catch {
    return undefined
  }
}

/** metaDescription do post; vazia cai no resumo (cortado em 165, sem partir palavra). */
export function metaDescricaoDoPost(data: any): string {
  const meta = String(data?.metaDescription ?? '').trim()
  if (meta) return meta
  const resumo = String(data?.resumo ?? '').trim()
  if (!resumo) return ''
  if (resumo.length <= 165) return resumo
  const corte = resumo.slice(0, 164)
  const espaco = corte.lastIndexOf(' ')
  return (espaco > 80 ? corte.slice(0, espaco) : corte).replace(/[\s,;:.—-]+$/, '') + '…'
}

/**
 * Valores finais de <title>, description, canonical e robots de um post.
 * `canonicalPadrao` é a URL plana de sempre (`<dominio>/<slug>`).
 */
export function seoDoPost(data: any, nomeSite: string, canonicalPadrao: string) {
  const seoTitle = String(data?.seoTitle ?? '').trim()
  return {
    titulo: seoTitle || `${data.titulo} — ${nomeSite}`,
    metaDescription: metaDescricaoDoPost(data),
    canonical: urlAbsolutaValida(data?.canonical) ?? canonicalPadrao,
    noindex: data?.noindex === true,
    faq: faqDoPost(data),
  }
}

/** Nó FAQPage para o @graph do JSON-LD; undefined sem perguntas reais. */
export function faqJsonLd(faq: FaqItem[], canonical: string) {
  if (!faq.length) return undefined
  return {
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: f.resposta },
    })),
  }
}
