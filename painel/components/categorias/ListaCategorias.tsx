"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { cn, slugify } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Categoria, Intencao } from "@/mock/types";

/* ------------------------------------------------------------------ */
/* Constantes e helpers                                                  */
/* ------------------------------------------------------------------ */

const ITENS_POR_PAGINA = 20;

const INTENCAO_CONFIG: Record<Intencao, { rotulo: string; className: string }> = {
  T: { rotulo: "Transacional", className: "bg-accent/15 text-accent" },
  C: { rotulo: "Comercial", className: "bg-primary/15 text-primary" },
  I: { rotulo: "Informacional", className: "bg-success/15 text-success" },
  N: { rotulo: "Navegacional", className: "bg-secondary text-ink-muted" },
};

function calcularSEO(cat: Categoria): number | null {
  if (!cat.seoTitle && !cat.metaDescription) return null;
  let pts = 0;
  if (cat.seoTitle) pts += 20;
  if (cat.seoTitle && cat.seoTitle.length >= 30 && cat.seoTitle.length <= 70) pts += 15;
  if (cat.metaDescription) pts += 20;
  if (cat.metaDescription && cat.metaDescription.length >= 120 && cat.metaDescription.length <= 165) pts += 15;
  if (cat.descricao) pts += 15;
  if (cat.slug) pts += 5;
  if (cat.imagem) pts += 10;
  return Math.min(pts, 100);
}

function testesFalhosSEO(cat: Categoria): string[] {
  const falhas: string[] = [];
  if (!cat.seoTitle) falhas.push("Title SEO vazio");
  else if (cat.seoTitle.length > 70) falhas.push("Title SEO longo (>70 chars)");
  else if (cat.seoTitle.length < 30) falhas.push("Title SEO curto (<30 chars)");
  if (!cat.metaDescription) falhas.push("Meta description vazia");
  else if (cat.metaDescription.length > 165) falhas.push("Meta description longa (>165)");
  else if (cat.metaDescription.length < 120) falhas.push("Meta description curta (<120)");
  if (!cat.descricao) falhas.push("Descrição vazia");
  if (!cat.slug) falhas.push("Slug vazio");
  if (!cat.imagem) falhas.push("Sem imagem destacada");
  return falhas;
}

function corPontuacao(v: number): string {
  if (v >= 80) return "bg-success text-white";
  if (v >= 50) return "bg-accent text-white";
  return "bg-danger text-white";
}

/* ------------------------------------------------------------------ */
/* Sub-componentes                                                       */
/* ------------------------------------------------------------------ */

function PontuacaoSEO({ cat }: { cat: Categoria }) {
  const valor = calcularSEO(cat);
  if (valor === null)
    return <span className="text-[11px] text-ink-muted">—</span>;
  const falhas = testesFalhosSEO(cat);
  return (
    <div className="group relative inline-flex justify-center">
      <span
        className={cn(
          "inline-flex h-7 w-7 cursor-default items-center justify-center rounded-full text-[11px] font-bold",
          corPontuacao(valor),
        )}
      >
        {valor}
      </span>
      {falhas.length > 0 && (
        <div className="pointer-events-none invisible absolute bottom-full right-0 z-50 mb-1.5 w-56 rounded-lg border border-line bg-surface-2 p-2.5 text-left text-[11px] shadow-lg group-hover:visible">
          <p className="mb-1 font-semibold text-ink">
            {falhas.length} teste{falhas.length > 1 ? "s" : ""} com falha
          </p>
          <ul className="space-y-0.5">
            {falhas.map((f) => (
              <li key={f} className="text-danger">✗ {f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BadgeIntencao({ intencao }: { intencao: Intencao | "" }) {
  if (!intencao) return <span className="text-[11px] text-ink-muted">—</span>;
  const { rotulo, className } = INTENCAO_CONFIG[intencao];
  return (
    <div className="group relative inline-flex">
      <span
        className={cn(
          "inline-flex h-5 w-5 cursor-default items-center justify-center rounded text-[10.5px] font-bold",
          className,
        )}
      >
        {intencao}
      </span>
      <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface-2 px-2 py-1 text-[11px] text-ink shadow-lg group-hover:visible">
        {rotulo}
      </span>
    </div>
  );
}

function Toast({ mensagem }: { mensagem: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-success px-4 py-3 text-[13px] font-medium text-white shadow-lg">
      <CheckCircle2 size={15} />
      {mensagem}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal de confirmação de exclusão                                      */
/* ------------------------------------------------------------------ */

function ModalExclusao({
  nome,
  numPosts,
  onConfirmar,
  onCancelar,
}: {
  nome: string;
  numPosts: number;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm rounded-[var(--radius)] border border-line bg-surface-2 p-5 shadow-2xl">
        <div className="mb-3 flex items-start gap-2.5">
          <Trash2 size={16} className="mt-px shrink-0 text-danger" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Excluir categoria</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Tem certeza que deseja excluir <strong className="text-ink">"{nome}"</strong>?
            </p>
          </div>
        </div>
        {numPosts > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-[var(--radius)] border border-amber-300 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle size={13} className="mt-px shrink-0" />
            <span>
              {numPosts} post{numPosts > 1 ? "s perderão" : " perderá"} a categoria após a exclusão.
            </span>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancelar}
            className="rounded-[var(--radius)] border border-line px-3 py-1.5 text-[12.5px] text-ink hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="rounded-[var(--radius)] bg-danger px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-danger/90"
          >
            Excluir mesmo assim
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Edição rápida inline                                                  */
/* ------------------------------------------------------------------ */

function EdicaoRapida({
  cat,
  colspan,
  onSalvar,
  onCancelar,
}: {
  cat: Categoria;
  colspan: number;
  onSalvar: (id: string, dados: Partial<Categoria>) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(cat.nome);
  const [slug, setSlug] = useState(cat.slug);
  const [descricao, setDescricao] = useState(cat.descricao);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    setSalvando(true);
    await onSalvar(cat.id, { nome, slug, descricao });
    setSalvando(false);
  };

  return (
    <tr>
      <td colSpan={colspan} className="border-b border-line bg-secondary p-0">
        <div className="border-t-2 border-primary px-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Nome</label>
              <input
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Slug</label>
              <input
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-ink focus:border-primary focus:outline-none"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Descrição</label>
              <input
                className="w-full rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-ink disabled:opacity-60"
            >
              {salvando && <Loader2 size={12} className="animate-spin" />}
              {salvando ? "Salvando…" : "Atualizar"}
            </button>
            <button onClick={onCancelar} className="px-3 py-1.5 text-[12.5px] text-ink-muted hover:text-ink">
              Cancelar
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                  */
/* ------------------------------------------------------------------ */

export function ListaCategorias() {
  const { categorias, posts, atualizarCategoria, deletarCategoria } = useStore();
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [edicaoRapida, setEdicaoRapida] = useState<string | null>(null);
  const [acaoEmMassa, setAcaoEmMassa] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<{ col: string; dir: "asc" | "desc" }>({
    col: "ordem",
    dir: "asc",
  });
  const [confirmarExclusao, setConfirmarExclusao] = useState<{
    id: string;
    nome: string;
    numPosts: number;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setCarregando(false), 400);
    return () => clearTimeout(t);
  }, []);

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* Contagem de posts por categoria */
  const contagemPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      map.set(p.categoriaId, (map.get(p.categoriaId) ?? 0) + 1);
    }
    return map;
  }, [posts]);

  /* Filtragem + ordenação */
  const listaFiltrada = useMemo(() => {
    let lista = [...categorias];
    if (busca) {
      const q = busca.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.slug.includes(q) ||
          c.cluster.includes(q),
      );
    }
    lista.sort((a, b) => {
      const { col, dir } = ordenacao;
      let va: string | number, vb: string | number;
      if (col === "nome") { va = a.nome; vb = b.nome; }
      else if (col === "seo") { va = calcularSEO(a) ?? -1; vb = calcularSEO(b) ?? -1; }
      else if (col === "posts") { va = contagemPorCategoria.get(a.id) ?? 0; vb = contagemPorCategoria.get(b.id) ?? 0; }
      else { va = a.ordem; vb = b.ordem; }
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return dir === "asc" ? cmp : -cmp;
    });
    return lista;
  }, [categorias, busca, ordenacao, contagemPorCategoria]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITENS_POR_PAGINA));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const itensPagina = listaFiltrada.slice(
    (paginaSegura - 1) * ITENS_POR_PAGINA,
    paginaSegura * ITENS_POR_PAGINA,
  );

  const todasSelecionadas =
    itensPagina.length > 0 && itensPagina.every((c) => selecionados.has(c.id));

  const toggleTodas = () =>
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (todasSelecionadas) itensPagina.forEach((c) => next.delete(c.id));
      else itensPagina.forEach((c) => next.add(c.id));
      return next;
    });

  const toggleItem = (id: string) =>
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const salvarEdicaoRapida = async (id: string, dados: Partial<Categoria>) => {
    const ok = await atualizarCategoria(id, dados);
    if (!ok) {
      mostrarToast("Não foi possível salvar — tente de novo.");
      return;
    }
    setEdicaoRapida(null);
    mostrarToast("Categoria atualizada.");
  };

  const aplicarAcao = async () => {
    if (!acaoEmMassa || selecionados.size === 0) return;
    await new Promise((res) => setTimeout(res, 500));
    mostrarToast(`Ação "${acaoEmMassa}" aplicada a ${selecionados.size} categoria(s).`);
    setAcaoEmMassa("");
  };

  const confirmarEExcluir = async () => {
    if (!confirmarExclusao) return;
    const ok = await deletarCategoria(confirmarExclusao.id);
    if (!ok) {
      mostrarToast("Não foi possível excluir — tente de novo.");
      return;
    }
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.delete(confirmarExclusao.id);
      return next;
    });
    setConfirmarExclusao(null);
    mostrarToast("Categoria excluída.");
  };

  const ordenarPor = (col: string) =>
    setOrdenacao((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col, dir: "asc" },
    );

  const Th = ({
    col,
    className,
    children,
  }: {
    col?: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <th
      onClick={col ? () => ordenarPor(col) : undefined}
      className={cn(
        "whitespace-nowrap border-b border-line px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted",
        col && "cursor-pointer select-none hover:text-ink",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {col && ordenacao.col === col && (
          ordenacao.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
        )}
      </span>
    </th>
  );

  const Paginacao = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center gap-1 text-[12.5px]", className)}>
      <span className="mr-1 text-ink-muted">
        {listaFiltrada.length} ite{listaFiltrada.length === 1 ? "m" : "ns"}
      </span>
      <button
        onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
        disabled={paginaSegura <= 1}
        className="rounded p-1 hover:bg-secondary disabled:opacity-40"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="min-w-[60px] text-center text-ink">
        {paginaSegura} / {totalPaginas}
      </span>
      <button
        onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
        disabled={paginaSegura >= totalPaginas}
        className="rounded p-1 hover:bg-secondary disabled:opacity-40"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );

  const TOTAL_COLS = 9;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-ink">Categorias</h1>
        <Link
          href="/categorias/novo"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-ink hover:bg-primary/90"
        >
          <Plus size={13} />
          Adicionar categoria
        </Link>
      </div>

      {/* Barra de ações */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink"
          value={acaoEmMassa}
          onChange={(e) => setAcaoEmMassa(e.target.value)}
        >
          <option value="">Ações em massa</option>
          <option value="editar">Editar</option>
          <option value="alterar_cluster">Alterar cluster</option>
        </select>
        <button
          onClick={aplicarAcao}
          disabled={!acaoEmMassa || selecionados.size === 0}
          className="rounded border border-line px-3 py-1.5 text-[12.5px] text-ink hover:bg-secondary disabled:opacity-40"
        >
          Aplicar
        </button>

        <div className="flex flex-1 items-center gap-1">
          <input
            className="min-w-[180px] flex-1 rounded border border-line bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            placeholder="Buscar categorias…"
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setBusca(buscaInput); setPaginaAtual(1); }
            }}
          />
          <button
            onClick={() => { setBusca(buscaInput); setPaginaAtual(1); }}
            className="rounded border border-line px-3 py-1.5 text-[12.5px] text-ink hover:bg-secondary"
          >
            Filtrar
          </button>
          {busca && (
            <button
              onClick={() => { setBusca(""); setBuscaInput(""); setPaginaAtual(1); }}
              className="p-1 text-ink-muted hover:text-ink"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <Paginacao />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-[var(--radius)] border border-line bg-surface-2 shadow-[var(--shadow-card)]">
        {carregando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-ink-muted">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-[13px]">Carregando categorias…</span>
          </div>
        ) : itensPagina.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20">
            <p className="text-[14px] font-medium text-ink">Nenhuma categoria encontrada.</p>
            {busca && (
              <button
                className="text-[12.5px] text-primary hover:underline"
                onClick={() => { setBusca(""); setBuscaInput(""); setPaginaAtual(1); }}
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-[12.5px]">
            <thead className="bg-surface">
              <tr>
                <th className="w-8 border-b border-line px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={todasSelecionadas}
                    onChange={toggleTodas}
                    className="accent-primary"
                  />
                </th>
                <Th col="nome">Nome</Th>
                <Th>Descrição</Th>
                <Th>Slug</Th>
                <Th>Cluster</Th>
                <Th className="text-center">Intenção</Th>
                <Th col="seo" className="text-center">SEO</Th>
                <Th col="posts" className="text-center">Posts</Th>
              </tr>
            </thead>
            <tbody>
              {itensPagina.map((cat) => {
                const selecionado = selecionados.has(cat.id);
                const emEdicao = edicaoRapida === cat.id;
                const numPosts = contagemPorCategoria.get(cat.id) ?? 0;
                const semCluster = !cat.cluster.trim();

                return (
                  <Fragment key={cat.id}>
                    <tr
                      className={cn(
                        "group border-b border-line",
                        selecionado ? "bg-primary/5" : "hover:bg-surface",
                        emEdicao && "bg-secondary",
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 align-top">
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => toggleItem(cat.id)}
                          className="mt-0.5 accent-primary"
                        />
                      </td>

                      {/* Nome + hover actions */}
                      <td className="min-w-[180px] px-3 py-2.5 align-top">
                        <p className="font-medium text-ink">{cat.nome || <em className="text-ink-muted">Sem nome</em>}</p>
                        <div className="mt-1 hidden items-center gap-3 group-hover:flex">
                          <Link
                            href={`/categorias/${cat.id}`}
                            className="text-[11.5px] text-primary hover:underline"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => setEdicaoRapida(emEdicao ? null : cat.id)}
                            className="text-[11.5px] text-primary hover:underline"
                          >
                            Edição rápida
                          </button>
                          <a
                            href={`/${cat.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11.5px] text-ink-muted hover:text-ink hover:underline"
                          >
                            Ver
                          </a>
                          <button
                            onClick={() =>
                              setConfirmarExclusao({ id: cat.id, nome: cat.nome || "Sem nome", numPosts })
                            }
                            className="text-[11.5px] text-danger hover:underline"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>

                      {/* Descrição */}
                      <td className="max-w-[240px] px-3 py-2.5 align-top">
                        <p className="line-clamp-2 text-ink-muted">{cat.descricao || "—"}</p>
                      </td>

                      {/* Slug */}
                      <td className="whitespace-nowrap px-3 py-2.5 align-top">
                        <span className="font-mono text-[11.5px] text-ink-muted">
                          {cat.slug ? `/${cat.slug}` : "—"}
                        </span>
                      </td>

                      {/* Cluster */}
                      <td className="whitespace-nowrap px-3 py-2.5 align-top">
                        {semCluster ? (
                          <div className="group/tip relative inline-flex items-center gap-1">
                            <AlertTriangle size={12} className="text-amber-500" />
                            <span className="text-[11px] text-amber-600">Sem cluster</span>
                            <span className="pointer-events-none invisible absolute bottom-full left-0 z-50 mb-1.5 w-64 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] text-ink shadow-lg group-hover/tip:visible">
                              Sem cluster — não participa da estratégia de links internos.
                            </span>
                          </div>
                        ) : (
                          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                            {cat.cluster}
                          </span>
                        )}
                      </td>

                      {/* Intenção */}
                      <td className="px-3 py-2.5 text-center align-top">
                        <BadgeIntencao intencao={cat.intencao} />
                      </td>

                      {/* SEO */}
                      <td className="px-3 py-2.5 text-center align-top">
                        <PontuacaoSEO cat={cat} />
                      </td>

                      {/* Contagem de posts */}
                      <td className="px-3 py-2.5 text-center align-top">
                        {numPosts > 0 ? (
                          <Link
                            href={`/posts?categoria=${cat.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {numPosts}
                          </Link>
                        ) : (
                          <span className="text-ink-muted">0</span>
                        )}
                      </td>
                    </tr>

                    {emEdicao && (
                      <EdicaoRapida
                        cat={cat}
                        colspan={TOTAL_COLS}
                        onSalvar={salvarEdicaoRapida}
                        onCancelar={() => setEdicaoRapida(null)}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!carregando && itensPagina.length > 0 && (
        <div className="mt-3 flex justify-end">
          <Paginacao />
        </div>
      )}

      {/* Modal de exclusão */}
      {confirmarExclusao && (
        <ModalExclusao
          nome={confirmarExclusao.nome}
          numPosts={confirmarExclusao.numPosts}
          onConfirmar={confirmarEExcluir}
          onCancelar={() => setConfirmarExclusao(null)}
        />
      )}

      {toast && <Toast mensagem={toast} />}
    </div>
  );
}
