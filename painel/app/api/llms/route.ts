/**
 * app/api/llms/route.ts
 * GET   /api/llms  → lê public/llms.txt do motor Astro
 * PATCH /api/llms  → escreve public/llms.txt
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getLinkflowDir } from "@/lib/fs";
import { verificarAcesso } from "@/lib/auth";

function llmsPath(): string {
  return path.join(getLinkflowDir(), "_astro/public/llms.txt");
}

export async function GET(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const filePath = llmsPath();
    const conteudo = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf-8")
      : "";
    return NextResponse.json({ ok: true, conteudo });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const { conteudo } = await req.json();
    if (typeof conteudo !== "string") {
      return NextResponse.json({ ok: false, erro: "conteudo obrigatório" }, { status: 400 });
    }
    const dir = path.dirname(llmsPath());
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(llmsPath(), conteudo, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
