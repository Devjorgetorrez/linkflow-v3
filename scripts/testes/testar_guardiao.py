"""Teste do guardiao_construtor.py com projeto sintetico (nao toca no projeto real).

Uso: python scripts/testes/testar_guardiao.py
Cria um projeto temporario em cada cenario (construcao sem dominio, layout invalido,
publicacao bloqueada/liberada, previa com dominio provisorio, saida, pilar /planos).
Esperado: 27 cenarios OK e a linha final "TUDO OK".
"""
import os, shutil, subprocess, sys, tempfile
from pathlib import Path

REAL = Path(__file__).resolve().parent.parent.parent
GUARD = REAL / "scripts" / "guardiao_construtor.py"

BASE_MD = """# Projeto
slug: teste
nome_negocio: Vereda Corretora Teste
telefone: (11) 99999-0000
endereco: Rua A, 10
cidade: Sao Paulo
tema_pasta: {tema}
logo_status: pendente
fotos_status: pendente
razao_social: Vereda Teste Ltda
cnpj: nao possui
diferenciais: atendimento rapido
whatsapp: 11999990000
{extra}
## Raio-X
ok
## Servicos
- Plano A
- Plano B
"""


def montar(tmp, tema="tema-07", extra="", pilar="/planos", nav_pilar=True, painel=None):
    proj = tmp / "proj"
    lf = tmp / "lf"
    sites = tmp / "sites"
    (proj / "projetos" / "teste").mkdir(parents=True)
    (proj / "projetos" / "teste" / "projeto.md").write_text(BASE_MD.format(tema=tema, extra=extra), encoding="utf-8")
    cfg = lf / "_astro" / "src" / "config"
    cfg.mkdir(parents=True)
    rota = f"  rotaPilar: '{pilar}',\n" if pilar != "/servicos" else ""
    nav = f"[{{ label: 'Planos', href: '{pilar}', filhos: [] }}]" if nav_pilar else "[{ label: 'Home', href: '/' }]"
    (cfg / "site.ts").write_text(
        "export const site = {\n  dominio: '',\n" + (f"  painelUrl: '{painel}',\n" if painel is not None else "") + rota +
        "  nap: { telefone: '11999990000' },\n  redes: [],\n  nav: " + nav + ",\n"
        "  navFooterColunas: [\n    { titulo: 'Planos', links: [] },\n  ],\n}\n", encoding="utf-8")
    cont = lf / "_astro" / "src" / "content"
    for c in ("servicos", "posts", "categorias", "autores"):
        (cont / c).mkdir(parents=True)
    (cont / "servicos" / "plano-a.md").write_text("---\ntitulo: A\n---\ncorpo real", encoding="utf-8")
    (cont / "servicos" / "plano-b.md").write_text("---\ntitulo: B\n---\ncorpo real", encoding="utf-8")
    dist = lf / "_astro" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text("<html>home</html>", encoding="utf-8")
    (dist / "sitemap.xml").write_text("<urlset><url><loc>https://dominio-provisorio.local/</loc></url></urlset>", encoding="utf-8")
    (dist / "robots.txt").write_text("User-agent: *\nSitemap: https://dominio-provisorio.local/sitemap.xml\n", encoding="utf-8")
    (dist / "llms.txt").write_text("# x", encoding="utf-8")
    sites.mkdir()
    return proj, lf, sites


def rodar(fase, proj, lf, sites):
    env = dict(os.environ, CLAUDE_PROJECT_DIR=str(proj), LINKFLOW_DIR=str(lf), LINKFLOW_SITES_DIR=str(sites), PYTHONIOENCODING="utf-8")
    r = subprocess.run([sys.executable, str(GUARD), "--slug", "teste", "--fase", fase], env=env, capture_output=True, text=True, encoding="utf-8")
    return r.returncode, r.stdout


ok = True


def checar(nome, cond, saida=""):
    global ok
    ok &= bool(cond)
    print(("OK   " if cond else "ERRO ") + nome)
    if not cond:
        print("      saida:", saida.strip()[:600].replace("\n", "\n            "))


tmp = Path(tempfile.mkdtemp(prefix="guard_"))
try:
    # 1. construcao SEM dominio e SEM e-mail: passa, com avisos
    p, l, s = montar(tmp / "a")
    rc, out = rodar("construcao", p, l, s)
    checar("construcao sem dominio/e-mail PASSA", rc == 0, out)
    checar("  ...e avisa do dominio provisorio", "Dominio" in out and "provisorio" in out, out)
    checar("  ...e avisa do e-mail", "email_institucional ainda nao registrado" in out, out)
    rc, out = rodar("entrada", p, l, s)
    checar("apelido 'entrada' == construcao", rc == 0 and "construcao" in out, out)

    # 2. layout invalido / ausente bloqueia
    p, l, s = montar(tmp / "b", tema="tema-99")
    rc, out = rodar("construcao", p, l, s)
    checar("construcao com tema_pasta invalido BLOQUEIA", rc == 1 and "nao existe" in out, out)
    p, l, s = montar(tmp / "c", tema="tema-05")
    rc, out = rodar("construcao", p, l, s)
    checar("construcao aceita tema-05", rc == 0, out)

    # 3. publicacao: bloqueia sem aprovacao/dominio/e-mail
    p, l, s = montar(tmp / "d")
    rc, out = rodar("publicacao", p, l, s)
    checar("publicacao sem nada BLOQUEIA", rc == 1, out)
    checar("  ...exige aprovacao visual", "Visual ainda nao aprovado" in out, out)
    checar("  ...exige dominio", "Dominio" in out and "necessario para publicar" in out, out)
    checar("  ...exige e-mail", "email_institucional nao registrado" in out, out)
    p, l, s = montar(tmp / "e", extra="visual_aprovado: sim\ndominio: veredaseguros.com.br\nemail_institucional: contato@veredaseguros.com.br")
    rc, out = rodar("publicacao", p, l, s)
    checar("publicacao completa PASSA", rc == 0, out)
    p, l, s = montar(tmp / "f", extra="visual_aprovado: nao\ndominio: veredaseguros.com.br\nemail_institucional: a@b.com")
    rc, out = rodar("publicacao", p, l, s)
    checar("publicacao com visual_aprovado: nao BLOQUEIA", rc == 1 and "Visual ainda nao aprovado" in out, out)
    p, l, s = montar(tmp / "g", extra="visual_aprovado: sim\ndominio: exemplo.com.br\nemail_institucional: a@b.com")
    rc, out = rodar("publicacao", p, l, s)
    checar("publicacao com dominio placeholder BLOQUEIA", rc == 1 and "placeholder" in out, out)

    # 4. previa local: dominio vazio no config e ok; sem dist falha
    p, l, s = montar(tmp / "h")
    rc, out = rodar("previa", p, l, s)
    checar("previa com dominio provisorio e sem servidor PASSA", rc == 0, out)
    shutil.rmtree(l / "_astro" / "dist")
    rc, out = rodar("previa", p, l, s)
    checar("previa sem dist BLOQUEIA", rc == 1 and "dist/index.html" in out, out)

    # 5. saida (pos-deploy) continua exigindo dominio real e site publicado
    p, l, s = montar(tmp / "i", extra="visual_aprovado: sim\ndominio: veredaseguros.com.br\nemail_institucional: a@b.com")
    rc, out = rodar("saida", p, l, s)
    checar("saida sem site publicado BLOQUEIA", rc == 1, out)

    # 6. pilar /planos: nav sem /planos bloqueia; com /planos passa; slug 'planos' colide
    p, l, s = montar(tmp / "j", nav_pilar=False)
    rc, out = rodar("previa", p, l, s)
    checar("nav sem /planos BLOQUEIA (pilar vem de rotaPilar)", rc == 1 and "/planos" in out, out)
    p, l, s = montar(tmp / "k")
    (l / "_astro/src/content/servicos/planos.md").write_text("---\ntitulo: P\n---\nx", encoding="utf-8")
    rc, out = rodar("previa", p, l, s)
    checar("servico com slug 'planos' colide com o pilar", rc == 1 and "colide com pagina fixa" in out, out)
    # tema sem rotaPilar usa /servicos
    p, l, s = montar(tmp / "m", pilar="/servicos")
    rc, out = rodar("previa", p, l, s)
    checar("tema sem rotaPilar usa /servicos (padrao)", rc == 0, out)

    # 7. dado de demonstracao no config: horarios/area IGUAIS aos de um layout reprovam (JSON-LD falso)
    import re as _re
    ref_proj = tmp / "ref"
    (ref_proj / "projetos" / "teste").mkdir(parents=True)
    (ref_proj / "projetos" / "teste" / "projeto.md").write_text("slug: teste\n## Raio-X\n", encoding="utf-8")
    shutil.copytree(REAL / "_astro" / "src" / "config", ref_proj / "_astro" / "src" / "config")
    cli = tmp / "cli"
    (cli / "_astro" / "src" / "config").mkdir(parents=True)
    (cli / "_astro" / "dist").mkdir(parents=True)
    cfg = (REAL / "_astro" / "src" / "config" / "tema-05.ts").read_text(encoding="utf-8")
    for campo in ("nome", "nomeBreve", "nomeLongo", "razaoSocial", "descricao", "cnpj", "telefone", "whatsapp", "email", "logradouro", "enderecoFormatado"):
        cfg = _re.sub(rf"^([ 	]+{campo}\s*:\s*)['\"][^'\"]*['\"]", r"'Cliente Real'", cfg, flags=_re.M)
    cfg = _re.sub(r"^  dominio:\s*['\"][^'\"]*['\"]", "  dominio: 'https://seudominio.com.br'", cfg, flags=_re.M)
    (cli / "_astro" / "src" / "config" / "site.ts").write_text(cfg, encoding="utf-8")
    env = dict(os.environ, CLAUDE_PROJECT_DIR=str(ref_proj), LINKFLOW_DIR=str(cli), PYTHONIOENCODING="utf-8")
    r = subprocess.run([sys.executable, str(GUARD), "--slug", "teste", "--fase", "previa"], env=env, capture_output=True, text=True, encoding="utf-8")
    checar("horario/area de demonstracao esquecidos REPROVAM a previa", r.returncode == 1 and "funcionamento: bloco identico" in r.stdout and "areaAtendimento: bloco identico" in r.stdout, r.stdout)
    cfg2 = _re.sub(r"^  areaAtendimento:\s*\[[^\]]*\]", "  areaAtendimento: ['Campinas']", cfg, flags=_re.M)
    cfg2 = _re.sub(r"^  funcionamento:\s*\[.*?^  \]", "  funcionamento: []", cfg2, flags=_re.M | _re.S)
    (cli / "_astro" / "src" / "config" / "site.ts").write_text(cfg2, encoding="utf-8")
    r = subprocess.run([sys.executable, str(GUARD), "--slug", "teste", "--fase", "previa"], env=env, capture_output=True, text=True, encoding="utf-8")
    checar("com area e horario do cliente, esses dois deixam de ser apontados", "funcionamento: bloco identico" not in r.stdout and "areaAtendimento: bloco identico" not in r.stdout, r.stdout)

    # 8. painelUrl (destino do formulario de contato): previa avisa, publicacao valida, saida exige
    ext = "visual_aprovado: sim\ndominio: veredaseguros.com.br\nemail_institucional: a@b.com"
    p, l, s = montar(tmp / "n1", painel="")
    rc, out = rodar("previa", p, l, s)
    checar("previa com painelUrl vazio PASSA e apenas avisa", rc == 0 and "painelUrl vazio na previa" in out, out)
    p, l, s = montar(tmp / "n2", extra=ext, painel="")
    rc, out = rodar("publicacao", p, l, s)
    checar("publicacao com painelUrl vazio avisa (preenche na 6.2)", rc == 0 and "painelUrl ainda vazio" in out, out)
    p, l, s = montar(tmp / "n3", extra=ext, painel="http://painel.veredaseguros.com.br")
    rc, out = rodar("publicacao", p, l, s)
    checar("publicacao com painelUrl http BLOQUEIA", rc == 1 and "painelUrl" in out and "https" in out, out)
    p, l, s = montar(tmp / "n4", extra=ext, painel="https://painel.veredaseguros.com.br")
    rc, out = rodar("publicacao", p, l, s)
    checar("publicacao com painelUrl https PASSA", rc == 0 and "painelUrl" not in out, out)
    p, l, s = montar(tmp / "n5", extra=ext, painel="")
    rc, out = rodar("saida", p, l, s)
    checar("saida com painelUrl vazio BLOQUEIA", rc == 1 and "painelUrl no config/site.ts vazio" in out, out)
    p, l, s = montar(tmp / "n6", extra=ext)
    rc, out = rodar("saida", p, l, s)
    checar("saida sem o campo painelUrl BLOQUEIA", rc == 1 and "painelUrl ausente" in out, out)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\nTUDO OK" if ok else "\nHA FALHAS")
sys.exit(0 if ok else 1)
