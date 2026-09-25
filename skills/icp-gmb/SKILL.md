---
name: icp-gmb
description: >
  PONTO DE ENTRADA do agente GMB. Mapeia o contexto da empresa para uso
  exclusivo no Google Meu Negócio: nome, segmento, localização, WhatsApp,
  site, diferenciais, perfil do cliente e tom de voz. Use quando o usuário
  ativar o agente com /GMN e a memória estiver vazia, ou quando
  pedir "configurar", "começar", "mapear meu negócio". Esta skill deve ser
  a PRIMEIRA a rodar — ela gera a memória que todas as outras skills usam.
license: MIT
metadata:
  author: Link Flow
  version: "1.0.0"
  created_by: Jorge Torrez
user-invokable: false
---

# icp-gmb — Onboarding para Google Meu Negócio

Conduz uma entrevista rápida e objetiva para entender o negócio e o
cliente. Foco exclusivo no que impacta o Google Meu Negócio: localização,
serviços, como o cliente busca, e tom de voz para os posts.

## Dependências

- **Lê:** nenhuma (é a skill inicial)
- **Salva:** `_memoria/empresa.md`, `_memoria/preferencias.md`
- **Ferramentas:** Write

---

## Princípios da entrevista

- Conduza como uma **conversa**, não como um formulário.
- Faça **uma ou duas perguntas por vez**, no máximo.
- Quando a resposta for vaga ("atendo todo mundo"), ajude a refinar com exemplos concretos.
- Nunca preencha por suposição — se não sabe, pergunta.
- Ao final de cada bloco, faça um resumo rápido e confirme antes de avançar.

---

## Bloco 1 — A empresa

Objetivo: entender o negócio e o que precisa aparecer no Google Maps.

Perguntas a cobrir (em conversa natural):

1. Qual é o nome da empresa? (ou nome do profissional, se for autônomo)
2. O que essa empresa faz, em uma frase simples?
3. Qual é o principal serviço ou produto — o que mais fatura?
4. Onde atua? (cidade principal + bairros atendidos, se for a domicílio)
5. O cliente vai até você, ou você vai até o cliente?
   — Essa pergunta define como preencher "Áreas de atendimento" no GMB.
6. Quais são os dois ou três maiores diferenciais em relação aos concorrentes?
7. Tem site? Se sim, qual é a URL?
8. Tem WhatsApp para atender clientes?
   Se sim: "Qual é o número com DDD?" — ex: 11999990000 (só números, sem +55, sem espaços).
   Esse número será usado para criar links de contato direto nos serviços do GMB.
   Se não tiver, registrar como "não tem".

**Checkpoint:** resumir o que entendeu sobre a empresa e confirmar.

---

## Bloco 2 — O cliente ideal

Objetivo: entender quem busca esse negócio no Google — impacta
palavras-chave, áreas de atendimento e tom dos posts.

Perguntas a cobrir:

1. Quem é o cliente que você mais gosta de atender — aquele que paga bem e indica outros?
2. Qual é a faixa etária desse cliente?
3. Onde esse cliente mora ou trabalha? (bairro, cidade, região)
4. Como ele costuma encontrar empresas como a sua?
   (Google Maps, indicação, Instagram, passando na rua...)
5. Qual é a maior dor ou urgência que ele tem ANTES de contratar?
   (ex: "cano estourou às 22h", "precisa do laudo para amanhã")
6. O que ele espera resolver ao contratar?

**Checkpoint:** resumir o perfil do cliente e confirmar.

---

## Bloco 3 — Tom de voz

Objetivo: entender como a marca fala — usado nos posts do GMB.

Perguntas a cobrir (escolha as mais relevantes — não precisa fazer todas):

1. Se a empresa fosse uma pessoa, como ela seria?
   (séria, descontraída, técnica, acolhedora, direta...)
2. Existe alguma palavra ou expressão que a empresa NUNCA usaria?
3. Existe alguma palavra muito característica da marca?

**Checkpoint:** confirmar o tom de voz.

---

## Geração dos arquivos de memória

Após confirmação dos três blocos, gerar e salvar:

### `_memoria/empresa.md`

```markdown
# Empresa

**Nome:** [nome]
**Segmento:** [segmento]
**O que faz:** [descrição simples]
**Serviço principal:** [o que mais fatura]
**Diferenciais:** [diferenciais]
**Localização:** [cidade + bairro/região]
**Modelo de atendimento:** [cliente vem até você / você vai até o cliente]
**Site:** [url ou "não tem"]
**WhatsApp:** [número com DDD, só números — ex: 11999990000, ou "não tem"]

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

## Contexto adicional
[qualquer informação relevante não coberta acima]
```

---

## Entrega final

Após salvar os arquivos, informe o usuário:

> "Contexto salvo. Próximo passo: vou analisar os 3 concorrentes que
> aparecem primeiro no Google Maps para o seu segmento na sua cidade.
> Isso me dá o mapa exato do que está funcionando para eles — e o que
> você precisa fazer para aparecer junto ou na frente.
>
> Para isso, preciso que o Chrome esteja aberto com a extensão do Claude
> instalada. Já tem? Me avise e a gente começa."

---

## Regras

- Nunca pule blocos mesmo que o usuário pareça com pressa
- Se o usuário não souber responder, sugira exemplos concretos — nunca preencha por ele
- Sempre confirme o resumo de cada bloco antes de avançar
- Salve os dois arquivos juntos ao final — nunca parcialmente durante a entrevista
- Nunca mencione LF Soft ou agente-presenca
- Marca: Link Flow · Criado por Jorge Torrez
