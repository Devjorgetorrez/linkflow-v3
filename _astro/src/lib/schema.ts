/**
 * lib/schema.ts — JSON-LD do negócio, guiado pelo config/site.ts.
 *
 * Existe para que NENHUM layout escreva dado de cliente (horário, cidade
 * atendida, tipo de negócio) dentro de uma página. Antes, a home de cada layout
 * trazia o JSON-LD com os valores da empresa de demonstração (ex.: "Londrina",
 * "Seg–Qui 08:00–18:00") e um cliente de outra cidade publicava dados
 * estruturados falsos. Agora tudo sai de campos do config; campo ausente = a
 * propriedade é OMITIDA, nunca preenchida com valor de exemplo.
 *
 * Campos opcionais lidos do `site` (todos editáveis no painel):
 *   schemaTipo        string[]   tipos schema.org (ex.: ['Dentist','LocalBusiness'])
 *   funcionamento     {dias:['seg'..'dom'], abre:'08:00', fecha:'18:00', fechado?:bool}[]
 *   areaAtendimento   string[]   cidades/regiões atendidas
 *   atendimentoOnline boolean
 *   descricao         string
 *   faixaPreco        string     priceRange ('$$')
 *   especialidade     string     vira knowsAbout
 *   credencial        {conselho, registro, responsavel}
 *   logo              {src, srcEscuro?, alt?}
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Site = Record<string, any>

const DIA_SCHEMA: Record<string, string> = {
  seg: 'Monday', ter: 'Tuesday', qua: 'Wednesday', qui: 'Thursday',
  sex: 'Friday', sab: 'Saturday', dom: 'Sunday',
}

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/

/** Absolutiza um caminho de mídia ("/midia/logo.png") com o domínio do site. */
export function urlAbsoluta(site: Site, caminho?: string): string | undefined {
  if (!caminho) return undefined
  if (/^https?:\/\//i.test(caminho)) return caminho
  const base = String(site.dominio ?? '').replace(/\/+$/, '')
  if (!base) return undefined
  return `${base}${caminho.startsWith('/') ? '' : '/'}${caminho}`
}

/** OpeningHoursSpecification a partir de `site.funcionamento`. Sem o campo, [] (omitir). */
export function horariosSchema(site: Site): any[] {
  const lista: any[] = Array.isArray(site.funcionamento) ? site.funcionamento : []
  return lista
    .filter((h) => h && !h.fechado && Array.isArray(h.dias) && h.dias.length && HORA.test(h.abre ?? '') && HORA.test(h.fecha ?? ''))
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dias.map((d: string) => DIA_SCHEMA[d]).filter(Boolean),
      opens: h.abre,
      closes: h.fecha,
    }))
    .filter((h) => h.dayOfWeek.length)
}

/**
 * areaServed: `site.areaAtendimento` se existir; senão as listas próprias do
 * layout (`regioes` no tema-04/06, `cidades` no tema-07); senão a cidade do NAP.
 */
export function areaLista(site: Site): string[] {
  // Precedência: areaAtendimento (fonte mestra, editada no painel) > regioes > cidades
  // (legado dos layouts) > cidade do NAP. Toda página que mostra a cobertura usa esta lista.
  return (
    (Array.isArray(site.areaAtendimento) && site.areaAtendimento.length ? site.areaAtendimento : null) ??
    (Array.isArray(site.regioes) && site.regioes.length ? site.regioes : null) ??
    (Array.isArray(site.cidades) && site.cidades.length ? site.cidades : null) ??
    (site.nap?.cidade ? [site.nap.cidade] : [])
  )
}

export function areaServida(site: Site): any[] {
  const nomes: string[] = areaLista(site)
  return nomes
    .filter((n) => typeof n === 'string' && n.trim())
    .map((n) => ({ '@type': n === site.nap?.cidade ? 'City' : 'Place', name: n }))
}

export function tiposSchema(site: Site, padrao: string[]): string[] {
  return Array.isArray(site.schemaTipo) && site.schemaTipo.length ? site.schemaTipo : padrao
}

/**
 * Rótulo real do menu pra um caminho (ex.: '/servicos', '/blog') — lido de
 * `site.nav` (o mesmo campo que o cliente já customiza no painel), com um
 * padrão só se o item não existir no nav. Existe porque o tema-05 (e só
 * ele) tinha "Atuação"/"Publicações" (rótulos do template de referência,
 * um escritório de advocacia) escritos direto em 6 arquivos — resíduo que
 * vazava pro breadcrumb e pros dados estruturados mesmo quando o cliente
 * customizava o menu visível pra outro nicho (achado real, Relatório de
 * Testes 4, erro 51).
 */
export function rotuloNav(site: Site, caminho: string, padrao: string): string {
  const nav = Array.isArray(site.nav) ? site.nav : []
  const item = nav.find((i: { href?: string }) => i?.href === caminho)
  return item?.label || padrao
}

export function textoCredencial(site: Site): string | undefined {
  const c = site.credencial
  if (!c) return undefined
  const partes = [c.conselho, c.registro].filter(Boolean).join(' ')
  const resp = c.responsavel ? `Responsável técnico: ${c.responsavel}` : ''
  return [partes, resp].filter(Boolean).join(' · ') || undefined
}

/**
 * Organização/negócio da home. `tiposPadrao` é o tipo típico do layout (usado só
 * se o cliente não definiu `schemaTipo`). `extras` sobrescreve/acrescenta
 * propriedades específicas do layout.
 */
export function organizacaoSchema(site: Site, tiposPadrao: string[], extras: Record<string, any> = {}): Record<string, any> {
  const nap = site.nap ?? {}
  const horarios = horariosSchema(site)
  const area = areaServida(site)
  const logoUrl = urlAbsoluta(site, site.logo?.src)
  const redes: string[] = Array.isArray(site.redes) ? site.redes.map((r: any) => r?.href).filter(Boolean) : []
  const credencial = textoCredencial(site)
  return {
    '@type': tiposSchema(site, tiposPadrao),
    '@id': `${site.dominio}/#organization`,
    name: site.nome,
    url: site.dominio,
    telephone: nap.telefone || undefined,
    email: nap.email || undefined,
    slogan: site.slogan || undefined,
    description: site.descricao || undefined,
    foundingDate: site.anoFundacao ? String(site.anoFundacao) : undefined,
    priceRange: site.faixaPreco || undefined,
    knowsAbout: site.especialidade || undefined,
    logo: logoUrl,
    image: urlAbsoluta(site, site.ogImagem) ?? logoUrl,
    sameAs: redes.length ? redes : undefined,
    hasOfferCatalog: site.atendimentoOnline
      ? { '@type': 'OfferCatalog', name: 'Atendimento on-line disponível' }
      : undefined,
    hasCredential: credencial
      ? { '@type': 'EducationalOccupationalCredential', name: credencial }
      : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [nap.logradouro, nap.complemento].filter(Boolean).join(', ') || undefined,
      addressLocality: nap.cidade || undefined,
      addressRegion: nap.uf || undefined,
      postalCode: nap.cep || undefined,
      addressCountry: 'BR',
    },
    openingHoursSpecification: horarios.length ? horarios : undefined,
    areaServed: area.length ? area : undefined,
    ...extras,
  }
}
