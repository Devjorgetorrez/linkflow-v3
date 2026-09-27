/**
 * lib/midia-meta.ts — metadados reais da biblioteca (só servidor).
 *
 * Cada arquivo tem um sidecar `<arquivo>.meta.json` com criadoEm (ISO), enviadoPor {id, nome},
 * alt/titulo/legenda/credito/tags. Arquivos antigos sem sidecar usam o mtime do arquivo e "—".
 * Escrita atômica (temporário + rename) e PATCH em fila por arquivo (sem corrida).
 */

import fs from "fs";
import type { NextRequest } from "next/server";
import { obterAtor } from "@/lib/auth";
import { buscarPorId } from "@/lib/usuarios";

export interface MetaMidia {
  criadoEm?: string;
  enviadoPor?: { id: string; nome: string };
  alt: string;
  titulo: string;
  legenda: string;
  credito: string;
  tags: string[];
}

export const CAMPOS_TEXTO = ["alt", "titulo", "legenda", "credito"] as const;
const MAX_TEXTO = 500;

export function metaVazia(): MetaMidia {
  return { alt: "", titulo: "", legenda: "", credito: "", tags: [] };
}

export function lerMeta(arquivo: string): Partial<MetaMidia> & Record<string, unknown> {
  try {
    const j = JSON.parse(fs.readFileSync(`${arquivo}.meta.json`, "utf-8"));
    return j && typeof j === "object" ? j : {};
  } catch {
    return {};
  }
}

export function gravarMetaAtomico(arquivo: string, meta: object): void {
  const destino = `${arquivo}.meta.json`;
  const tmp = `${destino}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(meta, null, 2), "utf-8");
  fs.renameSync(tmp, destino);
}

/** Quem está enviando: usuário da sessão ou "automação" (chave de API). */
export async function quemEnviou(req: NextRequest): Promise<{ id: string; nome: string }> {
  try {
    const ator = await obterAtor(req);
    if (ator?.via === "sessao") {
      const u = buscarPorId(ator.id);
      return { id: ator.id, nome: u?.autoria?.nomePublico?.trim() || ator.email || ator.id };
    }
  } catch { /* cai em automação */ }
  return { id: "automacao", nome: "automação" };
}

export function criarMetaNova(enviadoPor: { id: string; nome: string }): MetaMidia {
  return { ...metaVazia(), criadoEm: new Date().toISOString(), enviadoPor };
}

/** Valida o corpo do PATCH; devolve o que pode ser gravado ou o erro. */
export function validarPatch(body: unknown): { ok: true; campos: Record<string, unknown> } | { ok: false; erro: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, erro: "Corpo inválido." };
  const b = body as Record<string, unknown>;
  const campos: Record<string, unknown> = {};
  for (const c of CAMPOS_TEXTO) {
    if (b[c] === undefined) continue;
    if (typeof b[c] !== "string") return { ok: false, erro: `O campo "${c}" precisa ser texto.` };
    const v = (b[c] as string).trim();
    if (v.length > MAX_TEXTO) return { ok: false, erro: `O campo "${c}" passa de ${MAX_TEXTO} caracteres.` };
    campos[c] = v;
  }
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags) || b.tags.some((t) => typeof t !== "string")) {
      return { ok: false, erro: "As tags precisam ser uma lista de textos." };
    }
    campos.tags = [...new Set((b.tags as string[]).map((t) => t.trim()).filter(Boolean))].slice(0, 30);
  }
  return { ok: true, campos };
}

/** Fila por arquivo: PATCHes simultâneos do mesmo arquivo rodam em ordem. */
const filas = new Map<string, Promise<unknown>>();
export function emFila<T>(chave: string, tarefa: () => T | Promise<T>): Promise<T> {
  const anterior = filas.get(chave) ?? Promise.resolve();
  const proxima = anterior.catch(() => undefined).then(tarefa);
  filas.set(chave, proxima);
  void proxima
    .finally(() => { if (filas.get(chave) === proxima) filas.delete(chave); })
    .catch(() => undefined);
  return proxima;
}

/* ---------------------------------------------------------------- dimensões (só cabeçalho) */

function lerBytes(fd: number, pos: number, n: number): Buffer {
  const b = Buffer.alloc(n);
  const lidos = fs.readSync(fd, b, 0, n, pos);
  return b.subarray(0, lidos);
}

export function dimensoesDoArquivo(arquivo: string): { largura: number; altura: number } {
  let fd = -1;
  try {
    fd = fs.openSync(arquivo, "r");
    const h = lerBytes(fd, 0, 32);
    if (h.length >= 24 && h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e) {
      return { largura: h.readUInt32BE(16), altura: h.readUInt32BE(20) };
    }
    if (h.length >= 10 && h.toString("latin1", 0, 3) === "GIF") {
      return { largura: h.readUInt16LE(6), altura: h.readUInt16LE(8) };
    }
    if (h.length >= 30 && h.toString("latin1", 0, 4) === "RIFF" && h.toString("latin1", 8, 12) === "WEBP") {
      const tipo = h.toString("latin1", 12, 16);
      if (tipo === "VP8X") return { largura: 1 + h.readUIntLE(24, 3), altura: 1 + h.readUIntLE(27, 3) };
      if (tipo === "VP8 ") return { largura: h.readUInt16LE(26) & 0x3fff, altura: h.readUInt16LE(28) & 0x3fff };
      if (tipo === "VP8L") {
        const bits = h.readUInt32LE(21);
        return { largura: (bits & 0x3fff) + 1, altura: ((bits >> 14) & 0x3fff) + 1 };
      }
      return { largura: 0, altura: 0 };
    }
    if (h[0] === 0xff && h[1] === 0xd8) {
      // JPEG: percorre os segmentos lendo só os cabeçalhos (até ~1 MB de varredura).
      let pos = 2;
      for (let i = 0; i < 400 && pos < 1024 * 1024; i++) {
        const s = lerBytes(fd, pos, 9);
        if (s.length < 4 || s[0] !== 0xff) break;
        const marca = s[1];
        if (marca === 0xd8 || marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) { pos += 2; continue; }
        if (marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
          if (s.length < 9) break;
          return { largura: s.readUInt16BE(7), altura: s.readUInt16BE(5) };
        }
        pos += 2 + s.readUInt16BE(2);
      }
    }
  } catch { /* arquivo ilegível: sem dimensões */ }
  finally {
    if (fd >= 0) { try { fs.closeSync(fd); } catch { /* */ } }
  }
  return { largura: 0, altura: 0 };
}
