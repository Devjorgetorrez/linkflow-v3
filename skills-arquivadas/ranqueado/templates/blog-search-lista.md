---
name: blog-search-lista
type: template
intent: lista-numerada
trigger: "ideias de X, tipos de Y, melhores Z, N formas de fazer X, como ganhar dinheiro com X"
monetization: cta-soft-lead
version: 1.0
word_count:
  min: 1200
  max: 3000
  words_per_item: "150–250"
n_items:
  min: 5
  max: 50
  ideal: "10–19"
  note: "número ímpar é preferível — parece mais curado"
internal_links:
  min_per_article: 3
  max_per_article: 10
  target_types: [artigos-de-aprofundamento, paginas-de-servico, outros-listicles]
schema_markup:
  required: [Article, ItemList]
  conditional:
    faqpage: quando houver FAQ
    breadcrumb: sempre
eeat:
  autor: obrigatorio
  data_publicacao: true
  data_atualizacao: true
cta_type: soft
cta_appearances: {min: 1, max: 2}
---

# Template: Blog Search Lista (Listicle)
> Referência: Squarespace Blog — "19 pequenos negócios que você pode montar em casa (2026)"
> Monetização: CTA soft · Versão: 1.0 · Junho 2026

---

## Quando Usar

| Query (intenção) | Template correto |
|---|---|
| "ideias de negócios em casa" | ✅ Lista |
| "melhores ferramentas de SEO" | ✅ Lista |
| "tipos de empresa no Brasil" | ✅ Lista |
| "como abrir uma empresa" | Blog Search Informacional |
| "o que é SEO" | Blog Search Guia |
| "melhor software de contabilidade" | Blog FDF Review |

---

## Número Certo de Itens

| Faixa | Quando usar |
|---|---|
| 5 a 9 itens | Nichos específicos com poucas opções reais |
| 10 a 19 itens | Range ideal — equilibra completude e escaneabilidade |
| 20 a 49 itens | Alta competitividade — cobertura exaustiva |
| Número ímpar | Preferível — "19" parece mais curado que "20" |

---

## Fórmulas de H1 (Número OBRIGATÓRIO)

```
N [objetos] que você pode [ação] em [contexto]
→ "19 pequenos negócios que você pode montar em casa (2026)"

N [adjetivo] [objetos] para [público/objetivo]
→ "15 ideias de negócios online para quem quer trabalhar em casa"

N [objetos] de [categoria] para [resultado]
→ "12 tipos de empresa para abrir com pouco dinheiro"

N formas de [ação] para [resultado]
→ "10 formas de ganhar dinheiro online em 2026"
```

> ⚠️ REGRA CRÍTICA DO SLUG: NUNCA incluir o número na URL
> ✅ /ideias-negocio-em-casa
> ❌ /19-ideias-negocio-em-casa (quando atualizar para 22, perde todos os backlinks)

---

## Elementos Técnicos

```
[ TITLE TAG ]  N + KW + ano · até 60 chars
[ META DESCRIPTION ]  KW + N itens + benefício + CTA soft · até 155 chars
[ URL / SLUG ]  /kw-principal-SEM-numero · atemporal
[ SCHEMA Article ]  author + datePublished + dateModified
[ SCHEMA ItemList ]  N itens com position + name + url de cada
[ SCHEMA FAQPage ]  quando tiver FAQ
[ SCHEMA BreadcrumbList ]  sempre
```

---

## Estrutura do Artigo

### Imagem Principal
- 1250×650 px · 16:9 · ALT: KW primária

### Metadados
📅 Publicado · 🔄 Atualizado · ⏱ X min

### Bloco Autor
- Nome + cargo + link bio

### H1 — Título com Número OBRIGATÓRIO
`[N] [itens] que [ação/contexto] ([ano])`

### Introdução (2-3 parágrafos · 4-5 linhas)
- Parágrafo 1: KW na 1ª linha · definição do tema (GEO) · por que este conteúdo
- Parágrafo 2: o que o leitor vai encontrar · como a lista foi criada
- [INTERNAL-LINK #1] → página de serviço

### Summary Box / Índice — BANIDO (não criar)
NÃO criar índice/TOC (regras-formatacao.md). A introdução vai direto ao desenvolvimento.

---

### H2: 1. [Nome do Item] — [Subtítulo descritivo de 1 frase]

> REGRA: Número OBRIGATÓRIO no H2. Formato: "N. Nome — Subtítulo"

*[Imagem 400×400 px opcional · ALT: KW + nome do item]*

- Parágrafo 1: **definição/descrição direta do que é o item (GEO)** (4-5 linhas)
- Parágrafo 2: como funciona na prática / exemplos (4-5 linhas)
- Parágrafo 3: para quem é indicado / dificuldade (opcional · 4-5 linhas)

**Você vai precisar de:** *(opcional — máx. 1 lista por item · 3-6 bullets)*
- [Item necessário 1]
- [Item necessário 2]
- [Item necessário N]

*[CTA soft contextual — apenas em itens estratégicos, não em todos]*
*[INTERNAL-LINK → artigo de aprofundamento quando existir]*

---

*(Repetir estrutura H2 para cada item — N vezes total)*

---

### CTA Soft Contextual Geral (após o último item, antes do FAQ)

| [Mensagem contextual] | **▶ [CTA]** |

---

### H2: Como Escolher a Ideia Certa para Você (OPCIONAL)
- 1-2 parágrafos de 4-5 linhas com critérios de escolha
- [INTERNAL-LINK] para artigo de como começar

---

### H2: Perguntas Frequentes ← ÚLTIMO H2 OBRIGATÓRIO

> REGRA: Perguntas = dúvidas práticas sobre como começar
> NÃO são objeções de compra nem questões conceituais profundas

#### H3: Como validar uma ideia da lista?
- [Bullet 1]
- [Bullet 2]
- [Bullet 3]

#### H3: Preciso de CNPJ / registro formal para começar?
- [Bullet 1]
- [Bullet 2]

#### H3: Qual item tem maior potencial de lucro?
- [Bullet 1]
- [Bullet 2]

*(Mínimo 3 perguntas · Máximo 5)*

---

## Schema ItemList (JSON-LD OBRIGATÓRIO)

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "[N] [itens] — título da lista",
  "numberOfItems": [N],
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "[Nome do Item 1]",
      "url": "https://[site]/[slug]#item-1"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "[Nome do Item 2]",
      "url": "https://[site]/[slug]#item-2"
    }
  ]
}
```

> Com Schema ItemList o Google pode exibir os itens diretamente na SERP como rich result.

---

## Meta Tags

```
META TITLE (até 60 caracteres):
[N] [Itens] para [Contexto] em [Ano]

META DESCRIPTION (até 155 caracteres):
Descubra [N] ideias de [tema] para [objetivo]. [Exemplo de itens]. Veja a lista completa.
```

---

## Regras do Agente — Pode / Não Pode

### ✅ PODE / DEVE
- Número obrigatório no H1 — real e verificável
- Número no H2 de cada item: "1. Nome do Item"
- Slug SEM número: /ideias-negocio-em-casa
- Número deve ser EXATO — se prometer 19, entregar 19
- Número ímpar preferível — parece mais curado
- 150-250 palavras por item (2-4 parágrafos de 4-5 linhas)
- 1ª frase do item: definição direta (GEO ready)
- Bullets opcionais: máx. 1 lista por item · 3-6 itens
- CTA soft apenas em itens estratégicos
- Schema ItemList obrigatório com todos os N itens
- (Sem summary box/índice — banido)
- Parágrafos H1/H2: 4-5 linhas · H3 FAQ: máximo 300 caracteres

### ❌ NÃO PODE
- H1 sem número ou com número vago ("vários", "muitos")
- H2 de item sem número
- Slug com número: /19-ideias (desatualiza)
- Prometer N itens e entregar diferente
- Item com menos de 100 palavras (thin content)
- Contexto antes da definição do item
- Lista de bullets em todos os itens (repetitivo)
- CTA em cada item da lista
- Artigo sem Schema ItemList
- FAQ no meio da lista
- Menos de 3 links internos

---

## Checklist Final de Publicação

### H1 e Número
- [ ] Número obrigatório no H1 — real e exato
- [ ] Ano entre parênteses no final do H1
- [ ] KW primária presente no H1
- [ ] Slug SEM número

### Intro
- [ ] KW primária na 1ª linha do 1º parágrafo
- [ ] (Sem summary box/índice — banido)

### Cada Item (verificar TODOS)
- [ ] H2 com número: "N. Nome do Item"
- [ ] 150-250 palavras por item
- [ ] 1ª frase: definição direta (GEO ready)
- [ ] Bullets apenas quando agregam valor (máx. 1 por item)
- [ ] CTA soft apenas em itens estratégicos

### Schema
- [ ] Schema Article + dateModified
- [ ] Schema ItemList: todos os N itens com position + name + url
- [ ] Schema FAQPage quando tiver FAQ

### FAQ
- [ ] 3-5 perguntas sobre como começar
- [ ] Respostas em bullets máximo 300 caracteres
- [ ] FAQ como ÚLTIMO H2

### Meta e Links
- [ ] Meta Title: N + KW + ano · até 60 chars
- [ ] Meta Description: KW + N itens + benefício + CTA soft
- [ ] 3-10 internal links com âncoras descritivas

### Validação Final
- [ ] Número do H1 = número real de itens no artigo
- [ ] Word count: 1.200-3.000 palavras
- [ ] Schema validado
- [ ] Mobile-friendly
