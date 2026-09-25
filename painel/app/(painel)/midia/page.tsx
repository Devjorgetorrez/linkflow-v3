"use client";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Grid2x2,
  Info,
  List,
  Search,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { AreaTexto, Botao, Campo, Entrada, Mono, Thumb } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Midia } from "@/mock/types";

/* ---------------------------------------------------------------- helpers */

function formatarBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extrairData(url: string): string {
  const m = url.match(/\/(\d{4})\/(\d{2})\//);
  return m ? `${m[1]}/${m[2]}` : "—";
}

const FORMATOS_IMAGEM = ["JPG", "PNG", "WEBP", "GIF", "SVG"];

/* ---------------------------------------------------------------- grade */

function GradeMidia({
  itens,
  selecaoAtiva,
  selecionados,
  onToggle,
  onAbrir,
  onDrop,
  mostrarDropZone,
}: {
  itens: Midia[];
  selecaoAtiva: boolean;
  selecionados: Set<string>;
  onToggle: (id: string) => void;
  onAbrir: (m: Midia, idx: number) => void;
  onDrop: (e: React.DragEvent) => void;
  mostrarDropZone: boolean;
}) {
  const [arrastando, setArrastando] = useState(false);

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {itens.map((m, idx) => {
          const ehImagem = FORMATOS_IMAGEM.includes(m.formato);
          const semAlt = m.alt === "";
          const sel = selecionados.has(m.id);
          return (
            <div
              key={m.id}
              className={cn(
                "group relative cursor-pointer rounded-[var(--radius)] border transition-colors",
                sel ? "border-primary" : "border-line hover:border-ink-muted",
              )}
              onClick={() => selecaoAtiva ? onToggle(m.id) : onAbrir(m, idx)}
            >
              {/* miniatura */}
              <div className="relative overflow-hidden rounded-t-[var(--radius)]">
                {ehImagem ? (
                  <Thumb gradiente={m.gradiente} className="aspect-square w-full" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-secondary">
                    <FileText size={28} className="text-ink-muted" />
                  </div>
                )}
                {/* overlay hover */}
                <div className="absolute inset-0 bg-ink/20 opacity-0 transition-opacity group-hover:opacity-100" />
                {/* checkbox seleção */}
                {selecaoAtiva && (
                  <div className="absolute left-1.5 top-1.5">
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => onToggle(m.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 cursor-pointer rounded accent-primary"
                    />
                  </div>
                )}
                {/* badge sem alt */}
                {semAlt && (
                  <span className="absolute right-1.5 top-1.5 rounded border border-accent/40 bg-accent/90 px-1 py-[1px] text-[9px] font-semibold text-white">
                    Sem alt
                  </span>
                )}
              </div>
              {/* nome */}
              <div className="px-1.5 py-1.5">
                <p className="truncate text-[11px] text-ink-muted">{m.arquivo}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* drop zone */}
      {mostrarDropZone && (
        <div
          onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastando(false); onDrop(e); }}
          className={cn(
            "mt-4 flex flex-col items-center justify-center gap-2 rounded-[var(--radius)] border-2 border-dashed py-8 text-center transition-colors",
            arrastando ? "border-primary bg-primary/5" : "border-line",
          )}
        >
          <Upload size={20} className="text-ink-muted" />
          <p className="text-[12px] text-ink-muted">Arraste imagens aqui para enviar</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- lista */

function ListaMidia({
  itens,
  selecaoAtiva,
  selecionados,
  onToggle,
  onAbrir,
}: {
  itens: Midia[];
  selecaoAtiva: boolean;
  selecionados: Set<string>;
  onToggle: (id: string) => void;
  onAbrir: (m: Midia, idx: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-line bg-surface">
            {selecaoAtiva && <th className="w-8 px-3 py-2.5" />}
            <th className="w-10 px-3 py-2.5" />
            <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Nome</th>
            <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Alt</th>
            <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Dimensões</th>
            <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Tamanho</th>
            <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Formato</th>
            <th className="px-3 py-2.5 text-center font-medium text-ink-muted">Usado em</th>
            <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {itens.map((m, idx) => {
            const semAlt = m.alt === "";
            return (
              <tr
                key={m.id}
                className="cursor-pointer transition-colors hover:bg-secondary/60"
                onClick={() => selecaoAtiva ? onToggle(m.id) : onAbrir(m, idx)}
              >
                {selecaoAtiva && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selecionados.has(m.id)}
                      onChange={() => onToggle(m.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 cursor-pointer rounded accent-primary"
                    />
                  </td>
                )}
                <td className="px-3 py-2">
                  <Thumb gradiente={m.gradiente} className="h-8 w-8 shrink-0" />
                </td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    {semAlt && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" title="Sem texto alternativo" />
                    )}
                    <span className="font-medium text-ink">{m.titulo || m.arquivo}</span>
                  </span>
                  <span className="block font-mono text-[10.5px] text-ink-muted">{m.arquivo}</span>
                </td>
                <td className="px-3 py-2 max-w-[140px]">
                  {semAlt ? (
                    <span className="text-danger/80">—</span>
                  ) : (
                    <span className="truncate text-ink-muted">{m.alt}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-muted">
                  {m.largura > 0 ? `${m.largura} × ${m.altura}` : "—"}
                </td>
                <td className="px-3 py-2 text-ink-muted">{formatarBytes(m.bytes)}</td>
                <td className="px-3 py-2 text-ink-muted">{m.formato}</td>
                <td className="px-3 py-2 text-center text-ink-muted">{m.usadaEm.length}</td>
                <td className="px-3 py-2 font-mono text-ink-muted">{extrairData(m.url)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------- painel detalhe */

function PainelDetalhe({
  midia,
  indice,
  total,
  onClose,
  onPrev,
  onNext,
  onAtualizar,
}: {
  midia: Midia;
  indice: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAtualizar: (patch: Partial<Midia>) => void;
}) {
  const [altLocal, setAltLocal] = useState(midia.alt);
  const [tituloLocal, setTituloLocal] = useState(midia.titulo);
  const [legendaLocal, setLegendaLocal] = useState(midia.legenda);
  const [creditoLocal, setCreditoLocal] = useState(midia.credito);

  useEffect(() => {
    setAltLocal(midia.alt);
    setTituloLocal(midia.titulo);
    setLegendaLocal(midia.legenda);
    setCreditoLocal(midia.credito);
  }, [midia.id]);

  function salvar() {
    onAtualizar({
      alt: altLocal,
      titulo: tituloLocal,
      legenda: legendaLocal,
      credito: creditoLocal,
    });
  }

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-30 bg-ink/20"
        onClick={onClose}
      />
      {/* painel */}
      <div className="fixed inset-y-0 right-0 z-40 flex w-[380px] flex-col border-l border-line bg-surface-2 shadow-xl">
        {/* header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={indice === 0}
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-colors hover:bg-secondary disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={indice === total - 1}
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-colors hover:bg-secondary disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-muted">
            {midia.arquivo}
          </span>
          <span className="shrink-0 text-[11px] text-ink-muted">
            {indice + 1}/{total}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-colors hover:bg-secondary"
          >
            <X size={14} />
          </button>
        </div>

        {/* corpo scrollável */}
        <div className="flex-1 overflow-y-auto">
          {/* preview */}
          <Thumb gradiente={midia.gradiente} className="aspect-video w-full rounded-none" />

          {/* derivados */}
          <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
            <Info size={11} className="shrink-0 text-ink-muted" />
            <span className="text-[11px] text-ink-muted">
              Original {midia.formato} · WebP e AVIF gerados · 3 larguras
            </span>
          </div>

          {/* campos editáveis */}
          <div className="space-y-3 p-3">
            <Campo
              label="Texto alternativo"
              obrigatorio
              dica={altLocal === "" ? "Obrigatório para acessibilidade" : undefined}
            >
              <AreaTexto
                value={altLocal}
                onChange={(e) => setAltLocal(e.target.value)}
                onBlur={salvar}
                rows={3}
                invalido={altLocal === ""}
                placeholder="Descreva o conteúdo da imagem"
              />
            </Campo>

            <Campo label="Título">
              <Entrada
                value={tituloLocal}
                onChange={(e) => setTituloLocal(e.target.value)}
                onBlur={salvar}
              />
            </Campo>

            <Campo label="Legenda">
              <Entrada
                value={legendaLocal}
                onChange={(e) => setLegendaLocal(e.target.value)}
                onBlur={salvar}
              />
            </Campo>

            <Campo label="Crédito">
              <Entrada
                value={creditoLocal}
                onChange={(e) => setCreditoLocal(e.target.value)}
                onBlur={salvar}
              />
            </Campo>
          </div>

          {/* metadados */}
          <div className="border-t border-line px-3 py-3">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
              Informações
            </p>
            <dl className="space-y-1.5 text-[11.5px]">
              <div className="flex items-baseline gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Arquivo</dt>
                <dd><Mono>{midia.arquivo}</Mono></dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Dimensões</dt>
                <dd className="text-ink">{midia.largura} × {midia.altura} px</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Tamanho</dt>
                <dd className="text-ink">{formatarBytes(midia.bytes)}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Formato</dt>
                <dd className="text-ink">{midia.formato}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Pasta</dt>
                <dd className="text-ink">{midia.pasta}</dd>
              </div>
              {midia.tags.length > 0 && (
                <div className="flex items-baseline gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {midia.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-line bg-secondary px-1.5 py-[1px] text-[10px] text-ink-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Data</dt>
                <dd className="text-ink">{extrairData(midia.url)}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Enviado por</dt>
                <dd className="text-ink">—</dd>
              </div>
            </dl>
          </div>

          {/* uso */}
          <div className="border-t border-line px-3 py-3">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
              Usado em
            </p>
            {midia.usadaEm.length === 0 ? (
              <p className="text-[11.5px] text-ink-muted">Não utilizada</p>
            ) : (
              <ul className="space-y-1">
                {midia.usadaEm.map((uso) => (
                  <li key={uso} className="flex items-center gap-1.5 text-[11.5px] text-ink">
                    <ExternalLink size={10} className="shrink-0 text-ink-muted" />
                    {uso}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* espaço para o footer fixo */}
          <div className="h-16" />
        </div>

        {/* footer sticky */}
        <div className="flex shrink-0 items-center gap-2 border-t border-line bg-surface-2 px-3 py-2.5">
          <Botao variante="secundario" tamanho="sm">
            Substituir arquivo
          </Botao>
          <Botao variante="perigo" tamanho="sm" className="ml-auto">
            {midia.usadaEm.length > 0
              ? `Excluir (usado em ${midia.usadaEm.length})`
              : "Excluir"}
          </Botao>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- page */

export default function BibliotecaMidiaPage() {
  const { midia: midiaMock, atualizarMidia } = useStore();
  const [midia, setMidia] = useState<Midia[]>(midiaMock);
  const [carregando, setCarregando] = useState(true);

  // Carregar mídia real do servidor
  useEffect(() => {
    fetch("/api/midia")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.midia)) {
          setMidia(data.midia.map((m: Record<string, unknown>) => ({
            id: String(m.id ?? ""),
            arquivo: String(m.arquivo ?? ""),
            url: String(m.url ?? ""),
            alt: String(m.alt ?? ""),
            titulo: String(m.titulo ?? ""),
            legenda: String(m.legenda ?? ""),
            credito: String(m.credito ?? ""),
            largura: Number(m.largura ?? 0),
            altura: Number(m.altura ?? 0),
            bytes: Number(m.bytes ?? 0),
            formato: String(m.formato ?? ""),
            pasta: String(m.pasta ?? "/"),
            tags: Array.isArray(m.tags) ? m.tags : [],
            usadaEm: Array.isArray(m.usadaEm) ? m.usadaEm : [],
            gradiente: String(m.gradiente ?? "from-slate-200 to-slate-300"),
          })));
        }
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  const [visualizacao, setVisualizacao] = useState<"grade" | "lista">("grade");
  const [filtroTipo, setFiltroTipo] = useState<"" | "imagens" | "documentos">("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroPasta, setFiltroPasta] = useState("");
  const [filtroSemAlt, setFiltroSemAlt] = useState(false);
  const [filtroNaoUtilizadas, setFiltroNaoUtilizadas] = useState(false);
  const [busca, setBusca] = useState("");
  const [selecaoAtiva, setSelecaoAtiva] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [midiaAberta, setMidiaAberta] = useState<Midia | null>(null);
  const [indiceAberto, setIndiceAberto] = useState(0);

  const pastas = useMemo(
    () => [...new Set(midia.map((m) => m.pasta))].sort(),
    [midia],
  );

  const anos = useMemo(() => {
    const set = new Set<string>();
    for (const m of midia) {
      const match = m.url.match(/\/(\d{4})\//);
      if (match) set.add(match[1]);
    }
    return [...set].sort().reverse();
  }, [midia]);

  const visiveis = useMemo(() => {
    return midia.filter((m) => {
      const ehImagem = FORMATOS_IMAGEM.includes(m.formato);
      if (filtroTipo === "imagens" && !ehImagem) return false;
      if (filtroTipo === "documentos" && ehImagem) return false;
      if (filtroSemAlt && m.alt !== "") return false;
      if (filtroNaoUtilizadas && m.usadaEm.length > 0) return false;
      if (filtroPasta && m.pasta !== filtroPasta) return false;
      if (filtroData && !m.url.includes(filtroData)) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          m.arquivo.toLowerCase().includes(q) ||
          m.titulo.toLowerCase().includes(q) ||
          m.alt.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [midia, filtroTipo, filtroSemAlt, filtroNaoUtilizadas, filtroPasta, filtroData, busca]);

  const semFiltrosAtivos =
    !filtroTipo && !filtroData && !filtroPasta && !filtroSemAlt && !filtroNaoUtilizadas && !busca;

  function abrirItem(m: Midia, idx: number) {
    setMidiaAberta(m);
    setIndiceAberto(idx);
  }

  function fecharPainel() {
    setMidiaAberta(null);
  }

  function irParaPrev() {
    if (indiceAberto > 0) {
      const novo = indiceAberto - 1;
      setIndiceAberto(novo);
      setMidiaAberta(visiveis[novo]);
    }
  }

  function irParaNext() {
    if (indiceAberto < visiveis.length - 1) {
      const novo = indiceAberto + 1;
      setIndiceAberto(novo);
      setMidiaAberta(visiveis[novo]);
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

  async function handleDrop(e: React.DragEvent) {
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append("arquivo", file);
      try {
        const res = await fetch("/api/midia", { method: "POST", body: formData });
        const data = await res.json();
        if (data.ok) {
          // Recarregar lista após upload
          const listagem = await fetch("/api/midia").then(r => r.json());
          if (listagem.ok) setMidia(listagem.midia);
        }
      } catch (err) {
        console.error("Erro no upload:", err);
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* cabeçalho */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
            Biblioteca de mídia
          </h1>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">{midia.length} arquivos</p>
        </div>
        <Link href="/midia/adicionar">
          <Botao variante="primario" tamanho="sm">
            Adicionar arquivo
          </Botao>
        </Link>
      </div>

      {/* barra de controles */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
        {/* toggle visualização */}
        <div className="flex rounded-[var(--radius)] border border-line bg-surface-2">
          <button
            type="button"
            onClick={() => setVisualizacao("grade")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-l-[var(--radius)] transition-colors",
              visualizacao === "grade"
                ? "bg-primary text-primary-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Grid2x2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => setVisualizacao("lista")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-r-[var(--radius)] transition-colors",
              visualizacao === "lista"
                ? "bg-primary text-primary-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <List size={13} />
          </button>
        </div>

        {/* filtro tipo */}
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as "" | "imagens" | "documentos")}
          className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink outline-none focus:border-primary"
        >
          <option value="">Tipo: todos</option>
          <option value="imagens">Imagens</option>
          <option value="documentos">Documentos</option>
        </select>

        {/* filtro pasta */}
        <select
          value={filtroPasta}
          onChange={(e) => setFiltroPasta(e.target.value)}
          className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink outline-none focus:border-primary"
        >
          <option value="">Pasta: todas</option>
          {pastas.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* filtro data */}
        <select
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink outline-none focus:border-primary"
        >
          <option value="">Data: todas</option>
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* sem alt */}
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-muted hover:text-ink">
          <input
            type="checkbox"
            checked={filtroSemAlt}
            onChange={(e) => setFiltroSemAlt(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-accent"
          />
          Sem texto alternativo
        </label>

        {/* não utilizadas */}
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-muted hover:text-ink">
          <input
            type="checkbox"
            checked={filtroNaoUtilizadas}
            onChange={(e) => setFiltroNaoUtilizadas(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-accent"
          />
          Não utilizadas
        </label>

        {/* selecionar */}
        <button
          type="button"
          onClick={() => { setSelecaoAtiva((a) => !a); setSelecionados(new Set()); }}
          className={cn(
            "h-7 rounded-[var(--radius)] border px-2.5 text-[12px] font-medium transition-colors",
            selecaoAtiva
              ? "border-primary bg-primary/10 text-primary"
              : "border-line bg-surface-2 text-ink-muted hover:text-ink",
          )}
        >
          Selecionar
        </button>

        {/* busca */}
        <div className="relative ml-auto">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar…"
            className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 pl-7 pr-3 text-[12px] text-ink placeholder:text-ink-muted/70 outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* barra de seleção em massa */}
      {selecaoAtiva && (
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-primary/5 px-6 py-2">
          <span className="text-[12px] text-ink-muted">
            {selecionados.size} selecionado{selecionados.size !== 1 ? "s" : ""}
          </span>
          <Botao tamanho="sm" variante="secundario">Mover para pasta</Botao>
          <Botao tamanho="sm" variante="secundario">Adicionar tag</Botao>
          {selecionados.size > 0 && (
            <Botao tamanho="sm" variante="perigo">Excluir selecionados</Botao>
          )}
          <button
            type="button"
            onClick={() => { setSelecaoAtiva(false); setSelecionados(new Set()); }}
            className="ml-auto text-[12px] text-ink-muted hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* conteúdo */}
      <div className="flex-1 overflow-auto">
        {visiveis.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-[12px] text-ink-muted">
            Nenhum arquivo encontrado
          </div>
        ) : visualizacao === "grade" ? (
          <GradeMidia
            itens={visiveis}
            selecaoAtiva={selecaoAtiva}
            selecionados={selecionados}
            onToggle={toggleSelecionado}
            onAbrir={abrirItem}
            onDrop={handleDrop}
            mostrarDropZone={semFiltrosAtivos}
          />
        ) : (
          <ListaMidia
            itens={visiveis}
            selecaoAtiva={selecaoAtiva}
            selecionados={selecionados}
            onToggle={toggleSelecionado}
            onAbrir={abrirItem}
          />
        )}
      </div>

      {/* painel de detalhe */}
      {midiaAberta && (
        <PainelDetalhe
          midia={midiaAberta}
          indice={indiceAberto}
          total={visiveis.length}
          onClose={fecharPainel}
          onPrev={irParaPrev}
          onNext={irParaNext}
          onAtualizar={(patch) => {
            atualizarMidia(midiaAberta.id, patch);
            setMidia((lista) => lista.map((m) => (m.id === midiaAberta.id ? { ...m, ...patch } : m)));
            setMidiaAberta((prev) => (prev ? { ...prev, ...patch } : null));
            // Persistir metadados via API
            fetch(`/api/midia/${encodeURIComponent(midiaAberta.id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch),
            }).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
