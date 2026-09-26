"use client";

import {
  ExternalLink,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import { BadgeStatus, Botao } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { INTENCAO_DETALHE } from "@/lib/intencao";
import type { Intencao, Pagina, TipoPagina } from "@/mock/types";

/* ---------------------------------------------------------------- helpers */

const TIPO_LABEL: Record<TipoPagina, string> = {
  home: "Home",
  money: "Money",
  pilar: "Pilar",
  supporting: "Supporting",
  institucional: "Institucional",
};

const TIPO_TOM: Record<TipoPagina, string> = {
  home: "bg-success/10 text-success border-success/30",
  money: "bg-danger/10 text-danger border-danger/30",
  pilar: "bg-primary/10 text-primary border-primary/30",
  supporting: "bg-success/10 text-success border-success/30",
  institucional: "bg-accent/10 text-accent border-accent/30",
};

const INTENCAO_COR: Record<Intencao, string> = {
  T: "bg-danger/10 text-danger border-danger/30",
  C: "bg-accent/10 text-accent border-accent/30",
  I: "bg-primary/10 text-primary border-primary/30",
  N: "bg-success/10 text-success border-success/30",
};

type FiltroStatus = "todas" | "publicado" | "rascunho" | "lixeira";

/* ---------------------------------------------------------------- page */

export default function PaginasPage() {
  const { paginas: paginasMock } = useStore();
  const [paginas, setPaginas] = useState<typeof paginasMock>([]);
  const [carregandoPaginas, setCarregandoPaginas] = useState(true);

  useEffect(() => {
    fetch("/api/paginas")
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.paginas)) {
          setPaginas(data.paginas);
        } else {
          // Fallback para mock só se API falhar completamente
          setPaginas(paginasMock);
        }
      })
      .catch(() => setPaginas(paginasMock))
      .finally(() => setCarregandoPaginas(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");
  const [filtroTipo, setFiltroTipo] = useState<TipoPagina | "">("");
  const [filtroIntencao, setFiltroIntencao] = useState<Intencao | "">("");
  const [filtroCluster, setFiltroCluster] = useState("");
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [menuAberto, setMenuAberto] = useState<string | null>(null);

  const clusters = useMemo(
    () => [...new Set(paginas.map((p) => p.cluster).filter(Boolean) as string[])].sort(),
    [paginas],
  );

  const visiveis = useMemo(() => {
    return paginas.filter((p) => {
      if (filtroStatus === "lixeira") return false;
      if (filtroStatus === "publicado" && p.status !== "publicado") return false;
      if (filtroStatus === "rascunho" && p.status !== "rascunho") return false;
      if (filtroTipo && p.tipo !== filtroTipo) return false;
      if (filtroIntencao && p.intencao !== filtroIntencao) return false;
      if (filtroCluster && p.cluster !== filtroCluster) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          p.titulo.toLowerCase().includes(q) ||
          p.url.toLowerCase().includes(q) ||
          (p.cluster ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [paginas, filtroStatus, filtroTipo, filtroIntencao, filtroCluster, busca]);

  const contagens: Record<FiltroStatus, number> = useMemo(
    () => ({
      todas: paginas.length,
      publicado: paginas.filter((p) => p.status === "publicado").length,
      rascunho: paginas.filter((p) => p.status === "rascunho").length,
      lixeira: 0,
    }),
    [paginas],
  );

  const todasSelecionadas =
    visiveis.length > 0 && visiveis.every((p) => selecionados.has(p.id));

  function toggleTodos() {
    if (todasSelecionadas) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(visiveis.map((p) => p.id)));
    }
  }

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const ABAS: { id: FiltroStatus; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "publicado", label: "Publicadas" },
    { id: "rascunho", label: "Rascunhos" },
    { id: "lixeira", label: "Lixeira" },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* cabeçalho */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
            Páginas
          </h1>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">
            {paginas.length} páginas no site
          </p>
        </div>
        <div className="group relative">
          <Botao variante="secundario" tamanho="sm" disabled className="cursor-not-allowed opacity-50">
            Adicionar página
          </Botao>
          <span className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 hidden w-64 rounded-[var(--radius)] border border-line bg-surface-2 px-2.5 py-2 text-[11px] leading-relaxed text-ink-muted shadow-lg group-hover:block">
            Páginas são criadas pelo construtor a partir da arquitetura do LinkFlow.
          </span>
        </div>
      </div>

      {/* abas de filtro rápido */}
      <div className="flex items-center gap-0 border-b border-line px-6">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => {
              setFiltroStatus(aba.id);
              setSelecionados(new Set());
            }}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors",
              filtroStatus === aba.id
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {aba.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-[1px] text-[10px] font-semibold",
                filtroStatus === aba.id
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary text-ink-muted",
              )}
            >
              {contagens[aba.id]}
            </span>
          </button>
        ))}
      </div>

      {/* barra de ações */}
      <div className="flex items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
        {/* busca */}
        <div className="relative flex-1 max-w-xs">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar páginas…"
            className="h-7 w-full rounded-[var(--radius)] border border-line bg-surface-2 pl-7 pr-3 text-[12px] text-ink placeholder:text-ink-muted/70 outline-none focus:border-primary"
          />
        </div>

        {/* filtro tipo */}
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoPagina | "")}
          className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink outline-none focus:border-primary"
        >
          <option value="">Tipo: todos</option>
          <option value="money">Money</option>
          <option value="pilar">Pilar</option>
          <option value="home">Home</option>
          <option value="supporting">Supporting</option>
          <option value="institucional">Institucional</option>
        </select>

        {/* filtro intenção */}
        <select
          value={filtroIntencao}
          onChange={(e) => setFiltroIntencao(e.target.value as Intencao | "")}
          className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink outline-none focus:border-primary"
        >
          <option value="">Intenção: todas</option>
          <option value="T">Transacional (T)</option>
          <option value="C">Comercial (C)</option>
          <option value="I">Informacional (I)</option>
          <option value="N">Navegacional (N)</option>
        </select>

        {/* filtro cluster */}
        <select
          value={filtroCluster}
          onChange={(e) => setFiltroCluster(e.target.value)}
          className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink outline-none focus:border-primary"
        >
          <option value="">Cluster: todos</option>
          {clusters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {selecionados.size > 0 && (
            <>
              <span className="text-[11.5px] text-ink-muted">
                {selecionados.size} selecionada{selecionados.size !== 1 ? "s" : ""}
              </span>
              <Botao variante="perigo" tamanho="sm">
                <Trash2 size={12} />
                Excluir
              </Botao>
            </>
          )}
          <Link
            href="/paginas/estrutura"
            className="inline-flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-line bg-surface-2 px-2.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Ver estrutura →
          </Link>
        </div>
      </div>

      {/* tabela */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="w-8 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={todasSelecionadas}
                  onChange={toggleTodos}
                  className="h-3.5 w-3.5 cursor-pointer rounded accent-primary"
                />
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Título / URL</th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Tipo</th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Intenção</th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Cluster</th>
              <th className="px-3 py-2.5 text-center font-medium text-ink-muted">Nível</th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Composição</th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Status</th>
              <th className="px-3 py-2.5 text-center font-medium text-ink-muted">Links</th>
              <th className="w-8 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visiveis.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-12 text-center text-[12px] text-ink-muted"
                >
                  Nenhuma página encontrada
                </td>
              </tr>
            ) : (
              visiveis.map((pagina) => (
                <LinhaTabela
                  key={pagina.id}
                  pagina={pagina}
                  selecionada={selecionados.has(pagina.id)}
                  onToggle={() => toggleSelecionado(pagina.id)}
                  menuAberto={menuAberto === pagina.id}
                  onAbrirMenu={() =>
                    setMenuAberto(menuAberto === pagina.id ? null : pagina.id)
                  }
                  onFecharMenu={() => setMenuAberto(null)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* rodapé paginação */}
      <div className="flex items-center justify-between border-t border-line px-6 py-3">
        <span className="text-[11.5px] text-ink-muted">
          Exibindo {visiveis.length} de {paginas.length} páginas
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            className="h-6 rounded border border-line px-2 text-[11px] text-ink-muted disabled:opacity-40"
          >
            ←
          </button>
          <span className="h-6 rounded border border-primary bg-primary/10 px-2 text-[11px] font-semibold leading-6 text-primary">
            1
          </span>
          <button
            type="button"
            disabled
            className="h-6 rounded border border-line px-2 text-[11px] text-ink-muted disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- row */

function LinhaTabela({
  pagina,
  selecionada,
  onToggle,
  menuAberto,
  onAbrirMenu,
  onFecharMenu,
}: {
  pagina: Pagina;
  selecionada: boolean;
  onToggle: () => void;
  menuAberto: boolean;
  onAbrirMenu: () => void;
  onFecharMenu: () => void;
}) {
  return (
    <tr
      className={cn(
        "group relative transition-colors hover:bg-secondary/60",
        selecionada && "bg-primary/5",
      )}
    >
      {/* checkbox */}
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={selecionada}
          onChange={onToggle}
          className="h-3.5 w-3.5 cursor-pointer rounded accent-primary"
        />
      </td>

      {/* título + url */}
      <td className="px-3 py-2.5">
        <div className="min-w-0">
          <Link
            href={`/paginas/${pagina.id}`}
            className="block truncate font-medium text-ink hover:text-primary"
          >
            {pagina.titulo}
          </Link>
          <span className="block truncate font-mono text-[10.5px] text-ink-muted">
            {pagina.url}
          </span>
        </div>
      </td>

      {/* tipo */}
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "inline-flex items-center rounded border px-1.5 py-[1px] text-[10.5px] font-medium",
            TIPO_TOM[pagina.tipo],
          )}
        >
          {TIPO_LABEL[pagina.tipo]}
        </span>
      </td>

      {/* intenção */}
      <td className="px-3 py-2.5">
        <span
          title={INTENCAO_DETALHE[pagina.intencao]}
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded border text-[10.5px] font-bold",
            INTENCAO_COR[pagina.intencao],
          )}
        >
          {pagina.intencao}
        </span>
      </td>

      {/* cluster */}
      <td className="px-3 py-2.5">
        {pagina.cluster ? (
          <span className="text-[11.5px] text-ink">{pagina.cluster}</span>
        ) : (
          <span className="text-[11.5px] text-ink-muted/50">—</span>
        )}
      </td>

      {/* nível */}
      <td className="px-3 py-2.5 text-center">
        <span className="text-[11.5px] text-ink-muted">{pagina.nivel}</span>
      </td>

      {/* composição */}
      <td className="px-3 py-2.5">
        <span className="truncate text-[11px] text-ink-muted" style={{ maxWidth: 140 }}>
          {pagina.composicao}
        </span>
      </td>

      {/* status */}
      <td className="px-3 py-2.5">
        <BadgeStatus status={pagina.status} />
      </td>

      {/* links recebidos */}
      <td className="px-3 py-2.5 text-center">
        <span
          className={cn(
            "font-mono text-[11px]",
            pagina.linksRecebidos === 0 ? "text-danger" : "text-ink-muted",
          )}
        >
          {pagina.linksRecebidos}
        </span>
      </td>

      {/* ações hover */}
      <td className="px-2 py-2.5">
        <div className="relative">
          <button
            type="button"
            onClick={onAbrirMenu}
            className="flex h-6 w-6 items-center justify-center rounded text-ink-muted opacity-0 transition-opacity hover:bg-secondary hover:text-ink group-hover:opacity-100"
          >
            <MoreHorizontal size={13} />
          </button>
          {menuAberto && (
            <MenuAcoes pagina={pagina} onFechar={onFecharMenu} />
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuAcoes({ pagina, onFechar }: { pagina: Pagina; onFechar: () => void }) {
  return (
    <div
      className="absolute right-0 top-7 z-20 min-w-[140px] rounded-[var(--radius)] border border-line bg-surface-2 py-1 shadow-lg"
      onMouseLeave={onFechar}
    >
      <Link
        href={`/paginas/${pagina.id}`}
        className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-ink hover:bg-secondary"
      >
        Editar
      </Link>
      <a
        href={pagina.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-ink hover:bg-secondary"
      >
        <ExternalLink size={11} className="text-ink-muted" />
        Ver no site
      </a>
      <div className="my-1 border-t border-line" />
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-danger hover:bg-danger/10"
      >
        <Trash2 size={11} />
        Mover para lixeira
      </button>
    </div>
  );
}
