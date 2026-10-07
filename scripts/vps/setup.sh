#!/bin/bash
# setup.sh — Configura VPS do zero para o LinkFlow (multi-cliente)
#
# O que faz:
#   1. Instala Node.js 22 (se faltar), Nginx, PM2, Certbot (só o que faltar)
#   2. Cria estrutura base do LinkFlow
#   3. Faz build do painel e do motor Astro
#   4. Configura o primeiro cliente (com o tema já promovido pra raiz)
#
# O que NUNCA faz: atualizar pacotes do sistema, remover configuração
# existente do Nginx, mexer em processos que já rodam no PM2, ou pedir SSL
# para domínio cujo DNS ainda não aponta para este servidor. O servidor pode
# ter outros clientes no ar.
#
# Uso: bash setup.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [TEMA]
# TEMA: base | tema-03 | tema-04 | tema-05 | tema-06 | tema-07
# Ex:  bash setup.sh torrez-desentupidora torrezdesentupidora.com.br painel.torrezdesentupidora.com.br tema-04

set -e

SLUG=${1:?"Erro: informe o slug do cliente (ex: torrez-desentupidora)"}
DOMINIO_SITE=${2:?"Erro: informe o domínio do site (ex: torrezdesentupidora.com.br)"}
DOMINIO_PAINEL=${3:?"Erro: informe o domínio do painel (ex: painel.torrezdesentupidora.com.br)"}
TEMA=${4:?"Erro: informe o tema (base | tema-03 | tema-04 | tema-05 | tema-06 | tema-07)"}

LINKFLOW_DIR="/opt/linkflow"
SITES_DIR="/var/www"

echo ""
echo "========================================="
echo "  LinkFlow VPS Setup — Multi-cliente"
echo "  Slug:          $SLUG"
echo "  Site:          $DOMINIO_SITE"
echo "  Painel:        $DOMINIO_PAINEL"
echo "  Tema:          $TEMA"
echo "========================================="
echo ""

# ─── 0. Inventário: o que já roda neste servidor ─────────────────────────────
echo "[0/7] Conferindo o que já existe neste servidor..."
OUTROS_SITES=$(ls /etc/nginx/sites-enabled 2>/dev/null | grep -v '^default$' || true)
OUTROS_PM2=""
if command -v pm2 &>/dev/null && command -v python3 &>/dev/null; then
  OUTROS_PM2=$(pm2 jlist 2>/dev/null | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    for p in json.loads(raw[raw.index("["):]):
        print(p.get("name", ""))
except Exception:
    pass
' || true)
fi
if [ -n "$OUTROS_SITES" ]; then
  echo "  Sites já servidos pelo Nginx (não serão alterados):"
  echo "$OUTROS_SITES" | sed 's/^/    - /'
fi
if [ -n "$OUTROS_PM2" ]; then
  echo "  Processos já rodando no PM2 (não serão alterados):"
  echo "$OUTROS_PM2" | sed 's/^/    - /'
fi
echo ""

# ─── 1. Sistema ───────────────────────────────────────────────────────────────
# Só atualiza a lista de pacotes. Nada de `upgrade`: atualizar o sistema pode
# trocar versões de Node/Nginx/OpenSSL e derrubar clientes que já estão no ar.
echo "[1/7] Atualizando a lista de pacotes (sem atualizar o sistema)..."
apt-get update -qq

# ─── 2. Node.js 22 + dependências ─────────────────────────────────────────────
echo "[2/7] Conferindo Node.js..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - -qq
  apt-get install -y -qq nodejs
fi
NODE_MAJOR=$(node --version | sed 's/^v\([0-9]*\).*/\1/')
echo "  Node: $(node --version)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Erro: Node $(node --version) é antigo demais para o motor Astro (mínimo 18)."
  echo "Este script não troca o Node de um servidor que já tem outros clientes."
  echo "Nada foi alterado. Atualize o Node de forma planejada e rode de novo."
  exit 1
fi

# --no-upgrade: instala só o que falta; pacote já instalado fica como está
apt-get install -y -qq --no-upgrade nginx python3 git certbot python3-certbot-nginx
command -v pm2 &>/dev/null || npm install -g pm2 --silent

# ─── 3. Estrutura base ────────────────────────────────────────────────────────
echo "[3/7] Criando estrutura de pastas..."
mkdir -p $LINKFLOW_DIR/{clientes,_astro,skills,scripts,projetos}

# ─── 4. Primeiro cliente ──────────────────────────────────────────────────────
echo "[4/7] Configurando cliente $SLUG..."
bash "$(dirname "$0")/novo-cliente.sh" "$SLUG" "$DOMINIO_SITE" "$DOMINIO_PAINEL" "$TEMA" --sem-ssl

# ─── 5. Nginx base ────────────────────────────────────────────────────────────
echo "[5/7] Conferindo Nginx..."
# O site "default" (página de boas-vindas do Nginx) só é removido num servidor
# recém-instalado, sem nenhum outro site além do cliente recém-criado. Se já
# existia outro cliente, ele pode estar servido como default_server: não se toca.
OUTROS_ANTES=$(echo "$OUTROS_SITES" | grep -v -e "^site-$SLUG\$" -e "^painel-$SLUG\$" || true)
if [ -z "$OUTROS_ANTES" ] && [ -e /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
fi

systemctl enable nginx
if systemctl is-active --quiet nginx; then
  nginx -t && systemctl reload nginx
else
  nginx -t && systemctl start nginx
fi

# ─── 6. SSL ───────────────────────────────────────────────────────────────────
# Só para os nomes que já apontam para este servidor; DNS pendente não é erro.
echo "[6/7] SSL (só para o que já aponta para este servidor)..."
SAIDA_SSL=$(bash "$(dirname "$0")/ssl-cliente.sh" "$SLUG" "$DOMINIO_SITE" "$DOMINIO_PAINEL" 2>&1) || true
echo "$SAIDA_SSL" | sed 's/^/  /'
SSL_STATUS=$(echo "$SAIDA_SSL" | grep '^SSL_STATUS=' | tail -1 | cut -d= -f2-)
SSL_STATUS=${SSL_STATUS:-falhou}

# ─── 7. PM2 startup ───────────────────────────────────────────────────────────
echo "[7/7] Configurando PM2 startup..."
# Só configura a inicialização automática se ainda não existir
systemctl is-enabled pm2-root &>/dev/null || { pm2 startup systemd -u root --hp /root | tail -1 | bash || true; }
pm2 save

echo ""
echo "========================================="
echo "  Setup concluído!"
echo "  Site:   $DOMINIO_SITE"
echo "  Painel: $DOMINIO_PAINEL"
echo "  SSL:    $SSL_STATUS  (pendente = o DNS ainda não aponta para este servidor)"
echo "========================================="
