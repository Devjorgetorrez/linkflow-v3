"use client";

import { KeyRound, PenLine, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { useStore } from "@/lib/store";
import type { Usuario as UsuarioBase } from "@/mock/types";
import { cn } from "@/lib/utils";

// Tipo local — estende o Usuario do Jorge com campos derivados da API
interface UsuarioListado extends UsuarioBase {
  nome: string;
  iniciais?: string;
  postsAssinados: number;
  criadoEm: string;
}

const PAPEL_LABEL: Record<string, string> = {
  administrador: "Administrador",
  editor: "Editor",
  autor: "Autor",
};

const PAPEL_COR: Record<string, string> = {
  administrador: "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]",
  editor: "bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[color-mix(in_srgb,var(--accent)_80%,var(--ink))]",
  autor: "bg-[var(--secondary)] text-[var(--ink-muted)]",
};

type Filtro = "todos" | "acesso" | "autoria";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const GRADIENTES = [
  "from-violet-400 to-pink-400",
  "from-blue-400 to-cyan-400",
  "from-emerald-400 to-teal-400",
  "from-orange-400 to-amber-400",
  "from-rose-400 to-red-400",
];

function gradiente(id: string) {
  return GRADIENTES[id.charCodeAt(id.length - 1) % GRADIENTES.length];
}

export default function UsuariosPage() {
  const { posts } = useStore();
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  // Carregar usuários reais da API
  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.usuarios)) {
          // API devolve formato aninhado: { acesso: { emailLogin, papel, ativo }, autoria: { nomePublico } }
          setUsuarios(data.usuarios.map((u: Record<string, unknown>): UsuarioListado => {
            const acesso = u.acesso as Record<string, unknown> | undefined;
            const autoria = u.autoria as Record<string, unknown> | undefined;
            const nome = String(autoria?.nomePublico ?? acesso?.emailLogin ?? "");
            return {
              id: String(u.id ?? ""),
              nome,
              iniciais: String(u.iniciais ?? (nome.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "?")),
              acesso: {
                emailLogin: String(acesso?.emailLogin ?? ""),
                papel: String(acesso?.papel ?? "autor") as "administrador" | "editor" | "autor",
                ativo: Boolean(acesso?.ativo),
              },
              podeAcessar: Boolean(u.podeAcessar),
              podeAssinar: Boolean(u.podeAssinar),
              postsAssinados: 0,
              criadoEm: String(u.criadoEm ?? ""),
            };
          }));
        }
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  const postsPorUsuario = (uid: string) =>
    posts.filter((p) => p.autorId === uid).length;

  const filtrados = usuarios.filter((u) => {
    const nome = u.nome ?? "";
    const email = u.acesso?.emailLogin ?? "";
    const matchBusca =
      busca === "" ||
      nome.toLowerCase().includes(busca.toLowerCase()) ||
      email.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro =
      filtro === "todos" ||
      (filtro === "acesso" && u.podeAcessar) ||
      (filtro === "autoria" && u.podeAssinar);
    return matchBusca && matchFiltro;
  });

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[var(--primary)]" />
            <h1 className="text-xl font-semibold text-[var(--ink)]">Usuários</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-[var(--ink-muted)]">
            {usuarios.length} registro{usuarios.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/usuarios/novo"
          className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-[13px] font-medium text-[var(--primary-ink)] hover:opacity-90"
        >
          <Plus size={14} />
          Adicionar usuário
        </Link>
      </div>

      {/* Barra de busca + filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ minWidth: 220, maxWidth: 320 }}>
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-[var(--line)] bg-transparent py-2 pl-9 pr-3 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
        </div>

        <div className="flex gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-0.5">
          {(
            [
              { id: "todos", label: "Todos" },
              { id: "acesso", label: "Com acesso" },
              { id: "autoria", label: "Com autoria" },
            ] as { id: Filtro; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              className={cn(
                "rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors",
                filtro === id
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-[var(--ink-muted)]">
          Nenhum usuário encontrado.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Nome
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  E-mail de login
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Papel
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Posts assinados
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Estado
                </th>
                <th className="w-12 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filtrados.map((u) => {
                const nomeExibicao = u.nome || u.acesso?.emailLogin || "—";
                const emailLogin = u.acesso?.emailLogin;
                const papel = u.acesso?.papel;
                const ativo = u.acesso?.ativo !== false;
                const nPosts = postsPorUsuario(u.id);

                return (
                  <tr
                    key={u.id}
                    className="bg-[var(--surface)] transition-colors hover:bg-[var(--surface-2)]"
                  >
                    {/* Nome */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradiente(u.id)} text-[11px] font-bold text-white`}
                        >
                          {iniciais(nomeExibicao)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--ink)]">{nomeExibicao}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {u.podeAcessar && (
                              <span className="inline-flex items-center gap-0.5 text-[10.5px] text-[var(--ink-muted)]">
                                <KeyRound size={9} />
                                acesso
                              </span>
                            )}
                            {u.podeAcessar && u.podeAssinar && (
                              <span className="text-[10px] text-[var(--ink-muted)]">·</span>
                            )}
                            {u.podeAssinar && (
                              <span className="inline-flex items-center gap-0.5 text-[10.5px] text-[var(--ink-muted)]">
                                <PenLine size={9} />
                                autoria
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* E-mail de login */}
                    <td className="px-4 py-3 text-[var(--ink-muted)]">
                      {emailLogin ?? <span className="italic text-[var(--ink-muted)]/50">sem acesso</span>}
                    </td>

                    {/* Papel */}
                    <td className="px-4 py-3">
                      {papel ? (
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                            PAPEL_COR[papel] ?? "bg-[var(--secondary)] text-[var(--ink-muted)]",
                          )}
                        >
                          {PAPEL_LABEL[papel] ?? papel}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[var(--ink-muted)]/50 italic">—</span>
                      )}
                    </td>

                    {/* Posts assinados */}
                    <td className="px-4 py-3 text-[var(--ink-muted)]">
                      {u.podeAssinar ? (
                        nPosts > 0 ? (
                          <Link
                            href={`/posts?autor=${u.id}`}
                            className="font-medium text-[var(--ink)] hover:text-[var(--primary)] hover:underline"
                          >
                            {nPosts}
                          </Link>
                        ) : (
                          <span className="text-[var(--ink-muted)]">0</span>
                        )
                      ) : (
                        <span className="italic text-[var(--ink-muted)]/50">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      {u.podeAcessar ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                            ativo
                              ? "bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]"
                              : "bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]",
                          )}
                        >
                          {ativo ? "Ativo" : "Inativo"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[11px] text-[var(--ink-muted)]">
                          Só autoria
                        </span>
                      )}
                    </td>

                    {/* Editar */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/usuarios/${u.id}`}
                        className="text-[12px] text-[var(--primary)] hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
