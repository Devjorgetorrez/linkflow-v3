# Regras de Formatação e Proibições — claude-ranqueado
> Versão: 1.0 | Junho 2026
> Referência consultada pelos redatores e pelo reviewer ao escrever/avaliar artigos
> Define COMO o artigo deve ser formatado e O QUE é PROIBIDO. Régua única — resolve as
> divergências que existiam espalhadas em regras-seo.md, rubrica-pontuacao.md e nos redatores.

---

## REGRA DE PARÁGRAFOS (estrutura de escrita) — INEGOCIÁVEL

Esta é a régua ÚNICA de tamanho de parágrafo. Onde outros arquivos divergirem, ESTA vale.

```
TODOS OS MODELOS — Blog FDF, Blog Search, Site Money, Blog Discover:
  → cada H1, H2 e H3 = MÍNIMO 2 parágrafos
  → cada parágrafo = 4 a 5 linhas (nunca abaixo de 4, nunca acima de 5)
  → NUNCA um parágrafo de 1 linha (é o erro a evitar — escrita rasa, escaneável demais)

EXCEÇÃO — FAQ (em qualquer modelo):
  → parágrafos de 2 linhas em média (resposta objetiva, direta)
  → ainda assim, nunca uma única linha solta

POR QUÊ: parágrafo de 1 linha gera conteúdo raso, sem profundidade, ruim para SEO/GEO.
Dois parágrafos de 4-5 linhas por seção garantem desenvolvimento real do subtópico.
```

---

## PROIBIÇÕES (o que NUNCA incluir no artigo)

Estes itens NÃO devem aparecer em nenhum artigo gerado. São decisões do dono do método.

```
❌ TOC / ÍNDICE "Neste guia" / sumário com âncoras
   → NÃO criar índice de navegação no topo do artigo
   → não está nos templates; polui e não agrega ao leitor do blog
   → vale para TODOS os modelos (FDF, Search, Discover, Local)

❌ LINKS EXTERNOS (hyperlink para fora do site = backlink que você DOA)
   → NÃO criar hyperlink para sites externos (.gov, fabricantes, fontes, qualquer domínio externo)
   → MOTIVO: um link de saída DOA autoridade (link juice) do seu site para o outro. Não queremos
     ficar doando autoridade para fora.
   → A CITAÇÃO de fonte em TEXTO é OBRIGATÓRIA e BOA (E-E-A-T): escrever "segundo a ANEEL,
     jun/2026" ou "dados do Inmetro" SEM transformar em hyperlink. A fonte citada em texto já é
     uma "referência verificável" (atende a regra de GEO) — o leitor pode pesquisar a fonte.
   → links INTERNOS (para outras páginas do próprio site/cluster) continuam OBRIGATÓRIOS
   → vale para TODOS os modelos

❌ GRÁFICO automático (SVG de barras/comparativo)
   → NÃO gerar gráfico por iniciativa própria
   → só criar gráfico se o usuário PEDIR explicitamente
   → (a antiga "ETAPA 5.6 opcional" do redator blog-fdf fica DESATIVADA por padrão)

❌ BYLINE de autor no corpo ("Por [Nome] · Atualizado em...")
   → NÃO escrever linha de autoria/byline dentro do artigo
   → autor é configuração do WORDPRESS (perfil do autor), não conteúdo do texto
   → a data de atualização também é do WordPress, não escrita no corpo
   → vale para TODOS os modelos
```

---

## IMAGEM HERO (resolve a contradição que existia)

```
→ o hero do artigo DEVE vir com uma URL REAL e VERIFICADA de banco gratuito
   (Pexels, Unsplash, Pixabay) — uma URL que funcione E que seja do TEMA do artigo
→ OBRIGATÓRIO buscar via WebSearch antes de inserir (ex: "Pexels lava e seca",
   "Unsplash washing machine"). A URL vem de um resultado de busca real —
   NUNCA escolhida de memória/treino. URL "lembrada" pode apontar para tema errado
   (caso real: foto de concreto num artigo de lava e seca).
→ VALIDAR relevância temática: a foto tem que ser do produto/nicho do artigo.
   Se a busca não trouxer imagem claramente relevante, entregar o texto de sugestão
   de busca em vez de URL aleatória — melhor sem hero do que hero errado.
→ vale para TODOS os modelos (Blog FDF, Blog Search, Site Money, Discover, Local, Infoproduto)
→ a imagem hero entra com a URL do banco + ALT descritivo com a KW
→ ISSO SUBSTITUI duas regras antigas:
   (a) a "pessoa hiper-realista" do prompt-mestre no hero → NÃO usar mais; usar foto de banco
   (b) a regra "NUNCA usar URL de banco" → essa valia para FOTO DE PRODUTO, não para o hero
→ ESCLARECIMENTO por tipo de imagem:
     • HERO (topo de qualquer artigo): URL REAL e VERIFICADA de banco gratuito ✅
     • FOTO DE PRODUTO (cada item de um review Blog FDF): placeholder para o usuário subir no
       WordPress (a foto real vem da Amazon/loja, o usuário arrasta) — NÃO usar banco aqui
```

---

## ENCODING — UTF-8 obrigatório no HTML entregue

```
→ Todo artigo entregue em HTML (fragmento para Gutenberg ou página) DEVE começar com
   <meta charset="utf-8"> no topo do fragmento.
→ Todo o texto é UTF-8: acentos (ç, ã, é, õ, á) e travessões (—) escritos diretos.
→ PROIBIDO entregar com mojibake: vocÃª, opÃ§Ãµes, PreÃ§o, â€" (isso é UTF-8 lido como
   Latin-1/Windows-1252). Se aparecer, o encoding quebrou — corrigir antes de entregar.
→ CONFERIR antes de entregar: os acentos estão como "ç/ã/é" e NÃO como "Ã§/Ã£/Ã©".
→ ATENÇÃO À CONSISTÊNCIA: o encoding tem que ser correto no ARQUIVO INTEIRO, não só no
   começo. Já houve caso real de metade do arquivo com acento e metade sem (acentos
   corretos na intro/schema, perdidos do FAQ em diante). Conferir do topo ao rodapé.
   Se escrever em mais de uma passada, garantir UTF-8 em todas. NUNCA usar PowerShell
   para reescrever o arquivo (corrompe acento) — usar Bash/ferramenta de arquivo.
→ Vale para TODOS os modelos que entregam HTML (FDF, Search, Site Money, Local, Infoproduto).
```

---

## FAQ — resposta curta (regra única, todos os modelos com FAQ)

```
→ Cada resposta de FAQ tem NO MÁXIMO 300 caracteres (regra ÚNICA — substitui e prevalece
   sobre qualquer menção a "2-4 linhas", que era ambígua e gerava parágrafo longo).
→ Objetivo: resposta direta, pronta para rich snippet / featured snippet.
→ Cada pergunta = H3. Resposta objetiva, 1 ideia central, sem encher.
→ É gate: o checker bloqueia resposta de FAQ acima de 300 caracteres.
→ Vale para todos os modelos que têm FAQ (Blog FDF, Blog Search, Site FDF).
   Discover normalmente não tem FAQ de produto — se tiver, segue a mesma regra.
```

---

## RÉGUA FECHADA DO REVIEWER — não inventa NENHUM requisito

```
→ O reviewer pontua SOMENTE pelos critérios escritos na rubrica-pontuacao.md.
   Se um item NÃO está na rubrica, ele NÃO existe para o reviewer: não pontua,
   não penaliza, não exige, não sugere como obrigatório.
→ PROIBIDO o reviewer inventar elemento de estrutura que não está no template nem
   na rubrica. Exemplos REAIS de invenção indevida (todos proibidos):
     • exigir/criar uma caixa de "Pontos Principais" / "Key Takeaways" / resumo no topo
     • exigir um "índice", "sumário" ou "TL;DR"
     • exigir autoria / byline / bio de autor (é config do WordPress, fora do conteúdo)
     • qualquer seção, bloco ou requisito que o template do modelo não pede
→ Se o reviewer "acha" que faltou algo: só pode apontar se esse algo ESTÁ na rubrica
   ou no template. Caso contrário, é alucinação de requisito — não reportar.
→ Regra de ouro: o template manda na estrutura; a rubrica manda na pontuação.
   O reviewer não é autor de requisitos — é aplicador dos que já existem.
```

---

## LINK INTERNO — nunca sai como placeholder cru

```
→ Marcadores de link interno ([INTERNAL-LINK], [INTERNAL-LINK-PLACEHOLDER: ...],
   [LINK-INTERNO: ...], [INTERNAL-LINK #N], etc.) NUNCA podem aparecer no texto final
   entregue ao leitor. São andaime interno, não conteúdo.
→ No momento da entrega, cada marcador tem dois destinos possíveis:
     (a) RESOLVER: virar link real para um artigo que existe no histórico/projeto.md
         ou no cluster salvo — âncora descritiva + destino real
     (b) REMOVER limpo: se não há artigo de destino, apagar o marcador e deixar a
         frase fluindo natural (NUNCA deixar "[INTERNAL-LINK...]" no meio do texto)
→ PROIBIDO entregar com marcador cru visível. Conferir antes de entregar:
   busca por "[INTERNAL-LINK", "[LINK-INTERNO", "PLACEHOLDER" no corpo = zero ocorrências.
→ Vale para TODOS os modelos que usam marcador de link interno (FDF, Search, Discover,
   Site FDF). É gate: o checker barra a entrega se sobrar marcador cru.
```

## NATURALIDADE — não repetir a KW literal em frases vizinhas

```
→ Distribuir a KW e secundárias de forma NATURAL (ver regras-seo.md para densidade).
→ PROIBIDO repetir a mesma KW (primária ou secundária) de forma literal em frases
   vizinhas ou no mesmo parágrafo, criando leitura forçada. Exemplo real a evitar:
   "a roçadeira kawashima 43cc é... A roçadeira kawashima 43cc tem..." (stuffing feio).
→ Variar com sinônimos, pronomes e entidades relacionadas. A KW exata entra onde
   pesa para SEO (1º parágrafo, H2s-chave), não repetida a cada frase.
→ Discover NÃO usa KW (é ângulo editorial): para Discover, a regra vira "não repetir
   a mesma frase/ideia/lista em pontos diferentes do texto" (naturalidade editorial).
→ Vale para TODOS os modelos, na forma adequada a cada um.
```

```
❌ índice/TOC "Neste guia"          ❌ link externo (citar fonte em texto, sem hyperlink)
❌ gráfico automático (só sob pedido) ❌ byline "Por [autor]" no corpo
❌ parágrafo de 1 linha              ❌ reviewer pontuar/inventar requisito fora da rubrica
❌ marcador [INTERNAL-LINK] cru no texto  ❌ KW literal repetida em frases vizinhas
❌ "Pontos Principais"/takeaways inventado pelo reviewer
✅ hero com URL real e VERIFICADA de banco  ✅ 2 parágrafos de 4-5 linhas (FAQ 2 linhas)
✅ links internos resolvidos ou removidos limpos  ✅ citação de fonte em texto (sem link)
```

Carregar quando: `/ranqueado escrever`, `/ranqueado reescrever`, `/ranqueado atualizar`
(todos os redatores) e pelo reviewer (`ranqueado-reviewer`).
