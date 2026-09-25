# orq-icp - Onboarding de Novo Cliente

Comando: /link-flow configurar
NUNCA cria projeto.md antes de completar TODOS os blocos em ordem e guardiao aprovar.
Deterministico - sem suposicoes, sem recomendacoes nao solicitadas.

## REGRA 0 - LER DISCO
Verificar projetos/*/projeto.md antes de qualquer pergunta:
A: Nenhum projeto - iniciar direto
B: 1 projeto - exibir nome, perguntar continuar ou novo
C: Novo mesmo cliente - slug com sufixo, NUNCA sobrescrever
D: 2+ projetos - listar todos, perguntar qual ou novo

**Nunca buscar estado de cliente fora de `projetos/`** (Downloads,
Documentos, ou qualquer outra pasta). Se o operador mencionar um cliente
que não aparece em `projetos/*/projeto.md`, tratar como projeto novo
(caso A ou C acima) — nunca ir procurar arquivos soltos em outro lugar
achando que vai encontrar o estado dele lá. Misturar estado de um
cliente com a sessão de outro já aconteceu num teste real (relatório de
testes, erro #3).

## BLOCO 0 - Caminho do site (OBRIGATORIO, sempre a primeira pergunta)
Define site_tipo no projeto.md. NUNCA usar os termos "Astro" ou "WordPress"
com o cliente — são detalhes técnicos internos, o cliente não precisa
saber. Perguntar pelo resultado, nunca pela tecnologia:

> "Antes de começar, uma pergunta rápida: você já tem um site no ar e
> quer que eu trabalhe nele, ou quer que eu crie um site novo do zero
> para você?"
>
> (1) Já tenho um site e quero continuar usando ele
> (2) Quero um site novo, criado do zero

SE (1): perguntar a URL do site atual.

Com a URL em mãos, verificar tecnicamente (sem perguntar nada ao cliente
ainda) se o site é WordPress — nossa ferramenta hoje só consegue atuar
em sites WordPress via plugin, não em qualquer outro tipo de site:

- Buscar a URL e checar sinais de WordPress: presença de `/wp-json/`
  (REST API), `wp-content/` no HTML, meta tag `generator` contendo
  "WordPress", ou `/wp-login.php` respondendo.

SE for WordPress confirmado: registrar site_tipo: wordpress no
projeto.md. Seguir normalmente para o Bloco 1.

SE NÃO for WordPress (Wix, Shopify, Squarespace, site sob medida,
outro CMS, ou verificação inconclusiva): parar e ser honesto —
NUNCA prosseguir como se fôssemos conseguir editar esse site.

> "Dei uma olhada no seu site e ele não é WordPress — hoje eu só
> consigo editar diretamente sites WordPress. Duas opções:
>
> (1) Posso criar um site novo do zero para substituir o atual,
>     já otimizado e mais rápido — seu site de hoje fica no ar até
>     o novo estar pronto, você decide quando trocar.
> (2) Se preferir, posso só te orientar sobre o que precisaria mudar
>     no site atual, sem fazer a edição eu mesmo.
>
> O que prefere?"

SE escolher (1): registrar site_tipo: astro no projeto.md, e
registrar site_anterior_url: [URL] para referência (nunca apagar
ou substituir o site antigo sem confirmação explícita mais adiante,
no momento do deploy).
SE escolher (2): parar o onboarding aqui — não criar projeto.md,
já que o fluxo atual não cobre esse caminho. Avisar o cliente que
essa opção ainda não está disponível de forma automatizada.

SE (2) [no Bloco 0, cliente quer site novo desde o início]: registrar
site_tipo: astro no projeto.md. Seguir para o Bloco 1. No Bloco 2, a
pergunta "já tem site no ar?" nesse caso é só para saber se existe
algo a substituir (ex: site antigo desatualizado) — não muda o
site_tipo definido aqui.

NUNCA pular este bloco nem decidir por conta própria qual site_tipo
o cliente quer — isso é decisão comercial dele, sempre perguntada.
A checagem técnica de WordPress (acima) é diferente: não decide o
que o cliente quer, só confirma se o que ele já tem pode ser editado
por nós — sem essa checagem, o site_tipo=wordpress ficaria assumido
sem verificação, e o agente prometeria uma edição que não consegue
entregar.
Se o cliente perguntar a diferença entre as opções, explicar em termos
de resultado: "o site novo já vem com IA, otimizado para aparecer no
Google, hospedado por nós — o site existente eu edito e melhoro sem
trocar nada da estrutura que você já tem."

## BLOCO 1 - Identidade
Enviar 3 perguntas juntas. Aguardar resposta completa.
NAO executar nada depois. NAO perguntar KW aqui.

1. Qual o nome completo do negocio?
2. Qual o endereco completo COM CEP? (ex: Rua das Flores, 123 - Centro, Jundiai, SP, 13200-000) Se o CEP nao vier, PERGUNTAR — o schema JSON-LD precisa dele (postalCode).
3. Quais servicos voce presta? Do mais faturado ao menos.
   SE menos de 2 servicos detalhados OU resposta parecer KW: pedir detalhamento.
   Exemplo: Pode detalhar? Ex: clareamento, aparelho, implante...

## BLOCO 2 - Site
ANTES de exibir, executar invisivel:
- site=SIM: domain_overview (coleta DR e trafego do cliente para o ## Baseline)
- site=NAO: sem chamada MCP neste bloco

Exibir juntas:
4. Voce ja tem site no ar? SIM(URL) ou NAO

AO RECEBER RESPOSTA SIM + URL:
- Tentar discovery automatica: [URL]/sitemap.xml e [URL]/sitemap_index.xml via WebFetch
- SE encontrar sitemap: registrar sitemap_url no projeto.md e informar ao cliente que o sitemap foi encontrado
- SE nao encontrar: perguntar se tem link do sitemap ou prefere mapeamento manual
- NUNCA avancar para Bloco 3 sem registrar site_url e sitemap_status no projeto.md
5. Tem regulacao profissional? (OAB/CFM/CFO/CRP/CRC/CONAR ou nao)
6. Qual o horario de atendimento? (dias da semana + horarios. Ex: Seg a Sex, 9h as 18h)
   Gravar em ## Horario de Atendimento no projeto.md.

## BLOCO 3 - Regulacao (OBRIGATORIO se Q5 indicou orgao)
NAO pular. Executar sempre que houver orgao.
Web search regras publicidade do orgao.
Salvar em Restricoes Legais como regras inviolaveis.
Exibir resumo das restricoes ao cliente.

Apos exibir o resumo das restricoes, PERGUNTAR (bloco de 3 juntas):
7. Qual o seu numero de registro? (ex: CRP 06/3443, OAB/SP 123.456, CRC/SP 1-234567/O-1) — OBRIGATORIO. O orgao exige em toda publicidade.
8. Qual a sua area de atuacao / especialidade principal? (ex: Contabilidade para MEI; Direito Trabalhista; Psicanalise)
9. Formacao academica (OPCIONAL — usada so na pagina institucional, NUNCA em Money Page): [deixar em branco se nao quiser]

Se Q9 nao vier (especializacao pendente): aceitar vazio, marcar como [PENDENTE] no projeto.md.
Q7 (numero de registro) e BLOQUEANTE — o guardiao reprova sem ele. Orgao exige em toda publicidade.
Gravar em ## Dados do Profissional no projeto.md.

## BLOCO 4 - Tom de voz (OBRIGATORIO - sempre)
NAO pular.
Ler: skills/orq-icp/references/tom-de-voz.md
NUNCA gerar tom livre - usar apenas perfis do arquivo.
Inferir perfil 1/2/3/4 pelos servicos do Bloco 1.
Registrar numero do perfil.

Apresentar:
Com base no seu negocio ([segmento]), o tom que mais converte:
Perfil [N] - [nome exato do arquivo]
[descricao exata do arquivo]
Exemplo: [frase exata do arquivo]
Pode usar, ajustar ou descrever outro.
NUNCA avancar sem aprovacao.

## BLOCO 5 - Confirmacao
kw_principal NAO e coletada aqui. Registrar como: "a definir - Fase 1 (engenharia reversa)"
Motivo: KW seed sem dados reais de volume/concorrencia gera falsa seguranca. A KW real emerge da analise dos concorrentes na Fase 1 via serp_analysis + domain_top_pages.

### GUARDIÃO — OBRIGATÓRIO, EM CÓDIGO, COM LOOP
Rodar via bash: python "${CLAUDE_PLUGIN_ROOT}/scripts/guardiao_icp.py" --slug [slug]

LOOP (máximo 3 tentativas):
- Rodar. Se PASS → seguir para a Confirmação.
- Se FAIL → corrigir os itens apontados e rodar de novo.
- Se FAIL na 3ª tentativa: PARAR o fluxo. NÃO criar projeto.md. NÃO apresentar Confirmação.
  Avisar: "Guardião do onboarding reprovou 3 vezes. Itens não resolvidos: [lista completa]. Preciso da sua intervenção."

REGRAS INVIOLÁVEIS:
- PROIBIDO criar projeto.md sem PASS do guardião.
- PROIBIDO dizer "os dados estão OK" sem ter EXECUTADO o script via bash. Validar de cabeça = probabilístico = proibido.
- PROIBIDO pedir ao cliente para rodar o script — o cliente final é leigo e nunca vê o terminal.
- Tentativa que não mudou nada NÃO conta como tentativa.

Após PASS do guardião:
1. Exibir resumo
2. Perguntar: "Está correto? Posso criar o projeto?"
3. SIM: criar projetos/[slug]/projeto.md
4. NAO: voltar ao item que o cliente corrigiu

Resumo: Site(tipo)|Nome|Endereco(CEP)|Horario|Servicos|Site atual|Regulacao|Tom(PerfilN)|Slug
(kw_principal NAO aparece no resumo - sera definida na Fase 1)

## OUTPUT
projetos/[slug]/projeto.md com: slug, site_tipo (astro ou wordpress — Bloco 0), NAP (com CEP), horario de atendimento, servicos detalhados, perfil tom, restricoes, dados do profissional (se regulado), ICP (kw_principal: a definir), Baseline, estado fase 1
Confirmar: Projeto [nome] criado. Proximo: /link-flow planejamento.

## Referencias
skills/orq-icp/references/tom-de-voz.md
scripts/guardiao_icp.py
agents/guardiao-icp.md
~/.claude/skills/humanizer/SKILL.md
INICIO.md Regra 3

## Degradacao
location_suggest falha: null + avisar
competitors falha: serp_analysis
orgao falha: registrar nao obtido manualmente
numero de registro ausente: marcar como [PENDENTE] no projeto.md — bloqueia publicacao (guardiao reprova)
horario de atendimento ausente: marcar como [PENDENTE] — perguntar ao cliente antes da Fase 3

## REGRA ANTI-INVENÇÃO (global — vale para todo o Link Flow)
Campo que o cliente não forneceu = placeholder [CAMPO], NUNCA valor inventado. Isso vale para telefone, endereço, CEP, domínio, horário, e qualquer dado do negócio.
- No projeto.md, registrar dado ausente como [CAMPO] (ex: telefone: [TELEFONE]) — visível, para o cliente preencher depois.
- Proibido preencher com exemplo genérico ("Rua das Flores, 123", "08:00-18:00") como se fosse real.
- Se um dado é necessário e o cliente não deu, PERGUNTAR — não assumir.