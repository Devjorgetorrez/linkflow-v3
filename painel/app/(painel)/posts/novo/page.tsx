"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function NovoPostPage() {
  const { autores, criarPost } = useStore();
  const router = useRouter();
  const criado = useRef(false);

  useEffect(() => {
    if (criado.current) return;
    criado.current = true;

    const id = `p${Date.now()}`;
    const hoje = new Date().toISOString().slice(0, 10);
    const autorId = autores[0]?.id ?? "a1";

    criarPost({
      id,
      titulo: "",
      slug: "",
      resumo: "",
      corpo: "<p></p>",
      autorId,
      categoriaId: "",
      data: hoje,
      status: "rascunho",
      destaque: false,
      seoTitle: "",
      metaDescription: "",
      canonical: "",
      noindex: false,
      ogImagem: "",
      schemaTipo: "Article",
      faq: [],
      capa: "",
      capaAlt: "",
      fontes: [],
      palavras: 0,
    });

    router.replace(`/posts/${id}`);
  }, [autores, criarPost, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[13px] text-ink-muted">Criando post…</p>
    </div>
  );
}
