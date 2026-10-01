// Serve /midia/* na PRÉVIA LOCAL (astro dev e astro preview) a partir da pasta de
// mídia do painel. Em produção quem serve /midia/ é o Nginx (alias); este plugin
// não roda no build e nada é copiado para o dist.
//
// Pasta usada (a primeira que existir):
//   1. process.env.LINKFLOW_MIDIA_DIR
//   2. <raiz do projeto Astro>/../midia   (site local: <site>/midia ao lado de _astro/)
//   3. <raiz do projeto Astro>/midia
// Só arquivos estáticos de tipos permitidos (sem SVG/HTML), sem path traversal.
import fs from 'node:fs';
import path from 'node:path';

const TIPOS = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm',
};

export function resolverPastaMidia(raiz) {
  const candidatas = [
    process.env.LINKFLOW_MIDIA_DIR,
    path.resolve(raiz, '..', 'midia'),
    path.resolve(raiz, 'midia'),
  ].filter(Boolean);
  for (const c of candidatas) {
    try { if (fs.statSync(c).isDirectory()) return fs.realpathSync(c); } catch { /* próxima */ }
  }
  return null;
}

export function criarHandler(raiz) {
  return function midiaHandler(req, res, next) {
    const url = req.url || '';
    if (!url.startsWith('/midia/') || (req.method !== 'GET' && req.method !== 'HEAD')) return next();
    const negar = (codigo) => { res.statusCode = codigo; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end(codigo === 404 ? 'Not found' : 'Forbidden'); };
    let rel;
    try { rel = decodeURIComponent(url.slice('/midia/'.length).split(/[?#]/)[0]); } catch { return negar(404); }
    if (!rel || rel.includes('\0') || rel.includes(String.fromCharCode(92))) return negar(404);
    const partes = rel.split('/');
    if (partes.some((p) => p === '' || p === '.' || p === '..' || p.startsWith('.'))) return negar(404);
    const ext = path.extname(rel).toLowerCase();
    const tipo = TIPOS[ext];
    if (!tipo || rel.toLowerCase().endsWith('.meta.json')) return negar(404);
    const pasta = resolverPastaMidia(raiz);
    if (!pasta) return negar(404);
    let real;
    try { real = fs.realpathSync(path.join(pasta, ...partes)); } catch { return negar(404); }
    if (real !== pasta && !real.startsWith(pasta + path.sep)) return negar(404);
    let st;
    try { st = fs.statSync(real); } catch { return negar(404); }
    if (!st.isFile()) return negar(404);
    res.statusCode = 200;
    res.setHeader('Content-Type', tipo);
    res.setHeader('Content-Length', st.size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(real).on('error', () => res.destroy()).pipe(res);
  };
}

export default function midiaDev() {
  let raiz = process.cwd();
  return {
    name: 'linkflow-midia-dev',
    apply: (_c, { command }) => command === 'serve',
    configResolved(cfg) { raiz = cfg.root || raiz; },
    configureServer(server) { server.middlewares.use(criarHandler(raiz)); },
    configurePreviewServer(server) { server.middlewares.use(criarHandler(raiz)); },
  };
}
