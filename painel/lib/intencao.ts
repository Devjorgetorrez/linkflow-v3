import type { Intencao } from "@/mock/types";

// Legenda única da intenção de busca (T/C/I/N) — usada em todas as telas de páginas.
export const INTENCAO_DETALHE: Record<Intencao, string> = {
  T: "Transacional",
  C: "Comercial",
  I: "Informacional",
  N: "Navegacional",
};
