/**
 * app/api/midia/[id]/route.ts
 * PATCH  /api/midia/:id  → atualiza metadados (alt, titulo, legenda, credito, tags)
 * PUT    /api/midia/:id  → SUBSTITUI o conteúdo do arquivo mantendo o mesmo endereço (multipart, campo
 *   "arquivo"): todo lugar que usa `/midia/<arquivo>` passa a mostrar o novo. Só aceita o MESMO tipo
 *   (conferido pelo conteúdo): trocar png por jpg mudaria o endereço e quebraria as páginas.
 * DELETE /api/midia/:id  → deleta o arquivo
 *
 * O id é o path relativo do arquivo dentro de $LINKFLOW_DIR/midia/
 * Ex: "foto.jpg" ou "2024/foto.jpg"
 * O cliente usa encodeURIComponent(id) ao montar a URL do fetch.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { LIMITE_IMAGEM, LIMITE_OUTROS, detectarTipo, getMidiaDir } from "@/lib/midia-upload";
import { emFila, gravarMetaAtomico, lerMeta, quemEnviou, validarPatch } from "@/lib/midia-meta";
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["midia/[id]:PUT"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const filePath = idParaPath(decodeURIComponent(id));
    if (filePath.endsWith(".meta.json") || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return NextResponse.json({ ok: false, erro: "Arquivo não encontrado" }, { status: 404 });
    }

    const tam = Number(req.headers.get("content-length") ?? "0");
    if (!tam) return NextResponse.json({ ok: false, erro: "Envio sem tamanho declarado." }, { status: 411 });
    if (tam > LIMITE_OUTROS + 1024 * 1024) {
      return NextResponse.json({ ok: false, erro: "Arquivo grande demais." }, { status: 413 });
    }

    let arquivo: FormDataEntryValue | null = null;
    try { arquivo = (await req.formData()).get("arquivo"); } catch { /* cai abaixo */ }
    if (!(arquivo instanceof File)) {
      return NextResponse.json({ ok: false, erro: "Escolha o arquivo que vai substituir este." }, { status: 400 });
    }
    const buf = Buffer.from(await arquivo.arrayBuffer());
    const tipo = detectarTipo(buf);
    if (!tipo) {
      return NextResponse.json({ ok: false, erro: "Tipo de arquivo não aceito." }, { status: 415 });
    }
    const extAtual = path.extname(filePath).slice(1).toLowerCase().replace("jpeg", "jpg");
    if (tipo.ext !== extAtual) {
      return NextResponse.json(
        { ok: false, erro: `Envie um arquivo do mesmo tipo (.${extAtual}). Trocar o tipo mudaria o endereço e quebraria as páginas que usam esta mídia.` },
        { status: 415 },
      );
    }
    if (buf.length > (tipo.imagem ? LIMITE_IMAGEM : LIMITE_OUTROS)) {
      return NextResponse.json({ ok: false, erro: "Arquivo acima do tamanho máximo." }, { status: 413 });
    }

    const por = await quemEnviou(req);
    const meta = await emFila(filePath, () => {
      const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, filePath);
      const atual: Record<string, unknown> = lerMeta(filePath);
      if (!atual.criadoEm) atual.criadoEm = new Date().toISOString();
      atual.substituidoEm = new Date().toISOString();
      atual.substituidoPor = por;
      gravarMetaAtomico(filePath, atual);
      return atual;
    });
    return NextResponse.json({ ok: true, meta, bytes: buf.length });
  } catch (err) {
    if (err instanceof Error && (err.message === "Path inválido" || err instanceof URIError)) {
      return NextResponse.json({ ok: false, erro: "Caminho inválido." }, { status: 400 });
    }
    console.error("[api/midia PUT]", err);
    return NextResponse.json({ ok: false, erro: "Não foi possível substituir o arquivo." }, { status: 500 });
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
