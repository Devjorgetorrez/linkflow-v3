# fase2-diagnostico - Diagnostico do Site do Cliente + Veredito (sub-skill da Fase 2)

Invocada por fase2-site APENAS SE o cliente TEM site (campo Site no projeto.md != 'a criar').
Se cliente nao tem site: PULADA (o raio-X do lider ja e o blueprint).
Responsabilidade unica: cruzar o site atual do cliente com o lider e dar veredito consertar-vs-reconstruir.
Motor: WebFetch + crawl.py. Reusa framework do local-seo-audit, motor trocado.

## Entrada
- URL do site atual do cliente (do projeto.md)
- Raio-X do lider ja pronto (arvore, schema, tecnico - no projeto.md)
- Money Pages e kw_principal (Fase 1)

## ETAPA 1 - Raio-X do site do cliente
Rodar no site do cliente o mesmo que fizemos no lider:
- Sitemap -> arvore de silos
- Schema detectado
- Tecnico: SSR/CSR, HTTPS, canonical, robots, breadcrumbs, meta
- Quais Money Pages (da Fase 1) o cliente JA tem e quais faltam

## ETAPA 2 - Gap analysis (cliente vs lider)
Tabela: Item | Lider tem? | Cliente tem? | Gap
Cobrir: paginas de servico, schema, HTTPS, arquitetura, silos, breadcrumbs, meta, blog.
FALLBACK SE LIDER BLOQUEOU WEBFETCH (403/Cloudflare):
Nao pular a tabela. Usar os dados ja salvos no projeto.md pela Fase 1 e fase2-tecnico para preencher a coluna "Lider tem?". Se um dado do lider nao foi verificado, registrar como "NAO VERIFICADO (403)" — nunca omitir a linha. A tabela e obrigatoria independente do acesso ao site do lider.

Classificar dificuldade de cada gap:
- FACIL: config Yoast, meta, breadcrumb, injetar schema
- MEDIO: criar paginas faltantes, reescrever conteudo, ajustar URLs
- CRITICO: arquitetura errada, CSR sem SSR, dominio penalizado, estrutura irreparavel

## ETAPA 3 - Veredito consertar-vs-reconstruir
- 0-1 criticos + base ok (SSR, HTTPS, WordPress) = CONSERTAR
- 2+ criticos OU CSR sem SSR OU arquitetura irrecuperavel OU dominio penalizado = RECONSTRUIR
- Se tem trafego/autoridade (DR alto, backlinks) mesmo com problemas = tender a CONSERTAR (nao jogar fora autoridade)
Veredito HONESTO. Nao recomendar reconstruir so pra vender mais trabalho.
Se o site esta bom, dizer que esta bom e listar so ajustes finos.

REGRA — Mudança de diagnóstico: se o projeto.md já contém um veredito anterior (sessão passada), VERIFICAR antes de sobrescrever. Se o novo veredito for diferente:
- REGISTRAR no projeto.md, dentro de ### Diagnóstico do Site do Cliente: "Veredito atualizado em [data]: [novo veredito]. Anterior: [veredito antigo]. Motivo da mudança: [explicar o que foi descoberto ou corrigido]."
- NUNCA contradizer um veredito anterior em silêncio — qualquer mudança deve ter registro explícito com justificativa.

TRAVA ANTI-DIAGNÓSTICO-FALSO: antes de classificar um concorrente (coluna "Lider tem?"), confirmar o tipo de site. Um marketplace/diretório (ex: cotação coletiva, formulário de leads) NÃO tem blog próprio, NÃO tem conteúdo editorial próprio e NÃO é referência para veredito de construir vs. consertar. Declarar o tipo do site antes de emitir o veredito.

## ETAPA 4 - Plano de acao passo a passo (leigo)
CONSERTAR: lista numerada, da mais critica a menos, onde fazer (Yoast, WPCode).
RECONSTRUIR: por que em 3-4 pontos + o que aproveitar (conteudo, dominio, imagens).

## Saida (salvar na secao Raio-X Tecnico do projeto.md)
### Diagnostico do Site do Cliente
- URL analisada
- Raio-X do cliente (SSR/CSR, HTTPS, schema, arquitetura, money pages presentes/ausentes)
### Gap Analysis (cliente vs lider)
tabela Item | Lider | Cliente | Gap | Dificuldade
### VEREDITO: CONSERTAR ou RECONSTRUIR + justificativa (3-4 pontos)
### Plano de Acao (passo a passo, leigo)

## Degradacao
Site do cliente fora do ar: tratar como cliente sem site (usar blueprint do lider)
Sitemap do cliente ausente: crawl.py direto