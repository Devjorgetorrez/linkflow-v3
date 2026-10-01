// Avaliação de contraste WCAG por par semântico.
// Cada token é testado contra o token com que convive na tela,
// não contra branco fixo.

export type ChaveToken =
  | "primary"
  | "primary-ink"
  | "secondary"
  | "accent"
  | "ink"
  | "ink-muted"
  | "surface"
  | "surface-2"
  | "line"
  | "success"
  | "danger";

export interface InfoContraste {
  ratio: number;
  label: string;
  minRatio: number;
  passa: boolean;
}

interface ParContraste {
  fg: string;
  bg: string;
  minRatio: number;
  label: string;
}

// fg/bg são chaves de token. Quando o token avaliado é o bg (ex: surface),
// o fg é o token que imprime sobre ele (ex: ink).
const PARES: Record<string, ParContraste> = {
  "primary":     { fg: "primary",     bg: "surface",     minRatio: 3.0, label: "cor primária sobre superfície" },
  "primary-ink": { fg: "primary-ink", bg: "primary",     minRatio: 4.5, label: "texto sobre primária" },
  "secondary":   { fg: "ink",         bg: "secondary",   minRatio: 4.5, label: "texto sobre secundária" },
  "accent":      { fg: "accent",      bg: "surface",     minRatio: 3.0, label: "destaque sobre superfície" },
  "ink":         { fg: "ink",         bg: "surface",     minRatio: 4.5, label: "texto sobre superfície" },
  "ink-muted":   { fg: "ink-muted",   bg: "surface",     minRatio: 4.5, label: "texto discreto sobre superfície" },
  "surface":     { fg: "ink",         bg: "surface",     minRatio: 4.5, label: "texto sobre superfície" },
  "surface-2":   { fg: "ink",         bg: "surface-2",   minRatio: 4.5, label: "texto sobre superfície elevada" },
  "line":        { fg: "line",        bg: "surface",     minRatio: 3.0, label: "borda sobre superfície" },
  "success":     { fg: "success",     bg: "surface",     minRatio: 3.0, label: "indicador positivo sobre superfície" },
  "danger":      { fg: "danger",      bg: "surface",     minRatio: 3.0, label: "indicador de erro sobre superfície" },
};

// ----- cálculo WCAG -----

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 0;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function avaliarToken(
  chave: string,
  tokens: Record<string, string>,
): InfoContraste {
  const par = PARES[chave];
  if (!par) {
    return { ratio: 1, label: "—", minRatio: 4.5, passa: false };
  }
  const fg = tokens[par.fg] ?? "#000000";
  const bg = tokens[par.bg] ?? "#ffffff";
  const ratio = contrastRatio(fg, bg);
  return { ratio, label: par.label, minRatio: par.minRatio, passa: ratio >= par.minRatio };
}
