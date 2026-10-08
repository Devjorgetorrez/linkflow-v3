# Ambientes de execução — onde o agente roda x onde o site vai morar

O Link Flow roda em **três cenários**. As skills `vps-setup`, `fase2-site-astro`,
`site-publicar`, `site-atualizar`, `atualizar-cliente` e `painel-senha` valem
para os três; este arquivo é a fonte única do que muda em cada um.

| # | Onde o usuário conversa com o agente | Onde o site vai ficar | Fala com o servidor por | Prévia do Marco 1 |
|---|---|---|---|---|
| 1 | Windows (Claude Desktop, aba Code) | VPS externa | SSH (`remoto`) | `http://localhost:4321` |
| 2 | Linux, **dentro** da VPS dele | **a mesma** VPS | comando local, sem SSH (`local`) | `http://<IP-da-VPS>:4321` |
| 3 | Linux, dentro de uma VPS dele | **outra** VPS | SSH (`remoto`) | `http://<IP-desta-VPS>:4321` |

macOS com Claude Desktop se comporta como o cenário 1.

## 1. Como o agente descobre o cenário

Duas perguntas, nessa ordem. **A primeira é sempre automática.**

1. **Onde eu estou rodando?** `uname -s` (ou `$env:OS`): Windows ou macOS →
   cenário 1, **sem perguntar nada**. Linux → cenários 2 ou 3.
2. **Só no Linux**, e só uma vez por cliente, uma pergunta (é o único jeito de
   saber, porque a mesma máquina pode servir de "casa" do agente ou ser só o
   ponto de partida):

   > "O site vai ficar nesta mesma máquina em que estamos conversando, ou em
   > outro servidor?"

   - "nesta mesma" → cenário 2: gravar `vps_modo: local` no `## Ambiente VPS`.
   - "outro servidor" → cenário 3: gravar `vps_modo: remoto` e seguir o PASSO 0
     normal do `vps-setup` (pede IP/senha/porta).

Depois de gravado, **nunca perguntar de novo**: o `projeto.md` é a fonte de verdade.
Se `vps_modo` estiver vazio, o `lf_vps.py` ainda decide sozinho comparando
`vps_ip` com os endereços desta máquina — mas só funciona com `vps_ip`
preenchido, por isso a pergunta acima existe.

## 2. Como falar com o servidor: sempre pelo `lf_vps.py`

Os exemplos nas skills mostram a forma **remota** (`ssh`, `scp`, `rsync`)
porque é a mais legível. **Nunca execute esses comandos como estão.** Traduza
pela tabela, e o script decide sozinho se vai por SSH ou se roda local.

Use `python` no Windows e `python3` no Linux (muitos Ubuntu/Debian não têm `python`).

| A skill mostra | Você roda |
|---|---|
| `ssh -p P root@IP "cmd"` | `python3 scripts/vps/lf_vps.py exec --slug <slug> "cmd"` |
| `ssh -p P root@IP << REMOTE … REMOTE` | `python3 scripts/vps/lf_vps.py exec --slug <slug> "bash -s" << REMOTE … REMOTE` (mantenha as aspas do `REMOTE` como estão na skill) |
| `scp -P P arq root@IP:/destino/` | `python3 scripts/vps/lf_vps.py send --slug <slug> arq /destino` |
| `scp -P P -r pasta root@IP:"dir/"` | `python3 scripts/vps/lf_vps.py send --slug <slug> pasta dir` |
| `rsync -avz -e "ssh -p P" origem/ root@IP:dest/` | `python3 scripts/vps/lf_vps.py send --slug <slug> origem dest --conteudo` (reenvia tudo; não é incremental) |
| `tar -cf - --exclude=X pasta \| ssh … "tar -xf - -C DIR"` | `python3 scripts/vps/lf_vps.py send --slug <slug> pasta DIR --excluir X` |

- Antes de o servidor estar no `projeto.md` (PASSO 1 do `vps-setup`), troque
  `--slug <slug>` por `--ip <IP> --porta <porta>` (e `--modo local` no cenário 2).
- `send ORIGEM DESTINO` coloca a origem **dentro** de DESTINO, com o mesmo nome
  (`send painel /opt/linkflow` → `/opt/linkflow/painel`). Com `--conteudo`,
  coloca só o que há dentro da pasta. Arquivos `.sh`/`.py` chegam executáveis.
- `info --slug <slug>` mostra o modo, o IP e **por que** esse modo foi escolhido.
- Em modo `local`, se quem roda não é root mas o projeto pede `vps_user: root`,
  o script usa `sudo -n`. Se o sudo pedir senha, ele para e diz isso: avise o
  usuário em uma frase e pare (não tente contornar).

## 3. O que muda no `vps-setup` (PASSO 0 e PASSO 1)

- **Cenários 1 e 3** (`remoto`): como está — pede IP, senha root e porta,
  autoriza a chave com `autorizar_chave.py`, testa a conexão.
- **Cenário 2** (`local`): **não existe** senha, porta SSH nem chave a autorizar
  — a máquina é a própria. Portanto:
  1. **Não** pedir IP, senha nem porta ao usuário, **não** rodar
     `autorizar_chave.py`.
  2. Descobrir o IP público automaticamente (ele é necessário para o usuário
     criar o registro DNS): `curl -fsS https://ifconfig.me` e, se falhar,
     `hostname -I | awk '{print $1}'`. Gravar em `vps_ip`.
  3. Gravar no `## Ambiente VPS`: `vps_modo: local`, `vps_ip: <o descoberto>`,
     `vps_user: <usuário atual, id -un>`. (`vps_porta` não se aplica.)
  4. O "teste de conexão" do PASSO 1 vira `lf_vps.py info --slug <slug>` mais um
     `lf_vps.py exec --slug <slug> "echo OK; id -un"`.
  5. Antes de qualquer mudança no servidor, a regra da skill continua valendo:
     **pedir autorização**. O agente está dentro da máquina, então um erro aqui
     derruba a própria sessão: nunca reiniciar o Nginx/PM2 sem avisar, e nunca
     rodar o `setup.sh` num servidor que já tem outros clientes sem passar pelo
     PASSO 2 (decidir bootstrap x novo cliente).

## 4. Prévia do Marco 1 quando o navegador do usuário NÃO está na máquina do agente

No cenário 1 o usuário e o agente estão no mesmo computador, então
`http://localhost:4321` funciona. Nos cenários 2 e 3 o agente roda numa VPS:
`localhost` ali é a VPS, e o navegador do usuário não alcança. Por isso:

1. **Detecte:** Linux **sem** `$DISPLAY` nem `$WAYLAND_DISPLAY` → prévia remota.
2. **Suba a prévia aberta** (`--host 0.0.0.0` em vez de `127.0.0.1`).
3. **Libere a porta** (só se houver firewall): `ufw status` ativo → `ufw allow
   4321/tcp` (e `4322/tcp` se a vitrine for pedida). Sem `ufw`/firewall ativo,
   não faça nada. Se não for root, use `sudo -n`; sem permissão, diga em uma
   frase que a porta não pôde ser liberada.
4. **IP público:** o mesmo do passo acima (`curl -fsS https://ifconfig.me`).
5. **Diga ao usuário** `http://<IP>:4321` (e `:4322/catalogo` para a vitrine),
   não `localhost`. Um único pedido, como sempre.
6. **Ao fim do Marco 1** (depois de gravar `visual_aprovado: sim`, ou se o
   usuário desistir): **pare** o servidor da prévia e da vitrine e **feche** a
   porta que você abriu (`ufw delete allow 4321/tcp`). A prévia é um site
   inacabado, visível a qualquer um que saiba o endereço — não deve ficar no ar.
7. Se o link não abrir (acesso bloqueado pelo provedor, fora do `ufw`), diga em
   uma frase "o endereço da prévia não abriu daqui; a hospedagem pode estar
   bloqueando o acesso" e **pare** — não improvise outra solução sem avisar.
   (Vocabulário do usuário: nada de "porta" na conversa; o número da porta só
   aparece dentro do endereço.)

## 5. O que cada skill muda em cada cenário

| Skill | Cenário 1 e 3 | Cenário 2 |
|---|---|---|
| `vps-setup` | como escrito | sem senha/porta/chave (item 3 acima) |
| `fase2-site-astro` | como escrito; prévia por IP só no 3 | prévia por IP (item 4) |
| `site-publicar`, `site-atualizar` | via `lf_vps.py` (remoto) | via `lf_vps.py` (local): `send` copia, `exec` faz o build |
| `atualizar-cliente` | via `lf_vps.py` (remoto) | via `lf_vps.py` (local) |
| `painel-senha` | via `lf_vps.py` (remoto) | via `lf_vps.py` (local) |

Em todos os cenários valem as regras do `CLAUDE.md`: uma ação por resposta,
vocabulário do usuário (nada de PM2, porta, build), falha vira alerta.
