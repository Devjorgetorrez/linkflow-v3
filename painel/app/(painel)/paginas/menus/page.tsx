"use client";

import { AlertTriangle, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

import { Botao, Campo, Entrada } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ItemMenu, Menu } from "@/mock/types";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function gerarId() {
  return `mi-${Math.random().toString(36).slice(2, 8)}`;
}

function todasUrls(itens: ItemMenu[]): string[] {
  return itens.flatMap((i) => [i.url, ...(i.filhos ? todasUrls(i.filhos) : [])]);
}

interface ItemNavApi {
  label: string;
  href: string;
  filhos?: ItemNavApi[];
  oculto?: boolean;
}
interface ColunaFooterApi {
  titulo: string;
  itens: ItemNavApi[];
}
interface ColunaFooterUI {
  titulo: string;
  itens: ItemMenu[];
}

function navApiParaItemMenu(item: ItemNavApi, id: string): ItemMenu {
  return {
    id,
    label: item.label,
    url: item.href,
    filhos: item.filhos?.map((f, i) => navApiParaItemMenu(f, `${id}-${i}`)),
    oculto: item.oculto,
  };
}

function itemMenuParaNavApi(item: ItemMenu): ItemNavApi {
  return {
    label: item.label,
    href: item.url,
    ...(item.oculto ? { oculto: true } : {}),
    ...(item.filhos && item.filhos.length > 0
      ? { filhos: item.filhos.map(itemMenuParaNavApi) }
      : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Form "Adicionar item"                                                */
/* ------------------------------------------------------------------ */

interface FormAdicionarProps {
  paginasPublicadas: { id: string; titulo: string; url: string }[];
  onAdicionar: (item: ItemMenu) => void;
  onCancelar: () => void;
}

function FormAdicionar({ paginasPublicadas, onAdicionar, onCancelar }: FormAdicionarProps) {
  const [modo, setModo] = useState<"pagina" | "externa">("pagina");
  const [paginaSel, setPaginaSel] = useState(paginasPublicadas[0]?.url ?? "");
  const [labelExt, setLabelExt] = useState("");
  const [urlExt, setUrlExt] = useState("https://");

  function adicionar() {
    if (modo === "pagina") {
      const pg = paginasPublicadas.find((p) => p.url === paginaSel);
      if (!pg) return;
      onAdicionar({ id: gerarId(), label: pg.titulo, url: pg.url });
    } else {
      if (!labelExt.trim() || !urlExt.trim()) return;
      onAdicionar({ id: gerarId(), label: labelExt.trim(), url: urlExt.trim() });
    }
  }

  return (
    <div className="mt-3 rounded-[var(--radius)] border border-dashed border-line bg-surface-2 p-3">
      {/* modo toggle */}
      <div className="mb-3 flex gap-1">
        {(["pagina", "externa"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModo(m)}
            className={cn(
              "rounded px-2.5 py-1 text-[11.5px] font-medium transition-colors",
              modo === m
                ? "bg-primary text-primary-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {m === "pagina" ? "Página existente" : "URL externa"}
          </button>
        ))}
      </div>

      {modo === "pagina" ? (
        <Campo label="Página">
          <select
            value={paginaSel}
            onChange={(e) => setPaginaSel(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-1.5 text-[12px] text-ink focus:border-primary focus:outline-none"
          >
            {paginasPublicadas.map((p) => (
              <option key={p.id} value={p.url}>
                {p.titulo} — {p.url}
              </option>
            ))}
          </select>
        </Campo>
      ) : (
        <div className="space-y-2">
          <Campo label="Rótulo">
            <Entrada
              value={labelExt}
              onChange={(e) => setLabelExt(e.target.value)}
              placeholder="Texto do link"
            />
          </Campo>
          <Campo label="URL">
            <Entrada
              value={urlExt}
              onChange={(e) => setUrlExt(e.target.value)}
              placeholder="https://..."
            />
          </Campo>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Botao variante="primario" tamanho="sm" onClick={adicionar}>
          Adicionar
        </Botao>
        <button
          onClick={onCancelar}
          className="text-[12px] text-ink-muted hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Linha de item                                                        */
/* ------------------------------------------------------------------ */

interface ItemRowProps {
  item: ItemMenu;
  visivel: boolean;
  onToggleVisivel: () => void;
  onRemover: () => void;
  indentado?: boolean;
}

function ItemRow({ item, visivel, onToggleVisivel, onRemover, indentado }: ItemRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius)] border border-line bg-surface px-2.5 py-2",
        indentado && "ml-5 border-l-2 border-l-line",
        !visivel && "opacity-50",
      )}
    >
      <GripVertical size={13} className="shrink-0 cursor-grab text-ink-muted/40" />

      <div className="min-w-0 flex-1">
        <span className={cn("text-[12.5px] font-medium text-ink", !visivel && "line-through text-ink-muted")}>
          {item.label}
        </span>
        <span className="ml-1.5 font-mono text-[10.5px] text-ink-muted">{item.url}</span>
      </div>

      <button
        onClick={onToggleVisivel}
        title={visivel ? "Ocultar item" : "Exibir item"}
        className="flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-secondary hover:text-ink"
      >
        {visivel ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>

      <button
        onClick={onRemover}
        title="Remover item"
        className="flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Painel de menu                                                       */
/* ------------------------------------------------------------------ */

interface PainelMenuProps {
  menu: Menu;
  paginasPublicadas: { id: string; titulo: string; url: string }[];
  onToggleVisivel: (itemId: string) => void;
  onRemoverItem: (menuId: string, itemId: string) => void;
  onAdicionarItem: (menuId: string, item: ItemMenu) => void;
}

function PainelMenu({
  menu,
  paginasPublicadas,
  onToggleVisivel,
  onRemoverItem,
  onAdicionarItem,
}: PainelMenuProps) {
  const [adicionando, setAdicionando] = useState(false);

  return (
    <div className="flex flex-col gap-0 rounded-[var(--radius)] border border-line bg-surface-2 shadow-[var(--shadow-card)]">
      {/* cabeçalho do painel */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <h2 className="text-[13px] font-semibold text-ink">{menu.nome}</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-medium text-primary">
          {menu.local}
        </span>
      </div>

      {/* itens */}
      <div className="space-y-1.5 p-3">
        {menu.itens.length === 0 && (
          <p className="py-2 text-center text-[12px] text-ink-muted">Nenhum item</p>
        )}

        {menu.itens.map((item) => (
          <div key={item.id}>
            <ItemRow
              item={item}
              visivel={!item.oculto}
              onToggleVisivel={() => onToggleVisivel(item.id)}
              onRemover={() => onRemoverItem(menu.id, item.id)}
            />
            {item.filhos?.map((filho) => (
              <div key={filho.id} className="mt-1">
                <ItemRow
                  item={filho}
                  visivel={!filho.oculto}
                  onToggleVisivel={() => onToggleVisivel(filho.id)}
                  onRemover={() => {
                    const semFilho = menu.itens.map((i) =>
                      i.id === item.id
                        ? { ...i, filhos: (i.filhos ?? []).filter((f) => f.id !== filho.id) }
                        : i,
                    );
                    // persisted via parent
                    onAdicionarItem(menu.id, { ...item, filhos: semFilho.find((i) => i.id === item.id)?.filhos ?? [] });
                  }}
                  indentado
                />
              </div>
            ))}
          </div>
        ))}

        {/* form adicionar */}
        {adicionando ? (
          <FormAdicionar
            paginasPublicadas={paginasPublicadas}
            onAdicionar={(item) => {
              onAdicionarItem(menu.id, item);
              setAdicionando(false);
            }}
            onCancelar={() => setAdicionando(false)}
          />
        ) : (
          <button
            onClick={() => setAdicionando(true)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-dashed border-line py-2 text-[12px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
          >
            <Plus size={13} />
            Adicionar item
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function MenusPage() {
  const { menus: menusMock, atualizarMenu, paginas } = useStore();
  const [menus, setMenus] = useState(menusMock);
  const [footerColunas, setFooterColunas] = useState<ColunaFooterUI[]>([]);

  const paginasPublicadas = paginas
    .filter((p) => p.status === "publicado")
    .map((p) => ({ id: p.id, titulo: p.titulo, url: p.url }));

  // Carregar menus reais do config ao montar
  useEffect(() => {
    fetch("/api/menus")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        // Mapear nav → menu principal, navFooter → menu rodapé
        // A lista vem do config/site.ts (o store começa vazio, então não dá
        // para "mapear" sobre ela: o menu precisa ser criado aqui).
        setMenus(data.nav?.length ? [{
              id: "principal",
              nome: "Menu principal",
              local: "Cabeçalho do site",
              itens: data.nav.map((i: ItemNavApi, idx: number) => ({
                id: `nav-${idx}`,
                label: i.label,
                url: i.href,
                oculto: i.oculto,
                // Preservar filhos mesmo sem editor próprio ainda — sem isso,
                // salvar qualquer coisa nesta tela apagaria o dropdown que
                // o agente gerou (fase2-site-astro, ETAPA 4.2).
                filhos: i.filhos?.map((f, subIdx) => ({
                  id: `nav-${idx}-${subIdx}`,
                  label: f.label,
                  url: f.href,
                  oculto: f.oculto,
                })),
              })),
            }] : []);

        setFooterColunas(
          (data.navFooter ?? []).map((coluna: ColunaFooterApi, colIdx: number) => ({
            titulo: coluna.titulo,
            itens: coluna.itens.map((item, itemIdx) =>
              navApiParaItemMenu(item, `footer-${colIdx}-${itemIdx}`),
            ),
          })),
        );
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Salvamento não podia ser "fire-and-forget": um reload/navegação logo após
  // editar (achado real rodando Playwright de verdade contra esta tela — o
  // PATCH ainda estava em voo quando o teste recarregava a página) perdia a
  // mudança em silêncio, sem nenhum aviso. Rastreado + aguardado explicitamente.
  const [salvandoMenu, setSalvandoMenu] = useState(false);
  const [erroSalvarMenu, setErroSalvarMenu] = useState<string | null>(null);

  // Aguardar o PATCH resolve a corrida dentro do React, mas não impede o
  // navegador de recarregar/fechar a aba no meio do voo — só o beforeunload
  // faz isso de verdade.
  useEffect(() => {
    if (!salvandoMenu) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [salvandoMenu]);

  async function salvarNoServidor(body: Record<string, unknown>) {
    setSalvandoMenu(true);
    setErroSalvarMenu(null);
    try {
      const r = await fetch("/api/menus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const dados = await r.json().catch(() => ({ ok: false }));
      if (!r.ok || !dados.ok) throw new Error(dados.erro ?? "Não consegui salvar.");
    } catch (err) {
      setErroSalvarMenu(err instanceof Error ? err.message : "Não consegui salvar.");
    } finally {
      setSalvandoMenu(false);
    }
  }

  // Persistir mudanças no config ao atualizar menu
  async function atualizarMenuReal(menuId: string, patch: Partial<typeof menus[0]>) {
    atualizarMenu(menuId, patch);
    setMenus((prev) => prev.map((m) => (m.id === menuId ? { ...m, ...patch } : m)));
    // Salvar nav principal no config
    const menuAtualizado = menus.find((m) => m.id === menuId);
    if (menuId === "principal" && (patch.itens ?? menuAtualizado?.itens)) {
      const itens = patch.itens ?? menuAtualizado?.itens ?? [];
      await salvarNoServidor({
        nav: itens.map((i) => ({
          label: i.label,
          href: i.url,
          ...(i.oculto ? { oculto: true } : {}),
          // Preservar filhos — sem editor próprio ainda nesta tela, mas
          // sem isso qualquer salvamento aqui apagaria o dropdown gerado
          // pelo agente (fase2-site-astro, ETAPA 4.2).
          ...(i.filhos && i.filhos.length > 0
            ? { filhos: i.filhos.map((f) => ({ label: f.label, href: f.url, ...(f.oculto ? { oculto: true } : {}) })) }
            : {}),
        })),
      });
    }
  }

  // Persistir uma coluna do rodapé — sempre envia TODAS as colunas (a API
  // substitui o array inteiro), nunca só a que mudou, senão apagaria as
  // outras colunas no config.
  async function atualizarColunaFooter(colIdx: number, novosItens: ItemMenu[]) {
    const next = footerColunas.map((c, i) => (i === colIdx ? { ...c, itens: novosItens } : c));
    setFooterColunas(next);
    await salvarNoServidor({
      navFooter: next.map((c) => ({
        titulo: c.titulo,
        itens: c.itens.map(itemMenuParaNavApi),
      })),
    });
  }

  function removerItemFooter(colIdx: number, itemId: string) {
    const coluna = footerColunas[colIdx];
    if (!coluna) return;
    void atualizarColunaFooter(colIdx, coluna.itens.filter((i) => i.id !== itemId));
  }

  function adicionarItemFooter(colIdx: number, item: ItemMenu) {
    const coluna = footerColunas[colIdx];
    if (!coluna) return;
    void atualizarColunaFooter(colIdx, [...coluna.itens, item]);
  }

  // "Ocultar item" precisa sair do ar de verdade, não só riscar na tela —
  // sem persistir, o item voltava ao recarregar e nunca chegou a sumir do
  // site publicado (erro 91, Relatório de Testes 6). Mesmo caminho de
  // salvamento de remover/adicionar: acha o item (menu principal, filho, ou
  // coluna do rodapé) e grava com oculto invertido.
  function toggleVisivel(itemId: string) {
    const menuPrincipal = menus.find((m) => m.id === "principal");
    if (menuPrincipal) {
      if (menuPrincipal.itens.some((i) => i.id === itemId)) {
        const itens = menuPrincipal.itens.map((i) =>
          i.id === itemId ? { ...i, oculto: !i.oculto } : i,
        );
        void atualizarMenuReal("principal", { itens });
        return;
      }
      const pai = menuPrincipal.itens.find((i) => i.filhos?.some((f) => f.id === itemId));
      if (pai) {
        const itens = menuPrincipal.itens.map((i) =>
          i.id === pai.id
            ? { ...i, filhos: i.filhos?.map((f) => (f.id === itemId ? { ...f, oculto: !f.oculto } : f)) }
            : i,
        );
        void atualizarMenuReal("principal", { itens });
        return;
      }
    }

    for (let colIdx = 0; colIdx < footerColunas.length; colIdx++) {
      if (footerColunas[colIdx].itens.some((i) => i.id === itemId)) {
        const itens = footerColunas[colIdx].itens.map((i) =>
          i.id === itemId ? { ...i, oculto: !i.oculto } : i,
        );
        void atualizarColunaFooter(colIdx, itens);
        return;
      }
    }
  }

  function removerItem(menuId: string, itemId: string) {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    void atualizarMenuReal(menuId, { itens: menu.itens.filter((i) => i.id !== itemId) });
  }

  function adicionarItem(menuId: string, item: ItemMenu) {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    // if item already exists (filho removal hack), replace; otherwise append
    const existe = menu.itens.find((i) => i.id === item.id);
    if (existe) {
      void atualizarMenuReal(menuId, { itens: menu.itens.map((i) => (i.id === item.id ? item : i)) });
    } else {
      void atualizarMenuReal(menuId, { itens: [...menu.itens, item] });
    }
  }

  /* páginas sem menu — considera cabeçalho E rodapé, senão acusa falso
     "sem menu" pra página que só está linkada no rodapé */
  const urlsNoMenus = new Set([
    ...menus.flatMap((m) => todasUrls(m.itens)),
    ...footerColunas.flatMap((c) => todasUrls(c.itens)),
  ]);
  const paginasSemMenu = paginasPublicadas.filter((p) => !urlsNoMenus.has(p.url));

  return (
    <div className="flex flex-col gap-0">
      {/* cabeçalho */}
      <div className="border-b border-line px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink">Menus</h1>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">Header e rodapé do site</p>
          </div>
          {salvandoMenu && <span className="text-[11.5px] text-ink-muted">Salvando…</span>}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {erroSalvarMenu && (
          <div className="flex items-start gap-2.5 rounded-[var(--radius)] border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[12px] text-danger">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {erroSalvarMenu} — a mudança pode não ter sido salva. Recarregue a página para
            conferir antes de continuar editando.
          </div>
        )}

        {/* aviso páginas sem menu */}
        {paginasSemMenu.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-[var(--radius)] border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              <strong>{paginasSemMenu.length}</strong> página
              {paginasSemMenu.length !== 1 ? "s publicadas" : " publicada"} sem menu:{" "}
              {paginasSemMenu
                .slice(0, 3)
                .map((p) => p.url)
                .join(", ")}
              {paginasSemMenu.length > 3 && (
                <> + {paginasSemMenu.length - 3} mais</>
              )}
            </span>
          </div>
        )}

        {/* painéis lado a lado */}
        <div className="grid gap-5 lg:grid-cols-2">
          {menus.map((menu) => (
            <PainelMenu
              key={menu.id}
              menu={menu}
              paginasPublicadas={paginasPublicadas}
              onToggleVisivel={toggleVisivel}
              onRemoverItem={removerItem}
              onAdicionarItem={adicionarItem}
            />
          ))}
        </div>

        {/* rodapé */}
        {footerColunas.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            {footerColunas.map((coluna, colIdx) => (
              <PainelMenu
                key={`footer-${colIdx}`}
                menu={{
                  id: `footer-${colIdx}`,
                  nome: coluna.titulo,
                  local: "Rodapé",
                  itens: coluna.itens,
                }}
                paginasPublicadas={paginasPublicadas}
                onToggleVisivel={toggleVisivel}
                onRemoverItem={(_menuId, itemId) => removerItemFooter(colIdx, itemId)}
                onAdicionarItem={(_menuId, item) => adicionarItemFooter(colIdx, item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
