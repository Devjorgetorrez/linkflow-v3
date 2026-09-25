"""
human_gate.py — Grava aprovação do cliente no projeto.md
Uso: python scripts/human_gate.py --slug <slug> --gate <1|2>
Gate 1: aprovação da arquitetura (approved: true)
Gate 2: aprovação para publicar (publish-approved: true)
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

_PROJECT_DIR = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))

def gravar_aprovacao(slug: str, gate: str) -> int:
    caminho = _PROJECT_DIR / f"projetos/{slug}/projeto.md"
    if not caminho.exists():
        print(f"ERRO: projeto.md não encontrado em {caminho}")
        return 1

    conteudo = caminho.read_text(encoding="utf-8")
    agora = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    if gate == "1":
        if "approved: true" in conteudo:
            print("Gate 1 já foi aprovado anteriormente. Nenhuma alteração feita.")
            return 0
        conteudo = conteudo.replace(
            "`approved: false`",
            f"`approved: true`"
        )
        conteudo = conteudo.replace(
            "- `approved_at`:",
            f"- `approved_at`: {agora}"
        )
        conteudo = conteudo.replace(
            "- [ ] Fase 1 Planejamento  [ ] .approved",
            f"- [x] Fase 1 Planejamento  [x] .approved — {agora}"
        )
        print(f"Gate 1 gravado. Arquitetura aprovada em {agora}.")

    elif gate == "2":
        if "publish-approved: true" in conteudo:
            print("Gate 2 já foi aprovado anteriormente. Nenhuma alteração feita.")
            return 0
        conteudo = conteudo.replace(
            "- [ ] Fase 3 Conteudo      [ ] .publish-approved",
            f"- [x] Fase 3 Conteudo      [x] .publish-approved — {agora}"
        )
        conteudo += f"\n\npublish-approved: true\npublish-approved-at: {agora}\n"
        print(f"Gate 2 gravado. Publicação aprovada em {agora}.")

    else:
        print(f"ERRO: gate '{gate}' não reconhecido. Use 1 ou 2.")
        return 1

    caminho.write_text(conteudo, encoding="utf-8")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    parser.add_argument("--gate", required=True)
    args = parser.parse_args()
    sys.exit(gravar_aprovacao(args.slug, args.gate))
