"use client";

import {
  ChevronLeft,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Alternador,
  AreaTexto,
  Botao,
  Campo,
  Entrada,
  PainelRecolhivel,
  Vazio,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
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
  id: "novo",
  nome: "",
  campos: [],
  destinoEmail: { ativo: false, endereco: "", assunto: "Novo contato pelo site" },
  destinoWhatsApp: { ativo: false, numero: "" },
  destinoWebhook: { ativo: false, url: "" },
  msgSucesso: "Mensagem enviada com sucesso. Entraremos em contato em breve.",
  msgErro: "Erro ao enviar. Tente novamente.",
  paginaObrigado: "",
  honeypot: true,
  confirmarMarcacao: false,
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
        {dados.lgpdTexto && (
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
  const { formularios, paginas, criarFormulario, atualizarFormulario } = useStore();

  const NOVO = id === "novo";
  const formularioExistente = formularios.find((f) => f.id === id);

  const [dados, setDados] = useState<Formulario>(() =>
    NOVO ? { ...BLANK } : (formularioExistente ?? { ...BLANK }),
  );
  const [adicionandoCampo, setAdicionandoCampo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!NOVO && formularioExistente) setDados(formularioExistente);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!NOVO && !formularioExistente) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Vazio titulo="Formulário não encontrado." />
        <Link href="/formularios" className="text-[12px] text-primary hover:underline">
          ← Voltar para formulários
        </Link>
      </div>
    );
  }

  function patch<K extends keyof Formulario>(chave: K, valor: Formulario[K]) {
    setDados((d) => ({ ...d, [chave]: valor }));
  }

  function salvar() {
    if (!dados.nome.trim()) {
      setErro("Dê um nome ao formulário antes de salvar.");
      return;
    }
    if (dados.campos.length === 0) {
      setErro("Adicione ao menos um campo ao formulário antes de salvar.");
      return;
    }
    setErro("");
    setSalvando(true);
    if (NOVO) {
      const novoId = `fm${Date.now()}`;
      criarFormulario({ ...dados, id: novoId });
      setTimeout(() => {
        setSalvando(false);
        router.replace(`/formularios/${novoId}`);
      }, 600);
    } else {
      atualizarFormulario(dados.id, dados);
      setTimeout(() => setSalvando(false), 800);
    }
  }

  /* ---- campos ---- */

  function atualizarCampo(campoId: string, p: Partial<CampoFormulario>) {
    setDados((d) => ({ ...d, campos: d.campos.map((c) => (c.id === campoId ? { ...c, ...p } : c)) }));
  }

  function removerCampo(campoId: string) {
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
          <Alternador ativo={dados.ativo} label="Ativo" onChange={(v) => patch("ativo", v)} />
          <Botao variante="primario" tamanho="sm" onClick={salvar}>
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
              />
            </Campo>
          </PainelRecolhivel>

          {/* 2 — campos */}
          <PainelRecolhivel id="campos" inicialAberto titulo={`Campos (${dados.campos.length})`}>
            <div className="space-y-2">
              {dados.campos.length === 0 && (
                <p className="text-[12px] text-ink-muted">Nenhum campo adicionado.</p>
              )}

              {dados.campos.map((campo) => (
                <div
                  key={campo.id}
                  className="flex gap-2 rounded-[var(--radius)] border border-line bg-surface-2 p-3"
                >
                  <GripVertical size={14} className="mt-0.5 shrink-0 cursor-grab text-ink-muted/40" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Campo label="Rótulo">
                          <Entrada
                            value={campo.rotulo}
                            onChange={(e) => atualizarCampo(campo.id, { rotulo: e.target.value })}
                          />
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
                            atualizarCampo(campo.id, { opcoes: e.target.value.split("\n").filter(Boolean) })
                          }
                          rows={4}
                        />
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

          {/* 3 — destinos */}
          <PainelRecolhivel id="destinos" inicialAberto titulo="Destinos">
            <div className="space-y-4">

              <div className="space-y-2 rounded-[var(--radius)] border border-line bg-surface-2 p-3">
                <Alternador
                  ativo={dados.destinoEmail.ativo}
                  label="E-mail"
                  onChange={(v) => patch("destinoEmail", { ...dados.destinoEmail, ativo: v })}
                />
                {dados.destinoEmail.ativo && (
                  <div className="space-y-2 pt-1">
                    <Campo label="Endereço de destino">
                      <Entrada
                        type="email"
                        value={dados.destinoEmail.endereco}
                        onChange={(e) => patch("destinoEmail", { ...dados.destinoEmail, endereco: e.target.value })}
                        placeholder="email@seudominio.com.br"
                      />
                    </Campo>
                    <Campo label="Assunto do e-mail">
                      <Entrada
                        value={dados.destinoEmail.assunto}
                        onChange={(e) => patch("destinoEmail", { ...dados.destinoEmail, assunto: e.target.value })}
                        placeholder="Novo contato pelo site"
                      />
                    </Campo>
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-[var(--radius)] border border-line bg-surface-2 p-3">
                <Alternador
                  ativo={dados.destinoWhatsApp.ativo}
                  label="WhatsApp"
                  onChange={(v) => patch("destinoWhatsApp", { ...dados.destinoWhatsApp, ativo: v })}
                />
                {dados.destinoWhatsApp.ativo && (
                  <div className="pt-1">
                    <Campo label="Número (com DDI e DDD)">
                      <Entrada
                        value={dados.destinoWhatsApp.numero}
                        onChange={(e) => patch("destinoWhatsApp", { ...dados.destinoWhatsApp, numero: e.target.value })}
                        placeholder="+55 11 99999-0000"
                      />
                    </Campo>
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-[var(--radius)] border border-line bg-surface-2 p-3">
                <Alternador
                  ativo={dados.destinoWebhook.ativo}
                  label="Webhook"
                  onChange={(v) => patch("destinoWebhook", { ...dados.destinoWebhook, ativo: v })}
                />
                {dados.destinoWebhook.ativo && (
                  <div className="pt-1">
                    <Campo label="URL do endpoint">
                      <Entrada
                        value={dados.destinoWebhook.url}
                        onChange={(e) => patch("destinoWebhook", { ...dados.destinoWebhook, url: e.target.value })}
                        placeholder="https://n8n.exemplo.com/webhook/…"
                      />
                    </Campo>
                  </div>
                )}
              </div>

            </div>
          </PainelRecolhivel>

          {/* 4 — depois do envio */}
          <PainelRecolhivel id="depois-envio" titulo="Depois do envio">
            <div className="space-y-3">
              <Campo label="Mensagem de sucesso">
                <AreaTexto
                  value={dados.msgSucesso}
                  onChange={(e) => patch("msgSucesso", e.target.value)}
                  rows={3}
                  placeholder="Obrigado pelo contato! Retornaremos em breve."
                />
              </Campo>
              <Campo label="Mensagem de erro">
                <Entrada
                  value={dados.msgErro}
                  onChange={(e) => patch("msgErro", e.target.value)}
                  placeholder="Algo deu errado. Tente novamente."
                />
              </Campo>
              <Campo label="Redirecionar para página (opcional)">
                <select
                  value={dados.paginaObrigado}
                  onChange={(e) => patch("paginaObrigado", e.target.value)}
                  className="w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-1.5 text-[12px] text-ink focus:border-primary focus:outline-none"
                >
                  <option value="">— exibir mensagem de sucesso —</option>
                  {paginasPublicadas.map((p) => (
                    <option key={p.id} value={p.url}>
                      {p.titulo} ({p.url})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Se selecionada, o visitante é redirecionado após o envio e a mensagem de sucesso é ignorada.
                </p>
              </Campo>
            </div>
          </PainelRecolhivel>

          {/* 5 — anti-spam */}
          <PainelRecolhivel id="anti-spam" titulo="Anti-spam">
            <div className="space-y-3">
              <Alternador
                ativo={dados.honeypot}
                label="Honeypot"
                descricao="Campo oculto que bots preenchem. Bloqueia envios automáticos sem fricção para o usuário."
                onChange={(v) => patch("honeypot", v)}
              />
              <Alternador
                ativo={dados.confirmarMarcacao}
                label="Confirmar por marcação"
                descricao='Exibe uma pergunta simples ("Você é humano?") antes do envio.'
                onChange={(v) => patch("confirmarMarcacao", v)}
              />
            </div>
          </PainelRecolhivel>

          {/* 6 — lgpd */}
          <PainelRecolhivel id="lgpd" titulo="LGPD">
            <div className="space-y-3">
              <Campo label="Texto de consentimento">
                <AreaTexto
                  value={dados.lgpdTexto}
                  onChange={(e) => patch("lgpdTexto", e.target.value)}
                  rows={3}
                  placeholder="Ao enviar, você concorda com nossa política de privacidade."
                />
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
                Uma caixa de seleção com esse texto é exibida antes do botão de envio. O aceite e a data são registrados em cada lead.
              </p>
            </div>
          </PainelRecolhivel>

        </div>

        {/* ---- coluna direita: preview + usado em ---- */}
        <div className="p-6">
          <div className="sticky top-[57px]">
            <p className="mb-2 text-[11.5px] font-medium text-ink-muted">Pré-visualização</p>
            <PreviewFormulario dados={dados} />
            <div className="mt-4">
              <p className="mb-1.5 text-[11.5px] font-medium text-ink-muted">Usado em</p>
              {dados.usadoEm.length === 0 ? (
                <p className="text-[11.5px] text-ink-muted/50">
                  {NOVO
                    ? "Salve o formulário para vinculá-lo a páginas."
                    : "Este formulário ainda não está em nenhuma página."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {dados.usadoEm.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("text-[12px] text-ink-muted hover:text-primary hover:underline")}
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
