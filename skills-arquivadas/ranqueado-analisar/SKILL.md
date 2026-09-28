---
name: ranqueado-analisar
description: Sub-skill de auditoria do claude-ranqueado. Recebe um artigo (da suite ou de fora) e roda o MESMO motor de qualidade do escrever (preflight + reviewer) para dar um diagnóstico — score 0-100 nas 5 categorias, problemas concretos (KW, word count, FAQ, estrutura) e detecção de cara de IA. NÃO reescreve, NÃO altera o artigo: só mede e te mostra o que está bom e o que precisa melhorar. É a base do reescrever e do atualizar. Use quando o usuário disser "analisar", "auditar artigo", "que score tem este texto", "/ranqueado analisar".
---

# Sub-skill: ranqueado-analisar
> Versão: 1.0 | Junho 2026
> Acionada por: /ranqueado analisar <arquivo-ou-texto>
> NÃO altera o artigo — só diagnostica (medição pura)

---

## Função

Auditar um artigo e entregar um diagnóstico claro. Reusa exatamente o motor de qualidade que
o `escrever` já usa internamente — não há um segundo sistema de score. A diferença é que aqui
o motor roda **isolado**, sobre um artigo pronto, e PARA no diagnóstico (não reescreve, não
devolve ao redator).

Por que existe: às vezes você só quer saber "esse artigo está bom?" sem mexer nele. O score do
`escrever` fica preso dentro daquele fluxo; o `analisar` libera a medição como ferramenta
independente — e serve de primeira metade do `reescrever` e do `atualizar`.

---

## O motor que ela reusa (NÃO reinventa)

```
O MESMO motor do escrever:
1. preflight.py  → valida o concreto (KW nas posições, word count, FAQ último,
                   elementos obrigatórios do template) com EXIT CODE — trava de máquina
2. ranqueado-reviewer → score 0-100 nas 5 categorias da rubrica + detecção de IA PT-BR
```

A régua de qualidade é UMA só em toda a suite. O `analisar` não tem critério próprio — ele
chama o mesmo preflight e o mesmo reviewer. Isso garante que "artigo bom" significa a mesma
coisa, seja escrito do zero, analisado isolado ou reescrito.

---

## O que recebe

```
- O artigo a auditar: você cola o texto OU aponta o arquivo (.md/.html) OU sobe no Drive
- (Opcional) a KW primária — se você não informar, o analisar INFERE do título/conteúdo
- (Opcional) o modelo (Blog FDF, Blog Search, Site Local, Infoproduto, Discover)
  → se não informar, o analisar DETECTA pelo formato do artigo
```

---

## Fluxo do `analisar`

### PASSO 1 — Entender o artigo (especialmente se for de fora)

A suite precisa saber o que está medindo. Dois casos:

```
CASO A — Artigo da PRÓPRIA suite (já tem histórico no projeto.md):
  → a KW, o modelo e a estrutura aprovada já são conhecidos. Pular para o PASSO 2.

CASO B — Artigo de FORA (texto velho do aluno, anterior à suite):
  → a suite não sabe nada sobre ele. Antes de medir, INFERIR:
     - Modelo: é review de produto (Blog FDF)? informacional (Blog Search)?
       landing local? página de vendas (Infoproduto)? editorial (Discover)?
       (detectar pelo formato: tabela de produtos+CTA = FDF; passo a passo = guia;
        NAP+regiões = Local; preço+garantia = Infoproduto; narrativa sem FAQ = Discover)
     - KW primária: inferir do H1 e do que mais se repete
     - Confirmar com você antes de medir: "Detectei que é um [modelo] com KW '[x]'. Correto?"
```

### PASSO 2 — Rodar o motor (preflight + reviewer)

> IMPORTANTE — nome técnico do modelo: ao chamar o preflight, usar SEMPRE o nome técnico,
> não o amigável. Mapeamento:
> - Blog FDF → `blog-fdf`
> - Blog Search / Site Money → `blog-search` (ou `site-money`)
> - Site Local → `site-fdf-local`
> - Infoproduto → `site-fdf-infoproduto`
> - Discover → `discover`
> Passar o amigável (ex: `--modelo Infoproduto`) faz o checker não reconhecer o modelo.

```
PASSO 2.1 — preflight.py (validação concreta):
  # Usar o comando Python que existe (Windows: python; Mac/Linux: python3). Tentar nesta ordem:
  #   for c in python py python3; do "$c" --version >/dev/null 2>&1 && PYCMD="$c" && break; done
  "$PYCMD" scripts/preflight.py --arquivo <artigo> --kw "<kw>" --modelo <nome-tecnico> --formato texto
  → registra o que passou e o que falhou (KW nas posições, word count, FAQ, etc.)
  → NÃO bloqueia o fluxo aqui: chamar SEM --strict (assim o exit code vira informação, não trava)

PASSO 2.2 — ranqueado-reviewer (score de qualidade):
  → score 0-100 nas 5 categorias + detecção de frases de IA PT-BR
  → NÃO devolve ao redator (no analisar não há redator — é só medição)
```

### PASSO 3 — Entregar o DIAGNÓSTICO (não reescrever)

O analisar PARA aqui. Entrega um relatório claro:

```
DIAGNÓSTICO — [título do artigo]
Modelo detectado: [modelo]  ·  KW: [kw]

SCORE: [N]/100   (banda: [excelente/bom/precisa melhorar/reprovado])

5 categorias (do reviewer):
  1. Qualidade/Clareza ...... [n]/[max]
  2. [categoria 2] .......... [n]/[max]
  3. [categoria 3] .......... [n]/[max]
  4. [categoria 4] .......... [n]/[max]
  5. [categoria 5] .......... [n]/[max]

VALIDAÇÃO CONCRETA (do preflight):
  ✅ o que está correto (KW no H1, FAQ último, etc.)
  ❌ o que precisa corrigir (ex: faltam secundárias, word count abaixo, KW fora das 100 palavras)

INDÍCIOS DE IA: [nenhum / N frases proibidas / ritmo monótono]

O QUE FAZER:
  → se score ≥ 90 e zero ❌: o artigo está sólido
  → se não: lista do que melhorar, em ordem de impacto
  → "Quer que eu reescreva corrigindo isso? (/ranqueado reescrever)"
```

---

## Pode / Não Pode

### ✅ DEVE
- Reusar o MESMO preflight + reviewer do escrever (uma régua só)
- Inferir modelo e KW quando o artigo é de fora, confirmando com você
- Entregar diagnóstico claro: score + concreto + o que melhorar em ordem de impacto
- Oferecer o reescrever ao final (mas não executar — isso é outro comando)

### ❌ NÃO PODE
- Reescrever ou alterar o artigo (analisar é medição pura — quem age é o reescrever)
- Criar um sistema de score próprio (tem que ser o reviewer/rubrica que já existe)
- Inflar nota ou suavizar problemas para o artigo parecer melhor
- Inventar a KW sem confirmar com você quando o artigo é de fora

---

## Como se conecta aos outros comandos

```
analisar  → só mede e para (este comando)
reescrever → analisar + corrige + mede de novo (loop até 3x, igual ao escrever)
atualizar  → reescrever com modo "dados frescos" (reusa o reescrever)
```

O analisar é a fundação. Construído ele, o reescrever é o analisar + a etapa de correção
(reusando os redatores que já existem), e o atualizar é o reescrever com foco em freshness.
