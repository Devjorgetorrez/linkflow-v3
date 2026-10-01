"use client";

/**
 * Editor de serviço (content/servicos/*.md) — A06/A13 do QA do painel: o
 * agente escreve e publica sozinho, mas o usuário precisa poder corrigir sem
 * chamar o Claude. Tela autocontida (fetch direto em /api/servicos/:slug),
 * reaproveitando o EditorCorpo (mesmo componente rich-text dos posts) e o
 * kit de componentes (ui.tsx) — sem depender de lib/store.tsx, que é
 * dedicado a posts/autores/categorias/mídia.
 *
 * Diferença central em relação ao editor de posts: o schema `servicos` não
 * tem "rascunho" — título (3–70) e metaDescription (80–165) são SEMPRE
 * obrigatórios (lib/servicos-regras.ts), então o Salvar fica bloqueado
 * enquanto os dois não estiverem dentro da faixa (em vez de permitir salvar
 * qualquer coisa como posts permitem em rascunho).
 */

import { AlertCircle, ArrowLeft, ExternalLink, ImageIcon, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { EditorCorpo, type EditorCorpoHandle } from "@/components/EditorCorpo";
import { SeletorMidia } from "@/components/SeletorMidia";
import {
  Alternador, Botao, Campo, Contador, Entrada, Painel, PainelRecolhivel, Rotulo, Thumb, Vazio,
} from "@/components/ui";
import { caminhoDaMidia } from "@/lib/site-config-cliente";
import { useBaseSite } from "@/lib/useDominio";
import { slugify } from "@/lib/utils";
import type { ServicoApi } from "@/lib/servicos-api";

const TITULO_MIN = 3;
const TITULO_MAX = 70;
const META_MIN = 80;
const META_MAX = 165;

export default function EditorServicoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: sessao } = useSession();
  const papel = (sessao?.user as { papel?: string } | undefined)?.papel;
  const podeEditar = papel === "administrador" || papel === "editor";
  const { base: baseSite } = useBaseSite();

  const [servico, setServico] = useState<ServicoApi | null>(null);
  const [slugCampo, setSlugCampo] = useState("");
  const [slugAuto, setSlugAuto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<number | null>(null);
  const [bibliotecaImagem, setBibliotecaImagem] = useState(false);

  const editorRef = useRef<EditorCorpoHandle>(null);

  const carregar = async (slug: string) => {
    setCarregando(true);
    setNaoEncontrado(false);
    try {
      const res = await fetch(`/api/servicos/${encodeURIComponent(slug)}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) {
        setNaoEncontrado(true);
        return;
      }
      setServico(data.servico);
      setSlugCampo(data.servico.slug);
      setSlugAuto(false);
      setErro("");
    } catch {
      setErro("Não consegui carregar o serviço.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregar(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (carregando) {
    return (
      <Painel>
        <p className="p-6 text-[13px] text-ink-muted">Carregando o serviço…</p>
      </Painel>
    );
  }

  if (naoEncontrado || !servico) {
    return (
      <Painel>
        <Vazio
          icone={<AlertCircle size={18} />}
          titulo="Serviço não encontrado"
          descricao="Este endereço não existe mais (pode ter ido para a lixeira ou mudado de endereço)."
          acao={
            <Link href="/servicos">
              <Botao tamanho="sm">Voltar para a lista</Botao>
            </Link>
          }
        />
      </Painel>
    );
  }

  const editar = (patch: Partial<ServicoApi>) => {
    setServico((s) => (s ? { ...s, ...patch } : s));
    setSalvoEm(null);
  };

  const editarTitulo = (titulo: string) => {
    // O slug segue o título só enquanto o usuário não mexeu nele à mão (mesma
    // regra de posts-regras.ts::slugSegueTitulo, mas simplificada: aqui é
    // sempre por sufixo -2/-3 porque servicos não têm conceito de "no ar").
    if (slugAuto || !slugCampo) {
      setSlugCampo(slugify(titulo));
      setSlugAuto(true);
    }
    editar({ titulo });
  };

  const tituloForaDaFaixa = servico.titulo.trim().length > 0 && (servico.titulo.trim().length < TITULO_MIN || servico.titulo.trim().length > TITULO_MAX);
  const metaForaDaFaixa = servico.metaDescription.trim().length > 0 && (servico.metaDescription.trim().length < META_MIN || servico.metaDescription.trim().length > META_MAX);
  const podeSalvar =
    servico.titulo.trim().length >= TITULO_MIN && servico.titulo.trim().length <= TITULO_MAX &&
    servico.metaDescription.trim().length >= META_MIN && servico.metaDescription.trim().length <= META_MAX;

  const salvar = async () => {
    if (!podeEditar || !podeSalvar) return;
    setSalvando(true);
    setErro("");
    try {
      const body: Record<string, unknown> = {
        titulo: servico.titulo,
        metaDescription: servico.metaDescription,
        icone: servico.icone,
        imagem: servico.imagem,
        imagemAlt: servico.imagemAlt,
        ordem: servico.ordem,
        destaque: servico.destaque,
        categoria: servico.categoria,
        noindex: servico.noindex,
        corpo: servico.corpo,
        corpoFormato: "html",
      };
      const slugMudou = slugify(slugCampo) !== servico.slug;
      if (slugMudou) {
        body.slug = slugCampo;
        body.slugAuto = slugAuto;
      }
      const res = await fetch(`/api/servicos/${encodeURIComponent(servico.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setErro(data.erro || "Não consegui salvar.");
        return;
      }
      setSalvoEm(Date.now());
      if (data.renomeado && data.slug !== servico.slug) {
        router.replace(`/servicos/${data.slug}`);
        await carregar(data.slug);
      } else {
        await carregar(servico.slug);
      }
    } catch {
      setErro("Não consegui salvar (erro de rede).");
    } finally {
      setSalvando(false);
    }
  };

  const capaUrl = servico.imagem ?? "";
  const urlPublica = `${baseSite || ""}/${servico.slug}`;

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <Botao variante="fantasma" onClick={() => router.push("/servicos")}>
          <ArrowLeft size={13} /> Serviços
        </Botao>
        <span className="truncate font-mono text-[10.5px] text-ink-muted">/{servico.slug}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {salvoEm && !salvando && (
            <span className="text-[11px] text-success" role="status">
              Salvo às {new Date(salvoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {erro && (
            <span className="max-w-[360px] text-[11px] text-danger" role="alert">
              {erro}
            </span>
          )}
          {baseSite && (
            <a href={urlPublica} target="_blank" rel="noopener noreferrer">
              <Botao variante="secundario">
                <ExternalLink size={12} /> Ver
              </Botao>
            </a>
          )}
          {podeEditar && (
            <div className="group relative">
              <Botao
                variante="primario"
                disabled={salvando || !podeSalvar}
                className={!podeSalvar ? "cursor-not-allowed opacity-50" : ""}
                onClick={salvar}
              >
                <Save size={12} /> {salvando ? "Salvando…" : "Salvar"}
              </Botao>
              {!podeSalvar && (
                <div className="absolute right-0 top-full z-50 mt-1.5 hidden w-64 rounded-[var(--radius)] border border-line bg-surface-2 p-2.5 text-[11px] leading-snug text-ink-muted shadow-lg group-hover:block">
                  Para salvar, o título precisa ter de {TITULO_MIN} a {TITULO_MAX} caracteres e a meta description de {META_MIN} a {META_MAX}.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div>
          <div className="mb-2 rounded-[var(--radius)] border border-line bg-surface-2 px-3 pb-2 pt-2.5">
            <div className="mb-1 flex items-baseline justify-between">
              <Rotulo obrigatorio>Título do serviço</Rotulo>
              <Contador atual={servico.titulo.length} max={TITULO_MAX} min={TITULO_MIN} />
            </div>
            <input
              value={servico.titulo}
              maxLength={TITULO_MAX}
              disabled={!podeEditar}
              onChange={(e) => editarTitulo(e.target.value)}
              placeholder="Nome do serviço"
              aria-label="Título do serviço"
              className="w-full bg-transparent font-display text-[26px] font-bold leading-tight tracking-tight text-ink outline-none placeholder:text-ink-muted/30 disabled:opacity-60"
            />
          </div>

          <EditorCorpo
            ref={editorRef}
            valor={servico.corpo}
            aoMudar={(corpo) => editar({ corpo })}
          />
        </div>

        <div className="space-y-2.5">
          {/* SEO */}
          <PainelRecolhivel titulo="SEO">
            <div className="space-y-3">
              <Campo label="Slug (endereço)">
                <div className="flex items-center overflow-hidden rounded-[var(--radius)] border border-line bg-surface-2">
                  <span className="select-none border-r border-line bg-secondary px-2 py-1.5 font-mono text-[10.5px] text-ink-muted">/</span>
                  <input
                    value={slugCampo}
                    disabled={!podeEditar}
                    onChange={(e) => {
                      setSlugCampo(slugify(e.target.value));
                      setSlugAuto(false);
                    }}
                    placeholder="slug-do-servico"
                    className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-[10.5px] text-ink outline-none placeholder:text-ink-muted/50 disabled:opacity-60"
                  />
                </div>
              </Campo>
              <div>
                <div className="mb-1 flex items-baseline justify-between">
                  <Rotulo obrigatorio>Meta description</Rotulo>
                  <Contador atual={servico.metaDescription.length} max={META_MAX} min={META_MIN} />
                </div>
                <textarea
                  rows={3}
                  value={servico.metaDescription}
                  disabled={!podeEditar}
                  maxLength={META_MAX}
                  onChange={(e) => editar({ metaDescription: e.target.value })}
                  placeholder="Resumo exibido no resultado de busca (80 a 165 caracteres)."
                  className="w-full resize-y rounded-[var(--radius)] border border-line bg-surface px-2.5 py-1.5 text-[12px] leading-relaxed text-ink outline-none focus:border-primary disabled:opacity-60"
                />
                {(tituloForaDaFaixa || metaForaDaFaixa) && (
                  <p className="mt-1 text-[10.5px] text-danger">
                    {tituloForaDaFaixa && "Título fora da faixa. "}
                    {metaForaDaFaixa && "Meta description fora da faixa."}
                  </p>
                )}
              </div>
              <Campo label="Categoria" dica="Texto livre — usado para agrupar serviços parecidos.">
                <Entrada
                  value={servico.categoria}
                  disabled={!podeEditar}
                  onChange={(e) => editar({ categoria: e.target.value })}
                  placeholder="ex: clínico, estético…"
                />
              </Campo>
              <div className="border-t border-line pt-2.5">
                <Alternador
                  ativo={servico.noindex}
                  onChange={(v) => editar({ noindex: v })}
                  label="noindex"
                  descricao="Impede que o serviço apareça nos resultados de busca"
                />
              </div>
            </div>
          </PainelRecolhivel>

          {/* Posição / destaque */}
          <PainelRecolhivel titulo="Posição no site">
            <div className="space-y-2.5">
              <Campo label="Ordem" dica="Menor número aparece primeiro na listagem de serviços.">
                <Entrada
                  type="number"
                  value={servico.ordem}
                  disabled={!podeEditar}
                  onChange={(e) => editar({ ordem: Number(e.target.value) || 0 })}
                />
              </Campo>
              <div className="border-t border-line pt-2.5">
                <Alternador
                  ativo={servico.destaque}
                  onChange={(v) => editar({ destaque: v })}
                  label="Destaque"
                  descricao="Aparece em posição de destaque no site"
                />
              </div>
            </div>
          </PainelRecolhivel>

          {/* Imagem */}
          <PainelRecolhivel titulo="Imagem do serviço" inicialAberto={false}>
            {capaUrl ? (
              <>
                <Thumb
                  gradiente="from-slate-200 to-slate-300"
                  url={capaUrl}
                  alt={servico.imagemAlt}
                  className="aspect-[16/9] w-full"
                />
                <p className="mt-1.5 truncate font-mono text-[10.5px] text-ink-muted">{capaUrl}</p>
              </>
            ) : (
              <div className="rounded-[var(--radius)] border border-dashed border-line px-3 py-5 text-center text-[11px] text-ink-muted">
                Nenhuma imagem escolhida.
              </div>
            )}
            {podeEditar && (
              <div className="mt-2 flex gap-1.5">
                <Botao tamanho="sm" onClick={() => setBibliotecaImagem(true)}>
                  <ImageIcon size={11} /> {capaUrl ? "Trocar imagem" : "Escolher da biblioteca"}
                </Botao>
                {capaUrl && (
                  <Botao tamanho="sm" variante="perigo" onClick={() => editar({ imagem: "", imagemAlt: "" })}>
                    Remover
                  </Botao>
                )}
              </div>
            )}
            <div className="mt-2.5">
              <Campo label="Texto alternativo">
                <Entrada
                  value={servico.imagemAlt}
                  disabled={!podeEditar}
                  onChange={(e) => editar({ imagemAlt: e.target.value })}
                  placeholder="Descreva a imagem para quem não a vê"
                />
              </Campo>
            </div>
            <div className="mt-2.5">
              <Campo label="Ícone" dica="Nome do ícone usado pelo tema (varia conforme o layout do site).">
                <Entrada
                  value={servico.icone}
                  disabled={!podeEditar}
                  onChange={(e) => editar({ icone: e.target.value })}
                  placeholder="ex: tooth, scale, wrench…"
                />
              </Campo>
            </div>
          </PainelRecolhivel>

          {podeEditar && (
            <PainelRecolhivel titulo="Excluir" inicialAberto={false}>
              <p className="mb-2 text-[11.5px] text-ink-muted">
                Move este serviço para a lixeira. Posts que usam esta página como conteúdo pilar perdem esse vínculo.
              </p>
              <Botao
                variante="perigo"
                tamanho="sm"
                onClick={async () => {
                  if (!confirm(`Mandar "${servico.slug}" para a lixeira?`)) return;
                  const res = await fetch(`/api/servicos/${encodeURIComponent(servico.slug)}`, { method: "DELETE" });
                  const data = await res.json();
                  if (data.ok) router.push("/servicos");
                  else alert(data.erro || "Não consegui excluir.");
                }}
              >
                <Trash2 size={11} /> Mandar para a lixeira
              </Botao>
            </PainelRecolhivel>
          )}
        </div>
      </div>

      <SeletorMidia
        aberto={bibliotecaImagem}
        aoFechar={() => setBibliotecaImagem(false)}
        aoEscolher={(m) => {
          editar({ imagem: caminhoDaMidia(m.url), imagemAlt: servico.imagemAlt || m.alt || "" });
          setBibliotecaImagem(false);
        }}
      />
    </>
  );
}
