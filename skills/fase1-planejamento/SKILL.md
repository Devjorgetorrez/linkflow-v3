# fase1-planejamento - Engenharia Reversa via SERP Overlap

Comando: /link-flow planejamento
Pre-requisito: orq-icp ja rodou e projeto.md existe com servicos detalhados.
NUNCA pede dados que ja estao no projeto.md. kw_principal e DEFINIDA aqui (nao existe antes).

## PRÉ-REQUISITO — BLOQUEANTE (executar ANTES de qualquer etapa)

Ler `## Estado das Fases` no projeto.md do cliente.
Se NÃO contiver a linha `auditoria_global: concluida` → PARAR IMEDIATAMENTE.
Não continuar. Não perguntar se o cliente quer pular. Invocar `fase0-auditoria-site`.
Mensagem: "A Fase 0 (auditoria do site) é pré-requisito obrigatório da Fase 1. Rodando agora."

## Conceito-chave: SERP Overlap
Concorrente real nao e quem aparece em UMA busca - e quem aparece RECORRENTEMENTE
em MULTIPLAS variacoes de KW do negocio. Elimina ruido (diretorio aleatorio, site fora do nicho).

## Ordem de ferramentas (Regra 3 INICIO.md) - vale para TODAS as etapas
1. Ubersuggest (primario)
2. Semrush (secundario) - se Ubersuggest falhar
3. web_search nativo (fallback) - se ambos MCP falharem

## ETAPA 0 - Consultar ICP (sem perguntar nada novo)
Ler projeto.md: servicos detalhados (ja em ordem de faturamento), cidade, regulacao. A secao ## Concorrentes estara vazia — e o normal, sera preenchida na ETAPA 3.
UNICA pergunta ao cliente:
'Seu negocio atende so [cidade] ou tambem outras regioes / todo o Brasil?'
Local: usa location_id. Nacional: sem location_id, volume nacional.

## ETAPA 1 - Expandir servicos em variacoes de KW
Para cada servico do ICP:
1. keyword_suggestions(servico + cidade se local) - Ubersuggest
2. Fallback: Semrush keyword_research / web_search
Gerar 5-10 variacoes por servico.

## ETAPA 2 - Classificar intencao
Categorias: Informacional, Comercial, Transacional, Navegacional
- Transacional: verbo de acao (agendar, contratar, marcar) OU servico+cidade puro - MANTER para Money Pages
- Navegacional: nome de marca especifico - DESCARTAR
- Comercial (melhor, top, review, vs): guardar para Fase 3 blog - NAO usar aqui
- Informacional (como, o que, por que): guardar para Fase 3 blog - NAO usar aqui
Manter apenas Transacional nesta fase.

## ETAPA 3 - SERP Overlap (identificar concorrentes reais)
Para cada KW Transacional (max 10 para nao gastar cota):
1. serp_analysis(kw) - top 10 organico (dominios)
2. Registrar dominios

Calcular frequencia de cada dominio across todas as KWs:
- 3+ KWs diferentes = CONCORRENTE REAL CONFIRMADO
- 1-2 KWs = ruido, ignorar
- Redes sociais (instagram/facebook/linkedin/youtube) sempre ignoradas
- Diretorios (doctoralia, booksy etc) MANTIDOS se aparecem em 3+ - sao concorrentes de SEO reais

Atualizar projeto.md ## Concorrentes com os reais por overlap.

## ETAPA 4 - Definir kw_principal (PRIMEIRA VEZ)
Entre as Transacionais, candidata = maior volume confirmado (keyword_metrics).
Empate ou sem dados: priorizar maior overlap de concorrentes (mais validada como busca real).
Apresentar SEM RECOMENDACAO:
KW | Volume/mes | Concorrentes que disputam | Dificuldade
Pergunta: 'Qual representa melhor seu negocio principal?'
Salvar como kw_principal — SOMENTE a KW limpa, sem sufixos nem notas de status.
PROIBIDO escrever "(a confirmar)", "(a definir)", "(pendente)" ou qualquer anotação dentro do valor do campo.
Status pertence ao campo Estado das Fases — nunca ao valor de kw_principal.

## ETAPA 5 - Mapear TODAS as paginas transacionais dos 3 concorrentes
Pegar os 3 concorrentes de maior frequencia (Etapa 3).
Para cada um, extrair paginas com cascata:
1. domain_top_pages(dominio) - Ubersuggest
2. Se falhar: organic_research(dominio) - Semrush
3. Se ambos falharem: web_search('site:dominio') - nativo

Classificar cada pagina por INTENCAO, nao por formato de URL.
Transacional = intencao de contratar/comprar servico, independente da estrutura da URL.
Aceitar qualquer formato: /implante, /servicos/implante, /tratamentos/implante-dentario, /p/dentista-jundiai, etc.

Marcar cada pagina:
- transacional (vira Money Page candidata)
- nao-transacional (home, blog, institucional, sazonal - registra mas nao vira Money Page)

MANTER TODAS as transacionais - NAO filtrar por trafego.
Pagina de 50 acessos entra igual a de 5.000 (baixo trafego pode ser alto valor/ticket).

Custo: max 3 chamadas de domain_top_pages (so os 3 concorrentes).

Saida - tabela consolidada:
| Concorrente | URL | Transacional? | KW provavel | Trafego est. |

Apos a tabela — extrair e salvar H2s das money pages principais:
Para cada um dos 3 concorrentes, pegar a pagina transacional de maior trafego e buscar via WebFetch:
1. Extrair todos os H2s em ordem de aparicao
2. Registrar a estrutura geral (quantas secoes, padrao de CTA, tem FAQ?)
3. Salvar no projeto.md em ## H2s dos Concorrentes usando OBRIGATORIAMENTE o formato:

```
### KW: [kw da página analisada]
- Concorrente 1: [URL] — H2s em ordem:
  1. [H2 texto]
  2. [H2 texto]
- Concorrente 2: [URL] — H2s em ordem:
  1. [H2 texto]
- Concorrente 3: [URL] — H2s em ordem:
  1. [H2 texto]
Estrutura geral: [N seções, padrão CTA, FAQ: sim/não]
```

ESTE É O ÚNICO FORMATO ACEITO. Nunca usar formato flat (lista sem `### KW:`).
Custo: 3 WebFetch adicionais (so top page por concorrente, nao todas as paginas).
Se WebFetch retornar 403/bloqueio: registrar dentro da subseção `### KW: [kw]`: "H2s não disponíveis — site bloqueado". Nunca deixar a subseção ausente.

## ETAPA 6 - Arquitetura via concorrente lider
/arquiteto-seo <url-do-concorrente-com-maior-trafego-total>
Retorna: arvore de URLs, silos, clusters, profundidade.
Guardiao: Money Page <= nivel 2, sem canibalizacao.

## ETAPA 7 - Money Pages candidatas
Cruzar: servicos do ICP + Transacionais com volume + TODAS as paginas transacionais mapeadas (Etapa 5).
Cada servico do cliente mapeia para no minimo 1 Money Page.
Incluir tambem oportunidades que os concorrentes tem mas o cliente nao mencionou (gap competitivo).

Registrar em ## Money Pages do projeto.md com o formato EXATO do template (6 colunas obrigatorias):
| Slug | Template | KW principal | Volume/mes | wp_post_id | Status |
|---|---|---|---|---|---|
| /slug-da-pagina/ | site-fdf-seo-local | kw principal | X/mes | — | pendente |

- wp_post_id: sempre "—" ate a publicacao pela Fase 3
- Status: sempre "pendente" ao criar
- Template: "site-fdf-seo-local" para Money Pages de servico local
- NUNCA usar formato alternativo (ex: Servico/tema | Concorrente referencia | Tipo) — causa inconsistencia com o template e com o rastreamento da Fase 3

## ETAPA 8 - Consolidar + Baseline + Gate Humano 1
Atualizar projeto.md:
## Baseline: data, DR concorrente lider, posicoes iniciais (keyword_overview da kw_principal)
## Arquitetura Aprovada: silos + mapa de URLs
## Money Pages: candidatas da Etapa 7
kw_principal: definida (nao mais 'a definir')

Resumo Gate Humano 1:
RESUMO FASE 1 - [nome]
Modo: [local/nacional]
kw_principal: [kw] - [volume]/mes
Concorrentes reais (overlap): [lista + frequencia]
Paginas transacionais mapeadas: [N]
Money Pages candidatas: [N]
Arquitetura: [N silos, profundidade max X]

Perguntar: 'Aprova a estrutura e a palavra-chave principal para seguir para a Fase 2?'
SIM: approved:true + timestamp
     Registrar em ## Estado das Fases: "guardiao_fase1: PASS em [data]"
NAO: ajustar e reapresentar (max 2 rodadas)

## OUTPUT
Confirmar: 'Fase 1 aprovada. Proximo: /link-flow site'

## Degradacao
Ubersuggest falha: Semrush
Semrush falha: web_search nativo
arquiteto-seo sem paginas: usar sitemap do concorrente
Concorrente bloqueia crawler: pular para o proximo, avisar


## REGRA FIXA - locId por tipo de ferramenta (CRITICO)
Erro comum que invalida toda a analise. Seguir SEMPRE:

Dados de KEYWORD (volume, dificuldade, CPC) -> usar locId da CIDADE (ex: 1001743 Jundiai)
  Ferramentas: keyword_overview, keyword_suggestions, keyword_metrics, serp_analysis

Dados de DOMINIO e PAGINAS (trafego por pagina, top pages) -> usar locId NACIONAL (2076 Brasil)
  Ferramentas: domain_top_pages, domain_overview, competitors
  Motivo: trafego de dominio e medido nacionalmente, NUNCA por cidade.
  Passar locId de cidade para domain_top_pages retorna noData FALSO.

## TRAVA ANTI-JUSTIFICATIVA-FALSA
Se uma ferramenta retornar noData ou vazio, PROIBIDO inventar explicacao
('site pequeno', 'dominio nao indexado', 'gap de dados') sem antes:
1. Verificar se o locId esta correto para o tipo de ferramenta (regra acima)
2. Testar com locId nacional (2076) se for ferramenta de dominio
3. Testar o dominio sem https, sem www, sem barra final
4. So depois de esgotar isso, registrar a limitacao real
Inventar justificativa tecnica sem testar = comportamento probabilistico = proibido.

## EXECUCAO AUTOMATICA - NUNCA delegar ao cliente (CRITICO)
O agente executa estes comandos SOZINHO via bash tool. NUNCA pede para o cliente rodar.
Esta e uma skill de produto - o cliente nao roda comandos no terminal.

### GUARDIÃO FASE 1 — OBRIGATÓRIO, EM CÓDIGO, COM LOOP
Rodar via bash: python "${CLAUDE_PLUGIN_ROOT}/scripts/guardiao_fase1.py" --slug [slug]

LOOP (máximo 3 tentativas):
- Rodar. Se PASS → seguir para (b).
- Se FAIL → corrigir os itens apontados e rodar de novo.
- Se FAIL na 3ª tentativa: PARAR o fluxo. NÃO apresentar Gate Humano 1.
  Avisar: "Guardião da Fase 1 reprovou 3 vezes. Itens não resolvidos: [lista completa]. Preciso da sua intervenção."

REGRAS INVIOLÁVEIS:
- PROIBIDO apresentar o Gate Humano 1 sem PASS do guardião.
- PROIBIDO dizer "os critérios estão OK" sem ter EXECUTADO o script via bash. Validar de cabeça = probabilístico = proibido.
- PROIBIDO seguir para a Fase 2 sem PASS.
- Tentativa que não mudou nada NÃO conta como tentativa.
- Registrar no projeto.md (Estado das Fases): `guardiao_fase1: PASS em [data] — output: "[colar a linha de saída do script]"`. Sem esse registro, a Fase 1 NÃO está concluída.

### REGISTRO DE GUARDIÃO — REGRA ABSOLUTA
É PROIBIDO escrever "guardiao_fase1: PASS" sem ter executado o script via bash.
O registro DEVE incluir a saída real: `guardiao_fase1: PASS em [data] — output: "PASS - Fase 1 validada."`
PROIBIDO: "validado manualmente" / "script ausente" / "PASS" sem output / qualquer justificativa para não rodar.
Se o script não existir → PARAR e avisar (verificar com `ls "${CLAUDE_PLUGIN_ROOT}/scripts/"`). Não improvisar validação manual.
Se o script falhar ao executar → PARAR e mostrar o erro. Não assumir PASS.

Após PASS do script:
   b) Consultar agents/guardiao-fase1.md: verificar processo (tabela exibida, H2s salvos, locId correto)
      - Só após PASS do script E verificação de processo: apresentar Gate Humano 1 ao cliente

Fase 1 NÃO gera Excel. Todos os dados (concorrentes, páginas, KWs, arquitetura) são salvos apenas no projeto.md. O Excel consolidado é gerado uma única vez ao fim da Fase 2 (Opção B — evita dois arquivos dessincronizados).

ORDEM CORRETA do Gate Humano 1:
1. Agente roda guardiao_fase1.py via bash → PASS (loop até 3x)
2. Agente apresenta o resumo do Gate ao cliente
3. Cliente aprova ou ajusta
4. Só após aprovação: marcar approved:true

Se o guardião não rodou, o Gate Humano 1 NÃO pode ser apresentado.

## REGRA ANTI-INVENÇÃO (dados de ferramenta)
Métricas (DA, SD, volume, tráfego, backlinks) só são afirmadas como fato se vieram de uma chamada REAL de ferramenta (Ubersuggest/Semrush) nesta execução.
- Se a ferramenta não retornou o dado (erro, rate limit), marcar como "não verificado" ou "—", NUNCA preencher com número estimado apresentado como real.
- DA/SD de origem incerta: indicar a fonte (ex: "DA via serp_analysis, não confirmado por domain_overview") ou marcar como estimativa.
- Proibido usar SD "4" ou qualquer número padrão para KWs sem dado real.
