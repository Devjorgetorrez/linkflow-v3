"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Botao } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Formulario } from "@/mock/types";

export default function FormulariosPage() {
  const { formularios, formulariosCarregados, recarregarFormularios } = useStore();
  const router = useRouter();
  const [ocupado, setOcupado] = useState("");
  const [erro, setErro] = useState("");

  // Sempre relê ao abrir a tela (dados podem ter mudado no servidor).
  useEffect(() => { void recarregarFormularios(); }, [recarregarFormularios]);

  async function duplicar(f: Formulario) {
    setErro("");
    setOcupado(f.id);
    try {
      const res = await fetch("/api/formularios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, nome: `${f.nome} (cópia)` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setErro(data.erro || "Não foi possível duplicar o formulário."); return; }
      await recarregarFormularios();
      router.push(`/formularios/${data.formulario.id}`);
    } catch {
      setErro("Não consegui falar com o servidor. Tente de novo.");
    } finally {
      setOcupado("");
    }
  }

  async function excluir(f: Formulario) {
    if (!window.confirm(`Excluir o formulário "${f.nome}"?\n\nOs leads que ele já recebeu continuam na tela de Leads. O site deixa de aceitar envios com o ID "${f.id}".`)) return;
    setErro("");
    setOcupado(f.id);
    try {
      const res = await fetch(`/api/formularios/${encodeURIComponent(f.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setErro(data.erro || "Não foi possível excluir o formulário."); return; }
      await recarregarFormularios();
    } catch {
      setErro("Não consegui falar com o servidor. Tente de novo.");
    } finally {
      setOcupado("");
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* cabeçalho */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
            Formulários
          </h1>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">
            {formulariosCarregados
              ? `${formularios.length} formulário${formularios.length !== 1 ? "s" : ""} configurado${formularios.length !== 1 ? "s" : ""}`
              : "Carregando…"}
          </p>
        </div>
        {formulariosCarregados ? (
          <Link href="/formularios/novo">
            <Botao variante="primario" tamanho="sm">
              <Plus size={13} />
              Adicionar formulário
            </Botao>
          </Link>
        ) : (
          <Botao variante="primario" tamanho="sm" disabled>
            <Plus size={13} />
            Adicionar formulário
          </Botao>
        )}
      </div>

      {erro && (
        <p role="alert" className="border-b border-danger/30 bg-danger/10 px-6 py-2 text-[12px] text-danger">{erro}</p>
      )}

      {/* tabela */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Nome</th>
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">ID no site</th>
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Campos</th>
              <th className="px-4 py-2.5 text-center font-medium text-ink-muted">Leads 30d</th>
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Status</th>
              <th className="w-20 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {formulariosCarregados && formularios.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-muted">Nenhum formulário. Clique em &ldquo;Adicionar formulário&rdquo;.</td></tr>
            )}
            {formularios.map((f) => {
              const camposTexto = f.campos.map((c) => c.rotulo).join(", ");
              return (
                <tr key={f.id} className="group transition-colors hover:bg-secondary/60">
                  <td className="px-4 py-3">
                    <Link href={`/formularios/${f.id}`} className="font-medium text-ink hover:text-primary">
                      {f.nome || <span className="text-ink-muted/50 italic">Sem nome</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">{f.id}</td>
                  <td className="px-4 py-3">
                    {camposTexto ? (
                      <span className="block max-w-[260px] truncate text-ink-muted" title={camposTexto}>{camposTexto}</span>
                    ) : (
                      <span className="text-ink-muted/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-[12px] text-ink">{f.envios30d}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[12px] font-medium", f.ativo ? "text-success" : "text-ink-muted")}>
                      {f.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => void duplicar(f)}
                        disabled={!!ocupado}
                        title="Duplicar formulário"
                        className="flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-secondary hover:text-ink disabled:opacity-40"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void excluir(f)}
                        disabled={!!ocupado}
                        title="Excluir formulário"
                        className="flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-secondary hover:text-danger disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
