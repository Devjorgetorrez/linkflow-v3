"use client";

import {
  ArrowLeft,
  Bot,
  ExternalLink,
  FileCode2,
  Globe,
  Info,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useDominio } from "@/lib/useDominio";
import { CabecalhoTela } from "@/components/Tela";
import { Botao, Painel, CabecalhoPainel, BadgeStatus } from "@/components/ui";
import { INTENCAO_DETALHE } from "@/lib/intencao";
import type { Pagina, TipoPagina, Intencao } from "@/mock/types";

const TIPO_LABEL: Record<TipoPagina, string> = {
  home: "Home",
  money: "Money",
  pilar: "Pilar",
  supporting: "Supporting",
  institucional: "Institucional",
};

const TIPO_COR: Record<TipoPagina, string> = {
  home: "border-emerald-300 bg-emerald-50 text-emerald-700",
  money: "border-orange-300 bg-orange-50 text-orange-700",
  pilar: "border-violet-300 bg-violet-50 text-violet-700",
  supporting: "border-blue-300 bg-blue-50 text-blue-700",
  institucional: "border-slate-300 bg-slate-50 text-slate-700",
};

export default function PaginaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dominio = useDominio();

  const [pagina, setPagina] = useState<Pagina | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  useEffect(() => {
    fetch("/api/paginas")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !Array.isArray(data.paginas)) { setNaoEncontrada(true); return; }
        // id pode vir encodado na URL — decodificar antes de comparar
        const idDecoded = decodeURIComponent(id);
        const encontrada = data.paginas.find((p: Pagina) => p.id === idDecoded);
        if (!encontrada) setNaoEncontrada(true);
        else setPagina(encontrada);
      })
      .catch(() => setNaoEncontrada(true))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[12px] text-ink-muted">Carregando...</p>
      </div>
    );
  }

  if (naoEncontrada || !pagina) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[13px] font-medium text-ink">Página não encontrada</p>
        <Botao variante="secundario" onClick={() => router.push("/paginas")}>
          <ArrowLeft size={12} /> Voltar para páginas
        </Botao>
      </div>
    );
  }

  const urlPublica = dominio ? `https://${dominio}${pagina.url}` : pagina.url;

  return (
    <>
      <CabecalhoTela
        titulo={pagina.titulo || pagina.url}
        descricao={pagina.url}
        acoes={
          <div className="flex gap-2">
            <Botao variante="secundario" onClick={() => router.push("/paginas")}>
              <ArrowLeft size={12} /> Páginas
            </Botao>
            {dominio && (
              <a href={urlPublica} target="_blank" rel="noopener noreferrer">
                <Botao variante="secundario">
                  <ExternalLink size={12} /> Ver no site
                </Botao>
              </a>
            )}
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">

        {/* ── Informações da página ── */}
        <Painel>
          <CabecalhoPainel
            titulo="Informações"
            descricao="Dados estruturais desta página"
            icone={<Globe size={14} />}
          />
          <dl className="mt-3 space-y-2.5">
            <div className="flex items-start gap-3">
              <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">URL</dt>
              <dd className="font-mono text-[11.5px] text-ink">{pagina.url}</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">Tipo</dt>
              <dd>
                <span className={`inline-flex items-center rounded border px-1.5 py-[1px] text-[10.5px] font-medium ${TIPO_COR[pagina.tipo]}`}>
                  {TIPO_LABEL[pagina.tipo]}
                </span>
              </dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">Intenção</dt>
              <dd className="text-[11.5px] text-ink">
                {pagina.intencao} — {INTENCAO_DETALHE[pagina.intencao] ?? "—"}
              </dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">Nível</dt>
              <dd className="text-[11.5px] text-ink">{pagina.nivel}</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">Cluster</dt>
              <dd className="text-[11.5px] text-ink">{pagina.cluster || "—"}</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">Status</dt>
              <dd><BadgeStatus status={pagina.status} /></dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">Links recebidos</dt>
              <dd className="text-[11.5px] text-ink">{pagina.linksRecebidos}</dd>
            </div>
            {pagina.ultimaMod && (
              <div className="flex items-start gap-3">
                <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">Atualizada em</dt>
                <dd className="text-[11.5px] text-ink">{pagina.ultimaMod}</dd>
              </div>
            )}
          </dl>
        </Painel>

        {/* ── SEO ── */}
        <Painel>
          <CabecalhoPainel
            titulo="SEO"
            descricao="Metadados desta página no Google"
            icone={<FileCode2 size={14} />}
          />
          <dl className="mt-3 space-y-2.5">
            <div className="flex flex-col gap-1">
              <dt className="text-[11.5px] text-ink-muted">Title</dt>
              <dd className="rounded border border-line bg-surface px-2 py-1.5 text-[12px] text-ink">
                {pagina.seoTitle || <span className="text-ink-muted/60">não definido</span>}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[11.5px] text-ink-muted">Meta description</dt>
              <dd className="rounded border border-line bg-surface px-2 py-1.5 text-[12px] leading-relaxed text-ink">
                {pagina.metaDescription || <span className="text-ink-muted/60">não definida</span>}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[11.5px] text-ink-muted">H1</dt>
              <dd className="rounded border border-line bg-surface px-2 py-1.5 text-[12px] text-ink">
                {pagina.h1 || <span className="text-ink-muted/60">não definido</span>}
              </dd>
            </div>
            {pagina.schema && (
              <div className="flex flex-col gap-1">
                <dt className="text-[11.5px] text-ink-muted">Schema</dt>
                <dd className="text-[11.5px] text-ink">{pagina.schema}</dd>
              </div>
            )}
          </dl>
        </Painel>

        {/* ── Como editar ── */}
        <div className="lg:col-span-2">
          <Painel>
            <CabecalhoPainel
              titulo="Como editar esta página"
              descricao="Páginas do site são geradas pelo motor Astro"
              icone={<Bot size={14} />}
            />
            <div className="mt-3 rounded-[var(--radius)] border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                <Info size={14} className="mt-0.5 shrink-0 text-ink-muted" />
                <div className="space-y-2 text-[12.5px] text-ink-muted leading-relaxed">
                  <p>
                    Esta página é gerada automaticamente pelo motor Astro a partir dos templates
                    do tema e das configurações do cliente. Diferente de um WordPress, não há
                    editor visual — o conteúdo e a estrutura são controlados pelo agente.
                  </p>
                  <p>Para alterar esta página, acione o agente com um dos comandos (<code>&lt;slug&gt;</code> é o nome do projeto do cliente):</p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                        /link-flow conteudo &lt;slug&gt;
                      </code>
                      <span>— reescrever o conteúdo (texto, title, meta e H1)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                        /link-flow publicar &lt;slug&gt;
                      </code>
                      <span>— publicar as alterações no site</span>
                    </li>
                  </ul>
                  <p className="mt-2">
                    Após as alterações, clique em{" "}
                    <span className="font-medium text-ink">Publicar</span> no topo do painel
                    para atualizar o site.
                  </p>
                </div>
              </div>
            </div>
          </Painel>
        </div>

      </div>
    </>
  );
}
