"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  FileQuestion,
  ImageIcon,
  Link2,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { SeletorMidia } from "@/components/SeletorMidia";
import {
  AreaTexto,
  Botao,
  Campo,
  Contador,
  Entrada,
  Painel,
  Rotulo,
  Selecao,
  Thumb,
  Vazio,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { useDominio } from "@/lib/useDominio";
import { cn, slugify } from "@/lib/utils";
import { urlCategoria } from "@/lib/urls-publicas";
import type { Categoria, Intencao } from "@/mock/types";

/* ------------------------------------------------------------------ */
/* Constantes                                                            */
/* ------------------------------------------------------------------ */

const LIMITE_TITLE = 70;
const MINIMO_TITLE = 30;
const LIMITE_META = 165;
const MINIMO_META = 120;

/* ------------------------------------------------------------------ */
/* Painel lateral de posts                                               */
/* ------------------------------------------------------------------ */

function PainelPosts({ catId }: { catId: string }) {
  const { posts } = useStore();
  const postsDaCategoria = posts.filter((p) => p.categoriaId === catId);

  const STATUS_COR: Record<string, string> = {
    publicado: "text-success",
    rascunho: "text-ink-muted",
    revisao: "text-accent",
    agendado: "text-primary",
  };

  const STATUS_LABEL: Record<string, string> = {
    publicado: "Publicado",
    rascunho: "Rascunho",
    revisao: "Em revisão",
    agendado: "Agendado",
  };

  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">
          Posts
          <span className="ml-1.5 text-[11px] font-normal text-ink-muted">
            ({postsDaCategoria.length})
          </span>
        </p>
        <Link href={`/posts?categoria=${catId}`} className="text-[11.5px] text-primary hover:underline">
          Ver todos
        </Link>
      </div>

      {postsDaCategoria.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-line px-3 py-4 text-center text-[11.5px] text-ink-muted">
          Nenhum post nesta categoria.
        </p>
      ) : (
        <ul className="space-y-2">
          {postsDaCategoria.slice(0, 6).map((p) => (
            <li key={p.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <Link href={`/posts/${p.id}`} className="block text-[12.5px] font-medium text-ink hover:text-primary">
                {p.titulo}
              </Link>
              <p className={cn("mt-0.5 text-[11px]", STATUS_COR[p.status] ?? "text-ink-muted")}>
                {STATUS_LABEL[p.status] ?? p.status}
              </p>
            </li>
          ))}
          {postsDaCategoria.length > 6 && (
            <li>
              <Link href={`/posts?categoria=${catId}`} className="text-[11.5px] text-primary hover:underline">
                + {postsDaCategoria.length - 6} mais posts
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor                                                                */
/* ------------------------------------------------------------------ */

export default function EditorCategoriaPage() {
  const dominio = useDominio();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { categorias, paginas, midia, criarCategoria, atualizarCategoria, atualizarCategoriaLocal } = useStore();

  const cat = categorias.find((c) => c.id === id);

  const [slugOriginal] = useState(() => cat?.slug ?? "");
  const [cor, setCor] = useState("#0b5cff");
  const [bibliotecaImagem, setBibliotecaImagem] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");
  const [erroCriar, setErroCriar] = useState("");
  // Acumula o que mudou desde o último Salvar — só isso vai pro PATCH.
  const patchPendente = useRef<Partial<Categoria>>({});

  /* Clusters já existentes no site — para sugestões no datalist */
  const clustersExistentes = useMemo(
    () => [...new Set(categorias.filter((c) => c.cluster).map((c) => c.cluster))].sort(),
    [categorias],
  );

  /* Páginas do tipo pilar disponíveis */
  const paginasPilar = useMemo(
    () => paginas.filter((p) => p.tipo === "pilar" && p.status === "publicado"),
    [paginas],
  );

  const NOVO = id === "novo";

  useEffect(() => {
    if (NOVO && !cat && !erroCriar) {
      const maxOrdem = categorias.reduce((max, c) => Math.max(max, c.ordem), 0);
      criarCategoria({
        nome: "",
        slug: "",
        descricao: "",
        seoTitle: "",
        metaDescription: "",
        imagem: "",
        paiId: null,
        ordem: maxOrdem + 1,
        cluster: "",
        intencao: "",
        origemLinkFlow: false,
      }).then((r) => {
        if (r.ok) router.replace(`/categorias/${r.categoria.id}`);
        else setErroCriar(r.erro);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cat) {
    if (erroCriar) {
      return (
        <Painel>
          <Vazio
            icone={<AlertTriangle size={18} />}
            titulo="Não foi possível criar a categoria"
            descricao={erroCriar}
            acao={
              <Link href="/categorias">
                <Botao tamanho="sm">Voltar para categorias</Botao>
              </Link>
            }
          />
        </Painel>
      );
    }
    if (NOVO) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <p className="text-[13px] text-ink-muted">Criando categoria…</p>
        </div>
      );
    }
    return (
      <Painel>
        <Vazio
          icone={<FileQuestion size={18} />}
          titulo="Categoria não encontrada"
          descricao="Este identificador não existe na sessão atual."
          acao={
            <Link href="/categorias">
              <Botao tamanho="sm">Voltar para categorias</Botao>
            </Link>
          }
        />
      </Painel>
    );
  }

  const imagem = midia.find((m) => m.id === cat.imagem);
  // Categoria tem página pública própria em /<slug> — mesma raiz de
  // serviço e artigo (URL plana, nunca /categoria/<slug> — ver
  // lib/urls-publicas.ts). Sem slug ainda, não há o que mostrar/abrir.
  const urlPublica = cat.slug
    ? `${dominio ? `https://${dominio}` : "https://seudominio.com.br"}${urlCategoria(cat.slug)}`
    : "";
  const slugAlterado = !!slugOriginal && cat.slug !== slugOriginal;

  const editar = (patch: Partial<Categoria>) => {
    patchPendente.current = { ...patchPendente.current, ...patch };
    atualizarCategoriaLocal(cat.id, patch);
    setSalvo(false);
    setErroSalvar("");
  };

  const salvar = async () => {
    const patch = patchPendente.current;
    if (Object.keys(patch).length === 0) {
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2200);
      return;
    }
    setSalvando(true);
    setErroSalvar("");
    const ok = await atualizarCategoria(cat.id, patch);
    setSalvando(false);
    if (!ok) {
      setErroSalvar("Não foi possível salvar. Tente de novo.");
      return;
    }
    patchPendente.current = {};
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2200);
  };

  const semCluster = !cat.cluster.trim();

  return (
    <>
      {/* Cabeçalho */}
      <div className="mb-4 flex items-center gap-2">
        <Botao variante="fantasma" onClick={() => router.push("/categorias")}>
          <ArrowLeft size={13} /> Categorias
        </Botao>
        <span className="truncate font-mono text-[10.5px] text-ink-muted">
          {urlPublica || "Defina o slug para gerar a URL"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {salvo && <span className="text-[11px] text-success">Alterações salvas</span>}
          {erroSalvar && <span className="text-[11px] text-danger">{erroSalvar}</span>}
          {urlPublica && (
            <a href={urlPublica} target="_blank" rel="noopener noreferrer">
              <Botao variante="secundario">
                <ExternalLink size={12} /> Ver
              </Botao>
            </a>
          )}
          <Botao variante="primario" onClick={() => void salvar()} disabled={salvando}>
            <Save size={12} /> {salvando ? "Salvando…" : "Salvar"}
          </Botao>
        </div>
      </div>

      {/* Aviso âmbar sem cluster */}
      {semCluster && (
        <div className="mb-4 flex items-start gap-2 rounded-[var(--radius)] border border-amber-300 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle size={14} className="mt-px shrink-0" />
          <span>
            Sem cluster definido — esta categoria não participa da estratégia de links internos.
          </span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* ---------------------------------------------------------------- Formulário */}
        <div className="space-y-5">

          {/* Identificação */}
          <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-[13px] font-semibold text-ink">Identificação</h2>
            <div className="space-y-3">
              <Campo label="Nome" dica="É como aparece no site">
                <Entrada
                  value={cat.nome}
                  onChange={(e) => editar({ nome: e.target.value })}
                  placeholder="Nome da categoria"
                  autoFocus={!cat.nome}
                />
              </Campo>

              <Campo label="Slug">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 font-mono text-[11px] text-ink-muted">{dominio || "seudominio.com.br"}/</span>
                  <Entrada
                    value={cat.slug}
                    onChange={(e) => editar({ slug: slugify(e.target.value) })}
                    placeholder="slug-da-categoria"
                    className="font-mono text-[12px]"
                  />
                  <Botao tamanho="sm" variante="fantasma" onClick={() => editar({ slug: slugify(cat.nome) })}>
                    <Link2 size={11} /> Regerar
                  </Botao>
                </div>
                {slugAlterado && (
                  <p className="mt-1 text-[10.5px] text-amber-600">
                    Alterar o slug gera um redirect 301 automático da URL anterior.
                  </p>
                )}
              </Campo>

              <Campo label="Descrição" dica="Aparece no topo da página de arquivo">
                <AreaTexto
                  rows={3}
                  value={cat.descricao}
                  onChange={(e) => editar({ descricao: e.target.value })}
                  placeholder="Breve descrição da categoria para os visitantes."
                />
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo label="Ordem de exibição">
                  <Entrada
                    type="number"
                    value={String(cat.ordem)}
                    onChange={(e) => editar({ ordem: Number(e.target.value) })}
                    min={1}
                  />
                </Campo>
                <Campo label="Cor de identificação">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-line bg-transparent p-0.5"
                    />
                    <Entrada
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      className="font-mono text-[12px]"
                      placeholder="#000000"
                    />
                  </div>
                </Campo>
              </div>
            </div>
          </div>

          {/* Taxonomia e estratégia */}
          <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-[13px] font-semibold text-ink">Taxonomia e estratégia</h2>
            <div className="space-y-3">

              {/* Categoria ascendente */}
              <Campo label="Categoria ascendente">
                <Selecao
                  value={cat.paiId ?? ""}
                  onChange={(e) => editar({ paiId: e.target.value || null })}
                >
                  <option value="">— Nenhuma (categoria raiz)</option>
                  {categorias
                    .filter((c) => c.id !== cat.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                </Selecao>
              </Campo>

              {/* Cluster */}
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <Rotulo>Cluster</Rotulo>
                  {cat.origemLinkFlow && cat.cluster && (
                    <span className="rounded bg-primary/10 px-1.5 py-px text-[9.5px] font-medium text-primary">
                      vindo do LinkFlow
                    </span>
                  )}
                </div>
                <Entrada
                  value={cat.cluster}
                  list="lista-clusters"
                  onChange={(e) => editar({ cluster: e.target.value })}
                  placeholder="ex: financas"
                  aviso={semCluster}
                />
                <datalist id="lista-clusters">
                  {clustersExistentes.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {semCluster && (
                  <p className="mt-1 text-[10.5px] text-amber-600">
                    Sem cluster — esta categoria não participa da estratégia de links internos.
                  </p>
                )}
              </div>

              {/* Intenção */}
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <Rotulo>Intenção de busca</Rotulo>
                  {cat.origemLinkFlow && cat.intencao && (
                    <span className="rounded bg-primary/10 px-1.5 py-px text-[9.5px] font-medium text-primary">
                      vindo do LinkFlow
                    </span>
                  )}
                </div>
                <Selecao
                  value={cat.intencao}
                  onChange={(e) => editar({ intencao: e.target.value as Intencao | "" })}
                >
                  <option value="">Não definida</option>
                  <option value="I">I — Informacional</option>
                  <option value="C">C — Comercial</option>
                  <option value="T">T — Transacional</option>
                  <option value="N">N — Navegacional</option>
                </Selecao>
              </div>

              {/* Página pilar */}
              <Campo
                label="Página pilar"
                dica="Página de autoridade do cluster à qual esta categoria está associada."
              >
                <Selecao
                  value={cat.paiId ?? ""}
                  onChange={() => {}}
                  disabled={paginasPilar.length === 0}
                >
                  <option value="">— Não definida</option>
                  {paginasPilar.map((p) => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))}
                </Selecao>
                {paginasPilar.length === 0 && (
                  <p className="mt-1 text-[10.5px] text-ink-muted">
                    Nenhuma página pilar publicada encontrada.
                  </p>
                )}
              </Campo>
            </div>
          </div>

          {/* Imagem destacada */}
          <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-[13px] font-semibold text-ink">Imagem destacada</h2>

            {imagem ? (
              <>
                <Thumb gradiente={imagem.gradiente} className="aspect-[16/9] w-full" />
                <p className="mt-1.5 truncate font-mono text-[10.5px] text-ink-muted">{imagem.arquivo}</p>
              </>
            ) : (
              <div className="rounded-[var(--radius)] border border-dashed border-line px-3 py-6 text-center text-[11px] text-ink-muted">
                Nenhuma imagem escolhida.
              </div>
            )}

            <div className="mt-2 flex gap-1.5">
              <Botao tamanho="sm" onClick={() => setBibliotecaImagem(true)}>
                <ImageIcon size={11} /> {imagem ? "Trocar" : "Escolher da biblioteca"}
              </Botao>
              {imagem && (
                <Botao tamanho="sm" variante="perigo" onClick={() => editar({ imagem: "" })}>
                  Remover
                </Botao>
              )}
            </div>

            <div className="mt-2.5">
              <Campo label="Texto alternativo" obrigatorio>
                <Entrada
                  value={imagem?.alt ?? ""}
                  placeholder="Descreva a imagem"
                  disabled={!imagem}
                  invalido={!!imagem && !(imagem?.alt ?? "").trim()}
                  onChange={() => {}}
                />
              </Campo>
              {!!imagem && !(imagem?.alt ?? "").trim() && (
                <p className="mt-1 text-[10.5px] text-danger">
                  Imagem sem alt entra como aviso na saúde do site.
                </p>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-[13px] font-semibold text-ink">SEO</h2>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-baseline justify-between">
                  <Rotulo>Title SEO</Rotulo>
                  <Contador atual={cat.seoTitle.length} max={LIMITE_TITLE} min={MINIMO_TITLE} />
                </div>
                <Entrada
                  value={cat.seoTitle}
                  onChange={(e) => editar({ seoTitle: e.target.value })}
                  placeholder={cat.nome || "Título para o Google"}
                  invalido={cat.seoTitle.length > LIMITE_TITLE}
                  aviso={cat.seoTitle.length > 0 && cat.seoTitle.length < MINIMO_TITLE}
                />
              </div>

              <div>
                <div className="mb-1 flex items-baseline justify-between">
                  <Rotulo>Meta description</Rotulo>
                  <Contador atual={cat.metaDescription.length} max={LIMITE_META} min={MINIMO_META} />
                </div>
                <AreaTexto
                  rows={3}
                  value={cat.metaDescription}
                  onChange={(e) => editar({ metaDescription: e.target.value })}
                  placeholder="Resumo de até 165 caracteres exibido no resultado de busca."
                  invalido={cat.metaDescription.length > LIMITE_META}
                  aviso={cat.metaDescription.length > 0 && cat.metaDescription.length < MINIMO_META}
                />
              </div>

              {/* Pré-visualização */}
              <div className="rounded-[var(--radius)] border border-line bg-surface p-2.5">
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-ink-muted">
                  Resultado no Google
                </p>
                <p className="truncate text-[13px] leading-snug text-[color:var(--primary)]">
                  {cat.seoTitle || cat.nome || "Nome da categoria"}
                </p>
                <p className="truncate text-[11px] text-ink-muted">
                  {urlPublica || "Defina o slug para gerar a URL"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] text-ink-muted">
                  {cat.metaDescription || cat.descricao || "A meta description aparece aqui."}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ---------------------------------------------------------------- Painel de posts */}
        <div>
          <PainelPosts catId={cat.id} />
        </div>
      </div>

      <SeletorMidia
        aberto={bibliotecaImagem}
        aoFechar={() => setBibliotecaImagem(false)}
        selecionada={cat.imagem}
        aoEscolher={(m) => editar({ imagem: m.id })}
      />
    </>
  );
}
