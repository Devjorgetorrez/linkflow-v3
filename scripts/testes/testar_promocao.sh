#!/bin/bash
# testar_promocao.sh <tema> <dir_de_build>
#   tema: base | tema-03 | tema-04 | tema-05 | tema-06 | tema-07 | sem-promocao
#
# Copia o _astro REAL do projeto (src + public) para uma pasta de build ISOLADA,
# promove o layout, faz build real e confere:
#   - nº de páginas geradas e nº de URLs no sitemap
#   - nenhum href/canonical com prefixo /tema-0X no HTML
#   - nenhuma rota /servicos/<x> ou /blog/<x> como página (URL é plana)
#   - nenhuma pasta tema-0X no dist
# NUNCA escreve na pasta real do projeto.
#
# <dir_de_build> é uma pasta FORA do projeto que já tem node_modules. Para criar:
#     mkdir -p /tmp/astro-build && cp _astro/package*.json _astro/astro.config.mjs /tmp/astro-build/ \
#       && cp -r _astro/integracoes /tmp/astro-build/ && (cd /tmp/astro-build && npm ci)
# (o script recopia src/ e public/ a cada execução; node_modules é reaproveitado)
#
# ISOLAR=tema-05  -> na cópia, remove os OUTROS layouts novos (05/06/07): um layout
#   em conversão por alguém não pode quebrar o build deste.
#
# Números esperados (26/09/2026): base 22 | tema-03 22 | tema-04 21 | tema-05 23 |
#   tema-06 20 | tema-07 21 | sem-promocao 131 (motor completo, com /catalogo).
set -u
TEMA=${1:?"uso: testar_promocao.sh <tema> <dir_de_build>"}
B=${2:?"uso: testar_promocao.sh <tema> <dir_de_build>"}
REAL="$(cd "$(dirname "$0")/../.." && pwd)"

[ -d "$B/node_modules" ] || { echo "ERRO: $B nao tem node_modules (veja o cabecalho do script)"; exit 2; }
cd "$B" && rm -rf src public dist .astro tema-ativo.json && cp -r "$REAL/_astro/src" src && cp -r "$REAL/_astro/public" public

if [ -n "${ISOLAR:-}" ]; then
  for n in 05 06 07; do
    if [ "tema-$n" != "$ISOLAR" ]; then
      rm -rf "src/pages/tema-$n" "src/content/tema-$n" "src/config/tema-$n.ts" "src/layouts/Tema${n}Base.astro"
    fi
  done
fi

if [ "$TEMA" != "sem-promocao" ]; then
  python "$REAL/scripts/promover_tema.py" --tema "$TEMA" --astro-dir "$B" || { echo "FALHA NA PROMOCAO"; exit 1; }
fi

npm run build 2>&1 | grep -E "error|Error|page\(s\) built|sitemap.xml gerado|WARN.*colis|colide" | head -20
[ -d dist ] || { echo "SEM DIST: build falhou"; exit 1; }

echo "PAGINAS (index.html): $(find dist -name index.html | wc -l)"
echo "URLS NO SITEMAP: $(grep -o '<loc>' dist/sitemap.xml 2>/dev/null | wc -l)"
if [ "$TEMA" != "sem-promocao" ]; then
  echo "hrefs/canonicals com /tema-0X: $(grep -rEho '(href|content)="[^"]*/tema-0[0-9][^"]*"' dist --include=*.html | wc -l)  (esperado 0)"
  echo "rotas planas quebradas (/servicos/<x> ou /blog/<x> como pagina): $(find dist -mindepth 3 -name index.html | grep -E '^dist/(servicos|blog)/[^/]+/index.html$' | wc -l)  (esperado 0)"
  echo "pastas tema-0X no dist: $(find dist -maxdepth 1 -name 'tema-0*' | wc -l)  (esperado 0)"
  echo "capa do catalogo no dist: $([ -d dist/catalogo ] && echo SIM-ERRO || echo nao)  (esperado nao)"
fi
