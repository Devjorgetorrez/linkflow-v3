---
name: atualizar-cliente
description: >
  Propaga uma correção do motor Astro e/ou do painel (feita no repositório)
  para um ou mais clientes astro já publicados no VPS — sem isso, o código
  corrigido fica só na referência compartilhada e quem já foi publicado
  antes da correção continua com o bug (erro 90, Relatório de Testes 6).
  Invocado por /link-flow atualizar <slug> ou pelo trigger "atualizar
  cliente" / "atualizar clientes" no CLAUDE.md. Só se aplica a site_tipo:
  astro — WordPress (Novamira) não tem cópia de código por cliente.
user-invokable: true
---

# atualizar-cliente — Propagar correção do motor/painel para clientes já no ar

Cada cliente `site_tipo: astro` é uma cópia ISOLADA do motor e do painel
(arquitetura multi-tenant — ver `vps-setup`). Corrigir um bug no repositório
e subir a correção para a referência compartilhada (`/opt/linkflow/_astro`,
`/opt/linkflow/painel`) **não** chega automaticamente a nenhum cliente já
publicado. Essa lacuna foi a causa comum de quase todas as "reincidências"
do Relatório de Testes 6 (erro 90): painéis em versão antiga sem robots.txt
nem favicon, sites com CSS desatualizado, WhatsApp genérico.

Esta skill existe para fechar essa lacuna, com backup automático e registro
de versão por cliente.

---

## Quando usar

- O usuário pede para "atualizar o site do cliente X", "levar a correção pro
  ar", "sincronizar o painel do Y com o repositório".
- Depois de subir uma correção de código para a referência compartilhada
  (`/opt/linkflow`, mesmo tar+ssh de sempre) e o usuário confirmar que quer
  propagar para clientes específicos — **nunca propagar sozinho, sem pedir**:
  reiniciar o painel/site de um cliente real é uma ação visível a quem usa o
  site naquele momento.
- Para auditar quem está desatualizado antes de decidir o que propagar.

**Pré-requisito, sempre confira antes**: a referência compartilhada em
`/opt/linkflow/_astro` e `/opt/linkflow/painel` já precisa estar com a
correção. Esta skill só propaga dali para o cliente — nunca busca nada na
internet nem no repositório local desta máquina.

---

## PASSO 1 — Ver quem está desatualizado

```bash
ssh -p [porta] root@[IP] "bash /opt/linkflow/scripts/vps/status-clientes.sh"
```

Lista cada cliente, a versão registrada (`versao.json`, gravado pela última
atualização) e se bate com a versão atual da referência (`painel/package.json`).
Cliente nunca atualizado por este mecanismo aparece como `nunca`.

---

## PASSO 2 — Atualizar um cliente

```bash
ssh -p [porta] root@[IP] "bash /opt/linkflow/scripts/vps/atualizar-cliente.sh [SLUG]"
```

O que o script faz, nesta ordem:

1. **Backup** de `_astro/` e `painel/` do cliente (`.tar.gz` em
   `/opt/linkflow/backups/<slug>/`) — sem `node_modules`/`dist`/`.astro`
   (são gerados de novo, só inflariam o backup).
2. Lê o tema em uso (`_astro/tema-ativo.json`, gravado por `promover_tema.py`
   na criação do cliente) e re-promove o **mesmo** tema a partir da
   referência fresca.
3. Devolve o **conteúdo e o config reais do cliente** por cima da cópia
   fresca (a referência só tem demonstração) — nada do texto/dados do
   cliente é perdido.
4. Builda o motor, **limpando o cache do Astro antes** (`.astro`,
   `node_modules/.astro` — erro 87: sem isso, conteúdo apagado pode voltar
   ao ar) e publica o `dist/` sem tocar em `/midia`.
5. Builda o painel a partir do código fresco, mantendo o `.env` e os dados
   do cliente (`usuarios.json`, `dados/`) intocados.
6. Reinicia o processo PM2 do painel **só depois de tudo pronto** — nunca
   no meio do caminho.
7. Grava `versao.json` no cliente com a versão nova e a data.

**Se qualquer passo falhar**, o script restaura o backup sozinho e avisa —
nunca deixa o cliente pela metade entre código antigo e novo. Reportar a
falha ao usuário em uma frase, com o que o log do build mostrou; não tentar
adivinhar o conserto no lugar do script (mesma regra de `vps-setup › Regra:
script contornado é problema a reportar`).

---

## PASSO 3 — Confirmar

Depois de rodar, checar que o site e o painel do cliente respondem
normalmente (mesmo teste do fim de `novo-cliente.sh`/`fase2-site-astro`).
Rodar `status-clientes.sh` de novo para confirmar que o cliente aparece
"em dia".

---

## Vários clientes de uma vez

Sem loop automático nesta skill — cada cliente é uma ação visível própria.
Rodar o PASSO 2 uma vez por slug, confirmando o resultado antes do próximo.
Se o usuário pedir para atualizar "todos", perguntar se é literal (todos os
clientes astro do VPS) antes de rodar em sequência — nunca assumir.

---

## Degradação

| Situação | O que fazer |
|---|---|
| `_astro/tema-ativo.json` ausente no cliente | Cliente foi criado antes desse marcador existir — não rodar o script; registrar o tema manualmente no `tema-ativo.json` primeiro (ver `promover_tema.py`) |
| Build falha (motor ou painel) | O script já restaura o backup sozinho; reportar o erro do log ao usuário, não repetir a atualização sem entender a causa |
| `versao.json` de um cliente não bate com nenhuma versão conhecida | Rodar `atualizar-cliente.sh` normalmente — ele sempre grava a versão atual da referência, corrige o registro |
