import type { MetadataRoute } from "next";

// robots.txt do PAINEL (não confundir com o robots.txt do site do cliente,
// editado em app/api/robots/route.ts e servido por _astro/public/robots.txt).
// Um robots.txt aqui vale só para este subdomínio (painel.dominio.com) — o
// do site em outro subdomínio não o alcança. Painel é área administrativa:
// nunca deve ser rastreado.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
