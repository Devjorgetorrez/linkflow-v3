/**
 * sitemap-canonico — gera dist/sitemap.xml depois do build, a partir do
 * próprio site gerado. Integração local, sem dependência externa.
 *
 * Por que ler o dist/ em vez de montar a lista pelas coleções:
 * o sitemap não pode divergir do que foi publicado. Lendo o HTML final,
 * ele reflete automaticamente —
 *   - só páginas que existem de fato (rascunho não vira página, colisão de
 *     slug serviço/post já foi resolvida no [slug].astro);
 *   - páginas próprias de cada tema (ex: /contabilidade-consultiva) sem
 *     lista fixa a manter;
 *   - URL plana (/<slug>), porque a URL vem da <link rel="canonical"> que
 *     a própria página declara, com o domínio de site.dominio do cliente.
 *
 * Regras:
 *   - entra toda dist/**\/index.html com canonical absoluta;
 *   - fica fora quem tem <meta name="robots" content="...noindex...">;
 *   - fica fora quem tem canonical apontando para OUTRA rota (página que
 *     se declara duplicata de outra não deve ser listada);
 *   - <lastmod> só quando a página declara dateModified válido no JSON-LD
 *     (posts do tema-03/04). Sem data confiável, o campo é omitido — o
 *     Google ignora lastmod que não reflete mudança real.
 *
 * Substitui o antigo public/sitemap.xml estático, que era do tema de
 * exemplo (domínio vitalcaresaude.com.br, URLs /blog/<slug>) e ia igual
 * para todo cliente.
 *
 * robots.txt e llms.txt: mesma ideia, gerados aqui com o domínio real
 * (lido dos mesmos canonicals do sitemap) — SÓ quando o arquivo não veio
 * de public/. O Astro copia public/ pra dist/ antes deste hook rodar,
 * então checar existsSync(dist/robots.txt) aqui já é suficiente pra saber
 * se o painel salvou um (prevalece) ou se o site nunca teve um (gera
 * básico, funcional desde o primeiro build, antes de qualquer edição no
 * painel).
 */
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

async function listarIndexHtml(dir) {
  const achados = []
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name)
    if (entrada.isDirectory()) {
      if (entrada.name.startsWith('_')) continue // dist/_astro (CSS/JS)
      achados.push(...(await listarIndexHtml(caminho)))
    } else if (entrada.name === 'index.html') {
      achados.push(caminho)
    }
  }
  return achados
}

function atributos(tag) {
  const attrs = {}
  for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    attrs[m[1].toLowerCase()] = (m[3] ?? m[4]).replace(/&amp;/g, '&')
  }
  return attrs
}

function tags(html, nome) {
  return [...html.matchAll(new RegExp(`<${nome}\\b[^>]*>`, 'gi'))].map(m => atributos(m[0]))
}

const escaparXml = s =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const normalizarRota = p => (p.replace(/\/+$/, '') || '/')

export default function sitemapCanonico() {
  return {
    name: 'linkflow-sitemap-canonico',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const raiz = fileURLToPath(dir)
        const arquivos = await listarIndexHtml(raiz)

        const urls = new Map() // loc -> lastmod | null
        const hosts = new Set()
        const fora = { noindex: [], semCanonical: [], canonicalOutraRota: [] }

        for (const arquivo of arquivos) {
          const html = await readFile(arquivo, 'utf-8')
          const partes = relative(raiz, arquivo).split(sep).slice(0, -1)
          const rota = '/' + partes.join('/')

          const robots = tags(html, 'meta').find(a => (a.name ?? '').toLowerCase() === 'robots')
          if (robots && /noindex/i.test(robots.content ?? '')) {
            fora.noindex.push(rota)
            continue
          }

          const canonical = tags(html, 'link').find(a => (a.rel ?? '').toLowerCase() === 'canonical')
          let url
          try {
            url = new URL(canonical?.href ?? '')
          } catch {
            fora.semCanonical.push(rota)
            continue
          }

          if (normalizarRota(decodeURI(url.pathname)) !== normalizarRota(rota)) {
            fora.canonicalOutraRota.push(`${rota} → ${url.href}`)
            continue
          }

          const lastmod = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1] ?? null
          hosts.add(url.host)
          urls.set(url.href, lastmod)
        }

        const resumo = (lista, rotulo) => {
          if (lista.length === 0) return
          const amostra = lista.slice(0, 5).join(', ')
          logger.warn(`${lista.length} página(s) fora do sitemap por ${rotulo}: ${amostra}${lista.length > 5 ? ', …' : ''}`)
        }
        resumo(fora.semCanonical, 'falta de canonical absoluta')
        resumo(fora.canonicalOutraRota, 'canonical apontando para outra rota')
        if (fora.noindex.length) logger.info(`${fora.noindex.length} página(s) noindex fora do sitemap: ${fora.noindex.join(', ')}`)
        if (hosts.size > 1) logger.warn(`canonicals com mais de um domínio (${[...hosts].join(', ')}) — conferir site.dominio`)

        const dominioPrincipal = [...hosts][0]
        if (dominioPrincipal) {
          const robotsPath = join(raiz, 'robots.txt')
          if (!existsSync(robotsPath)) {
            const robotsTxt =
              'User-agent: *\n' +
              'Allow: /\n' +
              '\n' +
              `Sitemap: https://${dominioPrincipal}/sitemap.xml\n`
            await writeFile(robotsPath, robotsTxt, 'utf-8')
            logger.info(`robots.txt gerado (basico) — ${dominioPrincipal}`)
          }

          const llmsPath = join(raiz, 'llms.txt')
          if (!existsSync(llmsPath)) {
            const llmsTxt =
              `# ${dominioPrincipal}\n` +
              '\n' +
              `Sitemap: https://${dominioPrincipal}/sitemap.xml\n`
            await writeFile(llmsPath, llmsTxt, 'utf-8')
            logger.info(`llms.txt gerado (basico) — ${dominioPrincipal}`)
          }
        }

        if (urls.size === 0) {
          logger.error('nenhuma página elegível — sitemap.xml NÃO foi gerado')
          return
        }

        const corpo = [...urls.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([loc, lastmod]) =>
            `  <url>\n    <loc>${escaparXml(loc)}</loc>\n` +
            (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
            `  </url>`)
          .join('\n')

        const xml =
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          corpo + '\n</urlset>\n'

        await writeFile(join(raiz, 'sitemap.xml'), xml, 'utf-8')
        logger.info(`sitemap.xml gerado com ${urls.size} URL(s) — ${[...hosts].join(', ')}`)
      },
    },
  }
}
