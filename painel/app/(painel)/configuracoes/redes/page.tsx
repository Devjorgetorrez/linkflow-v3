"use client";

import { ExternalLink, Share2 } from "lucide-react";
import { useState, useEffect } from "react";

import { Campo, Entrada } from "@/components/ui";
import { useStore, type ConfigRedes } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Rede social config                                                  */
/* ------------------------------------------------------------------ */

const REDES: { key: keyof ConfigRedes; label: string; placeholder: string; prefixo?: string }[] = [
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
  const { configRedes, setConfigRedes } = useStore();

  const [local, setLocal] = useState<ConfigRedes>({ ...configRedes });

  // Carregar dados reais ao montar
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config?.redes) return;
        const r = data.config.redes;
        setLocal((prev) => ({
          ...prev,
          instagram: r.instagram ?? prev.instagram,
          facebook: r.facebook ?? prev.facebook,
          youtube: r.youtube ?? prev.youtube,
          linkedin: r.linkedin ?? prev.linkedin,
          tiktok: r.tiktok ?? prev.tiktok,
          twitter: r.twitter ?? prev.twitter,
          pinterest: r.pinterest ?? prev.pinterest,
        }));
      })
      .catch(console.error);
  }, []);

  function salvar() {
    setConfigRedes(local);
    // Persistir via API
    fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instagram: local.instagram,
        facebook: local.facebook,
        youtube: local.youtube,
        linkedin: local.linkedin,
        tiktok: local.tiktok,
        twitter: local.twitter,
        pinterest: local.pinterest,
      }),
    }).catch(console.error);
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
        <button
          onClick={salvar}
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-ink)] transition-opacity hover:opacity-90"
        >
          Salvar alterações
        </button>
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
