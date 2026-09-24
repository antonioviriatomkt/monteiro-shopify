---
type: proposal
client: Monteiro Fabrics
status: draft
created: 2026-09-24
note: "Proposal only — nothing pushed to sandbox or live. Review by António."
---

# `/pages/performance-fabrics` — v2 proposal

**Scope.** This is a new version of the Performance Fabrics page for the sandbox theme `CLAUDE_MF_JUNE_PROPOSTA` (`195386114425`).
**Source of truth.** The vault concept note `Clients/Monteiro-Fabrics/projects/performance-fabrics-concept.md`, rewritten 24/09/2026 from catalogue *PERFORMANCE FABRICS SET2026 v2*. Every claim below comes from that note. Anything that doesn't is listed in (f).
**Draft template:** `briefs/page.performance-fabrics.v2.json`. It has **not been pushed** and is valid JSONC. It uses only settings that the current sections already have, so it can be pushed as it stands. The schema upgrades in (g) are a separate, optional code change.
**Theme state checked:** `bin/mf check sandbox` on 24/09. The only drift is the three known local-ahead templates. `page.performance-fabrics.json` matches the remote exactly, so no pull was needed.

---

## (a) Audit of the current sandbox page

The current page is the June 2026 build: about 1,242 words, 12 sections, one of them disabled.

### 🔴 Two things on the sandbox right now that must not ship

1. **FAQ q4, "Are Monteiro Performance Fabrics PFAS-free?"**, shows the text `[TO CONFIRM which lines carry a PFAS-free declaration…]` on the page. `faq-schema` also puts the same string into the **`FAQPage` JSON-LD**, where machines read it as a published answer.
2. **Spec table row c12, "PFAS Free — Free of intentionally-added PFAS"**, states as fact something the concept note marks `[TO CONFIRM]`.

Both are removed in v2. If the redesign were published today, both would go live.

### Section by section

| # | Current section (type) | Verdict | Why |
|---|---|---|---|
| 1 | `hero` (image-with-text-overlay, H1 "Engineering fabrics for demanding environments") | **Rewrite** | The H1 has no "performance fabrics" keyword. The sub-line ("Certified for fire safety, hygiene and durability…") is a paraphrase, not concept copy. Keep the image. |
| 2 | `story` (rich-text) | **Keep, light edit** | The copy is already the concept's "What it is". The H2 becomes "Specified on certification, not on the swatch", and the first sentence becomes answer-first. |
| 3 | `capacity` (grade-cards: 60 years / 6M m / Made in Portugal / In-house R&D) | **Remove** (content redistributed) | "EU-manufactured / under European regulatory standards" and "certified by our own technical team" are **not in the concept**, and the second is misleading because certification is external. 60 years moves to §2, 6M m to the process, Made in Portugal to Credentials. |
| 4 | `tech` (performance-tech, 6 icons) | **Keep, relabel** | The concept lists the same six feature icons. Two alt labels change: "Anti-microbial" → "Antibacterial and antiviral (antiviral: Mediflex grade)" and "Vegan" → "100% vegan". |
| 5 | `cert_icons` (fabric-spec-icons, `disabled: true`) | **Delete** | It is dead weight, and one of its labels ("Crib 5 / Crib 7 / B1 fire-rated") loosens the tie between each rating and its grade. |
| 6 | `certs` (spec-table, 12 rows) | **Rewrite** | Drop the PFAS row. Re-order to fire → hygiene → cleaning → durability → compliance. Add a footnote tying ratings to grades. |
| 7 | `image_with_text_UFhpiP` (Quality & testing) | **Rewrite** | "State-of-the-art laboratory" and "unwavering commitment" are not in the concept. The v2 copy is the concept's text only. Keep the image. The section key is renamed `quality`. |
| 8 | `sectors` (grade-cards, 7 cards) | **Rewrite** | There are 7 cards against the concept's **8 sectors**. "Healthcare & medical" is merged, **Medical** is missing, and "Stadiums" and "Safety equipment" are named differently. v2 has 8 cards and adds the "what we engineer for" line to each. |
| 9 | `cases` (rich-text, 5 anonymised cases) | **Remove** | **None of it is in the concept note.** "Tailormade Beta", "Essentials", the Norwegian and Danish clients: none of these facts have a source in this pass. If António wants them, they need their own source and a separate decision (see (f)). |
| 10 | `resources` (tech-resources, 6 articles, ItemList) | **Keep** | All six URLs return **200** on live (checked 24/09). The hub was republished on 08/09, so audit item B7 is resolved. Only the intro is trimmed. |
| 11 | `faq` (faq-schema, 6 Q&As) | **Rewrite, 10 Q&As** | q4 is PFAS (removed). Several answers go beyond the concept: q1 ("higher crib number = more severe ignition source"), q2 ("widely specified for public buildings and transport"), q3 ("without cracking or losing colour; avoid abrasive pads") and q5 ("contract / heavy-duty grade"). None of the answers were answer-first. |
| 12 | `cta` (rich-text) | **Keep, light edit** | The button label becomes more specific. |
| — | *missing* | **Add** | The process ("From requirement to production", 5 steps), "Not in the spec? We engineer the solution" (4 steps) and Credentials (ISO 9001/14001 TÜV Rheinland, 10-year warranty, Animal Free VVV+). All three are in the concept and absent from the page. |

---

## (b) Section-by-section spec, with copy (EN)

**Heading map:** exactly one H1 (hero) and 11 H2s. Card, column and article titles are H3 (the sections render them that way). The eyebrow and subheading text is a `<div>`, not a heading.

### 1 · Hero: `image-with-text-overlay` (existing, key `hero`)
- **Purpose:** state what the page is and who it is for, in one screen.
- **Eyebrow:** Monteiro Performance Fabrics
- **H1:** Performance fabrics engineered for demanding environments
- **Text:** Coated and engineered textiles for buyers who specify on certification, durability, compliance and operational risk.
- **Button:** Talk to the technical team → `/pages/contact`
- `heading_h1: true`. Image unchanged (`fabricante_cadeiras_estadio_xxx2.png`).

### 2 · Positioning: `rich-text` (existing, key `story`)
- **Purpose:** the answer-first definition an AI engine can lift whole.
- **Eyebrow:** The technical division of Monteiro Fabrics
- **H2:** Specified on certification, not on the swatch
- **Copy:**
  > **Monteiro Performance Fabrics is the technical division of Monteiro Fabrics.** It makes coated and engineered textiles, backed by 60 years of expertise, for buyers who specify on certification, durability, compliance and operational risk.
  >
  > Every fabric is the product of in-house technical development. It is tested for durability and safety, and built for regulatory compliance, longevity and hygiene, without compromising on sustainability. Where a surface will be disinfected thousands of times, sit under constant load, or has to pass a fire-safety audit, this is the material that holds up.

### 3 · Feature strip: `performance-tech` (existing, key `tech`)
- **Purpose:** a scannable feature summary (the concept's six feature icons).
- **Eyebrow:** Engineered for performance · **H2:** Built into every metre
- **Icons (alt text):** Antibacterial and antiviral (antiviral: Mediflex grade) · Flame retardant · Ink and stain resistant · Abrasion resistant · Long lasting · 100% vegan
- **CTA:** Find the right fabric for your application → `/pages/contact`
- ⚠️ The icons are SVG assets. If `perf-anti-microbial.svg` has "antiviral" printed on it, the image itself states a range-wide claim. See (f).

### 4 · The 8 sectors: `grade-cards` (existing, key `sectors`, 8 blocks = `max_blocks`)
- **Purpose:** route each specifier to their sector, and feed the sector `ItemList`.
- **Eyebrow:** Eight sectors · **H2:** Engineered for the environments that test fabric hardest
- **Intro:** Each application sets its own conditions: disinfection, fluid exposure, fire performance, abrasion, weather. We engineer the fabric around them.
- **Card text pattern:** `<applications>. Engineered for: <4 conditions>.` The four conditions are chosen from the concept's lists, and none are invented.

| # | H3 | Applications | Engineered for | Link · CTA |
|---|---|---|---|---|
| 1 | **Healthcare** | Hospital furniture, patient seating, clinics, waiting areas and care environments. | Daily disinfection · fluid exposure · intensive use · flame performance | `/collections/healthcare` · "View healthcare fabrics" |
| 2 | **Medical** | Medical equipment, treatment equipment, specialist seating and examination environments. | Aggressive cleaning · chemical exposure · skin contact · regulatory requirements | `/collections/medical` · "View medical fabrics" |
| 3 | **Medical transport** | Ambulances, medical transport interiors and patient transport seating. | Fluid-proof surfaces · frequent disinfection · heavy use · fire performance | `/collections/medical` · "View medical fabrics" |
| 4 | **Transportation & mobility** | Train interiors, mass transportation and passenger seating. | High abrasion · fire safety · continuous passenger turnover · long service cycles | `/collections/mass-transportation` · "View transport fabrics" |
| 5 | **Contract & public spaces** | High-traffic seating, public facilities and commercial interiors. | Constant public use · heavy abrasion · stain resistance · fire performance | `/collections/public-spaces` · "View public-space fabrics" |
| 6 | **Fitness** | Fitness equipment, gym seating and training environments. | Sweat · body oils · repetitive friction · intensive cleaning | `/collections/fitness-1` · "View fitness fabrics" |
| 7 | **Sports & arenas** | Stadium seating, arenas, venues and event spaces. | Weather exposure · high traffic · stain resistance · long-term durability | `/collections/public-spaces` · "View arena fabrics" |
| 8 | **Safety & protection** | Protective equipment and safety applications. | Mechanical resistance · durability · regulatory compliance · application-specific requirements | `/pages/contact` (no sector collection) · "Talk to the technical team" |

### 5 · Certifications: `spec-table` (existing, key `certs`)
- **Purpose:** the grade-tied certification table, which is the page's core evidence.
- **Eyebrow:** Certifications · **H2:** The certifications that decide the spec
- **Intro:** Certifications vary by fabric grade. The table shows the standards the performance range is tested against. Ask the technical team for the certificate that applies to your specification.

| Label | Value |
|---|---|
| Crib 5 | Severe-hazard flammability — BS 5852 Crib 5 (Crib 5 grade, Portus; also Flora, Peel and the heavy contract grades) |
| Crib 7 | Highest-hazard flammability rating for extreme-risk seating — BS 5852 Crib 7 (Crib 7 / B1 grade, Prosoft) |
| B1 | Flame-retardant classification — DIN 4102-1 Class B1 (Crib 7 / B1 grade, Prosoft) |
| Antiviral | Inhibits viral activity on the surface — ISO 18184 (Mediflex) |
| Antibacterial | Inhibits bacterial and fungal growth — Sanitized® treatment (antibacterial tested to JIS Z 2801; antifungal to ISO 846 A) |
| Bleach cleanable | Withstands diluted sodium-hypochlorite (bleach) cleaning without degrading |
| Alcohol resistant | Compatible with alcohol-based disinfectants used in clinical protocols |
| Waterproof | Impermeable, fluid-proof surface — does not absorb spills or bodily fluids |
| Martindale | 400,000 rubs abrasion resistance — ISO 5470-2 |
| OEKO-TEX | OEKO-TEX Standard 100 — tested for harmful substances |
| REACH | EU REACH compliant — no Substances of Very High Concern above thresholds |

- **Footnote:** A rating tied to a named grade applies to that grade only.
- **CTA:** Request certificates & test reports → `/pages/contact` (unchanged)
- PFAS is **omitted**. See (f).

### 6 · Quality & testing: `image-with-text` (existing, key renamed `image_with_text_UFhpiP` → `quality`)
- **Eyebrow:** Quality & testing · **H2:** Tested inside and out
- **Copy:**
  > Monteiro fabrics are made to look good and to last with proper maintenance and cleaning, from durability to comfort, and they carry a warranty.
  >
  > Every product is tested internally, in Monteiro's own laboratory, and externally, in certified third-party laboratories, so it consistently meets the expected quality benchmarks.
- Image unchanged (`LAB-FABRICS-1.jpg`).

### 7 · The process: `text-columns-with-images` (existing, **new on this page**, key `process`, `enable_image: false`)
- **Purpose:** the concept's "technical expertise is a process" argument, and the only place 6M m/yr appears.
- **H2:** From requirement to production · `alternate_bg_color: true`
- **H3 columns:**
  1. **Understand.** *We start with the application.* We identify the environment, usage conditions and technical requirements behind each project.
  2. **Engineer.** *We develop around the specification.* The technical team develops fabric constructions and performance solutions to match the application's requirements.
  3. **Test.** *We test performance inside and out.* Rigorous testing in the internal laboratory and, when required, in certified third-party laboratories.
  4. **Validate.** *We certify against the relevant standards.* Performance is validated against the standards that apply to each fabric grade and specification.
  5. **Produce.** *We deliver at industrial scale.* With 6 million metres of annual production capacity, we combine technical development with the industrial capability that specification projects require.
- Why not `process-timeline`: it is image-led with no body text (see website-technical-facts).

### 8 · Not in the spec?: `text-columns-with-images` (existing, key `custom`)
- **H2:** Not in the spec? We engineer the solution.
- **H3 columns:** Requirement analysis (understanding the application and its technical demands) · Material development (engineering the construction around the required performance) · Testing & validation (testing performance against the relevant requirements and standards) · Industrial production (scaling the validated solution for consistent supply).

### 9 · Credentials: `grade-cards` (existing, key `credentials`, reusing the old `capacity` styling)
- **Eyebrow:** Credentials · **H2:** Made, certified and guaranteed in Portugal
- **Cards (H3):** Made in Portugal (over 100 years of industrial legacy) · ISO 9001 & 14001 (ISO 9001:2015 and ISO 14001:2015 management-system certification by TÜV Rheinland) · 10-year warranty · VVV+ (no animal-derived materials; ranked VVV+, the highest level of the Animal Free Fashion ethical rating designed by LAV)

### 10 · Technical Hub: `tech-resources` (existing, key `resources`, unchanged except the intro)
- **H2:** Technical resources · 1 featured white paper + 5 article cards · `emit_itemlist: true`.

### 11 · FAQ: `faq-schema` (existing, key `faq`, 10 blocks)
- **Eyebrow:** Performance fabrics — answered · **H2:** Technical FAQ
- Every answer is answer-first: the first sentence stands alone as the citable answer. Martindale and PFAS are deliberately **not** in the FAQ (see (f)).

**Q1. What are Monteiro Performance Fabrics?**  
Monteiro Performance Fabrics are the coated and engineered textiles of Monteiro Fabrics' technical division, developed for buyers who specify on certification, durability, compliance and operational risk. They are backed by 60 years of expertise, developed in-house, tested for durability and safety, and made in Portugal.

**Q2. Which Monteiro fabric meets BS 5852 Crib 7?**  
The Crib 7 / B1 grade, Prosoft, meets BS 5852 Crib 7. Crib 7 is the highest-hazard flammability rating, for extreme-risk seating. The same grade also holds DIN 4102-1 Class B1.

**Q3. Which Monteiro fabrics meet BS 5852 Crib 5?**  
The Crib 5 grade, Portus, meets BS 5852 Crib 5, as do Flora, Peel and the heavy contract grades. Crib 5 is the severe-hazard flammability rating. Ask the technical team for the certificate that applies to the grade you specify.

**Q4. What does DIN 4102-1 Class B1 mean for a coated fabric?**  
DIN 4102-1 Class B1 is a flame-retardant classification. In the Monteiro performance range it is held by the Crib 7 / B1 grade, Prosoft.

**Q5. Which Monteiro fabric is antiviral?**  
Mediflex is the antiviral grade: it inhibits viral activity on the surface, tested to ISO 18184. Antibacterial and antifungal performance comes from Sanitized® treatment, tested to JIS Z 2801 (antibacterial) and ISO 846 A (antifungal). Certifications vary by grade.

**Q6. Can Monteiro performance fabrics be cleaned with bleach or alcohol-based disinfectants?**  
Grades rated bleach cleanable withstand diluted sodium-hypochlorite (bleach) cleaning without degrading, and grades rated alcohol resistant are compatible with the alcohol-based disinfectants used in clinical protocols. Ratings vary by grade, so confirm the one your specification needs with the technical team.

**Q7. Which sectors are Monteiro Performance Fabrics developed for?**  
Eight: healthcare, medical, medical transport, transportation and mobility, contract and public spaces, fitness, sports and arenas, and safety and protection. Each fabric is engineered for the conditions of its application, such as daily disinfection, fluid exposure, fire performance or high abrasion.

**Q8. Can Monteiro develop a fabric for a requirement that is not in the standard range?**  
Yes. When standard performance is not enough, the technical team develops a fabric around the application's requirements. The work runs from requirement analysis and material development to testing and validation against the relevant standards, then industrial production for consistent supply.

**Q9. Where are Monteiro Performance Fabrics made, and how is quality controlled?**  
They are made in Portugal, under ISO 9001:2015 and ISO 14001:2015 management-system certification (TÜV Rheinland), with a 10-year warranty. Fabrics are tested in Monteiro's own laboratory and, when required, in certified third-party laboratories.

**Q10. How do I get certificates, test reports or samples for a project?**  
Contact the technical team with your application and the standards your specification calls for. Certifications vary by fabric grade, and the team will supply the certificate that applies to your specification, together with samples.

### 12 · CTA: `rich-text` (existing, key `cta`)
- **H2:** Talk to the technical team
- **Text:** Tell us the application and the standards you need to meet. We will recommend the grade, supply the certificate that applies to your specification and send samples.
- **Button:** Contact the technical team → `/pages/contact`

**Length:** about 1,550 visible words (v1: 1,242). No new section types are needed.

---

## (c) SEO metadata

| Field | Value | Notes |
|---|---|---|
| URL / handle | `/pages/performance-fabrics` | **Unchanged.** It is live and indexed, and the URL itself carries the head term. |
| `<title>` (page SEO title) | `Certified Performance Coated Fabrics` | 36 chars; the theme appends " – Monteiro Fabrics" → **55 chars** total. The current value renders "Performance Fabrics \| Certified Technical Coated Fabrics — Monteiro – Monteiro Fabrics" (~85 chars). |
| Meta description | `Coated performance fabrics for healthcare, medical, transport, contract, fitness and arenas. Crib 5, Crib 7 and B1 grades. Made in Portugal.` | **140 chars.** It names the sectors and the three fire grades, with no range-wide claims. |
| H1 | Performance fabrics engineered for demanding environments | One only (hero, `heading_h1: true`). `story` and `cta` keep `heading_h1: false`. |
| H2s (11) | Specified on certification, not on the swatch · Built into every metre · Engineered for the environments that test fabric hardest · The certifications that decide the spec · Tested inside and out · From requirement to production · Not in the spec? We engineer the solution. · Made, certified and guaranteed in Portugal · Technical resources · Technical FAQ · Talk to the technical team | |
| Canonical | Theme default `{{ canonical_url }}` = `https://www.monteirofabrics.com/pages/performance-fabrics` | It is correct on live today, so nothing changes. Each locale self-canonicalises (`/pt/pages/…`). |
| hreflang | Theme/Shopify default, **13 alternates** on live (counted 24/09) | Nothing to add. The risk is **content language**, not the tags: until translations are done, `/de/pages/performance-fabrics` serves English copy under `lang="de"` (audit §3.4 / B1). |
| Robots | index, follow | |
| OG / Twitter | Inherit title + meta. OG image = hero image. | |

**Alt text** lives on the file (`MediaImage`, `fileUpdate`), so it is one value for all languages.

| Slot | File | Proposed alt |
|---|---|---|
| Hero | `fabricante_cadeiras_estadio_xxx2.png` | Rows of upholstered stadium seats *(confirm the image content; it wasn't viewed in this pass)* |
| Quality & testing | `LAB-FABRICS-1.jpg` | Coated fabric samples under test in Monteiro's in-house laboratory *(confirm)* |
| Feature icons (×6) | `perf-*.svg` | The `label` values in §3. These are theme-template alt text, not file alt. |

---

## (d) Structured data (JSON-LD, as it would render in EN)

**Page type decision: `WebPage`, not `CollectionPage`.** The sector pages are `CollectionPage` because they list products. This page describes a division and routes on to other pages; it lists no products. Its main entity is the **sector list**. `FAQPage` stays a separate node, as it is on the sector pages, and is linked back with `isPartOf`.

The sitewide `Organization` (`/#organization`) and `WebSite` (`/#website`) come from `snippets/structured-data-organization.liquid` on every page. They are **referenced by `@id`** and never redeclared. There is no `Offer` and no price.

**Block 1: from `faq-schema` (upgraded, see (g))**

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.monteirofabrics.com/pages/performance-fabrics#webpage",
      "url": "https://www.monteirofabrics.com/pages/performance-fabrics",
      "name": "Monteiro Performance Fabrics",
      "headline": "Performance fabrics engineered for demanding environments",
      "description": "Coated performance fabrics for healthcare, medical, transport, contract, fitness and arenas. Crib 5, Crib 7 and B1 grades. Made in Portugal.",
      "inLanguage": "en",
      "isPartOf": {
        "@id": "https://www.monteirofabrics.com/#website"
      },
      "publisher": {
        "@id": "https://www.monteirofabrics.com/#organization"
      },
      "breadcrumb": {
        "@id": "https://www.monteirofabrics.com/pages/performance-fabrics#breadcrumb"
      },
      "mainEntity": {
        "@id": "https://www.monteirofabrics.com/pages/performance-fabrics#sectors"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.monteirofabrics.com/pages/performance-fabrics#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.monteirofabrics.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Performance Fabrics",
          "item": "https://www.monteirofabrics.com/pages/performance-fabrics"
        }
      ]
    },
    {
      "@type": "ItemList",
      "@id": "https://www.monteirofabrics.com/pages/performance-fabrics#sectors",
      "name": "Monteiro Performance Fabrics — sectors",
      "numberOfItems": 8,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Healthcare",
          "description": "Hospital furniture, patient seating, clinics, waiting areas and care environments.",
          "url": "https://www.monteirofabrics.com/collections/healthcare"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Medical",
          "description": "Medical equipment, treatment equipment, specialist seating and examination environments.",
          "url": "https://www.monteirofabrics.com/collections/medical"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Medical transport",
          "description": "Ambulances, medical transport interiors and patient transport seating.",
          "url": "https://www.monteirofabrics.com/collections/medical"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Transportation & mobility",
          "description": "Train interiors, mass transportation and passenger seating.",
          "url": "https://www.monteirofabrics.com/collections/mass-transportation"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Contract & public spaces",
          "description": "High-traffic seating, public facilities and commercial interiors.",
          "url": "https://www.monteirofabrics.com/collections/public-spaces"
        },
        {
          "@type": "ListItem",
          "position": 6,
          "name": "Fitness",
          "description": "Fitness equipment, gym seating and training environments.",
          "url": "https://www.monteirofabrics.com/collections/fitness-1"
        },
        {
          "@type": "ListItem",
          "position": 7,
          "name": "Sports & arenas",
          "description": "Stadium seating, arenas, venues and event spaces.",
          "url": "https://www.monteirofabrics.com/collections/public-spaces"
        },
        {
          "@type": "ListItem",
          "position": 8,
          "name": "Safety & protection",
          "description": "Protective equipment and safety applications."
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.monteirofabrics.com/pages/performance-fabrics#faq",
      "isPartOf": {
        "@id": "https://www.monteirofabrics.com/pages/performance-fabrics#webpage"
      },
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What are Monteiro Performance Fabrics?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Monteiro Performance Fabrics are the coated and engineered textiles of Monteiro Fabrics' technical division, developed for buyers who specify on certification, durability, compliance and operational risk. They are backed by 60 years of expertise, developed in-house, tested for durability and safety, and made in Portugal."
          }
        },
        {
          "@type": "Question",
          "name": "Which Monteiro fabric meets BS 5852 Crib 7?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Crib 7 / B1 grade, Prosoft, meets BS 5852 Crib 7. Crib 7 is the highest-hazard flammability rating, for extreme-risk seating. The same grade also holds DIN 4102-1 Class B1."
          }
        },
        {
          "@type": "Question",
          "name": "Which Monteiro fabrics meet BS 5852 Crib 5?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Crib 5 grade, Portus, meets BS 5852 Crib 5, as do Flora, Peel and the heavy contract grades. Crib 5 is the severe-hazard flammability rating. Ask the technical team for the certificate that applies to the grade you specify."
          }
        },
        {
          "@type": "Question",
          "name": "What does DIN 4102-1 Class B1 mean for a coated fabric?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "DIN 4102-1 Class B1 is a flame-retardant classification. In the Monteiro performance range it is held by the Crib 7 / B1 grade, Prosoft."
          }
        },
        {
          "@type": "Question",
          "name": "Which Monteiro fabric is antiviral?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Mediflex is the antiviral grade: it inhibits viral activity on the surface, tested to ISO 18184. Antibacterial and antifungal performance comes from Sanitized® treatment, tested to JIS Z 2801 (antibacterial) and ISO 846 A (antifungal). Certifications vary by grade."
          }
        },
        {
          "@type": "Question",
          "name": "Can Monteiro performance fabrics be cleaned with bleach or alcohol-based disinfectants?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Grades rated bleach cleanable withstand diluted sodium-hypochlorite (bleach) cleaning without degrading, and grades rated alcohol resistant are compatible with the alcohol-based disinfectants used in clinical protocols. Ratings vary by grade, so confirm the one your specification needs with the technical team."
          }
        },
        {
          "@type": "Question",
          "name": "Which sectors are Monteiro Performance Fabrics developed for?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Eight: healthcare, medical, medical transport, transportation and mobility, contract and public spaces, fitness, sports and arenas, and safety and protection. Each fabric is engineered for the conditions of its application, such as daily disinfection, fluid exposure, fire performance or high abrasion."
          }
        },
        {
          "@type": "Question",
          "name": "Can Monteiro develop a fabric for a requirement that is not in the standard range?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. When standard performance is not enough, the technical team develops a fabric around the application's requirements. The work runs from requirement analysis and material development to testing and validation against the relevant standards, then industrial production for consistent supply."
          }
        },
        {
          "@type": "Question",
          "name": "Where are Monteiro Performance Fabrics made, and how is quality controlled?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "They are made in Portugal, under ISO 9001:2015 and ISO 14001:2015 management-system certification (TÜV Rheinland), with a 10-year warranty. Fabrics are tested in Monteiro's own laboratory and, when required, in certified third-party laboratories."
          }
        },
        {
          "@type": "Question",
          "name": "How do I get certificates, test reports or samples for a project?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Contact the technical team with your application and the standards your specification calls for. Certifications vary by fabric grade, and the team will supply the certificate that applies to your specification, together with samples."
          }
        }
      ]
    }
  ]
}
```

**Block 2: from `tech-resources` (already emitted today, unchanged)**

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Monteiro Technical Hub",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "The Complete Guide to Healthcare Upholstery Fabrics",
      "url": "https://www.monteirofabrics.com/blogs/technical-hub/complete-guide-to-healthcare-upholstery-fabrics"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Crib 5 vs Crib 7: which flammability rating do you need?",
      "url": "https://www.monteirofabrics.com/blogs/technical-hub/crib-5-vs-crib-7"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "How to choose fabrics for healthcare environments",
      "url": "https://www.monteirofabrics.com/blogs/technical-hub/choosing-fabrics-for-healthcare"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Upholstery requirements for healthcare furniture",
      "url": "https://www.monteirofabrics.com/blogs/technical-hub/healthcare-furniture-requirements"
    },
    {
      "@type": "ListItem",
      "position": 5,
      "name": "Bleach cleaning: what to look for in a fabric",
      "url": "https://www.monteirofabrics.com/blogs/technical-hub/bleach-cleaning-fabric-guide"
    },
    {
      "@type": "ListItem",
      "position": 6,
      "name": "Understanding B1 certification",
      "url": "https://www.monteirofabrics.com/blogs/technical-hub/understanding-b1-certification"
    }
  ]
}
```

**Validation:** both blocks parse as JSON, and the build script generates them from the same source as the template copy. Once the page is on the sandbox, re-check the rendered output in validator.schema.org and Google's Rich Results Test.

**Why no `ItemList` of grades.** The grade collections (`/collections/chance-crib-5`, `chance-crib-7-b1`, `chance-mediflex`, `chance-bioblend`) **return 404 on live** (checked 24/09) because the products are UNLISTED until launch. Flora has no handle in the naming map. An `ItemList` pointing at 404s is worse than none. The grade ↔ certification ties are carried by the FAQ answers and the spec table instead. Revisit at launch (see (f)).

**What emits what:**

| Node | Emitted by | Today (v1) | v2 |
|---|---|---|---|
| Organization, WebSite | `snippets/structured-data-organization.liquid` (layout) | ✅ | unchanged |
| BreadcrumbList | `faq-schema` | ✅ (no `@id`, no `item` on the current crumb) | + `@id`, + `item` |
| WebPage | `faq-schema` (**new option**) | ❌ | ✅ |
| ItemList (sectors) | `grade-cards` (**new option**) | ❌ | ✅ |
| FAQPage | `faq-schema` | ✅ (6 Qs, including the PFAS placeholder) | ✅ 10 Qs, + `@id`, `isPartOf` |
| ItemList (Technical Hub) | `tech-resources` | ✅ | unchanged |

If the two code changes in (g) are **not** made, the v2 JSON still ships a correct BreadcrumbList, FAQPage and Tech Hub ItemList. Only the WebPage and sector ItemList nodes are lost.

---

## (e) Internal-link map

| From (section) | Anchor | Target | Status 24/09 |
|---|---|---|---|
| Hero, feature strip, certs, CTA | Talk to / Contact the technical team · Request certificates & test reports | `/pages/contact` | 200 |
| Sectors: Healthcare | View healthcare fabrics | `/collections/healthcare` | 200 (watchlist page) |
| Sectors: Medical · Medical transport | View medical fabrics | `/collections/medical` | 200 (both cards; no ambulance-specific collection) |
| Sectors: Transportation & mobility | View transport fabrics | `/collections/mass-transportation` | 200 (`/collections/train` is the alternative) |
| Sectors: Contract & public spaces · Sports & arenas | View public-space / arena fabrics | `/collections/public-spaces` | 200 (both cards; `/collections/contract` is the alternative for the first) |
| Sectors: Fitness | View fitness fabrics | `/collections/fitness-1` | 200 |
| Sectors: Safety & protection | Talk to the technical team | `/pages/contact` | 200 (no collection) |
| Tech Hub (featured) | Read the guide | `/blogs/technical-hub/complete-guide-to-healthcare-upholstery-fabrics` | 200 |
| Tech Hub | Crib 5 vs Crib 7 | `/blogs/technical-hub/crib-5-vs-crib-7` | 200 |
| Tech Hub | Choosing fabrics for healthcare | `/blogs/technical-hub/choosing-fabrics-for-healthcare` | 200 |
| Tech Hub | Healthcare furniture requirements | `/blogs/technical-hub/healthcare-furniture-requirements` | 200 |
| Tech Hub | Bleach cleaning guide | `/blogs/technical-hub/bleach-cleaning-fabric-guide` | 200 |
| Tech Hub | Understanding B1 | `/blogs/technical-hub/understanding-b1-certification` | 200 |
| Tech Hub | Browse all technical articles | `/blogs/technical-hub` | 200 |
| *Deferred* | Grade names in the certs table and FAQ (Portus, Prosoft, Mediflex, Peel) | `/collections/chance-crib-5` · `chance-crib-7-b1` · `chance-mediflex` · `chance-bioblend` | **404 on live**. Link them at launch; the spec table and FAQ answers can't hold links anyway (plain text / JSON). |
| **Inbound (recommended)** | "Performance Fabrics" | from `/collections/healthcare`, `/collections/medical`, `/collections/mass-transportation`, `/collections/fitness-1`, `/collections/public-spaces`, and the Crib 5 vs 7 / B1 articles | Out of scope for this pass. List for the sector-page pass. |

---

## (f) Excluded claims and open questions

**Excluded from the copy and the schema:**

| Claim | Where it was | Why it's out |
|---|---|---|
| PFAS free | FAQ q4 (with a visible `[TO CONFIRM…]`) + spec-table c12 | The concept marks it `[TO CONFIRM — applies where stated]`. It stays out until the basis and the grades are confirmed. |
| Case studies (Beta ambulance fleet, Norwegian pilot seating, helmet lining, Danish gym and office) | `cases` section | Not in the concept note. |
| "EU-manufactured / under European regulatory standards" | `capacity` card | Not in the concept. |
| "formulated, tested and **certified** by our own technical team" | `capacity` card | Not in the concept, and it contradicts third-party certification. |
| "state-of-the-art laboratory", "unwavering commitment" | Quality section | Not in the concept (tone inflation). |
| "higher crib number = more severe ignition source"; B1 "widely specified for public buildings and transport"; bleach "without cracking or losing colour; avoid abrasive pads"; Martindale "contract / heavy-duty grade" | FAQ q1, q2, q3, q5 | Not in the concept. |

**Open questions for António:**

1. **Martindale 400,000 vs metallic colours.** The concept says "400,000 rubs — ISO 5470-2". The 31/08 sanitation task recorded that the **6 metallic colours are 150,000** on all six CHANCE grades. The metafields now say `≥ 400.000 (metallic colours: 150.000)`. The v2 spec table keeps the concept row word for word, and **Martindale is kept out of the FAQ/JSON-LD** so it can't become a machine-readable absolute. Should the table carry a metallic-colours footnote? That would be the concept's gap to fix, not this page's.
2. **"Antibacterial & antiviral" feature icon.** The concept lists it as a range-level icon, but antiviral is Mediflex-only. The alt text now ties it to Mediflex. If the SVG has "antiviral" printed on it, should the icon be swapped for a plain "antibacterial" one?
3. **Which grades carry bleach, alcohol, waterproof, antibacterial, OEKO-TEX and REACH?** The concept gives these at range level with "certifications vary by grade". The copy says exactly that and nothing stronger. A per-grade matrix would allow stronger answers.
4. **Flora** is named as Crib 5, but it has no product/collection handle in the naming map and no link target.
5. **Peel = Chance Bioblend.** The concept names Peel under Crib 5. Please confirm it applies to the Bioblend grade, since the copy uses the concept's name "Peel".
6. **Sector link targets.** Two pairs share a collection: Medical + Medical transport → `/collections/medical`, and Contract + Sports & arenas → `/collections/public-spaces`. Transportation could go to `/collections/train` instead. Is that OK, or should one card in each pair go to contact?
7. **Case studies.** If they are wanted back, they need a source and a decision. They were not in the SET2026 v2 catalogue.
8. **Samples.** The concept says "order samples via the catalogue QR code". On the web, the copy says samples come through the technical team. Should it link to the free-sample flow instead? "Free" is not in the concept.
9. **Launch-time follow-up:** once the grade collections are published, add links from the certs table and FAQ, and consider a grade `ItemList`.

---

## (g) Implementation notes

**1. Template (no code change needed):** push `briefs/page.performance-fabrics.v2.json` → `theme-sandbox/templates/page.performance-fabrics.json`, when approved, with `bash bin/mf push sandbox templates/page.performance-fabrics.json`.
- The key changes are: `capacity` and `cert_icons` deleted; `cases` deleted; `image_with_text_UFhpiP` renamed to `quality`; `process`, `custom` and `credentials` added.
- **Before pushing, run a pull** (`bin/mf check sandbox`). Section images live in the theme and are lost if the template is stale. The two image slots are kept verbatim from the 24/09 remote.
- Every `richtext` setting is wrapped in `<p>`. Grade-card titles use a literal `&`. No HTML entities go into FAQ answers (they would reach the JSON-LD).

**2. Page metadata (Admin, via the MCP connector, not the theme):** the SEO title and meta description in (c) are page fields, so they change **on live immediately**, independent of the redesign launch. Both suit the live page too, so they can go first.

**3. Optional code change A: `sections/faq-schema.liquid`.** It is additive and backward-compatible for the 19 sector pages:
- new select `page_node`: `none | CollectionPage | WebPage`, keeping the current `emit_collectionpage` checkbox working (default `CollectionPage`);
- new `@id`s: `{{ canonical_url }}#webpage`, `#breadcrumb`, `#faq`;
- `isPartOf` → `{"@id": shop.url/#website}` instead of today's literal inline `WebSite` (which duplicates the global node on 19 pages), plus `publisher` → `/#organization`;
- `cp_url` falls back to `canonical_url` when blank, so each locale emits its own URL, plus `inLanguage: request.locale.iso_code`;
- the breadcrumb's last item gains `item`;
- new text settings `webpage_main_entity` (e.g. `#sectors`).

**4. Optional code change B: `sections/grade-cards.liquid`.** Mirror the `tech-resources` pattern:
- `emit_itemlist` checkbox (default **false**, so the grade pages don't change) + `list_name` + `list_id` (→ `#sectors`);
- per block, `url` = `shop.url` + the cta_link path, emitted only when the new block checkbox `schema_link` is on, so "Safety & protection" (link = contact) is listed **without** a URL;
- `description` = block `text`.

Both changes should be validated in the preview on one sector page and on this page before any push.

**5. Translation keys (PT · FR · DE · ES · IT), EN only in this pass.** Translate & Adapt → Theme content, template `page.performance-fabrics`:

| Section | Keys |
|---|---|
| hero | `subheading`, `title`, `text`, `button_label` |
| story | `subheading`, `title`, `text` |
| tech | `eyebrow`, `title`, `cta_label`, blocks t1–t6 `label` |
| sectors | `eyebrow`, `title`, `intro`, blocks s1–s8 `eyebrow`, `title`, `text`, `cta_label` |
| certs | `eyebrow`, `title`, `intro`, `note`, `cta_label`, blocks c1–c11 `label`, `value` |
| quality | `subheading`, `title`, `text` |
| process | `title`, blocks b1–b5 `title`, `text` |
| custom | `title`, blocks b1–b4 `title`, `text` |
| credentials | `eyebrow`, `title`, blocks k1–k4 `eyebrow`, `title`, `stat`, `text` |
| resources | `eyebrow`, `title`, `intro`, `all_label`, blocks r0–r5 `tag`, `title`, `excerpt`, `meta`, `cta_label` |
| faq | `eyebrow`, `title`, `crumb_home`, `crumb_current`, blocks q1–q10 `question`, `answer` (translating these also localises the FAQPage JSON-LD) |
| cta | `title`, `text`, `button_label` |
| Page (Admin) | SEO title + meta description, 5 languages |

Keys that already have v1 translations must be **re-translated**, not reused, wherever the EN copy changed. That covers all of them except `certs` c1–c11, the resources blocks and the `quality` title.

**6. After approval:** preview `?preview_theme_id=195386114425`. Check: one H1; 11 H2s; the JSON-LD parses; no `[TO CONFIRM` or `PFAS` anywhere in the HTML (`curl … | grep -c`); the sector cards' 8 links return 200.
