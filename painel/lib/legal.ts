/**
 * lib/legal.ts — ponte entre as telas Privacidade (Política, Termos,
 * Cookies) e o `site.legal` que o site realmente publica.
 *
 * As 3 telas usam um modelo simplificado (LegalPainel, persistido em
 * dados/legal.json — mesmo padrão de lib/dados.ts). O site (ConteudoLegal.astro)
 * lê um objeto bem mais estruturado em config/site.ts (`legal: {...}`,
 * arrays de basesLegais/retencao/compartilhamento/cookies/formularios).
 * Este arquivo sintetiza o segundo a partir do primeiro — nunca o
 * contrário: dados/legal.json é a fonte de verdade da UI, o bloco
 * `legal:` do site.ts é gerado (substituído por inteiro a cada salvamento).
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

const LABEL_BASE_LEGAL: Record<Exclude<BaseLegalId, "">, string> = {
  "consentimento": "Consentimento (art. 7º, I)",
  "execucao-contrato": "Execução de contrato (art. 7º, V)",
  "legitimo-interesse": "Legítimo interesse (art. 7º, IX)",
  "obrigacao-legal": "Obrigação legal (art. 7º, II)",
};

function labelBaseLegal(id: BaseLegalId): string {
  return id ? (LABEL_BASE_LEGAL[id] ?? id) : "";
}

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
  foroCidade: "",
  foroUf: "",
  vigenciaDesde: "",
};

interface FormularioResumo {
  nome: string;
  campos: string; // já formatado "Nome, e-mail, telefone"
  finalidade: string;
}

function escaparAspaSimples(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function linha(campo: string, valor: string, indent = "    "): string {
  return `${indent}${campo}: '${escaparAspaSimples(valor)}',`;
}

function gerarTransferenciaInternacional(p: LegalPainel): string {
  if (!p.transferenciaInternacional) {
    return "Não realizamos transferência internacional de dados pessoais.";
  }
  const destinos = p.paisesTransferencia.trim() || "servidores fora do Brasil";
  return (
    `Há transferência internacional. Parte dos dados é processada em ${destinos}, ` +
    "com base em cláusulas contratuais padrão do fornecedor e alcançando apenas os " +
    "dados necessários para o funcionamento das ferramentas contratadas."
  );
}

function gerarEncarregado(p: LegalPainel): { nomeado: boolean; canal: string; observacao: string } {
  const nomeado = !!(p.dpNome.trim() && p.dpEmail.trim());
  if (nomeado) {
    return { nomeado: true, canal: p.dpEmail.trim(), observacao: "" };
  }
  return {
    nomeado: false,
    canal: p.emailContato.trim(),
    observacao:
      "Agente de pequeno porte — canal de atendimento ao titular em vez de encarregado nomeado, " +
      "conforme Resolução CD/ANPD nº 2/2022.",
  };
}

/**
 * Gera o CONTEÚDO do bloco `legal: { ... }` (sem a linha `legal: {` nem o
 * `},` de fechamento — quem chama decide a indentação de fora).
 */
export function gerarBlocoLegal(
  p: LegalPainel,
  ctx: { exemploAtual: boolean; formularios: FormularioResumo[]; razaoSocial: string },
): string {
  const encarregado = gerarEncarregado(p);
  const linhas: string[] = [];

  linhas.push(`    exemplo: ${ctx.exemploAtual ? "true" : "false"},`);
  linhas.push(linha("versaoPolitica", p.versaoPolitica || "1.0"));
  linhas.push(linha("atualizadaEm", p.atualizadaEm));
  linhas.push("");

  linhas.push("    controlador: {");
  linhas.push(linha("razaoSocial", ctx.razaoSocial, "      "));
  linhas.push(linha("cnpj", p.cnpj, "      "));
  linhas.push(linha("endereco", p.endereco, "      "));
  linhas.push("    },");
  linhas.push("");

  linhas.push("    encarregado: {");
  linhas.push(`      nomeado: ${encarregado.nomeado ? "true" : "false"},`);
  linhas.push(linha("canal", encarregado.canal, "      "));
  linhas.push(linha("observacao", encarregado.observacao, "      "));
  linhas.push("    },");
  linhas.push("");

  linhas.push(linha("canalTitular", p.emailContato));
  linhas.push("");

  const basesLegais: { finalidade: string; base: string }[] = [];
  if (ctx.formularios.length > 0 && p.baseLegalFormularios) {
    basesLegais.push({ finalidade: "Resposta a formulário do site", base: labelBaseLegal(p.baseLegalFormularios) });
  }
  if (p.baseLegalAnaliticos) {
    basesLegais.push({ finalidade: "Medição de audiência do site", base: labelBaseLegal(p.baseLegalAnaliticos) });
  }
  if (p.baseLegalMarketing) {
    basesLegais.push({ finalidade: "Publicidade e remarketing", base: labelBaseLegal(p.baseLegalMarketing) });
  }
  linhas.push("    basesLegais: [");
  for (const b of basesLegais) {
    linhas.push(`      { finalidade: '${escaparAspaSimples(b.finalidade)}', base: '${escaparAspaSimples(b.base)}' },`);
  }
  linhas.push("    ],");
  linhas.push("");

  const retencao: { finalidade: string; prazo: string }[] = [];
  if (ctx.formularios.length > 0 && p.retencaoFormularios) {
    retencao.push({ finalidade: "Contato enviado pelo formulário do site", prazo: p.retencaoFormularios });
  }
  if (p.retencaoAnaliticos) {
    retencao.push({ finalidade: "Dados de audiência do site", prazo: p.retencaoAnaliticos });
  }
  if (p.retencaoMarketing) {
    retencao.push({ finalidade: "Dados de publicidade e remarketing", prazo: p.retencaoMarketing });
  }
  linhas.push("    retencao: [");
  for (const r of retencao) {
    linhas.push(`      { finalidade: '${escaparAspaSimples(r.finalidade)}', prazo: '${escaparAspaSimples(r.prazo)}' },`);
  }
  linhas.push("    ],");
  linhas.push("");

  const compartilhamento: { destinatario: string; finalidade: string }[] = [
    { destinatario: "Provedor de hospedagem do site", finalidade: "Armazenamento das páginas e dos formulários" },
  ];
  if (p.baseLegalAnaliticos) {
    compartilhamento.push({ destinatario: "Ferramenta de medição de audiência", finalidade: "Estatística de acesso, apenas com consentimento" });
  }
  if (p.baseLegalMarketing) {
    compartilhamento.push({ destinatario: "Plataformas de anúncio contratadas", finalidade: "Medição de resultado de campanhas, apenas com consentimento" });
  }
  linhas.push("    compartilhamento: [");
  for (const c of compartilhamento) {
    linhas.push(`      { destinatario: '${escaparAspaSimples(c.destinatario)}', finalidade: '${escaparAspaSimples(c.finalidade)}' },`);
  }
  linhas.push("    ],");
  linhas.push("");

  linhas.push(linha("transferenciaInternacional", gerarTransferenciaInternacional(p)));
  linhas.push("");

  const cookies: { categoria: string; finalidade: string; retencao: string; base: string; compartilhamento: string }[] = [
    {
      categoria: "Necessários",
      finalidade: "Manter a sessão, lembrar a escolha do banner de cookies e proteger o formulário contra envio automatizado.",
      retencao: "12 meses",
      base: "Legítimo interesse",
      compartilhamento: "Nenhum",
    },
  ];
  if (p.baseLegalAnaliticos) {
    cookies.push({
      categoria: "Analíticos",
      finalidade: p.cookieAnaliticosFinalidade || "Contar visitas e medir de onde vem o acesso.",
      retencao: p.retencaoAnaliticos || "14 meses",
      base: labelBaseLegal(p.baseLegalAnaliticos),
      compartilhamento: "Ferramenta de medição de audiência",
    });
  }
  if (p.baseLegalMarketing) {
    cookies.push({
      categoria: "Marketing",
      finalidade: p.cookieMarketingFinalidade || "Medir o resultado de anúncios.",
      retencao: p.retencaoMarketing || "6 meses",
      base: labelBaseLegal(p.baseLegalMarketing),
      compartilhamento: "Plataformas de anúncio contratadas",
    });
  }
  if (p.cookieFuncionaisFinalidade.trim()) {
    cookies.push({
      categoria: "Funcionais",
      finalidade: p.cookieFuncionaisFinalidade,
      retencao: "6 meses",
      base: "Consentimento",
      compartilhamento: "Nenhum",
    });
  }
  linhas.push("    cookies: [");
  for (const c of cookies) {
    linhas.push(
      `      { categoria: '${escaparAspaSimples(c.categoria)}', finalidade: '${escaparAspaSimples(c.finalidade)}', ` +
      `retencao: '${escaparAspaSimples(c.retencao)}', base: '${escaparAspaSimples(c.base)}', ` +
      `compartilhamento: '${escaparAspaSimples(c.compartilhamento)}' },`,
    );
  }
  linhas.push("    ],");
  linhas.push("");

  linhas.push("    formularios: [");
  for (const f of ctx.formularios) {
    linhas.push(
      `      { nome: '${escaparAspaSimples(f.nome)}', campos: '${escaparAspaSimples(f.campos)}', ` +
      `finalidade: '${escaparAspaSimples(f.finalidade)}' },`,
    );
  }
  linhas.push("    ],");
  linhas.push("");

  linhas.push("    medicao: [");
  if (p.baseLegalAnaliticos) {
    linhas.push(
      "      { ferramenta: 'Medição de audiência do site', dado: 'Páginas visitadas, origem do acesso e tipo de dispositivo.' },",
    );
  }
  linhas.push("    ],");
  linhas.push("");

  linhas.push("    termos: {");
  linhas.push(linha("naoSubstitui", "O conteúdo deste site tem finalidade informativa e não substitui o atendimento profissional prestado pelo negócio. Para o seu caso específico, procure os canais de contato do site.", "      "));
  linhas.push(`      foro: { cidade: '${escaparAspaSimples(p.foroCidade)}', uf: '${escaparAspaSimples(p.foroUf)}' },`);
  linhas.push(linha("vigenciaDesde", p.vigenciaDesde, "      "));
  linhas.push("    },");

  return linhas.join("\n");
}
