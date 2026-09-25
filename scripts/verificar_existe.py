"""
verificar_existe.py — Consulta o WordPress: slug já existe?

Uso:
  python scripts/verificar_existe.py \
    --slug minha-pagina-exemplo \
    --tipo page \
    --wp-url https://exemplo.com.br

Credenciais (em ordem de prioridade):
  1. --wp-user e --wp-password (CLI)
  2. Variáveis de ambiente WP_USER / WP_PASSWORD
  3. config/wp-credentials.json  {"https://site.com": {"user": "x", "password": "y"}}

Exit codes:
  0  → "livre"  (slug não existe — pode criar)
  1  → já existe  (JSON {id, titulo, slug, status, data} no stdout)
  2  → erro de conexão / autenticação

Quando exit=1, quem chamou deve PARAR e perguntar ao usuário:
  "⚠️ Já existe conteúdo com esse slug no WordPress:
   ID [x] · '[título]' · status [y] · criado em [data]

   O que fazer?
   (1) Reescrever — sobrescrevo o conteúdo, mantenho o ID e a URL
   (2) Deletar e criar do zero — mando para a lixeira e crio novo
   (3) Escolher outro slug
   (4) Cancelar"

Registrar a escolha no projeto.md antes de prosseguir.
"""

import argparse
import json
import os
import sys

try:
    import requests
except ImportError:
    print("ERRO: biblioteca 'requests' não instalada. Execute: pip install requests", file=sys.stderr)
    sys.exit(2)

CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), "..", "config", "wp-credentials.json")


def load_credentials(wp_url):
    """Tenta carregar credenciais de config/wp-credentials.json."""
    try:
        with open(CREDENTIALS_FILE, encoding="utf-8") as f:
            data = json.load(f)
        domain = wp_url.rstrip("/")
        if domain in data:
            return data[domain].get("user", ""), data[domain].get("password", "")
    except (FileNotFoundError, KeyError, json.JSONDecodeError):
        pass
    return "", ""


def verificar(slug, tipo, wp_url, wp_user, wp_password):
    # Resolve credenciais em ordem de prioridade
    if not wp_user:
        wp_user = os.environ.get("WP_USER", "")
    if not wp_password:
        wp_password = os.environ.get("WP_PASSWORD", "")
    if not wp_user:
        file_user, file_pass = load_credentials(wp_url)
        wp_user, wp_password = file_user, file_pass

    endpoint = f"{wp_url.rstrip('/')}/wp-json/wp/v2/{tipo}s"
    params = {"slug": slug, "per_page": 1}
    auth = (wp_user, wp_password) if wp_user else None

    # Tenta com status=any (exige auth); fallback sem auth (só published)
    try:
        r = requests.get(endpoint, params={**params, "status": "any"}, auth=auth, timeout=10)
        if r.status_code == 401:
            r = requests.get(endpoint, params=params, timeout=10)
        r.raise_for_status()
        items = r.json()
    except requests.exceptions.RequestException as e:
        print(f"ERRO de conexão: {e}", file=sys.stderr)
        sys.exit(2)

    if not items:
        print("livre")
        return 0

    item = items[0]
    result = {
        "id":     item["id"],
        "titulo": item.get("title", {}).get("rendered", ""),
        "slug":   item["slug"],
        "status": item["status"],
        "data":   item.get("date", "")[:10],
    }
    print(json.dumps(result, ensure_ascii=False))
    return 1


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Verifica se slug já existe no WordPress")
    p.add_argument("--slug",        required=True,  help="Slug a verificar (sem barras)")
    p.add_argument("--tipo",        required=True,  choices=["page", "post"])
    p.add_argument("--wp-url",      required=True,  dest="wp_url", help="URL base do WP (ex: https://site.com)")
    p.add_argument("--wp-user",     default="",     dest="wp_user")
    p.add_argument("--wp-password", default="",     dest="wp_password")
    args = p.parse_args()
    sys.exit(verificar(args.slug, args.tipo, args.wp_url, args.wp_user, args.wp_password))
