---
name: ranqueado-configurar
description: Sub-skill de setup inicial de um cliente no claude-ranqueado. Faz uma entrevista — uma pergunta por vez — e cria o projeto.md na subpasta do cliente, dentro da pasta-mãe de projetos. Sugere o tom de voz pelo modelo de monetização e registra o contexto permanente.
---

# Sub-skill: ranqueado-configurar
> Versão: 1.0 | Junho 2026
> Acionada por: /ranqueado configurar
> Cria: projeto.md na subpasta do cliente

---

## Função

Configurar um novo cliente. Faz a entrevista de setup, sugere o tom de voz e cria o `projeto.md` com todo o contexto permanente. Roda uma vez por cliente.

---

## PASSO 0 — Verificar o ambiente (Python) ANTES de tudo

> POR QUÊ: o controle de qualidade (gates) roda em Python. Sem Python instalado, os gates
> NÃO rodam e o sistema cai numa verificação manual menos confiável — o artigo pode sair
> com erros que deveriam ser bloqueados, e o aluno nem percebe. Por isso, na PRIMEIRA vez,
> verificar o ambiente. (Caso real: uma máquina tinha só os stubs falsos da Microsoft Store,
> não o Python real — os gates nunca rodaram por sessões inteiras sem ninguém notar.)

```
Rodar (via Bash) e checar se algum responde uma versão de verdade:
   for c in python py python3; do "$c" --version 2>/dev/null && break; done

CASO A — respondeu "Python 3.x.y": ambiente OK. Seguir para a entrevista.

CASO B — nada respondeu, OU respondeu algo que manda "instalar da Microsoft Store"
(isso é o STUB FALSO do Windows, não o Python real): avisar o aluno e orientar a instalar:

  "Para o controle de qualidade funcionar, você precisa do Python instalado. É rápido e
   só precisa fazer uma vez. No PowerShell do Windows, rode:

       winget install Python.Python.3.12

   Se não tiver winget, baixe em python.org/downloads e, no instalador, MARQUE a opção
   'Add Python to PATH'. Depois FECHE e reabra o terminal e o Claude Code, e rode de novo
   /ranqueado configurar."

  → NÃO prosseguir fingindo que está tudo certo. Sem Python, deixar claro que os gates
    não vão rodar e o aluno deve instalar antes de gerar artigos.

ATENÇÃO ao stub do Windows: se "python --version" devolver vazio/erro e o terminal sugerir
a Microsoft Store, NÃO é Python real. Instalar pelo winget ou python.org resolve.
```

---

## Onde o projeto.md é criado

O `projeto.md` é criado na pasta onde o Claude Code está aberto. Cada cliente fica na sua própria pasta — você organiza como preferir.

```
Você abre o Claude Code na pasta do cliente:
cd Cliente-Maria
claude
/ranqueado configurar
→ cria o projeto.md ali mesmo
```

Não há estrutura obrigatória. Um cliente = uma pasta com seu projeto.md.

---

## ENTREVISTA — Uma Pergunta Por Vez

Fazer UMA pergunta, aguardar a resposta, só então fazer a próxima. Nunca despejar todas as perguntas de uma vez.

### Pergunta 1 — Nome do projeto ou site
```
"Qual o nome do seu projeto ou site?"
```
→ Usar como título do projeto.md

### Pergunta 2 — URL do site (opcional)
```
"Qual a URL do site? (opcional — pode deixar em branco se ainda não tiver)"
```

### Pergunta 3 — Nicho
```
"Qual o nicho do site? (ex: produtos para bebê, tecnologia, decoração)"
```

### Pergunta 4 — Modelo de monetização
```
"Qual o modelo de monetização? Você pode escolher mais de um:

1. Blog FDF — review e afiliado (ex: melhores carrinhos, melhores fones)
2. Site FDF — transacional ou infoproduto (ex: cursos, serviços locais)
3. Blog Discover — interesse humano e tendências (ex: beleza, lifestyle)
4. Site Money — informacional + comercial (ex: guias que monetizam com afiliado)

Digite o número ou os números (ex: 1 e 4)"
```

### Pergunta 5 — Concorrentes de referência
```
"Quais os concorrentes de referência deste nicho? Cole as URLs (um por linha).
O planejamento vai analisar esses primeiro em cada artigo."
```

### Pergunta 6 — Sitemap ou lista de artigos existentes
```
"O site já tem artigos publicados antes de usar a suite?

- Se SIM, a forma mais fácil é pelo sitemap:
   (a) SITEMAP (recomendado): cole a URL do sitemap do site
       (ex: seusite.com.br/sitemap.xml ou seusite.com.br/post-sitemap.xml)
       → eu acesso o sitemap e leio a lista de artigos existentes sozinho
   (b) MANUAL (se não tiver sitemap): cole a lista no formato /slug — Título (um por linha)
- Se NÃO ou site novo: responda 'não' e seguimos com a lista vazia"
```

> Quando você colar a URL do sitemap, a suite acessa o sitemap UMA vez (via WebFetch),
> extrai as URLs e os títulos dos artigos publicados e popula a seção "Páginas Existentes do Site (Sitemap)"
> do projeto.md. Isso serve só para conhecer o conteúdo já existente (para linkagem interna).
> Não substitui o histórico de artigos criados pela própria suite.

### Pergunta 7 — Plataforma e editor de publicação
```
"Onde e como você publica os artigos? Isso define o melhor formato de entrega
 (para o texto colar certo e você conseguir editar e subir as fotos):

(a) WordPress — Editor de BLOCOS (Gutenberg): o editor moderno, com blocos que
    você clica e edita. É o padrão dos sites novos.
(b) WordPress — Editor CLÁSSICO: a caixa única de texto (TinyMCE), ou via plugin Classic Editor.
(c) Outro (Wix, Elementor, page builder, site custom) — me diga qual.

Se não souber, responda 'não sei' que eu oriento como descobrir."
```

> A resposta vai para a seção "Ambiente de Publicação" do projeto.md. O redator usa isso
> para escolher o formato de saída certo (blocos Gutenberg vs HTML clássico vs page builder)
> — em vez de assumir CSS inline para qualquer tema (o que dificultava editar e subir fotos).
> Se a resposta for "não sei", registrar como "não definido" e o redator usa o formato
> padrão do modelo, avisando que o aluno pode ajustar depois.

---

## Sugestão de Tom de Voz

Após a pergunta 7, sugerir o tom de voz baseado no modelo escolhido. Se você escolheu mais de um modelo, sugerir o tom do modelo principal (o primeiro que ele citou) e mencionar que pode ajustar por artigo.

| Modelo | Tom sugerido |
|---|---|
| Blog FDF | Analítico e comparativo — testador independente que usou os produtos. Honesto sobre prós e contras. Primeira pessoa do plural. |
| Blog Discover | Editorial e pessoal — jornalista próxima que viveu o assunto. Microhistórias e opinião pessoal. ZERO emojis. |
| Site FDF Local | Direto e confiante — foco em conversão e confiança. Autoridade sem agressividade. |
| Site FDF Infoproduto | Transformacional — foca na mudança seu. Gatilhos mentais sutis. Segunda pessoa. |
| Blog Search | Informativo e didático — especialista acessível que explica sem complicar. |
| Site Money | Híbrido — educa primeiro, sugere depois. Consultor que ajuda a decidir. |

Apresentar assim:
```
"Com base no modelo [X], sugiro este tom de voz:

[descrição completa do tom]

Pode usar assim, ajustar ou descrever o tom que você prefere."
```

Aguardar aprovação ou ajuste seu.

---

## Criar o projeto.md

Após o tom de voz aprovado, criar a subpasta do cliente e salvar o `projeto.md`:

```markdown
# Projeto: [Nome do Projeto ou Site]

## Informações Básicas
- Nome: [nome]
- URL do site: [url ou "não informado"]
- Nicho: [nicho]
- Modelo(s) de monetização: [modelos escolhidos]

## Ambiente de Publicação
- Plataforma/editor: [Gutenberg (blocos) | Clássico | Outro: qual | não definido]
- Tema tem estilos próprios (caixas/botões): [sim | não | não sei]
- Observação de formato: [ex: "usa Elementor" — ou vazio]

## Tom de Voz
[tom aprovado por você]

## Concorrentes de Referência
1. [url]
2. [url]

## Artigos Criados pela Suite — Atualizado Automaticamente
[vazio até o primeiro artigo]

## Páginas Existentes do Site (Sitemap) — para Links Internos
[lista do sitemap colada/lida, ou vazio se site novo]

## Observações do Cliente
[vazio — preencher conforme necessário]
```

---

## Confirmação Final

Após criar o arquivo, confirmar para você:

```
"Pronto! Cliente [nome] configurado.

🎯 Modelo: [modelo]
🗣 Tom de voz: [resumo do tom]
🔗 Concorrentes: [N] cadastrados
📝 Artigos antigos: [N na lista / nenhum - site novo]

Para criar o primeiro artigo:
/ranqueado escrever \"sua palavra-chave\""
```

---

## Regras

- UMA pergunta por vez — nunca todas juntas
- URL do site é opcional — nunca obrigar
- Modelo pode ser múltiplo — aceitar mais de uma escolha
- Site novo sem artigos é normal — seguir com lista vazia
- Sempre sugerir o tom de voz, mas sempre deixar você aprovar ou ajustar
- Nunca criar o projeto.md antes de ter o tom de voz aprovado
- A seção "Artigos Criados pela Suite" sempre começa vazia e se preenche sozinha
