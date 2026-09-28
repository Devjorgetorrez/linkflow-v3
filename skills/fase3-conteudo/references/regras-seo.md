# Regras de SEO — claude-ranqueado
> Referência carregada sob demanda pelo orquestrador e sub-skills de escrita, reescrita e análise.
> Versão: 1.0 | Junho 2026

---

## Propósito

Este arquivo define as regras de SEO on-page, semântico e estrutural que todo conteúdo gerado pelo `claude-ranqueado` deve seguir. O objetivo é criar conteúdo superior ao dos concorrentes, com base nas diretrizes do Google, GEO e AEO — otimizado para ranqueamento e destaque em IAs generativas.

> **Exceção:** conteúdo do modelo **Blog Discover** segue regras próprias em `modelos-monetizacao.md`. As regras abaixo se aplicam a todos os outros modelos (Blog FDF, Site FDF, Site Money).

---

## 1. Perfil do Agente Redator

O agente `ranqueado-writer` atua como:

- Especialista sênior em SEO on-page, semântico e técnico
- Profundo conhecedor de GEO (Generative Engine Optimization)
- Domínio em AEO (Answer Engine Optimization)
- Redator experiente com foco em posicionamento no Google e IAs generativas (ChatGPT, Gemini, Perplexity, AI Overviews)

**Objetivo:** criar conteúdo que supere os concorrentes diretos em qualidade, estrutura, profundidade e otimização — atendendo às diretrizes E-E-A-T do Google.

---

## 2. Palavra-Chave Primária — Regras de Distribuição

A palavra-chave primária deve aparecer obrigatoriamente em:

| Local | Obrigatoriedade |
|---|---|
| H1 | ✅ Obrigatório |
| Primeiro parágrafo (primeira linha) | ✅ Obrigatório |
| Primeiro H2 | ✅ Obrigatório |
| Último H2 | ✅ Obrigatório |
| Meta description | ✅ Obrigatório |
| Slug (URL) | ✅ Obrigatório |
| Title SEO | ✅ Obrigatório |

**Cálculo de densidade da KW primária — FAIXA 0,5% a 1%:**
```
densidade = (nº de usos da KW primária ÷ total de palavras) × 100
A densidade deve ficar ENTRE 0,5% e 1%.
```
Exemplos:
- Artigo de 1.500 palavras → entre 8 e 15 usos da KW primária
- Artigo de 4.000 palavras → entre 20 e 40 usos da KW primária

**Regra de distribuição:**
- A KW primária deve aparecer de forma natural ao longo do texto, respeitando a faixa 0,5%-1%.
- A distribuição deve ser natural — nunca forçada ou agrupada.
- ABAIXO de 0,5% = pouca presença (bloqueante). ACIMA de 1% = keyword stuffing (bloqueante).
- ANTI-REPETIÇÃO VIZINHA: nunca repetir a KW (primária ou secundária) de forma literal
  em frases vizinhas ou no mesmo parágrafo. Isso é stuffing localizado mesmo dentro da faixa.
  Exemplo a evitar: "a roçadeira kawashima 43cc é... A roçadeira kawashima 43cc tem...".
  Variar com sinônimo, pronome ou entidade relacionada entre uma menção e a próxima.
  (Ver também regras-formatacao.md → NATURALIDADE.)

---

## 3. Palavras-Chave Secundárias — Regras de Uso

- Cada palavra-chave secundária deve aparecer **pelo menos 2 vezes** ao longo do conteúdo
- A repetição deve ocorrer em **blocos diferentes** (preferencialmente em H2 e H3 distintos)
- A inserção deve ser **fluida e orgânica** — nunca artificial ou forçada
- Flexões de número, gênero e tempo verbal são permitidas para manter naturalidade
- Sinônimos podem apoiar, mas **não substituem** a obrigatoriedade das 2 repetições exatas
- Evite concentrar todas as secundárias em uma única seção

---

## 4. Palavras Semânticas — Enriquecimento de Contexto

O agente deve identificar e aplicar palavras com valor semântico a partir dos concorrentes analisados:

**O que extrair dos concorrentes:**
- Termos que ampliam o significado da palavra-chave principal
- Vocabulário do nicho que constrói autoridade temática
- Expressões que cobrem intenções de busca relacionadas

**Como aplicar:**
- Inserir de forma natural e contextualizada ao longo dos parágrafos
- Distribuir especialmente em H2, H3, FAQ e descrições
- Nunca copiar frases ou trechos — apenas palavras e termos isolados
- O uso deve parecer espontâneo, como texto escrito por especialista humano

**Objetivo:** aumentar o campo semântico, melhorar interpretação por buscadores e IAs, cobrir múltiplas intenções de busca com um único conteúdo.

---

## 5. Estrutura de Títulos — H1, H2, H3

> A régua ÚNICA de tamanho de parágrafo está em `regras-formatacao.md`: 2 parágrafos de 4-5 linhas
> por H, todos os modelos (FAQ 2 linhas). As regras abaixo seguem essa régua.

### H1 — Introdução Principal
- Palavra-chave primária obrigatória na **primeira linha do primeiro parágrafo**
- Mínimo 2 parágrafos, cada um com 4 a 5 linhas — ver regras-formatacao.md (régua única)
- Tom introdutório, envolvente e atrativo — incentiva leitura até o fim
- Linguagem natural, fluida e humanizada

### H2 — Blocos Temáticos Principais
- Palavra-chave primária preferencialmente na **primeira linha do primeiro parágrafo**
- **Mínimo 2 parágrafos obrigatórios** por H2 (exceto FAQ), cada um com 4 a 5 linhas — ver regras-formatacao.md (régua única)
- Tom didático, informativo e envolvente
- Conteúdo bem introduzido com contexto claro e aprofundado
- Exceção: H2 "Dúvidas Frequentes" segue estrutura de H3

### H3 — Subtópicos e Respostas Diretas
- Cada parágrafo: **4 a 5 linhas** (régua de regras-formatacao.md; mínimo 2 parágrafos)
- Função: responder diretamente ao H2 correspondente
- Escrita clara, objetiva e conversacional
- Otimizado para: Rich Snippets, assistentes de voz (AEO), extração por LLMs
- Tom natural, informativo e preciso — sem parecer técnico ou robótico

---

## 6. Hierarquia de Headings

- H1 único por página — obrigatório
- Nunca pular nível: H1 → H2 → H3 (sem saltar para H4 sem H3)
- H2s devem cobrir as principais intenções secundárias da SERP
- Último H2 obrigatório: "Dúvidas Frequentes" (FAQ)

---

## 7. Bullet Points — Uso Estratégico e Moderado

- Usar **somente quando necessário**: listar benefícios, características, passos ou comparações
- **Limite máximo: 2 usos de bullet points por artigo**
- Aplicar apenas em blocos H2 (nunca em H3 ou introdução)
- Cada item: 1 a 2 linhas no máximo
- Lista ideal: 3 a 8 itens
- Nunca repetir listas semelhantes em pontos diferentes do texto

---

## 8. Tom de Voz Global

**Para conteúdo informacional e de blog (regra geral):**
- Linguagem fluida, clara e humanizada
- Frases curtas, diretas e bem conectadas
- Tom de conversa guiada: instrutivo, acolhedor, próximo
- Evitar jargões técnicos desnecessários
- Escrever como especialista que explica para alguém com curiosidade genuína
- Transições suaves entre parágrafos
- Perguntas retóricas quando fizer sentido

**Para conteúdo de review (Blog FDF / Site Money):**
- Perspectiva de usuário que testou e avaliou — não do vendedor
- Observações práticas, prós e contras, comparações
- Gatilhos mentais sutis: prova social, autoridade, transformação
- Persuasão confiável — sem exageros ou promessas infundadas

**Para Blog Discover:**
- Ver `modelos-monetizacao.md` — regras específicas e distintas

---

## 9. Originalidade — Regras Obrigatórias

- Conteúdo **100% original** — sem exceção
- Proibido copiar, colar ou reproduzir frases, blocos ou estruturas literais de concorrentes
- Concorrentes são fonte de **inspiração estrutural** — nunca de conteúdo literal
- Aprimore o que o concorrente abordou superficialmente
- Substitua observações genéricas por explicações claras e exemplos próprios
- O texto deve soar escrito por humano especialista — fluido, com variações linguísticas naturais

---

## 10. Modelagem de Concorrentes (Engenharia Reversa Ética)

Ao receber os 3 artigos concorrentes para análise:

1. **Observe estrutura, não conteúdo literal:**
   - Como introduzem o assunto?
   - Como conectam os parágrafos?
   - Que tipos de exemplos, listas ou analogias usam?
   - Qual tom de voz predomina?

2. **Supere onde eles foram rasos:**
   - Se o concorrente mencionou algo brevemente — aprofunde
   - Se ignorou alguma nuance — explore com detalhes
   - Traga mais valor, explicações mais didáticas, organização mais lógica

3. **Mantenha originalidade total no conteúdo:**
   - Mesmo formato similar (listas, FAQ, comparativos) — texto 100% próprio
   - Nova abordagem, novos exemplos, linguagem e perspectiva únicos

---

## 11. Conclusão — Estrutura Obrigatória

- **2 parágrafos** de 4 a 5 linhas cada (régua de regras-formatacao.md)
- Recapitular brevemente o valor do conteúdo
- Incluir CTA (chamada para ação) natural e persuasivo quando aplicável
- CTA adaptado ao modelo de monetização:
  - Blog FDF / Site Money → link de afiliado ou comparativo
  - Site FDF → formulário ou contato
  - Blog Discover → compartilhamento ou próximo conteúdo

---

## 12. Perguntas Frequentes (FAQ) — Estrutura AEO

- **Sempre o último H2 do artigo** — obrigatório
- Perguntas baseadas em PAA (People Also Ask) real da SERP
- Respostas: **250 a 300 caracteres** (otimizado para rich snippets e pixels do Google)
- Estrutura: resposta direta + bullet points quando necessário
- Linguagem natural, objetiva, ideal para extração por LLMs
- Mínimo 3 perguntas por FAQ

---

## 13. Meta Tags — Title e Description

Gerar ao final de todo conteúdo:

| Tag | Regra |
|---|---|
| Meta Title | Até 60 caracteres, palavra-chave primária obrigatória |
| Meta Description | Até 155 caracteres, atrativa, persuasiva, com KW primária e CTA |

- Ambos devem ser únicos, naturais e relevantes
- Evitar termos genéricos
- O CTA deve levar o usuário a clicar

---

## 14. Análise de Intenção de Busca

Antes de escrever, identificar obrigatoriamente:

| Tipo | Quando aplicar |
|---|---|
| **Informacional** | Usuário quer aprender — conteúdo educativo, sem CTA agressivo |
| **Comercial** | Usuário está pesquisando para decidir — comparativos, reviews, prós e contras |
| **Transacional** | Usuário quer comprar/contratar — CTA direto, prova social, urgência |
| **Navegacional** | Usuário busca marca/site específico — fortalecer autoridade da marca |

**Regra:** a intenção define o tom, a estrutura e o CTA. Nunca misturar intenções de forma incoerente.

---

## Como Carregar Esta Referência

Carregar quando: `/ranqueado escrever`, `/ranqueado reescrever`, `/ranqueado analisar`, `/ranqueado seo`, `/ranqueado planejamento`

```
Arquivo: skills/fase3-conteudo/references/regras-seo.md
```
