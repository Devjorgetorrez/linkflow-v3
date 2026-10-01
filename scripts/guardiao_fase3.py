"""
guardiao_fase3.py - Valida conteudo gerado na Fase 3 (Money Pages e blog)
Uso: python scripts/guardiao_fase3.py --slug <slug> --arquivo <caminho-do-arquivo.md>
"""

import argparse
import os
import re
import sys
from pathlib import Path

_PROJECT_DIR = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))

PALAVRAS_PROIBIDAS = [
    "solucoes completas", "comprometidos", "excelencia", "viabilizar", "otimizar",
    "result garantido", "melhor advogado", "melhor medico", "cobre tudo",
    "sem carencia", "aprovacao garantida"
]

def verificar(slug, arquivo):
    caminho_projeto = _PROJECT_DIR / f"projetos/{slug}/projeto.md"
    caminho_texto = Path(arquivo)

    erros = []
    avisos = []

    # 1. projeto.md existe e tem Gate 1 aprovado
    if not caminho_projeto.exists():
        print(f"FAIL: projeto.md nao encontrado em {caminho_projeto}")
        return 1
    projeto = caminho_projeto.read_text(encoding="utf-8")
    if not re.search(r"approved.*true|\.approved", projeto, re.IGNORECASE):
        erros.append("Gate 1 nao aprovado — rodar Fase 1 e 2 antes da Fase 3")

    # 2. Arquivo de conteudo existe
    if not caminho_texto.exists():
        print(f"FAIL: arquivo de conteudo nao encontrado: {caminho_texto}")
        return 1
    texto = caminho_texto.read_text(encoding="utf-8")

    # 3. H1 unico com KW
    h1s = re.findall(r'^# .+', texto, re.MULTILINE)
    if len(h1s) == 0:
        erros.append("H1 ausente — obrigatorio com KW principal")
    elif len(h1s) > 1:
        erros.append(f"Multiplos H1 encontrados ({len(h1s)}) — deve haver apenas 1")

    # 4. KW nas primeiras 100 palavras
    # Prioridade: frontmatter da página > projeto.md (evita usar kw global em páginas específicas)
    primeiras_100 = " ".join(texto.split()[:100]).lower()
    kw_match = re.search(r'kw_principal[:\s]+(.+)', texto, re.IGNORECASE) or \
               re.search(r'kw_principal[:\s]+(.+)', projeto, re.IGNORECASE)
    if kw_match:
        kw = kw_match.group(1).strip().lower().strip('"')
        if kw not in primeiras_100:
            erros.append(f"KW principal '{kw}' ausente nas primeiras 100 palavras")

    # 5. FAQ como ultimo H2
    h2s = re.findall(r'^## .+', texto, re.MULTILINE)
    if h2s:
        if not re.search(r'faq|perguntas frequentes', h2s[-1], re.IGNORECASE):
            erros.append(f"Ultimo H2 nao e FAQ — encontrado: '{h2s[-1]}'")
    else:
        erros.append("Nenhum H2 encontrado no texto")

    # 6. H2-1 em formato de pergunta
    if h2s and not h2s[0].strip().endswith("?"):
        erros.append(f"H2-1 nao e pergunta — encontrado: '{h2s[0]}'")

    # 7. CTA especifico minimo 3x
    ctas = len(re.findall(r'WhatsApp|ligue|fale conosco|solicite|entre em contato', texto, re.IGNORECASE))
    if ctas < 3:
        erros.append(f"CTA especifico encontrado {ctas}x — minimo 3")

    # 8. H2 Regioes atendidas obrigatorio
    if not re.search(r'[Rr]egi[oõ]es|[Aa]tendemos|[Aa]tua[çc][aã]o', texto, re.IGNORECASE):
        erros.append("Secao de Regioes Atendidas ausente — obrigatoria para SEO local")

    # 9. Anti-invencao: dados inventados
    if re.search(r'\(\d{2}\)\s*\d{4,5}-\d{4}', texto):
        if re.search(r'telefone.*a coletar|telephone.*placeholder|\[TELEFONE\]', projeto, re.IGNORECASE):
            erros.append("Telefone real no texto mas projeto.md tem placeholder — dado nao confirmado pelo cliente (C1-C5)")

    # 10. Placeholders visiveis — aviso (correto, nao e erro). So campo
    # simples tipo [TELEFONE] — todo maiusculo, sem instrucao de redacao.
    placeholders = re.findall(r'\[[A-Z][A-Z\s_/]+\]', texto)
    if placeholders:
        avisos.append(f"{len(placeholders)} placeholder(s) a preencher antes de publicar: {', '.join(sorted(set(placeholders)))}")

    # 10b. Placeholder DE PRODUCAO ou instrucao de redacao no corpo — BLOQUEANTE.
    # Achado real (Relatorio-Testes-4, erro 41): a pagina "Protocolo Dentario"
    # foi ao ar com "[TEXTO EM PRODUCAO — conteudo completo escrito na Fase 3.]"
    # e blocos tipo "[2-3 paragrafos. Tom de voz do projeto.md...]" — instrucao
    # de redacao embutida no arquivo .md que virou o HTML publicado. O check
    # 10 acima (so maiusculas) nao pega esse padrao porque tem minuscula e
    # pontuacao. Este aqui pega especificamente marcador de producao e bloco
    # de instrucao (digito + paragrafo(s), ou mencao a "tom de voz").
    instrucoes_redacao = re.findall(
        r'\[[^\]]*(?:TEXTO EM PRODU[CÇ][AÃ]O|\d+[\s-]*(?:a[\s-]*\d+)?\s*par[aá]grafo|[Tt]om de voz)[^\]]*\]',
        texto,
    )
    if instrucoes_redacao:
        erros.append(
            f"Placeholder de PRODUCAO ou instrucao de redacao ainda no corpo do texto "
            f"(nunca pode ir ao build): {'; '.join(sorted(set(instrucoes_redacao)))}"
        )

    # 10c. Qualquer outro colchete com minuscula dentro — bloqueante. O check 10
    # (aviso) so cobre placeholder de campo simples, TUDO MAIUSCULO (ex.:
    # [TELEFONE]). Colchete com minuscula e prosa/instrucao, nao um campo a
    # preencher — mesma classe do erro 41 (Relatorio de Testes 5): nota interna
    # ("regra do CFO", orientacao pro redator) vazando pro texto publico porque
    # nao batia com o regex estreito do check 10b. Generaliza sem tocar no
    # mecanismo de placeholder [CAMPO] (esse e comportamento valido, CLAUDE.md
    # regra 1 — nunca inventar dado).
    # Exclui link markdown de verdade: "[texto do link](url)" tem minuscula
    # dentro dos colchetes por natureza e nao e nota interna nenhuma.
    outros_colchetes_minusculos = [
        m for m in re.findall(r'\[[^\]]*[a-zà-ú][^\]]*\](?!\()', texto)
        if m not in instrucoes_redacao
    ]
    if outros_colchetes_minusculos:
        erros.append(
            f"Colchete com texto em minuscula no corpo (nota interna ou instrucao "
            f"vazando pro visitante, nunca pode ir ao build): "
            f"{'; '.join(sorted(set(outros_colchetes_minusculos)))}"
        )

    # 11. Palavras proibidas
    texto_lower = texto.lower()
    for palavra in PALAVRAS_PROIBIDAS:
        if palavra in texto_lower:
            erros.append(f"Palavra/frase proibida encontrada: '{palavra}'")

    # 12. Word count vs media dos 3 concorrentes (MODELO_ESCRITA Camada 1)
    palavras = len(texto.split())
    wc_match = re.search(r'word_count_media[:\s]+(\d+)', projeto, re.IGNORECASE)
    if wc_match:
        media = int(wc_match.group(1))
        minimo = int(media * 0.8)
        maximo = int(media * 1.5)
        if palavras < minimo:
            erros.append(f"Texto curto demais: {palavras} palavras — minimo 80% da media dos 3 ({minimo})")
        elif palavras > maximo:
            avisos.append(f"Texto longo: {palavras} palavras — acima de 1.5x a media dos 3 ({maximo})")
    else:
        palavras_min = 400
        if palavras < palavras_min:
            erros.append(f"Texto muito curto: {palavras} palavras — word_count_media nao definido no projeto.md")
        avisos.append("word_count_media ausente no projeto.md — definir na ETAPA 2B antes de escrever")

    # 13. Tom de voz definido no projeto.md
    if not re.search(r'[Tt]om de [Vv]oz|[Tt]om:', projeto, re.IGNORECASE):
        erros.append("Tom de voz nao definido no projeto.md — obrigatorio antes de escrever")

    # 14. Outline aprovado (3 concorrentes)
    if not re.search(r'outline.*aprovado|aprovado.*outline', projeto, re.IGNORECASE):
        avisos.append("Nao ha registro de outline aprovado no projeto.md — confirmar que ETAPA 2B foi executada")

    if erros:
        print(f"FAIL - {len(erros)} problema(s):")
        for e in erros:
            print(f"  - {e}")
        if avisos:
            print("Avisos:")
            for a in avisos:
                print(f"  ~ {a}")
        return 1

    print("PASS - Fase 3 validada.")
    if avisos:
        for a in avisos:
            print(f"  ~ {a}")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    parser.add_argument("--arquivo", required=True)
    args = parser.parse_args()
    sys.exit(verificar(args.slug, args.arquivo))
