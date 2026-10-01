/**
 * utm.ts — guarda os parâmetros utm_* da visita em sessionStorage.
 * Carregado por TODAS as páginas (layouts) para que a origem não se perca quando
 * o visitante entra por uma página sem formulário e só depois vai ao contato.
 * form-contato.ts lê o valor guardado ao enviar.
 */
export const UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

export function utmsDaSessao(): Record<string, string> {
  const params = new URLSearchParams(location.search)
  const achados: Record<string, string> = {}
  for (const k of UTMS) {
    const v = params.get(k)
    if (v) achados[k] = v.slice(0, 100)
  }
  try {
    if (Object.keys(achados).length) {
      sessionStorage.setItem('lf_utm', JSON.stringify(achados))
      return achados
    }
    const salvo = sessionStorage.getItem('lf_utm')
    if (salvo) return JSON.parse(salvo) as Record<string, string>
  } catch {
    /* storage bloqueado: segue só com a URL */
  }
  return achados
}

utmsDaSessao()
