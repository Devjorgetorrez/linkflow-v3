"""
guardiao_construtor.py - Valida antes E depois do construtor Astro (fase2-site-astro)

Uso:
  # Verificar ENTRADA (antes de construir)
  python scripts/guardiao_construtor.py --slug <slug> --fase entrada

  # Verificar SAIDA (depois de construir, antes de reportar "pronto")
  python scripts/guardiao_construtor.py --slug <slug> --fase saida

Retorna:
  0 = PASS (pode continuar)
  1 = FAIL (bloqueado)
"""

import argparse
import os
import re
import sys
from pathlib import Path

_PROJECT_DIR = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))
_LINKFLOW_DIR = Path(os.environ.get('LINKFLOW_DIR', _PROJECT_DIR))


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def campo_vazio(valor: str) -> bool:
    """True se o valor é vazio ou placeholder."""
    placeholders = [
        "a definir", "a confirmar", "pendente", "tbd", "n/a",
        "[", "TODO", "---", "null", "none"
        # NOTA: string vazia "" removida — "x" in "" é sempre True em Python
    ]
    v = valor.strip().lower()
    if not v:
        return True  # vazio de verdade
    return any(p in v for p in placeholders)


def imprimir_resultado(erros, avisos, fase):
    if erros:
        print(f"\nFAIL — Guardiao Construtor ({fase}): {len(erros)} bloqueio(s)\n")
        for e in erros:
            print(f"  ❌ {e}")
        if avisos:
            print()
            for a in avisos:
                print(f"  ⚠️  {a}")
        print()
        print("  Corrija os bloqueios acima antes de prosseguir.")
        return 1
    else:
        print(f"\nPASS — Guardiao Construtor ({fase})")
        if avisos:
            print(f"  {len(avisos)} aviso(s) (nao bloqueiam):")
            for a in avisos:
                print(f"  ⚠️  {a}")
            if fase == "saida":
                print()
                print(
                    "  ⚠️  ATENCAO: os avisos acima sao pendencias reais (logo, fotos, "
                    "prova social). Nao ficam so aqui no terminal — precisam aparecer "
                    "explicitamente no resumo final entregue ao cliente (ETAPA 7 do "
                    "fase2-site-astro), cada uma na propria linha. Reportar 'site "
                    "publicado' sem essa lista e exatamente o erro #9/#10 do relatorio "
                    "de testes (placeholder sem aviso, operador nao informado)."
                )
        return 0


# ─── VERIFICAÇÃO DE ENTRADA ───────────────────────────────────────────────────

def verificar_entrada(slug):
    """
    Verifica se o projeto.md tem tudo que o construtor precisa ANTES de rodar.
    Bloqueia se faltar NAP, direção visual, dados reais do negócio.
    """
    caminho = _PROJECT_DIR / f"projetos/{slug}/projeto.md"
    if not caminho.exists():
        print(f"FAIL: projeto.md nao encontrado em {caminho}")
        return 1

    conteudo = caminho.read_text(encoding="utf-8")
    erros = []
    avisos = []

    # ── PRÉ-REQUISITO: Fase 2 técnica concluída ──────────────────────────────
    if not re.search(r"(arvore.*silos|silos.*arvore|## Raio-X)", conteudo, re.IGNORECASE):
        erros.append(
            "Arvore de Silos nao encontrada. Execute a Fase 2 tecnica "
            "(fase2-arvore, fase2-schema, fase2-tecnico) antes de construir o site."
        )
        # Erro bloqueante — sem arquitetura nao tem construcao
        print("FAIL — PRE-REQUISITO: Fase 2 tecnica nao concluida.")
        print(f"  ❌ {erros[0]}")
        return 1

    # ── NAP — dados de contato obrigatórios ──────────────────────────────────
    match = re.search(r"telefone[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or campo_vazio(match.group(1)):
        erros.append("NAP incompleto: telefone nao preenchido no projeto.md")

    match = re.search(r"(endereco|logradouro|rua)[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or campo_vazio(match.group(2) if match.lastindex == 2 else match.group(1)):
        erros.append("NAP incompleto: endereco/logradouro nao preenchido no projeto.md")

    match = re.search(r"cidade[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or campo_vazio(match.group(1)):
        erros.append("NAP incompleto: cidade nao preenchida no projeto.md")

    # ── Domínio real ──────────────────────────────────────────────────────────
    match = re.search(r"dominio[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or campo_vazio(match.group(1)):
        erros.append("Dominio nao preenchido no projeto.md — necessario para gerar sitemap e robots.txt")
    else:
        dominio = match.group(1).strip().lower()
        placeholders_dominio = ("seudominio.com.br", "exemplo.com.br", "teste.com.br", "test.com.br", "dominio.com.br")
        if dominio in placeholders_dominio or dominio.startswith("teste.") or dominio.startswith("test."):
            erros.append(f"Dominio parece ser placeholder: '{dominio}' — preencha o dominio real")

    # ── Direção visual ────────────────────────────────────────────────────────
    tem_tema = re.search(r"tema[^:\n]*:[ \t]*(tema-\d+|\w+-\w+)", conteudo, re.IGNORECASE)
    tem_referencia = re.search(r"(referencia.*visual|visual.*referencia|layout.*proprio)", conteudo, re.IGNORECASE)

    if not tem_tema and not tem_referencia:
        erros.append(
            "Direcao visual nao definida: informe o tema escolhido (tema-01, tema-03, tema-04) "
            "OU uma URL de referencia visual antes de construir"
        )

    # ── Serviços definidos ────────────────────────────────────────────────────
    match = re.search(r"## (Servicos|Money Pages).*?\n(.*?)(?=\n##|\Z)", conteudo, re.DOTALL | re.IGNORECASE)
    if not match:
        erros.append("Nenhum servico ou Money Page definido — o construtor precisa de pelo menos 1 servico")
    else:
        linhas = [l for l in match.group(2).split("\n") if l.strip() and not l.strip().startswith("#")]
        if len(linhas) < 2:
            avisos.append("Menos de 2 servicos definidos — site ficara muito pequeno")

    # ── Nome do negócio ───────────────────────────────────────────────────────
    match = re.search(r"(nome[_\s]*negocio|nome[^:\n]*empresa|empresa)[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or campo_vazio(match.group(2)):
        erros.append("Nome do negocio nao encontrado no projeto.md")

    # ── Slug registrado ───────────────────────────────────────────────────────
    match = re.search(r"^slug:[ \t]*(\S+)", conteudo, re.MULTILINE | re.IGNORECASE)
    if not match or not match.group(1).strip():
        erros.append("Slug nao registrado no projeto.md")
    elif match.group(1).strip() != slug:
        erros.append(f"Slug no projeto.md ('{match.group(1).strip()}') diverge do slug informado ('{slug}')")

    # ── ETAPA 0.5 — Identidade visual ───────────────────────────────────────────
    # Exige que o campo exista (foi perguntado), não que tenha uma resposta
    # positiva — "pendente"/"não possui" são respostas válidas e honestas.
    # Não usar campo_vazio() aqui: "pendente" é um valor legítimo para estes
    # dois campos especificamente, não um placeholder esquecido.
    match = re.search(r"logo_status[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or not match.group(1).strip():
        erros.append(
            "logo_status nao registrado — ETAPA 0.5 exige perguntar sobre logo "
            "antes de construir, mesmo que a resposta seja 'pendente'"
        )

    match = re.search(r"fotos_status[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or not match.group(1).strip():
        erros.append(
            "fotos_status nao registrado — ETAPA 0.5 exige perguntar sobre fotos "
            "reais antes de construir, mesmo que a resposta seja 'pendente'"
        )

    # ── ETAPA 0.5 — Dados institucionais ────────────────────────────────────────
    match = re.search(r"razao_social[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or campo_vazio(match.group(1)):
        erros.append("razao_social nao registrado no projeto.md (ETAPA 0.5, Parte 3)")

    match = re.search(r"^cnpj[^:\n]*:[ \t]*(.+)", conteudo, re.MULTILINE | re.IGNORECASE)
    if not match or campo_vazio(match.group(1)):
        erros.append(
            "cnpj nao registrado no projeto.md — se o cliente nao tiver, "
            "registrar explicitamente 'cnpj: nao possui' (ETAPA 0.5, Parte 3)"
        )

    match = re.search(r"email_institucional[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or campo_vazio(match.group(1)):
        erros.append("email_institucional nao registrado no projeto.md (ETAPA 0.5, Parte 3)")

    # ── ETAPA 0.5 — Prova social ─────────────────────────────────────────────────
    match = re.search(r"diferenciais[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match or campo_vazio(match.group(1)):
        erros.append("diferenciais nao registrados no projeto.md (ETAPA 0.5, Parte 4)")

    if not re.search(r"^ano_fundacao[^:\n]*:", conteudo, re.MULTILINE | re.IGNORECASE):
        avisos.append("ano_fundacao nao registrado — recomendado para prova social, nao bloqueia")

    if not re.search(r"^depoimentos[^:\n]*:", conteudo, re.MULTILINE | re.IGNORECASE):
        avisos.append("depoimentos nao registrados — ok se o negocio for novo e ainda nao tiver")

    # ── Avisos não bloqueantes ────────────────────────────────────────────────
    if not re.search(r"(whatsapp|wpp|zap)", conteudo, re.IGNORECASE):
        avisos.append("WhatsApp nao encontrado — botao de contato ficara sem numero")

    return imprimir_resultado(erros, avisos, "entrada")


# ─── VERIFICAÇÃO DE SAÍDA ─────────────────────────────────────────────────────

def verificar_saida(slug):
    """
    Verifica se o construtor entregou tudo antes de reportar 'pronto'.
    Bloqueia se faltar sitemap, robots, llms.txt, config real, conteúdo real.
    """
    caminho_projeto = _PROJECT_DIR / f"projetos/{slug}/projeto.md"
    if not caminho_projeto.exists():
        print(f"FAIL: projeto.md nao encontrado em {caminho_projeto}")
        return 1

    conteudo = caminho_projeto.read_text(encoding="utf-8")
    erros = []
    avisos = []

    # ── DNS — registrado na ETAPA 3.5, nunca bloqueia (aguardando propagacao
    # e um estado normal), mas precisa aparecer no resumo final se pendente
    match_dns = re.search(r"dns_status[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if not match_dns or not match_dns.group(1).strip():
        avisos.append(
            "dns_status nao registrado — confirme se o DNS do dominio foi "
            "checado/orientado (ETAPA 3.5), mesmo que ainda esteja propagando"
        )
    elif "aguardando" in match_dns.group(1).lower():
        avisos.append(
            f"DNS ainda propagando ({match_dns.group(1).strip()}) — o site "
            "esta publicado no servidor, mas o dominio pode ainda nao "
            "resolver. Isso precisa aparecer no resumo final ao cliente."
        )

    # Descobrir LINKFLOW_DIR (já é a pasta isolada deste cliente, via .env —
    # nunca acrescentar o slug de novo aqui, senão aninha em dobro)
    linkflow = _LINKFLOW_DIR
    astro_dir = linkflow / "_astro"
    content_dir = astro_dir / "src" / "content"
    config_file = astro_dir / "src" / "config" / "site.ts"

    # Contagem prévia de serviços — usada abaixo para exigir nav com Serviços
    qtd_servicos = 0
    if content_dir.exists() and (content_dir / "servicos").exists():
        qtd_servicos = len(list((content_dir / "servicos").glob("*.md")))

    # ── Config do cliente criado ──────────────────────────────────────────────
    if not config_file.exists():
        erros.append(f"Config do cliente nao encontrado: {config_file}")
    else:
        config_conteudo = config_file.read_text(encoding="utf-8")
        # Domínio real preenchido
        match = re.search(r"dominio:\s*['\"]([^'\"]+)['\"]", config_conteudo)
        if not match or campo_vazio(match.group(1)):
            erros.append("Campo 'dominio' vazio no config do cliente — sitemap e canonical ficarao errados")
        elif "seudominio" in match.group(1) or "exemplo" in match.group(1):
            erros.append(f"Campo 'dominio' com placeholder: '{match.group(1)}'")

        # NAP no config
        match_tel = re.search(r"telefone:\s*['\"]([^'\"]+)['\"]", config_conteudo)
        if not match_tel or campo_vazio(match_tel.group(1)):
            erros.append("Campo 'telefone' vazio no config — NAP incompleto")

        # ── Formato do config bate com o que o motor/painel esperam ────────────
        # 'negocio: {' no lugar de 'nap: {' é o formato antigo/errado do template
        # (corrigido em ETAPA 4.2) — se aparecer, o painel nao consegue ler NAP.
        if re.search(r"\bnegocio\s*:\s*\{", config_conteudo) and not re.search(r"\bnap\s*:\s*\{", config_conteudo):
            erros.append(
                "Config usa 'negocio: {...}' em vez de 'nap: {...}' — formato antigo, "
                "o painel SiteFlow nao consegue ler contato/endereco assim (ver ETAPA 4.2)"
            )
        elif not re.search(r"\bnap\s*:\s*\{", config_conteudo):
            erros.append("Campo 'nap' nao encontrado no config — obrigatorio para o painel ler NAP")

        # 'redes' precisa ser array [ ], nao objeto { } — objeto quebra a leitura
        match_redes = re.search(r"redes\s*:\s*(\[|\{)", config_conteudo)
        if not match_redes:
            erros.append("Campo 'redes' nao encontrado no config")
        elif match_redes.group(1) == "{":
            erros.append(
                "Campo 'redes' esta como objeto ({...}) em vez de array ([...]) — "
                "o painel SiteFlow so le redes sociais no formato "
                "[{ nome: 'Instagram', href: '...' }] (ver ETAPA 4.2)"
            )

        # 'nav' precisa existir e, com mais de 1 servico, precisa linkar /servicos —
        # sem isso a pagina pilar (que ja existe e ja lista os servicos sozinha)
        # fica sem nenhum link apontando pra ela, alcancavel só pelo sitemap.
        match_nav = re.search(r"\bnav\s*:\s*\[([\s\S]*?)\]", config_conteudo)
        if not match_nav:
            erros.append("Campo 'nav' nao encontrado no config — cabecalho ficara sem menu")
        elif qtd_servicos > 1 and "/servicos" not in match_nav.group(1):
            erros.append(
                f"'{qtd_servicos} servicos criados, mas 'nav' nao tem link para /servicos — "
                "pagina pilar de servicos fica orfa, alcancavel so pelo sitemap"
            )
        elif qtd_servicos > 1 and "filhos" not in match_nav.group(1):
            avisos.append(
                "Item 'Servicos' do nav nao tem 'filhos' — cada servico fica a 2 "
                "cliques da Home (via pilar), em vez de ter link direto no dropdown "
                "do cabecalho. Nao bloqueia, mas reduz o link interno."
            )

        # 'navFooterColunas' com a coluna Servicos preenchida — da link direto
        # a cada servico a partir de QUALQUER pagina do site, nao só da Home.
        if qtd_servicos > 1:
            match_footer = re.search(
                r"navFooterColunas\s*:\s*\[([\s\S]*?)\n  \]", config_conteudo
            )
            if not match_footer or "Serviços" not in match_footer.group(1) and "Servicos" not in match_footer.group(1):
                avisos.append(
                    "navFooterColunas sem coluna de Servicos — cada servico so tem "
                    "1 link de entrada (via /servicos), em vez de aparecer no rodape "
                    "de todo o site. Nao bloqueia, mas reduz o link interno."
                )

    # ── Conteúdo real criado ──────────────────────────────────────────────────
    if not content_dir.exists():
        erros.append(f"Pasta de conteudo do cliente nao encontrada: {content_dir}")
    else:
        servicos = list((content_dir / "servicos").glob("*.md")) if (content_dir / "servicos").exists() else []
        posts = list((content_dir / "posts").glob("*.md")) if (content_dir / "posts").exists() else []

        if len(servicos) == 0:
            erros.append("Nenhum arquivo de servico criado em content/servicos/")
        
        if len(posts) == 0:
            avisos.append("Nenhum post criado — blog estara vazio (ok para sites novos)")

        # Verificar se o conteudo nao e generico
        for md in servicos[:3]:  # checar os 3 primeiros
            texto = md.read_text(encoding="utf-8", errors="ignore")
            genericos = ["lorem ipsum", "nome do servico", "sua cidade", "[cidade]", "[servico]"]
            if any(g in texto.lower() for g in genericos):
                erros.append(f"Conteudo generico/placeholder detectado em {md.name} — substituir por conteudo real")

        # ── Colisao de slug na raiz (URL plana) ─────────────────────────────
        # servicos, posts e categorias nascem todos em /<slug> — pagina fixa
        # (sobre, contato, servicos, blog, autor, legais) tem prioridade
        # maxima, depois servico, depois categoria, depois artigo (decisao
        # do Jorge). O build (pages/[slug].astro) ja ignora o perdedor e
        # avisa no log, mas o guardiao bloqueia aqui pra nao passar batido.
        categorias_dir = content_dir / "categorias"
        categorias = list(categorias_dir.glob("*.md")) if categorias_dir.exists() else []
        PAGINAS_FIXAS = {
            "sobre", "contato", "servicos", "blog", "autor",
            "politica-de-privacidade", "termos-de-uso",
        }
        slugs_por_tipo = {
            "servico": {md.stem for md in servicos},
            "post": {md.stem for md in posts},
            "categoria": {md.stem for md in categorias},
        }
        donos_do_slug = {}
        for tipo, slugs in slugs_por_tipo.items():
            for s in slugs:
                donos_do_slug.setdefault(s, []).append(tipo)
        for s, tipos in sorted(donos_do_slug.items()):
            if s in PAGINAS_FIXAS:
                erros.append(
                    f"Slug '{s}' ({'/'.join(tipos)}) colide com pagina fixa do site "
                    f"— troque o slug do {'/'.join(tipos)}."
                )
            elif len(tipos) > 1:
                erros.append(
                    f"Slug '{s}' repetido entre {' e '.join(tipos)} — as URLs colidem "
                    "em /[slug] (prioridade: pagina fixa > servico > categoria > artigo, "
                    "os demais ficam inacessiveis). Troque o slug do que perde a prioridade."
                )

        # ── Post com autor:/categoria: inexistente (aviso, nao bloqueia) ────
        # O site aceita autor/categoria fora da colecao (mostra o texto sem
        # link — lib/autores.ts e lib/categorias.ts, fallback pra posts
        # antigos), entao nao e erro fatal. Mas geralmente e slug digitado
        # errado ou autor/categoria que devia existir e nao existe — vale
        # avisar em vez de passar batido.
        autores_dir = content_dir / "autores"
        autores_existentes = {md.stem for md in autores_dir.glob("*.md")} if autores_dir.exists() else set()
        categorias_existentes = {md.stem for md in categorias}

        for md in posts:
            texto = md.read_text(encoding="utf-8", errors="ignore")
            m_autor = re.search(r"^autor:[ \t]*[\"']?([^\"'\n]+?)[\"']?[ \t]*$", texto, re.MULTILINE)
            if m_autor:
                autor_valor = m_autor.group(1).strip()
                if autor_valor and autor_valor not in autores_existentes:
                    avisos.append(
                        f"{md.name}: autor '{autor_valor}' nao existe em content/autores/ — "
                        "aparece no artigo sem link pro perfil. Confira se o slug esta certo."
                    )
            m_cat = re.search(r"^categoria:[ \t]*[\"']?([^\"'\n]+?)[\"']?[ \t]*$", texto, re.MULTILINE)
            if m_cat:
                cat_valor = m_cat.group(1).strip()
                if cat_valor and cat_valor not in categorias_existentes:
                    avisos.append(
                        f"{md.name}: categoria '{cat_valor}' nao existe em content/categorias/ — "
                        "aparece no artigo sem link pra pagina da categoria. Confira se o slug esta certo."
                    )

    # ── Arquivos técnicos de SEO ──────────────────────────────────────────────
    # robots.txt e llms.txt nascem automaticamente no build (a integração
    # _astro/integracoes/sitemap-canonico.mjs gera um básico se ainda não
    # existir um custom em public/, salvo pelo painel). Por isso o guardião
    # confere o PUBLICADO (/var/www/[slug]/), não mais só public/ — que
    # agora pode legitimamente estar vazio até o cliente customizar pelo
    # painel, sem que isso signifique falha.
    site_dir_seo = Path(f"/var/www/{slug}")

    robots = site_dir_seo / "robots.txt"
    if not robots.exists():
        erros.append(
            "robots.txt nao encontrado no site publicado (/var/www/[slug]/) — "
            "build nao rodou, ou a integracao sitemap-canonico.mjs falhou em gera-lo"
        )
    else:
        robots_conteudo = robots.read_text(encoding="utf-8")
        if "seudominio" in robots_conteudo or "exemplo" in robots_conteudo:
            erros.append("robots.txt tem URL placeholder — atualizar com dominio real")
        if "Sitemap:" not in robots_conteudo:
            avisos.append("robots.txt nao referencia o Sitemap — adicionar linha 'Sitemap: https://[dominio]/sitemap.xml'")

    llms = site_dir_seo / "llms.txt"
    if not llms.exists():
        avisos.append("llms.txt nao encontrado no site publicado — recomendado para visibilidade em IAs")

    # sitemap — gerado no dist/ após o build
    match_dominio = re.search(r"dominio[^:\n]*:[ \t]*(.+)", conteudo, re.IGNORECASE)
    if match_dominio and not campo_vazio(match_dominio.group(1)):
        dominio_slug = match_dominio.group(1).strip().replace("https://", "").replace("http://", "").split("/")[0]
        site_dir = Path(f"/var/www/{slug}")
        sitemap = site_dir / "sitemap.xml"

        if not sitemap.exists():
            erros.append(
                "sitemap.xml nao encontrado em /var/www/[slug]/ — "
                "execute o build (npm run build) antes de reportar pronto"
            )
        else:
            # Existir não basta: o antigo public/sitemap.xml estático do tema
            # de exemplo (outro domínio, URLs /blog/<slug>) passava nesta
            # checagem. Conferir o CONTEÚDO contra o domínio do projeto.md.
            locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", sitemap.read_text(encoding="utf-8", errors="ignore"))
            sem_www = lambda h: re.sub(r"^www\.", "", h.lower())
            dominio_host = sem_www(dominio_slug)
            if not locs:
                erros.append("sitemap.xml sem nenhuma <loc> — build gerou sitemap vazio")
            else:
                fora_do_dominio = [u for u in locs if sem_www(re.sub(r"^https?://", "", u).split("/")[0]) != dominio_host]
                if fora_do_dominio:
                    erros.append(
                        f"sitemap.xml tem {len(fora_do_dominio)} URL(s) fora do dominio {dominio_slug} "
                        f"(ex: {fora_do_dominio[0]}) — conferir site.dominio no config/site.ts"
                    )
                url_aninhada = [u for u in locs if re.search(r"https?://[^/]+/(blog|servicos)/[^/]+", u)]
                if url_aninhada:
                    erros.append(
                        f"sitemap.xml tem URL com categoria no caminho (ex: {url_aninhada[0]}) — "
                        "viola a regra de URL plana (/[slug] direto na raiz)"
                    )
                if not any(re.fullmatch(r"https?://[^/]+/?", u) for u in locs):
                    avisos.append("sitemap.xml nao lista a home (/)")

    # ── Build executado ───────────────────────────────────────────────────────
    site_dir = Path(f"/var/www/{slug}")
    if not site_dir.exists() or not any(site_dir.iterdir()):
        erros.append(
            "Pasta do site vazia ou inexistente — "
            "o build nao foi executado ou o deploy nao foi feito"
        )
    else:
        # Verificar se o index.html nao e o placeholder "Em breve"
        index = site_dir / "index.html"
        if index.exists():
            index_conteudo = index.read_text(encoding="utf-8", errors="ignore")
            if "Em breve" in index_conteudo or "site em construção" in index_conteudo.lower():
                erros.append(
                    "index.html e a pagina placeholder 'Em breve' — "
                    "o build do Astro nao foi executado/deployado"
                )

    # ── Marcar construtor como concluído no projeto.md ─────────────────────────
    if not re.search(r"(construtor.*conclu[ií]do|site.*astro.*pronto|fase2.site.*ok)", conteudo, re.IGNORECASE):
        avisos.append(
            "Status do construtor nao registrado no projeto.md — "
            "adicionar linha 'fase2_site_astro: concluido' antes de prosseguir"
        )

    return imprimir_resultado(erros, avisos, "saida")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Guardiao do Construtor Astro")
    parser.add_argument("--slug", required=True, help="Slug do cliente")
    parser.add_argument(
        "--fase",
        choices=["entrada", "saida"],
        required=True,
        help="'entrada' = antes de construir | 'saida' = depois de construir"
    )
    args = parser.parse_args()

    if args.fase == "entrada":
        sys.exit(verificar_entrada(args.slug))
    else:
        sys.exit(verificar_saida(args.slug))


if __name__ == "__main__":
    main()
