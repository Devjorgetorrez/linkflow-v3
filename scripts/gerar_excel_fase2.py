"""
gerar_excel_fase2.py - Gera analise-tecnica-<slug>.xlsx com 7 abas (Fase 1 + 2)
Uso: python scripts/gerar_excel_fase2.py --slug <slug>
"""
import argparse
import os
import sys
from pathlib import Path

_PROJECT_DIR = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    print("FAIL: openpyxl nao instalado. Rode: pip install openpyxl")
    sys.exit(1)


def header_font():
    return Font(bold=True, color="FFFFFF", size=10)


def header_fill():
    return PatternFill("solid", fgColor="1F3864")


def alt_fill():
    return PatternFill("solid", fgColor="DCE6F1")


def thin_border():
    s = Side(style="thin")
    return Border(left=s, right=s, top=s, bottom=s)


def center_align():
    return Alignment(horizontal="center", vertical="center", wrap_text=True)


def wrap_align():
    return Alignment(wrap_text=True, vertical="top")


def write_header(ws, cols):
    ws.append(cols)
    for i in range(1, len(cols) + 1):
        c = ws.cell(ws.max_row, i)
        c.font = header_font()
        c.fill = header_fill()
        c.alignment = center_align()
        c.border = thin_border()
    ws.row_dimensions[ws.max_row].height = 28


def write_data(ws, vals, alt=False):
    ws.append(vals)
    for i in range(1, len(vals) + 1):
        c = ws.cell(ws.max_row, i)
        if alt:
            c.fill = alt_fill()
        c.alignment = wrap_align()
        c.border = thin_border()


def auto_width(ws, min_w=12, max_w=55):
    for col in ws.columns:
        w = min_w
        for cell in col:
            try:
                if cell.value:
                    w = max(w, min(max_w, len(str(cell.value)) + 2))
            except Exception:
                pass
        ws.column_dimensions[get_column_letter(col[0].column)].width = w


def gerar(slug):
    pasta = _PROJECT_DIR / f"projetos/{slug}"
    saida = pasta / f"analise-tecnica-{slug}.xlsx"

    wb = openpyxl.Workbook()

    # --- ABA 1: Inventario_Concorrente ---
    ws1 = wb.active
    ws1.title = "Inventario_Concorrente"
    ws1.freeze_panes = "A2"
    write_header(ws1, ["Dominio", "URL", "Trafego/mes", "Backlinks", "Ref. Dominios", "Tipo", "Origem"])
    rows1 = [
        ("msadvogado.com.br", "/advogado-trabalhista-especializado/", 425, 13, 8, "Transacional", "domain_top_pages locId 2076"),
        ("msadvogado.com.br", "/trabalhista/", 340, 18, 6, "Transacional", "domain_top_pages locId 2076"),
        ("msadvogado.com.br", "/desconto-do-dsr-como-calcular-faltas/", 273, 5, 2, "Blog", "domain_top_pages locId 2076"),
        ("msadvogado.com.br", "/", 194, 42, 32, "Institucional", "domain_top_pages locId 2076"),
        ("msadvogado.com.br", "/6-direitos-dos-auxiliares-de-servicos-gerais/", 64, 0, 0, "Blog", "domain_top_pages locId 2076"),
        ("msadvogado.com.br", "/acidente-2/", 26, 0, 0, "Transacional", "domain_top_pages locId 2076"),
        ("msadvogado.com.br", "/advogado-trabalhista-online/", 7, 29, 5, "Transacional", "domain_top_pages locId 2076"),
        ("msadvogado.com.br", "/rescisao-indireta/", 2, 7, 3, "Transacional", "domain_top_pages locId 2076"),
        ("advocaciagodoy.com.br", "/advogado-trabalhista-piracicaba-sp", 62, 1901, 224, "Transacional (outra cidade)", "domain_top_pages locId 2076"),
        ("advocaciagodoy.com.br", "/advogado-trabalhista-campinas-sp", 50, 0, 0, "Transacional", "domain_top_pages locId 2076"),
        ("advocaciagodoy.com.br", "/calcular-rescisao", 25, 0, 0, "Transacional (ferramenta)", "domain_top_pages locId 2076"),
        ("advocaciagodoy.com.br", "/advogado-trabalhista-americana-sp", 24, 0, 0, "Transacional (regiao)", "domain_top_pages locId 2076"),
        ("advocaciagodoy.com.br", "/advogado-trabalhista-de-graca", 11, 0, 0, "Transacional", "domain_top_pages locId 2076"),
        ("advlaboral.com.br", "/direito-do-trabalho/advogado-trabalhista-em-campinas-sp/", 40, 0, 0, "Transacional", "domain_top_pages locId 2076"),
        ("advlaboral.com.br", "/direito-do-trabalho/advogado-trabalhista-em-manaus/", 42, 0, 0, "Transacional (outra cidade)", "domain_top_pages locId 2076"),
    ]
    for i, row in enumerate(rows1):
        write_data(ws1, list(row), alt=(i % 2 == 1))
    auto_width(ws1)

    # --- ABA 2: Paginas_Concorrentes ---
    ws2 = wb.create_sheet("Paginas_Concorrentes")
    ws2.freeze_panes = "A2"
    write_header(ws2, ["Concorrente", "URL", "KW Provavel", "Trafego/mes", "Backlinks", "Tipo", "Money Page candidata?"])
    rows2 = [
        ("msadvogado.com.br", "/advogado-trabalhista-especializado/", "advogado trabalhista especializado", 425, 13, "Transacional", "SIM"),
        ("msadvogado.com.br", "/trabalhista/", "advogado trabalhista campinas", 340, 18, "Transacional", "SIM"),
        ("msadvogado.com.br", "/acidente-2/", "auxilio acidente trabalho", 26, 0, "Transacional", "SIM - gap"),
        ("msadvogado.com.br", "/rescisao-indireta/", "rescisao indireta", 2, 7, "Transacional", "SIM - gap"),
        ("msadvogado.com.br", "/advogado-trabalhista-online/", "advogado trabalhista online", 7, 29, "Transacional", "AVALIAR"),
        ("msadvogado.com.br", "/desconto-do-dsr-como-calcular-faltas/", "calcular desconto DSR", 273, 5, "Blog", "NAO - blog"),
        ("advocaciagodoy.com.br", "/advogado-trabalhista-campinas-sp", "advogado trabalhista campinas", 50, 0, "Transacional", "SIM"),
        ("advocaciagodoy.com.br", "/calcular-rescisao", "calculadora rescisao trabalhista", 25, 0, "Transacional (ferramenta)", "SIM - gap"),
        ("advocaciagodoy.com.br", "/advogado-trabalhista-de-graca", "advogado trabalhista gratuito", 11, 0, "Transacional", "AVALIAR - OAB"),
        ("advocaciagodoy.com.br", "/post/como-funciona-o-aviso-previo/", "como funciona aviso previo", 0, 0, "Blog", "NAO - informacional"),
        ("advlaboral.com.br", "/direito-do-trabalho/advogado-trabalhista-em-campinas-sp/", "advogado trabalhista campinas", 40, 0, "Transacional", "SIM"),
    ]
    for i, row in enumerate(rows2):
        write_data(ws2, list(row), alt=(i % 2 == 1))
    auto_width(ws2)

    # --- ABA 3: Arquitetura_Sugerida ---
    ws3 = wb.create_sheet("Arquitetura_Sugerida")
    ws3.freeze_panes = "A2"
    write_header(ws3, ["Nivel", "Slug sugerido", "Tipo", "KW principal", "Referencia concorrente", "Observacao"])
    rows3 = [
        (0, "/", "Home (Money Page principal)", "advogado trabalhista campinas", "msadvogado.com.br /", "KW principal 720/mes"),
        (1, "/rescisao-trabalhista-campinas/", "Money Page - Servico", "rescisao trabalhista campinas", "msadvogado.com.br /rescisao/", "Servico #1 do cliente"),
        (1, "/assedio-moral-campinas/", "Money Page - Servico", "advogado assedio moral campinas", "msadvogado.com.br /danos-morais/", "Servico #3 do cliente"),
        (1, "/calculo-rescisao-trabalhista/", "Money Page - Ferramenta", "calculadora rescisao trabalhista", "advocaciagodoy.com.br /calcular-rescisao", "Gap competitivo - 25 vis/mes no concorrente"),
        (1, "/acidente-trabalho-campinas/", "Money Page - Servico (gap)", "advogado acidente trabalho campinas", "msadvogado.com.br /acidente-de-trabalho/", "Gap - concorrente tem 26 vis/mes"),
        (1, "/rescisao-indireta-campinas/", "Money Page - Servico (gap)", "rescisao indireta campinas", "msadvogado.com.br /rescisao-indireta/", "Gap competitivo"),
        (1, "/blog/", "Silo de conteudo", "-", "-", "Fase 3 - artigos informativos"),
    ]
    for i, row in enumerate(rows3):
        write_data(ws3, list(row), alt=(i % 2 == 1))
    auto_width(ws3)

    # --- ABA 4: Plano_Construcao ---
    ws4 = wb.create_sheet("Plano_Construcao")
    ws4.freeze_panes = "A2"
    write_header(ws4, ["Prioridade", "Slug", "KW principal", "Volume/mes", "SD", "Status", "Schema"])
    rows4 = [
        (1, "/", "advogado trabalhista campinas", 720, 40, "blueprint", "LegalService"),
        (2, "/rescisao-trabalhista-campinas/", "rescisao trabalhista campinas", 0, 12, "blueprint", "LegalService + Service"),
        (3, "/assedio-moral-campinas/", "advogado assedio moral campinas", 0, 4, "blueprint", "LegalService + Service"),
        (4, "/calculo-rescisao-trabalhista/", "calculadora rescisao trabalhista", "-", "-", "blueprint", "WebPage"),
        (5, "/acidente-trabalho-campinas/", "advogado acidente trabalho campinas", "-", "-", "blueprint (gap)", "LegalService + Service"),
        (6, "/rescisao-indireta-campinas/", "rescisao indireta campinas", "-", "-", "blueprint (gap)", "LegalService + Service"),
    ]
    for i, row in enumerate(rows4):
        write_data(ws4, list(row), alt=(i % 2 == 1))
    auto_width(ws4)

    # --- ABA 5: RaioX_Tecnico ---
    ws5 = wb.create_sheet("RaioX_Tecnico")
    ws5.freeze_panes = "A2"
    write_header(ws5, ["Sinal", "Status", "Detalhe", "Recomendacao para o cliente"])
    rows5 = [
        ("URL limpa", "SIM", "Slugs legiveis, sem parametros", "Manter padrao /<slug>/ no WP"),
        ("Renderizacao", "SSR", "Conteudo no HTML bruto (WordPress)", "WordPress = SSR nativo"),
        ("HTTPS", "SIM", "Site acessivel em https://", "Configurar SSL no host"),
        ("robots.txt", "OK", "Disallow: vazio; Sitemap: apontado", "Yoast gera automaticamente"),
        ("CMS", "WordPress + Yoast", "Confirmado pelo sitemap_index.xml", "Padrao do nicho"),
        ("Canonical", "NAO VERIFICADO", "Tag nao encontrada no HTML via WebFetch", "Yoast gera canonical automaticamente"),
        ("Meta viewport", "NAO VERIFICADO", "Tag nao encontrada no HTML via WebFetch", "WordPress/Yoast gera automaticamente"),
        ("Breadcrumbs", "NAO DETECTADO", "Sem BreadcrumbList no HTML", "Ativar em Yoast > Search Appearance > Breadcrumbs"),
        ("IndexNow", "NAO DETECTADO", "Sem referencia no HTML", "Plugin IndexNow para Bing/Yandex"),
        ("Schema JSON-LD", "AUSENTE (lider)", "Nenhum concorrente real usa schema", "OPORTUNIDADE: implementar LegalService via WPCode"),
    ]
    for i, row in enumerate(rows5):
        write_data(ws5, list(row), alt=(i % 2 == 1))
    auto_width(ws5)

    # --- ABA 6: Schema_Concorrentes ---
    ws6 = wb.create_sheet("Schema_Concorrentes")
    ws6.freeze_panes = "A2"
    write_header(ws6, ["Concorrente", "Pagina", "Schemas detectados", "JSON-LD?", "Acao recomendada"])
    rows6 = [
        ("msadvogado.com.br", "/ (home)", "Nenhum", "NAO", "OPORTUNIDADE: LegalService + Organization"),
        ("msadvogado.com.br", "/trabalhista/", "Nenhum", "NAO", "OPORTUNIDADE: LegalService + Service"),
        ("advocaciagodoy.com.br", "/ (home)", "Nao verificado via WebFetch", "-", "Verificar manualmente se necessario"),
        ("jusbrasil.com.br", "/advogados/direito-do-trabalho-sp-campinas/", "Provavelmente tem (DA 91)", "-", "Diretorio - nao aplicavel ao cliente"),
        ("[NOME DO ESCRITORIO]", "/ (blueprint)", "LegalService gerado (ver analise-tecnica.md)", "SIM - JSON-LD pronto", "Injetar via WPCode gratuito"),
        ("[NOME DO ESCRITORIO]", "/rescisao-trabalhista-campinas/", "LegalService + Service gerado", "SIM - JSON-LD pronto", "WPCode > Specific Pages"),
        ("[NOME DO ESCRITORIO]", "/calculo-rescisao-trabalhista/", "WebPage", "SIM - JSON-LD pronto", "NAO usar Service - e ferramenta/WebPage"),
    ]
    for i, row in enumerate(rows6):
        write_data(ws6, list(row), alt=(i % 2 == 1))
    auto_width(ws6)

    # --- ABA 7: Handoff_Fase3 ---
    ws7 = wb.create_sheet("Handoff_Fase3")
    ws7.freeze_panes = "A2"
    write_header(ws7, ["Pagina", "KW principal", "Volume/mes", "Estrutura de conteudo", "Schema", "Tom (OAB)", "Status"])
    rows7 = [
        ("/", "advogado trabalhista campinas", 720, "H1 direto + problema solucao + areas + CTA WhatsApp", "LegalService", "Perfil 1 - acolhedor; sem prometer resultado", "blueprint"),
        ("/rescisao-trabalhista-campinas/", "rescisao trabalhista campinas", 0, "H1 + o que e + quando acionar + como funciona + CTA", "LegalService + Service", "Perfil 1; nunca garante rescisao", "blueprint"),
        ("/assedio-moral-campinas/", "advogado assedio moral campinas", 0, "H1 + o que e + evidencias + como agir + CTA", "LegalService + Service", "Perfil 1; acolher quem sofre", "blueprint"),
        ("/calculo-rescisao-trabalhista/", "calculadora rescisao trabalhista", "-", "H1 + ferramenta + campos explicados + CTA consulta", "WebPage", "Perfil 2 - educativo; orientar sobre direitos", "blueprint"),
        ("/acidente-trabalho-campinas/", "advogado acidente trabalho campinas", "-", "H1 + tipos + direitos + como agir + CTA", "LegalService + Service", "Perfil 1 - quem esta em estado grave", "blueprint (gap)"),
        ("/rescisao-indireta-campinas/", "rescisao indireta campinas", "-", "H1 + o que e + exemplos + como provar + CTA", "LegalService + Service", "Perfil 1 - trabalhador prejudicado", "blueprint (gap)"),
    ]
    for i, row in enumerate(rows7):
        write_data(ws7, list(row), alt=(i % 2 == 1))
    auto_width(ws7)

    wb.save(str(saida))
    print(f"PASS - Excel gerado: {saida} ({wb.sheetnames})")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    args = parser.parse_args()
    sys.exit(gerar(args.slug))
