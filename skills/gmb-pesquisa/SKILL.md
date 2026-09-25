---
name: gmb-pesquisa
description: >
  Faz a engenharia reversa dos 3 primeiros concorrentes orgânicos no Google
  Meu Negócio (Google Maps) para um segmento e cidade informados. Usa o
  Chrome para navegar o Google Maps ao vivo, extrai categorias, serviços,
  avaliações, fotos e frequência de posts de cada concorrente, e gera um
  benchmark completo com plano de ação. Use quando o usuário pedir "analisar
  concorrentes", "ver o que os concorrentes fazem no Google", "diagnóstico
  GMB", "benchmark Google Meu Negócio", "pesquisa de concorrente", ou quiser
  começar a trabalhar o Google Meu Negócio. Salva o resultado em
  _memoria/gmb.md para as skills seguintes usarem.
license: MIT
metadata:
  author: LF Soft
  version: "1.0.0"
user-invokable: true
---

# /gmb-pesquisa — Diagnóstico de Concorrentes no Google Meu Negócio

Esta skill analisa os 3 primeiros concorrentes orgânicos no Google Maps
e gera um benchmark completo que serve de base para otimizar o perfil
do usuário. Usa o Chrome para navegar ao vivo — não usa dados estáticos
ou estimativas.

## Dependências

- **Lê:** `_memoria/empresa.md` (para pegar segmento e cidade)
- **Salva:** `_memoria/gmb.md`
- **Ferramentas:** Chrome (obrigatório), Read, Write
- **Requer:** extensão Claude in Chrome instalada no Google Chrome

---

## Verificação de dependências

### 1. Verificar se o Chrome está conectado

Antes de qualquer coisa, verifique se o Chrome está disponível. Se não
estiver, oriente o usuário em linguagem simples:

> "Para fazer essa análise, preciso navegar no Google Maps em tempo real.
> Isso exige que a extensão do Claude esteja instalada no seu Chrome.
>
> Se ainda não tem:
> 1. Abra o Google Chrome (não funciona em outros navegadores)
> 2. Acesse: chromewebstore.google.com e pesquise 'Claude'
> 3. Instale a extensão oficial da Anthropic
> 4. Depois de instalar, volte aqui e me diga 'pronto'
>
> Se já tem a extensão instalada, me diga 'pode continuar'."

### 2. Verificar dados do negócio

Leia `_memoria/empresa.md`. Se o segmento ou a cidade não estiverem
preenchidos, pergunte antes de começar:

> "Para buscar os concorrentes certos, preciso confirmar duas informações:
> qual é o seu tipo de serviço ou negócio, e em qual cidade você atua
> principalmente?"

Se já tiver na memória, confirme rapidamente:

> "Vou buscar concorrentes de [segmento] em [cidade] — está correto?"

---

## Contexto para o usuário (explicar antes de começar)

Antes de iniciar a navegação, explique brevemente o que vai acontecer
em linguagem simples — especialmente para usuários leigos:

> "Vou abrir o Google Maps, pesquisar pelo seu tipo de negócio na sua
> cidade, e analisar os 3 primeiros que aparecem de forma orgânica
> (ignorando os anúncios pagos). O objetivo é entender o que eles fazem
> certo — categorias, serviços, avaliações, fotos — para você fazer o
> mesmo no seu perfil e competir em pé de igualdade.
>
> Vou confirmar o nome de cada concorrente com você antes de analisar,
> para garantir que não estou olhando o concorrente errado. Pode levar
> alguns minutos — vou navegando e extraindo os dados ao vivo."

---

## Fluxo de execução

### Passo 0 — Análise do perfil do próprio cliente (condicional)

Antes de analisar qualquer concorrente, pergunte:

> "Seu negócio já aparece no Google Maps / Google Meu Negócio?
> (Mesmo que incompleto ou com poucas informações)"

**Se SIM → execute o Passo 0 completo abaixo.**
**Se NÃO → pule direto para o Passo 1.**

#### Passo 0A — Visitar o perfil do cliente

Navegue via Chrome para:
`https://www.google.com/maps/search/[NOME EXATO DO NEGÓCIO]+[CIDADE]`

Peça ao usuário o nome exato como está cadastrado no Google antes de
buscar. Se houver múltiplos resultados, confirme qual é o correto.

Extraia os mesmos 7 campos do Passo 2 (análise do líder):
categorias, serviços, descrição, áreas de atendimento, avaliações,
fotos e posts recentes. Registre o que está ausente ou vazio.

#### Passo 0B — Salvar dados do cliente em memória

Salve os dados encontrados em `_memoria/gmb.md` na seção
"Situação atual do perfil", incluindo o que está preenchido, o que
está vazio e o que está incorreto.

#### Passo 0C — Tabela DE-PARA (gerada após análise dos concorrentes)

**Atenção:** esta tabela só pode ser gerada após o Passo 2 (análise
do líder). Ao final de toda a análise, gere a tabela comparativa:

| Campo | Seu perfil atual | Líder tem | Ação necessária |
|---|---|---|---|
| Categorias | [qtd / quais] | [qtd / quais] | [adicionar / corrigir / ok] |
| Serviços | [qtd] | [qtd] | [criar X novos / ok] |
| Descrição | [vazia / X chars] | [X chars] | [escrever / ampliar / ok] |
| Áreas de atendimento | [qtd] | [qtd] | [adicionar / ok] |
| Avaliações | [nota / total] | [nota / total] | [estratégia de captação] |
| Fotos | [qtd] | [qtd] | [adicionar X fotos] |
| Posts recentes | [qtd/mês] | [qtd/mês] | [iniciar / aumentar frequência] |

Esta tabela é especialmente útil para agências que atendem clientes
com perfis já existentes — mostra exatamente o que está errado e o
que falta, de forma objetiva e acionável.

---

### Passo 1 — Busca no Google Maps

Abra o Chrome e navegue para:
`https://www.google.com/maps/search/[SEGMENTO]+em+[CIDADE]`

Substitua espaços por `+`. Exemplo: `encanador+em+São+Paulo`

Na página de resultados:

**REGRA CRÍTICA — Ignorar patrocinados:**
Identifique e ignore completamente qualquer resultado com o rótulo
"Patrocinado", "Anúncio" ou "Ad". Esses são pagos e não representam
ranqueamento orgânico real. Nunca analise um resultado patrocinado.

Identifique os **3 primeiros resultados ORGÂNICOS** (sem nenhum desses
rótulos) e anote os nomes antes de continuar.

Confirme com o usuário:

> "Encontrei os seguintes negócios na busca orgânica:
> 1. [Nome 1]
> 2. [Nome 2]
> 3. [Nome 3]
>
> Esses são de fato concorrentes seus, ou algum deles não faz sentido
> analisar? Se quiser substituir algum, me diga o nome."

Aguarde confirmação antes de continuar.

### Passo 2 — Análise do Concorrente 1 (líder)

Abra o perfil completo do primeiro concorrente orgânico. Navegue e
expanda **todas** as abas e seções disponíveis — muitas só aparecem ao
clicar (Sobre, Serviços, Produtos, Avaliações, Fotos). Não conclua a
análise com base só no que aparece na tela inicial.

**PRINCÍPIO DE EXTRAÇÃO: copie literalmente.** O objetivo não é
resumir o que o concorrente faz — é extrair o conteúdo exato que ele
usou para ranquear em primeiro lugar. Cada palavra que ele colocou em
cada campo foi uma decisão de SEO. Você está copiando o mapa do caminho.

Extraia os seguintes dados **na íntegra**:

**1. CATEGORIAS**
Copie a categoria principal e todas as secundárias exatamente como
aparecem no perfil. Não resuma nem reescreva.

Exemplo de saída esperada:
```
Categoria principal: Endodontista
Categorias secundárias: Clínica odontológica, Dentista, Serviço de clareamento dental
```

**2. SERVIÇOS**
Copie a lista completa de serviços com o nome exato de cada um e a
descrição quando houver. Se a aba de serviços não estiver visível,
clique em "Ver mais" ou expanda o perfil procurando por ela.

Exemplo de saída esperada:
```
- Tratamento de canal
  "Tratamento endodôntico com tecnologia de ponta para eliminar a dor..."
- Endodontia microscópica
  "Procedimento realizado com microscópio cirúrgico para maior precisão..."
- Cirurgia paraendodôntica
  [sem descrição]
```

**3. DESCRIÇÃO DO PERFIL**
Copie o texto completo da descrição do negócio, palavra por palavra.
É aqui que as palavras-chave principais costumam estar concentradas.

**4. ÁREAS DE ATENDIMENTO**
Todas as cidades ou regiões listadas, copiadas literalmente.

**5. AVALIAÇÕES**
- Nota média e total
- Copie os 5 trechos mais representativos de avaliações positivas
  (as palavras que os clientes usam revelam o que o Google associa
  a esse negócio)
- Principais reclamações, se houver

**6. FOTOS**
- Quantidade total aproximada
- Tipos predominantes (ambiente, produto, equipe, antes/depois)
- Se houver texto nas fotos ou legendas visíveis, copie também

**7. POSTS RECENTES**
- Quantidade de posts visíveis
- Copie o texto dos 2-3 posts mais recentes, integralmente
- Identifique as palavras-chave que aparecem nos posts

**8. ATRIBUTOS E DESTAQUES**
Horário de funcionamento, atributos listados, recursos destacados —
tudo copiado literalmente.

**REGRA — Nunca inventar dados:**
Se algum campo não estiver visível ou acessível após tentativa de
expansão, informe explicitamente. Nunca preencha com estimativas.

### Passo 3 — Análise dos Concorrentes 2 e 3

Para os concorrentes 2 e 3, aplique o mesmo princípio de extração
literal — menos campos que o líder, mas o que extrair deve ser copiado
na íntegra, não resumido.

Extraia de cada um:
- Categorias: principal e secundárias (copiadas literalmente)
- Serviços: lista completa com nomes exatos e descrições quando houver
- Descrição do perfil: texto completo
- Nota e total de avaliações
- Posts recentes: texto dos 2 mais recentes, se houver
- Diferencial percebido em relação ao líder: o que ele faz diferente
  ou melhor, especificamente

O objetivo é ter o mapa completo do mercado — o que cada um dos 3
colocou em cada campo, para a próxima skill montar o perfil do usuário
usando o que há de melhor nos 3.

### Passo 4 — Plano de ação

Com os 3 concorrentes analisados, monte um plano de ação objetivo para
o usuário:

**Categorias recomendadas**
- 1 categoria principal (a mais importante — fator de ranqueamento nº 1)
- Até 9 secundárias que fazem sentido para o negócio

**Serviços que valem incluir**
Liste os serviços mais presentes nos concorrentes, com os nomes exatos
extraídos. A validação de volume de busca será feita automaticamente
na próxima etapa.

**Áreas de atendimento**
Recomendações baseadas no modelo do negócio:
- Cliente vem até você (restaurante, clínica, barbearia): foco no
  bairro e arredores imediatos
- Você vai até o cliente (encanador, fotógrafo, faxineira): pode
  incluir a cidade inteira e cidades vizinhas (até 2h de distância)

**O que o líder faz bem e deve ser replicado**
Pontos concretos de aprendizado.

**Onde os concorrentes estão fracos**
Oportunidades reais de diferenciação (ex: poucos posts, poucas fotos,
avaliações sem resposta, horário desatualizado).

**Teste do "isso é real?"**
Lembre sempre:

> "Só adicione ao seu perfil o que o seu negócio realmente entrega.
> Não preencha com serviços que você não faz — o Google está cada vez
> mais rigoroso e pode suspender perfis que parecem spam ou falsos.
> Se é verdadeiro, adicione. Se cheira a enrolação, não coloque."

### Passo 5 — Salvar em memória

Salve o resultado completo em `_memoria/gmb.md`, preenchendo todos os
campos do template. Inclua a data da análise.

Atualize também o status:
```
- [x] Diagnóstico de concorrentes realizado
```

---

## Entrega final

Apresente o relatório completo na conversa (para o usuário ler e
copiar se quiser) e confirme que foi salvo:

> "Diagnóstico concluído e salvo. Aqui está o raio-x dos 3 concorrentes:
>
> [relatório completo]
>
> Quando quiser avançar, é só me dizer — vou usar esses dados para
> montar o conteúdo do seu perfil com as palavras-chave validadas."

---

## Regras

- Chrome é obrigatório para esta skill — sem ele, não execute
- Nunca analisar resultado patrocinado/anúncio — sempre o 1º orgânico
- Sempre confirmar o nome dos 3 concorrentes com o usuário antes de
  extrair dados
- Nunca inventar dados — se não está visível, informar que não foi
  encontrado
- Analisar os 3 orgânicos: profundo no líder (7 campos), resumido nos
  outros 2 (diferencial)
- Salvar sempre em `_memoria/gmb.md` ao final
- Tom acessível: usuário pode ser leigo no GMB — explicar termos como
  "orgânico", "Map Pack", "categorias" quando aparecerem pela primeira
  vez
- Nunca sugerir que o usuário copie literalmente o concorrente — sempre
  "use como referência e adapte para o que você realmente entrega"
