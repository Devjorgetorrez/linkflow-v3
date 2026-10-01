"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Botao, Campo, Entrada } from "@/components/ui";
import { TITULO_MIN, TITULO_MAX } from "@/lib/posts-regras";

/**
 * Pede o título ANTES de criar o post no servidor — o rascunho só nasce em
 * disco quando o usuário confirma, não ao simplesmente abrir esta tela.
 * Antes, "Novo Post" criava o arquivo já no useEffect de montagem: um clique
 * sem intenção de escrever (ou navegar de volta rápido) deixava um rascunho
 * "sem título" permanente na lista (erro 81, Relatório de Testes 5).
 *
 * Cria NO SERVIDOR (já válido: título, rascunho, data e autor) e só então
 * abre o editor no endereço real do arquivo — nunca abre o editor de um
 * post que não existe.
 */
export default function NovoPostPage() {
  const { criarPost } = useStore();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");

  const tituloValido = titulo.trim().length >= TITULO_MIN;

  async function criar() {
    if (!tituloValido || criando) return;
    setCriando(true);
    setErro("");
    const r = await criarPost(titulo.trim());
    if (r.ok) router.replace(`/posts/${r.slug}`);
    else {
      setErro(r.erro);
      setCriando(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-md space-y-4 px-6">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Novo artigo</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            O rascunho só é criado depois de você confirmar o título.
          </p>
        </div>

        <Campo label="Título">
          <Entrada
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") criar();
            }}
            placeholder="Título do artigo"
            maxLength={TITULO_MAX}
          />
        </Campo>

        {erro && <p className="text-[12px] text-danger">{erro}</p>}

        <div className="flex items-center gap-2">
          <Botao variante="primario" onClick={criar} disabled={!tituloValido || criando}>
            {criando ? "Criando…" : "Criar artigo"}
          </Botao>
          <Link href="/posts" className="text-[12.5px] text-ink-muted hover:text-ink">
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}
