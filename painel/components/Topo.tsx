"use client";

import { ExternalLink, FileText, FolderTree, Loader2, Moon, Plus, Rocket, Search, Sun, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useStore } from "@/lib/store";
import { urlPost } from "@/lib/urls-publicas";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui";

type BuildStatus = "idle" | "rodando" | "sucesso" | "erro";

export function Topo() {
  const { tema, alternarTema, posts, paginas, autores, criarPost, pendentes, publicarAlteracoes } = useStore();
  const [busca, setBusca] = useState("");
  const [focado, setFocado] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Estado do build ────────────────────────────────────────────────────────
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("idle");
  const [buildId, setBuildId] = useState<string | null>(null);
  const [buildErro, setBuildErro] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Domínio real do config para o link "Ver site"
  const [dominio, setDominio] = useState("");
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { if (data.ok && data.config?.dominioHost) setDominio(data.config.dominioHost); })
      .catch(console.error);
  }, []);

  // Polling de status do build
  const pararPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const iniciarPolling = useCallback((id: string) => {
    pararPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/build?id=${id}`);
        const data = await res.json();
        if (!data.ok) return;

        if (data.status === "sucesso") {
          setBuildStatus("sucesso");
          pararPolling();
          setTimeout(() => setBuildStatus("idle"), 4000);
        } else if (data.status === "erro") {
          setBuildStatus("erro");
          setBuildErro(data.log?.slice(-300) ?? "Erro desconhecido");
          pararPolling();
          setTimeout(() => { setBuildStatus("idle"); setBuildErro(null); }, 8000);
        }
      } catch {
        // silencioso — tentar de novo no próximo tick
      }
    }, 2000); // checar a cada 2s
  }, [pararPolling]);

  useEffect(() => () => pararPolling(), [pararPolling]);

  // ── Publicar ───────────────────────────────────────────────────────────────
  async function publicar() {
    if (buildStatus === "rodando") return;
    setBuildStatus("rodando");
    setBuildErro(null);

    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!data.ok) {
        setBuildStatus("erro");
        setBuildErro(data.erro ?? "Erro ao iniciar build");
        setTimeout(() => { setBuildStatus("idle"); setBuildErro(null); }, 6000);
        return;
      }

      setBuildId(data.buildId);
      iniciarPolling(data.buildId);
      publicarAlteracoes(); // atualizar store local
    } catch (err) {
      setBuildStatus("erro");
      setBuildErro(String(err));
      setTimeout(() => { setBuildStatus("idle"); setBuildErro(null); }, 6000);
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

  function novoPost() {
    const id = `p${Date.now()}`;
    const hoje = new Date().toISOString().slice(0, 10);
    criarPost({
      id,
      titulo: "",
      slug: "",
      resumo: "",
      corpo: "<p></p>",
      autorId: autores[0]?.id ?? "a1",
      categoriaId: "",
      data: hoje,
      status: "rascunho",
      destaque: false,
      seoTitle: "",
      metaDescription: "",
      canonical: "",
      noindex: false,
      ogImagem: "",
      schemaTipo: "Article",
      faq: [],
      capa: "",
      capaAlt: "",
      fontes: [],
      palavras: 0,
    });
    router.push(`/posts/${id}`);
  }

  // ── Labels do botão Publicar ───────────────────────────────────────────────
  const labelPublicar = buildStatus === "rodando"
    ? "Publicando…"
    : buildStatus === "sucesso"
    ? "Publicado ✓"
    : buildStatus === "erro"
    ? "Erro no build"
    : pendentes > 0
    ? `Publicar (${pendentes})`
    : "Publicar";

  const variantePublicar = buildStatus === "sucesso"
    ? "primario"
    : buildStatus === "erro"
    ? "primario"
    : pendentes > 0 || buildStatus === "rodando"
    ? "primario"
    : "secundario";

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
        {/* Erro de build — tooltip */}
        {buildStatus === "erro" && buildErro && (
          <span className="max-w-[200px] truncate text-[10.5px] text-danger" title={buildErro}>
            {buildErro.slice(0, 60)}…
          </span>
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
          variante={variantePublicar}
          onClick={publicar}
          disabled={buildStatus === "rodando"}
          className={cn(
            "transition-all",
            buildStatus === "sucesso" && "bg-success text-white border-success",
            buildStatus === "erro" && "bg-danger text-white border-danger",
          )}
        >
          {buildStatus === "rodando" ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Rocket size={12} />
          )}
          {labelPublicar}
        </Botao>

        {/* Novo Post */}
        <Botao variante="primario" onClick={novoPost}>
          <Plus size={12} /> Novo Post
        </Botao>
      </div>
    </header>
  );
}
