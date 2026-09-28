---
name: ranqueado
description: >
  Suite de criacao de conteudo SEO para Blog FDF, Blog Search, Site FDF e Site Money.
  Orquestra pesquisa, planejamento, estrutura, escrita e revisao com 3 paradas de
  aprovacao, tom de voz por modelo e contexto por cliente (projeto.md). Roteia para
  o redator certo conforme o modelo de monetizacao detectado e aplica gate de qualidade.
  Modulo de estrategia (pre-planejamento): cluster com dados reais + mapa de links internos.
  Comandos: configurar, escrever, analisar, reescrever, atualizar, brief, calendario, cluster.
  Use quando o usuario disser "ranqueado", "escrever artigo", "criar conteudo SEO",
  "analisar artigo", "reescrever", "atualizar artigo", "brief", "pauta", "calendario editorial",
  "cluster", "topical authority", "arquitetura de conteudo", "pre-planejamento", "links internos".
user-invokable: true
argument-hint: "<comando: configurar | escrever | analisar | reescrever | atualizar | brief | calendario | cluster> <tema, nicho ou arquivo>"
license: MIT
---
# claude-ranqueado — Orquestrador Principal
# Versão: 0.2 | Junho 2026
# Suite de criação de conteúdo SEO com paradas de aprovação, tom de voz e contexto por cliente

---

## Comandos Disponíveis

- `/ranqueado configurar` — setup inicial do cliente (cria o projeto.md)
- `/ranqueado escrever <palavra-chave>` — pesquisa, planeja, estrutura e escreve o artigo
- `/ranqueado analisar <arquivo-ou-texto>` — audita um artigo (da suite ou de fora) e dá o score 0-100 + o que melhorar, SEM reescrever
- `/ranqueado reescrever <arquivo-ou-texto>` — otimiza um artigo existente: diagnostica, corrige só o apontado e revalida (score antes/depois)
- `/ranqueado atualizar <arquivo-ou-texto>` — atualiza um artigo com dados frescos (estatísticas, anos, preços) e reforça o sinal de recência; é o reescrever com foco em freshness
- `/ranqueado brief <tema>` — gera um briefing de conteúdo standalone (KW, concorrentes, estrutura sugerida, ângulo, distribuição) SEM escrever o artigo; para aprovar ou delegar
- `/ranqueado calendario [mensal|trimestral]` — gera um calendário editorial: organiza vários artigos no tempo (pillar/supporting + content mix), lendo o histórico para não repetir e sinalizar decay
- `/ranqueado cluster plan --from-pillar <arquivo>` — usa o artigo pillar JÁ ESCRITO como base, deriva os satélites do conteúdo real (produtos/subtópicos cobertos), monta o mapa de links internos e apresenta o plano para aprovação
- `/ranqueado cluster execute` — lê o plano aprovado e escreve os satélites com contexto de cluster injetado, e injeta no pillar os links de descida

---

## Como Usar

```
Primeira vez com um cliente:
/ranqueado configurar

Criar um artigo:
/ranqueado escrever "melhores carrinhos de bebê"

Trocar de cliente:
Feche o Claude Code e reabra na pasta do outro cliente.
```

---

## CONTEXTO DO PROJETO — Ler SEMPRE Antes de Qualquer Comando

Antes de executar qualquer comando, o orquestrador procura o arquivo `projeto.md` na pasta atual.

```
Existe projeto.md na pasta?
  → SIM: ler e carregar o contexto (tom de voz, concorrentes, artigos publicados, nicho, URL)
  → NÃO: avisar você que precisa rodar /ranqueado configurar primeiro
```

O `projeto.md` é a memória permanente do cliente entre sessões. Contém:
- Tom de voz aprovado
- Modelo de monetização
- Nicho e URL do site
- Concorrentes de referência
- Histórico de artigos criados pela suite (auto-atualizado — para linkagem interna)
- Lista manual opcional de artigos antigos do site

---

## Comando `/ranqueado configurar`

Cria o `projeto.md` do cliente. Faz uma entrevista — UMA pergunta por vez.

```
1. Qual o nome do seu projeto ou site?
2. Qual a URL do site? (opcional — pode deixar em branco)
3. Qual o nicho?
4. Qual o modelo de monetização? Pode escolher mais de um:
   - Blog FDF (review + afiliado)
   - Site FDF (transacional / infoproduto)
   - Blog Discover (interesse humano)
   - Site Money (informacional + comercial)
5. Quais os concorrentes de referência? (cole as URLs)
6. O site já tem artigos publicados de antes?
   - Sim → pelo sitemap (recomendado) ou lista manual — para linkagem interna
   - Não / site novo → seguir com lista vazia
```

Após a entrevista:
- Sugere um tom de voz baseado no modelo de monetização (ver tabela abaixo)
- Você aprova ou ajusta
- Salva tudo no `projeto.md`
- A seção "Artigos Criados pela Suite" começa vazia e se preenche sozinha

---

## Lembrete sobre Troca de Cliente

Para trabalhar em outro cliente, você fecha o Claude Code e reabre na pasta do cliente desejado. O orquestrador lê o projeto.md daquela pasta automaticamente. Não há comando de troca — a pasta é o contexto.

---

## Links Internos — Histórico Automático da Suite

A suite registra cada artigo que cria. Esse histórico alimenta os links internos.

```
Quando um artigo é criado:
→ O orquestrador adiciona o slug + título na seção
  "Artigos Criados pela Suite" do projeto.md

Quando um novo artigo é planejado:
→ O outline lê o histórico de artigos já criados pela suite
→ Cruza com o tema do novo artigo
→ Sugere os links internos relevantes
```

A suite conhece o que ela mesma criou (registrado no projeto.md). Além disso, ao configurar o cliente, o sitemap do site pode ser capturado no projeto.md — assim o módulo de estratégia (cluster) consegue planejar links internos para o site inteiro, não só para o que a suite criou. Para sites sem sitemap, vale a lista manual opcional de páginas no projeto.md.

---

## Detecção de Intenção e Template

Ao receber `/ranqueado escrever <query>`, analisar a query e detectar:

### Intenção de Busca

| Sinal na query | Intenção |
|---|---|
| "melhores", "top", "ranking" | Comercial |
| "como", "o que é", "guia", "passo a passo" | Informacional |
| "comprar", "preço", "onde", "contratar" | Transacional |
| "[cidade]", "[serviço] em [local]" | Local |
| tendência, lifestyle, beleza, comportamento | Editorial (Discover) |

### Template

| Intenção + Sinal | Template |
|---|---|
| Comercial + "melhores X" (lista) | blog-fdf-review |
| Comercial + "X vs Y" | blog-fdf-comparativo |
| Comercial + "review X" ou "X vale a pena" | blog-fdf-produto-unico |
| Transacional + local | site-fdf-seo-local |
| Transacional + curso/formação | site-fdf-infoproduto |
| Informacional + "como" ou "passo a passo" | blog-search-informacional |
| Informacional + "guia completo" ou "o que é" | blog-search-guia |
| Informacional + número no título esperado | blog-search-lista |
| Editorial + tendência/lifestyle | blog-discover |

### Modelo de Monetização

| Template | Modelo |
|---|---|
| blog-fdf-review · blog-fdf-comparativo · blog-fdf-produto-unico | Blog FDF |
| site-fdf-seo-local · site-fdf-infoproduto | Site FDF |
| blog-search-informacional · blog-search-guia · blog-search-lista | Site Money ou Blog FDF (conforme nicho) |
| blog-discover | Blog Discover |

---

## Tom de Voz — Sugestão Automática por Modelo

Quando o `projeto.md` ainda não tem tom de voz definido, ou quando você pede para revisar, o orquestrador sugere baseado no modelo de monetização. Você sempre aprova ou ajusta.

| Modelo | Tom de Voz Sugerido (descrição detalhada) |
|---|---|
| **Blog FDF** | Analítico e comparativo. Escreve como um testador independente que usou os produtos. Equilibra dados técnicos com linguagem acessível. Honesto sobre prós e contras. Não soa como vendedor nem como fabricante. Usa primeira pessoa do plural ("testamos", "avaliamos"). |
| **Blog Discover** | Editorial e pessoal. Jornalista próxima que viveu o assunto. Usa microhistórias e opinião pessoal. Tom emocional e envolvente. Primeira pessoa do singular. Sem jargão técnico. Provoca curiosidade e identificação. ZERO emojis. |
| **Site FDF Local** | Direto e confiante. Foco em conversão e confiança. Linguagem clara e objetiva. Transmite autoridade e urgência sem ser agressivo. Foca em resolver o problema do cliente local. Tom de empresa estabelecida e confiável. |
| **Site FDF Infoproduto** | Transformacional. Foca na mudança que você vai viver. Usa gatilhos mentais sutis (prova social, autoridade, urgência). Inspirador mas honesto. Conecta o curso ao sonho/objetivo do comprador. Primeira e segunda pessoa ("você vai aprender"). |
| **Blog Search** | Informativo e didático. Especialista acessível que explica sem complicar. Estrutura clara e escaneável. Respostas diretas seguidas de aprofundamento. Tom de quem domina o assunto e quer ensinar. Neutro e confiável. |
| **Site Money** | Híbrido. Combina o didático do informacional com o persuasivo do comercial. Educa primeiro, sugere depois. Tom de consultor que ajuda a decidir. CTA suave e contextual. |

---

## Fluxo do Comando `/ranqueado escrever` — COM 3 PARADAS OBRIGATÓRIAS

### PASSO 1 — Detectar contexto

```
1. Ler o projeto.md da pasta do cliente (tom de voz, concorrentes, histórico de artigos)
2. Ler a query informada por você
3. Identificar intenção de busca
4. Selecionar template correto
5. Identificar modelo de monetização
6. Carregar template correspondente
7. Se o projeto.md não tiver tom de voz → sugerir baseado no modelo
```

### PASSO 1.5 — Verificar se este tema já pertence a um cluster

```
Verificar se este artigo já faz parte de um cluster planejado:

→ Ler a seção "Clusters Planejados" do projeto.md (a memória dos clusters salvos)

CASO o tema JÁ ESTEJA num cluster salvo (é o pillar ou um satélite):
  → ÓTIMO: carregar o MAPA DE LINKS daquele cluster para usar na escrita (ver PASSO 4)
  → seguir para o PASSO 2

CASO NÃO esteja em nenhum cluster salvo:
  → seguir normalmente para o PASSO 2, sem sugerir nada agora
  → o cluster é planejado DEPOIS, a partir do post pronto (ver PASSO 6)

REGRA DE FLUXO: o pillar vem PRIMEIRO. Não se planeja cluster antes de escrever
o pillar — planejar satélite sem o pillar é planejar no escuro. Quando este
artigo tiver cara de pillar (página ampla: "melhores X", guia guarda-chuva), a
SUGESTÃO de montar o cluster acontece no FINAL (PASSO 6), usando o post pronto
como base. O escrever tem planejamento MICRO próprio (PARADAS 1 e 2); o cluster
é o planejamento MACRO, que vem depois e se apoia no conteúdo real do pillar.
```
```

### PASSO 2 — Chamar agente de planejamento

> **IMPORTANTE (acesso ao MCP):** a pesquisa de palavra-chave usa os MCPs
> (Semrush/Ubersuggest), que só funcionam na thread principal. NÃO delegar a
> pesquisa a um subagente isolado — o subagente não herda o MCP e cai no
> WebSearch mesmo com o MCP conectado. Executar a etapa de pesquisa na thread
> principal para garantir dados reais de volume.

**Se template = blog-discover:**
→ Chamar `ranqueado-planejamento-discover`
→ Passar: tema + template + modelo + tom de voz + concorrentes do projeto.md

**Se template = qualquer outro:**
→ Chamar `ranqueado-planejamento`
→ Passar: query + template + modelo + tom de voz + concorrentes do projeto.md

**NUNCA alterar a query ou tema informado por você.**

### ⏸ PARADA 1 — Validação do Planejamento (OBRIGATÓRIA)

Após o planejamento, apresentar a você e AGUARDAR aprovação:

```
Apresentar:
- Ferramenta usada na pesquisa (Semrush/Ubersuggest = volume real | WebSearch = volume estimado por SERP) — MOSTRAR PRIMEIRO
- KW primária confirmada (e como foi confirmada)
- Intenção de busca detectada
- KWs secundárias
- Palavras semânticas
- Concorrentes que serão analisados
- Tom de voz sugerido/carregado

Perguntar: "O planejamento está correto? Posso avançar para a estrutura?
Você pode ajustar a KW, o tom de voz ou qualquer item antes de continuar."

NÃO AVANÇAR sem aprovação explícita seu.
```

### ⏸ PARADA 1.5 — ENTREVISTA GUIADA (somente Site FDF: Infoproduto e Local)

```
GATILHO: se o modelo detectado for Site FDF Infoproduto OU Site FDF Local, rodar a
entrevista ANTES de montar os H2 (o outline depende desses dados — módulos, professor,
serviços, etc. definem as seções da página). Para os OUTROS modelos (Blog FDF, Blog
Search, Site Money, Discover): NÃO há entrevista — pular direto para o PASSO 3.

POR QUE AQUI: a página de vendas tem campos que só o dono sabe (módulos, instrutor,
preço / nome do negócio, serviços, endereço). Sem eles, o outline e o texto saem com
placeholder inventado. A entrevista vem ANTES dos H2, não depois.

ABERTURA (deixar claro o que vai acontecer — senão o aluno fecha e sai):
"Antes de montar a estrutura, preciso de alguns dados do seu [curso/negócio] para
 preencher a página com a verdade — não com placeholder. Vou te fazer algumas
 perguntas em blocos de 3, mostrando o progresso. Pode responder com calma:
 o ideal é 2-3 parágrafos por resposta, porque isso vira o conteúdo real da página."

MECÂNICA (obrigatória):
- Perguntar em BLOCOS DE 3 por vez — nunca todas de uma vez, nunca uma só.
- Mostrar SEMPRE o progresso e para onde vamos: "Bloco 1 — perguntas 1 a 3 de [N]".
- Em cada pergunta: dizer o que ela alimenta na página ("isto vira a tabela de módulos")
  e orientar o tamanho ("responda 2-3 parágrafos").
- Usar EXATAMENTE as perguntas definidas no agente do modelo (não inventar, não cortar):
  → Infoproduto: as perguntas da ONDA 1 (essenciais) do redator-site-fdf-infoproduto
  → Local: as perguntas da ONDA 1 (essenciais) do redator-site-fdf-local
  As de ONDA 2 (aprofundamento) seguem opcionais — se o dono não tiver, segue sem a seção.
- Esperar a resposta de cada bloco antes de mandar o próximo.
- Ao terminar: confirmar o que foi coletado e SÓ ENTÃO seguir para o PASSO 3 (outline),
  que agora monta os H2 com base nos dados reais.

NÃO MONTAR OS H2 sem as respostas essenciais. É gate: sem ONDA 1 respondida, não avança.
```

### PASSO 3 — Chamar ranqueado-outline

Passar para o agente APENAS OS DADOS (nunca uma estrutura pronta):
```
- relatório aprovado do planejamento (KW, secundárias, semânticas, intenção)
- H2s brutos dos concorrentes + gaps identificados
- template + modelo + tom de voz aprovado
- histórico de artigos criados pela suite + lista manual opcional (para links internos)
```

> **AJUSTE CRÍTICO:** o orquestrador NUNCA passa uma estrutura/esqueleto pronto para o
> outline. O outline DEVE derivar a estrutura sozinho, a partir dos H2s dos concorrentes
> e dos gaps. Prescrever a estrutura anula a inteligência do agente e gera erro.

### PASSO 3.5 — Validar o outline com o revisor-pauta (GATE OBRIGATÓRIO)

Antes de mostrar qualquer coisa a você, chamar o agente `revisor-pauta`:
```
Passar: KW primária + H1-H4 dos concorrentes + a pauta proposta pelo outline

O revisor-pauta valida os gates mínimos:
- KW primária EXATA no 1º e no último H2 (antes do FAQ)
- 1º H2 em formato de pergunta
- FAQ como último H2
- Sem títulos duplicados, hierarquia consistente
- Tabela comparativa de decisão rápida ANTES do 1º H2 (logo após a introdução, nunca como H2 separado)
- Em review: cada produto com Prós e Contras

SE REPROVAR (gate bloqueante):
  → devolver ao ranqueado-outline com os motivos
  → outline corrige
  → revisor-pauta valida de novo (até passar)
  → NÃO mostrar a você enquanto não passar

SE APROVAR:
  → seguir para a PARADA 2
```

> O revisor-pauta NUNCA é pulado. É ele que impede que erros de estrutura (KW ausente
> no H2, tabela como H2, títulos variados) cheguem a você. Sem este passo, o gate
> não existe na prática.

### ⏸ PARADA 2 — Aprovação do Outline (OBRIGATÓRIA)

Após o outline passar no revisor-pauta, apresentar a você e AGUARDAR aprovação:

```
Apresentar:
- TODOS os H2 e H3 REAIS, com os títulos exatos (NUNCA só uma tabela de blocos resumida)
- Você precisa ver cada título como ele vai ficar, para poder auditar
- Word count por seção
- Links internos sugeridos (cruzando o tema com a lista do projeto.md)
- Meta tags
- Resultado do revisor-pauta (nota + checklist)

Perguntar: "A estrutura está correta? Você pode ajustar os títulos, trocar
o H1, adicionar ou remover links internos antes de eu escrever o artigo."

NÃO AVANÇAR sem aprovação explícita seu.
```

### PASSO 4 — Chamar o redator do modelo

Escolher o redator conforme o modelo detectado:
- Blog FDF → `redator-blog-fdf`
- Blog Search / Site Money → `redator-blog-search`
- Site FDF Local → `redator-site-fdf-local`
- Site FDF Infoproduto → `redator-site-fdf-infoproduto`
- Discover → `redator-discover` (recebe o briefing do ranqueado-planejamento-discover)

Passar para o redator:
```
- estrutura aprovada do outline
- template + modelo + tom de voz aprovado
- AMBIENTE DE PUBLICAÇÃO (do projeto.md, seção "Ambiente de Publicação"): Gutenberg /
  Clássico / Outro / não definido. O redator USA isso para escolher o formato de saída
  (Gutenberg ou não definido → markdown limpo editável; Clássico/HTML → HTML com CSS inline).
  Se o projeto.md não tiver o campo preenchido, passar "não definido" (o redator usa markdown).
- links internos aprovados — incluindo os do CLUSTER, se este artigo pertence a um:
  → se o PASSO 1.5 encontrou este tema num cluster salvo, passar o MAPA DE LINKS daquele
    cluster (ex: "este é o satélite X → deve linkar para o pillar Y com âncora Z")
  → assim o link interno ESTRATÉGICO do cluster acontece de fato (não só o reativo)
- regras de SEO/GEO/AEO das referências
```

### PASSO 5 — CONTRATO DE ENTREGA (gate obrigatório) + Revisão

Inspirado no delivery contract da referência. Regra de ouro: **você NUNCA é o primeiro revisor — os gates são.** Nenhum artigo chega à PARADA 3 sem passar pelo contrato de entrega.

```
PASSO 5.1 — Rodar o CONTRATO DE ENTREGA (preflight unificado):

  RESOLVER O CAMINHO DO SCRIPT E O COMANDO PYTHON PRIMEIRO (inspirado na referência —
  NUNCA usar caminho relativo nu nem assumir o nome do comando). Usar BASH, não PowerShell
  (o PowerShell em background falhou silenciosamente em teste real):

    # 1. Resolver o caminho do script: instalado primeiro, clone de dev segundo.
    if [ -f "$HOME/.claude/skills/ranqueado/scripts/preflight.py" ]; then
        PREFLIGHT="$HOME/.claude/skills/ranqueado/scripts/preflight.py"
    elif [ -f "scripts/preflight.py" ]; then
        PREFLIGHT="scripts/preflight.py"
    else
        PREFLIGHT=""   # não encontrado — ver fallback honesto no PASSO 5.2
    fi

    # 2. Resolver o COMANDO Python: no Windows é "python" (NUNCA python3 — cai no stub
    #    falso da Microsoft Store). No Mac/Linux costuma ser python3. Tentar nesta ordem
    #    e usar o primeiro que REALMENTE responde uma versão (não o stub):
    PYCMD=""
    for c in python py python3; do
        if "$c" --version >/dev/null 2>&1; then PYCMD="$c"; break; fi
    done
    # Se nenhum responder, PYCMD fica vazio → fallback honesto (PASSO 5.2). NÃO usar python3 cego.

  Se PREFLIGHT e PYCMD foram resolvidos, rodar:
    "$PYCMD" "$PREFLIGHT" --arquivo <artigo> --kw "<kw>" \
      --modelo <modelo> --secundarias "<sec>" --strict --formato json

  O preflight roda TODOS os gates de uma vez:
    - Checker técnico (checker_seo.py ou checker_discover.py conforme o modelo)
    - Gate de FAQ (resposta ≤ 300 caracteres), gate de encoding (acentos), e demais gates

PASSO 5.2 — Ler o resultado (REGRA INQUEBRÁVEL):
  O veredito é do EXIT CODE do script, NUNCA da interpretação do agente.
  → exit 1 (BLOCKING: true)  → BLOQUEADO. Ponto final.
       O orquestrador é PROIBIDO de:
         - reclassificar um problema como "não é problema real"
         - decidir entregar mesmo assim "porque o conteúdo está bom"
         - racionalizar que a regra do checker "é restrita demais"
       Se o script disse exit 1, volta ao redator com o diagnóstico. Sem exceção.
       (Igual à referência: você NUNCA é o primeiro revisor — os gates são.)
  → exit 0 (BLOCKING: false) → liberado para o reviewer pontuar.

  Loop: máximo 3 iterações. Redator corrige só o apontado. Roda o preflight de novo.
  Na 3ª falha, PARAR e apresentar o diagnóstico a você — NUNCA entregar o que não passou.

PASSO 5.3 — Reviewer pontua a qualidade:
  Chamar `ranqueado-reviewer` (score 5 categorias + detecção de IA PT-BR + gate 90).
  Se o reviewer reprovar (score < 90 ou P0), mesmo loop: volta ao redator (até 3x).

PARADA DURA — QUANDO ATINGE 90+, CONGELA. NÃO HÁ POLIMENTO INFINITO:
  → No instante em que o gate passa (BLOCKING:false) E o reviewer dá ≥ 90, o artigo está
    APROVADO. PARAR de editar imediatamente. Ir direto para a PARADA 3 (aprovação do usuário).
  → PROIBIDO continuar "melhorando", "ajustando nomenclatura", "polindo" um artigo já
    aprovado. Aprovou = congela. Editar depois de aprovado foi causa real de loop infinito
    (o agente ficou trocando nome de produto pra frente e pra trás sem fim).
  → As 3 iterações são o TOTAL do artigo, não 3 por tipo de problema. Estourou 3 no geral,
    para e escala — não reinicia a contagem para um problema novo que você mesmo notou.
  → Conflito de nomenclatura (outline diz um nome, realidade diz outro): NÃO entrar em loop.
    Decidir UMA vez pela fonte correta (ver PASSO 5.4 abaixo) e seguir. Nunca re-trocar.

PASSO 5.4 — REGRA DE NOMENCLATURA (resolve o conflito outline ↔ realidade de uma vez):
  → Se durante a escrita o nome real de um produto diverge do que está no outline
    (ex: outline "Tekna BCG-435", realidade "Tekna RL430"): o NOME REAL VERIFICÁVEL vence.
    Usar o nome real, de forma consistente, em TODO o artigo (H2, corpo, specs, tabela).
  → Tomar essa decisão UMA vez, no início da escrita. NÃO ficar alternando. Uma vez
    escolhido o nome real, ele é final — o reviewer NÃO pode pedir para voltar ao nome
    do outline (o outline era um rascunho; a realidade manda).
  → Se não dá para verificar o nome real: manter o do outline e seguir. Não travar nisso.
```

**Fallback HONESTO — se o script não foi resolvido (PREFLIGHT vazio):**
```
→ PRIMEIRO: tentar achar o script (o problema quase sempre é caminho, não ausência).
  Rodar: ls "$HOME/.claude/skills/ranqueado/scripts/" — se os .py aparecem ali, usar
  esse caminho absoluto. NÃO desistir e cair no manual se o script existe.
→ SÓ SE o script realmente não existir em lugar nenhum:
  - Fazer a verificação manual rigorosa contra references/rubrica-pontuacao.md
  - MARCAR o resultado como "⚠️ VERIFICAÇÃO MANUAL — não validada por gate automático"
  - NUNCA dar "aprovado" silencioso. O manual jamais carimba como se o gate tivesse rodado.
  - Avisar você explicitamente: "O gate Python não rodou (script não encontrado).
    Fiz verificação manual, mas ela é menos confiável. Recomendo checar a instalação."
→ PROIBIDO usar PowerShell para rodar os gates. Sempre Bash.
```

### ⏸ PARADA 3 — Score + Revisão (OBRIGATÓRIA)

Só chega aqui DEPOIS do contrato de entrega passar (BLOCKING: false).

```
Apresentar:
- Confirmação de que passou no contrato de entrega (todos os gates OK)
- Score 0-100 nas 5 categorias
- Pontos fracos identificados
- Itens que poderiam melhorar

Perguntar: "O artigo passou em todos os gates e atingiu [score]/100. Quer que
eu entregue assim ou prefere que eu ajuste algum ponto antes?"

NÃO ENTREGAR o arquivo final sem aprovação explícita seu.
```

### PASSO 6 — Entrega

**PASSO 6.0 — SUPERVISOR DE ENTREGA (gate final, OBRIGATÓRIO antes de mostrar ao usuário):**
```
ANTES de entregar, chamar o agente `supervisor-entrega` (conferência LEVE de entrega).
Ele verifica formato correto por modelo, versão de navegador gerada e confirmada no disco
(via Bash), ausência de elementos proibidos (índice, takeaways, links externos, marcadores
crus) e instrução de uso clara.

→ Se achar algo fora: o supervisor MOSTRA a você e pergunta "ajusto ou entrego assim?".
  NÃO dispara correção em cadeia, NÃO re-roda o reviewer, NÃO reabre o ciclo de score.
  (O artigo já foi aprovado no PASSO 5.3 — aqui é só conferência de ENTREGA.)
  Se o que falta é só gerar a versão de navegador, o supervisor gera na hora (Bash) e segue.
→ Se tudo OK: entregar direto.

ANTI-LOOP: este passo NUNCA reabre o loop de qualidade. Verifica a entrega e segue. Um
supervisor que dispara re-correção automática vira loop paralelo sem freio (causa real de
travamento em teste). Por isso ele só verifica e, no máximo, pergunta a você.

Este passo existe porque já houve entrega só do link, sem o arquivo principal, e entrega
com formato que não cola no WordPress. O usuário NUNCA descobre sozinho que a entrega saiu
errada — o supervisor confere antes.
```

Entregar o artigo final + scorecard + registro de auditoria.

**FORMATOS DE ENTREGA — oferecer de uma vez, sem o aluno ter que pedir:**
```
Ao entregar, o sistema JÁ disponibiliza os formatos úteis (inspirado na referência, que
renderiza .md/.html e gera preview de uma vez — o usuário nunca pede formato a formato):

1. ARQUIVO PRINCIPAL no formato-fonte do modelo (cada modelo tem o seu — ver redator):
   - Blog FDF: HTML com CSS inline para WordPress
   - Blog Search / Site Money: markdown com HTML pontual
   - Site FDF (Infoproduto/Local): blocos de copy para page builder
   - Discover: ver redator-discover
2. VERSÃO PARA VISUALIZAR NO NAVEGADOR (AUTOMÁTICA — não esperar o aluno pedir):
   - Gerar SEMPRE, junto com o arquivo principal, uma página HTML completa
     (com <html>/<head><meta charset="utf-8"></head>/<body>) que o aluno abre e vê
     o artigo renderizado.
   - GERAR VIA BASH (nunca PowerShell em background — falhou silenciosamente em teste).
   - Salvar em caminho previsível e CONFIRMAR que o arquivo foi criado (testar que existe)
     antes de avisar o aluno. Se a geração falhar, tentar de novo via Bash — não entregar
     dizendo "está pronto" sem o arquivo existir.
3. Avisar que pode entregar PARCIAL sob pedido (uma seção, a tabela, o FAQ).

Apresentar como menu curto ao final:
"Entreguei: (a) o arquivo para publicar no WordPress, (b) uma página para abrir no
 navegador e ver pronto [caminho], (c) posso recortar qualquer parte se precisar."

→ O principal + a versão de navegação saem JUNTOS e automaticamente. O aluno não pede.
```

**Após a entrega, atualizar o projeto.md automaticamente:**
```
→ Adicionar o artigo criado na seção "Artigos Criados pela Suite":
  [data] | /slug — Título | status: rascunho
→ Isso garante que o próximo artigo possa linkar para este
→ Se este artigo pertence a um cluster (PASSO 1.5 o encontrou na seção "Clusters
  Planejados"): atualizar o status daquele item no cluster para "escrito"
  → assim o cluster reflete o progresso (quais satélites já foram escritos)
```

**Sugestão de cluster — SÓ quando este artigo tem cara de PILLAR:**
```
Se o artigo recém-entregue é um pillar (página ampla: "melhores X", guia
guarda-chuva) E ainda NÃO pertence a nenhum cluster salvo, sugerir ao final:

"Este post tem cara de artigo central. Agora que ele está pronto, posso usá-lo
 como base para montar o cluster — os artigos de apoio derivados dos produtos
 e temas que você cobriu aqui, já com o mapa de links internos.
 Quer que eu monte? (/ranqueado cluster plan --from-pillar [arquivo deste post])"

→ É sugestão, não trava. O cluster SEMPRE vem depois do pillar (nunca antes),
  porque usa o conteúdo real do post como base de construção dos satélites.
→ Se o artigo é satélite ou avulso (não-pillar): não sugerir cluster.
```

### Regeneração por trecho

Se você não gostar do artigo, NÃO regenerar tudo.
```
→ Você aponta o trecho específico que quer mudar
→ Reescrever apenas aquele trecho (parágrafo, seção ou H2)
→ Manter todo o resto do artigo intacto
```

---

## Comando `/ranqueado analisar` — auditoria de um artigo (NÃO reescreve)

Aciona a sub-skill `ranqueado-analisar`. Mede um artigo pronto usando o MESMO motor de
qualidade do escrever (preflight + reviewer) e entrega um diagnóstico — sem alterar o artigo.

```
Ao receber /ranqueado analisar <arquivo-ou-texto>:

PASSO A — Identificar o artigo:
  → você cola o texto, aponta um arquivo (.md/.html) ou sobe no Drive

PASSO B — Entender o que é (delegar à sub-skill ranqueado-analisar):
  → Artigo da suite (está no projeto.md)? KW/modelo já conhecidos.
  → Artigo de fora? Inferir modelo e KW pelo formato, e CONFIRMAR com você antes de medir.

PASSO C — Rodar o motor (o mesmo do escrever, mas isolado):
  → preflight.py (validação concreta — aqui o exit code é informação, não trava)
  → ranqueado-reviewer (score 0-100 + detecção de IA)

PASSO D — Entregar o diagnóstico e PARAR:
  → score + 5 categorias + o que está certo + o que melhorar (ordem de impacto)
  → oferecer: "Quer que eu reescreva corrigindo isso? (/ranqueado reescrever)"
  → NÃO reescrever (analisar é medição pura; reescrever é outro comando)
```

> O analisar NÃO precisa das 3 paradas (não há planejamento/outline — o artigo já existe).
> NÃO devolve ao redator (não há redator no analisar). É medição que começa e termina no diagnóstico.

---

## Comando `/ranqueado reescrever` — otimiza um artigo existente

Aciona a sub-skill `ranqueado-reescrever`. Pega um artigo pronto e o melhora: diagnostica
(via analisar), corrige só o apontado (via redator do modelo) e revalida (via gate).

> DISTINÇÃO IMPORTANTE — reescrever vs "Regeneração por trecho":
> - A **Regeneração por trecho** (seção acima, dentro do escrever) é quando você ACABOU de
>   gerar um artigo e quer refazer só um parágrafo/seção que não gostou.
> - O **reescrever** é um comando próprio para um artigo PRONTO (feito há tempo, ou de fora),
>   que o otimiza inteiro com base num diagnóstico de qualidade.
> São fluxos distintos — não confundir.

```
Ao receber /ranqueado reescrever <arquivo-ou-texto>:

PASSO A — Diagnosticar:
  → chamar ranqueado-analisar (identifica modelo/KW, roda o gate, score + o que está ruim)
  → se já estiver ≥ 90 e sem problemas: avisar e perguntar se quer reescrever mesmo assim

PASSO B — Corrigir só o apontado:
  → chamar o redator do MODELO do artigo (blog-fdf, blog-search, site-fdf-local,
    site-fdf-infoproduto, ou Discover) — NÃO um redator genérico
  → passar: artigo atual + diagnóstico + o que preservar (o que já passa no gate)
  → corrigir SÓ o apontado; preservar título, estrutura e trechos bons

PASSO C — Revalidar (mesmo gate e loop do escrever):
  → preflight.py (nome técnico do modelo) + ranqueado-reviewer (score 90)
  → loop máx 3x; após 3 tentativas sem 90, escalar para você

PASSO D — Entregar:
  → artigo melhorado + score antes/depois + o que mudou + o que foi preservado
```

---

## Comando `/ranqueado atualizar` — atualiza um artigo com dados frescos

Aciona a sub-skill `ranqueado-atualizar`. É o reescrever com foco em recência: busca dados
atuais na web, atualiza só o que envelheceu, preserva o resto, revalida pelo gate.

> DISTINÇÃO: reescrever foca em QUALIDADE (corrige o que o diagnóstico aponta); atualizar
> foca em RECÊNCIA (troca dados velhos por frescos). O atualizar reusa o fluxo do reescrever
> + um passo a mais: buscar os dados frescos na web (o redator não pesquisa).

```
Ao receber /ranqueado atualizar <arquivo-ou-texto>:

PASSO A — Mapear o que envelheceu: estatísticas, anos, preços, números de mercado, dateModified
PASSO B — Buscar dados frescos na web: valor atual de cada dado datado (com ano + fonte);
  se não achar fonte recente, manter o antigo e sinalizar; NUNCA inventar
PASSO C — Atualizar via fluxo do reescrever (foco = freshness): redator do modelo (modo reescrita)
  substitui só os dados velhos pelos novos, preserva o resto
PASSO D — Revalidar pelo gate (preflight nome técnico + reviewer), loop máx 3x
PASSO E — Entregar: artigo + dados atualizados (velho→novo, fonte) + lembrete de dateModified
```

---

## Comando `/ranqueado brief` — gera um briefing de conteúdo (NÃO escreve)

Aciona a sub-skill `ranqueado-brief`. Planeja um artigo e entrega o briefing como documento
standalone — sem escrever. Serve para aprovar, arquivar ou delegar.

> DISTINÇÃO: no escrever, o planejamento e o outline rodam por dentro (você aprova nas paradas)
> e o fluxo vai até o artigo. O brief PARA no briefing — entrega o plano como documento e termina.
> Em uma frase: escrever = planeja + estrutura + ESCREVE; brief = planeja + estrutura + PARA.

```
Ao receber /ranqueado brief <tema>:

PASSO A — Pesquisar: reusar o ranqueado-planejamento (KW, secundárias, concorrentes, word count)
PASSO B — Recomendar modelo + template para o tema (com justificativa)
PASSO C — Sugerir estrutura (lógica do outline, derivada dos concorrentes) — proposta, não final
PASSO D — Definir ângulo de diferenciação (information gain — o que supera os concorrentes)
PASSO E — Montar plano de distribuição (canais + ganchos, do projeto.md)
PASSO F — Entregar o BRIEFING como documento e PARAR
  → oferecer: "Quer que eu escreva agora (/ranqueado escrever) ou guardar/delegar o briefing?"

Pode gerar VÁRIOS briefings de uma vez (lista de temas → vários documentos).
NÃO escreve o artigo.
```

---

## Comando `/ranqueado calendario` — calendário editorial

Aciona a sub-skill `ranqueado-calendario`. Organiza vários artigos no tempo (mensal/trimestral),
equilibrando pillar/supporting e o content mix, lendo o histórico para não repetir e sinalizar decay.

> DISTINÇÃO: brief detalha UM artigo; calendário organiza VÁRIOS no tempo (ordem, frequência, mix).

```
Ao receber /ranqueado calendario [mensal|trimestral]:

PASSO A — Ler projeto.md: nicho, modelo, e "Artigos Criados" (o que já existe + datas)
PASSO B — Mapear clusters do nicho (regras-conteudo.md) → quais pillars/supporting faltam
PASSO C — Montar o calendário no período: content mix (~60% supporting, ~30% pillar,
  ~10% tendência, ajustado ao modelo); pillar antes dos seus supporting
PASSO D — Sinalizar decay: artigos velhos do projeto.md → recomendar /ranqueado atualizar
PASSO E — Entregar o calendário + conectar: oferecer /ranqueado brief ou /ranqueado escrever
  para os itens

NÃO escreve os artigos; NÃO repete temas já cobertos no projeto.md.
```

---

## Comando `/ranqueado cluster` — pré-planejamento estratégico (pillar primeiro)

Aciona a sub-skill `ranqueado-cluster`. MÓDULO DE ESTRATÉGIA: roda DEPOIS que o artigo
pillar já foi escrito. Usa o conteúdo real do pillar como base para derivar os satélites,
monta o mapa de links internos e salva no projeto.md. Dois sub-comandos: plan e execute.

> FLUXO: o pillar vem PRIMEIRO (via /ranqueado escrever). O cluster só roda depois,
> usando o post pronto como base. Não se planeja satélite antes do pillar.

> REGRA CRÍTICA: Ubersuggest:match_keywords valida volume quando disponível. NUNCA
> keyword ideas (IMPRESSÃO, não clique).

```
Se o aluno digitar só /ranqueado cluster:
  → perguntar: "Você já escreveu o pillar? Se sim, aponte o arquivo dele
     (/ranqueado cluster plan --from-pillar <arquivo>). Se não, escreva o pillar
     primeiro com /ranqueado escrever."

/ranqueado cluster plan --from-pillar <arquivo-do-pillar>:
  PASSO 0 — Detectar modo (com/sem dados) + localizar o pillar + ler projeto.md
  PASSO 1 — Extrair a base do pillar (produtos/marcas/subtópicos REAIS = candidatos a satélite)
  PASSO 2 — Validar/enriquecer candidatos (match_keywords quando disponível; senão estimativa SERP)
  PASSO 3 — Agrupar em hub-and-spoke (pillar já escrito no centro + satélites)
  PASSO 4 — Gerar matriz de links internos (satélite↔pillar↔satélite)
  PASSO 5 — SALVAR plano na seção "Clusters Planejados" do projeto.md (pillar = status ESCRITO)
  PASSO 6 — Apresentar plano + AGUARDAR aprovação (NÃO executar sem aprovação)

/ranqueado cluster execute:
  PASSO E1 — Carregar plano do projeto.md (confirmar pillar já escrito)
  PASSO E2 — Ordenar: só os satélites (o pillar já existe) por prioridade
  PASSO E3 — Para cada satélite: injetar contexto de cluster + acionar /ranqueado escrever
  PASSO E4 — Injeção retroativa de links (inclui injetar no pillar os links de descida)
  PASSO E5 — Tratar falhas sem abortar o cluster
  PASSO E6 — Gerar scorecard final

Sem pillar escrito → NÃO planejar. Sem plano salvo → NÃO executar. Sem dado → NÃO inventar volume.
```

---

## Referências Carregadas por Este Orquestrador

- `skills/ranqueado/references/modelos-monetizacao.md` — para detecção do modelo
- `skills/ranqueado/references/regras-cluster.md` — critérios do cluster (carregada pelo comando cluster e pelo escrever no PASSO 1.5)
- `projeto.md` da pasta atual — para contexto do cliente
- Template correspondente de `skills/ranqueado/templates/`
- `skills/ranqueado/references/regras-formatacao.md` — regra de parágrafos + proibições (TOC, link externo, gráfico, byline) + hero (carregada pelos redatores e pelo reviewer)
- As demais referências (`regras-seo.md`, `regras-conteudo.md`, `regras-geo.md`, `regras-qualidade.md`, `rubrica-pontuacao.md`) são carregadas pelos agentes/comandos que as usam

---

## Regras do Orquestrador

- SEMPRE ler o projeto.md antes de qualquer comando
- SEMPRE verificar o lembrete de 30 dias ao ler o projeto.md
- As 3 paradas de aprovação são OBRIGATÓRIAS — nunca pular nenhuma
- NUNCA avançar de uma parada sem aprovação explícita seu
- Nunca pular etapas — planejamento → outline → writer, nessa ordem
- NUNCA alterar a query informada por você
- A query seu é a KW de trabalho — o planejamento confirma ou refina, nunca substitui
- Tom de voz sempre sugerido pelo modelo, mas sempre aprovado por você
- Se não existir projeto.md → orientar você a rodar /ranqueado configurar
- Discover usa o agente de planejamento separado (ranqueado-planejamento-discover)
