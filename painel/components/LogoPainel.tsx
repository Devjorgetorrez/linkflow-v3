/**
 * LogoPainel — marca do painel (ícone + wordmark "SiteFlow"), usada no
 * cabeçalho da sidebar e na tela de login.
 *
 * Ícone: app/icon.png (o mesmo favicon real do sistema, PNG com canal alfa —
 * funciona tanto em fundo claro quanto escuro). NUNCA a reconstrução em SVG
 * antiga (components/Marca.tsx) — ficava sutilmente diferente do ícone real.
 *
 * Fonte: var(--font-marca) — DM Sans, injetada por next/font em
 * app/layout.tsx. NUNCA var(--font-display): esse token é a tipografia que o
 * CLIENTE escolhe para o site dele (Aparência > Personalizar), sobrescrita
 * via JS em lib/store.tsx.
 */

export function LogoPainel({ tamanho = 30, className }: { tamanho?: number; className?: string }) {
  return (
    <span className={className ? `inline-flex items-center gap-2.5 ${className}` : "inline-flex items-center gap-2.5"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.png"
        alt="SiteFlow"
        width={tamanho}
        height={tamanho}
        className="shrink-0 select-none"
        draggable={false}
      />
      <span
        className="font-bold tracking-tight text-ink"
        style={{ fontFamily: "var(--font-marca)", fontSize: tamanho * 0.72, lineHeight: 1 }}
      >
        SiteFlow
      </span>
    </span>
  );
}
