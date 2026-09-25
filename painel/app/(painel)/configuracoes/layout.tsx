"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/configuracoes/identidade", label: "Identidade" },
  { href: "/configuracoes/contato", label: "Contato e NAP" },
  { href: "/configuracoes/redes", label: "Redes sociais" },
  { href: "/configuracoes/integracoes", label: "Integrações" },
];

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-52px)] gap-0">
      <nav className="w-48 shrink-0 border-r border-[var(--line)] bg-[var(--surface)] pt-6 pb-8 pr-0">
        <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          Configurações
        </p>
        <ul className="flex flex-col gap-0.5 px-2">
          {ABAS.map((aba) => {
            const ativo = caminho === aba.href || caminho.startsWith(aba.href + "/");
            return (
              <li key={aba.href}>
                <Link
                  href={aba.href}
                  className={cn(
                    "block rounded-[var(--radius)] px-3 py-1.5 text-sm transition-colors",
                    ativo
                      ? "bg-[var(--primary)] font-medium text-[var(--primary-ink)]"
                      : "text-[var(--ink)] hover:bg-[var(--secondary)]",
                  )}
                >
                  {aba.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 px-8 py-6">{children}</div>
    </div>
  );
}
