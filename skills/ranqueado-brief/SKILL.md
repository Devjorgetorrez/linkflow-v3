---
name: ranqueado-brief
description: Sub-skill de briefing do claude-ranqueado. Gera um BRIEFING de conteúdo standalone para um tema — sem escrever o artigo. Reusa o planejamento (KW, secundárias, concorrentes) e a lógica do outline (estrutura sugerida), e entrega tudo como um DOCUMENTO de briefing que você pode aprovar, arquivar ou delegar a um redator. Inclui recomendação de modelo/template, ângulo de diferenciação (information gain) e plano de distribuição. Diferente do escrever (que vai até o artigo final), o brief PARA no plano — é o "o que e como escrever", não o texto. Use quando o usuário disser "brief", "pauta", "briefing", "planejar um artigo sem escrever", "/ranqueado brief".
---

# Sub-skill: ranqueado-brief
> Versão: 1.0 | Junho 2026
> Acionada por: /ranqueado brief <tema-ou-palavra-chave>
> Reusa: ranqueado-planejamento (pesquisa) + lógica do ranqueado-outline (estrutura)
> NÃO escreve o artigo — entrega o briefing para aprovar/delegar

---

## Função

Gerar um briefing de conteúdo completo para um tema, SEM escrever o artigo. É o "o que e como
escrever" entregue como documento: KW, concorrentes, estrutura sugerida, ângulo de diferenciação
e plano de distribuição. Serve para você aprovar antes de escrever, delegar a um redator (humano
ou o próprio escrever), ou montar vários briefings de uma vez (um calendário de pautas).

### O que o brief NÃO é (confronto com o que já existe)

```
NÃO confundir com o planejamento/outline INTERNOS do escrever:
- No /ranqueado escrever, o planejamento e o outline rodam por dentro e você os aprova nas
  PARADAS 1 e 2 — mas são etapas de um fluxo que vai até o artigo final.
- O /ranqueado brief PARA no briefing. Ele entrega o plano como DOCUMENTO standalone e
  termina ali. Não escreve. Serve para planejar, aprovar, arquivar ou delegar.

Em uma frase: escrever = planeja + estrutura + ESCREVE. brief = planeja + estrutura + PARA.
```

---

## O que ela reusa (NÃO reinventa — confrontado com o MD)

```
1. ranqueado-planejamento → a pesquisa (KW primária, secundárias, semânticas, concorrentes,
   word count alvo). MESMA cascata de ferramentas (Semrush → Ubersuggest → WebSearch).
2. Lógica do ranqueado-outline → a estrutura sugerida (H1-H2 derivados dos concorrentes).
   No brief a estrutura é SUGERIDA (não aprovada para escrita imediata).
3. modelos-monetizacao.md → para recomendar o modelo/template certo do tema.
```

O brief não tem motor de pesquisa próprio — reusa o do planejamento. O que ele adiciona é a
camada de BRIEFING: empacotar tudo como documento + recomendação de template + ângulo +
distribuição.

---

## O que recebe

```
- O tema ou palavra-chave do briefing
- (Opcional) modelo pretendido — se não informar, o brief RECOMENDA o modelo pelo tema
- (Opcional) quantidade — pode gerar 1 briefing ou vários (lista de temas → vários briefings)
```

---

## Fluxo do `brief`

### PASSO 1 — Pesquisar (reusar o planejamento)

```
Rodar a pesquisa do ranqueado-planejamento (thread principal, cascata de ferramentas):
  → KW primária confirmada + intenção de busca
  → 3-5 secundárias + semânticas
  → concorrentes dos 3 primeiros (estrutura, profundidade, gaps)
  → word count alvo (range do template × média dos concorrentes)
```

### PASSO 2 — Recomendar modelo e template

```
Com base no tema e na intenção de busca, recomendar:
  → o modelo de monetização (Blog FDF, Blog Search/Site Money, Site FDF, Discover)
  → o template específico dentro do modelo
  → justificar a escolha em 1-2 linhas (por que esse modelo serve a este tema)
```

### PASSO 3 — Sugerir a estrutura (lógica do outline)

```
Derivar dos concorrentes a estrutura sugerida (H1 + H2 principais):
  → NÃO é a estrutura final aprovada (isso é o outline do escrever)
  → é a estrutura PROPOSTA no briefing, para orientar quem for escrever
```

### PASSO 4 — Definir o ângulo de diferenciação (information gain)

```
O que este artigo precisa ter que os concorrentes NÃO têm (para superá-los):
  → gaps identificados nos concorrentes (o que falta neles)
  → ângulo único, dado próprio, perspectiva ou profundidade extra
  → é o que faz o conteúdo ganhar do que já está rankeando
```

### PASSO 5 — Montar o plano de distribuição

```
Onde e como o conteúdo será divulgado depois de publicado:
  → canais (redes sociais, newsletter, etc., conforme o projeto.md)
  → ganchos de divulgação (o que destacar em cada canal)
  → (mantém simples — é um plano, não execução)
```

### PASSO 6 — Entregar o BRIEFING (documento standalone) e PARAR

```
BRIEFING — [tema]
Modelo recomendado: [modelo] · Template: [template]  (justificativa: …)
Intenção de busca: [informacional/comercial/transacional/navegacional]

PALAVRAS-CHAVE:
  Primária: [kw] (volume, dificuldade se houver)
  Secundárias: [lista]
  Semânticas/entidades: [lista]

CONCORRENTES (top 3):
  → [resumo da estrutura e profundidade de cada um + gaps]

ESTRUTURA SUGERIDA:
  H1: [título proposto]
  H2: [principais seções propostas]

ÂNGULO DE DIFERENCIAÇÃO (information gain):
  → [o que este artigo terá que os concorrentes não têm]

WORD COUNT ALVO: [range]

PLANO DE DISTRIBUIÇÃO:
  → [canais + ganchos]

PRÓXIMO PASSO: "Briefing pronto. Quer que eu escreva agora (/ranqueado escrever) ou
guardar/delegar este briefing?"
```

O brief PARA aqui. Não escreve o artigo — entrega o documento.

### PASSO 7 — SALVAR o briefing (seguindo a referência)

```
A referência salva o brief ("Step 6: Save the Brief" → briefs/[slug]-brief.md). Fazemos igual:
  → salvar o briefing como arquivo: briefs/[slug]-brief.md (na pasta do cliente)
  → assim você pode retomar, delegar ou consultar o briefing depois — não evapora
  → confirmar: "Briefing salvo em briefs/[slug]-brief.md. Pronto para /ranqueado escrever."
```

---

## Pode / Não Pode

### ✅ DEVE
- Reusar o planejamento (mesma pesquisa e cascata) — não criar pesquisa própria
- Recomendar o modelo/template certo para o tema, com justificativa
- Entregar o briefing como DOCUMENTO standalone (para aprovar/arquivar/delegar)
- Incluir o ângulo de diferenciação (information gain) — o que supera os concorrentes
- Parar no briefing — oferecer o escrever como próximo passo, mas não executar
- SALVAR o briefing como arquivo (briefs/[slug]-brief.md) para retomar/delegar depois
- Poder gerar VÁRIOS briefings de uma vez (lista de temas)

### ❌ NÃO PODE
- Escrever o artigo (isso é o /ranqueado escrever)
- Duplicar o motor de pesquisa (reusa o do planejamento)
- Entregar a estrutura como "aprovada para escrita" (no brief ela é sugerida)
- Inventar dados de volume/dificuldade sem a ferramenta (mesma regra do planejamento)

---

## Como se conecta aos outros comandos

```
brief      → planeja e PARA (entrega o briefing como documento) — ESTE comando
escrever   → planeja + estrutura + ESCREVE (vai até o artigo final)
calendario → (futuro) usa vários briefs para montar o calendário editorial
```

O brief é o planejamento entregue como documento aprovável. O escrever é o fluxo completo.
O calendário (futuro) se apoia em vários briefs para organizar a publicação ao longo do tempo.
