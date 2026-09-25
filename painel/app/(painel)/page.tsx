"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Inbox,
  PenLine,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useStore } from "@/lib/store";
import type { ItemSaude } from "@/mock/types";
import { formatarData } from "@/lib/utils";
import { CabecalhoTela } from "@/components/Tela";
import {
  Badge,
  BadgeStatus,
  Botao,
  CabecalhoPainel,
  Carregando,
  Metrica,
  Painel,
  Vazio,
} from "@/components/ui";

interface Stats {
  nomeSite: string;
  cidadeSite: string;
  slug: string;
  posts: { total: number; publicados: number; rascunhos: number; revisao: number };
  usuarios: number;
  ultimaPublicacao: string;
  ultimoBuild: string;
  saude?: ItemSaude[]; // itens verificáveis de verdade — ver api/stats
}

export default function DashboardPage() {
  const { posts } = useStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [carregandoStats, setCarregandoStats] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data.stats);
      })
      .catch(console.error)
      .finally(() => setCarregandoStats(false));
  }, []);

  // Posts reais da API (carregados pelo store) ou fallback para os do store
  const recentes = [...posts]
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .slice(0, 7);

  const saude = stats?.saude ?? [];
  const avisos = saude.filter((s) => s.estado === "aviso").length;

  // Descrição do dashboard com dados reais
  const descricaoDash = stats
    ? `${stats.nomeSite}${stats.cidadeSite ? ` · ${stats.cidadeSite}` : ""}${
        stats.ultimaPublicacao
          ? ` · última publicação em ${formatarData(stats.ultimaPublicacao)}`
          : " · nenhum post publicado ainda"
      }`
    : "Carregando...";

  return (
    <>
      <CabecalhoTela
        titulo="Dashboard"
        descricao={descricaoDash}
        acoes={
          <Botao variante="secundario" tamanho="sm">
            Últimos 30 dias
          </Botao>
        }
      />

      {/* ── Métricas reais ── */}
      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metrica
          label="Total de posts"
          valor={carregandoStats ? "..." : (stats?.posts.total ?? 0)}
          detalhe={stats ? `${stats.posts.publicados} publicados` : "carregando..."}
          icone={<FileText size={15} />}
        />
        <Metrica
          label="Publicados"
          valor={carregandoStats ? "..." : (stats?.posts.publicados ?? 0)}
          detalhe={stats?.ultimaPublicacao ? `último em ${formatarData(stats.ultimaPublicacao)}` : "nenhum ainda"}
          tom="sucesso"
          icone={<CheckCircle2 size={15} />}
        />
        <Metrica
          label="Rascunhos"
          valor={carregandoStats ? "..." : (stats?.posts.rascunhos ?? 0)}
          detalhe={stats ? `${stats.posts.revisao} em revisão` : "carregando..."}
          tom="aviso"
          icone={<PenLine size={15} />}
        />
        <Metrica
          label="Usuários ativos"
          valor={carregandoStats ? "..." : (stats?.usuarios ?? 0)}
          detalhe="com acesso ao painel"
          icone={<Users size={15} />}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        {/* ── Últimos posts ── */}
        <Painel padding={false}>
          <div className="px-3 pt-3">
            <CabecalhoPainel
              titulo="Últimos posts"
              descricao="Ordenados por data de publicação"
              acao={
                <Link
                  href="/posts"
                  className="flex items-center gap-0.5 text-[11px] text-ink-muted transition-colors hover:text-ink"
                >
                  Ver todos <ArrowUpRight size={11} />
                </Link>
              }
            />
          </div>

          {carregandoStats ? (
            <Carregando linhas={7} />
          ) : recentes.length === 0 ? (
            <Vazio
              icone={<Inbox size={18} />}
              titulo="Nenhum post ainda"
              descricao="O LinkFlow publicará os primeiros artigos em breve."
            />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {recentes.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="flex items-center gap-3 px-3 py-[7px] transition-colors hover:bg-secondary"
                  >
                    <FileText size={12} className="shrink-0 text-ink-muted" />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                      {post.titulo || "(sem título)"}
                    </span>
                    <BadgeStatus status={post.status} />
                    <span className="w-[74px] shrink-0 text-right font-mono text-[10.5px] text-ink-muted">
                      {formatarData(post.data)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Painel>

        {/* ── Saúde do site ── */}
        <Painel padding={false}>
          <div className="px-3 pt-3">
            <CabecalhoPainel
              titulo="Saúde do site"
              descricao="Verificação automática a cada build"
              acao={
                avisos > 0 ? (
                  <Badge tom="aviso">
                    <AlertTriangle size={10} /> {avisos} avisos
                  </Badge>
                ) : (
                  <Badge tom="sucesso">
                    <CheckCircle2 size={10} /> tudo ok
                  </Badge>
                )
              }
            />
          </div>

          <ul className="divide-y divide-line border-t border-line">
            {/* Último build — dado real */}
            <li className="flex items-start gap-2.5 px-3 py-[7px]">
              <CheckCircle2 size={12} className="mt-[2px] shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12px] text-ink">Último build</p>
                  <p className="shrink-0 text-[11px] text-ink-muted">
                    {stats?.ultimoBuild
                      ? new Date(stats.ultimoBuild).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                      : "—"}
                  </p>
                </div>
                <p className="mt-[1px] text-[10.5px] text-ink-muted">Site atualizado em produção</p>
              </div>
            </li>
            {/* Demais itens de saúde — calculados em /api/stats a partir do site real */}
            {saude.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5 px-3 py-[7px]">
                {item.estado === "ok" ? (
                  <CheckCircle2 size={12} className="mt-[2px] shrink-0 text-success" />
                ) : (
                  <AlertTriangle size={12} className="mt-[2px] shrink-0 text-accent" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[12px] text-ink">{item.label}</p>
                    <p className={item.estado === "ok"
                      ? "shrink-0 text-[11px] text-ink-muted"
                      : "shrink-0 text-[11px] text-accent"
                    }>
                      {item.valor}
                    </p>
                  </div>
                  <p className="mt-[1px] text-[10.5px] text-ink-muted">{item.detalhe}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5 border-t border-line px-3 py-2 text-[10.5px] text-ink-muted">
            <AlertTriangle size={10} className="text-accent" />
            Avisos não bloqueiam a publicação.
            <Link href="/seo" className="ml-auto text-ink-muted transition-colors hover:text-ink">
              Abrir SEO técnico
            </Link>
          </div>
        </Painel>
      </div>
    </>
  );
}
