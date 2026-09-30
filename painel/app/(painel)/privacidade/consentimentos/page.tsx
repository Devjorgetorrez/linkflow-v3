"use client";

import { Download, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Botao, Painel, Vazio } from "@/components/ui";
import { hojeISOBrasil } from "@/lib/data-br";

/* ------------------------------------------------------------------ */
/* Tipos e helpers                                                       */
/* ------------------------------------------------------------------ */

interface RegistroConsentimento {
  id: string;
  data: string;
  escolha: "aceito" | "rejeitado" | "personalizado" | "informado";
  categorias?: { analiticos: boolean; marketing: boolean; funcionais: boolean };
  paginaOrigem: string;
  ipHash: string;
  versaoPolitica?: string;
  visitanteId?: string;
}

const ROTULO_ESCOLHA: Record<RegistroConsentimento["escolha"], string> = {
  aceito: "Aceitou tudo",
  rejeitado: "Rejeitou tudo",
  personalizado: "Personalizou",
  informado: "Só informado (necessário)",
};

function formatarData(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function categoriasResumo(r: RegistroConsentimento): string {
  if (!r.categorias) return "—";
  const ativas = Object.entries(r.categorias)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return ativas.length > 0 ? ativas.join(", ") : "nenhuma";
}

function paraCsv(lista: RegistroConsentimento[]): string {
  const cab = ["id", "data", "escolha", "analiticos", "marketing", "funcionais", "paginaOrigem", "versaoPolitica", "visitanteId", "ipHash"];
  const linhas = lista.map((r) => [
    r.id,
    r.data,
    r.escolha,
    r.categorias?.analiticos ? "sim" : "nao",
    r.categorias?.marketing ? "sim" : "nao",
    r.categorias?.funcionais ? "sim" : "nao",
    r.paginaOrigem,
    r.versaoPolitica ?? "",
    r.visitanteId ?? "",
    r.ipHash,
  ]);
  return [cab, ...linhas]
    .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function exportarCsv(lista: RegistroConsentimento[]) {
  const csv = "﻿" + paraCsv(lista); // BOM: acento correto ao abrir no Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consentimentos-${hojeISOBrasil()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Página                                                                */
/* ------------------------------------------------------------------ */

export default function ConsentimentosPage() {
  const [lista, setLista] = useState<RegistroConsentimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/consentimentos")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setErro(data.erro || "Não foi possível carregar os registros.");
          return;
        }
        setLista(data.consentimentos ?? []);
      })
      .catch(() => setErro("Sem conexão com o servidor."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-[52px] z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-ink-muted" />
          <h1 className="text-[14px] font-semibold text-ink">Consentimentos de cookies</h1>
        </div>
        <Botao variante="secundario" onClick={() => exportarCsv(lista)} disabled={lista.length === 0}>
          <Download size={12} /> Exportar CSV
        </Botao>
      </div>

      <div className="px-6 py-6">
        <p className="mb-4 max-w-2xl text-[12px] text-ink-muted">
          Cada linha é uma escolha registrada pelo banner de cookies do site — a prova de
          consentimento exigida pela LGPD (art. 8º, §2º: o ônus de provar cabe ao controlador).
          O identificador do visitante é anônimo (gerado no navegador dele); o IP nunca é
          gravado, só um hash. Registros com mais de 5 anos são descartados automaticamente —
          teto do padrão de mercado (3 a 5 anos) para auditoria retroativa; ainda não é
          parecer jurídico formal, confirmar com advogado.
        </p>

        {carregando ? (
          <p className="text-[13px] text-ink-muted">Carregando…</p>
        ) : erro ? (
          <p className="text-[13px] text-danger">{erro}</p>
        ) : lista.length === 0 ? (
          <Painel>
            <Vazio
              icone={<ShieldCheck size={18} />}
              titulo="Nenhum registro ainda"
              descricao="Aparece aqui assim que o primeiro visitante interagir com o banner de cookies do site."
            />
          </Painel>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius)] border border-line">
            <table className="w-full text-[12px]">
              <thead className="bg-surface-2 text-left text-ink-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Escolha</th>
                  <th className="px-3 py-2 font-medium">Categorias aceitas</th>
                  <th className="px-3 py-2 font-medium">Página</th>
                  <th className="px-3 py-2 font-medium">Versão da política</th>
                  <th className="px-3 py-2 font-medium">Visitante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {lista.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-ink">{formatarData(r.data)}</td>
                    <td className="px-3 py-2 text-ink">{ROTULO_ESCOLHA[r.escolha] ?? r.escolha}</td>
                    <td className="px-3 py-2 text-ink-muted">{categoriasResumo(r)}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 font-mono text-[11px] text-ink-muted" title={r.paginaOrigem}>
                      {r.paginaOrigem || "—"}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{r.versaoPolitica || "—"}</td>
                    <td className="max-w-[140px] truncate px-3 py-2 font-mono text-[10.5px] text-ink-muted" title={r.visitanteId}>
                      {r.visitanteId || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
