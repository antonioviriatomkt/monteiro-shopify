# Migration Readiness Audit — publishing CLAUDE_MF_JUNE_PROPOSTA

> **⏸ PAUSED — launch on hold (2026-07-15).** Ivana has held the entire launch until all marketing
> material is ready (no target date). This audit's launch-runbook stands and is still the plan for
> when we resume — **but its scope changed**: at launch, **Performance Fabrics and Chance 2.0 are
> de-scoped** (both hidden on the homepage; the Technical Hub content stays live). The gating items
> are now **content** — Chance 2.0 colour samples + catalogue/copy, and Performance Fabrics page
> content — **not** the IA/redirect decisions below. When those land and Chance 2.0 + PF are ready,
> re-run this runbook (starting with §1.2 the final drift check). See `mf-knowledge/website/log.md`
> (2026-07-15) and `mf-knowledge/website/chance-2-0.md`.
>
> **Where we left off (open decisions, §8):** D-a Sectors hub URL, D-b CHANCE product-URL strategy,
> D-c Official Resellers on homepage, D-d empty `chance-2-0` collection, D-e PFAS claim — all still
> open, but none are the launch gate anymore.

**Date:** 2026-07-13 · **Author:** pre-launch audit · **For:** Viriato + Ivana sign-off
**The migration =** swapping the unpublished sandbox theme **CLAUDE_MF_JUNE_PROPOSTA** (id `195386114425`) to be the live MAIN theme, replacing **Showcase 7.0** (id `162670182703`).
**Priority lens:** protect Google rankings, traffic acquisition and AI-answer visibility through the swap.

> **The one thing to internalise:** publishing a theme does **not** change any URL. Every page/collection/product/article keeps its handle, so the vast majority of ranking equity is safe by default. **Risk is concentrated only where the redesign changes the information architecture** — the Sectors hub, the CHANCE 2.0 consolidation, and the About-Us merge. Those three are where equity can leak, and they are the core of this audit.

---

## 0. Launch-readiness verdict (RAG)

| Workstream | Status | Blocking? |
|---|---|---|
| Theme is built & previewable | 🟢 Green | — |
| Analytics/tracking continuity | 🟡 Amber | Verify parity vs live theme (see §1.4) |
| Navigation swap mechanics | 🟡 Amber | `mf_june_menu` must exist & be clean in store Navigation |
| Redirects — cleanup batch (done) | 🟢 Green | 7 already live & verified |
| Redirects — AT-LAUNCH batch | 🔴 Red | Not created yet; **CHANCE plan is mis-specified** (§2.2) |
| Internal links → retiring URLs | 🔴 Red | Must repoint before 301s fire (§2.3) |
| Sectors hub target URL/template | 🔴 Red | Decision + template assignment needed (§2.1) |
| On-page launch blockers | 🔴 Red | Dead hero CTA + visible `[TO CONFIRM]` (§3) |
| Structured data / AI visibility | 🟡 Amber | Strong base; Organization/WebSite schema missing (§4) |
| Multilingual (/pt /fr /de /es) | 🟡 Amber | Big traffic; verify locale render + hreflang (§1.5) |
| White-paper edits (6) | 🟡 Amber | Prepared, awaiting manual apply |
| Junk/test template cleanup | ⚪ Low | Cosmetic; not an SEO blocker (§5) |

**Bottom line: not launch-ready yet.** The blockers are small in effort but real: fix 2 on-page items, repoint ~a dozen internal links, resolve the Sectors-hub URL, and **re-scope the CHANCE 2.0 redirect plan around product/page URLs (not collections)**. None are large; all must be done *before or at* publish.

---

## 1. How the migration actually happens (mechanics)

### 1.1 Publishing
- Publish = set the sandbox theme's role to **MAIN**. The custom-app token **cannot** do this (lost `write_themes`). Use the **Shopify CLI** (logged in with theme access) or the Admin **Themes → Publish** button.
- URLs are unchanged by the swap. The only visible change is design + IA.

### 1.2 Final drift check (do immediately before publish)
- Ivana edits in the theme editor, so the live sandbox may be ahead of local. CLI pushes don't refresh `.deploy-state` snapshots. **Pull the sandbox and diff** right before publishing so nothing built here is silently overwritten and nothing in the editor is lost.

### 1.3 Navigation
- The header is hard-bound to the linklist handle **`mf_june_menu`** (`config/settings_data.json:132`), **not** `main-menu`. Menus live at the store level, so publishing auto-renders whatever menu carries that handle. **`main-menu` does not need rebuilding.**
- ⚠️ **Verify a Navigation menu with the exact handle `mf_june_menu` exists and is fully populated** — if it's missing/empty, the live header renders blank. Also audit its links: none may point at a retiring URL (§2.3).

### 1.4 Analytics / tracking continuity (verify — don't assume)
- Sandbox `layout/theme.liquid` carries **GTM `GTM-KWHH9H5K`**, **Google Ads `AW-17928296446`**, and Shopify's `{{ content_for_header }}` hook. **Microsoft Clarity** is present as a theme app-embed in `settings_data.json`. `robots.txt.liquid` is the Shopify default (no harmful `Disallow`).
- ✅ **Verified 2026-07-14 (CLI theme pull of the live Showcase 7.0):** the sandbox `<head>` tracking **matches the live theme exactly** — GTM `GTM-KWHH9H5K`, Google Ads `AW-17928296446`, and the same app embeds (forms · microsoft-clarity · seolab-seo-optimizer). No tag is dropped. **Still validate realtime after publish** (GTM preview, GA4 realtime, Ads tag assistant, Clarity live).

### 1.5 Multilingual / Markets (materially large traffic)
- `/pt` (227 clicks), `/fr/collections/chance-1` (87 clicks, pos 4.2), `/de` (75), `/es` (66) are **top earners**. The theme has `*.context.pt/international.json` variants.
- ⚠️ **Verify every redesign template renders in all locales** (preview `/pt`, `/fr`, `/de`, `/es`) and that **hreflang + locale routing survive** the swap. This is currently absent from the launch plan.

---

## 2. SEO — the critical path

### 2.1 The Sectors hub (DECISION + template fix required)
Reality found:
- A page **`/pages/sectors`** exists and is **published**, but on the **default template** (thin) — no `page.sectors.json` in the theme.
- The **built** hub template is **`page.our-sectors.json`** (title "Our Sectors", 4 tiles: healthcare, contract, hospitality-fabrics, automotive).
- The **rich** legacy "Our Sectors" tiles (incl. the Medical & Train tiles added on 2026-07-02) live on **`page.all-collectby-industry.json`** = the current **`/pages/fabrics-by-industry`** — the very page being retired.

**Action:** decide the canonical hub URL, then make its template match:
- Recommended: keep the clean URL **`/pages/sectors`**, reassign its `templateSuffix` to a proper sector-hub template, and ensure that template lists **all live sectors** (the minimal `our-sectors` has only 4 — port the full tile set from `all-collectby-industry`). Then 301 the two legacy pages into it.
- GSC confirms `/pages/fabrics-by-industry` and `/pages/by-application` are indexed but **carry negligible ranking equity** (not in top-100 by clicks or impressions) — so the redirect is for hygiene, low-risk.

### 2.2 CHANCE 2.0 — the redirect plan is mis-specified (highest-risk item)
The AT-LAUNCH checklist redirects `/collections/ocean|mediflex|prosoft|portus` into their CHANCE grades. **Those collections do not exist** — they live as products/pages. ⚠️ **Correction (2026-07-13): Peel is NOT part of CHANCE 2.0.** `chance-bioblend` is a separate **new** collection, *not* a Peel rebrand, so `/pages/peel-collection` and the Peel product **stay live and must NOT be redirected**. The four rebranded lines exist as:
- **Products:** `/products/mediflex-collection`, `/products/ocean-collection`, `/products/prosoft-collection`, `/products/portus-collection`.
- **Pages:** `/pages/mediflex`. *(`/pages/peel-collection` also exists but stays — Peel is not migrating.)*

Equity at stake: **`/products/mediflex-collection` is a top-tier page** — ~39 clicks and **3,700+ impressions across locales** (`/products/mediflex-collection` 2,147 + `/de/…` 986 + others), position ~7. `/pages/electra-medical-upholstery` has 1,008 impressions.

**Decision needed (Ivana/Viriato):** does CHANCE 2.0…
- **(a) keep the existing products** and merely re-slot them under the new grade collections (`chance-mediflex` etc.)? → **product URLs persist, do NOT redirect them** (redirecting would throw away the Mediflex ranking). Only the editorial **page** `/pages/mediflex` gets 301'd to its grade collection (Peel excluded — stays live).
- **(b) replace them with new grade products**? → then 301 the old product URLs to the grade slug **carefully**, one at a time, and expect a transition dip; re-map internal links first.

Either way: the grade collections (`chance-*`) each hold **1 product** today — confirm that's intended before launch. Rewrite the CHANCE section of the launch plan around **product + page URLs**, not collections.

### 2.3 Internal links to repoint BEFORE any 301 fires (launch blockers)
Shopify 301s only fire once the source 404s, and you never want live internal links feeding a redirect chain. Repoint these:

| Target (retiring) | Where it's linked (repoint to) |
|---|---|
| `/pages/by-application` | **`collection.json:109`** (default collection template — affects *every* collection w/o its own template) → Sectors hub; also `collection.colecoes-taxonomia.json:112`, `page.all-collections-catalogue.json:183`, `collection.test.json:69` |
| `/pages/fabrics-by-industry` | `page.all-collections-catalogue.json:171`; **`collection.colecoes-pradao.json:44`** ("Explore all sectors" link) → Sectors hub |
| ~~`/pages/peel-collection`~~ | **REMOVED (2026-07-13) — Peel stays live (not part of CHANCE 2.0); its internal links need no repoint.** | — |
| `/pages/quality` | `page.taxonomia.json:103`, `page.faq.json:331` ("Certifications") → `/pages/about-us` |
| `/pages/mediflex` | `list-collections.json:146`, `page.electra.json:360`, `page.collections-chance-peel.json:193`, `article.blog-post-customize.json:214` → grade collection or product (per §2.2 decision) |

(Peel stays live, so its internal links — including those in the legacy blog/campaign article templates — need no repointing.)

### 2.4 About-Us consolidation
`/pages/quality`, `/pages/r-d`, `/pages/mission-vision` are **all still published** and each chases the "coated fabrics manufacturer Europe" head term (cannibalization). Plan: move their content into `/pages/about-us` as sections, then **301 each → `/pages/about-us`** and unpublish. Deferred content task — do at launch.

### 2.5 Redirects to CREATE at launch (corrected list)
- Sector hub: `/pages/fabrics-by-industry` + `/pages/by-application` → the chosen Sectors hub (after §2.1). *Low equity, safe.*
- CHANCE 2.0: **per §2.2 decision** — at minimum `/pages/mediflex` → its grade collection. (Peel excluded — stays live.)
- About-Us: `/pages/quality`, `/pages/r-d`, `/pages/mission-vision` → `/pages/about-us`.
- CHANCE hub/Classic **retitles** (held): `/pages/chance-collection` → "CHANCE 2.0 | The Performance Fabric Family | Monteiro"; `/collections/chance` → "CHANCE Classic | 236-Colour Coated Fabric | Monteiro" (Classic already renders on `chance-classic` suffix — the old handle/translation conflict is resolved).

**Already live & verified (no action):** restaurants-fabrics→hospitality, train→mass-transportation, healthcare-copia→medical, /pages/medical→/collections/medical (note: actual target is `/collections/medical`, which is *better* than the plan's `/collections/healthcare` since Medical now has its own page), high-performance-medical→medical, contact-us_→contact.

### 2.6 chance-2-0 empty collection
`/collections/chance-2-0` is **published but empty** (0 products, no custom template) → renders thin at launch. **Unpublish or noindex it** (the real hub is `/pages/chance-collection`).

### 2.7 Canonicals & sitemap (Phase 3–4)
- Canonicals: editorial `/pages/` (branded lines) → their product/collection; de-dup the sustainability articles duplicated across `/blogs/news` and `/blogs/sustainability`.
- **Resubmit `/sitemap.xml` in GSC** after launch (only Shopify's sitemap is registered; last downloaded 2026-07-08, 0 errors). Request indexing on the changed hub/About-Us URLs.

### 2.8 Equity-protection watchlist (must not break)
Top pages by clicks/impressions — most persist unchanged through the swap; the starred ones intersect IA changes and need eyes:
`/`, `/pt`, `/fr/collections/chance-1`, `/de`, `/es`, `/collections/healthcare` (5.9k impr), **`/products/mediflex-collection`** ★, `/pages/chance-collection` ★, `/collections/coated-fabrics`, `/pages/about-us` ★, `/pages/electra-medical-upholstery`, `/collections/marine-interior` (already 301'd, still ranking — keep redirect), `/pages/mcdonalds-fabrics` (19 clicks — a real page, **do not delete**).

---

## 3. On-page launch blockers (fix before publish)

1. **Dead hero CTA (homepage).** `templates/index.json:28` — primary hero button "Speak to our specialists" has `button_link: ""`. The most prominent CTA on the site goes nowhere. → set to `/pages/contact`.
2. **Visible `[TO CONFIRM]` in customer copy.** `templates/page.performance-fabrics.json:336` — `"OEKO-TEX Standard 100 — tested for harmful substances [TO CONFIRM]"`. OEKO-TEX stays (per Ivana) but the literal marker must be stripped. Also confirm the **PFAS** spec/FAQ copy is either substantiated or removed (only this one literal marker remains in the theme — verify PFAS wasn't left in another phrasing).
3. **Default collection template links to a retiring page** (`collection.json:109` → `/pages/by-application`) — repoint (see §2.3).
4. **Homepage accordion links** to `/pages/press` and `/pages/tailormade` — actual templates are `page.press-kit` / `page.tailor-made`; verify the handles resolve (else 404/redirect).
5. **Disabled homepage sections** — testimonials + **Official Resellers** (×2) are `disabled:true` and won't render. Confirm that's intended (there's an Official Resellers brief on file).
6. **White paper (6 edits) + Crib5/B1 consistency** — the round-2 corrections are prepared as find/replace (token can't write content); apply before launch, and check the standalone Crib 5 vs Crib 7 and B1 articles for the same BS 7176 / EN 1021 framing.
7. **Medical spec-table values** (Appendix A dependency) — same technical-team dependency as the PF checklist.

---

## 4. AI visibility / structured data

**Strong base already shipping:**
- `faq-schema.liquid` emits **FAQPage + CollectionPage + BreadcrumbList** on **28 templates** (nearly every collection + performance-fabrics + chance hub) — the best AI-extraction surface.
- Product schema (`Product`+`Offer`+`Brand`), Article + Blog/BlogPosting schema, article breadcrumbs.
- Technical Hub **pillar + 5 spokes are live and interlinked** — a crawlable, citable specification cluster (the SSR + progressive-enhancement gating keeps it crawlable).
- `/llms.txt` is served (redirect → `/apps/seo-lab/llms.txt`) — verify it lists the key sector/collection/hub pages.

**High-value gaps to close (low effort, strong AI/entity payoff):**
1. ~~No `Organization` / `WebSite` JSON-LD~~ ✅ **RESOLVED / not needed (verified 2026-07-14):** the **SEO-Lab app already emits** a full set site-wide — Organization (name/url/logo/sameAs/contactPoint/address) + WebSite + SearchAction (confirmed on the live homepage; carries to the redesign via the app embed). Do **not** add theme-level Organization/WebSite JSON-LD — it would duplicate. (Minor optional: SEO-Lab's `sameAs` only lists LinkedIn + Instagram — Facebook/YouTube/Pinterest could be added in the app config.)
2. **No top-level `BreadcrumbList` JSON-LD** on collection/product pages (breadcrumbs there are microdata-only) — add JSON-LD for consistency with the article pages.
3. **Orphaned `schema-techtextil.liquid`** (`Event` schema) is not referenced by any template — wire it to a page or drop it.

---

## 5. Housekeeping (low priority — not SEO blockers)

- **Test/junk templates present** (ship harmlessly unless a live resource uses their suffix): `collection.test.json` (also links to `by-application`), `page.chance-coll-test-2-produt.json`, `product.product-chance-4/5-final.json`, `product.produto-final1*.json`, `article.typeform.json`, `collection.fitness-1.json`, various `taxonomia`/`colecoes` experiments, and legacy article templates. A cleanup pass is worthwhile but not launch-gating.
- **Keep `page.mcdonalds.json`** — `/pages/mcdonalds-fabrics` earns 19 clicks / 631 impr (real traffic), despite the "test-y" name. (Client-name exposure is a separate brand call, not a migration issue.)
- Filename typo `page.nini-andadre-amazonia.json` (cosmetic).

---

## 6. Launch-day runbook (ordered)

**T-1 — pre-flight (do NOT publish until these are done):**
1. Final sandbox pull + diff (drift check).
2. Verify `mf_june_menu` exists, is populated, and has no links to retiring URLs.
3. Fix on-page blockers §3: hero CTA, strip `[TO CONFIRM]`, PFAS copy, verify press/tailormade links.
4. Repoint all internal links in §2.3.
5. Resolve Sectors hub URL + assign the correct template with the full tile set (§2.1).
6. Resolve the CHANCE 2.0 product-URL decision (§2.2) and re-scope its redirects.
7. Move Quality/R&D/Mission content into About-Us (§2.4).
8. Apply the 6 white-paper edits + Crib5/B1 check.
9. (Recommended) add Organization/WebSite JSON-LD (§4).
10. Diff analytics `<head>` vs live theme (§1.4).

**T-0 — publish:**
11. Publish sandbox → MAIN (CLI or admin).

**T+0 — immediately after publish:**
12. Create the AT-LAUNCH 301s (§2.5), corrected.
13. Unpublish the source pages/collections so 301s fire — pages via `pageUpdate isPublished:false`; **collections manually in admin** (MCP blocks `publishableUnpublish`): quality/r-d/mission-vision pages, chance-2-0 collection, legacy CHANCE pages.
14. **curl-verify every new 301** returns 301 → correct target.
15. Apply the CHANCE hub/Classic retitles.
16. Resubmit `/sitemap.xml` in GSC; request indexing on changed hub/About-Us URLs.
17. Validate analytics realtime (GTM/GA4/Ads/Clarity).
18. Spot-check `/pt`, `/fr`, `/de`, `/es` render + hreflang.

**T+1 to T+28 — monitor:**
19. GSC: watch Coverage for new 404s/redirect errors; watch query→page to confirm each cluster consolidated (Medical vs Healthcare, pillar vs collection, Sectors hub). Track the Mediflex/CHANCE URLs for transition dips. Keep redirects ≥ 12 months.

---

## 7. Tooling constraints (operational reality)
- **Theme publish:** CLI or Admin (token lost `write_themes`).
- **Create redirects:** `urlRedirectCreate` via Shopify MCP ✓.
- **Unpublish pages:** `pageUpdate isPublished:false` ✓. **Unpublish collections:** MCP blocks `publishableUnpublish` → **manual in Admin**.
- **Article/content edits:** token lost content scope → apply manually or via MCP `graphql_mutation` (verify it has content access).

---

## 8. Open decisions for Ivana / Viriato
- **D-a (Sectors hub):** canonical URL = `/pages/sectors` (reassign template) or `/pages/our-sectors`? And which tile set (full legacy list vs the 4-tile minimal)?
- **D-b (CHANCE 2.0 products):** keep & re-slot existing products (URLs persist, protect Mediflex equity) or replace with new grade products (redirect carefully)?
- **D-c (Official Resellers):** ship the disabled homepage sections or leave off?
- **D-d (chance-2-0):** unpublish/noindex the empty published collection?
- **D-e (PFAS):** substantiate the PFAS-free claim or remove it from the PF page/FAQ?
