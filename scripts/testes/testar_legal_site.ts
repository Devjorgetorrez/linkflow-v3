/**
 * Testa painel/lib/legal-site.ts contra os config/site.ts REAIS (tema-03..07).
 * Não escreve nada no projeto. As libs usam imports sem extensão (Next); este
 * teste roda numa cópia temporária com ".ts" adicionado.
 *
 * Uso: node --experimental-strip-types scripts/testes/testar_legal_site.ts
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "legal_"));
for (const f of ["site-config.ts", "legal.ts", "legal-site.ts"]) {
  const t = fs.readFileSync(path.join(RAIZ, "painel/lib", f), "utf8").replace(/from "(\.\/[a-z-]+)"/g, 'from "$1.ts"');
  fs.writeFileSync(path.join(tmp, f), t);
}
const L = await import(pathToFileURL(path.join(tmp, "legal-site.ts")).href);
const C = await import(pathToFileURL(path.join(tmp, "site-config.ts")).href);

let falhas = 0;
function ok(c: unknown, n: string, d = "") { if (!c) falhas++; console.log(`${c ? "OK   " : "ERRO "}${n}${!c && d ? "\n      " + d : ""}`); }

const CFG = path.join(RAIZ, "_astro/src/config");
for (const arq of ["tema-03.ts", "tema-04.ts", "tema-05.ts", "tema-06.ts", "tema-07.ts"]) {
  const src = fs.readFileSync(path.join(CFG, arq), "utf8");
  if (!/\blegal:\s*\{/.test(src)) continue;
  const atual = L.importarLegal(src);
  ok(atual.cnpj !== undefined && atual.foroCidade !== "", `${arq}: importa controlador/foro do bloco real`, JSON.stringify(atual).slice(0, 200));

  // sem mudança = arquivo idêntico
  ok(L.aplicarLegal(src, atual, { ...atual }, { formulariosExistem: true }) === src, `${arq}: sem mudança não toca no arquivo`);

  // mudança de foro/vigência preserva tudo o mais (bases, retenção, medição…)
  const novo = { ...atual, foroCidade: "Campinas", foroUf: "SP", vigenciaDesde: "2026-01-10" };
  const out = L.aplicarLegal(src, atual, novo, { formulariosExistem: true });
  const antes = L.importarLegal(src), depois = L.importarLegal(out);
  ok(depois.foroCidade === "Campinas" && depois.vigenciaDesde === "2026-01-10", `${arq}: grava foro e vigência`);
  ok(JSON.stringify({ ...depois, foroCidade: 0, foroUf: 0, vigenciaDesde: 0 }) === JSON.stringify({ ...antes, foroCidade: 0, foroUf: 0, vigenciaDesde: 0 }), `${arq}: o resto do modelo fica igual`);
  ok(/basesLegais:/.test(out) && /compartilhamento:/.test(out) && /medicao:/.test(out), `${arq}: listas do agente preservadas`);
  ok(C.lerSite(out).nome === C.lerSite(src).nome, `${arq}: site.ts continua legível`);

  // trocar base legal de analíticos sem integração NÃO cria cookie novo
  const semInteg = src.replace(/googleAnalyticsId:\s*'[^']*',?/, "").replace(/googleTagManagerId:\s*'[^']*',?/, "");
  const a2 = L.importarLegal(semInteg);
  const out2 = L.aplicarLegal(semInteg, a2, { ...a2, baseLegalAnaliticos: "consentimento", retencaoAnaliticos: "6 meses" }, { formulariosExistem: true });
  const temAnalitico = (s: string) => /categoria:\s*'Anal/.test(s);
  ok(temAnalitico(out2) === temAnalitico(semInteg), `${arq}: sem GA/GTM não cria categoria Analíticos`);

  // não nomear encarregado → observação preservada
  const semDpo = L.aplicarLegal(src, atual, { ...atual, emailContato: "novo@x.com.br" }, { formulariosExistem: true });
  ok(L.importarLegal(semDpo).emailContato === "novo@x.com.br", `${arq}: canal do titular atualizado`);
}

// validação
const base = L.importarLegal("export const site = {}");
ok(L.validarLegal({ ...base, cnpj: "11.111.111/1111-11" }, ["cnpj"]).cnpj, "CNPJ inválido é recusado");
ok(!L.validarLegal({ ...base, cnpj: "não possui" }, ["cnpj"]).cnpj, "“não possui” é aceito");
ok(L.validarLegal({ ...base, atualizadaEm: "" }, ["atualizadaEm"]).atualizadaEm, "atualizadaEm vazia é recusada");
ok(L.validarLegal({ ...base, vigenciaDesde: "31/02/2026" }, ["vigenciaDesde"]).vigenciaDesde, "data fora de ISO é recusada");
ok(!Object.keys(L.validarLegal({ ...base, atualizadaEm: "" }, ["foroUf"])).length, "só valida campos enviados");

fs.rmSync(tmp, { recursive: true, force: true });
console.log(falhas ? "\nHA FALHAS" : "\nTUDO OK");
process.exit(falhas ? 1 : 0);
