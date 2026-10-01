/**
 * lib/formularios-regras.ts — regras PURAS de formulários e de submissão de leads.
 * Sem fs nem React: roda no servidor (rotas) e no navegador (validação antes de enviar).
 */
import type { CampoFormulario, Formulario, TipoCampo } from "@/mock/types";

export const TIPOS_CAMPO: TipoCampo[] = [
  "nome", "email", "telefone", "assunto", "mensagem", "data", "selecao", "checkbox", "anexo",
];

export const MSG_SUCESSO_PADRAO = "Mensagem enviada com sucesso. Entraremos em contato em breve.";
export const MSG_ERRO_PADRAO = "Não foi possível enviar sua mensagem. Tente novamente em instantes.";
export const LGPD_TEXTO_PADRAO =
  "Concordo com o uso dos meus dados para resposta a esta mensagem, conforme a Política de Privacidade.";

/** Formulário "contato" que o site já traz. Nunca sobrescreve um existente. */
export function formularioPadraoContato(): Formulario {
  return {
    id: "contato",
    nome: "Contato",
    campos: [
      { id: "campo-nome", tipo: "nome", rotulo: "Nome", obrigatorio: true, ajuda: "" },
      { id: "campo-email", tipo: "email", rotulo: "E-mail", obrigatorio: false, ajuda: "" },
      { id: "campo-telefone", tipo: "telefone", rotulo: "Telefone", obrigatorio: false, ajuda: "" },
      { id: "campo-mensagem", tipo: "mensagem", rotulo: "Mensagem", obrigatorio: false, ajuda: "" },
    ],
    msgSucesso: MSG_SUCESSO_PADRAO,
    msgErro: MSG_ERRO_PADRAO,
    exigeLgpd: true,
    lgpdTexto: LGPD_TEXTO_PADRAO,
    lgpdPoliticaUrl: "",
    usadoEm: [],
    envios30d: 0,
    ativo: true,
  };
}

export function emailValido(v: string): boolean {
  return v.length <= 200 && /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/.test(v);
}

export function digitos(v: string): string {
  return v.replace(/\D/g, "");
}

export function telefoneValido(v: string): boolean {
  const n = digitos(v).length;
  return n >= 8 && n <= 15;
}

/** Número para wa.me: só dígitos, com 55 na frente se for número brasileiro sem DDI. */
export function numeroWhatsApp(tel: string): string {
  const d = digitos(tel);
  if (!d) return "";
  if (d.startsWith("55") && d.length >= 12) return d;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

// ─── Validação do formulário (criar/editar) ──────────────────────────────────

export interface ResultadoForm {
  ok: boolean;
  /** Mapa campo→mensagem ("nome", "campos", "campos.2.rotulo", "msgSucesso"…). */
  erros: Record<string, string>;
  /** Primeira mensagem, para exibir no topo. */
  erro: string;
  valor?: Omit<Formulario, "id" | "usadoEm" | "envios30d">;
}

const txt = (v: unknown) => (typeof v === "string" ? v : "");

export function validarFormulario(body: unknown): ResultadoForm {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const erros: Record<string, string> = {};

  const nome = txt(b.nome).trim();
  if (nome.length < 2 || nome.length > 80) erros.nome = "O nome do formulário deve ter entre 2 e 80 caracteres.";

  const brutos = Array.isArray(b.campos) ? b.campos : [];
  const campos: CampoFormulario[] = [];
  if (brutos.length === 0) erros.campos = "Adicione ao menos um campo ao formulário.";
  if (brutos.length > 30) erros.campos = "Um formulário pode ter no máximo 30 campos.";
  const rotulos = new Set<string>();
  const ids = new Set<string>();
  brutos.slice(0, 30).forEach((raw, i) => {
    const c = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const chave = `campos.${i}`;
    const tipo = txt(c.tipo) as TipoCampo;
    const rotulo = txt(c.rotulo).trim();
    if (!TIPOS_CAMPO.includes(tipo)) erros[`${chave}.tipo`] = "Tipo de campo inválido.";
    if (!rotulo) erros[`${chave}.rotulo`] = "Todo campo precisa de um rótulo.";
    else if (rotulo.length > 60) erros[`${chave}.rotulo`] = "O rótulo pode ter no máximo 60 caracteres.";
    else if (rotulos.has(rotulo.toLowerCase())) erros[`${chave}.rotulo`] = `O rótulo "${rotulo}" está repetido.`;
    rotulos.add(rotulo.toLowerCase());
    let id = txt(c.id).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    if (!id || ids.has(id)) id = `campo-${i + 1}-${Math.random().toString(36).slice(2, 7)}`;
    ids.add(id);
    const campo: CampoFormulario = {
      id, tipo, rotulo,
      obrigatorio: c.obrigatorio === true,
      ajuda: txt(c.ajuda).trim().slice(0, 200),
    };
    if (tipo === "selecao") {
      const ops = (Array.isArray(c.opcoes) ? c.opcoes : []).map((o) => txt(o).trim()).filter(Boolean);
      if (ops.length === 0) erros[`${chave}.opcoes`] = "Informe ao menos uma opção para a seleção.";
      else if (new Set(ops.map((o) => o.toLowerCase())).size !== ops.length) erros[`${chave}.opcoes`] = "Há opções repetidas.";
      campo.opcoes = ops.slice(0, 50).map((o) => o.slice(0, 100));
    }
    campos.push(campo);
  });

  const msgSucesso = txt(b.msgSucesso).trim() || MSG_SUCESSO_PADRAO;
  const msgErro = txt(b.msgErro).trim() || MSG_ERRO_PADRAO;
  if (msgSucesso.length > 300) erros.msgSucesso = "A mensagem de sucesso pode ter no máximo 300 caracteres.";
  if (msgErro.length > 300) erros.msgErro = "A mensagem de erro pode ter no máximo 300 caracteres.";

  const exigeLgpd = b.exigeLgpd === true;
  const lgpdTexto = txt(b.lgpdTexto).trim();
  if (exigeLgpd && !lgpdTexto) erros.lgpdTexto = "Informe o texto de consentimento ou desligue a exigência de LGPD.";
  if (lgpdTexto.length > 500) erros.lgpdTexto = "O texto de consentimento pode ter no máximo 500 caracteres.";
  const lgpdPoliticaUrl = txt(b.lgpdPoliticaUrl).trim().slice(0, 300);

  const chaves = Object.keys(erros);
  if (chaves.length) return { ok: false, erros, erro: erros[chaves[0]] };
  return {
    ok: true, erros: {}, erro: "",
    valor: { nome, campos, msgSucesso, msgErro, exigeLgpd, lgpdTexto, lgpdPoliticaUrl, ativo: b.ativo !== false },
  };
}

/** Id único a partir do nome ("Contato" → "contato", "contato-2"…). */
export function idUnico(nome: string, existentes: string[], slugify: (s: string) => string): string {
  const base = (slugify(nome) || "formulario").slice(0, 40).replace(/-+$/, "") || "formulario";
  let id = base;
  for (let n = 2; existentes.includes(id); n++) id = `${base}-${n}`;
  return id;
}

// ─── Validação da submissão (site → painel) ──────────────────────────────────

export interface SubmissaoValida {
  nome: string; email: string; telefone: string; mensagem: string;
  camposExtras: Record<string, string>;
}

export function validarSubmissao(
  b: Record<string, unknown>,
  formulario: Formulario | undefined,
): { ok: true; valor: SubmissaoValida } | { ok: false; erros: Record<string, string> } {
  const erros: Record<string, string> = {};
  const bruto = (v: unknown) => String(v ?? "").trim();
  const cortar = (v: unknown, max: number) => bruto(v).slice(0, max);

  const nome = bruto(b.nome);
  if (nome.length < 2) erros.nome = "Informe seu nome (mínimo 2 letras).";
  else if (nome.length > 100) erros.nome = "O nome pode ter no máximo 100 caracteres.";

  const email = bruto(b.email);
  const telefone = bruto(b.telefone);
  if (email && !emailValido(email)) erros.email = "Informe um e-mail válido.";
  if (telefone && !telefoneValido(telefone)) erros.telefone = "Informe um telefone válido, com DDD (8 a 15 dígitos).";
  if (!erros.email && !erros.telefone && !email && !telefone) {
    erros.contato = "Informe um e-mail ou um telefone para retornarmos o contato.";
  }
  const mensagem = bruto(b.mensagem);
  if (mensagem.length > 2000) erros.mensagem = "A mensagem pode ter no máximo 2000 caracteres.";

  const extrasBrutos = (b.camposExtras && typeof b.camposExtras === "object" && !Array.isArray(b.camposExtras)
    ? b.camposExtras : {}) as Record<string, unknown>;
  const camposExtras: Record<string, string> = {};
  for (const [k, v] of Object.entries(extrasBrutos).slice(0, 20)) {
    camposExtras[cortar(k, 50)] = cortar(v, 500);
  }

  // Campos obrigatórios definidos no formulário (além das regras acima).
  for (const c of formulario?.campos ?? []) {
    if (!c.obrigatorio) continue;
    let valor = "";
    let chave = c.rotulo;
    if (c.tipo === "nome") { valor = nome; chave = "nome"; }
    else if (c.tipo === "email") { valor = email; chave = "email"; }
    else if (c.tipo === "telefone") { valor = telefone; chave = "telefone"; }
    else if (c.tipo === "mensagem") { valor = mensagem; chave = "mensagem"; }
    else valor = camposExtras[c.rotulo] ?? camposExtras[c.id] ?? camposExtras[c.tipo] ?? "";
    if (!valor && !erros[chave]) erros[chave] = `O campo "${c.rotulo}" é obrigatório.`;
  }

  if (Object.keys(erros).length) return { ok: false, erros };
  return { ok: true, valor: { nome, email, telefone, mensagem, camposExtras } };
}
