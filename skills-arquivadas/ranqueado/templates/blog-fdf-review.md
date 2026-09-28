---
name: blog-fdf-review
type: template
intent: review-top-n
trigger: "melhores X, top N produtos, melhores para Y, seleção de produtos"
monetization: afiliado-duplo
platforms: [amazon, mercadolivre]
version: 1.0
word_count:
  min: 1500
  max: null   # SEM teto — Blog FDF com vários produtos é naturalmente longo (4000-5000+ é normal)
  note: "150-300 palavras por produto listado; piso 1500, sem limite máximo"
internal_links:
  min_per_article: 3
  max_per_article: 6
  target_types: [pillar, comparativo, produto-unico]
---

# Template: Blog FDF Review (Top N Produtos)
> Referência: anunciandoprodutos.com.br — "As 5 Melhores Lava e Seca para o Inverno em 2026"
> Monetização: Afiliado Amazon + Mercado Livre · Versão: 1.0 · Junho 2026

---

## Quando Usar

| Situação | Usar? |
|---|---|
| Usuário pesquisa "melhores X para Y" | ✅ SIM |
| Lista de N produtos com review por nicho | ✅ SIM |
| Comparação entre 2 produtos específicos | ❌ NÃO — usar blog-fdf-comparativo |
| Review de 1 produto único | ❌ NÃO — usar blog-fdf-produto-unico |

---

## Frontmatter do Artigo Gerado

```
title: "[As N Melhores/Melhores N] [Produto] para [contexto] em [ano]"
description: "[KW primária] — veja qual modelo tem o melhor custo-benefício..."
slug: [as-n-melhores-produto-contexto]
date: [data] | lastUpdated: [data] | author: "[nome]"
tags: [produto] · [kw secundária 1] · [kw secundária 2]
coverImageAlt: "[KW primária exata]"
```

---

## Estrutura do Artigo

### H1 — Título Principal
Formato: `As N Melhores [Produto] para [Contexto] em [Ano]`
- KW primária exata obrigatória no H1
- Número de produtos no título aumenta CTR

### Introdução (bloco H1 — 3 a 4 parágrafos)
- Parágrafo 1: KW primária na 1ª linha + problema que o produto resolve
- Parágrafo 2: contexto de uso + por que a escolha importa
- Parágrafo 3: metodologia de seleção
- Parágrafo 4 (opcional): gancho para a lista

> REGRA: Cada parágrafo entre 4 e 5 linhas. Nunca abaixo de 4, nunca acima de 5.

---

### Tabela de Decisão Rápida (OBRIGATÓRIA — logo após a introdução)

| PRODUTO | MELHOR PARA | COMPRAR |
|---|---|---|
| **[Produto 1 — MAIS BARATO]** | 💵 MELHOR CUSTO DE ENTRADA — *[frase descritiva]* | **▶ VER NA AMAZON** / **▶ VER NO MERCADO LIVRE** |
| **[Produto 2 — CUSTO-BENEFÍCIO]** | 💰 MELHOR CUSTO-BENEFÍCIO — *[frase descritiva]* | **▶ VER NA AMAZON** / **▶ VER NO MERCADO LIVRE** |
| **[Produto 3 — MAIS CARO]** | 🏆 PREMIUM / TOP DE LINHA — *[frase descritiva]* | **▶ VER NA AMAZON** / **▶ VER NO MERCADO LIVRE** |
| ... demais produtos por relevância ... | | |

> REGRA DE ORDEM (OBRIGATÓRIA): 1º = mais barato · 2º = melhor custo-benefício · 3º = mais caro.
> Sempre nessa ordem. Os demais (4º+) seguem por relevância.
> REGRA: Inserir imediatamente após a introdução, antes do primeiro H2 de produto.
> REGRA: a coluna COMPRAR é um BOTÃO CLICÁVEL com o link de afiliado real (não texto).

---

### H2 — [N] Melhores [Produto] para [Contexto] em [Ano] (introdução da lista)
- KW primária na 1ª linha do 1º parágrafo
- Mínimo 2 parágrafos explicando a metodologia de seleção
- Transição para a lista de produtos

---

### H2 #1 — [Nome completo do Produto 1]

**Layout 2 colunas:**

| [ IMAGEM DO PRODUTO ] | Texto descritivo do produto |
|---|---|
| 1250 × 650 px · 16:9 | Parágrafo 1: KW primária na 1ª linha + destaque principal (4-5 linhas) |
| ALT: [KW primária + nome produto] | Parágrafo 2: tecnologias e diferenciais (4-5 linhas) |
| Foto: Divulgação / Amazon | Parágrafo 3: para quem é indicado (4-5 linhas) |
| | **Marca:** [Nome] |

**⭐ Avaliações: X,X estrelas (N avaliações)**
*Avaliações coletadas em [mês/ano]. Os números podem variar.*

### Prós e Contras

> Formato HTML (Clássico): duas caixas coloridas lado a lado (verde/vermelho), com os
> rótulos "Prós" e "Contras" como H3 (`<h3>`), nunca `<strong>`. Ver o HTML no redator-blog-fdf.
> Formato markdown (Gutenberg): rótulos **✅ Prós** / **❌ Contras** em negrito + lista `-`,
> NUNCA H3 (vários produtos = títulos duplicados = gate bloqueia). Ver ETAPA 5.5 do redator.

- ✅ Prós: [Diferencial 1], [Diferencial 2], [Diferencial 3]
- ❌ Contras: [Limitação 1 — baseada em avaliações reais], [Limitação 2]

#### Especificações Técnicas

| Especificação | Detalhes |
|---|---|
| **[Campo 1]** | [Valor] |
| **[Campo 2]** | [Valor] |
| **[Campo N]** | [Valor] |

| **▶ VER NA AMAZON** | **▶ VER NO MERCADO LIVRE** |

---

> REPETIR estrutura H2 para cada produto da lista (#2, #3... #N)

---

### H2 FAQ — Perguntas Frequentes (ÚLTIMO H2 OBRIGATÓRIO)

> REGRA: FAQ é obrigatoriamente o último H2. Cada pergunta = H3. Respostas máximo 300 caracteres.

#### H3: [Pergunta 1 — dúvida real de compra]
Resposta direta, máximo 300 caracteres. Rich Snippet ready.

#### H3: [Pergunta 2]
Resposta direta, máximo 300 caracteres.

*(Mínimo 4 perguntas · Máximo 6)*

---

### H2 Final — Qual é a Certa para Você? (guia de decisão + conclusão)
- Recapitulação com guia de decisão por perfil
- Formato: lista com setas → mapeando perfil → produto recomendado
- CTA natural no final

**GUIA RÁPIDO DE DECISÃO:**
→ [Perfil 1] → [Produto recomendado] ([especificação])
→ [Perfil 2] → [Produto recomendado] ([especificação])
→ [Perfil N] → [Produto recomendado] ([especificação])

---

## Meta Tags

```
META TITLE (até 60 caracteres):
[As N Melhores [Produto] para [Contexto] em [Ano]]

META DESCRIPTION (até 155 caracteres):
[Selecionamos as N melhores [produto] para [contexto]. Veja qual modelo tem o melhor custo-benefício e compre sem arrependimento.]

ALT IMAGEM PRINCIPAL: [KW primária exata]
ALT IMAGEM PRODUTO: [KW primária] + [nome do modelo]
```

---

## Regras do Agente — Pode / Não Pode

### ✅ PODE / DEVE
- Usar H2 para cada produto com mínimo 2 parágrafos obrigatórios
- FAQ obrigatoriamente como último H2
- Tabela de decisão rápida imediatamente após a introdução
- Layout 2 colunas: imagem (esq) + texto descritivo (dir) por produto
- Badge de avaliação com data de coleta por produto
- Bloco Prós e Contras em 2 colunas lado a lado
- Tabela de especificações técnicas por produto
- CTA duplo (Amazon + Mercado Livre) após specs de cada produto
- Contras baseados em relatos reais de compradores verificados
- Máximo 2 listas de bullets em todo o artigo
- Tom de analista/testador — não vendedor nem fabricante

### ❌ NÃO PODE
- Criar H2 sem autorização da estrutura aprovada
- H2 com apenas 1 parágrafo
- FAQ em qualquer posição que não seja o último H2
- Parágrafos com menos de 4 linhas ou mais de 5 linhas em H1/H2
- Keyword stuffing — densidade da KW primária acima de 1% (a faixa correta é 0,5% a 1%)
- Omitir tabela de decisão rápida no topo
- Omitir badge de avaliação ou data de coleta
- Contras inventados sem base em avaliações reais
- Mais de 2 listas de bullets no artigo
- Tom de vendedor ou fabricante
- Copiar frases ou estruturas de concorrentes

---

## Checklist Final de Publicação

### Estrutura e Títulos
- [ ] H1 único com KW primária no título
- [ ] KW primária na 1ª linha do 1º parágrafo do H1
- [ ] KW primária na 1ª linha do 1º parágrafo de cada H2
- [ ] FAQ é o último H2 do artigo
- [ ] Todos os H2 de produto têm mínimo 2 parágrafos
- [ ] Parágrafos H1/H2: entre 4 e 5 linhas (nunca <4 nem >5)
- [ ] Parágrafos H3: entre 2 e 4 linhas

### Densidade e Semântica
- [ ] Densidade da KW primária entre 0,5% e 1% do total de palavras (ex.: artigo de 4.000 palavras = 20 a 40 usos da KW primária)
- [ ] KW primária distribuída em todos os blocos H2
- [ ] Cada KW secundária usada mínimo 2x em blocos H2 distintos
- [ ] Campo semântico (LSI) presente

### Layout de Produto
- [ ] Layout 2 colunas: imagem (esq) + texto descritivo (dir) em cada produto
- [ ] Imagem: 1250x650 px · proporção 16:9 · ALT com KW primária + nome do modelo
- [ ] Legenda: "Foto: Divulgação / Amazon" em itálico
- [ ] Texto descritivo: 3 parágrafos com negrito nos diferenciais técnicos
- [ ] Marca informada ao final do texto descritivo
- [ ] Badge de avaliação presente: ⭐ X estrelas (N avaliações) + data de coleta

### Tabela de Decisão Rápida
- [ ] Tabela inserida imediatamente após a introdução
- [ ] 3 colunas: Produto | Melhor Para (emoji + label) | Comprar
- [ ] CTA duplo na coluna Comprar: Amazon + Mercado Livre

### Prós, Contras e Specs
- [ ] Bloco Prós e Contras presente em cada produto (2 colunas)
- [ ] Contras baseados em relatos reais de compradores verificados
- [ ] Tabela de especificações técnicas presente em cada produto
- [ ] CTA duplo (Amazon + Mercado Livre) após specs de cada produto

### GEO / AEO / E-E-A-T
- [ ] FAQ com respostas de máximo 300 caracteres por H3
- [ ] Tabela de decisão rápida no topo (GEO)
- [ ] Guia de decisão final com setas → perfil → produto
- [ ] Dados de avaliação com fonte e data (E-E-A-T)
- [ ] Disclaimer de afiliado presente no rodapé

### Meta Tags e Imagem
- [ ] Meta Title: até 60 caracteres + KW primária
- [ ] Meta Description: até 155 caracteres + KW primária + CTA
- [ ] ALT da imagem principal: KW primária exata
- [ ] ALT de cada produto: KW primária + nome do modelo
- [ ] Imagem proporção 16:9 · 1250x650 px
