---
name: ranqueado-atualizar
description: Sub-skill de atualização do claude-ranqueado. Pega um artigo que já existe e o atualiza com dados frescos — estatísticas recentes, anos correntes, fatos novos — e reforça os sinais de data (freshness) que o Google e os mecanismos de IA premiam. É o reescrever com o FOCO FIXADO em freshness: busca dados atuais na web, atualiza só o que ficou velho, preserva o resto, e revalida pelo mesmo gate. Diferente do reescrever genérico (que corrige qualidade), o atualizar foca em recência. Use quando o usuário disser "atualizar artigo", "deixar atualizado", "dados de 2026", "freshness", "/ranqueado atualizar".
---

# Sub-skill: ranqueado-atualizar
> Versão: 1.0 | Junho 2026
> Acionada por: /ranqueado atualizar <arquivo-ou-texto>
> Reusa: o fluxo do ranqueado-reescrever, com o foco fixado em freshness (dados frescos)

---

## Função

Atualizar um artigo existente com dados frescos e reforçar os sinais de recência. É o
`reescrever` com o foco travado em "atualizar estatísticas e sinais de data" — não corrige
qualidade em geral, foca em deixar o conteúdo atual.

Por que existe: conteúdo desatualizado perde posição e perde citação em IA. Pesquisa de 2026
mostra que a grande maioria das citações em mecanismos de IA vem de conteúdo atualizado
recentemente. Um artigo bom de 2 anos atrás, com dados velhos, performa pior que o mesmo
artigo com números do ano corrente — mesmo sem mudar a estrutura.

### Diferença entre atualizar e reescrever (confronto)

```
reescrever → foco em QUALIDADE: corrige o que o diagnóstico apontar (KW, estrutura, secundárias…)
atualizar  → foco em RECÊNCIA: troca dados velhos por frescos, atualiza anos, reforça data.
             Não mexe na qualidade geral se ela já está boa — mexe no que ENVELHECEU.
```

---

## O que ela reusa (NÃO reinventa — confrontado com o MD)

```
1. ranqueado-reescrever → o fluxo inteiro (diagnóstico → corrige → revalida pelo gate, loop 3x)
   O atualizar é o reescrever com o foco = "dados frescos" (o reescrever já prevê esse foco)
2. redator do MODELO (modo reescrita) → a atualização do texto. Os redatores já têm o
   "tripé de evidência" (todo dado vem com ano + fonte) — o atualizar se apoia nisso
3. gate (preflight + reviewer) → a revalidação, mesmo loop do escrever/reescrever
```

### O passo a MAIS que só o atualizar tem: buscar dados frescos

```
Os redatores ESCREVEM, não PESQUISAM. Então, antes de mandar o redator atualizar, o
atualizar faz a busca de dados frescos na web (mesma capacidade de pesquisa do planejamento):
  → identifica no artigo os dados datados (estatísticas, "em 2024", preços, números de mercado)
  → busca os valores ATUAIS desses dados (web search)
  → entrega ao redator os dados frescos + o artigo, para ele substituir os velhos
Nunca inventar o dado novo — se não encontrar fonte atual, manter o antigo e sinalizar.
```

---

## O que recebe

```
- O artigo a atualizar: você cola, aponta o arquivo (.md/.html) ou sobe no Drive
- (Opcional) KW e modelo — herda do diagnóstico (analisar/reescrever inferem)
- (Opcional) o que priorizar: "só estatísticas", "preços", "ano corrente"
  → se não informar, atualiza todos os dados datados que encontrar
```

---

## Fluxo do `atualizar`

### PASSO 1 — Identificar o que envelheceu

```
Ler o artigo e mapear os elementos datados:
  → estatísticas e percentuais ("X% dos brasileiros…")
  → anos explícitos ("em 2024", "guia 2025", "dados de…")
  → preços, faixas de valor, números de mercado
  → referências a versões, modelos, leis ou fatos que mudam com o tempo
  → o dateModified / data de atualização do artigo
```

### PASSO 2 — Buscar os dados frescos (web)

```
Para cada dado datado, buscar o valor ATUAL via web search:
  → priorizar fontes originais e recentes (gov, institutos, fabricantes, dados do ano corrente)
  → registrar a fonte e o ano de cada dado novo (para o tripé de evidência do redator)
  → se NÃO encontrar fonte atual confiável: manter o dado antigo e marcar [dado não atualizado: sem fonte recente]
  → NUNCA inventar número novo
```

### PASSO 3 — Atualizar via reescrever (foco = freshness)

```
Chamar o fluxo do ranqueado-reescrever com foco fixado em "dados frescos", passando ao
redator do MODELO (modo reescrita):
  - O artigo existente
  - Os dados frescos encontrados (com ano + fonte)
  - Instrução: substituir SÓ os dados velhos pelos novos; atualizar anos no título/texto
    quando fizer sentido ("Guia 2025" → "Guia 2026" se o conteúdo foi de fato atualizado);
    reforçar a data de atualização
  - PRESERVAR todo o resto (estrutura, qualidade, trechos que não dependem de data)
```

### PASSO 4 — Revalidar pelo gate (mesmo loop)

```
Rodar o gate (preflight + reviewer, nome técnico do modelo), loop máx 3x — igual ao reescrever.
```

### PASSO 5 — Entregar + reforçar sinal de data

```
ARTIGO ATUALIZADO — [título]
Modelo: [modelo]  ·  KW: [kw]

DADOS ATUALIZADOS:
  → [lista: dado velho → dado novo (fonte, ano)]
DADOS MANTIDOS (sem fonte recente):
  → [lista do que não foi possível atualizar, se houver]

SINAL DE DATA:
  → lembrar de atualizar o dateModified no schema e a data visível de "atualizado em"
    (freshness é o que o Google e a IA premiam)

[o artigo atualizado completo, no formato do modelo]
```

---

## Pode / Não Pode

### ✅ DEVE
- Buscar dados frescos na web ANTES de mandar o redator (redator não pesquisa)
- Registrar ano + fonte de cada dado novo (alimenta o tripé de evidência do redator)
- Atualizar SÓ o que envelheceu — preservar o que não depende de data
- Reforçar o sinal de data (dateModified, "atualizado em")
- Revalidar pelo mesmo gate (preflight + reviewer), loop máx 3x
- Usar o nome técnico do modelo no preflight (blog-fdf, site-fdf-local, etc.)

### ❌ NÃO PODE
- Inventar dados novos — sem fonte recente, mantém o antigo e sinaliza
- Reescrever a qualidade geral (isso é o reescrever; o atualizar foca em recência)
- Trocar o ano do título sem ter de fato atualizado o conteúdo (enganoso)
- Criar critério de qualidade próprio (é o mesmo gate de sempre)
- Mudar estrutura/título além do necessário para a atualização

---

## Como se conecta aos outros comandos

```
analisar   → mede e para
reescrever → analisar + corrige qualidade + revalida
atualizar  → reescrever com foco em freshness + busca de dados frescos (ESTE comando)
```

O atualizar é a especialização do reescrever para recência. Reusa todo o fluxo dele,
adicionando só a etapa de busca de dados frescos na web (que o reescrever genérico não faz).
