#!/bin/bash
# checar-capacidade.sh — Verifica se a VPS tem capacidade para mais um cliente
#
# Uso: bash checar-capacidade.sh
# Retorna: OK ou ALERTA com recomendação de upgrade

RAM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
RAM_USADA=$(free -m | awk '/^Mem:/{print $3}')
RAM_LIVRE=$((RAM_TOTAL - RAM_USADA))
RAM_PORCENTO=$((RAM_USADA * 100 / RAM_TOTAL))

DISCO_TOTAL=$(df -BG / | awk 'NR==2{print $2}' | tr -d 'G')
DISCO_USADO=$(df -BG / | awk 'NR==2{print $3}' | tr -d 'G')
DISCO_LIVRE=$((DISCO_TOTAL - DISCO_USADO))

CLIENTES=$(pm2 list 2>/dev/null | grep -c "painel-" || echo 0)

echo "========================================="
echo "  LinkFlow — Capacidade da VPS"
echo "========================================="
echo ""
echo "  RAM Total:    ${RAM_TOTAL}MB"
echo "  RAM em uso:   ${RAM_USADA}MB (${RAM_PORCENTO}%)"
echo "  RAM livre:    ${RAM_LIVRE}MB"
echo ""
echo "  Disco total:  ${DISCO_TOTAL}GB"
echo "  Disco livre:  ${DISCO_LIVRE}GB"
echo ""
echo "  Clientes ativos: $CLIENTES"
echo ""

# ─── Diagnóstico ─────────────────────────────────────────────────────────────
RAM_POR_CLIENTE=200  # MB por processo Next.js
RAM_NECESSARIA=$((RAM_POR_CLIENTE + 200))  # +200MB de margem

if [ $RAM_LIVRE -lt $RAM_NECESSARIA ]; then
  echo "  ❌ RAM INSUFICIENTE para novo cliente"
  echo "     Necessário: ${RAM_NECESSARIA}MB livres"
  echo "     Disponível: ${RAM_LIVRE}MB"
  echo ""
  if [ $RAM_TOTAL -lt 2048 ]; then
    echo "  → Upgrade recomendado: 2GB RAM (Perfil Solo)"
  elif [ $RAM_TOTAL -lt 4096 ]; then
    echo "  → Upgrade recomendado: 4GB RAM (Perfil Agência Pequena — até 5 clientes)"
  elif [ $RAM_TOTAL -lt 8192 ]; then
    echo "  → Upgrade recomendado: 8GB RAM (Perfil Agência Média — até 15 clientes)"
  else
    echo "  → Upgrade recomendado: 16GB RAM (Perfil Agência Grande — até 30 clientes)"
  fi
  exit 1
elif [ $DISCO_LIVRE -lt 5 ]; then
  echo "  ❌ DISCO INSUFICIENTE para novo cliente"
  echo "     Necessário: 5GB livres mínimo"
  echo "     Disponível: ${DISCO_LIVRE}GB"
  exit 1
else
  RAM_PARA_CLIENTES=$((RAM_LIVRE / RAM_POR_CLIENTE))
  echo "  ✅ VPS com capacidade para mais ~$RAM_PARA_CLIENTES cliente(s)"
  echo ""
  # Recomendação de perfil
  if [ $RAM_TOTAL -lt 2048 ]; then
    echo "  📋 Perfil atual: Solo (até 1 cliente)"
  elif [ $RAM_TOTAL -lt 4096 ]; then
    echo "  📋 Perfil atual: Agência Pequena (até 5 clientes)"
  elif [ $RAM_TOTAL -lt 8192 ]; then
    echo "  📋 Perfil atual: Agência Média (até 15 clientes)"
  else
    echo "  📋 Perfil atual: Agência Grande (até 30 clientes)"
  fi
  exit 0
fi
