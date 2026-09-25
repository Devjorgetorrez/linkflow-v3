# install.ps1 - Link Flow
# Verifica o ambiente e confirma que o pacote esta pronto para uso.
# Nao move arquivos para fora desta pasta - o aluno abre esta pasta no Claude Code.

param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$packageRoot = $scriptDir

Write-Host ""
Write-Host "Link Flow - Verificacao do pacote" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()

# 0. Verificar Claude Code no PATH
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    $errors += "Claude Code nao foi encontrado neste computador. Baixe em claude.ai/download antes de continuar, depois rode este instalador de novo."
} else {
    Write-Host "  [OK] Claude Code encontrado" -ForegroundColor Green
}

# 1. Verificar CLAUDE.md
if (-not (Test-Path "$packageRoot\CLAUDE.md")) {
    $errors += "CLAUDE.md nao encontrado na raiz do pacote."
} else {
    Write-Host "  [OK] CLAUDE.md encontrado" -ForegroundColor Green
}

# 2. Verificar pasta .claude\commands
if (-not (Test-Path "$packageRoot\.claude\commands")) {
    $errors += "Pasta .claude\commands nao encontrada."
} else {
    Write-Host "  [OK] .claude\commands encontrada" -ForegroundColor Green
}

# 3. Verificar link-flow.md
if (-not (Test-Path "$packageRoot\.claude\commands\link-flow.md")) {
    $errors += ".claude\commands\link-flow.md nao encontrado."
} else {
    Write-Host "  [OK] .claude\commands\link-flow.md encontrado" -ForegroundColor Green
}

# 4. Verificar gmn.md
if (-not (Test-Path "$packageRoot\.claude\commands\gmn.md")) {
    $errors += ".claude\commands\gmn.md nao encontrado."
} else {
    Write-Host "  [OK] .claude\commands\gmn.md encontrado" -ForegroundColor Green
}

# 5. Verificar pasta skills
if (-not (Test-Path "$packageRoot\skills")) {
    $errors += "Pasta skills nao encontrada."
} else {
    $skillCount = (Get-ChildItem "$packageRoot\skills" -Directory | Measure-Object).Count
    Write-Host ("  [OK] skills encontrada ({0} sub-pastas)" -f $skillCount) -ForegroundColor Green
}

# 6. Verificar pasta scripts
if (-not (Test-Path "$packageRoot\scripts")) {
    $errors += "Pasta scripts nao encontrada."
} else {
    $scriptCount = (Get-ChildItem "$packageRoot\scripts" -File | Measure-Object).Count
    Write-Host ("  [OK] scripts encontrada ({0} arquivos)" -f $scriptCount) -ForegroundColor Green
}

Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "ERROS ENCONTRADOS:" -ForegroundColor Red
    foreach ($e in $errors) {
        Write-Host ("  [ERRO] {0}" -f $e) -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Verifique se voce esta rodando este script de dentro da pasta Link-Flow-Pacote-Novo." -ForegroundColor Yellow
    Write-Host ("Caminho atual: {0}" -f $packageRoot) -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "Pacote verificado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximo passo:" -ForegroundColor Cyan
    Write-Host "  1. Abra o Claude Code apontando para esta pasta ou para a pasta do cliente." -ForegroundColor White
    Write-Host "  2. Use /link-flow novo para cadastrar um novo cliente." -ForegroundColor White
    Write-Host "  3. Use /GMN para ativar o Agente Google Meu Negocio." -ForegroundColor White
    Write-Host ""
    exit 0
}
