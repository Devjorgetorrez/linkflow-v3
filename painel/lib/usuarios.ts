/**
 * lib/usuarios.ts — Gestão de usuários armazenados em arquivo JSON
 *
 * Estrutura completa do modelo do Jorge:
 * - acesso: email, papel, ativo (para login no painel)
 * - autoria: perfil público de autor (nome, bio, credenciais, redes)
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { getLinkflowDir } from "./fs";
import { sincronizarAutores } from "./sync-autores";

export type PapelUsuario = "administrador" | "editor" | "autor";

export interface UsuarioAutoria {
  nomePublico: string;
  slug: string;
  foto: string;
  fotoAlt?: string;
  cargo: string;
  bioCurta: string;
  bioLonga: string;
  conselho: string;
  registro: string;
  especialidades: string[];
  formacao: string[];
  emailPublico: string;
  redes: {
    instagram: string;
    linkedin: string;
    facebook: string;
    x?: string;
    youtube?: string;
    tiktok?: string;
    site?: string;
    lattes?: string;
  };
  urlExterna: string;
  destaque?: boolean;
}

export interface Usuario {
  id: string;
  // Modelo do Jorge
  podeAcessar: boolean;
  acesso?: {
    emailLogin: string;
    papel: PapelUsuario;
    ativo: boolean;
  };
  podeAssinar: boolean;
  autoria?: UsuarioAutoria;
  // Campos internos (não expostos no modelo do Jorge)
  senhaHash?: string;
  criadoEm?: string;
  // Computed helpers
  iniciais?: string;
}

export interface UsuarioPublico extends Omit<Usuario, "senhaHash"> {}

export function getUsuariosPath(): string {
  // Na arquitetura multi-cliente, cada cliente tem seu usuarios.json isolado
  // LINKFLOW_DIR aponta para a pasta do cliente:
  // /opt/linkflow/clientes/[slug]/usuarios.json
  return path.join(getLinkflowDir(), "usuarios.json");
}

/** usuarios.json existe mas não dá para ler: NÃO tratar como "sem usuários". */
export class UsuariosIlegiveisError extends Error {
  constructor(detalhe: string) {
    super(
      `usuarios.json ilegível (${detalhe}). Nada foi alterado. Restaure o backup usuarios.json.bak ` +
        "ou corrija o arquivo antes de continuar.",
    );
    this.name = "UsuariosIlegiveisError";
  }
}

/** Id novo (UUID). Ids antigos `u<timestamp>` continuam válidos. */
export function novoIdUsuario(): string {
  return crypto.randomUUID();
}

export function lerUsuarios(): Usuario[] {
  const filePath = getUsuariosPath();
  if (!fs.existsSync(filePath)) return [];
  let dados: unknown;
  try {
    dados = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    throw new UsuariosIlegiveisError(err instanceof Error ? err.message : String(err));
  }
  if (!Array.isArray(dados)) throw new UsuariosIlegiveisError("o conteúdo não é uma lista");
  return dados as Usuario[];
}

export function salvarUsuarios(usuarios: Usuario[]): void {
  const filePath = getUsuariosPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Escrita atômica: grava num temporário e troca de nome; o arquivo anterior
  // (se legível) vira usuarios.json.bak. Nunca deixa o JSON pela metade.
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(usuarios, null, 2), "utf-8");
  if (fs.existsSync(filePath)) {
    try {
      JSON.parse(fs.readFileSync(filePath, "utf-8"));
      fs.copyFileSync(filePath, `${filePath}.bak`);
    } catch {
      // arquivo atual corrompido: não sobrescreve um backup bom com lixo
    }
  }
  fs.renameSync(tmp, filePath);

  // Espelha os autores no site (content/autores/). Falha aqui não pode
  // impedir o salvamento do usuário — só registra no log.
  try {
    sincronizarAutores(usuarios);
  } catch (err) {
    console.error("[usuarios] falha ao sincronizar autores no site:", err);
  }
}

export function buscarPorEmail(email: string): Usuario | null {
  const usuarios = lerUsuarios();
  return usuarios.find((u) =>
    u.acesso?.emailLogin.toLowerCase() === email.toLowerCase()
  ) ?? null;
}

export function buscarPorId(id: string): Usuario | null {
  const usuarios = lerUsuarios();
  return usuarios.find((u) => u.id === id) ?? null;
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export function toPublico(u: Usuario): UsuarioPublico {
  const { senhaHash: _, ...pub } = u;
  // Adicionar iniciais derivadas
  const nome = u.autoria?.nomePublico || u.acesso?.emailLogin || "";
  return {
    ...pub,
    iniciais: nome.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "?",
  };
}
