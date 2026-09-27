/**
 * form-contato.ts — envio compartilhado dos formulários de captação do site.
 *
 * Usado por TODAS as variantes de components/blocos/FormContato.astro (e por
 * qualquer formulário marcado com `data-lf-form`). Sem dependências externas.
 *
 * Contrato com o painel (POST `${painelUrl}/api/submissao`, JSON):
 *   { formularioId, nome, email, telefone, mensagem, _hp, paginaOrigem,
 *     utm_source, utm_medium, utm_campaign, utm_term, utm_content,
 *     lgpdAceite, camposExtras }
 *   -> { ok:true, mensagem } | { ok:false, erro, campos?:{campo:mensagem} }
 *   (400 validação, 429 limite de envios)
 *
 * A URL do painel vem do config em build (`painelUrl` no site.ts), injetada
 * pelo layout em <meta name="lf-painel-url">. Sem ela (prévia local, site ainda
 * não publicado) NADA é enviado e NENHUM sucesso é simulado.
 */

import { UTMS, utmsDaSessao } from './utm.ts'

const CLASSE_ERRO = 'mt-1 text-xs font-medium text-danger'

function painelUrl(): string {
  const m = document.querySelector('meta[name="lf-painel-url"]')
  return (m?.getAttribute('content') || '').trim().replace(/\/+$/, '')
}

type Controle = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const campo = (f: HTMLFormElement, nome: string) => f.querySelector<Controle>(`[name="${nome}"]`)
const valor = (f: HTMLFormElement, nome: string) => (campo(f, nome)?.value || '').trim()
const digitos = (s: string) => s.replace(/\D/g, '')
const emailValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)
const telefoneEl = (f: HTMLFormElement) => campo(f, 'telefone') || campo(f, 'celular')
const statusEl = (f: HTMLFormElement) => f.querySelector<HTMLElement>('[data-lf-status]') as HTMLElement

function limparErros(f: HTMLFormElement) {
  f.querySelectorAll('[data-lf-erro]').forEach((e) => e.remove())
  f.querySelectorAll('[aria-invalid]').forEach((e) => {
    e.removeAttribute('aria-invalid')
    e.removeAttribute('aria-describedby')
  })
  statusEl(f).textContent = ''
}

function erroNoCampo(el: Element, msg: string) {
  const id = (el.id || 'lf-' + Math.random().toString(36).slice(2, 7)) + '-erro'
  const p = document.createElement('p')
  p.id = id
  p.setAttribute('role', 'alert')
  p.setAttribute('data-lf-erro', '')
  p.className = CLASSE_ERRO
  p.textContent = msg
  el.setAttribute('aria-invalid', 'true')
  el.setAttribute('aria-describedby', id)
  el.insertAdjacentElement('afterend', p)
}

/** Devolve [elemento, mensagem] de cada problema, na ordem da tela. */
function validar(f: HTMLFormElement): [Element, string][] {
  const erros: [Element, string][] = []
  const nome = campo(f, 'nome')
  if (nome && !nome.value.trim()) erros.push([nome, 'Informe seu nome.'])

  f.querySelectorAll<Controle>('[data-lf-obrigatorio]').forEach((el) => {
    if (!el.value.trim()) erros.push([el, 'Preencha este campo.'])
  })

  const mail = campo(f, 'email')
  const tel = telefoneEl(f)
  const m = mail?.value.trim() || ''
  const t = digitos(tel?.value || '')
  const mailOk = !!m && emailValido(m)
  const telOk = t.length >= 8 && t.length <= 15
  if (mail && m && !mailOk) erros.push([mail, 'Digite um e-mail válido, como nome@exemplo.com.'])
  if (tel && t && !telOk) erros.push([tel, 'Digite o telefone com DDD (de 8 a 15 números).'])
  if (!mailOk && !telOk && !m && !t) {
    erros.push([(mail || tel) as Element, 'Informe um e-mail válido ou um telefone com DDD, para podermos responder.'])
  }

  const lgpd = f.querySelector<HTMLInputElement>('input[type="checkbox"][name="lgpd"]')
  if (lgpd && !lgpd.checked) erros.push([lgpd, 'É preciso aceitar o uso dos dados para enviar.'])
  return erros
}

/** Mostra um aviso geral e leva o foco até ele. `contatos` acrescenta os canais reais do site. */
function aviso(f: HTMLFormElement, texto: string, contatos = false) {
  const st = statusEl(f)
  st.textContent = texto
  if (contatos) {
    const tel = (f.dataset.telefone || '').trim()
    const wa = digitos(f.dataset.whatsapp || '')
    if (!wa && !tel) {
      st.append(' Tente de novo em instantes.')
    } else {
      st.append(' Tente de novo ou fale pelo ')
      if (wa) {
        const a = document.createElement('a')
        a.href = 'https://wa.me/' + wa
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.className = 'font-semibold underline'
        a.textContent = 'WhatsApp'
        st.append(a)
        if (tel) st.append(' ou pelo telefone ' + tel)
      } else {
        st.append('telefone ' + tel)
      }
      st.append('.')
    }
  }
  st.focus()
}

type Dados = { nome: string; mensagem: string; assunto: string }

function mensagemWhats(d: Dados) {
  const partes: string[] = [d.nome ? `Olá! Meu nome é ${d.nome}.` : 'Olá!']
  if (d.assunto) partes.push(`Assunto: ${d.assunto}.`)
  if (d.mensagem) partes.push(d.mensagem.slice(0, 500))
  else if (!d.assunto) partes.push('Acabei de enviar um contato pelo site e gostaria de continuar por aqui.')
  return partes.join(' ')
}

function sucesso(f: HTMLFormElement, texto: string, dados: Dados) {
  Array.from(f.children).forEach((c) => {
    if (!c.hasAttribute('data-lf-manter')) (c as HTMLElement).style.display = 'none'
  })
  const bloco = f.querySelector<HTMLElement>('[data-lf-sucesso]')
  if (!bloco) return
  const msg = bloco.querySelector<HTMLElement>('[data-lf-msg]')
  if (msg) msg.textContent = texto || 'Mensagem enviada com sucesso!'
  const wa = digitos(f.dataset.whatsapp || '')
  const btn = bloco.querySelector<HTMLAnchorElement>('[data-lf-wa]')
  if (btn) {
    if (wa) {
      btn.href = `https://wa.me/${wa}?text=${encodeURIComponent(mensagemWhats(dados))}`
      btn.hidden = false
    } else btn.hidden = true
  }
  bloco.hidden = false
  bloco.focus()
}

function montarPayload(f: HTMLFormElement) {
  const nome = [valor(f, 'nome'), valor(f, 'sobrenome')].filter(Boolean).join(' ')
  const tel = telefoneEl(f)
  const lgpd = f.querySelector<HTMLInputElement>('input[type="checkbox"][name="lgpd"]')
  const usados = new Set(['nome', 'sobrenome', 'email', 'telefone', 'celular', 'mensagem', '_hp', 'lgpd'])
  const extras: Record<string, string> = {}
  f.querySelectorAll<HTMLInputElement>('input[name],select[name],textarea[name]').forEach((el) => {
    if (usados.has(el.name) || el.name in extras) return
    if (el.type === 'radio') {
      const marcado = f.querySelector<HTMLInputElement>(`input[type="radio"][name="${el.name}"]:checked`)
      extras[el.name] = marcado ? marcado.value : ''
    } else if (el.type === 'checkbox') {
      extras[el.name] = el.checked ? 'sim' : 'nao'
    } else {
      extras[el.name] = el.value.trim()
    }
  })
  Object.keys(extras).forEach((k) => {
    if (extras[k] === '') delete extras[k]
  })
  const utm = utmsDaSessao()
  const payload: Record<string, unknown> = {
    formularioId: f.dataset.formularioId || 'contato',
    nome,
    email: valor(f, 'email'),
    telefone: (tel?.value || '').trim(),
    mensagem: valor(f, 'mensagem'),
    _hp: valor(f, '_hp'),
    paginaOrigem: location.pathname,
    lgpdAceite: lgpd ? lgpd.checked : false,
    camposExtras: extras,
  }
  for (const k of UTMS) payload[k] = utm[k] || ''
  const dados: Dados = { nome, mensagem: valor(f, 'mensagem'), assunto: extras.assunto || '' }
  return { payload, dados }
}

async function aoEnviar(ev: Event) {
  ev.preventDefault()
  const f = ev.currentTarget as HTMLFormElement
  if (f.dataset.lfEnviando === '1') return
  limparErros(f)

  const base = painelUrl()
  if (!base) {
    aviso(f, 'Prévia: o formulário passa a enviar depois que o site for publicado.')
    return
  }

  const erros = validar(f)
  if (erros.length) {
    erros.forEach(([el, msg]) => erroNoCampo(el, msg))
    ;(erros[0][0] as HTMLElement).focus()
    return
  }

  const botao = f.querySelector<HTMLButtonElement>('button[type="submit"]')
  const rotulo = botao?.innerHTML || ''
  f.dataset.lfEnviando = '1'
  f.setAttribute('aria-busy', 'true')
  if (botao) {
    botao.disabled = true
    botao.textContent = 'Enviando…'
  }
  const libera = () => {
    f.dataset.lfEnviando = '0'
    f.removeAttribute('aria-busy')
    if (botao) {
      botao.disabled = false
      botao.innerHTML = rotulo
    }
  }

  const { payload, dados } = montarPayload(f)
  const ctl = new AbortController()
  const tempo = setTimeout(() => ctl.abort(), 20000)
  try {
    const res = await fetch(base + '/api/submissao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctl.signal,
    })
    let corpo: { ok?: boolean; mensagem?: string; erro?: string; campos?: Record<string, string> } = {}
    try {
      corpo = await res.json()
    } catch {
      /* corpo que não é JSON */
    }

    if (res.ok && corpo.ok) {
      f.dataset.lfEnviando = '0'
      f.removeAttribute('aria-busy')
      sucesso(f, corpo.mensagem || '', dados)
      return
    }
    libera()
    if (res.status === 429) {
      aviso(f, 'Você enviou várias mensagens em pouco tempo. Aguarde um pouco antes de tentar de novo.', false)
      return
    }
    if (res.status === 400) {
      const campos = corpo.campos || {}
      let primeiro: HTMLElement | null = null
      for (const k of Object.keys(campos)) {
        const el = campo(f, k) || (k === 'telefone' ? telefoneEl(f) : null)
        if (el) {
          erroNoCampo(el, String(campos[k]))
          primeiro = primeiro || el
        }
      }
      if (primeiro) primeiro.focus()
      else aviso(f, corpo.erro || 'Confira os dados informados e tente de novo.')
      return
    }
    aviso(f, 'Não conseguimos enviar agora.', true)
  } catch {
    libera()
    aviso(f, 'Não conseguimos enviar agora.', true)
  } finally {
    clearTimeout(tempo)
  }
}

function iniciar() {
  document.querySelectorAll<HTMLFormElement>('form[data-lf-form]').forEach((f) => {
    if (f.dataset.lfPronto === '1') return
    f.dataset.lfPronto = '1'
    f.noValidate = true
    f.addEventListener('submit', aoEnviar)
  })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar)
else iniciar()
