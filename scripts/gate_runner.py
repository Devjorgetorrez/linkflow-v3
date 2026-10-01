"""
gate_runner.py — Verificador de campos obrigatórios por fase
Uso: python scripts/gate_runner.py --slug <slug> --fase <1|2|3|5>
Retorna lista de campos faltando. Se tudo OK, confirma que o agente pode apresentar resumo ao cliente.
"""

import argparse
import os
import re
import sys
from pathlib import Path

_PROJECT_DIR = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))

CAMPOS_POR_FASE = {
    "1": [
        ("NAP - Nome",        r"- Nome:\s*\S+"),
        ("NAP - Endereco",    r"- Endereco:\s*\S+"),
        ("NAP - Telefone",    r"- Telefone:\s*\S+"),
        ("KW principal",      r"- `kw_principal`:\s*\S+"),
        ("Concorrentes",      r"^1\.\s*\S+",),
        ("location_id",       r"- `location_id`\s*\(Ubersuggest\):\s*\S+"),
        ("Baseline - Data",   r"- Data:\s*\S+"),
        ("SERP snapshot",     r"- Local pack:"),
    ],
    "2": [
        ("WordPress URL",     r"- WordPress URL:\s*\S+"),
        ("Novamira instalado",r"Novamira:.*\(x\)"),
        ("Mapa de URLs",      r"- Mapa de URLs:\s*\S+"),
    ],
    "3": [
        ("Money Pages",       r"\| .+ \| .+ \| .+ \|"),
        ("publish-approved",  r"publish-approved:\s*true"),
    ],
    "5": [
        ("GBP locId",         r"- locId:\s*\S+"),
        ("NAP consistente",   r"NAP consistente com site:.*\(x\)"),
    ],
}

def verificar(slug: str, fase: str) -> int:
    caminho = _PROJECT_DIR / f"projetos/{slug}/projeto.md"
    if not caminho.exists():
        print(f"ERRO: projeto.md não encontrado em {caminho}")
        return 1

    conteudo = caminho.read_text(encoding="utf-8")
    faltando = []

    campos = CAMPOS_POR_FASE.get(fase)
    if not campos:
        print(f"ERRO: fase '{fase}' não reconhecida. Use 1, 2, 3 ou 5.")
        return 1

    for nome, padrao in campos:
        if not re.search(padrao, conteudo, re.MULTILINE):
            faltando.append(nome)

    if faltando:
        print(f"GATE FASE {fase} — BLOQUEADO")
        print("Campos obrigatórios faltando:")
        for f in faltando:
            print(f"  - {f}")
        return 1

    print(f"GATE FASE {fase} — OK. Todos os campos preenchidos.")
    print("Agente pode apresentar resumo ao cliente.")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    parser.add_argument("--fase", required=True)
    args = parser.parse_args()
    sys.exit(verificar(args.slug, args.fase))
