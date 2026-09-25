import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const servicos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicos' }),
  schema: z.object({
    titulo:          z.string().min(3).max(70),
    metaDescription: z.string().min(80).max(165),
    icone:           z.string().optional(),
    imagem:          z.string().optional(),
    imagemAlt:       z.string().optional(),
    ordem:           z.number().default(99),
    destaque:        z.boolean().default(false),
    categoria:       z.string().optional(),
    noindex:         z.boolean().default(false).optional(),
  }),
})

const equipe = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/equipe' }),
  schema: z.object({
    nome:            z.string().min(3).max(70),
    cargo:           z.string(),
    crm:             z.string().optional(),
    especialidade:   z.string().optional(),
    foto:            z.string().optional(),
    ordem:           z.number().default(99),
  }),
})

const depoimentos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/depoimentos' }),
  schema: z.object({
    nome:    z.string(),
    cidade:  z.string(),
    servico: z.string(),
    nota:    z.number().min(1).max(5).default(5),
    ordem:   z.number().default(99),
  }),
})

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    titulo:          z.string().min(3).max(70),
    metaDescription: z.string().max(165).default(''),
    // Texto ou data do YAML: `publicadoEm: 2026-09-25` sem aspas o parser lê
    // como Date, e antes isso derrubava o build do site inteiro. Normaliza
    // sempre para o texto AAAA-MM-DD que o resto do tema espera.
    publicadoEm:     z.union([z.string(), z.date()])
                      .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)),
    status:          z.string().optional(),   // publicado | pronto | rascunho | revisao | agendado | lixeira — ver lib/publicacao.ts
    categoria:       z.string().optional(),
    imagemCapa:      z.string().optional(),
    imagemCapaAlt:   z.string().optional(),
    autor:           z.string().optional(),
    autorFoto:       z.string().optional(),
    destaque:        z.boolean().default(false),
  }).superRefine((d, ctx) => {
    // O mínimo de 80 caracteres da metaDescription só vale para o que vai
    // ao ar. Rascunho criado pelo painel nasce sem ela e não pode quebrar o
    // build do site. Mesma lista de status de lib/publicacao.ts, repetida
    // aqui porque o promover_tema.py recria este arquivo sem imports extras.
    const foraDoAr = ['rascunho', 'revisao', 'revisão', 'agendado', 'lixeira']
      .includes(String(d.status ?? '').trim().toLowerCase())
    if (!foraDoAr && d.metaDescription.length < 80) {
      ctx.addIssue({
        code: 'custom',
        path: ['metaDescription'],
        message: 'metaDescription precisa ter de 80 a 165 caracteres para publicar',
      })
    }
  }),
})

/* ─────────────────────────────────────────────────────────────────────────
   Tema 03 — Vértice Institucional (serviço profissional)
   Coleções próprias, base separada. Não afetam as coleções do Tema 01.
   ───────────────────────────────────────────────────────────────────────── */

const servicosT3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-03/servicos' }),
  schema: z.object({
    titulo:          z.string().min(3).max(70),
    metaDescription: z.string().min(80).max(165),
    resumo:          z.string(),
    icone:           z.string().optional(),
    imagem:          z.string().optional(),
    imagemAlt:       z.string().optional(),
    ordem:           z.number().default(99),
    categoria:       z.string().optional(),
    paraQuem:        z.string().optional(),
    entregas:        z.array(z.string()).default([]),
    noindex:         z.boolean().default(false).optional(),
  }),
})

const equipeT3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-03/equipe' }),
  schema: z.object({
    nome:            z.string().min(3).max(70),
    cargo:           z.string(),
    registro:        z.string().optional(),
    especialidade:   z.string().optional(),
    foto:            z.string().optional(),
    ordem:           z.number().default(99),
  }),
})

const depoimentosT3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-03/depoimentos' }),
  schema: z.object({
    nome:    z.string(),
    cidade:  z.string(),
    servico: z.string(),
    ordem:   z.number().default(99),
  }),
})

const postsT3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-03/posts' }),
  schema: z.object({
    titulo:          z.string().min(3).max(70),
    metaDescription: z.string().max(165).default(''),
    // Texto ou data do YAML: `publicadoEm: 2026-09-25` sem aspas o parser lê
    // como Date, e antes isso derrubava o build do site inteiro. Normaliza
    // sempre para o texto AAAA-MM-DD que o resto do tema espera.
    publicadoEm:     z.union([z.string(), z.date()])
                      .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)),
    status:          z.string().optional(),   // publicado | pronto | rascunho | revisao | agendado | lixeira — ver lib/publicacao.ts
    categoria:       z.string().optional(),
    imagemCapa:      z.string().optional(),
    imagemCapaAlt:   z.string().optional(),
    /* Assinatura completa — item C da composição */
    autor:           z.string().optional(),
    autorFoto:       z.string().optional(),
    autorCargo:      z.string().optional(),
    autorBio:        z.string().optional(),
    autorLinkedin:   z.string().optional(),
    autorEmail:      z.string().optional(),
  }).superRefine((d, ctx) => {
    // O mínimo de 80 caracteres da metaDescription só vale para o que vai
    // ao ar. Rascunho criado pelo painel nasce sem ela e não pode quebrar o
    // build do site. Mesma lista de status de lib/publicacao.ts, repetida
    // aqui porque o promover_tema.py recria este arquivo sem imports extras.
    const foraDoAr = ['rascunho', 'revisao', 'revisão', 'agendado', 'lixeira']
      .includes(String(d.status ?? '').trim().toLowerCase())
    if (!foraDoAr && d.metaDescription.length < 80) {
      ctx.addIssue({
        code: 'custom',
        path: ['metaDescription'],
        message: 'metaDescription precisa ter de 80 a 165 caracteres para publicar',
      })
    }
  }),
})

/* ─────────────────────────────────────────────────────────────────────────
   Tema 04 — Renovar Serviço Local
   Serviço ganha campos do nicho: preço a partir de, prazo e o que remove.
   ───────────────────────────────────────────────────────────────────────── */

const servicosT4 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-04/servicos' }),
  schema: z.object({
    titulo:          z.string().min(3).max(70),
    metaDescription: z.string().min(80).max(165),
    resumo:          z.string(),
    icone:           z.string().optional(),
    imagem:          z.string().optional(),
    imagemAlt:       z.string().optional(),
    ordem:           z.number().default(99),
    categoria:       z.string().optional(),
    precoDe:         z.string().optional(),
    prazo:           z.string().optional(),
    duracao:         z.string().optional(),
    remove:          z.array(z.string()).default([]),
    entregas:        z.array(z.string()).default([]),
    noindex:         z.boolean().default(false).optional(),
  }),
})

const equipeT4 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-04/equipe' }),
  schema: z.object({
    nome:          z.string().min(3).max(70),
    cargo:         z.string(),
    registro:      z.string().optional(),
    especialidade: z.string().optional(),
    foto:          z.string().optional(),
    ordem:         z.number().default(99),
  }),
})

const depoimentosT4 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-04/depoimentos' }),
  schema: z.object({
    nome:    z.string(),
    cidade:  z.string(),
    servico: z.string(),
    ordem:   z.number().default(99),
  }),
})

const postsT4 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-04/posts' }),
  schema: z.object({
    titulo:          z.string().min(3).max(70),
    metaDescription: z.string().max(165).default(''),
    // Texto ou data do YAML: `publicadoEm: 2026-09-25` sem aspas o parser lê
    // como Date, e antes isso derrubava o build do site inteiro. Normaliza
    // sempre para o texto AAAA-MM-DD que o resto do tema espera.
    publicadoEm:     z.union([z.string(), z.date()])
                      .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)),
    status:          z.string().optional(),   // publicado | pronto | rascunho | revisao | agendado | lixeira — ver lib/publicacao.ts
    categoria:       z.string().optional(),
    imagemCapa:      z.string().optional(),
    imagemCapaAlt:   z.string().optional(),
    autor:           z.string().optional(),
    autorFoto:       z.string().optional(),
    autorCargo:      z.string().optional(),
    autorBio:        z.string().optional(),
    autorInstagram:  z.string().optional(),
    autorEmail:      z.string().optional(),
  }).superRefine((d, ctx) => {
    // O mínimo de 80 caracteres da metaDescription só vale para o que vai
    // ao ar. Rascunho criado pelo painel nasce sem ela e não pode quebrar o
    // build do site. Mesma lista de status de lib/publicacao.ts, repetida
    // aqui porque o promover_tema.py recria este arquivo sem imports extras.
    const foraDoAr = ['rascunho', 'revisao', 'revisão', 'agendado', 'lixeira']
      .includes(String(d.status ?? '').trim().toLowerCase())
    if (!foraDoAr && d.metaDescription.length < 80) {
      ctx.addIssue({
        code: 'custom',
        path: ['metaDescription'],
        message: 'metaDescription precisa ter de 80 a 165 caracteres para publicar',
      })
    }
  }),
})

const categorias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categorias' }),
  // Arquivo de categoria do blog — página /<slug> (raiz, junto com serviços
  // e artigos) e selo de categoria no artigo. O post referencia a categoria
  // pelo slug (nome do arquivo) em `categoria:`.
  // Gravado pelo painel (categorias.json -> lib/sync-categorias.ts) ou pelo agente.
  schema: z.object({
    nome:            z.string().min(2),
    descricao:       z.string().default(''),
    seoTitle:        z.string().optional(),
    metaDescription: z.string().default(''),
    imagem:          z.string().optional(),
    ordem:           z.number().default(99),
    gerenciadoPor:   z.string().optional(),
  }),
})

const autores = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/autores' }),
  // Perfil público de autor — página /autor/<slug> e assinatura dos artigos.
  // O post referencia o autor pelo slug (nome do arquivo) em `autor:`.
  // Gravado pelo painel (usuarios.json -> lib/sync-autores.ts) ou pelo agente.
  schema: z.object({
    nome:           z.string().min(2),
    cargo:          z.string().default(''),
    foto:           z.string().optional(),
    fotoAlt:        z.string().optional(),
    bioCurta:       z.string().default(''),
    bioLonga:       z.string().default(''),
    conselho:       z.string().default(''),
    registro:       z.string().default(''),
    especialidades: z.array(z.string()).default([]),
    formacao:       z.array(z.string()).default([]),
    naMidia:        z.array(z.string()).default([]),
    email:          z.string().optional(),
    redes: z.object({
      linkedin:  z.string().optional(),
      instagram: z.string().optional(),
      facebook:  z.string().optional(),
      x:         z.string().optional(),
      youtube:   z.string().optional(),
      tiktok:    z.string().optional(),
      site:      z.string().optional(),
      lattes:    z.string().optional(),
    }).default({}),
    ativo:          z.boolean().default(true),
    gerenciadoPor:  z.string().optional(),
  }),
})

const categoriasT3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-03/categorias' }),
  // Arquivo de categoria do blog — página /<slug> (raiz) e selo no artigo.
  // O post referencia a categoria pelo slug em `categoria:`.
  // Gravado pelo painel (categorias.json -> lib/sync-categorias.ts) ou pelo agente.
  schema: z.object({
    nome:            z.string().min(2),
    descricao:       z.string().default(''),
    seoTitle:        z.string().optional(),
    metaDescription: z.string().default(''),
    imagem:          z.string().optional(),
    ordem:           z.number().default(99),
    gerenciadoPor:   z.string().optional(),
  }),
})

const autoresT3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-03/autores' }),
  // Perfil público de autor — página /autor/<slug> e assinatura dos artigos.
  // O post referencia o autor pelo slug (nome do arquivo) em `autor:`.
  // Gravado pelo painel (usuarios.json -> lib/sync-autores.ts) ou pelo agente.
  schema: z.object({
    nome:           z.string().min(2),
    cargo:          z.string().default(''),
    foto:           z.string().optional(),
    fotoAlt:        z.string().optional(),
    bioCurta:       z.string().default(''),
    bioLonga:       z.string().default(''),
    conselho:       z.string().default(''),
    registro:       z.string().default(''),
    especialidades: z.array(z.string()).default([]),
    formacao:       z.array(z.string()).default([]),
    naMidia:        z.array(z.string()).default([]),
    email:          z.string().optional(),
    redes: z.object({
      linkedin:  z.string().optional(),
      instagram: z.string().optional(),
      facebook:  z.string().optional(),
      x:         z.string().optional(),
      youtube:   z.string().optional(),
      tiktok:    z.string().optional(),
      site:      z.string().optional(),
      lattes:    z.string().optional(),
    }).default({}),
    ativo:          z.boolean().default(true),
    gerenciadoPor:  z.string().optional(),
  }),
})

const categoriasT4 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-04/categorias' }),
  // Arquivo de categoria do blog — página /<slug> (raiz) e selo no artigo.
  // O post referencia a categoria pelo slug em `categoria:`.
  // Gravado pelo painel (categorias.json -> lib/sync-categorias.ts) ou pelo agente.
  schema: z.object({
    nome:            z.string().min(2),
    descricao:       z.string().default(''),
    seoTitle:        z.string().optional(),
    metaDescription: z.string().default(''),
    imagem:          z.string().optional(),
    ordem:           z.number().default(99),
    gerenciadoPor:   z.string().optional(),
  }),
})

const autoresT4 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tema-04/autores' }),
  // Perfil público de autor — página /autor/<slug> e assinatura dos artigos.
  // O post referencia o autor pelo slug (nome do arquivo) em `autor:`.
  // Gravado pelo painel (usuarios.json -> lib/sync-autores.ts) ou pelo agente.
  schema: z.object({
    nome:           z.string().min(2),
    cargo:          z.string().default(''),
    foto:           z.string().optional(),
    fotoAlt:        z.string().optional(),
    bioCurta:       z.string().default(''),
    bioLonga:       z.string().default(''),
    conselho:       z.string().default(''),
    registro:       z.string().default(''),
    especialidades: z.array(z.string()).default([]),
    formacao:       z.array(z.string()).default([]),
    naMidia:        z.array(z.string()).default([]),
    email:          z.string().optional(),
    redes: z.object({
      linkedin:  z.string().optional(),
      instagram: z.string().optional(),
      facebook:  z.string().optional(),
      x:         z.string().optional(),
      youtube:   z.string().optional(),
      tiktok:    z.string().optional(),
      site:      z.string().optional(),
      lattes:    z.string().optional(),
    }).default({}),
    ativo:          z.boolean().default(true),
    gerenciadoPor:  z.string().optional(),
  }),
})

export const collections = {
  servicos, equipe, depoimentos, posts, autores, categorias,
  servicosT3, equipeT3, depoimentosT3, postsT3, autoresT3, categoriasT3,
  servicosT4, equipeT4, depoimentosT4, postsT4, autoresT4, categoriasT4,
}
