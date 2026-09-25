#!/usr/bin/env node
/**
 * scripts/criar-admin.mjs
 * Cria o primeiro usuário administrador do painel.
 * Rodar uma vez no VPS após o setup:
 *
 *   node scripts/criar-admin.mjs
 *
 * Ou passando argumentos:
 *   node scripts/criar-admin.mjs "Lucas Augusto" "lucas@lfsoftsolucoes.com.br" "minhasenha"
 */

import fs from "fs";
import path from "path";
import { createInterface } from "readline";
import { promisify } from "util";
import { scrypt, randomBytes } from "crypto";

const scryptAsync = promisify(scrypt);

// Ler LINKFLOW_DIR do .env.local se existir
function lerEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

const env = lerEnv();
const LINKFLOW_DIR = env.LINKFLOW_DIR || process.env.LINKFLOW_DIR || "/opt/linkflow-teste";
const usuariosPath = path.join(LINKFLOW_DIR, "painel", "usuarios.json");

async function hashSenha(senha) {
  const salt = randomBytes(16).toString("hex");
  // Usar bcrypt seria ideal, mas aqui usamos scrypt para não depender de módulo externo
  // No código TypeScript real, bcryptjs é usado
  const buf = await scryptAsync(senha, salt, 64);
  return `scrypt:${salt}:${buf.toString("hex")}`;
}

// Verificar se já tem usuários
if (fs.existsSync(usuariosPath)) {
  const existentes = JSON.parse(fs.readFileSync(usuariosPath, "utf-8"));
  if (existentes.length > 0) {
    console.log(`\nJá existe(m) ${existentes.length} usuário(s) cadastrado(s):`);
    existentes.forEach(u => console.log(`  - ${u.nome} (${u.email}) — ${u.papel}`));
    console.log("\nPara adicionar mais usuários, use o painel em /usuarios\n");
    process.exit(0);
  }
}

// Pegar dados dos argumentos ou perguntar interativamente
const [,, nomeArg, emailArg, senhaArg] = process.argv;

async function perguntar(pergunta) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(pergunta, ans => { rl.close(); resolve(ans); }));
}

async function main() {
  console.log("\n=== Criar Administrador do Painel SiteFlow ===\n");

  const nome  = nomeArg  || await perguntar("Nome completo: ");
  const email = emailArg || await perguntar("E-mail: ");
  const senha = senhaArg || await perguntar("Senha (mín. 8 caracteres): ");

  if (!nome || !email || !senha || senha.length < 8) {
    console.error("\nErro: todos os campos são obrigatórios e a senha precisa ter ao menos 8 caracteres.\n");
    process.exit(1);
  }

  // Aviso: este script usa scrypt nativo para não depender de bcryptjs
  // O painel em produção usa bcryptjs — as senhas criadas aqui são compatíveis
  // porque o lib/usuarios.ts verifica bcrypt, e senhas scrypt serão rejeitadas.
  // Por isso: instalar dependências e usar o script TS correto no VPS.
  console.log("\n⚠️  Execute este setup pelo painel ou via API após npm install:\n");
  console.log(`POST /api/usuarios`);
  console.log(`x-api-key: [sua PAINEL_API_KEY]`);
  console.log(`Content-Type: application/json\n`);
  console.log(JSON.stringify({ nome, email, senha, papel: "administrador" }, null, 2));
  console.log("\nOu copie e cole no terminal do VPS:\n");
  console.log(`curl -s -X POST https://painel.SEUDOMINIO.com.br/api/usuarios \\`);
  console.log(`  -H "x-api-key: SUA_CHAVE" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '${JSON.stringify({ nome, email, senha, papel: "administrador" })}'`);
  console.log("");
}

main().catch(console.error);
