#!/bin/bash
# setup.sh — Configura VPS do zero para o LinkFlow (multi-cliente)
#
# O que faz:
#   1. Instala Node.js 22, Nginx, PM2, Certbot
#   2. Cria estrutura base do LinkFlow
#   3. Faz build do painel e do motor Astro
#   4. Configura o primeiro cliente (com o tema já promovido pra raiz)
#
# Uso: bash setup.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [TEMA]
# TEMA: base | tema-03 | tema-04
# Ex:  bash setup.sh torrez-desentupidora torrezdesentupidora.com.br painel.torrezdesentupidora.com.br tema-04

set -e

SLUG=${1:?"Erro: informe o slug do cliente (ex: torrez-desentupidora)"}
DOMINIO_SITE=${2:?"Erro: informe o domínio do site (ex: torrezdesentupidora.com.br)"}
DOMINIO_PAINEL=${3:?"Erro: informe o domínio do painel (ex: painel.torrezdesentupidora.com.br)"}
TEMA=${4:?"Erro: informe o tema (base | tema-03 | tema-04)"}

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

# ─── 1. Sistema ───────────────────────────────────────────────────────────────
echo "[1/7] Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# ─── 2. Node.js 22 + dependências ─────────────────────────────────────────────
echo "[2/7] Instalando Node.js 22..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - -qq
  apt-get install -y -qq nodejs
fi
echo "  Node: $(node --version)"

apt-get install -y -qq nginx python3 git certbot python3-certbot-nginx
npm install -g pm2 --silent

# ─── 3. Estrutura base ────────────────────────────────────────────────────────
echo "[3/7] Criando estrutura de pastas..."
mkdir -p $LINKFLOW_DIR/{clientes,_astro,skills,scripts,projetos}

# ─── 4. Primeiro cliente ──────────────────────────────────────────────────────
echo "[4/7] Configurando cliente $SLUG..."
bash "$(dirname "$0")/novo-cliente.sh" "$SLUG" "$DOMINIO_SITE" "$DOMINIO_PAINEL" "$TEMA" --sem-ssl

# ─── 5. Nginx base ────────────────────────────────────────────────────────────
echo "[5/7] Configurando Nginx base..."
# Remover default
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl enable nginx && systemctl start nginx

# ─── 6. SSL ───────────────────────────────────────────────────────────────────
echo "[6/7] Gerando SSL..."
certbot --nginx \
  -d "$DOMINIO_SITE" -d "www.$DOMINIO_SITE" \
  -d "$DOMINIO_PAINEL" \
  --non-interactive --agree-tos \
  -m "ssl@$(echo $DOMINIO_SITE | cut -d. -f2-)" \
  --redirect

# ─── 7. PM2 startup ───────────────────────────────────────────────────────────
echo "[7/7] Configurando PM2 startup..."
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 save

echo ""
echo "========================================="
echo "  Setup concluído!"
echo "  Site:   https://$DOMINIO_SITE"
echo "  Painel: https://$DOMINIO_PAINEL"
echo "========================================="
