"use client";

import { AlertTriangle, Building2, Globe, Image as Img, Info, Lock } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Campo, Entrada, Rotulo, Selecao, AreaTexto } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useDominio } from "@/lib/useDominio";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Tipos de negócio schema.org agrupados                              */
/* ------------------------------------------------------------------ */

const GRUPOS_NEGOCIO = [
  {
    grupo: "Saúde",
    tipos: [
      { value: "MedicalBusiness", label: "Estabelecimento de saúde (genérico)" },
      { value: "MedicalClinic", label: "Clínica médica" },
      { value: "Physician", label: "Médico / Especialista" },
      { value: "Dentist", label: "Dentista" },
      { value: "Optician", label: "Óptica" },
      { value: "Pharmacy", label: "Farmácia" },
      { value: "PhysicalTherapist", label: "Fisioterapeuta" },
      { value: "Hospital", label: "Hospital / UPA" },
    ],
  },
  {
    grupo: "Profissional liberal",
    tipos: [
      { value: "LegalService", label: "Advocacia / Jurídico" },
      { value: "AccountingService", label: "Contabilidade" },
      { value: "FinancialPlanningService", label: "Finanças / Planejamento" },
      { value: "ProfessionalService", label: "Serviço profissional (genérico)" },
    ],
  },
  {
    grupo: "Serviço a domicílio",
    tipos: [
      { value: "HomeAndConstructionBusiness", label: "Construção e reforma (genérico)" },
      { value: "Plumber", label: "Encanador" },
      { value: "Electrician", label: "Eletricista" },
      { value: "HousePainter", label: "Pintor" },
    ],
  },
  {
    grupo: "Intermediação",
    tipos: [
      { value: "RealEstateAgent", label: "Imobiliária / Corretora" },
      { value: "TravelAgency", label: "Agência de viagem" },
      { value: "InsuranceAgency", label: "Corretora de seguros" },
    ],
  },
  {
    grupo: "Genérico",
    tipos: [
      { value: "LocalBusiness", label: "Negócio local (genérico)" },
      { value: "Store", label: "Loja / Varejo" },
      { value: "FoodEstablishment", label: "Restaurante / Alimentação" },
      { value: "Organization", label: "Organização (sem endereço físico)" },
    ],
  },
];

const TIPOS_SAUDE = new Set(GRUPOS_NEGOCIO[0].tipos.map((t) => t.value));

const ESPECIALIDADES = [
  { value: "Anesthesia", label: "Anestesiologia" },
  { value: "Cardiovascular", label: "Cardiologia" },
  { value: "Dentistry", label: "Odontologia" },
  { value: "Dermatology", label: "Dermatologia" },
  { value: "Emergency", label: "Emergência" },
  { value: "Gastroenterologic", label: "Gastroenterologia" },
  { value: "Geriatric", label: "Geriatria" },
  { value: "Gynecologic", label: "Ginecologia" },
  { value: "Neurologic", label: "Neurologia" },
  { value: "Obstetric", label: "Obstetrícia" },
  { value: "Oncologic", label: "Oncologia" },
  { value: "Optometric", label: "Optometria" },
  { value: "Pediatric", label: "Pediatria" },
  { value: "Physiotherapy", label: "Fisioterapia" },
  { value: "PrimaryCare", label: "Clínica geral" },
  { value: "Psychiatric", label: "Psicologia / Psiquiatria" },
  { value: "Radiography", label: "Radiologia" },
  { value: "Renal", label: "Nefrologia" },
  { value: "Rheumatologic", label: "Reumatologia" },
  { value: "SpeechPathology", label: "Fonoaudiologia" },
  { value: "Surgical", label: "Cirurgia" },
];

/* ------------------------------------------------------------------ */
/* JSON-LD preview                                                     */
/* ------------------------------------------------------------------ */

function gerarJsonLd(params: {
  tipo: string;
  nome: string;
  descricao: string;
  logo: string;
  medicalSpecialty: string;
  availableService: string;
  priceRange: string;
  endereco: string;
  dominio: string;
}) {
  const { tipo, nome, descricao, logo, medicalSpecialty, availableService, priceRange, endereco, dominio } =
    params;
  const eSaude = TIPOS_SAUDE.has(tipo);
  const eOrganization = tipo === "Organization";

  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": tipo,
    name: nome || "—",
    url: dominio ? `https://${dominio}` : "",
  };

  if (logo) obj.logo = dominio ? `https://${dominio}/marca/${logo}` : logo;
  if (descricao) obj.description = descricao;
  if (eSaude && medicalSpecialty)
    obj.medicalSpecialty = `https://schema.org/${medicalSpecialty}`;
  if (eSaude && availableService) obj.availableService = availableService;
  if (!eOrganization && endereco) obj.address = endereco;
  if (priceRange) obj.priceRange = priceRange;

  return JSON.stringify(obj, null, 2);
}

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

/* ------------------------------------------------------------------ */
/* Preview de mídia                                                    */
/* ------------------------------------------------------------------ */

function PreviewMidia({
  src,
  alt,
  tipo,
}: {
  src: string;
  alt?: string;
  tipo: "logo" | "favicon" | "og";
}) {
  const cls =
    tipo === "favicon"
      ? "h-8 w-8"
      : tipo === "og"
        ? "h-16 w-28"
        : "h-10 w-24";
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded border border-dashed border-[var(--line)] bg-[var(--surface)] text-[10px] text-[var(--ink-muted)]",
          cls,
        )}
      >
        vazio
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`/marca/${src}`}
      alt={alt ?? ""}
      className={cn(
        "rounded border border-[var(--line)] bg-[var(--surface)] object-contain",
        cls,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Botões de biblioteca / upload                                       */
/* ------------------------------------------------------------------ */

function BotoesArquivo({ onRemover }: { onRemover?: () => void }) {
  return (
    <div className="flex gap-2">
      <button className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink)] hover:bg-[var(--secondary)]">
        Escolher da biblioteca
      </button>
      <button className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink)] hover:bg-[var(--secondary)]">
        Fazer upload
      </button>
      {onRemover && (
        <button
          onClick={onRemover}
          className="rounded-[var(--radius)] px-3 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--danger)]"
        >
          Remover
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function IdentidadePage() {
  const dominio = useDominio();
  const { aparencia, setAparencia, configIdentidade, setConfigIdentidade, privacidadeConfig } =
    useStore();

  const [nomeSite, setNomeSite] = useState(aparencia.nomeSite);
  const [tagline, setTagline] = useState(aparencia.tagline);
  const [descricao, setDescricao] = useState(aparencia.descricaoSite);
  const [logoAlt, setLogoAlt] = useState(aparencia.logoAlt);
  const [logoEscuraAlt, setLogoEscuraAlt] = useState(aparencia.logoEscuraAlt);
  const [ogAlt, setOgAlt] = useState(configIdentidade.ogImagemPadraoAlt);
  const [gateAviso, setGateAviso] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [feedbackSalvar, setFeedbackSalvar] = useState<"ok" | "erro" | null>(null);

  // Carregar config real do servidor ao montar
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          const c = data.config;
          if (c.nome) setNomeSite(c.nome);
          if (c.tagline) setTagline(c.tagline);
        }
      })
      .catch(console.error);
  }, []);

  const eSaude = TIPOS_SAUDE.has(configIdentidade.tipoNegocio);
  const eVarejo = configIdentidade.tipoNegocio === "Store";

  const jsonLd = useMemo(
    () =>
      gerarJsonLd({
        tipo: configIdentidade.tipoNegocio,
        nome: aparencia.nomeSite,
        descricao: aparencia.descricaoSite,
        logo: aparencia.logo,
        medicalSpecialty: configIdentidade.medicalSpecialty,
        availableService: configIdentidade.availableService,
        priceRange: configIdentidade.priceRange,
        endereco: privacidadeConfig.endereco,
        dominio,
      }),
    [configIdentidade, aparencia, privacidadeConfig.endereco, dominio],
  );

  async function salvar() {
    setSalvando(true);
    setFeedbackSalvar(null);

    // Atualizar store local
    setAparencia({ nomeSite, tagline, descricaoSite: descricao, logoAlt, logoEscuraAlt });
    setConfigIdentidade({ ogImagemPadraoAlt: ogAlt });
    setGateAviso(false);

    // Persistir via API
    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeSite, tagline }),
      });
      setFeedbackSalvar(res.ok ? "ok" : "erro");
    } catch {
      setFeedbackSalvar("erro");
    } finally {
      setSalvando(false);
      setTimeout(() => setFeedbackSalvar(null), 3000);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Identidade</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Nome, descrição, tipo de negócio, mídia e estrutura do site.
          </p>
        </div>
        <button
          onClick={salvar}
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-ink)] transition-opacity hover:opacity-90"
        >
          Salvar alterações
        </button>
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
              value={nomeSite}
              onChange={(e) => {
                setNomeSite(e.target.value);
                setGateAviso(true);
              }}
              aviso={gateAviso}
              placeholder="Nome do site"
            />
            {gateAviso && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--accent)]">
                <AlertTriangle size={11} />
                Alterar o nome atualiza o schema, og:site_name e o title de todas as páginas.
              </p>
            )}
          </div>

          {/* Tagline */}
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Rotulo>Tagline</Rotulo>
              <span className="text-[10px] text-[var(--ink-muted)]">LinkFlow editável</span>
            </div>
            <Entrada
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Frase curta de posicionamento"
            />
          </div>

          {/* Descrição */}
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Rotulo>Descrição do site</Rotulo>
              <span className="text-[10px] text-[var(--ink-muted)]">LinkFlow editável</span>
            </div>
            <AreaTexto
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Descrição para meta description e og:description"
            />
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
          <div className="sm:col-span-2">
            <Campo label="Razão social">
              <Entrada
                value={configIdentidade.razaoSocial}
                onChange={(e) => setConfigIdentidade({ razaoSocial: e.target.value })}
                placeholder="Nome jurídico da empresa"
              />
            </Campo>
          </div>

          <Campo label="CNPJ">
            <Entrada
              value={privacidadeConfig.cnpj}
              readOnly
              className="cursor-not-allowed opacity-60"
              placeholder="00.000.000/0000-00"
            />
            <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
              Editável em Privacidade → Política
            </p>
          </Campo>

          <Campo label="Fundado em">
            <Entrada
              value={configIdentidade.fundadoEm}
              onChange={(e) => setConfigIdentidade({ fundadoEm: e.target.value })}
              placeholder="Ano"
              maxLength={4}
            />
          </Campo>

          <Campo label="Conselho profissional">
            <Entrada
              value={configIdentidade.conselho}
              onChange={(e) => setConfigIdentidade({ conselho: e.target.value })}
              placeholder="CRP, CRM, OAB…"
            />
          </Campo>

          <Campo label="Registro profissional">
            <Entrada
              value={configIdentidade.registroProfissional}
              onChange={(e) =>
                setConfigIdentidade({ registroProfissional: e.target.value })
              }
              placeholder="Ex: 06/128455"
            />
          </Campo>

          <div className="sm:col-span-2">
            <Campo label="Responsável técnico">
              <Entrada
                value={configIdentidade.responsavelTecnico}
                onChange={(e) =>
                  setConfigIdentidade({ responsavelTecnico: e.target.value })
                }
                placeholder="Nome completo"
              />
            </Campo>
          </div>
        </div>
      </Secao>

      {/* ── Tipo de negócio + JSON-LD preview ─────────── */}
      <Secao titulo="Tipo de negócio (schema.org)" icone={Info}>
        <div className="space-y-4">
          <Campo label="Tipo schema.org">
            <Selecao
              value={configIdentidade.tipoNegocio}
              onChange={(e) => setConfigIdentidade({ tipoNegocio: e.target.value })}
            >
              {GRUPOS_NEGOCIO.map((g) => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.tipos.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} — {t.value}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Selecao>
          </Campo>

          {eSaude && (
            <>
              <Campo label="Especialidade médica (medicalSpecialty)">
                <Selecao
                  value={configIdentidade.medicalSpecialty}
                  onChange={(e) =>
                    setConfigIdentidade({ medicalSpecialty: e.target.value })
                  }
                >
                  <option value="">— não informar —</option>
                  {ESPECIALIDADES.map((esp) => (
                    <option key={esp.value} value={esp.value}>
                      {esp.label} — {esp.value}
                    </option>
                  ))}
                </Selecao>
              </Campo>

              <Campo label="Serviços oferecidos (availableService)">
                <Entrada
                  value={configIdentidade.availableService}
                  onChange={(e) =>
                    setConfigIdentidade({ availableService: e.target.value })
                  }
                  placeholder="Ex: desentupimento de pia, limpeza de caixa de gordura…"
                />
              </Campo>
            </>
          )}

          {eVarejo && (
            <Campo label="Faixa de preço (priceRange)">
              <Entrada
                value={configIdentidade.priceRange}
                onChange={(e) => setConfigIdentidade({ priceRange: e.target.value })}
                placeholder="$$ ou R$50–R$200"
              />
            </Campo>
          )}

          <div>
            <p className="mb-2 text-[11px] font-medium text-[var(--ink-muted)]">
              Prévia JSON-LD gerada
            </p>
            <pre className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-4 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
              {jsonLd}
            </pre>
            {privacidadeConfig.endereco === "" &&
              configIdentidade.tipoNegocio !== "Organization" && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
                  <Info size={11} />O endereço será adicionado em Configurações → Contato e NAP.
                </p>
              )}
          </div>
        </div>
      </Secao>

      {/* ── Mídia ─────────────────────────────────────── */}
      <Secao titulo="Mídia" icone={Img}>
        <div className="space-y-5">
          {/* Logo claro */}
          <div className="flex items-start gap-5">
            <div className="shrink-0">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Logo claro
              </p>
              <PreviewMidia src={aparencia.logo} alt={aparencia.logoAlt} tipo="logo" />
            </div>
            <div className="flex-1 space-y-3">
              <Campo label="Texto alternativo">
                <Entrada
                  value={logoAlt}
                  onChange={(e) => setLogoAlt(e.target.value)}
                  placeholder="Descrição acessível"
                />
              </Campo>
              <BotoesArquivo
                onRemover={aparencia.logo ? () => setAparencia({ logo: "", logoAlt: "" }) : undefined}
              />
            </div>
          </div>

          <hr className="border-[var(--line)]" />

          {/* Logo escuro */}
          <div className="flex items-start gap-5">
            <div className="shrink-0">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Logo escuro
              </p>
              <div className="rounded border border-[var(--line)] bg-[var(--ink)] p-1">
                <PreviewMidia
                  src={aparencia.logoEscura}
                  alt={aparencia.logoEscuraAlt}
                  tipo="logo"
                />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <Campo label="Texto alternativo">
                <Entrada
                  value={logoEscuraAlt}
                  onChange={(e) => setLogoEscuraAlt(e.target.value)}
                  placeholder="Descrição acessível"
                />
              </Campo>
              <BotoesArquivo />
            </div>
          </div>

          <hr className="border-[var(--line)]" />

          {/* Favicon */}
          <div className="flex items-start gap-5">
            <div className="shrink-0">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Favicon
              </p>
              <PreviewMidia src={aparencia.favicon} tipo="favicon" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-[11px] text-[var(--ink-muted)]">
                PNG 32×32 ou SVG. Exibido na aba do navegador e em favoritos.
              </p>
              <BotoesArquivo />
            </div>
          </div>

          <hr className="border-[var(--line)]" />

          {/* OG imagem padrão */}
          <div className="flex items-start gap-5">
            <div className="shrink-0">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                og:image padrão
              </p>
              <PreviewMidia
                src={configIdentidade.ogImagemPadrao}
                alt={configIdentidade.ogImagemPadraoAlt}
                tipo="og"
              />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-[11px] text-[var(--ink-muted)]">
                Usada quando o post não tem imagem destacada. Recomendado 1200×630 px.
              </p>
              <Campo label="Texto alternativo">
                <Entrada
                  value={ogAlt}
                  onChange={(e) => setOgAlt(e.target.value)}
                  placeholder="Descrição acessível"
                />
              </Campo>
              <BotoesArquivo
                onRemover={
                  configIdentidade.ogImagemPadrao
                    ? () =>
                        setConfigIdentidade({ ogImagemPadrao: "", ogImagemPadraoAlt: "" })
                    : undefined
                }
              />
            </div>
          </div>
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
