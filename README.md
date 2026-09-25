# Link Flow — Pacote de Distribuição

Sistema de SEO local para negócios brasileiros.
Desenvolvido por **Link Flow** · Criado por **Jorge Torrez**

---

## Como usar

### 1. Verificar o pacote

Execute `install.bat` (Windows) ou `install.sh` (Linux/macOS) para confirmar que todos os arquivos estão presentes.

### 2. Abrir no Claude Code

Abra o Claude Code **apontando para a pasta do cliente**, que deve conter ou referenciar este pacote.

O que você precisa configurar:
- **CLIENTE** — pasta do projeto do seu cliente (onde ficará `projetos/`, `PROGRESSO.md` etc.)
- **PASTA_LINK_FLOW** — o caminho desta pasta (`Link-Flow-Pacote-Novo/`)

Esse apontamento funciona exatamente como na versão anterior via marketplace — nada muda para o aluno.

### 3. Comandos disponíveis

| Comando | O que faz |
|---|---|
| `/link-flow novo` | Cadastra um novo cliente (intake 3×3) |
| `/link-flow auditoria` | Roda a auditoria técnica do site |
| `/link-flow planejamento` | Inicia o planejamento de palavras-chave |
| `/link-flow site` | Gera a arquitetura de páginas |
| `/link-flow conteudo` | Escreve as Money Pages |
| `/link-flow calendario` | Gera o calendário editorial do blog |
| `/link-flow publicar` | Publica o próximo artigo |
| `/link-flow status` | Mostra o estado atual do projeto |
| `/GMN` | Ativa o Agente Google Meu Negócio |

---

## Estrutura do pacote

```
Link-Flow-Pacote-Novo/
├── .claude/
│   └── commands/
│       ├── link-flow.md     ← comando /link-flow (aponta para CLAUDE.md)
│       └── gmn.md           ← comando /GMN (aponta para CLAUDE.md)
├── skills/                  ← todas as skills do Link Flow e do Agente GMB
├── scripts/                 ← scripts Python dos guardiões e gates
├── install.bat              ← verificação do pacote (Windows)
├── install.ps1              ← script de verificação principal
├── install.sh               ← verificação do pacote (Linux/macOS)
├── CLAUDE.md                ← fonte de verdade: todo o comportamento do sistema
├── README.md                ← este arquivo
└── .gitignore               ← bloqueia projetos/ e dados de clientes
```

---

## Importante

- `projetos/` e `_memoria/` ficam **fora** do controle de versão (`.gitignore` já configura isso).
- Nunca compartilhe dados de clientes junto com o pacote.
- Toda a lógica do sistema está em `CLAUDE.md` — os comandos são apenas atalhos que apontam para ele.
