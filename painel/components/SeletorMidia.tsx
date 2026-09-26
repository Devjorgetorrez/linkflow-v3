"use client";

import { AlertTriangle, ImageOff, Search, Upload } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useRef, useState } from "react";

import { Modal } from "@/components/Modal";
import { Badge, Botao, Entrada, Selecao, Thumb, Vazio } from "@/components/ui";
import { enviarMidia, TIPOS_IMAGEM_ACEITOS, type FinalidadeEnvio } from "@/lib/midia-cliente";
import { useStore } from "@/lib/store";
import type { Midia } from "@/mock/types";
import { cn, formatarBytes } from "@/lib/utils";

export function SeletorMidia({
  aberto,
  aoFechar,
  aoEscolher,
  selecionada,
  finalidade,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoEscolher: (m: Midia) => void;
  selecionada?: string;
  /**
   * "avatar" = envio de foto de perfil (qualquer papel, só imagem até 2 MB, pasta avatares).
   * "geral" = biblioteca inteira (5 MB; só admin/editor). Se omitido: telas de /usuarios e
   * /perfil usam "avatar"; as demais, "geral".
   */
  finalidade?: FinalidadeEnvio;
}) {
  const { midia, recarregarMidia } = useStore();
  const { data: session } = useSession();
  const pathname = usePathname() ?? "";
  const modo: FinalidadeEnvio =
    finalidade ?? (/^\/(usuarios|perfil)(\/|$)/.test(pathname) ? "avatar" : "geral");
  const papel = (session?.user as { papel?: string } | undefined)?.papel;
  const podeEnviar = modo === "avatar" || papel === "administrador" || papel === "editor";
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  async function enviar(files: File[]) {
    if (!files.length || enviando) return;
    setErroEnvio(null);
    setEnviando(true);
    // Avatar é um arquivo só; na biblioteca geral, envia em sequência e seleciona o último.
    const alvo = modo === "avatar" ? files.slice(0, 1) : files;
    let ultimoId: string | undefined;
    const falhas: string[] = [];
    for (const f of alvo) {
      const r = await enviarMidia(f, modo);
      if (r.ok) ultimoId = r.id;
      else falhas.push(r.erro ?? "Falha no envio.");
    }
    if (ultimoId) {
      const lista = await recarregarMidia();
      setBusca("");
      setPasta("todas");
      if (lista?.some((m) => m.id === ultimoId)) setEscolhida(ultimoId);
      else falhas.push("O arquivo foi enviado, mas não consegui recarregar a biblioteca. Feche e abra de novo.");
    }
    setErroEnvio(falhas.length ? falhas.join(" ") : null);
    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";
  }
  const [busca, setBusca] = useState("");
  const [pasta, setPasta] = useState("todas");
  const [escolhida, setEscolhida] = useState<string | undefined>(selecionada);

  const pastas = useMemo(() => [...new Set(midia.map((m) => m.pasta))], [midia]);

  const lista = useMemo(
    () =>
      midia.filter((m) => {
        if (pasta !== "todas" && m.pasta !== pasta) return false;
        const q = busca.trim().toLowerCase();
        if (q && !`${m.arquivo} ${m.titulo} ${m.tags.join(" ")}`.toLowerCase().includes(q))
          return false;
        return true;
      }),
    [midia, busca, pasta],
  );

  const item = midia.find((m) => m.id === escolhida);

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Biblioteca de mídia"
      descricao={
        podeEnviar
          ? "Escolha uma imagem da biblioteca ou envie uma do seu computador."
          : "Escolha uma imagem já enviada. O alt é obrigatório e vem junto."
      }
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            disabled={!item}
            onClick={() => {
              if (item) {
                aoEscolher(item);
                aoFechar();
              }
            }}
          >
            Usar esta imagem
          </Botao>
        </>
      }
    >
      <div
        onDragOver={(e) => { if (podeEnviar) { e.preventDefault(); setArrastando(true); } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setArrastando(false); }}
        onDrop={(e) => {
          if (!podeEnviar) return;
          e.preventDefault();
          setArrastando(false);
          void enviar(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "relative rounded-[var(--radius)]",
          arrastando && "outline-2 -outline-offset-2 outline-dashed outline-primary bg-primary/5",
        )}
      >
      {podeEnviar && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-dashed border-line px-3 py-2">
          <input
            ref={inputRef}
            type="file"
            accept={modo === "avatar" ? TIPOS_IMAGEM_ACEITOS : `${TIPOS_IMAGEM_ACEITOS},application/pdf`}
            multiple={modo !== "avatar"}
            className="sr-only"
            onChange={(e) => void enviar(Array.from(e.target.files ?? []))}
          />
          <Botao type="button" disabled={enviando} onClick={() => inputRef.current?.click()}>
            <Upload size={13} /> {enviando ? "Enviando…" : "Enviar do computador"}
          </Botao>
          <span className="text-[11px] text-ink-muted">
            ou arraste o arquivo para esta janela · JPG, PNG, WebP ou GIF, até {modo === "avatar" ? 2 : 5} MB
          </span>
        </div>
      )}
      {erroEnvio && (
        <p role="alert" className="mb-3 rounded-[var(--radius)] border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {erroEnvio}
        </p>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-[240px] shrink-0">
          <Search
            size={13}
            className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-ink-muted"
          />
          <Entrada
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por arquivo ou tag…"
            className="h-8 py-0 pl-7"
          />
        </div>
        <div className="w-[170px] shrink-0">
          <Selecao value={pasta} onChange={(e) => setPasta(e.target.value)} className="h-8 py-0">
            <option value="todas">Todas as pastas</option>
            {pastas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Selecao>
        </div>
        <span className="ml-auto text-[11px] text-ink-muted">{lista.length} arquivos</span>
      </div>

      {lista.length === 0 ? (
        <Vazio
          icone={<ImageOff size={18} />}
          titulo="Nenhuma mídia encontrada"
          descricao={
            podeEnviar
              ? "Use “Enviar do computador” ou arraste uma imagem para esta janela."
              : "Ajuste a busca ou escolha outra pasta. Peça a um editor para enviar imagens à biblioteca."
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {lista.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setEscolhida(m.id)}
                onDoubleClick={() => {
                  aoEscolher(m);
                  aoFechar();
                }}
                className={cn(
                  "w-full overflow-hidden rounded-[var(--radius)] border p-1 text-left transition-colors",
                  escolhida === m.id
                    ? "border-primary bg-primary/8"
                    : "border-line hover:border-ink-muted",
                )}
              >
                <Thumb gradiente={m.gradiente} url={/^(jpe?g|png|webp|gif|avif)$/i.test(m.formato) ? m.url : undefined} alt={m.alt} className="aspect-[4/3] w-full">
                  {!m.alt && (
                    <span className="absolute top-1 right-1">
                      <Badge tom="aviso">
                        <AlertTriangle size={9} /> sem alt
                      </Badge>
                    </span>
                  )}
                </Thumb>
                <p className="mt-1 truncate font-mono text-[10px] text-ink">{m.arquivo}</p>
                <p className="truncate text-[10px] text-ink-muted">
                  {m.largura}×{m.altura} · {formatarBytes(m.bytes)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
    </Modal>
  );
}
