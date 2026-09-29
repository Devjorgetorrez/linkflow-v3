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
# Caminho absoluto da própria pasta, resolvido ANTES de qualquer `cd` do script (o build do
# painel troca de diretório mais abaixo) — "$(dirname "$0")" relativo quebraria a chamada do
# ssl-cliente.sh depois desses `cd`, porque passaria a resolver contra o cwd errado.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
env $(cat $CLIENTE_DIR/.env | grep -v '#' | xargs) npm run build 2>&1 | tail -5

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
# O Next.js carrega .env.production.local sozinho, do cwd do processo — sem
# precisar de flag nenhuma. (`next start --env-file` NÃO existe nesta versão do
# Next — dá "unknown option" e derruba o processo; `pm2 start --env <arquivo>`
# também está errado, o --env do PM2 é o NOME de um ambiente de ecosystem file,
# não um caminho. As duas formas antigas falhavam sempre e em silêncio, porque
# `pm2 start` retorna sucesso mesmo que o processo caia logo depois de subir.)
echo "  Iniciando PM2..."
cp "$CLIENTE_DIR/.env" "$CLIENTE_DIR/painel/.env.production.local"
chmod 600 "$CLIENTE_DIR/painel/.env.production.local"
pm2 start "$CLIENTE_DIR/painel/node_modules/.bin/next" \
  --name "painel-$SLUG" \
  --cwd "$CLIENTE_DIR/painel" \
  -- start -p $PORTA

pm2 save

# ─── Nginx — site do cliente ─────────────────────────────────────────────────
# www e sem-www são hosts DIFERENTES para o Nginx — um bloco único
# respondendo pelos dois com o mesmo root serve o mesmo conteúdo duas
# vezes (mesmo robots.txt em dois hosts, nenhum redirecionamento entre
# eles). Achado real (Relatório de Testes 4, erro 53): o Google via dois
# sites duplicados em vez de um canônico com o outro redirecionando.
# www vira só um redirect 301 pro host sem-www, que é o único servido de
# verdade.
echo "  Configurando Nginx..."
cat > /etc/nginx/sites-available/site-$SLUG << EOF
server {
    listen 80;
    server_name www.$DOMINIO_SITE;
    # \$scheme (não "https" fixo): o SSL só existe depois que ssl-cliente.sh
    # roda, mais adiante neste fluxo — um redirect pra https aqui quebraria
    # o site na janela entre este passo e o certificado. Uma vez com SSL, o
    # certbot --redirect (rodado com este mesmo host na lista de domínios)
    # cuida de http->https; este bloco só cuida de www->sem-www.
    return 301 \$scheme://$DOMINIO_SITE\$request_uri;
}

server {
    listen 80;
    server_name $DOMINIO_SITE;
    root $SITES_DIR/$SLUG;
    index index.html;

    location / {
        try_files \$uri \$uri/ \$uri.html =404;
        # HTML é regerado a cada build — sem Cache-Control, navegador e
        # proxy intermediário ficavam livres pra guardar a versão antiga
        # por tempo indefinido (achado real, erro 61: "editei e não
        # mudou"). no-cache = sempre revalida com o servidor antes de
        # reusar (ainda usa cache condicional via ETag, não é no-store).
        add_header Cache-Control "no-cache" always;
    }

    # Mídia enviada pelo painel (fora do root do site: o deploy do site nunca a apaga).
    # ^~ = prefixo que IMPEDE a location regex de imagens abaixo de capturar /midia/
    # (sem ^~, uma regex vence o prefixo simples e a imagem cairia no root = 404).
    # if + return dentro da location é o uso seguro de "if" (não mistura com outras
    # diretivas); alias com prefixo termina em / dos dois lados. Os arquivos .meta.json
    # (metadados do painel) e qualquer nome oculto (começa com ponto) dão 404.
    location ^~ /midia/ {
        alias $CLIENTE_DIR/midia/;
        autoindex off;
        if (\$uri ~* "(^|/)\.|\.meta\.json\$") {
            return 404;
        }
        # Cache de 1 dia, SEM immutable: o painel permite substituir uma mídia mantendo o
        # endereço, e o navegador precisa revalidar. Sem try_files: com alias ele usa o URI
        # original (bug conhecido) e quebraria o arquivo; arquivo ausente já dá 404 sozinho.
        add_header Cache-Control "public, max-age=86400" always;
        add_header X-Content-Type-Options "nosniff" always;
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

    # Uploads do painel: imagens até 5 MB, PDF/vídeo até 10 MB (+ margem do multipart).
    client_max_body_size 12m;

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
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
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
  SAIDA_SSL=$(bash "$SCRIPT_DIR/ssl-cliente.sh" "$SLUG" "$DOMINIO_SITE" "$DOMINIO_PAINEL" 2>&1) || true
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
