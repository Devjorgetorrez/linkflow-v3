# Handoff — SiteFlow CMS / LinkFlow (Jorge Torrez) — v4 (26/09/2026, Relatório de Testes 3)

> **Mudança de fluxo (25/09/2026):** a partir da rodada R0, o modelo de duas
> sessões (chat edita / Code valida) foi encerrado. `C:\Projetos\linkflow-completo`
> agora é repositório git, e uma única sessão do Code edita a pasta real,
> testa em cópia isolada e faz commit por rodada. O `HANDOFF.md` continua
> sendo o documento de retomada — cole-o inteiro numa conversa nova se a
> sessão for perdida; o histórico de commits complementa o que este
> documento resume.
>
> Cole este documento inteiro como primeira mensagem numa conversa nova,
> apontando a working directory para `c:\Projetos\linkflow-completo` (repo
> git local, já com todo o histórico de commits). Não precisa de `.zip`,
> `manifesto-md5.txt` nem `conferir_manifesto.py` — isso era do modelo
> antigo de duas sessões (chat edita / Code valida), encerrado a partir da
> rodada R0. Ele substitui o histórico das sessões anteriores: não existe
> transferência de conversa, então este documento é o que faz a sessão nova
> saber o que as anteriores sabiam. Rode `git log --oneline` e `git status`
> logo de cara para confirmar que a pasta bate com o que está descrito aqui.

## Estado atual em uma tela (26/09/2026)

- Última rodada: **Relatório de Testes 3** (`relatorios/Relatorio-Testes-3-LinkFlow-19-09.docx`),
  9 erros. Todos tratados no código (tabela abaixo). **Nada disso foi testado numa VPS real.**
- **Próximo relatório a tratar:** `relatorios/Relatorio_QA_Painel_SiteFlow.pdf` (mais extenso; o
  Lucas pediu para abordá-lo só depois de concluir o 3).
- **Pendência única de validação:** R5, teste de ponta a ponta na VPS de teste, agora incluindo o
  instalador novo e o fluxo em marcos. **Pedir autorização ao Lucas antes de tocar no VPS.**
- `relatorios/` e `templates-layout-temas/` (os 4 zips) estão no `.gitignore`: relatórios são
  internos e os layouts corretos já vivem em `_astro/`; os zips eram só referência.

## Relatório de Testes 3 — o que foi feito

| # | Erro | Correção | Commit |
|---|---|---|---|
| 25 | Instalador da VPS podia derrubar cliente ativo | `setup.sh` sem `apt upgrade` (só `--no-upgrade`, só o que falta); não remove `sites-enabled/default` se há outro site; porta via `ss`/`.env` (o `pm2 list` não mostra porta, então sempre caía em 3210); SSL sai do fluxo crítico (`ssl-cliente.sh` só pede certificado para nomes cujo DNS já aponta para o servidor); e-mail do certbot deixou de ser inventado (`ssl@com.br`); recusa domínio já servido por outro bloco Nginx; `migrar` só para o processo `painel` se for da instalação antiga. `.gitattributes` fixa LF nos `.sh` | `62cfd2b`, `4c5e659` |
| 28 | Auditoria acusava órfã falsa | `lib/links-internos.ts` lê o HTML real do `dist/`; regra de órfã só roda com grafo real (sem `dist/` avisa "não verificado" em vez de tratar "sem dado" como "sem link"); `links_saindo` continua sendo o plano | `9a6f015` |
| 23 | Domínio exigido antes de construir | `guardiao_construtor.py` tem 4 fases: `construcao` (domínio e e-mail viram aviso), `previa`, `publicacao` (exige `visual_aprovado: sim`, domínio real, e-mail, `tema_pasta`) e `saida`. `entrada` é apelido de `construcao` | `9960476` |
| 20, 21, 22, 24 | Escolha às cegas / referência / 3 tarefas numa resposta | Prévia em `localhost` antes de qualquer servidor; layouts do catálogo em vez de referência externa; 3 marcos com um pedido por vez (`CLAUDE.md › Rotina em marcos`) | `726d857` e anteriores |
| 27 | Sem recuperação de senha | Botão "Esqueci minha senha" gera pedido para colar no Claude Code; skill `painel-senha` + `scripts/painel_redefinir_senha.cjs` redefinem por SSH (não há rota de reset por chave, de propósito) | `a844295` |

Além do relatório: 3 layouts novos (05, 06, 07), catálogo, tela Layout do painel, pilar `/planos`.

## Layouts e o que "tema" significa agora

Duas palavras, dois níveis. Para o usuário, **layout** = o visual. No código, cada layout é uma
**base por nicho** (`base`, `tema-03` … `tema-07`), com coleções e campos próprios; o
`projeto.md` registra `tema_pasta`. Trocar de layout **não** é um campo: reconstrói-se o conteúdo
no esquema do layout novo — barato só até publicar.

| Layout | Nome | Páginas ao promover | Observação |
|---|---|---|---|
| `base` | HealthCare Institucional | 22 | saúde |
| `tema-03` | Vértice Institucional | 22 | serviço profissional |
| `tema-04` | Renovar Serviço Local | 21 | serviço local |
| `tema-05` | Amparo Institucional | 23 | profissão regulamentada; página fixa `direito-previdenciario` |
| `tema-06` | Hidroponto Institucional | 20 | serviço técnico de emergência |
| `tema-07` | Vereda Institucional | 21 | **pilar `/planos`** (coleção continua `servicos`; `rotaPilar: '/planos'` no config) |

Motor de referência completo, sem promoção: **131 páginas** (inclui `/catalogo`).

- **Catálogo:** fonte única em `_astro/src/config/catalogo-layouts.json`. Gera a capa
  `/catalogo` (só no motor de referência; a promoção a remove) e
  `painel/lib/catalogo-layouts.ts` via `python scripts/gerar_catalogo_layouts.py`, que **valida** o
  JSON contra `public/tema*.json` (cores/fontes) e contra `promover_tema.py`. Use `--check` em CI.
- **`scripts/promover_tema.py`:** registro único `TEMAS`. Tema novo entra **só ali** (mais o
  catálogo). Só o que o layout promovido trouxe fica na raiz (o `pages/servicos/` do base é
  resíduo no tema-07). Grava `_astro/tema-ativo.json`, que o painel lê.
- **Origem dos layouts 05/06/07:** zip `Luas Corretora` (superset dos outros três zips). Vieram no
  formato antigo (rotas `[id]`, sem autor/categoria) e foram convertidos ao padrão do tema-03 —
  ponto de rastreio `df93f2f` (importado "como entregue"). Autores e categorias derivam do que os
  posts de demonstração já declaravam; `descricao`/`metaDescription` das categorias são **texto
  de demonstração**, não fato de cliente.

## Fluxo do site Astro em marcos

1. **Marco 1 — aprovar o visual (localhost):** `guardiao ... --fase construcao` →
   `python scripts/preparar_site_local.py --slug <slug> --tema <tema_pasta>` (cria
   `projetos/<slug>/site/_astro`, promove, apaga a demonstração) → substituir o `config/site.ts`
   **campo a campo** → build → `--fase previa` → `npm run preview -- --port 4321` → **um pedido** ao
   usuário. Vitrine dos layouts: `cd _astro && npx astro dev --port 4322` → `/catalogo`.
   Aprovação é uma frase explícita → `visual_aprovado: sim`.
2. **Marco 2 — colocar no ar:** `--fase publicacao` → domínio e e-mail (um por vez) → regera com o
   domínio real → `vps-setup` Parte A → envia `src/` e `public/` → Parte B (DNS, depois SSL, depois
   admin do painel) → `--fase saida`.
3. **Marco 3:** `fase3-conteudo`.

**Risco descoberto:** o `config/site.ts` que sobra da promoção é o de **demonstração** do layout
(empresa, CNPJ, telefone fictícios), e o formato mínimo que a skill antiga mandava gerar não cobria
`faq`, `diferenciais`, `selos`, `numeros`, `passos`, `legal`… O guardião (`previa` e `saida`) agora
reprova se sobrar qualquer valor de demonstração no config do cliente.

## Testes (guardados em `scripts/testes/`)

- `bash scripts/testes/testar_promocao.sh <tema|sem-promocao> <dir_de_build>` — cópia isolada,
  promoção, build real, contagens e vazamento de `/tema-0X` (cabeçalho explica como criar o
  `dir_de_build`). Números esperados no cabeçalho.
- `python scripts/testes/testar_guardiao.py` — 19 cenários das 4 fases do guardião.
- Painel: `tsc --noEmit` + `npm run build` numa cópia com `npm ci`; APIs testadas com `x-api-key`
  e login por sessão contra um site promovido. O efeito no navegador (marcar "Em uso", copiar,
  o botão de "Esqueci minha senha") **não foi visto**.

## Quem é quem

- **Lucas** — LF Soft Soluções, desenvolvedor, fala português, direto e
  técnico. É quem opera: baixa o ZIP, copia os arquivos para a pasta do
  Code e repassa os prompts e as respostas.
- **Jorge Torrez** — dono do produto LinkFlow (agente de automação de
  sites e SEO para pequenos negócios). Cliente de teste real: Torrez
  Desentupidora (`projetos/torrez-desentupidora/`).
- **"Code"** — Claude Code rodando na máquina do Lucas (Windows), com
  `npm`, build real e terminal. Ele **valida**; a sessão de chat **edita**.
  Ele lê direto de `C:\Projetos\linkflow-completo` (não extrai ZIP).

## Fluxo de trabalho (obrigatório)

1. A sessão de chat edita os arquivos, empacota o ZIP e gera o manifesto.
2. A resposta ao Lucas traz, **nesta ordem**:
   - a lista de arquivos da rodada, separada em **NOVOS**, **EDITADOS** e
     **REMOVIDOS**. Os removidos o Lucas apaga à mão, porque extrair o ZIP
     não apaga nada. Se não houver removidos, dá para extrair o ZIP
     inteiro por cima da pasta;
   - o **prompt completo** para o Code, pronto para copiar, **sem
     placeholder** (nunca "[cole aqui a tabela]").
3. O Code sempre começa pelo **Passo 0**:
   `python C:\Projetos\conferir_manifesto.py C:\Projetos\linkflow-completo C:\Projetos\manifesto-md5.txt`.
   O esperado é FALTANDO 0, DIFERENTE 0, e em SOBRANDO só
   `projetos/torrez-desentupidora/projeto.md`. Se der outra coisa, ele para.
4. O Code testa **sempre em cópia isolada** (nunca na pasta real, nem
   `npm install` no painel real) e usa `npm ci`, nunca `npm install`.
5. Todo prompt pede verificação específica, com números esperados (páginas
   no build, URLs no sitemap, conteúdo de arquivo). Nunca "revisa geral".

## Lições operacionais (não repetir)

- **ZIP reaproveitado:** `zip -r` sobre um ZIP existente atualiza e deixa
  arquivos fantasmas. Sempre `rm -f` antes, e conferir a contagem de
  arquivos da pasta contra a do ZIP.
- **`__pycache__`:** o `py_compile` gera essa pasta e ela entra no ZIP.
  Apagar antes de empacotar.
- **Arquivos NOVOS:** quem copia só os "editados" esquece os novos. A lista
  precisa separar os dois, e o manifesto acusa o que faltar.
- **Dessincronia:** o `manifesto-md5.txt` (árvore inteira) mais o
  `conferir_manifesto.py` resolvem. Não comparar arquivo por arquivo à mão.
- **"Rodou sem erro" não basta:** cada rodada revelou bug real só no build
  do Code ou em teste programático. Testar o comportamento, não só a sintaxe.
- **Sem npm no chat:** o registry costuma estar bloqueado no ambiente da
  sessão de chat. O build e o `npm ci` são sempre do Code. No chat dá para
  checar sintaxe (há um TypeScript local em alguns ambientes), rodar
  Python e testar módulos `.ts` com `node --experimental-strip-types`.
- **YAML:** data sem aspas (`2026-09-25`) vira objeto Date. O painel já grava
  entre aspas, e o schema aceita as duas formas, mas qualquer gerador novo
  de frontmatter precisa pôr aspas.
- **Python do VPS:** a versão não é garantida (vem do `apt`). Não usar
  recursos do 3.9+ (`removeprefix`, `write_text(newline=)`).

## O produto, em uma frase

SiteFlow é um CMS (painel Next.js) + motor de site (Astro) + agente de
automação (skills do LinkFlow). O agente faz onboarding, constrói o site,
publica conteúdo e faz o deploy em VPS.

## Arquitetura (estado real)

**Cada cliente tem uma cópia ISOLADA do motor Astro**, criada por
`scripts/vps/novo-cliente.sh` em `/opt/linkflow/clientes/[slug]/_astro/`, a
partir do motor de referência `/opt/linkflow/_astro`. O motor de referência
nunca é editado nem servido.

**Temas = base por nicho** (`base`, `tema-03`, `tema-04`), com estrutura e
campos diferentes. A escolha é **definitiva**, feita uma vez no onboarding.
`scripts/promover_tema.py` move o tema para a raiz da cópia do cliente e
apaga os outros. Ele trata a coleção nova pela lista `COLECOES`
(servicos, equipe, depoimentos, posts, autores, categorias) e as páginas do tema base
pela lista `NOMES_BASE_LEGITIMOS`. **Coleção ou página nova precisa entrar
nessas listas**, senão a promoção apaga como resíduo. O painel **não** troca
tema: a tela "Tema" é só informativa.

**Caminhos canônicos pós-promoção:** `_astro/src/config/site.ts` e
`_astro/src/content/<colecao>/`. Nunca por slug de cliente.

**URL plana (regra do Jorge), sem categoria no caminho:**

| Página | URL |
|---|---|
| Home | `/` |
| Blog (índice) | `/blog` |
| Artigo | `/<slug>` |
| Serviços (pilar) | `/servicos` |
| Serviço interno | `/<slug>` |
| Categoria | `/<slug>`; o artigo continua `/<slug>`, sem categoria no caminho |
| Autor | `/autor/<slug>` |

Rota unificada em `pages/[slug].astro`. Prioridade em caso de slug repetido
(decidida): página fixa > serviço > categoria > artigo — implementada e
testada (build ignora o perdedor e avisa no log; `guardiao_construtor.py`
bloqueia a colisão antes de reportar "pronto").

**Painel:** a única fonte de URL pública é `painel/lib/urls-publicas.ts`
(espelha as rotas do site). Não existe mais mock: `painel/mock/` só tem
`types.ts`, e o store carrega tudo das APIs (lista vazia se a API falhar).

## Concluído e validado pelo Code (build real)

1. Promoção de tema nos 3 cenários (imports, `public/`, CRLF, `noindex`).
2. Páginas legais nos 3 temas, com **Termos obrigatório** (decisão do Jorge).
   O `ConteudoLegal` tem 9 seções na política e 7 nos termos, igual ao
   `guardiao_institucionais` (6/6 PASS). Dados em `site.legal` e
   `site.legal.termos` (`naoSubstitui`, `foro`, `vigenciaDesde`).
3. **Sitemap dinâmico:** `_astro/integracoes/sitemap-canonico.mjs`, que roda
   depois do build e lê as canonicals do `dist/`, sem as `noindex`. Não
   existe `public/sitemap.xml`. O `guardiao_construtor` confere domínio, URL
   plana e presença da home.
4. **Rascunho não vai ao ar:** `_astro/src/lib/publicacao.ts` exclui
   rascunho, revisão, agendado e lixeira. O painel usa a mesma regra em
   `painel/lib/status-post.ts`. Status ausente ou `pronto` = publicado.
   Rascunho pode não ter `metaDescription`; publicado exige 80–165.
5. **Botão Publicar do painel:** copia `dist/` inteiro, valida antes de
   apagar e preserva `midia/` e `_redirects`.
6. **URL plana no painel:** JSON-LD, llms.txt, robots, sitemap do painel,
   busca e `/api/paginas` (classifica pelo conteúdo, não pela URL).
   `/api/config` devolve `dominioHost` sem protocolo.
7. **Mocks removidos:** dashboard com saúde real (`/api/stats`),
   integrações pelo config real, sem textos de psicologia.
8. **Frontmatter do painel:** `lib/frontmatter-post.ts` traduz os campos do
   painel para os nomes do site. `lib/fs.ts` grava com aspas quando precisa,
   e o PATCH é cirúrgico (preserva listas e comentários).
9. **Lockfile do painel regenerado.** O deploy usa `npm ci` e copia o
   `package-lock.json` para a pasta do cliente.
10. **R0 — 3 bugs da rodada de autor, corrigidos e validados (19/19/19):**
    `PostLista.astro` agora mostra `{autor} · {data}` nas 3 variantes (antes
    só a data, em `/blog` e na home); `Tema04Base.astro` corrigido pra
    apontar `<link rel="sitemap">` pro `/sitemap.xml` real; `emailLogin` em
    `api/usuarios` só é exigido quando `podeAcessar: true` (autor que só
    assina não precisa de e-mail de login).
11. **R1 — Página de categoria `/<slug>` nos 3 temas**, ver resumo no
    histórico de rodadas abaixo.
12. **R2 — Privacidade do painel ligada ao `site.legal`**, ver resumo no
    histórico de rodadas abaixo.
13. **R3 — `robots.txt`/`llms.txt` desde o primeiro build**, ver resumo no
    histórico de rodadas abaixo.
14. **R4 — Varredura pós-implementação**, ver detalhe abaixo.

## R6 — Fechamento (25/09/2026)

**R5 (teste de ponta a ponta no VPS de teste) foi pulada a pedido do
Lucas** — não por falha, nem por bloqueio técnico. Perguntei explicitamente
via confirmação antes de tocar no VPS (regra "Quando parar e perguntar") e
a resposta foi "não, pular a R5 por agora". Fica como pendência única,
pronta pra rodar quando for autorizada — nada no código depende dela pra
R0-R4 estarem corretas: cada uma foi validada por build real isolado, não
pelo teste de VPS.

**Estado final do repositório:** git limpo, working tree sem pendência,
5 commits desde o início do fluxo de sessão única (`bc70a98` rodada de
autor → `85ed0c1` R4), nada não commitado.

**Resumo do que ficou pronto (R0-R4), todos com build real + commit:**

| Rodada | Entrega | Validação |
|---|---|---|
| R0 | 3 bugs corrigidos: autor sumido nos cards de post, link de sitemap morto no tema-04, e-mail de login exigido indevidamente | build 19/19/19, HTML conferido |
| R1 | Página de categoria `/<slug>` nos 3 temas + sincronização no painel | build 22/22/21, JSON-LD, colisão de slug testada |
| R2 | Telas Privacidade do painel gravam de verdade em `site.legal` (antes só estado local, não persistia) | `tsc`+build painel OK, PATCH→build site→HTML conferido campo a campo |
| R3 | `robots.txt`/`llms.txt` nascem no primeiro build, antes do painel existir | 2 cenários testados (ausente/customizado) |
| R4 | Varredura: achou e corrigiu regressão da R2 (`naoSubstitui` sendo sobrescrito) + resíduo em `site-publicar` (`imagemHero`→`imagemCapa`) + checagem nova de autor/categoria órfão no guardião | build 22/22/21 sem mudança de contagem, `tsc`+build painel OK |

**Pendência única: R5 — teste de ponta a ponta no VPS de teste**
(`[IP-REMOVIDO]`, `LINKFLOW_DIR: /opt/linkflow-teste`,
`LINKFLOW_SLUG: torrez-desentupidora`). Critério de "concluído": Torrez
criada do zero pelo fluxo do agente (`novo-cliente.sh` → promoção → build
do site e do painel), site e painel no ar, publicando um post pelo painel
sem intervenção manual. **Precisa de autorização explícita do Lucas antes
de qualquer ação no VPS** — nenhuma ação de VPS foi tomada até aqui.

## Última rodada: R4 concluída e validada (build real)

**Varredura do que não tinha sido auditado ainda — achou 2 bugs reais,
não só "nada encontrado":**

1. **Regressão da R2, achada ao reler `fase3-conteudo`:** a skill documenta
   que o agente escreve `site.legal.termos.naoSubstitui` com texto
   ESPECÍFICO DO NICHO do cliente (ex: "não substitui consulta médica" vs
   "não substitui aconselhamento jurídico") durante a Fase 3 — mas o
   `gerarBlocoLegal()` da R2 sempre sobrescrevia esse campo com uma frase
   genérica fixa, toda vez que qualquer uma das 3 telas Privacidade fosse
   salva. Ou seja: cliente astro com painel ativo perderia o texto do
   nicho na primeira edição de QUALQUER campo legal, mesmo um não
   relacionado (ex: só mudar o foro já apagava o texto médico/jurídico
   específico). Corrigido: `LegalPainel` ganhou o campo `naoSubstitui`
   (editável agora na tela Termos, textarea nova); se a tela não tem
   valor, o gerador preserva o que já existe no `config/site.ts` em vez
   de inventar texto genérico — nunca inventar é a regra de sempre.
   Testado com build real: `PATCH` só de `foroCidade`/`foroUf` (sem tocar
   em `naoSubstitui`) preservou o texto médico original palavra por
   palavra.
2. **Resíduo em `site-publicar`:** o Passo 2.1 (extração do frontmatter do
   gerador WordPress) mandava mapear `coverImage → imagemHero`, mas o
   campo real do schema `posts` é `imagemCapa` — `imagemHero` nem existe
   na coleção, o Zod removeria o campo em silêncio (mesma classe de bug
   que já quebrou o build antes, por isso a própria skill já tinha a
   regra "nunca `imagemHero`" mais adiante, sem que a etapa 2.1 seguisse
   essa regra). Corrigido: a etapa de extração agora já usa os nomes
   finais do schema (`metaDescription`, `imagemCapa`), nunca um nome
   intermediário que discorda da regra declarada na mesma skill.
3. **Checagem nova no `guardiao_construtor.py`:** post com `autor:` ou
   `categoria:` que não existe em `content/autores/`/`content/categorias/`
   agora gera aviso (não bloqueia — o site já suporta autor/categoria
   fora da coleção, mostrando sem link) na saída da Fase 3.
4. **Áreas conferidas e já corretas, sem achado:** `site-atualizar`
   (sincroniza `_astro/src/` inteiro via rsync, não hardcoda nome de
   campo — robusta a mudança de schema por design); menus/formulários/
   leads do painel (já usam `/api/menus`, `/api/formularios`, `/api/leads`
   reais, não mock — confirma o item 7 do "Concluído"); caminho WordPress
   (`blog-publicar` não referencia nomes de campo do schema Astro —
   arquiteturalmente isolado, baixo risco).

Build real: 22/22/21 páginas nos 3 temas (sem mudança de contagem — só
correção de bug). `tsc --noEmit` e `npm run build` do painel sem erro.
`py_compile` no `guardiao_construtor.py` limpo.

## Rodada R3 (concluída antes da R4)

**`robots.txt`/`llms.txt` desde o primeiro build.**

**`robots.txt` e `llms.txt` agora nascem automaticamente no primeiro
build**, antes de qualquer edição no painel — o guardião exigia os dois,
mas só o painel os criava (cliente ficava sem eles até logar e salvar a
tela).

- `_astro/integracoes/sitemap-canonico.mjs` (o mesmo hook `astro:build:done`
  que já gera o `sitemap.xml`) agora também gera `dist/robots.txt` e
  `dist/llms.txt` básicos, com o domínio real (lido dos mesmos canonicals
  do sitemap) e a linha `Sitemap:` — **só quando o arquivo ainda não
  existe**. Não precisou de config nova: o Astro já copia `public/` pra
  `dist/` antes desse hook rodar, então `existsSync(dist/robots.txt)` já
  diz sozinho se veio de `public/` (painel salvou um customizado — esse
  prevalece) ou se o site nunca teve um (gera o básico).
- `scripts/guardiao_construtor.py`: a checagem de `robots.txt`/`llms.txt`
  saiu de `_astro/public/` (que agora pode legitimamente estar vazio) e
  passou a conferir o **site publicado** (`/var/www/[slug]/`), igual ao
  que já fazia com o `sitemap.xml`.

Testado com build real, 2 cenários (`public/robots.txt` ausente vs.
presente): ausente → `robots.txt`/`llms.txt` gerados com o domínio real e
`Sitemap:` correto; presente (customizado) → preservado, nada sobrescrito.
Lógica do guardião testada isoladamente para os casos site-publicado
completo (0 erros) e site-publicado vazio (erro em `robots.txt`, aviso em
`llms.txt`). `py_compile` e `node --check` limpos.

## Rodada R2 (concluída antes da R3)

**As 3 telas Privacidade (Política, Termos, Cookies) agora gravam de
verdade no `site.legal` que o site publica** — antes eram só estado local
do React, nunca chegavam a lugar nenhum (nem no `config/site.ts`, nem
persistido entre sessões).

- `dados/legal.json` (via `lib/dados.ts`, mesmo padrão de leads/formulários)
  é a fonte de verdade da UI — as 3 telas leem/gravam nele. `config/site.ts`'s
  `legal: {...}` passou a ser um **artefato gerado**: `painel/lib/legal.ts`
  (`gerarBlocoLegal`) monta o bloco inteiro a cada `PATCH /api/config` com
  `legalPainel`, e o bloco é substituído por inteiro (contagem de chaves,
  não regex guloso — evita parar na primeira `}` errada dentro dos arrays).
- Decisões de produto confirmadas com o Lucas antes de implementar
  (mapeamento não era 1:1, teria feito documento legal errado se eu
  adivinhasse):
  - `legal.cookies[]` é sintetizado das telas Política (base legal +
    retenção por categoria) e Cookies (texto de finalidade por categoria).
  - `legal.transferenciaInternacional` (frase completa no schema do site) é
    gerada a partir do toggle + campo "países/empresas" da tela Política.
  - `legal.termos.foro` (`{cidade, uf}`) — a tela Termos trocou o campo
    livre "jurisdição" por 2 campos (`foroCidade`/`foroUf`), 1:1 com o schema.
  - Datas (`atualizadaEm`, `vigenciaDesde`) viraram `<input type="date">`
    nas 2 telas — garante ISO (`yyyy-mm-dd`) sem parser frágil de "DD/MM/AAAA".
- `formularios[]` do documento vem de `dados/formularios.json` de verdade
  (lido no servidor a cada PATCH), nunca inventado nem editado na tela.
- `controlador.razaoSocial` vem de `site.nome` (a tela já tratava esse
  campo como espelho readonly do nome do site — não criei campo novo).
- Nenhum campo vazio vira texto inventado — igual ao resto do `site.legal`,
  campo vazio bloqueia a publicação (regra já existente do `ConteudoLegal`).
- Botão "Salvar" novo nas telas Política e Termos (não existia — só a tela
  Cookies tinha, e só salvava local). As 3 agora persistem no servidor.

Build real: `tsc --noEmit` e `npm run build` do painel sem erro. Teste
fim-a-fim: `PATCH /api/config` com dados reais de teste (CNPJ, endereço,
foro, versão, transferência internacional, textos de cookie) → conferido
o `config/site.ts` regenerado campo a campo → `npm run build` do site →
HTML de `/politica-de-privacidade` e `/termos-de-uso` conferido com os
dados novos (CNPJ, endereço, versão, foro cidade/UF, finalidade e base
legal de cada cookie), sem "Publicação bloqueada", com `exemplo: true`
preservado.

## Rodada R1 (concluída antes da R2)

**Página de categoria `/<slug>` nos 3 temas.**

**Página de categoria `/<slug>` nos 3 temas**, mesmo padrão da rodada de autor:
- Coleção `categorias` (+T3/T4): `nome`, `descricao`, `seoTitle`,
  `metaDescription`, `imagem`, `ordem`, `gerenciadoPor`. Post referencia
  pelo slug em `categoria:`; `_astro/src/lib/categorias.ts` resolve (aceita
  nome como reserva, para posts antigos) e limita a página aos 12 artigos
  mais recentes, sem paginação (decisão do Jorge).
- Posts de exemplo dos 3 temas convertidos pra slug; categorias criadas a
  partir dos nomes que eles já usavam (ex: base → `prevencao`,
  `endocrinologia`, `saude-mental`).
- Rota em `pages/[slug].astro` (raiz, junto com serviço e artigo — nunca
  `/categoria/<slug>`), com prioridade página fixa > serviço > categoria >
  artigo e aviso no log em toda colisão. Componente
  `CategoriaDetalhe(T3/T4).astro`: cabeçalho, artigos, link `/blog`. Sem
  artigo publicado, sai `noindex`. JSON-LD `CollectionPage` + `ItemList` +
  breadcrumb (Home › Blog › Categoria).
- Artigo: selo de categoria virou link pra página dela; breadcrumb do
  artigo continua Home › Blog › Artigo (decisão do Jorge — a categoria não
  entra no breadcrumb do artigo, só o selo linka).
- Painel: `lib/sync-categorias.ts` (chamado no POST/PATCH/DELETE de
  `/api/categorias`, mesmo padrão de `sync-autores.ts`), `urlCategoria()`
  em `urls-publicas.ts`, botão "Ver" na tela de categoria, categoria de
  volta no `llms.txt`/`indexaveis`/dados estruturados
  (`gerarGraphCategoria`), e POST/PATCH de posts convertendo
  `categoriaId` ↔ slug.
- Colisão de slug: `guardiao_construtor.py` bloqueia colisão entre
  serviço/post/categoria/página fixa na saída; o painel avisa (não
  bloqueia) ao salvar categoria com slug colidindo
  (`avisoColisaoSlug` em `sync-categorias.ts`).
- `scripts/vps/novo-cliente.sh` limpa `content/categorias/` no cliente novo.
- Skill `site-publicar` atualizada: `categoria:` agora é o slug de um
  arquivo existente em `content/categorias/`, com a mesma regra de "criar
  se não existir" que já valia pro autor. **`fase3-conteudo` não foi
  tocada** — ela não gera posts de blog (isso é `site-publicar`), não tem
  nenhuma referência a `categoria:` no frontmatter, então a instrução de
  atualizá-la não se aplicava.
- Bug encontrado e corrigido durante a implementação: `const RESERVADOS`
  declarado no escopo do módulo de `[slug].astro`, fora de
  `getStaticPaths`, quebrava o build com `"RESERVADOS is not defined"` — o
  Astro isola `getStaticPaths` num chunk próprio de pré-renderização e não
  inclui `const` do escopo do módulo declarada fora da função. Movido pra
  dentro da função nos 3 temas.

Build real: **22/22/21** páginas e URLs no sitemap (base/tema-03/tema-04 —
19 da rodada de autor + 3/3/2 categorias novas). Testado com build real:
categoria com artigo (indexável, JSON-LD, selo linkando), categoria vazia
(`noindex`), colisão de slug categoria×serviço (serviço vence, aviso no
log, build não quebra), criação/edição de categoria e post pelo painel com
sincronização e round-trip `categoriaId`↔slug confirmados. `tsc --noEmit`
e `npm run build` do painel sem erro.

## Rodada de autor (concluída antes da R0)

**Páginas de autor `/autor/<slug>` nos 3 temas.**
Resumo:
- Coleção `autores` (+T3/T4). O post referencia o autor pelo slug. O helper
  `_astro/src/lib/autores.ts` resolve o autor (aceita nome, para posts
  antigos) e separa "Seleção do autor" (3) de "Últimos artigos" (7).
- Bloco `components/blocos/PerfilAutor.astro` + `pages/autor/[slug].astro`
  (e as versões `tema-03/`, `tema-04/`). JSON-LD `ProfilePage` + `Person`.
  Autor sem artigo sai `noindex`.
- Artigos ligam ao perfil. O tema base ganhou JSON-LD `BlogPosting`.
- Painel: `lib/sync-autores.ts`, chamado em `salvarUsuarios()`, grava
  `content/autores/<slug>.md` com `gerenciadoPor: painel`. Converte o id do
  usuário (painel) para o slug (site) nas rotas de posts.
- Bugs corrigidos nesta rodada: posts do tema-03/04 exigiam
  `autorCargo`/`autorBio`; as skills `site-publicar` e `fase2-site-astro`
  gravavam `descricao` em vez de `metaDescription`, o que quebrava o build.
- Números esperados no build: **19 / 19 / 19** páginas (base, tema-03, tema-04).

## Pendências, em ordem

1. **R5 — teste de ponta a ponta na VPS de teste** (pulada a pedido do Lucas em 25/09/2026, não por
   falha). Agora precisa cobrir também: o instalador novo (`setup.sh`, `novo-cliente.sh`,
   `ssl-cliente.sh`, escolha de porta), a cópia com `tar` (sem `node_modules`), e o fluxo em
   marcos até o painel entregue. **Pedir autorização ao Lucas antes de tocar no VPS.**
2. **Relatório QA do painel** (`relatorios/Relatorio_QA_Painel_SiteFlow.pdf`) — só depois do 3.
4. Limites conhecidos, ainda sem correção:
   - `hashtags`/`buscasFrequentes` dos configs apontam direto para slugs de post e de serviço; se o
     post virar rascunho, o link fica morto (vale para o tema-03 também).
   - `public/tema-0X.json` ainda descreve as rotas antigas (`/tema-0X/servicos/[id]`); só informativo.
   - Tela Layout do painel: o efeito no navegador não foi exercitado.
   - Login do painel é renderizado só no cliente (já era assim antes desta rodada).

## VPS de teste

`[IP-REMOVIDO]`, porta `22022`, `LINKFLOW_DIR: /opt/linkflow-teste`,
`LINKFLOW_SLUG: torrez-desentupidora`.
