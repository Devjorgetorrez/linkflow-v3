/**
 * app/api/redirects/[id]/route.ts
 * DELETE /api/redirects/:id  → remove redirect
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { lerDados, salvarDados } from "@/lib/dados";
import { getSiteSlug } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import type { Redirect } from "@/mock/types";

function gerarArquivoRedirects(redirects: Redirect[]): void {
  const siteDir = `/var/www/${getSiteSlug()}`;
  const linhas = redirects.map((r) =>
    r.codigo === 410 ? `${r.origem}  /410  410` : `${r.origem}  ${r.destino}  ${r.codigo}`
  );
  try {
    if (fs.existsSync(siteDir)) {
      fs.writeFileSync(path.join(siteDir, "_redirects"), linhas.join("\n"), "utf-8");
    }
  } catch { /* silencioso */ }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["redirects/[id]:DELETE"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const redirects = lerDados<Redirect[]>("redirects.json", []);
    const idx = redirects.findIndex((r) => r.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Redirect não encontrado" }, { status: 404 });
    }

    redirects.splice(idx, 1);
    salvarDados("redirects.json", redirects);
    gerarArquivoRedirects(redirects);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
