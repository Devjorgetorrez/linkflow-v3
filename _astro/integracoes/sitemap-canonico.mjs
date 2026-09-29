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
 *
 * llms.txt básico (gerarLlmsBasico): título = site.nome (config/site.ts,
 * lido por regex, sem executar o módulo), resumo = site.descricao, seção
 * "Páginas" e seção "Serviços" (coleção content/servicos/) — só entra
 * página com meta description real; rascunho sem SEO escrito fica de
 * fora. Sem isso o arquivo ficava só com "# domínio" + linha de sitemap
 * até o cliente abrir a tela /seo/llms no painel (erro 56, Relatório de
 * Testes 4).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ_MOTOR = dirname(dirname(fileURLToPath(import.meta.url))) // .../_astro

/** Lê um campo string de nível raiz de config/site.ts sem executar o módulo
 *  (mesma técnica de painel/lib/fs.ts:getRotaPilar — regex sobre o texto). */
function campoConfig(texto, campo) {
  const m = texto.match(new RegExp(`\\b${campo}\\s*:\\s*(['"])((?:(?!\\1).)*)\\1`))
  return m ? m[2] : null
}

function slugsDaColecao(colecao) {
  const dir = join(RAIZ_MOTOR, 'src', 'content', colecao)
  if (!existsSync(dir)) return new Set()
  return new Set(
    readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace(/\.md$/, '').toLowerCase()),
  )
}

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

/** llms.txt real (título, resumo, páginas e serviços com texto de verdade),
 * gerado só quando o cliente/painel ainda não salvou um em public/llms.txt
 * (ver comentário no topo do arquivo). Nunca lista item sem meta description
 * real — página ainda sem SEO escrito não entra. */
function gerarLlmsBasico(dominioPrincipal, paginas) {
  let configTexto = ''
  try {
    configTexto = readFileSync(join(RAIZ_MOTOR, 'src', 'config', 'site.ts'), 'utf-8')
  } catch {
    configTexto = ''
  }
  const nome = campoConfig(configTexto, 'nome') || dominioPrincipal
  const descricao = campoConfig(configTexto, 'descricao')
  const rotaPilarM = configTexto.match(/rotaPilar\s*:\s*['"]([^'"]+)['"]/)
  const rotaPilar = rotaPilarM ? normalizarRota('/' + rotaPilarM[1].replace(/^\/+|\/+$/g, '')) : '/servicos'
  const servicos = slugsDaColecao('servicos')

  const comTextoReal = paginas.filter(p => p.rota !== '/' && p.descricao)
  const paginasServico = comTextoReal.filter(p => servicos.has(p.rota.replace(/^\//, '')))
  const paginasGerais = comTextoReal.filter(p => !servicos.has(p.rota.replace(/^\//, '')) && p.rota !== rotaPilar)

  const secao = (titulo, itens) => {
    if (itens.length === 0) return []
    const linhas = [`## ${titulo}`]
    for (const p of itens) linhas.push(`- [${p.titulo || p.loc}](${p.loc}): ${p.descricao}`)
    linhas.push('')
    return linhas
  }

  const linhas = [`# ${nome}`, '']
  if (descricao) linhas.push(`> ${descricao}`, '')
  linhas.push(...secao('Páginas', paginasGerais))
  linhas.push(...secao('Serviços', paginasServico))
  linhas.push(`Sitemap: https://${dominioPrincipal}/sitemap.xml`)
  return linhas.join('\n') + '\n'
}

export default function sitemapCanonico() {
  return {
    name: 'linkflow-sitemap-canonico',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const raiz = fileURLToPath(dir)
        const arquivos = await listarIndexHtml(raiz)

        const urls = new Map() // loc -> lastmod | null
        const paginas = [] // { rota, loc, titulo, descricao } — só as incluídas no sitemap
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

          const titulo = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim()
          const descricao = (tags(html, 'meta').find(a => (a.name ?? '').toLowerCase() === 'description')?.content ?? '').trim()
          paginas.push({ rota: normalizarRota(rota), loc: url.href, titulo, descricao })
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
            const llmsTxt = gerarLlmsBasico(dominioPrincipal, paginas)
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
