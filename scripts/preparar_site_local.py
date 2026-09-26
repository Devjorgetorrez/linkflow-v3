#!/usr/bin/env python3
"""
preparar_site_local.py — cria (ou recria) a cópia local e isolada do site de um
cliente, para construir e mostrar a PRÉVIA no localhost antes de qualquer
servidor ou domínio.

O que faz, nesta ordem:
  1. copia o motor de referência (_astro/) para projetos/<slug>/site/_astro/
     (sem node_modules, dist e .astro);
  2. promove o layout escolhido para a raiz dessa cópia (promover_tema.py) —
     os outros layouts somem só da cópia; o motor de referência nunca é tocado;
  3. apaga o conteúdo de demonstração das coleções (igual ao novo-cliente.sh do
     servidor), para o site do cliente começar vazio;
  4. instala as dependências (npm ci) se ainda não estiverem lá.

Trocar de layout na prévia = rodar de novo com outro --tema: a cópia é refeita
do zero (src, public, config), mas o node_modules é preservado. O conteúdo do
cliente é regerado a partir do projeto.md no esquema do layout novo — nada é
migrado campo a campo, porque cada layout tem coleções e campos próprios.

ATENÇÃO: o config/site.ts que sobra depois da promoção é o config de
DEMONSTRAÇÃO do layout (empresa, telefone, CNPJ e depoimentos fictícios). Ele
existe para mostrar a ESTRUTURA que as páginas esperam. Cada campo precisa ser
substituído por dado do projeto.md; o guardiao_construtor.py --fase previa
acusa qualquer valor de demonstração que tenha sobrado.

Uso:
  python scripts/preparar_site_local.py --slug <slug> --tema tema-05
  python scripts/preparar_site_local.py --slug <slug> --tema base --sem-instalar
"""
import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from promover_tema import COLECOES, TEMAS_VALIDOS  # noqa: E402

# Nunca copiados do motor de referência
IGNORAR_NA_COPIA = {"node_modules", "dist", ".astro"}


def erro(msg):
    print(f"[preparar_site_local] ERRO: {msg}", file=sys.stderr)
    sys.exit(1)


def limpar_preservando_node_modules(destino: Path):
    """Apaga tudo em destino/ menos node_modules (reinstalar é lento e desnecessário)."""
    if not destino.exists():
        return
    for item in destino.iterdir():
        if item.name == "node_modules":
            continue
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()


def copiar_motor(origem: Path, destino: Path):
    destino.mkdir(parents=True, exist_ok=True)
    for item in origem.iterdir():
        if item.name in IGNORAR_NA_COPIA:
            continue
        alvo = destino / item.name
        if item.is_dir():
            shutil.copytree(item, alvo, ignore=shutil.ignore_patterns(*IGNORAR_NA_COPIA))
        else:
            shutil.copy2(item, alvo)


def apagar_demo(astro_dir: Path):
    """Esvazia as coleções de conteúdo (o config/site.ts fica: é o gabarito de estrutura)."""
    content = astro_dir / "src" / "content"
    total = 0
    for colecao in COLECOES:
        pasta = content / colecao
        if pasta.is_dir():
            for md in pasta.glob("*.md"):
                md.unlink()
                total += 1
    return total


def main():
    ap = argparse.ArgumentParser(description="Cria a cópia local do site de um cliente para a prévia")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--tema", required=True, choices=TEMAS_VALIDOS)
    ap.add_argument("--destino", help="pasta do site local (padrão: projetos/<slug>/site)")
    ap.add_argument("--sem-instalar", action="store_true", help="não roda npm ci")
    args = ap.parse_args()

    origem = RAIZ / "_astro"
    if not (origem / "package.json").is_file():
        erro(f"motor de referência não encontrado em {origem}")

    projeto = RAIZ / "projetos" / args.slug
    destino_raiz = Path(args.destino) if args.destino else projeto / "site"
    if not args.destino and not projeto.is_dir():
        erro(f"projeto '{args.slug}' não existe em projetos/ — trate como projeto novo (/link-flow novo)")

    astro_dir = destino_raiz / "_astro"
    refazendo = astro_dir.exists()

    limpar_preservando_node_modules(astro_dir)
    copiar_motor(origem, astro_dir)

    r = subprocess.run(
        [sys.executable, str(RAIZ / "scripts" / "promover_tema.py"), "--tema", args.tema, "--astro-dir", str(astro_dir)],
    )
    if r.returncode != 0:
        erro("a promoção do layout falhou (mensagem acima)")

    apagados = apagar_demo(astro_dir)

    if not args.sem_instalar and not (astro_dir / "node_modules").is_dir():
        print("[preparar_site_local] instalando dependências (npm ci)...")
        npm = "npm.cmd" if os.name == "nt" else "npm"
        r = subprocess.run([npm, "ci", "--silent"], cwd=astro_dir)
        if r.returncode != 0:
            erro("npm ci falhou")

    print(
        f"[preparar_site_local] OK — site local {'refeito' if refazendo else 'criado'} em {destino_raiz}\n"
        f"  layout: {args.tema} | conteúdo de demonstração apagado: {apagados} arquivo(s)\n"
        f"  config/site.ts = config de DEMONSTRAÇÃO do layout: substitua cada campo por dado do projeto.md.\n"
        f"  guardião: LINKFLOW_DIR=\"{destino_raiz}\" python scripts/guardiao_construtor.py --slug {args.slug} --fase previa"
    )


if __name__ == "__main__":
    main()
