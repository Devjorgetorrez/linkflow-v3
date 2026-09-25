<?php
/**
 * injetar_elementor.php — RECEITA CANÔNICA DE INJEÇÃO ELEMENTOR
 * Link Flow · Fase 3 · Único ponto de verdade para injeção de páginas Elementor
 *
 * USO: o agente preenche SOMENTE a seção === DADOS DA PÁGINA === abaixo.
 * O agente NÃO escreve lógica de injeção. A função inject_money_page() é imutável.
 *
 * MODO 1 — molde_id fornecido (Money Page, padrão):
 *   Clona _elementor_data do molde, aplica widget mods via $params['widgets'].
 *   post_content = cópia do molde (HTML completo, ~13-17k bytes).
 *
 * MODO 2 — molde_id omitido ou 0 (páginas institucionais, sem molde Elementor):
 *   Usa $params['html_content'] como conteúdo da página.
 *   Monta _elementor_data mínimo: 1 section > 1 column > 1 text-editor com o HTML.
 *   post_content = o mesmo html_content (nunca '<!-- Elementor -->', nunca vazio).
 *   $params['widgets'] é ignorado no MODO 2.
 *   Passos 5–10 são IDÊNTICOS ao MODO 1.
 *
 * Parâmetros aceitos em $params['widgets'] (MODO 1 apenas):
 *   heading     → ['title' => 'texto']
 *   text-editor → ['editor' => '<p>HTML</p>']
 *   button      → ['text' => 'TEXTO CTA']
 *   icon-list   → ['icon_list' => [['text' => 'item 1'], ['text' => 'item 2']]]
 *   image       → ['image_alt' => 'texto do alt']
 *   nested-accordion (items) → ['accordion_items' => ['Título 1', 'Título 2', ...]]
 */

// ═══════════════════════════════════════════════════════
//  === DADOS DA PÁGINA — O AGENTE PREENCHE SOMENTE AQUI ===
// ═══════════════════════════════════════════════════════
$params = [
    'molde_id'    => 29,
    'slug'        => 'minha-pagina',
    'titulo'      => 'Título da Página',
    'status'      => 'draft',
    'yoast_kw'    => 'keyword principal',
    'yoast_title' => 'Meta Title · Nome do Negocio',
    'yoast_desc'  => 'Meta description da página.',
    'widgets'     => [
        // Exemplo:
        // 'a1b2c3' => ['title' => 'Meu H1 com a KW'],
        // 'd4e5f6' => ['editor' => '<p>Parágrafo de introdução.</p>'],
        // 'g7h8i9' => ['text' => 'AGENDE AGORA'],
    ],
];
// ═══════════════════════════════════════════════════════
//  === FIM DOS DADOS — NÃO EDITAR NADA ABAIXO DESTA LINHA ===
// ═══════════════════════════════════════════════════════

return inject_money_page($params);

// ─── FUNÇÃO CANÔNICA — IMUTÁVEL ──────────────────────
function inject_money_page(array $params): array {
    $errors = [];
    $molde_id = (int) ($params['molde_id'] ?? 0);
    $modo = $molde_id ? 1 : 2;

    // ══════════════════════════════════════════════════
    // MODO 1: clona _elementor_data do molde
    // ══════════════════════════════════════════════════
    if ($modo === 1) {

        // ── Passo 1: Ler molde ──────────────────────────────
        $molde = get_post($molde_id);
        if (!$molde) { return ['ok' => false, 'error' => "Molde ID {$molde_id} não encontrado"]; }

        $raw_json = get_post_meta($molde_id, '_elementor_data', true);
        if (!$raw_json) { return ['ok' => false, 'error' => 'Molde sem _elementor_data']; }

        $data = json_decode($raw_json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['ok' => false, 'error' => 'JSON do molde inválido: ' . json_last_error_msg()];
        }

        // ── Passo 2: Aplicar modificações de widgets ────────
        $widgets_map = $params['widgets'] ?? [];
        foreach ($widgets_map as $widget_id => $mods) {
            $found = apply_widget_mods($data, (string) $widget_id, $mods);
            if (!$found) {
                $errors[] = "Widget '{$widget_id}' não encontrado no molde — verificar ID";
            }
        }
        if ($errors) {
            return ['ok' => false, 'errors' => $errors];
        }

        // ── Passo 3: Serializar _elementor_data ─────────────
        $new_json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($new_json === false) {
            return ['ok' => false, 'error' => 'json_encode falhou: ' . json_last_error_msg()];
        }

        // ── Passo 4 (MODO 1): post_content = HTML completo do molde ──
        // REGRA: cópia literal do molde. NUNCA '<!-- Elementor -->'. NUNCA vazio.
        $post_content_final = $molde->post_content;
        if (strlen($post_content_final) < 100) {
            return [
                'ok'    => false,
                'error' => "post_content do molde tem apenas " . strlen($post_content_final) . " bytes. "
                         . "Molde deve ter HTML completo (>100 bytes). Verifique o molde_id.",
            ];
        }

    // ══════════════════════════════════════════════════
    // MODO 2: monta _elementor_data mínimo com html_content
    // ══════════════════════════════════════════════════
    } else {

        $html_content = $params['html_content'] ?? '';
        if (strlen($html_content) < 100) {
            return ['ok' => false, 'error' => 'MODO 2: html_content ausente ou < 100 bytes'];
        }

        // Passo 1–3 (MODO 2): monta estrutura mínima Elementor (section > column > text-editor)
        $widget_id = substr(md5(uniqid('', true)), 0, 7);
        $col_id    = substr(md5(uniqid('', true)), 0, 7);
        $sec_id    = substr(md5(uniqid('', true)), 0, 7);
        $data = [[
            'id'       => $sec_id,
            'elType'   => 'section',
            'settings' => [],
            'elements' => [[
                'id'       => $col_id,
                'elType'   => 'column',
                'settings' => ['_column_size' => 100],
                'elements' => [[
                    'id'         => $widget_id,
                    'elType'     => 'widget',
                    'widgetType' => 'text-editor',
                    'settings'   => ['editor' => $html_content],
                    'elements'   => [],
                ]],
            ]],
        ]];

        $new_json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($new_json === false) {
            return ['ok' => false, 'error' => 'json_encode falhou (MODO 2): ' . json_last_error_msg()];
        }

        // Passo 4 (MODO 2): post_content = html_content (nunca '<!-- Elementor -->')
        $post_content_final = $html_content;
    }

    // ══════════════════════════════════════════════════
    // PASSOS 4b–10: IDÊNTICOS para MODO 1 e MODO 2
    // ══════════════════════════════════════════════════

    $post_id = wp_insert_post([
        'post_title'   => $params['titulo'],
        'post_name'    => $params['slug'],
        'post_status'  => $params['status'] ?? 'draft',
        'post_type'    => 'page',
        'post_content' => $post_content_final,
    ]);
    if (is_wp_error($post_id)) {
        return ['ok' => false, 'error' => 'wp_insert_post falhou: ' . $post_id->get_error_message()];
    }

    // ── Passo 5: _elementor_data com wp_slash ───────────
    // REGRA: NUNCA $wpdb->insert. Sempre update_post_meta + wp_slash.
    update_post_meta($post_id, '_elementor_data', wp_slash($new_json));

    // ── Passo 6: _elementor_page_settings como array PHP ─
    // O WordPress serializa automaticamente. NUNCA json_encode aqui.
    update_post_meta($post_id, '_elementor_page_settings', ['hide_title' => 'yes']);

    // ── Passo 7: Metas de controle do Elementor ─────────
    update_post_meta($post_id, '_elementor_edit_mode',     'builder');
    update_post_meta($post_id, '_elementor_template_type', 'wp-page');
    update_post_meta($post_id, '_wp_page_template',        'default');

    // ── Passo 8: Popular _elementor_page_assets E gerar CSS ─
    // Document::save() itera todos os elementos via Assets::after_elements_iteration(),
    // popula _elementor_page_assets de verdade (não cópia), e salva no banco.
    // Post::create()->update() gera o arquivo CSS no disco (post-ID.css, ~50k bytes).
    // CRÍTICO: sem estes dois passos os ícones aparecem sem estilo (CSS stub 33 bytes).
    $document = \Elementor\Plugin::$instance->documents->get($post_id);
    $document->save(['elements' => $document->get_elements_data()]);
    if (class_exists('\Elementor\Core\Files\CSS\Post')) {
        \Elementor\Core\Files\CSS\Post::create($post_id)->update();
    } else {
        $errors[] = 'AVISO: classe Elementor\Core\Files\CSS\Post não encontrada — CSS não regenerado';
    }

    // ── Passo 9: Metas SEO (Yoast) ──────────────────────
    $kw    = $params['yoast_kw']    ?? '';
    $desc  = $params['yoast_desc']  ?? '';
    $title = $params['yoast_title'] ?? '';
    update_post_meta($post_id, '_yoast_wpseo_title',    $title);
    update_post_meta($post_id, '_yoast_wpseo_focuskw',  $kw);
    update_post_meta($post_id, '_yoast_wpseo_metadesc', $desc);

    // ── Passo 10: Validar tudo do banco ─────────────────
    $p                = get_post($post_id);
    $ed_from_db       = get_post_meta($post_id, '_elementor_data', true);
    $edit_mode        = get_post_meta($post_id, '_elementor_edit_mode', true);
    $page_assets      = get_post_meta($post_id, '_elementor_page_assets', true);
    $page_settings    = get_post_meta($post_id, '_elementor_page_settings', true);

    $json_valid     = (json_decode($ed_from_db, true) !== null);
    $widget_count   = count_widgets(json_decode($ed_from_db, true) ?? []);
    $pc_len         = strlen($p->post_content ?? '');
    $slug_real      = $p->post_name;

    $css_file       = WP_CONTENT_DIR . '/uploads/elementor/css/post-' . $post_id . '.css';
    $css_bytes      = file_exists($css_file) ? filesize($css_file) : -1;
    $page_assets_count = is_array($page_assets) ? count($page_assets) : 0;

    // Validações de saída
    $validation_errors = [];
    if (!$json_valid)            { $validation_errors[] = '_elementor_data inválido no banco'; }
    if ($pc_len < 100)           { $validation_errors[] = "post_content={$pc_len} bytes (esperado >100)"; }
    if ($edit_mode !== 'builder'){ $validation_errors[] = "_elementor_edit_mode='{$edit_mode}' (esperado 'builder')"; }
    if ($css_bytes < 1000)       { $validation_errors[] = "CSS={$css_bytes} bytes (esperado >1000) — Post::update() não rodou?"; }
    if ($page_assets_count === 0){ $validation_errors[] = '_elementor_page_assets vazio — ícones sem CSS'; }
    if (!is_array($page_settings) || empty($page_settings['hide_title'])) {
        $validation_errors[] = '_elementor_page_settings sem hide_title=yes — H1 duplo provável';
    }

    if ($validation_errors || $errors) {
        return [
            'ok'               => false,
            'post_id'          => $post_id,
            'slug_real'        => $slug_real,
            'validation_errors'=> $validation_errors,
            'widget_errors'    => $errors,
        ];
    }

    return [
        'ok'               => true,
        'post_id'          => $post_id,
        'slug_real'        => $slug_real,
        'json_valid'       => $json_valid,
        'widget_count'     => $widget_count,
        'pc_len'           => $pc_len,
        'css_bytes'        => $css_bytes,
        'page_assets_count'=> $page_assets_count,
        'edit_mode'        => $edit_mode,
        'hide_title'       => ($page_settings['hide_title'] ?? ''),
        'preview_errors'   => [],
    ];
}

// ─── HELPERS ─────────────────────────────────────────

function apply_widget_mods(array &$elements, string $target_id, array $mods): bool {
    foreach ($elements as &$el) {
        if (($el['id'] ?? '') === $target_id) {
            foreach ($mods as $key => $value) {
                switch ($key) {
                    case 'icon_list':
                        foreach ($value as $i => $item_data) {
                            if (isset($el['settings']['icon_list'][$i])) {
                                foreach ($item_data as $item_key => $item_val) {
                                    $el['settings']['icon_list'][$i][$item_key] = $item_val;
                                }
                            }
                        }
                        break;
                    case 'image_alt':
                        if (isset($el['settings']['image'])) {
                            $el['settings']['image']['alt'] = $value;
                        }
                        $el['settings']['image_alt'] = $value;
                        break;
                    case 'accordion_items':
                        if (isset($el['settings']['items'])) {
                            foreach ($value as $i => $title) {
                                if (isset($el['settings']['items'][$i])) {
                                    $el['settings']['items'][$i]['item_title'] = $title;
                                }
                            }
                        }
                        break;
                    default:
                        $el['settings'][$key] = $value;
                }
            }
            return true;
        }
        if (!empty($el['elements'])) {
            if (apply_widget_mods($el['elements'], $target_id, $mods)) {
                return true;
            }
        }
    }
    return false;
}

function count_widgets(array $elements): int {
    $count = 0;
    foreach ($elements as $el) {
        if (($el['elType'] ?? '') === 'widget') { $count++; }
        if (!empty($el['elements'])) { $count += count_widgets($el['elements']); }
    }
    return $count;
}
