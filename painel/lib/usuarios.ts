/**
 * lib/usuarios.ts — Gestão de usuários armazenados em arquivo JSON
 *
 * Estrutura completa do modelo do Jorge:
 * - acesso: email, papel, ativo (para login no painel)
 * - autoria: perfil público de autor (nome, bio, credenciais, redes)
 */

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

export function lerUsuarios(): Usuario[] {
  const filePath = getUsuariosPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

export function salvarUsuarios(usuarios: Usuario[]): void {
  const filePath = getUsuariosPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(usuarios, null, 2), "utf-8");

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
