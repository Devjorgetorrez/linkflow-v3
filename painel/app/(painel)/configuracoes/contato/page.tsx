"use client";

import { Globe, MapPin, Phone, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Campo, Entrada, Rotulo, Selecao } from "@/components/ui";
import { useStore, type HorarioFuncionamento } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Opções de dias                                                       */
/* ------------------------------------------------------------------ */

const OPCOES_DIAS = [
  { value: "Mo-Fr", label: "Segunda a sexta" },
  { value: "Mo-Sa", label: "Segunda a sábado" },
  { value: "Mo-Su", label: "Segunda a domingo" },
  { value: "Mo", label: "Segunda" },
  { value: "Tu", label: "Terça" },
  { value: "We", label: "Quarta" },
  { value: "Th", label: "Quinta" },
  { value: "Fr", label: "Sexta" },
  { value: "Sa", label: "Sábado" },
  { value: "Su", label: "Domingo" },
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

/* ------------------------------------------------------------------ */
/* JSON-LD LocalBusiness preview                                       */
/* ------------------------------------------------------------------ */

function formatarHorarioSchema(h: HorarioFuncionamento): string {
  if (h.fechado) return `${h.dias} Closed`;
  return `${h.dias} ${h.abertura}-${h.fechamento}`;
}

function gerarJsonLd(params: {
  tipo: string;
  nome: string;
  telefone: string;
  whatsapp: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  horarios: HorarioFuncionamento[];
  areaAtendimento: string;
  atendimentoOnline: boolean;
}) {
  const {
    tipo, nome, telefone, whatsapp, logradouro, numero, complemento,
    bairro, cidade, estado, cep, horarios, areaAtendimento, atendimentoOnline,
  } = params;

  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": tipo || "LocalBusiness",
    name: nome || "—",
    url: "",  // preenchido via config real
  };

  if (telefone) obj.telephone = telefone;
  if (whatsapp && whatsapp !== telefone) obj.contactPoint = {
    "@type": "ContactPoint",
    telephone: whatsapp,
    contactType: "customer support",
    availableLanguage: "Portuguese",
  };

  if (logradouro) {
    const end: Record<string, string> = {
      "@type": "PostalAddress",
      streetAddress: [logradouro, numero, complemento].filter(Boolean).join(", "),
      addressLocality: cidade,
      addressRegion: estado,
      postalCode: cep,
      addressCountry: "BR",
    };
    if (bairro) end.addressLocality = `${cidade} — ${bairro}`;
    obj.address = end;
  }

  const horariosAtivos = horarios.filter((h) => !h.fechado && h.abertura && h.fechamento);
  if (horariosAtivos.length > 0) {
    obj.openingHours = horariosAtivos.map(formatarHorarioSchema);
  }

  if (areaAtendimento) obj.areaServed = areaAtendimento;
  if (atendimentoOnline) obj.hasOfferCatalog = { "@type": "OfferCatalog", name: "Atendimento on-line disponível" };

  return JSON.stringify(obj, null, 2);
}

/* ------------------------------------------------------------------ */
/* Bloco de seção                                                      */
/* ------------------------------------------------------------------ */

function Secao({ titulo, icone: Icone, children }: {
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
/* Linha de horário                                                    */
/* ------------------------------------------------------------------ */

function LinhaHorario({
  horario,
  onChange,
  onRemover,
}: {
  horario: HorarioFuncionamento;
  onChange: (patch: Partial<HorarioFuncionamento>) => void;
  onRemover: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Selecao
        value={horario.dias}
        onChange={(e) => onChange({ dias: e.target.value })}
        className="w-48 shrink-0"
      >
        {OPCOES_DIAS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Selecao>

      <label className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
        <input
          type="checkbox"
          checked={horario.fechado}
          onChange={(e) => onChange({ fechado: e.target.checked })}
          className="h-3.5 w-3.5 accent-[var(--primary)]"
        />
        Fechado
      </label>

      {!horario.fechado && (
        <>
          <Entrada
            type="time"
            value={horario.abertura}
            onChange={(e) => onChange({ abertura: e.target.value })}
            className="w-28"
          />
          <span className="text-xs text-[var(--ink-muted)]">às</span>
          <Entrada
            type="time"
            value={horario.fechamento}
            onChange={(e) => onChange({ fechamento: e.target.value })}
            className="w-28"
          />
        </>
      )}

      <button
        onClick={onRemover}
        className="ml-auto shrink-0 p-1 text-[var(--ink-muted)] hover:text-[var(--danger)]"
        title="Remover linha"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function ContatoPage() {
  const { aparencia, configIdentidade, configContato, setConfigContato } = useStore();

  const [telefone, setTelefone] = useState(configContato.telefone);
  const [telefone2, setTelefone2] = useState(configContato.telefone2);
  const [whatsapp, setWhatsapp] = useState(configContato.whatsapp);
  const [logradouro, setLogradouro] = useState(configContato.logradouro);
  const [numero, setNumero] = useState(configContato.numero);
  const [complemento, setComplemento] = useState(configContato.complemento);
  const [bairro, setBairro] = useState(configContato.bairro);
  const [cidade, setCidade] = useState(configContato.cidade);
  const [estado, setEstado] = useState(configContato.estado);
  const [cep, setCep] = useState(configContato.cep);
  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>(configContato.horarios);
  const [areaAtendimento, setAreaAtendimento] = useState(configContato.areaAtendimento);
  const [atendimentoOnline, setAtendimentoOnline] = useState(configContato.atendimentoOnline);

  // Carregar dados reais ao montar
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config) return;
        const c = data.config;
        if (c.telefone) setTelefone(c.telefone);
        if (c.telefone2) setTelefone2(c.telefone2);
        if (c.whatsapp) setWhatsapp(c.whatsapp);
        if (c.logradouro) setLogradouro(c.logradouro);
        if (c.cidade) setCidade(c.cidade);
        if (c.uf) setEstado(c.uf);
        if (c.cep) setCep(c.cep);
        if (c.email) {} // email não tem campo na tela, mas está no config
      })
      .catch(console.error);
  }, []);

  function atualizarHorario(id: string, patch: Partial<HorarioFuncionamento>) {
    setHorarios((lista) => lista.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  function adicionarHorario() {
    const novoId = `h${Date.now()}`;
    setHorarios((lista) => [
      ...lista,
      { id: novoId, dias: "Mo-Fr", abertura: "09:00", fechamento: "18:00", fechado: false },
    ]);
  }

  function removerHorario(id: string) {
    setHorarios((lista) => lista.filter((h) => h.id !== id));
  }

  function salvar() {
    setConfigContato({
      telefone, telefone2, whatsapp,
      logradouro, numero, complemento, bairro, cidade, estado, cep,
      horarios, areaAtendimento, atendimentoOnline,
    });
    // Persistir via API
    fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone, telefone2, whatsapp, logradouro, complemento, bairro, cidade, uf: estado, cep }),
    }).catch(console.error);
  }

  const jsonLd = useMemo(
    () =>
      gerarJsonLd({
        tipo: configIdentidade.tipoNegocio,
        nome: aparencia.nomeSite,
        telefone, whatsapp, logradouro, numero, complemento,
        bairro, cidade, estado, cep, horarios, areaAtendimento, atendimentoOnline,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [telefone, whatsapp, logradouro, numero, complemento, bairro, cidade, estado, cep, horarios, areaAtendimento, atendimentoOnline, configIdentidade.tipoNegocio, aparencia.nomeSite],
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Contato e NAP</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Telefone, endereço, horários e área de atendimento.
          </p>
        </div>
        <button
          onClick={salvar}
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-ink)] transition-opacity hover:opacity-90"
        >
          Salvar alterações
        </button>
      </div>

      {/* ── Telefone / WhatsApp ───────────────────────── */}
      <Secao titulo="Telefone e WhatsApp" icone={Phone}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Telefone principal">
            <Entrada
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 00000-0000"
            />
          </Campo>
          <Campo label="Telefone secundário">
            <Entrada
              value={telefone2}
              onChange={(e) => setTelefone2(e.target.value)}
              placeholder="(11) 00000-0000"
            />
          </Campo>
          <Campo label="WhatsApp">
            <Entrada
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 00000-0000"
            />
          </Campo>
        </div>
      </Secao>

      {/* ── Endereço ─────────────────────────────────── */}
      <Secao titulo="Endereço (NAP)" icone={MapPin}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Campo label="Logradouro">
              <Entrada
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                placeholder="Rua, Avenida…"
              />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo label="Número">
              <Entrada
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Nº"
              />
            </Campo>
          </div>
          <div className="sm:col-span-3">
            <Campo label="Complemento">
              <Entrada
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Sala, andar, apto…"
              />
            </Campo>
          </div>
          <div className="sm:col-span-3">
            <Campo label="Bairro">
              <Entrada
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Bairro"
              />
            </Campo>
          </div>
          <div className="sm:col-span-3">
            <Campo label="Cidade">
              <Entrada
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
              />
            </Campo>
          </div>
          <div className="sm:col-span-1">
            <Campo label="UF">
              <Selecao
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                {ESTADOS_BR.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </Selecao>
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo label="CEP">
              <Entrada
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
            </Campo>
          </div>
        </div>
      </Secao>

      {/* ── Horários de funcionamento ─────────────────── */}
      <Secao titulo="Horários de funcionamento" icone={Globe}>
        <div className="space-y-2.5">
          {horarios.map((h) => (
            <LinhaHorario
              key={h.id}
              horario={h}
              onChange={(patch) => atualizarHorario(h.id, patch)}
              onRemover={() => removerHorario(h.id)}
            />
          ))}
        </div>
        <button
          onClick={adicionarHorario}
          className="mt-3 flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
        >
          <Plus size={13} />
          Adicionar linha
        </button>

        <p className="mt-3 text-[11px] text-[var(--ink-muted)]">
          Formato schema.org: <code className="font-mono">Mo-Fr 09:00-18:00</code>
        </p>
      </Secao>

      {/* ── Área de atendimento ───────────────────────── */}
      <Secao titulo="Área de atendimento" icone={Globe}>
        <div className="space-y-4">
          <Campo label="Cidades / regiões atendidas">
            <Entrada
              value={areaAtendimento}
              onChange={(e) => setAreaAtendimento(e.target.value)}
              placeholder="Ex: Sua cidade, região de atendimento"
            />
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
              Separadas por vírgula. Usado no campo <code className="font-mono">areaServed</code>.
            </p>
          </Campo>

          <label className={cn(
            "flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] px-4 py-3",
            atendimentoOnline ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]" : "bg-[var(--surface)]"
          )}>
            <input
              type="checkbox"
              checked={atendimentoOnline}
              onChange={(e) => setAtendimentoOnline(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">Atendimento on-line disponível</p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Adiciona <code className="font-mono">hasOfferCatalog</code> ao schema
              </p>
            </div>
          </label>
        </div>
      </Secao>

      {/* ── Prévia JSON-LD LocalBusiness ──────────────── */}
      <section className="mb-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="mb-3 text-[11px] font-medium text-[var(--ink-muted)]">
          Prévia JSON-LD LocalBusiness combinada com Identidade
        </p>
        <pre className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
          {jsonLd}
        </pre>
      </section>
    </div>
  );
}
