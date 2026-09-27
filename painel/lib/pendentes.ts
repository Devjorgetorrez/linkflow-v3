/**
 * lib/pendentes.ts — quantas alterações ainda NÃO foram para o site (SÓ servidor).
 *
 * Conta os arquivos de conteúdo (posts, serviços, equipe, depoimentos,
 * autores, categorias e o config/site.ts) modificados depois do INÍCIO do
 * último build ok — quem edita durante o build fica pendente, porque o
 * build pode ter lido a versão antiga. Nunca publicado: todos os itens com
 * conteúdo real (arquivo não vazio; nomes começados por "_" ou "." são
 * modelo/ocultos e não contam). Uma exclusão (post foi para a lixeira) não
 * deixa arquivo novo, mas muda a pasta: conta como 1 alteração por pasta.
 *
 * Vem do disco a cada consulta: recarregar a página (F5) não zera nada.
 */
import fs from "fs";
import path from "path";
import { getConfigPath, getContentDir, getLinkflowDir } from "@/lib/fs";

const COLECOES = ["posts", "servicos", "equipe", "depoimentos", "autores", "categorias"];

export function arquivoUltimoBuildOk(): string {
  return path.join(getLinkflowDir(), "dados", "ultimo-build-ok.json");
}

/** Início do último build que terminou ok (ms), ou null se nunca houve. */
export function inicioUltimoBuildOk(): number | null {
  const ler = (arq: string, exigirOk: boolean): number | null => {
    try {
      const j = JSON.parse(fs.readFileSync(arq, "utf-8"));
      if (exigirOk && j.status !== "ok") return null;
      const t = Date.parse(String(j.inicio ?? j.fim ?? ""));
      return Number.isFinite(t) ? t : null;
    } catch {
      return null;
    }
  };
  // servidor antigo: ainda sem ultimo-build-ok.json, mas o estado do último build é ok
  return ler(arquivoUltimoBuildOk(), false) ?? ler(path.join(getLinkflowDir(), "dados", "build-estado.json"), true);
}

function arquivosDe(dir: string): { arq: string; stat: fs.Stats }[] {
  if (!fs.existsSync(dir)) return [];
  const saida: { arq: string; stat: fs.Stats }[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith("_") || e.name.startsWith(".") || e.name.includes(".tmp-")) continue;
    const arq = path.join(dir, e.name);
    if (e.isDirectory()) saida.push(...arquivosDe(arq));
    else if (/\.(md|mdx|json|ya?ml)$/i.test(e.name)) {
      try {
        saida.push({ arq, stat: fs.statSync(arq) });
      } catch {
        /* sumiu no meio */
      }
    }
  }
  return saida;
}

export interface Pendentes {
  pendentes: number;
  /** nunca houve build ok: tudo com conteúdo conta */
  nuncaPublicado: boolean;
}

export function contarPendentes(): Pendentes {
  const ref = inicioUltimoBuildOk();
  let n = 0;

  const conta = (dir: string) => {
    const itens = arquivosDe(dir);
    if (ref === null) {
      n += itens.filter((i) => i.stat.size > 0).length;
      return;
    }
    const novos = itens.filter((i) => i.stat.mtimeMs > ref).length;
    n += novos;
    // Posts excluídos têm contagem própria (lixeira, abaixo). Nas outras pastas, sem arquivo novo
    // mas com a pasta mudada, houve exclusão.
    if (novos === 0 && path.basename(dir) !== "posts") {
      // exclusão/troca de nome: sem arquivo novo, mas a pasta mudou depois do build
      try {
        if (fs.statSync(dir).mtimeMs > ref) n += 1;
      } catch {
        /* pasta não existe */
      }
    }
  };

  const base = getContentDir();
  for (const c of COLECOES) conta(path.join(base, c));

  // Post enviado à lixeira depois do último build: some do site na próxima atualização.
  // (o arquivo mantém o mtime antigo ao mudar de pasta; o que muda é o ctime)
  if (ref !== null) {
    try {
      const lix = path.join(getLinkflowDir(), "dados", "lixeira", "posts");
      for (const nome of fs.readdirSync(lix)) {
        if (!nome.endsWith(".md")) continue;
        if (fs.statSync(path.join(lix, nome)).ctimeMs > ref) n += 1;
      }
    } catch {
      /* sem lixeira */
    }
  }

  try {
    const cfg = getConfigPath();
    const st = fs.statSync(cfg);
    if (ref === null ? st.size > 0 : st.mtimeMs > ref) n += 1;
  } catch {
    /* sem config/site.ts */
  }
  return { pendentes: n, nuncaPublicado: ref === null };
}
