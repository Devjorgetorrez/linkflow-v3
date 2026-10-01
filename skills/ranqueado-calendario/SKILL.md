---
name: ranqueado-calendario
description: Sub-skill de planejamento editorial do claude-ranqueado. Gera um calendário de publicação (mensal ou trimestral) para um nicho — organiza quais artigos escrever, em que ordem e com que frequência, equilibrando conteúdo pillar (rei) e supporting (soldado) e a intenção de busca. Lê o histórico de artigos do projeto.md para não repetir o que já existe e para sinalizar conteúdo velho que precisa de atualização (decay). Adapta o content mix conforme o modelo de monetização. Diferente do brief (que detalha UM artigo), o calendário organiza VÁRIOS ao longo do tempo. Use quando o usuário disser "calendário editorial", "calendário de conteúdo", "o que publicar no mês", "planejar publicações", "/ranqueado calendario".
---

# Sub-skill: ranqueado-calendario
> Versão: 1.0 | Junho 2026
> Acionada por: /ranqueado calendario [mensal | trimestral]
> Reusa: regras-conteudo.md (cluster pillar/supporting) + histórico do projeto.md
> Conecta com: o brief (cada item do calendário pode virar um briefing) e o escrever

---

## Função

Organizar o que publicar ao longo do tempo. Gera um calendário editorial (mensal ou trimestral)
com os artigos a escrever, em ordem e frequência, equilibrando conteúdo pillar e supporting,
respeitando a intenção de busca e o modelo de monetização. Lê o que já existe (projeto.md) para
não repetir e para sinalizar o que envelheceu.

### O que o calendário NÃO é (confronto)

```
- brief    → detalha UM artigo (KW, estrutura, ângulo) — é profundidade em um tema
- calendário → organiza VÁRIOS artigos no tempo (ordem, frequência, mix) — é amplitude e agenda
- cluster (futuro) → desenha a arquitetura de links pillar→supporting de um tema
O calendário diz "o que e quando publicar"; o brief diz "como escrever cada um".
```

---

## O que ela reusa (NÃO reinventa — confrontado com o MD)

```
1. seção "Clusters Planejados" do projeto.md → os clusters JÁ desenhados pelo /ranqueado
   cluster (com dados reais). O calendário AGENDA esses (não re-inventa) — segue a referência:
   "schedules publication dates around topic clusters; does not build clusters"
2. regras-conteudo.md → a teoria de cluster (Conteúdo Rei/pillar + Soldado/supporting),
   usada SÓ como apoio quando não há clusters salvos
3. histórico do projeto.md → "Artigos Criados pela Suite" (data | slug | título | status)
   → para NÃO repetir temas já cobertos e para detectar conteúdo velho (decay)
4. modelos-monetizacao.md → para ajustar o content mix ao modelo do projeto
```

O calendário não inventa clusters quando eles já existem — ele agenda os clusters salvos.
A teoria (regras-conteudo.md) é apoio para o caso de ainda não haver cluster planejado.

---

## Conceitos adaptados da referência (com ajuste ao nosso sistema)

```
CONTENT MIX (adaptado do 60/30/10):
  → equilíbrio entre tipos de conteúdo no período. Proporção sugerida, ajustável ao modelo:
     ~60% supporting (soldado) — artigos de subtópicos que sustentam os pillars
     ~30% pillar (rei) — artigos amplos e profundos que ancoram os clusters
     ~10% experimental/tendência — testar ângulos novos, temas de oportunidade
  → ajustar ao modelo: o content mix de pillar/supporting aplica-se aos modelos que USAM
    cluster (Blog FDF, Blog Search/Site Money). Discover e transacional puro NÃO usam cluster
    (ver regras-cluster.md) — para Discover, o calendário organiza por tendência/interesse, sem
    estrutura pillar/supporting

DECAY DETECTION (sinalização de conteúdo velho):
  → ler a data dos artigos no projeto.md
  → sinalizar os que passaram do limite de freshness (ex: > 6 meses, ou dados datados)
  → recomendar /ranqueado atualizar para esses, encaixando-os no calendário como manutenção
```

---

## O que recebe

```
- Período: mensal ou trimestral (se não informar, perguntar)
- Frequência desejada: quantos artigos por semana/mês (se não informar, sugerir pelo histórico)
- (lê sozinho) o nicho e o modelo do projeto.md + os artigos já criados
```

---

## Fluxo do `calendario`

### PASSO 1 — Ler o contexto e o que já existe

```
→ ler o projeto.md: nicho, modelo de monetização, tom
→ ler "Artigos Criados pela Suite": o que já foi publicado (temas, datas, status)
→ mapear o que já está coberto (não repetir) e o que envelheceu (candidato a atualizar)
```

### PASSO 2 — Mapear os clusters do nicho (LER os clusters já planejados primeiro)

```
ORDEM CORRETA (seguindo a referência: o calendário AGENDA clusters, não os cria do zero):

→ PRIMEIRO: ler a seção "Clusters Planejados" do projeto.md
   → se JÁ existem clusters desenhados pelo /ranqueado cluster: AGENDAR esses
     (o trabalho de dados já foi feito; o calendário organiza no tempo, não re-inventa)
   → pegar os satélites ainda "planejado" (não "escrito") como itens a agendar
   → o pillar e seus satélites já vêm com a relação de links pronta

→ SÓ SE não houver clusters salvos (ou para complementar lacunas):
   → usar a clusterização por modelo (regras-conteudo.md) para sugerir temas do nicho
   → mas RECOMENDAR rodar /ranqueado cluster antes, para ter dados reais:
     "Não há clusters planejados para este nicho. Posso montar um calendário preliminar
      pela teoria de cluster, mas recomendo rodar /ranqueado cluster antes — assim o
      calendário agenda artigos com dados reais de busca, não suposição."

→ comparar com o que já existe (Artigos Criados): quais satélites/pillars ainda faltam escrever
```

### PASSO 3 — Montar o calendário com content mix

```
→ distribuir os artigos no período (mensal/trimestral) na frequência definida
→ aplicar o content mix (~60% supporting, ~30% pillar, ~10% tendência), ajustado ao modelo
→ ordenar com lógica: pillar antes dos seus supporting (o rei ancora o cluster)
→ encaixar as manutenções (decay) como itens de atualização
```

### PASSO 4 — Entregar o calendário e conectar ao brief/escrever

```
CALENDÁRIO EDITORIAL — [nicho] · [período]
Modelo: [modelo] · Frequência: [N artigos/semana]

[Semana 1]
  → [tipo: pillar/supporting/tendência] Tema — KW provável — cluster — (novo / atualizar)
  → ...
[Semana 2]
  → ...

RESUMO DO MIX: X% supporting · Y% pillar · Z% tendência
MANUTENÇÃO (decay): [artigos velhos a atualizar, se houver]

PRÓXIMO PASSO: "Quer que eu gere o briefing de algum item (/ranqueado brief <tema>)
ou já escreva o primeiro (/ranqueado escrever <kw>)?"
```

---

## Pode / Não Pode

### ✅ DEVE
- Ler o histórico do projeto.md (não repetir o que já existe; sinalizar decay)
- Usar a clusterização por modelo já definida em regras-conteudo.md
- Aplicar o content mix (pillar/supporting/tendência), ajustado ao modelo
- Ordenar pillar antes dos supporting do mesmo cluster
- Conectar ao brief e ao escrever como próximos passos
- Sinalizar conteúdo velho e recomendar o atualizar

### ❌ NÃO PODE
- Escrever os artigos (isso é o escrever) nem detalhar um (isso é o brief)
- Repetir temas já cobertos no projeto.md
- Inventar a teoria de cluster (reusar regras-conteudo.md)
- Ignorar o modelo de monetização ao montar o mix

---

## Como se conecta aos outros comandos

```
calendario → organiza VÁRIOS artigos no tempo (ESTE comando)
brief      → detalha UM item do calendário (quando você vai escrever aquele)
escrever   → escreve um item (com ou sem brief antes)
atualizar  → manutenção dos itens de decay que o calendário sinalizou
cluster    → (futuro) a arquitetura de links de um cluster que o calendário listou
```

O calendário é a visão de amplitude/agenda. O brief aprofunda um item. O escrever executa.
O atualizar mantém o que envelhece. Juntos formam o ciclo de planejamento editorial.
