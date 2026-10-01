"use client";

/**
 * Vínculo editorial do artigo: "Posts relacionados" (sugestões de leitura no fim
 * do artigo) e "Conteúdo pilar" (a página de serviço que o artigo apoia).
 * Grava `relacionados` e `pilar` no frontmatter do post (via editar → store → PATCH).
 */
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Campo, PainelRecolhivel, Selecao } from "@/components/ui";
import type { Post } from "@/mock/types";

const MAX_RELACIONADOS = 3;

interface Props {
  post: Post;
  /** Todos os posts do site (o seletor só oferece os publicados). */
  posts: Post[];
  aoEditar: (patch: Partial<Post>) => void;
}

export function VinculoArtigo({ post, posts, aoEditar }: Props) {
  const [busca, setBusca] = useState("");
  const [servicos, setServicos] = useState<{ slug: string; titulo: string }[] | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/posts/vinculos", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (vivo) setServicos(d.ok && Array.isArray(d.servicos) ? d.servicos : []); })
      .catch(() => { if (vivo) setServicos([]); });
    return () => { vivo = false; };
  }, []);

  const escolhidos = post.relacionados ?? [];
  const porSlug = useMemo(() => new Map(posts.map((p) => [p.slug, p])), [posts]);
  const disponiveis = useMemo(
    () => posts.filter((p) => p.id !== post.id && p.status === "publicado" && !escolhidos.includes(p.slug)),
    [posts, post.id, escolhidos],
  );
  const q = busca.trim().toLowerCase();
  const resultados = (q ? disponiveis.filter((p) => p.titulo.toLowerCase().includes(q)) : disponiveis).slice(0, 6);

  const definir = (lista: string[]) => aoEditar({ relacionados: lista });
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= escolhidos.length) return;
    const nova = [...escolhidos];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    definir(nova);
  };

  const pilar = post.pilar ?? "";
  const pilarSumiu = pilar !== "" && servicos !== null && !servicos.some((s) => s.slug === pilar);

  return (
    <>
      <PainelRecolhivel titulo="Conteúdo pilar" inicialAberto={false}>
        <p className="mb-3 text-[11.5px] text-ink-muted">
          A página de serviço que este artigo apoia. No fim do texto aparece um destaque &ldquo;Saiba mais sobre&hellip;&rdquo;
          com link para ela, e o site passa a ligar o artigo à página.
        </p>
        <Campo label="Página pilar">
          <Selecao
            value={pilar}
            onChange={(e) => aoEditar({ pilar: e.target.value })}
            disabled={servicos === null}
          >
            <option value="">Nenhum</option>
            {pilarSumiu && <option value={pilar}>{pilar} (página não encontrada)</option>}
            {(servicos ?? []).map((s) => (
              <option key={s.slug} value={s.slug}>{s.titulo}</option>
            ))}
          </Selecao>
        </Campo>
        {pilarSumiu && (
          <p className="mt-1.5 text-[10.5px] text-danger">
            Esta página não existe mais entre os serviços do site: o destaque não aparece. Escolha outra ou &ldquo;Nenhum&rdquo;.
          </p>
        )}
        {servicos !== null && servicos.length === 0 && (
          <p className="mt-1.5 text-[10.5px] text-ink-muted">O site ainda não tem páginas de serviço.</p>
        )}
      </PainelRecolhivel>

      <PainelRecolhivel titulo="Posts relacionados" inicialAberto={false}>
        <p className="mb-3 text-[11.5px] text-ink-muted">
          Sugestões de leitura no fim do artigo (até {MAX_RELACIONADOS}).
        </p>

        {escolhidos.length === 0 ? (
          <p className="mb-3 rounded-[var(--radius)] border border-line bg-surface/60 px-2.5 py-2 text-[11.5px] text-ink-muted">
            <strong className="font-semibold text-ink">Automático.</strong> O site mostra os artigos mais recentes da mesma
            categoria (completando com os demais publicados). Escolha abaixo para definir a lista à mão.
          </p>
        ) : (
          <ul className="mb-3 space-y-1">
            {escolhidos.map((slug, i) => {
              const rel = porSlug.get(slug);
              const invalido = !rel || rel.status !== "publicado";
              return (
                <li key={slug} className="flex items-center gap-1.5 rounded-[var(--radius)] border border-line bg-surface px-2 py-1.5">
                  <span className="w-4 shrink-0 text-center font-mono text-[10px] text-ink-muted">{i + 1}</span>
                  <span className={`min-w-0 flex-1 truncate text-[12px] ${invalido ? "text-danger" : "text-ink"}`}>
                    {rel ? rel.titulo : slug}
                    {invalido && (
                      <span className="ml-1 text-[10.5px]">
                        {rel ? "(não está publicado: o site ignora)" : "(não existe mais: o site ignora)"}
                      </span>
                    )}
                  </span>
                  <button type="button" title="Subir" disabled={i === 0} onClick={() => mover(i, -1)}
                    className="rounded p-0.5 text-ink-muted hover:text-ink disabled:opacity-30"><ArrowUp size={11} /></button>
                  <button type="button" title="Descer" disabled={i === escolhidos.length - 1} onClick={() => mover(i, 1)}
                    className="rounded p-0.5 text-ink-muted hover:text-ink disabled:opacity-30"><ArrowDown size={11} /></button>
                  <button type="button" title="Remover" onClick={() => definir(escolhidos.filter((s) => s !== slug))}
                    className="rounded p-0.5 text-ink-muted transition-colors hover:text-danger"><X size={11} /></button>
                </li>
              );
            })}
          </ul>
        )}

        {escolhidos.length < MAX_RELACIONADOS ? (
          <>
            <div className="relative mb-2">
              <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Buscar post publicado por título…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-[var(--radius)] border border-line bg-surface-2 py-1.5 pl-8 pr-3 text-[12px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-primary"
              />
            </div>
            {resultados.length > 0 ? (
              <ul className="space-y-0.5">
                {resultados.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => { definir([...escolhidos, p.slug]); setBusca(""); }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-left text-[12px] text-ink transition-colors hover:bg-secondary"
                    >
                      <Plus size={11} className="shrink-0 text-ink-muted" />
                      <span className="min-w-0 flex-1 truncate">{p.titulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-[11px] text-ink-muted">
                {q ? "Nenhum resultado." : "Não há outros posts publicados para escolher."}
              </p>
            )}
          </>
        ) : (
          <p className="text-[10.5px] text-ink-muted">Limite de {MAX_RELACIONADOS} posts. Remova um para escolher outro.</p>
        )}

        {escolhidos.length > 0 && (
          <button type="button" onClick={() => definir([])}
            className="mt-3 text-[11px] text-ink-muted underline underline-offset-2 hover:text-ink">
            Voltar ao automático
          </button>
        )}
      </PainelRecolhivel>
    </>
  );
}
