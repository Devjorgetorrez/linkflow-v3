---
name: link-flow
description: >
  Orquestrador de SEO/GEO/AEO/GMN para negocios locais. Maestro que roteia as 5 fases
  (planejamento, site, conteudo, backlinks, gbp), le/grava o projeto.md do cliente e
  dispara os gates. NAO executa trabalho de dominio nem edita design — delega. Use quando
  o usuario disser "orquestrador", "novo cliente", "fase 1/2/3/5", ou pedir SEO local
  ponta a ponta.
user-invokable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Orquestrador Local SEO — Skill Mestre (maestro)

## REGRA DE SESSAO — LER PRIMEIRO
Antes de qualquer acao, ler `projeto.md` do cliente ativo (`projetos/<slug>/`)
— nunca invente dado que nao esta la, campo ausente = placeholder `[CAMPO]`.

**Nunca buscar estado de cliente fora de `projetos/`** (Downloads,
Documentos, ou qualquer outra pasta). Se o cliente mencionado nao
aparecer em `projetos/*/projeto.md`, tratar como projeto novo — nunca
ir procurar em outro lugar achando que vai encontrar o estado dele la.

> Magro: roteia + le/grava `projeto.md` + dispara gates. Nao escreve conteudo, nao
> desenha layout, nao se autoaprova. O loop e segurado pelo `gate_runner`, nunca por aqui.

## REGRA DE CAMINHO ÚNICO — SEM OPÇÃO DE PULAR
O sistema tem UM caminho, não dois. O orquestrador NUNCA oferece "pular etapa", "ou você pode" ou "recomendado vs opcional".
Cada fase tem pré-requisito verificado EM CÓDIGO pelo guardião da fase seguinte.
O agente escolhe o caminho — nunca o cliente.

## Comando
`/link-flow <fase>` — fases: `novo | auditoria | planejamento | site | conteudo | backlinks | calendario | publicar | status`
- `novo` → dispara `orq-icp` (intake 3x3, cria `projetos/<slug>/projeto.md`).
  Após orq-icp concluir: NÃO oferecer opções. Disparar automaticamente:
  "Projeto criado. Rodando a auditoria do site — obrigatória antes do planejamento."
  → invocar `fase0-auditoria-site`
- `auditoria` → dispara `fase0-auditoria-site` (somente leitura; roda APÓS `novo` e ANTES de `planejamento`)

## Plataforma (por site_tipo — ver projeto.md)
`site_tipo` é definido no onboarding (`orq-icp`, Bloco 0) e nunca decidido aqui.

**site_tipo: wordpress** — Host = WordPress do cliente. Design = templates da designer. Publicacao = Novamira (so conteudo). SEO = Yoast (padrão instalado). LocalBusiness/Service via WPCode. Cliente acessa via Claude Code (terminal). Cliente NUNCA edita (guardrails de ferramenta).

**site_tipo: astro** — Host = VPS Hostgator próprio, gerenciado via SSH. Motor = Astro (`_astro/`). Publicacao = SSH (`vps-setup` cuida da infraestrutura, `fase2-site-astro`/`site-atualizar`/`site-publicar` cuidam do deploy do conteúdo). Gestão = painel SiteFlow (Next.js), rodando no próprio VPS, onde o cliente edita posts/config sem precisar do Claude Code depois do primeiro deploy.

## Tabela de roteamento
| Fase | Sub-skill | Guardiao (gate) |
|---|---|---|
| auditoria | `fase0-auditoria-site` | — (somente leitura; bloqueia Fase 3 se molde sujo) |
| planejamento | `fase1-planejamento` | `guardiao_fase1.py` -> **GATE HUMANO 1** (`.approved`) — ⛔ PRÉ-REQUISITO: `auditoria_global: concluida` no projeto.md |
| vps | `vps-setup` (só site_tipo=astro; roda no Marco 2, depois da aprovação do visual) | — (infraestrutura; sem ela `fase2-site-astro` não publica) |
| site | `fase2-site` (+ `fase2-site-astro` se site_tipo=astro — ver Roteamento site) | `guardiao_fase2.py` (exige `.approved`) — se astro, também `guardiao_construtor.py` |
| conteudo | `fase3-conteudo` | `guardiao_fase3.py` -> **GATE HUMANO 2** (`.publish-approved`) |
| backlinks | `fase4-backlinks` (stub v2) | — |
| gbp | — | Google Meu Negócio é um agente separado — use /GMN |
| blog | `/link-flow blog` → `blog-calendar` / `blog-publicar` (wordpress) ou `site-publicar` (astro) | GATE HUMANO no calendário |
| calendario | `blog-calendar` | GATE HUMANO: aprovação do calendário antes do publicar |
| publicar | `blog-publicar` (wordpress) ou `site-publicar` (astro) — ver Roteamento publicar | — |
| status | (lê projeto.md, sem sub-skill) | — |

### Roteamento site (por site_tipo)
`/link-flow site <slug>` → ler `site_tipo` no projeto.md (definido no Bloco 0
do `orq-icp` — nunca decidir aqui nem inferir).

**Sempre, independente de site_tipo:**
1. Invocar `fase2-site` — roda as sub-skills de análise técnica compartilhada
   (`fase2-arvore`, `fase2-schema`, `fase2-tecnico`), reconcilia Money Pages,
   gera `analise-tecnica-<slug>.md` + `.xlsx`.
2. Rodar `guardiao_fase2.py --slug <slug>`. Loop de até 3 tentativas, igual
   já descrito na ETAPA 4 do `fase2-site`. Sem PASS, não avançar.

**SE site_tipo: wordpress** — parar aqui. Fase 2 concluída (blueprint pronto).
A injeção de conteúdo no WordPress acontece na Fase 3 (`fase3-conteudo`),
via `/link-flow conteudo`, como já era.

**SE site_tipo: astro** — encadear automaticamente, sem perguntar, entre
`fase2-site` e `fase2-site-astro` (para o cliente Astro, a "Fase 2" inclui a
construção do site, diferente do WordPress onde Fase 2 é só blueprint):
3. Invocar `fase2-site-astro` — usa o que `fase2-site` acabou de gerar
   (Money Pages reconciliadas, handoff) para construir o site de verdade.
   A skill roda em dois marcos com **uma pausa obrigatória entre eles**:
   - **Marco 1 — aprovar o visual:** constrói numa cópia LOCAL, sobe a prévia
     em `localhost` e ajusta até o usuário aprovar (`visual_aprovado: sim`).
     Sem domínio, sem servidor.
   - **Marco 2 — colocar no ar:** só depois da aprovação. Nele a própria
     `fase2-site-astro` (ETAPA 6) chama `vps-setup` — não é preciso chamá-la
     separadamente aqui; se o operador pedir `/link-flow vps <slug>` isolado
     (diagnóstico, adicionar cliente a um servidor existente), é a mesma skill.
   O servidor nunca é configurado antes da aprovação do visual.
   `fase2-site-astro` tem seu próprio guardião (`guardiao_construtor.py`, fases
   `construcao`, `previa`, `publicacao` e `saida`) — não duplicar essa checagem
   aqui, só confirmar que ele rodou e passou antes de reportar a Fase 2 como
   concluída.

Sem esse encadeamento, `fase2-site-astro` poderia ser chamada isolada, sem
nunca ter passado pela análise técnica — site sem arquitetura, sem árvore
de silos, sem página pilar.

### Roteamento calendario
`/link-flow calendario <slug>` → invoca `blog-calendar` passando o slug do cliente.
Pré-requisito: Fase 3 aprovada (Gate Humano 2). Verificar `## Estado das Fases` no projeto.md.
Se Fase 3 não estiver marcada, avisar: "A Fase 3 precisa estar concluída antes de gerar o calendário de blog."

### Roteamento publicar
`/link-flow publicar <slug>` → ler `site_tipo` no `projeto.md`:

**Se `site_tipo: astro`** — invocar `site-publicar` passando o slug.
Publica o próximo artigo de blog pendente via SSH incremental.

**Se `site_tipo: wordpress`** ou ausente — invocar `blog-publicar`
passando o slug do cliente.
Pré-requisito: `## Calendário de Blog` deve existir no projeto.md com ao menos 1 artigo `pendente`.
Pré-requisito: campo `novamira_mcp` deve estar configurado em `## Ambiente de Publicacao` do projeto.md.
Se algum pré-requisito faltar, o `blog-publicar` detecta e informa — não verificar aqui.
Modo teste: publica 1 artigo por chamada (pilar antes de satélite). Sem guardião de saída. Sem loop.

### Roteamento blog (entrada simplificada)
`/link-flow blog` → detectar projeto ativo automaticamente:
1. Listar diretórios em `projetos/`
2. Se houver apenas 1 projeto: usar esse slug direto, sem perguntar
3. Se houver mais de 1: exibir lista numerada e perguntar "Qual cliente quer trabalhar?"
4. Com o slug definido, perguntar: "O que você quer fazer?
   (1) Gerar o calendário editorial
   (2) Publicar o próximo artigo"
5. Resposta 1 → invocar `blog-calendar` com o slug
6. Resposta 2 → ler `site_tipo` no `projeto.md` do slug. Se `astro` →
   invocar `site-publicar`. Se `wordpress` ou ausente → invocar
   `blog-publicar` (mesma ramificação de "Roteamento `publicar`" acima —
   nunca pular essa checagem por ser um atalho).

### Roteamento status
`/link-flow status <slug>` → ler `projetos/<slug>/projeto.md`, seção `## Estado das Fases`.

Responder no formato:

STATUS — [Nome do Cliente]

✅ Concluído:
- [fases concluídas, com data se registrada]

⏳ Em andamento:
- [fase atual, com progresso se registrado]

➡️ Próximo passo:
   /link-flow [comando exato] <slug>

Se `projetos/<slug>/projeto.md` não existir:
"Não encontrei o projeto <slug>. Use /link-flow novo para cadastrar."

REGRA: sempre terminar com o próximo comando exato, pronto para copiar.

## Estado / handoff
Tudo via `projetos/<slug>/projeto.md` (template em `templates/projeto.md`).
Slug = nome do negocio em kebab-case (ex: `clinica-sorriso-sp`).
Regra anti-race: workers paralelos gravam em arquivos proprios; SO o orquestrador
consolida no `projeto.md` ao fim da fase.

## Gates (2 tipos)
1. Automatico: `scripts/gate_runner.py --fase N --dir <pasta>` -> exit 0/1 (veredito por codigo).
2. Humano: `scripts/human_gate.py` confere `.approved` / `.publish-approved`.

## Reuso (nao reconstruir)
- Fase 1: `arquiteto-seo` (+ `crawl.py`, `clusterizar.py`), `local-keyword-research`,
  `local-competitor-analysis`, `ranqueado-configurar` (ICP).
- Fase 3: `ranqueado` (escrever) + `ranqueado-analisar` (GATE de qualidade).
- Fase 5: agente GBP (PRONTO — so conectar).
- Publicacao: receita Novamira (`scripts/novamira_publish`).

## Roteamento blog

Apos Fase 3 aprovada (Gate Humano 2):

**Passo 1 — Publicar o conteudo real.** Ler `site_tipo` no `projeto.md`:
- `wordpress` — ja esta no ar (Novamira injeta direto). Ir para Passo 2.
- `astro` — invocar `site-atualizar` agora, sem perguntar, para publicar
  o conteudo real (o site ainda esta com o placeholder do primeiro
  deploy). Aguardar o resumo antes de seguir. Se falhar, parar e
  reportar — nunca oferecer blog/GMB com o site desatualizado no ar.

**Passo 2 — Perguntar o proximo passo:**
"Site publicado com o conteudo real. Quer iniciar a producao de blog agora?"
SIM → instruir: "Use /link-flow calendario <slug> para gerar o calendario editorial."
NAO → encerrar ou ir para /GMN (agente separado — Google Meu Negócio)

O blog e responsabilidade exclusiva do blog-calendar + blog-publicar
(wordpress) ou site-publicar (astro) — NUNCA usar fase3-conteudo para
artigos de blog. site-atualizar (Passo 1) e site-publicar (blog) sao
skills diferentes: a primeira republica tudo que mudou fora do blog,
a segunda so publica artigos novos.

## SITE NÃO CONECTADO — verificar ANTES de publicar

⚠️ As fases 1 e 2 (planejamento, arquitetura) NÃO publicam nada. Funcionam sem site conectado.
Só a Fase 3 (Money Pages), institucionais e blog precisam de publicação de verdade —
Novamira (wordpress) ou VPS via SSH (astro), conforme `site_tipo`.

**SE site_tipo: wordpress** — verificar se as tools `mcp__novamira__*`
estão disponíveis na sessão (não ler o projeto.md — checar as tools de fato).

Se as tools Novamira estiverem AUSENTES:
- NÃO tentar publicar. NÃO chamar o Novamira.
- Avisar o cliente:

  "Seu site ainda não está conectado. Posso escrever e preparar todo o conteúdo,
   mas não vou conseguir publicar automaticamente.

   Você tem duas opções:
   (1) Conectar agora — precisa ter WordPress com o plugin Novamira instalado.
       Se ainda não fez isso, veja a aula do Novamira e depois rode:
       /plugin configure link-flow@link-flow
   (2) Seguir sem publicar — eu escrevo tudo e salvo os arquivos. Você publica
       depois, quando conectar o site."

Se o cliente escolher (2): escrever normalmente e salvar o conteúdo em:
  `projetos/<slug>/rascunhos/<slug-artigo>/<slug-artigo>.html`
O cliente publica manualmente copiando o conteúdo no WordPress.

**SE site_tipo: astro** — verificar se `## Ambiente VPS` no projeto.md
tem `vps_ip` e `vps_cliente_dir` preenchidos (registrados pelo `vps-setup`).

Se a infraestrutura VPS estiver AUSENTE:
- NÃO tentar publicar.
- Avisar o cliente:

  "Ainda não configurei o servidor para publicar automaticamente.
   Posso escrever e preparar todo o conteúdo mesmo assim.

   Você tem duas opções:
   (1) Configurar o servidor agora — uso `/link-flow vps <slug>`.
   (2) Seguir sem publicar — eu escrevo tudo e salvo os arquivos. Você publica
       depois, quando o servidor estiver configurado."

## REGRA DE ROTEAMENTO — decisão automática, ZERO pergunta ao cliente

**Aplica-se só a site_tipo: wordpress.** Para site_tipo: astro não existe
decisão de injeção — o agente sempre escreve o conteúdo direto em
`_astro/src/content/<slug>/` (acesso de arquivo já garantido, sem MCP).

Antes de decidir o caminho de entrega, VERIFICAR AS TOOLS DISPONÍVEIS na sessão.
NUNCA concluir que uma ferramenta não existe lendo um .md — chamar discover-abilities ou listar as tools disponíveis.

CAMINHO 1 — MCP Novamira presente nas tools:
→ Injeta. Não pergunta nada. Falhou 3x → cai no Caminho 2 e avisa.

CAMINHO 2 — MCP ausente das tools:
→ Entrega o texto no chat, pronto para colar. Fim.

PROIBIDO:
- Perguntar ao cliente se quer ativar PHP
- Ensinar a configurar plugin ou rodar "claude mcp list"
- Oferecer "3 opções de injeção"
- Concluir que o MCP não existe porque o projeto.md diz [A CONFIGURAR]
  → o projeto.md NÃO é fonte de verdade sobre tools disponíveis. As TOOLS são.

## Estado do build
Fonte de verdade = disco. Ler `## Estado das Fases` dentro do `projeto.md` do cliente antes de qualquer acao.
IGNORAR qualquer descricao de estado nas Instrucoes do Projeto do Claude.ai — esta congelada.