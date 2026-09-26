/**
 * lib/jsonld-previa.ts — prévia do JSON-LD do negócio nas telas Contato e Identidade.
 *
 * Espelha `organizacaoSchema` do motor (_astro/src/lib/schema.ts) com os mesmos
 * campos do config/site.ts: campo ausente = propriedade omitida, nunca valor de
 * exemplo. Sem React nem fs (testável em Node).
 */

import type { Funcionamento } from "./site-config";

export interface SiteParaPrevia {
  nome?: string;
  dominio?: string;
  slogan?: string;
  descricao?: string;
  anoFundacao?: number | string | null;
  faixaPreco?: string;
  especialidade?: string;
  schemaTipo?: string[];
  logo?: { src?: string };
  ogImagem?: string;
  credencial?: { conselho?: string; registro?: string; responsavel?: string };
  nap?: Partial<Record<"logradouro" | "complemento" | "bairro" | "cidade" | "uf" | "cep" | "telefone" | "email", string>>;
  redes?: Record<string, string>;
  funcionamento?: Funcionamento[];
  areaAtendimento?: string[];
}

const DIA_SCHEMA: Record<string, string> = {
  seg: "Monday", ter: "Tuesday", qua: "Wednesday", qui: "Thursday", sex: "Friday", sab: "Saturday", dom: "Sunday",
};
const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/;

function urlAbsoluta(dominio: string | undefined, caminho: string | undefined): string | undefined {
  if (!caminho) return undefined;
  if (/^https?:\/\//i.test(caminho)) return caminho;
  const base = (dominio ?? "").replace(/\/+$/, "");
  if (!base) return caminho;
  return `${base}${caminho.startsWith("/") ? "" : "/"}${caminho}`;
}

function textoCredencial(c: SiteParaPrevia["credencial"]): string | undefined {
  if (!c) return undefined;
  const partes = [c.conselho, c.registro].filter(Boolean).join(" ");
  const resp = c.responsavel ? `Responsável técnico: ${c.responsavel}` : "";
  return [partes, resp].filter(Boolean).join(" · ") || undefined;
}

export function gerarJsonLd(site: SiteParaPrevia): string {
  const nap = site.nap ?? {};
  const horarios = (site.funcionamento ?? [])
    .filter((h) => h && !h.fechado && h.dias?.length && HORA.test(h.abre ?? "") && HORA.test(h.fecha ?? ""))
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dias.map((d) => DIA_SCHEMA[d]).filter(Boolean),
      opens: h.abre,
      closes: h.fecha,
    }));
  const area = (site.areaAtendimento ?? [])
    .filter((n) => n.trim())
    .map((n) => ({ "@type": n === nap.cidade ? "City" : "Place", name: n }));
  const logoUrl = urlAbsoluta(site.dominio, site.logo?.src);
  const redes = Object.values(site.redes ?? {}).filter(Boolean);
  const credencial = textoCredencial(site.credencial);
  const rua = [nap.logradouro, nap.complemento].filter(Boolean).join(", ");
  const temEndereco = !!(rua || nap.cidade || nap.uf || nap.cep);

  const obj = {
    "@context": "https://schema.org",
    "@type": site.schemaTipo?.length ? site.schemaTipo : ["LocalBusiness"],
    name: site.nome || undefined,
    url: site.dominio || undefined,
    telephone: nap.telefone || undefined,
    email: nap.email || undefined,
    slogan: site.slogan || undefined,
    description: site.descricao || undefined,
    foundingDate: site.anoFundacao ? String(site.anoFundacao) : undefined,
    priceRange: site.faixaPreco || undefined,
    knowsAbout: site.especialidade || undefined,
    logo: logoUrl,
    image: urlAbsoluta(site.dominio, site.ogImagem) ?? logoUrl,
    sameAs: redes.length ? redes : undefined,
    hasCredential: credencial ? { "@type": "EducationalOccupationalCredential", name: credencial } : undefined,
    address: temEndereco
      ? {
          "@type": "PostalAddress",
          streetAddress: rua || undefined,
          addressLocality: nap.cidade || undefined,
          addressRegion: nap.uf || undefined,
          postalCode: nap.cep || undefined,
          addressCountry: "BR",
        }
      : undefined,
    openingHoursSpecification: horarios.length ? horarios : undefined,
    areaServed: area.length ? area : undefined,
  };
  return JSON.stringify(obj, null, 2);
}
