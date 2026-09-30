#!/usr/bin/env python3
"""
autorizar_chave.py — Usa a senha root (coletada no chat, PASSO 0 da
vps-setup) para autorizar a CHAVE PUBLICA local no servidor, uma unica vez.

Por que existe: os comandos `ssh`/`scp` do resto da skill nao sabem
autenticar com senha (o OpenSSH client comum so aceita senha em prompt
interativo, que a ferramenta que roda o agente nao tem como responder).
Sem isto, a senha coletada no chat nunca autenticava nada de verdade —
so funcionava se ja existisse uma chave confiavel por fora (achado
tecnico ao revisar o erro 94, Relatorio de Testes 6). paramiko (biblioteca
Python pura, sem depender de sshpass/pacman/choco) resolve isso igual em
Windows, Mac e Linux.

A senha so existe na memoria deste processo — nunca e salva em arquivo,
nunca e logada, nunca e reutilizada depois que a chave esta autorizada.

Uso:
  python scripts/vps/autorizar_chave.py --ip <IP> --porta <PORTA> --senha <SENHA> [--chave-publica <CAMINHO>]

Saida:
  "AUTORIZADO" e exit 0 em sucesso.
  Mensagem de erro clara e exit 1 em falha (senha errada, IP/porta errados,
  timeout).
"""
import argparse
import sys
from pathlib import Path

try:
    import paramiko
except ImportError:
    print("ERRO: biblioteca 'paramiko' ausente. Instale com: pip install paramiko", file=sys.stderr)
    sys.exit(1)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ip", required=True)
    p.add_argument("--porta", type=int, default=22)
    p.add_argument("--senha", required=True)
    p.add_argument("--usuario", default="root")
    p.add_argument("--chave-publica", default=str(Path.home() / ".ssh" / "id_ed25519.pub"))
    args = p.parse_args()

    chave_path = Path(args.chave_publica)
    if not chave_path.is_file():
        chave_dir = chave_path.parent
        chave_dir.mkdir(parents=True, exist_ok=True)
        # Gera a chave local se ainda nao existir — nunca sobrescreve uma existente.
        import subprocess
        priv = chave_path.with_suffix("")
        subprocess.run(
            ["ssh-keygen", "-t", "ed25519", "-f", str(priv), "-N", "", "-C", "linkflow-agente"],
            check=True,
        )

    chave_publica = chave_path.read_text(encoding="utf-8").strip()

    cliente = paramiko.SSHClient()
    cliente.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        cliente.connect(
            hostname=args.ip,
            port=args.porta,
            username=args.usuario,
            password=args.senha,
            timeout=10,
            allow_agent=False,
            look_for_keys=False,
        )
    except paramiko.AuthenticationException:
        print("ERRO: senha recusada pelo servidor. Confira IP, porta e senha.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:  # timeout, DNS, conexao recusada etc.
        print(f"ERRO: nao consegui conectar ({e}).", file=sys.stderr)
        sys.exit(1)

    try:
        # Idempotente: so acrescenta se a chave ainda nao estiver la.
        comando = (
            "mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
            f"grep -qxF '{chave_publica}' ~/.ssh/authorized_keys 2>/dev/null || "
            f"echo '{chave_publica}' >> ~/.ssh/authorized_keys; "
            "chmod 600 ~/.ssh/authorized_keys"
        )
        _stdin, stdout, stderr = cliente.exec_command(comando, timeout=15)
        codigo = stdout.channel.recv_exit_status()
        if codigo != 0:
            erro = stderr.read().decode("utf-8", errors="replace")
            print(f"ERRO: comando de autorizacao falhou no servidor: {erro}", file=sys.stderr)
            sys.exit(1)
    finally:
        cliente.close()

    print("AUTORIZADO")


if __name__ == "__main__":
    main()
