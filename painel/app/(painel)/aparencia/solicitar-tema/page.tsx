"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { AreaTexto, Botao, Campo, Entrada } from "@/components/ui";

export default function SolicitarTemaPage() {
  const [referencia, setReferencia] = useState("");
  const [nicho, setNicho] = useState("");
  const [sensacao, setSensacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function enviar() {
    if (!nicho.trim() || !sensacao.trim()) {
      setErro(true);
      return;
    }
    setErro(false);
    setEnviado(true);
  }

  function reiniciar() {
    setReferencia("");
    setNicho("");
    setSensacao("");
    setObservacoes("");
    setErro(false);
    setEnviado(false);
  }

  if (enviado) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <CheckCircle2 size={48} className="text-success" />
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
            Pedido registrado.
          </h2>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">
            O tema será criado pelo agente com validação de contraste, variantes de cor claro e
            escuro, e composição completa. Ele aparecerá na galeria de temas quando estiver pronto.
          </p>
          <Botao variante="secundario" tamanho="sm" onClick={reiniciar}>
            Fazer outro pedido
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      {/* cabeçalho */}
      <div className="mb-6 border-b border-line pb-5">
        <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">
          Solicitar tema
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          O agente criará o tema com validação de contraste, variantes de cor e composição. O tema
          aparecerá na galeria quando estiver pronto.
        </p>
      </div>

      {/* formulário */}
      <div className="space-y-4">
        <Campo label="Referência visual">
          <Entrada
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="URL de site ou imagem que você admira"
          />
        </Campo>

        <Campo label="Nicho do site">
          <Entrada
            value={nicho}
            onChange={(e) => {
              setNicho(e.target.value);
              if (e.target.value.trim()) setErro(false);
            }}
            invalido={erro && !nicho.trim()}
            placeholder="Ex: consultório de psicologia, loja de roupas…"
          />
        </Campo>

        <Campo label="Sensação desejada">
          <Entrada
            value={sensacao}
            onChange={(e) => {
              setSensacao(e.target.value);
              if (e.target.value.trim()) setErro(false);
            }}
            invalido={erro && !sensacao.trim()}
            placeholder="Ex: confiança e acolhimento, energia e movimento…"
          />
        </Campo>

        <Campo label="Observações">
          <AreaTexto
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={5}
            placeholder="Detalhe o que é importante: paleta, tipografia, evitar…"
          />
        </Campo>

        {erro && (
          <p className="text-[12px] text-danger">
            Preencha ao menos o nicho e a sensação desejada.
          </p>
        )}

        <Botao variante="primario" onClick={enviar} className="w-full justify-center">
          Enviar pedido
        </Botao>
      </div>
    </div>
  );
}
