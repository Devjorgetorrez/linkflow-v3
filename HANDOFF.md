# Handoff — SiteFlow CMS / LinkFlow (Jorge Torrez) — v5 (27/09/2026, Plano de Correção de QA do Painel)

> **Modelo de trabalho:** uma única sessão do Claude Code edita a pasta real
> (`D:\LFSoft\Mentoria\linkflow-completo`, repositório git local), valida em
> cópia isolada (nunca roda `npm ci`/build na pasta real) e faz commit por
> rodada de correção. Não existe mais o modelo antigo de duas sessões
> (chat edita / Code valida por ZIP) — encerrado desde a rodada R0
> (25/09/2026). Este documento é o que faz uma sessão nova (ou a mesma,
> depois de perder contexto) saber o que já foi feito. Cole-o inteiro numa
> conversa nova apontando a working directory para
> `D:\LFSoft\Mentoria\linkflow-completo` e rode `git log --oneline` /
> `git status` logo de cara para confirmar que a pasta bate com o descrito
> aqui.

## Estado atual em uma tela (27/09/2026)

- **O plano de correção de QA do painel** (`relatorios/Plano-Correcao-QA-Painel.md`,
  a partir de `relatorios/Relatorio_QA_Painel_SiteFlow.pdf`, 87 defeitos) está
  **concluído nas 7 fases (0 a 6)**. Ver seção própria abaixo — é o trabalho
  mais recente e o mais extenso desta sessão.
- **Git limpo**, working tree sem pendência, tudo commitado (`git log --oneline`
  mostra a sequência completa desde `bc70a98`, que fecha o Relatório de
  Testes 3 — anterior ao plano de QA).
- **R5 — teste de ponta a ponta no VPS de teste: CONCLUÍDO em 27/09/2026**,
  com autorização explícita do Lucas. Ver seção própria abaixo (achou e
  corrigiu 3 bugs reais do instalador/motor).
- **Suíte Playwright: criada e verde em 27/09/2026** (`painel/tests/`,
  42 specs, `npx playwright test`) — cobre login/rate-limit, posts,
  serviços, mídia, usuários, aparência, leads, privacidade e um smoke test
  de navegação por todo o menu. Achou e levou à correção de um bug real do
  produto (`politicaPublicada` morto em `privacidade/cookies`, ver
  "Pendências, em ordem"). Ver seção própria "Suíte Playwright" abaixo
  para como rodar e a pegadinha do servidor de teste que precisou de
  restart.
- **Regra nova nas skills de deploy (27/09/2026):** o Lucas relatou que,
  durante o R5, o agente parou no meio de um passo de VPS dizendo que
  estava "esperando resposta" — e só retomou depois de uma mensagem
  extra perguntando "terminou?". Isso não pode acontecer com o usuário
  final (nem com publicação agendada, onde não existe ninguém pra
  reperguntar). Causa mais provável: nenhuma das skills de deploy dizia
  como rodar os comandos SSH longos (bootstrap 5–15 min, `npm ci`/`npm run
  build` no servidor) — sem instrução, um comando em primeiro plano corre
  risco de estourar o tempo-limite padrão da ferramenta antes do processo
  remoto terminar. Adicionada regra explícita em `vps-setup/SKILL.md`
  ("Regra: comando longo nunca vira espera do usuário") e referenciada em
  `fase2-site-astro`, `site-atualizar` e `site-publicar`: rodar em
  background, nunca dizer que está "esperando resposta" por um comando
  (só por uma decisão real do usuário), e retomar sozinho quando o
  comando terminar. **Não testado de ponta a ponta nesta sessão** (exige
  rodar o bootstrap completo de novo num VPS) — só a instrução foi
  corrigida; validar no próximo deploy real.
- **Pendência real, em aberto:** lista curta de lacunas conhecidas, sem
  correção — ver "Pendências, em ordem".
- `relatorios/` e `templates-layout-temas/` continuam no `.gitignore`.

## Quem é quem

- **Lucas** — LF Soft Soluções, desenvolvedor, fala português, direto e
  técnico. Testa o painel manualmente (localhost) a cada rodada e reporta
  defeitos com prints reais.
- **Jorge Torrez** — dono do produto LinkFlow. Cliente de teste real no VPS:
  Torrez Desentupidora (`projetos/torrez-desentupidora/`).
- **Claude Code** — roda na máquina do Lucas (Windows), com `npm`, build
  real e terminal. Edita a pasta real, valida em cópia isolada.

## O produto, em uma frase

SiteFlow é um CMS (painel Next.js) + motor de site (Astro) + agente de
automação (skills do LinkFlow). O agente faz onboarding, constrói o site,
publica conteúdo e faz o deploy em VPS — e, desde o plano de QA, o painel
também é um editor real de boa parte do conteúdo (posts, serviços, título e
meta das páginas fixas), não só um painel de leitura.

## Arquitetura (estado real)

**Cada cliente tem uma cópia ISOLADA do motor Astro**, criada por
`scripts/vps/novo-cliente.sh` em `/opt/linkflow/clientes/[slug]/_astro/`, a
partir do motor de referência `/opt/linkflow/_astro`. O motor de referência
nunca é editado nem servido. A mídia do cliente fica em
`/opt/linkflow/clientes/[slug]/midia/` (fora da raiz do site, servida pelo
Nginx via `location ^~ /midia/`) — ver Fase 4 abaixo.

**Temas = base por nicho** (`base`, `tema-03`…`tema-07`), com estrutura e
campos diferentes. A escolha é **definitiva**, feita uma vez no onboarding.
`scripts/promover_tema.py` move o tema para a raiz da cópia do cliente e
apaga os outros; registro único `TEMAS`. Tema novo entra **só ali** (mais o
catálogo). O painel **não** troca tema: a tela "Layout" é só informativa
(mostra o catálogo com demonstrações navegáveis).

**Caminhos canônicos pós-promoção:** `_astro/src/config/site.ts` e
`_astro/src/content/<colecao>/`. Nunca por slug de cliente.

**URL plana (regra do Jorge), sem categoria no caminho:**

| Página | URL |
|---|---|
| Home | `/` |
| Blog (índice) | `/blog` |
| Artigo | `/<slug>` |
| Serviços (pilar) | `/servicos` (`/planos` no tema-07) |
| Serviço interno | `/<slug>` |
| Categoria | `/<slug>` |
| Autor | `/autor/<slug>` |
| Página-guia (só 4 dos 6 temas — ver Fase 6) | `/<slug-do-tema>` |

Rota unificada em `pages/[slug].astro`. Prioridade em colisão: página fixa >
serviço > categoria > artigo.

**Painel:** a única fonte de URL pública é `painel/lib/urls-publicas.ts`.
Não existe mock — `painel/mock/` só tem `types.ts`. Tudo vem das APIs, que
por sua vez leem o `site.ts`/`content/` reais do cliente e, desde a Fase 5,
o **HTML publicado de verdade** quando é o caso (SEO, Páginas).

## Layouts e o que "tema" significa agora

**Layout** (usuário) = o visual. **Tema** (código) = uma base por nicho
(`base`, `tema-03`…`tema-07`), com coleções e campos próprios; o
`projeto.md` registra `tema_pasta`. Trocar de layout reconstrói o conteúdo
no esquema do layout novo — não é um campo.

| Layout | Nome | Páginas ao promover | Observação |
|---|---|---|---|
| `base` | HealthCare Institucional | 22 | saúde |
| `tema-03` | Vértice Institucional | 22 | serviço profissional; página-guia `contabilidade-consultiva` |
| `tema-04` | Renovar Serviço Local | 21 | serviço local; página-guia `higienizacao-de-estofados` |
| `tema-05` | Amparo Institucional | 23 | profissão regulamentada; página-guia `direito-previdenciario` |
| `tema-06` | Hidroponto Institucional | 20 | serviço técnico de emergência; sem página-guia |
| `tema-07` | Vereda Institucional | 21 | **pilar `/planos`**; página-guia `como-escolher-plano-de-saude` |

Motor de referência completo, sem promoção: **131 páginas** (inclui `/catalogo`).

## Fluxo do site Astro em marcos

1. **Marco 1 — aprovar o visual (localhost):** `guardiao ... --fase
   construcao` → `preparar_site_local.py` → substituir `config/site.ts`
   campo a campo → build → `--fase previa` → prévia em `localhost:4321`
   (`npm run dev`, não `preview` — o dev server serve `/midia/` local, o
   preview não). Vitrine de layouts em `localhost:4322/catalogo`. Aprovação
   é uma frase explícita → `visual_aprovado: sim`.
2. **Marco 2 — colocar no ar:** `--fase publicacao` (exige `painelUrl`
   válido no config, desde a Fase 3 — sem isso o formulário do site não
   envia nada) → domínio e e-mail (um por vez) → `vps-setup` Parte A → envia
   `src/`/`public/` → Parte B (DNS, SSL, admin do painel) → `--fase saida`.
3. **Marco 3:** `fase3-conteudo`, mais o painel para correções pontuais
   (posts, serviços, título/meta das páginas fixas — ver Fase 6).

**Atenção para o próximo cliente publicado num servidor já em produção:**
o bloco Nginx `location /midia/` de clientes criados **antes** da Fase 4
não tem o `^~` (prefixo com prioridade sobre a regra de extensão) — PDF e
vídeo davam 404, e imagem caía no root do site. Precisa atualizar à mão o
bloco desses clientes. `torrez-desentupidora` (VPS de teste) já foi
recriado do zero pelo `novo-cliente.sh` atual no R5 (27/09/2026) e já nasceu
certo; `clinica-sorriso-vivo-jundiai`, criado antes, **ainda não foi
conferido/corrigido** — não foi tocado no R5 por decisão do Lucas.

---

## Plano de correção de QA do painel (Fases 0–6) — concluído

Ponto de partida: `relatorios/Relatorio_QA_Painel_SiteFlow.pdf` (87
defeitos) e o plano derivado dele, `relatorios/Plano-Correcao-QA-Painel.md`
(ambos gitignored). Sete fases, cada uma com commit(s) próprio(s) e build
real de validação. Nenhuma fase alterou o VPS.

### Fase 0 — Contenção rápida
17 correções pontuais e independentes: `LINKFLOW_DIR` sem default perigoso,
reabrir post sem perder dado, login com autofill, flyout do menu, mídia
(miniatura, `.meta.json`, prévia), formulário vazio, URLs, validação de
CNPJ, home/intenção transacional, legendas únicas, agrupamento da
auditoria. Commits `29830dc`, `392c85b`, `da6ad7d`.

### Fase 1 — Não destruir dado nem abrir brecha (segurança e integridade)
- **1.1 / 1.1b** — módulo único de leitura/escrita de `config/site.ts`
  (`painel/lib/site-config.ts`, scanner por caminho, preserva comentários e
  campos não tocados); telas de Contato/Identidade/Redes/Integrações
  gravando de verdade; campos restaurados (identidade, mídia, schema,
  horários) que uma rodada anterior tinha removido por engano — **nunca
  remover campo que "não estava salvando", repor com backing real** (regra
  aprendida aqui). Motor: identidade/contato guiados 100% por config
  (JSON-LD, logo, favicon, OG, credencial).
- **Cobertura duplicada:** `areaAtendimento` virou fonte única de cidade
  atendida em todas as páginas dos 6 layouts (antes cada layout tinha a
  própria lista `regioes`/`cidades`); guardião avisa se sobrar lista
  divergente.
- **1.2** — as 3 telas de Privacidade (Política, Termos, Cookies) editam o
  bloco `legal:` real **campo a campo**, nunca mais regeneram o bloco
  inteiro (perderia texto do nicho escrito pelo agente na Fase 3). Cookies
  analíticos/marketing só entram se a integração (GA/GTM/Pixel) existe de
  verdade no site — `integracoesAtivas()` em `painel/lib/legal-site.ts` é a
  fonte única disso, reusada depois no motor (Fase 6) e no SEO.
- **1.3** — usuários e autorização por papel: criar só ao clicar em "Criar
  usuário" (antes criava rascunho ao abrir a tela); trava do último
  administrador; senha atual exigida para trocar a própria senha; sessão
  revalidada a cada requisição; limite de 5 tentativas de login por 15 min;
  matriz completa rota × papel (43 rotas).
- **A03 (nível de página):** decisão do Jorge esclareceu que o "sem link
  interno" acusado no teste real era o painel usando o grafo de links
  planejado (que não via menu/rodapé/silo), não falta de link de verdade.
  Corrigido: nível = **cliques reais a partir da home**, pelo grafo real de
  links do HTML publicado (`painel/lib/links-internos.ts`).

### Fase 2 — Ciclo de post e publicação
A maior rodada de idas e vindas com feedback do Lucas. Resultado final:
- **Criar/editar post:** nasce já válido (título provisório, rascunho, data,
  autor); slug acompanha o título **só enquanto o post não é publicado**
  (depois de publicado, mudar o slug é manual — padrão de mercado, evita
  redirect a cada edição); renomear slug de post publicado **reescreve os
  links internos** que apontavam para ele (relacionados, corpo de outros
  posts/serviços, menu) e cria 301 automático, sem cadeia.
- **Lixeira real**, fora de `content/`, com restaurar/excluir definitivo;
  mover para a lixeira avisa antes se outro conteúdo referencia o post, e
  limpa a referência em "relacionados" dos outros.
- **Editor:** todos os campos que a tela mostra persistem de verdade
  (seoTitle, resumo, capa+alt, canonical, noindex, FAQ — campos novos que o
  motor Astro passou a aceitar nos 6 layouts, com título/canonical/robots/
  FAQPage/card reais); Markdown (posts escritos por skill) é convertido para
  o formato do editor ao abrir, sem estragar a estrutura; título é campo
  próprio, separado do corpo; autor gravado sempre pelo **slug**, nunca id
  de usuário (a lista mostra nome, não UUID).
- **Posts relacionados** (automático por categoria ou escolha manual, até
  3) e **conteúdo pilar** (link da post para a página de serviço que ele
  apoia, com `isPartOf` no JSON-LD) — persistência ponta a ponta.
- **Build/Publicar:** estado real em arquivo (nunca publicado / rodando /
  ok / erro, com log completo e timeout de 5 min, sem dois builds
  simultâneos); valida todos os posts contra o schema **antes** de buildar
  — post inválido bloqueia sem tocar no site no ar; botão do topo virou
  "Atualizar o site (N)", desabilitado sem pendência; contador de
  pendências calculado no servidor (mtime de conteúdo vs. último build ok),
  sobrevive a F5.

### Fase 3 — Formulário de contato e leads
- Site: script único de envio (validação, honeypot, UTM, estado
  "Enviando…"), botão WhatsApp flutuante + "Continuar no WhatsApp" após
  enviar, caixa de consentimento LGPD (exigida no formulário "contato"
  padrão). Sem `painelUrl` configurado, o formulário avisa que ainda não
  publica em vez de fingir sucesso.
- Painel: `/api/submissao` com CORS restrito à origem do site, rate limit
  por IP confiável (último item de `X-Forwarded-For`, não confia em
  cabeçalho arbitrário), validação real; formulário "contato" semeado
  sozinho se não existir; editor de formulários salva de verdade; tela de
  Leads com dados reais, status, filtros, CSV, atualização automática a
  cada 20 s (sem precisar de F5).

### Fase 4 — Mídia
- Mídia grava em `$LINKFLOW_DIR/midia` (não mais `/var/www/<slug>/midia`);
  upload por biblioteca inteira (arrastar em qualquer lugar da tela, não só
  numa faixa), validação por conteúdo real do arquivo (magic bytes), nunca
  SVG, sem sobrescrever, detecta duplicata; Excluir funciona (single e em
  massa); **Substituir arquivo** troca o conteúdo mantendo o mesmo endereço
  (atualiza todos os usos de uma vez, só aceita o mesmo tipo).
- Metadados reais (quem enviou, quando), miniaturas sob demanda (`sharp`,
  com fallback se não disponível), "usado em" calculado de verdade.
- Infra: Nginx corrigido (`location ^~ /midia/` tem prioridade sobre a
  regra de extensão — PDF/MP4/imagem paravam de dar 404), migração
  automática da mídia legada, prévia local (`astro dev`) serve `/midia/`.

### Fase 5 — Informação verdadeira em SEO e Páginas
Painel deixou de inventar/inferir dado de SEO: `/api/paginas` lê o HTML
**publicado de verdade** (title completo sem cortar, meta robots real,
canonical, todos os blocos JSON-LD, H1, palavras, imagens sem alt) — cai na
última prévia local só se ainda não houver publicação, e diz qual das duas
origens usou. Auditoria com regra de aviso vs. erro (Money Page com
`noindex` de propósito até a Fase 3 = aviso explicativo, não erro);
Analytics só é cobrado se de fato configurado; contador de problemas
estável (só calcula depois de todos os fetches terminarem). Tela "Dados
estruturados" passou a mostrar o JSON-LD **real** emitido por cada
página/post, não mais um "previsto" fantasioso gerado a partir dos dados do
painel.

### Fase 6 — Paridade com WordPress (a maior)
- **Cores reais:** a aba Cores de Aparência lê as cores de verdade do
  layout ativo (antes mostrava uma paleta genérica fixa) e virou consulta,
  sem botão Salvar (não existe "cor do cliente" — a cor é do layout).
- **Editor real de páginas:**
  - **Serviços** (`content/servicos/*.md`): criar, editar, renomear com
    redirect + cascata (limpa o `pilar:` de posts que citavam o serviço
    renomeado/excluído), lixeira própria.
  - **Páginas fixas** (home, sobre, contato): título e meta description
    agora vêm de um bloco novo `site.paginas.<pagina>.{titulo,
    metaDescription}` — o motor Astro já lê esse bloco nos 6 layouts (18
    arquivos), com fallback ao texto fixo de sempre quando vazio.
  - **Página-guia:** 4 dos 6 layouts têm uma página pilar própria do nicho
    da demonstração (ex.: tema-04 → "Higienização de Estofados"), com texto
    de corpo extenso ainda fixo no `.astro`. Estendido o mesmo mecanismo —
    `site.paginas.guia` — para título/meta dessa página também; o card só
    aparece no painel quando o layout ativo tem essa página. O corpo
    (introdução, passos, FAQ) continua sendo trabalho do agente.
  - Tela "Páginas" (o detalhe/`/paginas/<id>`) reconhece quando a página
    aberta na verdade é um post, um serviço ou uma página fixa, e mostra um
    botão "Editar" de verdade em vez de instruir a chamar o agente.
  - Botão "Adicionar página" cria serviço de verdade (a opção de página
    institucional livre continua "Em breve" — não implementada).
- **Banner de cookies real no motor:** aparece só quando há cookie não
  essencial cadastrado ou alguma integração configurada; Aceitar/Rejeitar
  com o mesmo peso visual; "Personalizar" por categoria real do site;
  scripts de GA4/GTM/Meta Pixel só carregam após consentimento (inclusive
  em visita repetida já consentida, sem esperar novo clique). Depois
  estendido: título, descrição, posição na tela e **registro de
  consentimento** (POST público `/api/consentimentos`, IP nunca gravado em
  claro — só hash) são reais, gravados em `site.cookieBanner` e lidos pelo
  banner publicado — não ficam mais só na sessão do navegador do painel.
  Sem tela de listagem dos registros ainda (próximo passo, se precisar).
- **Desempenho:** causa raiz do excesso de chamadas de API a cada
  navegação identificada (telas de Mídia/Usuários faziam fetch próprio
  redundante ao que o store já tinha carregado) e corrigida, mais cache
  curto (8 s) em Leads/Formulários; bug real de texto digitado sumindo por
  causa de dado assíncrono tardio, corrigido no editor de formulários;
  Enter na busca abre o primeiro resultado. A trava de ~30 s relatada em
  Leads **não foi reproduzida nem confirmada como resolvida** — a suspeita
  mais forte é I/O de arquivo bloqueante (`painel/lib/dados.ts`) somada ao
  excesso de chamadas; precisa de teste ao vivo para confirmar.
- **Foto de perfil como avatar:** círculo de usuário/autor mostra a foto de
  verdade quando existe (antes sempre mostrava só iniciais), com iniciais
  como reserva. Aplicado em lista de usuários, autores e rodapé do menu.
- **Box do autor no fim do artigo:** completo (todas as redes cadastradas,
  especialidades, formação, alt real da foto); removido o WhatsApp da
  **empresa** que aparecia com rótulo "de \<autor\>" (contato falso); "Nenhum"
  (quando o autor não tem conselho profissional) deixou de aparecer como
  credencial.

**Todas as fases foram validadas por build real** (`testar_promocao.sh`,
contagens de página conferidas), `tsc --noEmit` + `npm run build` do
painel, e testes de integração por curl/Node contra `next start` — nunca só
"compilou sem erro". Uma cópia de teste local descartável foi usada ao
longo de toda a sessão (`D:\LFSoft\Mentoria\_teste-fase1`, fora do repo,
painel em `localhost:3210` + site em `localhost:4321`, credenciais em
`credenciais/vps-teste.md`, fora do git); **pode não existir mais** numa
sessão nova — recriar copiando `_astro/` + promovendo um tema + `npm run
dev` nos dois lados, se precisar retomar teste manual.

---

## R5 — teste de ponta a ponta no VPS (27/09/2026) — CONCLUÍDO

Feito com autorização explícita do Lucas, na mesma sessão que fechou a Fase 6.
VPS de teste (IP/porta em `credenciais/vps-teste.md`, fora do git). Achados
de campo, todos corrigidos e commitados:

**Estado do servidor, diferente do documentado.** Existia uma instalação
antiga de um único cliente (`/opt/linkflow-teste`, modelo pré-multicliente,
Torrez) e uma instalação atual, multicliente, com um cliente real e no ar
(`clinica-sorriso-vivo-jundiai`, criado numa sessão anterior não registrada
aqui, publicado em `dentista.turboblog.com.br`) — **não tocado, segue no ar**.
`/opt/linkflow` (a referência multicliente) não tinha pasta `_astro` nenhuma
e o `painel`/`scripts` compartilhados estavam de ~15/19 de setembro, sem
quase nada das Fases 0–6.

**O que foi feito:**
1. Torrez antigo (`/opt/linkflow-teste`) desligado e removido, a pedido do
   Lucas — "desligar e remover".
2. `/opt/linkflow/painel`, `/opt/linkflow/scripts` e `/opt/linkflow/_astro`
   (criada do zero) atualizados com o estado atual do repositório, `npm ci`
   nos dois.
3. Cliente `torrez-desentupidora` criado do zero por `novo-cliente.sh`,
   reaproveitando os mesmos domínios que o Torrez antigo usava
   (`teste.turboblog.com.br` / `painel.teste.turboblog.com.br`) e o
   certificado SSL já existente (Let's Encrypt reconheceu como
   "not yet due for renewal" e só reimplantou).
4. Conteúdo real do Torrez (NAP, 5 serviços, área atendida — os mesmos 6
   municípios do `projeto.md`) escrito em `config/site.ts` e
   `content/servicos/*.md`, sem inventar CNPJ/e-mail/nota do Google (campos
   que o onboarding nunca coletou ficaram vazios, não fabricados).
5. Guardião (`previa` e `saida`) rodado contra o cliente real: **PASS** nos
   dois, só com avisos esperados (sem post, sem prova social — pendências
   reais de um site que ainda não passou pela Fase 3).
6. Build real do Astro no servidor, deploy para `/var/www/torrez-desentupidora`.
7. Primeiro admin do painel criado (credenciais em `credenciais/vps-teste.md`),
   login por sessão testado de verdade.
8. **Formulário do site publicado → lead real no painel**, ponta a ponta
   (POST em `/api/submissao` com a origem do domínio real, LGPD exigida,
   lead apareceu em `/api/leads`).
9. **Post criado e publicado pelo painel → build real → no ar** no domínio
   público, título e conteúdo conferidos no HTML servido.
10. **Upload de mídia pelo painel → servida pelo Nginx do site** (`/midia/`
    com `^~`, a correção da Fase 4) — confirmado com um PNG real, 200
    `image/png`.

**3 bugs reais encontrados e corrigidos (só apareceram rodando de verdade,
nenhum teste isolado os pegava):**
- `scripts/vps/novo-cliente.sh` chamava `ssl-cliente.sh` por caminho
  relativo (`dirname "$0"`), mas o script já tinha trocado de diretório
  (`cd` pro build do painel) antes disso — o SSL automático sempre falhava
  em silêncio. Corrigido com `SCRIPT_DIR` absoluto, calculado antes de
  qualquer `cd`.
- O mesmo script tentava iniciar o painel no PM2 com `next start
  --env-file <arquivo>` — essa flag **não existe** no `next start` desta
  versão do Next, e o `pm2 start` retorna sucesso mesmo com o processo
  entrando em loop de erro, então a falha nunca aparecia. Todo cliente novo
  nascia com o painel fora do ar. Corrigido: o `.env` do cliente agora é
  copiado para `painel/.env.production.local`, que o Next carrega sozinho,
  sem flag nenhuma.
- **6 layouts (`tema-03` a `tema-07`) mostravam "NaN anos" / "em undefined"**
  na home e na página Sobre sempre que `site.anoFundacao` não estivesse
  preenchido (22 ocorrências) — um cálculo de idade da empresa sem guarda
  contra o campo ausente. Corrigido em todos: sem o ano, a frase muda para
  uma versão sem data ("há alguns anos"/sem o trecho), nunca mostra
  `NaN`/`undefined`.

**Achado, não corrigido (decisão de produto, não de código):** o layout
`tema-04` deixou de ser um template genérico de "serviço local" — o texto
fixo da home e do Sobre (história de fundação, "por que nos escolher", FAQ)
é hoje especificamente sobre **higienização de estofados**, não sobre
qualquer "serviço local". Usar `tema-04` para o Torrez (desentupidora)
significa que toda essa prosa segue sobre o negócio errado até a Fase 3
reescrever — o que é esperado (mesma categoria de pendência que o guardião
já avisa: "prova social"), mas vale reavaliar se `tema-04` era mesmo o
layout certo pro Torrez, ou se `tema-06` (Hidroponto — "serviço técnico de
emergência") descreve melhor o nicho dele. Não decidido nesta sessão.

**Observação, sem ação:** todas as rotas de página (`/servico`) respondem
com 301 para `/servico/` (barra no fim) antes de servir o conteúdo — é o
Nginx tratando o caminho como diretório, comportamento padrão do servidor
web para sites estáticos, **não é regressão desta sessão** (mesma
configuração usada pelo cliente `clinica-sorriso-vivo-jundiai`, criado
antes). Só um salto a mais por link interno; não chegou a ser investigado
se vale eliminar.

**Estado final do servidor:** `torrez-desentupidora` e
`clinica-sorriso-vivo-jundiai` no ar, cada um com painel e site próprios,
SSL válido nos dois. `clinica-sorriso-vivo-jundiai` não foi tocado em
nenhum momento.

## Testes (guardados em `scripts/testes/`)

- `bash scripts/testes/testar_promocao.sh <tema|sem-promocao> <dir_de_build>`
  — cópia isolada, promoção, build real, contagens e vazamento de
  `/tema-0X` (cabeçalho explica como criar o `dir_de_build`). Números
  esperados no cabeçalho.
- `python scripts/testes/testar_guardiao.py` — cenários das 4 fases do
  guardião (27 no total, incluindo os de `painelUrl` da Fase 3).
- `python scripts/testes/testar_nginx_midia.py` — reimplementa a regra de
  seleção de `location` do Nginx sobre o bloco gerado por
  `novo-cliente.sh`, sem precisar de um Nginx real.
- `node --experimental-strip-types scripts/testes/testar_site_config.ts` —
  263 asserções do módulo de leitura/escrita de `site.ts` contra os
  configs reais.
- `node --experimental-strip-types scripts/testes/testar_legal_site.ts` —
  o mesmo para o bloco `legal:` (edição campo a campo, nunca regenera).
- Painel: `tsc --noEmit` + `npm run build` numa cópia (nunca a pasta real);
  APIs testadas com `x-api-key` e por sessão. **Nenhuma tela foi vista
  clicando de verdade num navegador durante o plano de QA** — validação de
  UI ficou por conta do Lucas testando manualmente a cada rodada.

## Lições operacionais (não repetir)

- **`taskkill /IM node.exe` sem filtro mata TUDO**, inclusive o painel/site
  de teste que o Lucas está usando para validar. Sempre matar processo de
  teste por PID/porta específica.
- **Junction de `node_modules` quebra o webpack do Next** ("module is not a
  function"). Sempre copiar de verdade (`cp -r`), nunca linkar.
- **Misturar `next build` (produção) e `next dev` na mesma pasta `.next`**
  quebra os dois — apagar `.next` antes de trocar de modo.
- **Terminal Git Bash no Windows corrompe acento em `curl -d '...texto com
  ç, ã...'`** (o shell mangla a codificação antes de chegar no `-d`). Para
  testar payload com acento, escrever um arquivo `.json` em UTF-8 de
  verdade (Python `open(..., encoding="utf-8")`) e usar `curl --data-binary
  @arquivo`. Isso é só do terminal de teste — o navegador do usuário sempre
  envia UTF-8 correto, então não é bug de produto.
- **Cada agente em paralelo precisa de fronteira de arquivo explícita** —
  nesta sessão, várias rodadas usaram 2 a 4 agentes simultâneos em áreas
  diferentes do painel/motor; sempre listar exatamente quais arquivos cada
  um pode tocar, e revisar/testar o conjunto (não confiar no relatório
  isolado de cada um) antes de commitar.
- **YAML:** data sem aspas (`2026-09-25`) vira objeto Date. O painel grava
  entre aspas; qualquer gerador novo de frontmatter precisa fazer o mesmo.
- **Python do VPS:** versão não garantida (vem do `apt`). Não usar recursos
  do 3.9+ (`removeprefix`, `write_text(newline=)`).

## Pendências, em ordem

1. ~~Suíte Playwright, autorizada mas não criada~~ — **resolvida em
   27/09/2026**: 42 testes, verdes (41 passam + 1 skip esperado). No
   processo, achou um bug real do produto — em
   `app/(painel)/privacidade/cookies/page.tsx`, o botão "Salvar
   configuração" lia `politicaPublicada` de `lib/store.tsx`, mas
   `setPoliticaPublicada` nunca era chamado em lugar nenhum do painel:
   ficava sempre `false`, então o botão ficava permanentemente
   desabilitado mesmo com a Política de Privacidade completa. Corrigido:
   a tela agora calcula `politicaPublicada` ela mesma, a partir dos
   mesmos 5 campos obrigatórios que a tela Política usa pra "100%
   completo" (CNPJ, endereço, e-mail de contato, retenções, versão+data).
   Estado morto removido de `lib/store.tsx`.
2. ~~Layout do Torrez pode não ser o mais adequado~~ — **resolvido em
   27/09/2026**: trocado de `tema-04` para `tema-06` (serviço técnico de
   emergência, já cita "desentupidora" na descrição do nicho). A prosa fixa
   do tema (H1, FAQ, "por que nos escolher", números) continua sendo de
   demonstração — normal, é trabalho da Fase 3, que nunca rodou pro Torrez.
3. **`clinica-sorriso-vivo-jundiai`, cliente real no VPS** (criado numa
   sessão anterior não documentada aqui) — confirmar com o Lucas/Jorge o
   que esse cliente é e o que falta nele; não foi tocado no R5.
4. **Página institucional livre** (fora de serviço) — botão existe, mostra
   "Em breve".
5. **Corpo de texto livre** das páginas fixas e da página-guia — só
   título/meta viraram editáveis; o corpo depende de mudança maior no
   motor (onde renderizar um texto livre dentro do layout de cada tema).
6. **Tela de consentimentos registrados** (`dados/consentimentos.json`) —
   o registro passou a acontecer de verdade (Fase 6), mas não há UI para
   consultá-los no painel.
7. **Trava de ~30 s em Leads (A44 do relatório de QA)** — não reproduzida
   nem confirmada como resolvida; suspeita é I/O síncrono em
   `painel/lib/dados.ts` somado ao excesso de chamadas (já reduzido).
   Precisa de teste ao vivo.
8. **`painel/lib/dados.ts` usa `fs.readFileSync`/`writeFileSync` síncronos**
   em toda chamada de API de leads/formulários/tarefas — risco de
   travamento sob carga; converter para async é mudança maior, ainda não
   feita.
9. **Corrida em `usuarios.json`** — a escrita é atômica, mas não há trava
   contra leitura-modificação-gravação simultânea de duas requisições.
10. **Permissão de arquivo:** `usuarios.json` (com hash de senha) fica
    legível por outros usuários locais no servidor.
11. **`/api/auth/verificar-senha`** não tem limite de tentativas (exige
    sessão, mas dá para forçar a própria senha).
12. ~~`scripts/criar-admin.mjs` legado, incompatível~~ — **removido em
    28/09/2026** (Relatório de Testes 4, erro 34): não gravava usuário
    nenhum (`hashSenha()` nunca era chamada; `main()` só imprimia um
    `curl` pro operador colar) e, mesmo gravando, usava hash incompatível
    com o painel real (scrypt vs. bcryptjs). O caminho real de criar o
    1º admin sem SSH já existe — `app/api/usuarios/route.ts` aceita
    `x-api-key` quando `usuarios.json` está vazio (ver Fase 8 do
    `relatorios/Plano-Correcao-Testes-4.md`).
12. Limites conhecidos de antes do plano de QA, ainda sem correção:
    `hashtags`/`buscasFrequentes` dos configs apontam direto para slugs de
    post/serviço (link morto se o post virar rascunho); `public/tema-0X.json`
    ainda descreve rotas antigas (só informativo).

## Suíte Playwright

`painel/tests/` — 42 testes, `playwright.config.ts` na raiz do painel.
`tests/README.md` explica como preparar a cópia de teste (nunca roda contra
a pasta real sem antes conferir). Roda com `workers: 1` (specs
compartilham `usuarios.json`/posts/serviços do mesmo servidor) e
`fullyParallel: false`.

```
export PLAYWRIGHT_API_KEY=<a mesma PAINEL_API_KEY do servidor>
export PLAYWRIGHT_BASE_URL=http://localhost:3210   # ou outra cópia já no ar
npx playwright test --reporter=list
```

`tests/global-setup.ts` cria/reativa os usuários de teste via API antes da
suíte rodar. `tests/privacidade.spec.ts` faz sua própria checagem de
estado (se a Política já está completa no servidor, um teste se
auto-`skip`; o outro sempre PATCH-a os campos, testa e devolve o valor
original em `finally`) — pensado pra não estragar um servidor
compartilhado com dados manuais de outra sessão.

**Pegadinha real, já vivida:** um servidor `next dev` de teste que fica no
ar por muitas horas (esta sessão usou o mesmo processo o dia inteiro) pode
ter o Fast Refresh falhando silenciosamente numa edição específica — sem
erro no terminal, sem overlay de erro no navegador — e continuar servindo
o bundle de ANTES da edição. Foi exatamente o que aconteceu com o fix do
`politicaPublicada`: o código no disco estava certo, a API confirmava os
dados certos, mas a tela continuava mostrando o bug antigo até eu matar o
processo (`netstat -ano | findstr :3210` → PID → `Stop-Process`) e subir
`npm run dev` de novo. Se um teste falha de um jeito que não bate com o
código-fonte lido na hora, suspeitar disso antes de caçar bug fantasma —
principalmente depois de editar um arquivo que muda imports/hooks
(remover um import do `lib/store.tsx`, no caso).

## VPS de teste

IP/porta em `credenciais/vps-teste.md` (fora do git — nunca citar o valor
real aqui, este arquivo é distribuído). **Pedir autorização ao responsável
antes de qualquer ação no VPS** — leitura conta (testar conexão SSH,
listar clientes hospedados), não só alteração — vale mesmo depois do R5.

**Estado atual (27/09/2026), depois do R5:**
- `/opt/linkflow` — instalação multicliente atual, motor de referência e
  scripts sincronizados com o repositório (feito no R5). É daqui que
  `novo-cliente.sh` copia para cada cliente novo.
- `/opt/linkflow/clientes/torrez-desentupidora` — `LINKFLOW_SLUG:
  torrez-desentupidora`, criado do zero no R5, site em
  `teste.turboblog.com.br`, painel em `painel.teste.turboblog.com.br`
  (credenciais em `credenciais/vps-teste.md` — trocar antes de qualquer uso
  real). **Layout: `tema-06`** (trocado de `tema-04` no mesmo
  dia — o Lucas achou que combinava mais com uma desentupidora; `tema-06` já
  cita "desentupidora" na própria descrição do nicho e tem "Desentupimento"
  como um dos serviços de demonstração). Conteúdo é o real do `projeto.md`
  (NAP, 5 serviços reais, `site.paginas.home` com título/meta reais), mas a
  prosa fixa do tema (H1 "Caça vazamento e encanador", "Treze anos
  procurando água onde ninguém vê", FAQ, números da operação) ainda é de
  demonstração — Fase 3 nunca rodou para este cliente. **Importante:**
  trocar de tema recria a pasta `_astro` inteira do cliente — um post
  publicado antes da troca (`quanto-tempo-leva-desentupimento-de-esgoto`)
  foi perdido nessa troca e teve que ser republicado depois.
- `/opt/linkflow/clientes/clinica-sorriso-vivo-jundiai` — cliente real,
  criado numa sessão anterior não documentada neste handoff, publicado em
  `dentista.turboblog.com.br`. **Não foi tocado no R5.** Confirmar com o
  Lucas/Jorge o que é esse cliente antes de mexer nele.
- O modelo antigo de um único cliente (`/opt/linkflow-teste`) foi
  **removido** no R5 — não existe mais.

---

## Histórico anterior ao plano de QA (resumo)

Trabalho concluído antes do plano de QA do painel, ainda válido, condensado
aqui (detalhe completo no `git log` de `bc70a98` para trás):

- **Relatório de Testes 3** (9 erros, `relatorios/Relatorio-Testes-3-LinkFlow-19-09.docx`):
  instalador de VPS mais seguro (sem `apt upgrade`, porta por `ss`/`.env`,
  SSL só onde o DNS aponta, sem e-mail inventado); auditoria de SEO lendo
  links reais do `dist/` em vez do plano; guardião em 4 fases
  (construção/prévia/publicação/saída); fluxo em 3 marcos com prévia local
  antes de qualquer VPS; recuperação de senha via SSH (skill `painel-senha`).
- **3 layouts novos** (05 Amparo, 06 Hidroponto, 07 Vereda com pilar
  `/planos`), convertidos dos zips de referência ao padrão do projeto;
  catálogo de layouts (`/catalogo`, fonte única em
  `catalogo-layouts.json`); tela "Layout" no painel.
- **Rodada de autor:** páginas `/autor/<slug>` nos 3 temas originais, com
  perfil, seleção de artigos e JSON-LD `Person`.
- **R0-R4** (pós-Relatório 3, pré-plano de QA): autor sumido nos cards de
  post; página de categoria `/<slug>` nos 3 temas; Privacidade do painel
  ligada a `site.legal` de verdade (evoluído mais a fundo na Fase 1.2 do
  plano de QA depois); `robots.txt`/`llms.txt` nascendo no primeiro build;
  varredura que achou e corrigiu 2 regressões reais (texto do nicho sendo
  sobrescrito, campo `imagemHero` inexistente no schema).

Todas essas rodadas foram substituídas ou aprofundadas pelo plano de QA do
painel na parte em que se sobrepõem (principalmente Privacidade e SEO) —
o texto acima é só para entender a origem histórica, não para retrabalhar.
