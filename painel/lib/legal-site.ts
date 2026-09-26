/**
 * lib/legal-site.ts — ponte (pura, sem fs) entre o modelo das telas Privacidade
 * (LegalPainel) e o bloco `legal:` REAL do config/site.ts.
 *
 * Regra: o bloco `legal:` que o agente escreveu (bases legais, retenção,
 * compartilhamento, medição, observação do encarregado…) nunca é regenerado por
 * inteiro. Só o que a tela controla é gravado, e só o que MUDOU em relação ao
 * que já estava no site. Nada inventado: se a tela não tem valor, o texto que o
 * agente escreveu é preservado.
 *
 *  - importarLegal(src)  → LegalPainel lido do site (usado na primeira abertura
 *    das telas, quando ainda não existe dados/legal.json).
 *  - aplicarLegal(src, atual, novo, ctx) → grava no site só os campos alterados.
 *  - integracoesAtivas(src) → o que o site de fato carrega (GA/GTM/Pixel); é a
 *    fonte única para a Política, os Cookies e o SEO. Analíticos/Marketing só
 *    entram na lista de cookies se a integração existe.
 *  - validarLegal(novo, campos) → erros por campo (CNPJ, datas obrigatórias, UF).
 */

import {
  acrescentarElementoNaLista,
  atualizarElementoNaLista,
  cnpjValido,
  definirValorNoCaminho,
  lerListaNoCaminho,
  lerSite,
  lerValorNoCaminho,
  semCnpj,
  ufValida,
} from "./site-config";
import type { BaseLegalId, LegalPainel } from "./legal";
import { LEGAL_PAINEL_INICIAL } from "./legal";

const L = ["legal"];

const ROTULO_BASE: Record<Exclude<BaseLegalId, "">, string> = {
  "consentimento": "Consentimento (art. 7º, I)",
  "execucao-contrato": "Execução de contrato (art. 7º, V)",
  "legitimo-interesse": "Legítimo interesse (art. 7º, IX)",
  "obrigacao-legal": "Obrigação legal (art. 7º, II)",
};

function baseParaTexto(id: BaseLegalId): string {
  return id ? ROTULO_BASE[id] : "";
}

/** Texto do site → id da base legal ("" se não reconhecido). */
function textoParaBase(t: unknown): BaseLegalId {
  const s = String(t ?? "").toLowerCase();
  if (s.includes("consentimento")) return "consentimento";
  if (s.includes("contrato")) return "execucao-contrato";
  if (s.includes("legítimo") || s.includes("legitimo")) return "legitimo-interesse";
  if (s.includes("obriga")) return "obrigacao-legal";
  return "";
}

// ─── Integrações ativas ──────────────────────────────────────────────────────

export interface IntegracoesAtivas {
  analiticos: boolean; // GA4 ou GTM
  marketing: boolean; // Meta Pixel
  nomes: string[];
}

export function integracoesAtivas(src: string): IntegracoesAtivas {
  const s = lerSite(src);
  const nomes: string[] = [];
  if (s.googleAnalyticsId) nomes.push("Google Analytics 4");
  if (s.googleTagManagerId) nomes.push("Google Tag Manager");
  if (s.metaPixelId) nomes.push("Meta Pixel");
  return {
    analiticos: !!(s.googleAnalyticsId || s.googleTagManagerId),
    marketing: !!s.metaPixelId,
    nomes,
  };
}

// ─── Leitura: site → LegalPainel ─────────────────────────────────────────────

type Item = Record<string, unknown>;

const RX_FORM = /formul|contato|mensagem/i;
const RX_AUDI = /audi|medi|anal|estat/i;
const RX_MKT = /publicid|anunc|remarket|marketing/i;

function achaItem(lista: Item[], rx: RegExp, chave: string): Item | undefined {
  return lista.find((i) => rx.test(String(i[chave] ?? "")));
}

function cookieDe(cookies: Item[], inicio: string): Item | undefined {
  return cookies.find((c) => String(c.categoria ?? "").toLowerCase().startsWith(inicio));
}

export function importarLegal(src: string): LegalPainel {
  const base: LegalPainel = { ...LEGAL_PAINEL_INICIAL };
  const legal = lerValorNoCaminho(src, L) as Item | undefined;
  if (!legal || typeof legal !== "object") return base;

  const controlador = (legal.controlador ?? {}) as Item;
  const encarregado = (legal.encarregado ?? {}) as Item;
  const termos = (legal.termos ?? {}) as Item;
  const foro = (termos.foro ?? {}) as Item;
  const bases = lerListaNoCaminho(src, [...L, "basesLegais"]);
  const ret = lerListaNoCaminho(src, [...L, "retencao"]);
  const cookies = lerListaNoCaminho(src, [...L, "cookies"]);
  const trans = String(legal.transferenciaInternacional ?? "");

  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const nomeado = encarregado.nomeado === true;
  const canal = s(encarregado.canal);

  const ana = cookieDe(cookies, "anal");
  const mkt = cookieDe(cookies, "market");
  const fun = cookieDe(cookies, "funcion");

  const bForm = achaItem(bases, RX_FORM, "finalidade");
  const bAudi = ana ? undefined : achaItem(bases, RX_AUDI, "finalidade");
  const bMkt = mkt ? undefined : achaItem(bases, RX_MKT, "finalidade");
  const rForm = achaItem(ret, RX_FORM, "finalidade");
  const rAudi = achaItem(ret, RX_AUDI, "finalidade");
  const rMkt = achaItem(ret, RX_MKT, "finalidade");

  return {
    ...base,
    cnpj: s(controlador.cnpj),
    endereco: s(controlador.endereco),
    emailContato: s(legal.canalTitular),
    dpNome: "", // o site guarda só se há encarregado nomeado e o canal
    dpEmail: nomeado ? canal : "",
    baseLegalFormularios: bForm ? textoParaBase(bForm.base) : "",
    retencaoFormularios: rForm ? s(rForm.prazo) : "",
    baseLegalAnaliticos: ana ? textoParaBase(ana.base) : bAudi ? textoParaBase(bAudi.base) : "",
    retencaoAnaliticos: ana ? s(ana.retencao) : rAudi ? s(rAudi.prazo) : "",
    baseLegalMarketing: mkt ? textoParaBase(mkt.base) : bMkt ? textoParaBase(bMkt.base) : "",
    retencaoMarketing: mkt ? s(mkt.retencao) : rMkt ? s(rMkt.prazo) : "",
    transferenciaInternacional: trans !== "" && !/n[ãa]o realizamos/i.test(trans),
    paisesTransferencia: "",
    versaoPolitica: s(legal.versaoPolitica) || base.versaoPolitica,
    atualizadaEm: s(legal.atualizadaEm),
    cookieAnaliticosFinalidade: ana ? s(ana.finalidade) : "",
    cookieMarketingFinalidade: mkt ? s(mkt.finalidade) : "",
    cookieFuncionaisFinalidade: fun ? s(fun.finalidade) : "",
    naoSubstitui: s(termos.naoSubstitui),
    foroCidade: s(foro.cidade),
    foroUf: s(foro.uf),
    vigenciaDesde: s(termos.vigenciaDesde),
  };
}

// ─── Validação ───────────────────────────────────────────────────────────────

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function dataIsoValida(v: string): boolean {
  if (!ISO.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Valida só os campos que vieram no PATCH (`campos`). Chave = nome do campo do LegalPainel. */
export function validarLegal(novo: LegalPainel, campos: string[]): Record<string, string> {
  const e: Record<string, string> = {};
  const tem = (c: keyof LegalPainel) => campos.includes(c);
  if (tem("cnpj") && novo.cnpj.trim() && !semCnpj(novo.cnpj) && !cnpjValido(novo.cnpj)) {
    e.cnpj = "CNPJ inválido. Confira os dígitos ou escreva “não possui”.";
  }
  if (tem("atualizadaEm")) {
    if (!novo.atualizadaEm.trim()) e.atualizadaEm = "Informe a data da última atualização da política.";
    else if (!dataIsoValida(novo.atualizadaEm)) e.atualizadaEm = "Data inválida.";
  }
  if (tem("vigenciaDesde")) {
    if (!novo.vigenciaDesde.trim()) e.vigenciaDesde = "Informe desde quando os termos valem.";
    else if (!dataIsoValida(novo.vigenciaDesde)) e.vigenciaDesde = "Data inválida.";
  }
  if (tem("foroUf") && novo.foroUf.trim() && !ufValida(novo.foroUf)) e.foroUf = "UF inválida.";
  return e;
}

// ─── Escrita: só o que mudou ─────────────────────────────────────────────────

function mudou<K extends keyof LegalPainel>(a: LegalPainel, b: LegalPainel, ...ks: K[]): boolean {
  return ks.some((k) => a[k] !== b[k]);
}

function textoTransferencia(p: LegalPainel): string {
  if (!p.transferenciaInternacional) return "Não realizamos transferência internacional de dados pessoais.";
  const destinos = p.paisesTransferencia.trim() || "servidores fora do Brasil";
  return (
    `Há transferência internacional. Parte dos dados é processada em ${destinos}, ` +
    "com base em cláusulas contratuais padrão do fornecedor e alcançando apenas os " +
    "dados necessários para o funcionamento das ferramentas contratadas."
  );
}

/** Atualiza campos do primeiro item da lista que casa com `rx`; se não houver, acrescenta `novoItem` (se dado). */
function atualizarOuAcrescentar(
  src: string,
  caminho: string[],
  chave: string,
  rx: RegExp,
  campos: Record<string, string>,
  novoItem?: Record<string, string>,
): string {
  const lista = lerListaNoCaminho(src, caminho);
  const idx = lista.findIndex((i) => rx.test(String(i[chave] ?? "")));
  if (idx >= 0) return atualizarElementoNaLista(src, caminho, idx, campos).s;
  if (novoItem) return acrescentarElementoNaLista(src, caminho, novoItem);
  return src;
}

export interface CtxAplicarLegal {
  formulariosExistem: boolean;
}

/**
 * Grava no `legal:` do site apenas os campos de `novo` que diferem de `atual`.
 * Analíticos/Marketing só são criados em `cookies` se a integração existe no site.
 */
export function aplicarLegal(src: string, atual: LegalPainel, novo: LegalPainel, ctx: CtxAplicarLegal): string {
  let s = src;
  const def = (caminho: string[], v: unknown) => { s = definirValorNoCaminho(s, caminho, v).s; };
  const integ = integracoesAtivas(s);

  if (mudou(atual, novo, "versaoPolitica")) def([...L, "versaoPolitica"], novo.versaoPolitica || "1.0");
  if (mudou(atual, novo, "atualizadaEm")) def([...L, "atualizadaEm"], novo.atualizadaEm);
  if (mudou(atual, novo, "cnpj")) def([...L, "controlador", "cnpj"], novo.cnpj);
  if (mudou(atual, novo, "endereco")) def([...L, "controlador", "endereco"], novo.endereco);
  if (mudou(atual, novo, "emailContato")) def([...L, "canalTitular"], novo.emailContato);

  if (mudou(atual, novo, "dpNome", "dpEmail", "emailContato")) {
    const nomeado = !!(novo.dpNome.trim() && novo.dpEmail.trim()) || (!!novo.dpEmail.trim() && !!atual.dpEmail.trim());
    def([...L, "encarregado", "nomeado"], nomeado);
    def([...L, "encarregado", "canal"], nomeado ? novo.dpEmail.trim() : novo.emailContato.trim());
    if (nomeado) {
      def([...L, "encarregado", "observacao"], "");
    } else if (!lerValorNoCaminho(s, [...L, "encarregado", "observacao"])) {
      def(
        [...L, "encarregado", "observacao"],
        "Agente de pequeno porte — canal de atendimento ao titular em vez de encarregado nomeado, " +
          "conforme Resolução CD/ANPD nº 2/2022.",
      );
    }
  }

  if (mudou(atual, novo, "transferenciaInternacional", "paisesTransferencia")) {
    def([...L, "transferenciaInternacional"], textoTransferencia(novo));
  }

  if (mudou(atual, novo, "baseLegalFormularios") && ctx.formulariosExistem && novo.baseLegalFormularios) {
    s = atualizarOuAcrescentar(s, [...L, "basesLegais"], "finalidade", RX_FORM,
      { base: baseParaTexto(novo.baseLegalFormularios) },
      { finalidade: "Resposta a formulário do site", base: baseParaTexto(novo.baseLegalFormularios) });
  }
  if (mudou(atual, novo, "retencaoFormularios") && ctx.formulariosExistem && novo.retencaoFormularios) {
    s = atualizarOuAcrescentar(s, [...L, "retencao"], "finalidade", RX_FORM,
      { prazo: novo.retencaoFormularios },
      { finalidade: "Contato enviado pelo formulário do site", prazo: novo.retencaoFormularios });
  }

  // Categorias de cookie: só se a integração correspondente existe no site
  const cat = (nome: string, inicio: string, ativo: boolean, campos: Record<string, string>, novoItem: Record<string, string>) => {
    if (!ativo) return;
    const lista = lerListaNoCaminho(s, [...L, "cookies"]);
    const idx = lista.findIndex((c) => String(c.categoria ?? "").toLowerCase().startsWith(inicio));
    if (idx >= 0) s = atualizarElementoNaLista(s, [...L, "cookies"], idx, campos).s;
    else s = acrescentarElementoNaLista(s, [...L, "cookies"], { categoria: nome, ...novoItem });
  };
  const comp = (a: boolean) => (a ? "Ferramenta de medição de audiência" : "Plataformas de anúncio contratadas");

  if (mudou(atual, novo, "baseLegalAnaliticos", "retencaoAnaliticos", "cookieAnaliticosFinalidade") && novo.baseLegalAnaliticos) {
    const campos = {
      base: baseParaTexto(novo.baseLegalAnaliticos),
      ...(novo.retencaoAnaliticos ? { retencao: novo.retencaoAnaliticos } : {}),
      ...(novo.cookieAnaliticosFinalidade ? { finalidade: novo.cookieAnaliticosFinalidade } : {}),
    };
    cat("Analíticos", "anal", integ.analiticos, campos, {
      finalidade: novo.cookieAnaliticosFinalidade || "Contar visitas e medir de onde vem o acesso.",
      retencao: novo.retencaoAnaliticos || "14 meses",
      base: baseParaTexto(novo.baseLegalAnaliticos),
      compartilhamento: comp(true),
    });
  }
  if (mudou(atual, novo, "baseLegalMarketing", "retencaoMarketing", "cookieMarketingFinalidade") && novo.baseLegalMarketing) {
    const campos = {
      base: baseParaTexto(novo.baseLegalMarketing),
      ...(novo.retencaoMarketing ? { retencao: novo.retencaoMarketing } : {}),
      ...(novo.cookieMarketingFinalidade ? { finalidade: novo.cookieMarketingFinalidade } : {}),
    };
    cat("Marketing", "market", integ.marketing, campos, {
      finalidade: novo.cookieMarketingFinalidade || "Medir o resultado de anúncios.",
      retencao: novo.retencaoMarketing || "6 meses",
      base: baseParaTexto(novo.baseLegalMarketing),
      compartilhamento: comp(false),
    });
  }
  if (mudou(atual, novo, "cookieFuncionaisFinalidade") && novo.cookieFuncionaisFinalidade.trim()) {
    cat("Funcionais", "funcion", true, { finalidade: novo.cookieFuncionaisFinalidade }, {
      finalidade: novo.cookieFuncionaisFinalidade,
      retencao: "6 meses",
      base: "Consentimento",
      compartilhamento: "Nenhum",
    });
  }

  // Bases/retenção de audiência e publicidade: só se NÃO existe categoria de cookie correspondente
  // (nesse caso a categoria já carrega base e prazo) e a integração está ativa.
  if (integ.analiticos && mudou(atual, novo, "baseLegalAnaliticos", "retencaoAnaliticos")) {
    const temCookie = !!cookieDe(lerListaNoCaminho(s, [...L, "cookies"]), "anal");
    if (!temCookie) {
      if (novo.baseLegalAnaliticos) s = atualizarOuAcrescentar(s, [...L, "basesLegais"], "finalidade", RX_AUDI, { base: baseParaTexto(novo.baseLegalAnaliticos) }, { finalidade: "Medição de audiência do site", base: baseParaTexto(novo.baseLegalAnaliticos) });
      if (novo.retencaoAnaliticos) s = atualizarOuAcrescentar(s, [...L, "retencao"], "finalidade", RX_AUDI, { prazo: novo.retencaoAnaliticos }, { finalidade: "Dados de audiência do site", prazo: novo.retencaoAnaliticos });
    }
  }

  if (mudou(atual, novo, "naoSubstitui") && novo.naoSubstitui.trim()) def([...L, "termos", "naoSubstitui"], novo.naoSubstitui);
  if (mudou(atual, novo, "foroCidade", "foroUf")) def([...L, "termos", "foro"], { cidade: novo.foroCidade, uf: novo.foroUf });
  if (mudou(atual, novo, "vigenciaDesde")) def([...L, "termos", "vigenciaDesde"], novo.vigenciaDesde);

  return s;
}
