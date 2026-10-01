# Regras de GEO e AEO — claude-ranqueado
> Referência carregada sob demanda pelo orquestrador e sub-skills de escrita, reescrita e análise.
> Versão: 1.0 | Junho 2026

---

## Propósito

Este arquivo define as regras de GEO (Generative Engine Optimization) e AEO (Answer Engine Optimization) que todo conteúdo gerado pelo `claude-ranqueado` deve seguir.

O objetivo é maximizar a chance do conteúdo ser citado por IAs generativas e aparecer em mecanismos de resposta — além do ranqueamento tradicional no Google.

---

## Plataformas-Alvo

Todo conteúdo deve ser otimizado simultaneamente para:

| Plataforma | O que prioriza |
|---|---|
| **Google AI Overviews** | Blocos citáveis, schema FAQ, E-E-A-T |
| **ChatGPT** | Respostas diretas, entidades claras, contexto aprofundado |
| **Gemini** | Cobertura semântica completa, estrutura escaneável |
| **Perplexity** | Fontes verificáveis, respostas objetivas, citabilidade por parágrafo |
| **Claude** | Contexto aprofundado, linguagem natural, estrutura lógica |

---

## 1. GEO — Generative Engine Optimization

### Princípio central
Conteúdo otimizado para GEO responde perguntas com autoridade, clareza e contexto suficiente para ser extraído e citado por uma IA sem necessidade de contexto externo.

### Regras obrigatórias

**Formato resposta-primeiro (answer-first):**
- Cada seção H2 deve começar com resposta direta de 1 a 2 frases
- A resposta vem antes da explicação — nunca depois
- Exemplo correto: *"O melhor notebook para estudantes é aquele que equilibra desempenho e bateria. A seguir, veja os critérios essenciais para escolher o ideal."*
- Exemplo incorreto: *"Escolher um notebook pode ser difícil. Existem muitos modelos no mercado..."*

**Blocos citáveis:**
- Cada bloco de conteúdo deve ser autossuficiente entre 120 e 180 palavras
- O bloco deve fazer sentido sozinho — sem depender do parágrafo anterior
- Inclui: contexto + resposta + evidência ou exemplo
- IAs extraem blocos — não artigos inteiros

**Cobertura semântica completa:**
- Cobrir o tema de forma aprofundada — sem lacunas relevantes
- Incluir entidades relacionadas: pessoas, marcas, lugares, conceitos nomeados
- Usar vocabulário do nicho de forma natural e consistente
- Quanto mais completo o contexto, maior a chance de citação por IA

**Entidades e contexto:**
- Nomear corretamente pessoas, marcas, produtos, lugares e conceitos
- Evitar pronomes ambíguos — sempre referenciar a entidade pelo nome
- Conectar entidades ao tema principal de forma explícita

---

## 2. AEO — Answer Engine Optimization

### Princípio central
Conteúdo otimizado para AEO estrutura perguntas e respostas de forma que assistentes de voz, rich snippets e ferramentas generativas possam extrair a resposta exata sem reformulação.

### Regras obrigatórias

**FAQ estruturada:**
- Sempre o último H2 do artigo
- Mínimo 3 perguntas baseadas em PAA (People Also Ask) real da SERP
- Cada resposta: 250 a 300 caracteres (otimizado para rich snippets)
- Linguagem direta, objetiva e conversacional
- Schema JSON-LD FAQPage obrigatório

**Perguntas e respostas ao longo do conteúdo:**
- H3s funcionam como perguntas implícitas — respostas diretas no primeiro parágrafo
- Estrutura ideal: pergunta (H3) → resposta direta (1ª frase) → desenvolvimento
- Facilita extração por assistentes de voz e AI Overviews

**Estruturas escaneáveis:**
- Tabelas comparativas para Featured Snippets
- Listas quando há sequência ou enumeração clara
- Definições diretas no início de seções conceituais
- Nenhuma resposta importante enterrada no meio de um parágrafo longo

**Citabilidade por passagem:**
- Google e IAs indexam passagens individuais — não só páginas inteiras
- Cada parágrafo deve ter valor independente
- Evitar parágrafos que só fazem sentido com o contexto do anterior

---

## 3. Sinais de Qualidade para IAs (E-E-A-T Adaptado)

Para ser citado por IAs generativas, o conteúdo deve demonstrar:

| Sinal | Como aplicar |
|---|---|
| **Experiência** | Observações práticas, exemplos reais, perspectiva de quem testou |
| **Expertise** | Vocabulário técnico natural, profundidade, ausência de generalidades |
| **Autoridade** | Dados com fonte CITADA EM TEXTO (ex: "segundo a ANEEL"), sem hyperlink externo (ver regras-formatacao.md); comparações embasadas |
| **Confiabilidade** | Sem afirmações sem suporte, sem exageros, tom equilibrado |

---

## 4. Acessibilidade para Crawlers de IA

- Schema JSON-LD obrigatório (BlogPosting + FAQPage quando aplicável)
- Conteúdo renderizado em HTML — nunca dependente de JavaScript para exibir texto
- Alt text em todas as imagens com contexto + keyword quando natural
- Estrutura de headings limpa e hierárquica (H1 → H2 → H3)
- `robots.txt` não deve bloquear GPTBot, ClaudeBot, PerplexityBot

---

## 5. Checklist GEO + AEO antes de Entregar

- [ ] Cada H2 começa com resposta direta (answer-first)
- [ ] Blocos de 120-180 palavras autossuficientes presentes
- [ ] FAQ no último H2 com mínimo 3 perguntas PAA
- [ ] Respostas FAQ entre 250-300 caracteres
- [ ] Entidades nomeadas corretamente ao longo do texto
- [ ] Schema JSON-LD FAQPage gerado
- [ ] Nenhuma resposta importante enterrada em parágrafo longo
- [ ] Cobertura semântica completa — sem lacunas relevantes

---

## Como Carregar Esta Referência

Carregar quando: `/ranqueado escrever`, `/ranqueado reescrever`, `/ranqueado analisar`, `/ranqueado geo`, `/ranqueado planejamento`

```
Arquivo: skills/fase3-conteudo/references/regras-geo.md
```
