/**
 * lib/build-estado.ts — publicação do site (build do Astro) com estado real.
 *
 * Estado do ÚLTIMO build em $LINKFLOW_DIR/dados/build-estado.json:
 *   status: nunca | rodando | ok | erro, início/fim, duração, resumo da falha,
 *   fim do log e o nome do log completo em dados/logs/build-<carimbo>.log
 *   (mantém os últimos LOGS_MANTIDOS).
 *
 * Um build por vez (lockfile dados/build.lock, criado com "wx"), timeout duro
 * (LINKFLOW_BUILD_TIMEOUT_MS, padrão 5 min) que mata a árvore de processos e
 * marca erro. Antes de construir, valida o conteúdo contra o schema — se
 * houver erro, o build nem começa. Todo arquivo de estado é gravado de forma
 * atômica (tmp + rename).
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { getLinkflowDir } from "@/lib/fs";
import { validarConteudoSite, ErroConteudo } from "@/lib/validar-conteudo";

export type StatusBuild = "nunca" | "rodando" | "ok" | "erro";

export interface EstadoBuild {
  status: StatusBuild;
  id?: string;
  etapa?: "validando" | "construindo" | "copiando";
  inicio?: string; // ISO
  fim?: string; // ISO
  duracaoMs?: number;
  timeoutMs?: number;
  resumo?: string;
  final?: string; // últimas linhas do log, quando falhou
  erros?: ErroConteudo[]; // problemas de conteúdo que impediram o build
  log?: string; // nome do arquivo em dados/logs
}

const LOGS_MANTIDOS = 10;
const ESTADO_NUNCA: EstadoBuild = { status: "nunca" };

interface Ativo {
  id: string;
  filho: ChildProcess | null;
}
const g = globalThis as unknown as { __lfBuildAtivo?: Ativo | null };

export function timeoutBuildMs(): number {
  const n = Number(process.env.LINKFLOW_BUILD_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 1000 ? n : 5 * 60 * 1000;
}

export function getSiteDir(slug: string): string {
  return process.env.LINKFLOW_SITE_DIR || `/var/www/${slug}`;
}

function dirDados() {
  return path.join(getLinkflowDir(), "dados");
}
function dirLogs() {
  return path.join(dirDados(), "logs");
}
function arqEstado() {
  return path.join(dirDados(), "build-estado.json");
}
function arqLock() {
  return path.join(dirDados(), "build.lock");
}

export function escreverAtomico(arquivo: string, conteudo: string) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const tmp = `${arquivo}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, conteudo, "utf-8");
  try {
    fs.renameSync(tmp, arquivo);
  } catch {
    // Windows: destino aberto por outro leitor — uma nova tentativa basta
    fs.renameSync(tmp, arquivo);
  }
}

function gravarEstado(e: EstadoBuild) {
  escreverAtomico(arqEstado(), JSON.stringify(e, null, 2));
  // O contador de alterações pendentes (lib/pendentes.ts) mede contra o último build OK,
  // mesmo que um build com erro venha depois e troque o estado.
  if (e.status === "ok") {
    escreverAtomico(path.join(dirDados(), "ultimo-build-ok.json"), JSON.stringify({ inicio: e.inicio, fim: e.fim }, null, 2));
  }
}

/** Data (fim) do último build que terminou OK — null se nunca houve um. */
export function ultimoBuildOk(): { inicio: string; fim: string } | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(dirDados(), "ultimo-build-ok.json"), "utf-8"));
  } catch {
    return null;
  }
}

function pidVivo(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Lê o estado do disco. Um "rodando" sem processo por trás (painel
 *  reiniciado no meio do build) vira erro, para a tela não ficar presa. */
export function lerEstado(): EstadoBuild {
  let e: EstadoBuild = ESTADO_NUNCA;
  try {
    const parsed = JSON.parse(fs.readFileSync(arqEstado(), "utf-8"));
    if (parsed && typeof parsed.status === "string") e = parsed as EstadoBuild;
  } catch {
    return ESTADO_NUNCA;
  }
  if (e.status === "rodando" && !g.__lfBuildAtivo) {
    let lockVivo = false;
    try {
      const lock = JSON.parse(fs.readFileSync(arqLock(), "utf-8"));
      lockVivo = typeof lock.pid === "number" && lock.pid !== process.pid && pidVivo(lock.pid);
    } catch {
      /* sem lock */
    }
    if (!lockVivo) {
      const fim = new Date();
      e = {
        ...e,
        status: "erro",
        etapa: undefined,
        fim: fim.toISOString(),
        duracaoMs: e.inicio ? fim.getTime() - new Date(e.inicio).getTime() : undefined,
        resumo: "A publicação foi interrompida (o painel foi reiniciado durante o processo). Publique de novo.",
      };
      try {
        gravarEstado(e);
        liberarLock();
      } catch {
        /* segue com o estado em memória */
      }
    }
  }
  return e;
}

/** Caminho do log completo do último build (nome vindo só do estado). */
export function caminhoLogUltimo(): string | null {
  const nome = lerEstado().log;
  if (!nome || !/^build-[\w.-]+\.log$/.test(nome)) return null;
  const p = path.join(dirLogs(), nome);
  return fs.existsSync(p) ? p : null;
}

// ─── Lock ─────────────────────────────────────────────────────────────────────

function tomarLock(id: string): boolean {
  fs.mkdirSync(dirDados(), { recursive: true });
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      fs.writeFileSync(arqLock(), JSON.stringify({ pid: process.pid, id, inicio: Date.now() }), { flag: "wx" });
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      // lock antigo: dono morto, ou mesmo processo sem build ativo, ou velho demais
      let velho = false;
      try {
        const lock = JSON.parse(fs.readFileSync(arqLock(), "utf-8"));
        const idade = Date.now() - Number(lock.inicio ?? 0);
        const donoMorto = typeof lock.pid !== "number" || !pidVivo(lock.pid);
        const meuSemBuild = lock.pid === process.pid && !g.__lfBuildAtivo;
        velho = donoMorto || meuSemBuild || idade > timeoutBuildMs() + 60_000;
      } catch {
        velho = true; // lock ilegível
      }
      if (!velho) return false;
      liberarLock();
    }
  }
  return false;
}

function liberarLock() {
  try {
    fs.unlinkSync(arqLock());
  } catch {
    /* já removido */
  }
}

// ─── Utilidades de log ────────────────────────────────────────────────────────

function semAnsi(s: string) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
}

function carimbo(d: Date) {
  const p = (n: number, t = 2) => String(n).padStart(t, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${p(d.getMilliseconds(), 3)}`;
}

function podarLogs() {
  try {
    const logs = fs.readdirSync(dirLogs()).filter((f) => /^build-.*\.log$/.test(f)).sort();
    for (const f of logs.slice(0, Math.max(0, logs.length - LOGS_MANTIDOS))) {
      try {
        fs.unlinkSync(path.join(dirLogs(), f));
      } catch {
        /* segue */
      }
    }
  } catch {
    /* sem pasta de logs */
  }
}

function finalDoLog(arquivo: string, max = 4000): string {
  try {
    const txt = semAnsi(fs.readFileSync(arquivo, "utf-8"));
    return txt.length > max ? "…" + txt.slice(-max) : txt;
  } catch {
    return "";
  }
}

/** Uma frase com a causa: a primeira linha de erro do Astro/Node, ou o fim do log. */
function resumirFalha(fim: string): string {
  const linhas = fim.split("\n").map((l) => l.trim()).filter(Boolean);
  const idx = linhas.findIndex((l) => /\[ERROR\]|\bError\b|Erro|failed|Invalid|InvalidContentEntry/i.test(l));
  const escolhidas = idx >= 0 ? linhas.slice(idx, idx + 3) : linhas.slice(-3);
  const s = escolhidas.join(" ");
  return s.length > 400 ? s.slice(0, 397) + "…" : s || "O build terminou com erro sem mensagem.";
}

function matarArvore(filho: ChildProcess) {
  if (!filho.pid) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(filho.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    } else {
      try {
        process.kill(-filho.pid, "SIGKILL"); // grupo (filho foi criado detached)
      } catch {
        filho.kill("SIGKILL");
      }
    }
  } catch {
    /* já morreu */
  }
}

// ─── Cópia para a pasta publicada ─────────────────────────────────────────────

// Itens da pasta do site que NÃO vêm do build — gravados pelo próprio painel
// (uploads em api/midia, _redirects em api/redirects).
const PRESERVAR_NO_SITE = new Set(["midia", "_redirects"]);

function copiarDir(origem: string, destino: string) {
  fs.mkdirSync(destino, { recursive: true });
  for (const entry of fs.readdirSync(origem, { withFileTypes: true })) {
    const src = path.join(origem, entry.name);
    const dst = path.join(destino, entry.name);
    if (entry.isDirectory()) copiarDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

function limparSite(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    if (PRESERVAR_NO_SITE.has(entry)) continue;
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}

// ─── Início do build ──────────────────────────────────────────────────────────

export type ResultadoInicio =
  | { tipo: "iniciado"; estado: EstadoBuild }
  | { tipo: "ocupado"; estado: EstadoBuild }
  | { tipo: "invalido"; estado: EstadoBuild; erros: ErroConteudo[] };

export function iniciarBuild(slug: string): ResultadoInicio {
  const agora = new Date();
  const id = `build-${carimbo(agora)}`;

  if (g.__lfBuildAtivo || !tomarLock(id)) {
    return { tipo: "ocupado", estado: lerEstado() };
  }
  g.__lfBuildAtivo = { id, filho: null };

  const inicioMs = agora.getTime();
  const timeoutMs = timeoutBuildMs();
  const nomeLog = `${id}.log`;
  const arqLog = path.join(dirLogs(), nomeLog);
  const base: EstadoBuild = {
    status: "rodando",
    id,
    etapa: "validando",
    inicio: agora.toISOString(),
    timeoutMs,
    log: nomeLog,
  };

  const encerrar = (parcial: Partial<EstadoBuild>) => {
    const fim = new Date();
    gravarEstado({
      ...base,
      etapa: undefined,
      fim: fim.toISOString(),
      duracaoMs: fim.getTime() - inicioMs,
      ...parcial,
    });
    g.__lfBuildAtivo = null;
    liberarLock();
    podarLogs();
  };

  try {
    fs.mkdirSync(dirLogs(), { recursive: true });
    fs.writeFileSync(arqLog, `# Publicação ${id} — início ${base.inicio}\n# Tempo limite: ${Math.round(timeoutMs / 1000)}s\n\n`);
    gravarEstado(base);

    // 1) Conteúdo contra o schema — falhou, o build nem começa
    const astroDir = path.join(getLinkflowDir(), "_astro");
    const { erros, arquivos } = validarConteudoSite(astroDir);
    if (erros.length > 0) {
      const linhas = erros.map((e) => `${e.arquivo} · ${e.campo}: ${e.mensagem}`);
      fs.appendFileSync(arqLog, `[validação] ${erros.length} problema(s) em ${arquivos} arquivo(s). Build NÃO executado.\n${linhas.join("\n")}\n`);
      const estado: EstadoBuild = {
        ...base,
        status: "erro",
        etapa: undefined,
        resumo: `Publicação bloqueada: ${erros.length} problema${erros.length === 1 ? "" : "s"} no conteúdo. O site no ar não foi alterado.`,
        erros: erros.slice(0, 100),
        final: linhas.slice(0, 40).join("\n"),
      };
      encerrar(estado);
      return { tipo: "invalido", estado: lerEstado(), erros };
    }
    fs.appendFileSync(arqLog, `[validação] ${arquivos} arquivo(s) de conteúdo conferidos, nenhum problema.\n\n`);

    // 2) npm run build
    gravarEstado({ ...base, etapa: "construindo" });
    const win = process.platform === "win32";
    const out = fs.openSync(arqLog, "a");
    const filho = spawn(win ? "npm.cmd" : "npm", ["run", "build"], {
      cwd: astroDir,
      shell: win, // .cmd no Windows exige shell; argumentos fixos, sem entrada do usuário
      detached: !win,
      stdio: ["ignore", out, out],
      windowsHide: true,
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CI: "1" },
    });
    fs.closeSync(out);
    g.__lfBuildAtivo = { id, filho };

    let estourou = false;
    let terminou = false;
    const relogio = setTimeout(() => {
      if (terminou) return;
      estourou = true;
      fs.appendFileSync(arqLog, `\n[painel] Tempo limite de ${Math.round(timeoutMs / 1000)}s excedido — processo encerrado.\n`);
      matarArvore(filho);
    }, timeoutMs);

    const concluir = (codigo: number | null, erroSpawn?: Error) => {
      if (terminou) return;
      terminou = true;
      clearTimeout(relogio);
      try {
        if (erroSpawn) {
          fs.appendFileSync(arqLog, `\n[painel] Não foi possível iniciar o build: ${erroSpawn.message}\n`);
          encerrar({ status: "erro", resumo: `Não foi possível iniciar o build: ${erroSpawn.message}`, final: finalDoLog(arqLog) });
          return;
        }
        if (estourou) {
          encerrar({
            status: "erro",
            resumo: `A publicação passou do tempo limite (${timeoutMs >= 60000 ? `${Math.round(timeoutMs / 6000) / 10} min` : `${Math.round(timeoutMs / 1000)} s`}) e foi interrompida. O site no ar não foi alterado.`,
            final: finalDoLog(arqLog),
          });
          return;
        }
        if (codigo !== 0) {
          const fim = finalDoLog(arqLog);
          encerrar({ status: "erro", resumo: `O build do site falhou (código ${codigo}). ${resumirFalha(fim)}`, final: fim });
          return;
        }

        // 3) Copiar dist -> pasta publicada (só se a home existir)
        const distDir = path.join(astroDir, "dist");
        if (!fs.existsSync(path.join(distDir, "index.html"))) {
          fs.appendFileSync(arqLog, `\n[painel] Build terminou sem dist/index.html — site publicado mantido.\n`);
          encerrar({ status: "erro", resumo: "O build terminou, mas não gerou a página inicial (dist/index.html). O site no ar não foi alterado.", final: finalDoLog(arqLog) });
          return;
        }
        gravarEstado({ ...base, etapa: "copiando" });
        const siteDir = getSiteDir(slug);
        fs.appendFileSync(arqLog, `\n[painel] Copiando dist/ para ${siteDir}\n`);
        limparSite(siteDir);
        copiarDir(distDir, siteDir);
        fs.appendFileSync(arqLog, `[painel] Publicado.\n`);
        encerrar({ status: "ok", resumo: "Site publicado." });
      } catch (err) {
        try {
          fs.appendFileSync(arqLog, `\n[painel] Erro ao finalizar: ${String(err)}\n`);
        } catch {
          /* segue */
        }
        encerrar({ status: "erro", resumo: `O build terminou, mas a cópia para o site falhou: ${String(err)}`, final: finalDoLog(arqLog) });
      }
    };
    filho.on("error", (e) => concluir(null, e));
    filho.on("close", (codigo) => concluir(codigo));

    return { tipo: "iniciado", estado: { ...base, etapa: "construindo" } };
  } catch (err) {
    try {
      encerrar({ status: "erro", resumo: `Falha ao iniciar a publicação: ${String(err)}` });
    } catch {
      g.__lfBuildAtivo = null;
      liberarLock();
    }
    return { tipo: "iniciado", estado: lerEstado() };
  }
}
