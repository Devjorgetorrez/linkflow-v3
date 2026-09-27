/**
 * app/api/redirects/[id]/route.ts
 * DELETE /api/redirects/:id  → remove redirect
 */

import { NextRequest, NextResponse } from "next/server";
import { lerRedirects, salvarRedirects } from "@/lib/redirects";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel(req, MATRIZ["redirects/[id]:DELETE"]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const redirects = lerRedirects();
    const idx = redirects.findIndex((r) => r.id === id);

    if (idx === -1) {
      return NextResponse.json({ ok: false, erro: "Redirect não encontrado" }, { status: 404 });
    }

    redirects.splice(idx, 1);
    salvarRedirects(redirects);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
