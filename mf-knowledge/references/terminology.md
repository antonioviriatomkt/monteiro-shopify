---
type: Reference
title: "Terminology: Product vs Collection vs Sector"
description: Disambiguates the overloaded word "Collection" across Monteiro's Shopify CMS, website, and this bundle.
visibility: internal
status: approved
owner: antonio
confidence: high
tags: [terminology, ontology, data-model]
timestamp: 2026-06-25T16:30:00Z
---

# Why this matters

The word **"Collection"** means three different things across Monteiro's systems. Anyone — a person
or an AI agent — reading the Shopify admin, the website, or this bundle will conflate them without
this note. Read this before reasoning about "collections".

# The three meanings

| When you see "Collection"… | It actually means | Example | In this bundle |
|---|---|---|---|
| Monteiro's product naming ("Chance **Collection**") and the website header **"Collections"** | A **fabric line** (one coated-fabric product) | Chance, Mediflex, Electra | `type: Product` in `/products/collections/` |
| A Shopify **Collection** object (most of them) | A **Sector** — a smart collection grouping products by a sector tag | Healthcare, Automotive | `type: Sector` in `/market/segments/` |
| A Shopify **Collection** object (some) | An **editorial / featured** grouping with its own page | the CHANCE showcase, Peel page | `type: Page` (not yet built) |

# System-by-system mapping

| System | "Product" =&nbsp; | "Collection" =&nbsp; |
|---|---|---|
| **Shopify admin (CMS)** | a fabric line (Chance, Mediflex, Electra…) | usually a **sector** (smart, tag-based); also some editorial / per-fabric groupings |
| **Website (storefront)** | not surfaced under this word | header **"Collections"** = the **fabric lines** (products) |
| **This OKF bundle** | `type: Product` → `/products/collections/*` = fabric line | `type: Sector` → `/market/segments/*` = sector; editorial → `type: Page` |

> In short: **website "Collections" = Shopify Products = our fabric lines.** **Shopify "Collections" = our Sectors.** The two systems use the same word for opposite things.

# What is actually in Shopify (snapshot, 2026-06-25)

> **Post-cleanup update (2026-06-25):** collections reduced **44 → 22** — duplicate marine/outdoor/mobility collections and empty fabric-line shells removed; marine products standardised onto the `Marine Interior` tag. The sections below describe the pre-cleanup state for reference.

* **~42 Products** = fabric lines.
* **Sector collections** (smart, single tag): Office (31), Restaurants (26), Hospitality (25), Healthcare (24), Public Spaces (24), Retail (30), Fitness (19), Residential (18), Recreational Vehicles (15), Fashion (11), Marine Interior (6–10), Outdoor (8), Automotive (7), Mass Transportation (6), Motorcycle (6), Aviation (4) — plus Medical (3) and Train.
* **Grouping collections** (smart, many tags): **Contract** (36 = the interior sectors) and **Mobility** (18 = the transport sectors).
* **Per-fabric / editorial collections**: e.g. **CHANCE** (7 = its seven store pages), plus several near-empty shells (Beta, Furna, Garbe, Laguna, Lima, Paiva, Portus, Villa, Villa Nabuck, Delta, Regata, Twill).
* **All-products**: "All Coated Fabrics" / "COATED FABRICS" (42).
* **Utility**: Home page; "Smart Products Filter Index – do not delete".

# Data-hygiene notes (internal)

* **Duplicate sector collections** exist — two "Outdoor", two "Mobility", and `marine-interior` (MARINE) vs `marine` (Marine Interior) vs `neutros` (Marine Interior) all keyed off marine tags. Candidates to consolidate.
* **Empty per-fabric collections**: many fabric-line collections have 0 products because the fabric isn't tagged with its own name (only CHANCE is).
* **Inconsistent sector tags**: casing/spelling varies (`AVIATION`, `mass transportation`, `Marine Interior` vs `MARINE`). This bundle normalises them to clean sector slugs (see [sectors](/market/index.md)).

# Recommendation

Standardise the language: **fabric line = Product**, **sector = Collection**, and reserve "featured/editorial"
for curated **Page** concepts. Even though the website header says "Collections" for fabric lines, avoid that
usage in internal docs — call them fabric lines or products.

# Related

* [Products catalogue](/products/index.md) (fabric lines)
* [Sectors](/market/index.md)
* [Chance](/products/collections/chance.md) - the fabric line published as 7 store pages / the CHANCE collection
