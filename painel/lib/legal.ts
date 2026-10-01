/**
 * lib/legal.ts — ponte entre as telas Privacidade (Política, Termos,
 * Cookies) e o `site.legal` que o site realmente publica.
 *
 * As 3 telas usam um modelo simplificado (LegalPainel, persistido em
 * dados/legal.json — mesmo padrão de lib/dados.ts). O site (ConteudoLegal.astro)
 * lê um objeto bem mais estruturado em config/site.ts (`legal: {...}`,
 * arrays de basesLegais/retencao/compartilhamento/cookies/formularios).
 * Este arquivo sintetiza o segundo a partir do primeiro — nunca o
 * contrário: dados/legal.json é o modelo da UI; o bloco `legal:` do site.ts
 * é editado campo a campo por lib/legal-site.ts (nunca regenerado por inteiro).
 *
 * Decisões de produto (confirmadas, 25/09/2026):
 * - legal.cookies[] é sintetizado das telas Política (base legal +
 *   retenção por categoria) e Cookies (texto de finalidade por categoria).
 * - legal.transferenciaInternacional é uma frase gerada a partir do toggle
 *   + campo "países/empresas" da tela Política.
 * - legal.termos.foro é {cidade, uf} — a tela Termos tem os 2 campos
 *   separados (não mais um "jurisdicao" livre).
 *
 * Campo vazio na UI não vira texto inventado aqui — fica vazio no site.ts
 * também, e o próprio ConteudoLegal.astro bloqueia a publicação (regra do
 * MD, já existente). Nada de placeholder.
 */

export type BaseLegalId =
  | "consentimento"
  | "execucao-contrato"
  | "legitimo-interesse"
  | "obrigacao-legal"
  | "";

export interface LegalPainel {
  // Controlador / DPO / canal (tela Política)
  cnpj: string;
  endereco: string;
  emailContato: string;
  dpNome: string;
  dpEmail: string;
  // Bases legais e retenção por finalidade (tela Política)
  baseLegalFormularios: BaseLegalId;
  retencaoFormularios: string;
  baseLegalAnaliticos: BaseLegalId;
  retencaoAnaliticos: string;
  baseLegalMarketing: BaseLegalId;
  retencaoMarketing: string;
  // Transferência internacional (tela Política)
  transferenciaInternacional: boolean;
  paisesTransferencia: string;
  // Versão e vigência da política (tela Política) — datas em ISO (yyyy-mm-dd)
  versaoPolitica: string;
  atualizadaEm: string;
  // Finalidade de cada categoria de cookie (tela Cookies)
  cookieAnaliticosFinalidade: string;
  cookieMarketingFinalidade: string;
  cookieFuncionaisFinalidade: string;
  // Termos de uso (tela Termos)
  naoSubstitui: string; // texto do NICHO do cliente — nunca genérico 
  foroCidade: string;
  foroUf: string;
  vigenciaDesde: string; // ISO (yyyy-mm-dd)
}

export const LEGAL_PAINEL_INICIAL: LegalPainel = {
  cnpj: "",
  endereco: "",
  emailContato: "",
  dpNome: "",
  dpEmail: "",
  baseLegalFormularios: "consentimento",
  retencaoFormularios: "5 anos",
  baseLegalAnaliticos: "legitimo-interesse",
  retencaoAnaliticos: "14 meses",
  baseLegalMarketing: "consentimento",
  retencaoMarketing: "90 dias",
  transferenciaInternacional: false,
  paisesTransferencia: "",
  versaoPolitica: "1.0",
  atualizadaEm: "",
  cookieAnaliticosFinalidade: "Google Analytics 4 — mede visitas, origem do tráfego e comportamento de navegação.",
  cookieMarketingFinalidade: "Meta Pixel e Google Ads — usados para exibir anúncios relevantes em outras plataformas.",
  cookieFuncionaisFinalidade: "Incorporações de mapa e vídeo que precisam de cookies para funcionar.",
  naoSubstitui: "",
  foroCidade: "",
  foroUf: "",
  vigenciaDesde: "",
};
