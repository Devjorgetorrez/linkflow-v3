---
name: ranqueado-reescrever
description: Sub-skill de otimização do claude-ranqueado. Pega um artigo que JÁ existe (da suite ou de fora) e o melhora — roda o analisar para diagnosticar, corrige só o que o gate apontou usando o redator do modelo, e roda o gate de novo até atingir o padrão (score 90, loop máx 3x, igual ao escrever). Preserva o que já está bom; reescreve só o necessário. Entrega o artigo melhorado + score antes/depois. NÃO é a "regeneração por trecho" do escrever (aquela é quando você não gosta de um parágrafo recém-gerado); o reescrever trabalha um artigo pronto inteiro. Use quando o usuário disser "reescrever", "otimizar artigo", "melhorar este texto", "/ranqueado reescrever".
---

# Sub-skill: ranqueado-reescrever
> Versão: 1.0 | Junho 2026
> Acionada por: /ranqueado reescrever <arquivo-ou-texto>
> Reusa: ranqueado-analisar (diagnóstico) + redator do modelo (correção) + gate (validação)

---

## Função

Melhorar um artigo que já existe. É o `analisar` + a etapa de correção: diagnostica, corrige
só o apontado, e revalida pelo mesmo gate do escrever. Preserva o que está bom — não regenera
o que já passa. Entrega o artigo melhorado com o score antes/depois para você ver o ganho.

### O que o reescrever NÃO é (confronto com o que já existe)

```
NÃO confundir com a "Regeneração por trecho" do escrever:
- Regeneração por trecho (já existe no escrever): você acabou de gerar um artigo, não gostou
  de UM parágrafo/seção, e pede para refazer só aquele trecho. É dentro do fluxo de escrever.
- Reescrever (este comando): pega um artigo PRONTO (que pode ter sido feito há meses, ou ser
  de fora) e o otimiza inteiro com base num diagnóstico de qualidade. É comando próprio.
```

---

## O que ela reusa (NÃO reinventa — confrontado com o MD)

```
1. ranqueado-analisar  → o diagnóstico (score + o que está ruim, em ordem de impacto)
                         (o analisar já roda preflight + reviewer; o reescrever consome a saída)
2. redator do MODELO   → a correção. NÃO há redator dedicado a reescrever — usa-se o redator
                         do modelo do artigo (redator-blog-fdf, redator-blog-search,
                         redator-site-fdf-local, redator-site-fdf-infoproduto, ou Discover),
                         porque cada um conhece as regras do seu modelo
3. gate (preflight + reviewer) → a revalidação, com o MESMO loop do escrever (máx 3 iterações)
```

A régua de qualidade é a mesma de toda a suite. O reescrever não inventa critério — ele mede
com o analisar, corrige com o redator do modelo, e revalida com o gate.

---

## O que recebe

```
- O artigo a reescrever: você cola, aponta o arquivo (.md/.html) ou sobe no Drive
- (Opcional) KW primária — se não informar, herda do analisar (que infere)
- (Opcional) modelo — se não informar, o analisar detecta
- (Opcional) foco do reescrever: "só SEO", "deixar mais profundo", "atualizar dados"
  → se não informar, corrige tudo o que o diagnóstico apontou
```

---

## Fluxo do `reescrever`

### PASSO 1 — Diagnosticar (chamar o analisar)

```
Rodar o ranqueado-analisar no artigo:
  → identifica modelo + KW (confirma com você se for artigo de fora)
  → roda o gate (preflight + reviewer) → score atual + lista do que está ruim
  → este é o PONTO DE PARTIDA: sabemos o score de origem e exatamente o que corrigir
```

Se o analisar já devolver score ≥ 90 e zero problemas concretos:
```
→ avisar: "Este artigo já está sólido (score [N]/100). Reescrever pode não agregar.
   Quer reescrever mesmo assim com algum foco específico (mais profundo, atualizar dados)?"
```

### PASSO 2 — Reescrever corrigindo SÓ o apontado (chamar o redator do modelo)

```
Chamar o redator do MODELO do artigo, passando:
  - O artigo existente (o texto atual, completo)
  - O diagnóstico do analisar (o que está ruim, em ordem de impacto)
  - O que PRESERVAR: tudo o que já passou no gate (não regenerar o que está bom)
  - As regras do modelo (o redator já as conhece)

REGRA DE OURO (confrontada com o "Redator corrige só o apontado" do escrever):
  → corrigir SÓ o que o diagnóstico apontou
  → preservar o título, a estrutura aprovada e os trechos que já passam
  → não inflar, não inventar, não mudar o que já está correto
  → mesma proibição do escrever: nada de frases de IA, KW exata nas posições, etc.
```

### PASSO 3 — Revalidar pelo gate (mesmo loop do escrever)

```
Rodar o gate de novo no artigo reescrito (igual ao PASSO 5 do escrever):
  → preflight.py (com o nome técnico do modelo: blog-fdf, site-fdf-local, etc.)
  → ranqueado-reviewer (score 0-100, mínimo 90 + detecção de IA)

Loop: máximo 3 iterações. Se ainda não atingir 90, o redator corrige de novo só o apontado.
Após 3 tentativas sem atingir 90 → escalar para você decidir (mesmo comportamento do escrever).
```

### PASSO 4 — Entregar o artigo melhorado + score antes/depois

```
ARTIGO REESCRITO — [título]
Modelo: [modelo]  ·  KW: [kw]

SCORE: [score_antes]/100 → [score_depois]/100   (ganho: +[N])

O QUE FOI CORRIGIDO:
  → [lista do que mudou, baseada no diagnóstico] (ex: secundárias inseridas, KW no 1º parágrafo,
     FAQ movido para o fim, word count ajustado)

O QUE FOI PRESERVADO:
  → o que já estava bom e não foi tocado (título, estrutura, trechos aprovados)

[o artigo reescrito completo, no formato do modelo]
```

---

## Pode / Não Pode (confrontado com as regras do escrever)

### ✅ DEVE
- Começar pelo analisar (diagnóstico é o ponto de partida)
- Usar o redator do MODELO do artigo (não um redator genérico)
- Corrigir SÓ o que o diagnóstico apontou — preservar o que já passa
- Revalidar pelo MESMO gate (preflight + reviewer), com loop máx 3x
- Entregar score antes/depois (mostrar o ganho real)
- Para artigo de fora: confirmar modelo e KW antes (herdado do analisar)

### ❌ NÃO PODE
- Regenerar o artigo inteiro do zero quando só partes precisam de ajuste
- Criar critério de qualidade próprio (é o mesmo reviewer/rubrica de sempre)
- Inflar score ou suavizar problemas para parecer que melhorou
- Inventar dados, depoimentos ou fatos ao reescrever
- Mudar o título/estrutura aprovados sem o diagnóstico pedir
- Confundir-se com a "regeneração por trecho" do escrever (são fluxos distintos)
- Passar o nome amigável do modelo ao preflight (usar o técnico: blog-fdf, site-fdf-local, etc.)

---

## Como se conecta aos outros comandos

```
analisar   → mede e para
reescrever → analisar + corrige + revalida (ESTE comando)
atualizar  → reescrever com foco em dados frescos (freshness) — reusa este fluxo
```

O `atualizar` (futuro) será este mesmo fluxo, com o foco fixado em "atualizar estatísticas e
sinais de data" — exatamente como a referência faz (update roteia para rewrite com modo freshness).
