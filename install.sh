#!/bin/bash
# install.sh — Link Flow (Linux/macOS)
# Instala de verdade: confere o pacote, instala as dependências do painel
# (Next.js), do motor (Astro) e dos scripts Python, e gera os segredos do
# painel. Não move nada para fora desta pasta — o aluno abre esta pasta no
# Claude Code.

set -uo pipefail

PACKAGE_ROOT="$(cd "$(dirname "$0")" && pwd)"
ERRORS=()
WARNINGS=()

ok()   { echo "  [OK] $1"; }
err()  { echo "  [ERRO] $1"; }
warn() { echo "  [AVISO] $1"; }
step() { echo ""; echo "$1"; }

echo ""
echo "Link Flow — Instalador"
echo "========================"

# ── 1. Estrutura do pacote ──────────────────────────────────────────────
step "1. Verificando o pacote"

check_path() {
    local path="$1"
    local label="$2"
    if [ -e "$PACKAGE_ROOT/$path" ]; then
        ok "$label"
    else
        err "$label NAO encontrado: $path"
        ERRORS+=("$path")
    fi
}

check_path "CLAUDE.md"                        "CLAUDE.md"
check_path ".claude/commands"                 ".claude/commands"
check_path ".claude/commands/link-flow.md"    ".claude/commands/link-flow.md"
check_path ".claude/commands/gmn.md"          ".claude/commands/gmn.md"
check_path "skills"                           "skills"
check_path "scripts"                          "scripts"
check_path "painel"                           "painel"
check_path "_astro"                           "_astro"

if [ ${#ERRORS[@]} -gt 0 ]; then
    echo ""
    echo "ERROS ENCONTRADOS. Verifique se voce esta dentro da pasta do pacote Link Flow."
    echo "Caminho atual: $PACKAGE_ROOT"
    exit 1
fi

# ── 2. Ferramentas necessarias ──────────────────────────────────────────
step "2. Verificando Node.js, npm e Python"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    err "Node.js/npm nao encontrados. Instale em nodejs.org (versao LTS) e rode este instalador de novo."
    ERRORS+=("node")
else
    ok "Node.js $(node --version) / npm $(npm --version)"
fi

PYTHON_CMD=""
for cand in python3 python; do
    if command -v "$cand" >/dev/null 2>&1; then PYTHON_CMD="$cand"; break; fi
done
if [ -z "$PYTHON_CMD" ]; then
    err "Python nao encontrado. Instale python3 e rode este instalador de novo."
    ERRORS+=("python")
else
    ok "$($PYTHON_CMD --version)"
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
    echo ""
    echo "Instale o que falta acima e rode este instalador de novo."
    exit 1
fi

# ── 3. Dependencias do painel (Next.js) ─────────────────────────────────
step "3. Instalando dependencias do painel (npm install) — pode levar alguns minutos"

if (cd "$PACKAGE_ROOT/painel" && npm install --no-fund --no-audit); then
    ok "Dependencias do painel instaladas"
else
    err "npm install falhou em painel/. Rode manualmente 'cd painel && npm install' para ver o erro completo."
    ERRORS+=("npm-painel")
fi

# ── 4. Dependencias do motor (Astro) ────────────────────────────────────
step "4. Instalando dependencias do motor do site (npm install) — pode levar alguns minutos"

if (cd "$PACKAGE_ROOT/_astro" && npm install --no-fund --no-audit); then
    ok "Dependencias do motor instaladas"
else
    err "npm install falhou em _astro/. Rode manualmente 'cd _astro && npm install' para ver o erro completo."
    ERRORS+=("npm-astro")
fi

# ── 5. Dependencias Python dos scripts ──────────────────────────────────
step "5. Instalando dependencias Python (scripts/requirements.txt)"

if "$PYTHON_CMD" -m pip install --quiet -r "$PACKAGE_ROOT/scripts/requirements.txt"; then
    ok "Dependencias Python instaladas (openpyxl, requests)"
else
    err "pip install falhou. Rode manualmente '$PYTHON_CMD -m pip install -r scripts/requirements.txt' para ver o erro completo."
    ERRORS+=("pip")
fi

# ── 6. Segredos do painel (.env.local) ──────────────────────────────────
step "6. Configurando segredos do painel"

ENV_EXAMPLE="$PACKAGE_ROOT/painel/.env.example"
ENV_LOCAL="$PACKAGE_ROOT/painel/.env.local"

gerar_segredo() {
    # $1 = bytes, $2 = formato ("hex" ou "base64")
    if [ "$2" = "hex" ]; then
        "$PYTHON_CMD" -c "import secrets; print(secrets.token_hex($1))"
    else
        "$PYTHON_CMD" -c "import secrets; print(secrets.token_urlsafe($1))"
    fi
}

if [ -f "$ENV_LOCAL" ]; then
    ok ".env.local ja existe — nao foi sobrescrito"
elif [ -f "$ENV_EXAMPLE" ]; then
    NEXTAUTH_SECRET_VAL="$(gerar_segredo 32 base64)"
    PAINEL_API_KEY_VAL="$(gerar_segredo 32 hex)"

    sed -e "s/NEXTAUTH_SECRET=troque-por-um-secret-seguro/NEXTAUTH_SECRET=$NEXTAUTH_SECRET_VAL/" \
        -e "s/PAINEL_API_KEY=troque-por-uma-chave-segura/PAINEL_API_KEY=$PAINEL_API_KEY_VAL/" \
        "$ENV_EXAMPLE" > "$ENV_LOCAL"

    ok ".env.local criado com NEXTAUTH_SECRET e PAINEL_API_KEY gerados automaticamente"
    WARNINGS+=("LINKFLOW_DIR e LINKFLOW_SLUG em painel/.env.local ficam com o valor de exemplo — cada skill (fase2-site-astro, vps-setup, site-atualizar) os define na hora de abrir o painel de um cliente especifico; nao e um valor fixo do instalador.")
else
    WARNINGS+=("painel/.env.example nao encontrado — .env.local nao foi criado. Configure manualmente antes de usar '/painel'.")
fi

# ── Resumo final ─────────────────────────────────────────────────────────
echo ""
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo "INSTALACAO COM ERROS."
    exit 1
fi

echo "Instalacao concluida com sucesso!"

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo "Avisos:"
    for w in "${WARNINGS[@]}"; do warn "$w"; done
fi

echo ""
echo "Proximo passo:"
echo "  1. Abra o Claude Code apontando para esta pasta ou para a pasta do cliente."
echo "  2. Use /link-flow novo para cadastrar um novo cliente."
echo "  3. Use /GMN para ativar o Agente Google Meu Negocio."
echo "  4. Se o cliente usa WordPress, configure o Novamira com: /plugin configure link-flow@link-flow"
echo ""
