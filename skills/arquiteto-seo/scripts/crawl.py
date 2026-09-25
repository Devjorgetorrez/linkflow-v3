#!/usr/bin/env python3
"""
crawl.py — Crawl educado de um site concorrente para mapear arquitetura de SEO.
Uso: python crawl.py https://concorrente.com  [--max 150] [--depth 4]
Saída: paginas.json no diretório atual.

Coleta por página: url, profundidade (cliques da home), title, h1, h2[],
meta description, segmento de URL, e contagem de links internos de entrada.
Respeita robots.txt, rate limit de 1 req/s e limite de páginas.
"""
import sys, json, time, re, argparse
from urllib.parse import urljoin, urlparse, urldefrag
from collections import deque, defaultdict
import urllib.robotparser as robotparser

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Instale dependências: pip install requests beautifulsoup4 --break-system-packages")

UA = "Mozilla/5.0 (compatible; ArquitetoSEO/1.0; +seo-architecture-mapper)"
HEADERS = {"User-Agent": UA}


def norm(url):
    url, _ = urldefrag(url)
    return url.rstrip("/")


def same_domain(url, root_netloc):
    try:
        return urlparse(url).netloc.replace("www.", "") == root_netloc.replace("www.", "")
    except Exception:
        return False


def segmento(url):
    p = urlparse(url).path.strip("/").split("/")
    return p[0] if p and p[0] else "(home)"


def fetch_sitemap_urls(root):
    """Fallback: tenta extrair URLs do sitemap quando o crawl é bloqueado."""
    urls = set()
    for sm in ("/sitemap.xml", "/sitemap_index.xml"):
        try:
            r = requests.get(urljoin(root, sm), headers=HEADERS, timeout=15)
            if r.status_code == 200:
                urls.update(re.findall(r"<loc>\s*([^<]+?)\s*</loc>", r.text))
        except Exception:
            pass
    return [norm(u) for u in urls]


def crawl(start, max_pages=150, max_depth=4):
    root = norm(start if start.startswith("http") else "https://" + start)
    root_netloc = urlparse(root).netloc

    rp = robotparser.RobotFileParser()
    try:
        rp.set_url(urljoin(root, "/robots.txt"))
        rp.read()
    except Exception:
        rp = None

    def allowed(u):
        if rp is None:
            return True
        try:
            return rp.can_fetch(UA, u)
        except Exception:
            return True

    pages = {}
    inlinks = defaultdict(int)
    seen = {root}
    q = deque([(root, 0)])
    blocked = 0

    while q and len(pages) < max_pages:
        url, depth = q.popleft()
        if depth > max_depth or not allowed(url):
            continue
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            time.sleep(1.0)  # rate limit educado
            if r.status_code in (403, 429):
                blocked += 1
                continue
            if r.status_code != 200 or "text/html" not in r.headers.get("Content-Type", ""):
                continue
        except Exception:
            continue

        soup = BeautifulSoup(r.text, "html.parser")
        title = (soup.title.string or "").strip() if soup.title else ""
        h1 = soup.find("h1")
        h1 = h1.get_text(strip=True) if h1 else ""
        h2 = [h.get_text(strip=True) for h in soup.find_all("h2")][:8]
        md = soup.find("meta", attrs={"name": "description"})
        md = md.get("content", "").strip() if md else ""

        pages[url] = {
            "url": url, "depth": depth, "title": title, "h1": h1,
            "h2": h2, "meta_description": md, "segmento": segmento(url),
        }

        for a in soup.find_all("a", href=True):
            link = norm(urljoin(url, a["href"]))
            if not same_domain(link, root_netloc):
                continue
            if link.startswith("http"):
                inlinks[link] += 1
                if link not in seen and len(seen) < max_pages * 3:
                    seen.add(link)
                    q.append((link, depth + 1))

    # fallback por sitemap se o crawl rendeu pouco
    if len(pages) < 5:
        for u in fetch_sitemap_urls(root)[:max_pages]:
            pages.setdefault(u, {"url": u, "depth": None, "title": "", "h1": "",
                                 "h2": [], "meta_description": "", "segmento": segmento(u)})

    for u, p in pages.items():
        p["inlinks"] = inlinks.get(u, 0)

    out = {
        "root": root,
        "domain": root_netloc.replace("www.", ""),
        "total": len(pages),
        "blocked_responses": blocked,
        "pages": list(pages.values()),
    }
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--max", type=int, default=150)
    ap.add_argument("--depth", type=int, default=4)
    ap.add_argument("--out", default="paginas.json")
    args = ap.parse_args()

    data = crawl(args.url, args.max, args.depth)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"OK — {data['total']} páginas salvas em {args.out} "
          f"(bloqueios: {data['blocked_responses']})")
