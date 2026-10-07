# update.ps1 - Link Flow (atualizar uma instalacao existente)
#
# O que faz, em ordem:
#   1. Confere se a pasta projetos/ (dados dos clientes) esta presente.
#   2. Baixa a versao mais recente do Link Flow do GitHub (branch main).
#      Funciona tambem para quem baixou o ZIP (pasta sem .git): nesse caso
#      inicializa o git na pasta e alinha com a main. Antes de sobrescrever,
#      guarda copia dos arquivos que a pessoa tenha alterado em
#      .backup-atualizacao\<data-hora>\.
#   3. Reinstala as dependencias (mesma rotina do install.ps1).
#
# projetos\, credenciais\ e _memoria\ NAO sao tocados: estao no .gitignore,
# entao o git nunca os le nem os sobrescreve.
#
# Trava de seguranca: se a pasta nao estiver no branch main, ou tiver
# commits locais que nao estao no GitHub (pasta de desenvolvimento), o
# script RECUSA atualizar - nunca descarta trabalho nao enviado.
#
# -SemPerguntas: modo para o agente (Claude Code), que nao consegue responder
# a Read-Host. Avisos continuam saindo; nenhuma pergunta e feita.
#
# Mesmo cuidado de acentos do install.ps1: sem acento no codigo, porque o
# install.bat/update.bat chama "powershell -File" (PowerShell 5.1), que le
# o arquivo no codepage do sistema, nao UTF-8.

param([switch]$SemPerguntas)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoUrl = "https://github.com/Devjorgetorrez/linkflow-v3.git"
$branch = "main"

function Write-Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [AVISO] $msg" -ForegroundColor Yellow }
function Write-Step($msg) { Write-Host ""; Write-Host $msg -ForegroundColor Cyan }

# Roda git na pasta do Link Flow. No PowerShell 5.1, texto que o git escreve
# em stderr vira erro e interrompe o script com $ErrorActionPreference=Stop;
# por isso relaxa aqui dentro e devolve o codigo de saida para quem chamou.
function Invoke-Git {
    param([string[]]$GitArgs)
    $antes = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $saida = & git -C $scriptDir -c core.quotepath=false -c safe.directory=* @GitArgs 2>&1
    $codigo = $LASTEXITCODE
    $ErrorActionPreference = $antes
    return [pscustomobject]@{
        Code = $codigo
        Out  = @($saida | ForEach-Object { "$_" })
    }
}

Write-Host ""
Write-Host "Link Flow - Atualizador" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# --- 1. Dados de clientes existentes -----------------------------------------
Write-Step "1. Verificando dados de clientes"

$pastaProjetos = "$scriptDir\projetos"
$clientes = @()
if (Test-Path $pastaProjetos) {
    $clientes = Get-ChildItem -Path $pastaProjetos -Directory -ErrorAction SilentlyContinue
}

if ($clientes.Count -gt 0) {
    Write-Ok "$($clientes.Count) cliente(s) encontrado(s) em projetos\: $($clientes.Name -join ', ')"
} else {
    Write-Host ""
    Write-Warn "Pasta projetos\ nao encontrada (ou vazia) nesta pasta."
    Write-Host ""
    Write-Host "  Os dados dos seus clientes NAO vem no pacote do Link Flow -" -ForegroundColor Yellow
    Write-Host "  ficam de fora de proposito. Se voce ja tem clientes cadastrados," -ForegroundColor Yellow
    Write-Host "  va na pasta da instalacao ANTIGA (onde voce roda o Claude Code" -ForegroundColor Yellow
    Write-Host "  hoje - a que tem install.bat e as pastas skills\, painel\, _astro\)" -ForegroundColor Yellow
    Write-Host "  e copie estas pastas de la, soltas na raiz dela, para a raiz desta" -ForegroundColor Yellow
    Write-Host "  pasta nova (o mesmo nivel deste update.bat):" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    projetos\      (obrigatorio  - cadastro de cada cliente)" -ForegroundColor Yellow
    Write-Host "    credenciais\   (se existir    - acessos de VPS guardados)" -ForegroundColor Yellow
    Write-Host "    _memoria\      (se usar /GMN  - memoria do Agente GMB)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Exemplo: se a instalacao antiga esta em" -ForegroundColor Yellow
    Write-Host "  C:\LinkFlow\linkflow-completo\, as tres pastas ficam direto dentro" -ForegroundColor Yellow
    Write-Host "  dela - C:\LinkFlow\linkflow-completo\projetos\, etc." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Pasta desta instalacao (destino da copia): $scriptDir" -ForegroundColor Yellow
    Write-Host ""
    if ($SemPerguntas) {
        Write-Warn "Seguindo sem nenhum cliente cadastrado (modo sem perguntas)."
    } else {
        $resposta = Read-Host "Continuar mesmo assim, sem nenhum cliente cadastrado? (s/n)"
        if ($resposta -notmatch "^[sS]") {
            Write-Host ""
            Write-Host "Atualizacao cancelada. Copie as pastas acima e rode update.bat de novo." -ForegroundColor Cyan
            exit 0
        }
    }
}

# --- 2. Baixar a versao mais recente do GitHub -------------------------------
Write-Step "2. Baixando a versao mais recente do Link Flow"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Warn "O Git nao esta instalado neste computador - ele e necessario para baixar atualizacoes."
    Write-Host "  Instale com:  winget install --id Git.Git -e" -ForegroundColor Yellow
    Write-Host "  Depois feche e abra o terminal e rode update.bat de novo." -ForegroundColor Yellow
    exit 1
}

# So atualiza uma copia COMPLETA do Link Flow (ver update.sh).
if (-not (Test-Path "$scriptDir\CLAUDE.md") -or -not (Test-Path "$scriptDir\skills")) {
    Write-Warn "Esta pasta nao parece ser uma copia completa do Link Flow (falta CLAUDE.md ou skills\)."
    Write-Host "  Rode o update dentro da pasta onde voce abre o Claude Code. Nada foi alterado." -ForegroundColor Yellow
    exit 1
}

$primeiraVez = -not (Test-Path "$scriptDir\.git")

if ($primeiraVez) {
    Write-Host "  Esta pasta veio de um ZIP (sem historico). Conectando ao GitHub..."
    $r = Invoke-Git @("init", "-q", "-b", $branch)
    if ($r.Code -ne 0) { Write-Warn "Nao consegui preparar a pasta: $($r.Out -join ' ')"; exit 1 }
    $r = Invoke-Git @("remote", "add", "origin", $repoUrl)
    if ($r.Code -ne 0) { Write-Warn "Nao consegui conectar ao GitHub: $($r.Out -join ' ')"; exit 1 }
} else {
    $r = Invoke-Git @("rev-parse", "--abbrev-ref", "HEAD")
    $atual = ($r.Out -join "").Trim()
    if ($atual -ne $branch) {
        Write-Warn "Esta pasta esta no branch '$atual', nao em '$branch'. Parece uma pasta de desenvolvimento."
        Write-Host "  Por seguranca, nao vou atualizar para nao perder trabalho. Nada foi alterado." -ForegroundColor Yellow
        exit 1
    }
}

$r = Invoke-Git @("fetch", "-q", "origin", $branch)
if ($r.Code -ne 0) {
    Write-Warn "Nao consegui acessar o GitHub. Verifique a internet e tente de novo."
    Write-Host "  Detalhe: $($r.Out -join ' ')" -ForegroundColor Yellow
    exit 1
}

$versaoAntes = ""
if (-not $primeiraVez) {
    $r = Invoke-Git @("rev-list", "--count", "origin/$branch..HEAD")
    $naoEnviados = [int](($r.Out -join "").Trim())
    if ($naoEnviados -gt 0) {
        Write-Warn "Esta pasta tem $naoEnviados commit(s) que nao estao no GitHub. Parece uma pasta de desenvolvimento."
        Write-Host "  Por seguranca, nao vou atualizar para nao perder trabalho. Nada foi alterado." -ForegroundColor Yellow
        exit 1
    }
    $r = Invoke-Git @("rev-parse", "--short", "HEAD")
    $versaoAntes = ($r.Out -join "").Trim()
}

# Alinha o historico com a main SEM mexer nos arquivos (reset misto); assim
# "git diff" mostra exatamente o que difere da versao nova.
$r = Invoke-Git @("reset", "-q", "origin/$branch")
if ($r.Code -ne 0) { Write-Warn "Nao consegui alinhar com a versao nova: $($r.Out -join ' ')"; exit 1 }

$r = Invoke-Git @("diff", "--name-only", "HEAD")
$alterados = @($r.Out | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $scriptDir $_)) })

if ($alterados.Count -gt 0) {
    $pastaBackup = Join-Path $scriptDir (".backup-atualizacao\" + (Get-Date -Format "yyyy-MM-dd_HH-mm-ss"))
    foreach ($arq in $alterados) {
        $destino = Join-Path $pastaBackup $arq
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destino) | Out-Null
        Copy-Item -LiteralPath (Join-Path $scriptDir $arq) -Destination $destino -Force
    }
    Write-Ok "$($alterados.Count) arquivo(s) diferente(s) da versao nova foram guardados em: $pastaBackup"
}

$r = Invoke-Git @("reset", "-q", "--hard", "origin/$branch")
if ($r.Code -ne 0) { Write-Warn "Nao consegui aplicar a versao nova: $($r.Out -join ' ')"; exit 1 }

$r = Invoke-Git @("log", "-1", "--format=%h - %s")
$versaoDepois = ($r.Out -join "").Trim()
if ($versaoAntes -and $versaoDepois.StartsWith($versaoAntes)) {
    Write-Ok "Ja estava na versao mais recente: $versaoDepois"
} else {
    Write-Ok "Atualizado para: $versaoDepois"
}

# --- 3. Dependencias (mesma rotina do install.ps1) ---------------------------
Write-Step "3. Atualizando dependencias"

& "$scriptDir\install.ps1"
exit $LASTEXITCODE
