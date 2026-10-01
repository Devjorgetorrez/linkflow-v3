---
name: blog-write
description: >
  Write new blog articles from scratch optimized for Google rankings and AI
  citations. Generates full articles with template selection, answer-first
  formatting, information gain markers, citation capsules, sourced
  statistics, Pixabay/Unsplash images, built-in SVG chart generation, FAQ schema,
  internal linking zones, and proper heading hierarchy. Supports MDX, markdown,
  and HTML output.
  Use when user says "write blog", "new blog post", "create article",
  "write about", "draft blog", "generate blog post".
user-invokable: true
argument-hint: "<topic>"
license: MIT
---

# Blog Writer: New Article Generation

Writes complete blog articles from a topic, brief, or outline. Every article
follows the 6 pillars of dual optimization (Google rankings + AI citations).

**Key references** (paths relative to repo root; references live in the
main `blog` skill's references directory, not in `blog-write/`):

- `skills/blog/references/synthesis-contract.md`: 6 LAWs for synthesis output (v1.8.0; applies whenever the article embeds research-synthesis prose)
- `skills/blog/references/content-templates.md`: Template selection guide and usage
- `skills/blog/references/quality-scoring.md`: 5-category scoring (Content 30, SEO 25, E-E-A-T 15, Technical 15, AI Citation 15)
- `skills/blog/references/eeat-signals.md`: Experience, expertise, authority, trust markers
- `skills/blog/references/internal-linking.md`: Linking strategy and anchor text rules
- `skills/blog/references/visual-media.md`: Image sourcing and chart styling

## Workflow

### Phase 0: Surface Targeting (do this BEFORE research)

Decide which of the FLOW 5 surfaces this post is meant to win. The choice
shapes structure, length, citation density, and call-to-action. The 5 surfaces
in 2026:

1. Owned site (organic Google ranking)
2. SERP including AI Overviews
3. AI assistant citations (ChatGPT, Perplexity, Claude, Gemini, Copilot, You.com)
4. Local pack (out of scope for blog content; use claude-seo for local)
5. Communities and video (Reddit, YouTube, LinkedIn, Quora, niche forums)

Most posts target surfaces 1, 2, and 3 by default. If the same query also
surfaces in a community (Reddit thread, YouTube comment), apply dual-surface
thinking: optimize the post for extraction AND plan a community echo (covered
in `/blog repurpose`).

For a deeper surface-by-surface workflow, see
`skills/blog/references/flow-alignment.md` and `/blog flow find`.

### Phase 1: Topic Understanding

1. **Clarify the topic** - If the user provides just a topic, ask:
   - Target audience (who is this for?)
   - Primary keyword / search intent
   - Desired word count (default: 2,000-2,500 words)
   - Platform/format (MDX, markdown, HTML - auto-detect if in a project)
2. **If a brief exists** - Load it and skip to Phase 1.5

### Phase 1.5: Template Selection

Select the appropriate content template from the 12 templates in
`skills/blog/templates/` (the main `blog` skill owns the templates directory).

1. **Auto-detect content type** from the topic and search intent:
   | Signal | Template |
   |--------|----------|
   | "How to...", process, steps | `how-to-guide` |
   | "Best X", "Top N", list format | `listicle` |
   | Client result, before/after, metrics | `case-study` |
   | "X vs Y", comparison, alternatives | `comparison` |
   | Broad topic, comprehensive guide | `pillar-page` |
   | "Is X worth it", product evaluation | `product-review` |
   | Opinion, prediction, industry take | `thought-leadership` |
   | Expert quotes, multi-source collection | `roundup` |
   | Code walkthrough, tool demo, technical | `tutorial` |
   | Breaking news, algorithm update, event | `news-analysis` |
   | Survey results, experiment, original data | `data-research` |
   | Q&A, knowledge base, "What is X" | `faq-knowledge` |

2. **Load the matching template**: Read from `skills/blog/templates/<type>.md`
3. **Adapt the outline** - Use the template's section structure, heading patterns,
   and word count guidance to shape Phase 3's outline
4. **Fallback** - If no template clearly fits, use the generic outline structure
   in Phase 3 below. Inform the user which template was selected (or that none matched).

See `skills/blog/references/content-templates.md` for detailed selection criteria and intent mapping.

### Phase 2: Research

Spawn a `blog-researcher` agent (or do inline research with WebSearch):

1. **Find 8-12 current statistics** (2025-2026 data preferred)
   - Search: `[topic] study 2025 2026 data statistics`
   - Prioritize tier 1-3 sources (see `skills/blog/references/quality-scoring.md`)
   - Record: statistic, source name, URL, date, methodology
2. **Find a cover image** (wide, high-quality, topic-relevant):
   - Search: `site:pixabay.com [topic] wide banner` (preferred)
   - Alternative: `site:unsplash.com [topic] wide`
   - Fallback: `site:pexels.com [topic] wide banner`
   - Target dimensions: 1200x630 (OG-compatible) or 1920x1080
   - Or generate a custom SVG cover via `blog-chart` (text-on-gradient with key stat)
   - Or generate a custom AI image via `blog-image` sub-skill (if nanobanana-mcp configured)
   - See `skills/blog/references/visual-media.md` for cover image sizing details
3. **Find 3-5 inline images** from open-source platforms:
   - **Pixabay** (preferred): Search `site:pixabay.com [topic keywords]`
     - Extract image URL from page
     - Direct URLs: `https://cdn.pixabay.com/photo/YYYY/MM/DD/HH/MM/filename.jpg`
     - Verify with `curl -sI "<url>" | head -1` returns HTTP 200
   - **Unsplash** (alternative): Search `site:unsplash.com [topic keywords]`
     - Build URL: `https://images.unsplash.com/photo-<id>?w=1200&h=630&fit=crop&q=80`
   - **Pexels** (fallback): Search `site:pexels.com [topic keywords]`
4. **Plan 2-4 data visualizations** from researched statistics
   - Select diverse chart types (see `skills/blog/references/visual-media.md`)
   - Map data points to chart formats
5. **AI image generation** (optional, if nanobanana-mcp configured):
   - If stock photo results are insufficient (< 3 good matches) or topic is too niche
   - Generate custom hero image and/or inline illustrations via `blog-image` sub-skill
   - Stock photos remain default - AI generation supplements, never replaces
6. **NotebookLM research** (optional, if user has relevant notebooks):
   - If the user mentions a NotebookLM notebook or the topic aligns with a configured notebook
   - Query via `blog-notebooklm` for source-grounded data from user-uploaded documents
   - Treat NotebookLM responses as Tier 1 sources (user's own primary documents)
   - Falls back silently if not configured or not authenticated
7. **Find relevant YouTube videos** (2-3 per post):
   - Use `blog-google` youtube command or WebSearch `site:youtube.com [topic] [year]`
   - Apply quality criteria from `skills/blog/references/video-embeds.md` (min score 50/100)
   - Select 2-3 best videos. Falls back silently if none found.

### Phase 3: Outline Generation

Create a structured outline before writing. If a template was loaded in Phase 1.5,
adapt this skeleton to match the template's section structure:

```
# [Title: focus keyword AT THE START — e.g., "[focus keyword]: o que é, como funciona e o que você precisa saber"]

## Introduction (100-150 words)
- FIRST paragraph: MUST open with focus keyword as a CONTINUOUS phrase (never split across sentences)
  Pattern: "[focus keyword] é/são [definição direta]. [Dado/estatística com fonte.] [O que o leitor vai aprender.]"
- Following paragraphs: hook with surprising statistic, problem/opportunity statement
- What the reader will learn

[CTA TOP — Money Page]
Styled box (div or blockquote), NO heading tag. 2-3 lines max:
- Value statement: what the reader gains by clicking
- CTA link: anchor text = KW da Money Page vinculada (from briefing/projeto.md)
Placed immediately after the introduction paragraphs, BEFORE the first H2 — always present when a Money Page is in the briefing.

## H2: [FIRST H2 — focus keyword MUST appear here as continuous phrase] (300-400 words)
- Answer-first paragraph (40-60 words with stat + source)
- Supporting evidence
- Practical advice
- [CITATION CAPSULE placeholder]
- [INTERNAL-LINK: anchor text → target description]
<!-- REGRA: nenhuma imagem antes do SEGUNDO H2. Introdução e primeiro H2 ficam sem imagem. -->

## H2: [Question Format] (300-400 words)
- Answer-first paragraph
- [Chart: type + data description]
- Analysis and implications
- [CITATION CAPSULE placeholder]
- [INTERNAL-LINK: anchor text → target description]

## H2: [Statement for Variety] (300-400 words)
- Answer-first paragraph
- Real-world example or case study
- [Image placement]
- [CITATION CAPSULE placeholder]

## H2: [Question Format] (300-400 words)
- Answer-first paragraph
- [Chart: type + data description]
- Step-by-step guidance
- [CITATION CAPSULE placeholder]
- [INTERNAL-LINK: anchor text → target description]

## H2: [LAST H2 — focus keyword MUST appear here as continuous phrase] (200-300 words)
- Answer-first paragraph
- Forward-looking analysis

## [CTA Section or Inline Placement — mid or end of article]
- See `skills/blog/references/cta-placement.md` for placement rules by content type
- Place CTA after value delivery, not at arbitrary positions
- [CTA: contextual call-to-action matching article topic]
- Note: this is the MID/END CTA. The TOP CTA (before first H2) is defined separately in rule 5p.

## FAQ Section (3-5 questions, 40-60 words each answer)
- [INTERNAL-LINK: anchor text → detailed content]

## Conclusion (100-150 words)
- Key takeaways (bulleted)
- Call to action
- [INTERNAL-LINK: anchor text → next logical content]
```

Present the outline to the user for approval before writing.

**Visual element pacing**: Insert `[IMAGE]`, `[CHART]`, `[VIDEO]`, or `[CALLOUT]` markers
every 300-500 words. Alternate types (no consecutive same-type). See
`skills/blog/references/content-rules.md` Visual Rhythm section and
`skills/blog/references/cta-placement.md` for CTA positioning.

### Phase 4: Chart Generation (Built-In)

When the researcher identifies chart-worthy data (3+ comparable metrics, trend data,
before/after comparisons):

1. Select chart type using the diversity rule (no repeated types per post)
2. Invoke `blog-chart` sub-skill with: chart type, title, data values, source, platform format
3. Embed the returned SVG directly in the post within a `<figure>` wrapper
4. Target 2-4 charts per 2,000-word post
5. Distribute charts evenly - never cluster them

See `skills/blog/references/visual-media.md` for chart type selection and styling rules.

### Phase 5: Content Writing

**Repasse obrigatório ao blog-writer agent:** ao invocar o blog-writer, passe o briefing INTEGRAL como contexto — incluindo os campos `Tom de voz:` e `Restrições legais invioláveis:`. O agent DEVE escrever no tom especificado e respeitar as restrições. Não omita esses campos na invocação. O blog-writer tem uma seção "Voice & Compliance" que depende de receber esses dados.

Write the full article following these rules:

#### 5a. Frontmatter
```yaml
---
title: "[Focus keyword at the START — ≤ 60 characters total — question-format optional]"
description: "[150-156 chars — NEVER above 156 — MUST contain focus keyword as a complete phrase + 1 statistic]"
coverImage: "[URL from Pixabay/Unsplash/Pexels or generated SVG path]"
coverImageAlt: "[Descriptive sentence about the cover image]"
ogImage: "[Same as coverImage, or custom OG image URL]"
date: "YYYY-MM-DD"
lastUpdated: "YYYY-MM-DD"
author: "[Author name]"
tags: ["keyword1", "keyword2", "keyword3"]
---
```

If the platform uses a different field name (e.g., `image`, `hero`, `thumbnail`),
adapt to match the project's existing frontmatter convention.

**Site Astro do Link Flow:** o artigo gerado aqui é convertido pelo
`site-publicar`, que grava `geradoPorIA: true` (selo "IA" do painel) e os
campos opcionais `seoTitle`, `resumo` e `faq`. Para isso funcionar, entregue
no frontmatter/rascunho: um resumo de 1-2 frases do artigo (até 300 caracteres)
e a seção FAQ com as perguntas e respostas reais. Nunca invente pergunta só
para preencher o campo.

#### 5b. Key Takeaways / Summary Box — DO NOT GENERATE

**Do not generate** a Key Takeaways, "Resumo rápido", "Pontos Essenciais", "TL;DR",
"Pontos-chave", or any equivalent summary box in any post.

This element has been removed from the publishing standard. Its presence triggers
the blog-reviewer gate P0-4 and will block the article. If a loaded template includes
a TL;DR or summary box placeholder, skip it.

#### 5c. Answer-First Formatting (Critical)
Every H2 section MUST open with a 40-60 word paragraph containing:
- At least one specific statistic with source attribution
- A direct answer to the heading's implicit question

Pattern:
```markdown
## How Does X Impact Y in 2026?

[Stat from source] ([Source Name](url), year). [Direct answer to the heading
question in 1-2 more sentences, explaining the implication and what this means
for the reader.]
```

**FLOW evidence triple (drafting requirement, not just audit):**

Every public statistic must carry three components AT DRAFTING TIME:

1. **Year anchor in prose.** Write "In 2026," or "As of Q1 2026," BEFORE
   the statistic, in the sentence body. Year buried inside parentheses
   does not count. Example:
   - GOOD: "In 2026, Ahrefs found a 58% lower CTR for position one when
     an AI Overview was present."
   - WEAK: "Position-one CTR dropped 58% (Ahrefs, 2026)."

2. **Inline citation with publisher and title.** Name both the publisher
   and the document title (or report name), not just a brand. Example:
   - GOOD: "Ahrefs, AI Overviews CTR update, December 2025"
   - WEAK: "Ahrefs reported..."

3. **URL plus retrieval date tracked internally — NOT rendered as a visible section.**
   Provenance discipline: track all sources as HTML comments at the end of the draft
   file, or in a `sources.md` companion file in the draft folder. Do NOT generate a
   visible "Fontes" or "Sources" section in the published article output.
   Format: `<!-- SOURCE: [Publisher], [Title], retrieved YYYY-MM-DD, [full URL] -->`

**FLOW quality bar (drop or replace):**
Public claims must use verified sources OR stay qualitative. If a statistic
cannot be verified, drop it. If it is contradicted by a more recent source,
replace it with the verified alternative. Do not soften vague language to
keep an unsourceable number.

For evidence-led optimization prompts (CTR audit, AI detector test, schema,
PAA rewording, ChatGPT visibility), see `/blog flow optimize`.

#### 5d. Information Gain Markers

Distribute at least 2-3 information gain markers throughout the article. These
signal to search engines and AI systems that the content contains original value
not available elsewhere.

Tag each with a comment or visible marker:

- `[ORIGINAL DATA]` - Proprietary surveys, experiments, A/B test results, case
  study metrics the author collected first-hand
- `[PERSONAL EXPERIENCE]` - First-hand observations, lessons learned from direct
  involvement, "when we tried X, Y happened" narratives
- `[UNIQUE INSIGHT]` - Analysis others haven't made, contrarian perspectives
  backed by data, novel connections between existing research

Placement:
- Weave into the body text naturally
- Use as inline comments: `<!-- [ORIGINAL DATA] -->` before the relevant paragraph
- Or as visible callouts if the format supports it:
  ```markdown
  > **Our finding:** [original observation backed by specific data]
  ```
- Minimum 2 per post, target 3 for comprehensive articles

These markers map directly to the "Originality/unique value markers" criterion
in the Content Quality scoring category (see `skills/blog/references/quality-scoring.md`).

#### 5e. Citation Capsules

For each major H2 section, generate a citation capsule - a 40-60 word self-contained
passage designed so AI systems can extract and quote it directly.

Requirements per capsule:
- 40-60 words, self-contained (makes sense in isolation)
- Contains: one specific claim + one data point + source attribution
- Written in a declarative, quotable style
- Placed within the H2 section body (not as a separate block)

Example:
```markdown
According to a 2026 Gartner study, 58% of enterprise buyers now consult AI
assistants before contacting a vendor ([Gartner](https://www.gartner.com), 2026).
This shift means B2B content must answer specific questions concisely enough
for AI systems to extract and cite in their responses.
```

Capsules map to the "AI Citation Readiness" scoring category (15 points) in
`skills/blog/references/quality-scoring.md`.

#### 5f. Internal Linking Zones

Mark internal linking opportunities throughout the article using placeholder
notation. The user (or a follow-up pass) will resolve these to actual URLs.

Zone placement:
- **Introduction** - Link to related pillar content or topic hub
- **Each H2 section** - Link to supporting articles, deeper dives, related tools
- **FAQ section** - Link answers to detailed content that expands on the answer
- **Conclusion** - Link to the next logical piece of content the reader should consume

Format:
```markdown
[INTERNAL-LINK: anchor text → target description]
```

Example:
```markdown
For a deeper dive into keyword clustering, see our
[INTERNAL-LINK: complete guide to keyword clustering → pillar page on keyword research methodology].
```

Target 5-10 internal link zones per 2,000-word post. Use descriptive anchor text
(never "click here" or "read more"). See `skills/blog/references/internal-linking.md` for
anchor text rules and linking strategy.

#### 5g. Paragraph Rules
- Every paragraph: 40-80 words (never exceed 150)
- Every sentence: max 15-20 words
- Start each paragraph with the most important information
- Target Flesch Reading Ease: 60-70
- **Paragraph-shape variance** (quality target): alternate short paragraphs (1-2 sentences) and long paragraphs (4-5 sentences) throughout the article. Never write 3+ consecutive paragraphs of the same size — uniform shape is a strong AI signal.
- **Sentence burstiness target ≥ 0.30** (quality target): mix short sentences (8-12 words) and long sentences (20-25 words) deliberately within the same section. Add this to the Phase 5 writing intent, not just the Phase 6 audit.
- **No single block above 180 words**: each paragraph inside an H2 section must be self-contained and citable. If a run exceeds 180 words, split it — the break doubles as a citation capsule opportunity.

#### 5h. Heading Rules
- One H1 (title only) — focus keyword MUST appear at or near the START of H1
- H2s for main sections (60-70% as questions)
- H3s for subsections only — never skip levels
- **First H2**: focus keyword MUST appear as the EXACT phrase from the briefing — same word sequence, correct Portuguese accents, NO extra stop-words inserted between keyword words
- **Last H2**: focus keyword MUST appear as the EXACT phrase from the briefing — same word sequence, correct Portuguese accents, NO extra stop-words inserted
- Other H2s: include primary keyword naturally in at least 1-2 additional headings

#### 5i. Image Embedding

Standard markdown:
```markdown
![Descriptive alt text - topic keywords naturally](https://cdn.pixabay.com/photo/...)
```

MDX with Next.js Image (if detected):
```mdx
![Descriptive alt text - topic keywords naturally](https://cdn.pixabay.com/photo/...)
```

- **REGRA: a primeira imagem do corpo só pode aparecer a partir do SEGUNDO H2 em diante.** Introdução e primeiro H2 ficam sem imagem.
- Place images after H2 headings (from the second H2 onwards), before body text
- Space evenly throughout the post (not clustered)
- Alt text should be a full descriptive sentence
- A `coverImage` do frontmatter serve como featured image do WordPress; NÃO inserir essa imagem no topo do corpo do artigo.

#### 5j. Chart Embedding

Standard markdown/HTML:
```html
<figure>
  <svg viewBox="0 0 560 380" ...>...</svg>
  <figcaption>Source: [Source Name], [Year]</figcaption>
</figure>
```

MDX format:
```mdx
<figure className="chart-container" style={{margin: '2.5rem 0', textAlign: 'center', padding: '1.5rem', borderRadius: '12px'}}>
  <svg viewBox="0 0 560 380" ...>...</svg>
</figure>
```

#### 5k. Video Embedding
Embed YouTube videos using srcdoc lazy-loading pattern from `skills/blog/references/video-embeds.md`.
Include aria-label, noscript fallback for AI crawlers. Place after relevant H2, 500+ words apart.

#### 5l. Citation Format
Inline attribution (always):
```markdown
Organic CTR declined 61% with AI Overviews ([Seer Interactive](https://www.seerinteractive.com/), 2025).
```

**Hyperlinks for Tier 1 sources (E-E-A-T requirement):**
Every statistic sourced from a government body, regulatory agency, or academic institution — gov.br, planalto.gov.br, ans.gov.br, ibge.gov.br, who.int, etc. — MUST be accompanied by a real `<a href="...">` hyperlink in the body text, not just a name citation. This is a quality target (improves E-E-A-T score), not a P0 blocker.

#### 5m. FAQ Section
Add 3-5 FAQ items with 40-60 word answers. Each answer must contain a statistic.

For MDX with FAQSchema component:
```mdx
<FAQSchema faqs={[
  { question: "Question?", answer: "40-60 word answer with statistic and source." },
]} />
```

For standard markdown:
```markdown
## Frequently Asked Questions

### Question text here?

Answer with statistic and source attribution (40-60 words).
```

#### 5n. Internal Linking
- 5-10 internal links per 2,000-word post
- Link to relevant existing content naturally
- Use descriptive anchor text (not "click here")

#### 5o. Focus Keyword Placement (Mandatory — 6 Locations, Delivery Blocker)

The focus keyword MUST appear as the **EXACT phrase from the briefing/calendar** in ALL six
locations below. Use the keyword word-for-word, with correct Portuguese accentuation.
**Do NOT insert stop-words** (preposições, artigos, conjunções) between the keyword words —
the sequence must be identical to the KW column in the briefing, so Yoast recognizes it.

> **Priority rule: Yoast match over fluency.**
> If the KW is `carência plano de saúde`, write **`carência plano de saúde`** —
> NOT `carência no plano de saúde`. Sentence fluency is secondary; the exact
> word sequence is what the tool (and the P0-1 gate) checks.

| # | Location | Requirement |
|---|---|---|
| 1 | **H1** | Exact keyword phrase at or near the START (within first 5 words) |
| 2 | **First body paragraph** (immediately after H1) | Exact keyword phrase as one continuous unit — never split across clauses or sentences |
| 3 | **First H2** | Exact keyword phrase present — no stop-words inserted between parts |
| 4 | **Last H2** | Exact keyword phrase present — no stop-words inserted between parts |
| 5 | **Meta description** (`description` frontmatter) | Exact keyword phrase present — not just individual words |
| 6 | **SEO title** (`title` frontmatter / Yoast `_yoast_wpseo_title`) | Exact keyword phrase at the START |

**If ANY of these 6 points fails, the article does not pass Phase 6. Fix before delivery.**

Writing pattern for the first body paragraph:
```
GOOD: "[Keyword exata do briefing] é [definição direta]. [Dado + fonte.] [O que o leitor aprende.]"
BAD:  "[Keyword com preposição inserida no meio, ex: 'carência NO plano']" ← stop-word adicionada quebra o match
BAD:  "Keyword quebrada em orações separadas" ← split across sentences
```

#### 5p. Early CTA (Top of Post — Before First H2, Delivery Blocker if Money Page in Briefing)

When a Money Page is provided in the briefing, insert a CTA block immediately after the
introduction paragraphs and BEFORE the first H2. This is ADDITIONAL to mid-article and
conclusion CTAs — do not remove or replace those.

Requirements:
- Points to the Money Page slug from the briefing
- Anchor text = KW principal da Money Page (from `## Money Pages` in projeto.md)
- 2-3 lines max: one value statement (what the reader gets) + one CTA link/button
- No heading tag (`<h2>`, `<h3>`) on this block — styled div or blockquote only
- When no Money Page is in the briefing: omit this block silently

HTML pattern (WordPress):
```html
<div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:8px;padding:1.25rem 1.5rem;margin:1.5rem 0;">
  <p style="margin:0 0 0.5rem;font-weight:700;">[Brief value statement — what the reader gets by clicking]</p>
  <p style="margin:0;"><a href="/slug-money-page/">[KW da Money Page]</a></p>
</div>
```

Markdown fallback:
```markdown
> **[Brief value statement]**
> [KW da Money Page](/slug-money-page/)
```

### Phase 6: Quality Check

Before delivering, verify:

#### Structure and Content
1. Every H2 opens with a statistic + source
2. No paragraph exceeds 150 words
3. All statistics have named tier 1-3 sources
4. 2-4 charts with type diversity
5. 3-5 inline images with descriptive alt text
6. Cover image present in frontmatter (coverImage + ogImage)
7. FAQ section present with 3-5 items
8. Heading hierarchy is clean (H1 -> H2 -> H3)
9. Meta description is **150-156 chars** (NEVER above 156), contains focus keyword as complete phrase, and includes a stat

#### New Element Verification
10. **NO Key Takeaways / TL;DR / Resumo rápido / Pontos Essenciais box** — this element must NOT be present anywhere in the article (triggers P0-4 block)
11. At least 2-3 information gain markers (`[ORIGINAL DATA]`, `[PERSONAL EXPERIENCE]`, or `[UNIQUE INSIGHT]`)
12. Citation capsules present in major H2 sections (40-60 words, self-contained, quotable)
13. Internal linking zones marked in introduction, H2 sections, FAQ, and conclusion
14. No AI-detectable phrases from banned list (see `agents/blog-writer.md`)

#### E-E-A-T and Engagement Targets (quality targets — not P0 blockers)
15. **Paragraph-shape variance** — confirm the article alternates short paragraphs (1-2 sentences) and long paragraphs (4-5 sentences). No run of 3+ same-size paragraphs.
16. **No block above 180 words** — scan each H2 section for overly long continuous paragraphs; split any that exceed 180 words.
17. **External hyperlinks for Tier 1 sources** — every gov.br / ans.gov.br / planalto.gov.br / ibge.gov.br citation must have a real `<a href>` link in the body text.

#### Burstiness and Naturalness Check
19. **Sentence length variance** - Verify a mix of short (8-word) and long (25-word) sentences. Uniform sentence length signals AI authorship.
20. **Banned AI phrase scan** - Check for and remove:
    - "in today's digital landscape", "it's important to note", "dive into"
    - "game-changer", "navigate the landscape", "revolutionize", "seamlessly"
    - "cutting-edge", "harness the power of", "leverage" (as verb)
    - "delve", "crucial", "elevate", "foster", "landscape" (overused)
    - "multifaceted", "robust", "tapestry", "embark"
    - Full list in `agents/blog-writer.md`
21. **Contractions** - Verify natural use of contractions ("it's", "we've", "don't", "isn't"). Formal AI prose avoids contractions; natural writing uses them.
22. **Rhetorical questions** - Verify at least one rhetorical question every 200-300 words to break up declarative patterns.
23. **YouTube videos** - 2-3 embeds with lazy loading, aria-labels, and noscript fallback (see `skills/blog/references/video-embeds.md`)

#### Keyword Placement Verification (All 6 Must Pass — Delivery Blocker)
24. **H1** — exact keyword phrase (from briefing) at or near the start; no stop-words inserted between keyword words
25. **First body paragraph** — exact keyword phrase as one continuous unit, NOT split across sentences or clauses
26. **First H2** — exact keyword phrase present; no stop-words inserted between keyword words
27. **Last H2** — exact keyword phrase present; no stop-words inserted between keyword words
28. **Meta description** — exact keyword phrase present (not just individual words scattered)
29. **SEO title** — exact keyword phrase at the START of the `title` frontmatter field (and Yoast `_yoast_wpseo_title` if applicable)

#### Structure Verification
30. **No visible Sources/Fontes section** — sources tracked as HTML comments or `sources.md` only; no rendered list at bottom of article
31. **Early CTA present** (when Money Page in briefing) — styled block after introduction, before first H2, linking to Money Page with KW anchor text
32. **Title ≤ 60 characters** — count characters in the `title` field (including spaces and punctuation); if > 60, shorten before delivery
33. **Tom de voz e compliance** — o texto soa como o perfil `Tom de voz:` do briefing? Nenhuma afirmação viola as `Restrições legais invioláveis:`?

**If any of items 24-33 fails, fix before proceeding to Phase 6.5.**

### Phase 6.5: Delivery Contract Enforcement (v1.9.0)

Before Phase 7, run the 5-gate delivery contract per `skills/blog/references/blog-delivery-contract.md`. The user is never the first reviewer; the gates are.

Steps:

1. **Capability discovery + hero**: run `python scripts/blog_preflight.py --draft <folder> --gate 1` to enumerate available paths. If `nanobanana-mcp` is loaded, generate the hero via the MCP tool. Otherwise run `python scripts/generate_hero.py --topic "<title>" --tags "<tags>" --out <folder>` (uses the Gemini, Unsplash, Pexels, Pixabay, Openverse ladder).

2. **Format completeness**: render the canonical `.md` to `.html` and `.pdf` via `python scripts/blog_render.py --md <slug>.md --out-dir <folder>`. All three artifacts plus `hero.<ext>` must end up in the draft folder.

3. **Content review (blocking)**: dispatch the `blog-reviewer` agent (Task tool) against the rendered `.html`. The agent emits its scorecard to `<folder>/review.md` ending with `BLOCKING: true|false (reason)`. Threshold: overall score 90/100 or higher AND zero P0 issues per `editorial-heuristics.md`.

4. **Visual + asset gates**: run `python scripts/blog_preflight.py --draft <folder> --strict`. This runs Gate 3 (visual verification via patchright at 3 viewport widths), Gate 4 (reads review.md BLOCKING line), and Gate 5 (asset + link integrity). Exit 0 = ship; exit 1 = block.

5. **Iteration**: on any block, capture the failure diagnostic from `<folder>/preflight-report.json`, re-dispatch the blog-writer agent with the diagnostic as input, and re-run from step 1. Maximum 3 iterations. On the 3rd failure, STOP and present the failure diagnostic instead of the draft.

The orchestrator holds the loop counter; this sub-skill never loops itself.

### Phase 7: Delivery

Present the completed article ONLY after Phase 6.5 returns all gates passing. Include the screenshots from `<folder>/preview/*.png` in the summary so the user can see what they are getting before reading the prose.

Summary template:

```
## Blog Post Complete: [Title]

### Template Used
- [Template name] (or "generic outline - no template matched")

### Statistics
- [N] sourced statistics from tier 1-3 sources
- [N] unique sources cited

### Visual Elements
- Cover image: [source - Pixabay/Unsplash/Pexels or generated SVG]
- [N] inline images (Pixabay/Unsplash/Pexels)
- [N] SVG charts (types: bar, lollipop, donut, line)
- [N] YouTube video embeds (titles: ...)

### Dual-Optimization Elements
- Information gain markers: [N] ([types used])
- Citation capsules: [N] across H2 sections
- Internal linking zones: [N] marked

### Structure
- [N] H2 sections with answer-first formatting
- [N] FAQ items with schema
- Word count: ~[N] words
- Estimated reading time: [N] min

### Naturalness
- Sentence length variance: [pass/fail]
- AI phrase scan: [pass/fail]
- Contractions used: [yes/no]
- Rhetorical questions: [N] (target: 1 per 200-300 words)

### Next Steps
- Review and customize for your brand voice
- Resolve [INTERNAL-LINK] placeholders with actual URLs
- Add internal links to your existing content
- Run `/blog analyze <file>` to verify quality score
- Generate VideoObject schema: `/blog schema <file>` (includes video markup)
- Generate audio narration: `/blog audio generate <file>` (optional)
```
