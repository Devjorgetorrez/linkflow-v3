#!/bin/bash
# update.sh — Link Flow (atualizar uma instalação existente, Linux/macOS)
#
# Diferença para o install.sh: antes de instalar as dependências, confere
# se a pasta projetos/ (dados dos clientes já cadastrados) está presente
# aqui. Pacotes de distribuição NUNCA incluem projetos/ (fica de fora de
# propósito, junto com credenciais/ e _memoria/) — se a pessoa extraiu o
# pacote novo numa pasta diferente da instalação anterior, essas pastas não
# vêm sozinhas. O install.sh não verifica isso porque numa primeira
# instalação a pasta projetos/ realmente não existe ainda.

set -uo pipefail

PACKAGE_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "Link Flow — Atualizador"
echo "========================"

# ── 1. Dados de clientes existentes ─────────────────────────────────────
echo ""
echo "1. Verificando dados de clientes"

if [ -d "$PACKAGE_ROOT/projetos" ] && [ -n "$(ls -A "$PACKAGE_ROOT/projetos" 2>/dev/null)" ]; then
    clientes="$(ls "$PACKAGE_ROOT/projetos")"
    echo "  [OK] cliente(s) encontrado(s) em projetos/: $clientes"
else
    echo ""
    echo "  [AVISO] Pasta projetos/ não encontrada (ou vazia) nesta pasta."
    echo ""
    echo "  Pacotes do Link Flow NUNCA incluem os dados dos seus clientes —"
    echo "  ficam de fora de propósito. Se você já tem clientes cadastrados,"
    echo "  vá na pasta da instalação ANTIGA (onde você roda o Claude Code"
    echo "  hoje — a que tem install.sh e as pastas skills/, painel/, _astro/)"
    echo "  e copie estas pastas de lá, soltas na raiz dela, para a raiz desta"
    echo "  pasta nova (o mesmo nível deste update.sh):"
    echo ""
    echo "    projetos/      (obrigatório  — cadastro de cada cliente)"
    echo "    credenciais/   (se existir    — acessos de VPS guardados)"
    echo "    _memoria/      (se usar /GMN  — memória do Agente GMB)"
    echo ""
    echo "  Exemplo: se a instalação antiga está em"
    echo "  /home/usuario/linkflow-completo/, as três pastas ficam direto"
    echo "  dentro dela — /home/usuario/linkflow-completo/projetos/, etc."
    echo ""
    echo "  Pasta desta instalação nova (destino da cópia): $PACKAGE_ROOT"
    echo ""
    read -r -p "Continuar mesmo assim, sem nenhum cliente cadastrado? (s/n) " resposta
    case "$resposta" in
        [sS]*) ;;
        *)
            echo ""
            echo "Atualização cancelada. Copie as pastas acima e rode update.sh de novo."
            exit 0
            ;;
    esac
fi

# ── 2. Dependências (mesma rotina do install.sh) ────────────────────────
echo ""
echo "2. Atualizando dependências"

exec "$PACKAGE_ROOT/install.sh"
