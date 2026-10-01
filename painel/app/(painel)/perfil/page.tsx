"use client";

import { useSession } from "next-auth/react";

import { EditorUsuario } from "@/components/usuarios/EditorUsuario";

export default function PerfilPage() {
  const { data: sessao, status } = useSession();
  const id = (sessao?.user as { id?: string } | undefined)?.id;
  if (status === "loading") {
    return <div className="flex h-full items-center justify-center p-8"><p className="text-[13px] text-ink-muted">Carregando…</p></div>;
  }
  if (!id) {
    return <div className="flex h-full items-center justify-center p-8"><p className="text-[13px] text-ink-muted">Sessão não encontrada.</p></div>;
  }
  return <EditorUsuario id={id} modo="perfil" />;
}
