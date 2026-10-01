/**
 * lib/usePaginasReais.ts — páginas REAIS do site, lidas de /api/paginas
 * (HTML do site publicado; fallback: última prévia local em _astro/dist).
 *
 * O store global (lib/store.tsx) começa com as páginas do mock de
 * demonstração e nunca as substitui pelas reais. Tela que gera arquivo
 * PUBLICADO no site (llms.txt, robots.txt), que lista URLs do site (sitemap)
 * ou que mostra dado de página (Páginas) não pode usar o store — usa este hook.
 *
 * Se a API falhar (ex: nenhum build ainda), a lista fica VAZIA, `real` fica
 * false e `erro` diz o que houve — nunca dados de demonstração no lugar do
 * site do cliente.
 */
import { useEffect, useState } from "react";
import type { Pagina } from "@/mock/types";

export type OrigemPaginas = "publicado" | "previa" | "nenhuma";

export interface PaginasReais {
  paginas: Pagina[];
  real: boolean;
  carregando: boolean;
  /** de onde o HTML foi lido */
  origem: OrigemPaginas | null;
  /** "site publicado" | "última prévia local (dist)" | "nenhum site gerado ainda" */
  origemRotulo: string | null;
  /** URLs do sitemap do site lido (null = sem sitemap; undefined = não lido) */
  sitemapUrls: string[] | null | undefined;
  /** mensagem quando a leitura falhou */
  erro: string | null;
}

export function usePaginasReais(): PaginasReais {
  const [estado, setEstado] = useState<PaginasReais>({
    paginas: [],
    real: false,
    carregando: true,
    origem: null,
    origemRotulo: null,
    sitemapUrls: undefined,
    erro: null,
  });

  useEffect(() => {
    let ativo = true;
    fetch("/api/paginas", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!ativo) return;
        if (data.ok && Array.isArray(data.paginas)) {
          setEstado({
            paginas: data.paginas,
            real: data.origem !== "nenhuma",
            carregando: false,
            origem: data.origem ?? null,
            origemRotulo: data.origemRotulo ?? null,
            sitemapUrls: data.sitemapUrls,
            erro: null,
          });
        } else {
          setEstado((e) => ({ ...e, carregando: false, erro: "Não foi possível ler as páginas do site." }));
        }
      })
      .catch(() => {
        if (ativo) setEstado((e) => ({ ...e, carregando: false, erro: "Não foi possível ler as páginas do site." }));
      });
    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}
