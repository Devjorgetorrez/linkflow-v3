/**
 * app/api/midia/[id]/route.ts
 * PATCH  /api/midia/:id  → atualiza metadados (alt, titulo, legenda, credito, tags)
 * DELETE /api/midia/:id  → deleta o arquivo
 *
 * O id é o path relativo do arquivo dentro de $LINKFLOW_DIR/midia/
 * Ex: "foto.jpg" ou "2024/foto.jpg"
 * O cliente usa encodeURIComponent(id) ao montar a URL do fetch.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getMidiaDir } from "@/lib/midia-upload";
import { emFila, gravarMetaAtomico, lerMeta, validarPatch } from "@/lib/midia-meta";
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
    if (err instanceof Error && (err.message === "Path inválido" || err instanceof URIError)) {
      return NextResponse.json({ ok: false, erro: "Caminho inválido." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, erro: "Erro ao processar o arquivo." }, { status: 500 });
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

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ ok: false, erro: "Corpo inválido (esperado JSON)." }, { status: 400 });
    }
    const v = validarPatch(body);
    if (!v.ok) return NextResponse.json({ ok: false, erro: v.erro }, { status: 400 });

    // Fila por arquivo: salvamentos seguidos do mesmo arquivo rodam em ordem, sem corrida.
    const meta = await emFila(filePath, () => {
      const atual: Record<string, unknown> = lerMeta(filePath);
      if (!atual.criadoEm) {
        // Arquivo antigo, sem sidecar: fixa a data real (mtime) para não mudar depois.
        atual.criadoEm = fs.statSync(filePath).mtime.toISOString();
      }
      Object.assign(atual, v.campos);
      gravarMetaAtomico(filePath, atual);
      return atual;
    });
    return NextResponse.json({ ok: true, meta });
  } catch (err) {
    if (err instanceof Error && (err.message === "Path inválido" || err instanceof URIError)) {
      return NextResponse.json({ ok: false, erro: "Caminho inválido." }, { status: 400 });
    }
    console.error("[api/midia PATCH]", err);
    return NextResponse.json({ ok: false, erro: "Não foi possível salvar os metadados." }, { status: 500 });
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
    if (err instanceof Error && (err.message === "Path inválido" || err instanceof URIError)) {
      return NextResponse.json({ ok: false, erro: "Caminho inválido." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, erro: "Erro ao processar o arquivo." }, { status: 500 });
  }
}
