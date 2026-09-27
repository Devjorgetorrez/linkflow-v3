#!/usr/bin/env python3
"""
testar_nginx_midia.py — prova, sem Nginx instalado, que o server block do SITE gerado por
scripts/vps/novo-cliente.sh manda cada URL para a location certa.

Reimplementa a regra de seleção de location do Nginx:
  1. location exata (= /x): vence tudo;
  2. entre os prefixos, guarda o MAIS LONGO que casa; se ele for ^~, para aqui (regex não roda);
  3. senão, testa as regex (~ e ~*) NA ORDEM em que aparecem; a primeira que casar vence;
  4. nenhuma regex casou: vale o prefixo mais longo.
Depois aplica os `if ($uri ~ ...) { return N; }` da location escolhida.

Uso: python scripts/testes/testar_nginx_midia.py   (exit 0 = tudo certo)
Limite: não é o Nginx real — só valida a lógica de seleção. `nginx -t` continua sendo
feito pelo próprio novo-cliente.sh no servidor.
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
SCRIPT = RAIZ / "scripts" / "vps" / "novo-cliente.sh"


def extrair_server_site():
    txt = SCRIPT.read_text(encoding="utf-8")
    m = re.search(r"cat > /etc/nginx/sites-available/site-\$SLUG << EOF\n(.*?)\nEOF\n", txt, re.S)
    if not m:
        sys.exit("heredoc do site nao encontrado em novo-cliente.sh")
    corpo = m.group(1)
    # o que o bash faz num heredoc sem aspas: \$ -> $ ; $VAR -> valor
    corpo = corpo.replace(chr(92) + "$", "\0")
    corpo = corpo.replace("$CLIENTE_DIR", "/opt/linkflow/clientes/demo").replace("$SITES_DIR", "/var/www")
    corpo = corpo.replace("$SLUG", "demo").replace("$DOMINIO_SITE", "demo.com.br")
    assert not re.search(r"\$[A-Za-z_{]", corpo.replace("\0", "")), "variavel nao resolvida no heredoc"
    return corpo.replace("\0", "$")


def parse_locations(server):
    """Devolve lista de dicts {mod, path, corpo} dos location de 1o nivel, em ordem."""
    locs = []
    for m in re.finditer(r"^    location\s+(?:(\^~|~\*|~|=)\s+)?(\S+)\s*\{", server, re.M):
        i, depth = m.end(), 1
        while depth:
            depth += {"{": 1, "}": -1}.get(server[i], 0)
            i += 1
        locs.append({"mod": m.group(1) or "", "path": m.group(2), "corpo": server[m.end():i - 1]})
    return locs


def selecionar(locs, uri):
    for l in locs:
        if l["mod"] == "=" and l["path"] == uri:
            return l
    melhor = None
    for l in locs:
        if l["mod"] in ("", "^~") and uri.startswith(l["path"]):
            if melhor is None or len(l["path"]) > len(melhor["path"]):
                melhor = l
    if melhor and melhor["mod"] == "^~":
        return melhor
    for l in locs:
        if l["mod"] in ("~", "~*"):
            flags = re.I if l["mod"] == "~*" else 0
            if re.search(l["path"], uri, flags):
                return l
    return melhor


def status_final(loc, uri):
    """Aplica os `if ($uri ~* "rx") { return N; }` da location escolhida."""
    for m in re.finditer(r'if\s*\(\$uri\s+(~\*?)\s+"([^"]+)"\)\s*\{\s*return\s+(\d+);', loc["corpo"]):
        flags = re.I if m.group(1) == "~*" else 0
        if re.search(m.group(2), uri, flags):
            return int(m.group(3))
    return 200


def main():
    server = extrair_server_site()
    locs = parse_locations(server)
    esperado = [
        # uri, tipo de location esperado, status esperado
        ("/midia/foto.jpg", "midia", 200),
        ("/midia/doc.pdf", "midia", 200),
        ("/midia/v.mp4", "midia", 200),
        ("/midia/a/b.png", "midia", 200),
        ("/midia/x.jpg.meta.json", "midia", 404),
        ("/midia/X.JPG.META.JSON", "midia", 404),
        ("/midia/.oculto.png", "midia", 404),
        ("/midia/sub/.env", "midia", 404),
        ("/_astro/x.css", "regex-assets", 200),
        ("/logo.png", "regex-assets", 200),
        ("/servicos/", "root", 200),
    ]
    falhas = 0
    for uri, tipo, status in esperado:
        loc = selecionar(locs, uri)
        if loc["mod"] == "^~" and loc["path"] == "/midia/":
            t = "midia"
            assert "alias /opt/linkflow/clientes/demo/midia/;" in loc["corpo"]
        elif loc["mod"] == "~*":
            t = "regex-assets"
        elif loc["path"] == "/":
            t = "root"
        else:
            t = f"outra:{loc['path']}"
        st = status_final(loc, uri)
        ok = (t == tipo and st == status)
        falhas += not ok
        print(f"{'OK  ' if ok else 'FAIL'} {uri:28s} -> {t:13s} {st}  (esperado {tipo} {status})")

    midia = next(l for l in locs if l["path"] == "/midia/")["corpo"]
    midia = chr(10).join(ln for ln in midia.splitlines() if not ln.strip().startswith("#"))
    for exigido in ("autoindex off", "nosniff", "max-age=2592000", "immutable"):
        ok = exigido in midia
        falhas += not ok
        print(f"{'OK  ' if ok else 'FAIL'} bloco /midia/ contem '{exigido}'")
    for proibido in ("try_files", "expires"):
        ok = proibido not in midia
        falhas += not ok
        print(f"{'OK  ' if ok else 'FAIL'} bloco /midia/ NAO contem '{proibido}' (alias + try_files/expires duplicado)")

    # o painel: upload e timeout
    txt = SCRIPT.read_text(encoding="utf-8")
    painel = re.search(r"sites-available/painel-\$SLUG << EOF\n(.*?)\nEOF\n", txt, re.S).group(1)
    m = re.search(r"client_max_body_size\s+(\d+)m;", painel)
    ok = bool(m) and int(m.group(1)) >= 12
    falhas += not ok
    print(f"{'OK  ' if ok else 'FAIL'} painel: client_max_body_size >= 12m")
    m = re.search(r"proxy_read_timeout\s+(\d+)s;", painel)
    ok = bool(m) and int(m.group(1)) >= 120
    falhas += not ok
    print(f"{'OK  ' if ok else 'FAIL'} painel: proxy_read_timeout >= 120s")

    print("\nRESULTADO:", "PASSOU" if not falhas else f"{falhas} FALHA(S)")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
