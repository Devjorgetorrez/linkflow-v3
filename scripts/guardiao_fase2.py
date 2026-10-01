"""
guardiao_fase2.py - Valida projeto.md apos a Fase 2 (raio-X tecnico)
Uso: python scripts/guardiao_fase2.py --slug <slug>
"""

import argparse
import os
import re
import sys
from pathlib import Path

_PROJECT_DIR = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))

def verificar(slug):
    pasta = _PROJECT_DIR / f"projetos/{slug}"
    caminho = pasta / "projeto.md"
    if not caminho.exists():
        print(f"FAIL: projeto.md nao encontrado em {caminho}")
        return 1

    conteudo = caminho.read_text(encoding="utf-8")
    erros = []
    avisos = []

    # 1. Secao Raio-X Tecnico existe
    if not re.search(r"## Raio-X T[eé]cnico", conteudo, re.IGNORECASE):
        erros.append("Secao 'Raio-X Tecnico (Fase 2)' nao encontrada")

    # 2. Arvore de silos preenchida
    if not re.search(r"[Aá]rvore de Silos", conteudo, re.IGNORECASE):
        erros.append("Arvore de Silos nao encontrada - fase2-arvore nao rodou/salvou")

    # 3. Schema por tipo de pagina
    if not re.search(r"Schema", conteudo, re.IGNORECASE):
        erros.append("Secao de Schema nao encontrada - fase2-schema nao rodou/salvou")
    # verificar se detectou schema do lider (ausente ou presente, mas registrado)
    if not re.search(r"(HomeAndConstruction|LocalBusiness|schema.*ausente|Schema.*ausente|JSON-LD)", conteudo, re.IGNORECASE):
        avisos.append("Schema mencionado mas sem JSON-LD gerado nem status do lider claro")

    # 4. SEO Tecnico do lider
    if not re.search(r"SEO T[eé]cnico", conteudo, re.IGNORECASE):
        erros.append("Secao 'SEO Tecnico' nao encontrada - fase2-tecnico nao rodou/salvou")

    # 5. Quality gate de localizacao registrado
    if not re.search(r"[Qq]uality [Gg]ate|localiza[cç][aã]o", conteudo, re.IGNORECASE):
        avisos.append("Quality gate de localizacao nao mencionado")

    # 6. Diagnostico - condicional (so cobra se cliente TEM site)
    tem_site = re.search(r"Site[^\n]*:[ \t]*(https?://|www\.)", conteudo, re.IGNORECASE)
    if tem_site:
        if not re.search(r"VEREDITO|Diagn[oó]stico do Site", conteudo, re.IGNORECASE):
            erros.append("Cliente TEM site mas nao ha Diagnostico/VEREDITO - fase2-diagnostico nao rodou")

    # 7. Handoff para Fase 3
    if not re.search(r"Handoff", conteudo, re.IGNORECASE):
        erros.append("Secao 'Handoff para Fase 3' nao preenchida")

    # 8. Entregaveis existem (Markdown + Excel)
    md = pasta / f"analise-tecnica-{slug}.md"
    xlsx = pasta / f"analise-tecnica-{slug}.xlsx"
    if not md.exists():
        erros.append(f"Entregavel Markdown nao gerado: analise-tecnica-{slug}.md")
    if not xlsx.exists():
        erros.append(f"Entregavel Excel nao gerado: analise-tecnica-{slug}.xlsx")

    # 9. Schema anti-invencao: telephone vazio e ERRO (C4)
    if re.search(r'telephone["\s]*:["\s]*""', conteudo):
        erros.append("Schema com telephone vazio — omitir campo ou usar dado real (C4)")

    # 10. url do schema mas Site = 'a criar' — aviso (C2)
    if re.search(r'"url"\s*:\s*"https?://', conteudo) and re.search(r'Site[^\n]*a criar', conteudo, re.IGNORECASE):
        avisos.append("url no schema usa dominio nao confirmado — cliente ainda nao tem site (C2)")

    # 11. Placeholders [CAMPO] nos entregaveis — aviso (C5)
    if md.exists():
        md_txt = md.read_text(encoding="utf-8")
        placeholders = re.findall(r'\[[A-Z][A-Z\s_/]+\]', md_txt)
        if placeholders:
            avisos.append(f"{len(placeholders)} placeholder(s) a preencher antes de publicar: {', '.join(sorted(set(placeholders)))}")

    if erros:
        print(f"FAIL - {len(erros)} problema(s):")
        for e in erros:
            print(f"  - {e}")
        if avisos:
            print("Avisos:")
            for a in avisos:
                print(f"  ~ {a}")
        return 1

    print("PASS - Fase 2 validada.")
    if avisos:
        for a in avisos:
            print(f"  ~ {a}")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    args = parser.parse_args()
    sys.exit(verificar(args.slug))