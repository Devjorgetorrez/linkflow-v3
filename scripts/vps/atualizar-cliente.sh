#!/bin/bash
# atualizar-cliente.sh — Propaga o motor Astro e o painel do repositório de
# referência (/opt/linkflow) para UM cliente já existente, preservando os
# dados e a configuração do cliente. Faz backup antes de qualquer sobrescrita
# e restaura sozinho se alguma etapa falhar.
#
# Corrige a causa raiz do erro 90 (Relatório de Testes 6): o motor e o
# painel do repositório já vêm corrigidos, mas cada cliente é uma cópia
# ISOLADA (arquitetura multi-tenant) — sem este script, a correção nunca
# chega a quem já foi publicado antes dela existir.
#
# Pré-requisito: /opt/linkflow/_astro e /opt/linkflow/painel (a referência
# COMPARTILHADA) já precisam estar atualizados — o mesmo tar+ssh usado para
# subir qualquer correção nova (ver skills/vps-setup, PASSO 3). Este script
# só propaga da referência para o cliente, nunca baixa nada da internet.
#
# Uso: bash atualizar-cliente.sh SLUG

set -e
# pipefail: "comando | tail -N" sem isto só falha se o TAIL falhar, nunca se
# o comando da esquerda (ex.: npm run build) falhar — set -e sozinho nunca
# pegava um build quebrado atras de um pipe (achado real, Verificação 3009
# v2, item 90: build simulado pra falhar foi copiado como se tivesse dado
# certo).
set -o pipefail

SLUG=${1:?"Erro: informe o slug do cliente (ex: torrez-desentupidora)"}
LINKFLOW_DIR="/opt/linkflow"
SITES_DIR="/var/www"
CLIENTE_DIR="$LINKFLOW_DIR/clientes/$SLUG"
BACKUPS_DIR="$LINKFLOW_DIR/backups/$SLUG"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP_ARQ="$BACKUPS_DIR/backup-$TS.tar.gz"

if [ ! -d "$CLIENTE_DIR" ]; then
  echo "Erro: cliente $SLUG não encontrado em $CLIENTE_DIR"
  exit 1
fi
if [ ! -d "$LINKFLOW_DIR/_astro" ] || [ ! -d "$LINKFLOW_DIR/painel" ]; then
  echo "Erro: referência compartilhada ausente em $LINKFLOW_DIR/_astro ou $LINKFLOW_DIR/painel."
  echo "Suba a referência primeiro (mesmo tar+ssh usado pra qualquer correção nova)."
  exit 1
fi

VERSAO_NOVA=$(grep -m1 '"version"' "$LINKFLOW_DIR/painel/package.json" | sed -E 's/.*"version": *"([^"]+)".*/\1/')
VERSAO_ATUAL=$(python3 -c "import json;print(json.load(open('$CLIENTE_DIR/versao.json'))['versao'])" 2>/dev/null || echo "nunca atualizado")
echo "[atualizar-cliente] $SLUG: $VERSAO_ATUAL → $VERSAO_NOVA"

# ─── Backup — antes de tocar em qualquer arquivo ───────────────────────────
# node_modules/dist/.astro ficam de fora: são gerados de novo no build, só
# aumentariam o backup sem servir pra restaurar nada.
mkdir -p "$BACKUPS_DIR"
echo "  Fazendo backup..."
tar -czf "$BACKUP_ARQ" \
  --exclude="$SLUG/painel/node_modules" \
  --exclude="$SLUG/_astro/node_modules" \
  --exclude="$SLUG/_astro/.astro" \
  --exclude="$SLUG/_astro/dist" \
  -C "$LINKFLOW_DIR/clientes" "$SLUG"
echo "  Backup salvo em $BACKUP_ARQ"

restaurado=0
restaurar_backup() {
  if [ "$restaurado" = "1" ]; then return; fi
  restaurado=1
  echo "  ERRO na atualização — restaurando o backup, nada fica pela metade."
  rm -rf "$CLIENTE_DIR/_astro" "$CLIENTE_DIR/_astro.novo" "$CLIENTE_DIR/painel"
  tar -xzf "$BACKUP_ARQ" -C "$LINKFLOW_DIR/clientes"
  echo "  Backup restaurado. Cliente $SLUG voltou ao estado de antes desta tentativa."
  echo "  O painel pode precisar de 'npm ci' antes de rodar de novo (node_modules não entra no backup)."
}
trap restaurar_backup ERR

# ─── Tema em uso — promover_tema.py grava isso na criação do cliente ───────
TEMA=$(python3 -c "import json;print(json.load(open('$CLIENTE_DIR/_astro/tema-ativo.json'))['tema'])" 2>/dev/null || echo "")
if [ -z "$TEMA" ]; then
  echo "Erro: não encontrei _astro/tema-ativo.json em $CLIENTE_DIR — não sei qual tema re-promover."
  exit 1
fi
echo "  Tema: $TEMA"

# ─── Motor: cópia fresca da referência, promove o MESMO tema, e devolve o
# conteúdo/config reais do cliente por cima (a referência só tem demonstração) ──
echo "  Atualizando motor Astro..."
NOVO_ASTRO="$CLIENTE_DIR/_astro.novo"
rm -rf "$NOVO_ASTRO"
cp -r "$LINKFLOW_DIR/_astro" "$NOVO_ASTRO"
python3 "$LINKFLOW_DIR/scripts/promover_tema.py" --tema "$TEMA" --astro-dir "$NOVO_ASTRO"

rm -rf "$NOVO_ASTRO/src/content"
cp -r "$CLIENTE_DIR/_astro/src/content" "$NOVO_ASTRO/src/content"
cp "$CLIENTE_DIR/_astro/src/config/site.ts" "$NOVO_ASTRO/src/config/site.ts"

rm -rf "$CLIENTE_DIR/_astro"
mv "$NOVO_ASTRO" "$CLIENTE_DIR/_astro"

# ─── Build do motor — limpa o cache antes (erro 87: sem isso, conteúdo
# apagado pelo painel pode voltar ao ar) ────────────────────────────────────
cd "$CLIENTE_DIR/_astro"
rm -rf .astro node_modules/.astro dist
npm ci --silent
npm run build 2>&1 | tail -20
if [ ! -f "dist/index.html" ]; then
  echo "Erro: build do motor não gerou dist/index.html — nada foi publicado para $SLUG."
  exit 1
fi
mkdir -p "$SITES_DIR/$SLUG"
# Sem --delete: nunca toca em /midia (fica fora do dist, servido por alias no Nginx).
cp -r dist/. "$SITES_DIR/$SLUG/"

# ─── Painel: código fresco da referência, mantém .env e dados do cliente ───
echo "  Atualizando painel..."
PAINEL_SRC="$LINKFLOW_DIR/painel"
if [ ! -d "$PAINEL_SRC/node_modules" ]; then
  echo "  Instalando dependências do painel..."
  cd "$PAINEL_SRC" && npm ci --silent
fi
cd "$PAINEL_SRC"
# $PAINEL_SRC é a referência compartilhada — apaga o .next antes pra um
# BUILD_ID de um cliente anterior nunca ser confundido com sucesso deste
# build (mesma causa do item 93, Verificação 3009 v2).
rm -rf .next
env $(cat "$CLIENTE_DIR/.env" | grep -v '#' | xargs) npm run build 2>&1 | tail -20
if [ ! -f "$PAINEL_SRC/.next/BUILD_ID" ]; then
  echo "Erro: build do painel não gerou .next/BUILD_ID — nada foi publicado para $SLUG."
  exit 1
fi

rm -rf "$CLIENTE_DIR/painel/.next" "$CLIENTE_DIR/painel/public"
cp -r "$PAINEL_SRC/.next" "$CLIENTE_DIR/painel/"
cp -r "$PAINEL_SRC/public" "$CLIENTE_DIR/painel/"
cp "$PAINEL_SRC/package.json" "$CLIENTE_DIR/painel/"
cp "$PAINEL_SRC/package-lock.json" "$CLIENTE_DIR/painel/"
cp "$PAINEL_SRC"/next.config.* "$CLIENTE_DIR/painel/" 2>/dev/null || true

cd "$CLIENTE_DIR/painel"
npm ci --omit=dev --silent

# ─── Reiniciar o painel só agora — depois de tudo pronto ───────────────────
pm2 restart "painel-$SLUG"

# ─── Registrar a versão — é o que permite auditar quem está desatualizado ──
cat > "$CLIENTE_DIR/versao.json" << JSON
{"versao": "$VERSAO_NOVA", "atualizado_em": "$(date -Iseconds)"}
JSON

trap - ERR
echo ""
echo "  ✅ $SLUG atualizado: $VERSAO_ATUAL → $VERSAO_NOVA"
echo "     Backup:  $BACKUP_ARQ"
echo "     Versão:  $CLIENTE_DIR/versao.json"
