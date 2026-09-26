/**
 * Testa painel/lib/site-config.ts contra os config/site.ts REAIS do projeto
 * (base + tema-03..07). Não escreve nada.
 *
 * Uso (Node >= 22):
 *   node --experimental-strip-types scripts/testes/testar_site_config.ts
 * Esperado: "TUDO OK" e saída 0.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aplicarPatch, lerSite, patchDeBody, literal, cnpjValido, enderecoFormatado,
} from "../../painel/lib/site-config.ts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CFG = path.join(RAIZ, "_astro/src/config");
const ARQUIVOS = ["site.ts", "tema-03.ts", "tema-04.ts", "tema-05.ts", "tema-06.ts", "tema-07.ts"];

let falhas = 0;
function ok(cond: unknown, nome: string, detalhe = "") {
  if (!cond) falhas++;
  console.log(`${cond ? "OK   " : "ERRO "}${nome}${!cond && detalhe ? "\n      " + detalhe : ""}`);
}
function linhasDiferentes(a: string, b: string): number {
  const la = a.split("\n"), lb = b.split("\n");
  let d = Math.abs(la.length - lb.length);
  for (let i = 0; i < Math.min(la.length, lb.length); i++) if (la[i] !== lb[i]) d++;
  return d;
}

// ── 0. validador de CNPJ ─────────────────────────────────────────────────
ok(cnpjValido("11.222.333/0001-81"), "cnpjValido aceita CNPJ com dígito verificador certo");
ok(!cnpjValido("11.222.333/0001-44"), "cnpjValido recusa dígito verificador errado (os CNPJs de demonstração)");
ok(!cnpjValido("123") && !cnpjValido("4343434343434343434") && !cnpjValido("00000000000000"), "cnpjValido recusa '123', 19 dígitos e zeros");

for (const arq of ARQUIVOS) {
  const src = fs.readFileSync(path.join(CFG, arq), "utf-8").replace(/\r\n/g, "\n");
  console.log(`\n=== ${arq}`);

  // ── 1. o scanner enxerga as mesmas chaves de topo que um regex de 2 espaços ──
  const site = lerSite(src);
  const i = src.indexOf("export const site");
  const chavesRegex = [...src.slice(i).matchAll(/^  ([A-Za-z_$][\w$]*)\s*:/gm)].map((m) => m[1]);
  ok(site.nome && site.nap.telefone && site.nap.logradouro, "lê nome, telefone e logradouro", JSON.stringify({ n: site.nome, t: site.nap.telefone }));
  ok(chavesRegex.length > 10, `arquivo tem ${chavesRegex.length} chaves de topo (fixture não é trivial)`);

  // ── 2. patch idêntico não muda nada (byte a byte) ──
  const igual = aplicarPatch(src, { nome: site.nome, nap: { bairro: site.nap.bairro ?? "", telefone: site.nap.telefone }, slogan: site.slogan });
  ok(igual.src === src && igual.alterados.length === 0 && !Object.keys(igual.erros).length, "patch com os mesmos valores é idempotente (byte a byte)", JSON.stringify(igual.alterados));

  // ── 3. alterar 1 campo muda só aquela linha ──
  const r3 = aplicarPatch(src, { nap: { bairro: "Bairro Novo" } });
  ok(r3.alterados.includes("nap.bairro"), "nap.bairro alterado");
  const dif = linhasDiferentes(src, r3.src);
  const esperadoDif = 1 + (site.nap.enderecoFormatado !== undefined ? 1 : 0);
  ok(dif === esperadoDif, `só ${esperadoDif} linha(s) mudam (bairro${esperadoDif > 1 ? " + enderecoFormatado" : ""})`, `mudaram ${dif}`);
  ok(lerSite(r3.src).nap.bairro === "Bairro Novo", "relendo o resultado, o bairro é o novo");
  if (site.nap.enderecoFormatado !== undefined) {
    ok(lerSite(r3.src).nap.enderecoFormatado?.includes("Bairro Novo"), "enderecoFormatado recalculado com o bairro novo", lerSite(r3.src).nap.enderecoFormatado);
  }

  // ── 4. chave ausente é INSERIDA (era o A87: telefone2 sumia em silêncio) ──
  const semT2 = site.nap.telefone2 === undefined;
  const r4 = aplicarPatch(src, { nap: { telefone2: "(11) 3333-4444" } });
  ok(lerSite(r4.src).nap.telefone2 === "(11) 3333-4444", semT2 ? "telefone2 ausente foi INSERIDO" : "telefone2 existente foi alterado");
  ok(r4.alterados.includes("nap.telefone2"), "telefone2 consta como alterado");

  // ── 5. valores com $ { } \ ' " são preservados (o antigo sanitizarValor os apagava) ──
  const estranho = "R$ 10 — O'Brien \"x\" \\ {a}";
  const r5 = aplicarPatch(src, { nome: estranho });
  ok(lerSite(r5.src).nome === estranho, "nome com $, aspas, barra e chaves faz ida e volta sem perda", String(lerSite(r5.src).nome));

  // ── 6. validação barra e NÃO altera o texto ──
  const r6 = aplicarPatch(src, { nap: { cep: "abcde", telefone: "telefone-xyz", email: "x", uf: "S", whatsapp: "12" }, cnpj: "123" });
  ok(r6.src === src, "com erro de validação, o texto fica IGUAL ao original");
  ok(["nap.cep", "nap.telefone", "nap.email", "nap.uf", "nap.whatsapp", "cnpj"].every((k) => r6.erros[k]), "erros para cep, telefone, e-mail, uf, whatsapp e cnpj", JSON.stringify(Object.keys(r6.erros)));

  // ── 7. vazio sobre valor existente é ignorado, salvo com `limpar` (era o A63) ──
  if (site.nap.bairro) {
    const r7 = aplicarPatch(src, { nap: { bairro: "" } });
    ok(r7.src === src && r7.ignorados.some((x) => x.campo === "nap.bairro"), "bairro vazio sem confirmação é IGNORADO (não apaga)");
    const r7b = aplicarPatch(src, { nap: { bairro: "" }, limpar: ["nap.bairro"] });
    ok(lerSite(r7b.src).nap.bairro === "", "bairro vazio COM `limpar` apaga de propósito");
  }

  // ── 8. horários ──
  const novosH = [{ dia: "Seg a Sex", hora: "9h às 17h" }, { dia: "Sáb", hora: "9h às 12h" }];
  const r8 = aplicarPatch(src, { horarios: novosH });
  ok(JSON.stringify(lerSite(r8.src).horarios) === JSON.stringify(novosH), "horários substituídos e relidos iguais");
  if (site.horarios.length) {
    const r8b = aplicarPatch(src, { horarios: [] });
    ok(r8b.src === src && r8b.ignorados.some((x) => x.campo === "horarios"), "lista de horários vazia sem confirmação é ignorada");
  }

  // ── 9. redes: alterar existente, acrescentar ausente, remover com `limpar` ──
  const temInsta = site.redes.some((r) => r.nome.toLowerCase() === "instagram");
  const r9 = aplicarPatch(src, { redes: { instagram: "https://instagram.com/novo" } });
  ok(lerSite(r9.src).redes.find((r) => r.nome === "Instagram")?.href === "https://instagram.com/novo", temInsta ? "href do Instagram existente alterado" : "Instagram ausente foi ACRESCENTADO");
  const outros = lerSite(r9.src).redes.filter((r) => r.nome !== "Instagram").length === site.redes.filter((r) => r.nome !== "Instagram").length;
  ok(outros, "as outras redes ficaram intactas");
  const r9b = aplicarPatch(r9.src, { redes: { instagram: "" }, limpar: ["redes.instagram"] });
  ok(!lerSite(r9b.src).redes.some((r) => r.nome === "Instagram"), "rede removida com `limpar`");
  ok(lerSite(r9b.src).redes.length === site.redes.filter((r) => r.nome !== "Instagram").length, "só a rede pedida foi removida");
  const r9c = aplicarPatch(r9.src, { redes: { instagram: "" } });
  ok(r9c.src === r9.src, "rede vazia sem `limpar` é ignorada");

  // ── 10. integração ausente é inserida ──
  const r10 = aplicarPatch(src, { googleAnalyticsId: "G-ABC123XYZ" });
  ok(lerSite(r10.src).googleAnalyticsId === "G-ABC123XYZ", "googleAnalyticsId inserido/gravado");

  // ── 11. blocos que o painel não conhece ficam intactos ──
  for (const marcador of ["legal:", "faq:", "nav:"]) {
    if (src.includes(`\n  ${marcador}`)) {
      const trecho = (t: string) => { const k = t.indexOf(`\n  ${marcador}`); return t.slice(k, k + 400); };
      ok(trecho(r3.src) === trecho(src), `bloco '${marcador}' idêntico depois de editar o bairro`);
    }
  }

  // ── 12. dominio sem protocolo ganha https:// ──
  const r12 = aplicarPatch(src, { dominio: "www.meusite.com.br/" });
  ok(lerSite(r12.src).dominio === "https://www.meusite.com.br", "domínio sem protocolo vira https:// e perde a barra final", String(lerSite(r12.src).dominio));

  // ── 13. cnpj 'não possui' e limpar ──
  const r13 = aplicarPatch(src, { cnpj: "não possui" });
  ok(lerSite(r13.src).cnpj === "não possui", "CNPJ 'não possui' aceito");
}

// ── fixture mínima: arquivo sem vírgula final, sem nap.telefone2, com comentários ──
console.log("\n=== fixture mínima");
const mini = `// cabeçalho
export const site = {
  nome: "Clínica X", // comentário
  nap: {
    cidade: 'São Paulo',
    telefone: '(11) 99999-0000' /* sem vírgula */
  },
  redes: [],
  horarios: [],
  extra: { a: [1, 2, { b: "}" }] },
}
`;
const m1 = aplicarPatch(mini, { nap: { telefone2: "(11) 3333-4444", uf: "sp" }, nome: "Clínica Y" });
ok(lerSite(m1.src).nap.telefone2 === "(11) 3333-4444" && lerSite(m1.src).nap.uf === "SP", "insere em objeto cuja última entrada não tem vírgula; uf vira maiúscula");
ok(m1.src.includes("// comentário") && m1.src.includes("/* sem vírgula */") && m1.src.includes('extra: { a: [1, 2, { b: "}" }] }'), "comentários e bloco desconhecido com '}' em string preservados");
ok(lerSite(m1.src).nap.telefone === "(11) 99999-0000", "o telefone existente não foi tocado");
let lancou = false;
try { lerSite("export const outro = {}"); } catch { lancou = true; }
ok(lancou, "arquivo sem 'export const site' lança erro claro");
ok(literal("a'b\\c") === "'a\\'b\\\\c'", "literal() escapa aspa e barra");
ok(enderecoFormatado({ logradouro: "Rua A, 1", complemento: "Sala 2", bairro: "Centro", cidade: "Londrina", uf: "pr", cep: "86010-450" }) === "Rua A, 1 — Sala 2, Centro, Londrina — PR · CEP 86010-450", "enderecoFormatado segue o padrão dos layouts");

// ── patchDeBody ──
console.log("\n=== patchDeBody");
const pb = patchDeBody({ tagline: "Slogan novo", cep: "13201-000", nap: { bairro: "Centro" }, instagram: "https://x.com/a", descricaoSite: "x", logo: "y" });
ok(pb.patch.slogan === "Slogan novo", "tagline vira slogan");
ok(pb.patch.nap?.cep === "13201-000" && pb.patch.nap?.bairro === "Centro", "campos soltos e aninhados do nap são juntados");
ok(pb.naoSuportados.includes("descricaoSite") && pb.naoSuportados.includes("logo"), "descricaoSite e logo são reportados como NÃO gravados");

console.log(falhas ? `\n${falhas} FALHA(S)` : "\nTUDO OK");
process.exit(falhas ? 1 : 0);
