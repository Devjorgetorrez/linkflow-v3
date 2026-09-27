/**
 * lib/frontmatter-post.ts — tradução entre o Post do painel e o frontmatter
 * que o site Astro lê (schema `posts` em _astro/src/content.config.ts).
 *
 * O painel usa nomes próprios (metaDescription, categoriaId, autorId, data)
 * e o site usa outros (metaDescription, categoria, autor, publicadoEm).
 * Antes desta camada, criar um post pelo painel gravava `descricao` no lugar
 * de `metaDescription` — campo obrigatório no site — e o build do site
 * inteiro quebrava no primeiro post criado. A edição, por sua vez, espalhava
 * no arquivo qualquer campo do painel com o nome do painel.
 *
 * Regra: só campos que o site conhece são gravados, sempre com o nome do
 * site. Campo ausente no patch não é tocado (a edição preserva o resto).
 */

type Entrada = Record<string, unknown>;

function texto(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v);
  return s;
}

/** faq do painel → só itens com pergunta E resposta, sem o id de tela. undefined = não é lista. */
export function faqCompleto(v: unknown): { pergunta: string; resposta: string }[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const itens: { pergunta: string; resposta: string }[] = [];
  for (const f of v) {
    if (!f || typeof f !== "object") continue;
    const pergunta = String((f as Record<string, unknown>).pergunta ?? "").trim();
    const resposta = String((f as Record<string, unknown>).resposta ?? "").trim();
    if (pergunta && resposta) itens.push({ pergunta, resposta });
  }
  return itens;
}

/** Lista de textos sem vazios e sem repetidos. undefined = não é lista. */
export function listaLimpa(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const x of v) {
    const t = String(x ?? "").trim();
    const k = t.toLowerCase();
    if (t && !vistos.has(k)) {
      vistos.add(k);
      saida.push(t);
    }
  }
  return saida;
}

/** Converte um patch/objeto do painel em campos de frontmatter do site. */
export function painelParaFrontmatter(entrada: Entrada): Record<string, unknown> {
  const fm: Record<string, unknown> = {};
  const def = (chave: string, valor: unknown) => {
    if (valor !== undefined) fm[chave] = valor;
  };

  def("titulo", texto(entrada.titulo));
  def("metaDescription", texto(entrada.metaDescription ?? entrada.descricao));
  def("publicadoEm", texto(entrada.publicadoEm ?? entrada.data));
  def("categoria", texto(entrada.categoria ?? entrada.categoriaId));
  def("autor", texto(entrada.autor ?? entrada.autorId));
  def("status", texto(entrada.status));
  def("palavraChave", texto(entrada.palavraChave ?? entrada.kwPrimaria));
  if (entrada.destaque !== undefined) fm.destaque = Boolean(entrada.destaque);

  // Campos de SEO e capa: só o que tem conteúdo entra aqui. Esvaziar (texto vazio,
  // noindex desligado, lista vazia) NÃO grava valor vazio: a linha sai do arquivo
  // (camposParaLimpar em lib/posts-campos.ts) — vazio significa "automático".
  const cheio = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);
  def("seoTitle", cheio(entrada.seoTitle));
  def("resumo", cheio(entrada.resumo));
  def("canonical", cheio(entrada.canonical));
  def("imagemCapa", cheio(entrada.capa ?? entrada.imagemCapa));
  def("imagemCapaAlt", cheio(entrada.capaAlt ?? entrada.imagemCapaAlt));
  if (entrada.noindex === true) fm.noindex = true;
  if (entrada.geradoPorIA === true) fm.geradoPorIA = true;
  const faq = faqCompleto(entrada.faq);
  if (faq && faq.length > 0) fm.faq = faq;
  const kws = listaLimpa(entrada.kwSecundarias);
  if (kws && kws.length > 0) fm.kwSecundarias = kws;
  if (entrada.corpoFormato === "html") fm.corpoFormato = "html";

  // Strings vazias não sobrescrevem nada útil — melhor omitir do que gravar
  // "categoria:" em branco. Exceção: metaDescription/titulo vazios são
  // gravados, para o site acusar a pendência em vez de manter texto antigo.
  for (const chave of ["categoria", "autor", "palavraChave", "publicadoEm", "status"]) {
    if (fm[chave] === "") delete fm[chave];
  }
  return fm;
}
