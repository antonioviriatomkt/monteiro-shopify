---
type: Change
title: News Page Redesign & SEO Hygiene
description: The /blogs/news listing rebuilt into an editorial newsroom (chip filter, category pills, read time, excerpts, featured-first), article JSON-LD upgraded, and the live article taxonomy + meta descriptions cleaned up.
resource: https://www.monteirofabrics.com/blogs/news
tags: [website, redesign, blog, news, seo, structured-data, claude-mf-june-proposta]
timestamp: 2026-06-30T00:00:00Z
status: deployed-to-sandbox
visibility: private
confidence: high
---

# Overview

The "News & Events" page was a thin Shopify blog: cards showed only image + date +
title (global `blog_excerpt: none`), the category filter was a `<select>` dropdown
whose tags were **mostly empty** (33 of 35 articles untagged) and **dirty** (a
`SUSTAINABLILITY` typo duplicating `Sustainability`, plus casing drift — `HOTEL`,
`Restaurants`). The titled "& Events" was not backed by any events content (the
trade-fair block in the template was disabled and stale — 2023/2024 fairs).

Decision (with the client): **drop "Events"** as a destination for now and focus the
page as an editorial **Newsroom**; build the full listing redesign + article-page
schema + complete SEO hygiene.

# What changed — theme (sandbox CLAUDE_MF_JUNE_PROPOSTA)

- **`snippets/article-block.liquid`** — enriched card: optional **category pill**
  (priority-picked from the article's tags), **read time** (computed from content),
  and a real **excerpt below the title**. New params are opt-in, so the
  `featured-blog` "More news" carousel is unchanged.
- **`sections/main-blog.liquid`** — replaced the dropdown with crawlable **chip
  links** to `/blogs/news/tagged/<tag>`; added an **intro** line; a **featured-first**
  treatment (newest post large on page 1, unfiltered); passes excerpt/category/
  read-time; renders the new blog JSON-LD. New schema settings (excerpt mode,
  category/read-time toggles, featured toggle, intro richtext); per-page 10 → 12.
- **`snippets/structured-data-blog.liquid`** (new) — `Blog` + `ItemList` of posts +
  `BreadcrumbList` JSON-LD for the listing (none existed before).
- **`snippets/structured-data-article.liquid`** — `http:` → **`https://schema.org`**,
  wrapped in `@graph` with a new **`BreadcrumbList`** (Home → News → article) and an
  always-present Organization author.
- **`templates/blog.json`** — hero "NEWS & EVENTS" → **"News"** (eyebrow "Newsroom");
  removed the stale disabled trade-fair section and the duplicate disabled hero; wired
  the new `main-blog` settings.
- **`assets/styles.css.liquid`** — appended styles for `.blog-chip`, `.article-block__cat`,
  read-time, intro, and the desktop featured card. Copy `#111111`, accent blue `#2F519B`.

Deployed surgically via `scripts/deploy-files.mjs` (drift-guarded). Live **Showcase 7.0**
untouched; preview is the authenticated theme-editor preview (the storefront ignores
`?preview_theme_id` for unpublished themes).

# What changed — content/SEO (LIVE, via `scripts/news-seo-hygiene.mjs`)

- **Blog SEO** set on `news` (was empty): title_tag + meta description.
- **Tag taxonomy** normalised to a clean **7 categories** — Collections, Company,
  Events, Hospitality, Materials, Projects, Sustainability. Killed the
  `SUSTAINABLILITY` typo, `HOTEL`/`Restaurants`/`delivery`/`manufacturers` noise and
  casing drift; tagged the ~22 previously-untagged articles. All 35 News articles
  re-tagged (by ID, so duplicate handles across blogs can't collide).
- **Meta descriptions backfilled** on the 8 News articles that had none (Kaizen,
  Leather-vs-Coated, DesignWerkschau, Amazónia, Gisela Ferreira, Sónia Claro,
  Pedro Vasco, "A history born from passion") — qualitative, no invented figures.

# Not done — noted

- **Visible breadcrumb** on the article page (schema breadcrumb is live; the visible
  one was deferred to avoid touching the article hero layout).
- **Article `summary` (excerpt) backfill** — cards fall back to truncated body text;
  bespoke summaries would sharpen the listing.
- The **`sustainability` blog** (5 articles, several duplicates of News) was left as-is
  — candidate for consolidation/redirects into News.
- "1.60 meters wide" and the duplicate "What is REACH?" remain **unpublished**.

# Related

- Part of the [June 2026 Website Redesign](/website/june-2026-redesign.md).
- Built on the [sector & collection SEO page](/website/sector-pages-seo.md) JSON-LD system.
- Channel context: [Website](/channels/website.md).

# Citations

[1] [News listing](https://www.monteirofabrics.com/blogs/news)
[2] Internal: `scripts/news-seo-hygiene.mjs`, theme CLAUDE_MF_JUNE_PROPOSTA (id 195386114425).
