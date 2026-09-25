"use client";

import { Copy, ExternalLink, Globe, Mail, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Botao } from "@/components/ui";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Formulario } from "@/mock/types";

export default function FormulariosPage() {
  const { formularios: formulariosMock, criarFormulario } = useStore();
  const [formularios, setFormularios] = useState(formulariosMock);

  useEffect(() => {
    fetch("/api/formularios")
      .then(r => r.json())
      .then(data => { if (data.ok && Array.isArray(data.formularios)) setFormularios(data.formularios); })
      .catch(console.error);
  }, []);
  const router = useRouter();

  function duplicar(f: Formulario) {
    const id = `fm${Date.now()}`;
    criarFormulario({
      ...f,
      id,
      nome: `${f.nome} (cópia)`,
      usadoEm: [],
      envios30d: 0,
    });
    router.push(`/formularios/${id}`);
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
            {formularios.length} formulários configurados
          </p>
        </div>
        <Link href="/formularios/novo">
          <Botao variante="primario" tamanho="sm">
            <Plus size={13} />
            Adicionar formulário
          </Botao>
        </Link>
      </div>

      {/* tabela */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Nome</th>
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Campos</th>
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Destinos</th>
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Usado em</th>
              <th className="px-4 py-2.5 text-center font-medium text-ink-muted">Leads 30d</th>
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Status</th>
              <th className="w-8 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {formularios.map((f) => {
              const camposTexto = f.campos.map((c) => c.rotulo).join(", ");
              return (
                <tr
                  key={f.id}
                  className="group transition-colors hover:bg-secondary/60"
                >
                  {/* nome */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/formularios/${f.id}`}
                      className="font-medium text-ink hover:text-primary"
                    >
                      {f.nome || <span className="text-ink-muted/50 italic">Sem nome</span>}
                    </Link>
                  </td>

                  {/* campos */}
                  <td className="px-4 py-3">
                    {camposTexto ? (
                      <span
                        className="block max-w-[260px] truncate text-ink-muted"
                        title={camposTexto}
                      >
                        {camposTexto}
                      </span>
                    ) : (
                      <span className="text-ink-muted/40">—</span>
                    )}
                  </td>

                  {/* destinos */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span title={f.destinoEmail.ativo ? `E-mail: ${f.destinoEmail.endereco}` : "E-mail desativado"}>
                        <Mail size={14} className={f.destinoEmail.ativo ? "text-success" : "text-ink-muted/30"} />
                      </span>
                      <span title={f.destinoWhatsApp.ativo ? `WhatsApp: ${f.destinoWhatsApp.numero}` : "WhatsApp desativado"}>
                        <MessageSquare size={14} className={f.destinoWhatsApp.ativo ? "text-success" : "text-ink-muted/30"} />
                      </span>
                      <span title={f.destinoWebhook.ativo ? `Webhook: ${f.destinoWebhook.url}` : "Webhook desativado"}>
                        <Globe size={14} className={f.destinoWebhook.ativo ? "text-success" : "text-ink-muted/30"} />
                      </span>
                    </div>
                  </td>

                  {/* usado em */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {f.usadoEm.length === 0 ? (
                        <span className="text-ink-muted/40">—</span>
                      ) : (
                        f.usadoEm.map((uso) => (
                          <a
                            key={uso}
                            href={uso}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-ink-muted hover:text-primary"
                          >
                            <ExternalLink size={10} className="shrink-0" />
                            <span className="truncate" style={{ maxWidth: 160 }}>{uso}</span>
                          </a>
                        ))
                      )}
                    </div>
                  </td>

                  {/* leads 30d */}
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-[12px] text-ink">{f.envios30d}</span>
                  </td>

                  {/* status */}
                  <td className="px-4 py-3">
                    <span className={cn("text-[12px] font-medium", f.ativo ? "text-success" : "text-ink-muted")}>
                      {f.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                  {/* duplicar */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => duplicar(f)}
                      title="Duplicar formulário"
                      className="flex h-6 w-6 items-center justify-center rounded text-ink-muted opacity-0 transition-opacity hover:bg-secondary hover:text-ink group-hover:opacity-100"
                    >
                      <Copy size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* rodapé */}
      <div className="border-t border-line px-4 py-3">
        <span className="text-[11.5px] text-ink-muted">
          {formularios.length} formulário{formularios.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
