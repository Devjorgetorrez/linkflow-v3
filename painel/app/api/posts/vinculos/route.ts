/**
 * app/api/posts/vinculos/route.ts
 * GET /api/posts/vinculos → páginas de serviço/pilar que um artigo pode apoiar
 * (`pilar:` no frontmatter). Lê content/servicos; não depende de build.
 */
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getContentDir, lerArquivo, parseMd } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { slugsDeServicos } from "@/lib/posts-campos";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["posts/vinculos:GET"]);
  if (auth) return auth;
  try {
    const servicos = slugsDeServicos().map((slug) => {
      const raw = lerArquivo(path.join(getContentDir(), "servicos", `${slug}.md`));
      const titulo = raw ? String(parseMd(raw).frontmatter.titulo ?? "").trim() : "";
      return { slug, titulo: titulo || slug };
    });
    return NextResponse.json({ ok: true, servicos });
  } catch (err) {
    console.error("[api/posts/vinculos GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
