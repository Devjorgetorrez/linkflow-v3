# Regras de Qualidade — claude-ranqueado
> Referência carregada sob demanda pelo agente `ranqueado-reviewer` (Gate 4 — BLOQUEANTE).
> Versão: 1.0 | Junho 2026

---

## Propósito

Este arquivo define o que o agente `ranqueado-reviewer` verifica antes de liberar qualquer conteúdo.
O reviewer é o único gate BLOQUEANTE da suite — nenhum conteúdo chega a você sem passar por aqui.

---

## Regra Central

> Você nunca é o primeiro revisor. O sistema é.

O reviewer itera até 3 vezes em qualquer falha antes de escalar para você.
Se após 3 iterações o score ainda for menor que 90, o sistema escala com diagnóstico completo.

---

## Critérios de Bloqueio Imediato (P0)

Qualquer um destes itens bloqueia a entrega independentemente do score total:

### Conteúdo
- [ ] Texto copiado ou parafraseado diretamente de concorrentes
- [ ] Informação factualmente incorreta sem fonte verificável
- [ ] Estrutura sem progressão lógica (saltos de assunto sem transição)
- [ ] H1 ausente ou múltiplos H1s no mesmo conteúdo
- [ ] Parágrafos com menos de 4 linhas em seções H1/H2 (exceto H3)
- [ ] Menos de 2 parágrafos por seção H1/H2

### SEO
- [ ] Keyword stuffing — densidade de palavra-chave acima de 3%
- [ ] Meta title acima de 65 caracteres
- [ ] Palavra-chave principal ausente no H1
- [ ] Palavra-chave principal ausente no primeiro parágrafo
- [ ] Palavra-chave principal ausente na slug
- [ ] Palavra-chave principal ausente no title SEO

### GEO + AEO
- [ ] Nenhuma seção com resposta-primeiro (answer-first)
- [ ] FAQ ausente em conteúdo informacional

### Monetização
- [ ] CTA de venda em conteúdo Blog Discover
- [ ] Modelo de monetização errado para o tipo de página
- [ ] Conteúdo Site FDF sem nenhum elemento de conversão

### Técnico
- [ ] Imagens sem alt text
- [ ] Frontmatter ausente ou incompleto
- [ ] Schema JSON-LD ausente

---

## Critérios de Iteração (P1 — não bloqueam, mas exigem melhoria)

O reviewer solicita iteração se qualquer um destes estiver presente:

### Conteúdo
- Profundidade insuficiente — tema coberto superficialmente
- Originalidade baixa — sem perspectiva própria ou ângulo diferenciado
- Transições fracas entre seções

### SEO
- Palavras-chave secundárias ausentes ou concentradas em uma só seção
- Menos de 3 links internos por 1.500 palavras
- Meta description sem CTA ou abaixo de 150 caracteres

### GEO + AEO
- Blocos de texto acima de 180 palavras (prejudica citabilidade por IA)
- FAQ com menos de 3 perguntas
- Perguntas do FAQ não baseadas em PAA real

### Monetização
- CTA principal abaixo do fold (deve aparecer acima)
- CTA ausente ao final do conteúdo
- Intenção de busca parcialmente respeitada

---

## Fluxo de Decisão do Reviewer

```
Recebe conteúdo
      ↓
Verifica P0s
      ↓
Algum P0? → SIM → BLOCKING: true → Writer itera
      ↓ NÃO
Calcula score (rubrica-pontuacao.md)
      ↓
Score >= 90? → SIM → BLOCKING: false → Entrega a você
      ↓ NÃO
Identifica P1s prioritários
      ↓
Iteração < 3? → SIM → BLOCKING: true → Writer itera com diagnóstico
      ↓ NÃO
Escala para você com relatório completo
```

---

## Formato de Saída Obrigatório do Reviewer

```
BLOCKING: true|false
Score: XX/100
Breakdown:
  - Qualidade do Conteúdo: XX/30
  - Otimização SEO: XX/25
  - GEO + AEO: XX/20
  - Monetização: XX/15
  - Técnico: XX/10
Problemas P0: [lista detalhada ou "nenhum"]
Problemas P1: [lista detalhada ou "nenhum"]
Iteração: X/3
Recomendação: [ação específica e cirúrgica para próxima iteração]
```

---

## Regras Inegociáveis

Estas regras nunca são flexibilizadas, independentemente do contexto:

| Regra | Limite |
|---|---|
| Estatísticas sem fonte | Zero tolerância |
| Parágrafos em H1/H2 | Mínimo 4 linhas, mínimo 2 por seção |
| Parágrafos em H3 | Mínimo 2 linhas |
| Hierarquia de headings | Nunca pula nível (H1 → H2 → H3) |
| Keyword density | Nunca acima de 3% |
| Alt text em imagens | Obrigatório em todas |
| Score mínimo de entrega | 90/100 |
| Iterações antes de escalar | Máximo 3 |

---

## Como Carregar Esta Referência

Carregar quando: gate 4 de qualquer comando da suite

```
Arquivo: skills/ranqueado/references/regras-qualidade.md
```
