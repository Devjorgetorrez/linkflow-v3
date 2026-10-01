/**
 * scripts/consentimento-carregar.ts — persistência da escolha do banner de
 * cookies (localStorage) e injeção condicionada dos scripts de GA4/GTM/Meta
 * Pixel. Puro JS, sem lib nova. Compartilhado por BannerCookies.astro
 * (scripts/consentimento-ui.ts) e por qualquer página que precise checar o
 * consentimento sem esperar clique (visita repetida já consentida).
 *
 * Regra (defeito A61): sem escolha = não carrega. Rejeitado = não carrega.
 * Aceito = carrega, inclusive em visitas seguintes, sem precisar de novo clique.
 */

export const CHAVE_CONSENTIMENTO = 'lf-consentimento'
const VALIDADE_DIAS = 180

// Aviso informativo (site só com cookie necessário — nada pra aceitar ou
// rejeitar, só o dever de informar). Mesma validade do consentimento real,
// chave própria porque não tem categoria nenhuma pra guardar.
const CHAVE_INFORMADO = 'lf-informado'

export function lerInformado(): boolean {
  try {
    const bruto = localStorage.getItem(CHAVE_INFORMADO)
    if (!bruto) return false
    const dias = (Date.now() - new Date(bruto).getTime()) / 86400000
    return dias >= 0 && dias <= VALIDADE_DIAS
  } catch {
    return false
  }
}

export function salvarInformado(): void {
  try {
    localStorage.setItem(CHAVE_INFORMADO, new Date().toISOString())
  } catch {
    /* storage bloqueado: o aviso volta a aparecer na próxima visita — sem problema, é só informativo */
  }
}

// Identificador anônimo do visitante — persiste no localStorage, gerado uma
// vez, usado pra correlacionar os registros de consentimento do MESMO
// visitante ao longo do tempo (ex.: aceite seguido de uma revogação depois)
// sem guardar nenhum dado que identifique a pessoa de verdade.
const CHAVE_VISITANTE_ID = 'lf-visitante-id'

export function obterVisitanteId(): string {
  try {
    let id = localStorage.getItem(CHAVE_VISITANTE_ID)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(CHAVE_VISITANTE_ID, id)
    }
    return id
  } catch {
    return '' // storage bloqueado: registro segue sem identificador de retorno
  }
}

export interface CategoriasConsentimento {
  analiticos: boolean
  marketing: boolean
  funcionais: boolean
}

export interface ConsentimentoSalvo extends CategoriasConsentimento {
  data: string // ISO
}

/** Lê o consentimento salvo. `null` = nunca escolheu, ou a escolha expirou (revalida a cada 6 meses). */
export function lerConsentimento(): ConsentimentoSalvo | null {
  try {
    const bruto = localStorage.getItem(CHAVE_CONSENTIMENTO)
    if (!bruto) return null
    const salvo = JSON.parse(bruto) as Partial<ConsentimentoSalvo>
    if (!salvo || typeof salvo !== 'object' || typeof salvo.data !== 'string') return null
    const dataSalva = new Date(salvo.data).getTime()
    if (Number.isNaN(dataSalva)) return null
    const diasPassados = (Date.now() - dataSalva) / 86400000
    if (diasPassados < 0 || diasPassados > VALIDADE_DIAS) return null
    return {
      analiticos: !!salvo.analiticos,
      marketing: !!salvo.marketing,
      funcionais: !!salvo.funcionais,
      data: salvo.data,
    }
  } catch {
    return null // storage bloqueado (aba privada etc.) — trata como "ainda não escolheu"
  }
}

export function salvarConsentimento(categorias: CategoriasConsentimento): void {
  try {
    const registro: ConsentimentoSalvo = { ...categorias, data: new Date().toISOString() }
    localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify(registro))
  } catch {
    /* storage bloqueado: a escolha não persiste e o banner volta a aparecer na próxima visita — é o
       comportamento seguro (não carregar rastreador sem conseguir lembrar do consentimento). */
  }
}

export interface IdsIntegracoes {
  ga?: string
  gtm?: string
  pixel?: string
}

function jaInjetado(id: string): boolean {
  return !!document.getElementById(id)
}

function injetarUm(id: string, montar: () => HTMLScriptElement[]): void {
  if (jaInjetado(id)) return
  montar().forEach((el) => document.head.appendChild(el))
}

function carregarGA4(id: string): void {
  injetarUm(`lf-ga4-${id}`, () => {
    const carregador = document.createElement('script')
    carregador.id = `lf-ga4-${id}`
    carregador.async = true
    carregador.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    const config = document.createElement('script')
    config.text =
      `window.dataLayer=window.dataLayer||[];` +
      `function gtag(){dataLayer.push(arguments);}` +
      `gtag('js',new Date());gtag('config','${id}');`
    return [carregador, config]
  })
}

function carregarGTM(id: string): void {
  injetarUm(`lf-gtm-${id}`, () => {
    const s = document.createElement('script')
    s.id = `lf-gtm-${id}`
    s.text =
      `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
      `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';` +
      `j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;` +
      `f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`
    return [s]
  })
}

function carregarPixel(id: string): void {
  injetarUm(`lf-pixel-${id}`, () => {
    const s = document.createElement('script')
    s.id = `lf-pixel-${id}`
    s.text =
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?` +
      `n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;` +
      `n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;` +
      `t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}` +
      `(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
      `fbq('init','${id}');fbq('track','PageView');`
    return [s]
  })
}

/**
 * Injeta os scripts de rastreamento permitidos pelo consentimento salvo.
 * Sem consentimento salvo → não injeta nada. Chamado a cada carregamento de
 * página (não só no clique), para que uma escolha já dada em visita anterior
 * continue valendo sem esperar novo clique.
 */
export function carregarSeConsentido(ids: IdsIntegracoes): void {
  const consentimento = lerConsentimento()
  if (!consentimento) return
  if (consentimento.analiticos) {
    if (ids.ga) carregarGA4(ids.ga)
    if (ids.gtm) carregarGTM(ids.gtm)
  }
  if (consentimento.marketing && ids.pixel) carregarPixel(ids.pixel)
}
