/**
 * lib/midia-uso.ts — "usada em": varre as referências a /midia/<arquivo> nos conteúdos do site
 * (.md das coleções, config/site.ts) e no cadastro de usuários (foto de autor). Uma passada só.
 */

import fs from "fs";
import path from "path";
import { getConfigPath, getContentDir, getLinkflowDir } from "@/lib/fs";

const REF = /\/midia\/([^\s"'`)\]>,;<]+)/g;

function textoDe(arquivo: string): string {
  try {
    if (fs.statSync(arquivo).size > 2 * 1024 * 1024) return "";
    return fs.readFileSync(arquivo, "utf-8");
  } catch {
    return "";
  }
}

function coletar(texto: string, rotulo: string, mapa: Map<string, Set<string>>) {
  for (const m of texto.matchAll(REF)) {
    let id = m[1].split(/[?#]/)[0];
    try { id = decodeURIComponent(id); } catch { /* mantém */ }
    if (!mapa.has(id)) mapa.set(id, new Set());
    mapa.get(id)!.add(rotulo);
  }
}

function varrerMd(dir: string, base: string, mapa: Map<string, Set<string>>, prof = 0) {
  if (prof > 4 || !fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) varrerMd(p, `${base}${e.name}/`, mapa, prof + 1);
    else if (/\.mdx?$/.test(e.name)) coletar(textoDe(p), `${base}${e.name.replace(/\.mdx?$/, "")}`, mapa);
  }
}

/** Mapa id-da-mídia → onde é usada. */
export function mapaDeUso(): Map<string, string[]> {
  const mapa = new Map<string, Set<string>>();
  try { varrerMd(getContentDir(), "", mapa); } catch { /* segue */ }
  try { coletar(textoDe(getConfigPath()), "Configurações do site", mapa); } catch { /* segue */ }
  try {
    coletar(textoDe(path.join(getLinkflowDir(), "usuarios.json")), "Usuários (foto de perfil)", mapa);
  } catch { /* segue */ }
  return new Map([...mapa].map(([k, v]) => [k, [...v].sort()]));
}
