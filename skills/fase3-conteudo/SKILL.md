---
name: fase3-conteudo
description: >
  Escreve exclusivamente Money Pages (site-fdf-seo-local) para negocios locais. Blog e responsabilidade do agente blog — NUNCA usar esta skill para artigos. Funciona para os dois site_tipo (wordpress via Elementor/Novamira, astro via arquivos .md + SSH) — as regras de conteúdo são as mesmas, só a publicação final ramifica.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# fase3-conteudo — Escritor de Conteúdo Local (Fase 3)

Invocada por /link-flow conteudo. Pré-requisito: Fase 2 concluída (Handoff_Fase3 no projeto.md).
Escreve o conteúdo aprovado na Fase 2, um por um, com qualidade e compliance. NUNCA publica — deixa aprovado para o Gate Humano 2.

## REGRA GLOBAL — Modos de operação e limites

"Modo automático" = não pedir permissão de FERRAMENTA (ler arquivo, rodar guardião, buscar dados). NUNCA pula gates de produto: Gate Humano 2, checagem de página existente, bloqueio de placeholder, compliance legal. Esses gates existem exatamente porque o modo automático foi o responsável pelo bypass — não são opcionais em nenhum modo.

"Auditoria / diagnóstico / não altere nada" = SOMENTE LEITURA. Proibido qualquer update_post_meta, delete_post_meta, wp_insert_post, wp_update_post ou escrita em arquivo. Achou um problema? REPORTA e PARA. Não conserta sem autorização explícita.

## Escritor AUTOCONTIDO
Templates locais (skills/fase3-conteudo/templates/): site-fdf-seo-local.md (Money Page), blog-search-informacional/guia/lista.md (blog).
Regras (skills/fase3-conteudo/references/): PADRAO-UNICO, regras-conteudo, regras-seo, regras-geo, regras-qualidade, regras-formatacao, rubrica-pontuacao, regras-cluster.
NÃO usa humanizer separado — o template JÁ prevê conteúdo humanizado. NÃO usa modelos de monetização (blog-fdf, infoproduto).

## ETAPA 0 - Ler contexto do projeto.md (Link Flow)
- Handoff_Fase3: Money Pages priorizadas (KW, estrutura, schema)
- Restrições Legais: regulação (OAB/CFM/etc.)
- NAP e dados reais do cliente (incluindo CEP)
- ## Horario de Atendimento: dias e horários — usado no schema openingHours, rodapé e FAQ
- ## Dados do Profissional: número de registro, abordagem, formação, especialização
  Esses dados são CONTEXTO para entender o negócio — NÃO são conteúdo para o texto da Money Page.
  REGRA GERAL: ter o dado no projeto.md NÃO é motivo para usá-lo na página. Critério: "isso ajuda o cliente final a DECIDIR COMPRAR?"
  Se regulado=true e número de registro AUSENTE ou em branco: PARAR. Avisar: "Falta o número de registro no projeto.md. O órgão exige em toda publicidade. Informe agora ou rode o onboarding novamente."
- TOM DE VOZ: OBRIGATÓRIO. Se não estiver definido no projeto.md, PARAR e pedir. NUNCA escrever sem tom de voz.

## ETAPA 1 - Modo de execucao
PERGUNTAR SEMPRE. NUNCA assumir modo sem perguntar. Esta pergunta NÃO pode ser pulada.

Pergunta obrigatória: "Como você prefere trabalhar? (1) Passo a passo — vejo e aprovo página por página; (2) Lote — recebo tudo de uma vez no final; (3) Automático — só quero o pacote final sem interrupções."

Três modos disponíveis:
- PASSO A PASSO: escreve 1 pagina, para, aguarda aprovacao, avanca
- LOTE: escreve todas as paginas, apresenta no fim para aprovacao conjunta
- AUTOMATICO: escreve todas, roda guardiao, entrega pacote completo sem interrupcoes — usar apenas em testes ou quando Jorge/operador confirmar este modo explicitamente

## ETAPA 2 - Fila automática
Puxar Money Pages do Handoff_Fase3 NA ORDEM DE PRIORIDADE. Não pedir ao cliente para escolher/extrair planilha.

### VERIFICAÇÃO PRÉ-ESCRITA — Página já existe? (BLOQUEANTE)

**SE site_tipo: astro** — verificar se o arquivo de conteúdo já existe:
```bash
ls "_astro/src/content/servicos/<slug-pagina>.md" 2>/dev/null
```
Se existir → PARAR e perguntar:
  "⚠️ Já existe um arquivo de conteúdo com esse slug: `<slug-pagina>.md`.
   O que fazer?
   (1) Reescrever — sobrescrevo o conteúdo, mantenho a URL
   (2) Escolher outro slug
   (3) Cancelar"
Registrar a escolha no projeto.md antes de prosseguir.

**SE site_tipo: wordpress** — APLICA-SE SOMENTE AO CAMINHO 1 (cliente COM Novamira/MCP).
Antes de escrever qualquer linha de conteúdo para uma página, executar via bash:
```bash
python "${CLAUDE_PLUGIN_ROOT}/scripts/verificar_existe.py" --slug <slug> --tipo page --wp-url <WordPress URL do projeto.md>
```
Exit 0 = "livre" → prosseguir.
Exit 1 = JSON com dados da página existente → PARAR e perguntar:
  "⚠️ Já existe conteúdo com esse slug no WordPress:
   ID [x] · '[título]' · status [y] · criado em [data]

   O que fazer?
   (1) Reescrever — sobrescrevo o conteúdo, mantenho o ID e a URL
   (2) Deletar e criar do zero — mando para a lixeira e crio novo
   (3) Escolher outro slug
   (4) Cancelar"

Registrar a escolha no projeto.md antes de prosseguir.
MOTIVO: o WP adiciona sufixo -2, -3 ou __trashed silenciosamente ao criar slug duplicado
— o menu e o schema ficam apontando para o slug errado sem aviso.

## ETAPA 2B - Outline (ANTES de escrever — obrigatorio)

### Passo 1 — Verificar H2s para a KW DESTA página
Ler `## H2s dos Concorrentes (por KW)` no projeto.md e localizar `### KW: [kw da página atual]`.
FORMATO OBRIGATÓRIO da seção: `### KW: [kw]` seguido dos H2s por concorrente. Este é o ÚNICO formato aceito — nunca formato flat (lista sem subseção `### KW:`).

- Subseção existe com H2s reais → usar no Passo 3.
- Subseção existe com "Sem concorrente editorial" → declarar no outline e ir ao Passo 3.
- Subseção AUSENTE → ir ao Passo 2 (busca ativa — OBRIGATÓRIA).

### Passo 2 — Busca ativa de concorrentes (só se ausente no projeto.md)
NUNCA pular para template sem executar este passo.

1. Rodar `serp_analysis` para a KW DESTA página (usar `location_id` do projeto.md).
2. Analisar top 10:

**2a — Concorrente editorial encontrado** (psicólogo/clínica com página própria):
- WebFetch da URL do(s) concorrente(s) mais relevante(s) — até 2.
- Extrair H2s em ordem.
- Salvar em projeto.md: adicionar `### KW: [kw]` com H2s encontrados.
- Usar no Passo 3.

**2b — Só diretórios** (Doctoralia, Psitto, Psicologos.com.br etc.):
- Declarar EXPLICITAMENTE no outline: "Sem concorrente editorial para '[kw]' — SERP dominada por diretórios ([lista])."
- Salvar em projeto.md: `### KW: [kw]` → `Sem concorrente editorial — só diretórios ([nomes]).`
- Ir ao Passo 3 com template (declaração obrigatória no outline).

### Passo 3 — Cruzar e estruturar o outline
1. Se há H2s reais: H2 em 2+ concorrentes = entra; H2 único = avaliar.
2. Filtrar: descartar institucionais (Quem Somos, Equipe). Manter transacionais e informativos relevantes.
3. Adicionar: seções que nenhum concorrente usa mas que geram vantagem (FAQ, Como funciona, Regiões atendidas).
4. Aplicar regras: H2-1 em pergunta com KW, KW no último H2 antes do FAQ, FAQ sempre último H2.
5. Declarar no outline a fonte: "H2s reais de [URLs]" ou "Sem concorrente editorial — outline baseado em template."
6. Apresentar outline ao Jorge para aprovação. NÃO escrever sem aprovação do outline.

## ETAPA 3 - Escrever (pelo template, já humanizado, no tom de voz)

### PRÉ-REQUISITO OBRIGATÓRIO — Ler a estrutura do molde antes de escrever
APLICA-SE SOMENTE A site_tipo: wordpress COM Novamira/MCP conectado — Astro não tem
"molde"/widgets, não existe esse conceito no motor. Verificar `site_tipo` e a
conexão Novamira antes de decidir:
- **wordpress COM Novamira (Caminho 1)** → ler o `molde_id` do projeto.md e mapear a estrutura de widgets, como descrito abaixo.
- **wordpress SEM Novamira (Caminho 2), ou astro** → PULAR a leitura do molde. Escrever usando a estrutura do template site-fdf-seo-local.md diretamente. NUNCA pedir molde_id a um cliente sem plugin — ele não tem WordPress/Elementor para ler, e um cliente astro nunca tem molde.

ANTES de escrever qualquer linha de conteúdo (Caminho 1 apenas), ler o `molde_id` registrado no `projeto.md` do cliente (campo `## Molde de Money Page`). Se `molde_id` não existir no projeto.md, PARAR e perguntar: "Qual página do WordPress serve de molde para este cliente? Preciso do ID e do slug."

Com o `molde_id` em mãos, ler o _elementor_data desse molde e mapear a estrutura de widgets que o redator vai preencher. Entregar ao redator o inventário completo:

**É PROIBIDO reutilizar IDs de widget (como `a344d33`, `be280bf`, `2c32edf`) de sessões anteriores ou de outro cliente.** Cada molde tem IDs únicos gerados pelo Elementor. Reutilizar IDs do molde 731 em outro cliente injeta no widget errado ou falha silenciosamente.

Exemplo de inventário:
> "1 H1 · 1 parágrafo hero · 1 botão CTA · 1 H2 de serviços (pergunta com KW) · 1 subtítulo/lead descritivo (texto corrido, ~1 frase) · 3 cards [título h3 + bullet único] · 1 botão CTA · 1 H2 diferenciais · 3 icon-lists [título + 1 bullet] · 1 botão CTA · 1 H2 regiões · 1 parágrafo regiões · 1 H2 FAQ · 4 perguntas FAQ · meta title · meta description"

O redator escreve NA MEDIDA desta estrutura — cada seção do texto deve encaixar exatamente num widget. Se o conteúdo não couber (ex: 4 diferenciais para 3 icon-lists), o REDATOR ajusta ANTES de escrever. O injetor nunca improv isa estrutura.

Erros que este passo previne (histórico):
- 4 diferenciais escritos para 3 widgets → injetor descartou 1 diferencial (página 902)
- Título de card escrito no widget de subtítulo/lead → redundância semântica com o card 1 (página 904)

Seguir EXATAMENTE o template site-fdf-seo-local (H1 com KW, KW nas primeiras 100 palavras, FAQ último H2, H2 Regiões obrigatório, CTA específico 3x, word count igual a media dos 3 concorrentes (calculada na ETAPA 2B), blocos de copy — nunca HTML).
Aplicar o TOM DE VOZ do projeto.md.
REGRA ANTI-INVENÇÃO (C1-C5): dado que o cliente não forneceu (telefone, endereço, horário, anos, depoimentos) = placeholder [CAMPO] VISÍVEL, NUNCA inventar. Se a seção depende de dado que não veio, não criar a seção com dado falso. Schema: campo sem origem real = omitir + listar em PREENCHER ANTES DE PUBLICAR.
REGRA — Money Page é página de VENDA, não currículo:
NÃO incluir na Money Page: número de registro profissional (CRC/CRP/OAB/CRM/CRO), diploma, faculdade, formação acadêmica, títulos, pós-graduação.
Esses dados pertencem à página institucional ("Quem Somos"/"Sobre"). Ninguém contrata um serviço porque viu o número do registro ou o nome da faculdade.
O que ENTRA: o problema do cliente, a solução, diferenciais REAIS de venda (atendimento, especialidade, clareza, prazo), prova social e CTA.
EXCEÇÃO ÚNICA: se as Restrições Legais do conselho exigirem o registro em TODA peça publicitária, incluir UMA vez só, discreto no rodapé — nunca na intro, nunca nos diferenciais, nunca como argumento de venda.
DECLARAÇÃO OBRIGATÓRIA DE OMISSÕES: se algum bloco 🔒 FIXO do template for omitido, incluir no texto entregue a linha: "⚠️ Bloco [Nome] omitido — motivo: [razão]". Nunca omitir em silêncio. O Gate Humano 2 precisa desta informação para decidir.

## ETAPA 4 - Guardião local
### GUARDIÃO FASE 3 — OBRIGATÓRIO, EM CÓDIGO, COM LOOP
Rodar via bash: python "${CLAUDE_PLUGIN_ROOT}/scripts/guardiao_fase3.py" --slug [slug] --arquivo [caminho-do-texto]

LOOP (máximo 3 tentativas):
- Rodar. Se PASS → seguir para ETAPA 5 (Compliance).
- Se FAIL → reescrever os itens apontados e rodar de novo.
- Se FAIL na 3ª tentativa: PARAR o fluxo. NÃO apresentar Gate Humano 2.
  Avisar: "Guardião da Fase 3 reprovou 3 vezes. Itens não resolvidos: [lista completa]. Preciso da sua intervenção."

REGRAS INVIOLÁVEIS:
- PROIBIDO apresentar o Gate Humano 2 sem PASS do guardião.
- PROIBIDO dizer "o texto está OK" sem ter EXECUTADO o script via bash. O agente NUNCA se autoaprova.
- PROIBIDO seguir para injeção sem PASS.
- Tentativa que não mudou nada NÃO conta como tentativa.

### REGISTRO DE GUARDIÃO — REGRA ABSOLUTA
É PROIBIDO escrever "guardiao_fase3: PASS" sem ter executado o script via bash.
O registro DEVE incluir a saída real: `guardiao_fase3: PASS em [data] — output: "[colar a linha de saída do script]"`
PROIBIDO: "validado manualmente" / "script ausente" / "PASS" sem output / qualquer justificativa para não rodar.
Se o script não existir → PARAR e avisar (verificar com `ls "${CLAUDE_PLUGIN_ROOT}/scripts/"`). Não improvisar validação manual.
Se o script falhar ao executar → PARAR e mostrar o erro. Não assumir PASS.

## ETAPA 5 - Compliance (REPROVA)
Se o texto violar as Restrições Legais (ex: advocacia "resultado garantido"/"melhor advogado"; medicina promessa de cura), REPROVAR e reescrever. Publicar violação gera problema com o conselho.

## ETAPA 6 - Gate Humano 2 (INVIOLÁVEL — NUNCA PULAR)
PARADA OBRIGATÓRIA. O agente NÃO avança para a ETAPA FINAL sem aprovação explícita do humano.
Apresentar SEMPRE:
1. O texto completo escrito
2. A lista PREENCHER ANTES DE PUBLICAR (todos os placeholders)
3. Qual página será criada/atualizada (slug, ID se já existir)
4. Quais blocos do template foram omitidos e por quê
Depois PARAR e perguntar: "Aprova este conteúdo para injeção?"
É PROIBIDO injetar sem resposta afirmativa. Modo automático NÃO dispensa este gate.

## Degradação
Handoff_Fase3 ausente: avisar que a Fase 2 precisa rodar antes.
Tom de voz ausente: parar e pedir.
Dado do cliente ausente para uma seção: placeholder, nunca inventar.

## ETAPA FINAL — Entrega do conteúdo (ramifica por site_tipo, depois por ferramenta disponível)

PRÉ-REQUISITO: Gate Humano 2 aprovado explicitamente nesta sessão. Se não houver aprovação registrada, PARAR e voltar à ETAPA 6.

### Ramificação principal — ler site_tipo primeiro

**SE site_tipo: astro** → ir direto para "=== CAMINHO ASTRO ===" mais abaixo.
Não existe decisão de MCP Novamira para clientes astro — a "REGRA DE
ROTEAMENTO" logo abaixo se aplica só a `site_tipo: wordpress`.

**SE site_tipo: wordpress** → seguir a "REGRA DE ROTEAMENTO" a seguir.

### REGRA DE ROTEAMENTO (site_tipo: wordpress) — decisão automática, ZERO pergunta ao cliente

Antes de decidir o caminho, VERIFICAR AS TOOLS DISPONÍVEIS na sessão.
NUNCA concluir que o MCP Novamira não existe lendo o projeto.md — verificar as tools ativas.

CAMINHO 1 — MCP Novamira presente nas tools:
→ Injeta. Não pergunta nada. Se falhar 3x consecutivas → cai no Caminho 2 e avisa.

CAMINHO 2 — MCP ausente das tools:
→ Entrega o texto no chat, organizado por seção, pronto para colar. Fim.

PROIBIDO:
- Perguntar ao cliente se quer ativar PHP
- Ensinar a configurar plugin ou rodar "claude mcp list"
- Oferecer "3 opções de injeção"
- Concluir que o MCP não existe porque o projeto.md diz [A CONFIGURAR] ou [PENDENTE]
  → o projeto.md NÃO é fonte de verdade sobre tools disponíveis. As TOOLS são.

Antes de qualquer entrega, executar a verificação obrigatória (válida para os dois caminhos):

VERIFICAÇÃO A — PLACEHOLDER: Varrer o texto. Se houver qualquer [MAIÚSCULAS] ([CAMPO], [ABORDAGEM], [TELEFONE], [CRP] etc.) → NÃO entregar. Listar todos os placeholders encontrados e informar quais dados o cliente precisa fornecer. Escrever com placeholder = OK (anti-invenção). Entregar com placeholder = PROIBIDO.

VERIFICAÇÃO B — PÁGINA EXISTENTE: exclusiva do Caminho 1. Clientes sem plugin vão direto para a entrega manual após a Verificação A.

Verificar as tools disponíveis (não o projeto.md) e seguir o caminho correspondente:

=== CAMINHO 1 — Cliente COM plugin (Novamira conectado) ===

VERIFICAÇÃO B — PÁGINA EXISTENTE: Consultar o WordPress — já existe página com esse slug, título ou KW? Se sim, PARAR e perguntar: "A página [slug] já existe (ID [x], status [y], slug real [z]). (a) Atualizar existente (b) Criar nova (c) Cancelar"

### INJEÇÃO — REGRA ABSOLUTA

A injeção é feita EXCLUSIVAMENTE via **`scripts/injetar_elementor.php`**.

O agente NÃO escreve PHP de injeção. Não improvisa. Não copia código de sessões anteriores. Não adapta receitas. A função `inject_money_page()` no script é imutável — o agente preenche SOMENTE o array `$params['widgets']` com os IDs e textos mapeados.

PROIBIDO:
- Escrever bloco PHP de injeção inline fora do script canônico
- Usar `$wpdb->insert` para gravar `_elementor_data`
- Definir `post_content = '<!-- Elementor -->'` ou deixar vazio
- Pular o Passo 8 (`Post::create($id)->update()`) — ele gera o CSS e popula `_elementor_page_assets`
- Reutilizar IDs de widget de sessões ou clientes anteriores

MOTIVO: 3 bugs vieram do agente reimplementando a receita a cada injeção (3 arquivos PHP divergentes). A receita é UMA, é código, e está em `scripts/injetar_elementor.php`.

**Como usar o script:**

1. Ler o `_elementor_data` do molde para mapear os IDs e tipos dos widgets
2. Preencher `$params['widgets']` no script com os IDs e valores corretos:
   ```php
   'widgets' => [
       'abc123' => ['title' => 'H1 com a KW'],
       'def456' => ['editor' => '<p>Introdução...</p>'],
       'ghi789' => ['text' => 'AGENDE AGORA'],
       'jkl012' => ['icon_list' => [['text' => 'item 1'], ['text' => 'item 2']]],
       'mno345' => ['image_alt' => 'alt da imagem'],
       'pqr678' => ['accordion_items' => ['Pergunta 1?', 'Pergunta 2?']],
   ],
   ```
3. Executar via `novamira/execute-php` passando o conteúdo do script preenchido
4. O script retorna JSON: `{ok, post_id, slug_real, widget_count, css_bytes, page_assets_count}`
5. Se `ok: false` → corrigir os erros listados e reexecutar. Máximo 3 tentativas.

Após execução bem-sucedida:
- Verificar slug REAL retornado — WordPress adiciona sufixo -2, -3 se o slug já existir
- Atualizar projeto.md: editar a linha existente da Money Page (wp_post_id, status, slug real). NUNCA duplicar a linha
- Verificar encoding UTF-8 (acentos corretos, sem "Ã")

### GUARDIÃO DE INJEÇÃO — automático, nunca sob demanda

Ao terminar a injeção, rodar IMEDIATAMENTE e SEMPRE, sem que o operador precise pedir.

**REGRA FUNDAMENTAL: O guardião valida o RESULTADO NO BANCO, nunca o arquivo local pré-injeção.**
O --arquivo DEVE ser o JSON extraído do banco via get_post_meta() + base64 (Passo A).
Usar o JSON pré-injeção dá PASS mesmo quando o banco está corrompido
(incidente: pág 913, 2026-07-12 — $wpdb->insert corrompeu o banco; guardião validou
arquivo local e retornou PASS numa página que renderizava em branco).

#### Passo A — Extrair valores do banco para o guardião

O guardião exige um arquivo JSON no disco. A injeção vai direto ao WordPress — o JSON não existe localmente. Extrair assim:

**1a. PHP (via Novamira execute-php) — _elementor_data em base64 para evitar truncamento:**
```php
$raw = get_post_meta([POST_ID], '_elementor_data', true);
return base64_encode($raw);
```
O `return_value` da chamada é a string base64.

**1b. PHP — post_content, edit_mode, page_assets e CSS para Checks 10, 11 e 12:**
```php
$pid = [POST_ID];
$assets = get_post_meta($pid, '_elementor_page_assets', true);
$css_file = WP_CONTENT_DIR . '/uploads/elementor/css/post-' . $pid . '.css';
return [
    'post_content'       => get_post_field('post_content', $pid),
    'edit_mode'          => get_post_meta($pid, '_elementor_edit_mode', true),
    'page_assets_count'  => is_array($assets) ? count($assets) : 0,
    'css_bytes'          => file_exists($css_file) ? filesize($css_file) : -1,
];
```

**2. Python — decodificar e salvar SEM BOM (Windows e Linux):**
```python
# open(..., encoding="utf-8") escreve UTF-8 sem BOM por padrão no Python
import base64, os, tempfile

b64 = "<return_value da chamada PHP 1a>"
decoded = base64.b64decode(b64).decode("utf-8")
path = os.path.join(tempfile.gettempdir(), "elementor-[POST_ID].json")
with open(path, "w", encoding="utf-8") as f:
    f.write(decoded)
```

#### Passo B — Rodar o guardião

```
python "${CLAUDE_PLUGIN_ROOT}/scripts/guardiao_injecao.py" `
  --arquivo <path> `
  --kw "<kw da página>" `
  --mold "<str1,str2>" `
  --page-settings "<valor_serializado>" `
  --post-content "<post_content da 1b>" `
  --edit-mode "<edit_mode da 1b>" `
  --page-assets-count <page_assets_count da 1b> `
  --css-bytes <css_bytes da 1b>
```

- `--mold`: strings do molde que NÃO devem aparecer na nova página (ex: nome de outra cidade, outra abordagem)
- `--page-settings`: valor serializado de `_elementor_page_settings` (opcional — Check 8)
- `--post-content`: valor de `post_content` extraído via 1b — Check 10 valida que tem > 1000 bytes
- `--edit-mode`: valor de `_elementor_edit_mode` extraído via 1b — Check 11 valida `'builder'`
- `--page-assets-count`: número de chaves em `_elementor_page_assets` — Check 12 valida > 0
- `--css-bytes`: bytes do arquivo CSS — Check 12 valida > 1000

#### Passo C — Limpar

Após PASS, deletar o arquivo temporário:
```python
os.remove(path)
```

**É PROIBIDO reportar "página criada" sem ter executado o guardião e obtido PASS.**

**É PROIBIDO listar checks manualmente** ("H1 ✅, alt ✅, molde ✅") — inspeção manual falhou em 3 páginas seguidas (902, 903, 904): erros reais de alt vazio, heading redundante e texto do molde passaram invisíveis. A ferramenta é a única fonte confiável.

Se FAIL: corrigir os erros listados pelo script e rodar de novo (máx 3 tentativas). Se persistir após 3 rodadas, PARAR e reportar ao operador com o output completo do guardião.

Só após PASS do guardião:
- Reportar resultado ao operador com o output do script ("PASS — X widgets — KW encontrada")
- Atualizar projeto.md
- Verificar encoding UTF-8 (acentos corretos, sem "Ã")

### VERIFICAÇÃO DE SAÍDA — Caminho 1 (complementar ao guardião — nunca substitui)
Depois de injetar, verificar o RESULTADO, não só o dado gravado:
1. post_content tem conteúdo? (len > 0) — se 0, a página abre VAZIA no editor
2. _elementor_data: JSON válido E contagem de widgets > 0
3. Comparar com o molde: a nova página tem número de widgets e tamanho de post_content compatíveis?
4. Se qualquer verificação falhar: REPORTAR FALHA, não sucesso. Dizer exatamente o que está errado.

PROIBIDO reportar "✅ sucesso" verificando apenas se o dado foi gravado no banco. Gravar no banco NÃO é o mesmo que funcionar na página. Sempre verificar o destino, nunca só a origem.

=== CAMINHO 2 — Cliente WordPress SEM plugin (Novamira não conectado) ===
ENTREGA MANUAL GUIADA. Não há injeção automática.
1. Entregar o texto organizado por SEÇÃO, na ordem da página:
   - TÍTULO (H1)
   - INTRODUÇÃO
   - CTA #1
   - TÍTULO DA SEÇÃO DE SERVIÇOS (H2) + cada serviço
   - DIFERENCIAIS
   - REGIÕES ATENDIDAS
   - CTA FINAL
   - FAQ (cada pergunta + resposta)
   - META TITLE e META DESCRIPTION (para o campo de SEO)
2. Cada seção rotulada e pronta para copiar/colar.
3. Convidar: "Abra a página no seu editor e me manda um print — eu te guio bloco a bloco, dizendo onde colar cada seção."
4. Ao receber o print: identificar os blocos visíveis e orientar onde colar cada seção, uma de cada vez.
5. Se o print não deixar claro qual bloco é qual, PERGUNTAR antes de orientar — nunca adivinhar.
6. A TRAVA DE SEO vale igual: ao adaptar/encurtar a pedido do cliente, NUNCA remover a KW do H1, introdução, primeiro H2, último H2, meta title e meta description.

=== CAMINHO ASTRO — site_tipo: astro ===
PUBLICAÇÃO AUTOMÁTICA REAL, sem entrega manual — o agente escreve o
arquivo e publica direto, igual ao Caminho 1 do WordPress. Nunca cair
para entrega manual num cliente astro só porque não há Novamira — essa
decisão é exclusiva de WordPress, não se aplica aqui.

1. Salvar o texto aprovado como `.md` (frontmatter no mesmo formato que
   `fase2-site-astro` já usa nas Money Pages):
   `_astro/src/content/servicos/<slug-pagina>.md`

   No frontmatter, tirar a página de `noindex` agora que o conteúdo é
   real (as Money Pages nascem `noindex` no primeiro deploy — ver
   `fase2-site-astro` ETAPA 4.3 — e saem de `noindex` quando a Fase 3
   escreve o texto de verdade nelas).

2. O guardião já rodou na ETAPA 4 (`guardiao_fase3.py`, o mesmo script,
   sem nenhuma alteração — ele valida o texto, não a plataforma). Não
   repetir aqui, só confirmar que o PASS está registrado.

3. Publicar de verdade — invocar `site-atualizar` (deploy via SSH,
   builda no VPS e sobe a página com o conteúdo real):
   > "Invocando site-atualizar para publicar [título da página]..."

4. Verificar:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" "https://[dominio]/servicos/[slug-pagina]"
   ```
   200 → publicado. Reportar ao operador com a URL.

5. Marcar a página como dados reais na tabela de Money Pages do
   `projeto.md` (`dados_status: real` — ver "Flag de dados
   fictícios vs reais", mais abaixo na ETAPA 7).

REGRA: o conteúdo entregue é o MESMO nos três caminhos (texto único do redator). Muda só COMO ele chega na página — automático (plugin), guiado (manual) ou automático (arquivo + SSH).

PROIBIDO: usar str_replace para gerar conteúdo (gera plágio/duplicate content). O conteúdo SEMPRE vem do redator, escrito do zero para aquela página.

## TRAVA DE SEO — pontos de otimização que NUNCA perdem a palavra-chave
Ler a kw_principal da Money Page no projeto.md (Handoff_Fase3 / KW da página).
Ao adaptar o texto a pedido do cliente, o agente PODE ajustar tom, tamanho e encaixe — mas NUNCA pode remover a palavra-chave destes pontos:
- H1 (título principal) — a KW principal tem que permanecer
- Introdução (primeiras ~100 palavras) — a KW tem que aparecer
- Primeiro H2 — mantém a KW
- Último H2 — mantém a KW
- Meta title e meta description — mantêm a KW

Se um pedido do cliente for encurtar/mudar de forma que REMOVERIA a KW de um desses pontos, o agente NÃO faz silenciosamente. Ele avisa:
"Posso encurtar, mas preciso manter '[kw_principal]' no [ponto], senão a página perde força no Google. Pode ser assim?" — e oferece uma versão que cabe E mantém a KW.
O agente NUNCA sacrifica a otimização para deixar o texto mais bonito/curto sem avisar.

## ETAPA 7 — Páginas obrigatórias (UMA VEZ, após a primeira Money Page aprovada)

Executar UMA VEZ por cliente, logo após a primeira Money Page passar no Gate Humano 2.
Verificar ## Estado das Fases no projeto.md: se já contém "Páginas obrigatórias: concluída", PULAR e ir para a ETAPA 8.

### Passo 1 — Perguntar
"Sua primeira página está pronta. Seu site precisa de 4 páginas obrigatórias — por lei (LGPD) e para o Google e as IAs confiarem no seu negócio (/sobre/, /contato/, /politica-de-privacidade/, /termos-de-uso/).
  (1) Criar agora
  (2) Terminar as Money Pages primeiro e criar depois"

Se (2): registrar em ## Estado das Fases: "Páginas obrigatórias: adiadas pelo cliente". Perguntar de novo ao fim da Fase 3.

### Passo 2 — Coletar dados em 3 blocos (NUNCA todas de uma vez)

**BLOCO A — História (para o /sobre/)**
1. Há quanto tempo você atua? (ano de início ou "X anos")
2. Formação e especializações: curso, instituição, ano
3. Por que você escolheu essa área? Conte em 3–4 frases, como contaria a um paciente.
4. Qual sua abordagem/método? Como você trabalha na prática?
5. Que tipo de pessoa você atende melhor?
6. Alguma coisa que te diferencia? (publicação, atuação, experiência específica)

**BLOCO B — Dados legais (para /politica-de-privacidade/ e /termos-de-uso/)**
7. Razão social ou nome completo + CPF/CNPJ (obrigatório para LGPD)
8. E-mail de contato para exercício de direitos LGPD
9. Endereço completo
10. O site tem: formulário de contato? Google Analytics? Pixel Meta? WhatsApp? Chat? Área de login? (marcar o que tiver)
11. Você guarda os dados dos formulários por quanto tempo?
12. Compartilha dados com alguém? (contador, plataforma de agendamento, e-mail marketing)
12b. Cidade e UF do foro para os Termos de Uso (normalmente a cidade da sede)

**BLOCO C — Operação (para o /contato/)**
13. Horário de atendimento
14. Presencial, online ou ambos?
15. Como o cliente prefere ser contatado? (WhatsApp, telefone, e-mail, formulário)

Gravar respostas em ## Dados Institucionais no projeto.md.

### Passo 3 — Trava de placeholder (BLOQUEANTE, ANTES da escrita)
NENHUMA das 4 páginas pode ser criada com [CAMPO] no texto.
Se faltar qualquer dado → PARAR agora, perguntar ao cliente, e só então escrever a página.
O bloqueio é ANTES da escrita — não apenas antes da entrega.

### Passo 4 — Verificar se a página já existe (BLOQUEANTE)

**SE site_tipo: astro** — para cada uma das 4 páginas, checar se o
arquivo já existe:
```bash
ls "_astro/src/pages/[sobre|contato|politica-de-privacidade|termos-de-uso].astro" 2>/dev/null
```
Se existir com conteúdo real (não o placeholder do tema) → PARAR e perguntar:
  (a) Sobrescrever o conteúdo
  (b) Cancelar esta página

**SE site_tipo: wordpress** — para cada uma das 4 páginas, antes de criar:
consultar o WP via PHP se já existe página/post com esse slug (publish, draft ou trash).
Se sim → PARAR e perguntar:
  (a) Usar a página existente (atualizar conteúdo)
  (b) Escolher outro slug
  (c) Cancelar esta página
MOTIVO: o WP adiciona sufixo -2, -3 silenciosamente ao criar slug duplicado — menu e schema ficam apontando para o slug errado.

### Passo 5 — Escrever 4 páginas

**/sobre/** — É A CASA DO REGISTRO PROFISSIONAL (banido da Money Page)
- PROSA, não bullet. Mínimo 400 palavras.
- Primeira pessoa. História real, não currículo.
- Estrutura: quem sou → por que faço isso → como trabalho → quem atendo → formação (aqui sim) → CTA
- Schema Person (nome, jobTitle, alumniOf, sameAs → Instagram/LinkedIn/GMB)
- ⚠️ NÃO incluir H1 no conteúdo — o template já renderiza o título como H1. H1 no conteúdo = duplo.

**/contato/** — NAP consistente (idêntico ao GMB, caractere por caractere)
- Endereço, telefone, e-mail, horário
- Formulário funcional: email_from = e-mail do CLIENTE (resposta 8) — NUNCA e-mail do molde
- Mapa embed
- Schema LocalBusiness
- Mínimo 200 palavras (Google penaliza página de contato vazia)

**/politica-de-privacidade/** — DOCUMENTO REAL, não template
Baseado nas respostas 7–12. Seções obrigatórias (nesta ordem):
  1. Identificação do controlador (razão social/nome + CPF/CNPJ + endereço)
  2. Dados coletados e finalidade (somente o que o site REALMENTE coleta — resposta 10)
  3. Base legal (LGPD art. 7 — indicar a base para cada coleta)
  4. Cookies e rastreadores (somente os que existem — resposta 10)
  5. Compartilhamento com terceiros (resposta 12)
  6. Tempo de retenção (resposta 11)
  7. Direitos do titular (LGPD art. 18: acesso, correção, exclusão, portabilidade, revogação)
  8. Canal de exercício dos direitos (e-mail da resposta 8)
  9. Data de última revisão
- MEI/microempresa: DPO NÃO é obrigatório (Res. CD/ANPD nº 2/2022)
- ⚠️ Política copiada de template descreve coleta que não é a real — pode ser prova contra o cliente na ANPD

**/termos-de-uso/** — DOCUMENTO REAL
Seções obrigatórias (nesta ordem):
  1. Objeto e aceite
  2. Uso permitido e proibido
  3. Propriedade intelectual do conteúdo
  4. Limitação de responsabilidade
  5. O site NÃO substitui consulta/atendimento profissional (crítico para saúde e direito)
  6. Foro e legislação aplicável (indicar cidade e estado)
  7. Data de vigência

SE site_tipo: astro — as 7 seções já vêm prontas no componente
`ConteudoLegal`; o que se escreve é `site.legal.termos` no `config/site.ts`:
`naoSubstitui` (item 5 — texto do nicho do cliente, mostrar ao cliente
antes de publicar), `foro: { cidade, uf }` (item 6 — resposta 12b) e
`vigenciaDesde` (item 7 — data ISO `AAAA-MM-DD`).

**DISCLAIMER OBRIGATÓRIO** — rodapé de /politica-de-privacidade/ e /termos-de-uso/:
> Este documento foi elaborado com base nas informações fornecidas pelo titular e na legislação vigente. Recomenda-se revisão por profissional jurídico antes da publicação definitiva.

### Passo 6 — Guardião das institucionais
NÃO rodar guardiao_fase3.py nessas páginas (critérios transacionais não se aplicam).
Rodar: `python "${CLAUDE_PLUGIN_ROOT}/scripts/guardiao_institucionais.py" --arquivo <path> --tipo <sobre|contato|privacidade|termos> --email-cliente <email>`

LOOP (máximo 3 tentativas):
- PASS → seguir.
- FAIL → corrigir os itens apontados e rodar de novo.
- FAIL na 3ª tentativa → PARAR. Reportar itens não resolvidos ao operador.

### Passo 7 — Publicar

**SE site_tipo: astro** — **nunca salvar como arquivo `.md`.** Sobre,
Contato, Política de Privacidade e Termos de Uso já existem como páginas
prontas no tema promovido (`_astro/src/pages/sobre.astro`, `contato.astro`,
`politica-de-privacidade.astro`, `termos-de-uso.astro`) — elas leem os
dados direto de `site.*` no `config/site.ts` (NAP, `anoFundacao`, equipe
via `getCollection`, `site.legal` para a política e `site.legal.termos`
para os termos). Editar
esses campos no `config/site.ts` é publicar a página — não existe
arquivo de conteúdo separado pra essas quatro.

Todos os layouts (base, tema-03 a tema-07) têm as quatro rotas. Se alguma
faltar no layout promovido (motor desatualizado), ver a ressalva da
ETAPA 4.5 do `fase2-site-astro`.

Rodar `guardiao_institucionais.py` (Passo 6, já cobre os dois casos —
não é específico de WordPress). Publicar via `site-atualizar` (deploy
SSH), igual às Money Pages no "CAMINHO ASTRO" acima.

**SE site_tipo: wordpress** — usar "${CLAUDE_PLUGIN_ROOT}/scripts/injetar_elementor.php" no MODO 2 (molde_id = 0, html_content = HTML da página).
Os Passos 5–10 são idênticos ao MODO 1 (Money Page): wp_slash, Document::save(), page_assets, CSS, metas Yoast.
Não há molde para clonar — o html_content vira um widget text-editor único com o HTML completo.
Status: draft. Gate Humano antes de publicar.

**Nos dois casos:**
Registrar na tabela de Money Pages com Tipo = "institucional" e
`dados_status` conforme a seção abaixo — nunca "Páginas obrigatórias:
concluída" se algum dos dados usados (CNPJ, endereço, e-mail) ainda for
fictício/de teste.

### Flag de dados fictícios vs reais (aplica-se a Money Pages e institucionais)

Testar com dado fictício é permitido — útil para o cliente ver o site
funcionando antes de mandar os dados definitivos. O que NUNCA pode
acontecer é isso ficar registrado como se fosse dado real, sem aviso.

Toda página (Money Page ou institucional) tem um campo `dados_status`
na tabela de Money Pages do `projeto.md`:
- `dados_status: real` — os dados usados (CNPJ, endereço, telefone,
  depoimentos, etc.) vieram do cliente de verdade, confirmados.
- `dados_status: ficticio` — a página foi escrita/publicada com dado de
  teste (para o cliente ver a estrutura funcionando) — CNPJ inventado,
  endereço de exemplo, texto genérico. **Nunca vira "concluída" com esse
  status** — fica como pendência visível até o operador confirmar que
  trocou pelo dado real.

Ao criar uma página com qualquer dado que o cliente não confirmou como
definitivo, registrar `dados_status: ficticio` — nunca deixar em branco
e nunca marcar como se fosse `real` só porque o texto está bem escrito.
Página de Política de Privacidade ou Termos de Uso com CNPJ/endereço
fictício é risco jurídico se for ao ar por engano — por isso esse campo
é tratado com o mesmo peso de um campo vazio, nunca like "só um detalhe".

---

## ETAPA 8 — Fechamento da Fase 3 e oferta de blog

**Antes de marcar a Fase 3 como concluída, verificar TODAS as páginas —
Money Pages e institucionais — na tabela do projeto.md:**

0. **As 4 páginas institucionais obrigatórias existem na tabela?**
   Lista fechada, sempre as mesmas 4, nunca menos: `/sobre/`, `/contato/`,
   `/politica-de-privacidade/`, `/termos-de-uso/`. Se alguma estiver
   ausente da tabela (nem criada, nem adiada explicitamente pelo
   cliente na ETAPA 7 Passo 1), ela conta como pendência — nunca
   simplesmente "esquecida" sem aparecer em lugar nenhum do status.
1. Cada página tem um registro de `guardiao_fase3` (ou
   `guardiao_institucionais`, conforme o tipo) com PASS?
2. Cada página tem `dados_status: real` (não `ficticio`)?

**Se TODAS passam nos dois critérios:**
Registrar em `## Estado das Fases`: "Fase 3: concluída em [data]".
Perguntar: "Todas as Money Pages estão prontas, com dados reais e
validadas. Quer iniciar a produção de blog agora?"
SIM → avisar: use /blog para invocar o agente blog
NÃO → encerrar fase3-conteudo

**Se ALGUMA página não passa em algum dos dois critérios** (não rodou o
guardião, ou está com `dados_status: ficticio`) — **nunca registrar como
"concluída"**, mesmo que o operador peça para encerrar mesmo assim (ex:
teste, ou decisão consciente de deixar para depois):

Registrar em `## Estado das Fases`: "Fase 3: encerrada parcialmente em
[data] — pendências: [lista de páginas com o motivo de cada uma: 'sem
validador' ou 'dados fictícios']".

Reportar ao operador, explícito, sem suavizar:
> "Fase 3 encerrada parcialmente — nem todas as páginas estão prontas
> pra valer:
>
> ⚠️ [N] página(s) com pendência:
> - [nome da página]: [motivo — ex: 'não passou pelo validador (guardiao_fase3)' ou 'dados fictícios, precisa confirmar com o cliente']
> - [repetir para cada]
>
> Essas páginas continuam funcionando no site, mas não estão prontas
> para tráfego real até isso ser resolvido."

Isso vale mesmo em modo de teste — "encerrada parcialmente" é o estado
correto para conteúdo de teste, nunca "concluída".

### Publicação por etapa (nunca esperar tudo pronto para publicar algo)

Cada Money Page e institucional publica assim que **ela mesma** passa
pelo Gate Humano 2 e pelo guardião (ver "CAMINHO ASTRO"/"CAMINHO 1"
acima) — não é preciso esperar todas as páginas ficarem prontas para
publicar a primeira. Isso já é o comportamento padrão desta skill.

O blog segue o mesmo princípio: a estrutura (`/blog`, índice, rotas,
sitemap) já sobe vazia desde o primeiro deploy do site
(`fase2-site-astro`), com o link no menu — nunca esperando o primeiro
artigo para existir. O Google conhece a arquitetura do blog desde o
início, em vez de descobrir estrutura e conteúdo juntos no primeiro post.
