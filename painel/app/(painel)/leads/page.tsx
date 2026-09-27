"use client";

import {
  Mail,
  MessageSquare,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Botao, Vazio } from "@/components/ui";
import { numeroWhatsApp } from "@/lib/formularios-regras";
import { useStore } from "@/lib/store";
import type { Lead, StatusLead } from "@/mock/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- helpers */

const STATUS_LABELS: Record<StatusLead, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  convertido: "Convertido",
  descartado: "Descartado",
};

const STATUS_CORES: Record<StatusLead, string> = {
  novo: "text-primary bg-primary/10",
  em_contato: "text-accent bg-accent/10",
  convertido: "text-success bg-success/10",
  descartado: "text-ink-muted bg-secondary",
};

const STATUS_LISTA: StatusLead[] = ["novo", "em_contato", "convertido", "descartado"];

function formatarData(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function linkWhatsApp(l: Lead): string {
  const n = numeroWhatsApp(l.telefone);
  if (!n) return "";
  const primeiro = l.nome.trim().split(/\s+/)[0];
  const texto = `Olá, ${primeiro}! Recebemos a sua mensagem pelo site e estamos entrando em contato.`;
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}

function linkEmail(l: Lead): string {
  if (!l.email) return "";
  return `mailto:${l.email}?subject=${encodeURIComponent("Sobre a sua mensagem enviada pelo site")}`;
}

function utmResumo(l: Lead): string {
  return [l.utm.source, l.utm.medium, l.utm.campaign].filter(Boolean).join(" / ");
}

function exportarCSV(leads: Lead[]) {
  const cabecalho = ["ID", "Nome", "E-mail", "Telefone", "Mensagem", "Formulário", "Data", "Status", "Origem", "UTM Source", "UTM Medium", "UTM Campaign", "LGPD Aceite"];
  const linhas = leads.map((l) => [
    l.id, l.nome, l.email, l.telefone, l.mensagem, l.formularioNome,
    l.data, STATUS_LABELS[l.status], l.paginaOrigem,
    l.utm.source, l.utm.medium, l.utm.campaign,
    l.lgpdAceite ? "Sim" : "Não",
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const csv = [cabecalho.join(","), ...linhas].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------- painel lateral */

interface PainelLeadProps {
  lead: Lead;
  onFechar: () => void;
  onAtualizarStatus: (status: StatusLead) => void;
  onExcluir: () => void;
  ocupado: boolean;
}

function PainelLead({ lead, onFechar, onAtualizarStatus, onExcluir, ocupado }: PainelLeadProps) {
  const temUTM = lead.utm.source || lead.utm.medium || lead.utm.campaign || lead.utm.term || lead.utm.content;
  const temExtras = Object.keys(lead.camposExtras ?? {}).length > 0;
  const wa = linkWhatsApp(lead);
  const mail = linkEmail(lead);

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onFechar} />
      <div className="fixed right-0 top-0 z-40 flex h-screen w-[400px] flex-col border-l border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold text-ink">{lead.nome}</p>
            <p className="text-[11.5px] text-ink-muted">{lead.formularioNome} · {formatarData(lead.data)}</p>
          </div>
          <button onClick={onFechar} className="rounded p-1 text-ink-muted hover:text-ink" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-line px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Dados</p>
            <dl className="space-y-1.5 text-[12px]">
              {lead.email && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">E-mail</dt>
                  <dd className="min-w-0 break-all text-ink">{lead.email}</dd>
                </div>
              )}
              {lead.telefone && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">Telefone</dt>
                  <dd className="text-ink">{lead.telefone}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Página</dt>
                <dd className="min-w-0 break-all font-mono text-[11px] text-ink">{lead.paginaOrigem || "—"}</dd>
              </div>
            </dl>
          </div>

          {lead.mensagem && (
            <div className="border-b border-line px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Mensagem</p>
              <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">{lead.mensagem}</p>
            </div>
          )}

          {temExtras && (
            <div className="border-b border-line px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Campos extras</p>
              <dl className="space-y-1.5 text-[12px]">
                {Object.entries(lead.camposExtras).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="w-28 shrink-0 text-ink-muted">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {temUTM && (
            <div className="border-b border-line px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">UTM</p>
              <dl className="space-y-1.5 text-[12px]">
                {(["source", "medium", "campaign", "term", "content"] as const).map((k) =>
                  lead.utm[k] ? (
                    <div key={k} className="flex gap-2">
                      <dt className="w-20 shrink-0 capitalize text-ink-muted">{k}</dt>
                      <dd className="font-mono text-[11px] text-ink">{lead.utm[k]}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </div>
          )}

          <div className="border-b border-line px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">LGPD</p>
            <p className="text-[12px] text-ink">
              {lead.lgpdAceite
                ? <>Aceite registrado em <span className="font-mono text-[11px]">{formatarData(lead.lgpdData)}</span></>
                : <span className="text-ink-muted">Sem aceite registrado</span>}
            </p>
          </div>

          <div className="px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Status</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_LISTA.map((s) => (
                <button
                  key={s}
                  onClick={() => onAtualizarStatus(s)}
                  disabled={ocupado}
                  className={cn(
                    "rounded-[var(--radius)] border py-1.5 text-[12px] font-medium transition-colors disabled:opacity-60",
                    lead.status === s
                      ? STATUS_CORES[s] + " border-transparent"
                      : "border-line text-ink-muted hover:border-ink-muted hover:text-ink",
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-line px-4 py-3">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-line py-2 text-[12px] font-medium text-ink-muted transition-colors hover:border-success hover:text-success"
            >
              <MessageSquare size={14} />
              Responder no WhatsApp
            </a>
          )}
          {mail && (
            <a
              href={mail}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-line py-2 text-[12px] font-medium text-ink-muted transition-colors hover:border-primary hover:text-primary"
            >
              <Mail size={14} />
              Enviar e-mail
            </a>
          )}
          <button
            type="button"
            onClick={onExcluir}
            disabled={ocupado}
            title="Excluir lead"
            className="flex items-center justify-center rounded-[var(--radius)] border border-line px-3 text-ink-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- page */

export default function LeadsPage() {
  const { leads, leadsCarregados, recarregarLeads, formularios, recarregarFormularios } = useStore();

  // Sempre relê ao abrir a tela (leads chegam pelo site a qualquer momento).
  useEffect(() => {
    void recarregarLeads();
    void recarregarFormularios();
  }, [recarregarLeads, recarregarFormularios]);

  // Leads chegam pelo site a qualquer hora: relê a cada 20 s com a aba visível e ao voltar para ela.
  useEffect(() => {
    const atualizar = () => { if (document.visibilityState === "visible") void recarregarLeads(); };
    const timer = setInterval(atualizar, 20_000);
    document.addEventListener("visibilitychange", atualizar);
    window.addEventListener("focus", atualizar);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", atualizar);
      window.removeEventListener("focus", atualizar);
    };
  }, [recarregarLeads]);

  const [busca, setBusca] = useState("");
  const [filtroFormulario, setFiltroFormulario] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusLead>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [leadAbertoId, setLeadAbertoId] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const leadAberto = leads.find((l) => l.id === leadAbertoId) ?? null;

  const q = busca.trim().toLowerCase();
  const qDig = q.replace(/\D/g, "");
  const leadsVisiveis = leads.filter((l) => {
    if (q) {
      const acha =
        l.nome.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.mensagem.toLowerCase().includes(q) ||
        l.paginaOrigem.toLowerCase().includes(q) ||
        (qDig.length >= 3 && l.telefone.replace(/\D/g, "").includes(qDig));
      if (!acha) return false;
    }
    if (filtroFormulario !== "todos" && l.formularioId !== filtroFormulario) return false;
    if (filtroStatus !== "todos" && l.status !== filtroStatus) return false;
    if (filtroPeriodo !== "todos") {
      const dias = filtroPeriodo === "7d" ? 7 : filtroPeriodo === "30d" ? 30 : 90;
      const limite = new Date();
      limite.setDate(limite.getDate() - dias);
      if (new Date(l.data) < limite) return false;
    }
    return true;
  });

  async function atualizarStatusLead(id: string, status: StatusLead) {
    setErro("");
    setOcupado(true);
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setErro(data.erro || "Não foi possível alterar o status."); return; }
      await recarregarLeads();
    } catch {
      setErro("Não consegui falar com o servidor. O status não foi alterado.");
    } finally {
      setOcupado(false);
    }
  }

  async function excluirLead(l: Lead) {
    if (!window.confirm(`Excluir o lead de ${l.nome}? Esta ação não pode ser desfeita.`)) return;
    setErro("");
    setOcupado(true);
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(l.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setErro(data.erro || "Não foi possível excluir o lead."); return; }
      setLeadAbertoId(null);
      await recarregarLeads();
    } catch {
      setErro("Não consegui falar com o servidor. O lead não foi excluído.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-0">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
              Leads recebidos
            </h1>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">
              {leadsCarregados
                ? `${leads.length} lead${leads.length !== 1 ? "s" : ""} no total · ${leadsVisiveis.length} exibido${leadsVisiveis.length !== 1 ? "s" : ""}`
                : "Carregando…"}
            </p>
          </div>
          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={() => exportarCSV(leadsVisiveis)}
            disabled={!leadsCarregados || leadsVisiveis.length === 0}
          >
            Exportar CSV
          </Botao>
        </div>

        {erro && (
          <p role="alert" className="border-b border-danger/30 bg-danger/10 px-6 py-2 text-[12px] text-danger">{erro}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-6 py-2.5">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, contato ou mensagem…"
              className="h-8 rounded-[var(--radius)] border border-line bg-surface-2 pl-7 pr-3 text-[12px] text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none"
              style={{ width: 260 }}
            />
          </div>

          <select
            value={filtroFormulario}
            onChange={(e) => setFiltroFormulario(e.target.value)}
            className="h-8 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os formulários</option>
            {formularios.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>

          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="h-8 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink focus:border-primary focus:outline-none"
          >
            <option value="todos">Qualquer período</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as "todos" | StatusLead)}
            className="h-8 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os status</option>
            {STATUS_LISTA.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {!leadsCarregados ? (
          <div className="py-16 text-center text-[12px] text-ink-muted">Carregando leads…</div>
        ) : leadsVisiveis.length === 0 ? (
          <div className="py-16">
            <Vazio titulo={leads.length === 0 ? "Nenhum lead recebido ainda." : "Nenhum lead encontrado com esses filtros."} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-line bg-surface">
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Nome</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Contato</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Mensagem</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Origem</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Data</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leadsVisiveis.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setLeadAbertoId(lead.id)}
                    className={cn(
                      "cursor-pointer align-top transition-colors hover:bg-secondary/60",
                      leadAberto?.id === lead.id && "bg-secondary/80",
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{lead.nome}</span>
                      <div className="text-[11px] text-ink-muted">{lead.formularioNome}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-ink-muted">
                        {lead.email && <span>{lead.email}</span>}
                        {lead.telefone && <span>{lead.telefone}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[260px] truncate text-ink-muted" title={lead.mensagem}>
                        {lead.mensagem || <span className="text-ink-muted/40">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[180px] truncate font-mono text-[11px] text-ink-muted" title={lead.paginaOrigem}>
                        {lead.paginaOrigem || "—"}
                      </span>
                      {utmResumo(lead) && (
                        <span className="block max-w-[180px] truncate text-[10.5px] text-ink-muted/70" title={utmResumo(lead)}>
                          {utmResumo(lead)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                      {formatarData(lead.data)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        disabled={ocupado}
                        onChange={(e) => void atualizarStatusLead(lead.id, e.target.value as StatusLead)}
                        className={cn("rounded-full border-0 px-2 py-0.5 text-[11px] font-medium focus:outline-none", STATUS_CORES[lead.status])}
                        aria-label={`Status de ${lead.nome}`}
                      >
                        {STATUS_LISTA.map((st) => (
                          <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {linkWhatsApp(lead) && (
                          <a href={linkWhatsApp(lead)} target="_blank" rel="noopener noreferrer" title="Responder no WhatsApp" className="text-ink-muted hover:text-success">
                            <MessageSquare size={14} />
                          </a>
                        )}
                        {lead.email && (
                          <a href={linkEmail(lead)} title="Enviar e-mail" className="text-ink-muted hover:text-primary">
                            <Mail size={14} />
                          </a>
                        )}
                        <button type="button" onClick={() => void excluirLead(lead)} disabled={ocupado} title="Excluir lead" className="text-ink-muted hover:text-danger disabled:opacity-40">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-line px-4 py-3">
          <span className="text-[11.5px] text-ink-muted">
            {leadsVisiveis.length} lead{leadsVisiveis.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {leadAberto && (
        <PainelLead
          lead={leadAberto}
          onFechar={() => setLeadAbertoId(null)}
          onAtualizarStatus={(status) => void atualizarStatusLead(leadAberto.id, status)}
          onExcluir={() => void excluirLead(leadAberto)}
          ocupado={ocupado}
        />
      )}
    </>
  );
}
