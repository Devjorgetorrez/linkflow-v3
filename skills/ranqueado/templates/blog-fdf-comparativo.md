---
name: blog-fdf-comparativo
type: template
intent: comparativo
trigger: "X vs Y, comparativo, qual é melhor, diferença entre X e Y"
monetization: cta-por-produto
platforms: [amazon, mercadolivre, loja-oficial]
version: 1.0
word_count:
  min: 1800
  max: 2800
  note: "artigos comparativos muito longos diluem a intenção — mantenha foco"
internal_links:
  min_per_article: 2
  max_per_article: 4
  required_in: [intro, produto_a_ou_b, conclusion]
  target_types: [pillar, review-individual, comparison]
---

# Template: Blog FDF Comparativo (A vs B)
> Referência: melhores.com — "iPhone 17 Pro Max vs Samsung Galaxy S25 Ultra"
> Monetização: CTA por produto (Amazon / ML / loja oficial) · Versão: 1.0 · Junho 2026

---

## Quando Usar

| Situação | Usar? |
|---|---|
| Usuário pesquisa "X vs Y" ou "qual é melhor X ou Y" | ✅ SIM |
| Dois produtos do mesmo nicho, faixas de preço próximas | ✅ SIM |
| Lista de mais de 2 produtos | ❌ NÃO — usar blog-fdf-review |
| Review de 1 produto único | ❌ NÃO — usar blog-fdf-produto-unico |
| Produtos de nichos diferentes | ❌ NÃO — comparativo sem sentido |

---

## Frontmatter do Artigo Gerado

```
name: blog-fdf-comparativo
intent: comparativo
trigger: "X vs Y, comparativo, qual é melhor, diferença entre X e Y"
monetization: cta-por-produto
word_count: {min: 1800, max: 2800}
```

---

## Estrutura do Artigo

### H1 — Título Principal
Formato: `[Produto A] vs [Produto B]: Qual [Categoria] Escolher em [Ano]?`
- KW primária = query comparativa exata
- Formato "qual escolher" gera CTR superior

### Hero Comparativo (OBRIGATÓRIO — logo após H1 ou após intro)

| 📱 PRODUTO A | VS | 📱 PRODUTO B |
|---|---|---|
| [ imagem 1:1 · 400×400 px ] | **VS** | [ imagem 1:1 · 400×400 px ] |
| ALT: [KW primária + Produto A] | *Comparativo Completo* | ALT: [KW primária + Produto B] |
| **[Nome Produto A]** | | **[Nome Produto B]** |
| a partir de R$ [valor] | | a partir de R$ [valor] |
| **▶ IR PARA A LOJA** | | **▶ IR PARA A LOJA** |

### Introdução (3 parágrafos)
- Parágrafo 1: KW primária na 1ª linha + contexto do comparativo (4-5 linhas)
- Parágrafo 2: quem deve ler + o que vai encontrar (4-5 linhas)
- Parágrafo 3: proposta de valor + metodologia (4-5 linhas)
- [INTERNAL-LINK #1] → pillar da categoria

---

### H2: Especificações: [Produto A] vs [Produto B]
- KW primária na 1ª linha · mínimo 2 parágrafos contextuais

#### Tabela de Especificações Comparativa (3 colunas)

| ESPECIFICAÇÃO | **[Produto A]** | **[Produto B]** |
|---|---|---|
| [Campo 1] | [Valor A] | [Valor B] |
| [Campo 2] | [Valor A] | [Valor B] |
| [Campo N] | [Valor A] | [Valor B] |
| **Preço inicial** | R$ [valor] | R$ [valor] |

| **▶ IR PARA A LOJA** | | **▶ IR PARA A LOJA** |

---

### H2: Prós e Contras: [Produto A] vs [Produto B]
- KW primária na 1ª linha · mínimo 2 parágrafos contextuais

#### Bloco 4 Quadrantes (Prós/Contras lado a lado)

| **[Produto A]** | **[Produto B]** |
|---|---|
| **▶ IR PARA A LOJA** | **▶ IR PARA A LOJA** |
| **✅ Prós — [Produto A]** | **✅ Prós — [Produto B]** |
| • [Diferencial 1] | • [Diferencial 1] |
| • [Diferencial 2] | • [Diferencial 2] |
| **❌ Contras — [Produto A]** | **❌ Contras — [Produto B]** |
| • [Limitação 1 — baseada em avaliações reais] | • [Limitação 1 — baseada em avaliações reais] |
| **▶ IR PARA A LOJA** | **▶ IR PARA A LOJA** |

---

### H2: Avaliação: [Produto A] vs [Produto B]
- KW primária na 1ª linha · mínimo 2 parágrafos contextuais

#### Tabela de Scores por Critério

| CRITÉRIO | [Produto A] | [Produto B] |
|---|---|---|
| **[Critério 1]** | **X.X** ██████████ | **X.X** ██████████ |
| **[Critério 2]** | **X.X** █████████░ | **X.X** ██████████ |
| **[Critério N]** | **X.X** ████████░░ | **X.X** ██████████ |

> REGRA: Nunca dar nota máxima (10) para os dois produtos no mesmo critério. Mínimo 4 critérios · Máximo 7.

---

### H2: Mais sobre [Produto A]
- KW primária na 1ª linha
- Layout 2 colunas: imagem 400×400 (esq) + texto analítico (dir)
- 2 parágrafos analíticos (4-5 linhas cada)
- Depoimentos reais em itálico com 💬
- Diferenciais em lista • em relação ao rival
- CTA (Amazon + ML)
- [INTERNAL-LINK #2] → review individual do Produto A

#### H3: O que os consumidores falam do [Produto A]?
3-5 depoimentos em itálico (avaliações reais)

#### H3: Diferenciais do [Produto A] em relação ao [Produto B]
3-5 bullets com diferenciais objetivos

---

### H2: Mais sobre [Produto B]
*(mesmo padrão da seção do Produto A)*
- [INTERNAL-LINK #3] → review individual do Produto B

---

### H2: Conclusão — Qual é o Melhor [Categoria] de [Ano]?
- KW primária obrigatória na 1ª linha
- Parágrafo 1: recapitulação do comparativo (4-5 linhas)
- **Vencedor declarado** (obrigatório — nunca "empate" ou "depende")
- Parágrafo 2: quando o perdedor é a melhor escolha (4-5 linhas)
- CTA natural no final + [INTERNAL-LINK #4]

#### Bloco Vencedor (elemento visual destacado)

| 🏆 VENCEDOR DA COMPARAÇÃO |
|---|
| **[Nome do Produto Vencedor]** |
| *[Motivo objetivo em 1 frase]* |
| **▶ IR PARA A LOJA** |

---

### H2: Perguntas Frequentes sobre [Produto A] vs [Produto B] ← ÚLTIMO H2 OBRIGATÓRIO

> REGRA: FAQ obrigatoriamente o último H2. Mínimo 4 perguntas · Máximo 6.
> Respostas em bullets: 3-5 itens · máximo 300 caracteres.

#### H3: [Pergunta 1 — qual é melhor?]
- [Bullet 1]
- [Bullet 2]
- [Bullet 3]

*(Repetir para cada pergunta)*

---

## Meta Tags

```
META TITLE (até 60 caracteres):
[Produto A] vs [Produto B]: Qual Escolher?

META DESCRIPTION (até 155 caracteres):
[Produto A] ou [Produto B]? Comparamos [critério 1], [critério 2] e preço. Descubra qual é o melhor [categoria] de [ano].
```

---

## Regras do Agente — Pode / Não Pode

### ✅ PODE / DEVE
- 1 único H1 com KW primária exata + "Qual escolher?"
- FAQ obrigatoriamente como último H2
- Mínimo 2 parágrafos por H2
- H2 individual para cada produto (Mais sobre A · Mais sobre B)
- Hero 3 colunas: A | VS | B — imediatamente após intro ou antes
- Imagens dos produtos: 400×400 px · ALT com KW + modelo
- Tabela specs 3 colunas com cores A e B + CTA acima/abaixo
- Prós/contras em 4 quadrantes com CTA topo e rodapé
- Scores de avaliação com barras visuais por critério
- Vencedor declarado com motivo objetivo + CTA
- Depoimentos em itálico com 💬 baseados em avaliações reais
- Aviso editorial/afiliado no rodapé
- Parágrafos H1/H2: 4-5 linhas · H3: 2-4 linhas

### ❌ NÃO PODE
- Mais de 1 H1 no artigo
- FAQ em qualquer outra posição
- H2 com apenas 1 parágrafo
- Parágrafos fora do range
- Misturar os dois produtos no mesmo H2 analítico
- "Empate" ou "depende" como vencedor — vago e inútil
- Vencedor sem CTA — perde a conversão
- Depoimentos inventados sem base em avaliações reais
- Especificações estimadas ou imprecisas
- Meta Title acima de 60 chars
- Meta Description sem CTA ou sem KW

---

## Checklist Final de Publicação

### Frontmatter e Identidade
- [ ] Word count entre 1.800 e 2.800 palavras
- [ ] Comparativo justificado: 2 produtos do mesmo nicho

### Palavra-Chave Primária
- [ ] KW primária ([A] vs [B]) no H1
- [ ] KW primária na 1ª linha do 1º parágrafo
- [ ] KW primária na 1ª linha de cada H2
- [ ] Densidade atingida: total ÷ 125
- [ ] KW no Meta Title, Meta Description e ALT da capa

### Estrutura
- [ ] 1 único H1
- [ ] FAQ é o ÚLTIMO H2
- [ ] Todos os H2 com mínimo 2 parágrafos
- [ ] Parágrafos H1/H2: 4-5 linhas · H3: 2-4 linhas

### Hero Comparativo
- [ ] Hero 3 colunas presente
- [ ] Produto A: imagem 400×400 + preço + CTA
- [ ] Produto B: imagem 400×400 + preço + CTA
- [ ] ALT das imagens: KW primária + modelo

### Tabela de Specs
- [ ] Tabela 3 colunas com diferenciação visual A e B
- [ ] CTA acima E abaixo da tabela
- [ ] Dados extraídos de fonte oficial

### Prós e Contras
- [ ] Bloco 4 quadrantes (Prós A | Prós B / Contras A | Contras B)
- [ ] CTA de cada produto no topo e rodapé do bloco
- [ ] Contras baseados em avaliações reais

### Avaliação por Critério
- [ ] Tabela de scores com barras visuais
- [ ] 4 a 7 critérios relevantes para o nicho
- [ ] Notas objetivas (0.0-10.0)
- [ ] Nunca nota 10 para os dois no mesmo critério

### Vencedor e Conclusão
- [ ] Vencedor declarado explicitamente com motivo objetivo
- [ ] CTA do vencedor em destaque
- [ ] Menção de quando o perdedor é a melhor escolha
- [ ] KW primária na conclusão

### FAQ
- [ ] 4-6 perguntas no FAQ
- [ ] Respostas em bullets: 3-5 itens · máximo 300 caracteres
- [ ] Linguagem direta (AEO ready)

### Meta e Links
- [ ] Meta Title: ≤60 chars · KW primária
- [ ] Meta Description: ≤155 chars · KW · CTA
- [ ] 2-4 internal links nos blocos corretos
- [ ] Aviso editorial/afiliado no rodapé
