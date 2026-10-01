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
import { useSession } from "next-auth/react";
import { enviarMidia, substituirMidia } from "@/lib/midia-cliente";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Midia } from "@/mock/types";

/* ---------------------------------------------------------------- helpers */

function formatarBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarData(iso?: string, comHora = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", comHora
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" });
}

function anoDe(iso?: string): string {
  return iso && !Number.isNaN(new Date(iso).getTime()) ? String(new Date(iso).getFullYear()) : "";
}

const FORMATOS_IMAGEM = ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"];

function formatoEhImagem(formato: string): boolean {
  return FORMATOS_IMAGEM.includes(formato.toLowerCase());
}

/* ---------------------------------------------------------------- grade */

function GradeMidia({
  itens,
  selecaoAtiva,
  selecionados,
  onToggle,
  onAbrir,
  onDrop,
  mostrarDropZone,
  versoes,
}: {
  itens: Midia[];
  selecaoAtiva: boolean;
  selecionados: Set<string>;
  onToggle: (id: string) => void;
  onAbrir: (m: Midia, idx: number) => void;
  onDrop: (e: React.DragEvent) => void;
  mostrarDropZone: boolean;
  versoes: Record<string, number>;
}) {
  const [arrastando, setArrastando] = useState(false);

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {itens.map((m, idx) => {
          const ehImagem = formatoEhImagem(m.formato);
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
                  <Thumb gradiente={m.gradiente} url={m.url} alt={m.alt} miniatura={320} versao={versoes[m.id]} className="aspect-square w-full" />
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
  versoes,
}: {
  itens: Midia[];
  selecaoAtiva: boolean;
  selecionados: Set<string>;
  onToggle: (id: string) => void;
  onAbrir: (m: Midia, idx: number) => void;
  versoes: Record<string, number>;
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
            <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Enviado por</th>
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
                  <Thumb
                    gradiente={m.gradiente}
                    url={formatoEhImagem(m.formato) ? m.url : undefined}
                    alt={m.alt}
                    miniatura={96}
                    versao={versoes[m.id]}
                    className="h-8 w-8 shrink-0"
                  />
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
                <td className="px-3 py-2 font-mono text-ink-muted">{formatarData(m.criadoEm)}</td>
                <td className="px-3 py-2 text-ink-muted">{m.enviadoPor?.nome ?? "—"}</td>
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
  onSalvar,
  onExcluir,
  onSubstituir,
  substituindo,
  podeSubstituir,
  versoes,
}: {
  midia: Midia;
  indice: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  /** Grava no servidor; só resolve ok depois da resposta do PATCH. */
  onSalvar: (patch: Partial<Midia>) => Promise<{ ok: boolean; erro?: string }>;
  onExcluir: () => void;
  onSubstituir: (file: File) => void;
  substituindo: boolean;
  podeSubstituir: boolean;
  versoes: Record<string, number>;
}) {
  const inputSubstituir = useRef<HTMLInputElement>(null);
  const [altLocal, setAltLocal] = useState(midia.alt);
  const [tituloLocal, setTituloLocal] = useState(midia.titulo);
  const [legendaLocal, setLegendaLocal] = useState(midia.legenda);
  const [creditoLocal, setCreditoLocal] = useState(midia.credito);

  const [estado, setEstado] = useState<"parado" | "salvando" | "salvo" | "erro">("parado");
  const [erroSalvar, setErroSalvar] = useState("");
  // Último valor CONFIRMADO pelo servidor (base para saber o que mudou) e fila de salvamentos.
  const salvoRef = useRef({ alt: midia.alt, titulo: midia.titulo, legenda: midia.legenda, credito: midia.credito });
  const filaRef = useRef<Promise<void>>(Promise.resolve());
  const idRef = useRef(midia.id);
  const valoresRef = useRef({ alt: altLocal, titulo: tituloLocal, legenda: legendaLocal, credito: creditoLocal });
  valoresRef.current = { alt: altLocal, titulo: tituloLocal, legenda: legendaLocal, credito: creditoLocal };

  useEffect(() => {
    idRef.current = midia.id;
    salvoRef.current = { alt: midia.alt, titulo: midia.titulo, legenda: midia.legenda, credito: midia.credito };
    setAltLocal(midia.alt);
    setTituloLocal(midia.titulo);
    setLegendaLocal(midia.legenda);
    setCreditoLocal(midia.credito);
    setEstado("parado");
    setErroSalvar("");
  }, [midia.id]);

  useEffect(() => {
    if (estado !== "salvo") return;
    const t = setTimeout(() => setEstado((e) => (e === "salvo" ? "parado" : e)), 2500);
    return () => clearTimeout(t);
  }, [estado]);

  function salvar() {
    const idDaChamada = midia.id;
    // Em fila: salvamentos seguidos rodam em ordem; cada um compara com o último confirmado.
    filaRef.current = filaRef.current.then(async () => {
      if (idRef.current !== idDaChamada) return;
      const agora = valoresRef.current;
      const patch: Partial<Midia> = {};
      for (const c of ["alt", "titulo", "legenda", "credito"] as const) {
        if (agora[c].trim() !== salvoRef.current[c]) patch[c] = agora[c].trim();
      }
      if (Object.keys(patch).length === 0) return;
      setEstado("salvando");
      setErroSalvar("");
      const r = await onSalvar(patch);
      if (idRef.current !== idDaChamada) return;
      if (r.ok) {
        salvoRef.current = { ...salvoRef.current, ...(patch as typeof salvoRef.current) };
        setEstado("salvo");
      } else {
        setEstado("erro");
        setErroSalvar(r.erro ?? "Não foi possível salvar.");
      }
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
          <Thumb
            gradiente={midia.gradiente}
            url={formatoEhImagem(midia.formato) ? midia.url : undefined}
            alt={midia.alt}
            versao={versoes[midia.id]}
            className="aspect-video w-full rounded-none"
          />

          {/* formato */}
          <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
            <Info size={11} className="shrink-0 text-ink-muted" />
            <span className="text-[11px] text-ink-muted">Original {midia.formato}</span>
          </div>

          {/* campos editáveis */}
          <div className="space-y-3 p-3">
            <Campo
              label="Texto alternativo"
              obrigatorio
              dica={
                altLocal === ""
                  ? midia.usadaEm.length > 0 && formatoEhImagem(midia.formato)
                    ? "Sem texto alternativo — esta imagem está em uso no site"
                    : "Obrigatório para acessibilidade"
                  : undefined
              }
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
            <p
              role={estado === "erro" ? "alert" : "status"}
              className={cn(
                "min-h-[16px] text-[11px]",
                estado === "erro" ? "text-danger" : "text-ink-muted",
              )}
            >
              {estado === "salvando" && "Salvando…"}
              {estado === "salvo" && "Salvo"}
              {estado === "erro" && (
                <>
                  Não salvo: {erroSalvar}{" "}
                  <button type="button" onClick={salvar} className="underline">Tentar de novo</button>
                </>
              )}
            </p>
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
                <dd className="text-ink">{formatarData(midia.criadoEm, true)}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Enviado por</dt>
                <dd className="text-ink">{midia.enviadoPor?.nome ?? "—"}</dd>
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
          {podeSubstituir && (
            <>
              <input
                ref={inputSubstituir}
                type="file"
                accept={`.${midia.formato}`}
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onSubstituir(f); }}
              />
              <Botao
                variante="secundario"
                tamanho="sm"
                disabled={substituindo}
                onClick={() => inputSubstituir.current?.click()}
              >
                {substituindo ? "Substituindo…" : "Substituir arquivo"}
              </Botao>
            </>
          )}
          <Botao variante="perigo" tamanho="sm" className="ml-auto" onClick={onExcluir}>
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
  // A biblioteca já é lida pelo store no início da sessão (/api/midia, uma vez).
  // Antes esta tela fazia SEU PRÓPRIO fetch("/api/midia") de novo a cada vez que
  // era aberta — chamada redundante em toda navegação para cá. Agora só usa o
  // que o store já tem; `recarregarMidia()` é chamado depois de ações que
  // realmente mudam a lista (enviar, substituir, excluir).
  const { midia: midiaMock, midiaCarregados, atualizarMidia, recarregarMidia } = useStore();
  const { data: sessao } = useSession();
  const papelAtual = (sessao?.user as { papel?: string } | undefined)?.papel;
  const podeEnviar = papelAtual === "administrador" || papelAtual === "editor";
  const [midia, setMidia] = useState<Midia[]>(midiaMock);
  const [ordem, setOrdem] = useState<"recentes" | "antigas">("recentes");

  // Espelha a lista do store: cobre tanto a 1ª leitura da sessão (se esta tela
  // já estiver aberta quando ela chega) quanto qualquer recarregarMidia() feito
  // por outra tela (ex.: SeletorMidia ao enviar um arquivo num post).
  useEffect(() => {
    setMidia(midiaMock);
  }, [midiaMock]);

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
      const ano = anoDe(m.criadoEm);
      if (ano) set.add(ano);
    }
    return [...set].sort().reverse();
  }, [midia]);

  const visiveis = useMemo(() => {
    const ordenada = [...midia].sort((a, b) => {
      const c = (b.criadoEm ?? "").localeCompare(a.criadoEm ?? "");
      return ordem === "recentes" ? c : -c;
    });
    return ordenada.filter((m) => {
      const ehImagem = formatoEhImagem(m.formato);
      if (filtroTipo === "imagens" && !ehImagem) return false;
      if (filtroTipo === "documentos" && ehImagem) return false;
      if (filtroSemAlt && m.alt !== "") return false;
      if (filtroNaoUtilizadas && m.usadaEm.length > 0) return false;
      if (filtroPasta && m.pasta !== filtroPasta) return false;
      if (filtroData && anoDe(m.criadoEm) !== filtroData) return false;
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
  }, [midia, ordem, filtroTipo, filtroSemAlt, filtroNaoUtilizadas, filtroPasta, filtroData, busca]);

  const semFiltrosAtivos =
    !filtroTipo && !filtroData && !filtroPasta && !filtroSemAlt && !filtroNaoUtilizadas && !busca;

  function abrirItem(m: Midia, idx: number) {
    setMidiaAberta(m);
    setIndiceAberto(idx);
  }

  /** Exclui do servidor (arquivo + metadados) e só então tira da tela. */
  async function excluirMidias(ids: string[]) {
    if (!podeEnviar || ids.length === 0) return;
    const usadas = midia.filter((m) => ids.includes(m.id) && m.usadaEm.length > 0).length;
    const texto =
      ids.length === 1
        ? "Excluir este arquivo da biblioteca? Não dá para desfazer."
        : `Excluir ${ids.length} arquivos da biblioteca? Não dá para desfazer.`;
    if (!confirm(usadas ? `${texto}

${usadas} deles está em uso em páginas do site.` : texto)) return;
    const falhas: string[] = [];
    const removidos: string[] = [];
    for (const id of ids) {
      try {
        const r = await fetch(`/api/midia/${encodeURIComponent(id)}`, { method: "DELETE" });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) removidos.push(id);
        else falhas.push(d.erro ?? `erro ${r.status}`);
      } catch {
        falhas.push("sem resposta do servidor");
      }
    }
    setMidia((lista) => lista.filter((m) => !removidos.includes(m.id)));
    setSelecionados(new Set());
    if (midiaAberta && removidos.includes(midiaAberta.id)) fecharPainel();
    await recarregarMidia();
    if (falhas.length) alert(`Não foi possível excluir ${falhas.length} arquivo(s): ${falhas[0]}`);
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

  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const [avisoEnvio, setAvisoEnvio] = useState<string | null>(null);
  const [versoes, setVersoes] = useState<Record<string, number>>({});
  const [substituindo, setSubstituindo] = useState(false);
  const [arrastandoTela, setArrastandoTela] = useState(false);
  const inputArquivos = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    return enviarArquivos(Array.from(e.dataTransfer.files));
  }

  /** Troca o conteúdo mantendo o endereço: todo lugar que usa esta mídia passa a mostrar o novo. */
  async function substituirArquivo(file: File) {
    if (!midiaAberta || substituindo) return;
    const usadas = midiaAberta.usadaEm.length;
    if (!confirm(
      `Substituir "${midiaAberta.arquivo}" por "${file.name}"?` +
      `

O endereço continua o mesmo e todos os lugares que usam esta mídia${usadas ? ` (${usadas} em uso)` : ""} passam a mostrar o arquivo novo. Não dá para desfazer.`,
    )) return;
    setSubstituindo(true);
    setErroEnvio(null);
    setAvisoEnvio(null);
    const r = await substituirMidia(midiaAberta.id, file);
    if (r.ok) {
      setVersoes((v) => ({ ...v, [midiaAberta.id]: Date.now() }));
      const listagem = await recarregarMidia();
      if (listagem) setMidia(listagem);
      setAvisoEnvio(`"${midiaAberta.arquivo}" foi substituído. Para o site público mostrar o novo, use "Atualizar o site" e aguarde o navegador renovar o cache.`);
    } else {
      setErroEnvio(r.erro ?? "Não foi possível substituir.");
    }
    setSubstituindo(false);
  }

  async function enviarArquivos(files: File[]) {
    if (!files.length) return;
    if (!podeEnviar) {
      setErroEnvio("Seu papel não tem permissão para enviar arquivos à biblioteca.");
      return;
    }
    setErroEnvio(null);
    setAvisoEnvio(null);
    const falhas: string[] = [];
    const repetidos: string[] = [];
    for (const file of files) {
      const r = await enviarMidia(file, "geral");
      if (!r.ok) falhas.push(r.erro ?? "Falha no envio.");
      else if (r.duplicado) repetidos.push(file.name);
    }
    if (repetidos.length) setAvisoEnvio(`Já estava na biblioteca, não criei cópia: ${repetidos.join(", ")}.`);
    const listagem = await recarregarMidia();
    if (listagem) setMidia(listagem);
    if (falhas.length) setErroEnvio(falhas.join(" "));
  }

  return (
    <div className="flex h-full flex-col">
      {/* cabeçalho */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
            Biblioteca de mídia
          </h1>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">{midia.length} arquivo{midia.length !== 1 ? "s" : ""}</p>
        </div>
        {podeEnviar && (
          <>
            <input
              ref={inputArquivos}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => { void enviarArquivos(Array.from(e.target.files ?? [])); e.target.value = ""; }}
            />
            <Botao variante="primario" tamanho="sm" onClick={() => inputArquivos.current?.click()}>
              Adicionar arquivo
            </Botao>
          </>
        )}
      </div>
      {avisoEnvio && (
        <p role="status" className="shrink-0 border-b border-line bg-surface-2 px-6 py-2 text-[12px] text-ink-muted">
          {avisoEnvio}
        </p>
      )}
      {erroEnvio && (
        <p role="alert" className="shrink-0 border-b border-danger/40 bg-danger/10 px-6 py-2 text-[12px] text-danger">
          {erroEnvio}
        </p>
      )}

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

        {/* ordem por data */}
        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as "recentes" | "antigas")}
          className="h-7 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink outline-none focus:border-primary"
        >
          <option value="recentes">Mais recentes primeiro</option>
          <option value="antigas">Mais antigas primeiro</option>
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
          {selecionados.size > 0 && (
            <Botao tamanho="sm" variante="perigo" onClick={() => excluirMidias([...selecionados])}>Excluir selecionados</Botao>
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

      {/* conteúdo — a área inteira recebe arquivos arrastados (grade, lista ou biblioteca vazia) */}
      <div
        className="relative flex-1 overflow-auto"
        onDragOver={(e) => { if (podeEnviar && e.dataTransfer.types.includes("Files")) { e.preventDefault(); setArrastandoTela(true); } }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setArrastandoTela(false); }}
        onDrop={(e) => { if (podeEnviar && e.dataTransfer.files.length) { e.preventDefault(); setArrastandoTela(false); void handleDrop(e); } }}
      >
        {arrastandoTela && (
          <div className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-primary bg-primary/10 text-[13px] font-medium text-primary">
            Solte para enviar à biblioteca
          </div>
        )}
        {visiveis.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-[12px] text-ink-muted">
            <Upload size={22} />
            <p>
              {!midiaCarregados
                ? "Carregando…"
                : midia.length === 0
                  ? "A biblioteca está vazia."
                  : "Nenhum arquivo encontrado com estes filtros."}
            </p>
            {podeEnviar && midiaCarregados && midia.length === 0 && (
              <p>Arraste arquivos para esta área ou use “Adicionar arquivo”.</p>
            )}
          </div>
        ) : visualizacao === "grade" ? (
          <GradeMidia
            itens={visiveis}
            versoes={versoes}
            selecaoAtiva={selecaoAtiva}
            selecionados={selecionados}
            onToggle={toggleSelecionado}
            onAbrir={abrirItem}
            onDrop={handleDrop}
            mostrarDropZone={semFiltrosAtivos && podeEnviar}
          />
        ) : (
          <ListaMidia
            itens={visiveis}
            versoes={versoes}
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
          onExcluir={() => excluirMidias([midiaAberta.id])}
          onSubstituir={(f) => void substituirArquivo(f)}
          substituindo={substituindo}
          podeSubstituir={podeEnviar}
          versoes={versoes}
          onPrev={irParaPrev}
          onNext={irParaNext}
          onSalvar={async (patch) => {
            const id = midiaAberta.id;
            try {
              const r = await fetch(`/api/midia/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
              });
              const d = await r.json().catch(() => ({}));
              if (!r.ok || !d.ok) {
                if (r.status === 401) return { ok: false, erro: "sua sessão expirou. Entre de novo." };
                if (r.status === 403) return { ok: false, erro: "seu papel não pode editar a biblioteca." };
                return { ok: false, erro: d.erro ?? `erro ${r.status}` };
              }
              // Só agora, com o servidor confirmando, a tela passa a mostrar o valor novo.
              atualizarMidia(id, patch);
              setMidia((lista) => lista.map((m) => (m.id === id ? { ...m, ...patch } : m)));
              setMidiaAberta((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
              return { ok: true };
            } catch {
              return { ok: false, erro: "sem resposta do servidor." };
            }
          }}
        />
      )}
    </div>
  );
}
