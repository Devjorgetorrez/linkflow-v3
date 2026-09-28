# Regras de Conteúdo — claude-ranqueado
> Referência carregada sob demanda pelo orquestrador e sub-skills de escrita, reescrita e análise.
> Versão: 1.0 | Junho 2026

---

## Propósito

Este arquivo define as regras de criação, reescrita, Google Discover e backlinks que todo conteúdo gerado pelo `claude-ranqueado` deve seguir. Complementa `regras-seo.md` — não repete suas regras.

---

## 1. Criação de Conteúdo

### Princípio central
Criar conteúdo superior aos concorrentes — original, profundo e otimizado para SEO, GEO e AEO.

### Regras obrigatórias

**Estrutura:**
- Respeitar a estrutura de H1, H2, H3 aprovada — nunca criar novos H2 sem autorização
- Nunca remover H2 existentes da estrutura definida
- Nunca alterar a hierarquia aprovada
- A estrutura vem do planejamento — o redator escreve o conteúdo, não decide a estrutura

**Fonte base:**
- Analisar os 3 artigos concorrentes fornecidos
- Extrair: estrutura, tópicos abordados, perguntas e respostas, nível de profundidade
- Superar a qualidade com mais profundidade, clareza e organização
- Nunca copiar — apenas se inspirar na estrutura, nunca no conteúdo

**Profundidade:**
- Cobrir o tema sem lacunas relevantes
- Aprofundar onde o concorrente foi superficial
- Substituir observações genéricas por explicações claras e exemplos práticos
- Trazer perspectiva própria, dados verificáveis ou ângulo diferenciado

**Aplicação de palavras-chave:**
- Distribuir naturalmente ao longo do texto
- Palavra-chave principal: conforme `regras-seo.md`
- Palavras secundárias: mínimo 2 vezes cada, em blocos diferentes
- Palavras semânticas: enriquecer vocabulário sem forçar repetição

---

## 2. Reescrita de Conteúdo

### Princípio central
Melhorar o conteúdo existente sem perder a essência — nunca destruir o que já funciona.

### O que sempre manter
- Intenção original do conteúdo
- Profundidade já alcançada
- Tom de voz estabelecido
- Estrutura lógica aprovada
- Links internos existentes

### O que sempre melhorar
- Atualizar dados e estatísticas desatualizados
- Aprofundar seções rasas
- Corrigir distribuição de palavras-chave
- Melhorar resposta-primeiro nas seções H2
- Adicionar FAQ se ausente
- Ajustar parágrafos fora do padrão de linhas

### O que nunca fazer
- Copiar frases ou parágrafos do original literalmente
- Reproduzir trechos de concorrentes
- Alterar estrutura de H2s sem autorização
- Reduzir profundidade do conteúdo original
- Remover links internos existentes

### Regra de originalidade
Todo texto reescrito deve ser 100% original — mesmo que baseado no original, deve ser completamente reformulado com linguagem própria.

---

## 3. Google Discover — Regras Específicas

> Aplicar exclusivamente ao modelo **Blog Discover**. Para outros modelos, ver `modelos-monetizacao.md`.

### Princípio central
Conteúdo Discover não compete por palavra-chave — compete por atenção no feed do celular.

### O que priorizar
- **Curiosidade:** o título deve despertar vontade imediata de clicar
- **Interesse humano:** temas que tocam emoções reais — surpresa, admiração, identificação
- **Emoção:** alegria, nostalgia, indignação controlada, inspiração
- **Tendências:** temas em alta no momento — não evergreen

### O que evitar
- Clickbait enganoso — título que não cumpre o que promete
- Promessas falsas — "você não vai acreditar" sem entrega real
- Sensacionalismo exagerado — alarmismo sem base
- Tom de venda — Discover é leitura casual, não decisão de compra

### Checklist Discover antes de publicar
- [ ] O título gera curiosidade genuína?
- [ ] A imagem hero é impactante e contextual? (mínimo 1200x630px)
- [ ] O primeiro parágrafo tem gancho emocional?
- [ ] O conteúdo entrega o que o título promete?
- [ ] O tom é leve e escaneável para leitura no celular?
- [ ] **Pergunta obrigatória:** "Isso teria potencial para gerar clique no feed do Discover?"

### Frequência
- Publicar múltiplos conteúdos por semana
- Formatos ideais: listas, tendências, curiosidades, dicas práticas, novidades
- Tamanho: conteúdo mais leve que Blog FDF — foco em escaneabilidade

---

## 4. Backlinks — Critérios de Qualidade

### Princípio central
Qualidade acima de quantidade. Um backlink ruim prejudica mais do que ajuda.

### Ordem de prioridade na análise
1. **Contexto temático** — o site que linka fala do mesmo tema?
2. **Autoridade do domínio** — DA relevante e crescente
3. **Tráfego real** — o domínio recebe visitas orgânicas reais?
4. **Link Juice** — o link passa autoridade ou tem nofollow?
5. **Relevância temática** — o artigo que linka é sobre o mesmo assunto?

### Métricas de avaliação

| Métrica | O que analisar |
|---|---|
| DA (Domain Authority) | Preferir domínios com DA crescente, não necessariamente alto |
| Tráfego do domínio | Domínio com tráfego real vale mais que domínio "comprado" |
| Contexto temático | Link de site do mesmo nicho vale 3x mais |
| Link Juice | Dofollow em posição de destaque no conteúdo |
| Relevância do artigo | O artigo que linka aborda o mesmo tema da página linkada? |

### O que evitar em backlinks
- Links de sites sem tráfego real
- Links de redes de blog (PBN) com padrão artificial
- Links de páginas não relacionadas ao tema
- Excesso de links com o mesmo anchor text exato
- Links de domínios penalizados pelo Google

### Anchor text — boas práticas
- Variar entre: keyword exata, keyword parcial, branded, URL nua, genérico
- Nunca concentrar mais de 30% dos backlinks no mesmo anchor text
- Anchor text deve ser natural dentro do contexto do parágrafo

---

## 5. Topical Authority — Construção de Autoridade Temática

### Estrutura de cluster
- **Conteúdo Rei (Pillar):** artigo principal — cobre o tema de forma ampla e profunda
- **Conteúdo Soldado (Supporting):** artigos secundários — cobrem subtópicos específicos
- **Linkagem interna:** soldados linkam para o rei; rei linka para os soldados

### Regras de linkagem interna
- Mínimo 3 links internos por 1.500 palavras
- Links devem ser contextuais — dentro do corpo do texto, não só no rodapé
- Anchor text descritivo — nunca "clique aqui"
- Priorizar links para o conteúdo Rei do cluster

### Clusterização por modelo de monetização
> O cluster (autoridade temática de busca) aplica-se a modelos INFORMACIONAIS e COMERCIAIS.
> Detalhes e critérios completos em `regras-cluster.md`.
- **Blog FDF:** cluster por categoria de produto — satélites = cada produto avaliado (1 artigo
  por produto) + subtópicos de compra (tipos, comparativos, como escolher)
- **Blog Search / Site Money:** cluster por subtópicos informacionais + comerciais do tema
  (o transacional PURO não forma cluster — é conversão, não rede de conteúdo)
- **Blog Discover:** NÃO usa cluster (compete por atenção no feed, não por palavra-chave) —
  usar o planejamento próprio do Discover
- **Site FDF Local / transacional:** NÃO usa cluster (página de conversão de serviço/localização)

---

## Como Carregar Esta Referência

Carregar quando: `/ranqueado escrever`, `/ranqueado reescrever`, `/ranqueado planejamento`, `/ranqueado cluster`, `/ranqueado auditoria`

```
Arquivo: skills/fase3-conteudo/references/regras-conteudo.md
```
