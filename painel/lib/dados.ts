/**
 * lib/dados.ts — Leitura e escrita de dados persistidos em JSON no VPS
 * Usado para leads, formulários e tarefas.
 */

import fs from "fs";
import path from "path";
import { getLinkflowDir } from "./fs";

function getDadosPath(arquivo: string): string {
  // Na arquitetura multi-cliente, LINKFLOW_DIR aponta para a pasta do cliente
  // Ex: /opt/linkflow/clientes/torrez-desentupidora/
  // dados/ fica dentro dessa pasta — isolado por cliente
  return path.join(getLinkflowDir(), "dados", arquivo);
}

export function lerDados<T>(arquivo: string, padrao: T): T {
  const filePath = getDadosPath(arquivo);
  if (!fs.existsSync(filePath)) return padrao;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return padrao;
  }
}

export function salvarDados<T>(arquivo: string, dados: T): void {
  const filePath = getDadosPath(arquivo);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), "utf-8");
}
