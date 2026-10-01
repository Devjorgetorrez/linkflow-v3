"use client";

import { useEffect, useState } from "react";
import {
  useStore,
  CHAVES_TOKENS,
  FONTES_DISPLAY,
  FONTES_CORPO,
  PARES_FONTE,
  RAIOS,
  DENSIDADES,
  type ChaveToken,
  type Tokens,
} from "@/lib/store";
import Link from "next/link";
import { Botao, Campo, Entrada } from "@/components/ui";
import { BotaoSalvarVisual, DescricaoSite, MidiaSite, useIdentidadeVisual } from "@/components/IdentidadeVisual";
import { cn } from "@/lib/utils";
import { URL_BLOG, urlAutor, urlCategoria } from "@/lib/urls-publicas";
import { avaliarToken } from "@/motor/contraste";

/* ------------------------------------------------------------------ */
/* Preview do site                                                     */
/* ------------------------------------------------------------------ */

function SitePreview({
  nomeSite,
  tagline,
  tokens,
  raioValor,
  fonteDisplay,
  fonteCorpo,
}: {
  nomeSite: string;
  tagline: string;
  tokens: Record<string, string>;
  raioValor: string;
  fonteDisplay: string;
  fonteCorpo: string;
}) {
  const displayStack = FONTES_DISPLAY.find((f) => f.id === fonteDisplay)?.stack ?? "sans-serif";
  const corpoStack = FONTES_CORPO.find((f) => f.id === fonteCorpo)?.stack ?? "sans-serif";

  return (
    <div
      className="overflow-hidden rounded-lg border border-line shadow-sm"
      style={{ background: tokens["surface"] ?? "#f5f7fb" }}
    >
      {/* header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: tokens["surface-2"] ?? "#fff",
          borderBottom: `1px solid ${tokens["line"] ?? "#e3e8f0"}`,
        }}
      >
        <span
          className="text-[13px] font-bold"
          style={{ fontFamily: displayStack, color: tokens["ink"] ?? "#1b2a4a" }}
        >
          {nomeSite || "Nome do site"}
        </span>
        <div className="flex gap-3">
          {["Serviços", "Sobre", "Blog", "Contato"].map((item) => (
            <span
              key={item}
              className="text-[10px]"
              style={{ fontFamily: corpoStack, color: tokens["ink-muted"] ?? "#667694" }}
            >
              {item}
            </span>
          ))}
        </div>
        <div
          className="rounded px-2.5 py-1 text-[10px] font-medium"
          style={{
            borderRadius: raioValor,
            background: tokens["primary"] ?? "#0b5cff",
            color: tokens["primary-ink"] ?? "#fff",
            fontFamily: corpoStack,
          }}
        >
          Agendar
        </div>
      </div>

      {/* hero */}
      <div
        className="px-6 py-8 text-center"
        style={{ background: tokens["surface"] ?? "#f5f7fb" }}
      >
        <div
          className="mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[9px] font-medium"
          style={{
            borderRadius: "9999px",
            background: tokens["secondary"] ?? "#eef2f9",
            color: tokens["ink-muted"] ?? "#667694",
          }}
        >
          Atendimento presencial e on-line
        </div>
        <h1
          className="mt-2 text-[17px] font-bold leading-tight"
          style={{ fontFamily: displayStack, color: tokens["ink"] ?? "#1b2a4a" }}
        >
          {tagline || "Título do site"}
        </h1>
        <p
          className="mt-2 text-[10px] leading-relaxed"
          style={{ fontFamily: corpoStack, color: tokens["ink-muted"] ?? "#667694", maxWidth: 300, margin: "8px auto 0" }}
        >
          Uma frase curta sobre o negócio: o que faz, onde atende e o diferencial.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <div
            className="px-3 py-1.5 text-[10px] font-medium"
            style={{
              borderRadius: raioValor,
              background: tokens["primary"] ?? "#0b5cff",
              color: tokens["primary-ink"] ?? "#fff",
              fontFamily: corpoStack,
            }}
          >
            Fale conosco
          </div>
          <div
            className="px-3 py-1.5 text-[10px] font-medium"
            style={{
              borderRadius: raioValor,
              background: tokens["secondary"] ?? "#eef2f9",
              color: tokens["ink"] ?? "#1b2a4a",
              fontFamily: corpoStack,
            }}
          >
            Saber mais
          </div>
        </div>
      </div>

      {/* cards */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-6">
        {["Serviço 1", "Serviço 2", "Serviço 3"].map((s) => (
          <div
            key={s}
            className="p-3"
            style={{
              borderRadius: raioValor,
              background: tokens["surface-2"] ?? "#fff",
              border: `1px solid ${tokens["line"] ?? "#e3e8f0"}`,
            }}
          >
            <div
              className="mb-1 h-2 w-2/3 rounded"
              style={{ background: tokens["primary"] ?? "#0b5cff", opacity: 0.2 }}
            />
            <p
              className="text-[9px] font-semibold"
              style={{ fontFamily: displayStack, color: tokens["ink"] ?? "#1b2a4a" }}
            >
              {s}
            </p>
            <p
              className="mt-0.5 text-[8px]"
              style={{ fontFamily: corpoStack, color: tokens["ink-muted"] ?? "#667694" }}
            >
              Saiba mais sobre este serviço
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

type Aba = "identidade" | "cores" | "tipografia" | "forma";

const ABAS: { id: Aba; label: string }[] = [
  { id: "identidade", label: "Identidade" },
  { id: "cores", label: "Cores" },
  { id: "tipografia", label: "Tipografia" },
  { id: "forma", label: "Forma" },
];

const TOKEN_LABELS: Record<string, string> = {
  "primary": "Primária",
  "primary-ink": "Texto sobre primária",
  "secondary": "Secundária (fundo sutil)",
  "accent": "Destaque",
  "ink": "Texto",
  "ink-muted": "Texto discreto",
  "surface": "Superfície",
  "surface-2": "Superfície elevada",
  "line": "Bordas",
  "success": "Sucesso",
  "danger": "Perigo",
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PersonalizarPage() {
  const { aparencia, setAparencia } = useStore();

  const [abaAtiva, setAbaAtiva] = useState<Aba>("identidade");
  const [salvando, setSalvando] = useState(false);

  // Cores reais do layout ativo — somente leitura, lidas de _astro/src/styles/tokens.css
  // pela rota /api/aparencia/cores (ver A51/A52). Nunca um valor fixo/genérico.
  const [coresReais, setCoresReais] = useState<Tokens | null>(null);
  const [coresTema, setCoresTema] = useState<string | null>(null);
  const [coresErro, setCoresErro] = useState<string | null>(null);
  const [coresCarregando, setCoresCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/aparencia/cores")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setCoresErro(data.erro || "Não consegui ler as cores do layout.");
          return;
        }
        setCoresReais(data.tokens as Tokens);
        setCoresTema(data.tema as string);
      })
      .catch(() => setCoresErro("Não consegui ler as cores do layout."))
      .finally(() => setCoresCarregando(false));
  }, []);

  /* local state — espelha aparencia */
  // Nome e slogan vêm do site real (config/site.ts) e só se editam em Configurações › Identidade.
  const [nomeSite, setNomeSite] = useState("");
  const [tagline, setTagline] = useState("");
  const [erroSite, setErroSite] = useState(false);
  // Descrição, logos e favicon: mesmos campos e mesma API de Configurações › Identidade
  const visual = useIdentidadeVisual();
  const { hidratar } = visual;
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config) { setErroSite(true); return; }
        setNomeSite(String(data.config.nome ?? ""));
        setTagline(String(data.config.slogan ?? ""));
        hidratar(data.config);
      })
      .catch(() => setErroSite(true));
  }, [hidratar]);
  const [fonteDisplay, setFonteDisplay] = useState(aparencia.fonteDisplay);
  const [fonteCorpo, setFonteCorpo] = useState(aparencia.fonteCorpo);
  const [raio, setRaio] = useState(aparencia.raio);
  const [densidade, setDensidade] = useState(aparencia.densidade);
  const raioValor = RAIOS.find((r) => r.id === raio)?.valor ?? "8px";
  const densidadeValor = DENSIDADES.find((d) => d.id === densidade)?.valor ?? "0.5rem";

  function salvar() {
    setSalvando(true);
    setAparencia({ fonteDisplay, fonteCorpo, raio, densidade });
    setTimeout(() => setSalvando(false), 800);
  }

  // Carrega fontes só no painel admin para prévia (produção usa @fontsource)
  useEffect(() => {
    const id = "preview-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Playfair+Display:wght@400;700&family=Lora:wght@400;700&family=Instrument+Serif&family=Bricolage+Grotesque:wght@200..800&family=Sora:wght@400;700&family=Outfit:wght@400;700&family=Space+Grotesk:wght@400;700&family=Inter:wght@400;500&family=Manrope:wght@400;500&family=Figtree:wght@400;500&family=Public+Sans:wght@400;500&family=Source+Sans+3:wght@400;500&family=Karla:wght@400;500&family=Nunito+Sans:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      {/* header sticky */}
      <div className="sticky top-[52px] z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <h1 className="text-[14px] font-semibold text-ink">Personalizar</h1>
        {/* Cores é somente-leitura (A51/A52): não há onde gravar cor por cliente hoje,
            a cor vem do layout escolhido em Aparência › Layout. */}
        {abaAtiva !== "cores" && (
          <Botao variante="primario" tamanho="sm" onClick={salvar}>
            {salvando ? "Salvando…" : "Salvar"}
          </Botao>
        )}
      </div>

      <div className="grid flex-1 grid-cols-[520px_1fr] divide-x divide-line">
        {/* ── coluna esquerda ── */}
        <div className="flex flex-col">
          {/* abas */}
          <div className="flex border-b border-line bg-surface">
            {ABAS.map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={cn(
                  "px-4 py-2.5 text-[12px] transition-colors",
                  abaAtiva === aba.id
                    ? "border-b-2 border-primary font-semibold text-primary"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {aba.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* ── Identidade ── */}
            {abaAtiva === "identidade" && (
              <div className="space-y-4">
                <Campo label="Nome do site">
                  <Entrada value={nomeSite} readOnly className="cursor-not-allowed opacity-60" placeholder={erroSite ? "Não foi possível ler o site" : ""} />
                </Campo>
                <Campo label="Slogan">
                  <Entrada value={tagline} readOnly className="cursor-not-allowed opacity-60" placeholder={erroSite ? "Não foi possível ler o site" : ""} />
                </Campo>
                <p className="text-[11px] text-ink-muted">
                  Somente leitura, espelha o site.{" "}
                  <Link href="/configuracoes/identidade" className="text-primary underline">
                    Editar em Configurações › Identidade
                  </Link>
                </p>

                {/* Descrição, logos e favicon: gravam no site (config/site.ts) pelo botão abaixo */}
                <div className="space-y-4 rounded-[var(--radius)] border border-line bg-surface-2 p-3">
                  <DescricaoSite v={visual} />
                  <MidiaSite v={visual} incluirCompartilhamento={false} />
                  <BotaoSalvarVisual v={visual} />
                </div>

                {/* Estrutura do site — somente-leitura */}
                <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-3">
                  <p className="mb-2.5 text-[11.5px] font-medium text-ink">Estrutura do site</p>
                  <p className="mb-3 text-[10.5px] text-ink-muted">
                    Definido pelo LinkFlow. Para alterar a estrutura de endereços é necessário mover
                    todos os posts e emitir 301s correspondentes — peça ao agente (Claude Code).
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Página inicial", valor: "Início (/)" },
                      { label: "Índice do blog", valor: URL_BLOG },
                      { label: "Categoria", valor: urlCategoria("<slug>") },
                      { label: "Autor", valor: urlAutor("<slug>") },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded border border-line/50 bg-surface px-3 py-1.5">
                        <span className="text-[11px] text-ink-muted">{item.label}</span>
                        <span className="font-mono text-[11px] text-ink">{item.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Cores ── */}
            {abaAtiva === "cores" && (
              <div className="space-y-1.5">
                <p className="mb-2 text-[11.5px] text-ink-muted">
                  As cores vêm do layout escolhido em{" "}
                  <Link href="/aparencia/temas" className="font-medium text-primary underline">
                    Aparência › Layout
                  </Link>
                  . Para mudar a paleta, troque de layout ou peça um ajuste ao Claude Code.
                </p>

                {coresCarregando && (
                  <p className="rounded-[var(--radius)] border border-line bg-surface-2 px-3 py-2.5 text-[11.5px] text-ink-muted">
                    Lendo as cores do site…
                  </p>
                )}

                {!coresCarregando && coresErro && (
                  <p className="rounded-[var(--radius)] border border-line bg-surface-2 px-3 py-2.5 text-[11.5px] text-danger">
                    {coresErro}
                  </p>
                )}

                {!coresCarregando && !coresErro && coresReais && (
                  <>
                    <p className="mb-1 font-mono text-[10.5px] text-ink-muted">
                      Layout ativo: {coresTema ?? "—"}
                    </p>
                    {(CHAVES_TOKENS as unknown as ChaveToken[]).map((chave) => {
                      const valorAtual = coresReais[chave];
                      const info = avaliarToken(chave, coresReais);
                      const ratioStr = info.ratio.toFixed(1) + ":1";

                      return (
                        <div
                          key={chave}
                          className="rounded-[var(--radius)] border border-line bg-surface-2 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            {/* swatch — somente leitura */}
                            <div
                              className="h-8 w-8 shrink-0 rounded-full border-2 border-line"
                              style={{ background: valorAtual }}
                            />

                            {/* label + var */}
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium text-ink">
                                {TOKEN_LABELS[chave] ?? chave}
                              </p>
                              <p className="font-mono text-[10px] text-ink-muted">--{chave}</p>
                            </div>

                            {/* valor hex — somente leitura */}
                            <span className="w-[82px] shrink-0 rounded border border-line bg-surface px-2 py-1 text-right font-mono text-[11.5px] text-ink-muted">
                              {valorAtual}
                            </span>
                          </div>

                          {/* linha de contraste */}
                          <div className="mt-1.5 flex items-center gap-1.5 pl-11">
                            <span
                              className={cn(
                                "text-[10.5px] font-semibold tabular-nums",
                                info.passa ? "text-success" : "text-danger",
                              )}
                            >
                              {ratioStr}
                            </span>
                            <span className="text-[10.5px] text-ink-muted">·</span>
                            <span className="text-[10.5px] text-ink-muted">{info.label}</span>
                            <span className="text-[10.5px] text-ink-muted">·</span>
                            <span
                              className={cn(
                                "text-[10.5px] font-medium",
                                info.passa ? "text-success" : "text-danger",
                              )}
                            >
                              {info.passa
                                ? "passa AA"
                                : `não passa (mín ${info.minRatio.toFixed(1)}:1)`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* ── Tipografia ── */}
            {abaAtiva === "tipografia" && (
              <div className="space-y-6">
                {/* Par sugerido */}
                <div>
                  <p className="mb-2 text-[11.5px] font-medium text-ink">Par sugerido</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PARES_FONTE.map((par) => {
                      const dStack = FONTES_DISPLAY.find((f) => f.id === par.display)?.stack ?? "sans-serif";
                      const cStack = FONTES_CORPO.find((f) => f.id === par.corpo)?.stack ?? "sans-serif";
                      const ativo = fonteDisplay === par.display && fonteCorpo === par.corpo;
                      return (
                        <button
                          key={par.id}
                          onClick={() => { setFonteDisplay(par.display); setFonteCorpo(par.corpo); }}
                          className={cn(
                            "rounded-[var(--radius)] border px-3 py-2.5 text-left transition-colors",
                            ativo ? "border-primary bg-primary/5" : "border-line bg-surface-2 hover:border-ink-muted",
                          )}
                        >
                          <p className="text-[13px] font-bold text-ink leading-tight" style={{ fontFamily: dStack }}>
                            {par.nome.split(" + ")[0]}
                          </p>
                          <p className="text-[10.5px] text-ink-muted" style={{ fontFamily: cStack }}>
                            {par.nome.split(" + ")[1]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fonte de exibição */}
                <Campo label="Fonte de exibição (títulos)">
                  <select
                    value={fonteDisplay}
                    onChange={(e) => setFonteDisplay(e.target.value)}
                    className="w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-1.5 text-[12px] text-ink focus:border-primary focus:outline-none"
                  >
                    {FONTES_DISPLAY.map((f) => (
                      <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>{f.nome}</option>
                    ))}
                  </select>
                  <div
                    className="mt-3 rounded-[var(--radius)] border border-line bg-surface-2 p-4"
                    style={{ fontFamily: FONTES_DISPLAY.find((f) => f.id === fonteDisplay)?.stack }}
                  >
                    <p className="text-[22px] leading-tight text-ink" style={{ fontWeight: 700 }}>Título de exemplo</p>
                    <p className="mt-1 text-[14px] text-ink-muted" style={{ fontWeight: 400 }}>Título de seção de exemplo</p>
                  </div>
                </Campo>

                {/* Fonte do corpo */}
                <Campo label="Fonte do corpo (parágrafos)">
                  <select
                    value={fonteCorpo}
                    onChange={(e) => setFonteCorpo(e.target.value)}
                    className="w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-1.5 text-[12px] text-ink focus:border-primary focus:outline-none"
                  >
                    {FONTES_CORPO.map((f) => (
                      <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>{f.nome}</option>
                    ))}
                  </select>
                  <div
                    className="mt-3 rounded-[var(--radius)] border border-line bg-surface-2 p-4"
                    style={{ fontFamily: FONTES_CORPO.find((f) => f.id === fonteCorpo)?.stack }}
                  >
                    <p className="text-[13px] leading-relaxed text-ink" style={{ fontWeight: 400 }}>
                      Parágrafo de exemplo para conferir a leitura do texto corrido no site. Veja os{" "}
                      <span className="text-primary underline cursor-pointer">valores e horários disponíveis</span>.
                    </p>
                  </div>
                </Campo>
              </div>
            )}

            {/* ── Forma ── */}
            {abaAtiva === "forma" && (
              <div className="space-y-8">
                <div>
                  <p className="mb-3 text-[12px] font-medium text-ink">Raio dos cantos</p>
                  <div className="flex gap-3">
                    {RAIOS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRaio(r.id)}
                        className={cn(
                          "flex flex-1 flex-col items-center gap-2 rounded-[var(--radius)] border p-4 transition-colors",
                          raio === r.id ? "border-primary bg-primary/5" : "border-line bg-surface-2 hover:border-ink-muted",
                        )}
                      >
                        <div
                          className="h-10 w-16 border-2"
                          style={{
                            borderRadius: r.valor,
                            borderColor: raio === r.id ? "var(--primary)" : "var(--line)",
                            background: raio === r.id ? "var(--primary)" + "20" : "var(--surface)",
                          }}
                        />
                        <span className={cn("text-[12px] font-medium", raio === r.id ? "text-primary" : "text-ink")}>
                          {r.nome}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[12px] font-medium text-ink">Densidade</p>
                  <div className="flex gap-3">
                    {DENSIDADES.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDensidade(d.id)}
                        className={cn(
                          "flex flex-1 flex-col items-center gap-3 rounded-[var(--radius)] border p-4 transition-colors",
                          densidade === d.id ? "border-primary bg-primary/5" : "border-line bg-surface-2 hover:border-ink-muted",
                        )}
                      >
                        <div
                          className="rounded border-2 text-[12px] font-medium"
                          style={{
                            padding: `${d.valor} 1rem`,
                            borderRadius: raioValor,
                            borderColor: densidade === d.id ? "var(--primary)" : "var(--line)",
                            color: densidade === d.id ? "var(--primary)" : "var(--ink)",
                          }}
                        >
                          Botão
                        </div>
                        <span className={cn("text-[12px] font-medium", densidade === d.id ? "text-primary" : "text-ink")}>
                          {d.nome}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── coluna direita: preview ── */}
        <div className="flex flex-col bg-surface-2 p-6">
          <p className="mb-3 text-[11.5px] font-medium text-ink-muted">Pré-visualização</p>
          <div className="flex-1">
            <SitePreview
              nomeSite={nomeSite}
              tagline={tagline}
              tokens={coresReais ?? {}}
              raioValor={raioValor}
              fonteDisplay={fonteDisplay}
              fonteCorpo={fonteCorpo}
            />
          </div>
          <p className="mt-3 text-[10.5px] text-ink-muted/60">
            Prévia aproximada · cores do layout real ({coresTema ?? "carregando…"}), fonte reflete a seleção ao vivo
          </p>
        </div>
      </div>
    </div>
  );
}
