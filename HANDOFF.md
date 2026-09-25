# Handoff — SiteFlow CMS / LinkFlow (Jorge Torrez) — v2 (25/09/2026)

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
(servicos, equipe, depoimentos, posts, autores) e as páginas do tema base
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
| Categoria (a fazer) | `/<categoria>`; o artigo continua `/<slug>` |
| Autor | `/autor/<slug>` |

Rota unificada em `pages/[slug].astro`. Prioridade em caso de slug repetido
(decidida): página fixa > serviço > categoria > artigo. Os slugs não devem
se repetir, e a checagem de colisão na raiz ainda está por fazer.

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

## Última rodada: entregue, AGUARDANDO validação do Code

**Páginas de autor `/autor/<slug>` nos 3 temas.** O ZIP atual já contém
esta rodada, e o prompt completo para o Code está na conversa anterior.
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

1. **Validar a rodada de autor** com o Code (prompt na conversa anterior;
   se for preciso, remontar a partir do resumo acima).
2. **Página de categoria** `/<categoria>` nos 3 temas: coleção
   `categorias`, sincronização a partir do `painel/data/categorias.json`,
   bloco compartilhado e **os 12 artigos mais recentes, sem paginação**
   (decisão). Mais a checagem de slug repetido na raiz, no build e no
   `guardiao_construtor`. Lembrar de incluir em `COLECOES` e
   `NOMES_BASE_LEGITIMOS` (se houver página) e na limpeza do
   `novo-cliente.sh`.
3. **Privacidade no painel ligada ao `site.legal`:** as telas Política,
   Termos e Cookies (cerca de 1.700 linhas) não gravam no que o site publica.
4. **`robots.txt` e `llms.txt` na criação do site:** o guardião exige, mas só
   o painel cria (quando alguém salva a tela).
5. **Teste de ponta a ponta no VPS de teste** (critério de "concluído"
   sugerido: a Torrez criada do zero pelo fluxo do agente, com site e painel
   no ar, publicando um post pelo painel sem intervenção manual).
6. **Varredura do que não foi auditado:** o fluxo das skills no caminho
   Astro (`fase3-conteudo` → `site-atualizar` → `site-publicar`), as telas
   de menus, formulários e leads, e o caminho WordPress.
7. **Checagem opcional** no `guardiao_construtor`: post com `autor:` que não
   existe em `content/autores`.

## VPS de teste

`[IP-REMOVIDO]`, porta `22022`, `LINKFLOW_DIR: /opt/linkflow-teste`,
`LINKFLOW_SLUG: torrez-desentupidora`.
