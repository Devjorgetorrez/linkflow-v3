"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  FolderTree,
  Image as ImagemIcone,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Palette,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AvatarUsuario } from "@/components/AvatarUsuario";
import { Marca } from "@/components/Marca";
import { useSession, signOut } from "next-auth/react";
import { paginaPermitida } from "@/lib/permissoes-paginas";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Estrutura de navegação                                               */
/* ------------------------------------------------------------------ */

interface SubItem {
  href: string;
  label: string;
  existente?: boolean; // false = tela ainda não construída → sem link, cinza
}

interface NavItem {
  label: string;
  icone: React.ElementType;
  href?: string;
  subitens?: SubItem[];
}

interface NavGroup {
  rotulo?: string;
  itens: NavItem[];
}

const GRUPOS: NavGroup[] = [
  {
    itens: [{ label: "Dashboard", icone: LayoutDashboard, href: "/" }],
  },
  {
    rotulo: "CONTEÚDO",
    itens: [
      {
        label: "Posts",
        icone: FileText,
        subitens: [
          { href: "/posts", label: "Todos os posts" },
          { href: "/posts/novo", label: "Adicionar post" },
          { href: "/categorias", label: "Categorias" },
        ],
      },
      {
        label: "Serviços",
        icone: FileText,
        subitens: [
          { href: "/servicos", label: "Todos os serviços" },
          { href: "/servicos/novo", label: "Adicionar serviço" },
        ],
      },
      {
        label: "Páginas",
        icone: FolderTree,
        subitens: [
          { href: "/paginas", label: "Todas as páginas" },
          { href: "/paginas/estrutura", label: "Estrutura do site" },
          { href: "/paginas/menus", label: "Menus" },
          { href: "/paginas-fixas", label: "Home, Sobre, Contato" },
        ],
      },
      {
        label: "Mídia",
        icone: ImagemIcone,
        subitens: [
          { href: "/midia", label: "Biblioteca" },
        ],
      },
      {
        label: "Contato",
        icone: MessageSquare,
        subitens: [
          { href: "/formularios", label: "Formulários" },
          { href: "/leads", label: "Leads recebidos" },
        ],
      },
    ],
  },
  {
    rotulo: "SITE",
    itens: [
      {
        label: "Aparência",
        icone: Palette,
        subitens: [
          { href: "/aparencia/temas", label: "Layout" },
          { href: "/aparencia/personalizar", label: "Personalizar" },
        ],
      },
      {
        label: "SEO",
        icone: Search,
        subitens: [
          { href: "/seo", label: "Visão geral" },
          { href: "/seo/sitemap", label: "Sitemap" },
          { href: "/seo/dados-estruturados", label: "Dados estruturados" },
          { href: "/seo/robots", label: "robots.txt" },
          { href: "/seo/llms", label: "llms.txt" },
          { href: "/seo/redirects", label: "Redirects" },
          { href: "/seo/verificacoes", label: "Verificações" },
        ],
      },
      {
        label: "Privacidade",
        icone: Shield,
        subitens: [
          { href: "/privacidade/cookies", label: "Banner de cookies" },
          { href: "/privacidade/politica", label: "Política de privacidade" },
          { href: "/privacidade/termos", label: "Termos de uso" },
        ],
      },
    ],
  },
  {
    rotulo: "SISTEMA",
    itens: [
      {
        label: "Usuários",
        icone: Users,
        subitens: [
          { href: "/usuarios", label: "Todos os usuários" },
          { href: "/usuarios/novo", label: "Adicionar usuário" },
        ],
      },
      {
        label: "Configurações",
        icone: Settings,
        subitens: [
          { href: "/configuracoes/identidade", label: "Identidade" },
          { href: "/configuracoes/contato", label: "Contato e NAP" },
          { href: "/configuracoes/redes", label: "Redes sociais" },
          { href: "/configuracoes/integracoes", label: "Integrações" },
        ],
      },
    ],
  },
];

const SEM_PERMISSAO = "Sem permissão para o seu papel";

/** Item visível porém desabilitado: sem navegação, cinza, com dica ao passar o mouse. */
const CLASSE_DESABILITADO = "cursor-not-allowed text-white/30";

const NAV_FLAT: NavItem[] = GRUPOS.flatMap((g) => g.itens);
const SIDEBAR_W = 224;
const BREAKPOINT_ESTREITO = 900;

function filhoAtivo(item: NavItem, caminho: string) {
  return (
    item.subitens?.some(
      (sub) =>
        caminho === sub.href ||
        (sub.href !== "/" && caminho.startsWith(sub.href)),
    ) ?? false
  );
}

function initAbertos(caminho: string): Record<string, boolean> {
  return NAV_FLAT.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.label] = filhoAtivo(item, caminho);
    return acc;
  }, {});
}

/* ------------------------------------------------------------------ */
/* Painel flutuante                                                      */
/* ------------------------------------------------------------------ */

interface FlyoutProps {
  item: NavItem;
  top: number;
  caminho: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavegar: () => void;
  permitido: (href: string) => boolean;
}

function FlyoutPanel({ item, top, caminho, onMouseEnter, onMouseLeave, onNavegar, permitido }: FlyoutProps) {
  const maxH = (typeof window !== "undefined" ? window.innerHeight : 800) - top - 8;

  return (
    <div
      className="fixed z-50"
      style={{ left: SIDEBAR_W, top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Faixa de buffer — fecha o vão entre o item e o painel */}
      <div className="absolute inset-y-0 -left-1 w-1" />

      <div
        className="overflow-y-auto rounded-tr-lg rounded-br-lg bg-[var(--sidebar-flyout)]"
        style={{
          maxHeight: maxH,
          minWidth: 200,
          boxShadow: "var(--sidebar-flyout-shadow)",
        }}
      >
        {item.subitens!.map((sub) => {
          if (sub.existente === false) {
            return (
              <span
                key={sub.href}
                className="flex items-center whitespace-nowrap px-5 py-2.5 text-[13px] text-white/35 italic cursor-default"
                title="Tela ainda não construída"
              >
                {sub.label}
              </span>
            );
          }
          if (!permitido(sub.href)) {
            return (
              <span
                key={sub.href}
                role="link"
                aria-disabled="true"
                title={SEM_PERMISSAO}
                className={cn("flex items-center whitespace-nowrap px-5 py-2.5 text-[13px]", CLASSE_DESABILITADO)}
              >
                {sub.label}
              </span>
            );
          }
          const ativo =
            caminho === sub.href ||
            (sub.href !== "/" && caminho.startsWith(sub.href));
          return (
            <Link
              key={sub.href}
              href={sub.href}
              onClick={onNavegar}
              className={cn(
                "relative flex items-center whitespace-nowrap px-5 py-2.5 text-[13px] transition-colors",
                ativo
                  ? "font-semibold text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              {ativo && (
                <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full bg-white/70" />
              )}
              {sub.label}
            </Link>
          );
        })}
        <div className="h-2" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                               */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const caminho = usePathname();
  const router = useRouter();
  const { usuario, sair } = useStore();
  const { data: session, status: statusSessao } = useSession();

  // Papel = fonte única lib/permissoes-paginas.ts (a mesma do middleware).
  // Enquanto a sessão carrega, nada é desabilitado (evita piscar cinza).
  const papel = (session?.user as { papel?: string } | undefined)?.papel;
  const permitido = useCallback(
    (href: string) => statusSessao === "loading" || paginaPermitida(href, papel),
    [statusSessao, papel],
  );

  // Dados reais do usuário logado — sobrepõem o mock do store
  const usuarioReal = {
    nome: (session?.user as { papel?: string; name?: string })?.name || usuario.nome,
    email: session?.user?.email || usuario.email,
    iniciais: ((session?.user as { name?: string })?.name || usuario.nome)
      .split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "?",
  };

  // Foto de perfil do usuário logado (a sessão só traz nome e e-mail).
  const idSessao = (session?.user as { id?: string } | undefined)?.id;
  const [fotoPerfil, setFotoPerfil] = useState("");
  useEffect(() => {
    if (!idSessao) return;
    fetch(`/api/usuarios/${idSessao}`)
      .then((r) => r.json())
      .then((d) => setFotoPerfil(String(d?.usuario?.autoria?.foto ?? "")))
      .catch(() => {});
  }, [idSessao]);

  /* ── Modo estreito (accordion) ── */
  const [estreito, setEstreito] = useState(true);
  const [abertos, setAbertos] = useState(() => initAbertos(caminho));

  useEffect(() => {
    const check = () => setEstreito(window.innerWidth < BREAKPOINT_ESTREITO);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setAbertos((prev) => {
      const novos = { ...prev };
      NAV_FLAT.forEach((item) => {
        if (filhoAtivo(item, caminho)) novos[item.label] = true;
      });
      return novos;
    });
  }, [caminho]);

  const toggleAcordeon = (label: string) =>
    setAbertos((prev) => ({ ...prev, [label]: !prev[label] }));

  /* ── Modo largo (flyout) ── */
  const [flyout, setFlyout] = useState<{ label: string; top: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelarEsconder = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const agendarEsconder = useCallback(() => {
    cancelarEsconder();
    timerRef.current = setTimeout(() => setFlyout(null), 100);
  }, [cancelarEsconder]);

  const mostrarFlyout = useCallback(
    (label: string, el: HTMLElement) => {
      cancelarEsconder();
      const { top } = el.getBoundingClientRect();
      setFlyout({ label, top });
    },
    [cancelarEsconder],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  // Fecha o flyout quando a rota muda (senão fica preso aberto após o clique)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlyout(null);
  }, [caminho]);

  const flyoutItem = flyout
    ? NAV_FLAT.find((item) => item.label === flyout.label) ?? null
    : null;

  /* ── Render ── */
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[224px] flex-col bg-sidebar">
      {/* Cabeçalho */}
      <div
        className="flex h-16 shrink-0 items-center border-b border-[var(--sidebar-header-border)] bg-sidebar-header-bg px-4"
      >
        <Marca tamanho={30} variante="completa" apenasSVG />
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
        {GRUPOS.map((grupo, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-6")}>
            {grupo.rotulo && (
              <p className="mb-2 mt-1 px-1 text-[9.5px] font-semibold uppercase tracking-[0.15em] text-white/45">
                {grupo.rotulo}
              </p>
            )}
            <ul className="space-y-[3px]">
              {grupo.itens.map((item) => {
                const Icone = item.icone;
                const temSub = !!item.subitens?.length;
                const comFilhoAtivo = filhoAtivo(item, caminho);
                const subPermitidos = item.subitens?.filter((s) => s.existente !== false && permitido(s.href)) ?? [];
                const grupoBloqueado = temSub && subPermitidos.length === 0;

                /* ── Grupo inteiro sem permissão: visível, desabilitado ── */
                if (grupoBloqueado) {
                  return (
                    <li key={item.label}>
                      <span
                        role="link"
                        aria-disabled="true"
                        title={SEM_PERMISSAO}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-[13.5px]",
                          CLASSE_DESABILITADO,
                        )}
                      >
                        <Icone size={15} className="text-white/30" />
                        <span className="flex-1 text-left">{item.label}</span>
                      </span>
                    </li>
                  );
                }

                /* ── Item sem submenu (Dashboard) ── */
                if (!temSub) {
                  const ativo =
                    item.href === "/"
                      ? caminho === "/"
                      : caminho.startsWith(item.href!);
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href!}
                        style={ativo ? { boxShadow: "var(--sidebar-active-shadow)" } : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-[13.5px] transition-colors",
                          ativo
                            ? "bg-sidebar-active-bg font-semibold text-sidebar-active-ink"
                            : "text-white/80 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <Icone
                          size={15}
                          className={ativo ? "text-sidebar-active-ink" : "text-white/60"}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                }

                /* ── Item com submenu — FLYOUT (tela larga) ── */
                if (!estreito) {
                  const flyoutAtivo = flyout?.label === item.label;
                  return (
                    <li key={item.label}>
                      <button
                        onMouseEnter={(e) => mostrarFlyout(item.label, e.currentTarget)}
                        onMouseLeave={agendarEsconder}
                        onClick={() => {
                          const primeiro = subPermitidos[0];
                          if (primeiro) router.push(primeiro.href);
                        }}
                        style={
                          comFilhoAtivo
                            ? { boxShadow: "var(--sidebar-active-shadow)" }
                            : undefined
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-[13.5px] transition-colors",
                          comFilhoAtivo
                            ? "bg-sidebar-active-bg font-semibold text-sidebar-active-ink"
                            : flyoutAtivo
                              ? "bg-white/10 text-white"
                              : "text-white/80 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <Icone
                          size={15}
                          className={
                            comFilhoAtivo ? "text-sidebar-active-ink" : "text-white/60"
                          }
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    </li>
                  );
                }

                /* ── Item com submenu — ACCORDION (tela estreita) ── */
                const aberto = abertos[item.label];
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleAcordeon(item.label)}
                      style={
                        comFilhoAtivo && !aberto
                          ? { boxShadow: "var(--sidebar-active-shadow)" }
                          : undefined
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-[13.5px] transition-colors",
                        comFilhoAtivo && !aberto
                          ? "bg-sidebar-active-bg font-semibold text-sidebar-active-ink"
                          : aberto
                            ? "bg-white/10 font-medium text-white"
                            : "text-white/80 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icone
                        size={15}
                        className={
                          comFilhoAtivo && !aberto ? "text-sidebar-active-ink" : "text-white/60"
                        }
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>

                    {aberto && (
                      <ul className="ml-[23px] mt-1 space-y-[2px] border-l border-white/15 pl-3">
                        {item.subitens!.map((sub) => {
                          if (sub.existente === false) {
                            return (
                              <li key={sub.href}>
                                <span
                                  className="flex items-center rounded-[var(--radius)] px-2 py-[6px] text-[12.5px] text-white/35 italic cursor-default"
                                  title="Tela ainda não construída"
                                >
                                  {sub.label}
                                </span>
                              </li>
                            );
                          }
                          if (!permitido(sub.href)) {
                            return (
                              <li key={sub.href}>
                                <span
                                  role="link"
                                  aria-disabled="true"
                                  title={SEM_PERMISSAO}
                                  className={cn("flex items-center rounded-[var(--radius)] px-2 py-[6px] text-[12.5px]", CLASSE_DESABILITADO)}
                                >
                                  {sub.label}
                                </span>
                              </li>
                            );
                          }
                          const subAtivo =
                            caminho === sub.href ||
                            (sub.href !== "/" && caminho.startsWith(sub.href));
                          return (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                className={cn(
                                  "relative flex items-center rounded-[var(--radius)] px-2 py-[6px] text-[12.5px] transition-colors",
                                  subAtivo
                                    ? "font-semibold text-white"
                                    : "text-white/70 hover:text-white",
                                )}
                              >
                                {subAtivo && (
                                  <span className="absolute -left-[13px] bottom-1 top-1 w-[2px] rounded-full bg-white/70" />
                                )}
                                {sub.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Flyout — position: fixed, fora do fluxo da sidebar */}
      {!estreito && flyoutItem?.subitens && flyout && (
        <FlyoutPanel
          item={flyoutItem}
          top={flyout.top}
          caminho={caminho}
          permitido={permitido}
          onMouseEnter={cancelarEsconder}
          onMouseLeave={agendarEsconder}
          onNavegar={() => {
            cancelarEsconder();
            setFlyout(null);
          }}
        />
      )}

      {/* Rodapé */}
      <div className="shrink-0 border-t border-white/15 px-3 py-3">
        <Link
          href="/perfil"
          className="flex items-center gap-2.5 rounded-[var(--radius)] px-1 py-1 transition-colors hover:bg-white/10"
        >
          <AvatarUsuario
            nome={usuarioReal.nome}
            foto={fotoPerfil}
            tamanho={64}
            className="h-8 w-8 rounded-full bg-white/15 text-[11px] font-semibold text-white"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12.5px] font-medium text-white/90">{usuarioReal.nome}</p>
            <p className="truncate text-[11px] text-white/50">{usuarioReal.email}</p>
          </div>
        </Link>
        <button
          onClick={() => { sair(); signOut({ callbackUrl: "/login" }); }}
          className="mt-1 flex w-full items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-[13px] text-white/60 transition-colors hover:bg-white/10 hover:text-danger"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}
