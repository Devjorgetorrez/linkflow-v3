"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  Info,
  Lock,
  Shield,
  User,
} from "lucide-react";
import { useStore, type BaseLegal, type PrivacidadeConfig } from "@/lib/store";
import type { LegalPainel } from "@/lib/legal";

const BASES_LEGAIS: { id: BaseLegal; label: string; abrev: string }[] = [
  { id: "consentimento", label: "Consentimento (art. 7º, I)", abrev: "Consentimento" },
  { id: "execucao-contrato", label: "Execução de contrato (art. 7º, V)", abrev: "Contrato" },
  { id: "legitimo-interesse", label: "Legítimo interesse (art. 7º, IX)", abrev: "Leg. interesse" },
  { id: "obrigacao-legal", label: "Obrigação legal (art. 7º, II)", abrev: "Obrigação legal" },
];

function baseLabelFor(id: BaseLegal) {
  return BASES_LEGAIS.find((b) => b.id === id)?.label ?? id;
}

function ChipAuto({ label = "Derivado automaticamente" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
      style={{ background: "color-mix(in srgb,var(--primary) 12%,transparent)", color: "var(--primary)" }}>
      <Info size={10} />
      {label}
    </span>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
      {children}
      {required && <span className="ml-1" style={{ color: "var(--danger)" }}>*</span>}
    </label>
  );
}

function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-1 ${className ?? ""}`}>{children}</div>;
}

function Input({
  value, onChange, placeholder, disabled, type, invalido,
}: { value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean; type?: "text" | "date" | "email"; invalido?: boolean }) {
  return (
    <input
      type={type ?? "text"}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded border px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        borderColor: invalido ? "var(--danger)" : "var(--line)",
        background: disabled ? "var(--surface)" : "var(--surface-2)",
        color: "var(--ink)",
      }}
    />
  );
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Select({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border px-3 py-2 text-sm"
      style={{ borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--ink)" }}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--line)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: "var(--surface)" }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          <Icon size={15} style={{ color: "var(--primary)" }} />
          {title}
        </span>
        {open ? <ChevronUp size={15} style={{ color: "var(--ink-muted)" }} /> : <ChevronDown size={15} style={{ color: "var(--ink-muted)" }} />}
      </button>
      {open && (
        <div className="px-4 py-4 flex flex-col gap-4" style={{ background: "var(--surface-2)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="border-t my-3" style={{ borderColor: "var(--line)" }} />;
}

/* ─── Live Policy Document ─────────────────────────────────── */

interface IntegracoesAtivas {
  analiticos: boolean;
  marketing: boolean;
}

function PolicyDocument({
  cfg,
  nomeSite,
  formularios,
  integ,
}: {
  cfg: PrivacidadeConfig;
  nomeSite: string;
  formularios: { id: string; nome: string; campos: { rotulo: string; tipo: string }[]; ativo: boolean }[];
  integ: IntegracoesAtivas;
}) {
  const ativos = formularios.filter((f) => f.ativo);

  const incompleto = !cfg.cnpj || !cfg.endereco;

  return (
    <div
      className="text-sm leading-relaxed"
      style={{ color: "var(--ink)", fontFamily: "var(--font-body, inherit)" }}
    >
      {incompleto && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
          style={{ background: "color-mix(in srgb,var(--accent) 12%,transparent)", color: "var(--accent)" }}
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>Preencha CNPJ e endereço para completar o documento.</span>
        </div>
      )}

      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--ink)" }}>
          Política de Privacidade
        </h1>
        <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
          {nomeSite} · Versão {cfg.versao} · Vigente desde {cfg.dataVersao}
        </p>
      </div>

      <Section2 n="1" title="Controlador dos dados">
        <p>
          <strong>{nomeSite}</strong>{cfg.cnpj ? `, CNPJ ${cfg.cnpj},` : ","} com sede{" "}
          {cfg.endereco ? `em ${cfg.endereco}` : "<endereço não preenchido>"}, é o controlador dos dados
          pessoais coletados neste site, nos termos da Lei nº 13.709/2018 (LGPD).
        </p>
        <p className="mt-2">
          Contato: <a href={`mailto:${cfg.emailContato}`} style={{ color: "var(--primary)" }}>{cfg.emailContato}</a>
        </p>
      </Section2>

      <Section2 n="2" title="Dados coletados e finalidades">
        {ativos.length > 0 && (
          <>
            <p className="font-semibold">2.1 Formulários</p>
            {ativos.map((f) => {
              const campos = f.campos.map((c) => c.rotulo).join(", ");
              return (
                <p key={f.id} className="mt-1">
                  <strong>{f.nome}:</strong> coleta {campos} para fins de {f.nome.toLowerCase().includes("agendamento") ? "agendamento de consulta" : "resposta à solicitação"}.
                </p>
              );
            })}
          </>
        )}

        <p className="font-semibold mt-3">2.{ativos.length > 0 ? "2" : "1"} Cookies e tecnologias de rastreamento</p>
        <p className="mt-1">
          <strong>Estritamente necessários:</strong> essenciais ao funcionamento do site (sessão, segurança). Base legal: legítimo interesse.
        </p>
        {integ.analiticos && (
          <p className="mt-1">
            <strong>Análise (GA4):</strong> Google Analytics 4 — mede visitas e comportamento de navegação. Base legal: {baseLabelFor(cfg.baseLegalAnaliticos)}.
          </p>
        )}
        {integ.marketing && (
          <p className="mt-1">
            <strong>Marketing:</strong> Meta Pixel e Google Ads — publicidade direcionada. Base legal: {baseLabelFor(cfg.baseLegalMarketing)}.
          </p>
        )}
        <p className="mt-1">
          <strong>Funcionalidade:</strong> incorporações de mapa e vídeo. Base legal: {baseLabelFor("consentimento")}.
        </p>
      </Section2>

      <Section2 n="3" title="Bases legais e retenção">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              <th className="border px-2 py-1.5 text-left" style={{ borderColor: "var(--line)" }}>Atividade</th>
              <th className="border px-2 py-1.5 text-left" style={{ borderColor: "var(--line)" }}>Base legal</th>
              <th className="border px-2 py-1.5 text-left" style={{ borderColor: "var(--line)" }}>Retenção</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>Dados de formulários</td>
              <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>{baseLabelFor(cfg.baseLegalFormularios)}</td>
              <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>{cfg.retencaoFormularios}</td>
            </tr>
            {integ.analiticos && (
              <tr style={{ background: "var(--surface)" }}>
                <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>Cookies analíticos (GA4)</td>
                <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>{baseLabelFor(cfg.baseLegalAnaliticos)}</td>
                <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>{cfg.retencaoAnaliticos}</td>
              </tr>
            )}
            {integ.marketing && (
              <tr>
                <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>Cookies de marketing</td>
                <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>{baseLabelFor(cfg.baseLegalMarketing)}</td>
                <td className="border px-2 py-1.5" style={{ borderColor: "var(--line)" }}>{cfg.retencaoMarketing}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section2>

      <Section2 n="4" title="Compartilhamento com terceiros">
        <p>Os dados podem ser compartilhados com:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          {integ.analiticos && <li><strong>Google LLC</strong> — Analytics e Google Ads (EUA)</li>}
          {integ.marketing && <li><strong>Meta Platforms Inc.</strong> — Meta Pixel (EUA)</li>}
          <li><strong>Resend Inc.</strong> — envio de e-mails dos formulários (EUA)</li>
          <li><strong>Vercel Inc.</strong> — hospedagem do site (EUA)</li>
        </ul>
        <p className="mt-2">Não vendemos dados pessoais a terceiros.</p>
      </Section2>

      <Section2 n="5" title="Transferência internacional de dados">
        {cfg.transferenciaInternacional ? (
          <p>
            Alguns dados são transferidos para servidores localizados fora do Brasil, em especial:{" "}
            <strong>{cfg.paisesTransferencia || "—"}</strong>. Essas transferências ocorrem com salvaguardas
            adequadas, conforme art. 33 e seguintes da LGPD.
          </p>
        ) : (
          <p>Não realizamos transferência internacional de dados pessoais.</p>
        )}
      </Section2>

      <Section2 n="6" title="Seus direitos (art. 18 LGPD)">
        <p>Você pode, a qualquer momento, solicitar:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Confirmação da existência de tratamento</li>
          <li>Acesso aos dados</li>
          <li>Correção de dados incompletos ou desatualizados</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
          <li>Portabilidade dos dados</li>
          <li>Eliminação dos dados tratados com consentimento</li>
          <li>Informação sobre compartilhamento com terceiros</li>
          <li>Revogação do consentimento</li>
        </ul>
        <p className="mt-2">
          Solicitações: <a href={`mailto:${cfg.emailContato}`} style={{ color: "var(--primary)" }}>{cfg.emailContato}</a>
        </p>
      </Section2>

      {(cfg.dpNome || cfg.dpEmail) && (
        <Section2 n="7" title="Encarregado (DPO)">
          <p>
            {cfg.dpNome || "—"} ·{" "}
            <a href={`mailto:${cfg.dpEmail}`} style={{ color: "var(--primary)" }}>{cfg.dpEmail || "—"}</a>
          </p>
        </Section2>
      )}

      <Section2 n={cfg.dpNome || cfg.dpEmail ? "8" : "7"} title="Alterações nesta política">
        <p>
          Esta política pode ser atualizada periodicamente. A versão vigente é a <strong>{cfg.versao}</strong>,
          publicada em <strong>{cfg.dataVersao}</strong>. Alterações significativas serão comunicadas no site.
        </p>
      </Section2>

      <div
        className="mt-6 rounded-lg px-4 py-3 text-xs flex items-start gap-2"
        style={{
          background: "color-mix(in srgb,var(--ink-muted) 8%,transparent)",
          color: "var(--ink-muted)",
        }}
      >
        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
        <span>
          Este documento é gerado automaticamente com base nas configurações do painel e{" "}
          <strong>não substitui assessoria jurídica especializada</strong>. Consulte um advogado para
          validar a aderência à LGPD e às particularidades do seu negócio.
        </span>
      </div>
    </div>
  );
}

function Section2({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="font-bold mb-1" style={{ color: "var(--ink)" }}>
        {n}. {title.toUpperCase()}
      </p>
      <div className="text-xs leading-relaxed space-y-1" style={{ color: "var(--ink)" }}>
        {children}
      </div>
      <div className="mt-3 border-t" style={{ borderColor: "var(--line)" }} />
    </div>
  );
}

/* ─── Completeness indicator ─────────────────────────────────── */

function Completeness({ cfg }: { cfg: PrivacidadeConfig }) {
  const checks = [
    { label: "CNPJ", ok: !!cfg.cnpj },
    { label: "Endereço", ok: !!cfg.endereco },
    { label: "E-mail de contato", ok: !!cfg.emailContato },
    { label: "DPO (opcional)", ok: !!(cfg.dpNome && cfg.dpEmail), optional: true },
    { label: "Retenções definidas", ok: !!(cfg.retencaoFormularios && cfg.retencaoAnaliticos && cfg.retencaoMarketing) },
    { label: "Versão e data", ok: !!(cfg.versao && cfg.dataVersao) },
  ];
  const required = checks.filter((c) => !c.optional);
  const done = required.filter((c) => c.ok).length;
  const pct = Math.round((done / required.length) * 100);

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>Completude do documento</span>
        <span
          className="text-xs font-bold"
          style={{ color: pct === 100 ? "var(--success)" : "var(--accent)" }}
        >
          {pct}%
        </span>
      </div>
      <div className="w-full rounded-full h-1.5 mb-3" style={{ background: "var(--line)" }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "var(--success)" : "var(--primary)",
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs" style={{ color: c.ok ? "var(--success)" : c.optional ? "var(--ink-muted)" : "var(--danger)" }}>
            <Check size={11} className={c.ok ? "" : "opacity-0"} />
            {!c.ok && <span className="w-2.5 h-2.5 rounded-full border inline-block" style={{ borderColor: c.optional ? "var(--ink-muted)" : "var(--danger)" }} />}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function PoliticaPage() {
  const { privacidadeConfig: cfg, setPrivacidadeConfig: set, aparencia, formularios } = useStore();
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");
  // O que o site REALMENTE tem configurado (googleAnalyticsId/metaPixelId
  // etc.) — a prévia só pode falar de GA4/Meta Pixel se isso for true.
  // Achado real (Relatório de Testes 4, erro 59): a prévia mostrava essas
  // seções sempre, mesmo em site sem nenhum dos dois configurados.
  const [integ, setInteg] = useState<IntegracoesAtivas>({ analiticos: false, marketing: false });

  // Pré-preencher com o que já foi salvo em dados/legal.json (fonte de
  // verdade — ver lib/legal.ts), e o e-mail real do config como reserva.
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config) return;
        const c = data.config;
        if (data.config.integracoesAtivas) {
          setInteg({
            analiticos: !!data.config.integracoesAtivas.analiticos,
            marketing: !!data.config.integracoesAtivas.marketing,
          });
        }
        const lp: Partial<LegalPainel> = data.config.legalPainel ?? {};
        const patch: Partial<PrivacidadeConfig> = {};
        if (lp.cnpj) patch.cnpj = lp.cnpj;
        if (lp.endereco) patch.endereco = lp.endereco;
        if (lp.emailContato) patch.emailContato = lp.emailContato;
        else if (c.email && !cfg.emailContato) patch.emailContato = c.email;
        if (lp.dpNome) patch.dpNome = lp.dpNome;
        if (lp.dpEmail) patch.dpEmail = lp.dpEmail;
        if (lp.baseLegalFormularios) patch.baseLegalFormularios = lp.baseLegalFormularios as BaseLegal;
        if (lp.retencaoFormularios) patch.retencaoFormularios = lp.retencaoFormularios;
        if (lp.baseLegalAnaliticos) patch.baseLegalAnaliticos = lp.baseLegalAnaliticos as BaseLegal;
        if (lp.retencaoAnaliticos) patch.retencaoAnaliticos = lp.retencaoAnaliticos;
        if (lp.baseLegalMarketing) patch.baseLegalMarketing = lp.baseLegalMarketing as BaseLegal;
        if (lp.retencaoMarketing) patch.retencaoMarketing = lp.retencaoMarketing;
        if (lp.transferenciaInternacional !== undefined) patch.transferenciaInternacional = lp.transferenciaInternacional;
        if (lp.paisesTransferencia) patch.paisesTransferencia = lp.paisesTransferencia;
        if (lp.versaoPolitica) patch.versao = lp.versaoPolitica;
        if (lp.atualizadaEm) patch.dataVersao = lp.atualizadaEm;
        if (Object.keys(patch).length > 0) set(patch);
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set1 = (key: keyof PrivacidadeConfig) => (v: string | boolean) =>
    set({ [key]: v } as Partial<PrivacidadeConfig>);

  async function salvar() {
    setSalvando(true);
    try {
      const legalPainel: Partial<LegalPainel> = {
        cnpj: cfg.cnpj,
        endereco: cfg.endereco,
        emailContato: cfg.emailContato,
        dpNome: cfg.dpNome,
        dpEmail: cfg.dpEmail,
        baseLegalFormularios: cfg.baseLegalFormularios,
        retencaoFormularios: cfg.retencaoFormularios,
        baseLegalAnaliticos: cfg.baseLegalAnaliticos,
        retencaoAnaliticos: cfg.retencaoAnaliticos,
        baseLegalMarketing: cfg.baseLegalMarketing,
        retencaoMarketing: cfg.retencaoMarketing,
        transferenciaInternacional: cfg.transferenciaInternacional,
        paisesTransferencia: cfg.paisesTransferencia,
        versaoPolitica: cfg.versao,
        atualizadaEm: cfg.dataVersao,
      };
      const r = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalPainel }),
      });
      const data = await r.json();
      if (data.ok) {
        setErroSalvar("");
        setSalvo(true);
        setTimeout(() => setSalvo(false), 2200);
      } else {
        setErroSalvar(Object.values((data.erros ?? {}) as Record<string, string>).join(" ") || data.erro || "Não foi possível salvar.");
      }
    } catch (err) {
      console.error("[privacidade/politica] falha ao salvar:", err);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex min-h-screen gap-6 p-6" style={{ background: "var(--surface)" }}>
      {/* ── Left: controls ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText size={20} style={{ color: "var(--primary)" }} />
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--ink)" }}>
              Política de Privacidade
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
              Gerada automaticamente a partir das configurações do site
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {erroSalvar && <span className="text-xs max-w-xs" style={{ color: "var(--danger, #c0392b)" }}>{erroSalvar}</span>}
            {salvo && <span className="text-xs" style={{ color: "var(--success)" }}>Salvo — publica no próximo build</span>}
            <button
              onClick={salvar}
              disabled={salvando}
              className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--primary)" }}
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>

        {/* Legal warning */}
        <div
          className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: "color-mix(in srgb,var(--accent) 10%,transparent)", color: "var(--accent)" }}
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            Este gerador não substitui assessoria jurídica. Use-o como base e valide com um advogado
            especializado em LGPD.
          </span>
        </div>

        {/* Completeness */}
        <Completeness cfg={cfg} />

        {/* Controlador */}
        <Section icon={Shield} title="Controlador dos dados">
          <Field>
            <div className="flex items-center gap-2">
              <Label>Nome do controlador</Label>
              <ChipAuto />
            </div>
            <Input value={aparencia.nomeSite} disabled />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label required>CNPJ</Label>
              <Input
                value={cfg.cnpj}
                onChange={set1("cnpj")}
                placeholder="00.000.000/0001-00"
              />
            </Field>
            <Field>
              <Label required>E-mail de contato</Label>
              <Input
                type="email"
                value={cfg.emailContato}
                onChange={set1("emailContato")}
                placeholder="contato@exemplo.com.br"
                invalido={!!cfg.emailContato && !EMAIL_VALIDO.test(cfg.emailContato)}
              />
              {!!cfg.emailContato && !EMAIL_VALIDO.test(cfg.emailContato) && (
                <p className="text-xs" style={{ color: "var(--danger)" }}>
                  Não parece um e-mail válido (formato esperado: nome@dominio.com).
                </p>
              )}
            </Field>
          </div>
          <Field>
            <Label required>Endereço completo</Label>
            <Input
              value={cfg.endereco}
              onChange={set1("endereco")}
              placeholder="Rua, número, bairro, cidade — SP, CEP 00000-000"
            />
          </Field>
        </Section>

        {/* DPO */}
        <Section icon={User} title="Encarregado (DPO)" defaultOpen={false}>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Opcional para microempresas (Resolução CD/ANPD nº 2/2022), mas recomendado para
            serviços de saúde que tratam dados sensíveis.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Nome do DPO</Label>
              <Input
                value={cfg.dpNome}
                onChange={set1("dpNome")}
                placeholder="Nome completo"
              />
            </Field>
            <Field>
              <Label>E-mail do DPO</Label>
              <Input
                value={cfg.dpEmail}
                onChange={set1("dpEmail")}
                placeholder="dpo@exemplo.com.br"
              />
            </Field>
          </div>
        </Section>

        {/* Bases legais e retenção */}
        <Section icon={Lock} title="Bases legais e retenção">
          <div className="text-xs rounded-lg p-3" style={{ background: "var(--surface)", color: "var(--ink-muted)" }}>
            Dados coletados via formulários e cookies detectados automaticamente a partir das
            configurações do painel.
          </div>

          {/* Formulários */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>Dados de formulários</p>
              <ChipAuto label="Formulários do painel" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Base legal</Label>
                <Select
                  value={cfg.baseLegalFormularios}
                  onChange={(v) => set({ baseLegalFormularios: v as BaseLegal })}
                  options={BASES_LEGAIS.map((b) => ({ id: b.id, label: b.label }))}
                />
              </Field>
              <Field>
                <Label>Prazo de retenção</Label>
                <Input
                  value={cfg.retencaoFormularios}
                  onChange={set1("retencaoFormularios")}
                  placeholder="Ex: 5 anos"
                />
              </Field>
            </div>
          </div>

          <Divider />

          {/* Analíticos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>Cookies analíticos (GA4)</p>
              <ChipAuto label="Cookie config" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Base legal</Label>
                <Select
                  value={cfg.baseLegalAnaliticos}
                  onChange={(v) => set({ baseLegalAnaliticos: v as BaseLegal })}
                  options={BASES_LEGAIS.map((b) => ({ id: b.id, label: b.label }))}
                />
              </Field>
              <Field>
                <Label>Prazo de retenção</Label>
                <Input
                  value={cfg.retencaoAnaliticos}
                  onChange={set1("retencaoAnaliticos")}
                  placeholder="Ex: 14 meses"
                />
              </Field>
            </div>
          </div>

          <Divider />

          {/* Marketing */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>Cookies de marketing (Meta + Google Ads)</p>
              <ChipAuto label="Cookie config" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Base legal</Label>
                <Select
                  value={cfg.baseLegalMarketing}
                  onChange={(v) => set({ baseLegalMarketing: v as BaseLegal })}
                  options={BASES_LEGAIS.map((b) => ({ id: b.id, label: b.label }))}
                />
              </Field>
              <Field>
                <Label>Prazo de retenção</Label>
                <Input
                  value={cfg.retencaoMarketing}
                  onChange={set1("retencaoMarketing")}
                  placeholder="Ex: 90 dias"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Transferência internacional */}
        <Section icon={Globe} title="Transferência internacional de dados">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                Transferência internacional
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                Ative se usar serviços hospedados fora do Brasil (Google, Meta, Vercel…)
              </p>
            </div>
            <button
              onClick={() => set({ transferenciaInternacional: !cfg.transferenciaInternacional })}
              className="relative w-10 h-6 rounded-full transition-colors shrink-0"
              style={{ background: cfg.transferenciaInternacional ? "var(--primary)" : "var(--line)" }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: cfg.transferenciaInternacional ? "22px" : "2px" }}
              />
            </button>
          </div>
          {cfg.transferenciaInternacional && (
            <Field>
              <Label>Países e empresas destinatárias</Label>
              <Input
                value={cfg.paisesTransferencia}
                onChange={set1("paisesTransferencia")}
                placeholder="Ex: Estados Unidos (Google LLC, Meta Platforms Inc.)"
              />
            </Field>
          )}
        </Section>

        {/* Versão */}
        <Section icon={BookOpen} title="Versão e vigência">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Número da versão</Label>
              <Input
                value={cfg.versao}
                onChange={set1("versao")}
                placeholder="1.0"
              />
            </Field>
            <Field>
              <Label>Data de entrada em vigor</Label>
              <Input
                type="date"
                value={cfg.dataVersao}
                onChange={set1("dataVersao")}
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* ── Right: live preview ── */}
      <div className="w-[420px] shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} style={{ color: "var(--ink-muted)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
              Pré-visualização
            </span>
          </div>
          <div
            className="rounded-xl border overflow-y-auto p-5"
            style={{
              borderColor: "var(--line)",
              background: "var(--surface-2)",
              maxHeight: "calc(100vh - 120px)",
            }}
          >
            <PolicyDocument cfg={cfg} nomeSite={aparencia.nomeSite} formularios={formularios} integ={integ} />
          </div>
        </div>
      </div>
    </div>
  );
}
