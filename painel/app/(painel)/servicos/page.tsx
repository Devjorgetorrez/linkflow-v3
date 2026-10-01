"use client";

/**
 * Serviços — lista de content/servicos/*.md (editor real do A06/A13, ver
 * relatorios/Plano-Correcao-QA-Painel.md). Tela autocontida: busca os dados
 * direto de /api/servicos (não usa lib/store.tsx — aquele hook é dedicado a
 * posts/autores/categorias/mídia).
 */

import { AlertCircle, ExternalLink, Plus, Search, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { Badge, Botao, Vazio } from "@/components/ui";
import { useBaseSite } from "@/lib/useDominio";
import { cn } from "@/lib/utils";
import type { ServicoApi } from "@/lib/servicos-api";

export default function ServicosPage() {
  const { data: sessao } = useSession();
  const papel = (sessao?.user as { papel?: string } | undefined)?.papel;
  const podeEditar = papel === "administrador" || papel === "editor";

  const [servicos, setServicos] = useState<ServicoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const { base: baseSite } = useBaseSite();

  const carregar = async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/servicos", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.erro || "Não consegui listar os serviços.");
      setServicos(data.servicos);
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar serviços.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  const excluir = async (slug: string) => {
    if (!confirm(`Mandar "${slug}" para a lixeira?`)) return;
    const res = await fetch(`/api/servicos/${encodeURIComponent(slug)}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) setServicos((s) => s.filter((x) => x.slug !== slug));
    else alert(data.erro || "Não consegui excluir.");
  };

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return servicos;
    return servicos.filter((s) => s.titulo.toLowerCase().includes(q) || s.slug.includes(q));
  }, [servicos, busca]);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">Serviços</h1>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">
            {carregando ? "Carregando…" : `${servicos.length} serviço${servicos.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {podeEditar && (
          <Link href="/servicos/novo">
            <Botao tamanho="sm">
              <Plus size={12} /> Adicionar serviço
            </Botao>
          </Link>
        )}
      </div>

      {erro && (
        <p className="flex items-center gap-1.5 border-b border-line bg-danger/10 px-6 py-2 text-[12px] text-danger">
          <AlertCircle size={12} /> {erro}
        </p>
      )}

      <div className="flex items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
        <div className="relative max-w-xs flex-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar serviços…"
            className="h-7 w-full rounded-[var(--radius)] border border-line bg-surface-2 pl-7 pr-3 text-[12px] text-ink placeholder:text-ink-muted/70 outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Título / URL</th>
              <th className="px-3 py-2.5 text-left font-medium text-ink-muted">Categoria</th>
              <th className="px-3 py-2.5 text-center font-medium text-ink-muted">Ordem</th>
              <th className="px-3 py-2.5 text-center font-medium text-ink-muted">Destaque</th>
              <th className="px-3 py-2.5 text-right font-medium text-ink-muted">Palavras</th>
              <th className="w-16 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visiveis.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[12px] text-ink-muted">
                  {carregando ? "Carregando…" : "Nenhum serviço encontrado."}
                </td>
              </tr>
            ) : (
              visiveis.map((s) => (
                <tr key={s.id} className="group transition-colors hover:bg-secondary/60">
                  <td className="px-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/servicos/${s.id}`} className="block truncate font-medium text-ink hover:text-primary">
                        {s.titulo}
                      </Link>
                      <span className="block truncate font-mono text-[10.5px] text-ink-muted">/{s.slug}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-ink-muted">{s.categoria || "—"}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-[11px] text-ink-muted">{s.ordem}</td>
                  <td className="px-3 py-2.5 text-center">
                    {s.destaque ? <Star size={13} className="mx-auto fill-accent text-accent" /> : <span className="text-ink-muted/40">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[11px] text-ink-muted">{s.palavras}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {baseSite && (
                        <a
                          href={`${baseSite}/${s.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver no site"
                          className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-secondary hover:text-ink"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                      {podeEditar && (
                        <button
                          type="button"
                          title="Lixeira"
                          onClick={() => excluir(s.slug)}
                          className={cn("flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-danger/10 hover:text-danger")}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!carregando && servicos.length === 0 && !erro && (
        <div className="p-6">
          <Vazio
            icone={<Badge tom="neutro">Serviços</Badge>}
            titulo="Nenhum serviço cadastrado"
            descricao="Os serviços são as páginas de oferta do site (Money Pages)."
          />
        </div>
      )}
    </div>
  );
}
