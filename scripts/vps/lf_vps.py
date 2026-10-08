#!/usr/bin/env python3
"""
lf_vps.py - Uma unica porta de entrada para "falar com o servidor", igual
nos tres cenarios em que o Link Flow roda:

  1. Windows (Claude Desktop) -> servidor EXTERNO         (modo remoto, via SSH)
  2. Linux na propria VPS     -> a MESMA VPS              (modo local, sem SSH)
  3. Linux numa VPS           -> OUTRA VPS                (modo remoto, via SSH)

As skills (vps-setup, site-publicar, site-atualizar, atualizar-cliente,
painel-senha, fase2-site-astro) chamam este script em vez de escrever
`ssh root@IP ...`, `rsync -e ssh` ou `scp` na mao. Assim a MESMA instrucao
funciona nos tres cenarios, e quem decide se vai por SSH ou se roda local e
o script - nunca o agente, nunca o usuario.

Como o modo e decidido (nesta ordem):
  1. --modo remoto|local na linha de comando;
  2. campo `vps_modo:` em `## Ambiente VPS` do projeto.md do cliente;
  3. automatico: se `vps_ip` for um endereco DESTA maquina (ou localhost),
     e local; caso contrario, remoto.

Uso:
  lf_vps.py info --slug S
  lf_vps.py exec --slug S [--] "comando"          (stdin e repassado: serve para heredoc)
  lf_vps.py send --slug S ORIGEM DESTINO [--conteudo] [--excluir PADRAO ...]

  Sem --slug, informe --ip/--porta/--user (e opcionalmente --modo): e o caso do
  primeiro teste de conexao do vps-setup, antes do projeto.md ter o servidor.

`send` copia ORIGEM (arquivo ou pasta) para dentro da pasta DESTINO do servidor,
mantendo o nome da origem (como `tar -cf - pasta | tar -xf - -C DESTINO`). Com
--conteudo copia so o que ha DENTRO da pasta de origem. Nao depende de rsync nem
de tar no computador do usuario (importante no Windows).

Em modo local, quando o usuario atual nao e root mas o projeto.md pede
`vps_user: root`, os comandos rodam com `sudo -n` (sem pedir senha: se o sudo
precisar de senha, o script para e diz isso).

Saida: o stdout/stderr do comando, e exit code igual ao do comando. Erros do
proprio script saem com exit 2 e mensagem em portugues.
"""
import argparse
import fnmatch
import ipaddress
import json
import os
import re
import shlex
import shutil
import socket
import subprocess
import sys
import tarfile

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def erro(msg, codigo=2):
    print("[lf_vps] " + msg, file=sys.stderr)
    sys.exit(codigo)


# --- Leitura do projeto.md -----------------------------------------------------

def ler_ambiente_vps(slug):
    """Le os campos chave: valor da secao '## Ambiente VPS' do projeto.md."""
    caminho = os.path.join(RAIZ, "projetos", slug, "projeto.md")
    if not os.path.isfile(caminho):
        erro("projeto nao encontrado: projetos/%s/projeto.md" % slug)
    campos, dentro = {}, False
    with open(caminho, encoding="utf-8") as f:
        for linha in f:
            if linha.startswith("## "):
                dentro = linha.strip().lower().startswith("## ambiente vps")
                continue
            if dentro:
                m = re.match(r"^\s*([a-z_]+)\s*:\s*(.*?)\s*$", linha)
                if m and m.group(2) and not m.group(2).startswith("["):
                    campos[m.group(1)] = m.group(2)
    return campos


# --- Deteccao de modo ----------------------------------------------------------

def enderecos_locais():
    """Enderecos IP desta maquina (interfaces), sem consultar a internet."""
    achados = {"127.0.0.1", "::1", "localhost"}
    try:
        achados.update(socket.gethostbyname_ex(socket.gethostname())[2])
    except OSError:
        pass
    for cmd in (["hostname", "-I"], ["ip", "-o", "addr"]):
        if shutil.which(cmd[0]):
            try:
                saida = subprocess.run(cmd, capture_output=True, text=True, timeout=5).stdout
            except (OSError, subprocess.SubprocessError):
                continue
            for token in re.findall(r"[0-9a-fA-F:.]+", saida):
                try:
                    achados.add(str(ipaddress.ip_address(token.split("/")[0])))
                except ValueError:
                    pass
    return achados


def resolver(args):
    """Devolve dict com modo, ip, porta, user."""
    cfg = {}
    if args.slug:
        cfg = ler_ambiente_vps(args.slug)
    ip = args.ip or cfg.get("vps_ip", "")
    porta = str(args.porta or cfg.get("vps_porta", "22"))
    user = args.user or cfg.get("vps_user", "root")
    modo = args.modo or cfg.get("vps_modo", "")
    origem_modo = "argumento" if args.modo else ("projeto.md" if cfg.get("vps_modo") else "")
    if modo not in ("", "remoto", "local"):
        erro("modo invalido '%s' (use remoto ou local)" % modo)
    if not modo:
        if not ip:
            erro("sem vps_ip nem --modo: nao sei para onde ir. Preencha '## Ambiente VPS' no projeto.md ou use --ip.")
        modo = "local" if ip in enderecos_locais() else "remoto"
        origem_modo = "automatico (vps_ip %s)" % ("e desta maquina" if modo == "local" else "e outra maquina")
    if modo == "remoto" and not ip:
        erro("modo remoto exige vps_ip (projeto.md) ou --ip.")
    return {"modo": modo, "ip": ip, "porta": porta, "user": user, "origem_modo": origem_modo}


# --- Execucao ------------------------------------------------------------------

def prefixo_sudo(cfg):
    """Em modo local, se o projeto pede root mas quem roda nao e root, usa sudo -n."""
    if cfg["modo"] != "local" or os.name == "nt":
        return []
    if cfg["user"] == "root" and hasattr(os, "geteuid") and os.geteuid() != 0:
        if not shutil.which("sudo"):
            erro("este usuario nao e root e nao ha sudo. Rode o agente como root ou instale o sudo.")
        return ["sudo", "-n"]
    return []


def argv_ssh(cfg, comando_remoto):
    return [
        "ssh", "-p", cfg["porta"],
        "-o", "ConnectTimeout=10",
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "BatchMode=yes",   # o agente nao responde a prompts de senha
        "%s@%s" % (cfg["user"], cfg["ip"]),
        comando_remoto,
    ]


def argv_comando(cfg, comando):
    if cfg["modo"] == "remoto":
        return argv_ssh(cfg, comando)
    # which() respeita o PATH do usuario (no Windows, "bash" solto acharia o da WSL).
    return prefixo_sudo(cfg) + [shutil.which("bash") or "bash", "-c", comando]


def caminho_do_servidor(caminho):
    """Desfaz a conversao de caminhos do Git Bash no Windows.

    Quem chama este script a partir do Git Bash (o shell padrao do Claude Code
    no Windows) tem "/opt/linkflow" reescrito para "C:/Program Files/Git/opt/
    linkflow" antes de chegar aqui - e o deploy iria para um caminho que nao
    existe no servidor. Um caminho de servidor nunca comeca por uma unidade
    do Windows, entao e seguro desfazer.
    """
    m = re.match(r"^[A-Za-z]:[/\\].*?[/\\]Git[/\\](.*)$", caminho)
    if os.name == "nt" and m:
        return "/" + m.group(1).replace("\\", "/")
    return caminho


def cmd_info(args):
    cfg = resolver(args)
    print(json.dumps(cfg, ensure_ascii=False))
    return 0


def cmd_exec(args):
    cfg = resolver(args)
    comando = " ".join(args.comando).strip()
    if not comando:
        erro("exec precisa de um comando.")
    argv = argv_comando(cfg, comando)
    if args.dry_run:
        print(" ".join(shlex.quote(a) for a in argv))
        return 0
    if cfg["modo"] == "remoto" and not shutil.which("ssh"):
        erro("o comando 'ssh' nao foi encontrado neste computador. No Windows 10/11 ele vem em "
             "Configuracoes > Aplicativos > Recursos opcionais > Cliente OpenSSH.")
    return subprocess.call(argv)   # herda stdin/stdout/stderr (heredoc funciona)


# --- Envio de arquivos ---------------------------------------------------------

def _excluido(nome_arquivo, padroes):
    partes = nome_arquivo.replace("\\", "/").split("/")
    return any(fnmatch.fnmatch(p, pad) for p in partes for pad in padroes)


def cmd_send(args):
    cfg = resolver(args)
    origem = os.path.abspath(args.origem)
    if not os.path.exists(origem):
        erro("origem nao existe: %s" % origem)
    destino = caminho_do_servidor(args.destino)
    excluir = args.excluir or []
    comando = "mkdir -p %s && tar -xf - -C %s" % (shlex.quote(destino), shlex.quote(destino))
    argv = argv_comando(cfg, comando)
    if args.dry_run:
        print(" ".join(shlex.quote(a) for a in argv))
        return 0
    if cfg["modo"] == "remoto" and not shutil.which("ssh"):
        erro("o comando 'ssh' nao foi encontrado neste computador (ver 'exec').")

    base = os.path.basename(origem.rstrip("/\\"))

    def ajustar(ti):
        # Windows nao tem bit de execucao: sem isto os .sh chegam sem permissao.
        if ti.isdir():
            ti.mode = 0o755
        else:
            ti.mode = 0o755 if ti.name.endswith((".sh", ".py")) else 0o644
        ti.uid = ti.gid = 0
        ti.uname = ti.gname = "root"
        return ti

    proc = subprocess.Popen(argv, stdin=subprocess.PIPE)
    enviados = 0
    try:
        with tarfile.open(fileobj=proc.stdin, mode="w|") as tar:
            if os.path.isdir(origem):
                for raiz, pastas, arquivos in os.walk(origem):
                    rel_raiz = os.path.relpath(raiz, origem)
                    pastas[:] = [p for p in pastas if not _excluido(p, excluir)]
                    for nome in arquivos:
                        if _excluido(nome, excluir):
                            continue
                        rel = nome if rel_raiz == "." else os.path.join(rel_raiz, nome)
                        arcname = rel if args.conteudo else os.path.join(base, rel)
                        tar.add(os.path.join(raiz, nome), arcname=arcname.replace("\\", "/"),
                                recursive=False, filter=ajustar)
                        enviados += 1
            else:
                tar.add(origem, arcname=base, recursive=False, filter=ajustar)
                enviados = 1
    except BrokenPipeError:
        pass   # o lado de la caiu; o exit code abaixo conta a historia
    finally:
        try:
            proc.stdin.close()
        except OSError:
            pass
    codigo = proc.wait()
    if codigo == 0:
        print("[lf_vps] %d arquivo(s) enviados para %s (%s)" % (enviados, destino, cfg["modo"]))
    return codigo


# --- Linha de comando ----------------------------------------------------------

def main():
    pai = argparse.ArgumentParser(add_help=False)
    pai.add_argument("--slug")
    pai.add_argument("--ip")
    pai.add_argument("--porta")
    pai.add_argument("--user")
    pai.add_argument("--modo", choices=["remoto", "local"])
    pai.add_argument("--dry-run", action="store_true", help="so mostra o comando que seria executado")

    p = argparse.ArgumentParser(description="Fala com o servidor (remoto por SSH ou local).")
    sub = p.add_subparsers(dest="acao", required=True)

    sub.add_parser("info", parents=[pai]).set_defaults(fn=cmd_info)

    e = sub.add_parser("exec", parents=[pai])
    e.add_argument("comando", nargs=argparse.REMAINDER)
    e.set_defaults(fn=cmd_exec)

    s = sub.add_parser("send", parents=[pai])
    s.add_argument("origem")
    s.add_argument("destino")
    s.add_argument("--conteudo", action="store_true", help="envia o que ha DENTRO da pasta, sem a pasta")
    s.add_argument("--excluir", action="append", metavar="PADRAO", help="ex.: node_modules, '*.log' (repetivel)")
    s.set_defaults(fn=cmd_send)

    args = p.parse_args()
    if getattr(args, "comando", None) and args.comando[:1] == ["--"]:
        args.comando = args.comando[1:]
    sys.exit(args.fn(args))


if __name__ == "__main__":
    main()
