# Regras do Cluster — claude-ranqueado
> Versão: 1.0 | Junho 2026
> Referência consultada pelo comando /ranqueado cluster (e pelo escrever ao verificar cluster)
> Define O QUE é um cluster válido — critérios objetivos, não improviso

---

## REGRA-MÃE — Onde o cluster se APLICA

O cluster é uma ferramenta de AUTORIDADE TEMÁTICA PARA BUSCA. Só faz sentido onde há intenção
de busca estruturada (informacional/comercial). NÃO se aplica a todos os modelos.

```
✅ USA CLUSTER:
   → Blog FDF (comercial / review)
   → Blog Search / Site Money (informacional + comercial)

❌ NÃO USA CLUSTER:
   → Blog Discover (compete por atenção no feed, não por palavra-chave; é tendência/interesse,
     não rede de conteúdo de busca) → usar planejamento próprio do Discover, não cluster
   → Transacional puro / Site FDF Local (página de conversão de serviço/localização, não
     rede de conteúdo temático) → usar a estrutura própria do Local
```

Se o comando cluster for acionado para Discover ou transacional puro, AVISAR:
"O modelo [X] não trabalha com cluster de conteúdo — ele compete por [feed/conversão], não por
autoridade temática de busca. Para esse modelo, use [planejamento Discover / estrutura Local]."

---

## CRITÉRIO 1 — Satélites SEGMENTADOS por modelo (coerência de intenção)

Os satélites devem servir à intenção do pillar. NUNCA misturar intenções (ex: receita num
cluster de compra dilui a autoridade comercial). A fonte de satélites muda por modelo:

```
BLOG FDF (review / comercial):
  Satélites = DUAS fontes JUNTAS:
   (a) CADA PRODUTO avaliado no pillar → 1 artigo de review individual
       (ex: pillar "melhores fornos de embutir" → satélites "Forno Brastemp X vale a pena?",
        "Forno Electrolux Y é bom?", um por produto da relação)
   (b) SUBTÓPICOS de decisão de compra:
       tipos/variações (gás vs elétrico), comparativos (X vs Y), critérios (como escolher,
       o que observar), faixas (melhor até R$N, melhor para apartamento), marcas
  PROIBIDO (fora de intenção): receitas, uso, manutenção pura, culinária
       (ex: "temperatura para assar pão no forno" ❌ — é uso, não compra)

BLOG SEARCH / SITE MONEY (informacional + comercial):
  Satélites = subtópicos do tema nas intenções informacional e comercial:
   definições, how-to, troubleshooting, comparativos, objeções, "vale a pena", melhores/tipos
  (o Site Money combina informacional + comercial; o transacional PURO não forma cluster)

BLOG DISCOVER: não usa cluster (ver regra-mãe)
SITE FDF LOCAL / transacional: não usa cluster (ver regra-mãe)
```

---

## CRITÉRIO 2 — Volume mínimo (não corta por volume, mas sinaliza)

Volume baixo NÃO descarta automaticamente — um satélite específico de baixo volume pode
converter mais que um genérico de alto volume (a melhor prática 2026: focar em problemas
alinhados a receita/decisão, não perseguir volume bruto).

```
→ Volume ALTO (≥ 50/mês): prioridade normal a alta
→ Volume BAIXO (< 50/mês): marcar como "long-tail de apoio"
   → incluir SE serve diretamente à decisão de compra/intenção do pillar
   → senão, descartar
→ NUNCA incluir satélite que seja AO MESMO TEMPO baixo (< 50) E fora de intenção
   (esse é o pior caso — exatamente o erro a evitar)
→ sempre MOSTRAR o volume de cada satélite para o usuário decidir
```

---

## CRITÉRIO 3 — Origem dos satélites (INEGOCIÁVEL — do pillar + dado, nunca palpite)

Todo satélite deve vir do CONTEÚDO REAL do pillar já escrito, validado por DADO de busca
quando disponível. É o que impede o cluster de ser "achismo".

```
→ ORIGEM PRIMÁRIA: o conteúdo do pillar JÁ ESCRITO (o cluster roda depois do pillar).
   Os satélites saem do que o pillar realmente cobriu:
   - Blog FDF: cada produto avaliado, cada marca, cada atributo de compra do pillar
   - Blog Search/Money: cada subtópico que o pillar abriu mas tratou de forma resumida
→ VALIDAÇÃO de volume (quando há ferramenta): match_keywords / page_overview confirmam volume real
→ PROIBIDO inventar satélite que o pillar NÃO tocou, "de cabeça" / por inferência
→ Se o sistema quiser SUGERIR um tema além do pillar (intuição de gap), PODE,
   mas DEVE marcar: "⚠️ sugestão além do pillar — sem volume validado, confirme se vale"
→ Nunca apresentar um palpite como se fosse dado. O usuário sempre distingue
   o que veio do PILLAR + DADO do que é SUGESTÃO do sistema.
```

---

## CRITÉRIO 4 — Estrutura do cluster

```
→ Nº de satélites: 5 a 10 por pillar (padrão de mercado 2026; base inicial, pode expandir depois)
→ PILLAR = o tema de maior AMPLITUDE (cobre o assunto todo), NÃO necessariamente o de maior volume
   → ex confirmado: "melhores fornos de embutir" (amplo) é pillar mesmo com volume menor que
     "fornos de embutir a gás" — o pillar ancora, os satélites capturam o long-tail
→ Cada satélite = UMA intenção/subtópico específico (satélites não se sobrepõem entre si)
→ no review, os produtos do pillar contam como satélites (Critério 1a)
```

---

## CRITÉRIO 5 — Formato de saída padronizado

Sempre o MESMO formato (não varia por execução):

```
CLUSTER — [nicho] · Modelo: [modelo] · MODO: [com dados / sem dados]

PILLAR (página Money):
  → [/slug] — KW: [kw] — Volume: [N] — SD: [N] — Intenção: [comercial/informacional]

SATÉLITES:
  → [/slug] — KW: [kw] — Vol: [N] — SD: [N] — Intenção: [tipo] — Origem: [dado/⚠️sugestão]
     — Tipo de artigo: [blog-fdf-review / blog-search / etc] — Link → Pillar
  (marcar prioridade alta quando volume alto; "long-tail de apoio" quando < 50/mês)

MAPA DE LINKS INTERNOS:
  → satélites → Pillar (âncora com a KW do pillar)
  → Pillar → satélites principais
  → satélites adjacentes ↔ entre si (quando a intenção conecta)
  → páginas existentes do sitemap que entram

COLUNAS OBRIGATÓRIAS: Volume, SD, Intenção, Origem (dado vs sugestão), Tipo de artigo
```

---

## Resumo das proibições (o que NUNCA fazer)

```
❌ aplicar cluster a Discover ou transacional puro
❌ misturar intenção (receita/uso num cluster de compra)
❌ inventar satélite sem dado (ou apresentar palpite como dado)
❌ incluir satélite baixo (< 50) E fora de intenção
❌ variar o formato de saída
❌ escolher o pillar só por volume (é por amplitude)
```

Carregar quando: `/ranqueado cluster` (sempre); `/ranqueado escrever` ao verificar cluster (PASSO 1.5).
