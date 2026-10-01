---
name: icp
description: >
  PONTO DE ENTRADA do agente. Mapeia o contexto completo do cliente e seu
  público ideal (ICP — Ideal Customer Profile). Use quando o usuário disser
  "começar", "quero começar", "configurar o agente", "mapear o cliente",
  "quem é meu cliente ideal", "ICP", "perfil do cliente", "entender meu
  público", "primeira etapa", "oi", "olá", "o que você faz", "como funciona",
  "me ajuda a configurar", ou /icp — especialmente se a memória do projeto
  ainda estiver vazia. Esta skill deve ser a PRIMEIRA a ser rodada — ela
  gera a memória que todas as outras skills dependem. Se o usuário mandar
  qualquer mensagem de abertura genérica e a memória estiver vazia, acione
  esta skill proativamente em vez de perguntar o que ele quer fazer.
license: MIT
metadata:
  author: LF Soft
  version: "1.0.0"
user-invokable: true
argument-hint: "(opcional) nome da empresa para começar"
---

# /icp — Mapeamento de Contexto e Cliente Ideal

Esta skill conduz uma entrevista estruturada para entender quem é a empresa e quem
é o cliente que ela atende. Ao final, gera e salva três arquivos de memória que
alimentam todas as skills seguintes.

## Dependências

- **Lê:** nenhuma (é a skill inicial)
- **Salva:** `_memoria/empresa.md`, `_memoria/icp.md`, `_memoria/preferencias.md`
- **Ferramentas:** `Write`

---

## Princípios da entrevista

- Conduza como uma **conversa**, não como um formulário. Faça **uma ou duas perguntas
  por vez**, no máximo.
- **Adapte o vocabulário** ao perfil do usuário. Se ele usa linguagem técnica, use
  também. Se fala de forma simples, simplifique.
- **Valide e aprofunde**: quando uma resposta for vaga ("atendo todo mundo", "faço
  de tudo"), gentilmente ajude o usuário a refinar. Exemplos concretos ajudam.
- **Não pule perguntas** por suposição. Se o usuário não mencionou algo, pergunte.
- Ao final de cada bloco, faça um **resumo rápido** do que entendeu e peça confirmação
  antes de seguir.

---

## Bloco 1 — A empresa

Objetivo: entender o negócio antes de entender o cliente.

Perguntas a cobrir (em conversa natural, não como lista):

1. Qual é o nome da empresa? (ou nome do profissional, se for pessoa física)
2. O que essa empresa faz, em uma frase simples?
3. Qual é o principal produto ou serviço que ela oferece?
4. Há quanto tempo está no mercado?
5. Onde atua? (cidade, estado, online, todo Brasil?)
6. Quantas pessoas trabalham na empresa?
7. Quais são os dois ou três maiores diferenciais em relação aos concorrentes?
8. Tem site? Redes sociais ativas? Quais?
9. **WhatsApp:** "Você usa WhatsApp para atender clientes? Se sim, qual é o número
   com DDD?" — ex: 11999990000 (só números, sem +55, sem espaços, sem traços).
   Se não tiver ou preferir não usar, registrar como "não tem".
   Esse número será usado para criar links de contato direto no Google Meu Negócio
   e em outros materiais gerados pelo agente.

**Checkpoint:** resumir o que entendeu sobre a empresa e confirmar com o usuário.

---

## Bloco 2 — O cliente ideal (ICP)

Objetivo: traçar com precisão quem é a pessoa que compra dessa empresa.

Perguntas a cobrir:

1. Quem é o cliente que você mais gosta de atender — aquele que paga bem,
   não dá trabalho e indica outros?
2. Qual é a faixa etária desse cliente?
3. É mais homem, mulher, ou equilibrado?
4. Onde esse cliente mora ou trabalha?
5. Qual é a profissão ou ocupação dele?
6. Qual é a renda aproximada dele? (não precisa ser exata — "classe média",
   "empresários pequenos", etc.)
7. Qual é a maior dor ou problema que ele tem ANTES de contratar essa empresa?
8. O que ele espera sentir ou ter DEPOIS de contratar?
9. Qual é a objeção mais comum antes de fechar? ("é caro", "vou pensar",
   "já tentei antes e não funcionou"...)
10. Como ele costuma encontrar empresas como a sua? (indicação, Google,
    Instagram, etc.)
11. Onde ele passa mais tempo online? (Instagram, YouTube, LinkedIn, WhatsApp...)

**Checkpoint:** resumir o perfil do cliente ideal e confirmar.

---

## Bloco 3 — Tom de voz e referências

Objetivo: entender como a marca fala e o que ela quer transmitir.

Perguntas a cobrir:

1. Se a empresa fosse uma pessoa, como ela seria? (séria, descontraída,
   técnica, acolhedora, direta, inspiradora...)
2. Existe alguma palavra ou expressão que a empresa NUNCA usaria?
3. Existe alguma palavra ou expressão que é muito característica da marca?
4. Tem alguma marca — do mesmo segmento ou não — que você admira a comunicação?
   Por quê?
5. Tem alguma marca que você definitivamente NÃO quer parecer? Por quê?

**Checkpoint:** resumir o tom de voz e confirmar.

---

## Geração dos arquivos de memória

Após confirmação dos três blocos, gerar e salvar os arquivos:

### `_memoria/empresa.md`

```markdown
# Empresa

**Nome:** [nome]
**Segmento:** [segmento]
**O que faz:** [descrição simples]
**Diferenciais:** [diferenciais]
**Localização:** [localização]
**Equipe:** [tamanho]
**Site atual:** [url ou "não tem"]
**Redes sociais:** [quais e handles]
**WhatsApp:** [número com DDD, só números — ex: 11999990000, ou "não tem"]
**Pexels API Key:** [chave ou "pendente"]

## Contexto adicional
[qualquer informação relevante não coberta acima]
```

### `_memoria/icp.md`

```markdown
# ICP — Perfil do Cliente Ideal

**Quem é o cliente ideal:** [descrição]
**Faixa etária:** [faixa]
**Gênero predominante:** [gênero]
**Localização:** [localização]
**Profissão / ocupação:** [profissão]
**Renda aproximada:** [renda]
**Principais dores:** [dores]
**O que ele busca ao contratar essa empresa:** [expectativa]
**Objeções mais comuns:** [objeções]
**Como ele descobre empresas como essa:** [canais de descoberta]
**Onde ele passa o tempo online:** [plataformas]

## Contexto adicional
[qualquer informação relevante não coberta acima]
```

### `_memoria/preferencias.md`

```markdown
# Preferências de Comunicação

**Tom de voz:** [tom]
**O que evitar:** [o que não usar]
**Palavras que a marca usa:** [palavras características]
**Palavras que a marca NÃO usa:** [palavras proibidas]
**Referências de marcas admiradas:** [referências e por quê]

## Contexto adicional
[qualquer informação relevante não coberta acima]
```

---

## Entrega final

Após salvar os três arquivos, informe o usuário:

> "Contexto salvo. Agora podemos criar a identidade visual da sua empresa —
> paleta de cores, tipografia e prompts para geração de logo. É só me dizer
> quando quiser começar essa etapa."

## Regras

- Não pule blocos mesmo que o usuário pareça com pressa
- Se o usuário não souber responder alguma pergunta, sugira exemplos concretos
  para ajudá-lo a refletir — nunca preencha por ele
- Sempre confirme o resumo de cada bloco antes de avançar
- Salve os três arquivos juntos, ao final — não salve parcialmente durante a entrevista
