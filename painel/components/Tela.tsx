"use client";

import type { ReactNode } from "react";

export function CabecalhoTela({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[17px] leading-tight font-semibold tracking-tight text-ink">
          {titulo}
        </h1>
        {descricao && <p className="mt-0.5 text-[11.5px] text-ink-muted">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 items-center gap-1.5">{acoes}</div>}
    </div>
  );
}
