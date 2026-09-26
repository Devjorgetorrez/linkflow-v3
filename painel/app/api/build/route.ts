/**
 * app/api/build/route.ts
 * POST /api/build   → dispara rebuild do Astro e copia resultado para /var/www/[slug]
 * GET  /api/build   → consulta status de um build em andamento
 *
 * Segurança:
 * - Autenticação por API key (x-api-key header)
 * - Slug validado com allowlist [a-z0-9-] antes de qualquer uso em path ou shell
 * - execFile com argumentos separados (sem interpolação em shell) para o npm run build
 * - cp e rm via fs nativo do Node (sem shell) para evitar injeção
 */

import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { getLinkflowDir, getSiteSlug } from "@/lib/fs";
import { exigirPapel, validarSlug } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";

// Mapa de builds em andamento (memória — reseta com reinício do PM2)
const builds: Map<string, { status: "rodando" | "sucesso" | "erro"; log: string; fim?: number }> = new Map();

function copiarDirRecursivo(origem: string, destino: string) {
  if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
  for (const entry of fs.readdirSync(origem, { withFileTypes: true })) {
    const src = path.join(origem, entry.name);
    const dst = path.join(destino, entry.name);
    if (entry.isDirectory()) {
      copiarDirRecursivo(src, dst);
    } else {
      fs.copyFileSync(src, dst);
    }
  }
}

// Itens da pasta do site que NÃO vêm do build — são gravados pelo próprio
// painel (uploads em api/midia, _redirects em api/redirects) e sumiriam a
// cada publicação se a limpeza apagasse a pasta inteira.
const PRESERVAR_NO_SITE = new Set(["midia", "_redirects"]);

function limparDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    if (PRESERVAR_NO_SITE.has(entry)) continue;
    const full = path.join(dir, entry);
    fs.rmSync(full, { recursive: true, force: true });
  }
}

function runBuild(buildId: string, slug: string) {
  const astroDir = path.join(getLinkflowDir(), "_astro");
  // Pós-promoção de tema, o dist/ inteiro já é o site (dist/index.html,
  // dist/<slug>/index.html, dist/_astro/ com CSS/JS) — mesmo modelo do
  // `cp -r dist/. <site_dir>/` das skills site-publicar/site-atualizar.
  // Nunca existe dist/<slug-do-cliente>/ nem merge separado de dist/_astro.
  const distDir = path.join(astroDir, "dist");
  const siteDir = `/var/www/${slug}`;

  // Garantir que a pasta do site existe
  if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

  // Rodar npm run build com execFile (sem interpolação shell)
  execFile("npm", ["run", "build"], { cwd: astroDir, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
      builds.set(buildId, { status: "erro", log: `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`, fim: Date.now() });
      console.error(`[api/build] Build ${buildId} falhou:`, err.message);
      return;
    }

    try {
      // Validar o resultado ANTES de limpar a pasta publicada — se o dist/
      // não tiver a home, apagar o site no ar e depois falhar a cópia
      // deixaria o cliente fora do ar.
      if (!fs.existsSync(path.join(distDir, "index.html"))) {
        builds.set(buildId, {
          status: "erro",
          log: `Build terminou sem ${path.join(distDir, "index.html")} — site publicado mantido intacto.\n\nSTDOUT:\n${stdout}`,
          fim: Date.now(),
        });
        return;
      }

      // Copiar resultado usando fs nativo (sem shell)
      limparDir(siteDir);
      copiarDirRecursivo(distDir, siteDir);

      builds.set(buildId, { status: "sucesso", log: `STDOUT:\n${stdout}`, fim: Date.now() });
      console.log(`[api/build] Build ${buildId} concluído`);
    } catch (copyErr) {
      builds.set(buildId, { status: "erro", log: `Build OK mas erro ao copiar: ${copyErr}`, fim: Date.now() });
    }
  });
}

// ─── POST — iniciar build ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["build:POST"]);
  if (auth) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const slugRaw = body.slug ?? getSiteSlug();

    // Validar slug com allowlist estrita antes de qualquer uso
    if (!validarSlug(slugRaw)) {
      return NextResponse.json({ ok: false, erro: "Slug inválido" }, { status: 400 });
    }

    const slug = slugRaw as string;
    const buildId = `build-${Date.now()}`;

    builds.set(buildId, { status: "rodando", log: "Build iniciado..." });
    runBuild(buildId, slug);

    return NextResponse.json({ ok: true, buildId, slug });
  } catch (err) {
    console.error("[api/build POST]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

// ─── GET — status do build ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["build:GET"]);
  if (auth) return auth;

  const buildId = new URL(req.url).searchParams.get("id");
  if (!buildId) {
    return NextResponse.json({ ok: false, erro: "Parâmetro id obrigatório" }, { status: 400 });
  }

  const build = builds.get(buildId);
  if (!build) {
    return NextResponse.json({ ok: false, erro: "Build não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, buildId, ...build });
}
