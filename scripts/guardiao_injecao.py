"""
guardiao_injecao.py — Valida _elementor_data após injeção de Money Page
Uso: python scripts/guardiao_injecao.py --arquivo <path.json> --kw <keyword>
     [--mold <str1,str2>] [--min-widgets <n>] [--page-settings <raw_serialized>]
     [--post-content <valor>] [--edit-mode <valor>]
     [--page-assets-count <n>] [--css-bytes <n>]

IMPORTANTE — O que este guardião valida:
  OBRIGATÓRIO: --arquivo DEVE ser o JSON extraído do banco via get_post_meta() + base64
  (Passo A na SKILL). Passar o arquivo JSON pré-injeção local dá PASS mesmo quando o banco
  está corrompido — incidente: pág 913, 2026-07-12 ($wpdb->insert corrompeu o banco;
  guardião validou arquivo local e retornou PASS numa página que renderizava em branco).
  NÃO valida como bloqueante: post_meta de SEO — estão fora do JSON de _elementor_data.
  Check 13 (aviso): verifica se as 3 metas Yoast foram gravadas (requer --yoast-kw, --yoast-desc, --yoast-title).
  Slug: validado na skill (fase3-conteudo/SKILL.md) via PHP ANTES de chamar este script.

13 checks (bloqueantes exceto 5 e 13 = aviso; 10/11/12/13 = aviso se arg ausente, bloqueio se fornecido):
  1. JSON válido e parseável
  2. Contagem de widgets >= min-widgets
  3. Nenhuma string do molde no JSON raw
  4. Nenhum widget text/heading/icon-list/button com conteúdo vazio
  5. (aviso) KW presente em ao menos um widget heading ou text-editor
  6. Ao menos um widget button (CTA) existe
  7. Nenhum image widget com alt vazio ou contendo string do molde
  8. (bloqueio) _elementor_page_settings contém hide_title=yes — sem isso o tema renderiza
     o post_title como H1 extra além do H1 do widget (H1 DUPLO). Aviso se --page-settings
     não fornecido.
  9. (bloqueio) Nenhum widget do molde sem mapeamento — TODOS os tipos devem ser tratados
     explicitamente ou declarados em TIPOS_COBERTOS com justificativa
  10. (bloqueio) post_content tem > 1000 bytes — '<!-- Elementor -->' isolado (18 bytes)
      causa _elementor_page_assets vazio e página sem CSS de widgets.
      REGRA: post_content = HTML completo do molde (cópia literal, ~16k bytes).
      Aviso se --post-content não fornecido.
  11. (bloqueio) _elementor_edit_mode == 'builder'. Aviso se --edit-mode não fornecido.
  12. (bloqueio) _elementor_page_assets não-vazio E CSS > 1000 bytes — sem isso os ícones
      e widgets aparecem sem estilo (quadrado preto, layout quebrado).
      Causa: Post::create($id)->update() não foi chamado após injeção.
      Aviso se --page-assets-count ou --css-bytes não fornecido.
"""

import argparse
import json
import re
import sys
import unicodedata

STOP_WORDS = {"em", "de", "da", "do", "no", "na", "para", "com", "e", "a", "o", "as", "os", "um", "uma"}


def normalizar(texto):
    """Lowercase + remove acentos."""
    texto = texto.lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )


def termos_kw(kw):
    """Retorna os termos significativos da KW (sem stop-words, normalizados)."""
    return [normalizar(t) for t in kw.split() if t.lower() not in STOP_WORDS]


def find_widgets(elements, result=None):
    if result is None:
        result = []
    if not isinstance(elements, list):
        return result
    for el in elements:
        if el.get("elType") == "widget":
            result.append(el)
        if el.get("elements"):
            find_widgets(el["elements"], result)
    return result


def verificar(arquivo, kw, mold_strings, min_widgets, page_settings="", post_content=None, edit_mode=None, page_assets_count=None, css_bytes=None, yoast_kw=None, yoast_desc=None, yoast_title=None, modo=1):
    erros = []
    avisos = []

    # Check 1 — JSON válido
    try:
        with open(arquivo, encoding="utf-8") as f:
            raw = f.read()
        data = json.loads(raw)
    except Exception as e:
        print(f"FAIL — Check 1 (JSON inválido): {e}")
        return 1

    widgets = find_widgets(data)

    # Check 2 — Contagem de widgets
    if len(widgets) < min_widgets:
        erros.append(
            f"Check 2: widget_count={len(widgets)} < min={min_widgets} — estrutura incompleta"
        )

    # Check 3 — Nenhuma string do molde
    for s in mold_strings:
        count = raw.count(s)
        if count > 0:
            erros.append(
                f"Check 3: string do molde '{s}' encontrada {count}x — molde não removido completamente"
            )

    # Check 4 — Sem widget com conteúdo vazio
    TEXT_TYPES = {"heading", "text-editor", "icon-list", "button"}
    for w in widgets:
        wt = w.get("widgetType", "")
        if wt not in TEXT_TYPES:
            continue
        s = w.get("settings", {})
        text = ""
        if wt == "heading":
            text = s.get("title", "")
        elif wt == "text-editor":
            text = s.get("editor", "")
        elif wt == "button":
            text = s.get("text", "")
        elif wt == "icon-list":
            items = s.get("icon_list", [])
            text = " ".join(i.get("text", "") for i in items)
        if not text.strip():
            erros.append(
                f"Check 4: widget '{w.get('id')}' ({wt}) com conteúdo vazio"
            )

    # Check 5 — Todos os termos da KW (sem stop-words) presentes em ao menos 1 heading/text-editor
    termos = termos_kw(kw)
    kw_found = False
    for w in widgets:
        wt = w.get("widgetType", "")
        s = w.get("settings", {})
        candidate = ""
        if wt == "heading":
            candidate = s.get("title", "")
        elif wt == "text-editor":
            candidate = s.get("editor", "")
        if not candidate:
            continue
        candidate_norm = normalizar(candidate)
        if all(t in candidate_norm for t in termos):
            kw_found = True
            break
    if not kw_found:
        avisos.append(
            f"Check 5: termos da KW {termos} não encontrados juntos em nenhum widget heading/text-editor"
        )

    # Check 6 — Ao menos 1 button (CTA)
    # MODO 2 (institucional): CTA pode estar inline no HTML do text-editor — aviso, não bloqueio.
    buttons = [w for w in widgets if w.get("widgetType") == "button"]
    if not buttons:
        msg = "Check 6: nenhum widget button (CTA) encontrado — CTA ausente"
        if modo == 2:
            avisos.append(msg + " (MODO 2: verificar se CTA está no HTML do text-editor)")
        else:
            erros.append(msg)

    # Check 7 — Images sem alt vazio nem alt com string do molde
    images = [w for w in widgets if w.get("widgetType") == "image"]
    for img in images:
        alt = img.get("settings", {}).get("image", {}).get("alt", "")
        if not alt.strip():
            erros.append(
                f"Check 7: image '{img.get('id')}' com alt vazio"
            )
        for s in mold_strings:
            if s.lower() in alt.lower():
                erros.append(
                    f"Check 7: image '{img.get('id')}' alt contém string do molde '{s}': '{alt}'"
                )

    # Check 8 — _elementor_page_settings: formato correto E hide_title=yes obrigatório
    if page_settings:
        if not re.match(r'^a:\d+:\{', page_settings):
            erros.append(
                f"Check 8: _elementor_page_settings não é array PHP serializado — "
                f"valor='{page_settings[:80]}'. "
                f"Usar update_post_meta($id, '_elementor_page_settings', ['hide_title'=>'yes']). NUNCA json_encode."
            )
        elif "hide_title" not in page_settings:
            erros.append(
                "Check 8 — H1 DUPLICADO: _elementor_page_settings sem hide_title=yes. "
                "O tema vai renderizar o post_title como H1 além do H1 do widget. "
                "Aplicar hide_title=yes antes de continuar."
            )
    else:
        avisos.append(
            "Check 8: --page-settings não fornecido — verificar manualmente se "
            "_elementor_page_settings contém hide_title=yes (risco de H1 duplo)"
        )

    # Check 9 — Nenhum widget sem mapeamento (bloqueante)
    # Para adicionar um tipo inofensivo (ex: spacer, divider): acrescentar a TIPOS_COBERTOS
    # com comentário justificando por que o conteúdo não precisa ser validado.
    # Tipos com conteúdo gerenciado externamente (sem texto inline a validar):
    TIPOS_COBERTOS = {
        "heading", "text-editor", "icon-list", "button", "image",
        "nested-accordion", "shortcode",
        # Decorativos — sem texto a validar:
        "icon",            # ícone decorativo, puramente visual
        "google_maps",     # mapa embutido, sem conteúdo textual
        "spacer",          # espaçamento de layout
        "divider",         # separador visual
        # Formulários — conteúdo gerenciado por plugin externo:
        "form",            # Elementor Pro form
        "contact-form-7",  # integração Contact Form 7
        "wpforms",         # integração WPForms
    }
    for w in widgets:
        wt = w.get("widgetType", "")
        if wt and wt not in TIPOS_COBERTOS:
            erros.append(
                f"Check 9: widget tipo '{wt}' (ID {w.get('id')}) sem mapeamento — "
                f"tratar explicitamente ou adicionar a TIPOS_COBERTOS com justificativa"
            )

    # Check 10 — post_content tem volume real (bloqueante se arg fornecido)
    # REGRA: post_content = HTML completo do molde (~16k bytes), cópia literal.
    # '<!-- Elementor -->' isolado (18 bytes) causa _elementor_page_assets vazio → sem CSS de widgets.
    if post_content is not None:
        pc_len = len(post_content)
        if pc_len < 1000:
            erros.append(
                f"Check 10: post_content tem apenas {pc_len} bytes (mínimo: 1000). "
                "post_content deve ser o HTML completo do molde (~16k bytes). "
                "'<!-- Elementor -->' isolado causa page_assets vazio e CSS quebrado. "
                "Fix: usar scripts/injetar_elementor.php que copia post_content do molde."
            )
    else:
        avisos.append(
            "Check 10: --post-content não fornecido — verificar manualmente se "
            "post_content tem > 1000 bytes (HTML do molde, não '<!-- Elementor -->')"
        )

    # Check 11 — _elementor_edit_mode == 'builder' (bloqueante se arg fornecido)
    if edit_mode is not None:
        if edit_mode != 'builder':
            erros.append(
                f"Check 11: _elementor_edit_mode = '{edit_mode}' (esperado 'builder') — "
                "Elementor não renderiza. "
                "Fix: update_post_meta($id, '_elementor_edit_mode', 'builder')"
            )
    else:
        avisos.append(
            "Check 11: --edit-mode não fornecido — verificar manualmente se "
            "_elementor_edit_mode = 'builder'"
        )

    # Check 12 — _elementor_page_assets não-vazio E CSS acima do limiar
    # MODO 1 (Money Page, ~45 widgets): limiar CSS = 1000 bytes
    # MODO 2 (institucional, 1 text-editor): limiar CSS = 50 bytes (arquivo existe = suficiente)
    css_min = 1000 if modo == 1 else 50
    if page_assets_count is not None or css_bytes is not None:
        if page_assets_count is not None and page_assets_count == 0:
            erros.append(
                "Check 12: _elementor_page_assets vazio — CSS de widgets não será carregado. "
                "Causa: Post::create($id)->update() não foi chamado após injeção. "
                "Fix: usar scripts/injetar_elementor.php (passo 8)."
            )
        if css_bytes is not None and css_bytes < css_min:
            msg = (
                f"Check 12: CSS do post tem {css_bytes} bytes (mínimo: {css_min}). "
                f"{'33 bytes = stub (só hide_title). ' if css_bytes == 33 else ''}"
                "CSS não foi gerado. "
                "Causa: Post::create($id)->update() não foi chamado. "
                "Fix: usar scripts/injetar_elementor.php (passo 8)."
            )
            erros.append(msg)
    else:
        avisos.append(
            f"Check 12: --page-assets-count e --css-bytes não fornecidos — "
            f"verificar manualmente (limiar CSS para este modo: {css_min} bytes)"
        )

    # Check 13 — Metas Yoast gravadas (aviso, não bloqueio)
    if yoast_kw is not None or yoast_desc is not None or yoast_title is not None:
        missing_yoast = []
        if yoast_title is not None and not yoast_title.strip():
            missing_yoast.append('_yoast_wpseo_title')
        if yoast_kw is not None and not yoast_kw.strip():
            missing_yoast.append('_yoast_wpseo_focuskw')
        if yoast_desc is not None and not yoast_desc.strip():
            missing_yoast.append('_yoast_wpseo_metadesc')
        if missing_yoast:
            avisos.append(
                f"Check 13: metas Yoast vazias no banco: {', '.join(missing_yoast)} — "
                "preencher $params['yoast_title'], 'yoast_kw', 'yoast_desc' no script"
            )
    else:
        avisos.append(
            "Check 13: --yoast-kw/--yoast-desc/--yoast-title não fornecidos — "
            "verificar manualmente se metas _yoast_wpseo_* foram gravadas"
        )

    # Resultado
    if erros:
        print(f"FAIL — {len(erros)} erro(s):")
        for e in erros:
            print(f"  - {e}")
        if avisos:
            print("Avisos (não bloqueiam):")
            for a in avisos:
                print(f"  ~ {a}")
        return 1

    css_info = f" CSS={css_bytes}b." if css_bytes is not None else ""
    assets_info = f" page_assets={page_assets_count}." if page_assets_count is not None else ""
    print(
        f"PASS — injeção validada. {len(widgets)} widgets."
        f"{css_info}{assets_info} "
        f"KW {'encontrada' if kw_found else 'não localizada (aviso)'}."
    )
    for a in avisos:
        print(f"  ~ {a}")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Valida _elementor_data após injeção de Money Page"
    )
    parser.add_argument("--arquivo", required=True, help="Caminho para o JSON do _elementor_data")
    parser.add_argument("--kw", required=True, help="Keyword principal da página")
    parser.add_argument(
        "--mold",
        default="",
        help="Strings do molde a proibir (separadas por vírgula)",
    )
    parser.add_argument(
        "--min-widgets",
        type=int,
        default=1,
        dest="min_widgets",
        help="Mínimo de widgets esperados (default: 1)",
    )
    parser.add_argument(
        "--page-settings",
        dest="page_settings",
        default="",
        help="Valor bruto de _elementor_page_settings (serializado do WordPress). Se fornecido, Check 8 valida formato.",
    )
    parser.add_argument(
        "--post-content",
        dest="post_content",
        default=None,
        help="Valor de post_content da página no banco (get_post_field). "
             "Se fornecido, Check 10 valida que contém <!-- Elementor -->.",
    )
    parser.add_argument(
        "--edit-mode",
        dest="edit_mode",
        default=None,
        help="Valor de _elementor_edit_mode no banco. "
             "Se fornecido, Check 11 valida que é 'builder'.",
    )
    parser.add_argument(
        "--page-assets-count",
        dest="page_assets_count",
        type=int,
        default=None,
        help="Número de chaves em _elementor_page_assets (0 = vazio). "
             "Se fornecido, Check 12 valida que é > 0.",
    )
    parser.add_argument(
        "--css-bytes",
        dest="css_bytes",
        type=int,
        default=None,
        help="Tamanho em bytes do arquivo CSS da página (post-ID.css). "
             "Se fornecido, Check 12 valida que é > 1000.",
    )
    parser.add_argument("--yoast-kw",    dest="yoast_kw",    default=None, help="Valor de _yoast_wpseo_focuskw no banco.")
    parser.add_argument("--yoast-desc",  dest="yoast_desc",  default=None, help="Valor de _yoast_wpseo_metadesc no banco.")
    parser.add_argument("--yoast-title", dest="yoast_title", default=None, help="Valor de _yoast_wpseo_title no banco.")
    parser.add_argument("--modo", type=int, default=1, choices=[1, 2],
                        help="1=Money Page (molde, 45+ widgets); 2=institucional (text-editor, sem molde). "
                             "MODO 2: Check 6 vira aviso, limiar CSS cai para 50 bytes.")
    args = parser.parse_args()
    mold_strings = [s.strip() for s in args.mold.split(",") if s.strip()] if args.mold else []
    sys.exit(verificar(
        args.arquivo, args.kw, mold_strings, args.min_widgets,
        args.page_settings, args.post_content, args.edit_mode,
        args.page_assets_count, args.css_bytes,
        args.yoast_kw, args.yoast_desc, args.yoast_title,
        args.modo,
    ))
