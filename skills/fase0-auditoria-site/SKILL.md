---
name: fase0-auditoria-site
description: >
  Audita a camada global de um site WordPress existente ANTES de qualquer alteração de conteúdo.
  SOMENTE LEITURA — não corrige nada. Mapeia o que está herdado do dono anterior (templates,
  menus, wp_options, SEO plugin, páginas) e bloqueia a Fase 3 se o molde estiver sujo.
allowed-tools: Read, Write, Glob, Grep, Bash
---

# fase0-auditoria-site — Auditoria de Camada Global (Fase 0)

Invocada por `link-flow auditoria <slug>`. Roda UMA VEZ, após o `orq-icp` e ANTES da Fase 1.

## TRAVA DE IDEMPOTÊNCIA
Antes de qualquer ação, ler `## Estado das Fases` no `projetos/<slug>/projeto.md`.
Se já contém `auditoria_global: concluida` → responder "Auditoria já realizada em [data]. Quer repetir?" e aguardar confirmação antes de sobrescrever.

## MODO: SOMENTE REPORTAR
O agente NÃO corrige NADA nesta etapa.
- PROIBIDO: update_post_meta, wp_update_post, wp_insert_post, qualquer escrita no WP.
- PROIBIDO: editar templates, menus, options, páginas existentes.
- Encontrou um problema? MAPEIA, CITA o trecho exato, REGISTRA no relatório. Nada mais.

---

## CAMADA A — Elementor Theme Builder / Library

### A1 — Listar todos os templates ativos

```php
$templates = get_posts(['post_type' => 'elementor_library', 'posts_per_page' => -1, 'post_status' => ['publish','draft']]);
$out = [];
foreach ($templates as $t) {
    $type = get_post_meta($t->ID, '_elementor_template_type', true);
    $out[] = ['id' => $t->ID, 'title' => $t->post_title, 'type' => $type, 'status' => $t->post_status];
}
return $out;
```

Tipos relevantes: `header`, `footer`, `single`, `archive`, `page`, `section`.

### A2 — Varrer conteúdo de cada template

Para cada template retornado, extrair `_elementor_data` via PHP e varrer procurando:
- Nome de pessoa (usar o nome do cliente atual e nomes de registros anteriores, se conhecidos)
- Número de registro profissional (CRP/OAB/CRM/CRC/CRO + dígitos)
- Redes sociais (@usuario, URLs instagram/facebook/linkedin)
- Telefone (padrões: (xx) xxxxx-xxxx, +55...)
- E-mail (@)
- Endereço (rua, av., nº, CEP)

Reportar: `template_id | template_title | widget_id | trecho_exato_encontrado`

---

## CAMADA B — Menus

### B1 — Listar menus e itens

```php
$menus = wp_get_nav_menus();
$out = [];
foreach ($menus as $m) {
    $items = wp_get_nav_menu_items($m->term_id);
    $menu_items = [];
    foreach ($items as $i) {
        $menu_items[] = ['title' => $i->title, 'url' => $i->url, 'object' => $i->object, 'object_id' => $i->object_id];
    }
    $out[$m->name] = $menu_items;
}
return $out;
```

### B2 — Classificar cada item

Para cada item:
- Aponta para página/post do site atual? → OK
- URL externa ou hardcoded? → REPORTAR
- Link quebrado (página inexistente)? → REPORTAR
- Título com nome de pessoa diferente do cliente? → REPORTAR CRÍTICO

---

## CAMADA C — wp_options globais

```php
return [
    'blogname'        => get_option('blogname'),
    'blogdescription' => get_option('blogdescription'),
    'admin_email'     => get_option('admin_email'),
    'siteurl'         => get_option('siteurl'),
    'home'            => get_option('home'),
];
```

Reportar valor atual de cada campo. Marcar 🔴 se `blogname` ou `blogdescription` contiverem nome de pessoa diferente do cliente atual.

---

## CAMADA D — Yoast / Rank Math global

### D1 — Schema global (Yoast)

```php
$opts = get_option('wpseo_titles');
return [
    'company_or_person' => $opts['company_or_person'] ?? '—',
    'company_name'      => $opts['company_name'] ?? '—',
    'person_name'       => $opts['person_name'] ?? '—',
    'title-home-wpseo'  => $opts['title-home-wpseo'] ?? '—',
    'title-page-wpseo'  => $opts['title-page-wpseo'] ?? '—',
    'title-post-wpseo'  => $opts['title-post-wpseo'] ?? '—',
];
```

### D2 — Plugin SEO ativo + schema global

```php
// Padrão do sistema: Yoast. Rank Math lido como fallback se Yoast não configurado.
$yoast = get_option('wpseo_titles');
$rm    = get_option('rank_math_general_settings');
return [
    'plugin_ativo'  => $yoast ? 'Yoast' : ($rm ? 'Rank Math' : 'nenhum detectado'),
    'schema_type'   => $yoast['company_or_person'] ?? $rm['knowledgegraph_type'] ?? '—',
    'schema_name'   => $yoast['company_name'] ?? $yoast['person_name'] ?? $rm['knowledgegraph_name'] ?? '—',
];
```

Marcar 🔴 se nome diferente do cliente atual estiver hardcoded em qualquer campo.

---

## CAMADA E — Páginas preexistentes

### E1 — Inventário completo

```php
$pages = get_posts(['post_type' => ['page','post'], 'posts_per_page' => -1,
    'post_status' => ['publish','draft','trash','private']]);
$out = [];
foreach ($pages as $p) {
    $wc = str_word_count(wp_strip_all_tags($p->post_content));
    $yoast_title = get_post_meta($p->ID, '_yoast_wpseo_title', true);
    $yoast_desc  = get_post_meta($p->ID, '_yoast_wpseo_metadesc', true);
    $out[] = ['id' => $p->ID, 'title' => $p->post_title, 'slug' => $p->post_name,
              'status' => $p->post_status, 'words' => $wc,
              'yoast_title' => $yoast_title, 'yoast_desc' => $yoast_desc];
}
return $out;
```

### E2 — Marcar problemas

Para cada página, avaliar:
- 🔴 CONTEÚDO DE OUTRO PROFISSIONAL: título, meta title ou meta desc com nome de outra pessoa
- 🟡 DUPLICADA: slug muito parecido com outro (ex: `/sobre/` e `/sobre-mim/`)
- 🟡 ÓRFÃ: nenhum menu ou link interno aponta para ela
- 🟡 RASCUNHO ABANDONADO: status draft + data de modificação > 30 dias atrás
- 🟡 LIXEIRA: status trash (ocupa slug — pode colidir com páginas novas)

---

## CAMADA E.2 — Conteúdo Órfão (cross-reference)

Cross-referenciar o inventário do WordPress (CAMADA E) com as tabelas do `projeto.md` (`## Money Pages` e `## Páginas Institucionais`).

### Lógica de detecção

Para cada página/post do WP com `status = publish` ou `draft`:
1. Verificar se o slug aparece na tabela `## Money Pages` do projeto.md
2. Verificar se o slug aparece na tabela `## Páginas Institucionais` do projeto.md
3. Se NÃO aparece em nenhuma das duas → marcar como **ÓRFÃO do Link Flow**

### Critérios de exclusão (não marcar como órfão)
- Páginas de sistema do WordPress (`/wp-sitemap/`, `/feed/`, `/xmlrpc.php`)
- Páginas padrão do WP (`/amostra-de-pagina/`, `/hello-world/`)
- Páginas já listadas no projeto.md (Money Pages ou Institucionais)
- Status `trash` (já anotado em E2 como 🟡 LIXEIRA)

### Categorias de órfão
- 🔴 **CONTEÚDO DE OUTRO PROFISSIONAL**: slug ou título contém nome diferente do cliente → risco de indexação indevida
- 🟡 **FORA DO PLANO**: página publicada sem equivalente no projeto.md — o Link Flow não vai otimizá-la (pode conflitar com Money Pages)
- 🟡 **RASCUNHO DESCONHECIDO**: draft sem equivalente no projeto.md — status incerto, pode vazar

### Gate dos órfãos

Se órfãos encontrados, apresentar ao cliente:
> "Encontrei [N] página(s) no WordPress que não constam no plano do Link Flow:
> [lista de slugs com categorias]
>
> O que você prefere?
>   (1) Incluir no plano — adiciono ao projeto.md como Money Page ou Institucional
>   (2) Ignorar — o Link Flow não toca nessas páginas, mas elas continuam no ar
>   (3) Deletar — mando para a lixeira no WordPress"

Registrar a escolha no `projeto.md`:
```
orfaos_gate: opção [N], autorizado por [operador] em [data]
orfaos: [lista de slugs] — [status escolhido]
```

Se nenhum órfão encontrado → registrar `orfaos_gate: nenhum orfao detectado em [data]` e prosseguir.

---

## CAMADA F — O Molde (CRÍTICO)

Ler o `molde_id` do `projeto.md` (campo `## Molde de Money Page`).
Se `molde_id` não estiver registrado → avisar que o molde precisa ser definido antes da Fase 3. NÃO bloquear a auditoria, apenas registrar.

Se `molde_id` existir:

```php
$raw = get_post_meta([MOLDE_ID], '_elementor_data', true);
return base64_encode($raw);
```

Após decodificar, varrer procurando: nome de cidade do cliente anterior, nome de pessoa, CRP/OAB/CRM, endereço, e-mail, telefone.

**SE O MOLDE ESTIVER SUJO:**
- Registrar no relatório: widget_id + trecho exato encontrado
- Adicionar ao relatório:
  ```
  🔴 BLOQUEIO FASE 3: O molde (ID [x]) contém conteúdo do dono anterior.
  TODA Money Page clonada dele nasce com esse conteúdo.
  A Fase 3 está BLOQUEADA até o molde ser limpo.
  ```
- Registrar no `projeto.md`: `molde_status: sujo — Fase 3 bloqueada`

---

## ENTREGÁVEL

Criar `projetos/<slug>/auditoria-global.md` com:

```markdown
# Auditoria Global — [Nome do Cliente]
Data: [data]

## Resumo
[N itens críticos (🔴), N atenção (🟡), N ok (✅)]

## Tabela de Achados

| Camada | Onde | O que foi encontrado | Impacto | Prioridade |
|--------|------|----------------------|---------|------------|
| A — Header template | ID 42, widget a3f9 | "Dra. Maria Souza — CRP 12345" | Aparece em todas as páginas | 🔴 Crítico |
| ... | | | | |

## Molde
[Status: limpo ✅ / sujo 🔴 / não definido ⬜]
[Se sujo: listar widget_id + trecho]

## Próximos passos (fora do escopo do Link Flow)
Estes itens são configuração do seu site — não são alterados automaticamente pelo sistema.
```

Terminar com o gate obrigatório:

> "Estes [N] itens estão fora do escopo automático do Link Flow (são configuração do site existente).
> O que você prefere?
>   (1) Corrigir agora antes de eu continuar — me dê acesso e faço junto com você
>   (2) Continuar e corrigir depois — registro os pendentes no projeto.md
>   (3) Ignorar — assumir risco e seguir"

---

## REGISTRAR NO projeto.md

Após entregar o relatório:
```
## Estado das Fases
auditoria_global: concluida em [data] — [N críticos, N atenção]
molde_status: limpo | sujo | não definido
```

Se molde sujo: adicionar também `fase3_bloqueada: true — molde ID [x] contém conteúdo anterior`.
