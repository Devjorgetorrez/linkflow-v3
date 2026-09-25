---
name: marca
description: >
  Cria a identidade visual completa de uma empresa: paleta de cores, tipografia,
  estilo visual e prompts prontos para geração de logo em ferramentas de IA
  (Ideogram, ChatGPT Image, NanoBanana ou similar). Use quando o usuário pedir
  "criar marca", "identidade visual", "logo", "paleta de cores", "tipografia",
  "criar a cara da empresa", "branding", ou /marca. Requer que /icp já tenha
  sido rodado antes — os arquivos de memória são lidos no início desta skill.
license: MIT
metadata:
  author: LF Soft
  version: "1.0.0"
user-invokable: true
---

# /marca — Identidade Visual Completa

Cria a identidade visual da empresa a partir do contexto mapeado pelo `/icp`.
Entrega: paleta de cores, tipografia, diretrizes de estilo, e prompts prontos
para geração de logo em ferramentas de IA externas.

## Dependências

- **Lê:** `_memoria/empresa.md`, `_memoria/icp.md`, `_memoria/preferencias.md`
- **Salva:** `identidade/design-guide.md`
- **Entrega também:** o conteúdo completo na conversa (para o usuário copiar)
- **Ferramentas:** `Read`, `Write`

---

## Verificação inicial

Antes de qualquer coisa, leia os três arquivos de memória. Se `_memoria/empresa.md`
estiver vazio ou não preenchido, interrompa e oriente:

> "Para criar a identidade visual, preciso conhecer a empresa e seu público
> primeiro. Me diga quando quiser fazer esse mapeamento inicial e começamos
> por lá."

Se a memória estiver preenchida, confirme com o usuário:

> "Vou trabalhar na identidade visual de [Nome da Empresa]. Antes de começar, quero confirmar
> algumas informações do perfil que salvamos: [resumo de 2-3 linhas com nome, segmento
> e tom de voz]. Está correto ou tem algo que mudou?"

---

## Triagem — Criar do zero ou já existe?

Pergunte sempre, antes de qualquer briefing:

> "Sua empresa já tem identidade visual definida — logo, cores e fontes — ou vamos
> criar tudo do zero?"

Isso define qual dos dois modos seguir:

- **"Já tenho"** → siga o **Modo Importar** (abaixo)
- **"Não tenho" / "Quero criar"** → siga o **Modo Criação** (Blocos 1, 2 e 3 normais)
- Se a resposta for ambígua ("tenho só a logo", "tenho cores mas não pensei em
  fonte") → trate como híbrido: pule apenas as partes já definidas no Modo Criação,
  mantendo as demais

---

## Modo Importar (empresa já tem identidade visual)

Quando o usuário já possui identidade visual pronta, esta skill **documenta**,
não cria. Objetivo: levar o que já existe para dentro do `design-guide.md`,
para que `/carrossel` e `/proposta` consigam usar.

Perguntas a fazer:

1. "Pode me passar as cores principais da marca? Se tiver os códigos hex,
   ótimo — se não, descreva (ex: 'azul marinho escuro e dourado') que eu
   te ajudo a aproximar o código."
2. "Quais fontes vocês usam? Se não souber o nome exato, descreva o estilo
   (ex: 'uma fonte arredondada e moderna') e eu sugiro a mais próxima
   disponível no Google Fonts."
3. "Você tem o arquivo do logo? Se sim, qual o caminho do arquivo ou pode
   anexar aqui." (Se o ambiente permitir leitura de arquivo, registre o
   caminho informado no campo correspondente do design-guide)
4. "Existe algum guia de marca já documentado (manual de marca, brand book)?
   Se sim, pode compartilhar para eu extrair as diretrizes."
5. "Tem alguma diretriz de uso que devemos seguir? (ex: 'nunca usar o logo
   sobre fundo colorido', 'sempre com a área de proteção de X')"

**Não gere prompts de logo neste modo** — a Parte C do Bloco 3 (prompts de
geração) é pulada inteiramente, pois o logo já existe.

Ao final, gere o `design-guide.md` (estrutura igual à do Modo Criação),
preenchendo:
- Paleta e tipografia com o que foi informado (não inventado)
- Seção "Logo" com o caminho/arquivo informado, em vez de prompts
- Conceito da marca: pode ser inferido a partir do ICP + do que foi descrito,
  mas sinalize como interpretação, não fato absoluto — convide o usuário a
  corrigir

Pule direto para a seção **Entrega final** após isso — Blocos 1, 2 e 3 abaixo
não se aplicam ao Modo Importar.

---

## Modo Criação (empresa não tem identidade visual)

Segue o fluxo completo abaixo: briefing visual → conceito + paleta + tipografia
→ prompts de logo.

### Bloco 1 — Briefing visual complementar

O ICP capturou o contexto do negócio, mas para identidade visual precisamos de
informações específicas que o ICP não cobre. Faça essas perguntas antes de criar:

1. **Referências visuais:** "Você tem alguma empresa — do seu segmento ou não — cuja
   identidade visual você acha bonita ou que te inspira? Pode ser logo, site, Instagram,
   embalagem, qualquer coisa visual."

2. **O que NÃO quer:** "Tem algum estilo que você definitivamente não quer? (muito
   colorido, muito sério, muito moderno, muito antigo, muito parecido com um concorrente...)"

3. **Sensação:** "Quando um cliente ver o logo ou qualquer material da empresa, qual
   sensação você quer que ele tenha? (ex: confiança, leveza, sofisticação, energia,
   acolhimento, modernidade...)"

4. **Símbolo ou tipografia:** "Você prefere um logo que tenha um símbolo/ícone junto
   com o nome, só o nome estilizado (wordmark), ou não tem preferência?"

5. **Restrições:** "Tem alguma cor que você definitivamente não quer usar? Alguma
   que você ama e quer que apareça?"

**Checkpoint:** resumir as preferências visuais e confirmar antes de criar.

---

### Bloco 2 — Criação da identidade visual

Com o briefing completo e a memória lida, crie a identidade em três partes:

### Parte A — Conceito da marca

Antes de definir cores e fontes, articule o **conceito**:

- Em 2-3 frases, descreva a personalidade visual da marca (ex: "Uma marca que
  transmite sofisticação acessível — séria o suficiente para passar credibilidade,
  mas calorosa o suficiente para não intimidar o cliente comum.")
- Defina 3 adjetivos visuais que guiam todas as decisões (ex: "limpa, moderna,
  acolhedora")

### Parte B — Paleta de cores

Defina **4 cores** com uso específico de cada uma:

| Papel | Nome | Hex | Quando usar |
|---|---|---|---|
| **Primária** | [nome] | #XXXXXX | Cor principal da marca — logo, CTAs, elementos de destaque |
| **Secundária** | [nome] | #XXXXXX | Cor de apoio — backgrounds, variações |
| **Neutra escura** | [nome] | #XXXXXX | Textos principais, fundos escuros |
| **Neutra clara** | [nome] | #XXXXXX | Backgrounds claros, respiro visual |

**Regras para escolha da paleta:**
- A cor primária deve refletir o setor e o tom de voz (ex: saúde → verde/azul;
  gastronomia → quente; tecnologia → azul/roxo; moda → neutros + 1 destaque)
- Verificar contraste entre primária e neutra clara (acessibilidade)
- Nunca definir mais de 4 cores na paleta principal — simplicidade é consistência
- Se o usuário mencionou cores que ama ou odeia no briefing, respeite rigorosamente

### Parte C — Tipografia

Defina **2 fontes** do Google Fonts (gratuitas, sem dependência de licença):

| Papel | Fonte | Peso(s) | Uso |
|---|---|---|---|
| **Título / Display** | [fonte] | 700, 800 ou 900 | Headlines, nome da empresa em materiais |
| **Corpo / Texto** | [fonte] | 400, 500, 600 | Parágrafos, legendas, textos corridos |

**Regras para escolha:**
- Combinações que funcionam: serif display + sans-serif corpo; geometric sans + humanist sans
- Evitar combinações de duas fontes muito parecidas (sem personalidade)
- Preferir fontes com boa leitura em telas pequenas (mobile first)
- Exemplos de combinações testadas: Playfair Display + Inter; Montserrat + Lato;
  Cormorant Garamond + DM Sans; Space Grotesk + Inter

### Entrega do Bloco 2 — Preview visual imediato

Após definir conceito, paleta e tipografia, **não pergunte se o usuário
aprovou ainda** — ele não tem como avaliar só pelo texto. O próximo passo
obrigatório é gerar o preview visual para que ele possa ver e decidir.

Siga imediatamente para a seção **Preview visual — HTML da identidade**
abaixo, gere o arquivo `identidade/preview-marca.html`, abra-o no Chrome
para o usuário ver, e só então pergunte:

> "Aqui está o preview visual da sua identidade. As cores, fontes e como
> elas combinam estão aplicadas nessa página. O que acha? Quer ajustar
> alguma cor, trocar a fonte, ou está bom para seguir?"

Só após a aprovação do preview siga para o Bloco 3 (prompts de logo)
e depois para a geração do `design-guide.md`.

---

### Bloco 3 — Prompts para geração de logo

**⚠️ RESTRIÇÃO ABSOLUTA — LEIA ANTES DE QUALQUER AÇÃO:**
Você NÃO deve gerar, desenhar, renderizar ou visualizar o logo de nenhuma
forma — nem como SVG, nem como widget HTML, nem como arte ASCII, nem usando
ferramentas de visualização nativas do ambiente (show_widget, artifacts, etc).
Essa restrição se aplica mesmo que você tenha capacidade técnica de fazê-lo,
mesmo que o usuário peça explicitamente, e mesmo que pareça "mais rápido".

O motivo é claro e deve ser comunicado ao usuário se ele pedir uma versão
visual: ferramentas especializadas (Ideogram, ChatGPT Image, NanoBanana)
entregam um resultado profissional que você não consegue replicar. Tentar
gerar o logo diretamente produziria algo abaixo do padrão esperado para uma
identidade visual de negócio.

Se o usuário pedir para você "gerar o logo", "mostrar como ficaria",
"criar uma versão visual" ou qualquer variação disso, responda:

> "Criar o logo diretamente não está no meu escopo aqui — ferramentas
> especializadas como Ideogram, ChatGPT Image ou NanoBanana fazem isso
> com muito mais qualidade do que eu conseguiria. O que vou fazer é preparar
> prompts detalhados e prontos para você colar nessas ferramentas e ter um
> resultado profissional em minutos. Qual delas você prefere usar?"

Sua entrega nesta etapa é exclusivamente texto: os 3 prompts abaixo.

---

Gere **3 prompts distintos** para o usuário testar em ferramentas de IA.
Cada prompt deve corresponder a um estilo visual diferente, mas todos
alinhados com o conceito e briefing da marca.

### Estrutura de cada prompt

```
[Tipo de logo]: [wordmark / lettermark / logo com símbolo + texto]
[Estilo visual]: [minimalista moderno / orgânico e manuscrito / geométrico / etc.]
[Elementos visuais]: [descrição do símbolo se houver, ou estilo da tipografia]
[Cores]: usar as cores [primária] e [neutra escura] da paleta definida
[Sentimento]: transmitir [adjetivos do conceito]
[O que evitar]: sem [referências negativas do briefing]
Formato: fundo transparente ou branco, adequado para uso em materiais digitais e impressos
```

### Adaptações por ferramenta

Ao apresentar os prompts, inclua esta nota:

> **Como usar:**
> - **Ideogram AI** (ideogram.ai): cole o prompt em inglês, selecione "Logo" como estilo.
>   Ideogram tem melhor fidelidade tipográfica — indicado se o nome da empresa
>   precisa aparecer escrito corretamente no logo.
> - **ChatGPT Image** (GPT-4o): cole em português ou inglês. Bom para estilos
>   ilustrativos e orgânicos. Para logos com texto, revisar ortografia do resultado.
> - **NanoBanana** ou similar: siga as instruções específicas da ferramenta,
>   usando o prompt como base.
>
> **Dica:** gere 4-6 variações de cada prompt e traga os melhores resultados
> para refinarmos juntos.

---

## Preview visual — HTML da identidade

Gere o arquivo `identidade/preview-marca.html` com a identidade completa
aplicada visualmente. Substitua todos os placeholders com os valores reais
— nenhum `[...]` deve aparecer no arquivo final.

Após gerar o arquivo, abra-o no Chrome automaticamente:

```
Navegue para: file:///[CAMINHO_COMPLETO]/identidade/preview-marca.html
```

O usuário verá o preview ao vivo no navegador. Só após ele visualizar,
pergunte sobre ajustes — conforme instruído no final do Bloco 2 acima.

### Estrutura do preview-marca.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Preview de Marca — [NOME DA EMPRESA]</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=[FONTE_TITULO]:wght@[PESOS]&family=[FONTE_CORPO]:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: '[FONTE_CORPO]', sans-serif;
      background: #f5f5f5;
      padding: 48px 32px;
      color: [HEX_NEUTRA_ESCURA];
    }

    .container { max-width: 900px; margin: 0 auto; }

    h1.page-title {
      font-family: '[FONTE_TITULO]', serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 40px;
    }

    /* SEÇÃO: Paleta */
    .section { margin-bottom: 56px; }

    .section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 20px;
    }

    .paleta {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .cor {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    .cor-bloco {
      height: 120px;
    }

    .cor-info {
      background: white;
      padding: 14px 16px;
    }

    .cor-papel {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 4px;
    }

    .cor-nome {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }

    .cor-hex {
      font-size: 12px;
      color: #888;
      font-family: monospace;
    }

    /* SEÇÃO: Tipografia */
    .tipo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .tipo-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    .tipo-papel {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 16px;
    }

    .tipo-amostra-titulo {
      font-family: '[FONTE_TITULO]', serif;
      font-size: 42px;
      font-weight: [PESO_TITULO];
      line-height: 1.05;
      letter-spacing: -0.02em;
      color: [HEX_NEUTRA_ESCURA];
      margin-bottom: 12px;
    }

    .tipo-amostra-corpo {
      font-family: '[FONTE_CORPO]', sans-serif;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.65;
      color: [HEX_NEUTRA_ESCURA];
      margin-bottom: 12px;
    }

    .tipo-meta {
      font-size: 12px;
      color: #aaa;
    }

    .tipo-pesos {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .peso-tag {
      background: #f5f5f5;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      color: #555;
    }

    /* SEÇÃO: Como combinam */
    .combo-card {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    .combo-dark {
      background: [HEX_NEUTRA_ESCURA];
      padding: 48px;
    }

    .combo-dark .eyebrow {
      font-family: '[FONTE_CORPO]', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: [HEX_PRIMARIA];
      margin-bottom: 12px;
    }

    .combo-dark h2 {
      font-family: '[FONTE_TITULO]', serif;
      font-size: 36px;
      font-weight: [PESO_TITULO];
      line-height: 1.08;
      letter-spacing: -0.025em;
      color: [HEX_NEUTRA_CLARA];
      margin-bottom: 16px;
    }

    .combo-dark p {
      font-family: '[FONTE_CORPO]', sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: rgba(255,255,255,0.55);
      max-width: 480px;
    }

    .combo-light {
      background: [HEX_NEUTRA_CLARA];
      padding: 48px;
    }

    .combo-light .eyebrow {
      font-family: '[FONTE_CORPO]', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: [HEX_PRIMARIA];
      margin-bottom: 12px;
    }

    .combo-light h2 {
      font-family: '[FONTE_TITULO]', serif;
      font-size: 36px;
      font-weight: [PESO_TITULO];
      line-height: 1.08;
      letter-spacing: -0.025em;
      color: [HEX_NEUTRA_ESCURA];
      margin-bottom: 16px;
    }

    .combo-light p {
      font-family: '[FONTE_CORPO]', sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: rgba(0,0,0,0.5);
      max-width: 480px;
    }

    .combo-accent {
      background: [HEX_PRIMARIA];
      padding: 32px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .combo-accent span {
      font-family: '[FONTE_CORPO]', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: white;
      opacity: 0.85;
    }

    .combo-accent .cta {
      background: white;
      color: [HEX_PRIMARIA];
      border: none;
      border-radius: 8px;
      padding: 12px 28px;
      font-family: '[FONTE_CORPO]', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      cursor: pointer;
    }

    /* Conceito */
    .conceito-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    .conceito-card p {
      font-size: 17px;
      line-height: 1.7;
      color: #444;
      margin-bottom: 20px;
    }

    .adjetivos {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .adjetivo {
      background: [HEX_SECUNDARIA];
      color: [HEX_NEUTRA_ESCURA];
      padding: 8px 18px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">

    <h1 class="page-title">Preview de Marca — [NOME DA EMPRESA]</h1>

    <!-- Conceito -->
    <div class="section">
      <div class="section-label">Conceito</div>
      <div class="conceito-card">
        <p>[CONCEITO DA MARCA EM 2-3 FRASES]</p>
        <div class="adjetivos">
          <span class="adjetivo">[Adjetivo 1]</span>
          <span class="adjetivo">[Adjetivo 2]</span>
          <span class="adjetivo">[Adjetivo 3]</span>
        </div>
      </div>
    </div>

    <!-- Paleta -->
    <div class="section">
      <div class="section-label">Paleta de cores</div>
      <div class="paleta">
        <div class="cor">
          <div class="cor-bloco" style="background:[HEX_PRIMARIA]"></div>
          <div class="cor-info">
            <div class="cor-papel">Primária</div>
            <div class="cor-nome">[NOME_PRIMARIA]</div>
            <div class="cor-hex">[HEX_PRIMARIA]</div>
          </div>
        </div>
        <div class="cor">
          <div class="cor-bloco" style="background:[HEX_SECUNDARIA]"></div>
          <div class="cor-info">
            <div class="cor-papel">Secundária</div>
            <div class="cor-nome">[NOME_SECUNDARIA]</div>
            <div class="cor-hex">[HEX_SECUNDARIA]</div>
          </div>
        </div>
        <div class="cor">
          <div class="cor-bloco" style="background:[HEX_NEUTRA_ESCURA]"></div>
          <div class="cor-info">
            <div class="cor-papel">Neutra escura</div>
            <div class="cor-nome">[NOME_NEUTRA_ESCURA]</div>
            <div class="cor-hex">[HEX_NEUTRA_ESCURA]</div>
          </div>
        </div>
        <div class="cor">
          <div class="cor-bloco" style="background:[HEX_NEUTRA_CLARA]; border: 1px solid #eee"></div>
          <div class="cor-info">
            <div class="cor-papel">Neutra clara</div>
            <div class="cor-nome">[NOME_NEUTRA_CLARA]</div>
            <div class="cor-hex">[HEX_NEUTRA_CLARA]</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tipografia -->
    <div class="section">
      <div class="section-label">Tipografia</div>
      <div class="tipo-grid">
        <div class="tipo-card">
          <div class="tipo-papel">Título / Display</div>
          <div class="tipo-amostra-titulo">[NOME DA EMPRESA]</div>
          <div class="tipo-meta">[FONTE_TITULO]</div>
          <div class="tipo-pesos">
            <!-- Gerar uma .peso-tag para cada peso disponível -->
            <span class="peso-tag">[PESO] — [USO]</span>
          </div>
        </div>
        <div class="tipo-card">
          <div class="tipo-papel">Corpo / Texto</div>
          <div class="tipo-amostra-corpo">[FRASE CURTA SOBRE O NEGÓCIO — 1-2 linhas descrevendo o que a empresa faz, no tom de voz da marca]</div>
          <div class="tipo-meta">[FONTE_CORPO]</div>
          <div class="tipo-pesos">
            <span class="peso-tag">400 — Texto corrido</span>
            <span class="peso-tag">500 — Destaque</span>
            <span class="peso-tag">600 — Negrito</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Como combinam -->
    <div class="section">
      <div class="section-label">Como as cores e fontes combinam</div>
      <div class="combo-card">
        <div class="combo-dark">
          <div class="eyebrow">[SEGMENTO / PALAVRA-CHAVE DA MARCA]</div>
          <h2>[HEADLINE CURTA NO TOM DA MARCA]</h2>
          <p>[FRASE DESCRITIVA DO NEGÓCIO — 1-2 linhas]</p>
        </div>
        <div class="combo-light">
          <div class="eyebrow">[SEGMENTO / PALAVRA-CHAVE DA MARCA]</div>
          <h2>[HEADLINE ALTERNATIVA]</h2>
          <p>[OUTRA FRASE DESCRITIVA]</p>
        </div>
        <div class="combo-accent">
          <span>[CTA CURTO — ex: "Agende sua consulta"]</span>
          <button class="cta">Saiba mais</button>
        </div>
      </div>
    </div>

  </div>
</body>
</html>
```

**Substituir todos os placeholders `[...]`** com os valores reais da
identidade gerada. Nenhum placeholder deve aparecer no arquivo final.

---

## Geração do arquivo design-guide.md

Só execute este passo após o usuário aprovar o preview visual. Salve o arquivo:

```markdown
# Design Guide — [Nome da Empresa]

> Gerado pelo Agente de Presença — LF Soft Soluções
> Data: [data atual]

## Conceito da marca

[conceito em 2-3 frases]

**Adjetivos visuais:** [adjetivo 1] · [adjetivo 2] · [adjetivo 3]

## Paleta de cores

| Papel | Nome | Hex |
|---|---|---|
| Primária | [nome] | #XXXXXX |
| Secundária | [nome] | #XXXXXX |
| Neutra escura | [nome] | #XXXXXX |
| Neutra clara | [nome] | #XXXXXX |

## Tipografia

| Papel | Fonte | Peso(s) |
|---|---|---|
| Título / Display | [fonte] | [pesos] |
| Corpo / Texto | [fonte] | [pesos] |

## Logo

**Arquivo:** [preencher após gerar logo externo]
**Versões:** [preencher após gerar logo externo]

### Prompts utilizados para geração

**Prompt 1 — [estilo]:**
[prompt completo]

**Prompt 2 — [estilo]:**
[prompt completo]

**Prompt 3 — [estilo]:**
[prompt completo]

## Diretrizes de uso

- Cor primária em fundos claros, neutra clara em fundos escuros
- Tipografia display apenas para títulos — nunca em blocos de texto
- Manter espaçamento generoso ao redor do logo (área de proteção mínima)
- [adicionar outras regras específicas da marca conforme necessário]
```

---

## Entrega final

Após salvar o arquivo, informe — adaptando conforme o modo seguido:

**Se Modo Criação:**
> "Identidade visual criada e salva em `identidade/design-guide.md`.
>
> **Próximos passos:**
> 1. Teste os 3 prompts de logo nas ferramentas sugeridas
> 2. Traga os resultados para refinarmos juntos
> 3. Quando o logo estiver aprovado, me avise para atualizar o design-guide
> 4. Depois disso, é só me pedir para criar seus primeiros posts no
>    visual da marca"

**Se Modo Importar:**
> "Identidade visual documentada e salva em `identidade/design-guide.md`,
> com base no que vocês já têm.
>
> **Próximos passos:**
> 1. Confira se cores, fontes e logo ficaram registrados corretamente
> 2. Me avise quando quiser criar seus primeiros posts já no visual da marca"

## Regras

- **NUNCA gerar, desenhar, renderizar ou visualizar o logo** — nem como SVG,
  widget, HTML, artifact ou qualquer formato visual. Sempre redirecionar para
  os prompts prontos e ferramentas externas (Ideogram, ChatGPT Image, NanoBanana)
- Sempre pergunte a triagem (Modo Importar vs Modo Criação) antes de qualquer
  briefing — nunca assuma
- No Modo Criação: nunca pule o briefing visual — mesmo que o ICP já tenha
  informações de referência, as perguntas visuais são específicas e necessárias
- No Modo Criação: nunca defina mais de 4 cores na paleta principal
- No Modo Criação: sempre gere exatamente 3 prompts de logo, em estilos distintos
- No Modo Importar: nunca gere prompts de logo — o logo já existe
- No Modo Importar: nunca invente cores/fontes que o usuário não informou —
  pergunte ou peça para descrever, mas não suponha
- Sempre salve o design-guide.md E entregue o conteúdo na conversa
- Não invente informações sobre a empresa que não estejam na memória
- Se o usuário quiser testar uma versão antes de aprovar, salve mesmo assim
  (o arquivo pode ser editado depois)
