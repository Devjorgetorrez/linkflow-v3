"use client";

import { CheckCircle, ExternalLink, Plug, XCircle } from "lucide-react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Mapa de ícones / links por integração                              */
/* ------------------------------------------------------------------ */

/*
 * Catálogo REAL: só o que o SiteFlow de fato configura no site. "Conectado"
 * = o campo correspondente está preenchido no config/site.ts (/api/config).
 * Antes esta tela mostrava uma lista de demonstração (Vercel, Resend...,
 * com conta de outro cliente) que nunca refletia o site real.
 */
interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  campo: string;        // chave em /api/config
  ondeConfigurar: string; // rota do painel onde o campo é editado
  conectado: boolean;
  conta: string;
}

const CATALOGO: Omit<Integracao, "conectado" | "conta">[] = [
  { id: "ga4", nome: "Google Analytics 4", descricao: "Mede visitas, origem do tráfego e conversões.", campo: "googleAnalyticsId", ondeConfigurar: "/seo/verificacoes" },
  { id: "gtm", nome: "Google Tag Manager", descricao: "Gerencia as tags de medição sem mexer no site.", campo: "googleTagManagerId", ondeConfigurar: "/seo/verificacoes" },
  { id: "meta-pixel", nome: "Meta Pixel", descricao: "Mede resultado de anúncios no Facebook e Instagram.", campo: "metaPixelId", ondeConfigurar: "/seo/verificacoes" },
  { id: "bing", nome: "Bing Webmaster Tools", descricao: "Verificação do site no Bing.", campo: "bingVerificacao", ondeConfigurar: "/seo/verificacoes" },
  { id: "whatsapp", nome: "WhatsApp", descricao: "Botão e links de conversa no site.", campo: "whatsapp", ondeConfigurar: "/configuracoes/contato" },
];

const META: Record<string, { cor: string; href?: string }> = {
  "Google Analytics 4": { cor: "bg-[#E37400]", href: "https://analytics.google.com" },
  "Google Tag Manager": { cor: "bg-[#246FDB]", href: "https://tagmanager.google.com" },
  "Meta Pixel": { cor: "bg-[#0866FF]", href: "https://business.facebook.com/events_manager" },
  "Bing Webmaster Tools": { cor: "bg-[#008373]", href: "https://www.bing.com/webmasters" },
  WhatsApp: { cor: "bg-[#25D366]", href: "https://business.whatsapp.com" },
};

/* ------------------------------------------------------------------ */
/* Card de integração                                                  */
/* ------------------------------------------------------------------ */

function CardIntegracao({ int }: { int: Integracao }) {
  const meta = META[int.nome] ?? { cor: "bg-[var(--ink-muted)]" };

  return (
    <div className={cn(
      "flex items-start gap-4 rounded-[var(--radius)] border p-4 transition-colors",
      int.conectado
        ? "border-[var(--line)] bg-[var(--surface-2)]"
        : "border-dashed border-[var(--line)] bg-[var(--surface)]",
    )}>
      {/* Ícone colorido */}
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] text-white text-[10px] font-bold", meta.cor)}>
        {int.nome.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--ink)]">{int.nome}</p>
          {meta.href && (
            <a href={meta.href} target="_blank" rel="noopener noreferrer" className="text-[var(--ink-muted)] hover:text-[var(--primary)]">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{int.descricao}</p>
        {int.conectado && int.conta && (
          <p className="mt-1 font-mono text-[11px] text-[var(--ink-muted)]">{int.conta}</p>
        )}
      </div>

      {/* Status + ação */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        {int.conectado ? (
          <>
            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--success)]">
              <CheckCircle size={12} />
              Conectado
            </span>
            <Link href={int.ondeConfigurar} className="text-[11px] text-[var(--ink-muted)] hover:text-[var(--primary)]">
              Alterar
            </Link>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)]">
              <XCircle size={12} />
              Não conectado
            </span>
            <Link href={int.ondeConfigurar} className="rounded-[var(--radius)] border border-[var(--primary)] px-3 py-1 text-[11px] font-medium text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]">
              Configurar
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function IntegracoesPage() {
  const [integracoes, setIntegracoes] = useState<Integracao[]>(
    CATALOGO.map((i) => ({ ...i, conectado: false, conta: "" })),
  );

  const [erroCarga, setErroCarga] = useState("");

  // Estado real: conectado = campo preenchido no config do site
  useEffect(() => {
    fetch("/api/config")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !data?.ok || !data.config) {
          setErroCarga(data?.erro ?? `Não foi possível ler a configuração do site (erro ${r.status}).`);
          return;
        }
        setErroCarga("");
        const c = data.config as Record<string, unknown>;
        setIntegracoes(
          CATALOGO.map((i) => {
            const valor = String(c[i.campo] ?? "").trim();
            return { ...i, conectado: valor !== "", conta: valor };
          }),
        );
      })
      .catch(() => setErroCarga("Sem conexão com o painel. O estado das integrações não pôde ser lido."));
  }, []);

  const conectadas = integracoes.filter((i) => i.conectado);
  const desconectadas = integracoes.filter((i) => !i.conectado);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--ink)]">Integrações</h1>
        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
          Serviços externos configurados no site. O estado vem do cadastro real do site.
        </p>
      </div>

      {erroCarga && (
        <p className="mb-4 rounded-[var(--radius)] border border-[var(--danger)] px-4 py-2.5 text-xs text-[var(--danger)]">
          {erroCarga}
        </p>
      )}

      {/* Resumo */}
      <div className="mb-6 flex items-center gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-5 py-3">
        <div className="flex items-center gap-1.5 text-sm">
          <Plug size={14} className="text-[var(--ink-muted)]" />
          <span className="font-medium text-[var(--ink)]">{conectadas.length}</span>
          <span className="text-[var(--ink-muted)]">conectadas</span>
        </div>
        <div className="h-4 w-px bg-[var(--line)]" />
        <div className="text-sm">
          <span className="font-medium text-[var(--ink)]">{desconectadas.length}</span>
          <span className="ml-1.5 text-[var(--ink-muted)]">disponíveis</span>
        </div>
      </div>

      {/* Conectadas */}
      {conectadas.length > 0 && (
        <section className="mb-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Ativas
          </p>
          <div className="space-y-2.5">
            {conectadas.map((int) => (
              <CardIntegracao key={int.id} int={int} />
            ))}
          </div>
        </section>
      )}

      {/* Disponíveis para conectar */}
      {desconectadas.length > 0 && (
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Disponíveis para conectar
          </p>
          <div className="space-y-2.5">
            {desconectadas.map((int) => (
              <CardIntegracao key={int.id} int={int} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
