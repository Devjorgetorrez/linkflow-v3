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
import { useMemo } from "react";

import { useBaseSite, useDominio } from "@/lib/useDominio";
import { usePaginasReais } from "@/lib/usePaginasReais";
import { CabecalhoTela } from "@/components/Tela";
import { IndexacaoBadge } from "@/components/paginas/IndexacaoBadge";
import { Botao, Painel, CabecalhoPainel } from "@/components/ui";
import type { TipoPagina } from "@/mock/types";

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

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-28 shrink-0 text-[11.5px] text-ink-muted">{rotulo}</dt>
      <dd className="text-[11.5px] text-ink">{children}</dd>
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  vazio,
  contar,
  mono,
}: {
  rotulo: string;
  valor: string;
  vazio: string;
  contar?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11.5px] text-ink-muted">
        {rotulo}
        {contar && valor ? <span className="ml-1.5 text-ink-muted/70">({valor.length} caracteres)</span> : null}
      </dt>
      <dd className={`rounded border border-line bg-surface px-2 py-1.5 text-[12px] leading-relaxed text-ink ${mono ? "break-all font-mono" : ""}`}>
        {valor || <span className="text-ink-muted/60">{vazio}</span>}
      </dd>
    </div>
  );
}

export default function PaginaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dominio = useDominio();
  const { base: baseSite } = useBaseSite();

  const { paginas, carregando, origemRotulo, erro } = usePaginasReais();
  // id pode vir encodado na URL — decodificar antes de comparar
  const pagina = useMemo(() => {
    const idDecoded = decodeURIComponent(id);
    return paginas.find((p) => p.id === idDecoded) ?? null;
  }, [paginas, id]);
  const naoEncontrada = !carregando && !pagina;

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
        <p className="text-[13px] font-medium text-ink">{erro ?? "Página não encontrada"}</p>
        <Botao variante="secundario" onClick={() => router.push("/paginas")}>
          <ArrowLeft size={12} /> Voltar para páginas
        </Botao>
      </div>
    );
  }

  const real = pagina.real;
  const semLeitura = !!real?.erroLeitura;
  const urlPublica = baseSite ? `${baseSite}${pagina.url}` : dominio ? `https://${dominio}${pagina.url}` : pagina.url;

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
            {(baseSite || dominio) && (
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
            descricao="O que o site publicado diz sobre esta página"
            icone={<Globe size={14} />}
          />
          <dl className="mt-3 space-y-2.5">
            <Linha rotulo="URL"><span className="font-mono">{pagina.url}</span></Linha>
            <Linha rotulo="Tipo">
              <span className={`inline-flex items-center rounded border px-1.5 py-[1px] text-[10.5px] font-medium ${TIPO_COR[pagina.tipo]}`}>
                {TIPO_LABEL[pagina.tipo]}
              </span>
            </Linha>
            <Linha rotulo="Indexação"><IndexacaoBadge pagina={pagina} /></Linha>
            <Linha rotulo="Meta robots">
              {real?.robotsMeta.length ? (
                <span className="font-mono">{real.robotsMeta.join(" | ")}</span>
              ) : (
                <span className="text-ink-muted/70">sem meta robots (o Google pode indexar)</span>
              )}
            </Linha>
            <Linha rotulo="Nível">{pagina.nivel} clique{pagina.nivel === 1 ? "" : "s"} a partir da home</Linha>
            <Linha rotulo="Links recebidos">{pagina.linksRecebidos}</Linha>
            <Linha rotulo="Links enviados">{real ? real.linksEnviados : "—"}</Linha>
            <Linha rotulo="Palavras">{semLeitura ? "—" : real?.palavras ?? "—"}</Linha>
            <Linha rotulo="Imagens">
              {semLeitura || !real
                ? "—"
                : `${real.imagens.total}${real.imagens.semAlt > 0 ? ` (${real.imagens.semAlt} sem texto alternativo)` : ""}`}
            </Linha>
            {pagina.ultimaMod && <Linha rotulo="Arquivo gerado em">{pagina.ultimaMod}</Linha>}
            {origemRotulo && <Linha rotulo="Lido de">{origemRotulo}</Linha>}
          </dl>
        </Painel>

        {/* ── SEO ── */}
        <Painel>
          <CabecalhoPainel
            titulo="SEO"
            descricao="Metadados desta página no Google"
            icone={<FileCode2 size={14} />}
          />
          {semLeitura && (
            <p className="mt-3 rounded border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2 py-1.5 text-[11.5px] text-[#b45309]">
              Não foi possível ler o HTML desta página ({real?.erroLeitura}). Os dados abaixo não foram verificados.
            </p>
          )}
          {real?.parcial && (
            <p className="mt-3 rounded border border-line bg-surface px-2 py-1.5 text-[11.5px] text-ink-muted">
              O HTML é muito grande e foi lido só até o limite: title, meta e contagens podem estar incompletos.
            </p>
          )}
          {real?.noindex && real.noindexNoConteudo === true && (
            <p className="mt-3 rounded border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11.5px] text-ink-muted">
              Esta página está marcada como noindex; o Google não vai indexá-la até você liberar. É o esperado enquanto
              o conteúdo real da Fase 3 não foi escrito e aprovado.
            </p>
          )}
          <dl className="mt-3 space-y-2.5">
            <Campo rotulo="Title" valor={pagina.seoTitle} vazio="não definido" contar />
            <Campo rotulo="Meta description" valor={pagina.metaDescription} vazio="não definida" contar />
            <Campo rotulo="H1" valor={pagina.h1} vazio="não definido" />
            <Campo rotulo="Canonical" valor={real?.canonical ?? ""} vazio="não declarado" mono />
            <div className="flex flex-col gap-1">
              <dt className="text-[11.5px] text-ink-muted">Dados estruturados (JSON-LD)</dt>
              <dd className="text-[11.5px] text-ink">
                {semLeitura || !real ? (
                  "—"
                ) : real.jsonldBlocos === 0 ? (
                  <span className="text-ink-muted/70">nenhum bloco JSON-LD no HTML</span>
                ) : (
                  <>
                    {real.schemaTipos.length > 0 ? real.schemaTipos.join(", ") : "sem tipos identificados"}
                    <span className="text-ink-muted"> · {real.jsonldBlocos} bloco{real.jsonldBlocos === 1 ? "" : "s"}</span>
                    {real.jsonldInvalidos > 0 && (
                      <span className="text-danger"> · {real.jsonldInvalidos} com JSON inválido</span>
                    )}
                  </>
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[11.5px] text-ink-muted">Open Graph (compartilhamento)</dt>
              <dd className="text-[11.5px] text-ink">
                {real && (real.og.title || real.og.description || real.og.image || real.og.type) ? (
                  <ul className="space-y-0.5">
                    {real.og.title && <li>título: {real.og.title}</li>}
                    {real.og.description && <li>descrição: {real.og.description}</li>}
                    {real.og.image && <li className="break-all">imagem: {real.og.image}</li>}
                    {real.og.type && <li>tipo: {real.og.type}</li>}
                  </ul>
                ) : (
                  <span className="text-ink-muted/70">{semLeitura ? "—" : "sem tags Open Graph"}</span>
                )}
              </dd>
            </div>
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
