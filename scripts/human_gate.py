"""
human_gate.py — Grava aprovação do cliente no projeto.md
Uso: python scripts/human_gate.py --slug <slug> --gate <1|2>
Gate 1: aprovação da arquitetura (approved: true)
Gate 2: aprovação para publicar (publish-approved: true)
"""

import argparse
import os
import re
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
    original = conteudo
    agora = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    if gate == "1":
        if "approved: true" in conteudo:
            print("Gate 1 já foi aprovado anteriormente. Nenhuma alteração feita.")
            return 0
        conteudo = re.sub(r"`approved:\s*false`", "`approved: true`", conteudo)
        conteudo = re.sub(r"-\s*`approved_at`:.*", f"- `approved_at`: {agora}", conteudo)
        conteudo = re.sub(
            r"-\s*\[ \]\s*Fase 1 Planejamento\s+\[ \]\s*\.approved",
            f"- [x] Fase 1 Planejamento  [x] .approved — {agora}",
            conteudo,
        )
        rotulo = "Gate 1"

    elif gate == "2":
        if "publish-approved: true" in conteudo:
            print("Gate 2 já foi aprovado anteriormente. Nenhuma alteração feita.")
            return 0
        conteudo = re.sub(
            r"-\s*\[ \]\s*Fase 3 Conteudo\s+\[ \]\s*\.publish-approved",
            f"- [x] Fase 3 Conteudo      [x] .publish-approved — {agora}",
            conteudo,
        )
        conteudo += f"\n\npublish-approved: true\npublish-approved-at: {agora}\n"
        rotulo = "Gate 2"

    else:
        print(f"ERRO: gate '{gate}' não reconhecido. Use 1 ou 2.")
        return 1

    # Sem isto, um marcador ausente (projeto.md fora do formato esperado —
    # foi exatamente o caso enquanto o template nao existia) fazia o
    # str.replace() antigo virar no-op silencioso: nada mudava no arquivo,
    # mas o script imprimia "Gate gravado" do mesmo jeito (erro 99,
    # Relatorio de Testes 6). Agora só confirma sucesso se o conteudo
    # realmente mudou.
    if conteudo == original:
        print(
            f"ERRO: nenhum marcador do {rotulo} foi encontrado em {caminho} — "
            "nada foi alterado. Confira se o projeto.md segue o formato de "
            "skills/orquestrador/templates/projeto.md (marcadores "
            "`approved: false`, `approved_at`, e as linhas de checklist em "
            "## Estado das Fases)."
        )
        return 1

    caminho.write_text(conteudo, encoding="utf-8")
    print(f"{rotulo} gravado — confirmado no arquivo ({agora}).")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    parser.add_argument("--gate", required=True)
    args = parser.parse_args()
    sys.exit(gravar_aprovacao(args.slug, args.gate))
