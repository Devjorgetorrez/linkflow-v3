"use client";

/**
 * Descrição do site + mídia (logos, favicon, imagem de compartilhamento).
 *
 * Compartilhado por Configurações › Identidade e Aparência › Personalizar: as
 * duas telas gravam os MESMOS campos do config/site.ts pela mesma API. O estado
 * mora no hook `useIdentidadeVisual`, que cada tela chama; o Salvar é da tela
 * (Identidade junta estes campos aos seus num único PATCH; Personalizar salva
 * só estes com `BotaoSalvarVisual`).
 */

import { useCallback, useState } from "react";

import { SeletorMidia } from "@/components/SeletorMidia";
import { AreaTexto, Botao, Campo, Contador, Entrada, Rotulo } from "@/components/ui";
import { useStore } from "@/lib/store";
import { caminhoDaMidia, enviarConfig, montarPatchPlano, validarBody } from "@/lib/site-config-cliente";
import { cn } from "@/lib/utils";

export const CAMPOS_VISUAL = ["descricao", "logo.src", "logo.srcEscuro", "logo.alt", "favicon", "ogImagem"] as const;
export type CampoVisual = (typeof CAMPOS_VISUAL)[number];
export type ValoresVisual = Record<CampoVisual, string>;

const VAZIO: ValoresVisual = {
  descricao: "", "logo.src": "", "logo.srcEscuro": "", "logo.alt": "", favicon: "", ogImagem: "",
};

/** Lê os campos visuais da resposta de GET /api/config. */
function lerVisual(c: Record<string, unknown>): ValoresVisual {
  const logo = (c.logo ?? {}) as Record<string, unknown>;
  return {
    descricao: String(c.descricao ?? ""),
    "logo.src": String(logo.src ?? ""),
    "logo.srcEscuro": String(logo.srcEscuro ?? ""),
    "logo.alt": String(logo.alt ?? ""),
    favicon: String(c.favicon ?? ""),
    ogImagem: String(c.ogImagem ?? ""),
  };
}

export interface VisualEstado {
  valores: ValoresVisual;
  /** Valores como o servidor devolveu: o PATCH leva só o que difere deles. */
  original: ValoresVisual;
  carregado: boolean;
  erros: Record<string, string>;
  setErros: (e: Record<string, string>) => void;
  set: (k: CampoVisual, v: string) => void;
  /** Preenche a partir de GET /api/config (`data.config`). */
  hidratar: (config: Record<string, unknown>) => void;
  /** Depois de um PATCH aceito: o que foi enviado passa a ser o original. */
  confirmar: () => void;
}

export function useIdentidadeVisual(): VisualEstado {
  const [valores, setValores] = useState<ValoresVisual>({ ...VAZIO });
  const [original, setOriginal] = useState<ValoresVisual>({ ...VAZIO });
  const [carregado, setCarregado] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  // estável: as telas o usam como dependência do useEffect que carrega o site
  const hidratar = useCallback((c: Record<string, unknown>) => {
    const lido = lerVisual(c);
    setValores(lido);
    setOriginal(lido);
    setCarregado(true);
  }, []);
  return {
    valores,
    original,
    carregado,
    erros,
    setErros,
    set: (k, v) => setValores((x) => ({ ...x, [k]: v })),
    hidratar,
    confirmar: () => setOriginal(valores),
  };
}

/* ------------------------------------------------------------------ */
/* Descrição                                                           */
/* ------------------------------------------------------------------ */

export function DescricaoSite({ v }: { v: VisualEstado }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-1.5">
        <Rotulo>Descrição do site</Rotulo>
        <Contador atual={v.valores.descricao.length} max={320} />
      </div>
      <AreaTexto
        value={v.valores.descricao}
        onChange={(e) => v.set("descricao", e.target.value)}
        invalido={!!v.erros.descricao}
        rows={3}
        placeholder="Descrição para meta description, og:description e dados estruturados"
      />
      {v.erros.descricao && <p className="mt-1 text-[11px] text-[var(--danger)]">{v.erros.descricao}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mídia                                                               */
/* ------------------------------------------------------------------ */

function Previa({ valor, tipo, escuro }: { valor: string; tipo: "logo" | "favicon" | "og"; escuro?: boolean }) {
  const { midia } = useStore();
  const [falhou, setFalhou] = useState<string>("");
  const cls = tipo === "favicon" ? "h-8 w-8" : tipo === "og" ? "h-16 w-28" : "h-10 w-24";
  // o valor gravado é um caminho (/midia/x.png); a URL para exibir vem da biblioteca
  const achada = valor ? midia.find((m) => caminhoDaMidia(m.url) === valor) : undefined;
  const src = achada?.url ?? (/^https?:\/\//i.test(valor) ? valor : "");
  const caixa = escuro ? "bg-[var(--ink)] p-1" : "";
  if (!valor || !src || falhou === src) {
    return (
      <div className={cn("rounded border border-[var(--line)]", caixa)}>
        <div
          className={cn(
            "flex items-center justify-center rounded border border-dashed border-[var(--line)] bg-[var(--surface)] px-1 text-center text-[9px] leading-tight break-all text-[var(--ink-muted)]",
            cls,
          )}
        >
          {valor ? valor.split("/").pop() : "vazio"}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("rounded border border-[var(--line)]", caixa)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setFalhou(src)}
        className={cn("rounded bg-[var(--surface)] object-contain", cls)}
      />
    </div>
  );
}

function BlocoArquivo({
  titulo,
  campo,
  v,
  dica,
  tipo,
  escuro,
  children,
}: {
  titulo: string;
  campo: CampoVisual;
  v: VisualEstado;
  dica?: string;
  tipo: "logo" | "favicon" | "og";
  escuro?: boolean;
  children?: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const valor = v.valores[campo];
  const erro = v.erros[campo];
  return (
    <div className="flex items-start gap-5">
      <div className="shrink-0">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">{titulo}</p>
        <Previa valor={valor} tipo={tipo} escuro={escuro} />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {dica && <p className="text-[11px] text-[var(--ink-muted)]">{dica}</p>}
        {valor && <p className="truncate font-mono text-[11px] text-[var(--ink-muted)]">{valor}</p>}
        {children}
        <div className="flex gap-2">
          <Botao tamanho="sm" onClick={() => setAberto(true)}>Escolher da biblioteca</Botao>
          {valor && (
            <Botao tamanho="sm" variante="perigo" onClick={() => v.set(campo, "")}>Remover</Botao>
          )}
        </div>
        {erro && <p className="text-[11px] text-[var(--danger)]">{erro}</p>}
      </div>
      <SeletorMidia
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        aoEscolher={(m) => v.set(campo, caminhoDaMidia(m.url))}
        selecionada={undefined}
      />
    </div>
  );
}

export function MidiaSite({ v, incluirCompartilhamento = true }: { v: VisualEstado; incluirCompartilhamento?: boolean }) {
  return (
    <div className="space-y-5">
      <BlocoArquivo titulo="Logo claro" campo="logo.src" v={v} tipo="logo">
        <Campo label="Texto alternativo do logo">
          <Entrada
            value={v.valores["logo.alt"]}
            onChange={(e) => v.set("logo.alt", e.target.value)}
            placeholder="Ex.: Logotipo da Clínica Sorriso"
          />
        </Campo>
      </BlocoArquivo>
      <hr className="border-[var(--line)]" />
      <BlocoArquivo titulo="Logo escuro" campo="logo.srcEscuro" v={v} tipo="logo" escuro dica="Usado quando o site está em modo escuro." />
      <hr className="border-[var(--line)]" />
      <BlocoArquivo titulo="Favicon" campo="favicon" v={v} tipo="favicon" dica="PNG, SVG ou ICO. Exibido na aba do navegador e em favoritos." />
      {incluirCompartilhamento && (
        <>
          <hr className="border-[var(--line)]" />
          <BlocoArquivo
            titulo="og:image"
            campo="ogImagem"
            v={v}
            tipo="og"
            dica="Imagem de compartilhamento (redes sociais e mensageiros). Recomendado 1200×630 px."
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Salvar só o visual (Personalizar)                                   */
/* ------------------------------------------------------------------ */

export function BotaoSalvarVisual({ v }: { v: VisualEstado }) {
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<"ok" | "erro" | null>(null);
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setMensagem("");
    setFeedback(null);
    if (!v.carregado) {
      setFeedback("erro");
      setMensagem("Os dados do site ainda não foram carregados — nada foi enviado.");
      return;
    }
    const { body, limpar } = montarPatchPlano(v.original, v.valores);
    const erros = validarBody(body);
    if (Object.keys(erros).length) {
      v.setErros(erros);
      setFeedback("erro");
      setMensagem("Corrija os campos destacados. Nada foi enviado.");
      return;
    }
    v.setErros({});
    if (Object.keys(body).length === 0) {
      setFeedback("ok");
      setMensagem("Nada foi alterado.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (limpar.length) body.limpar = limpar;
    setSalvando(true);
    const r = await enviarConfig(body);
    setSalvando(false);
    if (!r.ok) {
      v.setErros(r.erros);
      setFeedback("erro");
      setMensagem(r.erro);
      return;
    }
    v.confirmar();
    setFeedback("ok");
    setMensagem(r.aviso);
    setTimeout(() => setFeedback(null), r.aviso ? 8000 : 3000);
  }

  return (
    <div className="flex items-center gap-3">
      <Botao variante="primario" tamanho="sm" onClick={salvar} disabled={salvando}>
        {salvando ? "Salvando…" : "Salvar identidade do site"}
      </Botao>
      {feedback === "ok" && (
        <span className="text-[11px] text-[var(--success)]">Salvo{mensagem ? ` — ${mensagem}` : ""}</span>
      )}
      {feedback === "erro" && <span className="text-[11px] text-[var(--danger)]">{mensagem || "Erro ao salvar."}</span>}
    </div>
  );
}
