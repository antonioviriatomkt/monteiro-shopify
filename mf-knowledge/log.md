# Update Log

## 2026-07-15 (terminology fix + launch-hold status recorded)

* **Fix**: removed **"faux-leather"** from the bundle — Monteiro makes PVC/PU **coated fabrics**, not faux-leather. [About](/company/about.md) now reads "(PVC- and PU-coated textiles)"; the [skai competitor stub](/competitors/skai.md) + [competitors index](/competitors/index.md) reworded to "coated-fabrics brand". (Left the SEO *keyword* records "synthetic leather"/"vegan leather" in `website/` — those document live title tags + search demand, not Monteiro's own product framing.)
* **Update**: recorded the previously-unlogged **launch hold** and de-scoping across [June 2026 redesign](/website/june-2026-redesign.md) (status → `on-hold`), [Chance 2.0](/website/chance-2-0.md) (added a point-of-situation: on hold, gated by colour samples + catalogue/copy; the stop-gap original-Chance editorial LP is shelved), the [website log](/website/log.md) (2026-07-15), and a PAUSED banner on `briefs/migration-readiness-audit.md`.
* **Sync (not bundle)**: pulled the CLAUDE_MF_JUNE_PROPOSTA sandbox and re-synced 15 drifted theme files into `APP/theme/` (client theme-editor edits) — detailed in the [website log](/website/log.md).

## 2026-07-06 (new collection — Jeans added)

* **Update**: Added a new collection, [Jeans](/products/collections/jeans.md), from datasheet **DC 002 ED.10** — a heavy (930 g/m²), cotton-backed denim-look coated fabric (PVC 77% · CO 23%, 1,40–1,60 mm, ≥400.000 Martindale, ±30 m rolls). Captured the full fire list (FMVSS302 · EN 1021-1+2 · NFPA 260 clause 6.1 Class I · Cal. TB 117 §1 · IMO 2010 FTP Part 8 · BS 5852 Crib 5 · NF P 92-503 M2 · UNI 9175 1.IM · ÖNORM A 3800-1 & B 3825), credentials (incl. toys & childcare articles), the 7 colours (Light Grey, Light Blue, Red, Dark Grey, Dark Green, Yellow, Orange) and the 10 datasheet application icons.
* **Placement**: assigned to the **Pure Contract** range (heavyweight / high-abrasion) — inferred from spec, since Jeans is **not on the Shopify store / website** (a stock-service collection only, no product page). Flagged for confirmation.
* **Wiring**: linked Jeans into the products catalogue, the Pure Contract range file, the root index (28 → 29 collections) and the 10 applicable sector files (Hospitality, Healthcare, Office, Public Spaces, Fitness, Restaurants, Retail, Residential, Recreational Vehicles, Marine Interior).
* **Positioning**: Jeans is built mainly for high-traffic **hospitality / QSR** seating (per Antonio). Recorded a real-world reference — **McDonald's** uses it in some restaurants — in [use-cases](/customers/use-cases.md) (internal, pending client permission); kept the public Jeans page name-free. Aligned the catalogue/range one-liners to the hospitality focus.
* **Lint**: 0 broken links across 143 files; 13 inbound references to jeans.md.


## 2026-07-03 (reporting — Marketing Dashboard v1 shipped)

* **Creation**: Added the [reporting/](/reporting/index.md) section recording the [Marketing Dashboard](/reporting/marketing-dashboard.md) — a Monteiro-branded **Next.js / Supabase / Notion** web app that replaces the monthly PDF report (outcome-first PT report; MoM deltas + trend sparklines; de-duplicated leads). Deployed to Vercel (**https://monteiro-dashboard.vercel.app**, private repo `antonioviriatomkt/monteiro-dashboard`) on a dedicated Supabase project. **GA4**, **Search Console**, **Shopify** (OAuth `read_orders`) and **Sender** pulls are live; April–June 2026 backfilled with real GA4/GSC. Introduced a scoped [reporting log](/reporting/log.md).
* **Note**: `reporting/` (the dashboard app) is distinct from [website/](/website/index.md) (the live Shopify site) and from this root log (the bundle itself).

## 2026-06-26 (website — June redesign change folder)

* **Creation**: Added the [website/](/website/index.md) folder recording changes to monteirofabrics.com as evidence of work done — the [June 2026 redesign](/website/june-2026-redesign.md) initiative, the [sector & collection SEO pages](/website/sector-pages-seo.md) (18 `/collections/` rebuilt + `spec-table`/`faq-schema` sections + JSON-LD + SEO metadata + redirects) and the [signature collection landing pages](/website/signature-collection-pages.md) (8 editorial `/pages/`). Introduced the `Change` type and a scoped [website log](/website/log.md). All staged on the unpublished CLAUDE_MF_JUNE_PROPOSTA theme; live site untouched.

## 2026-06-26 (datasheet refresh — Jazz, new June 2026 catalogue)

* **Update**: Refreshed [Jazz](/products/collections/jazz.md) from the new **DC 075.01** catalogue (was DC 008 ED.16). Technical changes: abrasion now **400.000** (the "≥" is dropped on the new sheet); the stain row is now **alcohol & bleach** resistance (bleach added); antibacterial/antifungal noted as **Sanitized**; credentials expanded to add **abrasion-resistant, long-lasting and flame-retardant** (now shown as performance icons). Weight, thickness, composition, width, rolls and the 13 applications are unchanged.
* **Fix**: fire list corrected — the French standard was **NF P 92-503 → NF P 92-507 (M2)** on the new sheet; full list now FMVSS302 · EN 1021-1+2 · EN 597-1+2 · NFPA 260 (clause 6.1) · Cal. TB 117 (Section 1) · IMO 2010 FTP Code Part 8 · NF P 92-507 (M2) · UNI 9175 (1.IM) · R118 (Annex 6, 7 & 8) · FAR 25.853.
* **Fix**: colours corrected from a contaminated list of "30 shades" to the **16 Jazz colourways** (Ocean, Denim, Cactus, Sea, Shadow, Wine, Cream, Sepia, Taupe, Cyan, Pine, Terracotta, Mouse, Brick, Truffle, Wheat). The old list had wrongly folded in Chance-coordinated names (Eden, Dragonfly, Bahamas, Dolphin, Santorini, Spruce, Jam, Cityscape, Havana, Cordovan, Gingerbread) and discontinued shades (Passive, Hay, Tumeric). The new catalogue shows Jazz (woven) coordinated with plain-engraved **Chance** samples.
* **Note**: Shopify's Jazz product currently lists **15** colour variants — it is missing **Cyan**, which the new catalogue shows. Worth adding the Cyan variant (and aligning the "Terracota" → "Terracotta" spelling) in Shopify.
* **Lint**: 0 broken links across 130 files.


## 2026-06-26 (company — Mission, Vision & Values)

* **Update**: Completed the [Mission, Vision & Values](/company/mission-values.md) page (was a Phase-3 stub), sourced from the **About Us** page on the **CLAUDE_MF_JUNE_PROPOSTA** theme and confirmed against the live [/pages/mission-vision](https://www.monteirofabrics.com/pages/mission-vision) page. Added the purpose statement, the four DNA traits (Design · Innovation · Sustainability · Service), the **Mission**, the **Vision** and the **five values** (Focus on the customer; Caring for our people; We are a team; Making things happen; Safety above all & respect for the environment). Set status approved / public / confidence high; de-listed it as a stub in the root and company indexes.
* **Note**: the dedicated mission-vision page also carries an "Our Goal" section (ambition + employer-brand statement) that is not on the new About Us page — left out to match the named source; can be added on request.
* **Lint**: 0 broken links across 130 files.


## 2026-06-26 (non-featured datasheets — Batch 6 Outdoor & Marine)

* **Update**: Enriched/corrected three Outdoor & Marine collections strictly from their datasheets — [Patio](/products/collections/patio.md) (ED.07 V1, Outdoor), [Siesta](/products/collections/siesta.md) (DC 043.01, Marine) and [Marina](/products/collections/marina.md) (DC 039.01, Marine). Added datasheet IDs, fastness rows, credentials, named colour lists (Patio 13, Siesta 11, Marina 17) and the full application-icon sets.
* **Finding**: **Patio** (outdoor) and **Siesta** (marine) share the same base — 700 g/m², PVC 81% · PES 19%, 1,20–1,40 mm — but are positioned differently: Patio is the fuller-fastness grade (≥400.000, ±30 m rolls, hydrostatic ISO 811, ketchup/mustard, full perspiration/saliva, artificial weathering, −30 ºC cold-crack, 13 colours incl. Ocean & Vay); Siesta is the woven-look marine grade (400.000, ±35 m rolls, condensed fastness, 11 colours). **Marina** is a distinct, lighter textile (DC 039.01: 690 g/m², PVC 80% · PES 20%, 1,00–1,20 mm) with perspiration/saliva/blood/urine fastness and an M2 fire rating.
* **Fix**: corrected composition on **Patio** and **Siesta** from PVC 81% · **CO** 19% to PVC 81% · **PES** 19% (the datasheets specify polyester, not cotton); fixed Patio roll length ±35 → **±30 m**; dropped the "≥" on **Siesta** and **Marina** abrasion (their sheets read **400.000** flat, only Patio shows ≥400.000).
* **Fix**: applications expanded to the datasheet icons — **Patio** 2 → **6** (Marine, Outdoor, Restaurants, Residential, Recreational Vehicles, Office), **Siesta** 1 → **7** (adds Office, Restaurants, Retail), **Marina** 7 → **8** (added the missing **Restaurants**). Fire lists completed/normalized (Cal. TB 117 Section 1; NFPA 260 clause 6.1; Marina keeps **NF P 92-507 (M2)**). Omitted from Marina what its sheet does not show — no cold-crack row and no 10-year warranty.
* **Note**: Siesta's datasheet is catalogued under **Marine** (DC 043.01) while its bundle frontmatter `range` is still **Outdoor** — left the taxonomy/range link unchanged pending Antonio's call.
* **Lint**: 0 broken links across 130 files.


## 2026-06-26 (non-featured datasheets — Batch 5 PU & Mobility)

* **Update**: Enriched/rebuilt the three PU & Mobility collections strictly from their datasheets — [Flora](/products/collections/flora.md) (ED.01 V2, PU), [Pure Move](/products/collections/pure-move.md) (ED.01 V1) and [Pure Convertible](/products/collections/pure-convertible.md) (ED.01 V2). Added datasheet IDs, fastness rows, credentials and colour lists; replaced the placeholder "confirm exact values" notes with the datasheets' actual multi-profile spec tables.
* **Finding**: **Pure Move** and **Pure Convertible** are multi-article ranges, not single specs. Rebuilt each as an article-group table — Pure Move into **four** profiles (Alvaro family 660 g/m², PVC 87% · PES 8% · CO 5% @ 400.000; Arata/Nascar/Philip PES 640 @ 400.000; Frank PES 680 @ 150.000; bi-elastic **BLT** group 600 g/m², PVC 88% · PES 12% @ 150.000); Pure Convertible into **three** (Jean 580; Lona/Trek 380; Cover/Hilux/Sport/Strada/Toscana 820 — all 150.000). Captured the shared mobility fastness suite (cold-crack, alcohol & bleach, sea-/chlorinated-water, weathering & light) and the OEM-/article-segmented colour palettes.
* **Fix**: **Flora** — added the PU-specific **alcohol-resistance** and **10-year tropical hydrolysis** (ISO 1419) rows, the 19 stock-coded colours and PU credentials (toy-safe, inherently flame retardant); trimmed fire to the datasheet's four (FMVSS302 · EN 1021-1+2 · BS 5852 Crib 5 · IMO 2010 FTP Code Part 8 — removed unverified NFPA 260 & Cal. TB 117).
* **Fix**: **Pure Move** fire rebuilt to the datasheet (added Cal. TB 117 Section 1; ÖNORM A 3800-1/B 3825 for the Alvaro group; BLT group Reg. 118 Annexes 6 & 7 only; FTC→FTP, "Class 1"→clause 6.1). Applications remapped to the datasheet's **11** icons (Marine, Motorcycle, Mass Transportation, Outdoor, Office, Recreational Vehicles, Aviation, Restaurants, Residential, Automotive, Retail) — was 5.
* **Fix**: **Pure Convertible** — gave each profile its true weight/thickness/composition (was one 380–820 g/m² range row); omitted the unstated antibacterial claim. **Flora** apps aligned to its 8 datasheet icons (Hospitality, Healthcare, Office, Public Spaces, Fitness, Restaurants, Retail, Residential) plus the curated Medical sector.
* **Lint**: 0 broken links across 130 files.


## 2026-06-26 (non-featured datasheets — Batch 4 Pure Contract B)

* **Update**: Enriched/corrected three Pure Contract collections strictly from their datasheets — [Portus](/products/collections/portus.md) (DC 053.01), [Prosoft](/products/collections/prosoft.md) (DC 047.01) and [Ocean](/products/collections/ocean.md) (summary sheet, no DC). Added datasheet IDs, fastness rows, credentials and named colour lists (Portus 34, Prosoft 24; Ocean has no swatches on its sheet).
* **Finding**: **Portus is the same heavy contract leather** as Elefante/Furna/Garbe — identical spec (760 g/m², PVC 83% · CO 17%, 400.000 Martindale, alcohol+bleach + perspiration/saliva/blood/urine colour-fastness, identical 11-standard fire list, ±35 m, same 8 applications) differing only in its 34-colour range. **Prosoft** is the distinct soft/weldable grade (900 g/m², PVC 67% · CO 33%, higher fire M1/B1/Crib 7, ±25 m). **Ocean** is the outdoor/marine grade (690 g/m², PVC 80% · **PES** 20% polyester, sea-/chlorinated-water & sun-cream fastness).
* **Fix**: Corrected stale specs — **Portus** weight 830→**760** g/m², thickness 1,20–1,40→**1,10–1,30**, abrasion ≥400.000→**400.000**, rolls ±30→**±35**, fire rebuilt to the full 11-standard list (added NFPA 260 clause 6.1, Cal. TB 117 Section 1, NF D 60-013 (AM18); fixed NFP→NF P, FTC→FTP). **Prosoft** abrasion ≥400.000→**400.000**, colours 25→**24**, fire trimmed to the datasheet's 5 (FMVSS302 · NF P 92-507 M1 · BS 5852 Crib 7 · NF D 60-013 AM18 · DIN 4102 B1 — removed unverified EN 1021, SN 198898, ÖNORM rows), added weldable. **Ocean** composition **PA→PES** (polyester), abrasion ≥400.000→**400.000**, fire reformatted (FTC→FTP Code, "Class 1"→clause 6.1), removed the unstated ±35 roll length.
* **Fix**: **Ocean** — replaced the incorrect "Antiviral (Sanitized®)" claim with the datasheet's actual **Sanitized® antibacterial/antifungal** (JIS Z 2801, ISO 846 A) and added its full colour-/light-fastness suite.
* **Fix**: Remapped Suitable applications to each datasheet's icons — **Portus** dropped Fitness, gained Residential + Recreational Vehicles → 8 (matches the Elefante family); **Prosoft** added Residential + Recreational Vehicles → 7 (no Healthcare on its sheet); **Ocean** swapped Restaurants → **Office** → 7 (Outdoor, Marine, Recreational Vehicles, Healthcare, Office, Residential, Retail).
* **Lint**: 0 broken links across 130 files.


## 2026-06-26 (non-featured datasheets — Batch 3 Pure Contract A)

* **Update**: Enriched four Pure Contract collections strictly from their datasheets — [Elefante](/products/collections/elefante.md) (DC 049.01), [Furna](/products/collections/furna.md) (DC 055.01), [Garbe](/products/collections/garbe.md) (DC 057.01) and [Mara](/products/collections/mara.md) (DC 069). Added datasheet IDs, alcohol & bleach fastness rows, vegan/Animal Free/REACH/**phthalate-free**/warranty credentials, and named colour lists (Elefante 14, Furna 34, Garbe 34, Mara 48).
* **Finding**: Elefante, Furna and Garbe are the **same heavy contract leather** — identical spec (760 g/m², PVC 83% · CO 17%, 400.000 Martindale, alcohol+bleach + perspiration/saliva/blood/urine colour-fastness, identical 11-standard fire list, ±35 m, 8 identical applications) differing **only** in colour range. Added the perspiration/saliva/blood/urine colour-fastness row to all three.
* **Fix**: Corrected stale specs — **Furna & Garbe** weight 830→**760** g/m², thickness 1,20–1,40→**1,10–1,30**, rolls ±30→**±35**; **Elefante** thickness 1,20–1,30→**1,10–1,30**, abrasion ≥400.000→**400.000**, fire "NFPA 260 (Class I)"→**(clause 6.1)** plus added NF D 60-013 (AM18); **Mara** composition 79/21→**76/24**, weight 950→**920**, thickness 1,35–1,55→**1,40–1,60**, rolls ±30→**±25**, fire added NFPA 260 (clause 6.1) + Cal. TB 117 (Section 1) and "Crib"→**Crib 5**.
* **Fix**: Remapped Suitable applications to each datasheet's 8 icons — dropped **Fitness** (not on any of the four datasheets); Furna & Garbe gained Residential + Recreational Vehicles; Mara gained Residential + Recreational Vehicles. Note: "Luggage" is a **colour** on Furna/Garbe, not an application.
* **Lint**: 0 broken links across 130 files.


## 2026-06-26 (non-featured datasheets — Batch 2 Essentials B)

* **Update**: Enriched all four Essentials collections from their datasheets — [Lima](/products/collections/lima.md) (ED.01 V1), [Manta](/products/collections/manta.md) (ED.01 V1), [Villa Nabuck](/products/collections/villa-nabuck.md) (DC 059.01) and [Paiva](/products/collections/paiva.md) (DC 065.01). Added datasheet IDs, alcohol-resistance rows, vegan/Animal Free/REACH/warranty credentials, and named colour lists (Lima 30 + Manta 42 with stock codes; Villa Nabuck 9 + Paiva 42 names only).
* **Fix**: Corrected colour counts (Lima 31→**30**, Manta 43→**42**, Villa Nabuck 10→**9**, Paiva 43→**42**). **Villa Nabuck** and **Paiva** upgraded to their true premium spec — abrasion 150.000→**400.000** Martindale, full 10-standard fire list incl. FAR 25.853, rolls ±30→**±35**. Standardised fire codes (Manta "Reg. 118"→**R118 Annex 6,7&8**).
* **Fix**: Remapped Suitable applications to each datasheet's icons — dropped the catch-all Fashion where not shown; **Lima** to Marine/Motorcycle/Outdoor (3 icons); **Manta** to 11 (added Residential/Recreational Vehicles/Mass Transportation/Automotive, no Marine/Aviation); **Villa Nabuck** to 13; **Paiva** to 13 (its datasheet adds **Handbags + Luggage** icons → kept Fashion with a note; no Fitness).
* **Note**: Paiva datasheet was 24 MB (over the 20 MB read limit) — read via text-layer extraction plus a rendered technical page for the application icons.
* **Lint**: 0 broken links across 130 files.


## 2026-06-26 (non-featured datasheets — Batch 1 Essentials A)

* **Update**: Enriched four Essentials collections from their datasheets — [Beta](/products/collections/beta.md) (DC 061.01), [Glam](/products/collections/glam.md) (DC 067.01), [Jazz](/products/collections/jazz.md) (DC 008 ED.16) and [Laguna](/products/collections/laguna.md) (ED.01 V1). Corrected abrasion (Beta/Glam to **400.000** Martindale), datasheet-accurate fire lists, roll lengths (Beta/Glam ±35), exact colour counts and named shades (Beta/Glam 42, Jazz 30, Laguna 41 with stock codes), alcohol-resistance row, and vegan/Animal Free/REACH/warranty credentials.
* **Fix**: Remapped Suitable applications to each datasheet's application icons — dropped Fashion (not on datasheets), added Residential/Mass Transportation/Recreational Vehicles/Automotive/Aviation where shown; Laguna correctly carries **no** Marine or Aviation. Fixed Jazz fire code NFP92-507→**NFP92-503**; removed unverified BS 5852 from Beta.
* **Lint**: 0 broken links across 130 files.


## 2026-06-25 (company story + datasheet pass)

* **Update**: Enriched the last two featured collections from their datasheets — [Peel](/products/collections/peel.md) (corrected to 60% plant-based / 65% bio-based carbon per ASTM D6866-22; added alcohol/bleach fastness, BS 5852 Crib 5, vegan/REACH/phthalate-free; datasheet-aligned applications) and [Amazónia](/products/collections/amazonia.md) (exact 150.000 Martindale, datasheet-accurate fire list, 10-yr warranty, colour-fastness suite, removed unverified antiviral/biocompatible claims). All 7 featured collections now at full depth.
* **Creation/Update**: Built the company story from the new CLAUDE_MF_JUNE About Us page — rewrote [history](/company/history.md) (1917 tannery → 1950s leader → 1960s vinyl coated → 1970s PU → 4th generation) and [manufacturing](/company/manufacturing.md) (own Portugal facilities, European-only supply, colour matching, tailormade, worry-free); enriched [about](/company/about.md) (identity statement, "why choose Monteiro", global presence incl. Germany office) and [certifications](/operations/certifications.md) (ISO :2015 via TÜV Rheinland, Animal Free LAV VVV+, REACH, warranty scope).
* **Fix**: Corrected the published address postal code to **4202-351 Porto** across [contact](/company/contact.md) and [legal-entity](/company/legal-entity.md) (was 4250-140); added the Germany office and social channels; flagged the registered fiscal seat for confirmation.


## 2026-06-25 (Ivana sector taxonomy)

* **Update**: Aligned sectors to the new "Our Sectors" menu (MF_JUNE). Added **Medical** (high-performance healthcare — ORs and sensitive areas; Mediflex, Electra, Flora) and **Train** as a pending stub (to confirm with Ivana; no collection or tagged products yet). Marked **Restaurants** and **Retail** as catalogue-only (kept for SEO, not in the new menu) via `our_sectors_menu` flag on every sector.
* **Update**: Refreshed market index, about, root index and the terminology snapshot (44->22 cleanup).


## 2026-06-25 (terminology)

* **Creation**: Added [Terminology: Product vs Collection vs Sector](/references/terminology.md) disambiguating the overloaded word "Collection" across Shopify CMS, the website, and this bundle, grounded in the live collection structure. Linked it from the root, products and market indexes.


## 2026-06-25 (sectors)

* **Update**: Adopted Monteiro's new **16-sector** taxonomy (Healthcare, Hospitality, Office, Public Spaces, Restaurants, Retail, Residential, Fitness, Fashion, Outdoor, Marine Interior Fabrics, Automotive, Motorcycle, Aviation, Mass Transportation, Recreational Vehicles), informed by the CLAUDE_MF_JUNE_PROPOSTA WIP theme.
* **Update**: Remapped every collection's Suitable applications from its Shopify sector tags. Reused existing segment files; `transport.md` repurposed as the Mobility & Transportation parent group.
* **Update**: Added verified company facts to [about](/company/about.md) and [certifications](/operations/certifications.md) — ISO 9001 / ISO 14001, 10-year warranty, made in Portugal.


## 2026-06-25 (fire certifications)

* **Update**: Expanded [fire certifications](/products/attributes/fire-certifications.md) from 6 to the full 18-standard list from the website Flammability filter, each with region/use and what it certifies. Confirmed all are flammability / reaction-to-fire standards.

## 2026-06-25 (catalogue completion)

* **Update**: Expanded products from 12 to the full live catalogue — 28 collections across 9 ranges (added Essentials Jazz; Pure Contract Garbe, Portus, Mediflex, Ocean, Elefante, Straw; PU Flora & Origin; Pure Move; Pure Convertible; Outdoor Patio & Siesta; Marine Marina; Specialty Electra & Amazónia). Chance (7 store pages) and Pure Move (3) consolidated to one concept each.
* **Creation**: Added market segments Outdoor and Transport & Mobility.


## 2026-06-25

* **Creation**: Scaffolded the internal Monteiro Fabrics OKF bundle (full folder tree, indexes, templates).
* **Creation**: Populated factual core from the live Shopify catalogue — 12 collections, 3 ranges, technical attributes, services, company facts and certifications.
* **Note**: Brand, market, competitor, customer, content and strategy concepts created as conformant stubs awaiting input/research (Phases 3-5).
