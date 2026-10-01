# fase2-schema - Raio-X de Schema + Plano Yoast/WPCode (sub-skill da Fase 2)

Invocada por fase2-site como subagent. Responsabilidade unica: schema.
Motor: WebFetch (o ambiente NAO tem render_page.py/Playwright).
Reuso: skills/local-schema (junction) para o template LocalBusiness.

## Entrada
- Concorrente lider (do projeto.md, Fase 1)
- NAP do cliente (do projeto.md: nome, endereco, telefone, cidade)
- Tipo de negocio (para escolher o @type correto do schema)

## REGRA ANTI-INVENÇÃO (obrigatória — nunca violar)
Todo campo do schema só é preenchido com dado de ORIGEM REAL (veio do projeto.md, informado pelo cliente, ou extraído do site via WebFetch). Dado que o cliente NÃO forneceu é PROIBIDO inventar.
- telephone, url/domínio, openingHours (horário), geo (lat/long), email, streetAddress, postalCode: se NÃO estão no projeto.md com origem real → OMITIR o campo do JSON-LD (não usar string vazia, não inventar).
- Para cada campo omitido, registrar em uma lista "⚠️ PREENCHER ANTES DE PUBLICAR" ao fim do bloco de schema, dizendo qual campo falta e de onde virá (ex: telefone → cliente; domínio → após registrar; geo → após definir endereço, via geocoding real).
- NUNCA usar coordenadas "da cidade" tiradas de conhecimento próprio. geo só entra com lat/long de origem verificável.
- Se o cliente não tem domínio ainda, usar [DOMINIO] como placeholder VISÍVEL no texto/exemplos, mas OMITIR o campo url do JSON-LD final (ou deixar claro que é exemplo não-publicável).

## ETAPA 1 - Detectar schema do concorrente lider
WebFetch nas paginas-tipo do lider: home, 1 pagina de servico, 1 de regiao (se houver).
No HTML retornado, procurar blocos JSON-LD (<script type="application/ld+json">).
Extrair e registrar por pagina:
- Quais @type aparecem (LocalBusiness, Service, BreadcrumbList, FAQPage, Organization, WebPage...)
- Se usa schema UNICO ou MULTIPLOS combinados (ex: LocalBusiness + Service + Breadcrumb no mesmo @graph)
- Propriedades presentes (address, geo, openingHours, telephone, areaServed, aggregateRating)

Se o HTML nao tiver JSON-LD no raw: registrar 'schema client-side ou ausente' (WebFetch ja traz renderizado na maioria dos WP; se vazio, provavelmente nao tem).

## ETAPA 2 - Regras de schema 2026 (do seo-schema)
Ao recomendar, respeitar:
- @context sempre "https://schema.org" (https, nao http)
- FAQPage: perdeu rich result no Google (mai/2026), MAS mantem valor para IA/GEO (ChatGPT/Gemini citam). Recomendar SE o foco e GEO.
- HowTo, SpecialAnnouncement: DEPRECADOS - nunca recomendar
- URLs absolutas, datas ISO 8601
- Preferir @type especifico (Dentist, Plumber, LegalService) em vez de LocalBusiness generico

## ETAPA 3 - Gerar schema do cliente (via local-schema)
Invocar a skill local-schema (junction em skills/local-schema) para o template LocalBusiness.
LOCALIZAR para BR (o template original e US):
- addressCountry: "BR" (nao US)
- telephone: formato +55
- addressRegion: estado BR (ex: SP)
- @type: o tipo especifico do negocio (Dentist, Plumber, HairSalon, LegalService, etc.)
- Preencher com o NAP real do projeto.md
- geo: SÓ incluir se houver lat/long de origem real (endereço do cliente via geocoding). Caso contrário, OMITIR e registrar em PREENCHER ANTES DE PUBLICAR.
Gerar 1 JSON-LD por tipo de Money Page (home = LocalBusiness completo; servico = LocalBusiness + Service).
EXCEÇÃO — Página de cotação/tabela de preços/comparação: NÃO usar @type Service. Essas páginas descrevem informação, não um serviço prestado. Usar @type WebPage (ou omitir schema de serviço). Exemplos: /tabela-de-precos/, /cotacao-online/, /comparativo-planos/ → WebPage, não Service.
EXEMPLO OBRIGATÓRIO (B5): sempre fornecer ao menos 1 JSON-LD COMPLETO e preenchido (home + 1 Money Page), não só template com [placeholders]. O exemplo usa os dados reais do projeto.md; campos ausentes ficam como [CAMPO] visível na lista PREENCHER ANTES DE PUBLICAR. O cliente precisa ver como fica preenchido — não só o molde vazio.

## ETAPA 4 - Plano de acao Yoast (padrao)
Traduzir em instrucoes praticas para o cliente leigo.
SEO on-page = Yoast (padrao instalado). NUNCA pedir ao cliente para instalar Rank Math.
Yoast free NAO gera LocalBusiness nem Service — injetar esses dois via WPCode (gratuito).
Organization, WebPage, BreadcrumbList e WebSite o Yoast ja gera sozinho.

PASSO A PASSO — YOAST (padrao para todos os clientes):
1. Configurar: Yoast SEO > Configuracoes > Site Info > corrigir nome do site e URL
2. Breadcrumbs: Yoast SEO > Appearance > Breadcrumbs > Enable > salvar
3. Focus keyword e meta description: editar pagina > Yoast (barra lateral) > preencher campos
4. LocalBusiness + Service (NAO gerados pelo Yoast free) — injetar via WPCode:
   WordPress > Plugins > Adicionar > buscar "WPCode" > Instalar > Ativar
   WPCode > Code Snippets > Add Snippet > HTML > colar JSON-LD da Etapa 3 > "Run Everywhere - Site Wide Header" > Ativar
   (usar um snippet por tipo: 1 para LocalBusiness na home, 1 por Money Page de servico)
5. aggregateRating (numero real de avaliacoes): mesmo fluxo WPCode acima
6. Validar: search.google.com/test/rich-results — colar URL da pagina e confirmar schema detectado

O QUE O YOAST FREE JA GERA (nao precisa fazer nada):
Organization, WebPage, BreadcrumbList, WebSite

O QUE PRECISA DO WPCODE (Yoast free nao gera):
LocalBusiness, Service — injetar JSON-LD via WPCode
aggregateRating com numero real de avaliacoes do cliente

Formato: passo a passo em linguagem de leigo (B4). Cada recomendação técnica DEVE incluir COMO fazer: onde clicar, qual plugin, como validar. Validação de schema: search.google.com/test/rich-results.

## Saida (salvar na secao Raio-X Tecnico do projeto.md)
### Schema por tipo de pagina (concorrente lider)
| Tipo de pagina | Schemas detectados | Combinados? | Acao no Yoast/WPCode |

E os JSON-LD gerados para o cliente (por tipo de Money Page), prontos para injetar.

## Degradacao
WebFetch bloqueado no lider: tentar o 2o concorrente real
Sem JSON-LD em nenhum: registrar 'nicho nao usa schema estruturado - oportunidade' e gerar o do cliente do zero via local-schema