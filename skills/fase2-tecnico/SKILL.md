# fase2-tecnico - Raio-X Tecnico + Garimpo de Gaps (sub-skill da Fase 2)

Invocada por fase2-site como subagent. Responsabilidade unica: SEO tecnico do concorrente lider + o que os outros 2 tem de superior.
Motor: WebFetch. SEM Playwright. Reusa framework do seo-technical.

## Entrada
- Concorrente lider + os outros 2 concorrentes reais (do projeto.md)
- Gaps competitivos ja identificados na Fase 1
- Arvore de silos (da fase2-arvore, ja no projeto.md)

## ETAPA 1 - Raio-X tecnico do lider (WebFetch home + 1 servico)
Analisar o HTML retornado:

**URL e estrutura**
- URLs limpas? (sem parametros, sem ?p=123, com slug legivel)
- Breadcrumbs presentes? (procurar BreadcrumbList ou markup visivel)
- Profundidade (ja veio da fase2-arvore)

**Renderizacao (CSR vs SSR)**
- O conteudo principal esta no HTML cru (SSR) ou depende de JS (CSR)?
- Sinal: se o <body> tem o texto/paginas no HTML retornado = SSR (bom pra SEO)
- Se o <body> vem quase vazio com <div id="root"> ou <div id="app"> = CSR (risco SEO)
- WordPress = quase sempre SSR (bom)
- Elementor é aceitável (B3): entrega HTML no servidor (não é CSR), não quebra indexação. Preferir temas leves (Kadence, Astra, GeneratePress) por performance, mas Elementor não é proibido. Evitar apenas excesso de widgets pesados que degradam Core Web Vitals. Não recomendar "nunca usar Elementor" de forma absoluta.

**Crawlabilidade**
- robots.txt: WebFetch em /robots.txt - bloqueia algo importante? aponta sitemap?
- Meta robots: noindex em paginas que deveriam indexar?
- Canonical: paginas tem canonical correto?

REGRA DE VERIFICAÇÃO DIRETA (não inferir): canonical, mobile viewport e IndexNow só podem ser marcados "ok/presente" se foram ENCONTRADOS no HTML retornado pelo WebFetch (procurar <link rel="canonical">, <meta name="viewport">, referência a indexnow). Se NÃO foram encontrados no HTML lido, marcar como "não verificado" — NUNCA inferir "provavelmente tem porque é WordPress/Yoast". Proibido marcar "✅ (Yoast gera automaticamente)" sem ter visto a tag no HTML.

**Snippets e recursos**
- Rich snippets possiveis? (schema ja veio da fase2-schema)
- IndexNow (Bing/Yandex)? procurar /indexnow ou key no HTML
- HTTPS ativo? (obrigatorio)
- Meta viewport (mobile)?

## ETAPA 2 - Garimpo dos outros 2 concorrentes (SO os gaps)
NAO fazer raio-X completo dos outros 2. Apenas:
- Pegar os gaps que a Fase 1 ja apontou (ex: casapaulo tem /molduras-campinas/ com 133 vis)
- WebFetch so nessas paginas-gap especificas
- Ver o que elas tem que o lider nao tem: schema? estrutura? tipo de conteudo?
- Registrar como oportunidade a incorporar no site do cliente

## ETAPA 3 - Consolidar achados tecnicos
Priorizar por impacto (Critical > High > Medium > Low), estilo seo-technical:
- Critical: o que quebra indexacao (noindex errado, CSR sem SSR, sem HTTPS)
- High: o que o lider faz e da vantagem (SSR, URL limpa, sitemap)
- Medium: melhorias (breadcrumbs, canonical)
- Low: extras (IndexNow)

Cada achado vira uma recomendacao pro site do cliente: 'faca assim como o lider' ou 'supere o lider fazendo X que ele nao faz'.

## Saida (salvar na secao Raio-X Tecnico do projeto.md)
### SEO Tecnico (concorrente lider)
- URL limpa: [sim/nao - detalhe]
- Renderizacao: [SSR/CSR]
- robots.txt: [ok / bloqueios]
- Canonical: [presente (tag vista no HTML) / ausente / não verificado — se não achou no HTML]
- HTTPS: [sim/nao]
- Mobile viewport: [presente (tag vista no HTML) / ausente / não verificado — se não achou no HTML]
- IndexNow: [presente (referência vista no HTML) / não detectado / não verificado — se não procurou]
- Snippets/rich results possiveis: [lista]

### Gaps dos outros concorrentes (oportunidades)
| Concorrente | URL-gap | O que tem de superior | Incorporar? |

### Recomendacoes tecnicas pro cliente (priorizadas)
PROFUNDIDADE PARA LEIGO (B4): cada recomendação deve incluir COMO fazer — onde clicar, qual plugin, como validar. Não deixar recomendação abstrata. Ex: para injetar schema → instalar WPCode > Code Snippets > Add Snippet > HTML > colar JSON-LD > "site wide header" > validar em search.google.com/test/rich-results.
| Prioridade | Recomendacao | Baseado em |

## Degradacao
Lider bloqueia WebFetch: usar dados da fase2-arvore (ja tem o sitemap) + 2o concorrente
robots.txt ausente: registrar 'sem robots.txt' (nao e erro fatal)