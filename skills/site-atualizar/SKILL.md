---
name: site-atualizar
description: >
  Republica o site Astro do cliente depois que conteúdo mudou fora do
  fluxo de blog — Money Pages e páginas institucionais escritas na Fase 3,
  edição feita pelo painel SiteFlow, ou qualquer alteração direta nos
  arquivos de conteúdo. Envia os arquivos fonte via SSH e builda direto
  no VPS, sem repetir nenhuma etapa de onboarding (identidade, direção
  visual, infraestrutura). Diferente do site-publicar (que é só para
  artigos novos de blog, com sua própria etapa de adaptar HTML→Markdown).
  Invocado por /link-flow site <slug> quando o site já está construído, ou
  diretamente após a aprovação da Fase 3.
user-invokable: false
---

# site-atualizar — Republicar Site Astro (Fase 3 e edições fora do blog)

Pega o que já está em `_astro/src/content/` — seja porque a Fase 3
acabou de escrever conteúdo real nas Money Pages, seja porque o painel
SiteFlow salvou uma edição — e coloca no ar. Não cria nada novo, não
pergunta identidade nem infraestrutura de novo: o site já existe, isso é
só publicar o que já foi escrito.

**Nunca usar esta skill para o primeiro deploy de um cliente novo** —
isso é `fase2-site-astro` (Marco 2, que por sua vez invoca `vps-setup` se a
infraestrutura ainda não existir). Esta skill exige que o VPS já esteja
configurado e o site já tenha sido publicado ao menos uma vez.

---

## PASSO 1 — Localizar projeto e validar ambiente

Localizar `projetos/<slug>/projeto.md`. Extrair `site_tipo` (registrado
pelo `orq-icp` na raiz do projeto.md, não dentro de uma seção — buscar
livre por `site_tipo:` no arquivo inteiro). Extrair de `## Ambiente VPS`
(registrado pelo `vps-setup`):

```
vps_ip, vps_porta, vps_cliente_dir, vps_site_dir, dominio
```

Se `site_tipo` não for `astro`, parar — nada a fazer aqui, WordPress
publica direto na Fase 3 via Novamira.

Se qualquer campo do `## Ambiente VPS` estiver vazio:
> "O site ainda não foi construído/publicado pela primeira vez. Execute
> /link-flow site <slug> antes."
Parar.

---

## PASSO 2 — Enviar conteúdo atualizado para o VPS

Enviar só os arquivos fonte que podem ter mudado — config e todo o
conteúdo do cliente (mais simples e seguro que tentar adivinhar quais
arquivos específicos mudaram):

```bash
scp -P [vps_porta] \
  "_astro/src/config/site.ts" \
  root@[vps_ip]:"[vps_cliente_dir]/_astro/src/config/"

rsync -avz -e "ssh -p [vps_porta]" \
  "_astro/src/content/." \
  "root@[vps_ip]:[vps_cliente_dir]/_astro/src/content/"
```

---

## PASSO 3 — Build e deploy no servidor

```bash
ssh -p [vps_porta] root@[vps_ip] << REMOTE
  cd "[vps_cliente_dir]/_astro"
  rm -rf .astro node_modules/.astro
  npm run build

  cp -r "dist/." "[vps_site_dir]/"

  echo "Build e deploy OK"
REMOTE
```

`rm -rf .astro node_modules/.astro` **sempre**, antes do build: sem isso o
cache de content collections do Astro pode servir a versão antiga de um
depoimento/serviço/post que foi apagado, e o conteúdo removido volta ao ar
mesmo depois do arquivo já ter sumido do disco (erro 87, Relatório de Testes
6 — reproduzido apagando depoimentos e rodando o build; só sumiu depois de
apagar `node_modules/.astro`).

> A mídia do painel fica em `[vps_cliente_dir]/midia` (fora de `[vps_site_dir]`) e o Nginx
> a serve por `alias`. Este `cp -r` (sem `--delete`) nunca a toca. Nunca acrescentar
> `--delete`/`rm` sobre `[vps_cliente_dir]/midia`.

Monitorar output. Se falhar, mesma regra do `fase2-site-astro`: máximo
3 tentativas de correção, e nunca publicar com build quebrado.

`npm run build` no servidor pode levar minutos — regra de
`vps-setup › Regra: comando longo nunca vira espera do usuário`: rode em
background e retome sozinho quando terminar, sem parar dizendo que está
"esperando resposta". Isso vale ainda mais aqui: quando este PASSO roda
sem ninguém acompanhando (publicação agendada via `schedule`, gatilho
"automatizar blog" do orquestrador), não existe usuário pra mandar
"terminou?" — se o agente travar esperando um empurrão que nunca vem, o
artigo nunca é publicado e ninguém percebe.

> "O build falhou 3 vezes. Não vou publicar com build quebrado.
> Erro: [output do build]"

---

## PASSO 4 — Verificar publicação

Escolher 2-3 URLs que mudaram (ex: as Money Pages que a Fase 3 reescreveu)
e confirmar que estão respondendo com o conteúdo novo:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://[dominio][url-da-pagina]"
```

- 200 → publicado ✅
- 404/000 → investigar antes de reportar sucesso ao operador

---

## PASSO 5 — Registrar no projeto.md

Atualizar `## Ambiente VPS`:
```
ultimo_deploy: [data e hora]
```

Se havia páginas `noindex` que a Fase 3 tirou do placeholder (texto real
escrito), confirmar que o `noindex` foi removido no conteúdo antes deste
deploy — isso é responsabilidade da Fase 3, não desta skill, mas vale
conferir no resumo final se alguma página que deveria estar indexável
ainda está marcada como `noindex`.

---

## PASSO 6 — Resumo final

```
✅ Site atualizado com o conteúdo real.

URL:              https://[dominio]
Páginas atualizadas: [N] (ex: 5 Money Pages, 3 institucionais)
Build: OK · Deploy: OK

⚠️ Pendências (se houver — mesma lógica do fase2-site-astro ETAPA 7,
nunca omitir, cada uma na própria linha):
- [pendências que ainda existem, ex: logo, fotos, páginas que não
  passaram pelo processo completo de análise/validador]
```

---

## Degradação

| Situação | Ação |
|---|---|
| `site_tipo` não é `astro` | Nada a fazer — WordPress publica direto na Fase 3 |
| Site nunca foi construído (sem `## Ambiente VPS`) | Orientar `/link-flow site <slug>` primeiro |
| SSH não conecta | Verificar `vps_ip`/`vps_porta` no projeto.md — se o servidor caiu, diagnosticar com `vps-setup` |
| Build falha 3x | Reportar erro completo e parar |
| rsync/scp falha parcialmente | Tentar de novo — nunca fazer build com envio incompleto |
| curl retorna 404 numa página que deveria existir | Verificar `dist/` no servidor, conferir se o build gerou a página |
