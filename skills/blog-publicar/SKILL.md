---
name: blog-publicar
description: >
  Produz e publica um artigo do calendário editorial aprovado para projetos Link Flow.
  Lê a fila em "## Calendário de Blog" do projeto.md, seleciona o próximo artigo
  pendente (pilar antes de satélite), monta o briefing com links internos resolvidos,
  chama /blog write em modo lote (sem gate de outline), e publica o HTML como rascunho
  via MCP Novamira do cliente. Invocado por /link-flow publicar <slug>.
  MODO TESTE: 1 artigo por execução, sem guardião de saída, sem loop de semana.
  NÃO usa /ranqueado escrever. NÃO usa loop automático.
user-invokable: true
argument-hint: "<slug-do-cliente>"
---

# Blog Publicar — Produção e Publicação de Artigos Link Flow

Produz 1 artigo do calendário editorial e publica como rascunho no WordPress via Novamira.
**Modo teste**: 1 artigo por execução, sem guardião de saída, sem loop.

## REGRAS RÍGIDAS — NUNCA VIOLAR
1. Nunca produz artigo sem ao menos 1 artigo `pendente` no calendário
2. Nunca produz satélite antes do pilar do cluster estar `publicado`
3. Nunca publica como `publish` — SEMPRE `draft`
4. Nunca chama `/ranqueado escrever` — SEMPRE `/blog write`
5. O briefing enviado ao blog-write DEVE conter instrução explícita de modo lote (pular gate Phase 3)
6. Novamira só é chamado se `novamira_mcp` estiver configurado no projeto.md
7. Se o blog-write não gerar o HTML (Phase 6.5 bloqueou), registrar `falhou` e parar — não tentar de novo
8. NUNCA passar o body content inline (como string direta ou base64 dividido em partes) no parâmetro PHP do execute-php — SEMPRE usar o método upload-link (6.5 Caminho B)

---

## PASSO 1 — Localizar e validar o projeto

### 1.1 Localizar o projeto.md
Se slug passado como argumento: usar `projetos/<slug>/projeto.md`.
Se não: listar diretórios em `projetos/`, exibir os slugs disponíveis e perguntar "Qual cliente?"

Ler o projeto.md. Extrair:
- Cidade / região
- Nicho / segmento (campo Info Basica)
- Tom de Voz (campo Tom de Voz / Restricoes)
- Restrições Legais (campo Restricoes Legais — se `regulado: true`, incluir no briefing)
- Público-alvo (campo ICP)
- `novamira_mcp` (campo Ambiente de Publicacao)
- `## Money Pages` — tabela completa (Slug + KW principal)
- `## Calendário de Blog` — tabela de artigos

### 1.2 Verificar novamira_mcp
Buscar o campo `novamira_mcp:` dentro de `## Ambiente de Publicacao`.

Se o campo **não existir** ou estiver vazio / com valor `[A CONFIGURAR]`:
```
⚠️  Novamira não configurado para este projeto.

Adicione ao projeto.md, dentro da seção "## Ambiente de Publicacao":
  novamira_mcp: <nome-do-servidor-mcp>

Exemplo: novamira_mcp: novamira-letage-com-br
(O nome é o prefixo dos tools mcp__<nome>__*)

Não é possível publicar sem esse campo. Configure e rode novamente.
```
**Parar.**

### 1.3 Verificar calendário
Se `## Calendário de Blog` não existir no projeto.md:
→ "Calendário não encontrado. Execute /link-flow calendario <slug> primeiro."

Se não houver nenhuma linha com `| pendente |`:
→ "Nenhum artigo pendente. Calendário concluído ou ainda não gerado."

---

## PASSO 2 — Selecionar o artigo

### Regra de seleção (estrita, nesta ordem)

1. Filtrar todas as linhas da tabela com Status = `pendente`
2. Verificar dependência de cluster para cada satélite:
   - Satélite cujo pilar (coluna Cluster) NÃO esteja marcado como `publicado` na tabela → **não elegível**
3. Selecionar na ordem em que aparecem na tabela:
   - **Primeiro pilar pendente encontrado** → sempre elegível
   - Se nenhum pilar pendente: primeiro satélite elegível (pilar do cluster publicado)
4. Se nenhum artigo elegível: avisar e parar.

Registrar internamente:
```
artigo_selecionado:
  linha_tabela: [número da linha na tabela para substituição posterior]
  tipo: [Pilar | Satélite]
  titulo: [título da coluna Título]
  kw: [KW da coluna KW]
  volume: [volume da coluna Volume]
  cluster: [coluna Cluster — "—" se pilar]
  money_page: [coluna Money Page — ex: /cotacao-plano-de-saude-sorocaba/]
  slug_artigo: [kw com espaços substituídos por hífens, minúsculo]
```

---

## PASSO 3 — Montar o briefing

### 3.1 Resolver links internos

**Link para a Money Page vinculada:**
- URL: slug da coluna Money Page do calendário (ex: `/plano-de-saude-mei-sorocaba/`)
- Anchor: KW principal da Money Page correspondente em `## Money Pages` do projeto.md
  - Procurar a linha cuja coluna Slug bata com o slug do calendário
  - Extrair a coluna "KW principal" dessa linha

**Link para o pilar (se satélite):**
- URL: `/blog/<slug-kw-do-pilar>/` (derivar da KW do pilar: espaços → hífens, minúsculo)
- Anchor: KW do pilar (da coluna KW na tabela do calendário)

**Links para satélites já publicados do mesmo cluster (cross-linking):**
- Filtrar linhas do calendário com o mesmo Cluster E status `publicado`
- Para cada um: URL = `url_rascunho` do `### Registro de Publicações`, anchor = KW do satélite

### 3.2 Construir o briefing

```
=== BRIEFING MODO LOTE — Link Flow ===

⚠️  MODO LOTE ATIVO: NÃO pergunte aprovação do outline em nenhum momento.
    Pule o gate de aprovação da Phase 3 — gere o outline internamente e vá direto para a escrita.
    NÃO faça perguntas ao usuário em NENHUMA phase. Execute do início ao fim sem pausas.

KW principal: [kw do calendário]
Tipo de artigo: [Pilar | Satélite]
Cluster: [nome do pilar pai, se satélite | — se pilar]
Título sugerido: [título da coluna Título]
Plataforma: WordPress (output: HTML)
Draft folder: projetos/[slug]/rascunhos/[slug-artigo]/

Cidade: [cidade do projeto.md]
Nicho: [nicho do projeto.md — ex: corretor de planos de saúde]
Tom de voz: [tom definido no projeto.md — ex: Perfil 2 — Educativo e Confiante]
Público-alvo: [público-alvo do projeto.md]
Intenção do artigo: [informacional — para pilares e maioria dos satélites | comercial — para satélites com "melhor", "vale a pena", "comparação"]

[se regulado: true no projeto.md:]
Regulação: ANS — Agência Nacional de Saúde Suplementar
Restrições legais invioláveis:
[Restrições Legais do projeto.md, linha por linha]

Links internos obrigatórios (já resolvidos — substituir TODOS os [INTERNAL-LINK] por estes):
  1. [URL da Money Page] com anchor "[KW principal da Money Page]"
  [se satélite:]
  2. [URL do pilar do cluster] com anchor "[KW do pilar]"
  [para cada satélite publicado do mesmo cluster:]
  3. [url_rascunho do satélite publicado] com anchor "[KW do satélite]"

Regra de links internos: inserir no mínimo 1 link para a Money Page vinculada.
Nunca inventar URLs — usar apenas os slugs passados acima.

=== FIM DO BRIEFING ===
```

---

## PASSO 4 — Chamar /blog write

Invocar a skill `blog-write` passando o briefing completo do Passo 3.

O briefing contém `⚠️ MODO LOTE ATIVO` — o blog-write deve:
- Usar os dados do briefing em Phase 1 (sem perguntar ao usuário)
- Auto-selecionar template em Phase 1.5 (sem confirmar)
- Executar Phase 2 (pesquisa via WebSearch / blog-researcher)
- Gerar outline internamente em Phase 3 — **NÃO apresentar ao usuário, NÃO aguardar aprovação**
- Executar Phases 4, 5, 6, 6.5, 7 normalmente
- Salvar todos os arquivos em `projetos/<slug>/rascunhos/<slug-artigo>/`

Aguardar Phase 7 (entrega completa com HTML gerado).

---

## PASSO 5 — Verificar o HTML gerado

Após o blog-write concluir (Phase 7), verificar:

```
caminho_html: projetos/<slug>/rascunhos/<slug-artigo>/<slug-artigo>.html
```

**Se o arquivo existir:** continuar para PASSO 6.

**Se não existir** (Phase 6.5 bloqueou ou blog-write falhou):
```
⚠️  HTML não gerado. O blog-write falhou ou a Phase 6.5 bloqueou a entrega.
    Verifique: projetos/<slug>/rascunhos/<slug-artigo>/preflight-report.json
    Status registrado como: falhou
```
Atualizar projeto.md: trocar `| pendente |` por `| falhou |` na linha do artigo.
**Parar.**

---

## PASSO 6 — Publicar via Novamira

### 6.1 Carregar tools do MCP Novamira

Usar ToolSearch para carregar os schemas das tools do servidor configurado:
```
select:mcp__<novamira_mcp>__mcp-adapter-discover-abilities,mcp__<novamira_mcp>__mcp-adapter-execute-ability,mcp__<novamira_mcp>__mcp-adapter-get-ability-info
```
(substituir `<novamira_mcp>` pelo valor do campo `novamira_mcp` do projeto.md)

### 6.2 Descobrir a ability de criação de post

Chamar `mcp__<novamira_mcp>__mcp-adapter-discover-abilities` para listar abilities disponíveis.
Identificar a ability de criação de conteúdo/post (procurar por: `create_post`, `publish_content`,
`create_content`, `add_post`, ou equivalente).

Se encontrar → **Caminho A** (6.5 Caminho A): usar a ability nativa.
Se não encontrar → **Caminho B** (6.5 Caminho B): usar `novamira/execute-php` como fallback.
Não parar por ausência de ability nativa — o execute-php cobre todos os casos.

### 6.3 Extrair metadados do artigo

Ler o frontmatter do `<slug-artigo>.md` (ou do `<slug-artigo>.html`) gerado pelo blog-write:
- `title:` → **post_title** E **`_yoast_wpseo_title`** (B1: setar Yoast title explicitamente)
  O valor é o mesmo: o título com a focus keyword no início. Não deixar o WordPress montar o título sozinho.
- `description:` → **`_yoast_wpseo_metadesc`** (150-160 chars, contém focus keyword como frase)
- Focus keyword → **`_yoast_wpseo_focuskw`**: usar o campo `focuskw:` do frontmatter do artigo
  gerado pelo blog-write (contém a keyword exata com acentuação correta do português).
  Fallback: KW da coluna KW do calendário se o frontmatter não tiver campo `focuskw:`.

### 6.4 Extrair o body content (B3 — REGRA EXPLÍCITA)

**O que enviar ao WordPress: APENAS o conteúdo do `<body>` — NUNCA o HTML completo.**

Proibido enviar elementos do `<head>`: `<html>`, `<head>`, `<title>`, `<meta>`,
`<link rel="canonical">`, e os blocos `<script type="application/ld+json">` de `BlogPosting` e
`BreadcrumbList` (gerados automaticamente pelo Yoast).
**Exceção**: o bloco `FAQPage` JSON-LD é extraído do `<head>` e reinjetado no corpo — ver passo 5 abaixo.
Esses campos chegam ao WordPress pelos meta do Yoast (definidos em 6.3 e 6.5), não pelo corpo.

Procedimento:
1. Ler o arquivo `projetos/<slug>/rascunhos/<slug-artigo>/<slug-artigo>.html`
2. Extrair apenas o conteúdo entre `<body>` e `</body>` (sem as próprias tags)
   — Se o arquivo já foi salvo como body-only (sem wrapper HTML), usar diretamente
3. O body content começa no primeiro elemento do artigo (ex.: `<!-- COVER IMAGE -->` ou `<figure>`)
   e termina no último `</article>` ou elemento de fechamento do corpo
4. **Remover a primeira tag `<h1>…</h1>` do body content extraído.**
   O WordPress renderiza `post_title` como H1 via tema; enviar `<h1>` no corpo cria título duplicado.
   Remover apenas o primeiro `<h1>` completo (abertura + conteúdo + fechamento). O título já está
   garantido pelo campo `post_title` enviado em 6.5.

5. **Extrair o FAQPage JSON-LD do `<head>` e reinjetar no final do corpo:**
   - No `<head>` do HTML original, localizar o `<script type="application/ld+json">` cujo `"@type"` seja `"FAQPage"`
   - Guardar o bloco completo (incluindo as tags `<script>` de abertura e fechamento) como `$faqpage_schema`
   - Se não existir bloco FAQPage no HTML (artigo sem seção FAQ): `$faqpage_schema = ''` — continuar sem erro, sem avisos
   - **NÃO extrair** os blocos de `BlogPosting` ou `BreadcrumbList` — esses o Yoast gera automaticamente
   - Concatenar `$faqpage_schema` ao final do `$body_content` do passo 3:
     `$body_content = $body_content . "\n" . $faqpage_schema`
   - O `$wpdb->update` (Caminho B) bypassa o `wp_filter_post_kses()`, portanto o `<script>` é preservado intacto junto com os SVGs

### 6.4.5 — Verificar se o slug já existe (BLOQUEANTE)

Antes de qualquer criação de post, executar via bash:
```bash
python "${CLAUDE_PLUGIN_ROOT}/scripts/verificar_existe.py" --slug <slug-artigo> --tipo post --wp-url <WordPress URL do projeto.md>
```
Exit 0 = "livre" → prosseguir para 6.5.
Exit 1 = JSON com dados do post existente → PARAR e perguntar:
  "⚠️ Já existe um post com esse slug no WordPress:
   ID [x] · '[título]' · status [y] · criado em [data]

   O que fazer?
   (1) Reescrever — sobrescrevo o conteúdo, mantenho o ID e a URL
   (2) Deletar e criar do zero — mando para a lixeira e crio novo
   (3) Escolher outro slug para o artigo
   (4) Cancelar"

Registrar a escolha no projeto.md antes de prosseguir.
MOTIVO: o WP adiciona sufixo -2 silenciosamente ao criar post com slug duplicado — os links internos do cluster ficam quebrados.

### 6.5 Publicar

**REGRA INVIOLÁVEL**: `post_status` SEMPRE `"draft"`. Nunca `"publish"`. Nunca `"future"`.

---

#### Caminho A — Ability nativa encontrada em 6.2

Chamar `mcp__<novamira_mcp>__mcp-adapter-execute-ability` com a ability nativa.

```json
{
  "title":            "<título extraído em 6.3>",
  "content":          "<body content ONLY — extraído conforme 6.4, sem <html>/<head>>",
  "status":           "draft",
  "categories":       ["blog"],
  "meta_description": "<description extraída em 6.3>",
  "focus_kw":         "<KW do calendário>",
  "seo_title":        "<título extraído em 6.3>"
}
```

Após inserção, verificar se a ability setou `_yoast_wpseo_title`.
Se não setou, continuar para o bloco "Campos Yoast obrigatórios" abaixo.

---

#### Caminho B — Sem ability nativa: método upload-link (padrão único e obrigatório)

Este é o único método para publicação via execute-php. NUNCA passar body content inline.
Fluxo: preparar arquivo local → create-upload-link → PUT → PHP lê do disco via `file_get_contents`.

**B-0 — Preparar arquivo HTML local (Python — Windows e Linux)**

```python
# Stdlib pura, sem dependências externas. Roda em Windows e Linux.
import re, os, tempfile

with open(html_file, encoding="utf-8") as f:
    html = f.read()

# Extrair FAQPage do <head> (reinjetar no corpo ao final)
faq_match = re.search(
    r'(<script[^>]*type=["\']application/ld\+json["\'][^>]*>.*?"@type"\s*:\s*"FAQPage".*?</script>)',
    html, re.DOTALL)
faq_block = faq_match.group(1) if faq_match else ""

# Extrair body, remover primeiro <h1> (WP renderiza post_title como H1 via tema)
body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
body = body_match.group(1) if body_match else html
body = re.sub(r'<h1[^>]*>.*?</h1>', '', body, count=1, flags=re.DOTALL)

# Concatenar: body + FAQPage no final
content = body.strip() + ("\n\n" + faq_block if faq_block else "")

# open(..., encoding="utf-8") escreve UTF-8 sem BOM por padrão no Python
temp_file = os.path.join(tempfile.gettempdir(), "<slug-artigo>.html")
with open(temp_file, "w", encoding="utf-8") as f:
    f.write(content)
```

**B-1 — Criar upload link via novamira**

Chamar `mcp__<novamira_mcp>__mcp-adapter-execute-ability` com ability `create-upload-link`:
- Destino: `wp-content/uploads/tmp/<slug-artigo>.html`

Capturar da resposta: `url` (endpoint PUT) e `token` (header bearer).

**B-2 — Upload via Python (urllib.request — Windows e Linux)**

```python
# Stdlib pura. urllib.request funciona em Windows e Linux sem dependências.
import urllib.request

with open(temp_file, "rb") as f:
    file_bytes = f.read()

req = urllib.request.Request(url, data=file_bytes, method="PUT")
req.add_header("X-Novamira-Upload-Token", token)
req.add_header("Content-Type", "text/html; charset=utf-8")
with urllib.request.urlopen(req) as resp:
    result = resp.read()   # {"path":"...","bytes_written":N,...}
```

**B-3 — PHP via execute-php: lê do arquivo, cria post, seta Yoast**

> ⚠️ REGRA — ESTE PHP É FIXO E IMUTÁVEL
> O agente NÃO altera, NÃO "melhora", NÃO adapta este bloco.
> Blog é HTML clássico (não Elementor) — usa wp_insert_post + $wpdb->update + metas Yoast.
> Se o caso não encaixar: PARAR e reportar. Nunca improvisar.

```php
// Substituir $titulo, $slug_artigo, $meta_desc, $focus_kw antes de executar
$tmp_path = ABSPATH . 'wp-content/uploads/tmp/<slug-artigo>.html';
if (!file_exists($tmp_path)) {
    return ['error' => 'Temp file not found: ' . $tmp_path];
}
$body_content = file_get_contents($tmp_path);
if ($body_content === false) {
    return ['error' => 'Cannot read temp file'];
}

// PASSO 1: inserir post SEM conteúdo — evita KSES no insert
$post_id = wp_insert_post([
    'post_title'   => $titulo,
    'post_name'    => $slug_artigo,
    'post_content' => '',
    'post_status'  => 'draft',
    'post_type'    => 'post',
    'post_author'  => 1,
], true);
if (is_wp_error($post_id)) {
    unlink($tmp_path);
    return ['error' => $post_id->get_error_message()];
}

// PASSO 2: gravar body content via $wpdb — BYPASSA wp_filter_post_kses()
// Preserva <svg>, <rect>, <polyline>, <polygon>, <circle>, <text>
// e <script type="application/ld+json"> (FAQPage) intactos
global $wpdb;
$wpdb->update(
    $wpdb->posts,
    ['post_content' => $body_content],
    ['ID'           => $post_id],
    ['%s'],
    ['%d']
);
clean_post_cache($post_id);

// PASSO 3: campos Yoast — TODOS obrigatórios
update_post_meta($post_id, '_yoast_wpseo_title',    $titulo);
update_post_meta($post_id, '_yoast_wpseo_metadesc', $meta_desc);
update_post_meta($post_id, '_yoast_wpseo_focuskw',  $focus_kw);

unlink($tmp_path);
return [
    'post_id'     => $post_id,
    'post_status' => get_post_status($post_id),
    'preview_url' => get_preview_post_link($post_id),
    'edit_url'    => admin_url('post.php?post=' . $post_id . '&action=edit'),
    'body_bytes'  => strlen($body_content),
    'tmp_deleted' => !file_exists($tmp_path),
];
```

**Por que upload-link e não base64/inline:**
Passar body content como string direta ou base64 no parâmetro PHP do execute-php consome tokens
proporcionalmente ao tamanho do HTML (35-50 KB ≈ 10k tokens extras) e pode gerar
`InputValidationError` por tamanho ou por caracteres especiais. O upload-link separa o
transporte do conteúdo do transporte do código PHP — sem limite de tamanho.

**Por que `$wpdb->update` e não `wp_insert_post` com conteúdo:**
`wp_insert_post()` aplica `wp_filter_post_kses()` sobre `post_content`, que remove
`<svg>`, `<rect>`, `<polyline>`, `<polygon>`, `<circle>` e `<text>` silenciosamente.
Inserir vazio e gravar via `$wpdb` bypassa o KSES e preserva os gráficos intactos.

---

#### Campos Yoast obrigatórios (sempre — Caminho A ou B)

Após qualquer método de inserção, garantir que estes três campos estejam setados:

| Campo | Valor | Origem |
|---|---|---|
| `_yoast_wpseo_title` | Título com focus keyword no início | `title:` do frontmatter |
| `_yoast_wpseo_metadesc` | 150-160 chars com focus keyword e 1 dado | `description:` do frontmatter |
| `_yoast_wpseo_focuskw` | Focus keyword exata com acentuação correta | `focuskw:` do frontmatter (fallback: coluna KW do calendário) |

---

Se o Novamira retornar erro:
→ "Novamira retornou erro: [mensagem]. Verifique conexão e credenciais."
Registrar `| falhou — novamira: [erro] |` no projeto.md.
Parar.

Da resposta de sucesso, capturar:
- `id_wp`: ID do post no WordPress
- `url_rascunho`: URL de preview do rascunho (ex: `https://site.com/?p=<id>&preview=true`)

**Verificação pós-publicação (encoding):**
Se `body_bytes` retornado for menor que o tamanho do arquivo local, ou se ao inspecionar o post
no WP Admin aparecer "Ã" onde deveria haver "ã", "â", "ç" ou "é" (ex: "carÃªncia", "carÃ§a") →
encoding corrompido no passo B-0. A receita Python usa `open(..., encoding="utf-8")` sem BOM
por padrão — confirme que o arquivo HTML de origem também está em UTF-8 sem BOM.

### 6.6 Setar imagem destacada

Qualquer falha nesta seção → registrar aviso e continuar para PASSO 7. NUNCA bloquear a publicação por causa da imagem.

**Opção 1 — Sideload via coverImage URL (tentativa rápida, não-bloqueante)**

Se o frontmatter tiver `coverImage:` com URL pública, tentar via execute-php:

```php
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
// $cover_url = URL do campo coverImage: do frontmatter
// $post_id   = ID retornado em 6.5
$thumb_id = media_sideload_image($cover_url, $post_id, $titulo, 'id');
if (!is_wp_error($thumb_id)) {
    set_post_thumbnail($post_id, $thumb_id);
    return ['featured_image_set' => true, 'method' => 'sideload'];
}
// Falha: CDN bloqueou request server-side (Unsplash e Pixabay bloqueiam frequentemente)
return ['featured_image_set' => false, 'warning' => $thumb_id->get_error_message()];
```

⚠️  CDNs como Unsplash e Pixabay bloqueiam requests HTTP server-side frequentemente.
`featured_image_set: false` é resultado esperado — registrar aviso e tentar Opção 2.

**Opção 2 — hero.png local**

Verificar se existe o arquivo hero no rascunho local:
- Caminho: `projetos/<slug>/rascunhos/<slug-artigo>/hero.png`

**Se não existir:**
Registrar `⚠️  hero.png não encontrado — post publicado sem imagem destacada.` e continuar para PASSO 7.

**Se existir:** executar em dois sub-passos via Novamira:

**6.6a — Upload via `novamira/write-file`:**
Copiar o hero.png local para o servidor:
- Destino relativo à raiz do WordPress: `wp-content/uploads/rascunhos/<slug-artigo>/hero.png`

**6.6b — Registrar como attachment e setar thumbnail via `novamira/execute-php`:**

```php
// $post_id   = <ID retornado em 6.5>
// $hero_path = ABSPATH . 'wp-content/uploads/rascunhos/<slug-artigo>/hero.png'

require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';

$filetype   = wp_check_filetype(basename($hero_path), null);
$attachment = [
    'guid'           => wp_upload_dir()['baseurl'] . '/rascunhos/<slug-artigo>/hero.png',
    'post_mime_type' => $filetype['type'],
    'post_title'     => sanitize_file_name(basename($hero_path, '.png')),
    'post_content'   => '',
    'post_status'    => 'inherit',
];
$attach_id = wp_insert_attachment($attachment, $hero_path, $post_id);
$attach_data = wp_generate_attachment_metadata($attach_id, $hero_path);
wp_update_attachment_metadata($attach_id, $attach_data);
set_post_thumbnail($post_id, $attach_id);

return ['attach_id' => $attach_id, 'thumbnail_set' => true];
```

Se qualquer sub-passo falhar: registrar aviso e continuar para PASSO 7 sem imagem destacada.

---

## PASSO 7 — Registrar no projeto.md

### 7.1 Atualizar status na tabela

Localizar a linha do artigo em `## Calendário de Blog` (a linha selecionada no Passo 2).
Trocar `| pendente |` por `| publicado |` nessa linha.

### 7.2 Adicionar / atualizar seção de registro

Verificar se a seção `### Registro de Publicações` já existe logo abaixo da tabela de calendário.

Se não existir, criar:
```markdown
### Registro de Publicações

| KW | Título | URL Rascunho | ID WP | Data |
|---|---|---|---|---|
| <kw> | <título> | <url_rascunho> | <id_wp> | <data YYYY-MM-DD> |
```

Se já existir, adicionar uma linha:
```markdown
| <kw> | <título> | <url_rascunho> | <id_wp> | <data YYYY-MM-DD> |
```

---

## PASSO 8 — Apresentação final

```
✓ Artigo publicado como rascunho.

Título:          [título]
KW:              [kw]
Tipo:            [Pilar | Satélite]
URL rascunho:    [url_rascunho]
ID WordPress:    [id_wp]
Money Page:      [money_page]
Draft salvo em:  projetos/<slug>/rascunhos/<slug-artigo>/

Próximo na fila: [título do próximo artigo pendente] ([kw]) — [tipo]
Para produzir o próximo: /link-flow publicar <slug>
```

---

## DEGRADAÇÃO CONTROLADA

| Situação | Ação |
|---|---|
| `novamira_mcp` ausente no projeto.md | Explicar como adicionar o campo e parar |
| Calendário inexistente | Instruir a rodar /link-flow calendario primeiro |
| Nenhum artigo pendente | Avisar que o calendário está concluído |
| Só satélites pendentes com pilar não publicado | Avisar dependência de cluster e parar |
| HTML não gerado (Phase 6.5 bloqueou) | Registrar `falhou`, apontar preflight-report.json, parar |
| Novamira retorna erro | Registrar `falhou — novamira: <erro>`, parar |
| Ability de criação não encontrada | Usar Caminho B (execute-php fallback) — não parar |
| Slug não passado | Listar projetos disponíveis e perguntar |
| Slug já existe no WP (exit 1 do verificar_existe.py) | Parar e apresentar 4 opções — nunca criar silenciosamente |
