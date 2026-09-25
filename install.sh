#!/bin/bash
# install.sh — Link Flow (Linux/macOS)
# Verifica o ambiente e confirma que o pacote esta pronto para uso.

PACKAGE_ROOT="$(cd "$(dirname "$0")" && pwd)"
ERRORS=()

echo ""
echo "Link Flow — Verificacao do pacote"
echo "==================================="
echo ""

check() {
    local path="$1"
    local label="$2"
    if [ -e "$PACKAGE_ROOT/$path" ]; then
        echo "  [OK] $label"
    else
        echo "  [ERRO] $label NAO encontrado: $path"
        ERRORS+=("$path")
    fi
}

check "CLAUDE.md"                        "CLAUDE.md"
check ".claude/commands"                 ".claude/commands"
check ".claude/commands/link-flow.md"    ".claude/commands/link-flow.md"
check ".claude/commands/gmn.md"          ".claude/commands/gmn.md"
check "skills"                           "skills"
check "scripts"                          "scripts"

echo ""

if [ ${#ERRORS[@]} -gt 0 ]; then
    echo "ERROS ENCONTRADOS. Verifique se voce esta dentro da pasta Link-Flow-Pacote-Novo."
    echo "Caminho atual: $PACKAGE_ROOT"
    exit 1
else
    echo "Pacote verificado com sucesso!"
    echo ""
    echo "Proximo passo:"
    echo "  1. Abra o Claude Code apontando para esta pasta ou para a pasta do cliente."
    echo "  2. Use /link-flow novo para cadastrar um novo cliente."
    echo "  3. Use /GMN para ativar o Agente Google Meu Negocio."
    echo ""
fi
