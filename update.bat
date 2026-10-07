@echo off
rem Tudo dentro de um bloco ( ): o cmd le o bloco inteiro antes de executar.
rem Sem isso, o update troca este arquivo no meio da execucao (git) e o cmd,
rem que le .bat aos poucos, poderia ler lixo depois da linha do powershell.
(
    powershell -ExecutionPolicy Bypass -File "%~dp0update.ps1" %*
    pause
    exit /b
)
