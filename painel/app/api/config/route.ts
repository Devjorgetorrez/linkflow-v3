/**
 * app/api/config/route.ts
 * GET   /api/config         → lê toda a configuração do cliente
 * PATCH /api/config         → atualiza campos da configuração
 *
 * Leitura e escrita do config/site.ts passam por lib/site-config.ts (scanner
 * por caminho, validação, inserção de chave ausente, proteção contra apagar
 * campo que a tela nem carregou, conferência do resultado). Esta rota só faz
 * o I/O: backup fora do src/, escrita atômica e a resposta HTTP.
 *
 * O bloco `legal:` (Política/Termos/Cookies) ainda é regenerado por
 * lib/legal.ts — tratado à parte (Fase 1.2 do plano de QA).
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getConfigPath, getLinkflowDir, getRotaPilar, getSiteSlug } from "@/lib/fs";
import { verificarAcesso } from "@/lib/auth";
import { lerDados, salvarDados } from "@/lib/dados";
import { gerarBlocoLegal, LEGAL_PAINEL_INICIAL, type LegalPainel } from "@/lib/legal";
import { aplicarPatch, lerSite, patchDeBody } from "@/lib/site-config";
import type { Formulario } from "@/mock/types";

// ─── Legal (leitura simplificada, só para o GET) ──────────────────────────────

function lerLegal(raw: string): Record<string, unknown> {
  const legalMatch = raw.match(/legal:\s*\{([\s\S]*?)\n  \},/);
  if (!legalMatch) return {};
  const legal = legalMatch[1];

  const controladorMatch = legal.match(/controlador:\s*\{([\s\S]*?)\}/);
  const controlador: Record<string, string> = {};
  if (controladorMatch) {
    for (const campo of ["razaoSocial", "cnpj", "endereco"]) {
      const m = controladorMatch[1].match(new RegExp(`${campo}:\\s*['"\`]([^'"\`]*)['"\`]`));
      if (m) controlador[campo] = m[1];
    }
  }

  return { controlador };
}

// ─── Escrita segura ───────────────────────────────────────────────────────────

const BACKUPS_MAX = 10;

/** Copia o site.ts atual para dados/backups/ (fora do src/) e mantém só os mais recentes. */
function fazerBackup(filePath: string): void {
  const dir = path.join(getLinkflowDir(), "dados", "backups");
  fs.mkdirSync(dir, { recursive: true });
  const carimbo = new Date().toISOString().replace(/\D/g, "");
  fs.copyFileSync(filePath, path.join(dir, `site.ts.${carimbo}`));
  const antigos = fs.readdirSync(dir).filter((n) => n.startsWith("site.ts.")).sort();
  for (const n of antigos.slice(0, Math.max(0, antigos.length - BACKUPS_MAX))) {
    fs.unlinkSync(path.join(dir, n));
  }
}

/** Arquivo temporário + rename: nunca deixa o site.ts pela metade. */
function gravarAtomico(filePath: string, conteudo: string): void {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, conteudo, "utf-8");
  fs.renameSync(tmp, filePath);
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const filePath = getConfigPath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { ok: false, erro: "Arquivo de configuração não encontrado", slug: getSiteSlug() },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const site = lerSite(raw);
    const nap = site.nap;
    const redes: Record<string, string> = {};
    for (const r of site.redes) redes[r.nome.toLowerCase()] = r.href;

    const config = {
      // Identidade
      nome: site.nome ?? "",
      nomeBreve: site.nomeBreve ?? "",
      slogan: site.slogan ?? "",
      tagline: site.slogan ?? "", // alias
      dominio: site.dominio ?? "",
      // Mesmo domínio SEM protocolo nem barra final ("cliente.com.br"). O
      // site.ts guarda com https:// (é o que o Astro usa nas canonicals);
      // as telas do painel que montam URL (https://${host}/...) usam este.
      dominioHost: (site.dominio ?? "").replace(/^https?:\/\//, "").replace(/\/+$/, ""),
      cnpj: site.cnpj ?? "",
      anoFundacao: site.anoFundacao ?? null,
      // Rota do pilar de oferta: "/servicos" ou "/planos" (tema-07)
      rotaPilar: getRotaPilar(),
      // NAP (completo: as telas precisam carregar TODOS os campos, senão salvar apaga)
      nap,
      // Contato (flattened para facilitar as telas)
      telefone: nap.telefone ?? "",
      telefone2: nap.telefone2 ?? "",
      whatsapp: nap.whatsapp ?? "",
      email: nap.email ?? "",
      logradouro: nap.logradouro ?? "",
      complemento: nap.complemento ?? "",
      bairro: nap.bairro ?? "",
      cidade: nap.cidade ?? "",
      uf: nap.uf ?? "",
      cep: nap.cep ?? "",
      // Redes
      redes,
      instagram: redes.instagram ?? "",
      facebook: redes.facebook ?? "",
      youtube: redes.youtube ?? "",
      linkedin: redes.linkedin ?? "",
      tiktok: redes.tiktok ?? "",
      // Horários
      horarios: site.horarios,
      // Legal (bloco gerado, só leitura — a fonte de verdade da UI é legalPainel)
      legal: lerLegal(raw),
      // Legal — modelo simplificado que as telas Privacidade editam/salvam
      // (dados/legal.json). O bloco `legal:` acima é regenerado a partir
      // deste a cada PATCH — ver lib/legal.ts.
      legalPainel: lerDados<LegalPainel>("legal.json", LEGAL_PAINEL_INICIAL),
      // Analytics e verificações (opcionais)
      googleAnalyticsId: site.googleAnalyticsId ?? "",
      metaPixelId: site.metaPixelId ?? "",
      googleTagManagerId: site.googleTagManagerId ?? "",
      googleVerificacao: site.googleVerificacao ?? "",
      bingVerificacao: site.bingVerificacao ?? "",
    };

    return NextResponse.json({ ok: true, config, slug: getSiteSlug() });
  } catch (err) {
    console.error("[api/config GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const auth = await verificarAcesso(req);
  if (auth) return auth;

  try {
    const filePath = getConfigPath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: false, erro: "Arquivo de configuração não encontrado" }, { status: 404 });
    }

    const original = fs.readFileSync(filePath, "utf-8");
    let raw = original;
    const body = await req.json();

    // Campos do site.ts: validação, inserção de chave ausente e proteção contra
    // apagar o que a tela não carregou ficam em lib/site-config.ts.
    const { patch, naoSuportados } = patchDeBody(body ?? {});
    const r = aplicarPatch(raw, patch);
    if (Object.keys(r.erros).length) {
      return NextResponse.json(
        { ok: false, erro: "Há campos inválidos — nada foi salvo.", erros: r.erros },
        { status: 400 },
      );
    }
    raw = r.src;

    // Legal (Política, Termos, Cookies) — salva o modelo simplificado em
    // dados/legal.json (fonte de verdade da UI) e regenera por inteiro o
    // bloco `legal: {...}` no config/site.ts a partir dele.
    if (body.legalPainel !== undefined) {
      const atual = lerDados<LegalPainel>("legal.json", LEGAL_PAINEL_INICIAL);
      const novo: LegalPainel = { ...atual, ...body.legalPainel };
      salvarDados("legal.json", novo);

      const formularios = lerDados<Formulario[]>("formularios.json", []).map((f) => ({
        nome: f.nome,
        campos: f.campos.map((c) => c.rotulo).join(", "),
        finalidade: `Responder à solicitação enviada pelo formulário "${f.nome}"`,
      }));

      const exemploMatch = raw.match(/legal:\s*\{[\s\S]*?exemplo:\s*(true|false)/);
      const exemploAtual = exemploMatch ? exemploMatch[1] === "true" : false;
      const razaoSocial = lerSite(raw).nome ?? "";
      // naoSubstitui pode ter sido escrito pelo agente na Fase 3 (texto do
      // nicho do cliente) antes de qualquer edição pelo painel — preservar
      // se a tela Termos ainda não tem valor próprio (ver gerarBlocoLegal).
      const naoSubstituiMatch = raw.match(/termos:\s*\{\s*naoSubstitui:\s*'((?:[^'\\]|\\.)*)'/);
      const naoSubstituiAtual = naoSubstituiMatch ? naoSubstituiMatch[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\") : "";

      const blocoNovo = gerarBlocoLegal(novo, { exemploAtual, formularios, razaoSocial, naoSubstituiAtual });

      // Substitui o bloco `legal: { ... }` inteiro (do "legal: {" até o "}"
      // que fecha ele, contando chaves — o bloco tem arrays de objetos
      // aninhados, um regex guloso pararia na primeira "}" errada).
      const inicioTag = "legal: {";
      const inicio = raw.indexOf(inicioTag);
      if (inicio === -1) {
        return NextResponse.json({ ok: false, erro: "Bloco 'legal:' não encontrado no config/site.ts" }, { status: 500 });
      }
      const abre = inicio + inicioTag.length - 1;
      let depth = 0;
      let fim = -1;
      for (let i = abre; i < raw.length; i++) {
        if (raw[i] === "{") depth++;
        else if (raw[i] === "}") {
          depth--;
          if (depth === 0) { fim = i; break; }
        }
      }
      if (fim === -1) {
        return NextResponse.json({ ok: false, erro: "Bloco 'legal:' malformado no config/site.ts" }, { status: 500 });
      }
      raw = raw.slice(0, inicio) + "legal: {\n" + blocoNovo + "\n  }" + raw.slice(fim + 1);
    }

    if (raw !== original) {
      fazerBackup(filePath);
      gravarAtomico(filePath, raw);
    }
    return NextResponse.json({
      ok: true,
      alterados: r.alterados,
      // vazio sobre valor existente sem confirmação: não foi gravado
      ignorados: r.ignorados,
      // chegou mas não existe no site.ts (a tela não deve mostrar "Salvo" para isso)
      naoSuportados,
    });
  } catch (err) {
    console.error("[api/config PATCH]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
