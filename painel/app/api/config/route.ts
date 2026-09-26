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
 * O bloco `legal:` (Política/Termos/Cookies) é editado campo a campo por
 * lib/legal-site.ts (só o que mudou); nunca regenerado por inteiro.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getConfigPath, getLinkflowDir, getRotaPilar, getSiteSlug } from "@/lib/fs";
import { exigirPapel } from "@/lib/auth";
import { MATRIZ } from "@/lib/permissoes";
import { lerDados, salvarDados } from "@/lib/dados";
import { LEGAL_PAINEL_INICIAL, type LegalPainel } from "@/lib/legal";
import { aplicarLegal, importarLegal, integracoesAtivas, validarLegal } from "@/lib/legal-site";
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

/** Modelo das telas: dados/legal.json se existir; senão importado do `legal:` real do site.ts. */
function lerLegalPainel(raw: string): LegalPainel {
  const salvo = lerDados<LegalPainel | null>("legal.json", null);
  return salvo ? { ...LEGAL_PAINEL_INICIAL, ...salvo } : importarLegal(raw);
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
  const auth = await exigirPapel(req, MATRIZ["config:GET"]);
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
      legalPainel: lerLegalPainel(raw),
      // O que o site carrega de fato (GA/GTM/Pixel) — fonte única p/ Política, Cookies e SEO
      integracoesAtivas: integracoesAtivas(raw),
      // Identidade, mídia e dados estruturados (campos restaurados na Fase 1.1b)
      razaoSocial: site.razaoSocial ?? "",
      descricao: site.descricao ?? "",
      favicon: site.favicon ?? "",
      ogImagem: site.ogImagem ?? "",
      logo: site.logo ?? {},
      credencial: site.credencial ?? {},
      schemaTipo: site.schemaTipo ?? [],
      especialidade: site.especialidade ?? "",
      faixaPreco: site.faixaPreco ?? "",
      areaAtendimento: site.areaAtendimento ?? [],
      atendimentoOnline: site.atendimentoOnline ?? false,
      funcionamento: site.funcionamento ?? [],
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
  const auth = await exigirPapel(req, MATRIZ["config:PATCH"]);
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

    // Legal (Política, Termos, Cookies): grava em dados/legal.json (modelo das
    // telas) e edita no `legal:` do site.ts SÓ o que mudou (lib/legal-site.ts) —
    // o bloco que o agente escreveu nunca é regenerado por inteiro.
    let legalParaSalvar: LegalPainel | null = null;
    if (body.legalPainel !== undefined) {
      const atual = lerLegalPainel(raw);
      const novo: LegalPainel = { ...atual, ...body.legalPainel };
      const errosLegal = validarLegal(novo, Object.keys(body.legalPainel));
      if (Object.keys(errosLegal).length) {
        return NextResponse.json(
          { ok: false, erro: "Há campos inválidos — nada foi salvo.", erros: errosLegal },
          { status: 400 },
        );
      }
      const formulariosExistem = lerDados<Formulario[]>("formularios.json", []).length > 0;
      raw = aplicarLegal(raw, atual, novo, { formulariosExistem });
      legalParaSalvar = novo;
    }

    if (raw !== original) {
      fazerBackup(filePath);
      gravarAtomico(filePath, raw);
    }
    if (legalParaSalvar) salvarDados("legal.json", legalParaSalvar);
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
