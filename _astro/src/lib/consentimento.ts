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
    versaoPolitica?: string
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
 * O banner é SEMPRE obrigatório (Relatório de Testes 4, erro 45 — antes o
 * sistema decidia sozinho "sem nada pra consentir, sem banner", o que é
 * falso em produção: todo cliente real vai ter Analytics/Pixel mais cedo
 * ou mais tarde, e o formulário de contato já coleta dado pessoal mesmo
 * sem nenhum cookie). Quem muda é o TIPO do banner — ver `pedeConsentimento`.
 */
export function bannerNecessario(_site?: SiteComoConfig | undefined | null): boolean {
  return true
}

/**
 * true = banner pede consentimento de verdade (tem categoria de cookie não
 * essencial ou rastreador configurado). false = só aviso informativo — a
 * ANPD considera que não há "escolha real" pra pedir consentimento de um
 * site que só usa cookie estritamente necessário, mas o dever de informar
 * continua (o site já coleta dado pessoal pelo formulário de contato).
 */
export function pedeConsentimento(site: SiteComoConfig | undefined | null): boolean {
  const integ = integracoesAtivas(site)
  return integ.analiticos || integ.marketing || cookiesNaoEssenciais(site).length > 0
}
