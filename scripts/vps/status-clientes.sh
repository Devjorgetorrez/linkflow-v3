#!/bin/bash
# status-clientes.sh — Lista todo cliente do VPS com a versão registrada
# (versao.json, gravado por atualizar-cliente.sh) contra a versão atual da
# referência compartilhada, e avisa quem está desatualizado.
#
# Existe pra responder, sem adivinhar, a pergunta do erro 90 (Relatório de
# Testes 6): "quais clientes já publicados ainda não receberam a última
# correção?" — antes disso só dava pra descobrir testando cada site à mão.
#
# Uso: bash status-clientes.sh

LINKFLOW_DIR="/opt/linkflow"
VERSAO_REF=$(grep -m1 '"version"' "$LINKFLOW_DIR/painel/package.json" | sed -E 's/.*"version": *"([^"]+)".*/\1/')

echo "Referência compartilhada: $VERSAO_REF"
echo ""
printf "%-30s %-12s %-20s %s\n" "CLIENTE" "VERSAO" "ATUALIZADO EM" "STATUS"
printf "%-30s %-12s %-20s %s\n" "-------" "------" "-------------" "------"

for dir in "$LINKFLOW_DIR"/clientes/*/; do
  slug=$(basename "$dir")
  [ -d "$dir/_astro" ] || continue   # pula pastas que não são cliente astro

  if [ -f "$dir/versao.json" ]; then
    versao=$(python3 -c "import json;d=json.load(open('$dir/versao.json'));print(d['versao'])" 2>/dev/null || echo "?")
    quando=$(python3 -c "import json;d=json.load(open('$dir/versao.json'));print(d['atualizado_em'][:16].replace('T',' '))" 2>/dev/null || echo "?")
  else
    versao="nunca"
    quando="-"
  fi

  if [ "$versao" = "$VERSAO_REF" ]; then
    status="✅ em dia"
  else
    status="⚠️  desatualizado"
  fi
  printf "%-30s %-12s %-20s %s\n" "$slug" "$versao" "$quando" "$status"
done

echo ""
echo "Atualizar um cliente desatualizado:"
echo "  bash atualizar-cliente.sh <slug>"
