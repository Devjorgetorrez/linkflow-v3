/**
 * app/api/midia/route.ts
 * GET   /api/midia         → lista arquivos de mídia do site
 * POST  /api/midia         → upload (multipart, campo "arquivo"). finalidade=avatar: qualquer papel,
 *   só imagem até 2 MB, pasta "avatares" (autor troca a PRÓPRIA foto sem upload geral). Sem finalidade: admin/editor.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getConfigPath } from "@/lib/fs";
import { lerSite } from "@/lib/site-config";
import {
  LIMITE_AVATAR, LIMITE_IMAGEM, LIMITE_OUTROS, detectarTipo, getMidiaDir,
  gravarSemSobrescrever, sanitizarBase, sanitizarPasta,
} from "@/lib/midia-upload";
import { exigirPapel, obterAtor } from "@/lib/auth";
import { criarMetaNova, dimensoesDoArquivo, gravarMetaAtomico, lerMeta, quemEnviou } from "@/lib/midia-meta";
import { mapaDeUso } from "@/lib/midia-uso";
import { MATRIZ } from "@/lib/permissoes";

const FORMATOS_IMAGEM = ["jpg", "jpeg", "png", "webp", "gif", "avif"];


/** Domínio público do site (do config/site.ts). Sem domínio ainda, "" → URL relativa (/midia/x.png). */
function getUrlBase(): string {
  const env = process.env.SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  try {
    return (lerSite(fs.readFileSync(getConfigPath(), "utf-8")).dominio ?? "").replace(/\/+$/, "");
  } catch {
    return "";
  }
}

const LIMITE_LISTA_PADRAO = 500;
const LIMITE_LISTA_MAX = 2000;

interface Entrada { caminho: string; pasta: string; nome: string; tamanho: number; mtime: Date }

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await exigirPapel(req, MATRIZ["midia:GET"]);
  if (auth) return auth;

  try {
    const midiaDir = getMidiaDir();
    if (!fs.existsSync(midiaDir)) {
      return NextResponse.json({ ok: true, midia: [], total: 0, pagina: 1, limite: LIMITE_LISTA_PADRAO });
    }

    const urlBase = getUrlBase();
    const entradas: Entrada[] = [];

    function varrerDir(dir: string, pasta: string) {
      let itens: fs.Dirent[];
      try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of itens) {
        if (entry.isDirectory()) {
          varrerDir(path.join(dir, entry.name), `${pasta}/${entry.name}`);
          continue;
        }
        // Sidecars de metadados e temporários não são itens da biblioteca.
        if (!entry.isFile() || entry.name.endsWith(".meta.json") || entry.name.endsWith(".tmp")) continue;
        try {
          const caminho = path.join(dir, entry.name);
          const stat = fs.statSync(caminho);
          entradas.push({ caminho, pasta, nome: entry.name, tamanho: stat.size, mtime: stat.mtime });
        } catch { /* arquivo sumiu/ilegível: não derruba a listagem */ }
      }
    }
    varrerDir(midiaDir, "");

    // Data real: criadoEm do sidecar; sem sidecar (arquivo antigo), o mtime do arquivo.
    const comData = entradas.map((e) => {
      const meta = lerMeta(e.caminho);
      const dataMeta = typeof meta.criadoEm === "string" && !Number.isNaN(Date.parse(meta.criadoEm)) ? meta.criadoEm : null;
      return { e, meta, criadoEm: dataMeta ?? e.mtime.toISOString() };
    });
    comData.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

    const total = comData.length;
    const sp = req.nextUrl.searchParams;
    const limite = Math.min(LIMITE_LISTA_MAX, Math.max(1, Number(sp.get("limite")) || LIMITE_LISTA_PADRAO));
    const pagina = Math.max(1, Number(sp.get("pagina")) || 1);
    const fatia = comData.slice((pagina - 1) * limite, pagina * limite);

    const uso = mapaDeUso();
    const midia = fatia.map(({ e, meta, criadoEm }) => {
      const ext = e.nome.split(".").pop()?.toLowerCase() ?? "";
      const { largura, altura } = FORMATOS_IMAGEM.includes(ext)
        ? dimensoesDoArquivo(e.caminho)
        : { largura: 0, altura: 0 };
      const idRelativo = e.pasta ? `${e.pasta.replace(/^\//, "")}/${e.nome}` : e.nome;
      const enviado = meta.enviadoPor && typeof meta.enviadoPor === "object" ? (meta.enviadoPor as { id?: string; nome?: string }) : null;
      return {
        id: idRelativo,
        arquivo: e.nome,
        url: `${urlBase}/midia${e.pasta}/${e.nome}`,
        alt: typeof meta.alt === "string" ? meta.alt : "",
        titulo: typeof meta.titulo === "string" && meta.titulo ? meta.titulo : e.nome,
        legenda: typeof meta.legenda === "string" ? meta.legenda : "",
        credito: typeof meta.credito === "string" ? meta.credito : "",
        largura,
        altura,
        bytes: e.tamanho,
        formato: ext,
        pasta: e.pasta || "/",
        tags: Array.isArray(meta.tags) ? meta.tags.filter((t): t is string => typeof t === "string") : [],
        usadaEm: uso.get(idRelativo) ?? [],
        gradiente: "from-slate-200 to-slate-300",
        criadoEm,
        enviadoPor: enviado?.nome ? { id: String(enviado.id ?? ""), nome: String(enviado.nome) } : { id: "", nome: "—" },
      };
    });

    return NextResponse.json({ ok: true, midia, total, pagina, limite, truncado: total > pagina * limite });
  } catch (err) {
    console.error("[api/midia GET]", err);
    return NextResponse.json({ ok: false, erro: "Não foi possível listar a biblioteca." }, { status: 500 });
  }
}

// ─── POST — upload ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Recusa cedo pelo Content-Length, antes de ler o corpo inteiro.
    const cl = req.headers.get("content-length");
    if (cl === null) {
      return NextResponse.json({ ok: false, erro: "Envio sem tamanho declarado." }, { status: 411 });
    }
    const declarado = Number(cl);
    if (!Number.isFinite(declarado) || declarado <= 0 || declarado > LIMITE_OUTROS + 64 * 1024) {
      return NextResponse.json(
        { ok: false, erro: `Arquivo grande demais (máximo ${LIMITE_OUTROS / 1024 / 1024} MB).` },
        { status: Number.isFinite(declarado) && declarado > 0 ? 413 : 400 },
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ ok: false, erro: "Envio inválido (esperado multipart/form-data)." }, { status: 400 });
    }

    const avatar = formData.get("finalidade") === "avatar";
    const auth = await exigirPapel(req, avatar ? MATRIZ["midia:POST:avatar"] : MATRIZ["midia:POST"]);
    if (auth) return auth;

    const arquivo = formData.get("arquivo");
    if (!arquivo || typeof arquivo === "string") {
      return NextResponse.json({ ok: false, erro: "Escolha um arquivo para enviar." }, { status: 400 });
    }
    if (arquivo.size === 0) {
      return NextResponse.json({ ok: false, erro: "O arquivo está vazio." }, { status: 400 });
    }

    const buf = Buffer.from(await arquivo.arrayBuffer());
    const tipo = detectarTipo(buf);
    if (!tipo) {
      return NextResponse.json(
        { ok: false, erro: "Formato não aceito. Envie JPG, PNG, WebP ou GIF (SVG não é aceito por segurança)." },
        { status: 415 },
      );
    }
    if (avatar && !tipo.imagem) {
      return NextResponse.json({ ok: false, erro: "A foto de perfil precisa ser uma imagem (JPG, PNG, WebP ou GIF)." }, { status: 415 });
    }
    const limite = avatar ? LIMITE_AVATAR : tipo.imagem ? LIMITE_IMAGEM : LIMITE_OUTROS;
    if (buf.length > limite) {
      return NextResponse.json(
        { ok: false, erro: `Arquivo grande demais (${(buf.length / 1024 / 1024).toFixed(1)} MB). O máximo é ${limite / 1024 / 1024} MB.` },
        { status: 413 },
      );
    }

    let pasta = "";
    let base = sanitizarBase(arquivo.name);
    if (avatar) {
      pasta = "avatares";
      const ator = await obterAtor(req);
      const dono = ator?.via === "sessao" ? ator.id.replace(/[^a-z0-9]/gi, "").slice(0, 12) : "";
      base = `avatar-${dono ? `${dono}-` : ""}${Date.now().toString(36)}`;
    } else {
      pasta = sanitizarPasta(String(formData.get("pasta") ?? ""));
    }

    const raiz = path.resolve(getMidiaDir());
    const dir = path.resolve(raiz, pasta);
    if (dir !== raiz && !dir.startsWith(raiz + path.sep)) {
      return NextResponse.json({ ok: false, erro: "Pasta inválida." }, { status: 400 });
    }

    // Mesmo conteúdo já na pasta: reaproveita em vez de criar cópia com outro nome.
    if (fs.existsSync(dir)) {
      for (const existente of fs.readdirSync(dir)) {
        const p = path.join(dir, existente);
        if (existente.endsWith(".meta.json") || !fs.statSync(p).isFile() || fs.statSync(p).size !== buf.length) continue;
        if (fs.readFileSync(p).equals(buf)) {
          return NextResponse.json({
            ok: true,
            duplicado: true,
            url: `${getUrlBase()}/midia${pasta ? `/${pasta}` : ""}/${existente}`,
            arquivo: existente,
            id: pasta ? `${pasta}/${existente}` : existente,
            pasta: pasta ? `/${pasta}` : "/",
            bytes: buf.length,
            formato: tipo.ext,
          });
        }
      }
    }

    const nome = gravarSemSobrescrever(dir, base, tipo.ext, buf);
    const enviadoPor = await quemEnviou(req);
    const meta = criarMetaNova(enviadoPor);
    try {
      gravarMetaAtomico(path.join(dir, nome), meta);
    } catch (e) {
      console.error("[api/midia POST] sidecar", e);
    }
    const url = `${getUrlBase()}/midia${pasta ? `/${pasta}` : ""}/${nome}`;
    return NextResponse.json({
      ok: true,
      url,
      arquivo: nome,
      id: pasta ? `${pasta}/${nome}` : nome,
      pasta: pasta ? `/${pasta}` : "/",
      bytes: buf.length,
      formato: tipo.ext,
      criadoEm: meta.criadoEm,
      enviadoPor,
    });
  } catch (err) {
    console.error("[api/midia POST]", err);
    return NextResponse.json({ ok: false, erro: "Falha ao gravar o arquivo no servidor." }, { status: 500 });
  }
}
