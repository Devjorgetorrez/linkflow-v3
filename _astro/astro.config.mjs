import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemapCanonico from './integracoes/sitemap-canonico.mjs';
import midiaDev from './integracoes/midia-dev.mjs';

export default defineConfig({
  devToolbar: { enabled: false },
  // Gera dist/sitemap.xml a partir das canonicals das páginas geradas —
  // ver integracoes/sitemap-canonico.mjs. Não existe mais public/sitemap.xml.
  integrations: [sitemapCanonico()],
  vite: {
    // midiaDev: só na prévia local (dev/preview) — serve /midia/* da pasta do painel.
    plugins: [tailwindcss(), midiaDev()],
  },
});
