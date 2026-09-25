"use client";

import {
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  ListTodo,
  Loader2,
  OctagonAlert,
  Plus,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { useCarregando, useStore } from "@/lib/store";
import type { StatusTarefa } from "@/mock/types";
import { cn, formatarData } from "@/lib/utils";
import { CabecalhoTela } from "@/components/Tela";
import {
  Badge,
  Botao,
  Carregando,
  Entrada,
  Metrica,
  Painel,
  Selecao,
  Vazio,
  type TomBadge,
} from "@/components/ui";

const ROTULO: Record<StatusTarefa, string> = {
  "nao-iniciado": "Não iniciado",
  "em-andamento": "Em andamento",
  bloqueado: "Bloqueado",
  concluido: "Concluído",
};

const ORDEM: StatusTarefa[] = ["nao-iniciado", "em-andamento", "bloqueado", "concluido"];

const TOM_PRIORIDADE: Record<string, TomBadge> = {
  alta: "perigo",
  media: "aviso",
  baixa: "neutro",
};

export default function TarefasPage() {
  const { tarefas: tarefasMock, autores, atualizarTarefa } = useStore();
  const [tarefas, setTarefas] = useState(tarefasMock);

  useEffect(() => {
    fetch("/api/tarefas")
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.tarefas) && data.tarefas.length > 0) {
          setTarefas(data.tarefas);
        }
      })
      .catch(console.error);
  }, []);
  const carregando = useCarregando();

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroResponsavel, setFiltroResponsavel] = useState("todos");
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(
    () =>
      tarefas.filter((t) => {
        if (filtroStatus !== "todos" && t.status !== filtroStatus) return false;
        if (filtroResponsavel !== "todos" && t.responsavelId !== filtroResponsavel) return false;
        const q = busca.trim().toLowerCase();
        if (q && !`${t.titulo} ${t.projeto}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    [tarefas, filtroStatus, filtroResponsavel, busca],
  );

  const contar = (s: StatusTarefa) => tarefas.filter((t) => t.status === s).length;
  const nomeAutor = (id: string) => autores.find((a) => a.id === id)?.nome ?? "—";

  return (
    <>
      <CabecalhoTela
        titulo="Gestão de Tarefas"
        descricao="Pendências do projeto, abertas pelo LinkFlow ou criadas aqui no painel"
        acoes={
          <Botao variante="primario">
            <Plus size={13} /> Nova tarefa
          </Botao>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metrica
          label="Não iniciadas"
          valor={contar("nao-iniciado")}
          detalhe="aguardando início"
          icone={<CircleDashed size={15} />}
        />
        <Metrica
          label="Em andamento"
          valor={contar("em-andamento")}
          detalhe="com responsável definido"
          tom="primario"
          icone={<Loader2 size={15} />}
        />
        <Metrica
          label="Bloqueadas"
          valor={contar("bloqueado")}
          detalhe="dependem de terceiros"
          tom="aviso"
          icone={<OctagonAlert size={15} />}
        />
        <Metrica
          label="Concluídas"
          valor={contar("concluido")}
          detalhe="no ciclo atual"
          tom="sucesso"
          icone={<CheckCircle2 size={15} />}
        />
      </div>

      <Painel padding={false}>
        <div className="flex flex-wrap items-center gap-2 p-3">
          <div className="w-[240px] shrink-0">
            <Entrada
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar tarefa ou projeto…"
            className="h-8 py-0"
            />
          </div>
          <div className="w-[170px] shrink-0">
          <Selecao
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-8 py-0"
          >
            <option value="todos">Todos os status</option>
            {ORDEM.map((s) => (
              <option key={s} value={s}>
                {ROTULO[s]}
              </option>
            ))}
          </Selecao>
          </div>
          <div className="w-[190px] shrink-0">
          <Selecao
            value={filtroResponsavel}
            onChange={(e) => setFiltroResponsavel(e.target.value)}
            className="h-8 py-0"
          >
            <option value="todos">Todos os responsáveis</option>
            {autores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </Selecao>
          </div>
          <span className="ml-auto text-[11px] text-ink-muted">
            {filtradas.length} de {tarefas.length} tarefas
          </span>
        </div>

        {carregando ? (
          <Carregando linhas={6} />
        ) : filtradas.length === 0 ? (
          <Vazio
            icone={<ListTodo size={18} />}
            titulo="Nenhuma tarefa com esses filtros"
            descricao="Limpe a busca ou volte para todos os status para ver a fila completa."
            acao={
              <Botao
                tamanho="sm"
                onClick={() => {
                  setBusca("");
                  setFiltroStatus("todos");
                  setFiltroResponsavel("todos");
                }}
              >
                Limpar filtros
              </Botao>
            }
          />
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {filtradas.map((tarefa) => {
              const feitos = tarefa.checklist.filter((c) => c.feito).length;
              const atrasada =
                tarefa.status !== "concluido" && tarefa.prazo < "2026-09-01";
              return (
                <li key={tarefa.id} className="flex items-start gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    title={
                      tarefa.status === "concluido"
                        ? "Reabrir tarefa"
                        : "Marcar como concluída"
                    }
                    onClick={() =>
                      atualizarTarefa(tarefa.id, {
                        status: tarefa.status === "concluido" ? "em-andamento" : "concluido",
                      })
                    }
                    className={cn(
                      "mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      tarefa.status === "concluido"
                        ? "border-success bg-success text-primary-ink"
                        : "border-line hover:border-primary",
                    )}
                  >
                    {tarefa.status === "concluido" && <CheckCircle2 size={11} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "truncate text-[12.5px] font-medium text-ink",
                          tarefa.status === "concluido" && "line-through opacity-60",
                        )}
                      >
                        {tarefa.titulo}
                      </p>
                      {tarefa.origem === "linkflow" && (
                        <Badge tom="primario">
                          <Sparkles size={9} /> LinkFlow
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-muted">{tarefa.descricao}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-ink-muted">
                      <span className="font-mono">{tarefa.projeto}</span>
                      <span>{nomeAutor(tarefa.responsavelId)}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          atrasada && "text-danger",
                        )}
                      >
                        <CalendarClock size={10} />
                        {formatarData(tarefa.prazo)}
                        {atrasada && " · atrasada"}
                      </span>
                      {tarefa.checklist.length > 0 && (
                        <span className="font-mono">
                          {feitos}/{tarefa.checklist.length} subitens
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tom={TOM_PRIORIDADE[tarefa.prioridade]}>{tarefa.prioridade}</Badge>
                    <Selecao
                      value={tarefa.status}
                      onChange={(e) => {
                        const novoStatus = e.target.value as StatusTarefa;
                        atualizarTarefa(tarefa.id, { status: novoStatus });
                        setTarefas(prev => prev.map(t => t.id === tarefa.id
                          ? { ...t, status: novoStatus } : t));
                        fetch(`/api/tarefas/${tarefa.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: novoStatus }),
                        }).catch(console.error)
                      }}
                      className="h-7 w-[136px] shrink-0 py-0 text-[11.5px]"
                    >
                      {ORDEM.map((s) => (
                        <option key={s} value={s}>
                          {ROTULO[s]}
                        </option>
                      ))}
                    </Selecao>
                    <button
                      type="button"
                      title="Abrir no LinkFlow"
                      className="text-ink-muted transition-colors hover:text-ink"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Painel>
    </>
  );
}
