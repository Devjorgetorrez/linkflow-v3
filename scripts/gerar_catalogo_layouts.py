#!/usr/bin/env python3
"""
gerar_catalogo_layouts.py — gera painel/lib/catalogo-layouts.ts a partir da
fonte única do catálogo: _astro/src/config/catalogo-layouts.json.

Por que existe: o painel de um cliente publicado não tem os temas do motor
(promover_tema.py apaga tudo que não é do layout escolhido), então ele precisa
da sua própria cópia do catálogo. Este script gera essa cópia e, antes,
VALIDA a fonte contra o que o motor realmente entrega:

  - todo tema de promover_tema.py está no catálogo, e só eles;
  - cor, acento e fontes de cada layout batem com _astro/public/tema*.json;
  - a rota de cada layout existe em _astro/src/pages/.

Uso:
  python scripts/gerar_catalogo_layouts.py          # valida e grava o .ts
  python scripts/gerar_catalogo_layouts.py --check  # só valida (exit 1 se
                                                    # houver erro ou se o .ts
                                                    # gravado estiver defasado)
"""
import argparse
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from promover_tema import TEMAS_VALIDOS  # noqa: E402

FONTE = RAIZ / "_astro" / "src" / "config" / "catalogo-layouts.json"
PUBLIC = RAIZ / "_astro" / "public"
PAGES = RAIZ / "_astro" / "src" / "pages"
SAIDA = RAIZ / "painel" / "lib" / "catalogo-layouts.ts"

CAMPOS = ["tema", "nome", "nicho", "exemplos", "resumo", "cor", "acento", "fonteTitulo", "fonteCorpo", "rota"]


def carregar():
    with open(FONTE, encoding="utf-8") as f:
        return json.load(f)


def json_do_tema(tema):
    nome = "tema.json" if tema == "base" else f"{tema}.json"
    with open(PUBLIC / nome, encoding="utf-8") as f:
        return json.load(f)


def validar(itens):
    erros = []
    temas = [i.get("tema") for i in itens]

    for t in TEMAS_VALIDOS:
        if t not in temas:
            erros.append(f"tema '{t}' existe em promover_tema.py mas falta no catalogo")
    for t in temas:
        if t not in TEMAS_VALIDOS:
            erros.append(f"tema '{t}' esta no catalogo mas nao existe em promover_tema.py")
    if len(set(temas)) != len(temas):
        erros.append("tema repetido no catalogo")

    for i in itens:
        t = i.get("tema", "?")
        faltando = [c for c in CAMPOS if not str(i.get(c, "")).strip()]
        if faltando:
            erros.append(f"{t}: campos vazios/ausentes: {', '.join(faltando)}")
            continue
        if t not in TEMAS_VALIDOS:
            continue
        try:
            j = json_do_tema(t)
        except FileNotFoundError as e:
            erros.append(f"{t}: {e}")
            continue
        tok = j.get("tokens", {})
        tip = j.get("tipografia", {})
        comparar = [
            ("cor", i["cor"], tok.get("primary")),
            ("acento", i["acento"], tok.get("accent")),
            ("fonteTitulo", i["fonteTitulo"], tip.get("display")),
            ("fonteCorpo", i["fonteCorpo"], tip.get("body")),
        ]
        for nome, no_catalogo, no_tema in comparar:
            if str(no_catalogo).lower() != str(no_tema).lower():
                erros.append(f"{t}: {nome} no catalogo ({no_catalogo}) difere do tema ({no_tema})")

        rota = i["rota"]
        if t == "base":
            existe = (PAGES / "index.astro").is_file()
        else:
            existe = (PAGES / t / "index.astro").is_file() and rota == f"/{t}"
        if not existe:
            erros.append(f"{t}: rota '{rota}' nao corresponde a uma pagina do motor")
    return erros


def para_ts(itens):
    linhas = [
        "/**",
        " * GERADO por scripts/gerar_catalogo_layouts.py — NÃO edite à mão.",
        " * Fonte: _astro/src/config/catalogo-layouts.json (validada contra",
        " * _astro/public/tema*.json e scripts/promover_tema.py).",
        " */",
        "",
        "export interface LayoutCatalogo {",
        "  /** Nome da base no motor: base | tema-03 … tema-07 (é o `tema_pasta` do projeto). */",
        "  tema: string;",
        "  nome: string;",
        "  nicho: string;",
        "  exemplos: string;",
        "  resumo: string;",
        "  cor: string;",
        "  acento: string;",
        "  fonteTitulo: string;",
        "  fonteCorpo: string;",
        "  /** Rota da demonstração no motor de referência (\"/\" = tema base). */",
        "  rota: string;",
        "}",
        "",
        "export const CATALOGO_LAYOUTS: LayoutCatalogo[] = "
        + json.dumps([{c: i[c] for c in CAMPOS} for i in itens], ensure_ascii=False, indent=2) + ";",
        "",
    ]
    return "\n".join(linhas)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    itens = carregar()
    erros = validar(itens)
    if erros:
        print("Catalogo de layouts INVALIDO:")
        for e in erros:
            print(f"  - {e}")
        sys.exit(1)

    novo = para_ts(itens)
    if args.check:
        atual = SAIDA.read_text(encoding="utf-8").replace("\r\n", "\n") if SAIDA.exists() else ""
        if atual != novo:
            print(f"{SAIDA.relative_to(RAIZ)} esta defasado — rode: python scripts/gerar_catalogo_layouts.py")
            sys.exit(1)
        print("Catalogo de layouts OK (fonte valida e .ts em dia).")
        return

    with open(SAIDA, "w", encoding="utf-8", newline="\n") as f:
        f.write(novo)
    print(f"OK — {len(itens)} layouts validados; gravado {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
