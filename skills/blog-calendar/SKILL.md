---
name: blog-calendar
description: >
  Gera o calendário editorial completo para projetos Link Flow. Clusters pillar-satellite
  com volume validado no Ubersuggest (domain_top_pages, keyword_metrics, keyword_suggestions),
  cada pauta vinculada a uma Money Page do projeto.md. Salva o calendário no projeto.md
  e aguarda aprovação humana. Invocado por /link-flow calendario <slug>. NÃO escreve artigos.
  Use quando o usuário digitar "link-flow calendario", "blog calendario", "calendario editorial",
  "planejar blog", "gerar pautas", "calendario de conteudo".
user-invokable: true
argument-hint: "<slug-do-cliente>"
---

# Blog Calendar — Planejador Editorial Link Flow

Gera o calendário editorial em clusters pilar-satélite, volume validado via Ubersuggest,
cada pauta amarrada a uma Money Page. **Não escreve artigos.**

## REGRAS RÍGIDAS — NUNCA VIOLAR
1. Nunca sugere pauta sem volume confirmado no Ubersuggest
2. Nunca inventa volume — se a API não retornar, descarta a KW
3. Mantém só informacionais e comerciais — descarta transacional, institucional, ferramenta
4. Pilar > 100/mês; satélite > 50/mês
5. Cada satélite linka de volta para o pilar do cluster
6. Cada artigo linka para a Money Page vinculada
7. Nunca satélite antes do pilar no calendário
8. Nunca intercala clusters diferentes — complete um cluster antes de iniciar o próximo

---

## PASSO 1 — Leitura do projeto ativo

### 1.1 Localizar o projeto.md

Se o usuário passou um slug como argumento: usar `projetos/<slug>/projeto.md`.
Se não passou: listar os diretórios em `projetos/`, exibir os slugs disponíveis e perguntar
"Qual cliente? Informe o slug ou o nome."

Ler `projetos/<slug>/projeto.md`. Extrair os campos abaixo. Se algum campo obrigatório
estiver ausente ou vazio, parar e avisar o que falta antes de continuar.

**Campos obrigatórios:**
- `## Concorrentes` — lista de domínios (ex: `planosdesaude.sorocaba.br`)
- `kw_principal` (no campo ICP)
- Cidade/região
- Nicho/segmento de negócio
- `## Money Pages` — tabela completa com colunas Slug + KW principal

**Campos opcionais (usar se presentes):**
- `location_id` (Ubersuggest) — se ausente, usar `1001763` (Brasil)
- `novamira_mcp` — para uso futuro pelo /blog publicar

### 1.2 Verificar calendário existente

Verificar se `## Calendário de Blog` existe no projeto.md E tem linhas com `| pendente |`:
- Se sim: "Ainda existem X pautas pendentes neste projeto. Quer continuar com o calendário
  existente ou gerar um novo do zero? (continuar / novo)"
  - `continuar` → encerrar este passo, não sobrescrever
  - `novo` → apagar a seção e continuar nos passos seguintes

---

## PASSO 2 — Extração das páginas dos concorrentes

Para cada domínio concorrente listado no projeto.md, chamar `domain_top_pages` (Ubersuggest):
```
domain: <domínio sem https://>
limit: 20
```

**Filtro de intenção — MANTER:**
Verificar se o slug OU o título da página contém ao menos um destes sinais:

Informacional: `como`, `o-que-e`, `o-que-é`, `quando`, `por-que`, `guia`, `dicas`,
`passo-a-passo`, `entenda`, `saiba`, `aprenda`, `tudo-sobre`, `diferenca`, `diferença`,
`tipos`, `beneficios`, `vantagens`, `desvantagens`, `cuidados`

Comercial: `melhor`, `melhores`, `comparacao`, `comparação`, `vale-a-pena`, `qual-escolher`,
`vs`, ` ou `, `alternativas`, `ranking`

**DESCARTAR obrigatoriamente:**
- Transacionais: slugs com "cotacao", "preco", "tabela", "contratar", "comprar", "solicitar",
  "simulador", "calculadora", "orcamento"
- Institucionais: "sobre-nos", "a-empresa", "equipe", "missao", "historia", "contato",
  "politica", "termos", "privacidade"
- Ferramentas standalone: "calculadora", "simulador", "comparador" (sem conteúdo informacional)
- Home e categorias puras (URL = `/` ou `/categoria/`)
- Páginas sem intenção clara identificável

Ordenar por tráfego decrescente. Manter até top 10 qualificadas por concorrente.

**Verificação de blog:**
Contar páginas qualificadas (informacional ou comercial, tráfego > 0) por concorrente.
- Se NENHUM concorrente tiver 3 ou mais páginas qualificadas →
  avisar: "Nenhum concorrente tem blog com tráfego relevante. Usando pesquisa de palavras-chave."
  → ir direto ao PASSO 4b
- Caso contrário: seguir para o PASSO 3

---

## PASSO 3 — Validação de volume real

Para cada página qualificada, extrair a KW provável do slug ou título.
Chamar `keyword_metrics` (Ubersuggest):
```
keywords: ["<kw extraída>"]
location_id: <location_id do projeto>
```

Classificar cada KW:
- Volume **> 100/mês** → candidata a **pilar**
- Volume **50–100/mês** → candidata a **satélite**
- Volume **< 50/mês** → **descartar**
- API não retornou volume → tratar como 0 → **descartar**

Montar duas listas internas:
- `candidatas_pilar[]` — KWs > 100/mês
- `candidatas_satelite[]` — KWs 50–100/mês

---

## ALGORITMO DE VINCULAÇÃO DE MONEY PAGE

Usado por Passos 4a, 4b e 5 para escolher a Money Page que cada artigo vai fortalecer.
Aplicar sempre nesta ordem de prioridade — parar na primeira regra que produzir um match.

### Regra 1 — Match temático (mais alta prioridade)

Extrair os termos relevantes da KW do artigo (segmento, operadora, produto, público).
Comparar com a KW principal de cada Money Page do `## Money Pages` do projeto.md.

Uma Money Page "bate" quando compartilha ao menos um termo relevante com o artigo:
- Segmento: "empresarial", "mei", "aposentado", "individual", "familiar", "adesao", "odontologico"
- Operadora: "unimed", "amil", "bradesco", "sulamerica", "intermedica", "blue", "dona saude", "fenix"
- Produto/ferramenta: "cotacao", "tabela", "convenio"

Quando houver match, usar o slug da Money Page mais específica que bateu.
Exemplo: artigo "como funciona plano de saude para mei" → match em "mei" → `/plano-de-saude-mei-sorocaba/`
Exemplo: artigo "plano amil vale a pena" → match em "amil" → `/plano-amil-sorocaba/`

Se mais de uma Money Page bater, usar a mais específica (maior sobreposição de termos).

### Regra 2 — Intenção de decisão/comparação/conversão

Aplicar quando a KW do artigo contiver sinais de decisão:
"como escolher", "vale a pena", "melhor", "comparacao", "qual", "diferenca entre", "x ou y"

→ Verificar se existe no projeto.md uma Money Page de cotação ou conversão de lead
  (slug contém "cotacao", "orcamento", "simulacao" ou KW contém "cotação").
  Se existir: usar essa página.
  Se não existir: aplicar Regra 1 com o tema mais próximo.

### Regra 3 — Fallback (menor prioridade)

Usar homepage `/` SOMENTE quando nenhuma das regras anteriores produzir match.
Isso deve ser raro — artigos genéricos sobre o nicho sem segmento nem operadora específicos.

Ao usar a homepage como fallback, registrar internamente:
`money_page_vinculada: "/" (fallback — sem match temático)`

Na seção 6.5 (apresentação ao usuário), listar separadamente os artigos que caíram no fallback
para revisão manual: "Atenção: X artigos vinculados à homepage por ausência de match — revise."

---

## PASSO 4a — Identificação dos pilares (modo normal)

De `candidatas_pilar[]`, selecionar 3 a 5 que atendam TODOS os critérios:

**Critério 1 — Sem canibalização de Money Page:**
A KW do pilar não pode ser idêntica nem muito similar (mesmo tema + intenção) a nenhuma
KW de Money Page listada em `## Money Pages` do projeto.md.
Regra prática: se a Money Page já captura a intenção de conversão do tema, o pilar não pode
existir (ex: "plano de saude empresarial" é Money Page → não pode ser pilar de blog).

**Critério 2 — Intenção informacional ou comercial pura:**
Nunca uma KW transacional pura como pilar.

**Critério 3 — Diversidade temática:**
Não selecionar dois pilares sobre o mesmo subtema.
Ex: "como escolher plano de saude" e "guia plano de saude" são redundantes → manter só o maior volume.

Para cada pilar selecionado, registrar internamente:
```
titulo_sugerido: "[título do artigo em português]"
kw: "[kw principal]"
volume: [X]
money_page_vinculada: "[aplicar ALGORITMO DE VINCULAÇÃO DE MONEY PAGE acima]"
intencao: "[informacional | comercial]"
```

---

## PASSO 4b — Modo alternativo (sem blog de concorrente)

Chamar `keyword_suggestions (Ubersuggest)`:
```
keyword: <kw_principal do projeto.md>
location_id: <location_id>
limit: 30
```

Filtrar as sugestões:
- Intenção informacional ou comercial (pelos sinais do Passo 2)
- Volume > 100/mês (confirmar via `keyword_metrics` se necessário)
- Selecionar 3 a 5 de maior volume E menor dificuldade
- Aplicar os mesmos critérios anti-canibalização e diversidade do Passo 4a

---

## PASSO 5 — Derivação dos satélites

Para cada pilar selecionado, montar o cluster com 3 a 6 satélites combinando duas fontes:

### Fonte 1 — Páginas dos concorrentes (das listas já extraídas)

Verificar em `candidatas_satelite[]` (e também em `candidatas_pilar[]` não selecionados
como pilares) se há páginas com tema relacionado ao pilar:
- Intenção complementar — aprofunda um subtópico do pilar, não replica
- Volume > 50/mês já confirmado no Passo 3

### Fonte 2 — Ubersuggest keyword_suggestions

Chamar `keyword_suggestions (Ubersuggest)`:
```
keyword: "<KW do pilar>"
location_id: <location_id>
limit: 30
```

Para cada sugestão retornada, verificar:
1. Volume > 50/mês — se não tiver, chamar `keyword_metrics` para confirmar; se <50, descartar
2. NÃO é KW de Money Page existente (verificar em `## Money Pages` do projeto.md)
3. NÃO é KW de outro pilar já selecionado
4. Intenção é informacional ou comercial (sinais do Passo 2)
5. Ângulo distinto do pilar e dos outros satélites do mesmo cluster

**Para cada satélite aprovado, registrar:**
```
titulo_sugerido: "[título do artigo]"
kw: "[kw principal]"
volume: [X]
angulo: "[subtópico | dúvida frequente | comparação | caso de uso | gap do concorrente]"
pilar_pai: "[título do pilar]"
money_page_vinculada: "[aplicar ALGORITMO DE VINCULAÇÃO DE MONEY PAGE — pode ser diferente do pilar pai]"
```

Nota: o satélite pode vincular a uma Money Page diferente do seu pilar se o tema do satélite
for mais próximo de outra Money Page. Exemplo: pilar "guia de planos de saude" pode ter
satélite "plano amil vale a pena" → satélite vincula a `/plano-amil-sorocaba/`, não ao pilar.

Mínimo 3, máximo 6 satélites por pilar. Se não houver volume suficiente para 3, registrar
quantos passaram e avisar que o cluster ficou menor que o mínimo.

---

## PASSO 6 — Montagem e salvamento do calendário

### 6.1 — Ordenação obrigatória

Montar a lista final na ordem:
```
Pilar 1 → Satélite 1.1 → Satélite 1.2 → Satélite 1.3 → [... até 6] →
Pilar 2 → Satélite 2.1 → Satélite 2.2 → [...]
```

Regras invioláveis:
- Nunca um satélite antes do pilar do seu cluster
- Nunca intercalar clusters (finalizar cluster 1 inteiro antes de iniciar cluster 2)

### 6.1b — Cadência editorial (perguntar antes de calcular)

Antes de calcular a cobertura, perguntar ao usuário:
"Qual a cadência de publicação desejada?
  (2) 2 artigos por semana — padrão recomendado
  (3) 3 artigos por semana — ritmo acelerado"

Aguardar resposta:
- `2` ou resposta em branco → `cadencia_semanal = 2`
- `3` → `cadencia_semanal = 3`
- Outro valor → usar 2 e avisar: "Cadência ajustada para 2/semana (valor suportado: 2 ou 3)."

### 6.2 — Cálculo da cobertura

```
total_artigos = numero_de_pilares + numero_total_de_satelites
semanas = ceil(total_artigos / cadencia_semanal)   ← cadência definida em 6.1b (padrão: 2)
```

### 6.3 — Formato da tabela

Gerar a seção a ser salva no projeto.md:

```markdown
## Calendário de Blog
Status: aguardando aprovação
Cadência: [cadencia_semanal] por semana
Total: X artigos | Y semanas

| Tipo | Título | KW | Volume | Cluster | Money Page | Status |
|------|--------|----|--------|---------|------------|--------|
| Pilar | [título] | [kw] | [X]/mês | — | [/slug-mp/] | pendente |
| Satélite | [título] | [kw] | [X]/mês | [título do pilar] | [/slug-mp/] | pendente |
| Satélite | [título] | [kw] | [X]/mês | [título do pilar] | [/slug-mp/] | pendente |
```

Regras de preenchimento das colunas:
- **Tipo**: `Pilar` ou `Satélite` (com maiúscula, sem acento em Satelite)
- **Título**: título sugerido em português, natural, com a KW incluída
- **KW**: KW principal exatamente como foi validada no Ubersuggest
- **Volume**: número retornado pela API, formato `X/mês`, sem arredondamento
- **Cluster**: para Pilar = `—`; para Satélite = título curto do pilar pai (até 40 chars)
- **Money Page**: slug completo com barras (ex: `/plano-de-saude-empresarial-sorocaba/`)
- **Status**: sempre `pendente` ao criar

### 6.4 — Salvar no projeto.md

1. Ler `projetos/<slug>/projeto.md`
2. Localizar a seção `## Artigos / Clusters` (se existir) OU `## Calendário de Blog`
3. Substituir essa seção inteira pelo novo conteúdo gerado em 6.3
4. Se nenhuma das seções existir, inserir antes de `## Sitemap do cliente` ou ao final do arquivo

### 6.5 — Apresentação ao usuário

Após salvar, exibir:

```
Calendário salvo em projetos/<slug>/projeto.md

X artigos em Y clusters — cobertura de Z semanas a 2 publicações por semana.

[exibir a tabela completa aqui]

Ângulos mapeados:
[para cada pilar, listar em 1 linha: "Pilar N — [kw] ([X]/mês) + N satélites"]

Calendário salvo com status "aguardando aprovação".
Quando quiser aprovar e iniciar a produção, use /link-flow publicar <slug>.
```

---

## DEGRADAÇÃO CONTROLADA

| Situação | Ação |
|---|---|
| `projeto.md` não encontrado | Listar projetos disponíveis e pedir slug |
| Campo `## Concorrentes` vazio | Perguntar os domínios antes de continuar |
| `## Money Pages` vazia ou ausente | Avisar que sem Money Pages não há como vincular pautas; parar |
| Ubersuggest não retorna dados de um concorrente | Registrar "sem dados" para esse domínio e seguir com os outros |
| Pilar passa no volume mas canibaliza Money Page | Descartar silenciosamente e prosseguir |
| Cluster com menos de 3 satélites após filtragem | Salvar os que passaram + avisar: "Cluster [X]: apenas N satélites com volume suficiente" |
| Nenhuma KW passa nos thresholds | Avisar: "Nenhuma KW com volume suficiente encontrada. Verifique os concorrentes ou amplie a KW seed." |
