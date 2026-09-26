/**
 * app/api/midia/[id]/route.ts
 * PATCH  /api/midia/:id  → atualiza metadados (alt, titulo, legenda, credito, tags)
 * DELETE /api/midia/:id  → deleta o arquivo
 *
 * O id é o path relativo do arquivo dentro de /var/www/[slug]/midia/
 * Ex: "foto.jpg" ou "2024/foto.jpg"
 * O cliente usa encodeURIComponent(id) ao montar a URL do fetch.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getMidiaDir } from "@/lib/midia-upload";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

function idParaPath(id: string): string {
  const midiaDir = path.resolve(getMidiaDir());
  const resolved = path.resolve(midiaDir, id);
  // Comparar com separador incluso para evitar bypass via pasta com nome prefixado
  // Ex: "midia-backup" não pode ser confundido com "midia"
  if (resolved !== midiaDir && !resolved.startsWith(midiaDir + path.sep)) {
    throw new Error("Path inválido");
  }
  return resolved;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["midia/[id]:GET"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const filePath = idParaPath(decodeURIComponent(id));

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: false, erro: "Arquivo não encontrado" }, { status: 404 });
    }

    const metaPath = `${filePath}.meta.json`;
    let meta = {};
    if (fs.existsSync(metaPath)) {
      try { meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")); } catch { /* silencioso */ }
    }

    return NextResponse.json({ ok: true, meta });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["midia/[id]:PATCH"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const filePath = idParaPath(decodeURIComponent(id));

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: false, erro: "Arquivo não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const metaPath = `${filePath}.meta.json`;

    let meta: Record<string, unknown> = {};
    if (fs.existsSync(metaPath)) {
      try { meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")); } catch { /* silencioso */ }
    }

    const permitidos = ["alt", "titulo", "legenda", "credito", "tags"];
    for (const campo of permitidos) {
      if (body[campo] !== undefined) meta[campo] = body[campo];
    }

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["midia/[id]:DELETE"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const filePath = idParaPath(decodeURIComponent(id));

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: false, erro: "Arquivo não encontrado" }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    const metaPath = `${filePath}.meta.json`;
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
