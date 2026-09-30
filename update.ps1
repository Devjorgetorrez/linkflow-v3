# update.ps1 - Link Flow (atualizar uma instalacao existente)
#
# Diferenca para o install.ps1: antes de instalar as dependencias, confere
# se a pasta projetos/ (dados dos clientes ja cadastrados) esta presente
# aqui. Pacotes de distribuicao NUNCA incluem projetos/ (fica de fora de
# proposito, junto com credenciais/ e _memoria/) - se a pessoa extraiu o
# pacote novo numa pasta diferente da instalacao anterior, essas pastas nao
# vem sozinhas. O install.ps1 nao verifica isso porque numa primeira
# instalacao a pasta projetos/ realmente nao existe ainda - avisar sobre
# isso ali so confundiria quem esta comecando agora.
#
# Mesmo cuidado de acentos do install.ps1: sem acento no codigo, porque o
# install.bat/update.bat chama "powershell -File" (PowerShell 5.1), que le
# o arquivo no codepage do sistema, nao UTF-8.

param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

function Write-Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [AVISO] $msg" -ForegroundColor Yellow }
function Write-Step($msg) { Write-Host ""; Write-Host $msg -ForegroundColor Cyan }

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
    Write-Host "  Pacotes do Link Flow NUNCA incluem os dados dos seus clientes -" -ForegroundColor Yellow
    Write-Host "  ficam de fora de proposito. Se voce ja tem clientes cadastrados" -ForegroundColor Yellow
    Write-Host "  numa instalacao anterior (outra pasta), copie estas pastas de la" -ForegroundColor Yellow
    Write-Host "  para AQUI antes de continuar:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    projetos\      (obrigatorio  - cadastro de cada cliente)" -ForegroundColor Yellow
    Write-Host "    credenciais\   (se existir    - acessos de VPS guardados)" -ForegroundColor Yellow
    Write-Host "    _memoria\      (se usar /GMN  - memoria do Agente GMB)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Pasta atual: $scriptDir" -ForegroundColor Yellow
    Write-Host ""
    $resposta = Read-Host "Continuar mesmo assim, sem nenhum cliente cadastrado? (s/n)"
    if ($resposta -notmatch "^[sS]") {
        Write-Host ""
        Write-Host "Atualizacao cancelada. Copie as pastas acima e rode update.bat de novo." -ForegroundColor Cyan
        exit 0
    }
}

# --- 2. Dependencias (mesma rotina do install.ps1) ---------------------------
Write-Step "2. Atualizando dependencias"

& "$scriptDir\install.ps1"
exit $LASTEXITCODE
