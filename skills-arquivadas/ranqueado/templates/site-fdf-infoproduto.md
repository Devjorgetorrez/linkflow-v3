---
name: site-fdf-infoproduto
type: template
intent: infoproduto
trigger: "curso de X, formação em X, capacitação em X, como se tornar X"
monetization: venda-direta
cta_type: botao-compra | checkout | hotmart | kiwify | eduzz
version: 1.0
word_count:
  min: 1200
  max: 2500
  ideal: "1500–2000"
internal_links:
  min_per_page: 2
  max_per_page: 5
  target_types: [outros-cursos, pagina-sobre, blog-artigo-relacionado]
  note: "links para blog são PERMITIDOS aqui — reforçam autoridade temática"
schema_markup:
  required: [Course]
  optional: [FAQPage, Review, Person]
cta_appearances:
  min: 3
  positions: [hero, meio-pagina, final]
gatilhos_obrigatorios: [transformacao, autoridade, prova-social, garantia]
---

# Template: Site FDF Infoproduto
> Referência: Exemplo de Infoproduto (exemplo.com.br)
> Monetização: Venda direta do curso · Versão: 1.0 · Junho 2026

---

## Quando Usar

| Situação | Usar? |
|---|---|
| Página de venda de curso online | ✅ SIM |
| Landing page de webinar / aula grátis | ✅ SIM (adaptado) |
| Página de ebook ou material digital | ✅ SIM (adaptado) |
| Artigo de blog sobre o tema do curso | ❌ NÃO — usar blog-search-informacional |

---

## A Jornada do Visitante (5 etapas obrigatórias)

1. **Capturar atenção** — headline poderosa com KW primária
2. **Apresentar transformação** — o que você vai conseguir
3. **Construir autoridade** — professor + prova social + números
4. **Eliminar objeções** — garantia + FAQ + depoimentos
5. **Converter** — CTA claro, múltiplas vezes, sem fricção

---

## Elementos Técnicos

```
[ TITLE TAG ]  até 60 chars · KW primária + escola + diferencial
[ META DESCRIPTION ]  até 155 chars · KW + transformação + CTA
[ URL / SLUG ]  /curso-de-kw-primaria (sem stop words)
[ SCHEMA Course ]  JSON-LD no <head>
[ SCHEMA FAQPage ]  JSON-LD no <head>
[ OG TAGS ]  og:title · og:description · og:image (1250×650)
```

---

## Estrutura da Página

### Hero — Above the Fold (PRIMEIRO ELEMENTO VISÍVEL)

| Imagem/Foto do Professor | Headline + CTA |
|---|---|
| 1250×650 px · ALT: KW primária | **[H1 com KW primária exata]** |
| ✅ 100% Online | *[Subheadline: transformação em 1-2 frases]* |
| ✅ Certificado válido | ⭐⭐⭐⭐⭐ +[N] alunos formados |
| ✅ Garantia 7 dias | ⏰ [Carga horária] · Acesso imediato |
| | De R$ [X] por apenas **R$ [Y]** |
| | **▶ QUERO ME INSCREVER AGORA** |
| | 🔒 Pagamento seguro · Garantia 7 dias |

### H1 + Introdução (2-3 parágrafos · 4-5 linhas · fórmula P→S→R)
- Parágrafo 1: KW primária na 1ª linha + proposta de valor (Problema → Solução)
- Parágrafo 2: para quem é + transformação prometida (Resultado)
- [INTERNAL-LINK #1] para artigo de blog sobre o tema

---

### H2: Para Quem É o Curso de [KW primária]?
- KW primária na 1ª linha
- Lista bullet de perfis (4-6 itens) ← bullet uso 1/4
- [INTERNAL-LINK #2]

---

### H2: O Que Você Vai Aprender — Conteúdo Programático
- KW primária ou variação na 1ª linha
- Parágrafo sobre o volume (Xh, N módulos)

#### Tabela de Módulos

| Módulo | Tema |
|---|---|
| **Módulo 1** | [Tema do módulo 1] |
| **Módulo 2** | [Tema do módulo 2] |
| **Módulo N** | [Tema do módulo N] |

- Lista bullet de principais habilidades adquiridas ← bullet uso 2/4

---

### H2: Quem Vai te Ensinar — [Nome do Professor]
- Nome + credencial mais impactante na 1ª linha

#### Bloco do Autor

| 👤 [Foto 400×400] | **[Nome do Professor]** |
|---|---|
| | *[Cargo + credencial mais impactante]* |
| | [Bio 2-3 frases: conquistas + autoridade + números] |

- [INTERNAL-LINK #3] para página sobre o professor/escola

---

### H2: Resultados — O Que Nossos Alunos Conquistaram
- KW primária + "resultados" na 1ª linha
- Dados numéricos: +N alunos · X nomeações · Y resultados

#### Depoimentos (2-4 depoimentos reais)

> 💬 *"[Depoimento com resultado específico]"*
> **[Nome] · [Formação] · [Cidade]** ⭐⭐⭐⭐⭐

- **CTA #2** — 2ª aparição do botão de compra

---

### H2: Detalhes do Curso — Como Funciona
- KW primária + modalidade na 1ª linha
- Parágrafo sobre a plataforma e acesso (4-5 linhas)
- Lista bullet de itens inclusos ← bullet uso 3/4
  - Vídeo-aulas
  - Apostilas/materiais
  - Certificado
  - Suporte
  - [Bônus exclusivos]

---

### H2: Certificado Válido em Todo o Brasil
- KW + "certificado" na 1ª linha
- Parágrafo sobre validade e reconhecimento (4-5 linhas)
- Onde e como usar o certificado ← bullet uso 4/4

---

### Bloco de Garantia (elemento visual destacado em verde)

| 🔒 GARANTIA INCONDICIONAL DE 7 DIAS |
|---|
| Acesse o curso por 7 dias. Se não ficar satisfeito por qualquer motivo, devolvemos 100% do seu dinheiro sem perguntas. |

---

### H2: Preço e Investimento
- Ancoragem: "De R$ [X] por apenas R$ [Y]"
- Parcelamento: "ou [N]× de R$ [Z]"
- **CTA #3** — principal · botão grande · texto urgente
- Micro-copy: pagamento seguro + garantia

---

### H2: Dúvidas Frequentes ← ÚLTIMO H2 OBRIGATÓRIO

> REGRA: Perguntas = OBJEÇÕES DE COMPRA (não curiosidades sobre o tema)

#### H3: [Objeção de pré-requisito]
Resposta direta, máximo 300 caracteres · mini-CTA quando possível

#### H3: [Objeção de resultado/eficácia]
Resposta direta, máximo 300 caracteres

#### H3: [Objeção de certificado/validade]
Resposta direta, máximo 300 caracteres

#### H3: [Objeção de preço/parcelamento]
Resposta direta, máximo 300 caracteres

#### H3: [Objeção de garantia/risco]
Resposta direta, máximo 300 caracteres

*(Mínimo 4 perguntas · Máximo 7)*

---

## Schema Course (JSON-LD obrigatório)

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "[Nome do Curso]",
  "description": "[Descrição com KW primária]",
  "url": "https://[site]/[slug]",
  "provider": {
    "@type": "Organization",
    "name": "[Nome da Escola]"
  },
  "instructor": {
    "@type": "Person",
    "name": "[Nome do Professor]",
    "jobTitle": "[Cargo + credencial]"
  },
  "educationalCredentialAwarded": "Certificado de Conclusão",
  "timeRequired": "PT[N]H",
  "courseMode": "online",
  "inLanguage": "pt-BR",
  "offers": {
    "@type": "Offer",
    "price": "[valor]",
    "priceCurrency": "BRL"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[nota]",
    "reviewCount": "[número de avaliações]"
  }
}
```

---

## Meta Tags

```
META TITLE (até 60 caracteres):
Curso de [KW primária] — [Escola] | [Diferencial]

META DESCRIPTION (até 155 caracteres):
Capacite-se em [KW primária] em [N]h online. [Prova social]. Certificado válido. Inscreva-se!
```

---

## Regras do Agente — Pode / Não Pode

### ✅ PODE / DEVE
- 1 único H1 com KW primária + transformação na headline
- FAQ obrigatoriamente como último H2
- 6 a 8 H2 — equilíbrio entre SEO e jornada de compra
- H2 dedicado ao professor com credenciais reais
- Gatilhos obrigatórios: transformação · autoridade · prova social · garantia
- Fórmula P→S→R nos parágrafos de conversão
- CTA mínimo 3× na página: hero + meio + final
- CTA #1 visível antes do scroll (above the fold)
- Ancoragem de preço: "De R$ X por R$ Y"
- Micro-copy: "🔒 Pagamento seguro · Garantia 7 dias"
- Números reais: alunos formados · resultados · nomeações
- Depoimentos com nome + formação + resultado específico
- Bloco do professor com foto + credenciais
- Schema Course obrigatório + FAQPage
- Parágrafos H1/H2: 4-5 linhas · H3 FAQ: máximo 300 caracteres

### ❌ NÃO PODE
- H1 genérico ou sem KW primária
- FAQ no meio da página
- Menos de 5 H2
- Página sem gatilhos mentais
- Parágrafos descritivos sem orientação a resultado
- Tom acadêmico ou excessivamente técnico
- CTA apenas no final
- CTA genérico: "Comprar" ou "Saiba mais"
- Preço sem referência anterior
- Números genéricos sem fonte
- Depoimentos sem identificação
- Links externos no corpo da página
- Aviso de resultado ausente no rodapé

---

## Checklist Final de Publicação

### Elementos Técnicos
- [ ] Title Tag: até 60 chars · KW + escola + diferencial
- [ ] Meta Description: até 155 chars · KW + transformação + CTA
- [ ] URL: /curso-de-kw-primaria (sem stop words)
- [ ] Schema Course: JSON-LD completo
- [ ] Schema FAQPage: JSON-LD
- [ ] OG Tags presentes

### Hero (Above the Fold)
- [ ] Hero visível antes do scroll com CTA #1
- [ ] Selos visíveis: ✅ 100% Online · ✅ Certificado · ✅ Garantia
- [ ] Prova social resumida (+N alunos / estrelas)
- [ ] Ancoragem de preço: "De R$ X por R$ Y"
- [ ] Micro-copy de segurança abaixo do CTA

### Estrutura e Gatilhos
- [ ] 6 a 8 H2 na página
- [ ] H2 de conteúdo programático com tabela de módulos
- [ ] H2 do professor com bloco de autoridade
- [ ] H2 de depoimentos/resultados com números reais
- [ ] Bloco visual de garantia destacado em verde
- [ ] FAQ é o ÚLTIMO H2 com 4-7 objeções de compra

### CTA e Conversão
- [ ] CTA aparece mínimo 3× (hero + meio + final)
- [ ] Copy do CTA específico (não "Comprar")
- [ ] Parcelamento visível
- [ ] Ancoragem de preço em pelo menos 1 CTA

### E-E-A-T
- [ ] Números reais com fonte
- [ ] 2-4 depoimentos com nome + formação + resultado
- [ ] Bloco do professor com foto + credenciais
- [ ] Aviso legal de resultado no rodapé

### Validação Final
- [ ] Word count entre 1.200 e 2.500 palavras
- [ ] Schema validado
- [ ] Mobile-friendly
