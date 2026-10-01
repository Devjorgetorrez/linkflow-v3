"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Botao } from "@/components/ui";

/**
 * Botão "Copiar" para textos prontos que o usuário cola na conversa com o
 * Claude Code (pedido de troca de layout, de redefinição de senha, etc.).
 * Sem permissão de área de transferência (contexto não seguro), cai para a
 * seleção manual via textarea escondido.
 */
export function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2200);
  }

  return (
    <Botao type="button" variante="primario" tamanho="sm" onClick={copiar}>
      {copiado ? <Check size={12} /> : <Copy size={12} />}
      {copiado ? "Copiado" : "Copiar"}
    </Botao>
  );
}
