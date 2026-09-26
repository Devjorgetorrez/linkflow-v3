/**
 * app/api/midia/route.ts
 * GET   /api/midia         → lista arquivos de mídia do site
 * POST  /api/midia         → upload (multipart, campo "arquivo"). finalidade=avatar: qualquer papel,
 *   só imagem até 2 MB, pasta "avatares" (autor troca a PRÓPRIA foto sem upload geral). Sem finalidade: admin/editor.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getConfigPath } from "@/lib/fs";
import { lerSite } from "@/lib/site-config";
import {
  LIMITE_AVATAR, LIMITE_IMAGEM, LIMITE_OUTROS, detectarTipo, getMidiaDir,
  gravarSemSobrescrever, sanitizarBase, sanitizarPasta,
} from "@/lib/midia-upload";
import { exigirPapel, obterAtor } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

const FORMATOS_IMAGEM = ["jpg", "jpeg", "png", "webp", "gif", "avif"];


/** Domínio público do site (do config/site.ts). Sem domínio ainda, "" → URL relativa (/midia/x.png). */
function getUrlBase(): string {
  const env = process.env.SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  try {
    return (lerSite(fs.readFileSync(getConfigPath(), "utf-8")).dominio ?? "").replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function getImageDimensions(filePath: string): { largura: number; altura: number } {
  // Leitura simplificada de dimensões para PNG e JPEG
  try {
    const buf = fs.readFileSync(filePath);
    // PNG: largura em bytes 16-20, altura em bytes 20-24
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      return {
        largura: buf.readUInt32BE(16),
        altura: buf.readUInt32BE(20),
      };
    }
    // JPEG: procurar SOF marker
    let i = 2;
    while (i < buf.length - 4) {
      if (buf[i] === 0xff && [0xc0, 0xc1, 0xc2].includes(buf[i + 1])) {
        return {
          largura: buf.readUInt16BE(i + 7),
          altura: buf.readUInt16BE(i + 5),
        };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  } catch { /* silencioso */ }
  return { largura: 0, altura: 0 };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["midia:GET"]);
  if (auth) return auth;

  try {
    const midiaDir = getMidiaDir();
    if (!fs.existsSync(midiaDir)) {
      return NextResponse.json({ ok: true, midia: [] });
    }

    const urlBase = getUrlBase();
    const arquivos: unknown[] = [];

    function varrerDir(dir: string, pasta: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          varrerDir(path.join(dir, entry.name), `${pasta}/${entry.name}`);
          continue;
        }

        // Sidecar de metadados (criado pelo PATCH) não é item da biblioteca.
        if (entry.name.endsWith(".meta.json")) continue;

        const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
        const filePath = path.join(dir, entry.name);
        const stat = fs.statSync(filePath);
        const { largura, altura } = FORMATOS_IMAGEM.includes(ext)
          ? getImageDimensions(filePath)
          : { largura: 0, altura: 0 };

        const url = `${urlBase}/midia${pasta}/${entry.name}`;

        // Ler metadados salvos se existirem
        const metaPath = `${filePath}.meta.json`;
        let meta = { alt: "", titulo: entry.name, legenda: "", credito: "", tags: [] as string[] };
        if (fs.existsSync(metaPath)) {
          try { meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, "utf-8")) }; }
          catch { /* silencioso */ }
        }

        // id = path relativo do arquivo dentro de /midia/
        // Ex: "2024/foto.jpg" ou "foto.jpg"
        const idRelativo = (pasta ? `${pasta.replace(/^\//, "")}/${entry.name}` : entry.name);

        arquivos.push({
          id: idRelativo,
          arquivo: entry.name,
          url,
          alt: meta.alt,
          titulo: meta.titulo,
          legenda: meta.legenda,
          credito: meta.credito,
          largura,
          altura,
          bytes: stat.size,
          formato: ext,
          pasta: pasta || "/",
          tags: meta.tags,
          usadaEm: [],
          gradiente: "from-slate-200 to-slate-300",
          criadoEm: stat.birthtime.toISOString(),
        });
      }
    }

    varrerDir(midiaDir, "");
    // Ordenar por data de criação, mais recentes primeiro
    arquivos.sort((a: unknown, b: unknown) => {
      const da = (a as { criadoEm: string }).criadoEm;
      const db = (b as { criadoEm: string }).criadoEm;
      return db.localeCompare(da);
    });

    return NextResponse.json({ ok: true, midia: arquivos });
  } catch (err) {
    console.error("[api/midia GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

// ─── POST — upload ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Recusa cedo pelo Content-Length, antes de ler o corpo inteiro.
    const declarado = Number(req.headers.get("content-length") ?? 0);
    if (declarado > LIMITE_OUTROS + 64 * 1024) {
      return NextResponse.json(
        { ok: false, erro: `Arquivo grande demais (máximo ${LIMITE_OUTROS / 1024 / 1024} MB).` },
        { status: 413 },
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ ok: false, erro: "Envio inválido (esperado multipart/form-data)." }, { status: 400 });
    }

    const avatar = formData.get("finalidade") === "avatar";
    const auth = await exigirPapel(req, avatar ? MATRIZ["midia:POST:avatar"] : MATRIZ["midia:POST"]);
    if (auth) return auth;

    const arquivo = formData.get("arquivo");
    if (!arquivo || typeof arquivo === "string") {
      return NextResponse.json({ ok: false, erro: "Escolha um arquivo para enviar." }, { status: 400 });
    }
    if (arquivo.size === 0) {
      return NextResponse.json({ ok: false, erro: "O arquivo está vazio." }, { status: 400 });
    }

    const buf = Buffer.from(await arquivo.arrayBuffer());
    const tipo = detectarTipo(buf);
    if (!tipo) {
      return NextResponse.json(
        { ok: false, erro: "Formato não aceito. Envie JPG, PNG, WebP ou GIF (SVG não é aceito por segurança)." },
        { status: 415 },
      );
    }
    if (avatar && !tipo.imagem) {
      return NextResponse.json({ ok: false, erro: "A foto de perfil precisa ser uma imagem (JPG, PNG, WebP ou GIF)." }, { status: 415 });
    }
    const limite = avatar ? LIMITE_AVATAR : tipo.imagem ? LIMITE_IMAGEM : LIMITE_OUTROS;
    if (buf.length > limite) {
      return NextResponse.json(
        { ok: false, erro: `Arquivo grande demais (${(buf.length / 1024 / 1024).toFixed(1)} MB). O máximo é ${limite / 1024 / 1024} MB.` },
        { status: 413 },
      );
    }

    let pasta = "";
    let base = sanitizarBase(arquivo.name);
    if (avatar) {
      pasta = "avatares";
      const ator = await obterAtor(req);
      const dono = ator?.via === "sessao" ? ator.id.replace(/[^a-z0-9]/gi, "").slice(0, 12) : "";
      base = `avatar-${dono ? `${dono}-` : ""}${Date.now().toString(36)}`;
    } else {
      pasta = sanitizarPasta(String(formData.get("pasta") ?? ""));
    }

    const raiz = path.resolve(getMidiaDir());
    const dir = path.resolve(raiz, pasta);
    if (dir !== raiz && !dir.startsWith(raiz + path.sep)) {
      return NextResponse.json({ ok: false, erro: "Pasta inválida." }, { status: 400 });
    }

    // Mesmo conteúdo já na pasta: reaproveita em vez de criar cópia com outro nome.
    if (fs.existsSync(dir)) {
      for (const existente of fs.readdirSync(dir)) {
        const p = path.join(dir, existente);
        if (existente.endsWith(".meta.json") || !fs.statSync(p).isFile() || fs.statSync(p).size !== buf.length) continue;
        if (fs.readFileSync(p).equals(buf)) {
          return NextResponse.json({
            ok: true,
            duplicado: true,
            url: `${getUrlBase()}/midia${pasta ? `/${pasta}` : ""}/${existente}`,
            arquivo: existente,
            id: pasta ? `${pasta}/${existente}` : existente,
            pasta: pasta ? `/${pasta}` : "/",
            bytes: buf.length,
            formato: tipo.ext,
          });
        }
      }
    }

    const nome = gravarSemSobrescrever(dir, base, tipo.ext, buf);
    const url = `${getUrlBase()}/midia${pasta ? `/${pasta}` : ""}/${nome}`;
    return NextResponse.json({
      ok: true,
      url,
      arquivo: nome,
      id: pasta ? `${pasta}/${nome}` : nome,
      pasta: pasta ? `/${pasta}` : "/",
      bytes: buf.length,
      formato: tipo.ext,
    });
  } catch (err) {
    console.error("[api/midia POST]", err);
    return NextResponse.json({ ok: false, erro: "Falha ao gravar o arquivo no servidor." }, { status: 500 });
  }
}
