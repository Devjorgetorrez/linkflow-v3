/**
 * lib/midia-upload.ts — regras do envio de mídia (só servidor).
 *
 * - tipo conferido pelo CONTEÚDO (magic bytes), nunca só pelo nome/MIME enviado;
 * - a extensão gravada é a do tipo detectado (foto.png que é JPEG vira .jpg);
 * - SVG é RECUSADO: pode carregar <script> e é servido na mesma origem do site;
 * - nome sanitizado, sem caminho; pasta restrita a [a-z0-9-_/] sem ".." ;
 * - nunca sobrescreve: nome ocupado ganha sufixo -1, -2…
 */

import fs from "fs";
import path from "path";
import { getLinkflowDir } from "@/lib/fs";

export const LIMITE_IMAGEM = 5 * 1024 * 1024;
export const LIMITE_OUTROS = 10 * 1024 * 1024;
export const LIMITE_AVATAR = 2 * 1024 * 1024;

export type TipoDetectado = { ext: string; mime: string; imagem: boolean };

/**
 * Pasta física da biblioteca: $LINKFLOW_DIR/midia. No servidor, LINKFLOW_DIR é a pasta
 * DESTE cliente (/opt/linkflow/clientes/<slug>), a mesma que o Nginx serve em /midia/,
 * então cada cliente tem a sua e nada se mistura. LINKFLOW_MIDIA_DIR sobrepõe (testes).
 */
export function getMidiaDir(): string {
  return process.env.LINKFLOW_MIDIA_DIR
    ? path.resolve(process.env.LINKFLOW_MIDIA_DIR)
    : path.join(getLinkflowDir(), "midia");
}

export function detectarTipo(b: Buffer): TipoDetectado | null {
  const ascii = (i: number, n: number) => b.subarray(i, i + n).toString("latin1");
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return { ext: "jpg", mime: "image/jpeg", imagem: true };
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: "png", mime: "image/png", imagem: true };
  if (b.length >= 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a"))
    return { ext: "gif", mime: "image/gif", imagem: true };
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP")
    return { ext: "webp", mime: "image/webp", imagem: true };
  if (b.length >= 12 && ascii(4, 4) === "ftyp" && ascii(8, 4) === "avif")
    return { ext: "avif", mime: "image/avif", imagem: true };
  if (b.length >= 5 && ascii(0, 5) === "%PDF-") return { ext: "pdf", mime: "application/pdf", imagem: false };
  if (b.length >= 12 && ascii(4, 4) === "ftyp") return { ext: "mp4", mime: "video/mp4", imagem: false };
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)
    return { ext: "webm", mime: "video/webm", imagem: false };
  return null;
}

/** Nome-base seguro (sem extensão, sem separadores de caminho). */
export function sanitizarBase(nomeOriginal: string): string {
  const semCaminho = nomeOriginal.split(/[\\/]/).pop() ?? "";
  const semExt = semCaminho.replace(/\.[^.]*$/, "");
  const base = semExt
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
  return base || "arquivo";
}

export function sanitizarPasta(p: string): string {
  return p
    .split("/")
    .map((s) => s.replace(/[^a-z0-9_-]/gi, ""))
    .filter(Boolean)
    .join("/");
}

/** Grava sem sobrescrever; devolve o nome final. `wx` garante atomicidade. */
export function gravarSemSobrescrever(dir: string, base: string, ext: string, dados: Buffer): string {
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 1000; i++) {
    const nome = `${base}${i ? `-${i}` : ""}.${ext}`;
    try {
      fs.writeFileSync(path.join(dir, nome), dados, { flag: "wx" });
      return nome;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
  }
  throw new Error("Não foi possível escolher um nome livre para o arquivo");
}
