/**
 * lib/permissoes-paginas.ts — quem pode abrir cada TELA do painel (PURA, sem fs:
 * roda na edge, no middleware, e no cliente, na Sidebar).
 *
 * Fonte única para o middleware (bloqueia) e para a Sidebar (desabilita o item).
 * Cada tela herda a regra da API que ela precisa para funcionar (MATRIZ), então
 * as duas camadas não divergem. Vale o prefixo MAIS ESPECÍFICO; rota sem regra
 * é liberada a qualquer usuário logado.
 */

import { papelPermitido, type ChaveMatriz } from "@/lib/permissoes";

const REGRAS_PAGINAS: ReadonlyArray<{ prefixo: string; chave: ChaveMatriz }> = [
  { prefixo: "/usuarios", chave: "usuarios:GET" },
  { prefixo: "/configuracoes", chave: "config:PATCH" },
  { prefixo: "/privacidade", chave: "config:PATCH" },
  { prefixo: "/aparencia", chave: "layout:GET" },
  { prefixo: "/paginas/menus", chave: "menus:GET" },
  { prefixo: "/seo/robots", chave: "robots:GET" },
  { prefixo: "/seo/llms", chave: "llms:GET" },
  { prefixo: "/formularios", chave: "formularios:GET" },
  { prefixo: "/leads", chave: "leads:GET" },
  { prefixo: "/tarefas", chave: "tarefas:GET" },
];

function casa(caminho: string, prefixo: string): boolean {
  return caminho === prefixo || caminho.startsWith(prefixo + "/");
}

export function paginaPermitida(caminho: string, papel: string | undefined): boolean {
  let melhor: (typeof REGRAS_PAGINAS)[number] | null = null;
  for (const r of REGRAS_PAGINAS) {
    if (casa(caminho, r.prefixo) && (!melhor || r.prefixo.length > melhor.prefixo.length)) melhor = r;
  }
  return melhor ? papelPermitido(melhor.chave, papel) : true;
}
