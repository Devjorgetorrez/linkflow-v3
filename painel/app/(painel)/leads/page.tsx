"use client";

import {
  Mail,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Botao, Entrada, Vazio } from "@/components/ui";
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

function formatarData(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function exportarCSV(leads: Lead[]) {
  const cabecalho = ["ID", "Nome", "E-mail", "Telefone", "Formulário", "Data", "Status", "Origem", "UTM Source", "UTM Medium", "UTM Campaign", "LGPD Aceite"];
  const linhas = leads.map((l) => [
    l.id, l.nome, l.email, l.telefone, l.formularioNome,
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
}

function PainelLead({ lead, onFechar, onAtualizarStatus }: PainelLeadProps) {
  const temUTM = lead.utm.source || lead.utm.medium || lead.utm.campaign || lead.utm.term || lead.utm.content;
  const temExtras = Object.keys(lead.camposExtras).length > 0;

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={onFechar}
      />
      {/* painel */}
      <div className="fixed right-0 top-0 z-40 flex h-screen w-[400px] flex-col border-l border-line bg-surface shadow-2xl">
        {/* cabeçalho */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold text-ink">{lead.nome}</p>
            <p className="text-[11.5px] text-ink-muted">{lead.formularioNome} · {formatarData(lead.data)}</p>
          </div>
          <button onClick={onFechar} className="rounded p-1 text-ink-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>

        {/* corpo rolável */}
        <div className="flex-1 overflow-y-auto">

          {/* dados */}
          <div className="border-b border-line px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Dados</p>
            <dl className="space-y-1.5 text-[12px]">
              {lead.email && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">E-mail</dt>
                  <dd className="min-w-0 truncate text-ink">{lead.email}</dd>
                </div>
              )}
              {lead.telefone && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">Telefone</dt>
                  <dd className="text-ink">{lead.telefone}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-ink-muted">Origem</dt>
                <dd className="min-w-0 truncate font-mono text-[11px] text-ink">{lead.paginaOrigem}</dd>
              </div>
            </dl>
          </div>

          {/* mensagem */}
          {lead.mensagem && (
            <div className="border-b border-line px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Mensagem</p>
              <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">{lead.mensagem}</p>
            </div>
          )}

          {/* campos extras */}
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

          {/* UTM */}
          {temUTM && (
            <div className="border-b border-line px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">UTM</p>
              <dl className="space-y-1.5 text-[12px]">
                {lead.utm.source   && <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-muted">Source</dt><dd className="font-mono text-[11px] text-ink">{lead.utm.source}</dd></div>}
                {lead.utm.medium   && <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-muted">Medium</dt><dd className="font-mono text-[11px] text-ink">{lead.utm.medium}</dd></div>}
                {lead.utm.campaign && <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-muted">Campaign</dt><dd className="font-mono text-[11px] text-ink">{lead.utm.campaign}</dd></div>}
                {lead.utm.term     && <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-muted">Term</dt><dd className="font-mono text-[11px] text-ink">{lead.utm.term}</dd></div>}
                {lead.utm.content  && <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-muted">Content</dt><dd className="font-mono text-[11px] text-ink">{lead.utm.content}</dd></div>}
              </dl>
            </div>
          )}

          {/* LGPD */}
          <div className="border-b border-line px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">LGPD</p>
            <p className="text-[12px] text-ink">
              {lead.lgpdAceite
                ? <>Aceite registrado em <span className="font-mono text-[11px]">{formatarData(lead.lgpdData)}</span></>
                : <span className="text-danger">Sem aceite registrado</span>
              }
            </p>
          </div>

          {/* status */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Status</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["novo", "em_contato", "convertido", "descartado"] as StatusLead[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onAtualizarStatus(s)}
                  className={cn(
                    "rounded-[var(--radius)] border py-1.5 text-[12px] font-medium transition-colors",
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

        {/* rodapé sticky com ações */}
        <div className="flex gap-2 border-t border-line px-4 py-3">
          {lead.telefone && (
            <a
              href={`https://wa.me/${lead.telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-line py-2 text-[12px] font-medium text-ink-muted transition-colors hover:border-success hover:text-success"
            >
              <MessageSquare size={14} />
              WhatsApp
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-line py-2 text-[12px] font-medium text-ink-muted transition-colors hover:border-primary hover:text-primary"
            >
              <Mail size={14} />
              E-mail
            </a>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- page */

export default function LeadsPage() {
  const { leads: leadsMock, formularios: formulariosMock, atualizarLead } = useStore();
  const [leads, setLeads] = useState(leadsMock);
  const [formularios, setFormularios] = useState(formulariosMock);

  // Carregar dados reais ao montar
  useEffect(() => {
    fetch("/api/leads")
      .then(r => r.json())
      .then(data => { if (data.ok && Array.isArray(data.leads)) setLeads(data.leads); })
      .catch(console.error);
    fetch("/api/formularios")
      .then(r => r.json())
      .then(data => { if (data.ok && Array.isArray(data.formularios)) setFormularios(data.formularios); })
      .catch(console.error);
  }, []);

  const [busca, setBusca] = useState("");
  const [filtroFormulario, setFiltroFormulario] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusLead>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [leadAberto, setLeadAberto] = useState<Lead | null>(null);

  /* filtros */
  const leadsVisiveis = leads.filter((l) => {
    if (busca) {
      const q = busca.toLowerCase();
      if (
        !l.nome.toLowerCase().includes(q) &&
        !l.email.toLowerCase().includes(q) &&
        !l.mensagem.toLowerCase().includes(q)
      ) return false;
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

  function atualizarStatusLead(id: string, status: StatusLead) {
    atualizarLead(id, { status });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(console.error);
    if (leadAberto?.id === id) {
      setLeadAberto((prev) => prev ? { ...prev, status } : prev);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-0">
        {/* cabeçalho */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
              Leads recebidos
            </h1>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">
              {leads.length} leads no total · {leadsVisiveis.length} exibidos
            </p>
          </div>
          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={() => exportarCSV(leadsVisiveis)}
          >
            Exportar CSV
          </Botao>
        </div>

        {/* filtros */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-6 py-2.5">
          {/* busca */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail…"
              className="h-8 rounded-[var(--radius)] border border-line bg-surface-2 pl-7 pr-3 text-[12px] text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none"
              style={{ width: 220 }}
            />
          </div>

          {/* formulário */}
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

          {/* período */}
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

          {/* status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as "todos" | StatusLead)}
            className="h-8 rounded-[var(--radius)] border border-line bg-surface-2 px-2 text-[12px] text-ink focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os status</option>
            {(["novo", "em_contato", "convertido", "descartado"] as StatusLead[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* tabela */}
        {leadsVisiveis.length === 0 ? (
          <div className="py-16">
            <Vazio titulo="Nenhum lead encontrado com esses filtros." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-line bg-surface">
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Nome</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">E-mail / Telefone</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Formulário</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Data</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leadsVisiveis.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setLeadAberto(lead)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-secondary/60",
                      leadAberto?.id === lead.id && "bg-secondary/80",
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{lead.nome}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-ink-muted">
                        {lead.email && <span>{lead.email}</span>}
                        {lead.telefone && <span>{lead.telefone}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{lead.formularioNome}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                      {formatarData(lead.data)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_CORES[lead.status])}>
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* rodapé */}
        <div className="border-t border-line px-4 py-3">
          <span className="text-[11.5px] text-ink-muted">
            {leadsVisiveis.length} lead{leadsVisiveis.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* painel lateral */}
      {leadAberto && (
        <PainelLead
          lead={leadAberto}
          onFechar={() => setLeadAberto(null)}
          onAtualizarStatus={(status) => atualizarStatusLead(leadAberto.id, status)}
        />
      )}
    </>
  );
}
