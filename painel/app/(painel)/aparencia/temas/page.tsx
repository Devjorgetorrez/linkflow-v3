"use client";

import { ArrowRight, ExternalLink, Monitor } from "lucide-react";
import { useState, useEffect } from "react";

import { Botao, Mono } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { TemaVisual } from "@/mock/types";

/* ---------------------------------------------------------------- thumb */

function Miniatura({
  gradiente,
  tamanho = "md",
}: {
  gradiente: string;
  tamanho?: "sm" | "md";
}) {
  const h = tamanho === "sm" ? "h-28" : "h-44";
  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-t-[var(--radius)]", h)}
      style={{ background: `linear-gradient(${gradiente})` }}
    >
      {/* wireframe overlay */}
      <div className="absolute inset-0 flex flex-col gap-1.5 p-3 opacity-30">
        {/* nav bar */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-12 rounded-full bg-white/80" />
          <div className="ml-auto flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-1.5 w-8 rounded-full bg-white/60" />
            ))}
          </div>
        </div>
        {/* hero */}
        <div className="mt-1 flex-1 rounded bg-white/20 p-2">
          <div className="mb-1.5 h-2 w-2/3 rounded-full bg-white/70" />
          <div className="h-1.5 w-1/2 rounded-full bg-white/50" />
          <div className="mt-2 flex gap-1.5">
            <div className="h-4 w-14 rounded bg-white/60" />
            <div className="h-4 w-14 rounded bg-white/30" />
          </div>
        </div>
        {/* cards row */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 flex-1 rounded bg-white/20" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- modal */

interface ModalConfirmarProps {
  temaAtual: TemaVisual | undefined;
  temaNovo: TemaVisual;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ModalConfirmar({
  temaAtual,
  temaNovo,
  onCancelar,
  onConfirmar,
}: ModalConfirmarProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[var(--radius)] border border-line bg-surface shadow-[var(--shadow-card)]">
        {/* cabeçalho */}
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">Ativar tema</h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">Revise o impacto antes de confirmar.</p>
        </div>

        {/* impacto */}
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-3 rounded-[var(--radius)] border border-accent/40 bg-accent/5 px-4 py-3 text-[12px] text-accent">
            <span>3 seções novas ficarão vazias</span>
            <span className="text-accent/40">·</span>
            <span>1 seção atual será removida</span>
            <span className="text-accent/40">·</span>
            <span>12 páginas afetadas</span>
          </div>
        </div>

        {/* preview lado a lado */}
        <div className="flex items-stretch gap-3 px-5 pb-4">
          <div className="flex-1">
            <p className="mb-1.5 text-[11px] font-medium text-ink-muted">Atual</p>
            {temaAtual ? (
              <Miniatura gradiente={temaAtual.gradiente} tamanho="sm" />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-[var(--radius)] bg-surface-2 text-[11px] text-ink-muted">
                Nenhum
              </div>
            )}
            <p className="mt-1 text-center text-[11px] text-ink-muted">
              {temaAtual?.nome ?? "—"}
            </p>
          </div>

          <div className="flex items-center">
            <ArrowRight size={18} className="text-ink-muted/50" />
          </div>

          <div className="flex-1">
            <p className="mb-1.5 text-[11px] font-medium text-ink-muted">Novo</p>
            <Miniatura gradiente={temaNovo.gradiente} tamanho="sm" />
            <p className="mt-1 text-center text-[11px] font-medium text-ink">{temaNovo.nome}</p>
          </div>
        </div>

        {/* ações */}
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <Botao variante="fantasma" tamanho="sm" onClick={onCancelar}>
            Cancelar
          </Botao>
          <Botao variante="primario" tamanho="sm" onClick={onConfirmar}>
            Ativar tema
          </Botao>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- card */

interface CardTemaProps {
  tema: TemaVisual;
  ativo: boolean;
  onAtivar: () => void;
}

function CardTema({ tema, ativo, onAtivar }: CardTemaProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--radius)] border bg-surface-2 transition-shadow",
        ativo
          ? "border-primary shadow-[0_0_0_2px_var(--primary)]"
          : "border-line hover:shadow-[var(--shadow-card)]",
      )}
    >
      {/* miniatura */}
      <div className="relative">
        <Miniatura gradiente={tema.gradiente} />
        {ativo && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-semibold text-primary-ink">
            Ativo
          </span>
        )}
      </div>

      {/* conteúdo */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-ink">{tema.nome}</h3>
          <Mono className="shrink-0 text-[10px] text-ink-muted/60">{tema.id}</Mono>
        </div>

        <p className="text-[12px] leading-relaxed text-ink-muted">{tema.estilo}</p>
        <p className="text-[11.5px] leading-relaxed text-ink-muted/80">{tema.layout}</p>

        {/* nichos */}
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {tema.nichos.map((n) => (
            <span
              key={n}
              className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-ink-muted"
            >
              {n}
            </span>
          ))}
        </div>

        {/* ações */}
        {!ativo && (
          <div className="mt-2 flex items-center gap-2 border-t border-line pt-3">
            <Botao variante="primario" tamanho="sm" onClick={onAtivar}>
              Ativar
            </Botao>
            <button
              type="button"
              disabled
              title="Visualização em preview"
              className="flex items-center gap-1 rounded-[var(--radius)] px-3 py-1.5 text-[12px] text-ink-muted opacity-50 transition-colors hover:cursor-not-allowed"
            >
              <Monitor size={13} />
              Ver ao vivo
            </button>
          </div>
        )}

        {ativo && (
          <div className="mt-2 border-t border-line pt-3">
            <button
              type="button"
              disabled
              title="Visualização em preview"
              className="flex items-center gap-1 text-[12px] text-ink-muted opacity-50"
            >
              <ExternalLink size={12} />
              Ver ao vivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

export default function TemasPage() {
  // O tema do site é uma BASE POR NICHO (estrutura e campos próprios), não
  // uma pele visual: é escolhido uma única vez, no onboarding, pelo agente
  // (fase2-site-astro ETAPA 2 + scripts/promover_tema.py), e nunca trocado
  // depois. Por isso esta tela não lista nem ativa temas — antes ela
  // oferecia 5 temas de demonstração que não existiam no motor e gravava um
  // campo `tema` que o site nem lê.
  return (
    <>
      <div className="border-b border-line px-6 py-5">
        <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">Tema</h1>
        <p className="mt-0.5 text-[12px] text-ink-muted">Estrutura e visual base do site.</p>
      </div>
      <div className="max-w-2xl space-y-3 p-6 text-[12.5px] leading-relaxed text-ink-muted">
        <p className="rounded-[var(--radius)] border border-line bg-surface-2 px-4 py-3">
          O tema foi definido na criação do site, de acordo com o nicho do negócio, e não é
          trocado pelo painel: cada tema tem páginas e campos próprios, e trocar exigiria
          refazer o site.
        </p>
        <p>
          Cores, fontes e logotipo podem ser ajustados em{" "}
          <a href="/aparencia/personalizar" className="text-[color:var(--primary)] hover:underline">
            Aparência › Personalizar
          </a>
          .
        </p>
      </div>
    </>
  );
}
