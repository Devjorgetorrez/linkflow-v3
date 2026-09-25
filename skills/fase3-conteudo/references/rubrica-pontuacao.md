# Rubrica de Pontuação — claude-ranqueado
> Referência carregada sob demanda pelo orquestrador e pelo agente `ranqueado-reviewer`.
> Versão: 1.0 | Junho 2026

---

## Sistema de Pontuação 0-100

Todo conteúdo gerado ou analisado pelo `claude-ranqueado` é pontuado em 5 categorias.
A pontuação total determina se o conteúdo é entregue, iterado ou bloqueado.

---

## Categorias e Pesos

| Categoria | Pontos | O que avalia |
|---|---|---|
| **1. Qualidade do Conteúdo** | 30 | Profundidade, originalidade, estrutura, clareza |
| **2. Otimização SEO** | 25 | Headings, keywords (KW em cada H2), meta title/description |
| **3. GEO + AEO** | 15 | Citabilidade por IA, FAQ, respostas diretas |
| **4. Conversão Local** | 20 | CTAs de contato, NAP, regiões atendidas, intenção transacional |
| **5. Técnico** | 10 | Schema, imagens, formato, Discover-ready |
| **TOTAL** | **100** | |

---

## Categoria 1 — Qualidade do Conteúdo (30 pts)

| Subcritério | Pontos | Quando pontua máximo |
|---|---|---|
| Profundidade e cobertura do tema | 10 | Cobre o tema completamente, sem lacunas relevantes |
| Originalidade (não é paráfrase de concorrentes) | 8 | Traz perspectiva própria, dados próprios ou ângulo novo |
| Estrutura lógica e fluxo | 7 | Hierarquia clara, progressão natural, sem saltos |
| Clareza e leiturabilidade | 5 | Parágrafos H1/H2 de 4-5 linhas (nunca <4 nem >5); parágrafos H3 de 2-4 linhas; FAQ até 300 caracteres; linguagem acessível (regra do template) |

**Problemas P0 (bloqueantes):**
- Conteúdo copiado ou parafraseado de concorrentes
- Informações factualmente incorretas sem fonte
- Estrutura incoerente ou sem progressão lógica

---

## Categoria 2 — Otimização SEO (25 pts)

| Subcritério | Pontos | Quando pontua máximo |
|---|---|---|
| Palavra-chave principal (presença e distribuição) | 11 | No H1, no 1º parágrafo do H1, no 1º parágrafo de CADA H2 (regra do template), na meta descrição, na slug e no title SEO |
| Palavras-chave secundárias e semânticas | 6 | Distribuídas naturalmente ao longo do texto |
| Hierarquia de headings (H1 > H2 > H3) | 5 | Nunca pula nível, H1 único, H2s cobrem intenções secundárias |
| Meta title e meta description | 3 | Title até 60 chars com KW, description até 155 chars com CTA |

**Problemas P0 (bloqueantes):**
- H1 ausente ou múltiplos H1s
- Keyword stuffing (densidade da KW primária fora da faixa 0,5%-1%)
- Meta title acima de 60 caracteres

---

## Categoria 3 — GEO + AEO (15 pts)

| Subcritério | Pontos | Quando pontua máximo |
|---|---|---|
| Formato resposta-primeiro em cada H2 | 7 | Cada seção começa com resposta direta de 1-2 frases |
| FAQ estruturada (mínimo 4 perguntas, máximo 6) | 5 | Perguntas reais de PAA; respostas diretas de ~40-60 palavras, NO MÁXIMO 300 caracteres (regra do template). Mínimo 4 perguntas (não 3) |
| Entidades e contexto semântico | 3 | Pessoas, lugares, marcas e conceitos nomeados corretamente |

**Problemas P0 (bloqueantes):**
- Nenhuma resposta direta nas seções principais
- FAQ ausente em conteúdo informacional

---

## Categoria 4 — Conversão Local (20 pts)

| Subcritério | Pontos | Quando pontua máximo |
|---|---|---|
| CTA de contato específico e repetido (WhatsApp/telefone/formulário, mín. 3x, nunca genérico) | 6 | CTA de contato aparece no mínimo 3 vezes, com dado real (número/link/formulário) |
| NAP presente e consistente (Nome+Endereço+Telefone) | 5 | NAP completo e idêntico ao Google Business Profile |
| H2 de Regiões Atendidas presente e dedicado | 5 | Seção exclusiva listando bairros/cidades atendidas |
| Intenção transacional de captação de lead (não informacional, não venda de produto) | 4 | Página orienta o visitante a entrar em contato, não a comprar produto nem apenas ler |

**Problemas P0 (bloqueantes):**
- CTA de contato ausente ou genérico ("entre em contato" sem número/link)
- NAP ausente ou inconsistente com o Google Business Profile

---

## Categoria 5 — Técnico (10 pts)

| Subcritério | Pontos | Quando pontua máximo |
|---|---|---|
| Schema JSON-LD presente (BlogPosting ou FAQPage) | 4 | Schema correto para o tipo de conteúdo |
| Imagens com alt text descritivo | 3 | Toda imagem tem alt com contexto + keyword quando natural |
| Formato e output corretos | 2 | Arquivo .md limpo, frontmatter completo |
| Discover-ready (título + imagem cativantes) | 1 | Título gera curiosidade; imagem hero acima de 1200x630px |

**Problemas P0 (bloqueantes):**
- Imagens sem alt text
- Frontmatter ausente ou incompleto

---

## Bandas de Qualidade

| Score | Banda | Ação do Sistema |
|---|---|---|
| **90-100** | ⭐ Excepcional | Entrega a você — GREEN |
| **80-89** | ✅ Forte | Itera uma vez para tentar 90+ |
| **70-79** | ⚠️ Aceitável | Itera com foco nos gaps identificados |
| **60-69** | ❌ Abaixo do padrão | Itera até 3x; se não atingir 90, escala para o usuário |
| **< 60** | 🔴 Reescrever | Bloqueia e escala imediatamente |

---

## Regra do Reviewer (Gate 4 — BLOQUEANTE)

O agente `ranqueado-reviewer` bloqueia a entrega se:

1. Score total < 90
2. Qualquer problema P0 identificado em qualquer categoria
3. Conteúdo com indícios de cópia ou paráfrase direta
4. Página transacional escrita como informacional (ou vice-versa) — intenção de conversão local ausente

**Formato de saída obrigatório do reviewer:**
```
BLOCKING: true|false
Score: XX/100
Categoria mais fraca: [nome] (XX/YY pts)
Problemas P0: [lista ou "nenhum"]
Recomendação: [ação específica para próxima iteração]
```

**O sistema itera até 3 vezes antes de escalar para o usuário.**

---

## Como Carregar Esta Referência

Carregar quando: `/ranqueado analisar`, `/ranqueado escrever` (gate 4), `/ranqueado reescrever` (gate 4)

```
Arquivo: skills/ranqueado/references/rubrica-pontuacao.md
```
