"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { BotaoCopiar } from "@/components/BotaoCopiar";
import { Botao } from "@/components/ui";
import { CATALOGO_LAYOUTS, type LayoutCatalogo } from "@/lib/catalogo-layouts";
import { cn } from "@/lib/utils";

/**
 * Tela Layout — catálogo dos layouts que o Link Flow entrega.
 *
 * O usuário ESCOLHE OLHANDO: cada cartão abre uma demonstração navegável com
 * conteúdo fictício (o motor de referência, servido pelo agente na porta 4322
 * enquanto o site está sendo construído). Quem reconstrói o site com o layout
 * novo é o agente: cada layout tem páginas e campos próprios, então a troca não
 * é um botão. O botão daqui gera o pedido pronto para colar no Claude Code.
 */

interface EstadoLayout {
  ativo: string | null;
  catalogoUrl: string | null;
}

function pedidoDeTroca(l: LayoutCatalogo): string {
  return [
    `Quero trocar o layout do meu site para o "${l.nome}" (${l.tema}).`,
    "Reconstrua o site com esse layout usando os dados do projeto.md, sem inventar nenhuma informação.",
    "Abra a prévia no localhost para eu conferir e só publique depois da minha aprovação.",
    "Se o site já estiver no ar, mantenha a versão atual publicada até eu aprovar a nova.",
  ].join("\n");
}

const PEDIDO_ABRIR_CATALOGO =
  "Abra o catálogo de layouts no localhost para eu ver as demonstrações e escolher.";

function Cartao({
  layout,
  emUso,
  catalogoUrl,
}: {
  layout: LayoutCatalogo;
  emUso: boolean;
  catalogoUrl: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const demo = catalogoUrl ? `${catalogoUrl}${layout.rota}` : null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--radius)] border bg-surface",
        emUso ? "border-[color:var(--primary)]" : "border-line",
      )}
    >
      <div className="flex h-2" aria-hidden="true">
        <span className="flex-1" style={{ background: layout.cor }} />
        <span className="w-1/4" style={{ background: layout.acento }} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-widest"
            style={{ color: layout.cor }}
          >
            {layout.nicho}
          </p>
          {emUso && (
            <span className="rounded-full bg-[color:var(--primary)]/10 px-2 py-0.5 text-[10.5px] font-medium text-[color:var(--primary)]">
              Em uso
            </span>
          )}
        </div>
        <h2 className="mt-1 text-[14.5px] font-semibold text-ink">{layout.nome}</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">{layout.resumo}</p>

        <dl className="mt-3 space-y-1.5 text-[12px]">
          <div>
            <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">Indicado para</dt>
            <dd className="m-0 text-ink">{layout.exemplos}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">Tipografia</dt>
            <dd className="m-0 text-ink">
              {layout.fonteTitulo} + {layout.fonteCorpo}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {demo ? (
            <a
              href={demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-line bg-secondary px-3 text-[12.5px] font-medium text-ink no-underline hover:border-ink-muted"
            >
              <ExternalLink size={12} />
              Ver demonstração
            </a>
          ) : null}
          {!emUso && (
            <Botao variante="secundario" onClick={() => setAberto((v) => !v)}>
              Quero este layout
            </Botao>
          )}
        </div>

        {aberto && !emUso && (
          <div className="mt-3 rounded-[var(--radius)] border border-line bg-surface-2 p-3">
            <p className="text-[11.5px] leading-relaxed text-ink-muted">
              Cole este pedido na conversa com o Claude Code, onde o site foi criado. Ele reconstrói
              o site com este layout e abre a prévia para você aprovar antes de qualquer publicação.
            </p>
            <pre className="mt-2 whitespace-pre-wrap rounded border border-line bg-surface p-2.5 text-[11.5px] leading-relaxed text-ink">
              {pedidoDeTroca(layout)}
            </pre>
            <div className="mt-2">
              <BotaoCopiar texto={pedidoDeTroca(layout)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LayoutPage() {
  const [estado, setEstado] = useState<EstadoLayout | null>(null);

  useEffect(() => {
    fetch("/api/layout", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setEstado({ ativo: d.ativo ?? null, catalogoUrl: d.catalogoUrl ?? null });
        else setEstado({ ativo: null, catalogoUrl: null });
      })
      .catch(() => setEstado({ ativo: null, catalogoUrl: null }));
  }, []);

  const ativo = estado?.ativo ?? null;
  const atual = CATALOGO_LAYOUTS.find((l) => l.tema === ativo);
  const semDemo = estado !== null && estado.catalogoUrl === null;

  return (
    <>
      <div className="border-b border-line px-6 py-5">
        <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">Layout</h1>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          {atual ? (
            <>
              Layout em uso: <strong className="text-ink">{atual.nome}</strong>
            </>
          ) : (
            "Os layouts que o Link Flow entrega para o seu site."
          )}
        </p>
      </div>

      <div className="max-w-6xl space-y-5 p-6">
        <div className="max-w-2xl space-y-2 text-[12.5px] leading-relaxed text-ink-muted">
          <p>
            Cada layout tem paleta, tipografia e organização de páginas próprias. Abra a
            demonstração de cada um e escolha olhando. As demonstrações usam conteúdo fictício; no
            seu site entram os dados reais do seu negócio.
          </p>
          <p>
            Trocar de layout reconstrói o site com o mesmo conteúdo, e quem faz isso é o Claude Code.
            Cores, fontes e logotipo do layout atual podem ser ajustados em{" "}
            <a href="/aparencia/personalizar" className="text-[color:var(--primary)] hover:underline">
              Aparência › Personalizar
            </a>
            .
          </p>
        </div>

        {semDemo && (
          <div className="max-w-2xl rounded-[var(--radius)] border border-line bg-surface-2 p-4">
            <p className="text-[12px] leading-relaxed text-ink-muted">
              As demonstrações abrem no computador onde o site foi criado, pelo Claude Code. Para
              vê-las, cole este pedido na conversa com ele:
            </p>
            <pre className="mt-2 whitespace-pre-wrap rounded border border-line bg-surface p-2.5 text-[11.5px] text-ink">
              {PEDIDO_ABRIR_CATALOGO}
            </pre>
            <div className="mt-2">
              <BotaoCopiar texto={PEDIDO_ABRIR_CATALOGO} />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CATALOGO_LAYOUTS.map((l) => (
            <Cartao
              key={l.tema}
              layout={l}
              emUso={l.tema === ativo}
              catalogoUrl={estado?.catalogoUrl ?? null}
            />
          ))}
        </div>
      </div>
    </>
  );
}
