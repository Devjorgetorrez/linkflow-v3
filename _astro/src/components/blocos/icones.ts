/**
 * icones.ts — traços de 24px compartilhados pelos blocos.
 *
 * Existe para que Prova e Abordagem não dupliquem o mesmo SVG. Todos com o
 * mesmo peso de linha, para não misturar estilos dentro de uma página.
 *
 * Bloco que recebe um `icone` fora deste mapa cai para as duas primeiras
 * letras do valor — que era o comportamento único antes deste arquivo, e é
 * o que mantém os temas anteriores inalterados.
 */

export const tracos: Record<string, string> = {
  usuario:      '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>',
  balanca:      '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l3 6a3 3 0 0 0-6 0z"/>',
  documento:    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  relogio:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  escudo:       '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  mapa:         '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  grafico:      '<path d="M3 21h18M6 17V9M11 17V5M16 17v-6M21 17v-9"/>',
  lupa:         '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  calculadora:  '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>',
  telefone:     '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 4.7 12 19.8 19.8 0 0 1 1.6 3.4 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L7.9 8.7a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z"/>',
  casa:         '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  alerta:       '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  estrela:      '<path d="m12 3 2.9 6.3 6.8.7-5.1 4.6 1.4 6.7L12 17.9l-6 3.4 1.4-6.7L2.3 10l6.8-.7z"/>',
  engrenagem:   '<circle cx="12" cy="12" r="3"/><path d="M20 12a8 8 0 0 0-.2-1.7l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2.9-1.7L14.2 2h-4l-.4 2.7a8 8 0 0 0-2.9 1.7l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4.4 12c0 .6.1 1.2.2 1.7l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 2.9 1.7l.4 2.7h4l.4-2.7a8 8 0 0 0 2.9-1.7l2.3 1 2-3.4-2-1.5c.1-.5.2-1.1.2-1.7z"/>',
  check:        '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  folha:        '<path d="M4 20c0-8 6-14 16-15 0 10-5 16-13 16H4z"/><path d="M4 20c3-5 7-8 11-9.5"/>',
}

export const temTraco = (k: string) =>
  Object.prototype.hasOwnProperty.call(tracos, k)
