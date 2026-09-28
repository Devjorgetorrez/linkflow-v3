---
name: blog-search-guia
type: template
intent: guia-definitivo
trigger: "o que é X, guia completo de X, tudo sobre X, X para iniciantes, X do básico ao avançado"
monetization: cta-multiplo
version: 1.0
word_count:
  min: 4000
  max: 12000
  ideal: "6000–8000"
cluster_strategy:
  type: pillar
  note: "este artigo é o hub — deve linkar para TODOS os clusters do tema"
internal_links:
  min_per_article: 8
  max_per_article: 20
  required: [clusters, paginas-servico, outros-guias-relacionados]
  cluster_links: obrigatorio
schema_markup:
  required: [Article]
  conditional:
    howto: quando houver passo a passo
    faqpage: quando houver FAQ
    definedterm: para definições no topo
    speakablespec: para partes AEO-ready
    breadcrumb: sempre
eeat:
  autor: obrigatorio
  revisor: obrigatorio
  atualizacao_minima: semestral
cta_type: multiplo
cta_appearances: {min: 3, max: 6}
---

# Template: Blog Search Guia (Pillar Page)
> Referência: Conversion (conversion.com.br) — "O que é SEO" — 99 min de leitura
> Monetização: CTA soft + material rico + ferramenta · Versão: 1.0 · Junho 2026

---

## Guia vs Informacional — Diferenças Críticas

| ATRIBUTO | Blog Search Informacional | Blog Search Guia |
|---|---|---|
| Objetivo | Responder 1 query | **Dominar um tema completo** |
| Word count | 1.500–4.000 | **4.000–12.000+** |
| H2s | 5–10 | **10–20+** |
| Uso de H4 | Raro | **Frequente** |
| Links internos | 3–8 | **8–20** |
| Atualização | Anual | **Semestral** |

---

## Quando Usar

| Situação | Template correto |
|---|---|
| "o que é SEO" — guia do zero ao avançado | ✅ Blog Search Guia |
| "como funciona o rastreamento do Google" | Blog Search Informacional |
| "SEO técnico: guia definitivo" | ✅ Blog Search Guia |
| "como usar o Google Search Console" | Blog Search Informacional |

---

## Elementos Técnicos

```
[ TITLE TAG ]  até 60 chars · head term · subtítulo · ano
[ META DESCRIPTION ]  até 155 chars · definição concisa · benefício
[ URL / SLUG ]  /head-term-curto (SEM 'guia' ou 'completo' — desatualiza)
[ SCHEMA Article ]  author · reviewedBy · datePublished · dateModified · wordCount
[ SCHEMA DefinedTerm ]  para a definição no topo
[ SCHEMA FAQPage ]  para o FAQ final
[ SCHEMA HowTo ]  para seções passo a passo
[ SCHEMA SpeakableSpec ]  para parágrafos AEO-ready
[ SCHEMA BreadcrumbList ]  sempre
[ OG TAGS ]  og:title · og:description · og:image (1600×900)
```

---

## Estrutura do Artigo

### Imagem Principal
- 1250×650 px · 16:9 · ALT: head term exato

### Metadados Visíveis
📅 Publicado · 🔄 ⚡ Atualizado em [mês/ano] · ⏱ X min de leitura

### Bloco Autor + Revisor
- Autor: nome + cargo + empresa + link bio
- Revisor: nome + registro profissional

### H1 — Título Principal
Formato: `[Head term] para Iniciantes: o que é [sigla/tema] e como [benefício]`

### Definição em Destaque Visual (OBRIGATÓRIO — logo após H1)

| **[SIGLA/TERMO]** | **[Definição em 1-2 frases autocontidas · AEO/GEO/Featured Snippet ready]** |
|---|---|
| | [Contexto adicional: o que não é + 3 pilares principais] |

> REGRA: Esta definição é o que as IAs generativas extraem como resposta. Deve ser autocontida.

### Introdução (3 parágrafos · 4-5 linhas)
- Parágrafo 1: ampliação da definição com pilares/componentes
- Parágrafo 2: para que serve + quem usa + por que importa
- Parágrafo 3: o que o leitor vai encontrar neste guia
- [INTERNAL-LINK #1] → página de serviço (CTA soft)

### Summary Box / Índice — BANIDO (não criar)
NÃO criar índice/TOC "Neste guia você vai ver" (regras-formatacao.md). Ir direto ao desenvolvimento.

---

### H2: O que não é [head term] — diferenciação conceitual
- Resposta direta na 1ª linha (GEO)
- H3 para cada conceito confundido
- Tabela comparativa: X vs conceito confundido

---

### H2: Como [head term] funciona
- Resposta direta na 1ª linha
- H3: [Componente 1] → 2-4 linhas · AEO ready
- H3: [Componente 2]
- H3: [Componente 3]
- [CTA MATERIAL RICO #1] — ebook/guia relacionado
- [INTERNAL-LINK #2] → cluster correspondente

---

### H2: [Pilares / Tipos / Categorias do tema]
- H3: [Pilar 1] → definição + aplicação + link cluster
- H3: [Pilar 2]
- H3: [Pilar 3]
- Tabela comparativa dos pilares

---

*(Repetir para cada H2 temático — 8 a 18 H2 no total)*

**REGRA POR H2:**
- KW primária ou variação na 1ª linha
- Mínimo 300 palavras por H2
- H3 para cada subtópico interno
- H4 para detalhes específicos dentro do H3
- [INTERNAL-LINK] para o cluster do subtema quando existir

---

### H2: [Como começar / Passo a passo] → Schema HowTo
- H3: Passo 1 — [ação concreta]
- H3: Passo 2 — [ação concreta]
- H3: Passo 3 — [ação concreta]

---

### H2: Ferramentas de [head term] ← OBRIGATÓRIO NO GUIA

#### Tabela de Ferramentas

| Ferramenta | Tipo / Custo | Para que serve |
|---|---|---|
| **[Ferramenta 1]** | Gratuito | [Descrição objetiva] |
| **[Ferramenta 2]** | Freemium | [Descrição objetiva] |
| **[Ferramenta N]** | Pago | [Descrição objetiva] |

> REGRA: Ferramentas próprias da empresa no topo. Máximo 10 por tabela.
- [INTERNAL-LINK] → artigo cluster de ferramentas

---

### H2: Como medir / Métricas de [head term] (quando aplicável)
- H3: [Métrica 1] → definição + como calcular
- H3: [Métrica 2]

---

### [CTA SOFT ou MATERIAL RICO #2]

---

### H2: Tendências de [head term] em [ano] — freshness signal
- Dados atuais com fonte e data

---

### H2: Conclusão
- KW primária · recapitulação em 1-2 parágrafos
- [CTA FINAL: serviço, curso ou ferramenta]
- [INTERNAL-LINK final] → pillar relacionado ou serviço

---

### H2: Perguntas Frequentes sobre [head term] ← ÚLTIMO H2 OBRIGATÓRIO

> 5-8 perguntas gerais do tema · respostas em bullets máximo 300 caracteres

#### H3: [Pergunta 1 — definição]
- [Bullet 1]
- [Bullet 2]
- [Bullet 3]

*(Repetir para cada pergunta)*

---

## Mapa Pillar → Clusters (planejar antes de escrever)

| H2 / Subtema do Guia | Artigo Cluster | Âncora sugerida |
|---|---|---|
| **H2: [Subtema 1]** | Artigo: [título do cluster] | *[âncora natural]* |
| **H2: [Subtema 2]** | Artigo: [título do cluster] | *[âncora natural]* |
| **H2: [Subtema N]** | Artigo: [título do cluster] | *[âncora natural]* |

---

## Meta Tags

```
META TITLE (até 60 caracteres):
[Head term] para Iniciantes: o que é e como [benefício] [ano]

META DESCRIPTION (até 155 caracteres):
[Head term] é [definição concisa]. Aprenda tudo sobre [subtema 1], [subtema 2] e estratégias.
```

---

## Regras do Agente — Pode / Não Pode

### ✅ PODE / DEVE
- 4.000-12.000+ palavras — mínimo 300 palavras por H2
- Definição visual no topo logo após o H1
- 10 a 20 H2 cobrindo todos os subtemas
- H4 para detalhar H3 quando necessário
- FAQ como último H2 com 5-8 perguntas
- Link interno para o cluster em CADA H2 que tem artigo satélite
- 8 a 20 internal links — rede de cluster completa
- Seção dedicada de ferramentas obrigatória (tabela)
- 3 a 6 CTAs: soft + material rico + ferramenta
- CTA Material Rico com bloco visual destacado
- Ferramentas próprias da empresa no topo
- Atualização semestral — "⚡ Atualizado em [mês/ano]" visível
- Autor com cargo + empresa + link bio
- Revisor com registro profissional
- Parágrafos H1/H2: 4-5 linhas · H3: 2-4 linhas

### ❌ NÃO PODE
- Artigo abaixo de 4.000 palavras chamado de "guia"
- Definição enterrada em parágrafo corrido
- Menos de 8 H2 em um guia definitivo
- H2 sem link para o cluster correspondente
- Menos de 8 links internos
- Ferramentas mencionadas apenas pontualmente
- Apenas 1 CTA soft no guia inteiro
- Guia sem atualização por mais de 12 meses
- URL com "guia" ou "completo": /guia-completo-de-X

---

## Checklist Final de Publicação

### Elementos Técnicos
- [ ] Title Tag: head term no início · subtítulo · ano
- [ ] Meta Description: definição concisa
- [ ] URL: /head-term-curto (sem "guia" ou "completo")
- [ ] Schema Article + DefinedTerm + FAQPage + SpeakableSpec
- [ ] Schema HowTo para seções passo a passo
- [ ] Schema BreadcrumbList

### Profundidade e Estrutura
- [ ] Word count: mínimo 4.000 · mínimo 300 por H2
- [ ] Definição em destaque visual logo após H1
- [ ] 10 a 20 H2 cobrindo todos os subtemas
- [ ] H3 para cada subtópico · H4 para detalhes
- [ ] FAQ como ÚLTIMO H2 — 5 a 8 perguntas
- [ ] Hierarquia respeitada: H1→H2→H3→H4

### Pillar + Cluster
- [ ] Mapa de links planejado
- [ ] 8 a 20 internal links
- [ ] Link para cluster em cada H2 com artigo satélite
- [ ] Links para páginas de serviço

### Ferramentas e CTAs
- [ ] Seção de ferramentas presente (tabela)
- [ ] Ferramentas próprias no topo
- [ ] 3 a 6 CTAs (soft + material rico + ferramenta)
- [ ] CTA Material Rico com bloco visual

### E-E-A-T e Atualização
- [ ] Autor: nome + cargo + empresa + link bio
- [ ] Revisor com registro profissional
- [ ] "⚡ Atualizado em [mês/ano]" visível
- [ ] Schema dateModified atualizado
- [ ] Próxima atualização agendada (semestral)

### AEO e FAQ
- [ ] FAQ: 5-8 perguntas do tema
- [ ] Respostas em bullets máximo 300 caracteres
- [ ] H3 AEO internos nos H2 técnicos
- [ ] Schema FAQPage implementado
