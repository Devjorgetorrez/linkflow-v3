/**
 * app/api/midia/route.ts
 * GET   /api/midia         → lista arquivos de mídia do site
 * POST  /api/midia         → faz upload de um arquivo (multipart/form-data)
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSiteSlug } from "@/lib/fs";
import { verificarAcesso } from "@/lib/auth";

const FORMATOS_IMAGEM = ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"];

function getMidiaDir(): string {
  return path.join("/var/www", getSiteSlug(), "midia");
}

function getUrlBase(): string {
  // URL pública das imagens — lida do config se disponível
  return process.env.SITE_URL ?? `https://${getSiteSlug()}.turboblog.com.br`;
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
  const auth = await verificarAcesso(req);
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
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const pasta = String(formData.get("pasta") ?? "").replace(/[^a-z0-9-_/]/gi, "");

    if (!arquivo) {
      return NextResponse.json({ ok: false, erro: "arquivo obrigatório" }, { status: 400 });
    }

    // Validar tipo de arquivo
    const ext = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
    const PERMITIDOS = [...FORMATOS_IMAGEM, "pdf", "mp4", "webm"];
    if (!PERMITIDOS.includes(ext)) {
      return NextResponse.json(
        { ok: false, erro: `Formato .${ext} não permitido` },
        { status: 400 }
      );
    }

    // Sanitizar nome do arquivo
    const nomeSeguro = arquivo.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();

    const midiaDir = path.join(getMidiaDir(), pasta);
    if (!fs.existsSync(midiaDir)) fs.mkdirSync(midiaDir, { recursive: true });

    const filePath = path.join(midiaDir, nomeSeguro);
    const bytes = await arquivo.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));

    const urlBase = getUrlBase();
    const url = `${urlBase}/midia${pasta ? `/${pasta}` : ""}/${nomeSeguro}`;

    return NextResponse.json({ ok: true, url, arquivo: nomeSeguro });
  } catch (err) {
    console.error("[api/midia POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
