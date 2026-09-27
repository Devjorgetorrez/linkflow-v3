/**
 * scripts/consentimento-ui.ts — liga os botões do BannerCookies.astro:
 * mostra/esconde o banner, salva a escolha, dispara o carregamento dos
 * scripts de rastreamento já consentidos (mesmo em visita repetida, sem
 * esperar novo clique) e liga os links "Preferências de cookies" do rodapé.
 *
 * Se a página não tem banner (site sem integração e só cookie essencial —
 * nada para consentir), os links de reabrir preferências do rodapé ficam
 * ocultos: não faz sentido oferecer uma preferência que não existe.
 */
import { carregarSeConsentido, lerConsentimento, salvarConsentimento, type CategoriasConsentimento, type IdsIntegracoes } from './consentimento-carregar.ts'

const SELETOR_REABRIR = '[data-lf-reabrir-cookies]'

const raiz = document.getElementById('lf-banner-cookies')

/** URL do painel (mesma fonte de form-contato.ts: <meta name="lf-painel-url">, injetada em build a partir de `painelUrl`). */
function painelUrl(): string {
  const m = document.querySelector('meta[name="lf-painel-url"]')
  return (m?.getAttribute('content') || '').trim().replace(/\/+$/, '')
}

type EscolhaConsentimento = 'aceito' | 'rejeitado' | 'personalizado'

/**
 * Registro do consentimento no servidor — só quando `site.cookieBanner.registroConsentimento`
 * está ligado (`data-registro="1"`, ver BannerCookies.astro). Sem base de painel (prévia local,
 * site ainda não publicado) não envia nada — igual a form-contato.ts. Falha de rede é silenciosa
 * de propósito: a escolha já foi salva no localStorage do visitante, que é o que controla se os
 * rastreadores carregam; o registro no servidor é só a prova/auditoria, não pode travar o banner.
 */
function registrarConsentimento(raiz: HTMLElement, escolha: EscolhaConsentimento, categorias?: CategoriasConsentimento): void {
  if (raiz.dataset.registro !== '1') return
  const base = painelUrl()
  if (!base) return
  const payload: Record<string, unknown> = { escolha, paginaOrigem: location.pathname }
  if (categorias) payload.categorias = categorias
  fetch(base + '/api/consentimentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => { /* silencioso: ver comentário acima */ })
}

function ocultarLinksDeReabrir(): void {
  document.querySelectorAll<HTMLElement>(SELETOR_REABRIR).forEach((el) => {
    el.hidden = true
  })
}

function mostrarLinksDeReabrir(): void {
  document.querySelectorAll<HTMLElement>(SELETOR_REABRIR).forEach((el) => {
    el.hidden = false
  })
}

if (!raiz) {
  // Nada para consentir nesta página — o link do rodapé não tem o que reabrir.
  ocultarLinksDeReabrir()
} else {
  mostrarLinksDeReabrir()
  const painel = raiz.querySelector<HTMLElement>('[data-lf-painel]')
  const btnAceitar = raiz.querySelector<HTMLButtonElement>('[data-lf-aceitar]')
  const btnRejeitar = raiz.querySelector<HTMLButtonElement>('[data-lf-rejeitar]')
  const btnPersonalizar = raiz.querySelector<HTMLButtonElement>('[data-lf-personalizar]')
  const btnSalvarPreferencias = raiz.querySelector<HTMLButtonElement>('[data-lf-salvar-preferencias]')

  const idsIntegracoes: IdsIntegracoes = {
    ga: raiz.dataset.ga || undefined,
    gtm: raiz.dataset.gtm || undefined,
    pixel: raiz.dataset.pixel || undefined,
  }

  function categoriasDoPainel(): CategoriasConsentimento {
    // Categoria que não existe no painel (sem checkbox porque o site não tem essa
    // integração/cookie) nunca é tratada como aceita — padrão seguro (opt-in real).
    const marcada = (seletor: string) => (painel?.querySelector<HTMLInputElement>(seletor)?.checked ?? false)
    return {
      analiticos: marcada('[data-cat="analiticos"]'),
      marketing: marcada('[data-cat="marketing"]'),
      funcionais: marcada('[data-cat="funcionais"]'),
    }
  }

  function mostrarBanner(comPainelAberto: boolean): void {
    raiz.hidden = false
    if (comPainelAberto) painel?.removeAttribute('hidden')
    // Foco tratado: quem reabre pelas preferências do rodapé cai direto no primeiro botão.
    btnAceitar?.focus()
  }

  function esconderBanner(): void {
    raiz.hidden = true
  }

  function aplicarEFechar(categorias: CategoriasConsentimento): void {
    salvarConsentimento(categorias)
    carregarSeConsentido(idsIntegracoes)
    esconderBanner()
  }

  // Escolha já dada (mesmo em visita anterior) carrega direto, sem esperar clique.
  carregarSeConsentido(idsIntegracoes)

  if (!lerConsentimento()) {
    raiz.hidden = false
  }

  btnAceitar?.addEventListener('click', () => {
    aplicarEFechar({ analiticos: true, marketing: true, funcionais: true })
    registrarConsentimento(raiz, 'aceito')
  })
  btnRejeitar?.addEventListener('click', () => {
    aplicarEFechar({ analiticos: false, marketing: false, funcionais: false })
    registrarConsentimento(raiz, 'rejeitado')
  })
  btnPersonalizar?.addEventListener('click', () => {
    const estaAberto = painel && !painel.hidden
    if (estaAberto) painel?.setAttribute('hidden', '')
    else painel?.removeAttribute('hidden')
  })
  btnSalvarPreferencias?.addEventListener('click', () => {
    const categorias = categoriasDoPainel()
    aplicarEFechar(categorias)
    registrarConsentimento(raiz, 'personalizado', categorias)
  })

  document.querySelectorAll<HTMLElement>(SELETOR_REABRIR).forEach((link) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault()
      mostrarBanner(false)
    })
  })
}
