---
name: proposta-comercial
description: >
  Gera propostas comerciais profissionais com a identidade visual da empresa
  do usuário. Use quando o usuário pedir "criar proposta", "fazer uma proposta
  comercial", "proposta para um cliente", "preciso enviar uma proposta",
  "proposta comercial", /proposta. Lê a memória e o design-guide para que
  a proposta saia já no visual e no tom de voz da marca — não como um
  documento genérico. Requer que /marca já tenha sido rodado antes.
license: MIT
metadata:
  author: LF Soft
  version: "1.0.0"
user-invokable: true
argument-hint: "(opcional) nome do cliente e escopo da proposta"
---

# /proposta — Proposta Comercial no Visual da Marca

Gera propostas comerciais que saem com a identidade visual, tom de voz e
contexto da empresa do usuário — não um documento genérico, mas uma proposta
que já parece profissional e coerente com a marca.

**Importante:** a proposta gerada é para que **o usuário envie para os
clientes dele** — não é uma proposta da LF Soft ou do agente para vender
a ferramenta. O usuário é o prestador de serviço; o destinatário é o
cliente dele.

## Dependências

- **Lê:** `_memoria/empresa.md`, `_memoria/preferencias.md`,
  `identidade/design-guide.md`
- **Salva:** `saidas/propostas/<cliente>-<YYYY-MM-DD>/proposta.md`
- **Ferramentas:** `Read`, `Write`

---

## Verificação inicial

Leia `identidade/design-guide.md`. Se estiver vazio ou não preenchido,
interrompa e oriente:

> "Para gerar uma proposta no visual da sua marca, preciso que a identidade
> visual esteja definida primeiro. Me diga quando quiser fazer essa etapa
> e começamos por lá."

Se a identidade estiver definida, confirme com o usuário:

> "Vou criar uma proposta comercial no visual de [Nome da Empresa].
> Me conta: para quem é essa proposta e o que você vai oferecer?"

---

## Coleta de informações

Conduza como conversa, não como formulário. Cubra:

1. **Para quem:** nome do cliente ou empresa destinatária
2. **O que será entregue:** escopo do serviço ou produto (ser específico —
   evitar "consultoria geral")
3. **Valor:** preço ou faixa de investimento. Se o usuário não tiver
   definido, não invente — registrar como "[A DEFINIR]"
4. **Prazo:** estimativa de entrega ou duração. Se não definido: "[A DEFINIR]"
5. **Contexto extra (opcional):** algo específico sobre esse cliente que
   deva aparecer na proposta (ex: "já conversamos sobre X", "ele tem urgência
   em Y", "é uma empresa de logística")

**Checkpoint:** resumir os dados coletados e confirmar antes de redigir.

---

## Redação da proposta

Com os dados confirmados, redigir o documento seguindo a estrutura abaixo.
Aplicar o tom de voz de `_memoria/preferencias.md` em todo o texto —
frases naturais, sem jargão corporativo, sem promessas exageradas.

### Estrutura do documento

```markdown
# Proposta Comercial — [Nome do Cliente]

**De:** [Nome da Empresa — de _memoria/empresa.md]
**Para:** [Nome do Cliente]
**Data:** [data atual]

---

## Entendimento da Necessidade

[2-3 parágrafos descrevendo o problema/necessidade do ponto de vista do
cliente, mostrando que a empresa entendeu o contexto antes de propor
qualquer solução. Usar o contexto extra fornecido, se houver. Escrever
na voz do cliente, não da agência.]

## Solução Proposta

[Descrição clara e específica do que será entregue. Se o escopo tiver
múltiplas partes, estruturar com subtópicos ou lista. Sem vagueza —
"automatizar o envio de relatórios semanais via email" é melhor do que
"otimizar processos de comunicação".]

## Investimento

[Se valor foi informado: apresentar com clareza, incluindo o que está
incluso e o que não está, se relevante.
Se NÃO foi informado: "[A DEFINIR — a combinar após alinhamento final]"
Nunca inventar valores.]

## Prazo

[Se prazo foi informado: apresentar.
Se NÃO foi informado: "[A DEFINIR — a combinar após alinhamento final]"]

## Próximos Passos

[2-3 frases sobre como avançar — ex: "Para darmos início, basta me
confirmar sua aprovação por resposta a este documento. Em seguida,
alinhamos os detalhes contratuais e combinamos o início."]

---

*[Nome da Empresa] · [contato/site de _memoria/empresa.md]*
```

### Regras de tom

- Frases curtas e diretas — máximo 2 linhas por parágrafo
- Foco nos benefícios para o cliente, não nas features do serviço
- Sem jargão: não usar "sinergia", "ecossistema", "disruptivo",
  "state of the art", "entregáveis"
- Números e prazos específicos quando existirem — vagueza passa insegurança
- Tom de voz de `_memoria/preferencias.md` tem prioridade sobre qualquer
  regra genérica acima

---

## Aplicação da identidade visual

Após redigir o texto, gerar uma versão estilizada em HTML com as cores e
tipografia do `design-guide.md`, pronta para imprimir ou exportar como PDF.

### Template HTML da proposta

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial — [Nome do Cliente]</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=[FONTE_TITULO]:wght@700;800&family=[FONTE_CORPO]:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --cor-primaria: [HEX_PRIMARIA];
      --cor-secundaria: [HEX_SECUNDARIA];
      --cor-escura: [HEX_NEUTRA_ESCURA];
      --cor-clara: [HEX_NEUTRA_CLARA];
      --fonte-titulo: '[FONTE_TITULO]', sans-serif;
      --fonte-corpo: '[FONTE_CORPO]', sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--fonte-corpo);
      background: var(--cor-clara);
      color: var(--cor-escura);
      padding: 0;
    }

    .proposta {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
    }

    /* Cabeçalho */
    .header {
      background: var(--cor-escura);
      color: var(--cor-clara);
      padding: 60px 72px 48px;
    }

    .header .empresa-nome {
      font-family: var(--fonte-titulo);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--cor-primaria);
      margin-bottom: 32px;
    }

    .header h1 {
      font-family: var(--fonte-titulo);
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.05;
      margin-bottom: 32px;
    }

    .header .meta {
      display: flex;
      gap: 40px;
      font-size: 13px;
      font-weight: 500;
      opacity: 0.6;
      letter-spacing: 0.05em;
    }

    /* Divisor */
    .divisor {
      height: 4px;
      background: var(--cor-primaria);
      width: 64px;
      margin: 0 72px;
    }

    /* Conteúdo */
    .conteudo {
      padding: 56px 72px;
    }

    .secao {
      margin-bottom: 48px;
    }

    .secao-titulo {
      font-family: var(--fonte-titulo);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--cor-primaria);
      margin-bottom: 16px;
    }

    .secao h2 {
      font-family: var(--fonte-titulo);
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.1;
      margin-bottom: 20px;
    }

    .secao p {
      font-size: 16px;
      line-height: 1.7;
      color: #444;
      margin-bottom: 12px;
    }

    .secao ul {
      padding-left: 0;
      list-style: none;
    }

    .secao ul li {
      font-size: 16px;
      line-height: 1.7;
      color: #444;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.07);
      padding-left: 20px;
      position: relative;
    }

    .secao ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--cor-primaria);
    }

    /* Bloco de destaque (investimento) */
    .destaque {
      background: var(--cor-escura);
      color: var(--cor-clara);
      border-radius: 12px;
      padding: 40px 48px;
      margin-bottom: 48px;
    }

    .destaque .secao-titulo {
      color: var(--cor-primaria);
    }

    .destaque .valor {
      font-family: var(--fonte-titulo);
      font-size: 48px;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: white;
      margin-bottom: 8px;
    }

    .destaque p {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
    }

    /* Rodapé */
    .footer {
      background: var(--cor-clara);
      border-top: 1px solid rgba(0,0,0,0.08);
      padding: 32px 72px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #888;
    }

    .footer .empresa {
      font-family: var(--fonte-titulo);
      font-weight: 700;
      color: var(--cor-escura);
    }

    @media print {
      body { background: white; }
      .proposta { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="proposta">

    <div class="header">
      <div class="empresa-nome">[NOME DA EMPRESA]</div>
      <h1>Proposta Comercial para [NOME DO CLIENTE]</h1>
      <div class="meta">
        <span>Data: [DATA]</span>
        <span>Válida por 15 dias</span>
      </div>
    </div>

    <div class="divisor"></div>

    <div class="conteudo">

      <div class="secao">
        <div class="secao-titulo">Contexto</div>
        <p>[TEXTO DA SEÇÃO "ENTENDIMENTO DA NECESSIDADE"]</p>
      </div>

      <div class="secao">
        <div class="secao-titulo">O que será feito</div>
        <h2>[TÍTULO DO ESCOPO]</h2>
        <ul>
          <!-- Listar os itens do escopo como <li> -->
          <li>[Item 1]</li>
          <li>[Item 2]</li>
        </ul>
      </div>

      <div class="destaque">
        <div class="secao-titulo">Investimento</div>
        <div class="valor">[VALOR ou "A DEFINIR"]</div>
        <p>[Prazo ou condições, se houver]</p>
      </div>

      <div class="secao">
        <div class="secao-titulo">Próximos Passos</div>
        <p>[TEXTO DOS PRÓXIMOS PASSOS]</p>
      </div>

    </div>

    <div class="footer">
      <div class="empresa">[NOME DA EMPRESA]</div>
      <div>[CONTATO/SITE]</div>
    </div>

  </div>
</body>
</html>
```

Salve o HTML gerado como `proposta.html` na pasta de output. Substitua
todos os placeholders `[...]` com os dados reais da proposta e com as
cores/fontes do `design-guide.md`.

---

## Workflow completo

### Passo 1 — Ler memória e identidade
Leia os 3 arquivos de memória + `identidade/design-guide.md` antes de
qualquer outra ação.

### Passo 2 — Coletar dados da proposta
Conduza a coleta de informações (seção acima). Checkpoint de confirmação.

### Passo 3 — Redigir o texto
Escreva o documento markdown completo com as 5 seções. Apresente na
conversa para aprovação do usuário antes de gerar o HTML.

### Passo 4 — Gerar proposta.html
Com o texto aprovado, gere o arquivo HTML substituindo todos os
placeholders com os dados reais + cores e fontes do design-guide.
Salve em `saidas/propostas/<nome-cliente>-<YYYY-MM-DD>/proposta.html`.

### Passo 5 — Salvar versão markdown
Salve também `proposta.md` na mesma pasta (a versão texto pura,
útil para edições futuras).

### Passo 6 — Entrega final

> "Proposta criada e salva em `saidas/propostas/[pasta]/`.
>
> Você tem dois arquivos:
> - `proposta.html` — versão visual completa no seu estilo de marca.
>   Abra no navegador e use Ctrl+P (ou Cmd+P no Mac) para salvar como PDF
>   antes de enviar ao cliente.
> - `proposta.md` — versão texto pura, fácil de editar se precisar ajustar
>   algo antes de enviar.
>
> Quer revisar algum ponto antes de finalizar?"

---

## Regras

- Sempre ler `identidade/design-guide.md` e `_memoria/` antes de criar
- Nunca inventar valores ou prazos — se não foram informados, usar
  "[A DEFINIR]" explicitamente
- Tom de voz de `_memoria/preferencias.md` tem prioridade sobre regras
  genéricas de redação
- Nunca gerar proposta "da LF Soft" ou "do agente" — é sempre do usuário
  para o cliente dele
- Sempre apresentar o texto (markdown) para aprovação antes de gerar o HTML
- Sempre salvar os dois formatos: `.html` e `.md`
- Proposta HTML: substituir todos os placeholders — entregar sem nenhum
  `[...]` visível
- Cores e fontes do HTML devem sempre vir do `design-guide.md`, não de
  valores fixos ou inventados
