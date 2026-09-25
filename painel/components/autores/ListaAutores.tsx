"use client";

import { ExternalLink, Pencil, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStore } from "@/lib/store";

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

function iniciais(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ListaAutores() {
  const { autores, posts } = useStore();
  const [busca, setBusca] = useState("");

  const filtrados = autores.filter(
    (a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.cargo.toLowerCase().includes(busca.toLowerCase()),
  );

  const postsPorAutor = (autorId: string) =>
    posts.filter((p) => p.autorId === autorId).length;

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      {/* cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Autores</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {autores.length} autor{autores.length !== 1 ? "es" : ""} cadastrado
            {autores.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/autores/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-ink hover:bg-primary/90"
        >
          <UserPlus size={15} />
          Adicionar autor
        </Link>
      </div>

      {/* busca */}
      <div className="mb-6 relative max-w-xs">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="text"
          placeholder="Buscar autor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-[var(--radius)] border border-line bg-transparent py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* grade */}
      {filtrados.length === 0 ? (
        <p className="text-[13px] text-ink-muted">Nenhum autor encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((autor) => {
            const nPosts = postsPorAutor(autor.id);
            const ativo = autor.ativo !== false;
            return (
              <div
                key={autor.id}
                className="rounded-[var(--radius)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
              >
                {/* identidade */}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-gradient-to-br ${gradiente(autor.id)} text-lg font-bold text-white`}
                  >
                    {iniciais(autor.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {autor.nome}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-muted">
                      {autor.cargo}
                    </p>
                  </div>
                </div>

                {/* stats */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[12px] text-ink-muted">
                    {nPosts} post{nPosts !== 1 ? "s" : ""}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      ativo
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error"
                    }`}
                  >
                    {ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {/* ações */}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/autores/${autor.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-line py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-secondary"
                  >
                    <Pencil size={12} />
                    Editar
                  </Link>
                  {autor.urlExterna && (
                    <a
                      href={autor.urlExterna}
                      target="_blank"
                      rel="noreferrer"
                      title="Ver registro no conselho"
                      className="inline-flex items-center justify-center rounded-[var(--radius)] border border-line px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:bg-secondary"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
