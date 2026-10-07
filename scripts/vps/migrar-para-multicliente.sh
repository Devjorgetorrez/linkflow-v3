#!/bin/bash
# migrar-para-multicliente.sh — Migra instalação monocliente para multi-cliente
#
# Converte a estrutura antiga (/opt/linkflow-teste) para a nova
# (/opt/linkflow/clientes/[slug])
#
# Uso: bash migrar-para-multicliente.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [DIR_ANTIGO]
# Ex:  bash migrar-para-multicliente.sh torrez-desentupidora torrezdesentupidora.com.br painel.torrezdesentupidora.com.br /opt/linkflow-teste

set -e

SLUG=${1:?"Erro: informe o slug"}
DOMINIO_SITE=${2:?"Erro: informe o domínio do site"}
DOMINIO_PAINEL=${3:?"Erro: informe o domínio do painel"}
DIR_ANTIGO=${4:-"/opt/linkflow-teste"}

LINKFLOW_DIR="/opt/linkflow"
CLIENTE_DIR="$LINKFLOW_DIR/clientes/$SLUG"

echo "[migrar] Migrando $DIR_ANTIGO → $CLIENTE_DIR"

# ─── Criar estrutura nova ──────────────────────────────────────────────────────
mkdir -p $LINKFLOW_DIR/{clientes,_astro,skills,scripts,projetos}
mkdir -p $CLIENTE_DIR/{dados,midia}

# ─── Migrar dados ─────────────────────────────────────────────────────────────
echo "  Migrando dados..."

# usuarios.json — do formato antigo (plano) para o novo (aninhado)
# O arquivo novo já foi criado na nova estrutura pelas sprints anteriores
if [ -f "$DIR_ANTIGO/painel/usuarios.json" ]; then
  cp "$DIR_ANTIGO/painel/usuarios.json" "$CLIENTE_DIR/usuarios.json"
  echo "  ✅ usuarios.json migrado"
fi

# Dados JSON (leads, formularios, tarefas, redirects)
for arquivo in leads.json formularios.json tarefas.json redirects.json; do
  if [ -f "$DIR_ANTIGO/dados/$arquivo" ]; then
    cp "$DIR_ANTIGO/dados/$arquivo" "$CLIENTE_DIR/dados/$arquivo"
    echo "  ✅ dados/$arquivo migrado"
  else
    echo "[]" > "$CLIENTE_DIR/dados/$arquivo"
  fi
done

# Conteúdo Astro
if [ -d "$DIR_ANTIGO/_astro/src/content/$SLUG" ]; then
  mkdir -p "$CLIENTE_DIR/_astro/src/content"
  cp -r "$DIR_ANTIGO/_astro/src/content/$SLUG" "$CLIENTE_DIR/_astro/src/content/"
  echo "  ✅ conteúdo Astro migrado"
fi

if [ -d "$DIR_ANTIGO/_astro/src/config" ]; then
  mkdir -p "$CLIENTE_DIR/_astro/src/config"
  cp "$DIR_ANTIGO/_astro/src/config/$SLUG.ts" "$CLIENTE_DIR/_astro/src/config/" 2>/dev/null || true
  echo "  ✅ config Astro migrado"
fi

# Mídia da versão anterior do painel (/var/www/<slug>/midia) -> $CLIENTE_DIR/midia.
# Só COPIA (a origem nunca é apagada) e é idempotente. Ver migrar-midia.sh.
bash "$(dirname "$0")/migrar-midia.sh" "$SLUG" || echo "  ⚠️  migração de mídia falhou — rode migrar-midia.sh $SLUG manualmente"

# Copiar skills e scripts para a raiz nova
if [ -d "$DIR_ANTIGO/skills" ]; then
  cp -r "$DIR_ANTIGO/skills" "$LINKFLOW_DIR/"
  echo "  ✅ skills migradas"
fi

if [ -d "$DIR_ANTIGO/scripts" ]; then
  cp -r "$DIR_ANTIGO/scripts" "$LINKFLOW_DIR/"
  echo "  ✅ scripts migrados"
fi

# Copiar painel (código-fonte) para a raiz nova
if [ -d "$DIR_ANTIGO/painel" ]; then
  cp -r "$DIR_ANTIGO/painel" "$LINKFLOW_DIR/"
  echo "  ✅ painel migrado"
fi

# Copiar motor Astro para a raiz nova
if [ -d "$DIR_ANTIGO/_astro" ]; then
  cp -r "$DIR_ANTIGO/_astro" "$LINKFLOW_DIR/"
  echo "  ✅ motor Astro migrado"
fi

# ─── Parar processo PM2 antigo ─────────────────────────────────────────────────
echo "  Parando processo PM2 antigo..."
# Só mexe no processo "painel" se ele realmente pertence à instalação antiga
# (o mesmo nome pode existir em outro cliente deste servidor).
PAINEL_ANTIGO=$(pm2 jlist 2>/dev/null | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    lista = json.loads(raw[raw.index("["):])
except Exception:
    lista = []
antigo = sys.argv[1]
print(any(p.get("name") == "painel" and str(p.get("pm2_env", {}).get("pm_cwd", "")).startswith(antigo) for p in lista))
' "$DIR_ANTIGO")
if [ "$PAINEL_ANTIGO" = "True" ]; then
  pm2 stop painel 2>/dev/null || true
  pm2 delete painel 2>/dev/null || true
else
  echo "  Nenhum processo 'painel' da instalação antiga ($DIR_ANTIGO) encontrado — nada foi parado."
fi

# ─── Configurar cliente na nova estrutura ─────────────────────────────────────
echo "  Configurando cliente na nova estrutura..."
# Reusar API key e secret existentes se disponíveis
NEXTAUTH_SECRET=$(grep NEXTAUTH_SECRET "$DIR_ANTIGO/painel/.env.local" 2>/dev/null | cut -d= -f2 || openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
PAINEL_API_KEY=$(grep PAINEL_API_KEY "$DIR_ANTIGO/painel/.env.local" 2>/dev/null | cut -d= -f2 || openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

# Descobrir a porta do processo antigo
# (a tabela do pm2 não mostra porta — lê do .env da instalação antiga)
PORTA=$(grep -E '^PORT=' "$DIR_ANTIGO/painel/.env.local" 2>/dev/null | cut -d= -f2 | head -1)
PORTA=${PORTA:-3210}

cat > "$CLIENTE_DIR/.env" << EOF
# LinkFlow — $SLUG (migrado)
LINKFLOW_SLUG=$SLUG
LINKFLOW_DIR=$CLIENTE_DIR
PORT=$PORTA

NEXTAUTH_URL=https://$DOMINIO_PAINEL
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
PAINEL_API_KEY=$PAINEL_API_KEY

DOMINIO_SITE=$DOMINIO_SITE
DOMINIO_PAINEL=$DOMINIO_PAINEL
EOF
chmod 600 "$CLIENTE_DIR/.env"

# ─── Iniciar processo PM2 novo ─────────────────────────────────────────────────
echo "  Iniciando processo PM2 novo..."
PAINEL_DIR="$LINKFLOW_DIR/painel"

# Copiar .env para o painel durante o start
cp "$CLIENTE_DIR/.env" "$PAINEL_DIR/.env.local"

cd "$PAINEL_DIR"
pm2 start "node_modules/.bin/next start -p $PORTA" \
  --name "painel-$SLUG" \
  --cwd "$PAINEL_DIR"

pm2 save

echo ""
echo "  ✅ Migração concluída!"
echo "     Dados em: $CLIENTE_DIR"
echo "     Processo: painel-$SLUG (porta $PORTA)"
echo ""
echo "  ⚠️  Próximos passos:"
echo "     1. Verifique se o painel está respondendo: pm2 logs painel-$SLUG"
echo "     2. Atualize o CLAUDE.md com o novo LINKFLOW_DIR=$CLIENTE_DIR"
echo "     3. Remova a instalação antiga quando confirmar tudo ok: rm -rf $DIR_ANTIGO"
