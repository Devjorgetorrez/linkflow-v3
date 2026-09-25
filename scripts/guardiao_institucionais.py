"""
guardiao_institucionais.py — Valida páginas institucionais antes da injeção
Uso: python scripts/guardiao_institucionais.py
       --arquivo <path.txt|.md|.html>
       --tipo <sobre|contato|privacidade|termos>
       --email-cliente <email@dominio.com>
       [--blacklist <nome1,nome2>]

Checks por tipo:
  TODOS:
    1. Nenhum placeholder [MAIÚSCULAS]
    2. Nenhum H1 no conteúdo (o template já renderiza o título como H1)
    3. Nenhum nome/registro da blacklist

  sobre:
    4. Mínimo 400 palavras
    5. Não contém lista de bullet como estrutura principal (deve ser prosa)

  contato:
    6. Mínimo 200 palavras
    7. email_from (se presente no HTML) deve ser igual ao email-cliente

  privacidade:
    8. Contém as 9 seções obrigatórias
    9. Contém o disclaimer legal obrigatório

  termos:
    10. Contém as 7 seções obrigatórias
    11. Contém o disclaimer legal obrigatório
"""

import argparse
import re
import sys


DISCLAIMER = "elaborado com base nas informações fornecidas pelo titular"

SECOES_PRIVACIDADE = [
    "identificação do controlador",
    "dados coletados",
    "base legal",
    "cookies",
    "compartilhamento",
    "retenção",
    "direitos do titular",
    "canal de exercício",
    "última revisão",
]

SECOES_TERMOS = [
    "objeto",
    "uso permitido",
    "propriedade intelectual",
    "limitação de responsabilidade",
    "não substitui",
    "foro",
    "vigência",
]

PLACEHOLDER_RE = re.compile(r'\[[A-ZÁÉÍÓÚÇÃÕ][A-ZÁÉÍÓÚÇÃÕ ]{1,}\]')
H1_RE = re.compile(r'(?m)^#\s+\S|<h1[\s>]', re.IGNORECASE)


def contar_palavras(texto):
    return len(re.findall(r'\b\w+\b', texto))


def normalizar(texto):
    return texto.lower()


def verificar(arquivo, tipo, email_cliente, blacklist):
    erros = []
    avisos = []

    try:
        with open(arquivo, encoding="utf-8") as f:
            conteudo = f.read()
    except Exception as e:
        print(f"FAIL — não foi possível ler o arquivo: {e}")
        return 1

    texto_norm = normalizar(conteudo)

    # Check 1 — Placeholders
    placeholders = PLACEHOLDER_RE.findall(conteudo)
    if placeholders:
        erros.append(
            f"Check 1 — PLACEHOLDER(S) encontrado(s): {', '.join(set(placeholders))}. "
            f"Coletar o dado real antes de criar a página."
        )

    # Check 2 — H1 no conteúdo
    if H1_RE.search(conteudo):
        erros.append(
            "Check 2 — H1 encontrado no conteúdo. O template já renderiza o título como H1. "
            "Remover o H1 do corpo — caso contrário a página terá dois H1."
        )

    # Check 3 — Blacklist
    for nome in blacklist:
        if nome.strip() and normalizar(nome.strip()) in texto_norm:
            erros.append(
                f"Check 3 — Nome/registro da blacklist encontrado no conteúdo: '{nome.strip()}'. "
                f"Pertence ao profissional anterior — remover antes de publicar."
            )

    # Checks específicos por tipo
    if tipo == "sobre":
        wc = contar_palavras(conteudo)
        if wc < 400:
            erros.append(
                f"Check 4 — /sobre/ tem {wc} palavras (mínimo: 400). "
                f"Expandir com história, abordagem e diferenciais reais."
            )
        bullet_lines = len(re.findall(r'(?m)^[\s]*[-*•]\s+', conteudo))
        total_lines = len([l for l in conteudo.splitlines() if l.strip()])
        if total_lines > 0 and bullet_lines / total_lines > 0.4:
            avisos.append(
                "Check 5 — /sobre/ tem muitos bullets (>{:.0f}% das linhas). "
                "Deve ser PROSA, não currículo em lista.".format(bullet_lines / total_lines * 100)
            )

    elif tipo == "contato":
        wc = contar_palavras(conteudo)
        if wc < 200:
            erros.append(
                f"Check 6 — /contato/ tem {wc} palavras (mínimo: 200). "
                f"Página de contato muito curta é penalizada pelo Google."
            )
        # email_from no HTML do formulário
        email_from_match = re.search(r'email_from["\s:=]+([^\s"<>\',]+@[^\s"<>\',]+)', conteudo, re.IGNORECASE)
        if email_from_match:
            email_from = email_from_match.group(1).strip()
            if email_cliente and normalizar(email_from) != normalizar(email_cliente):
                erros.append(
                    f"Check 7 — email_from do formulário ('{email_from}') diferente do e-mail do cliente "
                    f"('{email_cliente}'). O formulário vai enviar para o e-mail do dono anterior."
                )

    elif tipo == "privacidade":
        ausentes = []
        for secao in SECOES_PRIVACIDADE:
            if secao not in texto_norm:
                ausentes.append(secao)
        if ausentes:
            erros.append(
                f"Check 8 — /politica-de-privacidade/ sem as seções obrigatórias: "
                f"{', '.join(ausentes)}. São 9 seções — todas obrigatórias pela LGPD."
            )
        if DISCLAIMER.lower() not in texto_norm:
            erros.append(
                "Check 9 — Disclaimer legal obrigatório ausente. Adicionar ao rodapé: "
                "'Este documento foi elaborado com base nas informações fornecidas pelo titular "
                "e na legislação vigente. Recomenda-se revisão por profissional jurídico antes "
                "da publicação definitiva.'"
            )

    elif tipo == "termos":
        ausentes = []
        for secao in SECOES_TERMOS:
            if secao not in texto_norm:
                ausentes.append(secao)
        if ausentes:
            erros.append(
                f"Check 10 — /termos-de-uso/ sem as seções obrigatórias: "
                f"{', '.join(ausentes)}. São 7 seções — todas obrigatórias."
            )
        if DISCLAIMER.lower() not in texto_norm:
            erros.append(
                "Check 11 — Disclaimer legal obrigatório ausente. Adicionar ao rodapé: "
                "'Este documento foi elaborado com base nas informações fornecidas pelo titular "
                "e na legislação vigente. Recomenda-se revisão por profissional jurídico antes "
                "da publicação definitiva.'"
            )

    else:
        print(f"FAIL — tipo '{tipo}' inválido. Use: sobre | contato | privacidade | termos")
        return 1

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

    wc_info = contar_palavras(conteudo)
    print(f"PASS — /{tipo}/ validado. {wc_info} palavras.")
    for a in avisos:
        print(f"  ~ {a}")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Valida páginas institucionais antes da publicação (WordPress ou Astro)"
    )
    parser.add_argument("--arquivo", required=True, help="Caminho para o arquivo de conteúdo")
    parser.add_argument(
        "--tipo",
        required=True,
        choices=["sobre", "contato", "privacidade", "termos"],
        help="Tipo de página institucional",
    )
    parser.add_argument(
        "--email-cliente",
        dest="email_cliente",
        default="",
        help="E-mail real do cliente (para validar email_from do formulário)",
    )
    parser.add_argument(
        "--blacklist",
        default="",
        help="Nomes/registros proibidos separados por vírgula (do dono anterior do site)",
    )
    args = parser.parse_args()
    blacklist = [b.strip() for b in args.blacklist.split(",") if b.strip()] if args.blacklist else []
    sys.exit(verificar(args.arquivo, args.tipo, args.email_cliente, blacklist))
