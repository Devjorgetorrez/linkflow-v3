# PADRÃO ÚNICO — claude-ranqueado
> A fonte da verdade. Template, Skill e Agent DEVEM concordar com este documento.
> Gerado na auditoria de consistência | Junho 2026
> Se qualquer arquivo divergir daqui, o arquivo está errado — corrigir o arquivo.

---

## RESULTADO DA AUDITORIA DE CONSISTÊNCIA

| Ponto checado | Status |
|---|---|
| Nomes dos agentes (SKILL × arquivos reais) | ✅ Consistente |
| scorer removido (fundido no reviewer) | ✅ Consistente |
| FAQ como último H2 (8 templates) + Discover sem FAQ | ✅ Consistente |
| Garantia 7 dias (template + redator infoproduto) | ✅ Consistente |
| SKILL aciona preflight/checker | ✅ Consistente |
| **WORD COUNT (planejamento × templates)** | ❌ **CONFLITO — corrigir** |
| **Checker valida word count por template** | ❌ Lacuna |

---

## ⚠️ O CONFLITO ENCONTRADO — Word Count

**O problema:** duas fontes mandam coisas diferentes sobre o tamanho do artigo.

- **O planejamento (ETAPA 7)** diz: "word count alvo = MÉDIA dos 3 primeiros colocados"
- **Cada template** tem um RANGE FIXO próprio:
  - blog-fdf-comparativo: 1.800-2.800
  - blog-search-guia: 4.000-12.000+
  - blog-search-informacional: mínimo 1.500
  - site-fdf-seo-local: 600-1.200 (MAIS não é melhor)
  - blog-discover: 1.000-1.400
  - site-fdf-infoproduto: (sem range explícito — é landing)

**Se a média dos concorrentes brigar com o range do template, quem ganha?**

Exemplo do perigo: num Site FDF Local, se os concorrentes têm 3.000 palavras de média, o planejamento mandaria 3.000 — mas o template diz 600-1.200 (porque landing de conversão NÃO deve ser longa). Seguir a média aqui destruiria a conversão.

### A REGRA DEFINITIVA (resolve o conflito)

```
O RANGE DO TEMPLATE SEMPRE MANDA. A média dos concorrentes só ajusta DENTRO do range.

1. Cada template tem um range fixo (a tabela abaixo)
2. O planejamento calcula a média dos 3 primeiros colocados
3. Se a média cair DENTRO do range → usar a média
4. Se a média for MAIOR que o teto do range → usar o TETO do range
5. Se a média for MENOR que o piso do range → usar o PISO do range

O template tem prioridade porque ele reflete a NATUREZA do conteúdo
(uma landing local curta converte mais; um guia precisa ser longo).
A média serve para calibrar dentro do que o template permite, nunca para estourar.
```

### Tabela oficial de word count por template (a fonte da verdade)

| Template | Range do ARTIGO | Observação |
|---|---|---|
| blog-fdf-review | soma dos produtos × 150-300 cada + seções | nº de produtos = padrão dos 3 primeiros |
| blog-fdf-comparativo | 1.800-2.800 | — |
| blog-fdf-produto-unico | 2.000-3.500 | nunca abaixo de 2.000 |
| blog-search-informacional | 1.500-3.000 | — |
| blog-search-guia | 4.000-12.000+ | mínimo 300 por H2 |
| blog-search-lista | conforme nº de itens | — |
| site-fdf-seo-local | 600-1.200 | MAIS não é melhor (conversão) |
| site-fdf-infoproduto | landing (sem range fixo) | tamanho = necessidade da copy |
| blog-discover | 1.000-1.400 | ritmo > extensão |

---

## PADRÕES TRAVADOS (todos os arquivos devem concordar)

### Estrutura
- H1 único sempre
- FAQ é o último H2 (TODOS os templates EXCETO Discover)
- Discover: SEM FAQ, termina com fecho emocional
- Hierarquia nunca pula nível (H1 → H2 → H3)
- Tabela comparativa/decisão fica ANTES do 1º H2 (após a introdução), nunca como H2 separado

### Palavra-chave
- KW primária EXATA (mesma forma, sem variar singular/plural) no:
  - H1, 1º parágrafo, 1º H2, último H2 antes do FAQ, meta title, meta description, slug
- Exceção: Discover — KW não obrigatória no H1 (título pode ser intrigante)
- Densidade: total ÷ 125 repetições, máximo 3%
- Secundárias: cada uma no mínimo 2x

### Número de produtos/itens (review e lista)
- Segue o PADRÃO DOS 3 PRIMEIROS colocados (não o maior de uma lista grande)
- O número do H1 = número real de produtos/itens entregues
- Nunca inventar produto para completar número

### Word count
- O RANGE DO TEMPLATE manda; a média dos 3 calibra dentro do range (ver regra acima)
- NUNCA "superar o líder em tamanho" — conteúdo melhor não é maior

### Formato de saída por modelo
- Blog FDF: HTML uniforme com CSS inline (nunca misturar Markdown)
- Blog Search / Site Money: Markdown + HTML pontual (Summary Box, tabela, gráfico)
- Site FDF (local e infoproduto): blocos de copy rotulados para page builder (NÃO HTML)
- Discover: Markdown, ZERO emojis

### Garantia
- Site FDF Infoproduto: SEMPRE 7 dias (nunca 30)

### Imagens
- Blog FDF: foto do produto = você fornece (placeholder URL); hero = banco gratuito 1250×650
- Blog Search: hero = pessoa hiper-realista 1250×650 (gerar 1152×896)
- Discover: 1344×896, ALT descritivo (nunca KW forçada)
- Toda imagem com ALT

### FAQ por tipo (importante — não confundir)
- Blog Search: FAQ = dúvidas sobre o TEMA
- Site FDF Local: FAQ = objeções de VENDA (preço, cobertura, garantia)
- Site FDF Infoproduto: FAQ = objeções de COMPRA
- Blog FDF: FAQ = dúvidas sobre os produtos

### Gates de qualidade (a "parede")
- revisor-pauta valida o outline ANTES da PARADA 2 (gate bloqueante)
- preflight (contrato de entrega) roda ANTES da PARADA 3
- O veredito é do EXIT CODE do script — agente nunca reinterpreta
- Loop de correção até 3x; na 3ª falha, para e mostra o diagnóstico
- Você NUNCA é o primeiro revisor

### Fluxo do orquestrador (ordem fixa)
```
1. Lê projeto.md (sem ele, manda configurar)
2. Detecta intenção → template → modelo
3. PASSO 2: planejamento (na thread principal, p/ MCP)
4. PARADA 1: aprovação do planejamento (mostra ferramenta usada)
5. PASSO 3: outline DERIVA estrutura (nunca recebe pronta)
6. PASSO 3.5: revisor-pauta valida (gate)
7. PARADA 2: aprovação do outline (mostra H2 reais)
8. PASSO 4: redator do modelo escreve
9. PASSO 5: preflight (contrato de entrega) + reviewer
10. PARADA 3: aprovação final
11. PASSO 6: entrega + atualiza projeto.md
```

---

## O QUE JÁ FOI CORRIGIDO (no jeito da referência)

1. ✅ **planejamento ETAPA 7** — regra de word count: "range do template manda, média calibra dentro". RESOLVIDO.
2. ✅ **outline palavras por produto** — alinhado à faixa do template (150-300), removido o esquema próprio de 175w. A referência usa faixa, não número fixo. RESOLVIDO.
3. ✅ **checker reporta word count** — contra o range do template, como INFORMATIVO (não bloqueia), igual à referência (que reporta no seo-check e penaliza no scoring, mas o gate duro é parágrafo/estrutura). RESOLVIDO.

## O QUE AINDA FALTA (backlog — aplicar UMA POR VEZ, com teste)

1. **redator e revisor-pauta lerem a checklist do próprio template antes de entregar** (autovalidação — diferença B do cruzamento). É a de maior impacto e ainda pendente.
2. Spec answer-first 40-60 palavras (diferença #1 aprovada).
3. Verificação de links quebrados no preflight (diferença #3 e A aprovadas).
4. Freshness signals (diferença #6 aprovada).

NOTA sobre fiscalização do word count: seguindo a referência, o word count é REPORTADO, não bloqueado por alvo exato. O bloqueio duro continua sendo estrutura, KW e parágrafo. Isso resolve o "Risco 1" da forma como a referência resolve — sem criar um gate rígido de tamanho que engessaria o conteúdo.
