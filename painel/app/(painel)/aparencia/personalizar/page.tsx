"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import {
  useStore,
  CHAVES_TOKENS,
  FONTES_DISPLAY,
  FONTES_CORPO,
  PARES_FONTE,
  RAIOS,
  DENSIDADES,
  TOKENS_CLARO,
  TOKENS_ESCURO,
  type ChaveToken,
} from "@/lib/store";
import { AreaTexto, Botao, Campo, Entrada, Thumb } from "@/components/ui";
import { cn } from "@/lib/utils";
import { avaliarToken } from "@/motor/contraste";
import type { Midia } from "@/mock/types";

/* ------------------------------------------------------------------ */
/* Seletor de mídia                                                    */
/* ------------------------------------------------------------------ */

function MediaPickerModal({
  titulo,
  itens,
  onSelect,
  onClose,
}: {
  titulo: string;
  itens: Midia[];
  onSelect: (m: Midia) => void;
  onClose: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Midia | null>(null);

  const filtrados = busca.trim()
    ? itens.filter(
        (m) =>
          m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          m.arquivo.toLowerCase().includes(busca.toLowerCase()) ||
          m.alt.toLowerCase().includes(busca.toLowerCase()),
      )
    : itens;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-[640px] max-h-[80vh] flex-col rounded-xl border border-line bg-surface shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[13px] font-semibold text-ink">{titulo}</p>
          <button onClick={onClose} className="rounded p-1 text-ink-muted hover:text-ink">
            <X size={15} />
          </button>
        </div>

        {/* busca */}
        <div className="border-b border-line px-4 py-2.5">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, arquivo ou alt…"
            className="w-full rounded-[var(--radius)] border border-line bg-surface-2 px-3 py-1.5 text-[12px] text-ink placeholder:text-ink-muted/50 focus:border-primary focus:outline-none"
            autoFocus
          />
        </div>

        {/* grade */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtrados.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-ink-muted">Nenhuma imagem encontrada.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filtrados.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelecionado(selecionado?.id === m.id ? null : m)}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-[var(--radius)] border-2 text-left transition-all",
                    selecionado?.id === m.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-line hover:border-ink-muted",
                  )}
                >
                  <Thumb
                    gradiente={m.gradiente}
                    className="h-[72px] w-full rounded-none border-0"
                  />
                  <div className="px-2 py-1.5">
                    <p className="truncate text-[10.5px] font-medium text-ink">{m.titulo || m.arquivo}</p>
                    <p className="truncate text-[9.5px] text-ink-muted">
                      {m.largura}×{m.altura} · {m.formato}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <p className="text-[11px] text-ink-muted">
            {selecionado ? selecionado.arquivo : "Nenhum arquivo selecionado"}
          </p>
          <div className="flex gap-2">
            <Botao variante="secundario" tamanho="sm" onClick={onClose}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              onClick={() => selecionado && onSelect(selecionado)}
              disabled={!selecionado}
            >
              Usar selecionada
            </Botao>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── logo row ── */

function LogoRow({
  label,
  valor,
  alt,
  itens,
  onEscolher,
  onRemover,
  onAltChange,
}: {
  label: string;
  valor: string;
  alt: string;
  itens: Midia[];
  onEscolher: (m: Midia) => void;
  onRemover: () => void;
  onAltChange: (v: string) => void;
}) {
  const [abrirPicker, setAbrirPicker] = useState(false);
  const midiaItem = itens.find((m) => m.url === valor);

  return (
    <>
      <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-3 space-y-2.5">
        <p className="text-[11.5px] font-medium text-ink">{label}</p>

        <div className="flex items-center gap-3">
          {/* prévia */}
          {midiaItem ? (
            <Thumb
              gradiente={midiaItem.gradiente}
              className="h-10 w-[80px] shrink-0"
            />
          ) : (
            <div className="flex h-10 w-[80px] shrink-0 items-center justify-center rounded-[var(--radius)] border border-dashed border-line bg-surface text-[9px] text-ink-muted">
              {valor ? valor.split("/").pop() : "Sem logo"}
            </div>
          )}

          <div className="min-w-0 flex-1 text-[11px] text-ink-muted truncate font-mono">
            {valor ? valor.split("/").pop() : "—"}
          </div>

          <div className="flex shrink-0 gap-1.5">
            <Botao variante="secundario" tamanho="sm" onClick={() => setAbrirPicker(true)}>
              Escolher
            </Botao>
            {valor && (
              <Botao variante="perigo" tamanho="sm" onClick={onRemover}>
                Remover
              </Botao>
            )}
          </div>
        </div>

        <Campo label="Texto alternativo">
          <Entrada
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Ex: Nome do seu negócio"
          />
        </Campo>
      </div>

      {abrirPicker && (
        <MediaPickerModal
          titulo={`Escolher — ${label}`}
          itens={itens}
          onSelect={(m) => { onEscolher(m); setAbrirPicker(false); }}
          onClose={() => setAbrirPicker(false)}
        />
      )}
    </>
  );
}

/* ── favicon row ── */

function FaviconRow({
  valor,
  itens,
  onEscolher,
  onRemover,
}: {
  valor: string;
  itens: Midia[];
  onEscolher: (m: Midia) => void;
  onRemover: () => void;
}) {
  const [abrirPicker, setAbrirPicker] = useState(false);
  const midiaItem = itens.find((m) => m.url === valor);

  const gradiente = midiaItem?.gradiente ?? "135deg, hsl(215 20% 60%), hsl(215 20% 75%)";

  return (
    <>
      <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-3 space-y-3">
        <p className="text-[11.5px] font-medium text-ink">Favicon</p>

        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 shrink-0 rounded border border-line"
            style={{ backgroundImage: `linear-gradient(${gradiente})` }}
          />
          <div className="min-w-0 flex-1 text-[11px] text-ink-muted truncate font-mono">
            {valor ? valor.split("/").pop() : "—"}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Botao variante="secundario" tamanho="sm" onClick={() => setAbrirPicker(true)}>
              Escolher
            </Botao>
            {valor && (
              <Botao variante="perigo" tamanho="sm" onClick={onRemover}>
                Remover
              </Botao>
            )}
          </div>
        </div>

        {/* previews em tamanho real */}
        <div>
          <p className="mb-2 text-[10.5px] text-ink-muted">Prévia de tamanho</p>
          <div className="flex items-end gap-4">
            {/* 32px claro */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded border border-line bg-white">
                <div
                  className="rounded-sm"
                  style={{
                    width: 32, height: 32,
                    backgroundImage: `linear-gradient(${gradiente})`,
                  }}
                />
              </div>
              <span className="text-[9.5px] text-ink-muted">32 px · claro</span>
            </div>
            {/* 32px escuro */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded border border-line bg-[#1a1a2e]">
                <div
                  className="rounded-sm"
                  style={{
                    width: 32, height: 32,
                    backgroundImage: `linear-gradient(${gradiente})`,
                  }}
                />
              </div>
              <span className="text-[9.5px] text-ink-muted">32 px · escuro</span>
            </div>
            {/* 16px claro */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded border border-line bg-white">
                <div
                  className="rounded-sm"
                  style={{
                    width: 16, height: 16,
                    backgroundImage: `linear-gradient(${gradiente})`,
                  }}
                />
              </div>
              <span className="text-[9.5px] text-ink-muted">16 px · claro</span>
            </div>
            {/* 16px escuro */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded border border-line bg-[#1a1a2e]">
                <div
                  className="rounded-sm"
                  style={{
                    width: 16, height: 16,
                    backgroundImage: `linear-gradient(${gradiente})`,
                  }}
                />
              </div>
              <span className="text-[9.5px] text-ink-muted">16 px · escuro</span>
            </div>
          </div>
        </div>
      </div>

      {abrirPicker && (
        <MediaPickerModal
          titulo="Escolher — Favicon"
          itens={itens}
          onSelect={(m) => { onEscolher(m); setAbrirPicker(false); }}
          onClose={() => setAbrirPicker(false)}
        />
      )}
    </>
  );
}

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
  const { aparencia, setAparencia, setToken, tokensAtivos, midia, tema } = useStore();

  const [abaAtiva, setAbaAtiva] = useState<Aba>("identidade");
  const [salvando, setSalvando] = useState(false);

  // hex text inputs keep their own string so the user can type char-by-char
  const [hexInputs, setHexInputs] = useState<Record<string, string>>(
    () => ({ ...tokensAtivos }),
  );

  const tokensDefault = tema === "escuro" ? TOKENS_ESCURO : TOKENS_CLARO;

  const [logoAlt, setLogoAlt] = useState(aparencia.logoAlt);
  const [logoEscuraAlt, setLogoEscuraAlt] = useState(aparencia.logoEscuraAlt);

  const handleColorPicker = useCallback(
    (chave: ChaveToken, valor: string) => {
      setToken(chave, valor);
      setHexInputs((prev) => ({ ...prev, [chave]: valor }));
    },
    [setToken],
  );

  const handleHexInput = useCallback(
    (chave: ChaveToken, valor: string) => {
      setHexInputs((prev) => ({ ...prev, [chave]: valor }));
      if (/^#[0-9a-fA-F]{6}$/.test(valor)) setToken(chave, valor);
    },
    [setToken],
  );

  const restaurarToken = useCallback(
    (chave: ChaveToken) => {
      const cor = tokensDefault[chave];
      setToken(chave, cor);
      setHexInputs((prev) => ({ ...prev, [chave]: cor }));
    },
    [setToken, tokensDefault],
  );

  /* local state — espelha aparencia */
  const [nomeSite, setNomeSite] = useState(aparencia.nomeSite);
  const [tagline, setTagline] = useState(aparencia.tagline);
  const [descricaoSite, setDescricaoSite] = useState(aparencia.descricaoSite);
  const [fonteDisplay, setFonteDisplay] = useState(aparencia.fonteDisplay);
  const [fonteCorpo, setFonteCorpo] = useState(aparencia.fonteCorpo);
  const [raio, setRaio] = useState(aparencia.raio);
  const [densidade, setDensidade] = useState(aparencia.densidade);
  const raioValor = RAIOS.find((r) => r.id === raio)?.valor ?? "8px";
  const densidadeValor = DENSIDADES.find((d) => d.id === densidade)?.valor ?? "0.5rem";

  function salvar() {
    setSalvando(true);
    setAparencia({ nomeSite, tagline, descricaoSite, logoAlt, logoEscuraAlt, fonteDisplay, fonteCorpo, raio, densidade });
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
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <h1 className="text-[14px] font-semibold text-ink">Personalizar</h1>
        <Botao variante="primario" tamanho="sm" onClick={salvar}>
          {salvando ? "Salvando…" : "Salvar"}
        </Botao>
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
                  <Entrada value={nomeSite} onChange={(e) => setNomeSite(e.target.value)} placeholder="" />
                </Campo>
                <Campo label="Tagline">
                  <Entrada value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="" />
                </Campo>
                <Campo label="Descrição do site">
                  <AreaTexto value={descricaoSite} onChange={(e) => setDescricaoSite(e.target.value)} rows={3} />
                </Campo>
                <LogoRow
                  label="Logo (modo claro)"
                  valor={aparencia.logo}
                  alt={logoAlt}
                  itens={midia.filter((m) => ["JPG", "PNG", "SVG", "WEBP"].includes(m.formato))}
                  onEscolher={(m) => setAparencia({ logo: m.url })}
                  onRemover={() => setAparencia({ logo: "" })}
                  onAltChange={setLogoAlt}
                />
                <LogoRow
                  label="Logo (modo escuro)"
                  valor={aparencia.logoEscura}
                  alt={logoEscuraAlt}
                  itens={midia.filter((m) => ["JPG", "PNG", "SVG", "WEBP"].includes(m.formato))}
                  onEscolher={(m) => setAparencia({ logoEscura: m.url })}
                  onRemover={() => setAparencia({ logoEscura: "" })}
                  onAltChange={setLogoEscuraAlt}
                />
                <FaviconRow
                  valor={aparencia.favicon}
                  itens={midia.filter((m) => ["JPG", "PNG", "SVG", "WEBP", "ICO"].includes(m.formato))}
                  onEscolher={(m) => setAparencia({ favicon: m.url })}
                  onRemover={() => setAparencia({ favicon: "" })}
                />

                {/* Estrutura do site — somente-leitura */}
                <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-3">
                  <p className="mb-2.5 text-[11.5px] font-medium text-ink">Estrutura do site</p>
                  <p className="mb-3 text-[10.5px] text-ink-muted">
                    Definido pelo LinkFlow. Para alterar o prefixo do blog é necessário mover todos os
                    posts e emitir 301s correspondentes — use Configurações → Arquitetura de informação.
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Página inicial", valor: "Início (/)" },
                      { label: "Prefixo do blog", valor: "/blog" },
                      { label: "Prefixo de categoria", valor: "/categoria" },
                      { label: "Prefixo de autor", valor: "/autor" },
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11.5px] text-ink-muted">
                    Alterações de cor são aplicadas ao vivo mas exigem{" "}
                    <span className="font-medium text-ink">Salvar</span> para persistir na sessão.
                  </p>
                  <button
                    onClick={() => {
                      if (!confirm("Restaurar todas as cores do tema?")) return;
                      (CHAVES_TOKENS as unknown as ChaveToken[]).forEach((chave) => {
                        const cor = tokensDefault[chave];
                        setToken(chave, cor);
                        setHexInputs((prev) => ({ ...prev, [chave]: cor }));
                      });
                    }}
                    className="shrink-0 rounded-[var(--radius)] border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-muted transition-colors hover:text-ink"
                  >
                    Restaurar todas
                  </button>
                </div>
                {(CHAVES_TOKENS as unknown as ChaveToken[]).map((chave) => {
                  const valorAtual = tokensAtivos[chave] ?? "#000000";
                  const hexInput = hexInputs[chave] ?? valorAtual;
                  const info = avaliarToken(chave, tokensAtivos);
                  const ratioStr = info.ratio.toFixed(1) + ":1";
                  const alterado = valorAtual !== tokensDefault[chave];

                  return (
                    <div
                      key={chave}
                      className="rounded-[var(--radius)] border border-line bg-surface-2 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        {/* swatch + color picker nativo */}
                        <div className="group relative shrink-0 cursor-pointer">
                          <div
                            className="h-8 w-8 rounded-full border-2 border-line transition-shadow group-hover:ring-2 group-hover:ring-primary/40 group-hover:ring-offset-1"
                            style={{ background: valorAtual }}
                          />
                          <input
                            type="color"
                            value={valorAtual}
                            onChange={(e) => handleColorPicker(chave, e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            title="Escolher cor"
                          />
                        </div>

                        {/* label + var */}
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-ink">
                            {TOKEN_LABELS[chave] ?? chave}
                          </p>
                          <p className="font-mono text-[10px] text-ink-muted">--{chave}</p>
                        </div>

                        {/* hex text input sincronizado */}
                        <input
                          type="text"
                          value={hexInput}
                          onChange={(e) => handleHexInput(chave, e.target.value)}
                          onBlur={() =>
                            setHexInputs((prev) => ({ ...prev, [chave]: valorAtual }))
                          }
                          maxLength={7}
                          className="w-[82px] rounded border border-line bg-surface px-2 py-1 font-mono text-[11.5px] text-ink focus:border-primary focus:outline-none"
                        />

                        {/* restaurar */}
                        {alterado && (
                          <button
                            onClick={() => restaurarToken(chave)}
                            title="Restaurar cor do tema"
                            className="shrink-0 rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                        {!alterado && <div className="w-[21px] shrink-0" />}
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
              tokens={tokensAtivos}
              raioValor={raioValor}
              fonteDisplay={fonteDisplay}
              fonteCorpo={fonteCorpo}
            />
          </div>
          <p className="mt-3 text-[10.5px] text-ink-muted/60">
            Prévia aproximada · cores e fonte refletem as seleções ao vivo
          </p>
        </div>
      </div>
    </div>
  );
}
