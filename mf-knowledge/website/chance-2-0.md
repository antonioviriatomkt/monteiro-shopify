---
type: Change
title: CHANCE 2.0 Integration
description: CHANCE rebuilt as an umbrella brand of six performance grades sharing one engraving — hub page, six grade collection pages, nav and homepage feature, on the CLAUDE_MF_JUNE_PROPOSTA theme.
resource: https://www.monteirofabrics.com/pages/chance-collection
tags: [website, chance, chance-2-0, collections, rebrand, claude-mf-june-proposta]
timestamp: 2026-06-29T00:00:00Z
status: on-hold
visibility: private
confidence: high
---

# Point of situation (2026-07-15)

**Status: built on the sandbox, on hold, gated by the colour work + catalogue/copy.** Chance 2.0
remains the **go-forward system** — the whole structure (hub, six grade collections, templates, nav
entry, grade-cards section) is built and previewable. What's missing before it can launch is
**content, not code**.

**Decision confirmed with the client (2026-07-15):**
- The launch is **held** until all marketing material is ready (the same hold that pauses the whole
  [June 2026 redesign](/website/june-2026-redesign.md)).
- ~~Chance 2.0 was **made invisible on the homepage** for the (now-held) launch — `chance_2_feature`
  is `disabled: true` in `templates/index.json`.~~ **Reverted 2026-08-18:** the band is **enabled**
  and stays enabled. Hiding it was only a contingency for launching before Chance 2.0 was ready.
- A stop-gap **editorial LP for the original Chance** (`/pages/chance-lp`, "CHANCE / 236 SHADES") was
  built as a fallback for going live *without* Chance 2.0. **It is now shelved / no longer needed** —
  the plan is to **keep the Chance 2.0 system and finish it**, not revert to original Chance.

**🔴 Blocking item — Bioblend contains the Peel product (verified live 2026-08-18).** The
`chance-bioblend` collection holds **`peel-collection`**, and the grade page renders that product
directly with its title block suppressed — so **Peel is being presented as CHANCE Bioblend**, while
Peel also lives at `/pages/peel-collection` and `/products/peel-collection`. This contradicts the
2026-07-13 client correction that Bioblend is a **separate new collection**, not a Peel rebrand.
Duplicate content and a factual misstatement of what the grade is. **Bioblend needs its own product
before launch.** (The audit flagged this as open on 2026-07-13; it is still open.)

**Blocking item — Chance 2.0 colour samples (all four aspects open):**
1. **Swatch images missing** — no colour swatch images exist on any grade variant yet (the
   `variant_picker` renders text-only).
2. **Colour curation not final** — which colours make each grade isn't decided (e.g. the logged
   Crib 5 / Crib 7 curation, ~34→22 and ~24→9).
3. **Physical colour cards pending** — waiting on Ivana's physical colour cards/reference before
   curating or shooting swatches.
4. **Naming / cross-reference unresolved** — grade colour names and the cross-reference to the old
   collection colour names aren't finalised.

**Also gating launch (per client):** Chance 2.0 **catalogue / grade marketing copy** and grade
product setup (e.g. a dedicated Bioblend product, cosmetic product/colour renames). The
Performance-Fabrics content is the *other* launch gate but is tracked separately.

**Done / de-risked:** the six grade collection pages already carry **datasheet-accurate specs**
(DC 073.01) with no `[TO CONFIRM]`; ~~the Mediflex colour renames (Desert→Dune, Ocean→Lagoon,
Shale→Oasis) are **live**~~ *(see correction below)*; the "DOWNLOAD CATALOGUE" CTA → the CHANCE 2.0
catalogue PDF is wired on the hub + all six grade pages; the Classic `templateSuffix`
handle/translation conflict is resolved.

> ⚠️ **Correction 2026-08-18 — the Mediflex renames are NOT live.** Read from the store twice:
> `mediflex-collection` still carries **DESERT, OCEAN and SHALE**; DUNE, LAGOON and OASIS do not
> exist on it. The rename is *designed but unapplied*. It matters because all three old names
> **collide with different Classic colours of the same name** (DESERT on [5/7], OCEAN on [4/7],
> SHALE on [1/7]) — which is exactly what the rename was meant to resolve. The AGO2026 catalogue
> carries **both** sides of each pair, confirming the intent. Pending work, not done work.

**Not gating (per client):** the migration/IA decisions (Sectors hub URL, redirect plan, About-Us
merge) — real work, but not what's holding Chance 2.0.

---

# Overview

CHANCE stopped being a single collection and became an **umbrella brand of six performance grades**
that all share the same iconic CHANCE engraving — *one look, six grades; choose by the project's
fire, hygiene, sustainability or weather requirement.* Each grade is an existing Monteiro fabric,
rebranded into the family. Source: Notion "Info CHANCE 2.0" + catalogue **DC 073.01**.

Approach (agreed with the client): **family overlay + grade rebrand with a graceful SEO migration** —
the rebranded fabrics retire into the grades (new names + new slugs), with permanent 301s from the old
URLs so nothing breaks. **Electra is not part of CHANCE 2.0** — it stays a separate medical line.
**Peel is also NOT part of CHANCE 2.0** (corrected 2026-07-13): `CHANCE Bioblend` is a **separate new
collection**, not a Peel rebrand, so Peel keeps its own `/pages/peel-collection` + product and is not redirected.

# The six grades

| Grade | Rebranded from | Slug | Collection ID |
|---|---|---|---|
| CHANCE Classic | Chance | `/collections/chance` *(unchanged)* | 433464344879 |
| CHANCE Mediflex | Mediflex | `/collections/chance-mediflex` | 704468517241 |
| CHANCE Outdoor | Ocean | `/collections/chance-outdoor` | 704468550009 |
| CHANCE Bioblend | *new collection **based on** Peel — chestnut-peel process, Chance texture, 8 Peel colours; specs TBC in DC 073.01. Peel stays separate — no redirect (Ivana 2026-07-13)* | `/collections/chance-bioblend` | 704468582777 |
| CHANCE Crib 7 / B1 | Prosoft | `/collections/chance-crib-7-b1` | 704468615545 |
| CHANCE Crib 5 | Portus | `/collections/chance-crib-5` | 704468648313 |

# What was built

**Hub** — the existing `/pages/chance-collection` editorial page was *evolved in place* (keeping its
ranking authority) into the CHANCE 2.0 hub: hero → "one look, six grades" intro → grade selector →
shared credentials → comparison matrix → 236-colour Classic story → FAQ + JSON-LD → CTA.

**Six grade collection pages** — each on the sector-page template stack (keyword H1, credentials,
technical spec table, FAQ + FAQPage/Breadcrumb/CollectionPage JSON-LD, CTA), carrying the **real
DC 073.01 catalogue specs** (composition, weight, thickness, per-grade fire list, biological, biobased).
Breadcrumb is CHANCE 2.0 → grade. The five single-product grades show the **product directly**
(`featured-product`: media + colour swatches + buy/sample button, product title block omitted so the
old names don't resurface); **Classic keeps the product grid** (236-colour palette across 7 products).

**Shopify** — five new collections created (table above), each holding its product line with SEO +
`templateSuffix`, and published to the Online Store channel. New reusable theme section:
`sections/grade-cards.liquid`.

**Nav & homepage** — CHANCE 2.0 leads a curated **Collections** dropdown in the redesign menu
`mf_june_menu` (CHANCE 2.0 · Straw · Origin · Amazónia · Electra · Siesta & Patio); a **CHANCE 2.0
feature** was added to the homepage (`templates/index.json`). The live `main-menu` is untouched.

# URL strategy

- Never put "2.0" in a slug; the hub stays canonical at `/pages/chance-collection`. Any `chance-2-0`
  alias would 301 *into* it.
- Old URLs 301 to the new grade slugs **permanently** (kept forever, not just during transition).

# Not done — staged for publish

- **301 redirects** old → new grade slugs (`/products/mediflex-collection`, `ocean-collection`,
  `prosoft-collection`, `portus-collection`, `/pages/mediflex`). **Peel EXCLUDED (corrected 2026-07-13) — it stays live.**
  Written but **not fired** — firing pre-publish would bounce the live product pages to sandbox-only pages.
- **Classic template suffix** (`chance-classic`) — **resolved** (2026-07-02): the handle/translation
  conflict is cleared, `chance` now carries `templateSuffix: chance-classic`, so `/collections/chance`
  renders the grade template directly (no `?view=chance-classic` workaround). Its **filter bar was
  removed** (main-collection `filter_mode_desktop`/`_mobile` → `none`); the 236-colour grid stays.
- Adding the grade collections to the **live** nav; optional sector→grade callouts
  (Healthcare→Mediflex, Public Spaces→Crib 7/B1, Hospitality→Crib 5, Outdoor & Marine→Outdoor).
- **OKF bundle**: refile the four rebranded product concepts ([Mediflex](/products/collections/mediflex.md),
  [Ocean](/products/collections/ocean.md), [Prosoft](/products/collections/prosoft.md),
  [Portus](/products/collections/portus.md)) and [Chance](/products/collections/chance.md) under a
  CHANCE 2.0 umbrella. **Peel is NOT part of CHANCE 2.0 (corrected 2026-07-13) — leave it as its own concept.**

# Related

- Part of the [June 2026 Website Redesign](/website/june-2026-redesign.md).
- Built on the [sector & collection SEO page](/website/sector-pages-seo.md) template system.
- Product concepts (to be refiled): [Chance](/products/collections/chance.md),
  [Mediflex](/products/collections/mediflex.md), [Ocean](/products/collections/ocean.md),
  [Peel](/products/collections/peel.md), [Prosoft](/products/collections/prosoft.md),
  [Portus](/products/collections/portus.md).

# Citations

[1] Notion — "Info CHANCE 2.0" (captures catalogue DC 073.01), 2026-06-29.
[2] [CHANCE 2.0 hub](https://www.monteirofabrics.com/pages/chance-collection)
