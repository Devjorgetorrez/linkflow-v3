"use client";

import { AlertTriangle, ExternalLink, FileText, FolderTree, Loader2, Moon, Plus, Rocket, Search, Sun, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useStore } from "@/lib/store";
import { useBaseSite } from "@/lib/useDominio";
import { urlPost } from "@/lib/urls-publicas";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui";

// Estado devolvido por /api/build (lib/build-estado.ts)
interface EstadoBuild {
  status: "nunca" | "rodando" | "ok" | "erro";
  etapa?: "validando" | "construindo" | "copiando";
  inicio?: string;
  fim?: string;
  timeoutMs?: number;
  resumo?: string;
  final?: string;
  erros?: { arquivo: string; campo: string; mensagem: string }[];
}

const hhmm = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

export function Topo() {
  const { tema, alternarTema, posts, paginas, autores, pendentes, publicarAlteracoes } = useStore();
  const [busca, setBusca] = useState("");
  const [focado, setFocado] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Estado do build (a fonte da verdade é o servidor: /api/build) ─────────
  const { data: session } = useSession();
  const papel = (session?.user as { papel?: string } | undefined)?.papel;
  const podePublicar = papel === "administrador" || papel === "editor";
  const [build, setBuild] = useState<EstadoBuild | null>(null);
  const [aviso, setAviso] = useState<string | null>(null); // falha sem estado do servidor (rede, 409...)
  const [detalhes, setDetalhes] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eraRodando = useRef(false);

  // Domínio real do config para o link "Ver site"
  const { base: baseSite, previa: ehPrevia } = useBaseSite();
  const pathname = usePathname();
  const naTelaDeNovoPost = pathname === "/posts/novo" || pathname === "/posts/novo/";

  const consultar = useCallback(async () => {
    try {
      const res = await fetch("/api/build", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.estado) setBuild(data.estado as EstadoBuild);
    } catch {
      /* tenta de novo no próximo ciclo */
    }
  }, []);

  // Ao carregar: lê o estado real do último build
  useEffect(() => {
    if (podePublicar) consultar();
  }, [podePublicar, consultar]);

  // Card de erro não pode ficar preso na falha antiga depois de uma correção
  // feita fora do painel (achado real: corrigiu a categoria quebrada no
  // servidor, o card continuou mostrando a falha de minutos atrás porque só
  // reconsultava enquanto "rodando"). Relê ao voltar pra aba.
  useEffect(() => {
    if (!podePublicar) return;
    const ao = () => { if (document.visibilityState === "visible") consultar(); };
    document.addEventListener("visibilitychange", ao);
    return () => document.removeEventListener("visibilitychange", ao);
  }, [podePublicar, consultar]);

  // Enquanto roda: consulta a cada 2s e atualiza o relógio
  const rodando = build?.status === "rodando";
  useEffect(() => {
    if (!rodando) return;
    pollingRef.current = setInterval(() => {
      setAgora(Date.now());
      consultar();
    }, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [rodando, consultar]);

  // "Publicado" só depois que o servidor confirmou ok: só então zera as pendências
  useEffect(() => {
    if (rodando) eraRodando.current = true;
    else if (eraRodando.current) {
      eraRodando.current = false;
      if (build?.status === "ok") publicarAlteracoes();
    }
  }, [rodando, build?.status, publicarAlteracoes]);

  // ── Publicar ───────────────────────────────────────────────────────────────
  async function publicar() {
    if (rodando || !podePublicar) return;
    setAviso(null);
    setDetalhes(false);
    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (data.estado) setBuild(data.estado as EstadoBuild);
      if (res.status === 202) {
        setAgora(Date.now());
        return;
      }
      if (res.status === 409) {
        setAviso("Já existe uma atualização do site em andamento.");
        return;
      }
      if (res.status === 422) {
        setDetalhes(true); // mostra logo o que precisa ser corrigido
        return;
      }
      setAviso(data.erro ?? `Não foi possível iniciar a atualização do site (${res.status}).`);
    } catch (err) {
      setAviso(`Não foi possível falar com o servidor: ${String(err)}`);
    }
  }

  // Vínculo de categoria quebrado (post aponta pra categoria que não existe
  // mais no disco) bloqueava a publicação inteira sem caminho de saída no
  // painel — só o agente via SSH desfazia. Detecta esse erro específico na
  // lista (campo "categoria") e oferece remover o vínculo direto daqui.
  const [removendoCategoria, setRemovendoCategoria] = useState<string | null>(null);
  const [categoriaRemovidaDe, setCategoriaRemovidaDe] = useState<Set<string>>(new Set());
  async function removerCategoriaDoPost(arquivo: string) {
    const slug = arquivo.replace(/^posts\//, "").replace(/\.md$/, "");
    setRemovendoCategoria(arquivo);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoriaId: "" }),
      });
      if (res.ok) setCategoriaRemovidaDe((s) => new Set(s).add(arquivo));
    } finally {
      setRemovendoCategoria(null);
    }
  }

  // ── Busca ──────────────────────────────────────────────────────────────────
  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < 2) return [];
    const achados: { tipo: string; label: string; sub: string; href: string }[] = [];
    for (const p of posts) {
      if (p.titulo.toLowerCase().includes(q) || p.slug.includes(q))
        achados.push({ tipo: "post", label: p.titulo, sub: urlPost(p.slug), href: `/posts/${p.id}` });
    }
    for (const p of paginas) {
      if (p.titulo.toLowerCase().includes(q) || p.url.includes(q))
        achados.push({ tipo: "pagina", label: p.titulo, sub: p.url, href: `/paginas/${p.id}` });
    }
    for (const a of autores) {
      if (a.nome.toLowerCase().includes(q))
        achados.push({ tipo: "autor", label: a.nome, sub: a.cargo, href: `/usuarios` });
    }
    return achados.slice(0, 7);
  }, [busca, posts, paginas, autores]);

  // O post nasce NO SERVIDOR (já válido); a página /posts/novo cria e abre o editor.
  function novoPost() {
    router.push("/posts/novo");
  }

  // ── Rótulos do botão Publicar ──────────────────────────────────────────────
  const emErro = build?.status === "erro";
  const decorrido = build?.inicio ? Math.max(0, Math.round((agora - new Date(build.inicio).getTime()) / 1000)) : 0;
  const limiteMin = build?.timeoutMs ? Math.round(build.timeoutMs / 6000) / 10 : 5;
  const etapaTxt =
    build?.etapa === "validando" ? "conferindo o conteúdo" : build?.etapa === "copiando" ? "enviando ao site" : "construindo o site";
  // "Atualizar o site" leva TUDO o que foi salvo ao site no ar (posts, páginas, configurações).
  // Nada pendente + última atualização ok = nada a fazer: o botão fica desligado, com a explicação.
  const semNadaAFazer = !rodando && !emErro && build?.status === "ok" && pendentes === 0;
  // Rótulo é sempre a AÇÃO do botão; o ESTADO (falhou, sem nada pendente,
  // quando terminou) vai em infoBuild, texto separado — achado real
  // (Relatório de Testes 4, erro 55): "Erro ao atualizar o site" e
  // "Atualizar o site" cinza sem motivo eram o mesmo rótulo servindo pra
  // coisas diferentes (estado passado vs. ação de tentar de novo).
  const labelPublicar = rodando
    ? "Atualizando o site…"
    : emErro
    ? "Tentar de novo"
    : pendentes > 0
    ? `Atualizar o site (${pendentes})`
    : "Atualizar o site";
  const dicaPublicar = !podePublicar
    ? "Sem permissão para o seu papel"
    : emErro
    ? "A última tentativa falhou — clique para tentar de novo."
    : semNadaAFazer
    ? "O site já está atualizado: nada mudou desde a última atualização."
    : pendentes > 0
    ? `Leva ao site no ar tudo o que foi salvo: ${pendentes} ${pendentes === 1 ? "alteração" : "alterações"} (posts, páginas e configurações).`
    : "Leva ao site no ar tudo o que foi salvo (posts, páginas e configurações).";
  const infoBuild = !podePublicar
    ? null
    : rodando
    ? `${etapaTxt} · ${decorrido}s (limite ${limiteMin} min)`
    : emErro
    ? `Última tentativa falhou às ${hhmm(build?.fim)}`
    : build?.status === "ok"
    ? `Site atualizado às ${hhmm(build.fim)}`
    : build?.status === "nunca"
    ? "O site ainda não foi atualizado"
    : semNadaAFazer
    ? "Nada pendente — sem alterações desde a última atualização"
    : null;

  return (
    <header className="fixed top-0 right-0 left-[224px] z-20 flex h-[52px] items-center gap-3 border-b border-line bg-surface-2 px-3">
      {/* Busca */}
      <div className="relative w-full max-w-[380px]">
        <Search
          size={13}
          className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-ink-muted"
        />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={() => {
            timer.current = setTimeout(() => setFocado(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            // Enter vai direto para o 1º resultado (o dropdown já mostra os melhores
            // até 7); sem tela dedicada de resultados, não faz sentido "abrir busca
            // vazia" — se não achou nada, não navega e mantém o dropdown avisando.
            if (resultados.length === 0) return;
            e.preventDefault();
            router.push(resultados[0].href);
            setBusca("");
            setFocado(false);
          }}
          placeholder="Buscar posts, páginas, autores…"
          className="h-7 w-full rounded-[var(--radius)] border border-line bg-surface pr-2 pl-7 text-[12px] text-ink outline-none placeholder:text-ink-muted focus:border-primary"
        />
        {focado && busca.trim().length >= 2 && (
          <div className="absolute top-[34px] left-0 z-40 w-full overflow-hidden rounded-[var(--radius)] border border-line bg-surface-2 shadow-xl">
            {resultados.length === 0 ? (
              <p className="px-3 py-3 text-[11.5px] text-ink-muted">
                Nada encontrado para &quot;{busca}&quot;.
              </p>
            ) : (
              <ul>
                {resultados.map((r) => {
                  const Icone =
                    r.tipo === "post" ? FileText : r.tipo === "pagina" ? FolderTree : Users;
                  return (
                    <li key={`${r.tipo}-${r.href}`}>
                      <Link
                        href={r.href}
                        onClick={() => {
                          setBusca("");
                          setFocado(false);
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-secondary"
                      >
                        <Icone size={12} className="shrink-0 text-ink-muted" />
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink">
                          {r.label}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-ink-muted">
                          {r.sub}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Estado real da publicação */}
        {infoBuild && (
          <span className="max-w-[240px] truncate text-[10.5px] text-ink-muted" title={infoBuild} aria-live="polite">
            {infoBuild}
          </span>
        )}
        {(emErro || aviso) && !rodando && (
          <button
            type="button"
            onClick={() => setDetalhes((d) => !d)}
            className="flex max-w-[260px] items-center gap-1 text-[10.5px] text-danger underline-offset-2 hover:underline"
            title={aviso ?? build?.resumo}
          >
            <AlertTriangle size={11} className="shrink-0" />
            <span className="truncate">{aviso ?? build?.resumo ?? "A atualização do site falhou."}</span>
          </button>
        )}

        {/* Ver site */}
        <Link
          href={baseSite || "#"}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Botao variante="fantasma" title={ehPrevia ? "Abrir a prévia local do site (localhost)" : "Abrir o site publicado"}>
            <ExternalLink size={12} /> Ver site
          </Botao>
        </Link>

        {/* Tema */}
        <button
          type="button"
          onClick={alternarTema}
          title={tema === "escuro" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-line text-ink-muted transition-colors hover:text-ink",
          )}
        >
          {tema === "escuro" ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {/* Atualizar o site (o build inteiro; publicar UM artigo é o botão de dentro do editor) */}
        <Botao
          variante={pendentes > 0 || rodando || emErro ? "primario" : "secundario"}
          onClick={publicar}
          disabled={rodando || !podePublicar || semNadaAFazer}
          title={dicaPublicar}
          className={cn("transition-all", emErro && "bg-danger text-white border-danger")}
        >
          {rodando ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
          {labelPublicar}
        </Botao>

        {/* Novo Post */}
        {!naTelaDeNovoPost && (
          <Botao variante="primario" onClick={novoPost}>
            <Plus size={12} /> Novo Post
          </Botao>
        )}
      </div>

      {/* Detalhes da falha: resumo, problemas de conteúdo, fim do log e link do log completo */}
      {detalhes && (emErro || aviso) && !rodando && (
        <div className="absolute top-[56px] right-3 z-40 max-h-[70vh] w-[520px] max-w-[calc(100vw-260px)] overflow-auto rounded-[var(--radius)] border border-danger/40 bg-surface-2 p-3 shadow-xl">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[12px] font-medium text-danger">A atualização do site não foi concluída</p>
            <button type="button" onClick={() => setDetalhes(false)} className="text-[11px] text-ink-muted hover:text-ink">
              Fechar
            </button>
          </div>
          <p className="mb-2 text-[11.5px] text-ink">{aviso ?? build?.resumo}</p>
          {build?.erros && build.erros.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {build.erros.map((e, i) => (
                <li key={`${e.arquivo}-${e.campo}-${i}`} className="text-[11px] text-ink">
                  <span className="font-mono text-[10.5px] text-ink-muted">{e.arquivo}</span>
                  {" · "}
                  <b>{e.campo}</b>: {e.mensagem}
                  {e.campo === "categoria" && (
                    categoriaRemovidaDe.has(e.arquivo) ? (
                      <span className="ml-1.5 text-success">Removido — clique em &quot;Atualizar o site&quot; de novo.</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removerCategoriaDoPost(e.arquivo)}
                        disabled={removendoCategoria === e.arquivo}
                        className="ml-1.5 text-primary underline disabled:opacity-50"
                      >
                        {removendoCategoria === e.arquivo ? "Removendo…" : "Remover a categoria deste post"}
                      </button>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
          {build?.final && !(build.erros && build.erros.length > 0) && (
            <pre className="mb-2 max-h-[260px] overflow-auto rounded-[var(--radius)] bg-surface p-2 font-mono text-[10.5px] whitespace-pre-wrap text-ink-muted">
              {build.final}
            </pre>
          )}
          {build && (
            <a href="/api/build?log=1" target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary underline">
              Abrir o log completo
            </a>
          )}
        </div>
      )}
    </header>
  );
}
