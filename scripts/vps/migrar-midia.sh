#!/bin/bash
# migrar-midia.sh — Copia a mídia da versão ANTERIOR do painel para o lugar novo.
#
# Contexto: a versão antiga do painel gravava as mídias em /var/www/<slug>/midia
# (dentro do site publicado). A versão nova grava em $LINKFLOW_DIR/midia, que é
# /opt/linkflow/clientes/<slug>/midia, e o Nginx serve /midia/ dessa pasta
# (location ^~ /midia/ com alias). Este script leva as mídias antigas para lá.
#
# Garantias:
#   - COPIA, nunca move: a origem NUNCA é apagada (sem --delete, sem rm).
#   - Idempotente: pode rodar quantas vezes quiser; arquivo já existente no destino
#     NÃO é sobrescrito (rsync --ignore-existing / cp -n) e não é contado de novo.
#   - Permissões: dono = o dono da pasta do cliente (quem roda o painel); pastas 755
#     e arquivos 644, para o Nginx conseguir ler.
#   - Mostra quantos arquivos copiou de fato.
#
# Uso (no servidor, como root; é tarefa do agente, não do usuário final):
#   bash migrar-midia.sh <slug> [pasta_origem]
#   Ex.: bash migrar-midia.sh torrez-desentupidora
#        bash migrar-midia.sh torrez-desentupidora /var/www/torrez-desentupidora/midia
#
# Também é chamado automaticamente por migrar-para-multicliente.sh.

set -e

SLUG=${1:?"Erro: informe o slug"}
ORIGEM=${2:-"/var/www/$SLUG/midia"}
CLIENTE_DIR="/opt/linkflow/clientes/$SLUG"
DESTINO="$CLIENTE_DIR/midia"

if [ ! -d "$CLIENTE_DIR" ]; then
  echo "[migrar-midia] Erro: $CLIENTE_DIR não existe (rode o novo-cliente.sh antes)." >&2
  exit 1
fi

if [ ! -d "$ORIGEM" ]; then
  echo "[migrar-midia] Nada a migrar: $ORIGEM não existe."
  echo "MIDIA_COPIADOS=0"
  exit 0
fi

# Origem e destino não podem ser a mesma pasta (evita copiar sobre si mesmo)
if [ "$(readlink -f "$ORIGEM")" = "$(readlink -f "$DESTINO" 2>/dev/null || echo "$DESTINO")" ]; then
  echo "[migrar-midia] Origem e destino são a mesma pasta — nada a fazer."
  echo "MIDIA_COPIADOS=0"
  exit 0
fi

mkdir -p "$DESTINO"
DONO=$(stat -c '%U:%G' "$CLIENTE_DIR")

ANTES=$(find "$DESTINO" -type f | wc -l)
TOTAL_ORIGEM=$(find "$ORIGEM" -type f | wc -l)

if command -v rsync >/dev/null 2>&1; then
  rsync -a --ignore-existing "$ORIGEM"/ "$DESTINO"/
else
  cp -an "$ORIGEM"/. "$DESTINO"/
fi

DEPOIS=$(find "$DESTINO" -type f | wc -l)
COPIADOS=$((DEPOIS - ANTES))

chown -R "$DONO" "$DESTINO"
find "$DESTINO" -type d -exec chmod 755 {} +
find "$DESTINO" -type f -exec chmod 644 {} +
# o Nginx precisa atravessar a pasta do cliente até a mídia
chmod a+x "$CLIENTE_DIR" "$(dirname "$CLIENTE_DIR")" 2>/dev/null || true

echo "[migrar-midia] $SLUG: $TOTAL_ORIGEM arquivo(s) na origem; $COPIADOS copiado(s) agora ($ANTES já estavam no destino)."
echo "[migrar-midia] Origem mantida intacta: $ORIGEM"
echo "MIDIA_COPIADOS=$COPIADOS"
