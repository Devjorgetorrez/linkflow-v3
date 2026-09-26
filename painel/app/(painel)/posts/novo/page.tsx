"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/**
 * Cria o post NO SERVIDOR (já válido: título provisório, rascunho, data e
 * autor) e só então abre o editor no endereço real do arquivo. Nunca abre o
 * editor de um post que não existe.
 */
export default function NovoPostPage() {
  const { criarPost } = useStore();
  const router = useRouter();
  const iniciado = useRef(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    criarPost().then((r) => {
      if (r.ok) router.replace(`/posts/${r.slug}`);
      else setErro(r.erro);
    });
  }, [criarPost, router]);

  if (erro) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-[13px] font-medium text-danger">Não consegui criar o post.</p>
        <p className="text-[12px] text-ink-muted">{erro}</p>
        <Link href="/posts" className="text-[12.5px] text-primary hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[13px] text-ink-muted">Criando post…</p>
    </div>
  );
}
