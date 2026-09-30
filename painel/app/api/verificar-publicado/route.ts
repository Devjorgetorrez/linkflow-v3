/**
 * app/api/verificar-publicado/route.ts
 * GET /api/verificar-publicado?arquivo=sitemap.xml|llms.txt
 *
 * Confere um arquivo no domínio PUBLICADO (site do cliente), do lado do
 * SERVIDOR — nunca do navegador. As telas de SEO (llms.txt, Sitemap)
 * precisavam comparar o que calculam aqui com o que está de fato no ar, mas
 * faziam isso com fetch() direto do navegador para https://<dominio>/... —
 * o painel roda em painel.<dominio>, uma origem DIFERENTE do site, então o
 * navegador bloqueia a leitura por CORS (o Nginx do site não manda
 * Access-Control-Allow-Origin nenhum). O fetch falhava sempre, em silêncio
 * (cai no .catch, o estado fica null pra sempre), e por isso o aviso de
 * divergência nunca aparecia (erros 78/79, Relatório de Testes 6). Buscar
 * daqui, servidor-para-servidor, não tem CORS.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getConfigPath } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { lerSite } from "@/lib/site-config";

const ARQUIVOS_PERMITIDOS = new Set(["sitemap.xml", "llms.txt"]);

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["verificar-publicado:GET"]);
  if (auth) return auth;

  const arquivo = req.nextUrl.searchParams.get("arquivo") ?? "";
  if (!ARQUIVOS_PERMITIDOS.has(arquivo)) {
    return NextResponse.json({ ok: false, erro: "arquivo inválido" }, { status: 400 });
  }

  const filePath = getConfigPath();
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ ok: true, status: null, texto: null, ultimaModificacao: null });
  }
  const dominioHost = (lerSite(fs.readFileSync(filePath, "utf-8")).dominio ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  if (!dominioHost) {
    return NextResponse.json({ ok: true, status: null, texto: null, ultimaModificacao: null });
  }

  try {
    const r = await fetch(`https://${dominioHost}/${arquivo}`, { cache: "no-store" });
    const texto = r.ok ? await r.text() : null;
    const ultimaModificacao = r.headers.get("Last-Modified") ?? r.headers.get("Date");
    return NextResponse.json({ ok: true, status: r.status, texto, ultimaModificacao });
  } catch (err) {
    // Domínio ainda não resolve, site fora do ar, etc — não é erro do painel.
    return NextResponse.json({ ok: true, status: null, texto: null, ultimaModificacao: null, aviso: String(err) });
  }
}
