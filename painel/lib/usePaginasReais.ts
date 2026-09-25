/**
 * lib/usePaginasReais.ts — páginas REAIS do site, lidas de /api/paginas
 * (varredura do _astro/dist/ gerado no build).
 *
 * O store global (lib/store.tsx) começa com as páginas do mock de
 * demonstração e nunca as substitui pelas reais. Tela que gera arquivo
 * PUBLICADO no site (llms.txt, robots.txt) ou que lista URLs do site
 * (sitemap) não pode usar o store para páginas — usa este hook.
 *
 * Se a API falhar (ex: nenhum build ainda), a lista fica VAZIA e `real`
 * fica false — nunca dados de demonstração no lugar do site do cliente.
 */
import { useEffect, useState } from "react";
import type { Pagina } from "@/mock/types";

export function usePaginasReais(): { paginas: Pagina[]; real: boolean; carregando: boolean } {
  const [paginas, setPaginas] = useState<Pagina[]>([]);
  const [real, setReal] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/paginas", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.paginas)) {
          setPaginas(data.paginas);
          setReal(true);
        }
      })
      .catch(() => setPaginas([]))
      .finally(() => setCarregando(false));
  }, []);

  return { paginas, real, carregando };
}
