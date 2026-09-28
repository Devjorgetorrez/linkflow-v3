# fase2-site - Orquestradora da Fase 2 (Raio-X Tecnico + Blueprint/Diagnostico)

Comando: /link-flow site
Pre-requisito: Fase 1 aprovada (approved: true no projeto.md).
Papel: coordenar as 4 sub-skills, consolidar, gerar entregaveis, rodar guardiao.
NUNCA pede dados que a Fase 1 ja salvou. NUNCA delega execucao ao cliente - roda tudo via bash/WebFetch.

## Sub-skills (todas ja construidas e testadas)
- fase2-arvore: sitemap -> arvore de silos + quality gate localizacao
- fase2-schema: schema do lider + JSON-LD do cliente + plano Yoast (reusa local-schema)
- fase2-tecnico: raio-X tecnico do lider + garimpo dos gaps dos outros 2
- fase2-diagnostico: CONDICIONAL - so se cliente TEM site (cruza site cliente x lider + veredito)

## ETAPA 0 - Consultar Fase 1 e definir ramo
Ler projeto.md: concorrente lider, outros concorrentes reais, Money Pages, gaps, campo 'Site'.
- Site = 'a criar' / vazio -> ramo SEM_SITE (blueprint)
- Site = URL -> ramo COM_SITE (diagnostico)

## ETAPA 0.5 — Setup do Molde de Money Page (SOMENTE Caminho 1 — cliente com Novamira)

Se `Novamira: (x) instalado` no projeto.md → executar. Caso contrário: PULAR (campo fica vazio; Fase 3 usará Caminho 2).

**Objetivo:** preencher `## Molde de Money Page` no projeto.md agora, para que a Fase 3 (Caminho 1) não trave na ETAPA 3 sem saber qual página usar como molde.

**Procedimento:**

1. Perguntar uma única vez: "Qual página do WordPress serve de molde para as Money Pages? (ID ou slug — ex: `/psicologa-em-perus/` ou ID 731). Se o site ainda não tiver nenhuma página no estilo correto, informa aqui e o molde será criado pelo designer antes da Fase 3."

2. Com o ID em mãos, ler o `_elementor_data` do molde via Novamira:
   ```php
   return get_post_meta([MOLDE_ID], '_elementor_data', true);
   ```

3. Gerar o inventário de widgets: contar quantos de cada tipo e descrever a função de cada um.
   Exemplo: "1 H1 · 1 intro text-editor · 4 CTA buttons · 1 H2 serviços · 3 cards [heading+text-editor] · 3 icon-lists [heading+icon-list] · 1 nested-accordion 4 itens · 2 images (hero + regiões)"

4. Gravar no projeto.md — preencher o campo `## Molde de Money Page`:
   ```
   - molde_id: [ID]
   - molde_slug: [/slug-da-pagina/]
   - inventario_widgets: [inventário gerado no passo 3]
   ```

**Se o cliente não souber o ID:** listar páginas publicadas via PHP:
```php
$pages = get_pages(['post_status' => 'publish']);
foreach ($pages as $p) { echo $p->ID . ' | ' . $p->post_name . ' | ' . $p->post_title . "\n"; }
```

**Nota:** IDs de widget no `_elementor_data` são únicos por instalação — nunca reutilizar inventário de outro cliente.

## ETAPA 1 - Executar sub-skills (via Task/subagent, em sequencia)
REGRA — CONSUMIR FASE 1 (não reprocessar): A Fase 2 lê os dados que a Fase 1 já salvou no projeto.md (concorrentes, páginas, árvore do crawl). NÃO rodar domain_top_pages de novo, NÃO re-derivar a árvore que o crawl.py da Fase 1 já produziu. A fase2-arvore só puxa o sitemap para CONFIRMAR/COMPLEMENTAR o crawl. Rodar ferramenta nova apenas para o que a Fase 1 genuinamente não fez: schema, SSR/CSR, canonical, robots.txt.

Rodar sempre (ambos os ramos):
1. fase2-arvore (lider)
2. fase2-schema (lider + gera JSON-LD do cliente)
3. fase2-tecnico (lider + gaps dos outros 2)
Rodar SO no ramo COM_SITE:
4. fase2-diagnostico (site do cliente x lider + veredito consertar-vs-reconstruir)

Cada sub-skill salva sua parte na secao 'Raio-X Tecnico (Fase 2)' do projeto.md.
Se uma sub-skill falhar, aplicar degradacao dela e seguir - nunca travar a fase inteira.

## ETAPA 2 - Reconciliacao de Money Pages (AUTOMATICA)
Comparar URLs transacionais do lider (da fase2-arvore) com as Money Pages da Fase 1.
Pagina do concorrente SEM Money Page prevista:

FILTRO DE INTENÇÃO (obrigatório antes de promover):
Analisar o slug da URL do concorrente. Se o slug contém sinais INFORMACIONAIS ("como", "o-que", "qual", "guia", "dicas", "passo-a-passo", "economizar", "melhor", "vale-a-pena", percentuais como "40", anos como "2024"/"2025"), a URL é candidata a BLOG (Fase 3) — NÃO Money Page.
Só promover automaticamente URLs com sinais TRANSACIONAIS claros: /servico-cidade/, /operadora-cidade/, nome de plano/produto + localidade.
URLs ambíguas ou informacionais: registrar em '### Candidatas a blog (Fase 3)' em vez de adicionar como Money Page.
Exemplo do erro real: /planos-de-saude-para-mei-como-usar-cnpj-economizar-ate-40/ → BLOG (sinais: "como-usar", "economizar", "40"). O correto seria criar /plano-de-saude-mei-sorocaba/ SE houver volume transacional confirmado — a URL longa informacional vai para blog, a Money Page limpa é decisão separada.

Após filtro:
- URLs TRANSACIONAIS → Adicionar como Money Page + registrar em '### Reconciliacao de Money Pages' com origem + KW provavel
- URLs INFORMACIONAIS/AMBÍGUAS → registrar em '### Candidatas a blog (Fase 3)'
- AVISAR depois: 'Adicionei N Money Pages e identifiquei M candidatas a blog: [listas]'

## ETAPA 3 - Consolidar e gerar entregaveis (via bash)
- Preencher '### Handoff para Fase 3' no projeto.md: por pagina -> KW principal (F1) + estrutura + schema recomendado
- Gerar Markdown: projetos/[slug]/analise-tecnica-[slug].md (raio-X narrado completo; se COM_SITE + diagnostico e veredito)
- Gerar Excel: projetos/[slug]/analise-tecnica-[slug].xlsx — ÚNICO Excel do cliente, consolidando Fase 1 + Fase 2, com `scripts/gerar_excel_fase2.py`. Abas obrigatórias:
  - Inventario_Concorrente: páginas do crawl (origem: Fase 1 clusters.json)
  - Paginas_Concorrentes: páginas transacionais mapeadas (origem: Fase 1)
  - Arquitetura_Sugerida: árvore proposta para o site do cliente (NÃO "Arvore_Meu_Site" — cliente pode não ter site)
  - Plano_Construcao: money pages ordenadas por prioridade
  - RaioX_Tecnico: sinais técnicos do líder (origem: Fase 2)
  - Schema_Concorrentes: status de schema + JSON-LD do cliente
  - Handoff_Fase3: money pages finais com KW, schema, template, ação Yoast

  **O script não tem dado de exemplo nenhum embutido** (corrigido depois do
  erro 29 do Relatório de Testes 4 — um escritório de advocacia de Campinas
  ficou hardcoded e vazou pra planilha de outro cliente). Ele exige
  `--dados <json>` com as 7 abas preenchidas de verdade, e falha alto se
  faltar uma aba ou vier vazia — nunca completa com valor padrão. Antes de
  chamar o script: montar esse JSON a partir do `clusters.json` real da
  Fase 1 (Inventario_Concorrente, Paginas_Concorrentes), da pesquisa de
  concorrentes + `projeto.md` (Arquitetura_Sugerida, Plano_Construcao,
  Handoff_Fase3) e do raio-X técnico desta Fase 2 (RaioX_Tecnico,
  Schema_Concorrentes) — nunca do exemplo de nenhuma sessão anterior.
  Formato exato do JSON: ver a docstring de `scripts/gerar_excel_fase2.py`.
  Comando: `python scripts/gerar_excel_fase2.py --slug [slug] --dados
  projetos/[slug]/_fase2-dados-planilha.json`.
Ambos via bash, agente executa sozinho.

REGRA DE TAMANHO: detalhamento completo (arvore inteira, todas URLs) vai para o Markdown/Excel. No projeto.md, manter so RESUMO das secoes + Handoff para Fase 3. Evita projeto.md gigante.

REGRA DE NÍVEL (M4): Uma página só é rotulada "nível 2" se existir uma página PILAR pai declarada na arquitetura (ex: /operadoras/ como pai de /operadoras/unimed/). Se a página está a 1 clique direto da home, sem pilar intermediário, ela é NÍVEL 1. Não rotular como "nível 2" página que está diretamente sob a home. O BreadcrumbList e o handoff devem refletir o nível real da URL.

## ETAPA 4 - Guardião
### GUARDIÃO FASE 2 — OBRIGATÓRIO, EM CÓDIGO, COM LOOP
Rodar via bash: python "${CLAUDE_PLUGIN_ROOT}/scripts/guardiao_fase2.py" --slug [slug]

LOOP (máximo 3 tentativas):
- Rodar. Se PASS → seguir para ETAPA 5 (Resumo final).
- Se FAIL → corrigir os itens apontados e rodar de novo.
- Se FAIL na 3ª tentativa: PARAR o fluxo. NÃO apresentar resumo. NÃO sinalizar Fase 2 como concluída.
  Avisar: "Guardião da Fase 2 reprovou 3 vezes. Itens não resolvidos: [lista completa]. Preciso da sua intervenção."

REGRAS INVIOLÁVEIS:
- PROIBIDO apresentar o resumo da Fase 2 sem PASS do guardião.
- PROIBIDO dizer "os dados estão OK" sem ter EXECUTADO o script via bash. Validar de cabeça = probabilístico = proibido.
- PROIBIDO sinalizar Fase 2 concluída sem PASS.
- Tentativa que não mudou nada NÃO conta como tentativa.
- Registrar no projeto.md (Estado das Fases): `guardiao_fase2: PASS em [data] — output: "[colar a linha de saída do script]"`. Sem esse registro, a Fase 2 NÃO está concluída.

### REGISTRO DE GUARDIÃO — REGRA ABSOLUTA
É PROIBIDO escrever "guardiao_fase2: PASS" sem ter executado o script via bash.
O registro DEVE incluir a saída real: `guardiao_fase2: PASS em [data] — output: "PASS - Fase 2 validada."`
PROIBIDO: "validado manualmente" / "script ausente" / "PASS" sem output / qualquer justificativa para não rodar.
Se o script não existir → PARAR e avisar (verificar com `ls "${CLAUDE_PLUGIN_ROOT}/scripts/"`). Não improvisar validação manual.
Se o script falhar ao executar → PARAR e mostrar o erro. Não assumir PASS.

## ETAPA 5 - Resumo final
RESUMO FASE 2 - [nome]
Modo: [SEM_SITE blueprint / COM_SITE diagnostico]
Arvore do lider: [N silos, padrao, quality gate localizacao]
Schema: [detectado no lider / JSON-LD gerado pro cliente]
Tecnico: [achados criticos + gaps dos concorrentes]
Money Pages reconciliadas: [N adicionadas]
Se COM_SITE: VEREDITO: [consertar/reconstruir] + resumo do plano
Entregaveis: analise-tecnica-[slug].md + .xlsx
Handoff Fase 3: pronto

Confirmar: 'Fase 2 concluida. Proximo: /link-flow conteudo'

## Degradacao
Sub-skill individual falha: aplica degradacao propria, orquestradora segue
Cliente sem site mas quer diagnostico: explicar que diagnostico so roda com site; entregar blueprint
Site do cliente fora do ar (COM_SITE): fase2-diagnostico trata como SEM_SITE