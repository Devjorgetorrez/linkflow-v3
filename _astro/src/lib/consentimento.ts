/**
 * lib/consentimento.ts — fonte única (lado do motor) de quais categorias de
 * cookie e quais rastreadores existem no site. Espelha as MESMAS regras de
 * `painel/lib/legal-site.ts` (`integracoesAtivas`), mas lendo o objeto `site`
 * já carregado em memória (config/site.ts ou config/tema-0X.ts) — o motor não
 * faz parsing de texto bruto, só olha o objeto.
 *
 * Usado por BannerCookies.astro para decidir se o banner aparece (defeito
 * A61 do QA: banner configurado no painel não existia no site).
 */

export interface CookieBannerConfig {
  titulo?: string
  descricao?: string
  modalDescricao?: string
  posicaoH?: 'left' | 'center' | 'right'
  posicaoV?: 'top' | 'middle' | 'bottom'
  registroConsentimento?: boolean
}

export interface SiteComoConfig {
  googleAnalyticsId?: string
  googleTagManagerId?: string
  metaPixelId?: string
  legal?: {
    cookies?: Array<{ categoria?: string; [k: string]: unknown }>
  }
  cookieBanner?: CookieBannerConfig
}

export interface IntegracoesAtivas {
  analiticos: boolean // GA4 ou GTM
  marketing: boolean // Meta Pixel
}

/** Mesma regra de painel/lib/legal-site.ts:integracoesAtivas — só o dado muda de forma (objeto, não string do arquivo). */
export function integracoesAtivas(site: SiteComoConfig | undefined | null): IntegracoesAtivas {
  return {
    analiticos: !!(site?.googleAnalyticsId || site?.googleTagManagerId),
    marketing: !!site?.metaPixelId,
  }
}

/** Categorias "Necessários"/"Essenciais" nunca entram no consentimento — cookie de sessão, honeypot etc. */
const PREFIXOS_ESSENCIAIS = ['necess', 'essenc']

export type BucketCategoria = 'analiticos' | 'marketing' | 'funcionais'

function bucketDaCategoria(categoria: string): BucketCategoria {
  const c = categoria.toLowerCase()
  if (c.startsWith('anal')) return 'analiticos'
  if (c.startsWith('market')) return 'marketing'
  return 'funcionais'
}

export interface CategoriaCookie {
  categoria: string
  bucket: BucketCategoria
}

/** Categorias de `site.legal.cookies` que não são essenciais (precisam de consentimento). */
export function cookiesNaoEssenciais(site: SiteComoConfig | undefined | null): CategoriaCookie[] {
  const cookies = site?.legal?.cookies
  if (!Array.isArray(cookies)) return []
  return cookies
    .map((c) => String(c?.categoria ?? '').trim())
    .filter((categoria) => categoria && !PREFIXOS_ESSENCIAIS.some((p) => categoria.toLowerCase().startsWith(p)))
    .map((categoria) => ({ categoria, bucket: bucketDaCategoria(categoria) }))
}

/**
 * O banner só existe se houver algo para consentir: uma categoria de cookie
 * não essencial cadastrada OU um rastreador (GA/GTM/Pixel) configurado.
 * Só cookie essencial + nenhuma integração = nada para consentir = sem banner.
 */
export function bannerNecessario(site: SiteComoConfig | undefined | null): boolean {
  const integ = integracoesAtivas(site)
  return integ.analiticos || integ.marketing || cookiesNaoEssenciais(site).length > 0
}
