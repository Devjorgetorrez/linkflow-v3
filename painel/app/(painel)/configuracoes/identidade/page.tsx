"use client";

import { AlertTriangle, Building2, Globe, Image as Img, Info, Lock, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { DescricaoSite, MidiaSite, useIdentidadeVisual } from "@/components/IdentidadeVisual";
import { Campo, Entrada, Rotulo, Selecao } from "@/components/ui";
import { gerarJsonLd } from "@/lib/jsonld-previa";
import type { Funcionamento } from "@/lib/site-config";
import { diffLista, enviarConfig, montarPatchPlano, validarBody } from "@/lib/site-config-cliente";
import { GRUPOS_TIPOS_SCHEMA, MAX_TIPOS_SCHEMA, rotuloTipoSchema } from "@/lib/tipos-schema";
import { useDominio } from "@/lib/useDominio";

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

function MsgErro({ texto }: { texto?: string }) {
  if (!texto) return null;
  return <p className="mt-1 text-[11px] text-[var(--danger)]">{texto}</p>;
}

/** Campos próprios desta tela (as chaves com ponto vão aninhadas no PATCH: credencial.registro). */
const CAMPOS = [
  "nome", "slogan", "anoFundacao", "cnpj", "razaoSocial",
  "credencial.conselho", "credencial.registro", "credencial.responsavel",
  "especialidade", "faixaPreco",
] as const;
type Valores = Record<(typeof CAMPOS)[number], string>;
const VAZIO = Object.fromEntries(CAMPOS.map((k) => [k, ""])) as Valores;

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function IdentidadePage() {
  const dominio = useDominio();

  const [v, setV] = useState<Valores>({ ...VAZIO });
  // Valores como vieram do servidor: o Salvar envia só o que difere deles.
  const [original, setOriginal] = useState<Valores>({ ...VAZIO });
  const [tipos, setTipos] = useState<string[]>([]);
  const [tiposOriginal, setTiposOriginal] = useState<string[]>([]);
  // Descrição + mídia: estado compartilhado com Aparência › Personalizar
  const visual = useIdentidadeVisual();
  // Resto do site (somente leitura aqui), para a prévia do JSON-LD
  const [base, setBase] = useState<Record<string, unknown>>({});
  const [carregado, setCarregado] = useState(false);
  const [gateAviso, setGateAviso] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [feedbackSalvar, setFeedbackSalvar] = useState<"ok" | "erro" | null>(null);
  const [mensagem, setMensagem] = useState("");

  const { hidratar } = visual;

  // Carregar config real do servidor ao montar
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          const c = data.config;
          const cred = (c.credencial ?? {}) as Record<string, unknown>;
          const lido: Valores = {
            nome: String(c.nome ?? ""),
            slogan: String(c.slogan ?? ""),
            anoFundacao: c.anoFundacao == null ? "" : String(c.anoFundacao),
            cnpj: String(c.cnpj ?? ""),
            razaoSocial: String(c.razaoSocial ?? ""),
            "credencial.conselho": String(cred.conselho ?? ""),
            "credencial.registro": String(cred.registro ?? ""),
            "credencial.responsavel": String(cred.responsavel ?? ""),
            especialidade: String(c.especialidade ?? ""),
            faixaPreco: String(c.faixaPreco ?? ""),
          };
          setV(lido);
          setOriginal(lido);
          const st: string[] = Array.isArray(c.schemaTipo) ? c.schemaTipo.map(String) : [];
          setTipos(st);
          setTiposOriginal(st);
          hidratar(c);
          setBase(c);
          setCarregado(true);
        }
      })
      .catch(console.error);
  }, [hidratar]);

  const set = (k: keyof Valores) => (valor: string) => setV((x) => ({ ...x, [k]: valor }));

  async function salvar() {
    setMensagem("");
    setFeedbackSalvar(null);
    if (!carregado || !visual.carregado) {
      setFeedbackSalvar("erro");
      setMensagem("Os dados do site ainda não foram carregados — nada foi enviado.");
      return;
    }

    // Um único PATCH: campos desta tela + descrição/mídia + tipos
    const { body, limpar } = montarPatchPlano(
      { ...original, ...visual.original },
      { ...v, ...visual.valores },
    );
    const t = diffLista(tiposOriginal, tipos);
    if (t.mudou) {
      body.schemaTipo = t.lista;
      if (t.esvaziou) limpar.push("schemaTipo");
    }
    const e = validarBody(body);
    if (Object.keys(e).length) {
      setErros(e);
      visual.setErros(e);
      setFeedbackSalvar("erro");
      setMensagem("Corrija os campos destacados. Nada foi enviado.");
      return;
    }
    setErros({});
    visual.setErros({});

    if (Object.keys(body).length === 0) {
      setFeedbackSalvar("ok");
      setMensagem("Nada foi alterado.");
      setTimeout(() => setFeedbackSalvar(null), 3000);
      return;
    }
    if (limpar.length) body.limpar = limpar;

    setSalvando(true);
    const r = await enviarConfig(body);
    setSalvando(false);
    if (!r.ok) {
      setErros(r.erros);
      visual.setErros(r.erros);
      setFeedbackSalvar("erro");
      setMensagem(r.erro);
      return;
    }
    setOriginal(v);
    setTiposOriginal(t.lista);
    setTipos(t.lista);
    visual.confirmar();
    setGateAviso(false);
    setFeedbackSalvar("ok");
    setMensagem(r.aviso);
    setTimeout(() => setFeedbackSalvar(null), r.aviso ? 8000 : 3000);
  }

  function adicionarTipo(valor: string) {
    if (!valor) return;
    setTipos((l) => (l.includes(valor) || l.length >= MAX_TIPOS_SCHEMA ? l : [...l, valor]));
  }

  const jsonLd = useMemo(
    () =>
      gerarJsonLd({
        nome: v.nome,
        dominio: String(base.dominio ?? ""),
        slogan: v.slogan,
        descricao: visual.valores.descricao,
        anoFundacao: v.anoFundacao,
        faixaPreco: v.faixaPreco,
        especialidade: v.especialidade,
        schemaTipo: tipos,
        logo: { src: visual.valores["logo.src"] },
        ogImagem: visual.valores.ogImagem,
        credencial: {
          conselho: v["credencial.conselho"],
          registro: v["credencial.registro"],
          responsavel: v["credencial.responsavel"],
        },
        nap: (base.nap ?? {}) as Record<string, string>,
        redes: (base.redes ?? {}) as Record<string, string>,
        funcionamento: Array.isArray(base.funcionamento) ? (base.funcionamento as Funcionamento[]) : [],
        areaAtendimento: Array.isArray(base.areaAtendimento) ? (base.areaAtendimento as string[]) : [],
      }),
    [v, tipos, visual.valores, base],
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Identidade</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Nome, descrição, dados legais, tipo de negócio e mídia do site.
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
              value={v.nome}
              onChange={(e) => {
                set("nome")(e.target.value);
                setGateAviso(true);
              }}
              aviso={gateAviso}
              invalido={!!erros.nome}
              placeholder="Nome do site"
            />
            <MsgErro texto={erros.nome} />
            {gateAviso && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--accent)]">
                <AlertTriangle size={11} />
                Alterar o nome atualiza o schema, og:site_name e o title de todas as páginas.
              </p>
            )}
          </div>

          {/* Slogan */}
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Rotulo>Slogan</Rotulo>
            </div>
            <Entrada
              value={v.slogan}
              onChange={(e) => set("slogan")(e.target.value)}
              placeholder="Frase curta de posicionamento"
            />
            <MsgErro texto={erros.slogan} />
          </div>

          {/* Descrição (compartilhada com Personalizar) */}
          <DescricaoSite v={visual} />
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
                value={v.razaoSocial}
                onChange={(e) => set("razaoSocial")(e.target.value)}
                invalido={!!erros.razaoSocial}
                placeholder="Nome jurídico da empresa"
              />
              <MsgErro texto={erros.razaoSocial} />
            </Campo>
          </div>

          <Campo label="CNPJ">
            <Entrada
              value={v.cnpj}
              onChange={(e) => set("cnpj")(e.target.value)}
              invalido={!!erros.cnpj}
              placeholder="00.000.000/0000-00"
            />
            <MsgErro texto={erros.cnpj} />
            <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
              Se o negócio não tem CNPJ, escreva &quot;não possui&quot;.
            </p>
          </Campo>

          <Campo label="Fundado em">
            <Entrada
              value={v.anoFundacao}
              onChange={(e) => set("anoFundacao")(e.target.value)}
              invalido={!!erros.anoFundacao}
              placeholder="Ano"
              maxLength={4}
            />
            <MsgErro texto={erros.anoFundacao} />
          </Campo>

          <Campo label="Conselho profissional">
            <Entrada
              value={v["credencial.conselho"]}
              onChange={(e) => set("credencial.conselho")(e.target.value)}
              invalido={!!erros["credencial.conselho"]}
              placeholder="CRP, CRM, OAB…"
            />
            <MsgErro texto={erros["credencial.conselho"]} />
          </Campo>

          <Campo label="Registro profissional">
            <Entrada
              value={v["credencial.registro"]}
              onChange={(e) => set("credencial.registro")(e.target.value)}
              invalido={!!erros["credencial.registro"]}
              placeholder="Ex.: 06/128455"
            />
            <MsgErro texto={erros["credencial.registro"]} />
          </Campo>

          <div className="sm:col-span-2">
            <Campo label="Responsável técnico">
              <Entrada
                value={v["credencial.responsavel"]}
                onChange={(e) => set("credencial.responsavel")(e.target.value)}
                invalido={!!erros["credencial.responsavel"]}
                placeholder="Nome completo"
              />
              <MsgErro texto={erros["credencial.responsavel"]} />
            </Campo>
          </div>
        </div>
      </Secao>

      {/* ── Tipo de negócio + JSON-LD preview ─────────── */}
      <Secao titulo="Tipo de negócio (schema.org)" icone={Info}>
        <div className="space-y-4">
          <Campo label={`Tipos schema.org (até ${MAX_TIPOS_SCHEMA})`}>
            {tipos.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {tipos.map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] py-0.5 pr-1 pl-2.5 text-xs text-[var(--ink)]"
                  >
                    {rotuloTipoSchema(t)}
                    <span className="font-mono text-[10px] text-[var(--ink-muted)]">{t}</span>
                    <button
                      onClick={() => setTipos((l) => l.filter((x) => x !== t))}
                      className="rounded-full p-0.5 text-[var(--ink-muted)] hover:text-[var(--danger)]"
                      title={`Remover ${t}`}
                      aria-label={`Remover ${t}`}
                    >
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Selecao
              value=""
              onChange={(e) => adicionarTipo(e.target.value)}
              disabled={tipos.length >= MAX_TIPOS_SCHEMA}
              aria-label="Adicionar tipo schema.org"
            >
              <option value="">
                {tipos.length >= MAX_TIPOS_SCHEMA ? "Limite de tipos atingido" : "Adicionar tipo…"}
              </option>
              {GRUPOS_TIPOS_SCHEMA.map((g) => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.tipos
                    .filter((t) => !tipos.includes(t.value))
                    .map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label} — {t.value}
                      </option>
                    ))}
                </optgroup>
              ))}
            </Selecao>
            <MsgErro texto={erros.schemaTipo} />
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
              O primeiro é o principal. Sem nenhum, o site usa o tipo padrão do layout.
            </p>
          </Campo>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Especialidade">
              <Entrada
                value={v.especialidade}
                onChange={(e) => set("especialidade")(e.target.value)}
                invalido={!!erros.especialidade}
                placeholder="Ex.: Terapia cognitivo-comportamental"
              />
              <MsgErro texto={erros.especialidade} />
            </Campo>
            <Campo label="Faixa de preço">
              <Entrada
                value={v.faixaPreco}
                onChange={(e) => set("faixaPreco")(e.target.value)}
                invalido={!!erros.faixaPreco}
                placeholder="$$ ou R$50–R$200"
              />
              <MsgErro texto={erros.faixaPreco} />
            </Campo>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium text-[var(--ink-muted)]">
              Prévia JSON-LD (dados reais do site + o que você está editando)
            </p>
            <pre className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-4 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
              {jsonLd}
            </pre>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
              <Info size={11} />
              Endereço, horários e área de atendimento vêm de Configurações › Contato e NAP; os serviços, da coleção de serviços do site.
            </p>
          </div>
        </div>
      </Secao>

      {/* ── Mídia ─────────────────────────────────────── */}
      <Secao titulo="Mídia" icone={Img}>
        <MidiaSite v={visual} />
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
