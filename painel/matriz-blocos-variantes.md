# Matriz de Blocos × Variantes — SiteFlow

Base: `levantamento-blocos.md` (inventário agente-presenca)
Alvo: SiteFlow — CMS para negócio local (dentista, advogado, psicóloga, etc.)
Data: 2026-09-03

---

## Legenda de campos

| Notação | Significado |
|---|---|
| `marca.*` | Lido do store: aparencia, nomeSite, tagline, logoClaro, logoEscuro |
| `negocio.*` | Lido do store: configIdentidade, configContato (telefone, endereço, horários, etc.) |
| `nó.*` | Campo configurado no editor de página, por instância do bloco |
| `posts.*` | Derivado da coleção de posts (artigos) |
| `mídia.*` | Imagem carregada via biblioteca de mídia |

**Regra de campos compartilhados (§3.4.1):** Todas as variantes de um mesmo bloco compartilham o mesmo field set. Campos usados apenas por variantes específicas existem no schema como `opcional`. Trocar de variante não pode exigir novos dados.

---

## 1. Header

**Status no agente-presenca:** EXISTE — `Header.astro` sem props, tudo em brand; branch `isInfoproduto`.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `header-padrao` | Logo + nav principal + CTA (WhatsApp/telefone) | Adaptado de `Header.astro` |
| `header-minimal` | Logo + nav apenas, sem CTA | Novo |
| `header-centrado` | Logo centralizado + nav abaixo; sem CTA lateral; cara de clínica premium | Novo |
| `header-transparente` | Sem fundo, sobrepõe o Hero; requer hero com fundo escuro ou imagem; muda toda a entrada da página | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| — | — | — | Todos os campos vêm do store; nenhum campo de editor |

**Fontes de dados:**
- `marca.nomeSite` — texto fallback se logo ausente
- `marca.logoClaro` + `marca.logoEscuro` — imagens
- `negocio.telefone`, `negocio.whatsapp` — usados no CTA (header-padrao)
- `configRedes.instagram` — link redes no cabeçalho (opcional)

**Empty state:** todas as variantes: nomeSite fallback `"Nome do site"`. Logo ausente → texto.
**Imagem ausente:** sem logo, exibe `marca.nomeSite` em tipografia. Sem comportamento quebrado.
**header-transparente:** requer hero com `bg-primary` ou imagem escura imediatamente abaixo; sem hero compatível, degrada para header-padrao (fundo surface).

---

## 2. Hero

**Status no agente-presenca:** EXISTE (2 variantes) — `Hero.astro` (blog, esquerda) + `LandingHero.astro` (infoproduto, centro).

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `hero-texto` | Esquerda: eyebrow + título + lead + CTA(s), sem imagem | Adaptado de `Hero.astro` |
| `hero-imagem` | Duas colunas: texto esquerda + foto/ilustração direita | Novo |
| `hero-video` | Vídeo de fundo + overlay + título centrado + CTA | Novo |
| `hero-landing` | Centro: eyebrow + título + sub + CTA único + nota | Adaptado de `LandingHero.astro` |
| `hero-split` | Imagem ocupa 50% da largura; texto na outra metade sem overlay; cara de consultório e clínica | Novo |
| `hero-editorial` | Sem imagem; título em fonte display grande ocupa a dobra; lead + CTA; cara de escritório e autoridade | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `eyebrow` | string | não | nó |
| `titulo` | string | **sim** | nó |
| `lead` | string | não | nó |
| `ctaPrimTexto` | string | não | nó |
| `ctaPrimHref` | string | não | nó |
| `ctaSecTexto` | string | não | nó |
| `ctaSecHref` | string | não | nó |
| `imagem` | imagem | não | mídia |
| `imagemAlt` | string | não | nó |
| `nota` | string | não | nó (linha sob o botão) |
| `videoUrl` | string | não | nó (apenas renderizado em hero-video) |

**Campos por variante (renderização condicional, não novo campo):**
- `hero-texto` — ignora `imagem`, `videoUrl`
- `hero-imagem` — usa `imagem`; sem `videoUrl`
- `hero-video` — usa `videoUrl`; ignora `imagem`
- `hero-landing` — usa `nota`; ignora `ctaSecTexto/ctaSecHref`
- `hero-split` — usa `imagem`; sem `videoUrl`; imagem ausente → degrada para `hero-texto` (sem coluna vazia)
- `hero-editorial` — ignora `imagem` e `videoUrl`; usa `titulo`, `lead`, `ctaPrimTexto/Href`; `eyebrow` e `nota` ignorados

**Empty state:** sem `ctaPrimTexto` → não exibe botão. `eyebrow` e `lead` opcionais sem placeholder.
**Imagem ausente (hero-imagem):** colapsa coluna de imagem para layout full-width. Sem placeholder visual.
**Imagem ausente (hero-split):** degrada para `hero-texto` (coluna de imagem não existe sem imagem).
**Imagem (hero-editorial):** campo ignorado — variante puramente tipográfica.

---

## 3. Servicos

**Status no agente-presenca:** AUSENTE como bloco. Existe rota `/servicos/*` via content collection, sem componente de grade para homepage.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `servicos-grade` | Grade 1→2→3 cols, card: ícone + título + descrição + link | Novo |
| `servicos-lista` | Lista vertical com separadores, sem grade | Novo |
| `servicos-destaque` | Primeiro item em destaque full-width + grade 1→2→3 para os demais | Novo |
| `servicos-tabs` | Abas por categoria; cada aba exibe grade dos itens da categoria | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó |
| `descricao` | string | não | nó (subtítulo da seção) |
| `itens` | array | **sim** | nó |
| `itens[].titulo` | string | **sim** | nó |
| `itens[].descricao` | string | não | nó |
| `itens[].icone` | string | não | nó (nome ícone Lucide) |
| `itens[].imagem` | imagem | não | mídia |
| `itens[].imagemAlt` | string | não | nó |
| `itens[].href` | string | não | nó (link para página de serviço) |
| `itens[].categoria` | string | não | nó (agrupa itens em aba; apenas renderizado em `servicos-tabs`) |

**Decisão — `servicos-tabs` / origem das abas:** as abas derivam de `itens[].categoria` (campo opcional livre no editor). Não há `arquitetura.json` ou coleção externa. Se nenhum item tiver `categoria` preenchida, `servicos-tabs` degrada para `servicos-grade` (sem abas). Nenhum campo adicional obrigatório — regra C.8 respeitada.

**Empty state:** bloco suprimido se `itens.length === 0`.
**servicos-destaque:** `itens.length === 1` → só destaque, sem grade menor.
**servicos-tabs:** sem `categoria` em nenhum item → degrada para `servicos-grade`.
**Imagem ausente (grade/destaque):** card renderiza sem imagem; se `icone` definido, exibe ícone; caso contrário, card sem visual de topo.

---

## 4. Sobre

**Status no agente-presenca:** AUSENTE como componente. `brand.org.sobre` usado como `lead` inline no Hero. Sem bloco dedicado.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `sobre-foto` | Duas colunas: foto grande esquerda + bio texto direita + CTA opcional | Novo |
| `sobre-metricas` | Bio texto + grade de métricas-destaque (anos, pacientes, etc.) | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó ("Sobre mim", "Nossa clínica", etc.) |
| `texto` | string | **sim** | nó |
| `imagem` | imagem | não | mídia |
| `imagemAlt` | string | não | nó |
| `ctaTexto` | string | não | nó |
| `ctaHref` | string | não | nó |
| `metricas` | array | não | nó (só renderizado em sobre-metricas) |
| `metricas[].valor` | string | não | nó ("15+" , "10 mil") |
| `metricas[].label` | string | não | nó ("anos de experiência", "pacientes") |

**Empty state:** texto obrigatório — bloco não é emitido sem conteúdo.
**Imagem ausente (sobre-foto):** colapsa para layout full-width text. Sem placeholder.

---

## 5. Depoimentos

**Status no agente-presenca:** EXISTE — `Depoimentos.astro`, grade 1→2→3, nota opcional por depoimento.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `depoimentos-grade` | Grade 1→2→3 cols, card: avatar inicial + texto + nome + cargo + (opcional) ★ | Adaptado de `Depoimentos.astro` |
| `depoimentos-carrossel` | Carrossel de slides (um a um ou grupo de 3) | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó (default: "O que dizem") |
| `mostrarNota` | boolean | não | nó (default: `false`) |
| `itens` | array | **sim** | nó |
| `itens[].nome` | string | **sim** | nó |
| `itens[].texto` | string | **sim** | nó |
| `itens[].cargo` | string | não | nó |
| `itens[].nota` | number | não | nó (1-5; ignorado se `mostrarNota: false`) |

**Nota em estrelas — restrição:**
`mostrarNota` é desabilitado (campo oculto com tooltip) quando `configIdentidade.tipoNegocio` pertence ao grupo:
- Saúde: `MedicalBusiness`, `Physician`, `Dentist`, `Dentist`, `Psychologist`, `Psychotherapist`, `MedicalClinic`
- Profissional liberal: `Attorney`, `Lawyer`, `LegalService`, `Accountant`, `FinancialService`

Tooltip: "Esta categoria não permite avaliação com estrelas por questões éticas e regulatórias."
Flag padrão OFF para todos; ativação manual apenas para categorias permitidas.

**Empty state:** bloco suprimido se `itens.length === 0`.

---

## 6. Prova

**Status no agente-presenca:** EXISTE parcial — `ProvaLogos.astro` (logos grayscale). Sem variante de métricas.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `prova-logos` | Grade de logos grayscale (parceiros, selos, veículos de imprensa) | Adaptado de `ProvaLogos.astro` |
| `prova-metricas` | Grade de números-destaque + rótulo (ex.: "10k+ pacientes") | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó |
| `logos` | array | não | nó (renderizado em prova-logos) |
| `logos[].imagem` | imagem | não | mídia |
| `logos[].alt` | string | não | nó |
| `metricas` | array | não | nó (renderizado em prova-metricas) |
| `metricas[].valor` | string | não | nó |
| `metricas[].label` | string | não | nó |

Nota: `logos` e `metricas` coexistem no schema; a variante determina qual renderizar.
**Empty state:** bloco suprimido se o array da variante ativa estiver vazio.
**Imagem ausente (prova-logos):** item sem imagem é pulado; se todos sem imagem → bloco suprimido.

---

## 7. Passos

**Status no agente-presenca:** EXISTE — `Passos.astro`, `numerado` flag, grade 3 cols, sem ícone por passo.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `passos-numerados` | Card: número circular + título + texto | Adaptado de `Passos.astro` |
| `passos-icones` | Card: ícone Lucide + título + texto | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó |
| `itens` | array | **sim** | nó |
| `itens[].titulo` | string | **sim** | nó |
| `itens[].texto` | string | não | nó |
| `itens[].icone` | string | não | nó (nome Lucide; ignorado em passos-numerados) |

**Empty state:** bloco suprimido se `itens.length === 0`.

---

## 8. Faq

**Status no agente-presenca:** EXISTE — `Faq.astro`, acordeão `<details>/<summary>` nativo, suprimido se `itens.length === 0`.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `faq-acordeao` | Accordeão nativo `<details>`; sem JS | Adaptado de `Faq.astro` |
| `faq-duas-colunas` | Perguntas distribuídas em 2 colunas; reduz a altura da seção pela metade com 8+ perguntas | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó (default: "Perguntas frequentes") |
| `itens` | array | **sim** | nó |
| `itens[].pergunta` | string | **sim** | nó |
| `itens[].resposta` | string | **sim** | nó |

**Empty state:** bloco suprimido se `itens.length === 0`.
**faq-duas-colunas:** `itens.length === 1` → coluna única (sem colunas desequilibradas).

---

## 9. Cta

**Status no agente-presenca:** EXISTE — `Cta.astro`, banner full-width `bg-primary`, todos os campos obrigatórios. `Oferta.astro` complementa para venda, mas é infoproduto.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `cta-banner` | Full-width banner bg-primary, texto esquerda + botão direita | Adaptado de `Cta.astro` |
| `cta-card` | Cartão contido (fundo surface-2 + borda), centrado; para CTA no meio da página sem quebrar a leitura | Novo |

**Nota:** `cta-card` já constava nas 2 variantes originais. A descrição enviada em B.7 coincide exatamente com o que foi definido. Bloco Cta permanece com 2 variantes — nenhuma adição.

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | **sim** | nó |
| `subtitulo` | string | não | nó |
| `botaoTexto` | string | **sim** | nó |
| `botaoHref` | string | **sim** | nó |

---

## 10. Equipe

**Status no agente-presenca:** AUSENTE como bloco. `AutorBox.astro` cobre 1 autor por post; sem grade de equipe.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `equipe-grade` | Grade 2→3→4 cols, card: foto + nome + cargo + bio snippet | Novo |
| `equipe-lista` | Lista horizontal scrollável, cards maiores com mais detalhe | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó |
| `itens` | array | **sim** | nó |
| `itens[].nome` | string | **sim** | nó |
| `itens[].cargo` | string | **sim** | nó |
| `itens[].bio` | string | não | nó |
| `itens[].imagem` | imagem | não | mídia |
| `itens[].imagemAlt` | string | não | nó |

**Empty state:** bloco suprimido se `itens.length === 0`.
**Imagem ausente:** avatar de iniciais (padrão do `AutorBox.astro`). Nenhum card quebrado.

---

## 11. Precos

**Status no agente-presenca:** EXISTE como `Oferta.astro` — card de produto infoproduto (preço BRL + parcelas + garantia + bônus). Não se aplica ao negócio local.

**Decisão:** `Oferta.astro` → **DESCARTADO** para SiteFlow.
Redesenho completo como tabela/cards de preços de serviços profissionais.
Campos de infoproduto removidos: `parcelas`, `garantiaDias`, `bonus`, `de/por` (pricing pressure), `checkoutUrl`.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `precos-tabela` | Tabela de serviços: coluna serviço + preço + detalhe, com CTA por linha opcional | Novo |
| `precos-cards` | Cards por serviço/plano (até 4), `destaque` realça um card | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó (sugestão: "Investimento", "Consultas") |
| `subtitulo` | string | não | nó |
| `nota` | string | não | nó (ex.: "Valores podem variar conforme avaliação") |
| `itens` | array | **sim** | nó |
| `itens[].nome` | string | **sim** | nó |
| `itens[].preco` | string | não | nó (texto livre: "R$ 250", "Sob consulta", "A partir de…") |
| `itens[].descricao` | string | não | nó |
| `itens[].destaque` | boolean | não | nó (default: `false`; destaca linha/card) |

Nota: `preco` é string livre — inclui faixas, "sob consulta" e formatos irregulares comuns em serviços profissionais.
**Empty state:** bloco suprimido se `itens.length === 0`.

---

## 12. Contato

**Status no agente-presenca:** AUSENTE como componente. `brand.contato` tem campos (whatsapp, email, instagram) sem bloco visual de formulário/mapa.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `contato-mapa` | Formulário + mapa (iframe Google Maps) + coluna lateral: endereço + horários + contatos | Novo |
| `contato-info` | Formulário + coluna lateral sem mapa (para quem não tem endereço físico) | Novo |

### Campo compartilhado (field set)

**Campos de editor (por instância):**

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó (default: "Entre em contato") |
| `subtitulo` | string | não | nó |
| `mostrarFormulario` | boolean | não | nó (default: `true`) |
| `mostrarMapa` | boolean | não | nó (default: `false`; relevante em contato-info) |

**Campos auto-preenchidos do store:**

| Campo | Origem |
|---|---|
| `negocio.telefone` | configContato |
| `negocio.whatsapp` | configContato |
| `negocio.logradouro`, `.numero`, `.complemento`, `.bairro`, `.cidade`, `.estado`, `.cep` | configContato |
| `negocio.horarios[]` | configContato (horários de funcionamento) |
| `negocio.atendimentoOnline` | configContato |

**Empty state:** bloco sempre renderiza (formulário + dados do store). Se store sem endereço → coluna lateral exibe só contatos.

---

## 13. PostLista

**Status no agente-presenca:** AUSENTE como componente standalone. Lógica inline em `index.astro`; `Catalogo.astro` cobre lista de cursos/produtos mas não posts.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `post-lista-grade` | Grade 1→2→3 cols, card: imagem + categoria + título + data | Novo |
| `post-lista-lista` | Lista vertical compacta: título + data + categoria, sem imagem | Novo |
| `post-lista-destaque` | Primeiro post em destaque large (featured) + grade menor para os demais; define cara editorial | Novo |

### Campo compartilhado (field set)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `titulo` | string | não | nó |
| `limite` | number | não | nó (default: 6) |
| `categoria` | string | não | nó (filtrar por categoria; vazio = todos) |
| `verTodosTexto` | string | não | nó (ex.: "Ver todos os artigos") |
| `verTodosHref` | string | não | nó (ex.: "/blog") |

Dados de cada post derivados de `posts.*`:
- `posts[].titulo`, `posts[].data`, `posts[].categoria`, `posts[].slug`, `posts[].imagemDestaque`

**Empty state:** bloco suprimido se nenhum post disponível (ou 0 após filtro de categoria).
**post-lista-destaque:** 1 post disponível → só destaque, sem grade menor.
**Imagem ausente (grade):** card sem imagem exibe placeholder de cor com categoria em texto.
**Imagem ausente (post-lista-destaque):** post destaque sem imagem → placeholder full-width de cor + categoria.

---

## 14. Footer

**Status no agente-presenca:** EXISTE — `Footer.astro` sem props, tudo em brand; branch `isBlog` exibe affiliate disclosure.

### Variantes

| Slug | Descrição | Origem |
|---|---|---|
| `footer-padrao` | Logo + nav + redes sociais + endereço + horários + legal | Adaptado de `Footer.astro` |
| `footer-minimal` | Logo + nav + copyright apenas | Novo |
| `footer-colunas` | 3-4 colunas categorizadas (serviços · blog · sobre · legal) + endereço; peso e estrutura distintos | Novo |

### Campo compartilhado (field set)

| Campo | Origem |
|---|---|
| `marca.nomeSite` | store |
| `marca.logoClaro` | store |
| `negocio.logradouro`, `.cidade`, `.estado` | configContato |
| `negocio.telefone` | configContato |
| `privacidade.cnpj` | privacidadeConfig |
| `configRedes.*` (ativas) | store |

Nota de afiliados (`isBlog`) → **DESCARTADO** para SiteFlow negócio local.
**Empty state:** nomeSite fallback `"Empresa"`. Logo ausente → texto.
**footer-colunas:** colunas sem itens preenchidos são omitidas; mínimo 1 coluna renderizada.

---

## Decisões sobre componentes infoproduto

| Componente | Decisão | Motivo |
|---|---|---|
| `LandingHero.astro` | **Adapta** → `hero-landing` | Útil para landing pages de consulta; sem pricing |
| `Oferta.astro` | **Descarta** + redesenho → `Precos` | Parcelas/bônus/garantia são construções de infoproduto; negócio local usa tabela de serviços |
| `Catalogo.astro` | **Descarta** | Lista de cursos; sem equivalente em negócio local |
| `ComparisonTable.astro` | **Descarta** | Tabela comparativa blog-afiliado; irrelevante |
| `Newsletter.astro` | **Descarta** | Captura de e-mail; fora do escopo inicial do CMS |
| `Countdown.astro` | **Descarta** | Urgência evergreen de oferta; padrão antiético em saúde |
| `AffiliateButton.astro` | **Descarta** | Componente inline afiliado |
| `ProductCard.astro` | **Descarta** | Card de produto afiliado |
| `Stars.astro` | **Adapta parcialmente** | Usado em `depoimentos-grade` como `mostrarNota`; bloqueado para Saúde + Profissional liberal |
| `PostMeta.astro` | **Adapta** | Metadados de artigo: autor + data + categoria — reutilizável em post-lista e página de post |
| `AutorBox.astro` | **Adapta** | Box de autor em artigo; reutilizável. Também referência para avatar de iniciais em Equipe |
| `ShareButtons.astro` | **Adapta** | Compartilhamento social — reutilizável em artigo |
| `Callout.astro` | **Adapta** | Aside inline MDX (dica/atenção); não é bloco de seção, permanece componente inline |

---

## Composições de página

Legenda: **O** = obrigatório · R = recomendado · o = opcional

| Bloco | home | servico-padrao | artigo | pilar | area-atendida | institucional | contato |
|---|---|---|---|---|---|---|---|
| Header | **O** | **O** | **O** | **O** | **O** | **O** | **O** |
| Hero | **O** | **O** | — | R | **O** | o | — |
| Servicos | R | R | — | — | R | — | — |
| Sobre | o | — | — | — | — | **O** | — |
| Depoimentos | R | o | — | — | R | o | — |
| Prova | o | — | — | R | o | o | — |
| Passos | o | R | — | o | o | R | — |
| Faq | R | R | o | **O** | **O** | — | R |
| Cta | **O** | **O** | o | o | o | o | — |
| Equipe | o | — | — | — | — | R | — |
| Precos | o | o | — | — | — | — | — |
| Contato | — | — | — | — | **O** | — | **O** |
| PostLista | o | — | — | R | — | — | — |
| Footer | **O** | **O** | **O** | **O** | **O** | **O** | **O** |

**Variante recomendada por composição:**

| Template | Hero | Depoimentos | Prova | Passos | Cta | Footer |
|---|---|---|---|---|---|---|
| home | `hero-imagem` | `depoimentos-grade` | qualquer | `passos-numerados` | `cta-banner` | `footer-padrao` |
| servico-padrao | `hero-texto` | `depoimentos-grade` | — | `passos-numerados` | `cta-banner` | `footer-padrao` |
| artigo | — | — | — | — | `cta-card` | `footer-minimal` |
| pilar | `hero-texto` | — | `prova-metricas` | — | `cta-banner` | `footer-padrao` |
| area-atendida | `hero-texto` | `depoimentos-grade` | — | — | — | `footer-padrao` |
| institucional | — | `depoimentos-grade` | — | `passos-icones` | `cta-card` | `footer-padrao` |
| contato | — | — | — | — | — | `footer-padrao` |

---

## Contagem final

| Categoria | Total |
|---|---|
| **Total de variantes** | **38** |
| Adaptadas do agente-presenca | 9 |
| Novas (sem equivalente) | 29 |

**Adaptadas (9):**
`header-padrao`, `hero-texto`, `hero-landing`, `depoimentos-grade`, `prova-logos`, `passos-numerados`, `faq-acordeao`, `cta-banner`, `footer-padrao`

**Novas (29):**
`header-minimal`, `header-centrado`, `header-transparente`,
`hero-imagem`, `hero-video`, `hero-split`, `hero-editorial`,
`servicos-grade`, `servicos-lista`, `servicos-destaque`, `servicos-tabs`,
`sobre-foto`, `sobre-metricas`,
`depoimentos-carrossel`,
`prova-metricas`,
`passos-icones`,
`cta-card`,
`faq-duas-colunas`,
`equipe-grade`, `equipe-lista`,
`precos-tabela`, `precos-cards`,
`contato-mapa`, `contato-info`,
`post-lista-grade`, `post-lista-lista`, `post-lista-destaque`,
`footer-minimal`, `footer-colunas`

**Nota sobre revisão B.7 (cta-card):** `cta-card` já constava nas 2 variantes originais do bloco Cta. A descrição da revisão coincide com o que foi definido. Não foi adicionada variante extra — as 9 novas variantes desta revisão somam, não substituem.

**Componentes infoproduto descartados (5):** `Oferta`, `Catalogo`, `ComparisonTable`, `Newsletter`, `Countdown`
**Componentes infoproduto adaptados (3):** `Stars` (→ nota em depoimentos, restrita), `PostMeta`, `AutorBox`
**Componentes inline mantidos (2):** `Callout`, `ShareButtons`
