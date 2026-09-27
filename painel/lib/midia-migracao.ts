/**
 * lib/midia-migracao.ts — migração única da mídia gravada por versão anterior em
 * /var/www/<slug>/midia para $LINKFLOW_DIR/midia. COPIA (nunca move nem apaga a origem),
 * preserva subpastas e sidecars e nunca sobrescreve. Registra em dados/logs/migracao-midia.log
 * e cria o marcador dados/.midia-migrada. Sem pasta legada (Windows/dev) é no-op silencioso.
 * LINKFLOW_MIDIA_LEGADO_DIR sobrepõe o caminho legado (testes).
 */

import fs from "fs";
import path from "path";
import { getLinkflowDir } from "@/lib/fs";
import { getMidiaDir } from "@/lib/midia-upload";

function contar(dir: string): number {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += contar(path.join(dir, e.name));
    else if (e.isFile()) n++;
  }
  return n;
}

function copiar(origem: string, destino: string, r: { copiados: number; existentes: number; falhas: string[] }) {
  fs.mkdirSync(destino, { recursive: true });
  // Arquivos antes dos sidecars: o sidecar só vai junto se o arquivo dele também foi copiado agora
  // (não anexa metadados legados a um arquivo diferente que já estava no destino).
  const itens = fs.readdirSync(origem, { withFileTypes: true }).sort(
    (a, b) => Number(a.name.endsWith(".meta.json")) - Number(b.name.endsWith(".meta.json")),
  );
  const copiadosAqui = new Set<string>();
  for (const e of itens) {
    const o = path.join(origem, e.name);
    const d = path.join(destino, e.name);
    if (e.isDirectory()) { copiar(o, d, r); continue; }
    if (!e.isFile()) continue;
    if (e.name.endsWith(".meta.json") && !copiadosAqui.has(e.name.slice(0, -".meta.json".length))) {
      if (fs.existsSync(d.slice(0, -".meta.json".length))) { r.existentes++; continue; }
    }
    try {
      fs.copyFileSync(o, d, fs.constants.COPYFILE_EXCL);
      copiadosAqui.add(e.name);
      r.copiados++;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EEXIST") r.existentes++;
      else r.falhas.push(`${path.relative(origem, o)}: ${(err as Error).message}`);
    }
  }
}

export function migrarMidiaLegada(): { executou: boolean; copiados?: number; existentes?: number; falhas?: number } {
  try {
    const raiz = getLinkflowDir();
    const dados = path.join(raiz, "dados");
    if (fs.existsSync(path.join(dados, ".midia-migrada"))) return { executou: false };

    const slug = process.env.LINKFLOW_SLUG || path.basename(path.resolve(raiz));
    const legado = path.resolve(process.env.LINKFLOW_MIDIA_LEGADO_DIR || path.join("/var/www", slug, "midia"));
    const novo = path.resolve(getMidiaDir());
    if (legado === novo || !fs.existsSync(legado) || !fs.statSync(legado).isDirectory()) return { executou: false };
    if (contar(legado) === 0) return { executou: false };

    const r = { copiados: 0, existentes: 0, falhas: [] as string[] };
    copiar(legado, novo, r);

    fs.mkdirSync(path.join(dados, "logs"), { recursive: true });
    const linha =
      `${new Date().toISOString()} origem=${legado} destino=${novo} copiados=${r.copiados} ` +
      `ja-existiam=${r.existentes} falhas=${r.falhas.length}` +
      (r.falhas.length ? `\n  ${r.falhas.join("\n  ")}` : "") + "\n";
    fs.appendFileSync(path.join(dados, "logs", "migracao-midia.log"), linha, "utf-8");
    // Só marca como migrada se não houve falha; com falha, tenta de novo no próximo boot (não sobrescreve).
    if (r.falhas.length === 0) fs.writeFileSync(path.join(dados, ".midia-migrada"), new Date().toISOString() + "\n", "utf-8");
    return { executou: true, copiados: r.copiados, existentes: r.existentes, falhas: r.falhas.length };
  } catch (err) {
    console.error("[painel] migração de mídia legada falhou:", (err as Error).message);
    return { executou: false };
  }
}
