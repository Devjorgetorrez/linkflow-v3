/**
 * app/api/robots/route.ts
 * GET   /api/robots  → lê public/robots.txt do motor Astro
 * PATCH /api/robots  → escreve public/robots.txt
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getLinkflowDir } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

function robotsPath(): string {
  return path.join(getLinkflowDir(), "_astro/public/robots.txt");
}

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["robots:GET"]);
  if (auth) return auth;

  try {
    const filePath = robotsPath();
    const conteudo = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf-8")
      : "User-agent: *\nAllow: /\n";
    return NextResponse.json({ ok: true, conteudo });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["robots:PATCH"]);
  if (auth) return auth;

  try {
    const { conteudo } = await req.json();
    if (typeof conteudo !== "string") {
      return NextResponse.json({ ok: false, erro: "conteudo obrigatório" }, { status: 400 });
    }
    fs.writeFileSync(robotsPath(), conteudo, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
