/**
 * lib/redirects.ts — redirecionamentos do site (SÓ servidor).
 *
 * Fonte: $LINKFLOW_DIR/dados/redirects.json (o que a tela de Redirects lê).
 * Cada gravação também refaz o arquivo `_redirects` na pasta publicada do site
 * (se ela existir), que é o que o site serve. Usado pelas rotas /api/redirects
 * e pela troca de slug de um post que já esteve no ar.
 */
import fs from "fs";
import path from "path";
import { lerDados, salvarDados } from "@/lib/dados";
import { getSiteSlug } from "@/lib/fs";
import { getSiteDir } from "@/lib/build-estado";
import { urlPost } from "@/lib/urls-publicas";
import { hojeISOBrasil } from "@/lib/data-br";
import type { Redirect } from "@/mock/types";

export function lerRedirects(): Redirect[] {
  const l = lerDados<Redirect[]>("redirects.json", []);
  return Array.isArray(l) ? l : [];
}

/** Grava a lista (atômico) e refaz o `_redirects` do site publicado. */
export function salvarRedirects(redirects: Redirect[]): void {
  salvarDados("redirects.json", redirects);
  gerarArquivoRedirects(redirects);
}

export function gerarArquivoRedirects(redirects: Redirect[]): void {
  const linhas = redirects.map((r) => (r.codigo === 410 ? `${r.origem}  /410  410` : `${r.origem}  ${r.destino}  ${r.codigo}`));
  try {
    const siteDir = getSiteDir(getSiteSlug());
    if (fs.existsSync(siteDir)) {
      const arq = path.join(siteDir, "_redirects");
      const tmp = `${arq}.tmp-${process.pid}`;
      fs.writeFileSync(tmp, linhas.join("\n"), "utf-8");
      fs.renameSync(tmp, arq);
    }
  } catch {
    /* sem permissão / pasta ainda não existe: o redirects.json continua sendo a fonte */
  }
}

/** O post `slug` aparece no site já publicado? (pasta do build tem a página) */
export function postEstaNoSite(slug: string): boolean {
  try {
    const dir = getSiteDir(getSiteSlug());
    return fs.existsSync(path.join(dir, slug, "index.html")) || fs.existsSync(path.join(dir, `${slug}.html`));
  } catch {
    return false;
  }
}

export interface ResultadoRenomeacao {
  /** redirecionamento novo (ou atualizado) do endereço antigo para o novo; null se nenhum foi necessário */
  criado: { origem: string; destino: string } | null;
  /** redirecionamentos que apontavam para o endereço antigo e passaram a apontar direto para o novo (sem cadeia) */
  religados: number;
  /** redirecionamento removido porque o endereço novo já foi origem de um (volta ao endereço original) */
  removidos: number;
}

/**
 * O post mudou de endereço: /antigo → /novo (301), sem duplicar, sem cadeia e sem laço.
 *  - quem apontava para /antigo passa a apontar para /novo (A→B, B→C ⇒ A→C);
 *  - se /novo era origem de um redirect (voltou ao endereço original), esse redirect sai;
 *  - nunca fica redirect de um endereço para ele mesmo.
 */
export function registrarRenomeacao(slugAntigo: string, slugNovo: string): ResultadoRenomeacao {
  const origem = urlPost(slugAntigo);
  const destino = urlPost(slugNovo);
  let lista = lerRedirects();
  const antes = lista.length;

  // 1) o endereço novo passa a existir: nada pode redirecionar A PARTIR dele
  lista = lista.filter((r) => r.origem !== destino);
  const removidos = antes - lista.length;

  // 2) quem apontava para o endereço antigo aponta direto para o novo
  let religados = 0;
  let primeiroReligado = "";
  lista = lista.map((r) => {
    if (r.codigo !== 410 && r.destino === origem) {
      religados++;
      if (!primeiroReligado) primeiroReligado = r.origem;
      return { ...r, destino };
    }
    return r;
  });
  // ...e não sobra redirect que virou "endereço para ele mesmo"
  lista = lista.filter((r) => r.origem !== r.destino);

  // Endereço só de passagem (nunca foi ao ar: o redirect A→antigo foi criado por uma troca de slug
  // anterior e o build não chegou a publicá-lo): basta A→novo, sem redirect que ninguém usou.
  if (religados > 0 && !postEstaNoSite(slugAntigo) && lista.some((r) => r.destino === destino && r.origem !== origem)) {
    salvarRedirects(lista.filter((r) => r.origem !== origem));
    return { criado: { origem: primeiroReligado, destino }, religados, removidos };
  }

  // 3) o redirect do endereço antigo (um só: substitui o que existir, inclusive 410)
  const hoje = hojeISOBrasil();
  const idx = lista.findIndex((r) => r.origem === origem);
  const novo: Redirect = {
    id: idx >= 0 ? lista[idx].id : `r${Date.now()}`,
    origem,
    destino,
    codigo: 301,
    criadoPor: "slug-alterado",
    hits: idx >= 0 ? lista[idx].hits ?? 0 : 0,
    data: hoje,
  };
  if (idx >= 0) lista[idx] = novo;
  else lista.push(novo);

  salvarRedirects(lista);
  return { criado: { origem, destino }, religados, removidos };
}

/** Um post passou a existir em /slug (criado, restaurado): nenhum redirect pode sair dele. */
export function liberarEnderecoDePost(slug: string): number {
  const endereco = urlPost(slug);
  const lista = lerRedirects();
  const resto = lista.filter((r) => r.origem !== endereco);
  if (resto.length === lista.length) return 0;
  salvarRedirects(resto);
  return lista.length - resto.length;
}
