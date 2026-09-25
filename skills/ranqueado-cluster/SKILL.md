---
name: ranqueado-cluster
description: >
  Pré-planejamento estratégico do claude-ranqueado. Roda DEPOIS que o artigo
  pillar já foi escrito — usa o conteúdo real do pillar como base para derivar
  os satélites (produtos avaliados, subtópicos abertos, ângulos comerciais
  cobertos), agrupa por intenção, monta o mapa de links internos e salva o
  plano no projeto.md. Dois sub-comandos: plan --from-pillar (monta o plano a
  partir do pillar pronto) e execute (escreve os satélites com contexto de
  cluster injetado). Use quando o usuário disser "cluster", "topical authority",
  "arquitetura de conteúdo", "artigos de apoio", "/ranqueado cluster".
user-invokable: true
argument-hint: "[plan --from-pillar <arquivo-do-pillar> | execute]"
---

# Sub-skill: ranqueado-cluster
> Versão: 3.0 | Junho 2026
> Acionada por: /ranqueado cluster plan --from-pillar <arquivo> | /ranqueado cluster execute
> MÓDULO DE ESTRATÉGIA — roda DEPOIS do pillar escrito, ritmo esporádico

---

## Princípio central — o pillar vem PRIMEIRO

```
O cluster NÃO planeja no escuro. Ele só roda depois que o artigo pillar já foi
escrito (via /ranqueado escrever). O pillar pronto é a BASE de construção:
  → ele já listou os produtos reais (Blog FDF)
  → ele já abriu os subtópicos reais (Blog Search)
  → ele já cobriu os ângulos comerciais reais (Site Money)
Os satélites são derivados desse conteúdo real — não de SERP genérica nem de chute.

Por que: planejar satélite antes do pillar é planejar sem base. "lava e seca
Samsung" genérico não sabe QUAL Samsung o pillar recomendou. Com o pillar pronto,
o satélite vira "Samsung WD11T avaliado no nosso top: vale a pena?" — ancorado no real.
```

---

## Função

Partir do artigo pillar JÁ ESCRITO e montar a arquitetura completa do cluster:
os satélites derivados do conteúdo do pillar, o mapa de links internos, salvo no
projeto.md. Dois momentos separados:

| Sub-comando | O que faz |
|---|---|
| `/ranqueado cluster plan --from-pillar <arquivo>` | Lê o pillar pronto, deriva os satélites, monta o plano. Apresenta para aprovação. |
| `/ranqueado cluster execute` | Lê o plano aprovado e escreve os satélites com contexto de cluster injetado. |

Se o usuário digitar só `/ranqueado cluster`, perguntar:
"Você já escreveu o artigo pillar? Se sim, me aponte o arquivo dele que eu monto
 o cluster a partir dele (/ranqueado cluster plan --from-pillar <arquivo>).
 Se ainda não, escreva o pillar primeiro com /ranqueado escrever."

---

## REGRA-MÃE — onde o cluster se aplica

```
✅ USA CLUSTER: Blog FDF · Blog Search · Site Money
❌ NÃO USA: Blog Discover (feed/tendência) · Site FDF Local/transacional puro

Se o pillar apontado for de modelo incompatível, avisar e não montar:
"O modelo [X] não trabalha com cluster — ele compete por [feed/conversão].
 Para esse modelo, use [planejamento Discover / estrutura Local]."
```

---

## DOIS MODOS de volume — detectados no PASSO 0

```
MODO COM DADOS (Ubersuggest/Semrush respondendo):
  → valida o volume de cada satélite candidato com match_keywords (em lote)

MODO SEM DADOS (sem assinatura / MCP não responde):
  → volume: estimativa relativa (alto/médio/baixo) por sinal de SERP
  → NUNCA número inventado
  → avisar: "Rodando sem ferramenta de SEO. Volumes são estimativas relativas.
    Para volume real, conecte Ubersuggest/Semrush nas configurações."
```

---

## PLAN PHASE: `/ranqueado cluster plan --from-pillar <arquivo>`

### PASSO 0 — Detectar modo + localizar o pillar

```
→ tentar chamada leve ao Ubersuggest/Semrush → MODO COM DADOS ou SEM DADOS (avisar)
→ ler o arquivo do pillar (o aluno aponta o .md/.html, ou cola, ou sobe no Drive)
→ ler projeto.md: modelo de monetização, nicho, artigos existentes, sitemap
→ confirmar: este pillar é do modelo [X]? (Blog FDF / Blog Search / Site Money)
```

### PASSO 1 — Extrair a base do pillar (o coração do novo fluxo)

```
Ler o conteúdo do pillar e extrair os ELEMENTOS REAIS que viram satélites:

BLOG FDF (review/lista):
  → cada PRODUTO avaliado no pillar (marca + modelo exato) → candidato a satélite
    de review único ("[modelo] vale a pena?")
  → marcas mencionadas → candidatos a satélite por marca ("melhores [marca]")
  → critérios de compra que o pillar usou (capacidade, faixa de preço, recursos)
    → candidatos a satélite por atributo ("melhores [produto] [atributo]")
  → comparações que o pillar abriu mas não aprofundou → satélite comparativo

BLOG SEARCH (guia/informacional):
  → cada H2/subtópico que o pillar abriu mas tratou de forma resumida
    → candidato a satélite de aprofundamento
  → perguntas que o pillar levantou e respondeu por cima → satélite dedicado
  → conceitos técnicos citados de passagem → satélite explicativo

SITE MONEY (informacional + comercial):
  → ângulos comerciais que o pillar tocou (objeções, "vale a pena", alternativas)
  → subtópicos informacionais que sustentam a decisão

REGRA: o satélite SÓ existe se tem origem no pillar. Não inventar tema que o
pillar não tocou. Se faltar cobertura óbvia, SUGERIR ao aluno (marcar como
"sugestão além do pillar"), nunca assumir.
```

### PASSO 2 — Validar/enriquecer os candidatos

```
Para cada satélite candidato extraído do pillar:

MODO COM DADOS:
  → Ubersuggest:match_keywords (em lote, até 50) → volume real + dificuldade
  → priorizar por volume + dificuldade
  → satélite sem volume no Ubersuggest mas com intenção clara no pillar:
    marcar "⚠️ sem volume validado" e checar SERP (concorrente ativo confirma)

MODO SEM DADOS:
  → WebSearch de cada candidato → confirmar que há intenção real (concorrentes ativos)
  → volume: estimativa relativa (alto/médio/baixo) por sinal de SERP
  → priorizar por intenção (transacional > comercial > informacional) + especificidade
```

### PASSO 3 — Agrupar em hub-and-spoke

```
PILLAR (hub — o artigo JÁ ESCRITO):
  → é o centro; não será reescrito
  → KW primária e slug já existem (ler do arquivo)

SATÉLITES (spokes — derivados do pillar no PASSO 1):
  → agrupar por eixo: por marca, por capacidade/atributo, por decisão de compra
  → Blog FDF: 1 satélite por produto/marca + satélites de atributo + comparativos
  → Blog Search/Money: satélites de aprofundamento dos subtópicos do pillar

ESTRUTURA:
  → 2 a 5 clusters (eixos) sob o pillar
  → 2 a 4 satélites por cluster
  → Total: 5 a 15 satélites
  → cada satélite = 1 intenção única (zero canibalização)
```

### PASSO 4 — Matriz de links internos

```
Para cada satélite S:
  → S → Pillar (sempre; âncora = KW primária do pillar)
  → Pillar → S (sempre; âncora = KW primária de S)
     ATENÇÃO: o pillar JÁ EXISTE. Estes links serão INJETADOS no pillar no execute
     (PASSO E4), substituindo placeholders ou adicionados na seção apropriada.
  → S → outros satélites do mesmo cluster (2-3 links, âncoras contextuais)
  → S → satélites de clusters adjacentes (0-1 link, só se relevante)

Verificar: cada satélite tem pelo menos 3 links entrantes.
Incluir páginas existentes do sitemap/projeto.md que se conectam.
```

### PASSO 5 — Salvar o plano no projeto.md

```
Gravar na seção "Clusters Planejados" do projeto.md:
  - nome do cluster + modo (com/sem dados) + data
  - PILLAR: KW primária, slug, status: ESCRITO (já existe — é a base)
  - satélites: cada um com KW, volume, intenção, origem no pillar, status: planejado
  - mapa de links internos completo (incluindo os que serão injetados no pillar)
  - páginas existentes do sitemap relevantes

SEM ISSO O CLUSTER EVAPORA — o execute e o escrever não encontram o mapa.
```

### PASSO 6 — Apresentar plano e aguardar aprovação

```
Mostrar tabela resumo:
  - pillar (já escrito) no centro
  - clusters e satélites (KW primária + volume/estimativa + origem no pillar)
  - total de links internos planejados
  - word count total estimado dos satélites
  - ordem sugerida de execução

Perguntar: "O plano está correto? Posso salvar e executar, ou quer ajustar antes?
 (Pode trocar slugs, remover satélites, ajustar a ordem, ou adicionar temas.)"
NÃO executar sem aprovação explícita.

Oferecer: /ranqueado cluster execute · /ranqueado calendario · /ranqueado escrever <kw>
```

---

## EXECUTE PHASE: `/ranqueado cluster execute`

### PASSO E1 — Carregar o plano

```
→ ler a seção "Clusters Planejados" do projeto.md
→ se não existir: "Nenhum cluster planejado. Rode
   /ranqueado cluster plan --from-pillar <arquivo> primeiro."
→ confirmar que o pillar está marcado como ESCRITO (é pré-requisito)
→ se houver mais de um cluster salvo: perguntar qual executar
```

### PASSO E2 — Ordem de execução

```
O pillar JÁ ESTÁ ESCRITO — não entra na fila. Só os satélites:
  MODO COM DADOS: maior volume primeiro
  MODO SEM DADOS: transacional > comercial > informacional, depois especificidade
  Alternar clusters quando houver mais de 2 (diversifica)
```

### PASSO E3 — Para cada satélite: injetar contexto e acionar o escrever

```
Construir o BLOCO DE CONTEXTO DO CLUSTER e passá-lo ao /ranqueado escrever:

CONTEXTO DO CLUSTER — [nome do cluster]
  Pillar deste cluster (JÁ ESCRITO): [título + slug] — linkar SEMPRE para ele
  Papel deste artigo: satélite do cluster [X]
  Origem no pillar: [qual produto/subtópico do pillar este satélite aprofunda]
  KW primária: [kw] · secundárias: [lista]
  Template: [template] · Word count alvo: [N]
  Satélites já escritos (linkar): [lista com slugs]
  Satélites futuros (placeholder [LINK-INTERNO: kw → slug]): [lista]
  Links obrigatórios:
    → Pillar: âncora "[kw do pillar]"
    → Satélites do mesmo cluster: [lista]

INSTRUÇÃO: rodar autônomo — sem pausa de clarificação, sem pausa de outline,
  NÃO detectar template (já definido), aplicar o mapa de links do cluster.
```

### PASSO E4 — Injeção retroativa de links (inclui o PILLAR)

```
Após cada satélite escrito:
1. Varrer satélites já escritos por [LINK-INTERNO: kw → slug-recém-escrito]
   → substituir por link real [kw](slug)
2. INJETAR no PILLAR o link de descida para este satélite recém-escrito
   (o pillar já existe; adicionar o link na seção/menção apropriada do produto/tema)
3. Atualizar status do satélite no projeto.md: planejado → escrito
```

### PASSO E5 — Falha de um satélite

```
→ registrar a falha, continuar com os próximos (não abortar)
→ retry manual: /ranqueado escrever <kw> (lê o cluster do projeto.md)
→ na próxima execução, detectar arquivos já escritos e retomar do próximo
```

### PASSO E6 — Scorecard final

```
cluster-scorecard.md:
  - status por satélite (escrito/falhou/pulado) + word count
  - score de cada um (via ranqueado-analisar em paralelo)
  - auditoria de links: pillar→satélites injetados? satélites→pillar? órfãos?
    marcadores [LINK-INTERNO] não resolvidos?
  - canibalização: dois artigos com mesma KW primária?
  - próximos: /ranqueado analisar · /ranqueado atualizar · /ranqueado calendario
```

---

## Como se conecta ao sistema

```
escrever <pillar> → escreve o PILLAR (a base)
  ↓ ao final, sugere:
cluster plan --from-pillar → lê o pillar, deriva satélites do conteúdo real (ESTE)
  ↓ aprova
cluster execute → escreve os satélites + injeta links no pillar
  ↓
escrever (satélite avulso) → lê o cluster do projeto.md e insere os links
calendario → lê os clusters salvos e agenda
```

---

## Pode / Não Pode

### ✅ DEVE
- Rodar SÓ depois do pillar escrito (o pillar é a base)
- Derivar os satélites do CONTEÚDO REAL do pillar (produtos, subtópicos, ângulos)
- Detectar modo (com/sem dados) no PASSO 0 e avisar
- Validar volume com Ubersuggest quando disponível
- Apresentar o plano completo ANTES de executar + aguardar aprovação
- Salvar o plano no projeto.md (sem isso evapora)
- Injetar no pillar (no execute) os links de descida para os satélites

### ❌ NÃO PODE
- Planejar satélites sem o pillar escrito (planejar no escuro)
- Inventar satélite que o pillar não tocou (só sugerir, marcado)
- Inventar volume em qualquer modo
- Usar keyword ideas (IMPRESSÃO, não tráfego)
- Auto-executar sem aprovação
- Reescrever o pillar (ele já está pronto; só recebe injeção de links)
