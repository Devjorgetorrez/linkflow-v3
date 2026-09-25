"use client";

import { AlertTriangle, ImageOff, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import { Badge, Botao, Entrada, Selecao, Thumb, Vazio } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Midia } from "@/mock/types";
import { cn, formatarBytes } from "@/lib/utils";

export function SeletorMidia({
  aberto,
  aoFechar,
  aoEscolher,
  selecionada,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoEscolher: (m: Midia) => void;
  selecionada?: string;
}) {
  const { midia } = useStore();
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
      descricao="Escolha uma imagem já enviada. O alt é obrigatório e vem junto."
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
          descricao="Ajuste a busca ou escolha outra pasta."
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
                <Thumb gradiente={m.gradiente} className="aspect-[4/3] w-full">
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
    </Modal>
  );
}
