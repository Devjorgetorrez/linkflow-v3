"use client";

import {
  ChevronLeft,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BotaoCopiar } from "@/components/BotaoCopiar";
import {
  Alternador,
  AreaTexto,
  Botao,
  Campo,
  Entrada,
  PainelRecolhivel,
  Vazio,
} from "@/components/ui";
import { validarFormulario } from "@/lib/formularios-regras";
import { useStore } from "@/lib/store";
import type { CampoFormulario, Formulario, TipoCampo } from "@/mock/types";

/* ---------------------------------------------------------------- catálogo */

const CATALOGO: { tipo: TipoCampo; rotulo: string; descricao: string }[] = [
  { tipo: "nome",     rotulo: "Nome",             descricao: "Campo de texto para o nome completo" },
  { tipo: "email",    rotulo: "E-mail",            descricao: "Campo de e-mail com validação" },
  { tipo: "telefone", rotulo: "Telefone",          descricao: "Campo numérico para telefone ou celular" },
  { tipo: "assunto",  rotulo: "Assunto",           descricao: "Campo de texto curto" },
  { tipo: "mensagem", rotulo: "Mensagem",          descricao: "Área de texto multilinha" },
  { tipo: "data",     rotulo: "Data",              descricao: "Seletor de data" },
  { tipo: "selecao",  rotulo: "Seleção",           descricao: "Lista suspensa com opções definidas" },
  { tipo: "checkbox", rotulo: "Caixa de seleção", descricao: "Caixa de seleção única" },
  { tipo: "anexo",    rotulo: "Arquivo",           descricao: "Upload de arquivo (PDF, imagem)" },
];

function gerarId() {
  return `campo-${Math.random().toString(36).slice(2, 8)}`;
}

const BLANK: Formulario = {
  id: "",
  nome: "",
  campos: [],
  msgSucesso: "Mensagem enviada com sucesso. Entraremos em contato em breve.",
  msgErro: "Não foi possível enviar sua mensagem. Tente novamente em instantes.",
  exigeLgpd: false,
  lgpdTexto:
    "Concordo com o uso dos meus dados para resposta a esta mensagem, conforme a Política de Privacidade.",
  lgpdPoliticaUrl: "",
  usadoEm: [],
  envios30d: 0,
  ativo: true,
};

/* ---------------------------------------------------------------- preview */

function PreviewCampo({ campo }: { campo: CampoFormulario }) {
  const label = (
    <label className="mb-1 block text-[11.5px] font-medium text-gray-700">
      {campo.rotulo || <em className="text-gray-400">Sem rótulo</em>}
      {campo.obrigatorio && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
  const help = campo.ajuda
    ? <p className="mt-0.5 text-[10.5px] text-gray-400">{campo.ajuda}</p>
    : null;

  if (campo.tipo === "mensagem") {
    return (
      <div className="space-y-0.5">
        {label}
        <textarea disabled rows={4} className="w-full resize-none rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[12px] text-gray-400" />
      </div>
    );
  }
  if (campo.tipo === "selecao") {
    return (
      <div className="space-y-0.5">
        {label}
        <select disabled className="w-full rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[12px] text-gray-400">
          <option>Selecione…</option>
          {(campo.opcoes ?? []).map((op) => <option key={op}>{op}</option>)}
        </select>
        {help}
      </div>
    );
  }
  if (campo.tipo === "checkbox") {
    return (
      <div className="flex items-start gap-2">
        <input type="checkbox" disabled className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300" />
        <span className="text-[12px] text-gray-600">
          {campo.rotulo || <em className="text-gray-400">Sem rótulo</em>}
        </span>
      </div>
    );
  }
  if (campo.tipo === "data") {
    return (
      <div className="space-y-0.5">
        {label}
        <input type="date" disabled className="w-full rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[12px] text-gray-400" />
        {help}
      </div>
    );
  }
  if (campo.tipo === "anexo") {
    return (
      <div className="space-y-0.5">
        {label}
        <div className="flex items-center rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-[11.5px] text-gray-400">Selecionar arquivo…</span>
        </div>
        {help}
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      {label}
      <input
        type={campo.tipo === "email" ? "email" : campo.tipo === "telefone" ? "tel" : "text"}
        disabled
        className="w-full rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[12px] text-gray-400"
      />
      {help}
    </div>
  );
}

function PreviewFormulario({ dados }: { dados: Formulario }) {
  const nenhum = dados.campos.length === 0;
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="h-3 w-28 rounded bg-gray-200" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-2.5 w-12 rounded bg-gray-100" />)}
        </div>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p className="mb-3 text-[13px] font-semibold text-gray-700">
          {dados.nome || <em className="font-normal text-gray-400">Formulário sem nome</em>}
        </p>
        {nenhum ? (
          <p className="py-4 text-center text-[11.5px] text-gray-400">
            Adicione campos para ver a prévia
          </p>
        ) : (
          <div className="space-y-3">
            {dados.campos.map((c) => <PreviewCampo key={c.id} campo={c} />)}
          </div>
        )}
        {dados.exigeLgpd && dados.lgpdTexto && (
          <div className="mt-3 flex items-start gap-2">
            <input type="checkbox" disabled className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300" />
            <span className="text-[11px] text-gray-500">{dados.lgpdTexto}</span>
          </div>
        )}
        <button disabled className="mt-4 w-full rounded bg-gray-800 px-4 py-2 text-[12px] font-medium text-white opacity-80">
          Enviar mensagem
        </button>
      </div>
      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="h-2 w-32 rounded bg-gray-100" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

export default function FormularioEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { formularios, formulariosCarregados, paginas, recarregarFormularios } = useStore();

  const NOVO = id === "novo";
  const formularioExistente = formularios.find((f) => f.id === id);

  const [painelUrl, setPainelUrl] = useState("");
  const [dados, setDados] = useState<Formulario>(() => (NOVO ? { ...BLANK } : (formularioExistente ?? { ...BLANK })));
  const [carregado, setCarregado] = useState(NOVO || !!formularioExistente);
  const [adicionandoCampo, setAdicionandoCampo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState("");
  const [errosCampo, setErrosCampo] = useState<Record<string, string>>({});
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);

  // Sempre relê ao abrir a tela.
  useEffect(() => { void recarregarFormularios(); }, [recarregarFormularios]);
  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPainelUrl(String(d?.config?.painelUrl ?? "")))
      .catch(() => setPainelUrl(""));
  }, []);

  // Preenche o editor quando o formulário chega da API (a tela não aceita edição antes disso).
  useEffect(() => {
    if (NOVO || carregado) return;
    if (formularioExistente) { setDados(formularioExistente); setCarregado(true); }
  }, [NOVO, carregado, formularioExistente]);

  const endpoint = useMemo(() => `${painelUrl || "<endereço do painel>"}/api/submissao`, [painelUrl]);

  if (!NOVO && !carregado) {
    if (formulariosCarregados && !formularioExistente) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Vazio titulo="Formulário não encontrado." />
          <Link href="/formularios" className="text-[12px] text-primary hover:underline">
            ← Voltar para formulários
          </Link>
        </div>
      );
    }
    return <div className="px-6 py-10 text-[12px] text-ink-muted">Carregando formulário…</div>;
  }

  function patch<K extends keyof Formulario>(chave: K, valor: Formulario[K]) {
    setSalvo(false);
    setDados((d) => ({ ...d, [chave]: valor }));
  }

  async function salvar() {
    setSalvo(false);
    const v = validarFormulario(dados);
    if (!v.ok) { setErro(v.erro); setErrosCampo(v.erros); return; }
    setErro("");
    setErrosCampo({});
    setSalvando(true);
    try {
      const res = await fetch(NOVO ? "/api/formularios" : `/api/formularios/${encodeURIComponent(dados.id)}`, {
        method: NOVO ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErro(data.erro || `Não foi possível salvar (erro ${res.status}).`);
        setErrosCampo(data.campos ?? {});
        return;
      }
      await recarregarFormularios();
      setSalvo(true);
      if (NOVO) router.replace(`/formularios/${data.formulario.id}`);
      else setDados(data.formulario);
    } catch {
      setErro("Não consegui falar com o servidor. Nada foi salvo; tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch(`/api/formularios/${encodeURIComponent(dados.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setErro(data.erro || "Não foi possível excluir."); setConfirmarExcluir(false); return; }
      await recarregarFormularios();
      router.replace("/formularios");
    } catch {
      setErro("Não consegui falar com o servidor. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  /* ---- campos ---- */

  function atualizarCampo(campoId: string, p: Partial<CampoFormulario>) {
    setSalvo(false);
    setDados((d) => ({ ...d, campos: d.campos.map((c) => (c.id === campoId ? { ...c, ...p } : c)) }));
  }

  function removerCampo(campoId: string) {
    setSalvo(false);
    setDados((d) => ({ ...d, campos: d.campos.filter((c) => c.id !== campoId) }));
  }

  function adicionarDoCatalogo(tipo: TipoCampo, rotulo: string) {
    const novo: CampoFormulario = {
      id: gerarId(),
      tipo,
      rotulo,
      obrigatorio: tipo !== "checkbox" && tipo !== "anexo",
      ajuda: "",
      opcoes: tipo === "selecao" ? ["Opção 1", "Opção 2"] : undefined,
    };
    setSalvo(false);
    setDados((d) => ({ ...d, campos: [...d.campos, novo] }));
    setAdicionandoCampo(false);
  }

  const paginasPublicadas = paginas.filter((p) => p.status === "publicado");

  return (
    <div className="flex min-h-full flex-col gap-0">
      {/* cabeçalho sticky */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/formularios"
            className="flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
          >
            <ChevronLeft size={14} />
            Formulários
          </Link>
          <span className="text-ink-muted/40">/</span>
          <span className="text-[12px] font-medium text-ink">
            {NOVO ? "Novo formulário" : (dados.nome || "Sem nome")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {salvo && <span className="text-[11.5px] text-success">Salvo</span>}
          <Alternador ativo={dados.ativo} label="Ativo" onChange={(v) => patch("ativo", v)} />
          {!NOVO && (
            confirmarExcluir ? (
              <span className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                Excluir? Os leads ficam.
                <Botao variante="secundario" tamanho="sm" onClick={() => void excluir()} disabled={salvando}>Sim, excluir</Botao>
                <Botao variante="secundario" tamanho="sm" onClick={() => setConfirmarExcluir(false)}>Não</Botao>
              </span>
            ) : (
              <Botao variante="secundario" tamanho="sm" onClick={() => setConfirmarExcluir(true)} disabled={salvando}>
                <Trash2 size={13} />
                Excluir
              </Botao>
            )
          )}
          <Botao variante="primario" tamanho="sm" onClick={() => void salvar()} disabled={salvando}>
            {salvando ? "Salvando…" : NOVO ? "Criar formulário" : "Salvar"}
          </Botao>
        </div>
      </div>

      {erro && (
        <p role="alert" className="border-b border-danger/30 bg-danger/10 px-6 py-2 text-[12px] text-danger">
          {erro}
        </p>
      )}

      {/* two-column body */}
      <div className="grid flex-1 grid-cols-[1fr_380px] divide-x divide-line">

        {/* ---- coluna esquerda: editor ---- */}
        <div className="space-y-3 p-6">

          {/* 1 — nome */}
          <PainelRecolhivel id="nome" inicialAberto titulo="Nome do formulário">
            <Campo label="Nome interno">
              <Entrada
                autoFocus={NOVO}
                value={dados.nome}
                onChange={(e) => patch("nome", e.target.value)}
                placeholder="Ex: Formulário de contato"
                maxLength={80}
              />
              {errosCampo.nome && <p className="mt-1 text-[11px] text-danger">{errosCampo.nome}</p>}
            </Campo>
          </PainelRecolhivel>

          {/* 2 — campos */}
          <PainelRecolhivel id="campos" inicialAberto titulo={`Campos (${dados.campos.length})`}>
            <div className="space-y-2">
              {dados.campos.length === 0 && (
                <p className={errosCampo.campos ? "text-[12px] text-danger" : "text-[12px] text-ink-muted"}>
                  {errosCampo.campos || "Nenhum campo adicionado."}
                </p>
              )}

              {dados.campos.map((campo, i) => (
                <div
                  key={campo.id}
                  className="flex gap-2 rounded-[var(--radius)] border border-line bg-surface-2 p-3"
                >
                  <GripVertical size={14} className="mt-0.5 shrink-0 text-ink-muted/40" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Campo label="Rótulo">
                          <Entrada
                            value={campo.rotulo}
                            maxLength={60}
                            onChange={(e) => atualizarCampo(campo.id, { rotulo: e.target.value })}
                          />
                          {errosCampo[`campos.${i}.rotulo`] && (
                            <p className="mt-1 text-[11px] text-danger">{errosCampo[`campos.${i}.rotulo`]}</p>
                          )}
                        </Campo>
                      </div>
                      <div className="shrink-0 pt-4">
                        <Alternador
                          ativo={campo.obrigatorio}
                          label="Obrigatório"
                          onChange={(v) => atualizarCampo(campo.id, { obrigatorio: v })}
                        />
                      </div>
                    </div>
                    <Campo label="Texto de ajuda">
                      <Entrada
                        value={campo.ajuda}
                        onChange={(e) => atualizarCampo(campo.id, { ajuda: e.target.value })}
                        placeholder="Instrução exibida abaixo do campo (opcional)"
                      />
                    </Campo>
                    {campo.tipo === "selecao" && (
                      <Campo label="Opções (uma por linha)">
                        <AreaTexto
                          value={(campo.opcoes ?? []).join("\n")}
                          onChange={(e) =>
                            atualizarCampo(campo.id, { opcoes: e.target.value.split("\n") })
                          }
                          rows={4}
                        />
                        {errosCampo[`campos.${i}.opcoes`] && (
                          <p className="mt-1 text-[11px] text-danger">{errosCampo[`campos.${i}.opcoes`]}</p>
                        )}
                      </Campo>
                    )}
                    <p className="text-[11px] text-ink-muted/60">
                      Tipo: {CATALOGO.find((c) => c.tipo === campo.tipo)?.descricao ?? campo.tipo}
                    </p>
                  </div>
                  <button
                    onClick={() => removerCampo(campo.id)}
                    className="mt-0.5 shrink-0 rounded p-0.5 text-ink-muted/40 transition-colors hover:text-danger"
                    title="Remover campo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {adicionandoCampo ? (
                <div className="space-y-1 rounded-[var(--radius)] border border-dashed border-line p-3">
                  <p className="mb-2 text-[12px] font-medium text-ink">Escolher tipo de campo</p>
                  <div className="grid grid-cols-2 gap-1">
                    {CATALOGO.map((item) => (
                      <button
                        key={item.tipo}
                        onClick={() => adicionarDoCatalogo(item.tipo, item.rotulo)}
                        className="flex flex-col items-start gap-0.5 rounded-[var(--radius)] border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <span className="text-[12px] font-medium text-ink">{item.rotulo}</span>
                        <span className="text-[10.5px] text-ink-muted">{item.descricao}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setAdicionandoCampo(false)}
                    className="mt-1 text-[11.5px] text-ink-muted hover:text-ink"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdicionandoCampo(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-dashed border-line py-2.5 text-[12px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
                >
                  <Plus size={13} />
                  Adicionar campo
                </button>
              )}
            </div>
          </PainelRecolhivel>

          {/* 3 — depois do envio */}
          <PainelRecolhivel id="depois-envio" titulo="Depois do envio">
            <div className="space-y-3">
              <Campo label="Mensagem de sucesso">
                <AreaTexto
                  value={dados.msgSucesso}
                  onChange={(e) => patch("msgSucesso", e.target.value)}
                  rows={3}
                  placeholder="Obrigado pelo contato! Retornaremos em breve."
                />
                {errosCampo.msgSucesso && <p className="mt-1 text-[11px] text-danger">{errosCampo.msgSucesso}</p>}
              </Campo>
              <Campo label="Mensagem de erro">
                <Entrada
                  value={dados.msgErro}
                  onChange={(e) => patch("msgErro", e.target.value)}
                  placeholder="Algo deu errado. Tente novamente."
                />
                {errosCampo.msgErro && <p className="mt-1 text-[11px] text-danger">{errosCampo.msgErro}</p>}
              </Campo>
            </div>
          </PainelRecolhivel>

          {/* 4 — anti-spam */}
          <PainelRecolhivel id="anti-spam" titulo="Anti-spam">
            <p className="text-[12px] text-ink-muted">
              A proteção contra robôs (campo oculto &ldquo;honeypot&rdquo; e limite de envios por visitante e por hora)
              é sempre ativa no servidor, para todos os formulários. O formulário do site envia o campo
              oculto <code className="font-mono">_hp</code> vazio.
            </p>
          </PainelRecolhivel>

          {/* 5 — lgpd */}
          <PainelRecolhivel id="lgpd" titulo="LGPD">
            <div className="space-y-3">
              <Alternador
                ativo={dados.exigeLgpd}
                label="Exigir aceite do visitante"
                descricao="Se ligado, o servidor recusa envios sem o aceite (lgpdAceite) e o site precisa exibir a caixa de seleção."
                onChange={(v) => patch("exigeLgpd", v)}
              />
              <Campo label="Texto de consentimento">
                <AreaTexto
                  value={dados.lgpdTexto}
                  onChange={(e) => patch("lgpdTexto", e.target.value)}
                  rows={3}
                  placeholder="Ao enviar, você concorda com nossa política de privacidade."
                />
                {errosCampo.lgpdTexto && <p className="mt-1 text-[11px] text-danger">{errosCampo.lgpdTexto}</p>}
              </Campo>
              <Campo label="Página da política de privacidade">
                <select
                  value={dados.lgpdPoliticaUrl}
                  onChange={(e) => patch("lgpdPoliticaUrl", e.target.value)}
                  className="w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-1.5 text-[12px] text-ink focus:border-primary focus:outline-none"
                >
                  <option value="">— sem link de política —</option>
                  {paginasPublicadas.map((p) => (
                    <option key={p.id} value={p.url}>
                      {p.titulo} ({p.url})
                    </option>
                  ))}
                </select>
              </Campo>
              <p className="text-[11px] text-ink-muted">
                Cada lead grava se houve aceite e a data.
              </p>
            </div>
          </PainelRecolhivel>

          {/* 6 — como o site envia */}
          {!NOVO && (
            <PainelRecolhivel id="uso-no-site" inicialAberto titulo="Como o site envia este formulário">
              <div className="space-y-3 text-[12px] text-ink-muted">
                <div>
                  <p className="mb-1 font-medium text-ink">ID do formulário (formularioId)</p>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-secondary px-2 py-1 font-mono text-[12px] text-ink">{dados.id}</code>
                    <BotaoCopiar texto={dados.id} />
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium text-ink">Endereço que recebe os envios (POST, JSON)</p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 truncate rounded bg-secondary px-2 py-1 font-mono text-[12px] text-ink">{endpoint}</code>
                    {painelUrl && <BotaoCopiar texto={endpoint} />}
                  </div>
                  {!painelUrl && <p className="mt-1">O endereço do painel ainda não está configurado neste servidor.</p>}
                </div>
                <p>
                  O site envia <code className="font-mono">formularioId</code>, nome, e-mail, telefone, mensagem
                  e, se exigido, <code className="font-mono">lgpdAceite</code>. Cada envio válido aparece em Leads.
                </p>
              </div>
            </PainelRecolhivel>
          )}

        </div>

        {/* ---- coluna direita: preview ---- */}
        <div className="p-6">
          <div className="sticky top-[57px]">
            <p className="mb-2 text-[11.5px] font-medium text-ink-muted">Pré-visualização</p>
            <PreviewFormulario dados={dados} />
          </div>
        </div>

      </div>
    </div>
  );
}
