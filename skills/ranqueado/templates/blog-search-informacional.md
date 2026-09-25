---
name: blog-search-informacional
type: template
intent: informacional
trigger: "como X, o que é X, guia de X, passo a passo X, quanto custa X, diferença entre X e Y"
monetization: cta-soft-lead
version: 1.0
word_count:
  min: 1500
  max: 4000
  ideal_por_tipo:
    passo_a_passo: "1500–2500"
    guia_completo: "2000–3000"
    pillar_page: "3000–4000"
internal_links:
  min_per_article: 3
  max_per_article: 8
  target_types: [outros-artigos-blog, pagina-transacional, pillar, supporting]
schema_markup:
  required: [Article]
  conditional:
    howto: "quando for passo a passo"
    faqpage: "quando tiver FAQ"
    breadcrumb: "sempre"
eeat:
  autor_obrigatorio: true
  revisor_obrigatorio: true
  data_publicacao: true
  data_atualizacao: true
cta_type: soft
cta_appearances: {min: 1, max: 3}
---

# Template: Blog Search Informacional
> Referência: Contabilizei (contabilizei.com.br) — "Como abrir uma empresa em 2026"
> Monetização: CTA soft contextual — lead para serviço · Versão: 1.0 · Junho 2026

---

## Quando Usar

| Situação | Usar? |
|---|---|
| "como abrir uma empresa" | ✅ SIM — aprender processo |
| "o que é CNPJ" | ✅ SIM — definição/conceito |
| "documentos para abrir empresa" | ✅ SIM — lista/checklist |
| "empresa de contabilidade em SP" | ❌ NÃO — contratar, usar SEO Local |
| "curso de contabilidade online" | ❌ NÃO — comprar, usar Infoproduto |
| "melhores softwares de contabilidade" | ❌ NÃO — comparar, usar Blog FDF Review |

---

## Elementos Técnicos

```
[ TITLE TAG ]  até 60 chars · KW primária · ano
[ META DESCRIPTION ]  até 155 chars · KW + proposta do artigo + CTA soft
[ URL / SLUG ]  /kw-primaria-hifenizada (sem stop words, sem ano)
[ CANONICAL ]  URL canônica
[ SCHEMA Article ]  JSON-LD com author, reviewedBy, datePublished, dateModified
[ SCHEMA HowTo ]  JSON-LD (quando for passo a passo)
[ SCHEMA FAQPage ]  JSON-LD (quando tiver FAQ)
[ SCHEMA BreadcrumbList ]  sempre
[ OG TAGS ]  og:title · og:description · og:image
```

---

## Estrutura do Artigo

### Imagem Principal
- Foto ou ilustração relevante ao tema · 1250×650 px · 16:9
- ALT: KW primária exata

### Metadados Visíveis
📅 Publicado em [data] · 🔄 Atualizado em [data] · ⏱ X min de leitura

### Bloco Autor + Revisor (E-E-A-T obrigatório)
- Escrito por: [Nome] · [Cargo]
- Revisado por: [Nome] · [Registro profissional: CRC/CRM/OAB]

### H1 — Título Principal
Formato: `[KW primária exata] em [ano]: [subtítulo descritivo]`
- 1 único H1 · KW primária exata

### Introdução (3 parágrafos · 4-5 linhas cada)
- Parágrafo 1: KW primária na 1ª linha · **resposta direta à query (GEO)**
- Parágrafo 2: contexto + por que o assunto importa agora
- [INTERNAL-LINK #1] → página de serviço (CTA soft)

### Summary Box / Índice — BANIDO (não criar)
NÃO criar índice/TOC (regras-formatacao.md). A introdução vai direto ao desenvolvimento.

---

### H2: [Bloco temático 1]
- KW primária ou variação na 1ª linha · mínimo 2 parágrafos de 4-5 linhas (regras-formatacao.md)
- Parágrafo 1: **resposta direta ao H2 (GEO)**
- Parágrafo 2: contexto e detalhes

#### H3: [Subtópico 1 / Passo 1]
máximo 300 caracteres · AEO ready · resposta direta ao H2

#### H3: [Subtópico 2 / Passo 2]
2-4 linhas

#### H3: [Subtópico N]
2-4 linhas

- [Citação de especialista quando relevante]
- [INTERNAL-LINK #2] → artigo de blog relacionado

*(Repetir estrutura H2 + H3 para cada bloco temático — 5 a 10 H2 no total)*

---

### CTA Soft Contextual (1ª ou 2ª aparição)
Inserido dentro de 1 bloco H2 relevante (não no topo):

| [Benefício] → [ação: use nossa ferramenta / abra seu CNPJ grátis] | **▶ [CTA]** |

---

### H2: [Tabela comparativa / dados — quando aplicável]
- Dados extraídos de fontes confiáveis com citação

#### Tabela Comparativa

| Característica | [Opção A] | [Opção B] | [Opção C] |
|---|---|---|---|
| [Campo 1] | [Valor] | [Valor] | [Valor] |
| [Campo N] | [Valor] | [Valor] | [Valor] |

---

### H2: Conclusão
- KW primária presente · recapitulação em 1-2 parágrafos
- CTA soft final
- [INTERNAL-LINK #N] → página de serviço ou pillar

---

### H2: Perguntas Frequentes sobre [KW primária] ← ÚLTIMO H2 OBRIGATÓRIO

> REGRA: Perguntas = dúvidas sobre o tema (não objeções de compra)
> Mínimo 4 perguntas · Respostas em bullets · máximo 300 caracteres

#### H3: [Pergunta 1]
- [Bullet 1 — dado específico]
- [Bullet 2]
- [Bullet 3]

*(Repetir para cada pergunta)*

---

## Citação de Especialista (formato)

| 💬 | *"[Citação real com perspectiva única — não repetição do parágrafo]"* |
|---|---|
| | **[Nome do Especialista]** · [Registro profissional] |

---

## Meta Tags

```
META TITLE (até 60 caracteres):
[KW primária] em [ano]: passo a passo completo

META DESCRIPTION (até 155 caracteres):
Veja o [KW primária] completo em [ano]. [Contexto atual relevante]. Guia atualizado e gratuito.
```

---

## Schema Article + HowTo (quando passo a passo)

```json
{
  "@type": "Article",
  "headline": "[Título do artigo]",
  "datePublished": "[data]",
  "dateModified": "[data]",
  "author": {"@type": "Person", "name": "[Nome]"},
  "reviewedBy": {"@type": "Person", "name": "[Nome]", "credential": "[CRC/CRM/OAB]"},
  "wordCount": [número]
}
```

---

## Regras do Agente — Pode / Não Pode

### ✅ PODE / DEVE
- 1 único H1 com KW primária exata + ano quando relevante
- 5 a 10 H2 cobrindo subtemas do tema principal
- FAQ obrigatoriamente como último H2
- H3 para cada subtópico ou passo dentro do H2
- Nunca pular nível: H1→H2→H3→H4
- Resposta direta na 1ª frase de cada H2 (GEO)
- Dados numéricos específicos (R$, %, dias) nas respostas
- FAQ com respostas em bullets máximo 300 caracteres (AEO)
- (NÃO criar summary box / índice — banido por regras-formatacao.md; ir direto ao desenvolvimento)
- Metadados visíveis: data + atualização + tempo de leitura
- Autor identificado com nome, cargo e link para bio
- Revisor com registro profissional
- Citação de especialista real com nome e cargo
- 1-3 CTA soft contextual (não agressivo)
- 3-8 internal links com âncoras descritivas
- Tabela comparativa quando há múltiplas opções
- Parágrafos H1/H2: 4-5 linhas · H3: 2-4 linhas

### ❌ NÃO PODE
- H1 genérico ou sem KW primária
- Menos de 4 H2 (raso)
- FAQ no meio do artigo
- Subtópicos em parágrafo corrido sem H3
- H1 direto para H3 — quebra hierarquia semântica
- Contexto antes da resposta — IAs ignoram
- Respostas vagas: "depende", "varia muito"
- FAQ com respostas em texto corrido
- Artigo sem identificação de autor
- Revisor genérico ou ausente
- CTA agressivo de venda em artigo informacional
- Menos de 3 links internos
- Âncoras genéricas: "clique aqui"
- Artigo abaixo de 1.500 palavras

---

## Checklist Final de Publicação

### Elementos Técnicos
- [ ] Title Tag: até 60 chars · KW primária · ano
- [ ] Meta Description: até 155 chars · KW · CTA soft
- [ ] URL: KW sem stop words · sem ano no slug
- [ ] Schema Article com author, reviewedBy, datePublished, dateModified
- [ ] Schema HowTo (quando passo a passo)
- [ ] Schema FAQPage (quando tiver FAQ)
- [ ] Schema BreadcrumbList
- [ ] Canonical URL definida

### E-E-A-T
- [ ] Autor: nome + cargo + link bio
- [ ] Revisor: nome + registro profissional
- [ ] Data de publicação visível
- [ ] Data de atualização visível
- [ ] Pelo menos 1 citação de especialista

### H1 e Introdução
- [ ] 1 único H1 com KW primária
- [ ] KW na 1ª linha do 1º parágrafo
- [ ] Resposta direta à query na 1ª frase (GEO)
- [ ] (Sem summary box/índice — banido)

### Estrutura
- [ ] 5 a 10 H2
- [ ] FAQ é o ÚLTIMO H2
- [ ] H3 para cada subtópico
- [ ] Todos os H2 com mínimo 2 parágrafos
- [ ] Parágrafos H1/H2: 4-5 linhas · H3: 2-4 linhas
- [ ] Hierarquia respeitada: nunca pular nível

### GEO e AEO
- [ ] Resposta direta na 1ª frase de cada H2 (GEO)
- [ ] Dados numéricos específicos nas respostas-chave
- [ ] FAQ: 4-7 perguntas · bullets · máximo 300 caracteres

### CTA e Links
- [ ] 1-3 CTA soft contextual
- [ ] 3-8 internal links com âncoras descritivas
- [ ] Links para outros artigos do blog
- [ ] Links para páginas de serviço (funil)

### Validação Final
- [ ] Word count dentro do range para o tipo
- [ ] Schema validado
- [ ] Mobile-friendly
