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
import { verificarAcesso } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  const usuarios = lerUsuarios();

  const autores = usuarios
    .filter((u) => u.podeAssinar && u.autoria)
    .map((u) => ({
      id: u.id,
      nome: u.autoria!.nomePublico,
      slug: u.autoria!.slug,
      foto: u.autoria!.foto,
      fotoAlt: u.autoria!.fotoAlt ?? "",
      cargo: u.autoria!.cargo,
      bioCurta: u.autoria!.bioCurta,
      bioLonga: u.autoria!.bioLonga,
      conselho: u.autoria!.conselho,
      registro: u.autoria!.registro,
      especialidades: u.autoria!.especialidades,
      formacao: u.autoria!.formacao,
      emailPublico: u.autoria!.emailPublico,
      redes: u.autoria!.redes,
      urlExterna: u.autoria!.urlExterna,
      destaque: u.autoria!.destaque ?? false,
      ativo: u.acesso?.ativo ?? true,
      usuarioId: u.id,
    }));

  return NextResponse.json({ ok: true, autores });
}
