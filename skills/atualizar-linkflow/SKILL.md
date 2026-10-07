---
name: atualizar-linkflow
description: >
  Baixa a versão mais recente do próprio Link Flow (skills, regras do
  CLAUDE.md, motor Astro, painel, scripts) do repositório oficial no GitHub
  e reinstala as dependências. Roda o update.bat (Windows) ou update.sh
  (Linux/macOS) — nunca comandos git soltos. Invocado pelo trigger
  "atualizar o Link Flow" / "baixar a versão nova do sistema" no CLAUDE.md.
  NÃO é a mesma coisa que atualizar-cliente (que leva correções para o site
  ou painel de um cliente já publicado no VPS).
user-invokable: true
---

# atualizar-linkflow — Trazer a versão mais recente do Link Flow

O usuário **não conhece git** e não deve precisar conhecer. O trabalho todo é
do agente; o usuário só autoriza a execução do script quando o Claude Code
pedir permissão.

## Quando usar

- "atualizar o Link Flow", "atualizar o sistema", "baixar a versão nova",
  "tem atualização?", "quero as correções mais recentes do Link Flow".

**Não confundir com `atualizar-cliente`:** se o pedido citar um cliente, um
site ou o painel de um cliente ("atualizar o site do cliente X", "levar a
correção pro ar"), é a skill `atualizar-cliente`. Se for ambíguo ("atualizar"
sozinho), pergunte uma única vez: "Você quer atualizar o próprio Link Flow
(baixar a versão nova do sistema) ou levar uma correção para o site de um
cliente?"

## Passo a passo

1. **Descobrir o sistema** e rodar o script certo, **sempre** com o modo sem
   perguntas (o agente não consegue responder a perguntas do script):
   - Windows: `powershell -ExecutionPolicy Bypass -File update.ps1 -SemPerguntas`
   - Linux/macOS: `./update.sh --sem-perguntas`
   Rode na raiz da pasta do Link Flow (onde está o `CLAUDE.md`).

2. **Nunca** rode `git pull`, `git reset`, `git checkout` ou qualquer outro
   comando git por conta própria nesta pasta. O script já cuida de tudo —
   inclusive do backup do que o usuário tiver alterado e das travas de
   segurança. Se algo no script parecer errado, é defeito do script: pare e
   reporte, não contorne.

3. **Interpretar o resultado** e responder no vocabulário do usuário (nada de
   "fetch", "branch", "commit", "reset", "ff-only"):

   | O que o script disse | O que você responde |
   |---|---|
   | `Atualizado para: <versão>` | "Pronto, baixei a versão mais recente do Link Flow." |
   | `Ja estava na versao mais recente` | "Você já está com a versão mais recente." |
   | `arquivo(s) ... guardados em .backup-atualizacao\...` | Diga em uma frase que alguns arquivos seus eram diferentes da versão nova, que foram **copiados para essa pasta** antes de serem trocados, e que nada foi perdido. |
   | `branch '...' nao em 'main'` ou `commit(s) que nao estao no GitHub` | "Esta pasta é uma cópia de desenvolvimento, então não atualizei para não perder trabalho. Nada foi alterado." (Isso é esperado para quem mantém o sistema — não é erro.) |
   | `Git nao esta instalado` | Diga que falta instalar o Git, entregue o comando que o script mostrou (é a única exceção à regra de não mostrar comando) e peça que avise quando terminar. |
   | `Nao consegui acessar o GitHub` | "Não consegui acessar o GitHub agora. Confira a internet e me peça de novo." Pare aí. |
   | Qualquer outro erro | Pare, diga em uma frase o que falhou, **não** siga como se tivesse dado certo. |

4. **Depois de uma atualização bem-sucedida**, feche com duas linhas:
   - Se o `CLAUDE.md`, alguma skill ou `.claude/commands/` mudou, avise: "Feche e
     abra o Claude Code nesta pasta para carregar as regras novas."
   - Se o usuário tem clientes `site_tipo: astro` já publicados no VPS, lembre
     **só em uma frase** que o site/painel deles no servidor não muda sozinho,
     e que posso levar a correção quando ele pedir. **Nunca propague sozinho**
     (ver `atualizar-cliente`).

## O que a atualização NÃO toca

`projetos/`, `credenciais/` e `_memoria/` (dados dos clientes, acessos e
memória do GMB) ficam de fora do versionamento e **nunca** são lidos nem
sobrescritos pelo script. Pode afirmar isso ao usuário se ele perguntar.

## Arquivos que o usuário alterou

O script guarda uma cópia de qualquer arquivo do sistema que seja diferente da
versão nova em `.backup-atualizacao/<data-hora>/` antes de trocá-lo. Na
primeira atualização de quem veio de um ZIP, essa pasta pode ter vários
arquivos — em geral são só versões antigas, não edições do usuário. Se ele
quiser recuperar algo editado à mão, é só copiar de lá.
