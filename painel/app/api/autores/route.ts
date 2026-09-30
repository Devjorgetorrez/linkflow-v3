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

import { NextRequest, NextResponse } from "next/server";
import { lerUsuarios } from "@/lib/usuarios";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { ehAutorPublicavel } from "@/lib/sync-autores";

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

  return NextResponse.json({ ok: true, autores });
}
