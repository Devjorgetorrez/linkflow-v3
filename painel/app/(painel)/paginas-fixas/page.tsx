"use client";

/**
 * Páginas fixas (home, sobre, contato) — título/meta description de SEO
 * dessas três páginas (Etapa B da Fase 6, A06/A13). Os outros campos delas
 * (nome, slogan, NAP, horários…) já são editados em Configurações — aqui é
 * só o que faltava: `site.paginas.<pagina>.{titulo,metaDescription}`,
 * criado por /api/config/paginas em cima de lib/site-config.ts.
 *
 * IMPORTANTE (documentado também no relatório da tarefa): o motor Astro
 * ainda NÃO lê este bloco — os títulos/meta de home/sobre/contato continuam
 * fixos nos .astro de cada tema até alguém ligar a leitura de
 * `site.paginas.*` lá. Esta tela grava o dado; a próxima etapa (fora deste
 * escopo) é o motor consumir.
 */

import { AlertCircle, Info, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { Botao, Campo, Contador, Painel, PainelRecolhivel } from "@/components/ui";

const PAGINAS = [
  { id: "home", label: "Home" },
  { id: "sobre", label: "Sobre" },
  { id: "contato", label: "Contato" },
] as const;
type PaginaId = (typeof PAGINAS)[number]["id"];

const TITULO_MAX = 70;
const META_MAX = 165;

interface CampoPagina { titulo: string; metaDescription: string }

export default function PaginasFixasPage() {
  const { data: sessao } = useSession();
  const papel = (sessao?.user as { papel?: string } | undefined)?.papel;
  const podeEditar = papel === "administrador" || papel === "editor";

  const [dados, setDados] = useState<Record<PaginaId, CampoPagina> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState<PaginaId | null>(null);
  const [salvoId, setSalvoId] = useState<PaginaId | null>(null);

  useEffect(() => {
    fetch("/api/config/paginas", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setDados(data.paginas);
        else setErro(data.erro || "Não consegui carregar.");
      })
      .catch(() => setErro("Não consegui carregar."))
      .finally(() => setCarregando(false));
  }, []);

  const editarCampo = (id: PaginaId, campo: keyof CampoPagina, valor: string) => {
    setDados((d) => (d ? { ...d, [id]: { ...d[id], [campo]: valor } } : d));
    setSalvoId(null);
  };

  const salvar = async (id: PaginaId) => {
    if (!dados || !podeEditar) return;
    setSalvandoId(id);
    setErro("");
    try {
      const res = await fetch("/api/config/paginas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina: id, titulo: dados[id].titulo, metaDescription: dados[id].metaDescription }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErro(data.erro || "Não consegui salvar.");
        return;
      }
      setSalvoId(id);
      setTimeout(() => setSalvoId((cur) => (cur === id ? null : cur)), 2500);
    } catch {
      setErro("Não consegui salvar (erro de rede).");
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4">
        <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">Páginas fixas</h1>
        <p className="mt-0.5 text-[11.5px] text-ink-muted">
          Título e meta description de busca da home, do sobre e do contato.
        </p>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-[var(--radius)] border border-line bg-surface-2 px-3 py-2.5 text-[11.5px] leading-snug text-ink-muted">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Os outros campos dessas páginas (nome do negócio, endereço, horários, redes sociais…) ficam em{" "}
          <span className="font-medium text-ink">Configurações</span>. Aqui é só o título e a descrição que aparecem
          no resultado de busca do Google para cada uma.
        </p>
      </div>

      {erro && (
        <p className="mb-3 flex items-center gap-1.5 rounded-[var(--radius)] border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          <AlertCircle size={12} /> {erro}
        </p>
      )}

      {carregando || !dados ? (
        <Painel>
          <p className="p-3 text-[12px] text-ink-muted">Carregando…</p>
        </Painel>
      ) : (
        <div className="space-y-2.5">
          {PAGINAS.map(({ id, label }) => {
            const v = dados[id];
            const tituloForaDaFaixa = v.titulo.length > TITULO_MAX;
            const metaForaDaFaixa = v.metaDescription.length > META_MAX;
            return (
              <PainelRecolhivel key={id} titulo={label}>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-[11px] font-medium text-ink-muted">Título (SEO)</span>
                      <Contador atual={v.titulo.length} max={TITULO_MAX} />
                    </div>
                    <input
                      value={v.titulo}
                      disabled={!podeEditar}
                      maxLength={TITULO_MAX}
                      onChange={(e) => editarCampo(id, "titulo", e.target.value)}
                      placeholder={`Título que aparece no Google para a página ${label.toLowerCase()}`}
                      className="w-full rounded-[var(--radius)] border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-primary disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-[11px] font-medium text-ink-muted">Meta description</span>
                      <Contador atual={v.metaDescription.length} max={META_MAX} />
                    </div>
                    <textarea
                      rows={3}
                      value={v.metaDescription}
                      disabled={!podeEditar}
                      maxLength={META_MAX}
                      onChange={(e) => editarCampo(id, "metaDescription", e.target.value)}
                      placeholder="Resumo exibido no resultado de busca."
                      className="w-full resize-y rounded-[var(--radius)] border border-line bg-surface px-2.5 py-1.5 text-[12px] leading-relaxed text-ink outline-none focus:border-primary disabled:opacity-60"
                    />
                    {(tituloForaDaFaixa || metaForaDaFaixa) && (
                      <p className="mt-1 text-[10.5px] text-danger">Passou do limite de caracteres.</p>
                    )}
                  </div>
                  {podeEditar && (
                    <div className="flex items-center gap-2">
                      <Botao
                        tamanho="sm"
                        disabled={salvandoId === id || tituloForaDaFaixa || metaForaDaFaixa}
                        onClick={() => salvar(id)}
                      >
                        <Save size={11} /> {salvandoId === id ? "Salvando…" : "Salvar"}
                      </Botao>
                      {salvoId === id && <span className="text-[11px] text-success">Salvo</span>}
                    </div>
                  )}
                </div>
              </PainelRecolhivel>
            );
          })}
        </div>
      )}
    </div>
  );
}
