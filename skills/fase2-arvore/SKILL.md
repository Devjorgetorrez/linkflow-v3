# fase2-arvore - Arvore de Silos via Sitemap (sub-skill da Fase 2)

Invocada por fase2-site como subagent. Responsabilidade unica: mapear a estrutura do site do concorrente lider.
Motor: WebFetch (sitemap) + crawl.py (fallback). SEM Playwright.

## Entrada
- Concorrente lider (do projeto.md, Fase 1)
- Money Pages ja mapeadas na Fase 1 (secao Paginas dos Concorrentes)

## ETAPA 1 - Descobrir e puxar o sitemap do lider
WebFetch nesta ordem ate achar:
1. https://[dominio]/sitemap_index.xml (WordPress/Yoast usa esse - indice de varios sitemaps)
2. https://[dominio]/sitemap.xml
3. https://[dominio]/page-sitemap.xml e /post-sitemap.xml (Yoast separa por tipo)
4. https://[dominio]/robots.txt -> procurar linha 'Sitemap:' que aponta o caminho real

Se sitemap_index: seguir os sub-sitemaps listados (page, post, product...) e puxar cada um.
Extrair todas as URLs + lastmod quando disponivel.

## ETAPA 2 - Fallback se nao houver sitemap
Se nenhum sitemap responder: rodar crawl.py via bash direto no dominio:
python [caminho-arquiteto-seo]/crawl.py https://[dominio] --max 150 --depth 4 --out paginas_[slug].json
Extrair as URLs do JSON gerado. NUNCA abandonar - o site esta no ar, o crawl pega.

## ETAPA 3 - Montar a arvore de silos
Organizar as URLs por profundidade e agrupamento:
- Nivel 0: home (/)
- Nivel 1: /slug/ (paginas de servico, regiao, institucional)
- Nivel 2: /silo/slug/ ou /blog/slug/
Identificar os SILOS (agrupamentos tematicos): servicos, regioes, blog, institucional.
Classificar cada URL: transacional (money page) / institucional / blog / tag-autor (ruido).

Detectar o PADRAO de arquitetura do lider:
- Plana (tudo em /slug/ nivel 1) - comum em WordPress local
- Silada (/servicos/slug/, /regioes/slug/)
- Hibrida
Esse padrao vira a recomendacao de arquitetura pro cliente.

## ETAPA 4 - Quality gate de localizacao (do seo-sitemap)
Contar paginas de LOCALIZACAO (cidade/regiao) na arvore do lider:
- 30+ paginas de localizacao = WARNING (avisar: exige 60%+ conteudo unico por pagina, risco doorway)
- 50+ paginas de localizacao = HARD STOP (avisar: Google penaliza doorway pages programaticas)
Isso orienta quantas paginas de regiao o cliente deve criar sem tomar penalidade.

## Saida (salvar na secao Raio-X Tecnico do projeto.md)
### Arvore de Silos (concorrente lider)
- Padrao detectado: [plana/silada/hibrida]
- Silos identificados: [lista]
- Profundidade maxima: [N]
- Total de URLs: [N] (transacionais: X | institucional: Y | blog: Z | ruido: W)
- Quality gate localizacao: [ok / warning N paginas / hard stop N paginas]

Arvore visual (indentada) com as URLs transacionais e institucionais principais.

## Degradacao
Sitemap ausente: crawl.py (Etapa 2)
Site bloqueia crawler: tentar o 2o concorrente real, avisar
robots.txt bloqueia sitemap: usar crawl.py direto
