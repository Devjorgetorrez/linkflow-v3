#!/bin/bash
# update.sh — Link Flow (atualizar uma instalação existente, Linux/macOS)
#
# O que faz, em ordem:
#   1. Confere se a pasta projetos/ (dados dos clientes) está presente.
#   2. Baixa a versão mais recente do Link Flow do GitHub (branch main).
#      Funciona também para quem baixou o ZIP (pasta sem .git): nesse caso
#      inicializa o git na pasta e alinha com a main. Antes de sobrescrever,
#      guarda cópia dos arquivos que a pessoa tenha alterado em
#      .backup-atualizacao/<data-hora>/.
#   3. Reinstala as dependências (mesma rotina do install.sh).
#
# projetos/, credenciais/ e _memoria/ NÃO são tocados: estão no .gitignore,
# então o git nunca os lê nem os sobrescreve.
#
# Trava de segurança: se a pasta não estiver no branch main, ou tiver
# commits locais que não estão no GitHub (pasta de desenvolvimento), o
# script RECUSA atualizar — nunca descarta trabalho não enviado.
#
# --sem-perguntas: modo para o agente (Claude Code), que não consegue
# responder a `read`. Avisos continuam saindo; nenhuma pergunta é feita.

set -uo pipefail

PACKAGE_ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO_URL="https://github.com/Devjorgetorrez/linkflow-v3.git"
BRANCH="main"
SEM_PERGUNTAS=0
for arg in "$@"; do
    [ "$arg" = "--sem-perguntas" ] && SEM_PERGUNTAS=1
done

ok()   { echo "  [OK] $1"; }
warn() { echo "  [AVISO] $1"; }
step() { echo ""; echo "$1"; }
g()    { git -C "$PACKAGE_ROOT" -c core.quotepath=false "$@"; }

echo ""
echo "Link Flow — Atualizador"
echo "========================"

# ── 1. Dados de clientes existentes ─────────────────────────────────────
step "1. Verificando dados de clientes"

if [ -d "$PACKAGE_ROOT/projetos" ] && [ -n "$(ls -A "$PACKAGE_ROOT/projetos" 2>/dev/null)" ]; then
    clientes="$(ls "$PACKAGE_ROOT/projetos")"
    ok "cliente(s) encontrado(s) em projetos/: $clientes"
else
    echo ""
    warn "Pasta projetos/ não encontrada (ou vazia) nesta pasta."
    echo ""
    echo "  Os dados dos seus clientes NÃO vêm no pacote do Link Flow —"
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
    echo "  Pasta desta instalação (destino da cópia): $PACKAGE_ROOT"
    echo ""
    if [ "$SEM_PERGUNTAS" -eq 1 ]; then
        warn "Seguindo sem nenhum cliente cadastrado (modo sem perguntas)."
    else
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
fi

# ── 2. Baixar a versão mais recente do GitHub ───────────────────────────
step "2. Baixando a versão mais recente do Link Flow"

if ! command -v git >/dev/null 2>&1; then
    warn "O Git não está instalado neste computador — ele é necessário para baixar atualizações."
    echo "  Instale pelo gerenciador de pacotes (ex.: sudo apt install git, ou brew install git)"
    echo "  e rode update.sh de novo."
    exit 1
fi

PRIMEIRA_VEZ=0
if [ ! -d "$PACKAGE_ROOT/.git" ]; then
    PRIMEIRA_VEZ=1
    echo "  Esta pasta veio de um ZIP (sem histórico). Conectando ao GitHub..."
    if ! out="$(g init -q -b "$BRANCH" 2>&1)"; then
        warn "Não consegui preparar a pasta: $out"; exit 1
    fi
    if ! out="$(g remote add origin "$REPO_URL" 2>&1)"; then
        warn "Não consegui conectar ao GitHub: $out"; exit 1
    fi
else
    atual="$(g rev-parse --abbrev-ref HEAD 2>/dev/null)"
    if [ "$atual" != "$BRANCH" ]; then
        warn "Esta pasta está no branch '$atual', não em '$BRANCH'. Parece uma pasta de desenvolvimento."
        echo "  Por segurança, não vou atualizar para não perder trabalho. Nada foi alterado."
        exit 1
    fi
fi

if ! out="$(g fetch -q origin "$BRANCH" 2>&1)"; then
    warn "Não consegui acessar o GitHub. Verifique a internet e tente de novo."
    echo "  Detalhe: $out"
    exit 1
fi

versao_antes=""
if [ "$PRIMEIRA_VEZ" -eq 0 ]; then
    nao_enviados="$(g rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo 0)"
    if [ "${nao_enviados:-0}" -gt 0 ]; then
        warn "Esta pasta tem $nao_enviados commit(s) que não estão no GitHub. Parece uma pasta de desenvolvimento."
        echo "  Por segurança, não vou atualizar para não perder trabalho. Nada foi alterado."
        exit 1
    fi
    versao_antes="$(g rev-parse --short HEAD 2>/dev/null)"
fi

# Alinha o histórico com a main SEM mexer nos arquivos (reset misto); assim
# "git diff" mostra exatamente o que difere da versão nova.
if ! out="$(g reset -q "origin/$BRANCH" 2>&1)"; then
    warn "Não consegui alinhar com a versão nova: $out"; exit 1
fi

alterados=0
pasta_backup="$PACKAGE_ROOT/.backup-atualizacao/$(date +%Y-%m-%d_%H-%M-%S)"
while IFS= read -r arq; do
    [ -z "$arq" ] && continue
    [ -e "$PACKAGE_ROOT/$arq" ] || continue
    mkdir -p "$pasta_backup/$(dirname "$arq")"
    cp -p "$PACKAGE_ROOT/$arq" "$pasta_backup/$arq"
    alterados=$((alterados + 1))
done < <(g diff --name-only HEAD)

if [ "$alterados" -gt 0 ]; then
    ok "$alterados arquivo(s) diferente(s) da versão nova foram guardados em: $pasta_backup"
fi

if ! out="$(g reset -q --hard "origin/$BRANCH" 2>&1)"; then
    warn "Não consegui aplicar a versão nova: $out"; exit 1
fi

versao_depois="$(g log -1 --format='%h - %s')"
if [ -n "$versao_antes" ] && [[ "$versao_depois" == "$versao_antes"* ]]; then
    ok "Já estava na versão mais recente: $versao_depois"
else
    ok "Atualizado para: $versao_depois"
fi

# ── 3. Dependências (mesma rotina do install.sh) ────────────────────────
step "3. Atualizando dependências"

exec "$PACKAGE_ROOT/install.sh"
