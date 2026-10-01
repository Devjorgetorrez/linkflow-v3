---
name: blog-discover
type: template
intent: discover-editorial
trigger: "conteúdo de lifestyle, decoração, beleza, moda, comportamento, inspiração pessoal"
canal: google-discover
version: 1.0
word_count:
  min: 1000
  max: 1800
  ideal: 1400
  leitura_alvo: "1:45 a 2:30 minutos"
tom_de_voz: jornalista-proxima-e-experiente
emojis: PROIBIDO
paragrafos:
  min_linhas: 3
  max_linhas: 5
  espaco_entre: obrigatorio
imagem:
  largura_minima: 1200
  formato: 16:9
  alt: descritivo-nao-KW-forcada
internal_links:
  min: 2
  max: 5
  target: [outros-artigos-discover, artigos-relacionados-do-blog]
schema: Article
cta:
  tipo: soft-contextual ou comunidade/newsletter
  aparicoes: 1-2
microimpactos_obrigatorios: 3
---

# Template: Blog Discover
> Referência: Ventrameli Decor — "Combinar plantas: o detalhe pouco conhecido que dinamiza seu ambiente"
> Canal: Google Discover — feed passivo · Versão: 1.0 · Junho 2026

---

## Discover vs Search — A Diferença que Muda Tudo

| ATRIBUTO | Templates Search | Blog Discover |
|---|---|---|
| Canal | Busca ativa | **Feed passivo** |
| KW no H1 | Obrigatória exata | **Não obrigatória — pode ser intrigante** |
| Densidade de KW | Calculada (÷ 125) | **Orgânica — sem meta numérica** |
| Tom de voz | Informativo/educativo | **Editorial · pessoal · emocional** |
| FAQ obrigatório | Sim | **NÃO — substitui por fecho emocional** |
| Emojis | Não usados | **PROIBIDOS — regra explícita** |
| Word count | Calculado | **1.000-1.400 palavras · ritmo > extensão** |

---

## Quando Usar

| Situação | Template correto |
|---|---|
| Artigo sobre "como combinar plantas" — tom pessoal | ✅ Blog Discover |
| "como cuidar de plantas passo a passo" | Blog Search Informacional |
| "guia completo de decoração com plantas" | Blog Search Guia |
| "dica que transformou minha varanda" — narrativa | ✅ Blog Discover |
| "loja de plantas em SP" | Site FDF SEO Local |

---

## Tipos de Conteúdo Discover

| Tipo | Exemplo de título |
|---|---|
| Produto ou tendência | O detalhe que transforma qualquer decoração com plantas |
| Dica prática com storytelling | Como aprendi a combinar plantas depois de matar 7 delas |
| Lista visual editorial | 5 plantas que eu nunca tiraria do meu banheiro |
| Conteúdo emocional | Você cuida da casa como cuida de você mesma? |
| Estilo de vida leve | O ritual da manhã que mudou minha relação com a cozinha |
| Editorial com referências | O que o TikTok não te conta sobre decorar com plantas |

---

## Fórmulas de H1 para Discover (NÃO precisa ter KW exata)

```
"O detalhe pouco conhecido que [resultado surpreendente]"
"[Coisa comum]: o erro que a maioria comete sem perceber"
"O segredo que aprendi depois de [situação relatable]"
"Por que [coisa simples] pode [resultado inesperado]"
"Como aprendi [algo] depois de [situação]"
```

| H1 para Search | H1 para Discover |
|---|---|
| Como combinar plantas em casa: guia completo | Combinar plantas: o detalhe pouco conhecido que dinamiza seu ambiente |
| 7 dicas para cuidar de plantas | O erro de cuidado que mata suas plantas (e você provavelmente comete) |

---

## Elementos Técnicos

```
[ TITLE TAG ]  intrigante + tema + site · até 60 chars (pode = H1)
[ META DESCRIPTION ]  resumo editorial em 1-2 frases · tom próximo · até 155 chars
[ SCHEMA Article ]  author · datePublished · dateModified
[ OG IMAGE ]  mínimo 1.200 px largura · 16:9 · impactante
[ CANONICAL ]  URL do artigo
```

---

## Estrutura do Artigo

### Imagem Principal (O ELEMENTO MAIS CRÍTICO DO DISCOVER)
- Largura MÍNIMA: 1.200 px (Google exige para elegibilidade)
- Dimensão recomendada: 1344×896 px
- Formato: 16:9
- ALT: descritivo da cena — NUNCA KW forçada
  - ✅ "composição harmoniosa de plantas naturais em espaço interno iluminado"
  - ❌ "combinar plantas dicas passo a passo"
- Legenda obrigatória: "[Descrição] — Imagem Ilustrativa [nome do site]"

### Data de Publicação + Autor — NÃO escrever no corpo
- Autor, bio e data são configuração do WordPress (perfil do autor), NÃO conteúdo do artigo
  (regras-formatacao.md). NÃO escrever "Por [autor]", bio ou data dentro do texto.

### Regras gerais aplicáveis (regras-formatacao.md)
- LINK INTERNO: os marcadores [INTERNAL-LINK #N contextual] NUNCA saem crus no texto final —
  viram link real (artigo do histórico/projeto.md) ou são removidos limpos. Zero marcador no corpo.
- NATURALIDADE EDITORIAL: Discover não usa KW (é ângulo editorial), mas não pode repetir a mesma
  frase, ideia ou lista em pontos diferentes do texto. Variedade editorial é obrigatória.
- REVIEWER: não inventa requisito fora da rubrica (sem "Pontos Principais"/takeaways forçado).

### H1 — Título Intrigante (não precisa ter KW exata)

### Parágrafo 1 — GANCHO (microimpacto 1 obrigatório)
- Cena visual reconhecível OU pergunta provocativa OU micro-relato
- KW do tema na 1ª ou 2ª linha
- 4-5 linhas

### Parágrafo 2 — ENTREGA DA IDEIA CENTRAL
- O leitor deve entender o valor ANTES do 2º scroll
- 4-5 linhas
- [INTERNAL-LINK #1 contextual]

*[Imagem 1 — 1344×896 px · ALT descritivo · legenda obrigatória]*

---

### H2: [Subtema 1 — contextualiza ou aprofunda o gancho]
- 2-3 parágrafos de 4-5 linhas
- Microhistória ou relato pessoal aqui (quando aplicável)

#### Frase Editorial em Destaque (microimpacto 2)

> ***[Frase que sintetiza uma ideia-chave — 1 linha · impacto editorial]***

*[Imagem 2]*

---

### H2: [Subtema 2 — variações práticas, exemplos, combinações]
- 2-3 parágrafos de 4-5 linhas
- Lista visual quando aplicável (sem bullets forçados)
- [INTERNAL-LINK #2 contextual]

#### H3: [Sub-subtema quando necessário]
- 1-2 parágrafos de 4-5 linhas

*[Imagem 3]*

---

*(Repetir para H2 temáticos — 3 a 6 H2 no total)*

**REGRA POR H2:**
- 2-3 parágrafos de 4-5 linhas
- 1 imagem por H2 (ou a cada 2 H2)
- Microhistória ou relato quando encaixar naturalmente
- Frase editorial em destaque em momentos de insight

---

### CTA Comunidade/Newsletter (1ª aparição — após H2 relevante)

| **Junte-se à Comunidade** |
|---|
| Já somos mais de [N] pessoas que amam [tema] |
| **▶ RECEBER AS NOVIDADES** |

---

### H2: [Bloco de reforço externo — tendências, redes sociais]
- Pinterest, TikTok, Instagram como contexto cultural
- 1-2 parágrafos · dado real ou observação de trend

---

### LEIA TAMBÉM (bloco visual)

**LEIA TAMBÉM:** [Título do artigo relacionado — estilo Discover]
*[url do artigo]*

---

### H2: [Último H2 temático antes do fecho]
- 2-3 parágrafos de 4-5 linhas

---

### Fecho Emocional (microimpacto 3 obrigatório — SUBSTITUI O FAQ)

> ***[Frase editorial de fechamento — insight ou reflexão]***

[1-2 parágrafos reflexivos com tom pessoal · 4-5 linhas cada]

***[Pergunta que convida o leitor a imaginar, lembrar ou compartilhar]***

---

### CTA Comunidade/Newsletter (2ª e última aparição)

| **Junte-se à Comunidade** |
|---|
| Já somos mais de [N] pessoas que amam [tema] |
| **▶ RECEBER AS NOVIDADES** |

---

## Meta Tags

```
META TITLE (até 60 caracteres):
[Título intrigante + tema]

META DESCRIPTION (até 155 caracteres):
[Resumo editorial em tom próximo. Promessa clara do que o leitor vai encontrar.]
```

---

## Regras do Agente — Pode / Não Pode

### ✅ PODE / DEVE
- Tom: jornalista próxima que viveu o assunto
- Microhistórias naturais: "descobri na prática", "já perdi por..."
- Opinião pessoal presente: "prefiro", "aprendi que"
- H1 intrigante e emocional — não precisa ter KW exata
- Gancho nos 2 primeiros parágrafos — entrega o valor antes do 2º scroll
- 3 microimpactos ao longo do texto (gancho + insight + fecho)
- ZERO emojis em qualquer parte do conteúdo
- Parágrafos de 4-5 linhas com espaço entre eles
- Frases editoriais em destaque (2-3 ao longo do texto)
- Fecho emocional com pergunta de convite — SUBSTITUI o FAQ
- 1-2 CTAs de comunidade/newsletter (não de venda)
- 1 "LEIA TAMBÉM" visual entre seções
- 1 imagem por H2 · ALT descritivo da cena
- Imagem principal: mínimo 1.200 px largura · 1344×896 px
- 2-5 internal links contextuais

### ❌ NÃO PODE
- QUALQUER emoji em qualquer parte do texto
- H1 com KW exata como nos templates Search
- Contexto longo antes do ponto central
- FAQ no final do artigo Discover
- CTA de venda, urgência ou pressão
- Imagem abaixo de 1.200 px — inelegível para Discover
- ALT com KW forçada
- Sem legenda nas imagens
- Parágrafos abaixo de 4 ou acima de 5 linhas
- Tom de especialista distante, blogueira padrão ou influencer forçada
- KW calculada com fórmula total ÷ 125

---

## Checklist Final de Publicação

### Imagens (CRÍTICO para Discover)
- [ ] Imagem principal: mínimo 1.200 px largura · 1344×896 px
- [ ] ALT: descritivo da cena (NÃO KW forçada)
- [ ] Legenda: "[descrição] — Imagem Ilustrativa [site]"
- [ ] 1 imagem por H2 ao longo do texto

### H1 e Abertura
- [ ] H1 intrigante — provoca curiosidade no feed
- [ ] ZERO emojis em qualquer parte do texto
- [ ] Gancho no 1º parágrafo
- [ ] KW do tema na 1ª ou 2ª linha da intro
- [ ] Valor do texto entregue antes do 2º scroll

### Parágrafos
- [ ] Todos os parágrafos: 4-5 linhas completas (nunca <4 nem >5)
- [ ] Linha de espaço entre todos os parágrafos

### Microimpactos (3 OBRIGATÓRIOS)
- [ ] Microimpacto 1: gancho no 1º parágrafo
- [ ] Microimpacto 2: frase editorial em destaque no meio
- [ ] Microimpacto 3: fecho emocional no final

### Tom e Microhistórias
- [ ] Tom: jornalista próxima (não especialista distante)
- [ ] Pelo menos 2 microhistórias naturais
- [ ] Opinião pessoal presente
- [ ] Sem tom de marketing ou influencer forçada

### Estrutura
- [ ] 3-6 H2 temáticos
- [ ] FECHO EMOCIONAL no final (FAQ PROIBIDO aqui)
- [ ] 1-2 CTAs de comunidade (não de venda)
- [ ] 1 "LEIA TAMBÉM" visual
- [ ] 2-5 links internos contextuais

### Word Count e Ritmo
- [ ] 1.000-1.400 palavras no total
- [ ] Tempo de leitura: 1:45 a 2:30 min
- [ ] Ritmo fluido — sem parágrafos que atrasam o leitor

### Validação Final
- [ ] ZERO emojis — verificar novamente antes de publicar
- [ ] Imagem principal acima de 1.200 px
- [ ] Fecho emocional presente (NÃO FAQ)
- [ ] Schema Article implementado
