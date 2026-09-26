#!/usr/bin/env node
/**
 * painel_redefinir_senha.cjs — redefine a senha de um usuário do painel SiteFlow.
 *
 * Por que é um script e não uma rota do painel: o painel só aceita a chave de
 * API para criar o PRIMEIRO administrador (bootstrap). Uma rota de "reset por
 * chave" abriria uma porta a mais. Aqui a redefinição exige acesso ao servidor
 * (SSH), que quem controla o site já tem, e é feita pela skill painel-senha.
 *
 * Uso:
 *   NODE_PATH=<pasta do painel>/node_modules \
 *     node painel_redefinir_senha.cjs <usuarios.json> <email>
 *
 * Saída (stdout, uma linha por informação; a skill lê estas linhas):
 *   USUARIO=<email>
 *   SENHA_PROVISORIA=<senha>          (só neste momento; nunca é gravada em claro)
 * Códigos de saída: 0 ok | 2 e-mail não encontrado | 3 usuário inativo | 1 erro
 *
 * Grava uma cópia de segurança do usuarios.json antes de alterar, e troca o
 * arquivo por escrita atômica (arquivo temporário + rename).
 */

const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Sem caracteres ambíguos (0/O, 1/l/I): a senha provisória é lida e digitada por gente.
const ALFABETO = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TAMANHO = 14;

function gerarSenha() {
  let s = "";
  for (let i = 0; i < TAMANHO; i++) s += ALFABETO[crypto.randomInt(ALFABETO.length)];
  return s;
}

function mascarar(email) {
  const [u, d] = String(email).split("@");
  if (!d) return "***";
  return `${u.slice(0, 2)}${"*".repeat(Math.max(u.length - 2, 1))}@${d}`;
}

const [, , arquivo, emailAlvo] = process.argv;
if (!arquivo || !emailAlvo) {
  console.error("Uso: node painel_redefinir_senha.cjs <usuarios.json> <email>");
  process.exit(1);
}

let usuarios;
try {
  usuarios = JSON.parse(fs.readFileSync(arquivo, "utf-8"));
  if (!Array.isArray(usuarios)) throw new Error("formato inesperado (esperava uma lista)");
} catch (e) {
  console.error(`Não consegui ler ${arquivo}: ${e.message}`);
  process.exit(1);
}

const alvo = usuarios.find(
  (u) => String(u?.acesso?.emailLogin ?? "").toLowerCase() === emailAlvo.trim().toLowerCase(),
);

if (!alvo) {
  console.error(`Nenhum usuário com o e-mail ${emailAlvo}.`);
  const cadastrados = usuarios.map((u) => u?.acesso?.emailLogin).filter(Boolean).map(mascarar);
  if (cadastrados.length) console.error(`Cadastrados (parcialmente ocultos): ${cadastrados.join(", ")}`);
  process.exit(2);
}

if (alvo.acesso?.ativo === false) {
  console.error(
    `O usuário ${emailAlvo} está desativado. A senha não foi alterada: reativar um acesso é decisão de um administrador, no painel.`,
  );
  process.exit(3);
}

try {
  const senha = gerarSenha();
  alvo.senhaHash = bcrypt.hashSync(senha, 10);

  const carimbo = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  fs.copyFileSync(arquivo, `${arquivo}.bak-${carimbo}`);

  const tmp = `${arquivo}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(usuarios, null, 2), { encoding: "utf-8", mode: 0o600 });
  fs.renameSync(tmp, arquivo);

  console.log(`USUARIO=${alvo.acesso.emailLogin}`);
  console.log(`SENHA_PROVISORIA=${senha}`);
} catch (e) {
  console.error(`Falha ao gravar: ${e.message}`);
  process.exit(1);
}
