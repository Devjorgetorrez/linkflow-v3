"use client";

import { Clock, Globe, MapPin, Phone, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Alternador, Botao, Campo, Entrada, Selecao } from "@/components/ui";
import { gerarJsonLd } from "@/lib/jsonld-previa";
import {
  DIAS_SEMANA,
  derivarHorarios,
  horaValida,
  separarNumero,
  type DiaSemana,
  type Funcionamento,
} from "@/lib/site-config";
import { enviarConfig, montarPatchContato, normalizarFuncionamento } from "@/lib/site-config-cliente";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Modelo                                                              */
/* ------------------------------------------------------------------ */

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

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

/** Período de funcionamento no editor (abre/fecha ficam no estado mesmo com "Fechado"). */
interface LinhaFunc { dias: DiaSemana[]; abre: string; fecha: string; fechado: boolean }

const ROTULO_DIA: Record<DiaSemana, string> = {
  seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom",
};
const ATALHOS_DIAS: { rotulo: string; dias: DiaSemana[] }[] = [
  { rotulo: "Seg–Sex", dias: ["seg", "ter", "qua", "qui", "sex"] },
  { rotulo: "Seg–Sáb", dias: ["seg", "ter", "qua", "qui", "sex", "sab"] },
  { rotulo: "Sáb–Dom", dias: ["sab", "dom"] },
  { rotulo: "Todos", dias: [...DIAS_SEMANA] },
];

function daLinha(f: Funcionamento): LinhaFunc {
  return { dias: [...(f.dias ?? [])], abre: f.abre ?? "", fecha: f.fecha ?? "", fechado: !!f.fechado };
}
function paraFuncionamento(l: LinhaFunc): Funcionamento {
  return { dias: l.dias, abre: l.abre, fecha: l.fecha, fechado: l.fechado };
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
  const [v, setV] = useState<ValoresContato>({ ...VAZIO });
  // O site guarda o número junto do logradouro ("Av. Dom Pedro II, 980"); a tela mostra separado.
  const [numero, setNumero] = useState("");
  const [func, setFunc] = useState<LinhaFunc[]>([]);
  const [area, setArea] = useState<string[]>([]);
  const [novaArea, setNovaArea] = useState("");
  const [online, setOnline] = useState(false);
  // Valores como vieram do servidor: o Salvar envia só o que difere deles.
  // `original.logradouro` é o valor COMPOSTO (rua + número), como no site.ts.
  const [original, setOriginal] = useState<ValoresContato>({ ...VAZIO });
  const [funcOriginal, setFuncOriginal] = useState<Funcionamento[]>([]);
  const [areaOriginal, setAreaOriginal] = useState<string[]>([]);
  const [onlineOriginal, setOnlineOriginal] = useState(false);
  // Resto do site (somente leitura aqui), para a prévia do JSON-LD
  const [base, setBase] = useState<Record<string, unknown>>({});
  const [textoAtual, setTextoAtual] = useState<{ dia: string; hora: string }[]>([]);
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
        setOriginal(lido);
        const { rua, numero: num } = separarNumero(lido.logradouro);
        setV({ ...lido, logradouro: rua });
        setNumero(num);
        const fs: Funcionamento[] = Array.isArray(c.funcionamento) ? c.funcionamento : [];
        setFunc(fs.map(daLinha));
        setFuncOriginal(fs);
        const ar: string[] = Array.isArray(c.areaAtendimento) ? c.areaAtendimento.map(String) : [];
        setArea(ar);
        setAreaOriginal(ar);
        setOnline(c.atendimentoOnline === true);
        setOnlineOriginal(c.atendimentoOnline === true);
        setTextoAtual(Array.isArray(c.horarios) ? c.horarios : []);
        setBase(c);
        setCarregado(true);
      })
      .catch(console.error);
  }, []);

  const set = (k: CampoContato) => (valor: string) => setV((x) => ({ ...x, [k]: valor }));

  function atualizarLinha(i: number, patch: Partial<LinhaFunc>) {
    setFunc((lista) => lista.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  }
  function alternarDia(i: number, dia: DiaSemana) {
    setFunc((lista) =>
      lista.map((h, j) =>
        j !== i ? h : { ...h, dias: DIAS_SEMANA.filter((d) => (d === dia ? !h.dias.includes(d) : h.dias.includes(d))) },
      ),
    );
  }
  function adicionarLinha() {
    setFunc((lista) => [...lista, { dias: ["seg", "ter", "qua", "qui", "sex"], abre: "08:00", fecha: "18:00", fechado: false }]);
  }
  function removerLinha(i: number) {
    setFunc((lista) => lista.filter((_, j) => j !== i));
  }

  function adicionarArea() {
    const t = novaArea.trim();
    if (!t) return;
    setArea((l) => (l.includes(t) ? l : [...l, t]));
    setNovaArea("");
  }

  async function salvar() {
    setMensagem("");
    setFeedbackSalvar(null);
    if (!carregado) {
      setFeedbackSalvar("erro");
      setMensagem("Os dados do site ainda não foram carregados — nada foi enviado.");
      return;
    }

    // Uma cidade digitada e não adicionada entra na lista.
    const areaFinal = novaArea.trim() && !area.includes(novaArea.trim()) ? [...area, novaArea.trim()] : area;

    const { body, erros: errosLocais } = montarPatchContato({
      original,
      atual: v,
      numero,
      funcOriginal,
      func: func.map(paraFuncionamento),
      areaOriginal,
      area: areaFinal,
      onlineOriginal,
      online,
    });

    if (Object.keys(errosLocais).length) {
      setErros(errosLocais);
      setFeedbackSalvar("erro");
      setMensagem("Corrija os campos destacados. Nada foi enviado.");
      return;
    }
    setErros({});

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
    // O que foi enviado passa a ser o original (o CEP volta normalizado pelo servidor).
    const novo = { ...original };
    for (const k of CAMPOS) if (k in body) novo[k] = String(body[k]);
    setOriginal(novo);
    if (areaFinal !== area) setArea(areaFinal);
    setNovaArea("");
    setAreaOriginal(areaFinal);
    setFuncOriginal(func.map(paraFuncionamento));
    setOnlineOriginal(online);
    // O servidor deriva o texto exibido a partir dos horários estruturados.
    if ("funcionamento" in body) setTextoAtual(derivarHorarios(normalizarFuncionamento(func.map(paraFuncionamento))));
    setFeedbackSalvar("ok");
    setMensagem(r.aviso);
    setTimeout(() => setFeedbackSalvar(null), r.aviso ? 8000 : 3000);
  }

  // Linhas com dias e horários válidos: base do texto derivado e do JSON-LD
  const linhasValidas = func.filter(
    (l) => l.dias.length && (l.fechado || (horaValida(l.abre) && horaValida(l.fecha) && l.abre < l.fecha)),
  );
  const textoDerivado = useMemo(
    () => derivarHorarios(normalizarFuncionamento(linhasValidas.map(paraFuncionamento))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [func],
  );

  const jsonLd = useMemo(
    () =>
      gerarJsonLd({
        nome: String(base.nome ?? ""),
        dominio: String(base.dominio ?? ""),
        slogan: String(base.slogan ?? ""),
        descricao: String(base.descricao ?? ""),
        anoFundacao: base.anoFundacao as number | null | undefined,
        faixaPreco: String(base.faixaPreco ?? ""),
        especialidade: String(base.especialidade ?? ""),
        schemaTipo: Array.isArray(base.schemaTipo) ? (base.schemaTipo as string[]) : [],
        logo: (base.logo ?? {}) as { src?: string },
        ogImagem: String(base.ogImagem ?? ""),
        credencial: (base.credencial ?? {}) as { conselho?: string },
        redes: (base.redes ?? {}) as Record<string, string>,
        nap: { ...v, logradouro: [v.logradouro.trim(), numero.trim()].filter(Boolean).join(", ") },
        funcionamento: linhasValidas.filter((l) => !l.fechado).map(paraFuncionamento),
        areaAtendimento: area,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, v, numero, func, area],
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Contato e NAP</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Telefone, e-mail, endereço, horários e área de atendimento.
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
          <div className="sm:col-span-4">
            <Campo label="Logradouro">
              <Entrada
                value={v.logradouro}
                onChange={(e) => set("logradouro")(e.target.value)}
                invalido={!!erros["nap.logradouro"]}
                placeholder="Rua, Avenida…"
              />
              <MsgErro texto={erros["nap.logradouro"]} />
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
      <Secao titulo="Horários de funcionamento" icone={Clock}>
        <div className="space-y-3">
          {func.length === 0 && (
            <p className="text-xs text-[var(--ink-muted)]">Nenhum horário estruturado cadastrado.</p>
          )}
          {func.map((h, i) => (
            <div key={i} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {DIAS_SEMANA.map((d) => (
                  <label
                    key={d}
                    className={cn(
                      "flex cursor-pointer items-center gap-1 rounded-[var(--radius)] border px-2 py-1 text-[11px]",
                      h.dias.includes(d)
                        ? "border-[var(--primary)] text-[var(--ink)]"
                        : "border-[var(--line)] text-[var(--ink-muted)]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={h.dias.includes(d)}
                      onChange={() => alternarDia(i, d)}
                      className="h-3 w-3 accent-[var(--primary)]"
                    />
                    {ROTULO_DIA[d]}
                  </label>
                ))}
                <span className="mx-1 text-[var(--line)]">|</span>
                {ATALHOS_DIAS.map((a) => (
                  <button
                    key={a.rotulo}
                    type="button"
                    onClick={() => atualizarLinha(i, { dias: a.dias })}
                    className="text-[11px] text-[var(--primary)] hover:underline"
                  >
                    {a.rotulo}
                  </button>
                ))}
                <button
                  onClick={() => removerLinha(i)}
                  className="ml-auto shrink-0 p-1 text-[var(--ink-muted)] hover:text-[var(--danger)]"
                  title="Remover linha"
                  aria-label="Remover linha"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                  <input
                    type="checkbox"
                    checked={h.fechado}
                    onChange={(e) => atualizarLinha(i, { fechado: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[var(--primary)]"
                  />
                  Fechado
                </label>
                {!h.fechado && (
                  <>
                    <Entrada
                      type="time"
                      value={h.abre}
                      onChange={(e) => atualizarLinha(i, { abre: e.target.value })}
                      invalido={!!erros[`funcionamento.${i}`]}
                      aria-label="Abre às"
                      className="w-28"
                    />
                    <span className="text-xs text-[var(--ink-muted)]">às</span>
                    <Entrada
                      type="time"
                      value={h.fecha}
                      onChange={(e) => atualizarLinha(i, { fecha: e.target.value })}
                      invalido={!!erros[`funcionamento.${i}`]}
                      aria-label="Fecha às"
                      className="w-28"
                    />
                  </>
                )}
              </div>
              <MsgErro texto={erros[`funcionamento.${i}`]} />
            </div>
          ))}
        </div>
        <button
          onClick={adicionarLinha}
          className="mt-3 flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
        >
          <Plus size={13} />
          Adicionar linha
        </button>

        <div className="mt-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-3">
          <p className="mb-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
            Texto que será exibido no site (gerado a partir dos horários acima)
          </p>
          {textoDerivado.length > 0 ? (
            <ul className="space-y-0.5 text-xs text-[var(--ink)]">
              {textoDerivado.map((h, i) => (
                <li key={i}>
                  <span className="font-medium">{h.dia}</span> · {h.hora}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--ink-muted)]">Nenhum horário para exibir.</p>
          )}
          {func.length === 0 && textoAtual.length > 0 && (
            <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
              O site hoje exibe: {textoAtual.map((h) => `${h.dia} ${h.hora}`).join(" · ")}. Ao cadastrar horários
              acima, esse texto passa a ser gerado por eles.
            </p>
          )}
        </div>
      </Secao>

      {/* ── Área de atendimento ───────────────────────── */}
      <Secao titulo="Área de atendimento" icone={Globe}>
        <div className="space-y-4">
          <Campo label="Cidades / regiões atendidas">
            <div className="flex items-center gap-2">
              <Entrada
                value={novaArea}
                onChange={(e) => setNovaArea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarArea();
                  }
                }}
                invalido={!!erros.areaAtendimento}
                placeholder="Digite uma cidade ou região e pressione Enter"
                className="flex-1"
              />
              <Botao tamanho="sm" onClick={adicionarArea}>Adicionar</Botao>
            </div>
            <MsgErro texto={erros.areaAtendimento} />
            {area.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {area.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] py-0.5 pr-1 pl-2.5 text-xs text-[var(--ink)]"
                  >
                    {a}
                    <button
                      onClick={() => setArea((l) => l.filter((x) => x !== a))}
                      className="rounded-full p-0.5 text-[var(--ink-muted)] hover:text-[var(--danger)]"
                      title={`Remover ${a}`}
                      aria-label={`Remover ${a}`}
                    >
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
              Usadas em <code className="font-mono">areaServed</code> nos dados estruturados. Sem nenhuma, o site usa a cidade do endereço.
            </p>
          </Campo>

          <Alternador
            ativo={online}
            onChange={setOnline}
            label="Atendimento on-line disponível"
            descricao="Indica que o negócio também atende à distância."
          />
        </div>
      </Secao>

      {/* ── Prévia JSON-LD do negócio ─────────────────── */}
      <section className="mb-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="mb-3 text-[11px] font-medium text-[var(--ink-muted)]">
          Prévia JSON-LD do negócio (dados reais do site + o que você está editando)
        </p>
        <pre className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
          {jsonLd}
        </pre>
      </section>
    </div>
  );
}
