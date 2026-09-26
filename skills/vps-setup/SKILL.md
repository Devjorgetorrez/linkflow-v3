---
name: vps-setup
description: >
  Configura a infraestrutura de VPS Hostgator para hospedar sites e
  painéis LinkFlow — multi-cliente, um processo PM2 isolado por cliente.
  Bootstrap do servidor (primeira vez) ou adição de um novo cliente a um
  VPS já configurado. Cuida do servidor (Node, Nginx, PM2, SSL, DNS) —
  não escreve conteúdo do cliente, isso é `fase2-site-astro`. Invocado
  por /link-flow vps <slug>, ou automaticamente por /link-flow site
  <slug> quando o cliente ainda não tem VPS configurado.
user-invokable: true
---

# vps-setup — Infraestrutura de VPS para LinkFlow

Prepara o servidor: instala o necessário, cria a estrutura isolada do
cliente (pasta própria, porta própria, processo PM2 próprio), configura
Nginx e SSL, orienta o DNS. Ao final, o painel de gestão do cliente está
acessível em `painel.[dominio]` de qualquer dispositivo.

**Só roda no Marco 2**, depois que o usuário aprovou o visual na prévia local
(`visual_aprovado: sim` no `projeto.md`) e o gate de publicação passou (domínio
real e e-mail). Nunca configure servidor antes disso — o usuário vê o site
primeiro, no `localhost`, e só então gasta com domínio e hospedagem.

**Duas partes, chamadas em momentos diferentes pela `fase2-site-astro` (ETAPA 6):**

- **Parte A — Servidor (PASSOS 0 a 4):** prepara a máquina. O usuário só fornece
  os dados do servidor, uma vez.
- **Parte B — Endereço, SSL e acesso (PASSOS 5B a 7):** roda **depois** que o site
  foi enviado, porque o DNS e o SSL só fazem sentido com o site já lá. Uma tarefa
  por vez: primeiro o DNS; só depois do endereço apontar, SSL e o acesso ao painel.

**Conversa com o usuário** (regras do `CLAUDE.md › Rotina em marcos`): um pedido
por resposta; estado em duas linhas (`Onde estamos` / `Falta para o próximo
marco`); vocabulário do usuário — "o site está no servidor, mas o endereço ainda
não abre", nunca PM2, porta, 307 ou propagação. Os comandos SSH abaixo são para
você executar, não para mostrar.

**Esta skill não escreve conteúdo nenhum do cliente** — Money Pages,
institucionais, layout — isso é `fase2-site-astro`.

---

## Divisão de responsabilidade

- **`vps-setup` (esta skill):** servidor, Nginx, PM2, SSL, DNS, estrutura
  de pastas vazia do cliente.
- **`fase2-site-astro`:** o site do cliente — identidade, layout, Money
  Pages, institucionais. Constrói e aprova no `localhost` (Marco 1) e, no
  Marco 2, envia o site para a estrutura que `vps-setup` criou.
- **`site-atualizar`:** republica o site depois que conteúdo mudou fora
  do fluxo de blog (Fase 3, edição pelo painel).

---

## Regra: script contornado é problema a reportar

Os scripts de `scripts/vps/` são o caminho único. Se um deles falhar, ou se
for necessário fazer à mão o que ele faria, isso **não é um detalhe da
execução**: é defeito do script. Pare, diga em uma frase o que o script
tentou fazer de errado, e registre no resumo final como
**"Problema no instalador a corrigir"** — nunca como nota de rodapé nem em
silêncio. Nunca peça ao operador para rodar o mesmo passo manualmente sem
antes reportar o defeito.

## Quando usar esta skill

- Primeiro setup de um VPS novo (nenhum cliente configurado ainda)
- Adicionar um novo cliente a um VPS já configurado
- Diagnosticar ou corrigir problemas de infraestrutura no servidor

---

## PASSO 0 — Coletar credenciais do VPS (Parte A)

O domínio e o e-mail **já foram coletados** no gate de publicação — não
pergunte de novo. Ler `dominio` e `dominio_painel` do `projeto.md`.

Verificar se `## Ambiente VPS` no `projeto.md` já tem `vps_ip`.
Se sim, ir para PASSO 2 (decidir bootstrap vs. novo cliente).

Se não, **um único pedido** com os três dados do e-mail da Hostgator:

> "Para colocar o site no ar, preciso dos dados do servidor que a Hostgator
> mandou no e-mail de boas-vindas do plano VPS. Me passe:
> 1. **IP do servidor** (ex: `189.34.140.57`)
> 2. **Senha root**
> 3. **Porta SSH** (o padrão da Hostgator VPS é `22022`)
>
> Onde estamos: visual aprovado, falta o servidor.
> Falta para o próximo marco: esses três dados."

A senha root só será usada nesta sessão. Depois, recomende criar um usuário
com chave SSH para o acesso futuro.

Salvar em `projeto.md` em `## Ambiente VPS`:
```
vps_ip: [IP]
vps_porta: [porta]
vps_user: root
dominio: [dominio do site]            (já registrado no gate)
dominio_painel: painel.[dominio]
```

**Nunca salvar a senha root no projeto.md nem em nenhum arquivo.**
Usar apenas durante a sessão atual.

---

## PASSO 1 — Testar conexão SSH

Antes de qualquer coisa, verificar que o SSH está funcionando:

```bash
ssh -p [porta] -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
  root@[IP] "echo 'SSH OK'"
```

Se retornar "SSH OK" → continuar.

Se falhar:
> "Não consegui conectar via SSH. Verifique:
>
> - **IP correto:** está no Portal Hostgator → VPS e Dedicados → seu plano
> - **Porta correta:** VPS Hostgator usa porta `22022` por padrão
> - **Senha correta:** é a senha root que chegou no e-mail de boas-vindas
> - **Firewall:** alguns provedores de internet bloqueiam SSH — tente
>   de outra rede ou pelo painel VNC da Hostgator
>
> Me passe os dados corrigidos."

Tentar até 3 vezes com dados diferentes antes de parar.

---

## PASSO 2 — Verificar se é bootstrap ou novo cliente

```bash
ssh -p [porta] root@[IP] "[ -d /opt/linkflow/painel ] && echo 'JA_CONFIGURADO' || echo 'NOVO'"
```

**Se retornar `NOVO`** → ir para PASSO 3 (bootstrap completo do VPS).
**Se retornar `JA_CONFIGURADO`** → ir para PASSO 4 (adicionar cliente).

---

## PASSO 3 — Bootstrap do VPS (primeira vez, servidor vazio)

Cada cliente roda seu **próprio processo PM2**, sua **própria porta**,
sua **própria pasta isolada** em `/opt/linkflow/clientes/<slug>/` — sem
compartilhar dados entre clientes. O primeiro cliente também faz o
bootstrap da infraestrutura base (Node, Nginx, PM2, código-fonte do
painel e do motor Astro).

```bash
# Copiar scripts de infraestrutura
scp -P [porta] scripts/vps/setup.sh root@[IP]:/root/
scp -P [porta] scripts/vps/novo-cliente.sh root@[IP]:/root/
scp -P [porta] scripts/vps/ssl-cliente.sh root@[IP]:/root/
scp -P [porta] scripts/promover_tema.py root@[IP]:/root/
ssh -p [porta] root@[IP] "mkdir -p /opt/linkflow/scripts && mv /root/promover_tema.py /opt/linkflow/scripts/"
ssh -p [porta] root@[IP] "mkdir -p /opt/linkflow"

# Copiar o código-fonte do painel (compartilhado — cada cliente builda
# sua própria cópia a partir daqui, com seu próprio .env).
# SEM node_modules/.next: o node_modules local (Windows/Mac) tem binários
# nativos que não rodam no Linux, e o novo-cliente.sh só roda `npm ci` quando
# a pasta NÃO existe — copiar a local quebraria o build do painel.
tar -cf - --exclude=node_modules --exclude=.next --exclude='*.log' painel   | ssh -p [porta] root@[IP] "mkdir -p /opt/linkflow && tar -xf - -C /opt/linkflow"

# Copiar o motor Astro inteiro, com TODOS os layouts (páginas, config e
# conteúdo de demonstração de cada um) — é dessa cópia que novo-cliente.sh
# tira a estrutura de cada cliente novo, e é nela que promover_tema.py
# escolhe o layout certo e apaga os outros. Nunca excluir content/ nem
# config/ aqui — sem eles a promoção não tem o que promover.
# SEM node_modules/dist/.astro (mesmo motivo do painel: dependências e build
# são gerados no próprio servidor).
tar -cf - --exclude=node_modules --exclude=dist --exclude=.astro _astro   | ssh -p [porta] root@[IP] "tar -xf - -C /opt/linkflow"

# Executar o bootstrap — instala Node/Nginx/PM2/Certbot e já cria
# a estrutura isolada do primeiro cliente, com o tema já promovido
ssh -p [porta] root@[IP] \
  "bash /root/setup.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [TEMA]"
```

`[TEMA]` é o layout que o usuário aprovou na prévia: `base`, `tema-03`,
`tema-04`, `tema-05`, `tema-06` ou `tema-07`. Ler de
`projetos/<slug>/site/_astro/tema-ativo.json` (campo `tema`) — o mesmo do
`tema_pasta` do `projeto.md`. Nunca perguntar de novo, nunca passar outro valor:
o servidor precisa ter o mesmo layout do site local que foi aprovado.

O script instala e configura tudo automaticamente, e ao final já builda
o painel deste primeiro cliente e sobe o processo PM2 dele. Monitore o
output, mas ao usuário diga só: "estou preparando o servidor, leva de 5 a
15 minutos".

**O bootstrap leva entre 5 e 15 minutos** dependendo da velocidade do VPS.

Após o script terminar, verificar que o painel do cliente está rodando:

```bash
ssh -p [porta] root@[IP] "pm2 status"
```

Deve aparecer `painel-[SLUG]` com status `online`.

Ir para PASSO 5B (DNS) — o bootstrap já criou o primeiro cliente, não
repetir o PASSO 4 para ele.

---

## PASSO 4 — Adicionar novo cliente a um VPS já configurado

```bash
# novo-cliente.sh chama ssl-cliente.sh, que precisa estar na mesma pasta
scp -P [porta] scripts/vps/novo-cliente.sh scripts/vps/ssl-cliente.sh root@[IP]:/root/
ssh -p [porta] root@[IP] \
  "bash /root/novo-cliente.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [TEMA]"
```

`[TEMA]` vem de `projetos/<slug>/site/_astro/tema-ativo.json` (campo `tema`),
como no PASSO 3. O script promove esse layout pra raiz e apaga os outros
automaticamente — nenhuma ação extra necessária aqui.

Isso cria, isolado desse cliente:
- Pasta própria em `/opt/linkflow/clientes/[SLUG]/` (dados, mídia,
  `usuarios.json` vazio, motor Astro próprio)
- Porta própria (a próxima disponível, a partir de 3210)
- Processo PM2 próprio (`painel-[SLUG]`)
- Bloco Nginx próprio para o site e para o painel
- SSL gerado só para os endereços cujo DNS já aponta para este servidor (o script confere antes; DNS pendente não é erro, o SSL fica para o PASSO 6)

Verificar que o processo subiu:

```bash
ssh -p [porta] root@[IP] "pm2 status | grep [SLUG]"
```

Anotar a **API Key** que o script imprime no final — vai ser necessária
no PASSO 7 (nesse caso, pular o PASSO 7 de criar as chaves, já existem).

---

## PASSO 5B — Configurar DNS na Hostgator (Parte B — é o ÚNICO pedido desta resposta)

**Antes de testar se o site está no ar, o DNS precisa apontar para o IP do VPS.**
Se o operador ainda não fez isso, orientar agora:

> "Para o site e o painel ficarem acessíveis nos domínios, precisamos
> configurar o DNS. Veja o passo a passo na Hostgator:
>
> **Passo 1 — Acessar o painel DNS**
> Portal Hostgator → menu lateral **Domínios** → localizar o domínio
> do cliente → clicar em **Configurar domínio**
>
> **Passo 2 — Abrir a Zona de DNS**
> Na tela de configuração, role até a seção
> **"Fazer configuração avançada na Zona de DNS"** e clique em
> **"Mostrar configuração manual da Zona de DNS"**
> Vai aparecer um aviso — clique em **"Ok, continuar para a Zona de DNS"**
>
> **Passo 3 — Adicionar registro para o site**
> Clique em **"Adicionar Registro"** e preencha:
> - **Tipo:** A
> - **Nome:** `@` (domínio raiz) ou o subdomínio, se for o caso
> - **Classe:** IN (já vem preenchido)
> - **TTL:** 14400 (já vem preenchido)
> - **IPv4:** `[IP do VPS]`
>
> Clique em **Adicionar**.
>
> **Passo 4 — Adicionar registro para o painel**
> Clique em **"Adicionar Registro"** novamente e preencha:
> - **Tipo:** A
> - **Nome:** `painel`
> - **IPv4:** `[IP do VPS]` (mesmo IP do passo anterior)
>
> Clique em **Adicionar**.
>
> Após salvar, aguardar a propagação do DNS — pode levar entre
> alguns minutos e 4 horas. Me avise quando terminar."

**Para verificar se o DNS propagou** (sem precisar esperar):

```bash
dig [DOMINIO] +short
dig painel.[DOMINIO] +short
```

Se retornar o IP do VPS nos dois, o DNS propagou.

**O deploy do conteúdo do cliente não depende do DNS** — o
`fase2-site-astro` pode rodar e publicar mesmo com o DNS ainda
propagando. Só o domínio é que vai demorar a resolver.

---

## PASSO 6 — SSL (depois que o DNS apontar)

O `novo-cliente.sh` e o `setup.sh` só pedem certificado para os endereços
cujo DNS **já** aponta para o servidor. Se o DNS ainda não tinha propagado,
o script termina normalmente com `SSL: pendente` (ou `parcial`) — isso não
é falha, é o estado esperado enquanto o DNS não propaga.

Quando o operador avisar que criou os registros de DNS (PASSO 5B) e o `dig`
mostrar o IP do servidor, gerar o SSL:

```bash
ssh -p [porta] root@[IP] \
  "bash /root/ssl-cliente.sh [SLUG] [DOMINIO] painel.[DOMINIO]"
```

A última linha da saída é `SSL_STATUS=ok|parcial|pendente|falhou`:
- `ok` → confirmar com `curl -s -o /dev/null -w "%{http_code}" "https://[DOMINIO]"`
  (esperado `200`, `301` ou `302`) e o mesmo para `https://painel.[DOMINIO]`.
- `parcial` / `pendente` → o script lista quais endereços ainda não apontam
  para o servidor. Voltar ao PASSO 5B para o registro que falta.
- `falhou` → mostrar a saída do certbot ao operador e parar; não repetir em laço.

Nunca passar um e-mail inventado ao certbot. Sem e-mail informado pelo
operador, o script emite sem e-mail de contato.

---

## PASSO 7 — Criar primeiro usuário administrador

**Só depois** do DNS apontar e do SSL estar `ok` (PASSO 6) — nunca junto com o
pedido de DNS. **Pergunte sempre** qual e-mail o usuário quer para o primeiro
administrador do painel — nunca assuma o `email_institucional`; o primeiro
acesso fica a critério de quem está montando o negócio. É um pedido só:
"Qual e-mail você quer usar para entrar no painel?". A senha inicial é gerada por
você: forte, sem caracteres ambíguos, exibida **uma única vez** na resposta final
e nunca gravada em arquivo.

Se o PASSO 3 ou 4 já imprimiu a API Key no final (fica registrada ali),
usar essa mesma chave. Senão, ler do arquivo do cliente:

```bash
ssh -p [porta] root@[IP] "grep PAINEL_API_KEY /opt/linkflow/clientes/[SLUG]/.env"
```

Criar o primeiro admin via API (o painel já está no ar, não precisa
rebuildar nem reiniciar nada):

```bash
curl -s -X POST https://painel.[DOMINIO]/api/usuarios \
  -H "x-api-key: [PAINEL_API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "podeAcessar": true,
    "acesso": {"emailLogin": "[email]", "papel": "administrador", "ativo": true},
    "podeAssinar": true,
    "senha": "[senha]",
    "autoria": {"nomePublico": "[Nome do operador]"}
  }'
```

Orientar o operador a guardar a senha em local seguro. O painel não recupera
senha por e-mail: se ela for perdida, o botão "Esqueci minha senha" da tela
de login gera um pedido que ele cola aqui, e a skill `painel-senha` redefine a
senha pelo servidor.

Confirmar que o login funciona:
> "Acesse https://painel.[dominio]/login e entre com o e-mail e senha
> que acabamos de criar."

---

## Registrar no projeto.md

Após o setup (bootstrap ou novo cliente) completo:

```markdown
## Ambiente VPS

vps_ip: [IP]
vps_porta: [porta]
vps_user: root
dominio: [dominio]
dominio_painel: [dominio_painel]
vps_cliente_dir: /opt/linkflow/clientes/[slug]
vps_site_dir: /var/www/[slug]
vps_porta_painel: [porta atribuída]
tema_promovido: [base | tema-03 | tema-04]
vps_setup: concluido em [data]
ssl: ativo
dns_status: apontado ou aguardando_propagacao
```

---

## Resumo final ao usuário

A Parte B termina devolvendo o controle à `fase2-site-astro`, que fecha o Marco 2
(ETAPA 7) com a lista de pendências. **Não** despeje relatório de servidor aqui:
sem IP, sem PM2, sem porta, sem "conferência de saída".

Se o endereço ainda não abre (DNS em andamento), a resposta é uma só:

> "O site já está no servidor, mas o endereço ainda não abre — isso pode levar
> algumas horas depois de criar os registros de DNS. Me avise quando quiser que eu
> confira de novo.
>
> Onde estamos: site enviado, aguardando o endereço.
> Falta para o próximo marco: o endereço passar a abrir."

Quando abrir e o painel estiver criado:

> "Seu site está no ar em https://[dominio].
> Seu painel: https://painel.[dominio] — entre com **[email]** e a senha
> provisória `[SENHA]`, e troque por uma sua em Perfil. Ela só aparece aqui.
> Se você esquecer a senha depois, é só usar "Esqueci minha senha" na tela de
> login e me colar o pedido."

---

## Comandos SSH úteis para manutenção

```bash
# Ver status de todos os clientes
ssh -p [porta] root@[IP] "pm2 status"

# Ver logs de um cliente específico
ssh -p [porta] root@[IP] "pm2 logs painel-[SLUG]"

# Reiniciar o painel de um cliente após atualização
ssh -p [porta] root@[IP] \
  "cd /opt/linkflow/clientes/[SLUG]/painel && pm2 restart painel-[SLUG]"

# Ver uso de recursos do servidor (relevante para decidir se precisa
# de upgrade antes de adicionar mais um cliente)
ssh -p [porta] root@[IP] "bash /opt/linkflow/scripts/vps/checar-capacidade.sh"

# Ver espaço em disco
ssh -p [porta] root@[IP] "df -h"
```

---

## Degradação

| Situação | Ação |
|---|---|
| SSH não conecta | Verificar IP, porta e senha — tentar VNC no portal Hostgator |
| Script falha no meio | Ler o output do erro, corrigir e rodar de novo — `novo-cliente.sh` verifica se o cliente já existe antes de recriar |
| Painel não sobe (PM2 offline) | `ssh ... "pm2 logs painel-[SLUG] --lines 50"` para ver o erro |
| DNS não propagou | Aguardar até 4h — verificar configuração no registrador do domínio |
| SSL `pendente`/`parcial` | DNS ainda não aponta para o servidor — normal; rodar `ssl-cliente.sh` (PASSO 6) depois que o `dig` mostrar o IP |
| Espaço em disco insuficiente | `df -h` para diagnóstico — considerar upgrade de storage antes de mais um cliente, ver `checar-capacidade.sh` |
| VPS sem capacidade para mais um cliente | Rodar `checar-capacidade.sh` antes de `novo-cliente.sh` — orientar upgrade de RAM se necessário |
| `promover_tema.py` falha (tema/config não encontrado) | Confirmar que `/opt/linkflow/_astro` tem todos os layouts completos (páginas, config, conteúdo de demo) — se a cópia inicial excluiu `content/`/`config/`, refazer o `scp` sem exclude |
