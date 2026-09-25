#!/bin/bash
# novo-cliente.sh — Adiciona um novo cliente ao VPS LinkFlow
#
# Cria estrutura isolada, configura Nginx, gera SSL, builda painel e inicia PM2.
# Cada cliente tem: pasta própria, porta própria, processo PM2 próprio,
# motor Astro isolado com só UM tema (nunca aparece na URL do cliente).
#
# Uso: bash novo-cliente.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [TEMA] [--sem-ssl]
# TEMA: base | tema-03 | tema-04
# Ex:  bash novo-cliente.sh luis-oficina luisoficinamecanica.com.br painel.luisoficinamecanica.com.br tema-04

set -e

SLUG=${1:?"Erro: informe o slug (ex: luis-oficina)"}
DOMINIO_SITE=${2:?"Erro: informe o domínio do site (ex: luisoficinamecanica.com.br)"}
DOMINIO_PAINEL=${3:?"Erro: informe o domínio do painel (ex: painel.luisoficinamecanica.com.br)"}
TEMA=${4:?"Erro: informe o tema (base | tema-03 | tema-04)"}
SEM_SSL=${5:-""}

LINKFLOW_DIR="/opt/linkflow"
SITES_DIR="/var/www"
CLIENTE_DIR="$LINKFLOW_DIR/clientes/$SLUG"

echo "[novo-cliente] Configurando $SLUG → $DOMINIO_SITE | painel: $DOMINIO_PAINEL | tema: $TEMA"

# ─── Verificar se já existe ───────────────────────────────────────────────────
if [ -d "$CLIENTE_DIR" ]; then
  echo "Erro: cliente $SLUG já existe em $CLIENTE_DIR"
  exit 1
fi

# ─── Porta única para este cliente ────────────────────────────────────────────
# Pega a maior porta em uso pelos painéis e incrementa
PORTA_BASE=3210
ULTIMA_PORTA=$(pm2 list 2>/dev/null | grep "painel-" | grep -oP ':\K[0-9]+' | sort -n | tail -1 || echo $((PORTA_BASE - 1)))
PORTA=$((ULTIMA_PORTA + 1))
[ $PORTA -lt $PORTA_BASE ] && PORTA=$PORTA_BASE

echo "  Porta do painel: $PORTA"

# ─── Estrutura de pastas do cliente ──────────────────────────────────────────
echo "  Criando estrutura..."
mkdir -p $CLIENTE_DIR/{dados,midia}
mkdir -p $SITES_DIR/$SLUG

# Dados isolados por cliente
touch $CLIENTE_DIR/usuarios.json
echo "[]" > $CLIENTE_DIR/usuarios.json
echo "[]" > $CLIENTE_DIR/dados/leads.json
echo "[]" > $CLIENTE_DIR/dados/formularios.json
echo "[]" > $CLIENTE_DIR/dados/tarefas.json
echo "[]" > $CLIENTE_DIR/dados/redirects.json

# ─── Motor Astro do cliente ───────────────────────────────────────────────────
# Copia o motor compartilhado inteiro (os 3 temas lado a lado, igual ao
# repositório de referência) e promove só o tema escolhido pra raiz — os
# outros dois somem por completo. Isso garante a regra de que a escolha
# de tema nunca aparece na URL do cliente ("/tema-04/..." nunca acontece).
echo "  Copiando motor Astro compartilhado..."
if [ ! -d "$LINKFLOW_DIR/_astro" ]; then
  echo "Erro: motor Astro compartilhado não encontrado em $LINKFLOW_DIR/_astro"
  echo "Rode o bootstrap (setup.sh) primeiro — ele copia o motor uma única vez."
  exit 1
fi
cp -r "$LINKFLOW_DIR/_astro" "$CLIENTE_DIR/_astro"

echo "  Promovendo tema '$TEMA' para a raiz..."
python3 "$LINKFLOW_DIR/scripts/promover_tema.py" --tema "$TEMA" --astro-dir "$CLIENTE_DIR/_astro"

# O motor compartilhado vem com conteúdo de demonstração (os exemplos dos
# 3 temas) — o cliente começa com as coleções vazias. fase2-site-astro
# escreve o conteúdo real depois.
echo "  Limpando conteúdo de demonstração..."
rm -f "$CLIENTE_DIR/_astro/src/content/servicos/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/posts/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/equipe/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/depoimentos/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/autores/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/categorias/"*.md 2>/dev/null || true

# Página temporária enquanto o site não foi buildado
cat > $SITES_DIR/$SLUG/index.html << HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Em breve — $DOMINIO_SITE</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5;}.box{text-align:center;color:#333;}</style></head>
<body><div class="box"><h1>Site em construção</h1><p>Em breve em <strong>$DOMINIO_SITE</strong></p></div></body>
</html>
HTML

# ─── .env do painel para este cliente ────────────────────────────────────────
echo "  Gerando configuração..."
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
PAINEL_API_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

cat > $CLIENTE_DIR/.env << EOF
# LinkFlow — $SLUG
LINKFLOW_SLUG=$SLUG
LINKFLOW_DIR=$CLIENTE_DIR
PORT=$PORTA

NEXTAUTH_URL=https://$DOMINIO_PAINEL
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
PAINEL_API_KEY=$PAINEL_API_KEY

DOMINIO_SITE=$DOMINIO_SITE
DOMINIO_PAINEL=$DOMINIO_PAINEL
EOF
chmod 600 $CLIENTE_DIR/.env

# ─── Build do painel para este cliente ────────────────────────────────────────
echo "  Buildando painel..."
PAINEL_SRC="$LINKFLOW_DIR/painel"

if [ ! -d "$PAINEL_SRC/node_modules" ]; then
  echo "  Instalando dependências do painel..."
  # npm ci: instala exatamente as versões do package-lock.json (build
  # reproduzível; npm install resolveria versões novas a cada cliente)
  cd $PAINEL_SRC && npm ci --silent
fi

# Copiar .env para o diretório do painel durante o build
cp $CLIENTE_DIR/.env $PAINEL_SRC/.env.local.tmp

# Build com variáveis do cliente
cd $PAINEL_SRC
env $(cat $CLIENTE_DIR/.env | grep -v '#' | xargs) npm run build -- --no-lint 2>&1 | tail -5

# Copiar build para pasta do cliente
mkdir -p $CLIENTE_DIR/painel
cp -r $PAINEL_SRC/.next $CLIENTE_DIR/painel/
cp -r $PAINEL_SRC/public $CLIENTE_DIR/painel/
cp $PAINEL_SRC/package.json $CLIENTE_DIR/painel/
cp $PAINEL_SRC/package-lock.json $CLIENTE_DIR/painel/
cp $PAINEL_SRC/next.config.* $CLIENTE_DIR/painel/ 2>/dev/null || true

# Instalar dependências de produção na pasta do cliente
cd $CLIENTE_DIR/painel
# mesmas versões do build (lockfile) — sem ele, o runtime podia rodar uma
# versão do next-auth diferente da que compilou o .next
npm ci --omit=dev --silent

# Limpar .env temporário
rm -f $PAINEL_SRC/.env.local.tmp

# ─── PM2 — processo isolado por cliente ───────────────────────────────────────
echo "  Iniciando PM2..."
pm2 start $CLIENTE_DIR/painel/node_modules/.bin/next \
  --name "painel-$SLUG" \
  --cwd "$CLIENTE_DIR/painel" \
  -- start -p $PORTA \
  --env-file "$CLIENTE_DIR/.env" 2>/dev/null || \
pm2 start "node_modules/.bin/next start -p $PORTA" \
  --name "painel-$SLUG" \
  --cwd "$CLIENTE_DIR/painel" \
  --env "$CLIENTE_DIR/.env"

pm2 save

# ─── Nginx — site do cliente ─────────────────────────────────────────────────
echo "  Configurando Nginx..."
cat > /etc/nginx/sites-available/site-$SLUG << EOF
server {
    listen 80;
    server_name $DOMINIO_SITE www.$DOMINIO_SITE;
    root $SITES_DIR/$SLUG;
    index index.html;

    location / {
        try_files \$uri \$uri/ \$uri.html =404;
    }

    location /midia/ {
        alias $CLIENTE_DIR/midia/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html text/css application/javascript application/json image/svg+xml;
}
EOF

# ─── Nginx — painel do cliente ────────────────────────────────────────────────
cat > /etc/nginx/sites-available/painel-$SLUG << EOF
server {
    listen 80;
    server_name $DOMINIO_PAINEL;

    location / {
        proxy_pass http://localhost:$PORTA;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/site-$SLUG /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/painel-$SLUG /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# ─── SSL ──────────────────────────────────────────────────────────────────────
if [ "$SEM_SSL" != "--sem-ssl" ]; then
  echo "  Gerando SSL..."
  certbot --nginx \
    -d "$DOMINIO_SITE" -d "www.$DOMINIO_SITE" \
    -d "$DOMINIO_PAINEL" \
    --non-interactive --agree-tos \
    -m "ssl@$(echo $DOMINIO_SITE | cut -d. -f2-)" \
    --redirect
fi

# ─── Resumo ───────────────────────────────────────────────────────────────────
echo ""
echo "  ✅ Cliente $SLUG configurado:"
echo "     Site:        http://$DOMINIO_SITE"
echo "     Painel:      http://$DOMINIO_PAINEL"
echo "     Porta:       $PORTA"
echo "     Processo:    painel-$SLUG"
echo "     Dados:       $CLIENTE_DIR/dados/"
echo "     Usuários:    $CLIENTE_DIR/usuarios.json"
echo "     API Key:     $PAINEL_API_KEY"
echo ""
echo "  ⚠️  Salve a API Key acima — necessária para o agente"
