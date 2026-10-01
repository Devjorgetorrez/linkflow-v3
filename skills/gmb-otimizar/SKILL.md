---
name: gmb-otimizar
description: >
  Gera o conteúdo completo para preencher o perfil do Google Meu Negócio
  do usuário, com base no benchmark dos concorrentes e palavras-chave
  validadas. Produz: descrição do negócio, categorias, lista de serviços
  com descrições, áreas de atendimento e atributos. Usa Semrush (se
  conectado), Google Keyword Planner via Chrome (se tiver conta Google Ads),
  ou análise dos concorrentes como fallback. Use quando o usuário pedir
  "otimizar meu GMB", "preencher meu perfil", "conteúdo para o Google Meu
  Negócio", "melhorar meu perfil", ou após ter feito o diagnóstico de
  concorrentes.
license: MIT
metadata:
  author: LF Soft
  version: "1.0.0"
user-invokable: true
---

# /gmb-otimizar — Conteúdo para Preencher o Google Meu Negócio

Gera todo o conteúdo pronto para o usuário copiar e colar no painel do
Google Meu Negócio. Base: benchmark dos concorrentes + palavras-chave
validadas. Resultado: descrição, categorias, serviços, áreas e atributos.

## Dependências

- **Lê:** `_memoria/gmb.md`, `_memoria/empresa.md`
- **Atualiza:** `_memoria/gmb.md` (palavras-chave validadas + status)
- **Salva output:** `saidas/gmb/otimizacao-<YYYY-MM-DD>.md`
- **Ferramentas:** Read, Write, Semrush MCP (opcional), Chrome (opcional)

---

## Verificação inicial

Leia `_memoria/gmb.md`. Se o diagnóstico de concorrentes ainda não foi
feito (campo "Diagnóstico de concorrentes realizado" não marcado), oriente:

> "Para gerar o conteúdo certo para o seu perfil, preciso primeiro
> analisar o que os concorrentes estão fazendo no Google. Me diga quando
> quiser fazer esse diagnóstico e a gente começa por lá."

Se o diagnóstico já existe, confirme com o usuário:

> "Vou gerar o conteúdo para preencher o seu perfil no Google Meu
> Negócio, usando como referência o que os concorrentes líderes estão
> fazendo. Antes de começar, quero confirmar: o diagnóstico que fizemos
> ainda é atual, ou houve alguma mudança no seu negócio desde então?"

---

## Passo 1 — Validação de palavras-chave

O benchmark gerou uma lista de serviços e palavras-chave dos concorrentes.
Antes de usar tudo isso no perfil, valide quais têm volume de busca real.

**REGRA CRÍTICA: execute a validação automaticamente — não transfira essa
tarefa para o usuário.** Só informe o usuário se nenhum método funcionar
após tentativa real.

### Fluxo de execução — tente na ordem, use o primeiro que funcionar

---

#### Método A — MCP de SEO conectado

**Primeiro passo obrigatório: inspecione as tools disponíveis na sessão.**
Liste todas as ferramentas disponíveis e identifique quais pertencem a
serviços de SEO ou pesquisa de palavras-chave — independentemente do
nome que o usuário deu ao conector.

Sinais de que uma tool é de SEO/palavras-chave:
- Nome ou descrição menciona: keyword, volume, search, seo, rank,
  suggestion, ubersuggest, semrush, ahrefs, moz, neil patel
- A tool aceita um termo de busca e retorna dados de volume ou sugestões

Se encontrar tools compatíveis:
1. Use a mais relevante para buscar volume de palavras-chave locais
2. Teste com o termo principal do segmento + cidade
   (ex: "endodontia Santo André", "pastelaria Morumbi")
3. Se retornar dados → valide todos os termos do benchmark com ela
4. Critérios de seleção:
   - Volume abaixo de 50/mês → descartar
   - Volume acima de 50/mês → incluir
   - Priorizar: alto volume + baixa dificuldade

Se não encontrar nenhum MCP de SEO, ou se a chamada falhar →
siga para Método B **silenciosamente**.

---

#### Método B — Web search nativa

Quando o Método A falhar, use a web search nativa do Claude para
extrair dados de intenção de busca sem precisar de nenhuma conta ou
ferramenta externa.

Para cada termo do benchmark, execute:

1. **Autocomplete do Google:** busque `[serviço] [cidade]` e extraia
   as sugestões de autocompletar — são os termos mais buscados reais

2. **People Also Ask:** na SERP, identifique as perguntas do bloco
   "As pessoas também perguntam" — revelam intenção e vocabulário do
   público local

3. **Títulos orgânicos:** extraia as palavras-chave que aparecem nos
   títulos dos 5 primeiros resultados orgânicos — os sites que ranqueiam
   já validaram esses termos

Monte uma lista consolidada com os termos encontrados, ordenados por
frequência de aparição nas 3 fontes.

**Critério de seleção adaptado ao mercado local:**
Não descarte automaticamente termos de baixo volume. Para profissionais
autônomos ou negócios locais em cidades menores, 10-50 buscas/mês
podem representar 2-5 clientes — suficiente para justificar o termo.
Avalie pelo contexto do negócio:
- Cidade grande, segmento concorrido → use volume como critério
- Cidade pequena, profissional autônomo → priorize relevância sobre volume
- Se o termo aparece na web search mas tem volume "zero" no MCP → incluir,
  sinalizando que é um termo hiperlocal sem dados de volume confiáveis

Informe ao usuário o método usado ao apresentar os resultados.

Se a web search também não retornar resultados úteis → Método C.

---

#### Método C — Google Keyword Planner via Chrome

Só chegar aqui se o Método A não encontrou nenhum MCP de SEO.
Pergunte ao usuário:

> "Você tem uma conta no Google Ads? (Não precisa ter campanhas ativas —
> só precisa ter criado uma conta.)"

Se sim → navegue via Chrome para
`https://ads.google.com/aw/keywordplanner/ideas/new` e extraia volumes.
Use os mesmos critérios do Método A.

Se não → vá para Método C sem mais perguntas.

---

#### Método C — Análise da concorrência (fallback final)

Execute você mesmo com base nos dados já salvos em `_memoria/gmb.md`:

- Termo presente nos 3 concorrentes → alta prioridade
- Termo presente em 2 concorrentes → média prioridade
- Termo presente em 1 concorrente → baixa prioridade

Informe ao usuário **após** executar:

> "Validei as palavras-chave com base nos 3 concorrentes que analisamos.
> Os termos que todos eles usam têm demanda comprovada no mercado."

Ao final, mencione como melhorar em próximas execuções:

> "Para validações futuras com dados reais de volume, você pode conectar
> o Ubersuggest (gratuito) aqui no Claude:
> 1. Clique no **+** → **Conectores** → **Gerenciar conectores**
> 2. Clique no **+** → **Adicionar conector personalizado**
> 3. Cole: `https://ubersuggest-mcp.neilpatelapi.com/mcp`
> 4. No campo nome, use **ubersuggest**
> 5. Salve e faça login — pronto."

---

## Passo 2 — Gerar o conteúdo do perfil

Com as palavras-chave validadas, gere o conteúdo completo seguindo as
regras abaixo. Todo o conteúdo deve refletir o que o negócio **realmente
faz** — nunca inflar com serviços ou áreas que não são verdadeiros.

### Descrição do negócio

- Máximo 750 caracteres (limite do GMB)
- Primeira frase: o que a empresa faz + cidade principal
- Incluir naturalmente as 3-5 palavras-chave de maior volume
- Tom de voz: leia `_memoria/preferencias.md` e aplique
- Sem jargão, sem promessas exageradas, sem "melhor da cidade"
- Terminar com um CTA suave (ex: "Entre em contato e agende sua visita")
- Teste do "isso é real?": tudo que está escrito o negócio realmente entrega?

### Categorias

- **1 categoria principal** (o mais importante — fator de ranqueamento nº 1)
  Escolher a que melhor define o negócio, baseada no que o líder usa
- **Até 9 categorias secundárias**
  Apenas as que fazem sentido real para o negócio

Para cada categoria, gere a descrição detalhada no formato abaixo —
não apenas o nome. Isso ajuda o usuário a entender o porquê de cada
escolha e orienta como descrever cada área no painel do GMB:

```
Categoria: [nome]
Por que foi escolhida: [1 frase — baseada no benchmark ou no diferencial]
Serviços relacionados: [lista dos serviços desta categoria]
Descrição com palavras-chave: [2-3 frases descrevendo o que o negócio
faz nessa categoria, incluindo naturalmente a palavra-chave + cidade]
```

Exemplo:
```
Categoria: Neuropsicólogo
Por que foi escolhida: nenhum dos 3 concorrentes usa — diferencial
imediato de posicionamento
Serviços relacionados: Avaliação Neuropsicológica, Laudo para TDAH,
Avaliação de dificuldades de aprendizagem
Descrição: Realiza avaliação neuropsicológica completa em [cidade] para
crianças, adolescentes e adultos. Especializada em TDAH, dificuldades de
aprendizagem e emissão de laudos para escolas e concursos.
```

### Serviços

Gere a lista final de serviços validados. Para cada um:
- **Nome do serviço** (conciso, com palavra-chave quando natural)
- **Descrição** (2-3 frases explicando o que é, para quem serve,
  o diferencial — sem exageros)
- **Link de WhatsApp** (se o usuário tiver WhatsApp em `_memoria/empresa.md`)

**Como construir o link de WhatsApp por serviço:**

```
https://wa.me/55[NUMERO]?text=[MENSAGEM_CODIFICADA]
```

Regras de construção:
- `[NUMERO]` = número de `_memoria/empresa.md` sem formatação
  (ex: se está `11999990000`, usar `5511999990000`)
- `[MENSAGEM_CODIFICADA]` = texto URL-encoded onde:
  - espaços viram `%20`
  - vírgulas viram `%2C`
  - acentos viram código UTF-8 (ã = `%C3%A3`, ç = `%C3%A7`, etc.)
- A mensagem deve ser personalizada por serviço — não uma URL genérica

Exemplo:
```
Serviço: Avaliação Neuropsicológica
Link: https://wa.me/5511999990000?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20Avalia%C3%A7%C3%A3o%20Neuropsicol%C3%B3gica
```

Se o usuário não tiver WhatsApp registrado na memória, omitir o campo
de link — nunca inventar um número.

Máximo recomendado: 30-50 serviços (quantidade que os líderes costumam ter).

Regra de nomenclatura: usar o nome como as pessoas buscam, não como
o empresário chama internamente. Ex: "Desentupimento de pia" em vez de
"Serviço hidráulico residencial tipo A".

### Áreas de atendimento

Depende do modelo do negócio (lido de `_memoria/empresa.md`):

- **Cliente vem até você** (restaurante, clínica, salão): não preencher
  áreas de atendimento — o Google usa a localização do estabelecimento.
  Informar ao usuário isso.
- **Você vai até o cliente** (encanador, faxineira, fotógrafo): listar
  até 20 áreas (bairros, cidades, regiões) dentro de 2h de distância
  do endereço principal.

### Fotos — quantidade e palavras-chave

Essa seção é frequentemente ignorada pelos concorrentes e representa uma
oportunidade real de diferenciação. Informe ao usuário:

**Quantidade:** perfis com mais de 100 fotos reais podem gerar até 5x mais
contatos do que perfis com poucas fotos. É um dos fatores com maior impacto
visível no curto prazo.

**Palavras-chave nas fotos — o detalhe que poucos sabem:**
O Google consegue "ler" as imagens enviadas ao GMB de duas formas:

1. **Nome do arquivo:** antes de fazer upload de uma foto, renomeie o
   arquivo com a palavra-chave principal. Em vez de `IMG_0042.jpg`, use
   `encanador-zona-sul-sao-paulo.jpg` ou `pastelaria-morumbi-pastel-carne.jpg`.
   O Google lê esse nome como parte do contexto da imagem.

2. **Descrição da foto (campo dentro do GMB):** ao fazer upload no painel,
   o Google permite adicionar uma descrição para cada foto. Use esse campo
   para descrever o que está na imagem incluindo naturalmente a
   palavra-chave. Exemplo: "Pastel de carne artesanal feito na hora,
   servido na nossa pastelaria no Morumbi, São Paulo."

Gere para o usuário uma **lista de sugestões de nomes de arquivo e
descrições** para os tipos de foto mais comuns do negócio dele, usando
as palavras-chave priorizadas de `_memoria/gmb.md`. Exemplo de formato:

```
Tipo de foto: Produto principal
Nome sugerido: [palavra-chave-produto]-[bairro]-[cidade].jpg
Descrição: "[Descrição natural do produto/serviço] em [bairro], [cidade]."

Tipo de foto: Ambiente interno
Nome sugerido: [segmento]-[bairro]-interior.jpg
Descrição: "Interior do nosso [segmento] localizado em [bairro], [cidade]."

Tipo de foto: Equipe trabalhando
Nome sugerido: [segmento]-equipe-[cidade].jpg
Descrição: "Equipe de [segmento] atendendo em [cidade]."
```

Gere pelo menos 5 variações cobrindo os tipos de foto mais prováveis
para o segmento do usuário.

### Atributos e destaques

Com base nos atributos que o líder usa (extraídos no diagnóstico), sugerir
quais aplicar. Exemplos: "Aceita cartão", "Acessível para cadeirantes",
"Wi-Fi disponível", "Atendimento em domicílio".

Só sugerir atributos que sejam verdadeiros para o negócio.

---

## Checklist de padrão mínimo — verificar antes de entregar

Antes de apresentar o conteúdo ao usuário, valide todos os itens abaixo.
Se algum estiver faltando, complete antes de avançar. Este é o mínimo
inegociável para um perfil que compete de verdade:

- [ ] Nome do negócio correto e consistente com o site (se tiver)
- [ ] 1 categoria principal definida (a mais específica para o segmento)
- [ ] Mínimo 5 categorias secundárias relevantes
- [ ] Descrição com 700-750 caracteres (próxima do limite de 750)
- [ ] Mínimo 3 palavras-chave principais na descrição (inseridas naturalmente)
- [ ] Mínimo 10 serviços com nome e descrição
- [ ] Link de WhatsApp gerado para cada serviço (se número disponível)
- [ ] Sugestão de mínimo 20 fotos com nomes de arquivo otimizados
- [ ] Horário de atendimento preenchido
- [ ] Número de telefone com DDD
- [ ] Link do site (se tiver)
- [ ] Áreas de atendimento (para quem vai até o cliente)
- [ ] Plano de 8 posts gerado (delegado à skill gmb-posts)

Se algum item não puder ser preenchido por falta de informação do
usuário, sinalize claramente com `[PENDENTE — perguntar ao usuário]`
em vez de inventar dados.

---

## Passo 3 — Apresentar e confirmar

Apresente todo o conteúdo gerado na conversa, organizado em seções
claras. Peça revisão antes de salvar:

> "Aqui está o conteúdo completo para o seu perfil. Revise com calma —
> você conhece seu negócio melhor do que eu. Se algo não estiver
> representando bem o que você faz, me diga e ajustamos antes de
> finalizar."

Aguarde feedback. Aplique ajustes solicitados.

---

## Passo 4 — Salvar e orientar aplicação

Após aprovação, salve em `saidas/gmb/otimizacao-<YYYY-MM-DD>.md` com
todas as seções organizadas e prontas para copiar.

Atualize `_memoria/gmb.md`:
- Registre as palavras-chave validadas na seção correspondente
- Marque: `[x] Serviços validados no Semrush` (ou método usado)
- Marque: `[x] Perfil GMB otimizado`

Oriente o usuário sobre como aplicar:

> "O conteúdo está salvo e pronto. Agora é só aplicar no seu perfil do
> Google Meu Negócio. Para isso:
>
> 1. Acesse business.google.com e faça login
> 2. Selecione seu negócio
> 3. Vá em 'Editar perfil' e aplique cada seção
>
> Uma dica importante: comece pelas **categorias** — elas têm o maior
> impacto no ranqueamento. Depois vá para **serviços**, depois
> **descrição**, depois **áreas de atendimento**.
>
> Quando tiver aplicado tudo, me avise e a gente parte para a parte
> de postagens — que é onde muita gente não chega e você vai estar
> na frente."

---

## Regras

- Nunca gerar conteúdo sem ler `_memoria/gmb.md` primeiro
- Sempre tentar Semrush → Chrome → concorrência, nessa ordem
- Instruções de conexão do Semrush: sempre o caminho correto
  (+ > Conectores > + Adicionar Conector > Semrush > + > autorizar no navegador)
- Nunca sugerir serviços, categorias ou áreas que o negócio não oferece
- Descrição: sempre testar o limite de 750 caracteres
- Categorias: máximo 1 principal + 9 secundárias
- Áreas de atendimento: só para negócios que vão até o cliente
- Sempre pedir revisão do usuário antes de salvar
- Tom de voz: sempre seguir `_memoria/preferencias.md`
- Salvar sempre em `saidas/gmb/` com data no nome do arquivo
