# Handoff — SiteFlow CMS / LinkFlow (Jorge Torrez) — v2 (25/09/2026)

> **Mudança de fluxo (25/09/2026):** a partir da rodada R0, o modelo de duas
> sessões (chat edita / Code valida) foi encerrado. `C:\Projetos\linkflow-completo`
> agora é repositório git, e uma única sessão do Code edita a pasta real,
> testa em cópia isolada e faz commit por rodada. O `HANDOFF.md` continua
> sendo o documento de retomada — cole-o inteiro numa conversa nova se a
> sessão for perdida; o histórico de commits complementa o que este
> documento resume.
>
> Cole este documento inteiro como primeira mensagem numa conversa nova,
> junto com o `linkflow-completo.zip` mais recente, o `manifesto-md5.txt` e
> o `conferir_manifesto.py`. Ele substitui o histórico das sessões
> anteriores: não existe transferência de conversa, então este documento é
> o que faz a sessão nova saber o que as anteriores sabiam.

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
12. **R2 — Privacidade do painel ligada ao `site.legal`**, ver detalhe abaixo.

## Última rodada: R2 concluída e validada (build real)

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

## Pendências, em ordem (rodadas R3-R6, plano ativo)

1. **R3 — `robots.txt` e `llms.txt` na criação do site:** o guardião exige, mas só
   o painel cria (quando alguém salva a tela).
2. **R4 — Varredura do que não foi auditado:** o fluxo das skills no caminho
   Astro (`fase3-conteudo` → `site-atualizar` → `site-publicar`), as telas
   de menus, formulários e leads, e o caminho WordPress. Checagem no
   `guardiao_construtor`: post com `autor:` ou `categoria:` inexistente.
3. **R5 — Teste de ponta a ponta no VPS de teste** (critério de "concluído"
   sugerido: a Torrez criada do zero pelo fluxo do agente, com site e painel
   no ar, publicando um post pelo painel sem intervenção manual). **Pedir
   autorização ao Lucas antes de tocar no VPS.**
4. **R6 — Fechamento:** `HANDOFF.md` final e resumo do que ficou pronto/pendente.

## VPS de teste

`[IP-REMOVIDO]`, porta `22022`, `LINKFLOW_DIR: /opt/linkflow-teste`,
`LINKFLOW_SLUG: torrez-desentupidora`.
