---
name: arquiteto-seo
description: >
  Arquiteto de SEO — engenharia reversa de arquitetura de site a partir da URL de um concorrente.
  A partir de UMA URL, faz crawl do site do concorrente, enriquece com dados de keyword/volume
  via Semrush e Ubersuggest, classifica cada página por intenção (transacional, comercial,
  informacional, navegacional), agrupa em clusters temáticos (topic clusters / pillar-cluster),
  e entrega um blueprint completo da árvore (site tree) que o usuário deve construir no próprio site.
  Use sempre que a tarefa envolver: analisar concorrente por URL, mapear arquitetura de site,
  desenhar hierarquia/silo de SEO, clusterizar palavras-chave, separar páginas transacionais de
  informacionais, planejar pillar pages e supporting content, ou montar a estrutura de URLs/menu
  de um site novo. Use mesmo que o usuário não diga "skill" — se a tarefa tocar em arquitetura de
  SEO, site tree, clusterização, silo, ou análise de concorrente por URL, esta skill se aplica.
  Comando: /arquiteto-seo <url-do-concorrente>
---

# Arquiteto de SEO — Blueprint de Arquitetura a partir de uma URL

## Missão

A partir de **uma URL de concorrente**, entregar um plano completo e aplicável de como o
usuário deve construir a hierarquia (árvore) do próprio site para competir em SEO.

O entregável é um **pacote completo**:
1. Planilha `.xlsx` — inventário de páginas + clusters + árvore + intenção
2. Documento estratégico `.md` — diagnóstico, lógica de silos, prioridades
3. Mapa visual da árvore (diagrama) — site tree pronta para visualizar

**Esta skill NÃO publica nada, não cria conteúdo dos artigos, não altera o site do usuário.**
Ela entrega apenas o **planejamento de arquitetura** — o quê construir, em que ordem,
com qual URL, sob qual pilar, com qual intenção.

**Regra absoluta:** só entregar o pacote após as 3 entregas estarem prontas e consistentes
entre si (mesma contagem de clusters, mesmas URLs, mesma intenção). Nunca entregar parcial.
Se travar (site bloqueou crawl, API sem cota) → não silenciar. Sinalizar no diagnóstico e
seguir com o que foi possível coletar, marcando claramente o que ficou faltando.

---

## Fontes de dados (nesta ordem de prioridade)

```
1. CRAWL do concorrente      → estrutura real: URLs, títulos, H1/H2, menu, breadcrumbs, internal links
2. Semrush (MCP)             → organic_research / keyword_research / overview_research
3. Ubersuggest (MCP)         → domain_keywords / keyword_suggestions / serp_analysis / domain_top_pages
4. web_search/web_fetch      → fallback quando crawl é bloqueado ou para validar SERP atual
```

> O crawl é a espinha dorsal. Semrush/Ubersuggest enriquecem com **volume, dificuldade (KD/SD),
> CPC e intenção** — sem isso a clusterização fica só semântica, sem priorização por oportunidade.

### Como chamar as APIs (tools deferidas)

Antes de usar qualquer tool de Semrush/Ubersuggest é **obrigatório** rodar `tool_search`
para carregar o schema correto dos parâmetros. Nunca adivinhar nomes de parâmetro.

```
tool_search(query="domain organic keywords")     → carrega Semrush:organic_research
tool_search(query="keyword volume difficulty")    → carrega Semrush:keyword_research / Ubersuggest:keyword_overview
tool_search(query="domain top pages traffic")      → carrega Ubersuggest:domain_top_pages
tool_search(query="serp analysis ranking")          → carrega Ubersuggest:serp_analysis
```

---

## Caminhos

```
SAÍDA            = /mnt/user-data/outputs/   (ou pasta de trabalho local, se rodando offline)
ARVORE_XLSX      = arquitetura_seo_<dominio>.xlsx
ESTRATEGIA_MD    = estrategia_seo_<dominio>.md
SCRIPTS          = ${CLAUDE_PLUGIN_ROOT}/skills/arquiteto-seo/scripts/crawl.py
                   ${CLAUDE_PLUGIN_ROOT}/skills/arquiteto-seo/scripts/clusterizar.py
```

> Ao rodar os scripts, sempre referencie-os por `${CLAUDE_PLUGIN_ROOT}/skills/arquiteto-seo/scripts/...`.
> Essa variável resolve para a pasta onde o plugin foi instalado, em qualquer máquina.

---

## Conceitos que regem TODA a análise

### Intenção de busca (classificação obrigatória de cada página)

| Sigla | Intenção | Sinais no conteúdo/URL | Onde fica na árvore |
|-------|----------|------------------------|---------------------|
| **T** | Transacional | "comprar", "preço", "contratar", "/produto", "/checkout", CTA forte, tabela de preço | Folhas comerciais perto da raiz (money pages) |
| **C** | Comercial | "melhor", "vs", "review", "comparativo", "top 10" | Ponte entre informacional e transacional |
| **I** | Informacional | "como", "o que é", "guia", "tutorial", "/blog" | Supporting content sob pilares |
| **N** | Navegacional | marca, "login", "contato", "sobre" | Topo / rodapé, fora do silo de ranqueamento |

> Regra: **a money page (T) nunca deve estar enterrada a 4+ cliques da home.**
> Conteúdo informacional (I) sustenta o pilar e linka para a money page correspondente.

### Modelo Pillar–Cluster (a base da árvore)

```
PILAR (pillar page) = página ampla sobre um tema-macro, alto volume, geralmente C ou T
   ├── Cluster content 1 (I) — subtópico específico, linka de volta ao pilar
   ├── Cluster content 2 (I)
   ├── Money page (T) — produto/serviço daquele tema
   └── Comparativo (C) — "melhor X", funil de meio
```

Cada cluster vira um **silo**: páginas do mesmo tema linkam fortemente entre si e ao pilar,
e o pilar linka à money page. A árvore do site = conjunto de silos pendurados na home.

### Profundidade (click depth) — regra de ouro

```
Nível 0: Home
Nível 1: Pilares + categorias transacionais principais  (máx ~7 itens no menu)
Nível 2: Money pages + sub-pilares
Nível 3: Supporting content (artigos do cluster)
Nível 4+: EVITAR para páginas de ranqueamento
```

---

## Fluxo de execução

### PASSO 1 — Validar a URL e preparar ambiente

```python
# Normalizar a URL, extrair domínio raiz
# Verificar se responde (status 200) antes de crawl pesado
```
Se a URL não responde → tentar `https://`, depois `www.`, depois sinalizar e parar.

### PASSO 2 — Crawl do concorrente (`scripts/crawl.py`)

Coletar, respeitando `robots.txt` e com rate limit (1 req/seg, máx ~150 páginas):
- Todas as URLs internas alcançáveis (BFS a partir da home, até profundidade 4)
- Por página: `title`, `h1`, `h2[]`, `meta description`, profundidade (cliques da home),
  links internos de entrada (quantos apontam para ela = sinal de importância interna),
  segmento de URL (`/blog/`, `/produtos/`, etc.)
- Menu principal e breadcrumbs (estrutura declarada pelo próprio concorrente)

Saída: `paginas.json` com um registro por URL.

> Se o site bloquear (403/429/JS-only): cair para `web_fetch` na home + sitemap.xml
> (`/sitemap.xml`, `/sitemap_index.xml`) para pelo menos extrair a lista de URLs.

### PASSO 3 — Enriquecer com dados de keyword

Para o domínio do concorrente:
```
Semrush:organic_research  → top keywords orgânicas + posição + volume + intenção
Ubersuggest:domain_top_pages → páginas que mais trazem tráfego (valida importância real)
Ubersuggest:domain_keywords  → keywords por página
```
Para cada cluster-semente identificado no crawl, puxar expansão:
```
Ubersuggest:keyword_suggestions / Semrush:keyword_research
  → related, questions, comparisons  (alimenta supporting content)
```
Anexar a cada página: `volume`, `kd_sd` (dificuldade), `cpc`, `intencao_api` quando existir.

> Cruzamento: a importância de uma página = combinação de (links internos de entrada do crawl)
> + (tráfego real do Ubersuggest top_pages) + (volume da keyword principal). Não confiar em um só sinal.

### PASSO 4 — Classificar intenção (`scripts/clusterizar.py`)

Para cada página aplicar a tabela de intenção (T/C/I/N) usando URL + title + h1 + keyword.
Quando a API trouxer intenção, ela tem prioridade sobre a heurística textual.

### PASSO 5 — Clusterizar

1. Agrupar páginas por similaridade temática (mesma raiz de keyword + co-ocorrência de termos
   no title/h1 + segmento de URL compartilhado).
2. Em cada cluster, eleger o **pilar**: a página de maior volume/importância e intenção C ou T.
3. Marcar **money page(s)** do cluster (intenção T) e **supporting content** (intenção I).
4. Nomear o cluster pelo tema dominante.

### PASSO 6 — Desenhar a árvore do MEU site

Reorganizar (não copiar) em uma hierarquia ideal:
```
Home
 ├─ [Pilar A]  (nível 1)
 │   ├─ Money page A1 (T, nível 2)
 │   ├─ Comparativo A (C, nível 2)
 │   └─ Artigos cluster A (I, nível 3)  →  todos linkam ao Pilar A e à Money A1
 ├─ [Pilar B]
 │   └─ ...
 └─ Páginas navegacionais (N) — rodapé
```
Atribuir a cada nó uma **URL sugerida** (slug limpo, raso, com a keyword), a **intenção**, a
**keyword principal + volume**, e a **prioridade** (ver Passo 7).

### PASSO 7 — Priorizar (quick wins primeiro)

```
prioridade = score de oportunidade
  ALTA   : volume alto + KD baixo + intenção T/C  (money page que rankeia rápido)
  MÉDIA  : volume médio, sustenta pilar, ou T com KD alto (precisa de cluster antes)
  BAIXA  : volume baixo, informacional de cauda longa (escala depois)
```
Ordenar o plano de construção: primeiro a home + pilares + money pages de prioridade ALTA,
depois supporting content que reforça esses pilares.

### PASSO 8 — Gerar o pacote (3 entregas)

1. **`arquitetura_seo_<dominio>.xlsx`** — abas:
   - `Inventario` — toda página do concorrente (URL, intenção, vol, KD, cluster, profundidade)
   - `Arvore_Meu_Site` — hierarquia sugerida (Nível, Pai, Página, URL sugerida, Intenção, KW, Vol, Prioridade)
   - `Clusters` — pilar + money pages + supporting de cada cluster
   - `Plano_Construcao` — ordem priorizada de criação
2. **`estrategia_seo_<dominio>.md`** — diagnóstico do concorrente, lógica dos silos,
   gaps de conteúdo (o que o concorrente NÃO cobre = sua oportunidade), recomendações de
   linkagem interna, e o passo a passo de aplicação.
3. **Mapa visual** — diagrama da árvore (via ferramenta de visualização, inline no chat).

---

## Formato do output no chat (sempre nesta ordem)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGNÓSTICO DO CONCORRENTE — <dominio>
Páginas rastreadas: N | Clusters identificados: N
Distribuição de intenção: T:n  C:n  I:n  N:n
Profundidade máxima encontrada: N cliques
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[mapa visual da árvore]

PRINCIPAIS GAPS (oportunidades onde o concorrente é fraco):
- ...

PLANO DE CONSTRUÇÃO PRIORIZADO (resumo):
1. ... (ALTA)
2. ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
Depois apresentar os arquivos com `present_files`.

---

## Regras invioláveis

- **R1** — Nunca copiar a árvore do concorrente 1:1. A entrega é uma arquitetura *melhorada*:
  mais rasa, com gaps preenchidos, silos mais limpos.
- **R2** — Toda página da árvore final tem obrigatoriamente: intenção (T/C/I/N), keyword
  principal e nível. Sem isso a linha é inválida.
- **R3** — Money pages (T) no máximo no nível 2. Se o cálculo jogar para nível 3+, sinalizar.
- **R4** — Respeitar robots.txt e rate limit. Nunca crawl agressivo.
- **R5** — Se Semrush/Ubersuggest não retornarem (sem cota/erro), continuar só com crawl +
  web_search e marcar no diagnóstico "dados de volume indisponíveis — priorização parcial".
- **R6** — Antes de usar tool de API, sempre `tool_search` para pegar o schema. Nunca adivinhar parâmetros.
- **R7** — Slugs sugeridos: minúsculos, com hífen, sem stopwords desnecessárias, com a keyword
  principal, rasos (`/pilar/money-page`, nunca `/categoria/sub/sub/sub/pagina`).
- **R8** — Entregar as 3 saídas ou explicar por que alguma faltou. Pacote incompleto = execução inválida.
