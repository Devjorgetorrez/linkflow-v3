#!/bin/bash
# novo-cliente.sh — Adiciona um novo cliente ao VPS LinkFlow
#
# Cria estrutura isolada, configura Nginx, gera SSL, builda painel e inicia PM2.
# Cada cliente tem: pasta própria, porta própria, processo PM2 próprio,
# motor Astro isolado com só UM layout (nunca aparece na URL do cliente).
#
# Uso: bash novo-cliente.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [TEMA] [--sem-ssl]
# TEMA: base | tema-03 | tema-04 | tema-05 | tema-06 | tema-07
# Ex:  bash novo-cliente.sh luis-oficina luisoficinamecanica.com.br painel.luisoficinamecanica.com.br tema-04

set -e

SLUG=${1:?"Erro: informe o slug (ex: luis-oficina)"}
DOMINIO_SITE=${2:?"Erro: informe o domínio do site (ex: luisoficinamecanica.com.br)"}
DOMINIO_PAINEL=${3:?"Erro: informe o domínio do painel (ex: painel.luisoficinamecanica.com.br)"}
TEMA=${4:?"Erro: informe o tema (base | tema-03 | tema-04 | tema-05 | tema-06 | tema-07)"}
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

# ─── Não sobrepor domínio de outro site já servido pelo Nginx ────────────────
for d in "$DOMINIO_SITE" "www.$DOMINIO_SITE" "$DOMINIO_PAINEL"; do
  dono=$(grep -RlsE "server_name[^;]*[[:space:]]${d//./\\.}([[:space:];])" \
           /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null \
         | grep -v -e "/site-$SLUG\$" -e "/painel-$SLUG\$" | head -1 || true)
  if [ -n "$dono" ]; then
    echo "Erro: o domínio $d já é servido por outra configuração do Nginx ($dono)."
    echo "Nada foi alterado. Confira o domínio informado antes de continuar."
    exit 1
  fi
done

# ─── Porta única para este cliente ────────────────────────────────────────────
# A tabela do `pm2 list` não mostra porta, então a porta é descoberta pelo
# que está de fato escutando na máquina (qualquer processo, LinkFlow ou não)
# e pelo PORT= dos .env dos outros clientes (processo pode estar parado).
PORTA_BASE=3210
PORTA_TETO=3299
ESCUTANDO=$(ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null || true)
if [ -z "$ESCUTANDO" ]; then
  echo "Erro: não consegui listar as portas em uso (ss/netstat ausentes)."
  echo "Nada foi alterado. Instale iproute2 ou net-tools e rode de novo."
  exit 1
fi

porta_em_uso() {
  echo "$ESCUTANDO" | awk '{print $4}' | grep -Eq "[:.]$1\$" && return 0
  grep -qsE "^PORT=$1\$" "$LINKFLOW_DIR"/clientes/*/.env && return 0
  return 1
}

PORTA=$PORTA_BASE
while porta_em_uso $PORTA; do
  PORTA=$((PORTA + 1))
  if [ $PORTA -gt $PORTA_TETO ]; then
    echo "Erro: nenhuma porta livre entre $PORTA_BASE e $PORTA_TETO."
    exit 1
  fi
done

echo "  Porta do painel: $PORTA (livre)"

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
# Copia o motor compartilhado inteiro (todos os layouts lado a lado, igual ao
# repositório de referência) e promove só o layout escolhido pra raiz — os
# outros somem por completo. Isso garante a regra de que a escolha
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
# layouts) — o cliente começa com as coleções vazias. fase2-site-astro
# escreve o conteúdo real depois.
echo "  Limpando conteúdo de demonstração..."
rm -f "$CLIENTE_DIR/_astro/src/content/servicos/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/posts/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/equipe/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/depoimentos/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/autores/"*.md 2>/dev/null || true
rm -f "$CLIENTE_DIR/_astro/src/content/categorias/"*.md 2>/dev/null || true

# painelUrl: destino do formulário de contato do site (POST <painelUrl>/api/submissao).
# Preenchido aqui com o domínio do painel que ESTE script acabou de configurar.
# Só a linha do campo é alterada (sed restrito); se o config não tiver o campo,
# ele entra logo abaixo de `dominio:`. O DOMINIO_PAINEL é validado antes (sem
# caracteres que quebrem o sed). O motor local do cliente recebe o mesmo valor
# na ETAPA 6.2 da fase2-site-astro; aqui cobre o config da cópia do servidor.
SITE_TS="$CLIENTE_DIR/_astro/src/config/site.ts"
if [[ ! "$DOMINIO_PAINEL" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "Erro: domínio do painel inválido para o config do site: $DOMINIO_PAINEL"
  exit 1
fi
if [ -f "$SITE_TS" ]; then
  if grep -qE "^[[:space:]]*painelUrl[[:space:]]*:[[:space:]]*['\"]" "$SITE_TS"; then
    sed -i -E "s|^([[:space:]]*painelUrl[[:space:]]*:[[:space:]]*)['\"][^'\"]*['\"]|\1'https://$DOMINIO_PAINEL'|" "$SITE_TS"
  else
    sed -i -E "0,/^[[:space:]]*dominio[[:space:]]*:.*/s||&\n  painelUrl: 'https://$DOMINIO_PAINEL',|" "$SITE_TS"
  fi
  if grep -qE "^[[:space:]]*painelUrl[[:space:]]*:[[:space:]]*'https://$DOMINIO_PAINEL'," "$SITE_TS"; then
    echo "  painelUrl do site → https://$DOMINIO_PAINEL"
  else
    echo "  ⚠️  Não consegui gravar painelUrl no config do site — o formulário de contato não vai enviar até isso ser corrigido"
  fi
else
  echo "  ⚠️  config/site.ts não encontrado em $CLIENTE_DIR/_astro — painelUrl não gravado"
fi

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
# Só pede certificado para os nomes que já apontam para este servidor
# (ssl-cliente.sh confere o DNS). Se o DNS ainda não propagou, o cliente
# fica pronto sem SSL e o SSL é gerado depois, sem derrubar nada.
SSL_STATUS="não solicitado (--sem-ssl)"
if [ "$SEM_SSL" != "--sem-ssl" ]; then
  echo "  Conferindo DNS e gerando SSL..."
  SAIDA_SSL=$(bash "$(dirname "$0")/ssl-cliente.sh" "$SLUG" "$DOMINIO_SITE" "$DOMINIO_PAINEL" 2>&1) || true
  echo "$SAIDA_SSL" | sed 's/^/    /'
  SSL_STATUS=$(echo "$SAIDA_SSL" | grep '^SSL_STATUS=' | tail -1 | cut -d= -f2-)
  SSL_STATUS=${SSL_STATUS:-"falhou (ver saída acima)"}
fi

# ─── Resumo ───────────────────────────────────────────────────────────────────
echo ""
echo "  ✅ Cliente $SLUG configurado:"
echo "     Site:        http://$DOMINIO_SITE"
echo "     Painel:      http://$DOMINIO_PAINEL"
echo "     Porta:       $PORTA"
echo "     Processo:    painel-$SLUG"
echo "     SSL:         $SSL_STATUS"
echo "     Dados:       $CLIENTE_DIR/dados/"
echo "     Usuários:    $CLIENTE_DIR/usuarios.json"
echo "     API Key:     $PAINEL_API_KEY"
echo ""
echo "  ⚠️  Salve a API Key acima — necessária para o agente"
