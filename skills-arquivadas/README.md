# Skills arquivadas

Este diretório fica fora de `skills/` de propósito — o agente não escaneia
nem carrega nada daqui. É um arquivo morto, não um catálogo ativo.

## icp, marca, proposta

**Arquivadas em:** setembro de 2026
**Motivo:** duplicidade descoberta na unificação dos dois agentes (Lucas
+ Jorge). O `icp` original (Lucas) e o `icp-gmb` (Jorge) coexistiam sem
nunca terem sido de fato unificados — cada um salvando em formato
diferente, arriscando o agente pegar o caminho errado numa saudação
simples. Jorge confirmou que `icp-gmb` já cobre o que é usado hoje no
fluxo GMB, e que `/marca` e `/proposta` (que dependiam só do `icp`
original) não são mais usados no dia a dia.

**O que essas três skills faziam:**
- `icp` — onboarding completo (empresa + perfil de cliente ideal
  detalhado: renda, objeções, canais + tom de voz + referências de marca)
- `marca` — identidade visual completa (paleta, tipografia, prompts de
  logo) a partir do que o `icp` mapeou
- `proposta` — proposta comercial no visual da marca gerada pelo `marca`

**Campos que o `icp` original coletava e o `icp-gmb` não coleta:**
tempo de mercado, tamanho da equipe, redes sociais, gênero/profissão/renda
do cliente ideal, objeção mais comum antes de fechar, onde o cliente passa
tempo online, marcas de referência admiradas ou a evitar.

## Se quiser reativar no futuro

1. Mover a pasta de volta para `skills/`
2. Decidir se ela some a fonte de dados do `icp-gmb` (`_memoria/empresa.md`,
   `_memoria/preferencias.md`) com os campos extras do `icp` original, ou
   se volta a rodar como um onboarding separado
3. Restaurar as seções "Identidade Visual" e "Proposta Comercial" no
   `CLAUDE.md` (ver histórico do arquivo — foram removidas quando isso
   foi arquivado, mas o texto original está preservado aqui embaixo)
4. Atualizar `marca/SKILL.md` para ler de onde o `icp` reativado salvar

## Texto original removido do CLAUDE.md

Estas eram as duas seções que roteavam `/marca` e `/proposta` antes do
arquivamento. Se reativar, cole isto de volta no `CLAUDE.md` (ajustando
o que fizer sentido, como a fonte de dados se o `icp-gmb` virar a base):

```markdown
## Identidade Visual (ativado por `/marca`)

Quando o usuário digitar `/marca` ou pedir identidade visual, paleta de cores, fontes ou logo:
- Leia `_memoria/empresa.md` e `_memoria/icp.md`
- Se memória vazia → inicie o onboarding primeiro (`orq-icp`)
- Se memória preenchida → leia e execute `skills/marca/SKILL.md`

**Regra:** nunca gerar o logo diretamente — sempre entregar prompts para ferramentas externas (Ideogram, ChatGPT Image, NanoBanana).

---

## Proposta Comercial (ativado por `/proposta`)

Quando o usuário digitar `/proposta` ou pedir proposta comercial:
- Leia `_memoria/empresa.md` e `identidade/design-guide.md`
- Se identidade visual não estiver definida → orientar a fazer `/marca` primeiro
- Se estiver → leia e execute `skills/proposta/SKILL.md`
```
