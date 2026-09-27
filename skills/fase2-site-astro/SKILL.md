---
name: fase2-site-astro
description: >
  Constrói o site Astro do cliente a partir do projeto.md do LinkFlow em três
  marcos, um pedido por vez ao usuário. Marco 1: monta o site numa cópia local,
  sobe a prévia no localhost e ajusta até o usuário aprovar o visual — sem
  domínio, sem servidor, sem custo. Marco 2: só depois da aprovação, pede
  domínio e e-mail, configura o servidor (skill vps-setup), publica, orienta o
  DNS e entrega o acesso ao painel. Marco 3 (conteúdo real) é da fase3-conteudo.
  Invocado por /link-flow site quando site_tipo = astro no projeto.md.
user-invokable: false
---

# fase2-site-astro — Construtor de Site Astro

Lê o projeto.md, **constrói o site numa cópia local, mostra a prévia no
localhost e só publica depois que o usuário aprova o visual**. O usuário nunca
vê um site como "já no ar" antes de ter aprovado: tudo o que ele vê primeiro é
um endereço `localhost` que só ele acessa.

**Nunca pergunta ao cliente sobre nicho, estrutura de páginas ou palavras-chave
— tudo vem do projeto.md. A fronteira LinkFlow/SiteFlow não pode ser violada.**

---

## Vocabulário: "layout" e "base de nicho"

Para o usuário, **layout** é o visual do site (cores, tipografia, organização
das páginas). No código, cada layout é uma **base por nicho** do motor Astro
(`base`, `tema-03` … `tema-07`), com coleções e campos próprios. O
`projeto.md` registra `tema_pasta: <base>`. Ao falar com o usuário, dizer
sempre "layout"; "tema", "base" e `tema-05` são vocabulário interno.

O usuário escolhe **só entre os layouts que o LinkFlow entrega** (catálogo em
`_astro/src/config/catalogo-layouts.json`, também exibido na tela Layout do
painel). Não existe "faça igual a este site": referência externa não é opção.

---

## As três regras de conversa (valem em todos os marcos)

O detalhe completo está em `CLAUDE.md › Rotina em marcos`. Aqui, o que esta
skill aplica:

1. **Um pedido por resposta.** Se o usuário precisa fazer algo, é uma coisa só.
2. **Estado em duas linhas** no fim de cada resposta:
   `Onde estamos: …` / `Falta para o próximo marco: …`. O resto fica no `projeto.md`.
3. **Vocabulário do usuário.** Nunca "PM2", "porta", "build", "dist", "propagação",
   "307". Diga "o site está no servidor, mas o endereço ainda não abre".
   Comando que o usuário precisa colar é exceção.

E duas regras de honestidade:

- **Ferramenta que falha não é ignorada.** Se um script, uma captura ou um
  comando falhar, pare e diga em uma frase o que falhou. Nunca siga adiante
  como se tivesse dado certo.
- **Script contornado é problema a reportar**, nunca nota de rodapé.

---

## Arquitetura (ler antes de qualquer ação)

```
_astro/                                   ← motor de REFERÊNCIA (todos os layouts + demos).
                                             Nunca é editado para um cliente, nunca é servido.

projetos/<slug>/projeto.md                ← estado do cliente
projetos/<slug>/site/_astro/              ← SITE LOCAL do cliente (Marco 1): cópia do motor
│                                            com só o layout escolhido. Não é versionado.
├── src/config/site.ts                    ← config do cliente (nasce como config de DEMONSTRAÇÃO)
├── src/content/{servicos,posts,equipe,depoimentos,autores,categorias}/
└── tema-ativo.json                       ← qual layout esta cópia usa

/opt/linkflow/clientes/<slug>/_astro/     ← cópia no SERVIDOR (Marco 2), criada pelo
                                             vps-setup com o MESMO layout do site local
```

Caminhos canônicos: `src/config/site.ts` e `src/content/<colecao>/`. Nunca por
slug de cliente. Nas instruções abaixo, `[SITE_LOCAL]` = `projetos/<slug>/site`.

---

# MARCO 1 — Aprovar o visual (localhost)

Sem domínio, sem servidor, sem custo. Termina quando o usuário aprova.

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
| psicólogo, terapeuta | `MedicalBusiness` (não existe tipo `Psychologist` no schema.org; descrever em `especialidade`) |
| dentista, odontologia | `Dentist` |
| clínica médica | `MedicalClinic` |
| fisioterapeuta | `Physiotherapy` |
| nutricionista | `MedicalBusiness` (não existe tipo `Nutritionist` no schema.org; descrever em `especialidade`) |
| advogado, advocacia | `LegalService` |
| contador, contabilidade | `AccountingService` |
| corretor de seguros, corretora de plano de saúde | `InsuranceAgency` |
| encanador, elétrica, higienização | `HomeAndConstructionBusiness` |
| outros | `LocalBusiness` |

Domínio e e-mail institucional **não** são necessários agora (ver Marco 2).

## ETAPA 0.5 — Coleta de identidade e prova social

**Obrigatória, sempre antes do guardião de construção.** Conduzir como conversa,
em blocos, **um bloco por resposta**, confirmando antes de avançar — nunca um
formulário longo de uma vez só.

### Parte 1 — Identidade visual

> "Você já tem uma logo pronta? Se sim, salve o arquivo em
> `projetos/<slug>/marca/` (qualquer formato — PNG, SVG, JPG) e me avise
> o nome do arquivo. Não cole a imagem aqui no chat — arquivos colados
> no chat não são salvos em disco, então eu não consigo usar."

SE tiver logo: copiar para `[SITE_LOCAL]/_astro/public/marca/` (depois da
ETAPA 2) e usar no config. Registrar `logo_status: fornecida` no projeto.md.

SE não tiver: nunca gerar nem redesenhar a logo — isso vira uma logo
aproximada, não a real do cliente. Explicar:

> "Sem problema. Vou usar o nome do negócio como texto estilizado no
> lugar da logo por enquanto. Isso fica registrado como pendência para
> vocês resolverem quando tiverem uma logo pronta."

Registrar `logo_status: pendente (usando wordmark textual)` — obrigatório,
nunca deixar esse campo de fora.

Perguntar também:
> "Tem cores da marca definidas (mesmo que só 'o azul do meu logo')?
> Se não tiver, uso a paleta do layout."

Registrar `cores_marca: [hex ou "padrão do layout"]`.

### Parte 2 — Layout (o usuário não escolhe às cegas)

**Não pergunte "qual layout você quer?" antes de ele ver nada.** O caminho é:

1. O agente escolhe o **layout inicial** pela tabela da ETAPA 1 (é só uma
   sugestão pelo nicho) e registra `tema_pasta`.
2. O usuário vê a prévia no localhost (ETAPA 5).
3. Se quiser outro, vê os demais na vitrine e escolhe **olhando**
   (ETAPA 5.3).

Perguntar apenas, se ainda não souber:
> "Tem alguma cor ou estilo que definitivamente NÃO combina com a marca de vocês?"

Registrar `evitar_visual: [o que não usar, se informado]`.

### Parte 3 — Dados institucionais

Não tratar como opcional silencioso — perguntar ativamente:

> "Preciso de mais alguns dados para o rodapé e para o site aparecer
> corretamente no Google: razão social e CNPJ."

Registrar `razao_social`, `cnpj` no projeto.md. Se o cliente não tiver CNPJ
(MEI em abertura, autônomo), registrar `cnpj: não possui` explicitamente —
nunca deixar o campo ausente sem explicação.

(O e-mail institucional é pedido no Marco 2. Na prévia, ele aparece como `[CAMPO]`.)

### Parte 4 — Prova social

> "Para o site parecer real e confiável, preciso de:
> - Fotos reais do local, da equipe ou do trabalho (salve em
>   `projetos/<slug>/marca/fotos/` e me avise)
> - Algum depoimento de cliente, mesmo que informal (print de WhatsApp,
>   avaliação do Google)
> - Os 2 ou 3 maiores diferenciais em relação à concorrência
> - Em que ano o negócio começou"

Registrar `fotos_status`, `depoimentos`, `diferenciais`, `ano_fundacao` no
projeto.md. Se o cliente não tiver fotos reais ainda, registrar
`fotos_status: pendente` — nunca usar banco de imagens genérico sem essa
pendência estar explícita (ela aparece na lista do Marco 3).

## GUARDIÃO DE CONSTRUÇÃO — Executar ANTES de qualquer arquivo

```bash
python scripts/guardiao_construtor.py --slug <slug> --fase construcao
```

**Se retornar FAIL: parar e corrigir os bloqueios.** Os comuns são NAP
incompleto, `tema_pasta` ausente, serviços não definidos e Fase 2 técnica não
concluída. **Domínio e e-mail não bloqueiam aqui** — viram aviso. Se PASS,
seguir.

## ETAPA 1 — Layout inicial (sugestão pelo nicho)

Ler `_astro/src/config/catalogo-layouts.json`. A tabela é **só o ponto de
partida**; o usuário decide olhando a prévia:

| Segmento | Layout inicial (`tema_pasta`) |
|---|---|
| saúde, clínica, dentista, psicólogo, fisio, nutrição | `base` |
| contabilidade, consultoria, engenharia, arquitetura | `tema-03` |
| advocacia (profissão regulamentada com credencial) | `tema-05` |
| higienização, dedetização, pintura, jardinagem, limpeza, desentupidora | `tema-04` |
| caça-vazamento, elétrica, refrigeração, climatização, manutenção predial | `tema-06` |
| corretora de plano de saúde, seguros, consórcio, câmbio, crédito | `tema-07` |
| sem correspondência clara | `tema-03` (serviço profissional, o mais genérico) — dizer isso ao usuário |

Segmentos aparecem em mais de um layout (advocacia em 03 e 05; desentupidora
em 04 e 06). Nesse caso, escolha a linha da tabela e diga na mensagem da prévia
que existem outros para comparar.

Registrar `tema_pasta: <base>` no projeto.md. O nome do layout para o usuário
vem do campo `nome` do catálogo.

## ETAPA 2 — Preparar o site local

```bash
python scripts/preparar_site_local.py --slug <slug> --tema <tema_pasta>
```

Cria `[SITE_LOCAL]/_astro` a partir do motor de referência, promove o layout
escolhido (os outros somem só dessa cópia), apaga o conteúdo de demonstração e
instala as dependências. Se falhar, mostrar a mensagem do script em uma frase
e parar — não improvisar cópia manual.

`node --version` precisa ser ≥ 18; senão, orientar nodejs.org (LTS) e parar.

**Atenção — o `config/site.ts` que sobra é o config de DEMONSTRAÇÃO do layout**
(empresa, CNPJ, telefone e depoimentos fictícios). Ele existe para mostrar a
estrutura que as páginas esperam. Substituí-lo campo a campo é obrigatório
(ETAPA 4.2); o guardião da prévia bloqueia se sobrar qualquer valor de
demonstração.

## ETAPA 3 — (reservada)

A antiga etapa de infraestrutura mudou para o Marco 2 (ETAPA 6). Nada acontece
com servidor antes da aprovação do visual.

## ETAPA 4 — Criar arquivos do cliente

Tudo dentro de `[SITE_LOCAL]/_astro/`, sempre com os mesmos caminhos
(`src/config/site.ts`, `src/content/<colecao>/`), sem aninhar por slug.

### 4.1 Pastas de conteúdo

Já existem (a promoção as criou vazias). Confirmar:

```bash
ls [SITE_LOCAL]/_astro/src/content/
```

### 4.2 Substituir o config de demonstração

Abrir `[SITE_LOCAL]/_astro/src/config/site.ts`. **Não escrever um arquivo novo
do zero:** cada layout tem campos próprios que as páginas leem (`faq`,
`diferenciais`, `selos`, `numeros`, `passos`, `regioes`, `buscasFrequentes`,
`tags`, `legal`…), e faltar um deles quebra o build ou deixa a página vazia.
O trabalho é **manter a estrutura e trocar cada valor**:

- Campo com dado no projeto.md → preencher.
- Campo **sem** dado no projeto.md → `[CAMPO]` visível (regra permanente 1 do
  CLAUDE.md), e listar para a lista de pendências do Marco 3. Nunca deixar o
  valor de demonstração, nunca inventar.
- Listas de demonstração (depoimentos, selos, números, regiões atendidas):
  substituir pelo que o cliente forneceu ou esvaziar; nunca manter os fictícios.

Regras de formato que o motor e o painel SiteFlow (`/api/config`) exigem —
**não inventar nomes diferentes** (ex: nunca `negocio: {...}`, sempre `nap: {...}`;
nunca `redes: {instagram: ...}`, sempre `redes: [{nome, href}]` — objeto no lugar
de array quebra a leitura do painel silenciosamente):

```typescript
export const site = {
  nome:        "[nome_negocio]",
  slogan:      "[kw_principal] em [cidade]",
  // Prévia local: domínio provisório. É trocado pelo real no Marco 2 (ETAPA 6.2).
  dominio:     "https://seudominio.com.br",
  // Endereço do painel: destino do formulário de contato. VAZIO na prévia (o
  // formulário mostra "Prévia…" e não envia). Preenchido na ETAPA 6.2. Nunca inventar.
  painelUrl:         "",
  whatsappFlutuante: true,   // botão fixo do WhatsApp; só aparece se nap.whatsapp existir
  whatsappMensagem:  "",     // vazio = "Olá! Vim pelo site e gostaria de mais informações."
  cnpj:        [cnpj ou null],
  anoFundacao: [ano_fundacao ou null],

  nap: {
    logradouro: "[endereco_rua]",
    bairro:     "[bairro]",
    cidade:     "[cidade]",
    uf:         "[uf]",
    cep:        "[cep]",
    telefone:   "[telefone]",
    whatsapp:   "[só dígitos com 55 na frente — ex: 5511988887777]",
    email:      "[CAMPO]",   // e-mail institucional: pedido no Marco 2
  },

  horarios: [ { dia: "[ex: Segunda a Sexta]", hora: "[ex: 8h às 18h]" } ],  // um item por faixa
  redes:    [ /* { nome: "Instagram", href: "[instagram]" } — só as que o cliente tem */ ],

  nav: [ /* ver abaixo */ ],
  navFooterColunas: [ /* ver abaixo */ ],
};
```

Os campos acima são os que o painel e o guardião leem; o resto do objeto é o
que o layout já trazia — preencher como descrito.

**Pilar de oferta.** Na maioria dos layouts o pilar é `/servicos`. No
**tema-07** ele é `/planos` (o config traz `rotaPilar: '/planos'` — não remover).
Nas regras de `nav` e `navFooterColunas` abaixo, "pilar" = essa rota, e "item"
= serviço (ou plano).

**`nav`** — sempre incluir o pilar quando houver mais de 1 item; sem isso a
página pilar fica sem nenhum link apontando pra ela, alcançável só pelo
sitemap. Com mais de 1 item, incluir `filhos` (vira dropdown com link direto
para cada um). `Sobre`, `Contato` e `Blog` sempre presentes (a página `/blog`
existe e renderiza vazia).

**`navFooterColunas`** — a coluna do pilar precisa ter 1 item por serviço/plano,
na mesma ordem: é o que garante que TODA página do site (não só a Home) tenha
link direto para cada um.

**Checklist antes de seguir — nada pode ficar com valor de demonstração:**
- `nome`, `cnpj`, `nap.*`, `horarios`, `redes`, `legal.controlador.*`
- `nap` (nunca `negocio`); `redes` como array, mesmo que vazio `[]`
- `nav` com o pilar (+ `filhos`) e `navFooterColunas` preenchida
- **Campos que alimentam o JSON-LD, o rodapé e o compartilhamento** — nenhum pode
  ficar com o valor da demonstração (o guardião reprova bloco igual ao do layout):
  `funcionamento` (horários estruturados: dias `seg`…`dom`, `abre`, `fecha`; o texto
  exibido em `horarios` é derivado), `areaAtendimento` (cidades/regiões que o cliente
  realmente atende), `schemaTipo` (tabela da ETAPA 0; só tipos que existem no
  schema.org), `descricao`, `razaoSocial`, `credencial` (`conselho`, `registro`,
  `responsavel`, só se o negócio for regulado), `logo` (`src` = `/midia/...`),
  `favicon`, `ogImagem`. Sem dado do cliente: **remova o campo** (a página omite a
  propriedade) — nunca deixe o exemplo. `atendimentoOnline` e `faixaPreco` só se o
  cliente informou.
- `dominio` = `https://seudominio.com.br` (provisório) — nunca o domínio do layout de demonstração

### 4.3 Gerar páginas de serviço

Para cada serviço do projeto.md, criar
`[SITE_LOCAL]/_astro/src/content/servicos/[slug-servico].md` (no tema-07,
também é `servicos/` — só a rota pública é `/planos`).

**Sempre incluir `noindex: true` no frontmatter** — a página nasce com
texto de estrutura ("[2-3 parágrafos]"), não pode ficar indexável até a
Fase 3 escrever o conteúdo real e trocar para `noindex: false` (ver
`fase3-conteudo`, CAMINHO ASTRO).

Nomes de campo são os do schema da coleção `servicos` em
`[SITE_LOCAL]/_astro/src/content.config.ts` — **ler o schema do layout
escolhido**: cada um tem campos próprios (ex: `quemPode`/`situacoes` no tema-05,
`sinais`/`tecnologias` no tema-06, `coberturas`/`vidasMin` no tema-07).
`titulo` (até 70 chars) e `metaDescription` (80 a 165 chars, **obrigatório** —
sem ele o build do site inteiro falha). Nunca `descricao`. Campo opcional sem
dado no projeto.md é omitido, nunca inventado.

```markdown
---
titulo: "[Nome do Serviço] em [Cidade]"
metaDescription: "[80-165 chars com palavra-chave e cidade]"
kwPrimaria: "[serviço] em [cidade]"
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

**Não criar nenhum arquivo "pilar" separado.** A página pilar já é gerada
automaticamente pelo motor a partir dos arquivos desta pasta
(`getCollection('servicos')`, ordenados por `ordem`).

### 4.5 Política de privacidade e termos de uso

**Nunca criar essas páginas como arquivo de conteúdo.** Todos os layouts têm
essas rotas prontas (`politica-de-privacidade` e `termos-de-uso`): o texto legal
vem de `site.legal` no `config/site.ts`, lido pelo componente `ConteudoLegal` —
só falta preencher esse campo com os dados reais do cliente
(`controlador.razaoSocial`, `controlador.cnpj`, `controlador.endereco`,
`canalTitular`, etc. — a estrutura completa está no próprio config promovido).

As duas páginas são **obrigatórias e indexáveis em todos os layouts** (regra do
Jorge — lista fechada de 4 institucionais do `fase3-conteudo`). Os Termos de Uso
são documento próprio (7 seções, não reproduzem a política) e leem, além da
razão social/CNPJ de `site.legal.controlador`, o bloco `site.legal.termos`:
`naoSubstitui` (aviso de que o site não substitui o atendimento profissional,
escrito para o nicho do cliente), `foro.cidade`, `foro.uf` e `vigenciaDesde`.
Campo vazio aparece na página como "Publicação bloqueada".

Registrar `dados_status: ficticio` para a Política de Privacidade e Termos de
Uso enquanto `site.legal` não tiver os dados reais confirmados pelo cliente —
nunca publicar com CNPJ inventado sem essa pendência estar visível.

Se o arquivo de alguma das duas rotas não existir no layout (motor
desatualizado), registrar como pendência estrutural no `projeto.md`
(`institucionais_pendentes: politica-de-privacidade, termos-de-uso`) e avisar o
operador, em vez de inventar um caminho que não existe.

## ETAPA 5 — Prévia local e aprovação

### 5.1 Construir e conferir

```bash
cd [SITE_LOCAL]/_astro && npm run build
```

Se falhar, diagnosticar e corrigir (máx 3 tentativas): frontmatter inválido →
corrigir o campo; campo obrigatório faltando → adicionar; qualquer outro erro →
mostrar o output completo e parar. Não avançar com build quebrado.

Depois, o guardião da prévia (`LINKFLOW_DIR` = a pasta do site local):

```bash
LINKFLOW_DIR="[SITE_LOCAL]" python scripts/guardiao_construtor.py --slug <slug> --fase previa
```

FAIL → corrigir antes de mostrar qualquer coisa. Os avisos (logo, fotos, e-mail,
prova social) **não bloqueiam** a prévia, mas vão para o registro de pendências
do `projeto.md` (`pendencias_site:`), uma linha cada — elas só voltam ao usuário
no Marco 3.

### 5.2 Subir a prévia e fazer UM pedido

Servir o site local com o servidor de desenvolvimento (não use `npm run preview`:
ele não serve `/midia/*`, e as fotos/PDFs enviados pelo painel local não apareceriam):

```bash
cd [SITE_LOCAL]/_astro && npm run dev -- --port 4321 --host 127.0.0.1
```

O plugin `integracoes/midia-dev.mjs` (já ligado no `astro.config.mjs`) serve
`/midia/*` a partir de `[SITE_LOCAL]/midia/` (a pasta que o `preparar_site_local.py`
cria ao lado de `_astro/`), só na prévia — nada disso vai para o build nem para o servidor.
Se o painel local for aberto, subir com `LINKFLOW_DIR=[SITE_LOCAL]`, para ele gravar as
mídias nessa mesma pasta (`[SITE_LOCAL]/midia`).

(rodar em segundo plano; se a porta estiver ocupada, usar 4325 e dizer o endereço certo.)

Resposta ao usuário — **exatamente um pedido**:

> "A prévia do seu site está pronta, no layout **[nome do layout]**.
> Abra **http://localhost:4321** no seu navegador, navegue como se fosse um
> cliente e me diga o que quer mudar — ou diga **aprovado** se estiver bom.
> (Se quiser comparar com outros layouts, tenho uma vitrine em
> http://localhost:4322/catalogo — é só me pedir para abri-la.)
>
> Onde estamos: prévia local do site, sem nada publicado.
> Falta para o próximo marco: a sua aprovação do visual."

Sem lista de pendências, sem servidor, sem domínio. Se o usuário abrir a tela
Layout do painel local, os links de demonstração usam a vitrine na porta 4322.

### 5.3 Rodadas de ajuste

A cada pedido do usuário:

- **Ajuste de texto, cor, imagem ou seção dentro do mesmo layout** → editar
  `config/site.ts` / `content/`, refazer `npm run build`, rodar o guardião da
  prévia, avisar "pronto, atualize a página". Se a página não atualizar,
  reiniciar o servidor da prévia.
- **Quer ver outros layouts** → subir a vitrine (motor de referência, com todos
  os layouts e conteúdo fictício):

  ```bash
  cd _astro && npm ci && npx astro dev --port 4322
  ```

  (rodar em segundo plano; `npm ci` só se ainda não tiver `node_modules`). Dizer:
  "Abra **http://localhost:4322/catalogo**, veja cada demonstração e me diga qual
  prefere." Um pedido só.
- **Escolheu outro layout** → registrar o novo `tema_pasta` no projeto.md, refazer
  `python scripts/preparar_site_local.py --slug <slug> --tema <novo>` (refaz a
  cópia local; o `node_modules` é preservado), **regerar config e conteúdo a partir
  do projeto.md no esquema do layout novo** (ETAPA 4 de novo — não há migração
  campo a campo, porque cada layout tem campos próprios), build, guardião, e
  voltar à 5.2. Nada foi publicado, então nada se perde.
- **Pediu algo que nenhum layout faz** (ex: "quero igual ao site X") → explicar em
  uma frase que o LinkFlow entrega estes layouts, oferecer a vitrine e o ajuste de
  cores/textos dentro do layout. **Não construir estrutura nova.**

### 5.4 Aprovação

**Aprovação é uma frase explícita do usuário** ("aprovado", "pode publicar",
"gostei, vamos"). Silêncio, elogio vago ou "tá quase" não são aprovação.

Ao aprovar: registrar em `## Estado das Fases` do projeto.md:

```
visual_aprovado: sim
visual_aprovado_em: [data]
tema_pasta: [layout final]
```

Encerrar o servidor da prévia (e a vitrine, se estiver de pé) e seguir para o
Marco 2. Enquanto `visual_aprovado` não for `sim`, **nada é publicado**.

---

# MARCO 2 — Colocar no ar

Só começa depois de `visual_aprovado: sim`. **Uma tarefa por vez**, na ordem abaixo.

## ETAPA 6 — Publicar

### 6.1 Gate de publicação (um pedido por resposta)

```bash
python scripts/guardiao_construtor.py --slug <slug> --fase publicacao
```

Ele exige `visual_aprovado: sim`, domínio real, e-mail institucional e
`tema_pasta` válido. Pedir o que falta **uma coisa por vez**, nesta ordem:

1. Domínio — "Qual é o endereço do seu site (ex: `minhaempresa.com.br`)? Se ainda não
   registrou, esse é o momento — me avise quando tiver." → registrar `dominio:` no
   projeto.md e `dominio_painel: painel.[dominio]`.
2. E-mail institucional — "Qual e-mail devo usar no site e nos contatos?" → registrar
   `email_institucional:`.

Só seguir com o gate em PASS.

### 6.2 Regerar com o domínio real

No site local: em `config/site.ts`, trocar `dominio` para `https://[dominio]`,
`nap.email` e `legal.controlador.email` (e demais campos de contato legal) para o
e-mail real. Refazer o build e conferir:

```bash
cd [SITE_LOCAL]/_astro && npm run build
grep -rl "seudominio" dist || echo "sem placeholder de domínio"
```

Nenhum arquivo pode ter sobrado com `seudominio`. Sitemap, robots, dados
estruturados e contato passam a sair com o domínio real neste build.

**Formulário de contato → painel.** No mesmo `config/site.ts`, preencher
`painelUrl` com `"https://painel.[dominio]"` (é o mesmo endereço que a `vps-setup`
usa como `DOMINIO_PAINEL` e que está em `dominio_painel:` no projeto.md — os dois
têm de ser idênticos). Sem `painelUrl` o formulário do site **não envia** e o lead
nunca chega ao painel; o guardião de saída bloqueia se estiver vazio. Conferir
depois do build:

```bash
grep -rl 'name="lf-painel-url"' dist | head -1 || echo "ERRO: painelUrl não entrou no HTML"
```

O botão flutuante de WhatsApp e o "Continuar no WhatsApp" pós-envio usam
`nap.whatsapp` (sem número, não aparecem) e não precisam de mais nada.

### 6.3 Servidor (infraestrutura)

Invocar a skill `vps-setup` — **Parte A (PASSOS 0 a 4)**. Ela pede os dados do
servidor (um único pedido) e prepara tudo. **O layout do servidor é o mesmo do site
local**: passe como `TEMA` exatamente o conteúdo de `[SITE_LOCAL]/_astro/tema-ativo.json`
(campo `tema`), nunca outro valor.

Ao terminar, `## Ambiente VPS` do projeto.md tem `vps_ip`, `vps_porta`,
`vps_cliente_dir`, `vps_site_dir`, `dominio`, `dominio_painel`, `tema_promovido`.

### 6.4 Enviar o site e publicar

Enviar do site local para a cópia do servidor (fontes, não o build — o build
acontece lá; `[SITE_LOCAL]` e o servidor têm o mesmo motor e o mesmo layout):

```bash
scp -P [vps_porta] -r "[SITE_LOCAL]/_astro/src"    root@[vps_ip]:"[vps_cliente_dir]/_astro/"
scp -P [vps_porta] -r "[SITE_LOCAL]/_astro/public" root@[vps_ip]:"[vps_cliente_dir]/_astro/"
```

Buildar e publicar no próprio servidor:

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

Se o build falhar no servidor, mesma regra da 5.1: diagnosticar, corrigir, no
máximo 3 tentativas — nunca publicar build quebrado.

`npm ci` + `npm run build` no servidor pode levar vários minutos —
mesma regra de `vps-setup › Regra: comando longo nunca vira espera do
usuário`: rode em background, não pare agindo nem diga que está
"esperando resposta", e retome sozinho assim que o comando terminar. O
usuário nunca deveria precisar perguntar "terminou?" pra você continuar.

### 6.5 Endereço, SSL e acesso ao painel

Invocar `vps-setup` — **Parte B (PASSOS 5B a 7)**, uma tarefa por vez:

1. Pedir **só** o DNS: "Crie estes dois registros de DNS e me avise quando terminar." (com
   os valores prontos; sem PM2, portas nem termos de servidor)
2. Depois que o usuário avisar e o endereço apontar para o servidor: SSL.
3. Só depois: criar o administrador do painel e entregar o acesso.

Se o DNS ainda não apontou, dizer "o site já está no servidor, mas o endereço
ainda não abre — isso pode levar algumas horas" e **esperar**; não criar o admin
antes.

### 6.6 Teste de ponta a ponta: site → lead no painel

Só depois do administrador criado e do SSL do painel `ok`. Enviar um contato de
teste ao endpoint que o formulário usa e conferir que ele aparece na tela de
Leads do painel (Origem = página `/teste-instalacao`):

```bash
curl -s -X POST "https://painel.[dominio]/api/submissao"   -H "Content-Type: application/json" -H "Origin: https://[dominio]"   -d '{"formularioId":"contato","nome":"Teste de instalação","email":"","telefone":"","mensagem":"Teste automático do formulário — pode apagar.","_hp":"","paginaOrigem":"/teste-instalacao","lgpdAceite":false,"camposExtras":{}}'
```

Deve responder `{"ok":true,...}`. Se responder erro de validação, falha de rede ou
CORS, **parar e avisar** ("o formulário do site ainda não entrega os contatos") —
nunca reportar o site como pronto. Pedir ao usuário, como **um único pedido**,
que abra o painel > Leads e apague o contato de teste (ou apague pela API, se
disponível). Se o `painelUrl` do site estiver vazio, é o defeito a corrigir aqui.

## GUARDIÃO DE SAÍDA — Executar ANTES de reportar "no ar"

```bash
python scripts/guardiao_construtor.py --slug <slug> --fase saida
```

**Se retornar FAIL: NÃO reportar "no ar". Corrigir os bloqueios primeiro.** Os comuns:
- Build não foi executado (site ainda mostra a página "Em breve")
- sitemap.xml ausente, vazio, com domínio diferente do `projeto.md` ou com URL
  `/blog/<slug>` / `/servicos/<slug>`. O sitemap é gerado sozinho no build
  (`_astro/integracoes/sitemap-canonico.mjs`, a partir da canonical de cada página,
  sem as `noindex`) — **nunca criar `public/sitemap.xml` à mão**.
- robots.txt com placeholder de domínio
- Conteúdo genérico detectado nos arquivos de serviço
- Dado de demonstração do layout ainda no config
- Config do cliente com campos vazios (domínio, telefone)

Se PASS, ETAPA 7.

---

## ETAPA 7 — Atualizar projeto.md e resumo final

Preencher `## Ambiente de Publicacao` (as credenciais SSH do VPS ficam só na
sessão, nunca no projeto.md):

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
tema_pasta: [layout]
```

### Resumo final — Marco 2 concluído

**Um pedido: o do Marco 3.** As pendências reais (logo, fotos, depoimentos, CNPJ,
e-mail, campos `[CAMPO]`, avisos do guardião) **aparecem aqui, agora**, porque é a
vez delas — cada uma na própria linha, nunca agrupadas em "outras pendências
menores", nunca omitidas. Reler `pendencias_site:` e os campos da ETAPA 0.5.

**Sem nenhuma pendência:**

```
✅ Seu site está no ar.

Endereço:  https://[dominio]
Painel:    https://painel.[dominio]  (e-mail e senha entregues acima)
Layout:    [nome do layout]

Onde estamos: site publicado com o conteúdo de estrutura.
Falta para o próximo marco: escrever o conteúdo real de cada página.

Próximo passo:  /link-flow conteudo [slug]
```

**Com pendências** (formato obrigatório):

```
✅ Seu site está no ar — falta preencher alguns dados.

Endereço:  https://[dominio]
Painel:    https://painel.[dominio]
Layout:    [nome do layout]

Para tirar o site do modo rascunho, preciso destes itens — e o que cada um libera:
1. [item] — [o que libera. Ex: "Logo: troco o nome em texto pelo seu logotipo."]
2. [item] — [o que libera]
[... uma linha por pendência]

Onde estamos: site publicado com o conteúdo de estrutura.
Falta para o próximo marco: os itens acima e o texto real de cada página.

Próximo passo:  /link-flow conteudo [slug]
```

---

## Degradação

| Situação | Ação |
|---|---|
| Node.js não instalado ou < 18 | Orientar nodejs.org → LTS e parar |
| `_astro/` não encontrado | Orientar que o motor precisa estar na pasta do LinkFlow |
| `preparar_site_local.py` falha | Mostrar a mensagem em uma frase e parar; não copiar à mão |
| Porta 4321/4322 ocupada | Usar outra livre e dizer o endereço certo ao usuário |
| Build local falha 3x | Reportar o output completo e parar |
| Usuário pede layout que não existe / "igual ao site X" | Explicar em uma frase, oferecer a vitrine; não construir estrutura nova |
| Usuário some sem aprovar | Manter `visual_aprovado` ausente; **nada é publicado** |
| SSH/VPS não conecta | `vps-setup` tem a degradação própria para SSH |
| Upload parcial | Registrar arquivos com erro, tentar de novo |
| DNS propagando | Informar e orientar aguardar (até algumas horas); não criar o admin antes |
| Infraestrutura do servidor ausente ou inacessível | `vps-setup` — nunca publicar sem ela |
