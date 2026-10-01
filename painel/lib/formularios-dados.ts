/**
 * lib/formularios-dados.ts — leitura de formulários no servidor (com o "contato" semeado)
 * e origens permitidas do site para o CORS de /api/submissao.
 */
import fs from "fs";
import path from "path";
import { lerDados, salvarDados } from "./dados";
import { getConfigPath, getLinkflowDir } from "./fs";
import { lerSite } from "./site-config";
import { formularioPadraoContato } from "./formularios-regras";
import type { Formulario, Lead } from "@/mock/types";

const MARCADOR = ".formularios-semeado";

/** Normaliza um registro (inclusive os antigos, com destinos que não existem mais). */
function normalizar(f: Partial<Formulario> & Record<string, unknown>): Formulario {
  const base = formularioPadraoContato();
  return {
    id: String(f.id ?? ""),
    nome: String(f.nome ?? ""),
    campos: Array.isArray(f.campos) ? f.campos : [],
    msgSucesso: typeof f.msgSucesso === "string" && f.msgSucesso ? f.msgSucesso : base.msgSucesso,
    msgErro: typeof f.msgErro === "string" && f.msgErro ? f.msgErro : base.msgErro,
    exigeLgpd: f.exigeLgpd === true,
    lgpdTexto: typeof f.lgpdTexto === "string" ? f.lgpdTexto : "",
    lgpdPoliticaUrl: typeof f.lgpdPoliticaUrl === "string" ? f.lgpdPoliticaUrl : "",
    usadoEm: Array.isArray(f.usadoEm) ? f.usadoEm.map(String) : [],
    envios30d: 0,
    ativo: f.ativo !== false,
  };
}

/**
 * Lê os formulários. Se o arquivo não existe (ou é o `[]` do instalador e nunca
 * houve semeadura), grava o formulário padrão "contato" — o site já tem um.
 * Nunca sobrescreve um arquivo com conteúdo. Depois de semeado, apagar tudo é
 * respeitado (marcador em dados/).
 */
export function lerFormularios(): Formulario[] {
  const dir = path.join(getLinkflowDir(), "dados");
  const arq = path.join(dir, "formularios.json");
  const marcador = path.join(dir, MARCADOR);
  let lista = lerDados<Record<string, unknown>[]>("formularios.json", []);
  if (!Array.isArray(lista)) lista = [];
  if (lista.length === 0 && (!fs.existsSync(arq) || !fs.existsSync(marcador))) {
    const semente = [formularioPadraoContato()];
    salvarDados("formularios.json", semente);
    try { fs.writeFileSync(marcador, new Date().toISOString(), "utf-8"); } catch { /* sem marcador: só reavalia depois */ }
    lista = semente as unknown as Record<string, unknown>[];
  }
  return lista.map((f) => normalizar(f as Partial<Formulario> & Record<string, unknown>));
}

/** Grava a lista (usada pelas rotas depois de um ler→alterar sem await no meio). */
export function gravarFormularios(lista: Formulario[]): void {
  salvarDados("formularios.json", lista.map((f) => ({ ...f, envios30d: undefined })));
}

/** Preenche envios30d com base nos leads reais (últimos 30 dias). */
export function comContadores(lista: Formulario[], leads: Lead[]): Formulario[] {
  const corte = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return lista.map((f) => ({
    ...f,
    envios30d: leads.filter((l) => l.formularioId === f.id && new Date(l.data).getTime() > corte).length,
  }));
}

/** Origens que podem chamar /api/submissao pelo navegador. */
export function origensPermitidas(): string[] {
  const set = new Set<string>();
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    const dominio = String(lerSite(raw).dominio ?? "")
      .replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim().toLowerCase();
    if (dominio) {
      const sem = dominio.replace(/^www\./, "");
      set.add(`https://${sem}`);
      set.add(`https://www.${sem}`);
    }
  } catch { /* sem site.ts: só as origens extras/de desenvolvimento */ }
  if (process.env.NODE_ENV !== "production" || process.env.LINKFLOW_ORIGENS_EXTRA) {
    if (process.env.NODE_ENV !== "production") {
      set.add("http://localhost:4321");
      set.add("http://localhost:4322");
    }
    for (const o of (process.env.LINKFLOW_ORIGENS_EXTRA ?? "").split(",")) {
      const v = o.trim().replace(/\/+$/, "");
      if (v) set.add(v);
    }
  }
  return [...set];
}
