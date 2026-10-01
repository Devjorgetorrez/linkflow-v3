"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Cria o serviço NO SERVIDOR (já válido: título/meta provisórios marcados
 * `[CAMPO]` — ver lib/servicos-regras.ts) e só então abre o editor no
 * endereço real do arquivo. Espelha app/(painel)/posts/novo/page.tsx.
 */
export default function NovoServicoPage() {
  const router = useRouter();
  const iniciado = useRef(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    fetch("/api/servicos", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) router.replace(`/servicos/${data.slug}`);
        else setErro(data.erro || "Não consegui criar o serviço.");
      })
      .catch(() => setErro("Não consegui criar o serviço."));
  }, [router]);

  if (erro) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-[13px] font-medium text-danger">Não consegui criar o serviço.</p>
        <p className="text-[12px] text-ink-muted">{erro}</p>
        <Link href="/servicos" className="text-[12.5px] text-primary hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[13px] text-ink-muted">Criando serviço…</p>
    </div>
  );
}
