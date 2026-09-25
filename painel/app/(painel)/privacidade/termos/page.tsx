"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Heart,
  Info,
  MapPin,
  Power,
  ShieldAlert,
  ToggleLeft,
} from "lucide-react";
import { useStore, type TermosConfig } from "@/lib/store";
import type { LegalPainel } from "@/lib/legal";

/* ─── Small reusable pieces ─────────────────────────────────── */

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
      {children}
      {required && <span className="ml-1" style={{ color: "var(--danger)" }}>*</span>}
    </label>
  );
}

function Input({
  value, onChange, placeholder, type,
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: "text" | "date" }) {
  return (
    <input
      type={type ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded border px-3 py-2 text-sm"
      style={{ borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--ink)" }}
    />
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-10 h-6 rounded-full transition-colors shrink-0"
      style={{ background: on ? "var(--primary)" : "var(--line)" }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: on ? "22px" : "2px" }}
      />
    </button>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
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
          {badge}
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

/* ─── Terms of Use preview document ────────────────────────── */

function TermosDoc({
  cfg,
  nomeSite,
  emailContato,
}: {
  cfg: TermosConfig;
  nomeSite: string;
  emailContato: string;
}) {
  return (
    <div className="text-sm leading-relaxed" style={{ color: "var(--ink)", fontFamily: "var(--font-body, inherit)" }}>
      <div className="mb-5 text-center">
        <h1 className="text-lg font-bold mb-1" style={{ color: "var(--ink)" }}>
          Termos de Uso
        </h1>
        <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
          {nomeSite} · Versão {cfg.versao} · Vigente desde {cfg.dataVersao}
        </p>
      </div>

      <TermItem n="1" title="ACEITAÇÃO DOS TERMOS">
        Ao acessar e utilizar este site, você concorda com estes Termos de Uso. Se não concordar com
        qualquer disposição, por favor interrompa o uso do site.
      </TermItem>

      <TermItem n="2" title="NATUREZA DO CONTEÚDO">
        O conteúdo disponível neste site é de caráter exclusivamente informativo e não substitui o
        atendimento profissional. Para o seu caso específico, entre em contato pelos canais do site.
      </TermItem>

      <TermItem n="3" title="CONTATO">
        As solicitações enviadas pelos formulários deste site estão sujeitas a retorno pela equipe.
        O simples envio do formulário não constitui contratação de serviço.
      </TermItem>

      <TermItem n="4" title="PROPRIEDADE INTELECTUAL">
        Todo o conteúdo deste site — textos, imagens, logotipos e demais elementos — é de
        propriedade de {nomeSite} ou utilizado com as devidas licenças. É proibida a reprodução,
        distribuição ou modificação sem autorização expressa.
      </TermItem>

      <TermItem n="5" title="LINKS EXTERNOS">
        Este site pode conter links para sites de terceiros. {nomeSite} não se responsabiliza pelo
        conteúdo, políticas de privacidade ou práticas desses sites.
      </TermItem>

      <TermItem n="6" title="LIMITAÇÃO DE RESPONSABILIDADE">
        {nomeSite} não se responsabiliza por decisões tomadas com base nas informações deste site,
        por interrupções temporárias de acesso, nem por danos decorrentes do uso indevido do conteúdo.
      </TermItem>

      <TermItem n="7" title="MODIFICAÇÕES">
        Estes termos podem ser atualizados a qualquer momento. A versão vigente é sempre a publicada
        nesta página. O uso contínuo do site após alterações implica aceitação dos novos termos.
      </TermItem>

      <TermItem n="8" title="LEI APLICÁVEL E FORO">
        Estes termos são regidos pelas leis da República Federativa do Brasil. As partes elegem o
        foro da comarca de {cfg.foroCidade || "—"}{cfg.foroUf ? ` — ${cfg.foroUf}` : ""} para dirimir
        eventuais conflitos, com renúncia expressa a qualquer outro.
      </TermItem>

      <div className="mt-4 text-xs border-t pt-3" style={{ borderColor: "var(--line)", color: "var(--ink-muted)" }}>
        Contato: <a href={`mailto:${emailContato}`} style={{ color: "var(--primary)" }}>{emailContato}</a>
      </div>
    </div>
  );
}

function TermItem({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="font-bold text-xs mb-1" style={{ color: "var(--ink)" }}>
        {n}. {title}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: "var(--ink)" }}>{children}</p>
      <div className="mt-3 border-t" style={{ borderColor: "var(--line)" }} />
    </div>
  );
}

/* ─── Sensitive data alert ──────────────────────────────────── */

function AlertaDadosSensiveis({
  formularios,
  avisoAtivo,
  onToggleAviso,
}: {
  formularios: { id: string; nome: string; campos: { tipo: string; rotulo: string }[]; ativo: boolean }[];
  avisoAtivo: boolean;
  onToggleAviso: () => void;
}) {
  const formsComMensagem = formularios.filter((f) =>
    f.campos.some((c) => c.tipo === "mensagem"),
  );

  if (formsComMensagem.length === 0) return null;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "color-mix(in srgb,var(--danger) 40%,transparent)" }}>
      {/* header */}
      <div
        className="px-4 py-3 flex items-start gap-3"
        style={{ background: "color-mix(in srgb,var(--danger) 8%,transparent)" }}
      >
        <ShieldAlert size={16} style={{ color: "var(--danger)", marginTop: 2 }} className="shrink-0" />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Dados sensíveis de saúde detectados
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
            Campos de texto livre em formulários de serviço de saúde podem receber dados sensíveis
            (LGPD art. 11). Exibir aviso específico ao visitante antes do envio.
          </p>
        </div>
      </div>

      {/* body */}
      <div className="px-4 py-4 flex flex-col gap-3" style={{ background: "var(--surface-2)" }}>
        {/* toggle global */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
              Ativar aviso de dado sensível nos formulários
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
              Exibe alerta no campo mensagem antes do envio
            </p>
          </div>
          <Toggle on={avisoAtivo} onToggle={onToggleAviso} />
        </div>

        {/* forms affected */}
        <div className="flex flex-col gap-2">
          {formsComMensagem.map((f) => {
            const camposMensagem = f.campos.filter((c) => c.tipo === "mensagem");
            return (
              <div
                key={f.id}
                className="rounded-lg border px-3 py-2.5"
                style={{ borderColor: "var(--line)", background: "var(--surface)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={12} style={{ color: "var(--primary)" }} />
                  <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
                    {f.nome}
                  </p>
                  {!f.ativo && (
                    <span className="text-[10px] rounded px-1.5 py-0.5" style={{ background: "var(--line)", color: "var(--ink-muted)" }}>
                      inativo
                    </span>
                  )}
                </div>
                {camposMensagem.map((c) => (
                  <p key={c.rotulo} className="text-xs ml-4" style={{ color: "var(--ink-muted)" }}>
                    Campo: <strong style={{ color: "var(--ink)" }}>{c.rotulo}</strong> — pode receber relato de
                    sintomas, histórico clínico ou outros dados sensíveis de saúde
                  </p>
                ))}
                {avisoAtivo && (
                  <div
                    className="mt-2 ml-4 rounded p-2 text-xs flex items-start gap-1.5"
                    style={{ background: "color-mix(in srgb,var(--accent) 10%,transparent)", color: "var(--accent)" }}
                  >
                    <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                    <span>
                      Aviso a exibir: "Este campo pode conter dados sensíveis de saúde (art. 11,
                      LGPD). Compartilhe apenas o que for necessário para o atendimento."
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {avisoAtivo && (
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
            style={{ background: "color-mix(in srgb,var(--primary) 8%,transparent)", color: "var(--primary)" }}
          >
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>
              O aviso será exibido como texto de ajuda abaixo do campo mensagem em cada formulário
              afetado. A base legal para esses dados deve estar declarada na Política de Privacidade.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function TermosPage() {
  const {
    termosConfig: cfg,
    setTermosConfig: set,
    aparencia,
    formularios,
    privacidadeConfig,
    setPrivacidadeConfig,
  } = useStore();

  const [emailReal, setEmailReal] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // Carregar email de contato real do config + pré-preencher com o que já
  // foi salvo em dados/legal.json (fonte de verdade — ver lib/legal.ts).
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config?.email) {
          setEmailReal(data.config.email);
          if (!privacidadeConfig.emailContato) {
            setPrivacidadeConfig({ emailContato: data.config.email });
          }
        }
        const lp: Partial<LegalPainel> = data.config?.legalPainel ?? {};
        const patch: Partial<TermosConfig> = {};
        if (lp.foroCidade) patch.foroCidade = lp.foroCidade;
        if (lp.foroUf) patch.foroUf = lp.foroUf;
        if (lp.vigenciaDesde) patch.dataVersao = lp.vigenciaDesde;
        if (Object.keys(patch).length > 0) set(patch);
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emailContato = privacidadeConfig.emailContato || emailReal || "contato@seusite.com.br";

  async function salvar() {
    setSalvando(true);
    try {
      const legalPainel: Partial<LegalPainel> = {
        foroCidade: cfg.foroCidade,
        foroUf: cfg.foroUf,
        vigenciaDesde: cfg.dataVersao,
      };
      const r = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalPainel }),
      });
      const data = await r.json();
      if (data.ok) {
        setSalvo(true);
        setTimeout(() => setSalvo(false), 2200);
      }
    } catch (err) {
      console.error("[privacidade/termos] falha ao salvar:", err);
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
          <BookOpen size={20} style={{ color: "var(--primary)" }} />
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--ink)" }}>
              Termos de Uso & Dados Sensíveis
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
              Termos de uso opcionais + alerta LGPD para dados sensíveis de saúde
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
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

        {/* Termos de Uso toggle */}
        <Section icon={ToggleLeft} title="Termos de Uso"
          badge={
            <span
              className="ml-2 text-[10px] font-semibold rounded px-2 py-0.5"
              style={{
                background: cfg.ativo
                  ? "color-mix(in srgb,var(--success) 15%,transparent)"
                  : "var(--line)",
                color: cfg.ativo ? "var(--success)" : "var(--ink-muted)",
              }}
            >
              {cfg.ativo ? "ATIVO" : "INATIVO"}
            </span>
          }
        >
          {/* master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                Ativar página de Termos de Uso
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                Quando ativo, gera o documento e exibe link no rodapé do site
              </p>
            </div>
            <Toggle on={cfg.ativo} onToggle={() => set({ ativo: !cfg.ativo })} />
          </div>

          {!cfg.ativo && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
              style={{ background: "var(--surface)", color: "var(--ink-muted)" }}
            >
              <Power size={12} className="mt-0.5 shrink-0" />
              <span>
                Termos de Uso desativados. O link não aparecerá no rodapé. Você pode ativar a
                qualquer momento sem perder as configurações abaixo.
              </span>
            </div>
          )}

          {/* config fields — always visible so user can fill before activating */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Cidade do foro</Label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-2.5" style={{ color: "var(--ink-muted)" }} />
                <input
                  value={cfg.foroCidade}
                  onChange={(e) => set({ foroCidade: e.target.value })}
                  placeholder="São Paulo"
                  className="w-full rounded border pl-8 pr-3 py-2 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--ink)" }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>UF do foro</Label>
              <Input value={cfg.foroUf} onChange={(v) => set({ foroUf: v.toUpperCase().slice(0, 2) })} placeholder="SP" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Número da versão</Label>
              <Input value={cfg.versao} onChange={(v) => set({ versao: v })} placeholder="1.0" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Data de entrada em vigor</Label>
            <Input type="date" value={cfg.dataVersao} onChange={(v) => set({ dataVersao: v })} />
          </div>

          {cfg.ativo && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
              style={{ background: "color-mix(in srgb,var(--primary) 8%,transparent)", color: "var(--primary)" }}
            >
              <Info size={12} className="mt-0.5 shrink-0" />
              <span>
                O documento é gerado automaticamente. Link adicionado ao rodapé em{" "}
                <strong>/termos-de-uso</strong>. Para personalizar seções específicas, edite o
                template diretamente no código.
              </span>
            </div>
          )}
        </Section>

        {/* Dados sensíveis de saúde */}
        <Section icon={Heart} title="Dados sensíveis de saúde" defaultOpen={true}>
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
            style={{ background: "color-mix(in srgb,var(--ink-muted) 8%,transparent)", color: "var(--ink-muted)" }}
          >
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>
              A LGPD (art. 11) exige base legal específica e cuidados adicionais para dados de saúde.
              Campos de texto livre em formulários de serviços de saúde são considerados de risco
              elevado pela ANPD.
            </span>
          </div>

          <AlertaDadosSensiveis
            formularios={formularios}
            avisoAtivo={cfg.avisoDadosSensiveis}
            onToggleAviso={() => set({ avisoDadosSensiveis: !cfg.avisoDadosSensiveis })}
          />
        </Section>

        {/* Legal note */}
        <div
          className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
          style={{ background: "color-mix(in srgb,var(--accent) 10%,transparent)", color: "var(--accent)" }}
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>
            Termos de Uso gerados automaticamente são um ponto de partida. Consulte um advogado
            especializado para validar as cláusulas conforme a atividade do consultório e a LGPD.
          </span>
        </div>
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
            className="rounded-xl border overflow-y-auto"
            style={{
              borderColor: "var(--line)",
              background: "var(--surface-2)",
              maxHeight: "calc(100vh - 120px)",
            }}
          >
            {cfg.ativo ? (
              <div className="p-5">
                <TermosDoc cfg={cfg} nomeSite={aparencia.nomeSite} emailContato={emailContato} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                <Power size={28} style={{ color: "var(--line)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
                  Termos de Uso desativados
                </p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Ative o toggle à esquerda para gerar e visualizar o documento.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
