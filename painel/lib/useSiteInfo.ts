/**
 * lib/useSiteInfo.ts — Hook para carregar as informações reais do site
 * (domínio, nome, redes sociais, endereço, telefone) a partir de /api/config.
 *
 * Usado onde o schema JSON-LD (Organization, WebSite, etc.) precisa dos
 * dados reais do cliente em vez de valores fixos — nunca hardcodar aqui.
 */
import { useState, useEffect } from "react";
import type { SiteInfo } from "@/motor/schema-graph";

const SITE_INFO_PADRAO: SiteInfo = { dominio: "", nomeSite: "" };

export function useSiteInfo(): SiteInfo {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(SITE_INFO_PADRAO);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config) return;
        const c = data.config;
        const sameAs = [c.instagram, c.facebook, c.youtube, c.linkedin, c.tiktok].filter(
          (v): v is string => Boolean(v)
        );
        const temEndereco = Boolean(c.logradouro || c.cidade);

        setSiteInfo({
          dominio: c.dominioHost ?? "", // sem protocolo — SiteInfo.dominio
          nomeSite: c.nome ?? "",
          sameAs: sameAs.length > 0 ? sameAs : undefined,
          endereco: temEndereco
            ? {
                streetAddress: c.logradouro || undefined,
                addressLocality: c.cidade || undefined,
                addressRegion: c.uf || undefined,
                postalCode: c.cep || undefined,
              }
            : undefined,
          telefone: c.telefone || undefined,
        });
      })
      .catch(console.error);
  }, []);

  return siteInfo;
}
