"use client";

import { useEffect, useState } from "react";

import { urlMiniaturaMidia } from "@/lib/site-config-cliente";
import { cn } from "@/lib/utils";

/**
 * Círculo (ou quadrado arredondado) do usuário: mostra a FOTO do perfil quando existe e
 * carrega; senão, as iniciais sobre o fundo. Quem passa `className` define tamanho, forma e fundo.
 */
export function AvatarUsuario({
  nome,
  foto,
  className,
  tamanho = 64,
}: {
  nome: string;
  foto?: string;
  className?: string;
  /** Largura (px) da miniatura a carregar. */
  tamanho?: number;
}) {
  const [falhou, setFalhou] = useState(false);
  useEffect(() => setFalhou(false), [foto]);
  const iniciais =
    nome.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden", className)}>
      {foto && !falhou ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlMiniaturaMidia(foto, tamanho)}
          alt={nome}
          onError={() => setFalhou(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        iniciais
      )}
    </span>
  );
}
