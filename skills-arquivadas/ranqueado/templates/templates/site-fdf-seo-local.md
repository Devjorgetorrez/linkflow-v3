---
name: site-fdf-seo-local
type: template
intent: seo-local
trigger: "serviço + localização, empresa de X em SP, manutenção de X SP, contratar X"
monetization: lead-conversao
cta_type: whatsapp | formulario | telefone | email
version: 1.0
word_count:
  min: 600
  max: 1200
  ideal: "800–1000"
internal_links:
  min_per_page: 2
  max_per_page: 4
  target_types: [outras-paginas-de-servico, pagina-sobre, pagina-contato]
  note: "NUNCA linkar para o blog — links internos devem reforçar conversão"
schema_markup:
  required: [LocalBusiness, Service]
  optional: [FAQPage, Review]
---

# Template: Site FDF SEO Local
> Referência: Eliotec (eliotec.com.br) — empresa de elevadores SP
> Monetização: Lead / Orçamento / Contato · Versão: 1.0 · Junho 2026

---

## Quando Usar

| Situação | Usar? |
|---|---|
| Página de serviço local: "[serviço] em [cidade]" | ✅ SIM |
| Landing page de campanha Google Ads | ✅ SIM |
| Artigo de blog sobre o tema do serviço | ❌ NÃO — usar blog-search-informacional |
| Página "Sobre Nós" | ❌ NÃO — institucional |
| Comparativo de serviços | ❌ NÃO — adaptar blog-fdf-comparativo |

---

## Diferença Fundamental: Transacional vs Informacional

| PÁGINA INFORMACIONAL | PÁGINA TRANSACIONAL |
|---|---|
| Objetivo: educar / informar | **Objetivo: gerar contato / conversão** |
| KW: "o que é manutenção de elevador" | **KW: "empresa manutenção elevadores SP"** |
| Intenção: aprender | **Intenção: contratar** |
| CTA: "leia mais", "saiba mais" | **CTA: "solicite orçamento", "fale no WhatsApp"** |
| Word count: 1.500–3.000 palavras | **Word count: 600–1.200 palavras** |
| FAQ: qualquer dúvida do tema | **FAQ: objeções de venda + dúvidas de contratação** |

> ⚠️ ATENÇÃO: Esta é o único template onde MAIS palavras NÃO é melhor.

---

## Como Este Template Funciona: Camada Fixa + Camada por Segmento

Negócio local é altamente customizado. Um dentista, um advogado, uma desentupidora e uma bicicletaria precisam de seções diferentes. Por isso este template tem DUAS camadas, montadas por uma cadeia de 3 etapas:

```
1. CAMADA FIXA (esqueleto que sempre ranqueia — vem do consenso de SEO local)
   → as seções obrigatórias abaixo, que todo negócio local precisa ter
   → NÃO vem de scraping; é consolidado e validado

2. SCRAPING/SERP dos 3 primeiros colocados do segmento (completa o padrão)
   → analisa a ESTRUTURA dos concorrentes que rankeiam naquele nicho
   → identifica seções específicas do segmento + melhores práticas
   → ex: dentista tem "antes/depois"; desentupidora tem "quando chamar" e "equipamentos"
   → NÃO copia conteúdo (isso clona erros) — só mapeia QUAIS seções aquele segmento usa

3. ENTREVISTA GUIADA com o responsável (preenche com a verdade do negócio)
   → o resultado do scraping DEFINE QUAIS PERGUNTAS FAZER ao responsável
   → perguntas-base (todo local) + perguntas do que o scraping achou no segmento
   → o conteúdo real sai daqui — verdadeiro, específico, não genérico
```

**Por que esta cadeia (e não só copiar concorrentes):** copiar a estrutura dos concorrentes
clona os erros deles (a maioria dos sites locais é mal feita para SEO). O scraping aqui serve
para o sistema SABER O QUE PERGUNTAR — a qualidade vem da entrevista, não da cópia. Pesquisa
de SEO local 2026 confirma: "city pages" duplicadas prejudicam a visibilidade; uma página =
um serviço + uma localização, com conteúdo único e verdadeiro.

**Regra inegociável:** uma página mira UM serviço + UMA localização. Nunca enfiar várias
cidades numa página (dilui os sinais de relevância).

---

## Elementos Técnicos (invisíveis ao usuário)

```
[ TITLE TAG ]  até 60 chars · KW primária [serviço + localização] · nome empresa
Ex: "Empresa de Elevadores SP — Eliotec | Manutenção"

[ META DESCRIPTION ]  até 155 chars · KW primária · diferencial · CTA explícito
Ex: "Empresa de elevadores SP com 30 anos de experiência. Manutenção, modernização e instalação. Atendimento 24h. Solicite orçamento!"

[ URL / SLUG ]  /kw-primaria-com-hifens-sem-stop-words (com localização)
Ex: /empresa-de-elevadores-sp

[ SCHEMA LocalBusiness ]  JSON-LD no <head>
[ SCHEMA FAQPage ]  JSON-LD quando tiver FAQ
[ CANONICAL ]  URL canônica da página
[ OG TAGS ]  og:title · og:description · og:image (1250×650 px)
```

---

## Estrutura da Página

> LEGENDA: 🔒 FIXA (sempre presente, vem do consenso) · 🔧 SEGMENTO (entra/adapta conforme
> o scraping + entrevista revelarem para aquele nicho)

### 🔒 Imagem Principal / Hero
- Foto real: equipe, serviço em andamento ou equipamento
- Proporção 16:9 · 1250×650 px
- ALT: KW primária exata + nome empresa
- NUNCA stock photo genérico

### 🔒 H1 — Título Principal
Formato: `[KW primária exata] — [Serviço 1], [Serviço 2] e [Serviço 3]`
- Ex: "Empresa de Elevadores SP — Manutenção, Modernização e Instalação"
- KW primária = [serviço] + [localização] — OBRIGATÓRIO

### 🔒 Introdução (2-3 parágrafos · 4-5 linhas cada)
- **Parágrafo 1: KW primária EXATA dentro das PRIMEIRAS 100 PALAVRAS da página**
  (não só "na 1ª linha" — o Google dá PESO EXTRA às primeiras 100 palavras; a KW exata
  precisa estar aí, não só a cidade solta) + apresentação da empresa (anos, experiência)
- Parágrafo 2: proposta de valor + diferencial principal · [INTERNAL-LINK #1]
- Parágrafo 3 (CTA #1): "Solicite seu orçamento agora" / botão WhatsApp

### 🔒 Bloco de Localização no Topo (mapa + NAP) ← perto do hero
- NAP (Nome + Endereço + Telefone) visível logo no início, IDÊNTICO ao Google Business Profile
- Mapa do Google embutido OU referência clara de localização perto do topo
- Por quê: pesquisa de SEO local 2026 confirma que o mapa fica PERTO DO TOPO (confirmação
  visual de localização), não no fim da página. O NAP consistente é a BASE do SEO local.
- (O bloco completo de contato+mapa também se repete no rodapé — ver final da estrutura)

---

### 🔒 H2: Serviços de [KW primária]
- KW primária ou variação na 1ª linha
- 1-2 parágrafos de contexto (4-5 linhas)
- Lista bullet de serviços (4-8 itens · 1 linha cada) ← bullet uso 1/3
- [INTERNAL-LINK #2] para página de serviço específico

### 🔧 H2(s) específicos do SEGMENTO (do scraping + entrevista)
- Aqui entram as seções que aquele nicho específico precisa, descobertas no scraping dos
  3 primeiros e preenchidas pela entrevista. Exemplos reais por segmento:
  - Dentista → "Antes e Depois", especialidades, equipe de profissionais
  - Advogado → áreas de atuação, cases/citações, unidades de atendimento
  - Desentupidora → "Quando Chamar", equipamentos, urgência 24h, garantia
  - Bicicletaria → tipos de bike, oficina, Bike Fit, certificações de marca
- NÃO inventar: o conteúdo vem da entrevista (verdade do negócio). Se a entrevista não
  trouxe a informação, NÃO criar a seção.

---

### 🔒 H2: Por que Escolher a [Nome Empresa]? — Diferenciais (E-E-A-T)
- KW secundária na 1ª linha
- Parágrafo com prova social: anos de experiência, nº de clientes, certificações (4-5 linhas)
- Diferenciais REAIS (da entrevista), não promessas genéricas — sinais de E-E-A-T
- Lista bullet de diferenciais (4-6 itens · 1 linha cada) ← bullet uso 2/3
- CTA #2 — 2ª aparição do CTA

---

### 🔧 H2: Processo de Atendimento (como funciona) — recomendado
- Passo a passo de como o cliente é atendido (1 → 2 → 3 → 4)
- Especialmente forte em segmentos de urgência/serviço (desentupidora, oficina)
- Conteúdo da entrevista: como ESTE negócio atende na prática

### 🔒 H2: O Que Nossos Clientes Dizem — Prova Social
- KW secundária ou variação na 1ª linha
- Depoimentos/avaliações REAIS — e, quando possível, **com menção ao bairro ou cidade**
  do cliente ("Cliente do Cambuí", "atendimento em Barão Geraldo")
- Por quê: pesquisa 2026 diz que mencionar bairro/rua/ponto de referência no depoimento é
  "extremamente poderoso" para SEO local
- Link para avaliações no Google (Google Business Profile)

---

### 🔒 H2: Regiões Atendidas em [Cidade] ← OBRIGATÓRIO PARA SEO LOCAL
- Cita cidade principal + regiões + bairros (4-5 linhas)
- Lista bullet de cidades/regiões/bairros (4-8 itens) ← bullet uso 3/3
- DEVE ser um H2 dedicado e próprio — NUNCA diluir os bairros dentro de outros parágrafos
  (erro observado em teste: bairros espalhados sem a seção dedicada)
- [INTERNAL-LINK #4] para página de cidade específica

---

### 🔒 H2: Solicite seu Orçamento (ou: Fale com Nossa Equipe)
- CTA #3 — 3ª e principal aparição
- Copy persuasivo com urgência/disponibilidade (2-3 linhas)
- Botão WhatsApp · Formulário de contato · Telefone
- "24h · atendimento imediato"

---

### 🔒 H2: Dúvidas Frequentes ← ÚLTIMO H2 DE CONTEÚDO OBRIGATÓRIO

> REGRA: Perguntas = OBJEÇÕES DE VENDA (preço, cobertura, garantia, urgência)
> NÃO são dúvidas educativas sobre o tema
> As objeções específicas do segmento vêm da entrevista (o que ESTE cliente mais ouve)

#### H3: [Pergunta 1 — objeção de cobertura]
Resposta direta, máximo 300 caracteres · Rich Snippet ready

#### H3: [Pergunta 2 — objeção de preço/orçamento]
Resposta direta, máximo 300 caracteres

#### H3: [Pergunta 3 — objeção de garantia/certificação]
Resposta direta, máximo 300 caracteres

#### H3: [Pergunta 4 — objeção de disponibilidade/urgência]
Resposta direta, máximo 300 caracteres

*(Mínimo 4 perguntas · Máximo 6)*

---

### 🔒 Rodapé: Contato + NAP + Mapa (após o FAQ — é rodapé, não um H2 de conteúdo)
- Bloco de contato com NAP completo (Nome + Endereço + Telefone), IDÊNTICO ao Google Business Profile
- Mapa do Google embutido apontando para o endereço (ou centro da área de serviço)
- Horário de funcionamento
- Por quê: a página de contato/rodapé é onde o usuário procura o mapa quando quer visitar.
  O FAQ continua sendo o último H2 de CONTEÚDO; este bloco é rodapé estrutural.

---

## Schema LocalBusiness (JSON-LD obrigatório)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[Nome da Empresa]",
  "description": "[KW primária] especializada em [serviços].",
  "url": "https://[site].com.br",
  "telephone": "+55-[número]",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "[Cidade]",
    "addressRegion": "[UF]",
    "addressCountry": "BR"
  },
  "areaServed": ["[Cidade 1]", "[Cidade 2]", "[Região]"],
  "openingHours": "Mo-Su 00:00-23:59"
}
```

---

## Meta Tags

```
META TITLE (até 60 caracteres):
[KW primária] — [Nome Empresa] | [Serviço principal]

META DESCRIPTION (até 155 caracteres):
[KW primária] com [N] anos de experiência. [Diferencial]. Atendimento 24h. Solicite orçamento!
```

---

## Regras do Agente — Pode / Não Pode

### ✅ PODE / DEVE
- 1 único H1 com KW primária [serviço + localização]
- **KW primária EXATA dentro das primeiras 100 palavras (peso extra do Google)**
- Camada fixa sempre presente + camada de segmento vinda do scraping + entrevista
- FAQ obrigatoriamente como último H2 de conteúdo
- H2 de Regiões Atendidas obrigatório e DEDICADO (nunca diluído em outros parágrafos)
- **Mapa + NAP perto do topo E repetido no rodapé de contato**
- **NAP idêntico ao Google Business Profile (a base do SEO local)**
- **Depoimentos com menção a bairro/cidade quando possível (extremamente poderoso)**
- CTA mínimo 3 vezes: hero + meio + conclusão
- Copy do CTA específico — nunca genérico "Fale conosco"
- Urgência e disponibilidade: "24h" · "atendimento imediato"
- Cidade + regiões + bairros mencionados no corpo
- Schema LocalBusiness + FAQPage
- Foto real: equipe, serviço, equipamento — nunca stock photo
- Conteúdo das seções de segmento vindo da ENTREVISTA (verdade do negócio)
- Entrega em BLOCOS DE COPY para page builder — NUNCA HTML/CSS (tudo é montado no site)

### ❌ NÃO PODE
- H1 genérico sem KW ou sem localização
- KW ausente nas primeiras 100 palavras (só a cidade solta não basta)
- Mais de ~8 H2 — dilui foco transacional
- FAQ no meio da página
- Omitir H2 de Regiões — perde ranqueamento local
- Diluir os bairros em outros parágrafos em vez de um H2 dedicado de Regiões
- Mapa só no fim depois do FAQ (vai perto do topo OU no rodapé de contato)
- CTA apenas no final da página
- CTA genérico: "Entre em contato"
- Apenas "SP" sem detalhe geográfico
- Página sem schema markup
- NAP inconsistente com Google Business Profile
- Copiar a ESTRUTURA/conteúdo dos concorrentes (clona erros; usar só para mapear seções)
- Inventar seção de segmento sem informação da entrevista
- Várias cidades numa mesma página (dilui relevância)
- Links para o blog — aumenta bounce
- Artigo acima de 1.200 palavras
- **Entregar HTML/CSS — Site Local é blocos de copy para o page builder**

---

## Checklist Final de Publicação

### Elementos Técnicos
- [ ] Title Tag: até 60 chars · KW [serviço + localização] · nome empresa
- [ ] Meta Description: até 155 chars · KW · diferencial · CTA explícito
- [ ] URL: KW com hífens + localização · sem stop words
- [ ] Schema LocalBusiness: JSON-LD completo
- [ ] Schema FAQPage: JSON-LD com as perguntas
- [ ] Canonical URL definida
- [ ] OG Tags: og:title · og:description · og:image (1250×650)

### H1 e Introdução
- [ ] 1 único H1 com KW [serviço + localização]
- [ ] KW na 1ª linha do 1º parágrafo
- [ ] 2-3 parágrafos de 4-5 linhas na introdução
- [ ] CTA #1 presente na introdução
- [ ] [INTERNAL-LINK #1] presente

### Estrutura de H2
- [ ] 4 a 6 H2 na página
- [ ] H2 de Serviços: KW presente
- [ ] H2 de Diferenciais: prova social presente
- [ ] H2 de Regiões Atendidas: OBRIGATÓRIO · cidades nomeadas
- [ ] H2 de CTA: CTA #3 presente
- [ ] FAQ é o ÚLTIMO H2

### KW e Conteúdo
- [ ] KW primária no H1, 1º parágrafo, ao menos 1 H2, meta tags e ALT
- [ ] Densidade adequada: 600-1.200 palavras total
- [ ] Localização mencionada em múltiplos pontos

### CTA e Conversão
- [ ] CTA aparece mínimo 3 vezes
- [ ] Copy do CTA específico (não genérico)
- [ ] Urgência / disponibilidade 24h presente
- [ ] WhatsApp / formulário / telefone funcionando

### SEO Local
- [ ] Cidades + regiões + bairros no corpo do texto
- [ ] Schema LocalBusiness presente e correto
- [ ] NAP consistente com Google Meu Negócio
- [ ] 2-4 internal links para páginas de serviço (não para blog)

### FAQ
- [ ] 4-6 perguntas = objeções de venda
- [ ] Respostas de FAQ: máximo 300 caracteres cada
- [ ] Schema FAQPage implementado

### Imagem
- [ ] Foto real (equipe / serviço / equipamento) — não stock photo
- [ ] Proporção 16:9 · 1250×650 px
- [ ] ALT: KW primária exata

### Validação Final
- [ ] Word count entre 600 e 1.200 palavras
- [ ] Schema validado em schema.org/validator
- [ ] Mobile-friendly
