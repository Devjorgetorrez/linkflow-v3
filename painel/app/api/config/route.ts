/**
 * app/api/config/route.ts
 * GET   /api/config         → lê toda a configuração do cliente
 * PATCH /api/config         → atualiza campos da configuração
 *
 * O config/site.ts tem estrutura de objeto TypeScript exportado.
 * Lemos com regex e escrevemos substituindo valores em string.
 * Suporta campos simples (string, number) e objeto nap aninhado.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getConfigPath, getSiteSlug } from "@/lib/fs";
import { verificarAcesso } from "@/lib/auth";
import { lerDados, salvarDados } from "@/lib/dados";
import { gerarBlocoLegal, LEGAL_PAINEL_INICIAL, type LegalPainel } from "@/lib/legal";
import type { Formulario } from "@/mock/types";

// ─── Helpers de leitura ────────────────────────────────────────────────────────

function lerCampoSimples(raw: string, campo: string): string {
  const m = raw.match(new RegExp(`${campo}:\\s*["'\`]([^"'\`]*)["'\`]`));
  return m ? m[1] : "";
}

function lerCampoNumero(raw: string, campo: string): number | null {
  const m = raw.match(new RegExp(`${campo}:\\s*(\\d+)`));
  return m ? Number(m[1]) : null;
}

function lerArrayStrings(raw: string, campo: string): string[] {
  // Extrai array simples: campo: ['a', 'b'] ou campo: ["a", "b"]
  const m = raw.match(new RegExp(`${campo}:\\s*\\[([^\\]]+)\\]`));
  if (!m) return [];
  return m[1].match(/["'`]([^"'`]*)["'`]/g)?.map(s => s.replace(/["'`]/g, "")) ?? [];
}

function lerRedes(raw: string): Record<string, string> {
  // Lê o array redes: [{ nome: 'Instagram', href: '...' }]
  const redesMatch = raw.match(/redes:\s*\[([\s\S]*?)\],/);
  if (!redesMatch) return {};
  const redes: Record<string, string> = {};
  const entries = redesMatch[1].matchAll(/nome:\s*['"`]([^'"`]+)['"`][\s\S]*?href:\s*['"`]([^'"`]*)['"`]/g);
  for (const e of entries) {
    redes[e[1].toLowerCase()] = e[2];
  }
  return redes;
}

function lerHorarios(raw: string): { dia: string; hora: string }[] {
  const horariosMatch = raw.match(/horarios:\s*\[([\s\S]*?)\],/);
  if (!horariosMatch) return [];
  const horarios: { dia: string; hora: string }[] = [];
  const entries = horariosMatch[1].matchAll(/dia:\s*['"`]([^'"`]*)['"`][\s\S]*?hora:\s*['"`]([^'"`]*)['"`]/g);
  for (const e of entries) {
    horarios.push({ dia: e[1], hora: e[2] });
  }
  return horarios;
}

function lerNap(raw: string): Record<string, string> {
  const napMatch = raw.match(/nap:\s*\{([\s\S]*?)\},/);
  if (!napMatch) return {};
  const nap = napMatch[1];
  const campos = ["logradouro", "complemento", "bairro", "cidade", "uf", "cep",
                  "telefone", "telefone2", "whatsapp", "email"];
  const result: Record<string, string> = {};
  for (const campo of campos) {
    const m = nap.match(new RegExp(`${campo}:\\s*['"\`]([^'"\`]*)['"\`]`));
    if (m) result[campo] = m[1];
  }
  return result;
}

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
    const nap = lerNap(raw);
    const redes = lerRedes(raw);
    const horarios = lerHorarios(raw);

    const config = {
      // Identidade
      nome: lerCampoSimples(raw, "nome"),
      nomeBreve: lerCampoSimples(raw, "nomeBreve"),
      slogan: lerCampoSimples(raw, "slogan"),
      tagline: lerCampoSimples(raw, "slogan"), // alias
      dominio: lerCampoSimples(raw, "dominio"),
      // Mesmo domínio SEM protocolo nem barra final ("cliente.com.br"). O
      // site.ts guarda com https:// (é o que o Astro usa nas canonicals);
      // as telas do painel que montam URL (https://${host}/...) usam este.
      dominioHost: lerCampoSimples(raw, "dominio").replace(/^https?:\/\//, "").replace(/\/+$/, ""),
      cnpj: lerCampoSimples(raw, "cnpj"),
      anoFundacao: lerCampoNumero(raw, "anoFundacao"),
      tema: lerCampoSimples(raw, "tema"),
      // NAP
      nap,
      // Contato (flattened para facilitar as telas)
      telefone: nap.telefone ?? "",
      telefone2: nap.telefone2 ?? "",
      whatsapp: nap.whatsapp ?? "",
      email: nap.email ?? "",
      logradouro: nap.logradouro ?? "",
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
      horarios,
      // Legal (bloco gerado, só leitura — a fonte de verdade da UI é legalPainel)
      legal: lerLegal(raw),
      // Legal — modelo simplificado que as telas Privacidade editam/salvam
      // (dados/legal.json). O bloco `legal:` acima é regenerado a partir
      // deste a cada PATCH — ver lib/legal.ts.
      legalPainel: lerDados<LegalPainel>("legal.json", LEGAL_PAINEL_INICIAL),
      // Analytics e verificações (opcionais — adicionados ao config quando preenchidos)
      googleAnalyticsId: lerCampoSimples(raw, "googleAnalyticsId"),
      metaPixelId: lerCampoSimples(raw, "metaPixelId"),
      googleTagManagerId: lerCampoSimples(raw, "googleTagManagerId"),
      googleVerificacao: lerCampoSimples(raw, "googleVerificacao"),
      bingVerificacao: lerCampoSimples(raw, "bingVerificacao"),
    };

    return NextResponse.json({ ok: true, config, slug: getSiteSlug() });
  } catch (err) {
    console.error("[api/config GET]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

// ─── Sanitização segura de valores ───────────────────────────────────────────

/**
 * Remove todos os caracteres que poderiam quebrar a string TypeScript ou
 * injetar código no config/site.ts ao ser importado pelo Astro no build.
 * Remove: aspas simples, duplas, backticks, barras, cifrão e chaves.
 */
function sanitizarValor(val: string): string {
  return val
    .replace(/['"`\\${}]/g, "") // remove delimitadores de string TS e interpolação
    .replace(/[\r\n]/g, " ")    // substitui quebras de linha por espaço
    .trim();
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

    let raw = fs.readFileSync(filePath, "utf-8");
    const body = await req.json();

    // Campos simples de string na raiz do objeto
    const camposRaiz = ["nome", "nomeBreve", "slogan", "dominio", "cnpj", "tema", "googleAnalyticsId", "metaPixelId", "googleTagManagerId", "googleVerificacao", "bingVerificacao"];
    for (const campo of camposRaiz) {
      if (body[campo] !== undefined) {
        let val = sanitizarValor(String(body[campo]));
        // site.dominio precisa ser URL absoluta — é a base das canonicals do
        // site e do sitemap gerado no build. Sem protocolo, toda canonical
        // vira relativa e o sitemap não é gerado.
        if (campo === "dominio" && val.trim()) {
          val = val.trim().replace(/\/+$/, "");
          if (!/^https?:\/\//.test(val)) val = `https://${val}`;
        }
        raw = raw.replace(
          new RegExp(`(${campo}:\\s*)['"\`][^'"\`]*['"\`]`),
          `$1'${val}'`
        );
      }
    }

    // Campos do nap
    const camposNap = ["logradouro", "complemento", "bairro", "cidade", "uf", "cep",
                       "telefone", "telefone2", "whatsapp", "email"];
    for (const campo of camposNap) {
      if (body[campo] !== undefined || body.nap?.[campo] !== undefined) {
        const val = sanitizarValor(String(body[campo] ?? body.nap[campo]));
        // Substituir apenas dentro do bloco nap
        const napMatch = raw.match(/nap:\s*\{([\s\S]*?)\},/);
        if (napMatch) {
          const napAtualizado = napMatch[1].replace(
            new RegExp(`(${campo}:\\s*)['"\`][^'"\`]*['"\`]`),
            `$1'${val}'`
          );
          raw = raw.replace(napMatch[1], napAtualizado);
        }
      }
    }

    // Redes sociais
    const redesMap: Record<string, string> = {
      instagram: "Instagram",
      facebook: "Facebook",
      youtube: "YouTube",
      linkedin: "LinkedIn",
      tiktok: "TikTok",
      twitter: "Twitter",
      pinterest: "Pinterest",
    };

    for (const [key, nome] of Object.entries(redesMap)) {
      if (body[key] !== undefined || body.redes?.[key] !== undefined) {
        const val = sanitizarValor(String(body[key] ?? body.redes[key]));
        // Substituir href dentro da entrada da rede correspondente
        raw = raw.replace(
          new RegExp(`(nome:\\s*['"\`]${nome}['"\`][\\s\\S]*?href:\\s*)['"\`][^'"\`]*['"\`]`),
          `$1'${val}'`
        );
      }
    }

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
      const razaoSocial = lerCampoSimples(raw, "nome");
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

    fs.writeFileSync(filePath, raw, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/config PATCH]", err);
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
