/*
 * Grupos de utilitário que competem pela mesma propriedade CSS. Quando duas
 * classes do mesmo grupo aparecem, a última vence — que é o que se espera ao
 * passar className por cima do estilo base de um componente. Sem isso quem
 * decide é a ordem da folha de estilo, e o override silenciosamente não pega.
 */
const GRUPOS = [
  "min-w",
  "max-w",
  "min-h",
  "max-h",
  "w",
  "h",
  "px",
  "py",
  "pt",
  "pb",
  "pl",
  "pr",
  "p",
  "gap",
  "rounded",
];

export function cn(...classes: Array<string | false | null | undefined>) {
  const lista = classes.filter(Boolean).join(" ").split(/[ ]+/).filter(Boolean);
  const saida: string[] = [];
  const posicao = new Map<string, number>();

  for (const classe of lista) {
    const partes = classe.split(":");
    const utilitario = partes.pop() as string;
    const variantes = partes.join(":");
    const grupo = GRUPOS.find((g) => utilitario.startsWith(g + "-"));

    if (!grupo) {
      saida.push(classe);
      continue;
    }

    const chave = variantes + "|" + grupo;
    const anterior = posicao.get(chave);
    if (anterior !== undefined) saida[anterior] = "";
    posicao.set(chave, saida.length);
    saida.push(classe);
  }

  return saida.filter(Boolean).join(" ");
}

export function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function formatarData(iso: string) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia} ${MESES[Number(mes) - 1]} ${ano}`;
}

export function formatarBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function contarPalavras(html: string) {
  const texto = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!texto) return 0;
  return texto.split(/\s+/).length;
}

export function tempoLeitura(palavras: number) {
  return Math.max(1, Math.round(palavras / 220));
}

/* ---------- contraste ---------- */

function hexParaRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return [0, 0, 0];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function luminancia(hex: string) {
  const [r, g, b] = hexParaRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function razaoContraste(a: string, b: string) {
  const la = luminancia(a);
  const lb = luminancia(b);
  const claro = Math.max(la, lb);
  const escuro = Math.min(la, lb);
  return (claro + 0.05) / (escuro + 0.05);
}

export function hexValido(valor: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(valor.trim());
}
