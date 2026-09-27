/**
 * lib/servicos-fs.ts — arquivos de serviço no servidor (SÓ servidor).
 * Espelha lib/posts-fs.ts para a coleção `servicos`.
 *
 * - Serviços vivos: $LINKFLOW_DIR/_astro/src/content/servicos/<slug>.md
 * - Lixeira:        $LINKFLOW_DIR/dados/lixeira/servicos/<chave>.md — FORA de
 *   _astro/src/content, então o build do site nunca lê o que está na lixeira.
 *   Lixeira PRÓPRIA (não reaproveita dados/lixeira/posts — coleções diferentes).
 * Toda gravação é atômica (temporário + rename) — reaproveita gravarAtomico/
 * gravarNovoAtomico de lib/posts-fs.ts, que já são genéricos (não dependem de post).
 */
import fs from "fs";
import path from "path";
import { getContentDir, getLinkflowDir } from "@/lib/fs";
import { gravarAtomico, gravarNovoAtomico } from "@/lib/posts-fs";
import { SLUGS_RESERVADOS_SERVICO } from "@/lib/servicos-regras";

export { gravarAtomico, gravarNovoAtomico };

export function dirServicos(): string {
  return path.join(getContentDir(), "servicos");
}

export function dirLixeiraServicos(): string {
  return path.join(getLinkflowDir(), "dados", "lixeira", "servicos");
}

export function caminhoServico(slug: string): string {
  return path.join(dirServicos(), `${slug}.md`);
}

export function caminhoLixeiraServico(chave: string): string {
  return path.join(dirLixeiraServicos(), `${chave}.md`);
}

/**
 * O slug de um serviço é a URL real do site (rota plana, `/slug`) — por
 * isso colide com tudo que também mora na raiz: outros serviços, posts, e o
 * próprio slug reservado das rotas da API. Colisão com posts/pilar é
 * responsabilidade de quem chama (posts-fs.slugOcupado), verificada à parte
 * para não criar dependência circular entre as duas libs.
 */
export function slugOcupadoPorServico(slug: string): boolean {
  return SLUGS_RESERVADOS_SERVICO.includes(slug) || fs.existsSync(caminhoServico(slug));
}

/** `base`, `base-2`, `base-3`… o primeiro que não colide com nada em `ocupado`. */
export function slugLivreServico(base: string, ocupado: (slug: string) => boolean, ignorar?: string): string {
  const raiz = base || "servico";
  const livre = (s: string) => s === ignorar || !ocupado(s);
  if (livre(raiz)) return raiz;
  for (let n = 2; n < 1000; n++) {
    const candidato = `${raiz}-${n}`;
    if (livre(candidato)) return candidato;
  }
  return `${raiz}-${Date.now()}`;
}

function chaveLivreNaLixeira(slug: string): string {
  if (!fs.existsSync(caminhoLixeiraServico(slug))) return slug;
  for (let n = 2; n < 1000; n++) {
    if (!fs.existsSync(caminhoLixeiraServico(`${slug}-${n}`))) return `${slug}-${n}`;
  }
  return `${slug}-${Date.now()}`;
}

/** Move o serviço para a lixeira própria. Devolve a chave na lixeira, ou null se não existe. */
export function moverServicoParaLixeira(slug: string): string | null {
  const origem = caminhoServico(slug);
  if (!fs.existsSync(origem)) return null;
  const chave = chaveLivreNaLixeira(slug);
  const destino = caminhoLixeiraServico(chave);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  try {
    fs.renameSync(origem, destino);
  } catch {
    fs.copyFileSync(origem, destino);
    fs.unlinkSync(origem);
  }
  return chave;
}

/** Tira da lixeira de volta para os serviços, sem sobrescrever ninguém. Devolve o slug final. */
export function restaurarServicoDaLixeira(chave: string, ocupado: (slug: string) => boolean): string | null {
  const origem = caminhoLixeiraServico(chave);
  if (!fs.existsSync(origem)) return null;
  const slug = slugLivreServico(chave, ocupado);
  const conteudo = fs.readFileSync(origem, "utf-8");
  if (!gravarNovoAtomico(caminhoServico(slug), conteudo)) return restaurarServicoDaLixeira(chave, ocupado); // corrida
  fs.unlinkSync(origem);
  return slug;
}

export function excluirServicoDaLixeira(chave: string): boolean {
  const alvo = caminhoLixeiraServico(chave);
  if (!fs.existsSync(alvo)) return false;
  fs.unlinkSync(alvo);
  return true;
}

export function chavesDaLixeiraServicos(): string[] {
  const dir = dirLixeiraServicos();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort();
}

export function slugsDeServicosExistentes(): string[] {
  const dir = dirServicos();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort();
}
