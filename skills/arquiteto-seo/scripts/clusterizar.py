#!/usr/bin/env python3
"""
clusterizar.py — Classifica intenção de busca e agrupa páginas em clusters (silos).
Uso: python clusterizar.py paginas.json [--out clusters.json]

Entrada: paginas.json do crawl.py (opcionalmente já enriquecido com volume/kd via API,
campos "volume", "kd", "cpc", "intencao_api" anexados por página).
Saída: clusters.json com intenção por página, clusters, pilar e money pages.

Heurística textual de intenção — a intenção vinda de API ("intencao_api"), quando presente,
SEMPRE tem prioridade sobre a heurística.
"""
import sys, json, re, argparse
from collections import defaultdict

STOP = set("de da do das dos e a o as os um uma para com por em no na nos nas que the and "
           "of to for your you how what best top vs review guide com br www https http".split())

SINAIS = {
    "T": ["comprar", "compre", "preco", "preço", "valor", "contratar", "assinar", "orcamento",
          "orçamento", "checkout", "carrinho", "loja", "produto", "produtos", "plano", "planos",
          "cotacao", "cotação", "frete", "promocao", "promoção", "desconto"],
    "C": ["melhor", "melhores", "vs", "comparativo", "comparacao", "comparação", "review",
          "avaliacao", "avaliação", "top", "ranking", "alternativa", "alternativas", "qual"],
    "I": ["como", "o que e", "o que é", "porque", "por que", "guia", "tutorial", "passo a passo",
          "dicas", "exemplos", "significado", "para que serve", "beneficios", "benefícios", "blog"],
    "N": ["login", "entrar", "contato", "sobre", "quem somos", "fale conosco", "trabalhe",
          "politica", "política", "termos", "privacidade", "minha conta"],
}
SEG_HINT = {
    "blog": "I", "artigos": "I", "noticias": "I", "guia": "I", "guias": "I",
    "produto": "T", "produtos": "T", "loja": "T", "comprar": "T", "servicos": "T", "servico": "T",
    "sobre": "N", "contato": "N", "login": "N", "conta": "N",
}


def texto_pagina(p):
    return " ".join([p.get("title", ""), p.get("h1", ""),
                     " ".join(p.get("h2", [])), p.get("url", "")]).lower()


def classificar_intencao(p):
    if p.get("intencao_api"):
        m = {"transactional": "T", "commercial": "C", "informational": "I", "navigational": "N"}
        v = str(p["intencao_api"]).lower()
        for k, s in m.items():
            if k in v:
                return s
    seg = p.get("segmento", "")
    if seg in SEG_HINT:
        base = SEG_HINT[seg]
    else:
        base = None
    txt = texto_pagina(p)
    score = {k: sum(1 for s in v if s in txt) for k, v in SINAIS.items()}
    # decisão: maior score; empate resolve por prioridade T > C > N > I
    best = max(score, key=lambda k: (score[k], {"T": 4, "C": 3, "N": 2, "I": 1}[k]))
    if score[best] == 0:
        return base or "I"
    return best


def tokens(p):
    txt = (p.get("title", "") + " " + p.get("h1", "")).lower()
    txt = re.sub(r"[^a-zà-ú0-9\s]", " ", txt)
    return [t for t in txt.split() if t not in STOP and len(t) > 2]


def importancia(p):
    vol = p.get("volume") or 0
    inl = p.get("inlinks") or 0
    # peso: volume domina, links internos reforçam
    return vol * 1.0 + inl * 50


def clusterizar(pages):
    # token de assinatura = segmento + token mais frequente do título
    freq = defaultdict(int)
    for p in pages:
        for t in tokens(p):
            freq[t] += 1
    grupos = defaultdict(list)
    for p in pages:
        toks = [t for t in tokens(p) if freq[t] >= 2] or tokens(p)
        chave = (p.get("segmento", "(home)") if p.get("segmento") not in ("blog", "artigos") else "blog")
        tema = max(toks, key=lambda t: freq[t]) if toks else chave
        grupos[f"{tema}"].append(p)
    # montar clusters
    clusters = []
    for tema, pgs in grupos.items():
        for p in pgs:
            p["intencao"] = classificar_intencao(p)
        pgs_sorted = sorted(pgs, key=importancia, reverse=True)
        pilar = next((p for p in pgs_sorted if p["intencao"] in ("C", "T")), pgs_sorted[0])
        money = [p for p in pgs if p["intencao"] == "T"]
        support = [p for p in pgs if p["intencao"] == "I"]
        clusters.append({
            "tema": tema,
            "pilar": pilar["url"],
            "n_paginas": len(pgs),
            "money_pages": [m["url"] for m in money],
            "supporting": [s["url"] for s in support],
            "paginas": pgs,
        })
    clusters.sort(key=lambda c: c["n_paginas"], reverse=True)
    return clusters


def prioridade(p):
    vol = p.get("volume") or 0
    kd = p.get("kd") if p.get("kd") is not None else 50
    intent = p.get("intencao", "I")
    if vol >= 500 and kd <= 30 and intent in ("T", "C"):
        return "ALTA"
    if intent == "T" or vol >= 200:
        return "MÉDIA"
    return "BAIXA"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("paginas")
    ap.add_argument("--out", default="clusters.json")
    args = ap.parse_args()

    data = json.load(open(args.paginas, encoding="utf-8"))
    pages = data["pages"]
    clusters = clusterizar(pages)
    for p in pages:
        p["prioridade"] = prioridade(p)

    dist = defaultdict(int)
    for p in pages:
        dist[p.get("intencao", "I")] += 1

    out = {
        "domain": data.get("domain"),
        "total_paginas": len(pages),
        "distribuicao_intencao": dict(dist),
        "n_clusters": len(clusters),
        "clusters": clusters,
    }
    json.dump(out, open(args.out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"OK - {len(clusters)} clusters | intencao {dict(dist)} -> {args.out}")
