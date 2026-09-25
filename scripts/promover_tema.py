#!/usr/bin/env python3
"""
promover_tema.py — Promove o tema escolhido (base por nicho) para a raiz
do site Astro, apagando os outros dois. Roda UMA VEZ, na criação do
cliente (vps-setup / novo-cliente.sh), antes de fase2-site-astro criar
qualquer conteúdo — nunca depois, e nunca duas vezes no mesmo cliente.

Garante a regra do Jorge: a escolha de tema NUNCA aparece na URL do site
final. "/tema-04/servicos/x" vira "/x" na raiz, e as pastas tema-03/
tema-04 somem por completo da cópia daquele cliente.

Uso:
  python3 promover_tema.py --tema tema-03 --astro-dir /opt/linkflow/clientes/<slug>/_astro
  python3 promover_tema.py --tema base    --astro-dir ...   (nada pra promover, só limpa os outros 2)

Sempre roda numa cópia ISOLADA por cliente (a que vps-setup/novo-cliente.sh
já cria) — nunca no motor compartilhado que serve de referência para os
3 temas lado a lado.
"""
import argparse
import re
import shutil
import sys
from pathlib import Path

TEMAS_VALIDOS = ["base", "tema-03", "tema-04"]
SUFIXOS = {"base": "", "tema-03": "T3", "tema-04": "T4"}
COLECOES = ["servicos", "equipe", "depoimentos", "posts", "autores"]


def gravar_lf(path, texto):
    """Grava sempre com LF, em qualquer SO. `Path.write_text()` sem
    `newline` converte \n em \r\n no Windows, e o hash do arquivo
    promovido deixa de bater entre a máquina de teste e o VPS.
    Usa open() em vez de write_text(newline=...), que só existe no
    Python 3.10+ (o python3 do VPS vem do apt e a versão não é garantida)."""
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(texto)

# Nomes que o tema base (tema-01) realmente tem hoje no motor compartilhado
# de referência. FIXA, nunca capturada dinamicamente de "o que já existe" —
# um resíduo esquecido (ex: pasta de cliente antigo tipo
# "torrez-desentupidora/") também "já existiria" antes da promoção rodar,
# então capturar dinamicamente deixaria passar como se fosse legítimo.
NOMES_BASE_LEGITIMOS = {
    "index.astro", "sobre.astro", "contato.astro", "[slug].astro",
    "servicos", "blog", "autor",
    "politica-de-privacidade.astro", "termos-de-uso.astro",
}


def main():
    p = argparse.ArgumentParser(description="Promove o tema escolhido para a raiz, apaga os outros")
    p.add_argument("--tema", required=True, choices=TEMAS_VALIDOS)
    p.add_argument("--astro-dir", required=True, help="Pasta _astro/ isolada do cliente")
    args = p.parse_args()

    astro_dir = Path(args.astro_dir)
    if not astro_dir.is_dir():
        print(f"[promover_tema] ERRO: pasta nao encontrada: {astro_dir}", file=sys.stderr)
        sys.exit(1)

    pages_dir = astro_dir / "src" / "pages"
    config_dir = astro_dir / "src" / "config"
    content_dir = astro_dir / "src" / "content"
    layouts_dir = astro_dir / "src" / "layouts"
    content_config_path = astro_dir / "src" / "content.config.ts"
    public_dir = astro_dir / "public"

    if args.tema != "base":
        allowlist_final = promover(args.tema, pages_dir, config_dir, content_dir, content_config_path, NOMES_BASE_LEGITIMOS)
    else:
        # Tema base ja esta na raiz — so precisa garantir que o
        # content.config.ts fique so com as colecoes canonicas (COLECOES) (sem T3/T4)
        reescrever_content_config(content_config_path, "")
        allowlist_final = NOMES_BASE_LEGITIMOS

    limpar_public(public_dir)
    limpar_nao_escolhidos(args.tema, pages_dir, config_dir, content_dir, layouts_dir)
    remover_residuos_desconhecidos(pages_dir, content_dir, config_dir, allowlist_final)

    print(f"[promover_tema] OK — tema '{args.tema}' promovido para a raiz, os outros dois removidos.")


def promover(tema, pages_dir, config_dir, content_dir, content_config_path, nomes_base_legitimos):
    sufixo = SUFIXOS[tema]
    origem_pages = pages_dir / tema
    astro_dir = pages_dir.parent.parent  # .../src/pages -> .../src -> _astro
    components_paginas_dir = astro_dir / "src" / "components" / "paginas"

    if not origem_pages.is_dir():
        print(f"[promover_tema] ERRO: pasta do tema nao encontrada: {origem_pages}", file=sys.stderr)
        sys.exit(1)

    # 1. Copiar paginas do tema pra raiz — sobrescreve as do tema base/demo.
    #    Guardar todo arquivo .astro copiado: cada um subiu exatamente 1
    #    nivel (de pages/tema-XX/... pra pages/...), entao todo import
    #    relativo escrito pra profundidade antiga (com 1 '../' a mais do
    #    que devia) precisa ser corrigido — ver ajustar_profundidade_imports.
    arquivos_promovidos = []
    nomes_topo_promovidos = set()
    for item in origem_pages.iterdir():
        nomes_topo_promovidos.add(item.name)
        destino = pages_dir / item.name
        if destino.exists():
            if destino.is_dir():
                shutil.rmtree(destino)
            else:
                destino.unlink()
        if item.is_dir():
            shutil.copytree(item, destino)
            arquivos_promovidos += list(destino.rglob("*.astro"))
        else:
            shutil.copy2(item, destino)
            if destino.suffix == ".astro":
                arquivos_promovidos.append(destino)

    for arq in arquivos_promovidos:
        ajustar_profundidade_imports(arq)

    # 2. Config do tema vira o config canonico que todas as paginas importam
    origem_config = config_dir / f"{tema}.ts"
    if not origem_config.is_file():
        print(f"[promover_tema] ERRO: config do tema nao encontrado: {origem_config}", file=sys.stderr)
        sys.exit(1)
    shutil.copy2(origem_config, config_dir / "site.ts")

    # 3. Conteudo do tema vira o conteudo canonico
    origem_content = content_dir / tema
    for sub in COLECOES:
        origem_sub = origem_content / sub
        destino_sub = content_dir / sub
        if destino_sub.exists():
            shutil.rmtree(destino_sub)
        if origem_sub.exists():
            shutil.copytree(origem_sub, destino_sub)

    # 4. content.config.ts — só os blocos do tema escolhido, renomeados
    #    pro nome canonico (sem sufixo T3/T4), loader apontando pro
    #    caminho canonico (content/<colecao>, nao content/<tema>/<colecao>)
    reescrever_content_config(content_config_path, sufixo)

    # 5. Corrigir os arquivos promovidos (e os componentes extraídos em
    #    components/paginas/, que não passam pelo loop acima) — URL sem
    #    prefixo de tema, import do config certo, e nome de coleção sem
    #    sufixo (getCollection apontava pra 'servicosT3' etc., que deixou
    #    de existir no content.config.ts reescrito no passo 4)
    limpar_arquivos_promovidos(pages_dir, components_paginas_dir, config_dir / "site.ts", tema, sufixo)

    return nomes_base_legitimos | nomes_topo_promovidos


def ajustar_profundidade_imports(arquivo):
    """Reduz em exatamente 1 nível todo import relativo (`from '../../X'`)
    de um arquivo que acabou de subir 1 nível de pasta na promoção — sem
    isso, toda página promovida aponta 1 diretório alto demais pros seus
    imports (layout, componentes, config) e o build quebra."""
    texto = arquivo.read_text(encoding="utf-8")

    def reduzir(m):
        aspas = m.group(1)
        pontos = m.group(2)
        resto = m.group(3)
        n = len(pontos) // 3  # cada "../" tem 3 caracteres
        novo_n = max(n - 1, 0)
        return f"from {aspas}{'../' * novo_n}{resto}{aspas}"

    novo_texto = re.sub(r"from\s+(['\"])((?:\.\./)+)([^'\"]*)\1", reduzir, texto)
    if novo_texto != texto:
        gravar_lf(arquivo, novo_texto)


def extrair_bloco(texto, nome_const):
    """Extrai o bloco `const NOME = defineCollection({ ... })` inteiro,
    contando parenteses pra achar o fechamento certo — nunca regex
    guloso, que pararia no primeiro ')' errado."""
    marcador = f"const {nome_const} = defineCollection("
    inicio = texto.find(marcador)
    if inicio == -1:
        return None
    abre = inicio + len(marcador) - 1
    depth = 0
    for i in range(abre, len(texto)):
        c = texto[i]
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0:
                return texto[inicio:i + 1]
    return None


def reescrever_content_config(path, sufixo):
    """Recria content.config.ts só com as colecoes canonicas (COLECOES) do tema
    escolhido (servicos, equipe, depoimentos, posts) — sem sufixo T3/T4,
    sem as colecoes dos outros dois temas, loader apontando pro caminho
    canonico dentro de content/."""
    if not path.is_file():
        print(f"[promover_tema] ERRO: content.config.ts nao encontrado: {path}", file=sys.stderr)
        sys.exit(1)

    texto = path.read_text(encoding="utf-8")
    novo = ["import { defineCollection, z } from 'astro:content'",
            "import { glob } from 'astro/loaders'", ""]

    for nome_canonico in COLECOES:
        nome_origem = f"{nome_canonico}{sufixo}"
        bloco = extrair_bloco(texto, nome_origem)
        if bloco is None:
            print(f"[promover_tema] AVISO: colecao '{nome_origem}' nao encontrada em content.config.ts — pulando")
            continue
        bloco = bloco.replace(
            f"const {nome_origem} = defineCollection(",
            f"const {nome_canonico} = defineCollection(",
        )
        bloco = re.sub(
            r"base: '\./src/content/[^']*'",
            f"base: './src/content/{nome_canonico}'",
            bloco,
        )
        novo.append(bloco)
        novo.append("")

    novo.append("export const collections = { " + ", ".join(COLECOES) + " }")
    novo.append("")

    gravar_lf(path, "\n".join(novo))


def limpar_arquivos_promovidos(pages_dir, components_paginas_dir, config_site_path, tema, sufixo):
    """Corrige os 3 problemas que a cópia crua deixa para trás:
    1. Prefixo /tema-XX/ nos hrefs (regra do Jorge: nunca na URL)
    2. Import de config/tema-XX.ts (arquivo original é apagado depois)
    3. Nome de coleção com sufixo T3/T4 em getCollection(...) e nos tipos
       (`getCollection<'servicosT3'>` etc.) — deixam de existir depois que
       content.config.ts é reescrito só com os nomes canônicos
    """
    prefixo = f"/{tema}/"
    import_antigo = f"config/{tema}.ts"

    alvos = list(pages_dir.rglob("*.astro"))
    if components_paginas_dir.is_dir():
        alvos += list(components_paginas_dir.glob("*.astro"))
    if config_site_path.is_file():
        alvos.append(config_site_path)

    for arq in alvos:
        if not arq.is_file():
            continue
        texto = arq.read_text(encoding="utf-8")
        novo_texto = (
            texto.replace(prefixo, "/")
            .replace(f"'/{tema}'", "'/'")
            .replace(f'"/{tema}"', '"/"')
            .replace(import_antigo, "config/site.ts")
        )
        if sufixo:
            for nome in COLECOES:
                # getCollection('servicosT3') -> getCollection('servicos'),
                # nos dois estilos de aspas, e no tipo genérico também
                novo_texto = novo_texto.replace(f"'{nome}{sufixo}'", f"'{nome}'")
                novo_texto = novo_texto.replace(f'"{nome}{sufixo}"', f'"{nome}"')
        if novo_texto != texto:
            gravar_lf(arq, novo_texto)


def limpar_public(public_dir):
    """Remove os artefatos de catálogo/demo dos temas em public/ — servem
    só pra fase de ESCOLHA de tema (antes da promoção), nenhum tem uso em
    runtime depois que o tema já foi promovido. Sem isso, o site de um
    cliente serviria publicamente o catálogo/sitemap/llms.txt de temas
    que ele nem escolheu (inclusive o próprio tema.json do tema base,
    que também só serve pra decisão, não pro site em produção)."""
    if not public_dir.is_dir():
        return
    padroes = [
        "tema-03.json", "tema-04.json", "tema.json",
        "llms-tema-03.txt", "llms-tema-04.txt",
        "sitemap-tema-03.xml", "sitemap-tema-04.xml",
    ]
    for nome in padroes:
        alvo = public_dir / nome
        if alvo.exists():
            alvo.unlink()


def remover_residuos_desconhecidos(pages_dir, content_dir, config_dir, allowlist_pages):
    """Remove qualquer coisa em pages/, content/ ou config/ que não seja
    reconhecida como parte do tema promovido ou das coleções canônicas (COLECOES)
    — proteção contra resíduo de outro cliente/teste que tenha ficado
    esquecido no motor compartilhado (ex: uma pasta com nome de cliente
    antigo, tipo "torrez-desentupidora/", nunca gerida por este script,
    mas que quebraria o build se sobrevivesse à promoção por importar um
    layout de tema que acabou de ser apagado).
    """
    for item in list(pages_dir.iterdir()):
        if item.name in allowlist_pages or item.name in TEMAS_VALIDOS[1:]:
            continue
        print(f"[promover_tema] Removendo resíduo não reconhecido em pages/: {item.name}")
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()

    if content_dir.is_dir():
        for item in list(content_dir.iterdir()):
            if item.name in COLECOES or item.name in TEMAS_VALIDOS[1:]:
                continue
            print(f"[promover_tema] Removendo resíduo não reconhecido em content/: {item.name}")
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()

    if config_dir.is_dir():
        for item in list(config_dir.iterdir()):
            nomes_temas_ts = {f"{t}.ts" for t in TEMAS_VALIDOS[1:]}
            if item.name == "site.ts" or item.name in nomes_temas_ts:
                continue
            print(f"[promover_tema] Removendo resíduo não reconhecido em config/: {item.name}")
            item.unlink()


def limpar_nao_escolhidos(tema_escolhido, pages_dir, config_dir, content_dir, layouts_dir):
    """Apaga por completo tudo que pertence aos temas NÃO escolhidos —
    nunca deixar um segundo tema coexistindo no ar."""
    outros = [t for t in ["tema-03", "tema-04"] if t != tema_escolhido]
    layout_por_tema = {"tema-03": "Tema03Base.astro", "tema-04": "Tema04Base.astro"}

    # ThemeBase.astro é o layout do tema base — órfão em qualquer cliente
    # que promoveu tema-03 ou tema-04 (nenhuma página promovida o importa).
    # Os componentes extraídos do tema base (sem sufixo T3/T4) ficam
    # órfãos pelo mesmo motivo — mesma limpeza que já fazemos pro tema
    # irmão não escolhido, só que pro base.
    if tema_escolhido != "base":
        theme_base = layouts_dir / "ThemeBase.astro"
        if theme_base.exists():
            theme_base.unlink()

        components_paginas_dir = layouts_dir.parent / "components" / "paginas"
        if components_paginas_dir.is_dir():
            for nome in ["ServicoDetalhe.astro", "PostDetalhe.astro"]:
                alvo_componente = components_paginas_dir / nome
                if alvo_componente.exists():
                    alvo_componente.unlink()

    for outro in outros:
        alvo_pages = pages_dir / outro
        if alvo_pages.exists():
            shutil.rmtree(alvo_pages)

        alvo_config = config_dir / f"{outro}.ts"
        if alvo_config.exists():
            alvo_config.unlink()

        alvo_content = content_dir / outro
        if alvo_content.exists():
            shutil.rmtree(alvo_content)

        alvo_layout = layouts_dir / layout_por_tema[outro]
        if alvo_layout.exists():
            alvo_layout.unlink()

        # Componentes extraídos do tema não escolhido (ServicoDetalheT3.astro
        # etc.) ficam órfãos — ninguém mais importa, já que a página que os
        # usava foi apagada acima. Sem função, sem risco de quebrar nada,
        # só sujeira acumulada — apagar por limpeza.
        components_paginas_dir = layouts_dir.parent / "components" / "paginas"
        sufixo_outro = SUFIXOS[outro]
        if components_paginas_dir.is_dir():
            for nome in [f"ServicoDetalhe{sufixo_outro}.astro", f"PostDetalhe{sufixo_outro}.astro"]:
                alvo_componente = components_paginas_dir / nome
                if alvo_componente.exists():
                    alvo_componente.unlink()

    # Se o tema escolhido não for o base, a pasta original pages/tema-XX/
    # (e o config/content originais) já foram copiados pra raiz — apagar
    # os originais também, pra não sobrar duplicado.
    if tema_escolhido != "base":
        alvo = pages_dir / tema_escolhido
        if alvo.exists():
            shutil.rmtree(alvo)
        alvo_config = config_dir / f"{tema_escolhido}.ts"
        if alvo_config.exists():
            alvo_config.unlink()
        alvo_content = content_dir / tema_escolhido
        if alvo_content.exists():
            shutil.rmtree(alvo_content)

    # demo.astro é conteúdo de demonstração interna do repositório
    # compartilhado — nunca deveria ir para o site de um cliente real.
    demo = pages_dir / "demo.astro"
    if demo.exists():
        demo.unlink()


if __name__ == "__main__":
    main()
