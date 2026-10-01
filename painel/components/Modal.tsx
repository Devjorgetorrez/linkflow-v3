"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  rodape,
  largura = "max-w-[720px]",
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6">
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="fixed inset-0 bg-ink/35"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative mt-10 w-full overflow-hidden rounded-[var(--radius)] border border-line bg-surface-2 shadow-2xl",
          largura,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">{titulo}</h2>
            {descricao && <p className="mt-0.5 text-[11px] text-ink-muted">{descricao}</p>}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="text-ink-muted transition-colors hover:text-ink"
          >
            <X size={15} />
          </button>
        </header>

        <div className="max-h-[62vh] overflow-y-auto p-4">{children}</div>

        {rodape && (
          <footer className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
            {rodape}
          </footer>
        )}
      </div>
    </div>
  );
}
