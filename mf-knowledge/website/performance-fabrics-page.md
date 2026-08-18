---
type: Change
title: Monteiro Performance Fabrics — Landing Page
description: A light, technical B2B landing page for the Monteiro Performance Fabrics sub-brand at /pages/performance-fabrics, composed from the redesign's reusable sections plus a new tech-resources section and an in-house-lab section. Backed by a new Technical Hub blog (/blogs/technical-hub) with five draft specification articles. Straight-corner, left-aligned-card, brand-blue design. First round of Ivana's review incorporated.
resource: https://www.monteirofabrics.com/pages/performance-fabrics
tags: [website, performance-fabrics, sub-brand, landing-page, technical, seo, technical-hub, blog, claude-mf-june-proposta]
timestamp: 2026-07-02T00:00:00Z
status: deployed-to-sandbox
visibility: private
confidence: high
---

# Overview

**Monteiro Performance Fabrics** is a technical B2B sub-brand of Monteiro Fabrics, aimed at buyers
who specify on **certifications, durability, hygiene, compliance and operational risk — not
aesthetics** (healthcare, public spaces, stadiums, public transport, gym equipment, medical
vehicles). Source brief: *"Monteiro Performance Fabrics.pdf"* (8 pages).

> **Supersedes an earlier iteration.** A prior version of this page used a bespoke `pf-*` section set
> (`pf-hero`, `pf-credentials`, `pf-sectors`, `pf-certifications`, `pf-resources`, `pf-cta` +
> `performance-fabrics.css` + `pf-*` snippets). That approach was reset (the template was an empty
> placeholder) and **rebuilt from the redesign's reusable sections** — the `pf-*` files no longer
> exist in the theme. This document reflects the current, deployed build.

# Architecture — reused sections + two new sections

The page is composed in `templates/page.performance-fabrics.json` from the **same reusable sections
used across the redesign**, on a **light editorial palette with brand-blue (`#2F519B`) accents,
straight (zero-radius) corners and left-aligned card titles** to match the house style. Order:

1. **`hero`** — `image-with-text-overlay`: full-width background image (`fabricante_cadeiras_estadio_xxx2.png`, user-chosen) with H1 *"Engineering fabrics for demanding environments"*, tinted, **"Get in touch"** CTA.
2. **`story`** — `rich-text`: institutional copy; now opens with **"backed by 60 years of expertise"** (Ivana's ask).
3. **`capacity`** — `grade-cards`, **4-up stats band**: **60 years** (of expertise) → **6M metres/yr\*** → **Made in Portugal** → **In-house R&D**. *(6M figure `[TO CONFIRM]`.)*
4. **`tech`** — `performance-tech`: brand-blue capability band, six `perf-*.svg` icon tiles.
5. **`cert_icons`** — `fabric-spec-icons`: "Certifications at a glance" titled-icon strip.
6. **`certs`** — `spec-table`: the **major** certifications table, 12 rows (Crib 5/7, B1, Waterproof, Antiviral, Antibacterial, Bleach/Alcohol, Martindale, REACH, OEKO-TEX, PFAS-free), values `[TO CONFIRM]`.
7. **`lab`** — `rich-text` *(NEW)* **"Tested inside and out"** (eyebrow "Quality & testing"). Ivana-approved copy: unwavering quality commitment + warranty, and **testing both internally in our own laboratory and externally in certified third-party laboratories**.
8. **`sectors`** — `grade-cards`: 7 sector tiles → existing collection pages (3 links `[TO CONFIRM]`: stadiums, safety, medical vehicles).
9. **`cases`** — `rich-text`: anonymised case studies, details `[TO CONFIRM]`.
10. **`resources`** — `tech-resources` *(the Technical Hub block, below)*.
11. **`faq`** — `faq-schema`: 6 technical FAQs + FAQPage / BreadcrumbList JSON-LD.
12. **`cta`** — `rich-text`: closing **"Get in touch"** CTA.

*(The CHANCE 2.0 tie-in section that used to sit at position 8 was **removed** per Ivana — the page
should not communicate collections.)*

# Client feedback — round 1 (Ivana, incorporated 2026-07-01/02)

From the "Page Review" Notion database. Status of each point:

- ✅ **First + last CTAs → "Get in touch"** (dropped "samples" — this client type gets technical/specific engagement, not sample sends). *Pending: Ivana is creating a **dedicated technical email inbox**; CTA destinations (now `/pages/contact`) will re-point to it.*
- ✅ **Add "60 years of expertise"** to the story block (also surfaced as a stat card in the capacity band).
- ✅ **In-house laboratory section** added below the test icons, now carrying Ivana's approved copy (see `lab` above).
- ⏳ **R&D & pilot production section** — *not yet built.* Awaiting the pilot-line production capabilities (Ivana flagged "A CONFIRMAR"). To be added right after the lab section; can be stubbed with placeholder text on request.
- ✅ **Remove the CHANCE 2.0 section.**

Also fixed a rendering bug: the capacity card title read **"In-house R&amp;D"** — the `grade-cards`
title is `| escape`-rendered, so `&amp;` double-encoded; corrected to a literal `&` (**In-house R&D**).
Left-aligned `grade-cards` card titles (they were inheriting the theme's centered headings) — a shared
change that also left-aligns the CHANCE 2.0 grade cards.

# New section: `sections/tech-resources.liquid` (the Technical Hub block)

A reusable resource-library section (replaced the earlier single-CTA lead-magnet block):

- A **featured white-paper card** (full-width, brand-blue) + a **grid of article cards** (category
  tag, `<h3>` title, excerpt, read-time, "Read article →"), plus a "Browse all" link to the blog.
- **SEO:** semantic `<article>` + `<h3><a>` descriptive anchors; emits an **`ItemList` JSON-LD**
  enumerating every linked resource (pillar→spoke topic cluster). Straight corners, left-aligned titles.

# Technical Hub blog + articles

Created the **Technical Hub** blog — `/blogs/technical-hub` (id `125895213433`), comments closed,
with SEO title/description metafields. Added **five articles as drafts** (`isPublished: false`), each
with a query-answering intro, H2 sections, a spec checklist, internal links back to the pillar page,
and SEO title + meta-description metafields. Handles match the section's card links exactly:

| Article | Handle |
| --- | --- |
| Crib 5 vs Crib 7: which flammability rating do you need? | `crib-5-vs-crib-7` |
| How to choose fabrics for healthcare environments | `choosing-fabrics-for-healthcare` |
| Upholstery requirements for healthcare furniture | `healthcare-furniture-requirements` |
| Bleach cleaning: what to look for in a fabric | `bleach-cleaning-fabric-guide` |
| Understanding B1 certification | `understanding-b1-certification` |

They are **drafts** by design: a blog/article published anywhere is store-level (live), so keeping
them unpublished honours the sandbox-only approach — visible to staff in preview, invisible on the
live storefront/sitemap until publish. Article bodies carry `[TO CONFIRM]` on every Monteiro-specific
fact (exact crib ratings per grade, cleaning concentrations, certificate cross-references).

# Shopify page (LIVE record, minimal footprint)

Page `performance-fabrics` (id `715008672121`), **published**, `templateSuffix: performance-fabrics`,
short intro body + SEO title/description metafields. The full page renders only on the **sandbox**;
the live **Showcase 7.0** theme lacks the template and falls back to the default page template
(intro paragraph only) — a new, unlinked URL, nothing existing touched.

Review is tracked in the **"Page Review"** Notion database (Section = *Performance Fabrics*): the
landing page + Technical Hub blog + 5 article rows, each with a preview link and status.

# Pending / follow-ups

- **R&D & pilot production section** — build it (Ivana feedback item, awaiting pilot-line facts).
- **Dedicated technical email inbox** — Ivana to create; then re-point the "Get in touch" CTAs from `/pages/contact` to it.
- **Certification review** (client): certs table + article facts all `[TO CONFIRM]` (crib ratings per grade, Martindale rubs, antiviral/antibacterial standards, OEKO-TEX, PFAS-free basis).
- **3 sector links `[TO CONFIRM]`**: stadiums, safety equipment, medical vehicles.
- **Publish the 5 draft articles** at launch (once facts confirmed); optionally add the Technical Hub blog to nav.
- **White paper** (*The Complete Guide to Healthcare Upholstery Fabrics*) — featured card CTA still points at `/pages/contact`; gated PDF + lead-capture form is a deferred build.
- **Case studies** content (anonymised) and the **6M m capacity** figure — placeholders.
- **Entry points:** the page is unlinked — add a nav item / homepage feature / Google Ads landing.
- Out of scope (brief): dedicated catalogue, LinkedIn Showcase, Instagram (#MonteiroTechnical), Google Ads.

# Related

- Part of the [June 2026 Website Redesign](/website/june-2026-redesign.md); reuses the redesign's
  `spec-table`, `fabric-spec-icons`, `faq-schema`, `grade-cards` sections (see
  [sector & collection SEO pages](/website/sector-pages-seo.md)).
- Performance grades already exist via [CHANCE 2.0](/website/chance-2-0.md); the Technical Hub is a
  new blog distinct from the [News page redesign](/website/news-page-redesign.md).

# Citations

[1] [Performance Fabrics page](https://www.monteirofabrics.com/pages/performance-fabrics) (live = default-template fallback; full page on the sandbox).
[2] Technical Hub blog `/blogs/technical-hub` (id 125895213433) + 5 draft articles.
[3] Brief: "Monteiro Performance Fabrics.pdf" (MKTDIGITAL/3_CLIENTES/MONTEIRO RIBAS/PERFORMANCE FABRICS).
[4] Client feedback: "Page Review" Notion database, Performance Fabrics rows (Ivana).
