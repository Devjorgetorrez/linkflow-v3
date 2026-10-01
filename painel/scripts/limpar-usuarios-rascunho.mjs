#!/usr/bin/env node
/**
 * scripts/limpar-usuarios-rascunho.mjs
 * Remove do usuarios.json os "rascunhos" que a tela antiga de "Adicionar
 * usuário" criava só de abrir: e-mail `rascunho-*@pendente` e SEM senha.
 *
 *   node scripts/limpar-usuarios-rascunho.mjs [--dir <LINKFLOW_DIR>]            # simulação (padrão)
 *   node scripts/limpar-usuarios-rascunho.mjs [--dir <LINKFLOW_DIR>] --aplicar  # grava (faz backup antes)
 *
 * O diretório vem de --dir ou de LINKFLOW_DIR. O backup fica ao lado:
 * usuarios.json.bak-<data>. Nunca remove quem tem senha.
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const aplicar = args.includes("--aplicar");
const iDir = args.indexOf("--dir");
const dir = (iDir >= 0 ? args[iDir + 1] : undefined) || process.env.LINKFLOW_DIR;
if (!dir) {
  console.error("Informe --dir <pasta do cliente> ou defina LINKFLOW_DIR.");
  process.exit(1);
}

const arquivo = path.join(dir, "usuarios.json");
if (!fs.existsSync(arquivo)) {
  console.error(`Não existe ${arquivo}`);
  process.exit(1);
}

let usuarios;
try {
  usuarios = JSON.parse(fs.readFileSync(arquivo, "utf-8"));
  if (!Array.isArray(usuarios)) throw new Error("o conteúdo não é uma lista");
} catch (err) {
  console.error(`usuarios.json ilegível (${err.message}). Nada foi alterado.`);
  process.exit(1);
}

const ehRascunho = (u) =>
  /^rascunho-.*@pendente$/i.test(u?.acesso?.emailLogin ?? "") && !u?.senhaHash;

const remover = usuarios.filter(ehRascunho);
const manter = usuarios.filter((u) => !ehRascunho(u));

console.log(`${usuarios.length} usuário(s); ${remover.length} rascunho(s) a remover; ${manter.length} a manter.`);
for (const u of remover) {
  console.log(`  - ${u.id}  ${u.acesso?.emailLogin}  (${u.autoria?.nomePublico || "sem nome"})`);
}

if (!aplicar) {
  console.log("\nSimulação (--dry-run). Nada foi gravado. Use --aplicar para gravar.");
  process.exit(0);
}
if (remover.length === 0) {
  console.log("Nada a fazer.");
  process.exit(0);
}
if (manter.length === 0) {
  console.error("Recusado: a limpeza deixaria o cadastro sem nenhum usuário.");
  process.exit(1);
}

const backup = `${arquivo}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
fs.copyFileSync(arquivo, backup);
const tmp = `${arquivo}.tmp-${process.pid}`;
fs.writeFileSync(tmp, JSON.stringify(manter, null, 2), "utf-8");
fs.renameSync(tmp, arquivo);
console.log(`\nGravado. Backup em ${backup}`);
console.log("Obs.: os arquivos content/autores/*.md gerados pelo painel são refeitos no próximo salvamento de usuário.");
