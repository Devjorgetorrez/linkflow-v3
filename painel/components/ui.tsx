"use client";

import { ChevronDown, Info, Loader2 } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { urlMiniaturaMidia, urlPreviaMidia } from "@/lib/site-config-cliente";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Botão */

type Variante = "primario" | "secundario" | "fantasma" | "perigo";

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-primary text-primary-ink border border-primary hover:opacity-90",
  secundario:
    "bg-secondary text-ink border border-line hover:border-ink-muted",
  fantasma: "bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-secondary",
  perigo: "bg-transparent text-danger border border-transparent hover:bg-danger/10",
};

export function Botao({
  variante = "secundario",
  tamanho = "md",
  className,
  children,
  ...props
}: {
  variante?: Variante;
  tamanho?: "sm" | "md";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        tamanho === "sm" ? "h-7 px-2.5 text-[11.5px]" : "h-8 px-3 text-[12.5px]",
        VARIANTES[variante],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- Badge */

export type TomBadge = "neutro" | "sucesso" | "aviso" | "perigo" | "primario";

const TONS: Record<TomBadge, string> = {
  neutro: "text-ink-muted border-line bg-secondary",
  sucesso: "text-success border-success/35 bg-success/10",
  aviso: "text-accent border-accent/35 bg-accent/10",
  perigo: "text-danger border-danger/35 bg-danger/10",
  primario: "text-primary border-primary/35 bg-primary/10",
};

export function Badge({
  tom = "neutro",
  children,
  className,
  mono,
}: {
  tom?: TomBadge;
  children: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-[1px] text-[10.5px] leading-[16px] font-medium",
        mono && "font-mono",
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

const TOM_STATUS: Record<string, TomBadge> = {
  publicado: "sucesso",
  rascunho: "neutro",
  revisao: "aviso",
  agendado: "primario",
};

const ROTULO_STATUS: Record<string, string> = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  revisao: "Revisão",
  agendado: "Agendado",
};

export function BadgeStatus({ status }: { status: string }) {
  return <Badge tom={TOM_STATUS[status] ?? "neutro"}>{ROTULO_STATUS[status] ?? status}</Badge>;
}

/* ---------------------------------------------------------------- Campos */

export function Rotulo({ children, obrigatorio }: { children: ReactNode; obrigatorio?: boolean }) {
  return (
    <label className="mb-1 block text-[11px] font-medium text-ink-muted">
      {children}
      {obrigatorio && <span className="ml-0.5 text-danger">*</span>}
    </label>
  );
}

const BASE_CAMPO =
  "w-full rounded-[var(--radius)] border border-line bg-surface-2 px-2 py-1.5 text-[12.5px] text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60";

export function Entrada({
  className,
  invalido,
  aviso,
  ...props
}: { invalido?: boolean; aviso?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        BASE_CAMPO,
        invalido && "border-danger focus:border-danger",
        aviso && "border-accent focus:border-accent",
        className,
      )}
    />
  );
}

export function AreaTexto({
  className,
  invalido,
  aviso,
  ...props
}: { invalido?: boolean; aviso?: boolean } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        BASE_CAMPO,
        "resize-y leading-relaxed",
        invalido && "border-danger",
        aviso && "border-accent",
        className,
      )}
    />
  );
}

export function Selecao({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(BASE_CAMPO, "cursor-pointer", className)}>
      {children}
    </select>
  );
}

export function Campo({
  label,
  obrigatorio,
  dica,
  children,
  className,
}: {
  label: string;
  obrigatorio?: boolean;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Rotulo obrigatorio={obrigatorio}>{label}</Rotulo>
      {children}
      {dica && <p className="mt-1 text-[10.5px] text-ink-muted">{dica}</p>}
    </div>
  );
}

export function Contador({ atual, max, min }: { atual: number; max: number; min?: number }) {
  const foraDaFaixa = atual > max || (min !== undefined && atual > 0 && atual < min);
  return (
    <span className={cn("font-mono text-[10.5px]", foraDaFaixa ? "text-accent" : "text-ink-muted")}>
      {atual}/{max}
    </span>
  );
}

/* ---------------------------------------------------------------- Toggle */

export function Alternador({
  ativo,
  onChange,
  label,
  descricao,
}: {
  ativo: boolean;
  onChange: (v: boolean) => void;
  label: string;
  descricao?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[12px] text-ink">
          {label}
        </label>
        {descricao && <p className="text-[10.5px] text-ink-muted">{descricao}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onChange(!ativo)}
        className={cn(
          "relative h-[18px] w-8 shrink-0 rounded-full border transition-colors",
          ativo ? "border-primary bg-primary" : "border-line bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] h-[12px] w-[12px] rounded-full transition-all",
            ativo ? "left-[17px] bg-primary-ink" : "left-[2px] bg-ink-muted",
          )}
        />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- Cards */

export function Painel({
  children,
  className,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-line bg-surface-2 shadow-[var(--shadow-card)]",
        padding && "p-3",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CabecalhoPainel({
  titulo,
  acao,
  descricao,
  icone,
}: {
  titulo: ReactNode;
  acao?: ReactNode;
  descricao?: string;
  icone?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-start justify-between gap-3">
      <div className="flex items-center gap-1.5">
        {icone && <span className="text-ink-muted">{icone}</span>}
        <div>
          <h2 className="text-[12.5px] font-semibold tracking-tight text-ink">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-[11px] text-ink-muted">{descricao}</p>}
        </div>
      </div>
      {acao}
    </div>
  );
}

export function PainelRecolhivel({
  id,
  titulo,
  children,
  inicialAberto = true,
  acessorio,
  abrirTrigger,
}: {
  id?: string;
  titulo: ReactNode;
  children: ReactNode;
  inicialAberto?: boolean;
  acessorio?: ReactNode;
  abrirTrigger?: number;
}) {
  const [aberto, setAberto] = useState(inicialAberto);

  useEffect(() => {
    if (abrirTrigger) setAberto(true);
  }, [abrirTrigger]);

  return (
    <section id={id} className="rounded-[var(--radius)] border border-line bg-surface-2 shadow-[var(--shadow-card)]">
      <header className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="flex flex-1 items-center gap-1.5 text-left text-[12px] font-semibold tracking-tight text-ink"
        >
          <ChevronDown
            size={13}
            className={cn("shrink-0 text-ink-muted transition-transform", !aberto && "-rotate-90")}
          />
          {titulo}
        </button>
        {acessorio}
      </header>
      {aberto && <div className="border-t border-line px-3 py-3">{children}</div>}
    </section>
  );
}

/* ---------------------------------------------------------------- Estados */

export function Carregando({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-1.5 p-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="sf-skeleton h-3 flex-1" style={{ opacity: 1 - i * 0.09 }} />
          <div className="sf-skeleton h-3 w-20" />
          <div className="sf-skeleton h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CarregandoGrade({ itens = 8 }: { itens?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: itens }).map((_, i) => (
        <div key={i} className="sf-skeleton aspect-[4/3]" />
      ))}
    </div>
  );
}

export function Vazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
      <div className="mb-1 text-ink-muted">{icone ?? <Info size={18} />}</div>
      <p className="text-[12.5px] font-medium text-ink">{titulo}</p>
      {descricao && <p className="max-w-sm text-[11.5px] text-ink-muted">{descricao}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}

export function Girando({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Loader2 size={12} className="sf-spin" />
      {label}
    </span>
  );
}

/* ---------------------------------------------------------------- Diversos */

export function Dica({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute top-full left-1/2 z-30 mt-1.5 hidden -translate-x-1/2 rounded-[var(--radius)] border border-line bg-surface-2 px-2 py-1 text-[10.5px] whitespace-nowrap text-ink shadow-lg group-hover:block">
        {texto}
      </span>
    </span>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[11px] text-ink-muted", className)}>{children}</span>;
}

export function Thumb({
  gradiente,
  className,
  children,
  url,
  alt = "",
  miniatura,
  versao,
}: {
  gradiente: string;
  className?: string;
  children?: ReactNode;
  /** Imagem real; se ausente ou se falhar ao carregar, fica o gradiente. */
  url?: string;
  alt?: string;
  /** Largura (px) da miniatura leve a carregar em vez do original (grades e listas). */
  miniatura?: number;
  /** Muda quando o arquivo foi substituído (mesmo endereço): força recarregar a imagem. */
  versao?: number;
}) {
  const [falhou, setFalhou] = useState(false);
  useEffect(() => setFalhou(false), [url, versao]);
  return (
    <div
      className={cn("relative overflow-hidden rounded-[var(--radius)] border border-line", className)}
      style={{ backgroundImage: `linear-gradient(${gradiente})` }}
    >
      {url && !falhou && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={(miniatura ? urlMiniaturaMidia(url, miniatura) : urlPreviaMidia(url)) + (versao ? `${(miniatura ? urlMiniaturaMidia(url, miniatura) : urlPreviaMidia(url)).includes("?") ? "&" : "?"}v=${versao}` : "")}
          alt={alt}
          loading="lazy"
          onError={() => setFalhou(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {children}
    </div>
  );
}

export function Metrica({
  label,
  valor,
  detalhe,
  tom = "neutro",
  icone,
}: {
  label: string;
  valor: ReactNode;
  detalhe?: string;
  tom?: TomBadge;
  icone?: ReactNode;
}) {
  const cor =
    tom === "sucesso"
      ? "text-success"
      : tom === "aviso"
        ? "text-accent"
        : tom === "primario"
          ? "text-primary"
          : "text-ink";
  const fundoIcone =
    tom === "sucesso"
      ? "bg-success/10 text-success"
      : tom === "aviso"
        ? "bg-accent/10 text-accent"
        : "bg-primary/10 text-primary";
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius)] border border-line bg-surface-2 px-3.5 py-3 shadow-[var(--shadow-card)]">
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-medium text-ink-muted">{label}</p>
        <p className={cn("mt-1.5 font-display text-[24px] leading-none font-semibold", cor)}>
          {valor}
        </p>
        {detalhe && <p className="mt-1.5 text-[10.5px] text-ink-muted">{detalhe}</p>}
      </div>
      {icone && (
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)]",
            fundoIcone,
          )}
        >
          {icone}
        </span>
      )}
    </div>
  );
}

export function BlocoTravado({
  children,
  nota = "Definido pelo LinkFlow",
}: {
  children: ReactNode;
  nota?: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-line bg-surface px-3 py-2.5">
      {children}
      <p className="mt-2 text-[10.5px] text-ink-muted">{nota}</p>
    </div>
  );
}
