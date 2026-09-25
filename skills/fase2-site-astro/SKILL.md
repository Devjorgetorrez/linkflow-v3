---
name: fase2-site-astro
description: >
  Constrói o site Astro do cliente a partir do projeto.md do LinkFlow e faz
  o primeiro deploy no VPS via SSH (a infraestrutura é garantida pela skill
  vps-setup). Escolhe o tema pelo nicho, cria os arquivos de configuração
  e conteúdo do cliente dentro do motor compartilhado (_astro/), roda o
  build local para preview e o build real no servidor para o deploy.
  Funciona em Claude Code Desktop (Windows) e Claude Code CLI em VPS (Linux).
  Invocado por /link-flow site quando site_tipo = astro no projeto.md.
user-invokable: false
---

# fase2-site-astro — Construtor de Site Astro + Deploy VPS

Lê o projeto.md do LinkFlow, escolhe o tema correto pelo nicho, cria os
arquivos do cliente dentro do motor compartilhado, roda o build e faz o
primeiro deploy completo via SSH para o VPS (infraestrutura já garantida
pelo `vps-setup` na ETAPA 3).

**Nunca pergunta ao cliente sobre nicho, estrutura de páginas ou palavras-chave
— tudo vem do projeto.md. A fronteira LinkFlow/SiteFlow não pode ser violada.**

---

## Arquitetura do motor (ler antes de qualquer ação)

Cada cliente tem sua **própria cópia isolada** do motor `_astro/`, criada
pelo `vps-setup`/`novo-cliente.sh` a partir do motor compartilhado de
referência (que fica só no `/opt/linkflow/_astro`, nunca é editado
diretamente e nunca é servido a nenhum cliente). Na criação, a `ETAPA 3`
já promoveu o tema escolhido pra raiz dessa cópia e apagou os outros
dois — por isso os caminhos abaixo são sempre os mesmos, únicos,
nunca por nome de cliente:

```
/opt/linkflow/clientes/[slug-cliente]/_astro/     ← cópia isolada deste cliente
├── src/
│   ├── components/blocos/       ← blocos de UI (Header, Hero, etc.)
│   ├── layouts/                 ← só o layout do tema promovido
│   ├── config/
│   │   └── site.ts              ← ← ← CONFIG DO CLIENTE (criado aqui, sempre esse nome)
│   ├── content/
│   │   ├── servicos/            ← ← ← CONTEÚDO DO CLIENTE (criado aqui, sem aninhar por slug)
│   │   ├── posts/
│   │   ├── equipe/
│   │   └── depoimentos/
│   └── content.config.ts        ← reescrito na promoção, só as 4 coleções canônicas
├── public/
└── package.json

/opt/linkflow/_astro/             ← motor compartilhado de referência (NÃO editar,
                                     NÃO é servido a cliente nenhum — só a fonte
                                     que novo-cliente.sh copia e promover_tema.py corta)

projetos/[slug-cliente]/projeto.md
```

**A escolha de tema é definitiva**, feita uma vez na ETAPA 2 e promovida
na ETAPA 3. Depois disso não sobra nada dos outros dois temas na cópia
desse cliente — trocar de tema no futuro exige reconstruir o site do
zero, não é um campo que se edita.

---

## ETAPA 0 — Ler o projeto.md

Localizar `projetos/<slug>/projeto.md` e extrair:

**Obrigatórios:**
```
nome_negocio     ← "Nome do negocio" (Bloco 1 do ICP)
segmento         ← "Nicho / segmento"
cidade           ← do endereço completo
uf               ← idem
cep              ← obrigatório para schema.org
telefone         ← NAP
whatsapp         ← NAP
email            ← NAP
endereco_rua     ← rua + número + bairro
horarios         ← "Horario de Atendimento"
servicos         ← lista de serviços do Bloco 1
tom_de_voz       ← "Tom de Voz" (perfil N)
kw_principal     ← da Fase 1
money_pages      ← "## Money Pages" (slug + KW principal)
```

**Opcionais:**
```
credencial       ← OAB/CRM/CRP/CRC etc (se regulado: true)
cnpj             ← campo correspondente
instagram        ← redes sociais
restricoes_legais ← se regulado: true
```

**Inferir tipo_schema pelo segmento:**

| Segmento | tipo_schema |
|---|---|
| psicólogo, terapeuta | `Psychologist` |
| dentista, odontologia | `Dentist` |
| clínica médica | `MedicalClinic` |
| fisioterapeuta | `Physiotherapy` |
| nutricionista | `Nutritionist` |
| advogado, advocacia | `LegalService` |
| contador, contabilidade | `AccountingService` |
| corretor de seguros | `InsuranceAgency` |
| encanador, elétrica, higienização | `HomeAndConstructionBusiness` |
| outros | `LocalBusiness` |

---

## ETAPA 0.5 — Coleta de identidade, direção visual e prova social

**Obrigatória, sempre antes do Guardião de Entrada.** É aqui que o
construtor deixa de assumir e passa a perguntar. Conduzir como conversa,
em blocos, confirmando cada um antes de avançar — nunca um formulário
longo de uma vez só.

### Parte 1 — Identidade visual

> "Você já tem uma logo pronta? Se sim, salve o arquivo em
> `projetos/<slug>/marca/` (qualquer formato — PNG, SVG, JPG) e me avise
> o nome do arquivo. Não cole a imagem aqui no chat — arquivos colados
> no chat não são salvos em disco, então eu não consigo usar."

SE tiver logo: copiar para `_astro/src/content/<slug>/marca/` e usar no
config do cliente. Registrar `logo_status: fornecida` no projeto.md.

SE não tiver: nunca gerar nem redesenhar a logo — isso vira uma logo
aproximada, não a real do cliente. Explicar:

> "Sem problema. Vou usar o nome do negócio como texto estilizado no
> lugar da logo por enquanto (não é uma imagem placeholder genérica,
> é o nome de vocês mesmo, só que sem arte). Isso fica registrado como
> pendência para vocês resolverem quando tiverem uma logo pronta."

Registrar `logo_status: pendente (usando wordmark textual)` no
projeto.md — isso é obrigatório, nunca deixar esse campo de fora.

Perguntar também:
> "Tem cores da marca definidas (mesmo que só 'o azul do meu logo')?
> Se não tiver, uso a paleta padrão do tema escolhido."

Registrar `cores_marca: [hex ou "padrão do tema"]`.

### Parte 2 — Direção visual

**Nunca escolher o tema sozinho pela tabela nicho→tema sem perguntar.**
A tabela nicho→tema é um ponto de partida para a conversa, não a decisão
final.

> "Tenho alguns estilos de site disponíveis — posso te mostrar prints
> rápidos de 2 ou 3 opções que combinam com o seu segmento. Ou, se você
> já tem um site (seu ou de concorrente) que gosta do visual, me manda
> o link que eu uso de referência."

Mostrar (descrever ou printar) as opções de tema disponíveis no
catálogo (`_astro/public/tema-*.json`). Perguntar também:

> "Tem alguma cor ou estilo que definitivamente NÃO combina com a
> marca de vocês?"

Registrar `tema: [tema escolhido]` OU `referencia_visual: [URL]`, e
`evitar_visual: [o que não usar, se informado]`.

### Parte 3 — Dados institucionais

Não tratar como opcional silencioso — perguntar ativamente:

> "Preciso de mais alguns dados para o rodapé e para o site aparecer
> corretamente no Google: razão social, CNPJ e um e-mail institucional
> (pode ser o mesmo do WhatsApp se não tiver outro)."

Registrar `razao_social`, `cnpj`, `email_institucional` no projeto.md.
Se o cliente não tiver CNPJ (MEI em abertura, autônomo), registrar
`cnpj: não possui` explicitamente — nunca deixar o campo ausente sem
explicação.

### Parte 4 — Prova social

> "Para o site parecer real e confiável, preciso de:
> - Fotos reais do local, da equipe ou do trabalho (salve em
>   `projetos/<slug>/marca/fotos/` e me avise)
> - Algum depoimento de cliente, mesmo que informal (print de WhatsApp,
>   avaliação do Google)
> - Os 2 ou 3 maiores diferenciais em relação à concorrência
> - Em que ano o negócio começou"

Registrar `fotos_status`, `depoimentos`, `diferenciais`,
`ano_fundacao` no projeto.md. Se o cliente não tiver fotos reais ainda,
registrar `fotos_status: pendente` — nunca usar banco de imagens
genérico sem essa pendência estar explícita e visível no resumo final.

### Parte 5 — Publicação

Coberta pela ETAPA 3, mais adiante (garantir infraestrutura VPS via
`vps-setup`). Não repetir aqui.

---

## GUARDIÃO DE ENTRADA — Executar ANTES de qualquer construção

Antes de criar qualquer arquivo, executar obrigatoriamente:

```bash
python scripts/guardiao_construtor.py --slug <slug> --fase entrada
```

**Se retornar FAIL: parar imediatamente e corrigir os bloqueios listados.**
Não prosseguir para a ETAPA 1 enquanto houver erros. Os bloqueios comuns são:
- NAP incompleto (telefone, endereço, cidade faltando)
- Domínio não preenchido ou com placeholder
- Direção visual não definida (tema ou URL de referência)
- Fase 2 técnica não concluída (arvore de silos ausente)

Se retornar PASS: prosseguir normalmente.

---

## ETAPA 1 — Painel de gestão: preview local antes do deploy

O painel de gestão (SiteFlow) é uma aplicação Next.js real, com API
própria — não é mockup. Em produção, ele roda no VPS do cliente (um
processo PM2 isolado por cliente, configurado pelo `vps-setup`),
acessível de qualquer dispositivo em `painel.[dominio]`.

**Nesta etapa, antes do primeiro deploy, é útil rodar uma cópia local**
para o operador revisar o conteúdo que está sendo construído antes de
publicar:

**Verificar se o painel está instalado:**

```bash
ls painel/package.json
```

Se existir, instalar dependências (só precisa fazer uma vez):

```bash
cd painel && npm ci
```

**Para abrir o preview local a qualquer momento:**

```bash
cd painel && npm run dev
# Acesse: http://localhost:3210
```

O painel local roda na porta 3210. O site Astro (quando buildado
localmente) roda na porta 4321. Os dois podem rodar simultaneamente
sem conflito.

**O que o painel oferece** (local e em produção, mesma aplicação):
- Dashboard com visão geral do site
- Editor de posts e blog
- Gerenciamento de serviços, categorias e mídia
- Configurações de identidade, contato e NAP
- SEO: dados estruturados, sitemap, robots, verificações
- Aparência: troca de tema e personalização visual
- Privacidade: política, termos e cookies

**Divisão de responsabilidades:**
- **Painel (usuário):** revisa conteúdo, navega pelas seções, confirma
  configurações — local durante a construção, em produção depois do deploy
- **Claude Code (agente):** escreve os arquivos, roda o build, faz o
  deploy real no VPS (ETAPA 6)
- **VPS (Hostgator):** hospeda o site e o painel depois do deploy

Após o operador aprovar o que vê no preview local, seguir para a ETAPA 2.

---

## ETAPA 2 — Verificar ambiente técnico

```bash
node --version    # requer >= 18
python3 --version 2>/dev/null || python --version
ls _astro/package.json
ls _astro/public/tema*.json
```

Se Node.js não estiver instalado ou for < 18, orientar e parar.
Se `_astro/` não existir, avisar que o motor precisa estar na pasta do LinkFlow.

Ler os arquivos `_astro/public/tema-*.json` e selecionar pelo campo
`para_nichos[]` que melhor corresponde ao segmento do cliente.

**Correspondência:**

| Segmento | Tema preferencial |
|---|---|
| saúde, clínica, dentista, psicólogo, fisio, nutrição | `healthcare-institutional` |
| contabilidade, advocacia, consultoria, engenharia | `vertice-institucional` |
| higienização, desentupidora, limpeza, pintura, reforma | `renovar-servico-local` |
| corretor de seguros, imóveis | `renovar-servico-local` |
| outros | tema com mais variantes disponíveis |

Registrar `tema_escolhido` (o `id` do catálogo, ex: `vertice-institucional`
— usado só para exibição/log) e `tema_pasta` — **o nome do arquivo do
catálogo sem `.json`** (`base`, `tema-03` ou `tema-04`, ex: se o arquivo
escolhido foi `tema-03.json`, `tema_pasta: tema-03`). É `tema_pasta` que
vai literalmente como `--tema` pro `vps-setup`/`promover_tema.py` na
ETAPA 3 — nunca o `id` do catálogo, que tem outro formato.

**A escolha do tema é definitiva, feita uma vez aqui.** Diferente de
uma versão anterior deste fluxo, não existe "trocar de tema depois pelo
painel" — a promoção de tema (ETAPA 3) apaga os outros dois temas por
completo da cópia isolada do cliente, então não sobra nada pra trocar
para. Se o cliente quiser mudar de tema no futuro, isso exige reconstruir
o site do zero com o tema novo, não é uma troca de campo.

---

## ETAPA 3 — Garantir que a infraestrutura VPS existe

Verificar se `## Ambiente VPS` no `projeto.md` já tem `vps_ip` e
`vps_cliente_dir` preenchidos (registrados pelo `vps-setup`).

**Se sim** → a infraestrutura já existe (servidor, painel, PM2, Nginx,
SSL configurados). Ir direto para ETAPA 4.

**Se não** → o site ainda não tem onde ser publicado. Invocar a skill
`vps-setup` agora, antes de continuar:

> "Antes de construir o conteúdo, preciso configurar onde o site vai
> ficar hospedado. Vou te guiar pela configuração do servidor."

`vps-setup` cuida de tudo: credenciais SSH, bootstrap ou adição do
cliente ao VPS, Nginx, SSL, orientação de DNS — e promove o tema
escolhido na ETAPA 2 (`tema_pasta` do projeto.md) pra raiz da cópia
isolada desse cliente, apagando os outros dois. Ao terminar, ela deixa
`## Ambiente VPS` preenchido no `projeto.md` com `vps_ip`, `vps_porta`,
`vps_cliente_dir`, `vps_site_dir`, `dominio`, `dominio_painel`,
`tema_promovido`.

**Nunca pular esta etapa nem construir conteúdo sem a infraestrutura
pronta** — sem ela, não há como fazer o deploy na ETAPA 6.

Depois que `vps-setup` terminar, seguir para ETAPA 4.

---

## ETAPA 4 — Criar arquivos do cliente no motor

### 4.1 Criar pastas de conteúdo

**Sem aninhar por slug do cliente** — cada cliente já tem sua própria
cópia isolada do motor (`vps-setup` promoveu o tema pra raiz nessa
cópia, ETAPA 3), então o caminho já é exclusivo dele. `content/[slug]/`
não existe depois da promoção — só `content/servicos/`, `content/posts/`
etc., direto.

```bash
mkdir -p _astro/src/content/servicos
mkdir -p _astro/src/content/posts
mkdir -p _astro/src/content/depoimentos
mkdir -p _astro/src/content/equipe
```

### 4.2 Criar arquivo de configuração do cliente

Criar `_astro/src/config/site.ts` com os dados do projeto.md — **esse é
o único config que existe depois da promoção de tema (`vps-setup`,
ETAPA 3), nunca `[slug].ts`**: todas as páginas do cliente já importam
`../../config/site.ts` fixo (o mesmo caminho não muda com o tema
escolhido, já que a promoção substitui o conteúdo desse arquivo pelo
tema certo antes desta etapa rodar). **O formato abaixo é o real — usado
pelo motor Astro e pelo painel SiteFlow (`/api/config`). Não inventar
campos nem nomes diferentes** (ex: nunca `negocio: {...}`, sempre
`nap: {...}`; nunca `redes: {instagram: ...}`, sempre `redes: [{nome, href}]`
— um objeto no lugar de array quebra a leitura do painel silenciosamente):

```typescript
// Gerado por fase2-site-astro — LinkFlow
// Não editar manualmente. Use o painel de gestão.
// O tema (base por nicho) já foi promovido pra raiz na ETAPA 3 — não é
// um campo que se troca depois. O conteúdo em src/content/ nunca é
// afetado por essa escolha, só a apresentação visual.

export const site = {
  nome:        "[nome_negocio]",
  nomeBreve:   "[nome_negocio abreviado, se houver — senão igual a nome]",
  slogan:      "[kw_principal] em [cidade]",
  dominio:     "https://[dominio]",
  cnpj:        [cnpj ou null],
  anoFundacao: [ano_fundacao ou null],

  nap: {
    logradouro: "[endereco_rua]",
    complemento: "[complemento, se houver]",
    bairro:     "[bairro]",
    cidade:     "[cidade]",
    uf:         "[uf]",
    cep:        "[cep]",
    enderecoFormatado: "[endereco_rua completo formatado]",
    telefone:   "[telefone]",
    whatsapp:   "[whatsapp, só dígitos com 55 na frente — ex: 5511988887777]",
    email:      "[email_institucional]",
  },

  horarios: [
    // Um item por faixa de dias, formato { dia, hora } — nunca string única
    { dia: "[ex: Segunda a Sexta]", hora: "[ex: 8h às 18h]" },
  ],

  // Array, NUNCA objeto. Só incluir redes que o cliente realmente tem.
  redes: [
    // { nome: "Instagram", href: "[instagram]" },
  ],

  // Nav do cabeçalho — SEMPRE incluir "Serviços" apontando pra /servicos
  // quando houver mais de 1 serviço. Sem isso, a página pilar de serviços
  // (que já existe e já lista todos os serviços automaticamente) fica sem
  // nenhum link apontando pra ela — inalcançável exceto pelo sitemap.
  //
  // Com mais de 1 serviço, incluir também "filhos" — vira dropdown no
  // cabeçalho (hover no desktop, expandido no mobile) com link direto pra
  // cada serviço, não só pra pilar. Sem "filhos" o item vira link simples.
  nav: [
    { label: "Início",   href: "/" },
    { label: "Sobre",    href: "/sobre" },
    {
      label: "Serviços", href: "/servicos",
      filhos: [
        // { label: "[Nome do Serviço]", href: "/[slug-servico]" },
        // repetir para cada serviço da ETAPA 4.3, na mesma ordem — omitir
        // "filhos" inteiro (ou deixar array vazio) se houver só 1 serviço
      ],
    },
    { label: "Contato",  href: "/contato" },
    { label: "Blog", href: "/blog" },
    // Sempre incluir, mesmo sem nenhum post ainda — a página /blog já
    // existe e renderiza vazia (getCollection retorna []). O Google
    // conhece a estrutura do blog desde o primeiro deploy, em vez de
    // só descobrir a seção junto com o primeiro artigo (ver "Publicação
    // por etapa" mais abaixo).
  ],

  // Colunas do rodapé — a coluna "Serviços" aqui é o que garante que TODA
  // página do site (não só a Home) tenha um link direto pra cada serviço,
  // não só pra pilar. Gerar 1 item por serviço criado na ETAPA 4.3 — nunca
  // deixar a coluna vazia ou com menos itens que os serviços reais.
  navFooterColunas: [
    {
      titulo: "Serviços",
      itens: [
        // { label: "[Nome do Serviço]", href: "/[slug-servico]" },
        // repetir para cada serviço da ETAPA 4.3, na mesma ordem
      ],
    },
  ],

  restricoes: [restricoes_legais ou []],
};
```

**Checklist antes de seguir para 4.3 — nenhum destes pode ficar vazio ou
com nome de campo diferente do mostrado acima:**
- `nap` (nunca `negocio`)
- `redes` como array (nunca objeto), mesmo que vazio `[]`
- `nav` com item "Serviços" → `/servicos`, sempre que houver >1 serviço
- Com >1 serviço, o item "Serviços" do `nav` tem `filhos` preenchido —
  1 entrada por serviço, mesma ordem da ETAPA 4.3 (gera o dropdown)
- `navFooterColunas` com a coluna "Serviços" preenchida — 1 item por
  serviço, gerado junto com a ETAPA 4.3 (não deixar para depois)

### 4.3 Gerar páginas de serviço

Para cada serviço do projeto.md, criar
`_astro/src/content/servicos/[slug-servico].md`.

**Sempre incluir `noindex: true` no frontmatter** — a página nasce com
texto placeholder ("[2-3 parágrafos]"), não pode ficar indexável até a
Fase 3 escrever o conteúdo real e trocar para `noindex: false` (ver
`fase3-conteudo`, CAMINHO ASTRO). O motor já suporta esse campo em
`ThemeBase`/`Tema03Base`/`Tema04Base`:

Nomes de campo são os do schema `servicos` em `_astro/src/content.config.ts`:
`titulo` (até 70 chars) e `metaDescription` (80 a 165 chars, **obrigatório** —
sem ele o build do site inteiro falha). Nunca `descricao`.

```markdown
---
titulo: "[Nome do Serviço] em [Cidade]"
metaDescription: "[80-165 chars com palavra-chave e cidade]"
palavraChave: "[serviço] em [cidade]"
ordem: [número sequencial]
noindex: true
---

## O que é [Nome do Serviço]

[2-3 parágrafos. Tom de voz do projeto.md. Focado na dor do cliente.]

## Como Funciona

[Processo em 3-5 passos — do contato ao resultado.]

## Por que Escolher [Nome da Empresa]

[2-3 diferenciais reais do projeto.md. Nunca genéricos.]
```

**Não criar nenhum arquivo "pilar" separado.** A página pilar de serviços
(`/servicos`) já é gerada automaticamente pelo motor a partir dos
arquivos desta pasta (`getCollection('servicos')`, ordenados por
`ordem`) — criar um arquivo manual à parte (ex: em `content/posts/`)
não alimenta nada real no site: a rota de serviço lê da coleção
`servicos`, nunca de `posts`. Um arquivo assim vira artigo de blog
sem querer, e a `/servicos` continua vazia mesmo com o arquivo criado.

### 4.5 Política de privacidade e termos de uso

**Nunca criar essas páginas como arquivo de conteúdo.** Os 3 temas
(base, tema-03, tema-04) têm essas rotas prontas
(`_astro/src/pages/politica-de-privacidade.astro` e `termos-de-uso.astro`):
o texto legal vem de `site.legal` no `config/site.ts`, lido pelo
componente `ConteudoLegal` — a página em si já está pronta, só falta
preencher esse campo com os dados reais do cliente (`controlador.razaoSocial`,
`controlador.cnpj`, `controlador.endereco`, `canalTitular`, etc. — ver a
estrutura completa em `_astro/src/config/tema-03.ts` como referência).

As duas páginas são **obrigatórias e indexáveis em todos os temas** (regra
do Jorge — lista fechada de 4 institucionais do `fase3-conteudo`). Os
Termos de Uso são documento próprio (7 seções, não reproduzem a política)
e leem, além da razão social/CNPJ de `site.legal.controlador`, o bloco
`site.legal.termos`: `naoSubstitui` (aviso de que o site não substitui o
atendimento profissional, escrito para o nicho do cliente), `foro.cidade`,
`foro.uf` e `vigenciaDesde`. Campo vazio aparece na página como
"Publicação bloqueada".

Registrar `dados_status: ficticio` para a Política de Privacidade e
Termos de Uso enquanto `site.legal` não tiver os dados reais confirmados
pelo cliente (razão social e CNPJ verdadeiros, não os de exemplo) — nunca
publicar com CNPJ inventado sem essa pendência estar visível (mesma
regra da ETAPA 7 do `fase3-conteudo`, "Flag de dados fictícios vs reais").

Se o arquivo de alguma das duas rotas não existir no tema promovido
(motor desatualizado), registrar como pendência estrutural no `projeto.md`
(`institucionais_pendentes: politica-de-privacidade, termos-de-uso`) e
avisar o operador, em vez de inventar um caminho que não existe.

---

## ETAPA 5 — Build local

```bash
cd _astro && npm ci && npm run build
```

Se falhar, diagnosticar e corrigir (máx 3 tentativas):
- Frontmatter inválido → corrigir o campo
- Campo obrigatório faltando → adicionar
- Qualquer outro erro → exibir output completo e parar

Não avançar com build quebrado.

### Preview local

Com o build feito, `_astro/dist/` já é o site completo e correto — página
na raiz (`dist/index.html`), serviços (`dist/servicos/...`), CSS/JS
compartilhado em `dist/_astro/`, tudo no mesmo nível. Nenhum merge
manual é necessário: cada cliente tem sua própria cópia isolada do
motor (sem aninhamento por slug), então o build já sai pronto para
servir direto.

```bash
npx serve _astro/dist
```

---

## ETAPA 6 — Primeiro deploy (completo)

Ler `## Ambiente VPS` do `projeto.md` (`vps_ip`, `vps_porta`,
`vps_cliente_dir`, `vps_site_dir` — registrados pelo `vps-setup` na
ETAPA 3).

Enviar o conteúdo e config do cliente para o VPS (só os arquivos fonte,
não o build local — o build acontece no servidor). Caminhos canônicos,
sem aninhar por slug — a promoção de tema (ETAPA 3) já deixou a cópia
isolada desse cliente só com o tema escolhido, sem os outros dois:

```bash
scp -P [vps_porta] \
  "_astro/src/config/site.ts" \
  root@[vps_ip]:"[vps_cliente_dir]/_astro/src/config/"

scp -P [vps_porta] -r \
  "_astro/src/content/." \
  root@[vps_ip]:"[vps_cliente_dir]/_astro/src/content/"
```

Buildar e publicar no próprio servidor — sem merge nenhum, `dist/` já
sai completo e correto (mesmo motivo da ETAPA 5: cada cliente tem cópia
isolada, sem aninhamento por slug):

```bash
ssh -p [vps_porta] root@[vps_ip] << REMOTE
  cd "[vps_cliente_dir]/_astro"
  npm ci --silent   # versões exatas do package-lock.json
  npm run build

  mkdir -p "[vps_site_dir]"
  cp -r "dist/." "[vps_site_dir]/"

  echo "Build e deploy OK"
REMOTE
```

Se o build falhar no servidor, mesma regra da ETAPA 5: diagnosticar,
corrigir, no máximo 3 tentativas — nunca publicar build quebrado.

Verificar se o site está no ar:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://[dominio]"
```

- 200/301/302 → site no ar ✅
- 000 → DNS ainda propagando (ver `dns_status` registrado pelo `vps-setup`)
- 502 → Nginx não encontrou o arquivo — verificar `[vps_site_dir]` no servidor

---

## GUARDIÃO DE SAÍDA — Executar ANTES de reportar "pronto"

Após o build e deploy, executar obrigatoriamente:

```bash
python scripts/guardiao_construtor.py --slug <slug> --fase saida
```

**Se retornar FAIL: NÃO reportar "pronto". Corrigir os bloqueios primeiro.**
Os bloqueios mais comuns na saída são:
- Build não foi executado (site ainda mostra placeholder "Em breve")
- sitemap.xml ausente, vazio, com domínio diferente do `projeto.md` ou com
  URL `/blog/<slug>` / `/servicos/<slug>`. O sitemap é gerado sozinho no
  build (`_astro/integracoes/sitemap-canonico.mjs`, a partir da canonical
  de cada página, sem as `noindex`) — **nunca criar `public/sitemap.xml` à
  mão**: um arquivo estático ali seria servido no lugar do gerado.
- robots.txt com placeholder de domínio
- Conteúdo genérico detectado nos arquivos de serviço
- Config do cliente com campos vazios (domínio, telefone)

Se retornar PASS: prosseguir para a ETAPA 7.

---

## ETAPA 7 — Atualizar projeto.md e resumo final

Preencher `## Ambiente de Publicacao` (as credenciais SSH do VPS ficam
só na sessão, nunca no projeto.md — o `## Ambiente VPS`, preenchido pelo
`vps-setup` na ETAPA 3, já tem o que é necessário para deploys futuros):

```markdown
site_tipo: astro
dominio: [dominio]
url_site: https://[dominio]
primeiro_deploy: [data]
ultimo_deploy: [data]
```

E em `## Estado das Fases`:

```
fase2_site_astro: concluida em [data]
url_publicada: https://[dominio]
tema: [tema_escolhido]
```

### Resumo final — pendências SEMPRE visíveis, nunca só no projeto.md

**Antes de montar o resumo, reler os campos registrados na ETAPA 0.5**
(`logo_status`, `fotos_status`, `depoimentos`, `ano_fundacao`, `cnpj`,
avisos que o `guardiao_construtor.py --fase saida` retornou) e montar a
lista de pendências reais — nunca reportar "site publicado" sem elas,
mesmo que o site esteja de fato no ar.

**Se não houver nenhuma pendência:**

```
✅ Site publicado — sem pendências.

URL:         https://[dominio]
Tema:        [nome do tema]
Serviços:    [N] páginas de serviço
Money Pages: [N] pilares criados

Para publicar artigos de blog:
/link-flow publicar [slug]
```

**Se houver qualquer pendência (logo placeholder, fotos pendentes,
CNPJ ausente, sem depoimentos, avisos do guardião de saída, etc.) —
formato obrigatório, a lista de pendências nunca é omitida nem
resumida a "algumas coisas para ajustar depois":**

```
✅ Site publicado — com pendências abaixo.

URL:         https://[dominio]
Tema:        [nome do tema]
Serviços:    [N] páginas de serviço
Money Pages: [N] pilares criados

⚠️ Pendências (não impedem o site de funcionar, mas valem resolver):
- [1 linha por pendência — ex: "Logo: usando o nome do negócio como
  texto por enquanto. Manda o arquivo quando tiver e eu troco."]
- [1 linha por pendência — ex: "Fotos: site com imagens de banco por
  enquanto. Manda fotos reais do local/equipe quando tiver."]
- [repetir para cada campo pendente — nunca agrupar em "outras
  pendências menores", cada uma na própria linha]

Para publicar artigos de blog:
/link-flow publicar [slug]
```

---

## Degradação

| Situação | Ação |
|---|---|
| Node.js não instalado | Orientar nodejs.org → LTS e parar |
| `_astro/` não encontrado | Orientar que o motor precisa estar na pasta do LinkFlow |
| SSH/VPS não conecta ou infraestrutura ausente | Invocar `vps-setup` (ETAPA 3) — ela tem sua própria degradação para SSH |
| Build falha 3x | Reportar output completo e parar |
| Upload parcial | Registrar arquivos com erro, tentar de novo |
| DNS propagando | Informar e orientar aguardar até 48h |
| Infraestrutura VPS ausente ou inacessível | Invocar `vps-setup` (ETAPA 3) — nunca prosseguir sem ela |
