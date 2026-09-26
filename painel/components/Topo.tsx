"use client";

import { AlertTriangle, ExternalLink, FileText, FolderTree, Loader2, Moon, Plus, Rocket, Search, Sun, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useStore } from "@/lib/store";
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
  const [dominio, setDominio] = useState("");
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { if (data.ok && data.config?.dominioHost) setDominio(data.config.dominioHost); })
      .catch(console.error);
  }, []);

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
        setAviso("Já existe uma publicação em andamento.");
        return;
      }
      if (res.status === 422) {
        setDetalhes(true); // mostra logo o que precisa ser corrigido
        return;
      }
      setAviso(data.erro ?? `Não foi possível iniciar a publicação (${res.status}).`);
    } catch (err) {
      setAviso(`Não foi possível falar com o servidor: ${String(err)}`);
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
  const labelPublicar = rodando
    ? "Publicando…"
    : emErro
    ? "Erro ao publicar"
    : pendentes > 0
    ? `Publicar (${pendentes})`
    : "Publicar";
  const infoBuild = !podePublicar
    ? null
    : rodando
    ? `${etapaTxt} · ${decorrido}s (limite ${limiteMin} min)`
    : build?.status === "ok"
    ? `Publicado às ${hhmm(build.fim)}`
    : build?.status === "nunca"
    ? "Nunca publicado"
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
          placeholder="Buscar posts, páginas, autores…"
          className="h-7 w-full rounded-[var(--radius)] border border-line bg-surface pr-2 pl-7 text-[12px] text-ink outline-none placeholder:text-ink-muted focus:border-primary"
        />
        {focado && busca.trim().length >= 2 && (
          <div className="absolute top-[34px] left-0 z-40 w-full overflow-hidden rounded-[var(--radius)] border border-line bg-surface-2 shadow-xl">
            {resultados.length === 0 ? (
              <p className="px-3 py-3 text-[11.5px] text-ink-muted">
                Nada encontrado para "{busca}".
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
            <span className="truncate">{aviso ?? build?.resumo ?? "A publicação falhou."}</span>
          </button>
        )}

        {/* Ver site */}
        <Link
          href={dominio ? `https://${dominio}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Botao variante="fantasma" title="Abrir o site publicado">
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

        {/* Publicar */}
        <Botao
          variante={pendentes > 0 || rodando || emErro ? "primario" : "secundario"}
          onClick={publicar}
          disabled={rodando || !podePublicar}
          title={!podePublicar ? "Sem permissão para o seu papel" : undefined}
          className={cn("transition-all", emErro && "bg-danger text-white border-danger")}
        >
          {rodando ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
          {labelPublicar}
        </Botao>

        {/* Novo Post */}
        <Botao variante="primario" onClick={novoPost}>
          <Plus size={12} /> Novo Post
        </Botao>
      </div>

      {/* Detalhes da falha: resumo, problemas de conteúdo, fim do log e link do log completo */}
      {detalhes && (emErro || aviso) && !rodando && (
        <div className="absolute top-[56px] right-3 z-40 max-h-[70vh] w-[520px] max-w-[calc(100vw-260px)] overflow-auto rounded-[var(--radius)] border border-danger/40 bg-surface-2 p-3 shadow-xl">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[12px] font-medium text-danger">A publicação não foi concluída</p>
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
