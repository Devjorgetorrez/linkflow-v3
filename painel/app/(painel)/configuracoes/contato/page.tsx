"use client";

import { Globe, MapPin, Phone, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Campo, Entrada, Selecao } from "@/components/ui";
import { cepValido, emailValido, telefoneValido, ufValida, whatsappValido } from "@/lib/site-config";
import { diffCampos, enviarConfig } from "@/lib/site-config-cliente";
import { useStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Modelo                                                              */
/* ------------------------------------------------------------------ */

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

/** Horário como o site guarda: texto livre ("Segunda a Sexta" / "8h às 18h"). */
interface LinhaHorario { dia: string; hora: string }

const CAMPOS = [
  "telefone", "telefone2", "whatsapp", "email",
  "logradouro", "complemento", "bairro", "cidade", "uf", "cep",
] as const;
type CampoContato = (typeof CAMPOS)[number];
type ValoresContato = Record<CampoContato, string>;

const VAZIO: ValoresContato = {
  telefone: "", telefone2: "", whatsapp: "", email: "",
  logradouro: "", complemento: "", bairro: "", cidade: "", uf: "", cep: "",
};

/** Validação inline (mesmos validadores do servidor). Campo vazio é válido. */
function validarCampos(alt: Partial<ValoresContato>): Record<string, string> {
  const e: Record<string, string> = {};
  const tem = (v?: string) => !!v && v.trim() !== "";
  if (tem(alt.telefone) && !telefoneValido(alt.telefone!)) e["nap.telefone"] = "Telefone inválido — use DDD + número.";
  if (tem(alt.telefone2) && !telefoneValido(alt.telefone2!)) e["nap.telefone2"] = "Telefone secundário inválido — use DDD + número.";
  if (tem(alt.whatsapp) && !whatsappValido(alt.whatsapp!)) e["nap.whatsapp"] = "WhatsApp inválido — use DDD + número (com 55, se preferir).";
  if (tem(alt.email) && !emailValido(alt.email!)) e["nap.email"] = "E-mail inválido.";
  if (tem(alt.uf) && !ufValida(alt.uf!)) e["nap.uf"] = "UF inválida — use 2 letras (ex.: SP).";
  if (tem(alt.cep) && !cepValido(alt.cep!)) e["nap.cep"] = "CEP inválido — use 8 dígitos (ex.: 13201-000).";
  if (tem(alt.cidade) && alt.cidade!.trim().length < 2) e["nap.cidade"] = "Cidade inválida.";
  return e;
}

/* ------------------------------------------------------------------ */
/* JSON-LD LocalBusiness preview                                       */
/* ------------------------------------------------------------------ */

function gerarJsonLd(params: {
  tipo: string;
  nome: string;
  v: ValoresContato;
  horarios: LinhaHorario[];
}) {
  const { tipo, nome, v, horarios } = params;

  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": tipo || "LocalBusiness",
    name: nome || "—",
    url: "",  // preenchido via config real
  };

  if (v.telefone) obj.telephone = v.telefone;
  if (v.email) obj.email = v.email;
  if (v.whatsapp && v.whatsapp !== v.telefone) obj.contactPoint = {
    "@type": "ContactPoint",
    telephone: v.whatsapp,
    contactType: "customer support",
    availableLanguage: "Portuguese",
  };

  if (v.logradouro) {
    const end: Record<string, string> = {
      "@type": "PostalAddress",
      streetAddress: [v.logradouro, v.complemento].filter(Boolean).join(", "),
      addressLocality: v.cidade,
      addressRegion: v.uf,
      postalCode: v.cep,
      addressCountry: "BR",
    };
    if (v.bairro) end.addressLocality = `${v.cidade} — ${v.bairro}`;
    obj.address = end;
  }

  const ativos = horarios.filter((h) => h.dia.trim() && h.hora.trim());
  if (ativos.length > 0) {
    obj.openingHours = ativos.map((h) => `${h.dia.trim()} ${h.hora.trim()}`);
  }

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

function MsgErro({ texto }: { texto?: string }) {
  if (!texto) return null;
  return <p className="mt-1 text-[11px] text-[var(--danger)]">{texto}</p>;
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function ContatoPage() {
  const { configIdentidade } = useStore();

  const [nomeSite, setNomeSite] = useState("");
  const [v, setV] = useState<ValoresContato>({ ...VAZIO });
  const [horarios, setHorarios] = useState<LinhaHorario[]>([]);
  // Valores como vieram do servidor: o Salvar envia só o que difere deles.
  const [original, setOriginal] = useState<ValoresContato>({ ...VAZIO });
  const [horariosOriginais, setHorariosOriginais] = useState<LinhaHorario[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [feedbackSalvar, setFeedbackSalvar] = useState<"ok" | "erro" | null>(null);
  const [mensagem, setMensagem] = useState("");

  // Carregar dados reais ao montar (TODOS os campos da tela)
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config) return;
        const c = data.config;
        const lido = {} as ValoresContato;
        for (const k of CAMPOS) lido[k] = String(c[k] ?? "");
        setV(lido);
        setOriginal(lido);
        const hs: LinhaHorario[] = Array.isArray(c.horarios)
          ? c.horarios.map((h: LinhaHorario) => ({ dia: String(h.dia ?? ""), hora: String(h.hora ?? "") }))
          : [];
        setHorarios(hs);
        setHorariosOriginais(hs);
        setNomeSite(String(c.nome ?? ""));
        setCarregado(true);
      })
      .catch(console.error);
  }, []);

  const set = (k: CampoContato) => (valor: string) => setV((x) => ({ ...x, [k]: valor }));

  function atualizarHorario(i: number, patch: Partial<LinhaHorario>) {
    setHorarios((lista) => lista.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  }

  function adicionarHorario() {
    setHorarios((lista) => [...lista, { dia: "", hora: "" }]);
  }

  function removerHorario(i: number) {
    setHorarios((lista) => lista.filter((_, j) => j !== i));
  }

  async function salvar() {
    setMensagem("");
    setFeedbackSalvar(null);
    if (!carregado) {
      setFeedbackSalvar("erro");
      setMensagem("Os dados do site ainda não foram carregados — nada foi enviado.");
      return;
    }

    // Só o que mudou; o que ficou vazio sobre valor existente vai em `limpar`.
    const { alterados, limpar } = diffCampos(original, v, "nap.");
    const errosLocais = validarCampos(alterados);

    const linhas = horarios
      .map((h) => ({ dia: h.dia.trim(), hora: h.hora.trim() }))
      .filter((h) => h.dia !== "" || h.hora !== "");
    horarios.forEach((h, i) => {
      const dia = h.dia.trim();
      const hora = h.hora.trim();
      if ((dia !== "" || hora !== "") && (dia === "" || hora === "")) {
        errosLocais[`horarios.${i}`] = "Preencha o dia e o horário.";
      }
    });

    if (Object.keys(errosLocais).length) {
      setErros(errosLocais);
      setFeedbackSalvar("erro");
      setMensagem("Corrija os campos destacados. Nada foi enviado.");
      return;
    }
    setErros({});

    const body: Record<string, unknown> = { ...alterados };
    const horariosMudaram = JSON.stringify(linhas) !== JSON.stringify(horariosOriginais);
    if (horariosMudaram) {
      body.horarios = linhas;
      if (linhas.length === 0 && horariosOriginais.length > 0) limpar.push("horarios");
    }
    if (limpar.length) body.limpar = limpar;

    if (Object.keys(body).length === 0) {
      setFeedbackSalvar("ok");
      setMensagem("Nada foi alterado.");
      setTimeout(() => setFeedbackSalvar(null), 3000);
      return;
    }

    setSalvando(true);
    const r = await enviarConfig(body);
    setSalvando(false);
    if (!r.ok) {
      setErros(r.erros);
      setFeedbackSalvar("erro");
      setMensagem(r.erro);
      return;
    }
    // CEP é normalizado pelo servidor (00000-000): reflete na tela.
    const novo = { ...v };
    for (const k of Object.keys(alterados)) novo[k as CampoContato] = alterados[k];
    setOriginal(novo);
    setHorariosOriginais(linhas);
    setFeedbackSalvar("ok");
    setMensagem(r.aviso);
    setTimeout(() => setFeedbackSalvar(null), r.aviso ? 8000 : 3000);
  }

  const jsonLd = useMemo(
    () => gerarJsonLd({ tipo: configIdentidade.tipoNegocio, nome: nomeSite, v, horarios }),
    [v, horarios, configIdentidade.tipoNegocio, nomeSite],
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Contato e NAP</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Telefone, e-mail, endereço e horários de funcionamento.
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

      {/* ── Telefone / WhatsApp / E-mail ──────────────── */}
      <Secao titulo="Telefone, WhatsApp e e-mail" icone={Phone}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Telefone principal">
            <Entrada
              value={v.telefone}
              onChange={(e) => set("telefone")(e.target.value)}
              invalido={!!erros["nap.telefone"]}
              placeholder="(11) 00000-0000"
            />
            <MsgErro texto={erros["nap.telefone"]} />
          </Campo>
          <Campo label="Telefone secundário">
            <Entrada
              value={v.telefone2}
              onChange={(e) => set("telefone2")(e.target.value)}
              invalido={!!erros["nap.telefone2"]}
              placeholder="(11) 00000-0000"
            />
            <MsgErro texto={erros["nap.telefone2"]} />
          </Campo>
          <Campo label="WhatsApp">
            <Entrada
              value={v.whatsapp}
              onChange={(e) => set("whatsapp")(e.target.value)}
              invalido={!!erros["nap.whatsapp"]}
              placeholder="(11) 00000-0000"
            />
            <MsgErro texto={erros["nap.whatsapp"]} />
          </Campo>
          <Campo label="E-mail de contato">
            <Entrada
              type="email"
              value={v.email}
              onChange={(e) => set("email")(e.target.value)}
              invalido={!!erros["nap.email"]}
              placeholder="contato@seudominio.com.br"
            />
            <MsgErro texto={erros["nap.email"]} />
          </Campo>
        </div>
      </Secao>

      {/* ── Endereço ─────────────────────────────────── */}
      <Secao titulo="Endereço (NAP)" icone={MapPin}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <Campo label="Logradouro (com número)">
              <Entrada
                value={v.logradouro}
                onChange={(e) => set("logradouro")(e.target.value)}
                placeholder="Rua, Avenida… e número"
              />
            </Campo>
          </div>
          <div className="sm:col-span-3">
            <Campo label="Complemento">
              <Entrada
                value={v.complemento}
                onChange={(e) => set("complemento")(e.target.value)}
                placeholder="Sala, andar, apto…"
              />
            </Campo>
          </div>
          <div className="sm:col-span-3">
            <Campo label="Bairro">
              <Entrada
                value={v.bairro}
                onChange={(e) => set("bairro")(e.target.value)}
                placeholder="Bairro"
              />
            </Campo>
          </div>
          <div className="sm:col-span-3">
            <Campo label="Cidade">
              <Entrada
                value={v.cidade}
                onChange={(e) => set("cidade")(e.target.value)}
                invalido={!!erros["nap.cidade"]}
                placeholder="Cidade"
              />
              <MsgErro texto={erros["nap.cidade"]} />
            </Campo>
          </div>
          <div className="sm:col-span-1">
            <Campo label="UF">
              <Selecao
                value={v.uf}
                onChange={(e) => set("uf")(e.target.value)}
              >
                <option value="">—</option>
                {ESTADOS_BR.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </Selecao>
              <MsgErro texto={erros["nap.uf"]} />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo label="CEP">
              <Entrada
                value={v.cep}
                onChange={(e) => set("cep")(e.target.value)}
                invalido={!!erros["nap.cep"]}
                placeholder="00000-000"
                maxLength={9}
              />
              <MsgErro texto={erros["nap.cep"]} />
            </Campo>
          </div>
        </div>
      </Secao>

      {/* ── Horários de funcionamento ─────────────────── */}
      <Secao titulo="Horários de funcionamento" icone={Globe}>
        <div className="space-y-2.5">
          {horarios.length === 0 && (
            <p className="text-xs text-[var(--ink-muted)]">Nenhum horário cadastrado.</p>
          )}
          {horarios.map((h, i) => (
            <div key={i}>
              <div className="flex items-center gap-2">
                <Entrada
                  value={h.dia}
                  onChange={(e) => atualizarHorario(i, { dia: e.target.value })}
                  invalido={!!erros[`horarios.${i}`]}
                  placeholder="Dias — ex.: Segunda a Sexta"
                  aria-label="Dias"
                  className="flex-1"
                />
                <Entrada
                  value={h.hora}
                  onChange={(e) => atualizarHorario(i, { hora: e.target.value })}
                  invalido={!!erros[`horarios.${i}`]}
                  placeholder="Horário — ex.: 8h às 18h"
                  aria-label="Horário"
                  className="flex-1"
                />
                <button
                  onClick={() => removerHorario(i)}
                  className="shrink-0 p-1 text-[var(--ink-muted)] hover:text-[var(--danger)]"
                  title="Remover linha"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <MsgErro texto={erros[`horarios.${i}`]} />
            </div>
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
          Texto livre, exibido como está no site (ex.: <code className="font-mono">Segunda a Sexta</code> ·{" "}
          <code className="font-mono">8h às 18h</code>).
        </p>
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
