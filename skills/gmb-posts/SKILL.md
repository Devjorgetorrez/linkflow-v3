---
name: gmb-posts
description: >
  Gera uma bateria de 8 posts para o Google Meu Negócio, cria um plano
  consolidado com textos e prompts de imagem, aguarda o usuário salvar
  as imagens numa pasta única, e então acessa o GMB via Chrome para
  programar todos os posts de uma vez usando o agendamento nativo do
  Google. Sem pastas por post, sem scheduled task — o usuário só precisa
  salvar as imagens com os nomes certos numa pasta e confirmar.
  Use quando o usuário pedir "criar posts para o GMB", "gerar postagens
  para o Google", "planejar conteúdo do Google Meu Negócio", ou após
  a otimização do perfil estar concluída.
license: MIT
metadata:
  author: LF Soft
  version: "4.0.0"
user-invokable: true
---

# /gmb-posts — Posts para o Google Meu Negócio

Gera 8 posts (4 semanas, 2 por semana), organiza num plano único,
aguarda as imagens numa pasta só, e programa tudo de uma vez no GMB
via Chrome com agendamento nativo do Google.

## Dependências

- **Lê:** `_memoria/gmb.md`, `_memoria/empresa.md`,
  `_memoria/preferencias.md`
- **Cria:** `saidas/gmb/posts/plano-[ANO-MES].md`
- **Pasta de imagens:** `saidas/gmb/posts/imagens/[ANO-MES]/`
- **Atualiza:** `_memoria/gmb.md`
- **Ferramentas:** Read, Write, Chrome

---

## Conceito de post do GMB

Posts do GMB **não são posts de Instagram**.

| Instagram | Google Meu Negócio |
|---|---|
| Conteúdo de marca, estética | Movimento real do estabelecimento |
| Carrossel, Reels, Stories | Foto única + texto curto |
| Hashtags, copy persuasiva | Texto natural, sem hashtags |
| Público: seguidores | Público: quem busca agora no Google |

Tom: natural e direto, como o dono escreveria uma mensagem rápida.
Não copy de agência. Seguir `_memoria/preferencias.md`.
Tamanho: 50 a 150 palavras. Máximo 300.

**Rotação semanal:**
- **Semana 1:** EDUCATIVO (seg) + DEPOIMENTO (qui)
- **Semana 2:** SERVIÇO ESPECÍFICO (seg) + SAZONALIDADE (qui)
- **Semana 3:** DÚVIDA FREQUENTE (seg) + BASTIDOR (qui)
- **Semana 4:** RESULTADO (seg) + CTA DIRETO (qui)

---

## Verificação inicial

Leia `_memoria/gmb.md`. Se a otimização do perfil ainda não foi feita:

> "Para que os posts usem as palavras-chave certas, preciso que a
> otimização do GMB seja feita primeiro. Me avise quando quiser."

---

## Passo 1 — Briefing

Pergunte só o que não estiver na memória:

1. **Data de início:** "Quando quer começar? Me diga a segunda-feira
   da primeira semana (ex: 07/07/2026)."

2. **Horário:** "Os horários mais indicados são **9h nas segundas**
   (início de semana, pessoas planejando contratar serviços) e **17h
   nas quintas** (fim de tarde, pico de busca local). Uso esses como
   padrão, ou prefere outros?"

3. **Restrições:** "Tem algo que prefere não mostrar nos posts?
   (rosto de clientes, preços, concorrentes...)"

---

## Passo 2 — Gerar os 8 posts

Usar as palavras-chave de `_memoria/gmb.md`. Variar entre posts —
nunca a mesma formulação em posts consecutivos.

Para cada post, definir:

**Nome do arquivo de imagem (SEO):**
Padrão: `[palavra-chave]-[cidade]-[N].jpg`
Exemplo: `avaliacao-neuropsicologica-caieiras-01.jpg`
O Google lê o nome do arquivo como sinal de SEO — nunca usar
nomes genéricos como `foto.jpg` ou `imagem01.jpg`.

**Texto do post:**
Natural, direto, seguindo `_memoria/preferencias.md`.

**Prompt de imagem:**
Em português, específico o suficiente para gerar sem ajuste no
ChatGPT Image, Ideogram ou NanoBanana.

**Link de WhatsApp para CTA:**
Ler número de `_memoria/empresa.md`. Formar o link:
```
https://wa.me/55[DDD][NUMERO]?text=[MENSAGEM_CODIFICADA]
```
Onde `55` é o código do Brasil + DDD + número sem formatação.
Ex: se está `11999990000` → usar `5511999990000`.
Mensagem URL-encoded, personalizada por post (espaços = `%20`,
ã = `%C3%A3`, ç = `%C3%A7`, é = `%C3%A9`).
Se não houver WhatsApp na memória, omitir o botão CTA.

---

## Passo 3 — Criar plano consolidado

Após gerar os 8 posts, apresente tudo na conversa para aprovação.
S� após aprovação do usuário, crie os arquivos.

Criar a subpasta de imagens do mês (o agente cria — o usuário
não precisa fazer isso manualmente):
```bash
mkdir -p "saidas/gmb/posts/imagens/[ANO-MES]"
```

Criar o arquivo de plano `saidas/gmb/posts/plano-[ANO-MES].md`:

```markdown
# Plano de Posts GMB — [MÊS ANO]

Gerado em: [DATA]
Período: [DATA INÍCIO] a [DATA FIM]
Cadência: Segunda às [HORA] e Quinta às [HORA]

---

## Pasta de imagens deste mês

Salve todas as imagens em:
`saidas/gmb/posts/imagens/[ANO-MES]/`

Esta pasta já foi criada pelo agente. Use exatamente os nomes
listados abaixo para cada post. Imagens de meses anteriores ficam
preservadas nas subpastas dos meses correspondentes — não é necessário
apagar nada.

---

## Post 01 — [DATA] (Segunda) às [HORA]

**Tipo:** EDUCATIVO
**Arquivo de imagem:** `[NOME-SEO-01].jpg`
**Por que esse nome:** o Google lê o nome do arquivo como SEO —
nunca renomear para algo genérico.

**Prompt para gerar a imagem:**
[PROMPT DETALHADO em português]

**Texto do post:**
[TEXTO COMPLETO]

**Botão CTA:** Saiba mais
**Link:** [URL WhatsApp personalizada]

---

## Post 02 — [DATA] (Quinta) às [HORA]

[mesma estrutura]

---

[repetir para posts 03 ao 08]

---

## Checklist de imagens

Antes de avisar que está pronto, confirme que salvou todos os arquivos:

- [ ] [NOME-SEO-01].jpg
- [ ] [NOME-SEO-02].jpg
- [ ] [NOME-SEO-03].jpg
- [ ] [NOME-SEO-04].jpg
- [ ] [NOME-SEO-05].jpg
- [ ] [NOME-SEO-06].jpg
- [ ] [NOME-SEO-07].jpg
- [ ] [NOME-SEO-08].jpg
```

---

## Passo 4 — Orientar o usuário sobre as imagens

Após criar o plano, informe:

> "O plano dos 8 posts está salvo em `saidas/gmb/posts/plano-[ANO-MES].md`.
>
> **O que você precisa fazer agora:**
> 1. Leia o plano — cada post tem o prompt pronto para gerar a imagem
> 2. Gere cada imagem no ChatGPT Image, Ideogram ou NanoBanana
>    usando o prompt correspondente
> 3. Salve **todas as imagens nesta pasta:**
>    `saidas/gmb/posts/imagens/[ANO-MES]/`
>    (a pasta já está criada — é só jogar as imagens lá dentro)
> 4. Use **exatamente os nomes listados** no plano para cada imagem
>    (o checklist no final do plano facilita acompanhar)
>
> Não precisa criar nenhuma subpasta — todas as 8 imagens deste mês
> ficam juntas nessa pasta. Os meses anteriores ficam preservados nas
> próprias pastas, sem precisar apagar nada.
>
> Quando tiver salvo todas as imagens, me avise com
> **'ok, imagens prontas'** e eu programo tudo no Google."

---

## Passo 5 — Verificar imagens e programar no GMB

Quando o usuário avisar que as imagens estão prontas, verificar:

```bash
ls "saidas/gmb/posts/imagens/[ANO-MES]/"
```

Comparar com a lista de nomes esperados do plano. Se algum arquivo
estiver faltando ou com nome diferente, informar especificamente:

> "Encontrei 6 das 8 imagens. Faltam:
> - [NOME-SEO-03].jpg
> - [NOME-SEO-07].jpg
> Quando salvar esses dois, me avise."

Se todos os 8 arquivos estiverem corretos, confirmar e iniciar:

> "Perfeito — os 8 arquivos estão na pasta com os nomes certos.
> Vou abrir o Google Meu Negócio agora e programar todos os posts.
> Pode levar alguns minutos."

### Navegação no GMB

**1. Abrir o GMB:**
Navegar para `https://business.google.com`

**Cenário A — navegador logado na conta do negócio:**
O Google redireciona automaticamente para a busca com o painel
"Sua empresa no Google" em destaque no lado esquerdo. Seguir.

**Cenário B — navegador não logado:**
Aparece a página "Google Perfil da Empresa" com botão "Fazer login".
Pausar e informar o usuário:
> "Preciso que você faça login no Google com a conta do seu negócio.
> Quando terminar, me avise 'ok, logado' para eu continuar."
Aguardar confirmação no chat antes de prosseguir.

**Cenário C — seleção de conta (múltiplas contas no navegador):**
Pausar e informar:
> "Apareceu uma tela pedindo para escolher qual conta usar. Selecione
> a conta associada ao seu negócio no Google e me avise 'ok, escolhi'."
Aguardar confirmação no chat antes de prosseguir.

**2. Acessar Postagens:**
No painel "Sua empresa no Google", clicar em **"Postagens"**
(4º botão da barra de ícones, entre "Fotos" e "Desempenho").

Uma janela lateral abre "Suas postagens". Clicar em
**"+ Adicionar postagem"**.

### Loop de criação — 8 posts em sequência

Para cada post (post-01 ao post-08, na ordem do plano):

**a) Tipo:** confirmar que "Atualização" está selecionado (✓).
Se não estiver, clicar nele.

**b) Descrição:** clicar no campo "Descrição" e colar o texto
do post correspondente no plano.

**c) Imagem:** clicar em "Selecionar imagens e vídeos"
→ abre janela de navegação do sistema

Na barra de endereço da janela, colar o caminho completo:
`[CAMINHO DO PROJETO]/saidas/gmb/posts/imagens/[ANO-MES]/`
Pressionar Enter para navegar até a pasta.
Selecionar o arquivo com o nome SEO do post atual.
Clicar em "Abrir".

**d) Agendamento:** ativar o toggle "Programar esta postagem"
→ aparecem os campos Data e Hora

No campo **Data**: digitar `[DD/MM/AAAA]` do post
No campo **Hora**: digitar `[HH:MM]` do post
(aceita qualquer horário válido digitado diretamente)

**e) CTA:** clicar em "+ Botão" → selecionar "Saiba mais"
→ aparece campo "Link para o botão*"
Colar o link de WhatsApp personalizado do post.
Se o usuário não tiver WhatsApp, pular este passo.

**f) Publicar:** clicar em **"Postagem"** (botão azul, canto
inferior direito)
→ abre tela "Todas as postagens" com o post como "Pendente"
→ aparece aviso: "Postagem enviada para análise" — isso é normal

**g) Próximo post:** clicar em **"+ Adicionar postagem"**
(canto superior direito da tela "Todas as postagens")
Repetir a → g para o próximo post.

### Após o último post

> "Pronto! Os 8 posts foram programados:
>
> - Post 1: [DATA] às [HORA] — [TIPO]
> - Post 2: [DATA] às [HORA] — [TIPO]
> - Post 3: [DATA] às [HORA] — [TIPO]
> - Post 4: [DATA] às [HORA] — [TIPO]
> - Post 5: [DATA] às [HORA] — [TIPO]
> - Post 6: [DATA] às [HORA] — [TIPO]
> - Post 7: [DATA] às [HORA] — [TIPO]
> - Post 8: [DATA] às [HORA] — [TIPO]
>
> O Google publica automaticamente em cada data — você não precisa
> fazer mais nada. Os posts aparecem como 'Pendente' por alguns
> minutos enquanto o Google analisa, depois mudam para 'Agendado'.
>
> Quando esse lote acabar, me avise para gerar os próximos 8."

### Tratamento de erros

**Botão "Postagens" não encontrado:**
> "Não encontrei o botão de Postagens no painel. O Google pode ter
> atualizado o layout. Pode me mostrar onde fica essa opção?"

**Campo de data não aceita entrada:**
Tentar clicar no ícone de calendário e selecionar visualmente.

**Imagem não aparece na janela de navegação:**
Informar o caminho e nome exato esperado e pedir confirmação
de que o arquivo existe naquele local.

---

## Passo 6 — Registrar

Atualizar `_memoria/gmb.md`:
- Data de início do lote
- Datas agendadas
- Marque: `[x] Posts gerados`

---

## Regras

- Nunca gerar posts sem palavras-chave de `_memoria/gmb.md`
- Palavras-chave: variadas e naturais — nunca iguais em posts seguidos
- Tom: movimento real do estabelecimento — nunca copy genérica
- Tamanho: 50-150 palavras, máximo 300
- Nome de arquivo: sempre SEO com palavra-chave + cidade, nunca genérico
- Imagens sempre na subpasta mensal `saidas/gmb/posts/imagens/[ANO-MES]/`
- O agente cria a subpasta — o usuário só coloca as imagens lá
- Nunca apagar imagens de meses anteriores — cada mês tem sua subpasta
- Sempre verificar os 8 arquivos antes de abrir o GMB
- Tipo no GMB: sempre "Atualização" — nunca Oferta ou Evento
- Sempre programar com agendamento nativo — nunca publicar imediatamente
- Cenários de login/conta: pausar e aguardar confirmação do usuário no chat
- Status "Pendente" após publicar é normal — sempre informar o usuário
- Link WhatsApp: `55` + DDD + número sem formatação, mensagem por post
