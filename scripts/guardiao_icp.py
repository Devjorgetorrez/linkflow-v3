"""
guardiao_icp.py - Valida projeto.md antes de criar
Uso: python scripts/guardiao_icp.py --slug <slug>
"""

import argparse
import os
import re
import sys
from pathlib import Path

_PROJECT_DIR = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))

PERFIS_VALIDOS = ["perfil 1", "perfil 2", "perfil 3", "perfil 4"]

def verificar(slug):
    caminho = _PROJECT_DIR / f"projetos/{slug}/projeto.md"
    if not caminho.exists():
        print(f"FAIL: projeto.md nao encontrado em {caminho}")
        return 1

    conteudo = caminho.read_text(encoding="utf-8")
    conteudo_lower = conteudo.lower()
    erros = []

    match = re.search(r"Negocio / segmento:[ \t]*(.+)", conteudo)
    if not match or not match.group(1).strip():
        erros.append("Nome do negocio nao preenchido")

    match = re.search(r"Cidade / regiao / raio:[ \t]*(.+)", conteudo)
    if not match or not match.group(1).strip():
        erros.append("Cidade/regiao nao preenchida")

    match = re.search(r"Servicos \(priorizados.*?\):\s*\n(.*?)(?=\n-\s*[A-Z`])", conteudo, re.DOTALL)
    if match:
        servicos_texto = match.group(1).strip()
        linhas = [l.strip() for l in servicos_texto.split("\n") if re.match(r"^\d+\.", l.strip())]
        if len(linhas) < 2:
            erros.append(f"Menos de 2 servicos detalhados (encontrado: {len(linhas)})")
    else:
        erros.append("Secao de servicos (ICP) nao encontrada no projeto.md")

    # Concorrentes nao sao coletados no onboarding.
    # A secao ## Concorrentes e preenchida pela Fase 1 (ETAPA 3 - SERP overlap).
    # Pode ficar vazia aqui — nao e erro.

    tem_regulacao = re.search(
        r"([A-Z]{2,7}(-[A-Z]{2})?\s?\d|regulado:\s*[`']?true|regulado:\s*[`']?false|nao tem regulacao)",
        conteudo, re.IGNORECASE
    )
    if not tem_regulacao:
        erros.append("Regulacao nao respondida")

    tom_valido = any(p in conteudo_lower for p in PERFIS_VALIDOS)
    if not tom_valido:
        erros.append("Tom de voz sem numero de perfil (1/2/3/4)")

    match = re.search(r"^slug:[ \t]*(\S+)", conteudo, re.MULTILINE | re.IGNORECASE)
    if not match or not match.group(1).strip():
        erros.append("Slug nao registrado")

    match = re.search(r"^site_tipo:[ \t]*(astro|wordpress)[ \t]*$", conteudo, re.MULTILINE | re.IGNORECASE)
    if not match:
        erros.append(
            "site_tipo nao registrado ou invalido (deve ser 'astro' ou 'wordpress') — "
            "Bloco 0 do onboarding define isso antes de qualquer outra pergunta"
        )

    # Verificacao site + sitemap (E2)
    match_site = re.search(r'Site \(host WordPress\):[ \t]*(.+)', conteudo)
    if match_site:
        site_valor = match_site.group(1).strip()
        if site_valor.lower() not in ['nenhum', 'a criar', '_(a criar)', '']:
            # cliente tem site - verificar se sitemap foi registrado
            tem_sitemap = re.search(r'sitemap_url|sitemap_status', conteudo, re.IGNORECASE)
            if not tem_sitemap:
                erros.append('Cliente tem site mas sitemap_url e sitemap_status nao foram registrados no projeto.md')

    # kw_principal NAO e obrigatoria no onboarding - fica "a definir" ate a Fase 1
    match = re.search(r"`kw_principal`:[ \t]*(.+)", conteudo)
    if not match or not match.group(1).strip():
        erros.append("Campo kw_principal ausente (deveria conter 'a definir - Fase 1')")

    # Sem estes dados o redator gera placeholder e a Verificacao A bloqueia a entrega.
    match = re.search(r"- CEP:[ \t]*(.+)", conteudo)
    if not match or not match.group(1).strip() or match.group(1).strip().startswith('['):
        erros.append("CEP ausente no NAP — obrigatorio para schema JSON-LD (postalCode)")

    match = re.search(r"- Dias e horarios:[ \t]*(.+)", conteudo)
    if not match or not match.group(1).strip() or match.group(1).strip().startswith('['):
        erros.append("Horario de atendimento ausente — usado no schema openingHours, rodape e FAQ")

    regulado_true = re.search(r"regulado:\s*[`']?true", conteudo, re.IGNORECASE)
    if regulado_true:
        match = re.search(r"- Numero de registro:[ \t]*(.+)", conteudo)
        if not match or not match.group(1).strip() or match.group(1).strip().startswith('['):
            erros.append("Profissao regulada mas numero de registro ausente — orgao exige em toda publicidade")

    if erros:
        print(f"FAIL - {len(erros)} problema(s):")
        for e in erros:
            print(f"  - {e}")
        return 1

    print("PASS - Todos os itens validados.")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    args = parser.parse_args()
    sys.exit(verificar(args.slug))