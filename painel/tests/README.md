# Suíte e2e do painel (Playwright)

Testes de navegador de verdade contra uma cópia de teste do painel — nunca
contra a pasta real em produção. Cobre os fluxos que antes só tinham sido
validados por API/build (ver `HANDOFF.md`, pendência "suíte Playwright").

## 1. Preparar uma cópia de teste local

O painel lê o site do cliente por `LINKFLOW_DIR` (`painel/lib/fs.ts`) —
`_astro/src/config/site.ts` + `_astro/src/content/*`. A suíte não builda nem
roda o Astro: só precisa dessa estrutura de arquivos existir, porque o
painel lê/grava direto nela.

**Para um cliente que já existe em `projetos/<slug>/`** (prévia local,
mesmo padrão do Marco 1 do site Astro):

```bash
python scripts/preparar_site_local.py --slug <slug> --tema <tema>
```

Isso cria `projetos/<slug>/site/_astro/` (motor + tema promovido) e
`projetos/<slug>/site/midia/`.

**Para uma cópia isolada, descartável, sem tocar em `projetos/`** (o que
esta suíte usa para se validar e o que o Claude Code deve montar antes de
rodar `npx playwright test`):

```bash
# 1. copiar o motor de referência (sem node_modules/dist/.astro) e promover um tema
cp -r _astro/. /caminho/temp/site/_astro
python scripts/promover_tema.py --tema base --astro-dir /caminho/temp/site/_astro
mkdir -p /caminho/temp/site/midia

# 2. copiar o painel (sem node_modules/.next) + node_modules (cp -r, mais
#    rápido que reinstalar) para uma pasta separada
mkdir -p /caminho/temp/painel
cp -r painel/{app,components,lib,mock,motor,public,scripts,*.ts,*.tsx,*.json,*.mjs} /caminho/temp/painel/
cp -r painel/node_modules /caminho/temp/painel/node_modules

# 3. apontar o .env.local da cópia para o site isolado, numa porta livre
#    (3210 costuma estar ocupada pelo painel real em npm run dev)
cat > /caminho/temp/painel/.env.local <<'EOF'
LINKFLOW_DIR=/caminho/temp/site
LINKFLOW_SLUG=e2e-teste
PORT=3211
PAINEL_API_KEY=troque-por-uma-chave-de-teste
NEXTAUTH_SECRET=troque-por-um-secret-de-teste
NEXTAUTH_URL=http://localhost:3211
EOF
# no package.json copiado, troque -p 3210 por -p 3211 nos scripts dev/start

# 4. subir
cd /caminho/temp/painel && npm run dev
```

Sem usuário ainda cadastrado: o próprio `global-setup.ts` da suíte cria os
usuários de teste via `x-api-key` assim que a suíte roda (não precisa
`node scripts/criar-admin.mjs` nem cadastro manual).

## 2. Rodar a suíte

Da pasta real do painel (`painel/`, onde `@playwright/test` está instalado
como devDependency):

```bash
# a MESMA chave que está em PAINEL_API_KEY no .env.local da cópia de teste
export PLAYWRIGHT_API_KEY=troque-por-uma-chave-de-teste
export PLAYWRIGHT_BASE_URL=http://localhost:3211   # padrão: http://localhost:3210

npm run test:e2e          # roda tudo, modo headless
npm run test:e2e:ui       # UI interativa do Playwright (bom para depurar seletor)
npx playwright test tests/posts.spec.ts   # só uma spec
```

`tests/global-setup.ts` cria (ou reativa, se já existirem de uma rodada
anterior) os usuários de `tests/dados-teste.ts` — `ADMIN`, `AUTOR` e uma
conta dedicada para os testes de senha errada/bloqueio — direto no servidor
de `PLAYWRIGHT_BASE_URL`, via `x-api-key`. Não depende de nenhum estado
externo entre execuções.

## 3. Ver o relatório

```bash
npx playwright show-report      # abre playwright-report/ (gerado a cada rodada)
```

`playwright-report/` e `test-results/` são descartáveis (no `.gitignore` do
painel) — não commitar.

## O que cada spec cobre

| Spec | Cobre |
|---|---|
| `login.spec.ts` | login OK, senha errada, bloqueio após 5 tentativas |
| `posts.spec.ts` | criar (nasce rascunho), editar título → slug/URL acompanham, autosave ("Salvando…"/"Salvo"), mover pra lixeira, restaurar |
| `servicos.spec.ts` | criar, editar, campos do schema (ícone, slug, meta obrigatória) |
| `usuarios.spec.ts` | criar usuário com todos os campos, editar, trava do último Administrador (select vem desabilitado) |
| `midia.spec.ts` | abrir biblioteca, enviar um PNG (`setInputFiles`, sem drag-and-drop de verdade), ver na grade, excluir |
| `privacidade.spec.ts` | abrir Cookies, editar um campo — mais um teste que documenta um bug real (ver abaixo) |
| `aparencia.spec.ts` | aba Cores é somente-leitura (sem botão Salvar) |
| `leads.spec.ts` | lista abre (vazia ou não), sem erro |
| `menu-autor.spec.ts` | itens fora do escopo do papel Autor aparecem desabilitados na Sidebar |
| `navegacao.spec.ts` | smoke test — cada tela do menu abre sem 500/tela em branco |

## Bug real encontrado (não corrigido por esta suíte)

`app/(painel)/privacidade/cookies/page.tsx` desabilita o botão "Salvar
configuração" com `disabled={!politicaPublicada || ...}`.
`politicaPublicada` vem de `lib/store.tsx`, mas o setter (`setPoliticaPublicada`)
**não é chamado em nenhum lugar do painel** — o valor nasce `false` e nunca
muda. Resultado: o botão fica permanentemente desabilitado, mesmo com a
Política de Privacidade publicada de verdade. `privacidade.spec.ts` documenta
esse estado (não tenta salvar, porque não dá).
