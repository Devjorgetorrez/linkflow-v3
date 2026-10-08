---
name: painel-senha
description: >
  Redefine a senha de um usuário do painel SiteFlow quando o usuário esqueceu
  ou perdeu o acesso ("esqueci a senha do painel", "redefina a senha do
  usuário X", "não consigo entrar no painel", "resetar senha do painel"). O
  pedido normalmente vem do botão "Esqueci minha senha" da tela de login do
  painel, já com o e-mail do usuário. Não há recuperação por e-mail: a
  redefinição é feita aqui, no servidor do site, por quem tem acesso a ele.
---

# painel-senha — Redefinir a senha de um usuário do painel

> **Antes de qualquer comando no servidor, leia `skills/vps-setup/ambientes.md`.**
> O Link Flow roda em 3 cenários (Windows → VPS externa; Linux na VPS → ela
> mesma; Linux na VPS → outra VPS). Os `ssh`/`scp`/`rsync` abaixo mostram a
> forma remota: **nunca os execute como estão** — traduza pelo
> `scripts/vps/lf_vps.py` (tabela no `ambientes.md`), que decide sozinho entre
> SSH e execução local.

O painel **não** tem "esqueci minha senha" por e-mail, de propósito: o painel
só aceita a chave de API para criar o primeiro administrador, e uma rota de
reset abriria uma porta a mais. Quem redefine é o Claude Code, com o mesmo
acesso ao servidor que já usou para publicar o site. Isto é o caminho único.

## Regras

- **Só o site deste projeto.** Nunca redefina a senha de usuário de outro
  cliente, mesmo que o servidor seja compartilhado.
- **A senha provisória aparece uma única vez, na resposta ao usuário.** Nunca
  salve em `projeto.md`, em arquivo, em log, nem repita em respostas
  seguintes.
- **Uma ação por resposta:** dizer a senha e onde entrar. Nada de relatório
  de servidor (caminho de arquivo, backup, PM2) na fala ao usuário.
- **Não reative usuário desativado.** Isso é decisão de um administrador, no
  painel.
- **Não invente o e-mail.** Se o pedido não trouxe o e-mail, pergunte
  (uma pergunta só): "Qual é o e-mail que você usa para entrar no painel?"

## PASSO 1 — Achar o site

Listar `projetos/*/projeto.md`. Com um só projeto, usar esse; com mais de um,
perguntar qual. Ler `## Ambiente VPS`:

- **Site publicado (VPS configurado)** — `vps_ip`, `vps_porta`,
  `vps_cliente_dir` e o domínio do painel preenchidos → PASSO 2A.
- **Painel só local (sem VPS)** → PASSO 2B.

## PASSO 2A — Redefinir no servidor

Conectar como no `vps-setup` (PASSO 0 e 1): a senha root só é usada nesta
sessão e nunca é salva. Depois:

```bash
scp -P [vps_porta] scripts/painel_redefinir_senha.cjs root@[vps_ip]:/tmp/
ssh -p [vps_porta] root@[vps_ip] \
  'NODE_PATH=[vps_cliente_dir]/painel/node_modules node /tmp/painel_redefinir_senha.cjs [vps_cliente_dir]/usuarios.json "[email]"; c=$?; rm -f /tmp/painel_redefinir_senha.cjs; exit $c'
```

Não é preciso reiniciar o painel: o arquivo de usuários é lido a cada login.

## PASSO 2B — Redefinir no painel local

```bash
NODE_PATH=painel/node_modules node scripts/painel_redefinir_senha.cjs "[LINKFLOW_DIR]/usuarios.json" "[email]"
```

`[LINKFLOW_DIR]` é a pasta do site que o painel local usa (a mesma do `.env`).

## PASSO 3 — Ler o resultado

O script imprime `USUARIO=` e `SENHA_PROVISORIA=` e termina com um código:

| Código | Significado | O que dizer ao usuário |
|---|---|---|
| 0 | Senha redefinida | Passar a senha provisória (PASSO 4) |
| 2 | E-mail não encontrado | "Não achei esse e-mail no painel. Os cadastrados são: [lista parcialmente oculta que o script imprime]. Qual é o seu?" |
| 3 | Usuário desativado | "Esse acesso está desativado. Um administrador do painel precisa reativá-lo em Usuários." |
| 1 | Erro | Mostrar a mensagem do script em uma frase e parar; não repetir em laço |

## PASSO 4 — Entregar a senha

Resposta ao usuário (exatamente esta forma, uma ação):

> "Pronto. Sua senha provisória é `[SENHA]`.
> Entre em https://painel.[dominio]/login e troque por uma sua em **Perfil**.
> Ela só aparece aqui — se perder, é só me pedir de novo."

Em painel local, o endereço é o do `npm run dev` (`http://localhost:3210`).

## Alternativa que não passa por aqui

Se outro administrador do painel ainda consegue entrar, ele mesmo pode trocar a
senha de qualquer usuário em **Usuários › [usuário] › Senha**. Só mencione isso
se o usuário disser que existe outro administrador; não ofereça como "opção"
quando ele já pediu a redefinição (caminho único).
