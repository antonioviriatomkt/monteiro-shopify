# SEO Cannibalization — Remediation Plan (June 2026 redesign)

A per-URL action list to stop Monteiro pages competing with each other in search. Built from the live SEO title tags/descriptions of every collection, page and article (audit run 2026-07-07). For Viriato + Ivana to sign off before publish.

## 🚀 AT LAUNCH — run these when the CLAUDE_MF_JUNE_PROPOSTA theme goes live
> **Reminder (added 2026-07-07).** Batches 1 & 2 (Medical differentiation, retitles, duplicate 301s) are already live. The items below were deliberately **held until publish** — work through them the day the proposal theme goes live.

**1. Sector hub redirects** — confirm the live "Our Sectors" hub URL first (target `/pages/sectors` had 0 GSC footprint pre-launch):
- [ ] `301` `/pages/fabrics-by-industry` → the Sectors hub
- [ ] `301` `/pages/by-application` → the Sectors hub
- [ ] unpublish both pages (`pageUpdate isPublished:false`) so the 301s fire

**2. CHANCE 2.0 migration** — Classic=chance stays; the other five collections cease → `301` into their grade:
- [ ] `/collections/ocean` → `/collections/chance-outdoor`
- [ ] `/collections/mediflex` → `/collections/chance-mediflex`
- [ ] ~~`/collections/peel` + `/pages/peel-collection` → `/collections/chance-bioblend`~~ **REMOVED (2026-07-13): Peel is NOT part of CHANCE 2.0 — Bioblend is a separate new collection. Peel stays live; do NOT redirect it.**
- [ ] `/collections/prosoft` → `/collections/chance-crib-7-b1`
- [ ] `/collections/portus` → `/collections/chance-crib-5`
- [ ] old standalone product URLs (mediflex/ocean/prosoft/portus — **not peel**) → their grade slug
- [ ] **manually unpublish** the five ceasing collections (MCP blocks collection unpublish)
- [ ] apply held retitles: `/pages/chance-collection` → "CHANCE 2.0 | The Performance Fabric Family | Monteiro"; `/collections/chance` (Classic) → "CHANCE Classic | 236-Colour Coated Fabric | Monteiro" (confirm the `chance` handle/translation conflict is resolved)

**3. About Us consolidation:**
- [ ] move Quality, R&D and Mission/Vision content into `/pages/about-us` as sections
- [ ] `301` `/pages/quality`, `/pages/r-d`, `/pages/mission-vision` → `/pages/about-us` (+ unpublish each page)

**4. Theme cleanup:**
- [ ] remove the Train tile from `/pages/mobility`, `/pages/mission-vision`, `page.all-collectby-industry.json`, `page.all-collect-by-applicabil.json`
- [ ] retire `collection.train.json`

**5. Phase 3 — canonicals & internal linking:**
- [ ] editorial `/pages/` → product/collection canonicals
- [ ] Technical Hub pillar/spokes → link to `/collections/healthcare` & `/collections/medical`
- [ ] fire/Crib hierarchy: articles → performance-fabrics → crib collections
- [ ] de-dup the sustainability articles duplicated across `/blogs/news` and `/blogs/sustainability` (canonical to one)

**6. Phase 4 — measure:**
- [ ] re-submit the sitemap in GSC
- [ ] monitor query→page for 2–4 weeks to confirm each cluster consolidated onto its canonical (Medical vs Healthcare, pillar vs collection, the new pages)

---

## Rules before executing (read first)
1. **Verify live traffic in Search Console before any `301` or `Delete`.** Several targets are live and may hold rankings/backlinks. Rule of thumb: if a URL has clicks/impressions, **301 it to the canonical** (preserves equity) rather than delete; only hard-delete zero-value drafts.
2. **Retitles are safe and reversible** — do these first for quick wins.
3. **301 only after** updating internal links (nav, homepage, cross-links) that point at the old URL, then re-submit the sitemap.
4. Collection SEO is **live now**; page SEO is partly staged. Coordinate retitle timing with the theme publish.
5. One canonical per intent: decide the winner, point everything else at it.

## Action legend
`KEEP` leave as-is · `RETITLE` change title tag + H1 to de-overlap · `CANONICAL→` add rel=canonical to the primary · `301→` redirect · `DELETE` remove (zero value) · `NOINDEX` keep for users/ads but drop from index · ⚑ = **needs an Ivana decision**

---

## Decisions — RESOLVED (Ivana, 2026-07-07)
- **D1. `/collections/medical` → KEEP as a distinct, more technical "medical-grade" page.** Ivana wants a separate Medical page for the technical healthcare side (medical-grade fabrics) and to capture the large "medical" / "medical-grade" keyword demand that "healthcare" misses. **See Appendix A** for the differentiation plan.
- **D2. `/collections/train` → 301 into `/collections/mass-transportation`.** Mass Transportation keeps rail ownership (its title already covers Bus, Train & Metro).
- **D3. `/collections/restaurants-fabrics` → 301 into `/collections/hospitality-fabrics`.** Hospitality keeps the bars/restaurants scope.
- **D4. Browse hubs → the new "Sectors" page is canonical.** "By Industry" and "By Application" are being retired → `301` both into the Sectors hub. *(Confirm the final Sectors hub URL before firing.)*
- **D5. `/pages/high-performance-…-medical-equipment` — disabled (was an ads LP) → `301` → `/collections/medical`** so its equity/backlinks don't 404.

### Refinements & execution status (2026-07-07)
- **Corporate cluster → merge into About Us.** `/pages/quality`, `/pages/r-d`, `/pages/mission-vision` will become sections of `/pages/about-us`, then 301 to it. **Not retitled** (moot). Deferred content task.
- **CHANCE 2.0 migration (at new-site launch).** CHANCE becomes six grades — Classic=chance, Outdoor=**ocean**, Mediflex=**mediflex**, **Bioblend=a NEW/separate collection (corrected 2026-07-13 — *not* a Peel rebrand; Peel stays live)**, Crib 7/B1=**prosoft**, Crib 5=**portus**. The **four** rebranded source collections (ocean/mediflex/prosoft/portus) cease → **301 into their CHANCE grade at launch** (e.g. `/pages/mediflex` → `/collections/chance-mediflex`). **Peel is excluded** — it keeps `/pages/peel-collection` + its product. The `chance-2-0` collection is the future hub — **keep live, do not clean up**. (Supersedes the earlier "delete chance-2-0" line.)
- **Executed (live):** 7 retitles (fashion + siesta-patio/mediflex/electra/origin/straw/amazónia) and 5 duplicate 301s. **Outstanding manual step:** unpublish `/collections/healthcare-copia` by hand (MCP blocks `publishableUnpublish`) so its 301 activates.
- **Batch 2 (2026-07-07, GSC-checked) — LIVE.** Restaurants→Hospitality (+ Hospitality retitled to "Hospitality & Restaurant Upholstery Fabrics | Monteiro" because GSC showed Restaurants held the larger impression base, 1,680 vs 1,277) and Train→Mass Transport (0 clicks). Both verified firing (curl → 301). **By-Industry + By-Application → Sectors: deferred to launch** — the real Sectors hub goes live when the proposal theme is published (target `/pages/sectors` had 0 GSC footprint), so fire these two then.
- **Manual-unpublish queue — CLEARED (2026-07-07):** client unpublished `train` & `restaurants-fabrics` and deleted `healthcare-copia`. **All 7 cleanup/redirect 301s verified live.**

---

## Cluster 1 — Medical / Healthcare (highest priority)
Canonical for "healthcare upholstery fabrics" = **`/collections/healthcare`**.

| Page | Now | Do | To / new title |
|---|---|---|---|
| `/collections/healthcare` | "Healthcare Upholstery Fabrics \| Antimicrobial" | **KEEP** | canonical hub — unchanged |
| `/collections/medical` | "Medical Fabrics — Medical-Grade Antimicrobial" | **KEEP + DIFFERENTIATE** (D1 — see Appendix A) | "Medical-Grade Upholstery Fabrics \| Antimicrobial & Bleach-Cleanable \| Monteiro" |
| `/collections/healthcare-copia` (titled "Medical") | duplicate copy, 3 prod | **301→ `/collections/medical`** then delete | — |
| `/pages/medical` (taxonomia-medical) | "Medical", no title tag | **301→ `/collections/healthcare`** | — |
| `/pages/high-performance-…-medical-equipment` | disabled (was ads LP) | **301→ `/collections/medical`** (D5) | equity → the medical-grade page |
| `/pages/mediflex` | "Healthcare Fabrics \| Mediflex Collection" | **RETITLE** + CANONICAL→ Mediflex product | "Mediflex \| Antimicrobial Medical-Grade Coated Fabric" |
| `/pages/electra-medical-upholstery` | "Healthcare Fabrics \| Electra Collection" | **RETITLE** + CANONICAL→ Electra product | "Electra \| Medical-Grade Coated Fabric" |
| Technical Hub pillar `complete-guide-to-healthcare-upholstery-fabrics` | "The Complete Guide to Healthcare Upholstery Fabrics" | **KEEP** (informational) | ensure it links down to `/collections/healthcare` as the commercial CTA |
| spokes `choosing-fabrics-for-healthcare`, `healthcare-furniture-requirements` | informational | **KEEP** | link to pillar + collection |

## Cluster 2 — Mass Transportation vs Train
| Page | Now | Do | To |
|---|---|---|---|
| `/collections/mass-transportation` | "Mass Transport… Bus, Train & Metro" | **KEEP** (now owns rail too) | keep title; optionally add a rail / EN 45545-2 subsection |
| `/collections/train` | "Train & Railway Fabrics — Fire-Rated Rail Upholstery" | **301→ `/collections/mass-transportation`** (D2) | remove the Train tile from the Sectors page + retire `collection.train.json` |

## Cluster 3 — Editorial `/pages/` vs shoppable page (per fabric line)
Role split: `/pages/` = brand story on the **branded** query; the collection/product page = shoppable.

| Page | Now | Do | To |
|---|---|---|---|
| `/pages/chance-collection` (CHANCE 2.0 hub) | "Upholstery Fabrics \| Chance Collection" | **RETITLE** → brand hub | "CHANCE 2.0 \| The Performance Fabric Family — Monteiro" |
| `/collections/chance` (CHANCE Classic) | no title tag (null) | **RETITLE** (Classic-specific) | "CHANCE Classic \| 236-Colour Coated Fabric \| Monteiro" |
| `/pages/siesta-patio-outdoor-upholstery` | "Siesta & Patio \| Outdoor Coated Fabrics \| **Outdoor upholstery**" | **RETITLE** (drop generic "outdoor upholstery") | "Siesta & Patio \| Outdoor Coated Fabric Collections" |
| `/pages/peel-collection` | "Upholstery Fabrics \| Peel Collection" | **RETITLE** + CANONICAL→ Peel product (Peel **stays** — not part of CHANCE 2.0) | "Peel \| 65% Bio-Based Coated Fabric \| Monteiro" |
| `/pages/origin-sustainable-fabrics` | "Upholstery Fabrics \| Origin Collection" | **RETITLE** + CANONICAL→ Origin product | "Origin \| Sustainable Coated Fabric \| Monteiro" |
| `/pages/straw` | "Upholstery Fabrics \| Straw Collection" | **RETITLE** + CANONICAL→ Straw product | "Straw \| Natural-Look Coated Fabric \| Monteiro" |
| `/pages/amazonia…` | "Upholstery Fabrics \| Amazonia Collection" | **RETITLE** (keep the Nini Andrade Silva designer angle) | "Amazónia by Nini Andrade Silva \| Designer Coated Fabric" |
| `/pages/highlighted-collections` | "Chance and Peel collections" | **NOINDEX or 301→ `/pages/chance-collection`** | redundant with Chance + Peel |

## Cluster 4 — Restaurants vs Hospitality
| Page | Now | Do | To |
|---|---|---|---|
| `/collections/hospitality-fabrics` | "Hospitality… hotels, lobbies, bars and restaurants" | **KEEP** (now absorbs restaurants) | keep bars/restaurants in scope |
| `/collections/restaurants-fabrics` | "Restaurant & Bar Upholstery Fabrics" | **301→ `/collections/hospitality-fabrics`** (D3) | ⚠ check GSC traffic first (26 products, likely ranks) |

## Cluster 5 — Umbrellas vs sectors
| Page | Now | Do | To |
|---|---|---|---|
| `/collections/coated-fabrics` | "Coated Upholstery Fabrics \| **Vegan Leather**" | **KEEP** (owns "coated fabrics" head term) | keep vegan-leather mention secondary |
| `/collections/fashion` | "Coated Fabrics for Fashion \| **Vegan Leather Alternative**" | **RETITLE** (own the fashion use-case) | "Vegan Leather for Bags, Footwear & Apparel \| Monteiro" |
| `/collections/contract` | "Contract Upholstery Fabrics \| Commercial-Grade" | **KEEP** (category head term) | ensure sector pages stay on sector+use long-tail |

## Cluster 6 — Fire / Crib / stadium
Hierarchy: articles (informational) → `/pages/performance-fabrics` (technical hub) → crib collections (shoppable).

| Page | Now | Do |
|---|---|---|
| `/pages/performance-fabrics` | "Performance Fabrics \| Certified Technical Coated Fabrics" | **KEEP** (hub) |
| `/collections/chance-crib-5`, `/collections/chance-crib-7-b1` | brand-led grade pages | **KEEP** (keep brand-first, don't chase bare "Crib 5 fabric") |
| Articles `crib-5-vs-crib-7`, `understanding-b1-certification` | informational | **KEEP** + canonical-self + link to the crib collections |
| News `upholstery-stadium-seating` | "Upholstery Stadium Seating \| Fire-Resistant Fabrics" | **KEEP** (informational) + link to `chance-crib-7-b1` / performance-fabrics |

## Cluster 7 — Corporate "coated fabrics manufacturer Europe"
All four chase the manufacturer-in-Europe head term. **RETITLE** to distinct angles:
| Page | Now | To |
|---|---|---|
| `/pages/quality` | "Certified manufacturers of coated fabrics in Europe" | "Quality & Certifications \| ISO 9001 & 14001 — Monteiro" |
| `/pages/r-d` | "Coated fabrics manufacturers in Europe" | "R&D & Custom Colour Development \| Monteiro Fabrics" |
| `/pages/mission-vision` | "Sustainable fabric manufacturing in Europe" | "Our Mission & Values \| Monteiro Fabrics" |
| `/pages/sustainable-fabrics` | "Sustainable fabrics \| Textile Manufacturers Europe" | **KEEP** (owns "sustainable fabrics") |

## Cluster 8 — Browse hubs & blog duplicates
| Page | Do |
|---|---|
| `/pages/fabrics-by-industry`, `/pages/by-application` (being retired, D4) | **301→ the new Sectors hub** (confirm its URL before firing) |
| Blog dupes: `sustainability-and-transparency`, `what-is-reach`, `10-year-warranty` in **both** `/blogs/news` and `/blogs/sustainability` | **CANONICAL→** the `/blogs/news` version (or 301 the sustainability-blog copies) |

## Cleanup — junk/drafts (verify no traffic first, then remove)
| Page | Do |
|---|---|
| `/collections/chance-2-0` (0 products, broken meta " - Monteiro Fabrics") | **DELETE or NOINDEX** — it's the hub concept, but `/pages/chance-collection` is the real hub |
| `/pages/contact-us_` (duplicate contact) | **301→ `/pages/contact`** |
| `/pages/copy-of-general-supply-terms…draft-old` | **DELETE** (draft copy) |

---

## Execution sequence
1. **Phase 1 (safe, now):** all `RETITLE` rows — de-overlaps title tags, fully reversible. Biggest quick wins: Cluster 1 (mediflex/electra), Cluster 2 (drop "Train"), Cluster 3 (siesta-patio + branded lines), Cluster 5 (fashion/coated split), Cluster 7 (corporate).
2. **Phase 2 (after GSC check):** the `301`/`DELETE` cleanups — healthcare-copia, /pages/medical, contact-us_, draft T&C, chance-2-0. Update internal links first.
3. **Phase 3 (canonicals):** editorial→product canonicals (Cluster 3), pillar→collection linking (Cluster 1), browse-hub + blog-dup canonicals (Cluster 8).
4. **Phase 4:** re-submit sitemap; monitor GSC query→page for 2–4 weeks to confirm each cluster consolidated onto its canonical.

---

## Appendix A — Making the Medical page distinctive (D1)

**The split:** Healthcare = the broad **sector/facility** page (furnishing healthcare spaces). Medical = the **technical, medical-grade product** page (specifying a fabric that meets a medical-grade bar, often for medical devices & clinical-critical environments). Different searcher, different intent → they stop competing.

### Keyword ownership (no overlap on the primary term)
| Page | Owns (primary) | Also targets |
|---|---|---|
| **Healthcare** | "healthcare upholstery fabrics" | hospital seating fabric, patient chair upholstery, clinic / waiting-room fabric, care-home upholstery, antimicrobial healthcare fabric |
| **Medical** | **"medical-grade fabric" / "medical-grade upholstery" / "medical fabric"** | medical vinyl fabric, fabric for medical devices, examination / treatment-table fabric, dental-chair upholstery, operating-theatre seating fabric, bleach-cleanable / disinfectant-resistant medical fabric, ISO 22196 fabric |

Rule: Medical does **not** use the bare "healthcare upholstery fabrics" as its primary; Healthcare does **not** lead with "medical-grade." Each links to the other with explicit intent (below).

### On-page changes to the Medical page
1. **Title:** `Medical-Grade Upholstery Fabrics | Antimicrobial & Bleach-Cleanable | Monteiro`
2. **H1:** "Medical-Grade Upholstery Fabrics" (not "Medical Fabrics").
3. **Meta description:** lead with *medical-grade*, for medical devices & clinical equipment, name the standards + bleach/disinfectant tolerance, and Mediflex/Electra/Flora.
4. **Positioning intro:** define what "medical-grade" means as a technical bar — antimicrobial **and** antiviral tested, fluid-proof, tolerant of hospital-grade disinfectants including bleach, phthalate-free/REACH, low-emission — and who it's for (medical-device OEMs, clinical & high-acuity environments). This is the content Healthcare deliberately does not carry.
5. **Unique content blocks (differentiate, don't duplicate Healthcare):**
   - "**What makes a fabric medical-grade?**" explainer — owns the informational query.
   - A **medical-grade spec table**: ISO 22196 (antibacterial), ISO 18184 / 20743 (antiviral / antibacterial), fluid resistance, **disinfectant & bleach compatibility**, phthalate-free / REACH, fire where relevant. *(Values from the technical team — apply the same `[TO CONFIRM]` discipline as the Performance Fabrics checklist.)*
   - **Application focus on equipment/devices**: examination & treatment tables, dental / podiatry chairs, operating-room & ICU seating, patient-handling & mobility equipment, lab & imaging equipment — vs Healthcare's rooms/seating.
   - A **cleaning / disinfectant matrix** (bleach + common hospital disinfectants) — strong, unique medical-grade signal.
   - The medical-grade lines with deeper **technical datasheets** than Healthcare's broad grid.
   - **FAQ** tuned to medical queries: "What is a medical-grade fabric?", "Are your fabrics bleach-cleanable?", "Which standards do they meet?", "Can these be used on medical devices?"
6. **Intent-separating internal links (this is what tells Google they differ):**
   - Healthcare → *"Specifying for medical devices or clinical-critical environments? See our **medical-grade fabrics**."* → `/collections/medical`
   - Medical → *"Furnishing general healthcare seating and waiting areas? Browse **healthcare upholstery fabrics**."* → `/collections/healthcare`
7. **Structured data:** CollectionPage + FAQPage (medical FAQs) + BreadcrumbList; keep "medical-grade" in H1/H2s.
8. **Depth (resolved):** the range is **only these 3 products** (Mediflex, Electra, Flora) — confirmed with Ivana, no expansion. The page offsets the thin grid with editorial depth: the medical-grade explainer, the device/equipment applications block, the standards & certificates FAQ, and the spec table.

## Open questions log
- ⚑ Confirm the final **Sectors hub URL** (D4 redirect target).
- Standards/spec **values** for the Medical spec table — same technical-team dependency as the Performance Fabrics checklist.
