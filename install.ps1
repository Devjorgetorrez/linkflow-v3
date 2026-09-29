# install.ps1 - Link Flow
# Instala de verdade: confere o pacote, instala as dependencias do painel
# (Next.js), do motor (Astro) e dos scripts Python, e gera os segredos do
# painel. Nao move nada para fora desta pasta - o aluno abre esta pasta no
# Claude Code.
#
# Este arquivo evita acentos e caracteres especiais de proposito: o
# install.bat chama "powershell -File" (PowerShell 5.1 do Windows), que
# le o script no codepage do sistema, nao UTF-8 - acento vira lixo e
# quebra o parser.

param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$packageRoot = $scriptDir

function Write-Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "  [ERRO] $msg" -ForegroundColor Red }
function Write-Warn($msg) { Write-Host "  [AVISO] $msg" -ForegroundColor Yellow }
function Write-Step($msg) { Write-Host ""; Write-Host $msg -ForegroundColor Cyan }

Write-Host ""
Write-Host "Link Flow - Instalador" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$errors = @()
$warnings = @()

# --- 1. Estrutura do pacote ------------------------------------------------
Write-Step "1. Verificando o pacote"

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    $errors += "Claude Code nao foi encontrado neste computador. Baixe em claude.ai/download antes de continuar, depois rode este instalador de novo."
} else {
    Write-Ok "Claude Code encontrado"
}

$estruturas = @(
    @{ Caminho = "CLAUDE.md";                     Rotulo = "CLAUDE.md" },
    @{ Caminho = ".claude\commands";               Rotulo = ".claude\commands" },
    @{ Caminho = ".claude\commands\link-flow.md";  Rotulo = ".claude\commands\link-flow.md" },
    @{ Caminho = ".claude\commands\gmn.md";        Rotulo = ".claude\commands\gmn.md" },
    @{ Caminho = "skills";                         Rotulo = "skills" },
    @{ Caminho = "scripts";                        Rotulo = "scripts" },
    @{ Caminho = "painel";                         Rotulo = "painel" },
    @{ Caminho = "_astro";                         Rotulo = "_astro" }
)
foreach ($item in $estruturas) {
    if (-not (Test-Path "$packageRoot\$($item.Caminho)")) {
        $errors += "$($item.Rotulo) nao encontrado."
    } else {
        Write-Ok "$($item.Rotulo) encontrado"
    }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROS ENCONTRADOS:" -ForegroundColor Red
    foreach ($e in $errors) { Write-Err $e }
    Write-Host ""
    Write-Host "Verifique se voce esta rodando este script de dentro da pasta do pacote Link Flow." -ForegroundColor Yellow
    Write-Host "Caminho atual: $packageRoot" -ForegroundColor Yellow
    exit 1
}

# --- 2. Ferramentas necessarias ---------------------------------------------
Write-Step "2. Verificando Node.js, npm e Python"

$temNode = Get-Command node -ErrorAction SilentlyContinue
$temNpm  = Get-Command npm  -ErrorAction SilentlyContinue
if (-not $temNode -or -not $temNpm) {
    $errors += "Node.js/npm nao encontrados. Instale em nodejs.org (versao LTS) e rode este instalador de novo. O painel e o motor do site sao aplicacoes Node."
} else {
    Write-Ok "Node.js $(node --version) / npm $(npm --version)"
}

$pythonCmd = $null
foreach ($cand in @("python", "py")) {
    if (Get-Command $cand -ErrorAction SilentlyContinue) { $pythonCmd = $cand; break }
}
if (-not $pythonCmd) {
    $errors += "Python nao encontrado. Instale em python.org (marque Add to PATH no instalador) e rode este instalador de novo. Os guardioes e gates das fases sao scripts Python."
} else {
    Write-Ok "Python $(& $pythonCmd --version)"
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROS ENCONTRADOS:" -ForegroundColor Red
    foreach ($e in $errors) { Write-Err $e }
    Write-Host ""
    Write-Host "Instale o que falta acima e rode este instalador de novo." -ForegroundColor Yellow
    exit 1
}

# --- 3. Dependencias do painel (Next.js) ------------------------------------
Write-Step "3. Instalando dependencias do painel (npm install) - pode levar alguns minutos"

Push-Location "$packageRoot\painel"
try {
    npm install --no-fund --no-audit 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $errors += "npm install falhou em painel/. Rode manualmente: cd painel; npm install (para ver o erro completo)."
        Write-Err "npm install falhou em painel/ (codigo $LASTEXITCODE)"
    } else {
        Write-Ok "Dependencias do painel instaladas"
    }
} finally {
    Pop-Location
}

# --- 4. Dependencias do motor (Astro) ---------------------------------------
Write-Step "4. Instalando dependencias do motor do site (npm install) - pode levar alguns minutos"

Push-Location "$packageRoot\_astro"
try {
    npm install --no-fund --no-audit 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $errors += "npm install falhou em _astro/. Rode manualmente: cd _astro; npm install (para ver o erro completo)."
        Write-Err "npm install falhou em _astro/ (codigo $LASTEXITCODE)"
    } else {
        Write-Ok "Dependencias do motor instaladas"
    }
} finally {
    Pop-Location
}

# --- 5. Dependencias Python dos scripts -------------------------------------
Write-Step "5. Instalando dependencias Python (scripts/requirements.txt)"

& $pythonCmd -m pip install --quiet -r "$packageRoot\scripts\requirements.txt" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    $errors += "pip install falhou. Rode manualmente: $pythonCmd -m pip install -r scripts\requirements.txt (para ver o erro completo)."
    Write-Err "pip install falhou (codigo $LASTEXITCODE)"
} else {
    Write-Ok "Dependencias Python instaladas (openpyxl, requests)"
}

# --- 6. Segredos do painel (.env.local) -------------------------------------
Write-Step "6. Configurando segredos do painel"

$envExample = "$packageRoot\painel\.env.example"
$envLocal   = "$packageRoot\painel\.env.local"

if (Test-Path $envLocal) {
    Write-Ok ".env.local ja existe - nao foi sobrescrito"
} elseif (Test-Path $envExample) {
    function New-Segredo([int]$bytes, [string]$formato) {
        $buf = New-Object byte[] $bytes
        [System.Security.Cryptography.RandomNumberGenerator]::Fill($buf)
        if ($formato -eq "hex") {
            return -join ($buf | ForEach-Object { $_.ToString("x2") })
        }
        return [Convert]::ToBase64String($buf)
    }

    $nextAuthSecret = New-Segredo -bytes 32 -formato "base64"
    $painelApiKey   = New-Segredo -bytes 32 -formato "hex"

    $conteudo = Get-Content $envExample -Raw
    $conteudo = $conteudo -replace "NEXTAUTH_SECRET=troque-por-um-secret-seguro", "NEXTAUTH_SECRET=$nextAuthSecret"
    $conteudo = $conteudo -replace "PAINEL_API_KEY=troque-por-uma-chave-segura", "PAINEL_API_KEY=$painelApiKey"
    # NEXTAUTH_URL=https://painel.seudominio.com.br (valor do .env.example) so serve
    # pra producao no VPS - la quem grava o valor real e novo-cliente.sh/migrar-para-
    # multicliente.sh, nunca este instalador. Localmente esse dominio nao existe, e o
    # NextAuth tenta buscar a sessao nele: da erro "Failed to fetch" (CLIENT_FETCH_ERROR)
    # assim que o painel abre. Usar localhost aqui evita esse erro no primeiro npm run dev.
    $conteudo = $conteudo -replace "NEXTAUTH_URL=https://painel.seudominio.com.br", "NEXTAUTH_URL=http://localhost:3210"
    Set-Content -Path $envLocal -Value $conteudo -NoNewline

    Write-Ok ".env.local criado com NEXTAUTH_SECRET e PAINEL_API_KEY gerados automaticamente"
    $warnings += "NEXTAUTH_URL em painel\.env.local foi ajustado para http://localhost:3210 (uso local). Ao publicar o site de um cliente de verdade no VPS, o proprio vps-setup grava o valor correto para o dominio dele - nao precisa editar isso na mao."
    $warnings += "LINKFLOW_DIR e LINKFLOW_SLUG em painel\.env.local ficam com o valor de exemplo. Cada skill (fase2-site-astro, vps-setup, site-atualizar) os define na hora de abrir o painel de um cliente especifico; nao e um valor fixo do instalador."
} else {
    $warnings += "painel\.env.example nao encontrado - .env.local nao foi criado. Configure manualmente antes de usar /painel."
}

# --- Resumo final ------------------------------------------------------------
Write-Host ""
if ($errors.Count -gt 0) {
    Write-Host "INSTALACAO COM ERROS:" -ForegroundColor Red
    foreach ($e in $errors) { Write-Err $e }
    Write-Host ""
    exit 1
}

Write-Host "Instalacao concluida com sucesso!" -ForegroundColor Green

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "Avisos:" -ForegroundColor Yellow
    foreach ($w in $warnings) { Write-Warn $w }
}

Write-Host ""
Write-Host "Proximo passo:" -ForegroundColor Cyan
Write-Host "  1. Abra o Claude Code apontando para esta pasta ou para a pasta do cliente." -ForegroundColor White
Write-Host "  2. Use /link-flow novo para cadastrar um novo cliente." -ForegroundColor White
Write-Host "  3. Use /GMN para ativar o Agente Google Meu Negocio." -ForegroundColor White
Write-Host "  4. Se o cliente usa WordPress, configure o Novamira com: /plugin configure link-flow@link-flow" -ForegroundColor White
Write-Host ""
exit 0
