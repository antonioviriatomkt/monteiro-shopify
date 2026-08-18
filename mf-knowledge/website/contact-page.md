---
type: Change
title: Contact Us — Page Redesign
description: Rebuilt /pages/contact into a focused direct-contact page — hero + a new two-column contact-block (B2B qualifying form + a "reach us directly" column) + the existing map. Native Shopify contact form with custom emailed fields. Straight-corner, brand-blue design.
resource: https://www.monteirofabrics.com/pages/contact
tags: [website, contact, form, lead-capture, claude-mf-june-proposta]
timestamp: 2026-07-02T00:00:00Z
status: deployed-to-sandbox
visibility: private
confidence: high
---

# Overview

Rebuilt the **Contact Us** page (`/pages/contact`, `templateSuffix: contact`) from a sprawling
9-section layout into a **focused, direct-contact page**, per Ivana's review note: *"Create a new one
for direct contact, apart from the Help & Contact."* The FAQ accordions moved off this page (they
belong on **Help & Contact**), and the page is now **hero → contact-block → map**.

# Composition (`templates/page.contact.json`)

- **`hero`** — existing `image-with-text-overlay` ("Contact Us", H1). Kept as-is.
- **`contactblock`** — new `contact-block` section (below).
- **`map`** — existing `map` section (full Portugal + Germany addresses + map). Kept as-is.

**Removed** from the page: the old `main-contact` (bare form), an `apps` embed, two duplicate
"By email" blocks (`image-with-text` + `rich-text`), the FAQ `accordions`, and a `slideshow`.

# New section: `sections/contact-block.liquid`

A two-column direct-contact block on a light, **straight-corner**, brand-blue (`#2F519B`) design:

- **Left — B2B qualifying form** (native Shopify `{% form 'contact' %}`): **Name\*, Company, Email\*,
  Phone, Country, Sector / application (dropdown), Message\***. The non-standard fields post as
  `contact[Company]`, `contact[Phone]`, `contact[Country]`, `contact[Sector]` and are **included in
  the notification email** automatically. Inline success + error handling; required-field + email
  validation. Two-column field rows, single primary "Send message" button.
- **Right — "Prefer to reach us directly?"** column: email, phone, hours (section settings), with a
  brand-blue left rule. Sector options are an editable newline list in the schema.
- The grid is **centered** (`max-width: 1060px; margin: 0 auto`) so it doesn't hug the left edge;
  stacks to one column ≤820px.

**Form freedom (recorded for future work):** the form is theme-owned markup, so full visual/UX
control + arbitrary `contact[*]` fields are free (no app). App-only needs: **file uploads**,
**conditional/multi-step**, **CRM push**, and **routing to a dedicated inbox** (native form emails the
store contact email).

# Gotcha — the theme's "pretty-select" enhancement

`assets/theme.js` runs `$('select:not(.original-selector)').selectReplace()`, wrapping every native
`<select>` in a `.pretty-select` widget (renders the label inline → misaligned with the text inputs).
Two-step fix:

1. Add `class="original-selector"` to the `<select>` → the JS skips it. **But** the theme's CSS has
   `.original-selector { display: none }` (it's the class for the *hidden* native select behind a
   pretty-select), so the box disappeared.
2. Force it back with a higher-specificity rule (`#cb-… .cb-field select { display: block }`).

Result: a plain, normally-styled dropdown, label-above, aligned with the other fields.

# Pending / follow-ups

- **Dedicated technical inbox** (Ivana is creating one): the native form currently emails the **store
  contact email**. When ready, route submissions there (change the store contact email, a forwarding
  rule on `contact[Sector]`, or a form app). The side-column email is **hello@monteirofabrics.com**
  (client-set).
- **Not touched:** the other contact page (`page.contact-form1.json`) and the shared `main-contact`
  section still exist for that page.
- App-only features (file upload / CRM) deferred unless required.

# Collaboration

Tracked in the **"Page Review"** Notion database: the *Contact Us* row (Section = Help & Contact) has
the preview link and is set **Changes requested**, preserving Ivana's original note.

# Related

- Part of the [June 2026 Website Redesign](/website/june-2026-redesign.md).
- The "Get in touch" CTAs on the [Performance Fabrics page](/website/performance-fabrics-page.md)
  point here; the dedicated-inbox routing is shared between the two.

# Citations

[1] [Contact page](https://www.monteirofabrics.com/pages/contact) (full redesign on the sandbox; live falls back to the current template).
[2] Client feedback: "Page Review" Notion database, *Contact Us* row (Ivana).
