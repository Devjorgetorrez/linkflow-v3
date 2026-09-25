"use client";

import {
  AlertTriangle,
  Anchor,
  Bold,
  Code,
  Heading2,
  Heading3,
  Heading4,
  Image as ImagemIcone,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  SquareCode,
  Strikethrough,
  Table,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";

import { SeletorMidia } from "@/components/SeletorMidia";
import { Botao, Entrada } from "@/components/ui";
import { cn, contarPalavras, tempoLeitura } from "@/lib/utils";

type Pedido = "link" | "url" | "ancora" | null;

function Ferramenta({
  titulo,
  onClick,
  children,
  rotulo,
}: {
  titulo: string;
  onClick: () => void;
  children: ReactNode;
  rotulo?: string;
}) {
  return (
    <button
      type="button"
      title={titulo}
      // onMouseDown evita que o campo perca a seleção antes do comando rodar
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "inline-flex h-6.5 items-center justify-center gap-1 rounded-[var(--radius)] px-1.5 text-ink-muted transition-colors hover:bg-secondary hover:text-ink",
        rotulo && "px-2 text-[11px]",
      )}
    >
      {children}
      {rotulo}
    </button>
  );
}

function Divisor() {
  return <span className="mx-1 h-4 w-px bg-line" />;
}

export interface EditorCorpoHandle {
  focarInicio(): void;
}

export const EditorCorpo = forwardRef<
  EditorCorpoHandle,
  {
    valor: string;
    aoMudar: (html: string) => void;
    slotTitulo?: ReactNode;
    aoRetornarParaTitulo?: () => void;
  }
>(function EditorCorpo({ valor, aoMudar, slotTitulo, aoRetornarParaTitulo }, ref) {
  const area = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focarInicio() {
      const el = area.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    },
  }));
  const [palavras, setPalavras] = useState(() => contarPalavras(valor));
  const [pedido, setPedido] = useState<Pedido>(null);
  const [entradaPedido, setEntradaPedido] = useState("");
  const [bibliotecaAberta, setBiblioteca] = useState(false);
  const selecao = useRef<Range | null>(null);

  /* o HTML só é escrito no DOM na montagem: reescrever a cada tecla move o cursor */
  useEffect(() => {
    if (area.current && area.current.innerHTML !== valor) {
      area.current.innerHTML = valor || "<p></p>";
      setPalavras(contarPalavras(valor));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sincronizar = useCallback(() => {
    if (!area.current) return;
    const html = area.current.innerHTML;
    aoMudar(html);
    setPalavras(contarPalavras(html));
  }, [aoMudar]);

  const guardarSelecao = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) selecao.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const restaurarSelecao = useCallback(() => {
    area.current?.focus();
    const sel = window.getSelection();
    if (sel && selecao.current) {
      sel.removeAllRanges();
      sel.addRange(selecao.current);
    }
  }, []);

  const comando = useCallback(
    (nome: string, argumento?: string) => {
      area.current?.focus();
      document.execCommand(nome, false, argumento);
      sincronizar();
    },
    [sincronizar],
  );

  const inserir = useCallback(
    (html: string) => {
      restaurarSelecao();
      document.execCommand("insertHTML", false, html);
      sincronizar();
    },
    [restaurarSelecao, sincronizar],
  );

  function abrirPedido(tipo: Exclude<Pedido, null>) {
    guardarSelecao();
    setEntradaPedido("");
    setPedido(tipo);
  }

  function confirmarPedido() {
    const texto = entradaPedido.trim();
    if (!texto) return setPedido(null);

    if (pedido === "link") {
      restaurarSelecao();
      document.execCommand("createLink", false, texto);
      sincronizar();
    } else if (pedido === "url") {
      inserir(`<a href="${texto}">${texto}</a>`);
    } else if (pedido === "ancora") {
      const id = texto
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      inserir(`<span id="${id}" data-ancora="${id}"></span>`);
    }
    setPedido(null);
  }

  const converterH1paraH2 = useCallback(() => {
    if (!area.current) return;
    area.current.innerHTML = area.current.innerHTML
      .replace(/<h1(\s[^>]*)?>/gi, "<h2>")
      .replace(/<\/h1>/gi, "</h2>");
    sincronizar();
  }, [sincronizar]);

  const rotuloPedido =
    pedido === "link"
      ? "URL do link para o texto selecionado"
      : pedido === "url"
        ? "URL a inserir como texto"
        : "Nome da âncora";

  const temH1NoCorpo = /<h1[\s>]/i.test(valor);

  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface-2">
      {/* Barra de ferramentas — sticky abaixo do Topo (52 px) */}
      <div className="sticky top-[52px] z-10 rounded-t-[var(--radius)] border-b border-line bg-surface-2">
        {/* fila 1 */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1">
          <Ferramenta titulo="Negrito" onClick={() => comando("bold")}>
            <Bold size={13} />
          </Ferramenta>
          <Ferramenta titulo="Itálico" onClick={() => comando("italic")}>
            <Italic size={13} />
          </Ferramenta>
          <Ferramenta titulo="Tachado" onClick={() => comando("strikeThrough")}>
            <Strikethrough size={13} />
          </Ferramenta>
          <Ferramenta
            titulo="Código inline"
            onClick={() => {
              const sel = window.getSelection()?.toString() ?? "";
              comando("insertHTML", `<code>${sel || "código"}</code>`);
            }}
          >
            <Code size={13} />
          </Ferramenta>
          <Divisor />
          {/* H1 removido: o título do post já é o H1 da página */}
          <Ferramenta titulo="Título 2" onClick={() => comando("formatBlock", "<h2>")}>
            <Heading2 size={13} />
          </Ferramenta>
          <Ferramenta titulo="Título 3" onClick={() => comando("formatBlock", "<h3>")}>
            <Heading3 size={13} />
          </Ferramenta>
          <Ferramenta titulo="Título 4" onClick={() => comando("formatBlock", "<h4>")}>
            <Heading4 size={13} />
          </Ferramenta>
          <Divisor />
          <Ferramenta titulo="Lista" onClick={() => comando("insertUnorderedList")}>
            <List size={13} />
          </Ferramenta>
          <Ferramenta titulo="Lista numerada" onClick={() => comando("insertOrderedList")}>
            <ListOrdered size={13} />
          </Ferramenta>
          <Ferramenta titulo="Citação" onClick={() => comando("formatBlock", "<blockquote>")}>
            <Quote size={13} />
          </Ferramenta>
          <Ferramenta titulo="Bloco de código" onClick={() => comando("formatBlock", "<pre>")}>
            <SquareCode size={13} />
          </Ferramenta>
          <Ferramenta titulo="Divisor" onClick={() => comando("insertHorizontalRule")}>
            <Minus size={13} />
          </Ferramenta>
        </div>

        {/* fila 2 */}
        <div className="flex flex-wrap items-center gap-0.5 border-t border-line px-2 py-1">
          <Ferramenta titulo="Transformar seleção em link" onClick={() => abrirPedido("link")} rotulo="Link">
            <Link2 size={12} />
          </Ferramenta>
          <Ferramenta
            titulo="Inserir imagem da biblioteca"
            onClick={() => {
              guardarSelecao();
              setBiblioteca(true);
            }}
            rotulo="Biblioteca"
          >
            <ImagemIcone size={12} />
          </Ferramenta>
          <Ferramenta titulo="Inserir URL como texto" onClick={() => abrirPedido("url")} rotulo="URL">
            <Link2 size={12} />
          </Ferramenta>
          <Ferramenta
            titulo="Inserir tabela 3x3"
            rotulo="Tabela"
            onClick={() => {
              guardarSelecao();
              inserir(
                "<table><thead><tr><th>Coluna</th><th>Coluna</th><th>Coluna</th></tr></thead><tbody><tr><td>—</td><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td><td>—</td></tr></tbody></table><p></p>",
              );
            }}
          >
            <Table size={12} />
          </Ferramenta>
          <Ferramenta titulo="Inserir âncora" onClick={() => abrirPedido("ancora")} rotulo="Âncora">
            <Anchor size={12} />
          </Ferramenta>
        </div>
      </div>

      {/* Slot: título — sem borda divisória, o título é a primeira linha do documento */}
      {slotTitulo}

      {/* Aviso: H1 no corpo */}
      {temH1NoCorpo && (
        <div className="flex items-start gap-2 border-b border-line bg-[#f59e0b]/8 px-4 py-2.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#d97706]" />
          <p className="flex-1 text-[12px] text-ink">
            <span className="font-medium">H1 no corpo do texto.</span>{" "}
            O título do post já é o H1 desta página.
          </p>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              converterH1paraH2();
            }}
            className="shrink-0 rounded-[var(--radius)] border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2.5 py-1 text-[11px] font-medium text-[#b45309] transition-colors hover:bg-[#f59e0b]/20"
          >
            Converter em H2
          </button>
        </div>
      )}

      {pedido && (
        <div className="flex items-center gap-2 border-b border-line bg-surface px-2 py-1.5">
          <span className="shrink-0 text-[11px] text-ink-muted">{rotuloPedido}</span>
          <Entrada
            autoFocus
            value={entradaPedido}
            onChange={(e) => setEntradaPedido(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmarPedido();
              }
              if (e.key === "Escape") setPedido(null);
            }}
            placeholder={pedido === "ancora" ? "como-funciona" : "https://"}
            className="h-7 py-0"
          />
          <Botao tamanho="sm" variante="primario" onClick={confirmarPedido}>
            Inserir
          </Botao>
          <Botao tamanho="sm" onClick={() => setPedido(null)}>
            Cancelar
          </Botao>
        </div>
      )}

      <div
        ref={area}
        contentEditable
        suppressContentEditableWarning
        onInput={sincronizar}
        onBlur={() => {
          guardarSelecao();
          sincronizar();
        }}
        onKeyUp={guardarSelecao}
        onMouseUp={guardarSelecao}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && aoRetornarParaTitulo) {
            const el = area.current;
            if (!el) return;
            const vazio = (el.textContent ?? "").trim() === "";
            const sel = window.getSelection();
            const noInicio =
              sel?.rangeCount &&
              sel.getRangeAt(0).collapsed &&
              sel.getRangeAt(0).startOffset === 0;
            if (vazio || noInicio) {
              e.preventDefault();
              aoRetornarParaTitulo();
            }
          }
        }}
        role="textbox"
        aria-multiline="true"
        aria-label="Corpo do post"
        className="min-h-[380px] px-4 py-3 text-[13.5px] leading-relaxed text-ink"
      />

      <div className="flex items-center gap-3 border-t border-line px-3 py-1.5 text-[10.5px] text-ink-muted">
        <span className="font-mono">{palavras} palavras</span>
        <span className="font-mono">{tempoLeitura(palavras)} min de leitura</span>
        <span className="ml-auto">Rascunho salvo só nesta sessão</span>
      </div>

      <SeletorMidia
        aberto={bibliotecaAberta}
        aoFechar={() => setBiblioteca(false)}
        aoEscolher={(m) =>
          inserir(
            `<figure data-midia="${m.id}"><div style="background-image:linear-gradient(${m.gradiente});aspect-ratio:16/9;border-radius:6px"></div><figcaption>${m.alt || m.titulo}</figcaption></figure><p></p>`,
          )
        }
      />
    </div>
  );
});
