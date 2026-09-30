#!/bin/bash
# remover-cliente.sh — Remove um cliente do VPS LinkFlow por completo:
# processo PM2, configuração Nginx (site + painel), certificado SSL,
# pasta isolada do cliente e o site publicado.
#
# Não existia (erro 105, Relatório de Testes 6) — feito à mão duas vezes,
# risco real de esquecer um pedaço (processo PM2 órfão, Nginx apontando
# pra pasta que não existe mais, certificado SSL não renovado sozinho
# ficando pra trás).
#
# Uso: bash remover-cliente.sh SLUG --confirmar
# Sem --confirmar, só mostra o que SERIA removido (dry-run) — nada é apagado.

set -e

SLUG=${1:?"Erro: informe o slug do cliente a remover"}
CONFIRMAR=${2:-""}

LINKFLOW_DIR="/opt/linkflow"
SITES_DIR="/var/www"
CLIENTE_DIR="$LINKFLOW_DIR/clientes/$SLUG"
BACKUPS_DIR="$LINKFLOW_DIR/backups/$SLUG"
TS=$(date +%Y%m%d-%H%M%S)

if [ ! -d "$CLIENTE_DIR" ]; then
  echo "Erro: cliente $SLUG não encontrado em $CLIENTE_DIR — nada a remover."
  exit 1
fi

echo "[remover-cliente] Isto vai remover PERMANENTEMENTE:"
echo "  - Processo PM2:        painel-$SLUG"
echo "  - Nginx:                /etc/nginx/sites-available/site-$SLUG e painel-$SLUG (+ links)"
echo "  - Certificado SSL:      qualquer certbot para os domínios deste cliente"
echo "  - Pasta do cliente:     $CLIENTE_DIR (painel, motor, dados, mídia)"
echo "  - Site publicado:       $SITES_DIR/$SLUG"
echo ""

if [ "$CONFIRMAR" != "--confirmar" ]; then
  echo "Modo consulta (dry-run) — nada foi removido."
  echo "Pra remover de verdade: bash remover-cliente.sh $SLUG --confirmar"
  exit 0
fi

# ─── Backup antes de apagar qualquer coisa — mesma cautela do
# atualizar-cliente.sh. Guardado fora de clientes/, então some junto com o
# cliente só se alguém apagar backups/ também, de proposito. ────────────────
mkdir -p "$BACKUPS_DIR"
BACKUP_ARQ="$BACKUPS_DIR/antes-de-remover-$TS.tar.gz"
echo "  Fazendo backup final em $BACKUP_ARQ..."
tar -czf "$BACKUP_ARQ" -C "$LINKFLOW_DIR/clientes" "$SLUG" \
  --exclude="$SLUG/painel/node_modules" \
  --exclude="$SLUG/_astro/node_modules" \
  --exclude="$SLUG/_astro/.astro" \
  --exclude="$SLUG/_astro/dist" \
  2>/dev/null || echo "  Aviso: backup parcial ou vazio (cliente pode não ter _astro/painel completos)."

# ─── PM2 ──────────────────────────────────────────────────────────────────
echo "  Parando processo PM2..."
pm2 delete "painel-$SLUG" 2>/dev/null || echo "  (processo painel-$SLUG já não existia no PM2)"
pm2 save

# ─── SSL — antes do Nginx, porque certbot precisa do bloco do site pra achar
# os domínios corretamente em alguns casos; se falhar, segue (não bloqueia
# o resto da remoção, só avisa) ─────────────────────────────────────────────
echo "  Removendo certificado SSL (se houver)..."
DOMINIOS_CERT=$(certbot certificates 2>/dev/null | grep -B2 "/etc/letsencrypt/live/" | grep "Certificate Name:" | awk '{print $3}' | grep -i "$SLUG" || true)
for cert in $DOMINIOS_CERT; do
  certbot delete --cert-name "$cert" --non-interactive 2>/dev/null || echo "  Aviso: não consegui remover o certificado $cert automaticamente."
done

# ─── Nginx ────────────────────────────────────────────────────────────────
echo "  Removendo configuração do Nginx..."
rm -f "/etc/nginx/sites-enabled/site-$SLUG" "/etc/nginx/sites-enabled/painel-$SLUG"
rm -f "/etc/nginx/sites-available/site-$SLUG" "/etc/nginx/sites-available/painel-$SLUG"
nginx -t && systemctl reload nginx

# ─── Pastas ───────────────────────────────────────────────────────────────
echo "  Removendo pasta do cliente e site publicado..."
rm -rf "$CLIENTE_DIR"
rm -rf "$SITES_DIR/$SLUG"

echo ""
echo "  ✅ Cliente $SLUG removido."
echo "     Backup final salvo em: $BACKUP_ARQ"
echo "     Lembrete: remover também o registro DNS do domínio no registrador,"
echo "     se o cliente não for reaproveitar o mesmo domínio depois."
