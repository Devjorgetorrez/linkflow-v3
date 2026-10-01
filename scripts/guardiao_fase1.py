"""
guardiao_fase1.py - Valida projeto.md apos a Fase 1 (planejamento)
Uso: python scripts/guardiao_fase1.py --slug <slug>
"""

import argparse
import os
import re
import sys
from pathlib import Path

_PROJECT_DIR = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))

def verificar(slug):
    caminho = _PROJECT_DIR / f"projetos/{slug}/projeto.md"
    if not caminho.exists():
        print(f"FAIL: projeto.md nao encontrado em {caminho}")
        return 1

    conteudo = caminho.read_text(encoding="utf-8")
    erros = []
    avisos = []

    # CHECK 0 — PRÉ-REQUISITO BLOQUEANTE: Fase 0 concluída OU marcada como
    # nao aplicavel (cliente sem site — nao ha WordPress pra auditar). Gate
    # binario "linha existe ou nao" travava todo cliente de site novo, que
    # e um dos dois cenarios principais do produto, nao uma excecao.
    if not re.search(r"auditoria_global\s*:\s*(concluida|n[ãa]o se aplica)", conteudo, re.IGNORECASE):
        print("FAIL: Fase 0 (auditoria do site) nao foi executada. E pre-requisito da Fase 1.")
        print("  Execute /link-flow auditoria antes de rodar o planejamento.")
        return 1

    match = re.search(r"`kw_principal`:[ \t]*(.+)", conteudo)
    if not match:
        erros.append("kw_principal nao encontrada")
    else:
        valor = match.group(1).strip().lower()
        anotacoes = ["a definir", "a confirmar", "fase 1", "pendente", "["]
        if not valor or any(x in valor for x in anotacoes):
            erros.append("kw_principal contem anotacao de status ou esta vazia — deve conter apenas a KW limpa")

    match = re.search(r"## Concorrentes.*?\n(.*?)(?=\n##|\n>|\Z)", conteudo, re.DOTALL | re.IGNORECASE)
    if match:
        dominios = re.findall(r"\d+\.\s*(\S+\.\S+?)\s", match.group(1))
        dominios_limpos = [d for d in dominios if len(d) > 4 and "." in d]
        if len(dominios_limpos) < 3:
            avisos.append(f"Menos de 3 concorrentes ({len(dominios_limpos)}) - ok se nicho pequeno")
    else:
        erros.append("Secao de concorrentes nao encontrada")

    match = re.search(r"## Paginas dos Concorrentes.*?\n(.*?)(?=\n##|\Z)", conteudo, re.DOTALL | re.IGNORECASE)
    if match:
        linhas = [l for l in match.group(1).split("\n") if l.strip().startswith("|") and "---" not in l and "URL" not in l and "Concorrente" not in l]
        if len(linhas) < 1:
            erros.append("Tabela 'Paginas dos Concorrentes' vazia - usar locId NACIONAL 2076 no domain_top_pages")
        else:
            trafegos = []
            for linha in linhas:
                for col in [c.strip() for c in linha.split("|") if c.strip()]:
                    num = re.match(r"^(\d+)$", col)
                    if num:
                        trafegos.append(int(num.group(1)))
            if trafegos and all(t == 0 for t in trafegos):
                erros.append("Trafego ZERADO em tudo - provavel locId errado. Refazer com locId 2076")
    else:
        erros.append("Secao 'Paginas dos Concorrentes' nao encontrada - Etapa 5 nao salva")

    match = re.search(r"## Money Pages.*?\n(.*?)(?=\n##|\Z)", conteudo, re.DOTALL | re.IGNORECASE)
    if match:
        linhas_tabela = [l for l in match.group(1).split("\n") if l.strip().startswith("|") and "---" not in l and "Slug" not in l and "URL" not in l]
        if len(linhas_tabela) < 1:
            erros.append("Nenhuma Money Page candidata")
        else:
            kws = []
            for linha in linhas_tabela:
                cols = [c.strip() for c in linha.split("|") if c.strip()]
                if len(cols) >= 3:
                    kws.append(cols[2].lower())
            duplicadas = set([k for k in kws if kws.count(k) > 1 and k])
            if duplicadas:
                erros.append(f"Money Pages com KW duplicada: {duplicadas}")
    else:
        erros.append("Secao Money Pages nao encontrada")

    if not re.search(r"## Arquitetura Aprovada", conteudo, re.IGNORECASE):
        erros.append("Secao Arquitetura Aprovada nao encontrada")

    match = re.search(r"## Baseline.*?\n(.*?)(?=\n##|\Z)", conteudo, re.DOTALL | re.IGNORECASE)
    if match:
        if not re.search(r"Data:\s*\S", match.group(1)):
            erros.append("Baseline sem data")
    else:
        erros.append("Secao Baseline nao encontrada")

    aprovado = re.search(r"`?approved`?:\s*true", conteudo, re.IGNORECASE)
    if aprovado and erros:
        erros.append("approved:true marcado mas ha pendencias")

    if erros:
        print(f"FAIL - {len(erros)} problema(s):")
        for e in erros:
            print(f"  - {e}")
        if avisos:
            print("Avisos:")
            for a in avisos:
                print(f"  ~ {a}")
        return 1

    print("PASS - Fase 1 validada.")
    if avisos:
        for a in avisos:
            print(f"  ~ {a}")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    args = parser.parse_args()
    sys.exit(verificar(args.slug))