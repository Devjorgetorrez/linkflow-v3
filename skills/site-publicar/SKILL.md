---
name: site-publicar
description: >
  Publica um artigo gerado pelo LinkFlow no site Astro do cliente.
  Salva o arquivo .md em src/content/posts/, envia via SSH e builda
  direto no VPS — enviando só os arquivos novos ou alterados. Equivalente
  ao blog-publicar para sites Astro (sem Novamira, sem WordPress).
  Funciona em Claude Code Desktop (Windows) e Claude Code CLI em VPS
  (Linux). Invocado por /link-flow publicar <slug> quando site_tipo =
  astro no projeto.md.
user-invokable: false
---

# site-publicar — Publicação de Artigo em Site Astro

> **Antes de qualquer comando no servidor, leia `skills/vps-setup/ambientes.md`.**
> O Link Flow roda em 3 cenários (Windows → VPS externa; Linux na VPS → ela
> mesma; Linux na VPS → outra VPS). Os `ssh`/`scp`/`rsync` abaixo mostram a
> forma remota: **nunca os execute como estão** — traduza pelo
> `scripts/vps/lf_vps.py` (tabela no `ambientes.md`), que decide sozinho entre
> SSH e execução local.

Recebe o artigo já escrito pelo LinkFlow, salva como `.md` no conteúdo
do Astro, envia via SSH e builda direto no VPS.
O cliente não precisa fazer nada — o site atualiza automaticamente.

## REGRAS RÍGIDAS

1. Nunca publica sem artigo `.md` gerado pelo blog-write
2. Nunca sobrescreve slug existente sem confirmação
3. Se o build falhar, não publica — corrigir antes de enviar
4. Registrar tudo no projeto.md após publicação bem-sucedida

---

## PASSO 1 — Localizar projeto e validar ambiente

### 1.1 Ler projeto.md

Localizar `projetos/<slug>/projeto.md`. Extrair `site_tipo` (registrado
pelo `orq-icp` na raiz do projeto.md, não dentro de uma seção — buscar
livre por `site_tipo:` no arquivo inteiro). Extrair de `## Ambiente VPS`
(registrado pelo `vps-setup`):

```
vps_ip:           IP do VPS
vps_porta:        porta SSH (default 22022)
vps_cliente_dir:  pasta do cliente no VPS (ex: /opt/linkflow/clientes/<slug>)
vps_site_dir:     pasta do site publicado (ex: /var/www/<slug>)
dominio:          domínio do site
```

Se qualquer campo VPS estiver vazio:
> "Infraestrutura do servidor não configurada. Execute /link-flow site <slug> primeiro."
Parar.

Se `site_tipo` não for `astro`:
> "Este projeto usa WordPress/Novamira. Use /link-flow publicar <slug> normal."
Parar.

### 1.2 Localizar o artigo gerado

O blog-write salva em `projetos/<slug>/rascunhos/<slug-artigo>/<slug-artigo>.md`.

Verificar se o arquivo existe:

```bash
ls "projetos/<slug>/rascunhos/<slug-artigo>/<slug-artigo>.md"
```

Se não encontrar, verificar também `.html` (o blog-write pode ter gerado HTML).
Se não encontrar nenhum dos dois, parar:
> "Artigo não encontrado em projetos/<slug>/rascunhos/. Execute o blog-write primeiro."

### 1.3 Verificar se o slug já existe no conteúdo

```bash
ls "_astro/src/content/posts/<slug-artigo>.md" 2>/dev/null
```

Se existir, perguntar ao operador:
> "⚠️ Já existe um arquivo com esse slug no conteúdo do site:
> `_astro/src/content/posts/<slug-artigo>.md`
>
> O que fazer?
> (1) Sobrescrever — atualizo o conteúdo mantendo a URL
> (2) Usar outro slug — qual slug usar?
> (3) Cancelar"

Registrar a escolha antes de continuar.

---

## PASSO 2 — Adaptar o artigo para o formato Astro

O blog-write gera HTML para WordPress. Precisamos do frontmatter correto
para o Astro.

### 2.1 Ler o frontmatter do artigo gerado

Extrair do arquivo `.md` ou `.html`, já com o nome de campo FINAL do site
(schema `posts` em `_astro/src/content.config.ts` — nunca o nome do
gerador WordPress, mesmo como nome intermediário: já causou o build
quebrar antes por usar `descricao`/`imagemHero` em vez do campo real):
- `title` → `titulo`
- `description` → `metaDescription` (nunca `descricao`)
- `focuskw` → `kwPrimaria` (nunca `palavraChave`: nome antigo, só o painel o lê como alias de posts velhos)
- `coverImage` → `imagemCapa` (nunca `imagemHero` — se existir)
- data de publicação → `publicadoEm`
- resumo curto do artigo (se o gerador entregou) → `resumo`
- título de SEO diferente do H1 (se existir) → `seoTitle`
- perguntas e respostas da seção FAQ do artigo → `faq` (ver 2.3)

### 2.2 Converter HTML para Markdown (se necessário)

Se o arquivo for `.html`, extrair o conteúdo do `<body>` e converter para
Markdown usando Python:

```python
import re

with open("artigo.html", encoding="utf-8") as f:
    html = f.read()

# Extrair body
body = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
conteudo = body.group(1) if body else html

# Conversões básicas
conteudo = re.sub(r'<h([1-6])[^>]*>(.*?)</h\1>', lambda m: '#' * int(m.group(1)) + ' ' + m.group(2), conteudo, flags=re.DOTALL)
conteudo = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n\n', conteudo, flags=re.DOTALL)
conteudo = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', conteudo, flags=re.DOTALL)
conteudo = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', conteudo, flags=re.DOTALL)
conteudo = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', r'[\2](\1)', conteudo, flags=re.DOTALL)
conteudo = re.sub(r'<[^>]+>', '', conteudo)
conteudo = re.sub(r'\n{3,}', '\n\n', conteudo).strip()
```

### 2.3 Montar o arquivo .md final

Criar `_astro/src/content/posts/<slug-artigo>.md`:

```markdown
---
titulo: "[titulo extraído — até 70 chars]"
metaDescription: "[descricao extraída — 80 a 165 chars, OBRIGATÓRIA para publicar]"
kwPrimaria: "[focuskw]"
categoria: "[slug do arquivo em content/categorias/ — ver regra abaixo]"
autor: "[slug do autor — ver regra abaixo]"
publicadoEm: "[data atual em YYYY-MM-DD, entre aspas]"
atualizadoEm: "[data atual em YYYY-MM-DD, entre aspas]"
status: pronto
destaque: false
imagemCapa: "[coverImage se existir, senão omitir]"
imagemCapaAlt: "[descrição da imagem, se houver imagemCapa]"
geradoPorIA: true
---

[conteúdo do artigo em Markdown]
```

**`geradoPorIA: true` é obrigatório** neste arquivo: todo artigo que passa
por aqui foi gerado pelo agente (regra 1: vem do blog-write). O painel usa o
campo para mostrar o selo "IA". Nunca gravar `geradoPorIA` em artigo que o
usuário escreveu (esses nascem no painel, sem o campo).

**Campos opcionais do post** (schema `posts`; omitir o que não houver, nunca
inventar; o site ignora campo ausente):

| Campo | O que é | Regra |
|---|---|---|
| `seoTitle` | título da aba/Google, usado como está (sem o nome do site) | até 70 caracteres; só se for diferente do `titulo` |
| `resumo` | texto do card do blog; também vale de meta description se ela vier vazia | até 300 caracteres; frase real do artigo, não copiar chamada de venda |
| `canonical` | URL canônica absoluta | só quando o artigo republica conteúdo de outra URL do cliente; padrão é omitir |
| `noindex` | `true` esconde do Google e do sitemap | omitir (padrão `false`); só `true` se o operador pedir |
| `faq` | lista de `{ pergunta, resposta }` | SOMENTE as perguntas e respostas que já estão na seção FAQ do artigo; sem FAQ real, omitir. O site gera o FAQPage (JSON-LD) e a seção visível |
| `kwSecundarias` | lista de strings, uso interno (não aparece no site) | palavras-chave secundárias do briefing, se houver |
| `pilar` | slug da página de serviço (money page/pilar) que o artigo apoia; o site mostra "Saiba mais sobre <serviço>" com link | só o slug de um arquivo que EXISTE em `content/servicos/`; sem vínculo claro no briefing/calendário, omitir |
| `relacionados` | lista de slugs de posts (até 3) para "Posts relacionados"; substitui o automático | só slugs de posts que já existem e estão publicados; padrão é omitir (o site escolhe por categoria) |

Exemplo de `faq` no frontmatter:

```yaml
faq:
  - pergunta: "Pergunta exatamente como no artigo?"
    resposta: "Resposta exatamente como no artigo."
```

Se `faq` for gravado, remover a seção FAQ do corpo em Markdown para não
duplicar (o site já a renderiza no fim do artigo); se preferir manter o FAQ
no corpo, omitir `faq`.

Nomes de campo são os do schema do site (`_astro/src/content.config.ts`):
`metaDescription` (nunca `descricao`), `imagemCapa` (nunca `imagemHero`) e
`kwPrimaria` (nunca `palavraChave`). `atualizadoEm` (AAAA-MM-DD) vira o
`dateModified` do JSON-LD do artigo.
Com `status: pronto` o build **falha** se `metaDescription` tiver menos de
80 caracteres — é proposital: artigo sem meta description não vai ao ar.

**Regra do `autor`** — o artigo é assinado por uma PESSOA, com página
própria em `/autor/<slug>` (E-E-A-T). O valor de `autor:` é o **slug** de um
arquivo existente em `_astro/src/content/autores/<slug>.md`:
1. Se já existe autor cadastrado (pelo painel ou antes pelo agente), usar o
   slug dele. Com mais de um, usar o responsável pelo assunto do cluster.
2. Se não existe nenhum, criar `_astro/src/content/autores/<slug>.md` com
   os dados do responsável que o cliente informou no `projeto.md` (nome,
   cargo, conselho + registro, formação — Bloco A da Fase 3). Campo que o
   cliente não deu fica vazio, **nunca inventado**. Formato:
   ```markdown
   ---
   nome: "Nome Completo"
   cargo: "Cargo"
   conselho: "CRM-SP"
   registro: "000.000"
   bioCurta: "Uma ou duas frases."
   bioLonga: "Experiência, em prosa."
   especialidades: ["Especialidade 1", "Especialidade 2"]
   formacao: ["Curso — Instituição"]
   redes: {"linkedin": "https://..."}
   ---
   ```
   Se o cliente usar o painel, o cadastro de autor passa a ser feito lá
   (Usuários → "Pode assinar artigos") e o painel sobrescreve este arquivo.
3. Nunca usar o nome do negócio como autor.

**Regra da `categoria`** — a categoria agrega artigos e tem página própria
em `/<slug>` (raiz do site, igual serviço e artigo — nunca `/categoria/<slug>`).
O valor de `categoria:` é o **slug** de um arquivo existente em
`_astro/src/content/categorias/<slug>.md`:
1. Se já existe categoria cadastrada pro assunto do cluster (pelo painel ou
   antes pelo agente), usar o slug dela.
2. Se não existe nenhuma, criar `_astro/src/content/categorias/<slug>.md`
   com base no cluster do `projeto.md`. Formato:
   ```markdown
   ---
   nome: "Nome da categoria"
   descricao: "Uma frase sobre o que a categoria reúne."
   metaDescription: "80 a 165 caracteres, para a página da categoria."
   ordem: 1
   ---
   ```
   Se o cliente usar o painel, o cadastro de categoria passa a ser feito lá
   (Categorias) e o painel sobrescreve este arquivo.
3. Nunca inventar categoria fora do cluster real do artigo, e nunca usar o
   slug de um serviço ou de uma página fixa (sobre, contato, servicos, blog,
   autor, politica-de-privacidade, termos-de-uso) — colide na URL.

---

## PASSO 3 — Build Astro

```bash
cd _astro && npm run build
```

Monitorar output. Se falhar:

**Erro de frontmatter (campo obrigatório ou tipo errado):**
Corrigir o arquivo `.md` gerado no Passo 2 e tentar de novo.

**Erro de import ou componente:**
Não é problema do artigo — é problema do motor. Reportar ao operador e parar.

**Máximo 3 tentativas de correção.** Se ainda falhar na 3ª, parar:
> "O build falhou 3 vezes. Não vou publicar com build quebrado.
> Erro: [output do build]"

O build local aqui é só para conferir que o artigo não quebra nada antes
de enviar — o build que efetivamente vai para o servidor roda no PASSO 4,
direto no VPS.

---

## PASSO 4 — Enviar e publicar via SSH

Ler `## Ambiente VPS` do `projeto.md` (`vps_ip`, `vps_porta`,
`vps_cliente_dir`, `vps_site_dir`).

Enviar o artigo novo (e qualquer outro arquivo de conteúdo alterado)
para o VPS:

```bash
rsync -avz -e "ssh -p [vps_porta]" \
  "_astro/src/content/." \
  "root@[vps_ip]:[vps_cliente_dir]/_astro/src/content/"
```

Buildar e publicar no servidor:

```bash
ssh -p [vps_porta] root@[vps_ip] << REMOTE
  cd "[vps_cliente_dir]/_astro"
  rm -rf .astro node_modules/.astro
  npm run build

  cp -r "dist/." "[vps_site_dir]/"

  echo "Build e deploy OK"
REMOTE
```

`rm -rf .astro node_modules/.astro` **sempre**, antes do build no servidor:
sem isso o cache de content collections pode servir uma versão antiga (ex.:
um depoimento apagado volta ao ar) — erro 87, Relatório de Testes 6.

> A mídia do painel fica em `[vps_cliente_dir]/midia` (fora de `[vps_site_dir]`) e o Nginx
> a serve por `alias`. Este `cp -r` (sem `--delete`) nunca a toca. Nunca acrescentar
> `--delete`/`rm` sobre `[vps_cliente_dir]/midia`.

Se o build falhar no servidor, mesma regra: até 3 tentativas, nunca
publicar build quebrado.

`npm run build` no servidor pode levar minutos — regra de
`vps-setup › Regra: comando longo nunca vira espera do usuário`: rode em
background e retome sozinho quando terminar, sem parar dizendo que está
"esperando resposta". Vale ainda mais quando este PASSO roda sem ninguém
acompanhando (publicação agendada via `schedule`) — não existe usuário
pra mandar "terminou?".

Se o `rsync`/SSH falhar:
- Tentar de novo (até 3x)
- Se persistir: reportar o erro completo

---

## PASSO 5 — Verificar publicação

```bash
# Verificar se a URL do artigo está respondendo
curl -s -o /dev/null -w "%{http_code}" "https://[dominio]/<slug-artigo>"
```

- 200 → artigo publicado ✅
- 404 → verificar se o build gerou a página corretamente
- 000 → erro de rede ou DNS

Se retornar 404, verificar no servidor:

```bash
ssh -p [vps_porta] root@[vps_ip] \
  "ls [vps_cliente_dir]/_astro/dist/<slug-artigo>/index.html"
```

Se o arquivo não existir no dist, o frontmatter pode estar com `status: rascunho`.
Corrigir para `status: pronto` e repetir a partir do Passo 3.

---

## PASSO 6 — Registrar no projeto.md

### 6.1 Atualizar calendário

Localizar a linha do artigo em `## Calendário de Blog`.
Trocar `| pendente |` por `| publicado |`.

### 6.2 Atualizar registro de publicações

Adicionar à seção `### Registro de Publicações` (criar se não existir):

```markdown
| [kwPrimaria] | [titulo] | https://[dominio]/[slug-artigo] | [data] |
```

### 6.3 Atualizar data do último deploy

Em `## Ambiente de Publicacao`:
```
ultimo_deploy: [data e hora]
```

---

## PASSO 7 — Apresentação final

```
✅ Artigo publicado no site.

Título:    [titulo]
KW:        [kwPrimaria]
URL:       https://[dominio]/[slug-artigo]
Tipo:      [Pilar | Satélite]

Deploy via SSH: OK
Build: OK · Deploy: OK

Próximo na fila: [título do próximo artigo pendente]
Para publicar: /link-flow publicar <slug>
```

---

## Degradação

| Situação | Ação |
|---|---|
| `site_tipo` não é `astro` | Redirecionar para blog-publicar e parar |
| Infraestrutura VPS não configurada | Orientar a rodar /link-flow site <slug> primeiro |
| Artigo `.md` não encontrado | Orientar a rodar blog-write primeiro |
| Slug já existe | Perguntar ao operador (sobrescrever, renomear ou cancelar) |
| Build falha 3x | Reportar erro completo e parar |
| rsync/SSH falha parcialmente | Listar arquivos com erro, tentar de novo |
| curl retorna 404 | Verificar dist, corrigir status do frontmatter |
| DNS propagando | Informar e orientar aguardar |
