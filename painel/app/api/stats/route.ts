/**
 * app/api/stats/route.ts
 * GET /api/stats — estatísticas reais do site para o dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import path from "path";
import fs from "fs";
import { getContentDir, getConfigPath, getLinkflowDir, listarArquivos, lerArquivo, parseMd, getSiteSlug } from "@/lib/fs";
import { lerUsuarios } from "@/lib/usuarios";
import { lerStatusPost } from "@/lib/status-post";
import { getSiteDir, lerEstado } from "@/lib/build-estado";
import type { ItemSaude } from "@/mock/types";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["stats:GET"]);
  if (auth) return auth;

  try {
    const contentDir = getContentDir();
    const slug = getSiteSlug();

    // ─── Posts ───────────────────────────────────────────────────────────────
    const postsDir = path.join(contentDir, "posts");
    const arquivos = listarArquivos(postsDir, ".md");

    let totalPosts = 0;
    let publicados = 0;
    let rascunhos = 0;
    let revisao = 0;
    let ultimaPublicacao = "";

    for (const arquivo of arquivos) {
      const raw = lerArquivo(path.join(postsDir, arquivo));
      if (!raw) continue;
      const { frontmatter } = parseMd(raw);
      totalPosts++;

      const status = lerStatusPost(frontmatter.status);
      if (status === "publicado") publicados++;
      else if (status === "revisao") revisao++;
      else rascunhos++;

      // Só post PUBLICADO conta pra "último em" — antes considerava qualquer
      // arquivo, então um rascunho editado recentemente virava a data mostrada
      // no card "Publicados" mesmo com 0 posts publicados de verdade (erro
      // 103, Relatório de Testes 6).
      if (status === "publicado") {
        const data = String(frontmatter.publicadoEm ?? frontmatter.atualizadoEm ?? "");
        if (data && (!ultimaPublicacao || data > ultimaPublicacao)) {
          ultimaPublicacao = data;
        }
      }
    }

    // ─── Usuários ─────────────────────────────────────────────────────────────
    const usuarios = lerUsuarios();
    const totalUsuarios = usuarios.filter((u) => u.acesso?.ativo).length;

    // ─── Config do site ───────────────────────────────────────────────────────
    const configPath = getConfigPath(); // config/site.ts — nunca config/<slug>.ts (pós-promoção)
    let nomeSite = slug;
    let cidadeSite = "";
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const nome = raw.match(/nome:\s*["'`]([^"'`]+)["'`]/)?.[1];
      const cidade = raw.match(/cidade:\s*["'`]([^"'`]+)["'`]/)?.[1];
      if (nome) nomeSite = nome;
      if (cidade) cidadeSite = cidade;
    }

    // ─── Último build — estado real gravado por /api/build ────────────────────
    const siteDir = getSiteDir(slug);
    const build = lerEstado();
    // Só "nunca publicado" quando nunca houve tentativa; o horário é o do fim
    // do último build (ok ou erro), não a data da pasta publicada.
    const ultimoBuild = build.fim ?? "";

    // ─── Saúde do site — só o que dá para verificar de verdade ─────────────
    // (antes o dashboard mostrava itens de demonstração: SSL, "28 URLs"...)
    const saude: ItemSaude[] = [];

    const sitemapPublicado = path.join(siteDir, "sitemap.xml");
    const sitemapBuild = path.join(getLinkflowDir(), "_astro/dist/sitemap.xml");
    const sitemapPath = fs.existsSync(sitemapPublicado) ? sitemapPublicado
      : fs.existsSync(sitemapBuild) ? sitemapBuild : "";
    if (sitemapPath) {
      const locs = (fs.readFileSync(sitemapPath, "utf-8").match(/<loc>/g) ?? []).length;
      saude.push({
        id: "sitemap",
        label: "Sitemap",
        valor: `${locs} URL${locs === 1 ? "" : "s"}`,
        estado: locs > 0 ? "ok" : "aviso",
        detalhe: sitemapPath === sitemapPublicado
          ? "sitemap.xml publicado, gerado no último build."
          : "sitemap.xml do último build — ainda não publicado.",
      });
    } else {
      saude.push({
        id: "sitemap",
        label: "Sitemap",
        valor: "Não encontrado",
        estado: "aviso",
        detalhe: "Nenhum build com sitemap.xml ainda. Publique o site para gerar.",
      });
    }

    let dominio = "";
    if (fs.existsSync(configPath)) {
      dominio = fs.readFileSync(configPath, "utf-8").match(/dominio:\s*["'`]([^"'`]*)["'`]/)?.[1] ?? "";
    }
    const dominioOk = /^https?:\/\/[^/]+\.[^/]+/.test(dominio);
    saude.push({
      id: "dominio",
      label: "Domínio",
      valor: dominioOk ? dominio.replace(/^https?:\/\//, "").replace(/\/+$/, "") : "Não configurado",
      estado: dominioOk ? "ok" : "aviso",
      detalhe: dominioOk
        ? "Base das canonicals e do sitemap."
        : "Sem domínio completo (https://…) as canonicals e o sitemap ficam errados.",
    });

    saude.push({
      id: "rascunhos",
      label: "Posts fora do ar",
      valor: `${rascunhos + revisao}`,
      estado: "ok",
      detalhe: `${rascunhos} rascunho(s) e ${revisao} em revisão — não aparecem no site.`,
    });

    return NextResponse.json({
      ok: true,
      stats: {
        nomeSite,
        cidadeSite,
        slug,
        posts: { total: totalPosts, publicados, rascunhos, revisao },
        usuarios: totalUsuarios,
        ultimaPublicacao,
        ultimoBuild,
        build: { status: build.status, inicio: build.inicio, fim: build.fim, resumo: build.resumo, etapa: build.etapa },
        saude,
      },
    });
  } catch (err) {
    console.error("[api/stats GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
