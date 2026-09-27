"use client";

import { useState, useMemo, useEffect } from "react";
import { Lock, Trash2, AlertTriangle, AlertCircle, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Botao, Badge, Entrada } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Redirect } from "@/mock/types";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtHits(n: number) {
  return n.toLocaleString("pt-BR");
}

type Cadeia = { ids: string[]; caminhos: string[] };
type Loop = { ids: [string, string]; caminhos: [string, string] };

function detectar(redirects: Redirect[]): { cadeias: Cadeia[]; loops: Loop[] } {
  const porOrigem = new Map(redirects.map((r) => [r.origem, r]));
  const cadeias: Cadeia[] = [];
  const loops: Loop[] = [];
  const vistoCadeia = new Set<string>();

  for (const r of redirects) {
    // Loop: A→B e B→A
    const inverso = porOrigem.get(r.destino);
    if (inverso && inverso.destino === r.origem && !vistoCadeia.has(`${r.id}|${inverso.id}`)) {
      loops.push({ ids: [r.id, inverso.id], caminhos: [r.origem, r.destino] });
      vistoCadeia.add(`${r.id}|${inverso.id}`);
      vistoCadeia.add(`${inverso.id}|${r.id}`);
    }

    // Cadeia: A→B e B→C
    const proximo = porOrigem.get(r.destino);
    if (proximo && proximo.destino !== r.origem) {
      // Seguir até o fim da cadeia
      const ids = [r.id];
      const caminhos = [r.origem, r.destino];
      let cur = proximo;
      const visitados = new Set([r.origem, r.destino]);
      while (cur) {
        ids.push(cur.id);
        if (visitados.has(cur.destino)) break;
        visitados.add(cur.destino);
        caminhos.push(cur.destino);
        cur = porOrigem.get(cur.destino)!;
      }
      if (ids.length > 1 && !vistoCadeia.has(ids[0])) {
        cadeias.push({ ids, caminhos });
        ids.forEach((id) => vistoCadeia.add(id));
      }
    }
  }

  return { cadeias, loops };
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export default function RedirectsPage() {
  const { redirects: redirectsMock, adicionarRedirect, deletarRedirect } = useStore();
  const [redirects, setRedirects] = useState(redirectsMock);

  useEffect(() => {
    fetch("/api/redirects")
      .then(r => r.json())
      .then(data => { if (data.ok && Array.isArray(data.redirects)) setRedirects(data.redirects); })
      .catch(console.error);
  }, []);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "manual" | "construtor">("todos");

  // Formulário de adição
  const [mostrarForm, setMostrarForm] = useState(false);
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [codigo, setCodigo] = useState<301 | 302 | 410>(301);
  const [erroForm, setErroForm] = useState("");
  const [avisoForm, setAvisoForm] = useState("");

  // Achatar cadeias — mapa de id → novo destino
  const [achatados, setAchatados] = useState<Record<string, string>>({});

  /* lista efetiva com achatamentos aplicados */
  const redirectsEfetivos = useMemo(() => {
    return redirects.map((r) =>
      achatados[r.id] ? { ...r, destino: achatados[r.id] } : r,
    );
  }, [redirects, achatados]);

  const { cadeias, loops } = useMemo(() => detectar(redirectsEfetivos), [redirectsEfetivos]);

  const filtrados = useMemo(() => {
    let lista = redirectsEfetivos;
    if (filtro === "manual") lista = lista.filter((r) => r.criadoPor === "manual");
    if (filtro === "construtor") lista = lista.filter((r) => r.criadoPor === "slug-alterado");
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter(
        (r) => r.origem.includes(q) || r.destino.includes(q),
      );
    }
    return lista;
  }, [redirectsEfetivos, filtro, busca]);

  function achatar(cadeia: Cadeia) {
    // Achatar: o primeiro redirect aponta para o último destino da cadeia
    const primeiro = cadeia.ids[0];
    const ultimoDestino = cadeia.caminhos[cadeia.caminhos.length - 1];
    setAchatados((prev) => ({ ...prev, [primeiro]: ultimoDestino }));
  }

  function salvarRedirect() {
    setErroForm("");
    setAvisoForm("");

    if (!origem.startsWith("/")) {
      setErroForm("Origem deve começar com /");
      return;
    }
    if (!destino.startsWith("/") && !destino.startsWith("https://")) {
      setErroForm("Destino deve começar com / ou https://");
      return;
    }

    const porOrigem = new Map(redirectsEfetivos.map((r) => [r.origem, r]));
    const porDestino = new Map(redirectsEfetivos.map((r) => [r.destino, r]));

    // Loop: novo A→B, e já existe B→A
    const existeInverso = porOrigem.get(destino);
    if (existeInverso && existeInverso.destino === origem) {
      setErroForm(
        `Loop detectado: esta regra criaria o ciclo ${origem} → ${destino} → ${origem}.`,
      );
      return;
    }

    // Cadeia: novo A→B e já existe B→C
    const existeProximo = porOrigem.get(destino);
    if (existeProximo) {
      setAvisoForm(
        `Aviso: ${destino} já redireciona para ${existeProximo.destino}. Considere apontar diretamente para o destino final.`,
      );
    }

    adicionarRedirect({
      id: `r${Date.now()}`,
      origem,
      destino,
      codigo,
      criadoPor: "manual",
      hits: 0,
      data: new Date().toISOString().slice(0, 10),
    });

    setOrigem("");
    setDestino("");
    setCodigo(301);
    setMostrarForm(false);
    setAvisoForm("");
  }

  const CODIGO_COR: Record<number, string> = {
    301: "text-primary border-primary/30 bg-primary/10",
    302: "text-accent border-accent/30 bg-accent/10",
    410: "text-ink-muted border-line bg-secondary",
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="sticky top-[52px] z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <h1 className="text-[14px] font-semibold text-ink">Redirects</h1>
        <Botao
          variante="primario"
          tamanho="sm"
          onClick={() => setMostrarForm((v) => !v)}
        >
          <Plus size={13} />
          {mostrarForm ? "Cancelar" : "Adicionar redirect"}
        </Botao>
      </div>

      <div className="flex-1 px-6 py-5 space-y-4">

        {/* Loops */}
        {loops.map((loop, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-[var(--radius)] border border-danger/40 bg-danger/5 px-4 py-3"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-danger" />
            <p className="text-[12px] text-danger">
              <span className="font-semibold">Loop detectado:</span>{" "}
              {loop.caminhos[0]} → {loop.caminhos[1]} → {loop.caminhos[0]}. Corrija manualmente removendo um dos dois redirects.
            </p>
          </div>
        ))}

        {/* Cadeias */}
        {cadeias.map((cadeia, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-4 rounded-[var(--radius)] border border-accent/40 bg-accent/5 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-[12px] text-ink">
                  <span className="font-semibold text-accent">Cadeia detectada:</span>{" "}
                  {cadeia.caminhos.join(" → ")}
                </p>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">
                  Sugestão: achatar para{" "}
                  <span className="font-mono text-[10.5px]">
                    {cadeia.caminhos[0]} → {cadeia.caminhos[cadeia.caminhos.length - 1]}
                  </span>
                </p>
              </div>
            </div>
            <Botao variante="secundario" tamanho="sm" onClick={() => achatar(cadeia)}>
              Achatar
            </Botao>
          </div>
        ))}

        {/* Filtros */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[320px]">
            <Entrada
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por URL…"
            />
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as typeof filtro)}
            className="rounded-[var(--radius)] border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos</option>
            <option value="manual">Manual</option>
            <option value="construtor">Construtor</option>
          </select>
          <span className="text-[11.5px] text-ink-muted">
            {filtrados.length} redirect{filtrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tabela */}
        <div className="overflow-hidden rounded-[var(--radius)] border border-line">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left text-[11px] font-medium text-ink-muted">
                <th className="px-4 py-2.5">Origem</th>
                <th className="px-4 py-2.5">Destino</th>
                <th className="px-3 py-2.5 w-16">Código</th>
                <th className="px-3 py-2.5 w-28">Criado por</th>
                <th className="px-3 py-2.5 w-20 text-right">Hits</th>
                <th className="px-3 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-ink-muted">
                    Nenhum redirect encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((r, idx) => {
                  const travado = r.criadoPor === "slug-alterado";
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b border-line",
                        idx % 2 === 0 ? "bg-surface" : "bg-surface-2",
                        travado && "opacity-70",
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono text-[11.5px] text-ink">
                        {r.origem}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11.5px] text-ink-muted">
                        {r.destino}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-block rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-medium",
                            CODIGO_COR[r.codigo],
                          )}
                        >
                          {r.codigo}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {travado ? (
                          <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                            <Lock size={11} />
                            Construtor
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-muted">Manual</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[11.5px] text-ink-muted tabular-nums">
                        {fmtHits(r.hits)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {!travado && (
                          <button
                            onClick={() => {
                              deletarRedirect(r.id);
                              setRedirects(prev => prev.filter(x => x.id !== r.id));
                              fetch(`/api/redirects/${r.id}`, { method: "DELETE" }).catch(console.error);
                            }}
                            className="rounded p-1 text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger"
                            title="Remover redirect"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Formulário de adição */}
        {mostrarForm && (
          <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 space-y-3">
            <p className="text-[12.5px] font-semibold text-ink">Novo redirect</p>

            {erroForm && (
              <div className="flex items-start gap-2 rounded-[var(--radius)] border border-danger/40 bg-danger/5 px-3 py-2">
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-danger" />
                <p className="text-[12px] text-danger">{erroForm}</p>
              </div>
            )}
            {avisoForm && (
              <div className="flex items-start gap-2 rounded-[var(--radius)] border border-accent/40 bg-accent/5 px-3 py-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-[12px] text-accent">{avisoForm}</p>
              </div>
            )}

            <div className="grid grid-cols-[1fr_1fr_100px] gap-3">
              <div>
                <p className="mb-1 text-[11px] font-medium text-ink-muted">Origem</p>
                <Entrada
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  placeholder="/url-antiga"
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium text-ink-muted">Destino</p>
                <Entrada
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="/url-nova"
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium text-ink-muted">Código</p>
                <select
                  value={codigo}
                  onChange={(e) => setCodigo(Number(e.target.value) as 301 | 302 | 410)}
                  className="w-full rounded-[var(--radius)] border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:border-primary focus:outline-none"
                >
                  <option value={301}>301 — Permanente</option>
                  <option value={302}>302 — Temporário</option>
                  <option value={410}>410 — Removido</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Botao variante="secundario" tamanho="sm" onClick={() => { setMostrarForm(false); setErroForm(""); setAvisoForm(""); }}>
                Cancelar
              </Botao>
              <Botao variante="primario" tamanho="sm" onClick={salvarRedirect}>
                Salvar redirect
              </Botao>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
