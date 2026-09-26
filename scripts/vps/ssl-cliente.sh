#!/bin/bash
# ssl-cliente.sh — Gera SSL de um cliente, só para os nomes que já apontam
# para ESTE servidor.
#
# Por que existe: pedir certificado para um domínio cujo DNS ainda não aponta
# para o servidor sempre falha, e a falha derrubava o instalador inteiro. Aqui
# a checagem vem antes e um DNS pendente não é erro: é um estado.
#
# Uso: bash ssl-cliente.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [EMAIL]
#   EMAIL é opcional. Sem ele, o certificado é emitido sem e-mail de contato
#   (o e-mail nunca é inventado a partir do domínio).
#
# A última linha da saída é sempre SSL_STATUS=<ok|parcial|pendente|falhou>.
# Código de saída: 0 em ok/parcial/pendente, 1 só se o certbot falhar de fato.

set -u

SLUG=${1:?"Erro: informe o slug"}
DOMINIO_SITE=${2:?"Erro: informe o domínio do site"}
DOMINIO_PAINEL=${3:?"Erro: informe o domínio do painel"}
EMAIL=${4:-""}

IP_SERVIDOR=$(curl -4 -fsS --max-time 8 https://api.ipify.org 2>/dev/null || true)
if [ -z "$IP_SERVIDOR" ]; then
  echo "Não consegui descobrir o IP público deste servidor, então não dá para conferir o DNS."
  echo "SSL_STATUS=pendente"
  exit 0
fi

resolve() { getent ahostsv4 "$1" 2>/dev/null | awk '{print $1; exit}'; }

DOMINIOS=()
PENDENTES=()
for d in "$DOMINIO_SITE" "www.$DOMINIO_SITE" "$DOMINIO_PAINEL"; do
  ip=$(resolve "$d")
  if [ "$ip" = "$IP_SERVIDOR" ]; then
    DOMINIOS+=("$d")
  else
    PENDENTES+=("$d (aponta para: ${ip:-nenhum registro})")
  fi
done

if [ ${#DOMINIOS[@]} -eq 0 ]; then
  echo "Nenhum dos endereços aponta para este servidor ($IP_SERVIDOR) ainda:"
  printf '  - %s\n' "${PENDENTES[@]}"
  echo "SSL_STATUS=pendente"
  exit 0
fi

ARGS=()
for d in "${DOMINIOS[@]}"; do ARGS+=(-d "$d"); done

if [ -n "$EMAIL" ]; then
  ARGS+=(-m "$EMAIL")
else
  ARGS+=(--register-unsafely-without-email)
fi

if certbot --nginx "${ARGS[@]}" --non-interactive --agree-tos --redirect; then
  if [ ${#PENDENTES[@]} -eq 0 ]; then
    echo "SSL_STATUS=ok"
  else
    echo "Ainda sem DNS apontando para este servidor:"
    printf '  - %s\n' "${PENDENTES[@]}"
    echo "SSL_STATUS=parcial"
  fi
  exit 0
fi

echo "SSL_STATUS=falhou"
exit 1
