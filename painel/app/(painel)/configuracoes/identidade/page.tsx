"use client";

import { AlertTriangle, Building2, Globe, Lock } from "lucide-react";
import { useState, useEffect } from "react";

import { Campo, Entrada, Rotulo } from "@/components/ui";
import { cnpjValido, semCnpj } from "@/lib/site-config";
import { diffCampos, enviarConfig } from "@/lib/site-config-cliente";
import { useDominio } from "@/lib/useDominio";

/* ------------------------------------------------------------------ */
/* Bloco de seção                                                      */
/* ------------------------------------------------------------------ */

function Secao({
  titulo,
  icone: Icone,
  children,
}: {
  titulo: string;
  icone: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icone size={15} className="text-[var(--ink-muted)]" />
        <h2 className="text-sm font-semibold text-[var(--ink)]">{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

function MsgErro({ texto }: { texto?: string }) {
  if (!texto) return null;
  return <p className="mt-1 text-[11px] text-[var(--danger)]">{texto}</p>;
}

type Valores = { nome: string; slogan: string; anoFundacao: string; cnpj: string };
const VAZIO: Valores = { nome: "", slogan: "", anoFundacao: "", cnpj: "" };

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function IdentidadePage() {
  const dominio = useDominio();

  const [v, setV] = useState<Valores>({ ...VAZIO });
  // Valores como vieram do servidor: o Salvar envia só o que difere deles.
  const [original, setOriginal] = useState<Valores>({ ...VAZIO });
  const [carregado, setCarregado] = useState(false);
  const [gateAviso, setGateAviso] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [feedbackSalvar, setFeedbackSalvar] = useState<"ok" | "erro" | null>(null);
  const [mensagem, setMensagem] = useState("");

  // Carregar config real do servidor ao montar
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          const c = data.config;
          const lido: Valores = {
            nome: String(c.nome ?? ""),
            slogan: String(c.slogan ?? ""),
            anoFundacao: c.anoFundacao == null ? "" : String(c.anoFundacao),
            cnpj: String(c.cnpj ?? ""),
          };
          setV(lido);
          setOriginal(lido);
          setCarregado(true);
        }
      })
      .catch(console.error);
  }, []);

  const set = (k: keyof Valores) => (valor: string) => setV((x) => ({ ...x, [k]: valor }));

  async function salvar() {
    setMensagem("");
    setFeedbackSalvar(null);
    if (!carregado) {
      setFeedbackSalvar("erro");
      setMensagem("Os dados do site ainda não foram carregados — nada foi enviado.");
      return;
    }

    const { alterados } = diffCampos(original, v, "");

    // Validação inline (mesmos validadores do servidor)
    const e: Record<string, string> = {};
    if (alterados.nome !== undefined && alterados.nome.length < 2) e.nome = "Informe o nome do negócio (mínimo 2 caracteres).";
    if (alterados.cnpj && !semCnpj(alterados.cnpj) && !cnpjValido(alterados.cnpj)) {
      e.cnpj = "CNPJ inválido — confira os 14 dígitos (ou escreva \"não possui\").";
    }
    if (alterados.anoFundacao) {
      const a = Number(alterados.anoFundacao);
      if (!Number.isInteger(a) || a < 1800 || a > new Date().getFullYear()) e.anoFundacao = "Ano de fundação inválido.";
    }
    if (Object.keys(e).length) {
      setErros(e);
      setFeedbackSalvar("erro");
      setMensagem("Corrija os campos destacados. Nada foi enviado.");
      return;
    }
    setErros({});

    if (Object.keys(alterados).length === 0) {
      setFeedbackSalvar("ok");
      setMensagem("Nada foi alterado.");
      setTimeout(() => setFeedbackSalvar(null), 3000);
      return;
    }

    setSalvando(true);
    const r = await enviarConfig(alterados);
    setSalvando(false);
    if (!r.ok) {
      setErros(r.erros);
      setFeedbackSalvar("erro");
      setMensagem(r.erro);
      return;
    }
    setOriginal({ ...v, ...alterados });
    setGateAviso(false);
    setFeedbackSalvar("ok");
    setMensagem(r.aviso);
    setTimeout(() => setFeedbackSalvar(null), r.aviso ? 8000 : 3000);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Identidade</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Nome, slogan e dados legais do site.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={salvar}
            disabled={salvando}
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-ink)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {salvando ? "Salvando…" : "Salvar alterações"}
          </button>
          {feedbackSalvar === "ok" && (
            <span className="text-[11px] text-[var(--success)]">Salvo{mensagem ? ` — ${mensagem}` : ""}</span>
          )}
          {feedbackSalvar === "erro" && (
            <span className="max-w-xs text-right text-[11px] text-[var(--danger)]">{mensagem || "Erro ao salvar."}</span>
          )}
        </div>
      </div>

      {/* ── Identidade do site ─────────────────────────── */}
      <Secao titulo="Identidade do site" icone={Globe}>
        <div className="space-y-4">
          {/* Nome do site — com gate */}
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Rotulo>Nome do site</Rotulo>
              <span className="rounded bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                impacto global
              </span>
            </div>
            <Entrada
              value={v.nome}
              onChange={(e) => {
                set("nome")(e.target.value);
                setGateAviso(true);
              }}
              aviso={gateAviso}
              invalido={!!erros.nome}
              placeholder="Nome do site"
            />
            <MsgErro texto={erros.nome} />
            {gateAviso && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--accent)]">
                <AlertTriangle size={11} />
                Alterar o nome atualiza o schema, og:site_name e o title de todas as páginas.
              </p>
            )}
          </div>

          {/* Slogan */}
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Rotulo>Slogan</Rotulo>
            </div>
            <Entrada
              value={v.slogan}
              onChange={(e) => set("slogan")(e.target.value)}
              placeholder="Frase curta de posicionamento"
            />
            <MsgErro texto={erros.slogan} />
          </div>
        </div>

        {/* Campos travados */}
        <div className="mt-5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
            <Lock size={11} />
            <span>Definido pelo LinkFlow — somente leitura</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {[
              { label: "Domínio", valor: dominio || "não configurado" },
              { label: "www canônico", valor: "Sem www" },
              { label: "Idioma", valor: "pt-BR" },
              { label: "Fuso horário", valor: "America/Sao_Paulo" },
            ].map(({ label, valor }) => (
              <div key={label}>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-[var(--ink)]">{valor}</p>
              </div>
            ))}
          </div>
        </div>
      </Secao>

      {/* ── Dados legais ─────────────────────────────── */}
      <Secao titulo="Dados legais" icone={Building2}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="CNPJ">
            <Entrada
              value={v.cnpj}
              onChange={(e) => set("cnpj")(e.target.value)}
              invalido={!!erros.cnpj}
              placeholder="00.000.000/0000-00"
            />
            <MsgErro texto={erros.cnpj} />
            <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
              Se o negócio não tem CNPJ, escreva &quot;não possui&quot;.
            </p>
          </Campo>

          <Campo label="Fundado em">
            <Entrada
              value={v.anoFundacao}
              onChange={(e) => set("anoFundacao")(e.target.value)}
              invalido={!!erros.anoFundacao}
              placeholder="Ano"
              maxLength={4}
            />
            <MsgErro texto={erros.anoFundacao} />
          </Campo>
        </div>
      </Secao>

      {/* ── Estrutura do site — somente leitura ─────────── */}
      <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={13} className="text-[var(--ink-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--ink)]">Estrutura do site</h2>
          <span className="ml-auto text-[10px] text-[var(--ink-muted)]">
            Definido pelo LinkFlow
          </span>
        </div>
        <div className="space-y-2 font-mono text-[11px]">
          {/* URL plana (regra do Jorge): categoria nunca entra no caminho —
              nem do artigo nem do serviço. Mesma tabela de lib/urls-publicas.ts. */}
          {[
            { camada: "Página inicial", url: "/" },
            { camada: "Blog — índice", url: "/blog" },
            { camada: "Artigo", url: "/[slug]" },
            { camada: "Serviços — pilar", url: "/servicos" },
            { camada: "Serviço interno", url: "/[slug]" },
            { camada: "Página institucional", url: "/[slug]" },
          ].map(({ camada, url }) => (
            <div key={camada} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-[var(--ink-muted)]">{camada}</span>
              <span className="text-[var(--ink)]">{url}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
