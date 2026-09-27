import type { Pagina } from "@/mock/types";

/** Indexação REAL (meta robots do HTML): "—" quando a página não pôde ser lida. */
export function IndexacaoBadge({ pagina }: { pagina: Pagina }) {
  const r = pagina.real;
  if (!r || r.erroLeitura) {
    return <span className="text-[11.5px] text-ink-muted/60" title={r?.erroLeitura}>—</span>;
  }
  if (r.noindex) {
    return (
      <span
        title={`Meta robots no HTML: ${r.robotsMeta.join(" | ")}`}
        className="inline-flex items-center rounded border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-1.5 py-[1px] text-[10.5px] font-medium text-[#b45309]"
      >
        Não indexada (noindex)
      </span>
    );
  }
  return (
    <span
      title={r.robotsMeta.length ? `Meta robots no HTML: ${r.robotsMeta.join(" | ")}` : "Sem meta robots: o Google pode indexar"}
      className="inline-flex items-center rounded border border-success/30 bg-success/10 px-1.5 py-[1px] text-[10.5px] font-medium text-success"
    >
      Indexável
    </span>
  );
}
