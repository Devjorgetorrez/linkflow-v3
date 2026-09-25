"use client";

/**
 * app/(painel)/usuarios/novo/page.tsx
 *
 * Esta rota existe apenas para compatibilidade com o link "+ Adicionar usuário".
 * Ao montar, cria um rascunho via API e redireciona para a tela completa
 * de edição (/usuarios/[id]) com o id real gerado — onde estão todos os
 * campos do modelo do Jorge (acesso + autoria completa).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NovoUsuarioPage() {
  const router = useRouter();

  useEffect(() => {
    // Criar rascunho via API e redirecionar para a tela completa de edição
    fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        podeAcessar: true,
        acesso: {
          emailLogin: `rascunho-${Date.now()}@pendente`,
          papel: "administrador",
          ativo: false,
        },
        podeAssinar: true,
        autoria: {
          nomePublico: "",
          slug: "",
          foto: "",
          cargo: "",
          bioCurta: "",
          bioLonga: "",
          conselho: "Nenhum",
          registro: "",
          especialidades: [],
          formacao: [],
          emailPublico: "",
          redes: { instagram: "", linkedin: "", facebook: "" },
          urlExterna: "",
          destaque: false,
        },
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.usuario?.id) {
          // Redirecionar para a tela completa de edição com todos os campos do Jorge
          router.replace(`/usuarios/${data.usuario.id}`);
        } else {
          // Fallback: voltar para a lista
          router.replace("/usuarios");
        }
      })
      .catch(() => router.replace("/usuarios"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-[13px] text-ink-muted">Criando usuário…</p>
    </div>
  );
}
