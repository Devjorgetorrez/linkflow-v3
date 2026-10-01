/**
 * app/api/autores/route.ts
 * GET /api/autores → lista os autores reais do cliente
 *
 * "Autor" não é armazenado separadamente — é derivado dos usuários com
 * podeAssinar=true e autoria preenchida em usuarios.json (o mesmo cadastro
 * usado para login). Evita duplicar dado e mantém um único cadastro de
 * pessoa por cliente, como o modelo original do Jorge previa
 * (Usuario.autoria já tem exatamente os campos de Autor).
 */

import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { lerUsuarios } from "@/lib/usuarios";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { ehAutorPublicavel } from "@/lib/sync-autores";
import { getContentDir, parseMd } from "@/lib/fs";

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["autores:GET"]);
  if (auth) return auth;

  const usuarios = lerUsuarios();

  const autores = usuarios
    .filter(ehAutorPublicavel) // mesmo filtro do site: rascunho sem slug/nome não vira autor
    .map((u) => ({
      id: u.id,
      nome: u.autoria!.nomePublico,
      slug: u.autoria!.slug,
      foto: u.autoria!.foto,
      fotoAlt: u.autoria!.fotoAlt ?? "",
      cargo: u.autoria!.cargo ?? "",
      // bioCurta vira meta_description da página do autor
      // (motor/indexaveis.ts) — sem o valor padrão, undefined chegava até
      // ix.meta_description.length e travava a Visão geral de SEO pra todo
      // cliente novo, o mesmo autor sem bio criado pelo instalador (erro 86,
      // causa real confirmada em "Detalhamento de Erros 78/79/28/87",
      // 30/09/2026 — corrige o Relatório de Testes 6, que tinha apontado
      // ix.title como a causa).
      bioCurta: u.autoria!.bioCurta ?? "",
      bioLonga: u.autoria!.bioLonga ?? "",
      conselho: u.autoria!.conselho ?? "",
      registro: u.autoria!.registro ?? "",
      // O primeiro admin (vps-setup PASSO 7) nasce só com nomePublico — os
      // campos abaixo ficam ausentes de verdade em usuarios.json, mesmo o
      // tipo Autor os declarando obrigatórios. Sem o valor padrão aqui,
      // Object.values(autor.redes) quebrava o editor de post pra todo
      // cliente novo (erro 85, Relatório de Testes 6).
      especialidades: u.autoria!.especialidades ?? [],
      formacao: u.autoria!.formacao ?? [],
      emailPublico: u.autoria!.emailPublico ?? "",
      redes: u.autoria!.redes ?? {},
      urlExterna: u.autoria!.urlExterna ?? "",
      destaque: u.autoria!.destaque ?? false,
      ativo: u.acesso?.ativo ?? true,
      usuarioId: u.id,
    }));

  // Autor que existe SÓ como arquivo do site (content/autores/<slug>.md,
  // escrito direto pelo agente pra um profissional da equipe que nunca
  // logou no painel) — caminho normal, não um caso raro (ver lib/sync-autores.ts,
  // nomeAutorDoArquivo/resolverAutorDoPost). Esta rota só olhava
  // usuarios.json, então a Fase 1/Visão geral de SEO sempre contava menos
  // páginas de autor do que o site realmente publica pra qualquer cliente
  // com autor assim (achado real, Verificação 3009 v2, item 79 revisado).
  const slugsJaListados = new Set(autores.map((a) => a.slug));
  const dirAutores = path.join(getContentDir(), "autores");
  if (fs.existsSync(dirAutores)) {
    for (const nome of fs.readdirSync(dirAutores)) {
      if (!nome.endsWith(".md")) continue;
      const slug = nome.replace(/\.md$/, "");
      if (slugsJaListados.has(slug)) continue; // cadastro do painel prevalece
      let raw: string;
      try {
        raw = fs.readFileSync(path.join(dirAutores, nome), "utf-8");
      } catch {
        continue;
      }
      const { frontmatter: fm } = parseMd(raw);
      const nomePublico = typeof fm.nome === "string" ? fm.nome.trim() : "";
      if (!nomePublico) continue; // mesmo limiar de ehAutorPublicavel: sem nome não é autor de verdade
      slugsJaListados.add(slug);
      autores.push({
        id: slug, // sem usuário no painel — o slug É o identificador
        nome: nomePublico,
        slug,
        foto: typeof fm.foto === "string" ? fm.foto : "",
        fotoAlt: typeof fm.fotoAlt === "string" ? fm.fotoAlt : "",
        cargo: typeof fm.cargo === "string" ? fm.cargo : "",
        bioCurta: typeof fm.bioCurta === "string" ? fm.bioCurta : "",
        bioLonga: typeof fm.bioLonga === "string" ? fm.bioLonga : "",
        conselho: typeof fm.conselho === "string" ? fm.conselho : "",
        registro: typeof fm.registro === "string" ? fm.registro : "",
        especialidades: Array.isArray(fm.especialidades) ? fm.especialidades : [],
        formacao: Array.isArray(fm.formacao) ? fm.formacao : [],
        emailPublico: typeof fm.email === "string" ? fm.email : "",
        redes: {
          instagram: "", linkedin: "", facebook: "",
          ...(fm.redes && typeof fm.redes === "object" ? fm.redes as Record<string, string> : {}),
        },
        urlExterna: "",
        destaque: false,
        ativo: fm.ativo !== false,
        usuarioId: "", // sem usuário no painel — o slug (acima) é o identificador de verdade
      });
    }
  }

  return NextResponse.json({ ok: true, autores });
}
