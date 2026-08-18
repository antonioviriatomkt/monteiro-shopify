---
type: Change
title: Sector & Collection SEO Pages
description: 18 /collections/ pages rebuilt as content- and schema-rich sector landing pages to lift Google rankings and AI-answer citation, plus SEO metadata and redirects.
resource: https://www.monteirofabrics.com/collections/healthcare
tags: [website, seo, collections, structured-data, geo, claude-mf-june-proposta]
timestamp: 2026-06-26T00:00:00Z
status: deployed-to-sandbox
visibility: private
confidence: high
---

# Overview

The sector/application `/collections/` pages were thin Shopify product grids — no body copy,
performance facts trapped inside icon images, no FAQs, no structured data — so they capped on
page 2 of Google despite real demand. This change rebuilt **18** of them on the
[CLAUDE_MF_JUNE_PROPOSTA](/website/june-2026-redesign.md) theme into content- and schema-rich
sector landing pages.

# Why — Google Search Console diagnosis

- `/collections/healthcare` drew ~6,410 impressions over 90 days at ~0.9% CTR, avg position ~13 —
  stranded on page 2 for "healthcare fabrics" (~p19), "medical fabric" (~p10), "healthcare upholstery" (~p16).
- Other sector pages ranked worse: hospitality ~p34, restaurants ~p32, office ~p16, marine ~p16.
- Conversational / AI-style queries ("best healthcare grade fabrics for patient seating?",
  "cleanable medical synthetic leather wholesale") were appearing but ranking 20–50 because the
  answers weren't in crawlable text.
- **Root cause:** thin collection pages with nothing for Google or LLMs to extract.

# What changed — page template stack

Each collection got a custom template `collection.<handle>.json` composed of:

1. A keyword **H1** (e.g. "Healthcare Upholstery Fabrics") replacing the bare collection title.
2. The product grid (kept).
3. A credential icon strip (`fabric-spec-icons`).
4. A crawlable **Technical specifications** block (`spec-table`) — performance facts as real text, not images.
5. A **FAQ** answering real GSC queries (`faq-schema`).
6. `FAQPage` + `BreadcrumbList` + `CollectionPage` **JSON-LD**.
7. A "Speak to a specialist" CTA.

# Pages affected

| Sector | Collection handle |
|---|---|
| Healthcare | `healthcare` |
| Hospitality | `hospitality-fabrics` |
| Restaurants & Bars | `restaurants-fabrics` |
| Office | `office-fabrics-upholstery` |
| Marine | `marine` |
| Automotive | `automotive` |
| Retail | `retail` |
| Outdoor | `outdoor` |
| Public Spaces | `public-spaces` |
| Residential | `residential-1` |
| Fitness | `fitness-1` |
| Aviation | `aviation` |
| Motorcycle | `motorcycle` |
| Mass Transportation | `mass-transportation` |
| Recreational Vehicles | `recreational-vehicles` |
| Fashion | `fashion` |
| Contract | `contract` |
| Coated Fabrics | `coated-fabrics` |

# Reusable sections built

- `spec-table.liquid` — a property/value `<dl>` of fabric specs (puts credentials in crawlable text, not images).
- `faq-schema.liquid` — an accessible `<details>` FAQ that emits FAQPage + BreadcrumbList +
  CollectionPage JSON-LD from the **same** blocks (visible Q&A and markup can't drift apart).

Both reuse the earlier `fabric-spec-icons` credential strip.

# SEO metadata & redirects (live)

- SEO **title + description** set on all 18 collections.
- 301 **redirects**: `/collections/marine-interior` → `/collections/marine`;
  `/collections/medical` → `/collections/healthcare`.
- Each collection's **`templateSuffix`** set to its handle so the new template renders on the normal
  collection URL inside the preview (the live theme lacks these templates and falls back gracefully —
  no live visual change).

# Status / pending

- Built and previewable on the sandbox; metadata and redirects are live.
- Spec values are **qualitative** — exact certified figures (Martindale cycles, fire-standard codes,
  roll width/weight, warranty term) to be added from the product datasheets.
- The `medical` collection was **repurposed as its own sector** (see below), so it is no longer
  consolidated into healthcare.

# New sectors — Medical & Train (2026-07-02)

Two sectors were added on the same template stack (H1 → grid → `fabric-spec-icons` → `spec-table` →
`faq-schema` + JSON-LD), filter bar off (small curated sets):

- **Medical** (`/collections/medical`, collection id 704259621241) — reuses the existing `medical`
  collection (**Mediflex, Electra, Flora**). The earlier `/collections/medical → /collections/healthcare`
  **301 redirect was removed** (client-approved) so the sector page resolves; SEO title/description set;
  `templateSuffix: medical`. Distinct from the broad Healthcare collection (a focused, technical
  medical-grade line). New template `collection.medical.json`.
- **Train** (`/collections/train`, collection id 704621740409) — a **new collection** holding the same
  6 products as Mass Transportation (Pure Move ×3, Pure Convertible, Villa, Regata), rail/railway SEO
  copy, `templateSuffix: train`, published to the Online Store. New template `collection.train.json`.

Both tiles added to the **"Our Sectors"** page (`page.all-collectby-industry.json` → `collection-list`:
`s_medical` after Healthcare, `s_train` after Mass Transportation). Pending: `[TO CONFIRM]` specs
(Medical fire-retardancy per product; Train EN 45545-2 fire class + abrasion values); the new `train`
collection has **no image** yet (tile/banner falls back to a product image). These are live-accessible
URLs (default-template fallback on the live theme, full template on the sandbox).

# Related

- Part of the [June 2026 Website Redesign](/website/june-2026-redesign.md).
- Sector definitions: [Market index](/market/index.md).
- Spec source-of-truth: [Products index](/products/index.md), e.g.
  [Mediflex](/products/collections/mediflex.md), [Electra](/products/collections/electra.md);
  attributes [Martindale](/products/attributes/martindale-abrasion.md) ·
  [Fire certifications](/products/attributes/fire-certifications.md).

# Citations

[1] [Healthcare collection](https://www.monteirofabrics.com/collections/healthcare)
[2] Google Search Console (monteirofabrics.com), 90-day window ending 2026-06-26.
