"use client";

import { AlertTriangle, Info, Lock, Shield } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { useStore, type CookieConfig } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AreaTexto, Campo, Entrada, Rotulo } from "@/components/ui";
import type { LegalPainel } from "@/lib/legal";

/* ------------------------------------------------------------------ */
/* Texto padrão derivado das categorias ativas                          */
/* ------------------------------------------------------------------ */

function gerarDescricaoBanner(categorias: CookieConfig["categorias"]): string {
  const extras: string[] = [];
  if (categorias.analiticos) extras.push("cookies de análise de audiência (Google Analytics)");
  if (categorias.marketing) extras.push("cookies de publicidade (Meta Pixel)");
  if (categorias.funcionais) extras.push("cookies de funcionalidade");

  if (extras.length === 0) {
    return "Usamos cookies necessários para o site funcionar. Você pode gerenciar suas preferências abaixo.";
  }
  const lista =
    extras.length === 1
      ? extras[0]
      : extras.slice(0, -1).join(", ") + " e " + extras.at(-1);
  return `Usamos cookies necessários para o site funcionar e, com sua permissão, ${lista}. Você escolhe quais aceitar.`;
}

/* ------------------------------------------------------------------ */
/* Preview fiel ao vanilla-cookieconsent v3                            */
/* ------------------------------------------------------------------ */

function BannerPreview({
  titulo,
  descricao,
  posicaoH,
  posicaoV,
  abaSelecionada,
}: {
  titulo: string;
  descricao: string;
  posicaoH: CookieConfig["posicaoH"];
  posicaoV: CookieConfig["posicaoV"];
  abaSelecionada: "banner" | "modal";
}) {
  const isCentro = posicaoV === "middle";

  const alignItems =
    posicaoV === "top" ? "flex-start" : posicaoV === "middle" ? "center" : "flex-end";
  const justifyContent =
    isCentro
      ? "center"
      : posicaoH === "left"
        ? "flex-start"
        : posicaoH === "right"
          ? "flex-end"
          : "center";

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[#f0f0f0]"
      style={{ height: 380 }}
    >
      {/* Conteúdo de fundo simulado */}
      <div className="absolute inset-0 select-none p-5 opacity-30">
        <div className="mb-3 h-4 w-1/3 rounded bg-gray-400" />
        <div className="mb-2 h-3 w-full rounded bg-gray-300" />
        <div className="mb-2 h-3 w-5/6 rounded bg-gray-300" />
        <div className="mb-5 h-3 w-4/6 rounded bg-gray-300" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded bg-gray-300" />
          <div className="h-24 rounded bg-gray-300" />
        </div>
      </div>

      {/* Overlay de fundo para modo Centro da tela */}
      {isCentro && (
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
      )}

      {/* Banner / Modal — posicionamento via style inline */}
      <div
        className="absolute inset-0 flex p-3"
        style={{ alignItems, justifyContent }}
      >
        {abaSelecionada === "banner" ? (
          <BannerCard titulo={titulo} descricao={descricao} />
        ) : (
          <ModalCard />
        )}
      </div>
    </div>
  );
}

function BannerCard({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div
      className="w-full max-w-lg rounded-[10px] bg-white p-4 shadow-lg"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}
    >
      <p className="mb-1 text-[13px] font-semibold text-gray-900">{titulo || "Este site usa cookies"}</p>
      <p className="mb-3 text-[11.5px] leading-relaxed text-gray-600">
        {descricao || "Mensagem do banner."}{" "}
        <span className="cursor-pointer text-blue-600 underline">
          Como usamos cookies e seus direitos
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button className="rounded-[6px] border border-gray-300 bg-white px-3 py-1.5 text-[11.5px] font-medium text-gray-700 transition hover:bg-gray-50">
          Preferências
        </button>
        <button className="rounded-[6px] border border-gray-800 bg-white px-3 py-1.5 text-[11.5px] font-medium text-gray-800 transition hover:bg-gray-50">
          Recusar todos
        </button>
        <button className="rounded-[6px] border border-gray-800 bg-white px-3 py-1.5 text-[11.5px] font-medium text-gray-800 transition hover:bg-gray-50">
          Aceitar todos
        </button>
      </div>
    </div>
  );
}

function ModalCard() {
  return (
    <div
      className="w-full max-w-md rounded-[10px] bg-white shadow-lg"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,.18)", maxHeight: 360, overflow: "hidden" }}
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-[13px] font-semibold text-gray-900">Preferências de privacidade</p>
      </div>
      <div className="space-y-2 overflow-y-auto px-4 py-3" style={{ maxHeight: 220 }}>
        {[
          { label: "Estritamente necessários", locked: true, checked: true },
          { label: "Análise (GA4)", locked: false, checked: false },
          { label: "Marketing", locked: false, checked: false },
          { label: "Funcionalidade", locked: false, checked: false },
        ].map((cat) => (
          <div
            key={cat.label}
            className="flex items-center justify-between rounded-[6px] border border-gray-100 px-3 py-2"
          >
            <span className="text-[11.5px] font-medium text-gray-700">{cat.label}</span>
            <div className="flex items-center gap-1.5">
              {cat.locked && <Lock size={10} className="text-gray-400" />}
              <div className={cn("h-4 w-8 rounded-full", cat.checked ? "bg-gray-800" : "bg-gray-200")} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 px-4 py-2.5">
        <p className="mb-2 text-[10.5px] text-gray-500">
          <span className="cursor-pointer text-blue-600 underline">Exercer meus direitos</span>
          {" · "}
          <span className="cursor-pointer text-gray-500 underline">Como usamos cookies e seus direitos</span>
        </p>
        <div className="flex gap-1.5">
          <button className="flex-1 rounded-[6px] border border-gray-300 py-1.5 text-[11px] font-medium text-gray-700">
            Recusar todos
          </button>
          <button className="flex-1 rounded-[6px] border border-gray-300 py-1.5 text-[11px] font-medium text-gray-700">
            Salvar
          </button>
          <button className="flex-1 rounded-[6px] border border-gray-800 py-1.5 text-[11px] font-medium text-gray-800">
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página principal                                                    */
/* ------------------------------------------------------------------ */

export default function CookiesPage() {
  const { cookieConfig: initConfig, setCookieConfig: salvarNoStore, politicaPublicada } = useStore();
  const [config, setConfigState] = useState(initConfig);
  const [aba, setAba] = useState<"banner" | "modal">("banner");
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");

  // Pré-preencher descrição do banner com nome do site real, e os textos
  // de finalidade por categoria com o que já foi salvo em dados/legal.json
  // (fonte de verdade — ver lib/legal.ts; entra também em legal.cookies[]
  // do site, junto com a base legal/retenção definidas na tela Política).
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config) return;
        const c = data.config;
        if (c.nome && !config.bannerDescricao) {
          setConfigState((prev) => ({
            ...prev,
            bannerDescricao: prev.bannerDescricao || `${c.nome} usa cookies para melhorar sua experiência.`,
          }));
        }
        const lp: Partial<LegalPainel> = data.config.legalPainel ?? {};
        if (lp.cookieAnaliticosFinalidade || lp.cookieMarketingFinalidade || lp.cookieFuncionaisFinalidade) {
          setConfigState((prev) => ({
            ...prev,
            categorias: {
              analiticos: lp.cookieAnaliticosFinalidade || prev.categorias.analiticos,
              marketing: lp.cookieMarketingFinalidade || prev.categorias.marketing,
              funcionais: lp.cookieFuncionaisFinalidade || prev.categorias.funcionais,
            },
          }));
        }
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function atualizar(patch: Partial<Omit<CookieConfig, "categorias">> & { categorias?: Partial<CookieConfig["categorias"]> }) {
    setConfigState((c) => ({
      ...c,
      ...patch,
      categorias: patch.categorias ? { ...c.categorias, ...patch.categorias } : c.categorias,
    }));
  }

  const cookieConfig = config;
  const setCookieConfig = atualizar;

  const descricaoGerada = gerarDescricaoBanner(config.categorias);
  const descricaoCustomizada =
    config.bannerDescricao !== "" && config.bannerDescricao !== descricaoGerada;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-6">
        <Shield size={15} className="text-[var(--primary)]" />
        <h1 className="text-[15px] font-semibold text-[var(--ink)]">Banner de cookies</h1>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 gap-8 px-6 py-6 lg:grid lg:grid-cols-[1fr_420px]">

        {/* ── Coluna esquerda: controles ── */}
        <div className="space-y-6">

          {/* Trava normativa */}
          <div className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3.5">
            <Info size={14} className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
            <p className="text-[12px] leading-relaxed text-[var(--ink-muted)]">
              <strong className="text-[var(--ink)]">Definido pela LGPD e pelo guia ANPD (out/2022):</strong>{" "}
              Botões "Recusar todos" e "Aceitar todos" sempre presentes com peso visual idêntico.
              Nenhuma categoria não necessária marcada por padrão.
              Recusa possível em um clique.
              Estes itens não são configuráveis.
            </p>
          </div>

          {/* Posição */}
          <div className="space-y-3">
            <div>
              <Campo label="Posição horizontal">
                <div className="flex gap-2">
                  {([
                    { value: "left", label: "Esquerda" },
                    { value: "center", label: "Centro" },
                    { value: "right", label: "Direita" },
                  ] as { value: CookieConfig["posicaoH"]; label: string }[]).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={cookieConfig.posicaoV === "middle"}
                      onClick={() => setCookieConfig({ posicaoH: value })}
                      className={cn(
                        "flex-1 rounded-[var(--radius)] border px-3 py-2 text-[12px] font-medium transition-colors",
                        cookieConfig.posicaoV === "middle"
                          ? "cursor-not-allowed border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] opacity-40"
                          : cookieConfig.posicaoH === value
                            ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] text-[var(--primary)]"
                            : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Campo>
              {cookieConfig.posicaoV === "middle" && (
                <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
                  Não se aplica ao banner centralizado — fica centrado nos dois eixos.
                </p>
              )}
            </div>

            <Campo label="Posição vertical">
              <div className="flex gap-2">
                {([
                  { value: "top", label: "Topo" },
                  { value: "middle", label: "Centro da tela" },
                  { value: "bottom", label: "Rodapé" },
                ] as { value: CookieConfig["posicaoV"]; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCookieConfig({ posicaoV: value })}
                    className={cn(
                      "flex-1 rounded-[var(--radius)] border px-3 py-2 text-[12px] font-medium transition-colors",
                      cookieConfig.posicaoV === value
                        ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] text-[var(--primary)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Campo>
          </div>

          {/* Texto do banner */}
          <div className="space-y-3">
            <Campo label="Título do banner">
              <Entrada
                value={cookieConfig.bannerTitulo}
                onChange={(e) => setCookieConfig({ bannerTitulo: e.target.value })}
                placeholder="Este site usa cookies"
              />
            </Campo>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <Rotulo>Descrição do banner</Rotulo>
                {descricaoCustomizada && (
                  <button
                    type="button"
                    onClick={() => setCookieConfig({ bannerDescricao: descricaoGerada })}
                    className="text-[11px] text-[var(--primary)] underline"
                  >
                    Restaurar padrão
                  </button>
                )}
              </div>
              <AreaTexto
                value={cookieConfig.bannerDescricao}
                onChange={(e) => setCookieConfig({ bannerDescricao: e.target.value })}
                rows={3}
                placeholder={descricaoGerada}
              />
              {!descricaoCustomizada && (
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                  Texto gerado das categorias ativas. Edite para personalizar.
                </p>
              )}
            </div>

            <Campo label="Introdução do modal de preferências">
              <AreaTexto
                value={cookieConfig.modalDescricao}
                onChange={(e) => setCookieConfig({ modalDescricao: e.target.value })}
                rows={3}
                placeholder="Texto introdutório do modal de categorias..."
              />
            </Campo>
          </div>

          {/* Descrições das categorias */}
          <div className="space-y-3">
            <Rotulo>Descrição das categorias</Rotulo>
            <div className="divide-y divide-[var(--line)] rounded-[var(--radius)] border border-[var(--line)]">

              {/* Necessários — somente-leitura */}
              <div className="bg-[var(--surface-2)] px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[var(--ink)]">Estritamente necessários</span>
                  <Lock size={11} className="text-[var(--ink-muted)]" />
                  <span className="ml-auto rounded border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--ink-muted)]">
                    não editável
                  </span>
                </div>
                <p className="text-[11.5px] text-[var(--ink-muted)]">
                  Funcionamento básico do site (segurança, autenticação de sessão, preferências técnicas).
                  Base legal: legítimo interesse. O visitante não pode desativar esta categoria.
                </p>
              </div>

              {/* Analíticos */}
              <div className="px-4 py-3">
                <p className="mb-1.5 text-[12px] font-medium text-[var(--ink)]">Análise (GA4)</p>
                <AreaTexto
                  value={cookieConfig.categorias.analiticos}
                  onChange={(e) =>
                    setCookieConfig({ categorias: { ...cookieConfig.categorias, analiticos: e.target.value } })
                  }
                  rows={2}
                />
              </div>

              {/* Marketing */}
              <div className="px-4 py-3">
                <p className="mb-1.5 text-[12px] font-medium text-[var(--ink)]">Marketing</p>
                <AreaTexto
                  value={cookieConfig.categorias.marketing}
                  onChange={(e) =>
                    setCookieConfig({ categorias: { ...cookieConfig.categorias, marketing: e.target.value } })
                  }
                  rows={2}
                />
              </div>

              {/* Funcionais */}
              <div className="px-4 py-3">
                <p className="mb-1.5 text-[12px] font-medium text-[var(--ink)]">Funcionalidade</p>
                <AreaTexto
                  value={cookieConfig.categorias.funcionais}
                  onChange={(e) =>
                    setCookieConfig({ categorias: { ...cookieConfig.categorias, funcionais: e.target.value } })
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Registro de consentimento */}
          <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
            <div className="flex items-start justify-between gap-4 px-4 py-4">
              <div>
                <p className="text-[13px] font-medium text-[var(--ink)]">Registro de consentimento</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--ink-muted)]">
                  Envia data/hora, versão da política, categorias aceitas/recusadas e um
                  identificador aleatório para o mesmo destino configurado em leads. NÃO envia IP.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={cookieConfig.registroConsentimento}
                onClick={() => setCookieConfig({ registroConsentimento: !cookieConfig.registroConsentimento })}
                className={cn(
                  "mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
                  cookieConfig.registroConsentimento ? "bg-[var(--primary)]" : "bg-[var(--line)]",
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform",
                    cookieConfig.registroConsentimento && "translate-x-[18px]",
                  )}
                />
              </button>
            </div>
            {!cookieConfig.registroConsentimento && (
              <div className="flex items-start gap-2 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] px-4 py-3">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[var(--danger)]" />
                <p className="text-[11.5px] leading-relaxed text-[var(--danger)]">
                  Sem registro, não há como comprovar o consentimento obtido, e a prova cabe ao
                  controlador (art. 38, LGPD). Mantenha ligado exceto se outro sistema registra.
                </p>
              </div>
            )}
          </div>

          {/* Nota de implementação */}
          <div className="space-y-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3.5">
            <p className="text-[12px] font-semibold text-[var(--ink)]">Implementação técnica (referência)</p>
            <ul className="space-y-1 text-[11.5px] text-[var(--ink-muted)]">
              <li>• Biblioteca: <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[11px]">vanilla-cookieconsent v3</code> (MIT, ~30 KB, auto-hospedada)</li>
              <li>• Scripts de terceiros como <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[11px]">type="text/plain"</code> até consentimento</li>
              <li>• Google Consent Mode: padrões negados antes de qualquer tag</li>
              <li>• <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[11px]">autoClear</code> ativo: revogação limpa _ga*, _gid, _gcl*, _fbp, _fbc</li>
              <li>• Link "Preferências de cookies" fixo no rodapé em todas as páginas</li>
              <li>• Âncoras <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[11px]">#cookies</code> e <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[11px]">#direitos</code> obrigatórias na política de privacidade</li>
            </ul>
          </div>

          {/* Bloqueio se política não publicada */}
          {!politicaPublicada && (
            <div className="space-y-2 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_5%,transparent)] px-4 py-3.5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--danger)]" />
                <p className="text-[12px] text-[var(--danger)]">
                  O banner precisa levar a algum lugar. Publique a política de privacidade antes de ativar o banner.
                </p>
              </div>
              <Link
                href="/privacidade/politica"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary)] underline"
              >
                Ir para Política de privacidade →
              </Link>
            </div>
          )}

          <button
            type="button"
            disabled={!politicaPublicada || salvando}
            onClick={async () => {
              salvarNoStore(config);
              setSalvando(true);
              try {
                const legalPainel: Partial<LegalPainel> = {
                  cookieAnaliticosFinalidade: config.categorias.analiticos,
                  cookieMarketingFinalidade: config.categorias.marketing,
                  cookieFuncionaisFinalidade: config.categorias.funcionais,
                };
                const r = await fetch("/api/config", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ legalPainel }),
                });
                const data = await r.json();
                setErroSalvar(data.ok ? "" : Object.values((data.erros ?? {}) as Record<string, string>).join(" ") || data.erro || "Não foi possível salvar.");
              } catch (err) {
                console.error("[privacidade/cookies] falha ao salvar:", err);
              } finally {
                setSalvando(false);
              }
            }}
            className={cn(
              "w-full rounded-[var(--radius)] py-2.5 text-[13px] font-medium transition-colors",
              politicaPublicada
                ? "bg-[var(--primary)] text-white hover:opacity-90"
                : "cursor-not-allowed bg-[var(--line)] text-[var(--ink-muted)]",
            )}
          >
            {salvando ? "Salvando…" : "Salvar configuração"}
          </button>
          {erroSalvar && <p className="text-xs" style={{ color: "var(--danger, #c0392b)" }}>{erroSalvar}</p>}

        </div>

        {/* ── Coluna direita: prévia ao vivo ── */}
        <div className="mt-6 lg:mt-0">
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-0.5">
              <button
                type="button"
                onClick={() => setAba("banner")}
                className={cn(
                  "flex-1 rounded-[4px] py-1.5 text-[12px] font-medium transition-colors",
                  aba === "banner"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                Banner
              </button>
              <button
                type="button"
                onClick={() => setAba("modal")}
                className={cn(
                  "flex-1 rounded-[4px] py-1.5 text-[12px] font-medium transition-colors",
                  aba === "modal"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                Modal preferências
              </button>
            </div>

            <BannerPreview
              titulo={cookieConfig.bannerTitulo}
              descricao={cookieConfig.bannerDescricao || descricaoGerada}
              posicaoH={cookieConfig.posicaoH}
              posicaoV={cookieConfig.posicaoV}
              abaSelecionada={aba}
            />

            <div className="space-y-1.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Travas normativas ativas
              </p>
              {[
                '"Recusar todos" no banner e no modal',
                "Peso visual idêntico em todos os botões",
                "Recusa em 1 clique (sem passar por preferências)",
                "Nenhuma categoria não necessária marcada",
                'Link "Como usamos cookies e seus direitos" no banner',
                'Link "Exercer meus direitos" no modal',
                'Link "Preferências de cookies" no rodapé',
              ].map((item) => (
                <p key={item} className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-muted)]">
                  <span className="text-[var(--success)]">✓</span> {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
