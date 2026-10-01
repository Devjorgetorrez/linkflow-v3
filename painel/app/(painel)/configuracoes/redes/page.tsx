"use client";

import { ExternalLink, Share2 } from "lucide-react";
import { useState, useEffect } from "react";

import { Campo, Entrada } from "@/components/ui";
import { urlValida } from "@/lib/site-config";
import { diffCampos, enviarConfig } from "@/lib/site-config-cliente";

type ChaveRede = "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok" | "threads" | "twitter" | "pinterest";
type ValoresRedes = Record<ChaveRede, string>;
const VAZIO: ValoresRedes = { instagram: "", facebook: "", linkedin: "", youtube: "", tiktok: "", threads: "", twitter: "", pinterest: "" };

/* ------------------------------------------------------------------ */
/* Rede social config                                                  */
/* ------------------------------------------------------------------ */

const REDES: { key: ChaveRede; label: string; placeholder: string; prefixo?: string }[] = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/usuario",
    prefixo: "instagram.com/",
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/pagina",
    prefixo: "facebook.com/",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/empresa",
    prefixo: "linkedin.com/",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@canal",
    prefixo: "youtube.com/",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@usuario",
    prefixo: "tiktok.com/",
  },
  {
    key: "threads",
    label: "Threads",
    placeholder: "https://threads.net/@usuario",
    prefixo: "threads.net/",
  },
  {
    key: "twitter",
    label: "X / Twitter",
    placeholder: "https://x.com/usuario",
    prefixo: "x.com/",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    placeholder: "https://pinterest.com/usuario",
    prefixo: "pinterest.com/",
  },
];

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function RedesPage() {
  const [local, setLocal] = useState<ValoresRedes>({ ...VAZIO });
  // Valores como vieram do servidor: o Salvar envia só o que difere deles.
  const [original, setOriginal] = useState<ValoresRedes>({ ...VAZIO });
  const [carregado, setCarregado] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [feedbackSalvar, setFeedbackSalvar] = useState<"ok" | "erro" | null>(null);
  const [mensagem, setMensagem] = useState("");

  // Carregar dados reais ao montar
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config) return;
        const r = data.config.redes ?? {};
        const lido = { ...VAZIO };
        for (const k of Object.keys(VAZIO) as ChaveRede[]) lido[k] = String(r[k] ?? "");
        setLocal(lido);
        setOriginal(lido);
        setCarregado(true);
      })
      .catch(console.error);
  }, []);

  async function salvar() {
    setMensagem("");
    setFeedbackSalvar(null);
    if (!carregado) {
      setFeedbackSalvar("erro");
      setMensagem("Os dados do site ainda não foram carregados — nada foi enviado.");
      return;
    }
    const { alterados, limpar } = diffCampos(original, local, "redes.");
    const e: Record<string, string> = {};
    for (const [k, val] of Object.entries(alterados)) {
      if (val && !urlValida(val)) e[`redes.${k}`] = "Endereço inválido — use o link completo (https://...).";
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
    const r = await enviarConfig({ ...alterados, ...(limpar.length ? { limpar } : {}) });
    setSalvando(false);
    if (!r.ok) {
      setErros(r.erros);
      setFeedbackSalvar("erro");
      setMensagem(r.erro);
      return;
    }
    setOriginal({ ...local, ...alterados });
    setFeedbackSalvar("ok");
    setMensagem(r.aviso);
    setTimeout(() => setFeedbackSalvar(null), r.aviso ? 8000 : 3000);
  }

  const redesAtivas = REDES.filter((r) => local[r.key]);
  const jsonLd = redesAtivas.length > 0
    ? JSON.stringify({ sameAs: redesAtivas.map((r) => local[r.key]) }, null, 2)
    : null;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Redes sociais</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            URLs das redes. Usadas no campo <code className="font-mono">sameAs</code> do schema e nos links do rodapé.
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

      <section className="mb-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Share2 size={15} className="text-[var(--ink-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--ink)]">Perfis nas redes</h2>
        </div>

        <div className="space-y-3">
          {REDES.map((rede) => (
            <Campo key={rede.key} label={rede.label}>
              <div className="flex items-center gap-2">
                <Entrada
                  value={local[rede.key]}
                  onChange={(e) => setLocal((l) => ({ ...l, [rede.key]: e.target.value }))}
                  placeholder={rede.placeholder}
                  invalido={!!erros[`redes.${rede.key}`]}
                  className="flex-1"
                />
                {local[rede.key] && (
                  <a
                    href={local[rede.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 text-[var(--ink-muted)] hover:text-[var(--primary)]"
                    title="Abrir perfil"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              {erros[`redes.${rede.key}`] && (
                <p className="mt-1 text-[11px] text-[var(--danger)]">{erros[`redes.${rede.key}`]}</p>
              )}
            </Campo>
          ))}
        </div>
      </section>

      {/* sameAs preview */}
      {jsonLd ? (
        <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="mb-3 text-[11px] font-medium text-[var(--ink-muted)]">
            Propriedade <code className="font-mono">sameAs</code> gerada
          </p>
          <pre className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
            {jsonLd}
          </pre>
        </section>
      ) : (
        <p className="text-xs text-[var(--ink-muted)]">
          Preencha ao menos uma URL para gerar o campo <code className="font-mono">sameAs</code>.
        </p>
      )}
    </div>
  );
}
