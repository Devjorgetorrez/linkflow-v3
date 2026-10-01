# Link Flow — Pacote de Distribuição

Sistema de SEO local para negócios brasileiros.
Desenvolvido por **Link Flow** · Criado por **Jorge Torrez**

---

## Como usar

### 1. Instalar

**Primeira vez?** Execute `install.bat` (Windows) ou `install.sh`
(Linux/macOS).

**Já tem clientes cadastrados numa instalação anterior e está atualizando
para um pacote novo?** As pastas `projetos/`, `credenciais/` (se existir) e
`_memoria/` (se existir) ficam soltas na **raiz** da instalação antiga — o
mesmo nível de `install.bat`, `skills/`, `painel/` e `_astro/` de lá, nunca
dentro de outra pasta. Copie essas pastas da raiz da instalação antiga para
a raiz **desta pasta nova** (o mesmo nível deste `README.md`) **antes** de
instalar, e execute `update.bat` (Windows) ou `update.sh` (Linux/macOS) em
vez do `install`. Ele confere se essas pastas realmente
estão aqui antes de seguir — se esquecer de copiar, ele avisa em vez de
seguir em silêncio com o cadastro de clientes vazio.

Os dois (`install`/`update`) conferem se o pacote está completo e instalam
tudo que falta:

- Confirma Node.js, npm, Python e o Claude Code CLI.
- `npm install` em `painel/` (o painel de gestão, Next.js).
- `npm install` em `_astro/` (o motor que gera os sites dos clientes).
- Instala as dependências Python de `scripts/` (`scripts/requirements.txt`).
- Cria `painel/.env.local` a partir de `painel/.env.example`, já com
  `NEXTAUTH_SECRET` e `PAINEL_API_KEY` gerados automaticamente.

Isso é o suficiente para os comandos `/link-flow` e `/GMN` funcionarem. Dois
passos continuam manuais, por dependerem de credenciais que só você tem:

- **Cliente WordPress** — conectar o Novamira: `/plugin configure link-flow@link-flow`
  (veja a aula do Novamira antes, se ainda não instalou o plugin no WordPress do cliente).
- **Cliente Astro** — configurar o servidor: `/link-flow vps <slug>` (pede as
  credenciais SSH do VPS Hostgator na hora).

### 2. Abrir no Claude Code

Abra o Claude Code apontando para esta pasta (`linkflow-completo/`). Os
projetos de cada cliente ficam em `projetos/<slug>/`, criados pelo próprio
`/link-flow novo` — não é preciso preparar nada antes.

### 3. Comandos disponíveis

| Comando | O que faz |
|---|---|
| `/link-flow novo` | Cadastra um novo cliente (intake 3×3) |
| `/link-flow auditoria` | Roda a auditoria técnica do site |
| `/link-flow planejamento` | Inicia o planejamento de palavras-chave |
| `/link-flow site` | Gera a arquitetura de páginas (e o site, se `site_tipo: astro`) |
| `/link-flow conteudo` | Escreve as Money Pages |
| `/link-flow backlinks` | Roteia para o sistema de backlinks (stub v2) |
| `/link-flow calendario` | Gera o calendário editorial do blog |
| `/link-flow publicar` | Publica o próximo artigo |
| `/link-flow vps <slug>` | Configura/diagnostica o servidor VPS de um cliente Astro |
| `/link-flow status` | Mostra o estado atual do projeto |
| `/GMN` | Ativa o Agente Google Meu Negócio |
| `/painel` | Abre o painel de gestão SiteFlow em `localhost:3210` |

---

## Estrutura do pacote

```
linkflow-completo/
├── .claude/
│   └── commands/
│       ├── link-flow.md     ← comando /link-flow (aponta para CLAUDE.md)
│       └── gmn.md           ← comando /GMN (aponta para CLAUDE.md)
├── skills/                  ← todas as skills do Link Flow e do Agente GMB
├── scripts/                 ← scripts Python dos guardiões, gates e requirements.txt
├── painel/                  ← painel de gestão SiteFlow (Next.js) — cliente site_tipo: astro
├── _astro/                  ← motor que gera os sites (temas de referência + engine)
├── install.bat              ← instalador, primeira instalação (Windows)
├── install.ps1              ← script do instalador
├── install.sh               ← instalador, primeira instalação (Linux/macOS)
├── update.bat                ← atualizador, instalação já existente (Windows)
├── update.ps1                ← script do atualizador
├── update.sh                  ← atualizador, instalação já existente (Linux/macOS)
├── CLAUDE.md                ← fonte de verdade: todo o comportamento do sistema
├── README.md                ← este arquivo
└── .gitignore                ← bloqueia projetos/, credenciais/, _memoria/ e dados de clientes
```

---

## Importante

- `projetos/`, `credenciais/` e `_memoria/` ficam **fora** do controle de versão (`.gitignore` já configura isso).
- Nunca compartilhe dados de clientes junto com o pacote.
- Toda a lógica do sistema está em `CLAUDE.md` — os comandos são apenas atalhos que apontam para ele.
- `painel/.env.local` é gerado pelo instalador e nunca deve ser versionado — tem os segredos de autenticação do painel.
- **Quem for preparar um novo pacote pra distribuir:** nunca zipe uma pasta onde o instalador já rodou. `painel/.env.local`, `painel/node_modules`, `_astro/node_modules` e `painel/.next` precisam estar ausentes antes de compactar — senão todo aluno que receber o pacote fica com o MESMO segredo do painel, e o instalador nem gera um novo (`.env.local ja existe`). Empacote sempre a partir de uma cópia limpa do repositório, nunca de uma pasta onde alguém já instalou ou testou.
