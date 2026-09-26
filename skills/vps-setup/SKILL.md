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
acessível em `painel.[dominio]` de qualquer dispositivo, e o site (ainda
vazio, com uma página "em construção") em `[dominio]`.

**Esta skill não escreve conteúdo nenhum do cliente** — Money Pages,
institucionais, tema — isso é `fase2-site-astro`, que roda depois,
usando a estrutura que esta skill deixou pronta.

---

## Divisão de responsabilidade

- **`vps-setup` (esta skill):** servidor, Nginx, PM2, SSL, DNS, estrutura
  de pastas vazia do cliente.
- **`fase2-site-astro`:** conteúdo do cliente — identidade, tema, Money
  Pages, institucionais — usando a estrutura que `vps-setup` criou.
  Termina fazendo o primeiro build+deploy real por cima da estrutura vazia.
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

## PASSO 0 — Coletar credenciais do VPS

Verificar se `## Ambiente VPS` no `projeto.md` já tem `vps_ip`.
Se sim, ir para PASSO 2 (decidir bootstrap vs. novo cliente).

Se não, perguntar ao operador:

> "Para configurar o servidor, preciso das credenciais do VPS da Hostgator.
> Elas chegam no e-mail de boas-vindas da Hostgator ao contratar o plano VPS.
>
> Me passe:
> 1. **IP do servidor** (ex: `189.34.140.57`)
> 2. **Senha root** (senha do usuário root do servidor)
> 3. **Porta SSH** (padrão Hostgator VPS: `22022`)
> 4. **Domínio do site** (ex: `torrezdesentupidora.com.br`)
> 5. **Domínio do painel** (ex: `painel.torrezdesentupidora.com.br` —
>    normalmente é `painel.` + o domínio do site)
>
> ⚠️ A senha root só será usada agora para o setup inicial. Depois
> recomendo criar um usuário com chave SSH para acesso futuro."

Salvar em `projeto.md` em `## Ambiente VPS`:
```
vps_ip: [IP]
vps_porta: [porta]
vps_user: root
dominio: [dominio do site]
dominio_painel: [dominio do painel]
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
# sua própria cópia a partir daqui, com seu próprio .env)
scp -P [porta] -r painel/ root@[IP]:/opt/linkflow/painel

# Copiar o motor Astro inteiro, com os 3 temas completos (páginas,
# config e conteúdo de demonstração de cada um) — é dessa cópia que
# novo-cliente.sh tira a estrutura de cada cliente novo, e é nela que
# promover_tema.py escolhe o tema certo e apaga os outros dois. Nunca
# excluir content/ nem config/ aqui — sem eles a promoção não tem o
# que promover.
scp -P [porta] -r _astro root@[IP]:/opt/linkflow/_astro

# Executar o bootstrap — instala Node/Nginx/PM2/Certbot e já cria
# a estrutura isolada do primeiro cliente, com o tema já promovido
ssh -p [porta] root@[IP] \
  "bash /root/setup.sh [SLUG] [DOMINIO_SITE] [DOMINIO_PAINEL] [TEMA]"
```

`[TEMA]` é `base`, `tema-03` ou `tema-04` — o mesmo que já foi escolhido
na ETAPA 2 do `fase2-site-astro` (ler do `projeto.md`, nunca perguntar
de novo aqui).

O script instala e configura tudo automaticamente, e ao final já builda
o painel deste primeiro cliente e sobe o processo PM2 dele. Monitorar
o output e informar o progresso ao operador.

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

`[TEMA]` é `base`, `tema-03` ou `tema-04` — o mesmo já escolhido na
ETAPA 2 do `fase2-site-astro` (ler do `projeto.md`, nunca perguntar de
novo aqui). O script promove esse tema pra raiz e apaga os outros dois
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

## PASSO 5B — Configurar DNS na Hostgator (antes de testar o site)

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

Orientar o operador a guardar a senha em local seguro — não há
recuperação de senha automática ainda.

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

## Resumo final ao operador

```
✅ Infraestrutura configurada.

Servidor:   [IP]
Site:       https://[dominio]  (ainda vazio — "em construção")
Painel:     https://painel.[dominio]

O painel está acessível de qualquer dispositivo — computador, celular
ou tablet — sem precisar do Claude Code.

Próximo passo:
/link-flow site [slug]   → constrói o conteúdo do cliente e publica
```

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
| `promover_tema.py` falha (tema/config não encontrado) | Confirmar que `/opt/linkflow/_astro` tem os 3 temas completos (páginas, config, conteúdo de demo) — se a cópia inicial excluiu `content/`/`config/`, refazer o `scp` sem exclude |
