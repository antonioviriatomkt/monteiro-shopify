# Monteiro Fabrics — Shopify automation toolkit

A small set of Node.js scripts that talk to the Shopify Admin GraphQL API and the
Sender API to manage the [monteirofabrics.com](https://www.monteirofabrics.com)
store: deploy theme files, create pages, build metaobjects, and pull
marketing analytics. No build step, no framework, no `node_modules` — just
files and `fetch()`.

---

## Prerequisites

- **Node.js 18+** (uses native `fetch` and ESM)
- **`.shopify-token.json`** at the project root (created by `oauth.mjs`, see below)
- **`.sender-token`** at the project root (Sender API JWT, used by sender scripts)

Both token files are listed in `.gitignore`. Don't commit them.

---

## First-time setup

If you're on a fresh machine and `.shopify-token.json` doesn't exist yet:

```bash
node oauth.mjs
# Then open the printed install URL in a browser logged in as a store owner,
# approve the scopes, and the callback server writes the token to disk.
```

The custom OAuth app is registered in the Shopify Partner Dashboard. Required
scopes:

```
write_content, write_files, write_themes, write_metaobjects, write_metaobject_definitions
```

(Read scopes are implied.)

---

## Folder layout

```
.
├── oauth.mjs                       # one-shot OAuth callback server
├── scripts/                        # all admin scripts (see catalog below)
│   └── lib.mjs                     #   shared graphql() helper, loadCreds()
├── theme/                          # source-of-truth theme files
│   ├── sections/                   #   custom Liquid sections
│   ├── assets/                     #   CSS / JS / images for the above
│   └── templates/                  #   JSON page templates
├── data/                           # generated data files + page content
│   ├── resellers.json              #   reseller metaobject entries
│   ├── sample-orders-by-country.json
│   ├── sender-downloads-by-country.json
│   ├── sender-downloaders.json
│   └── landing-page-custom-liquid/
│       └── modal-forms.html        #   embedded inside page template via API
├── theme-reference/                # snapshots of theme files for read-only diff
├── briefs/                         # marketing briefs + PDF replies
├── assets-source/                  # source images / logos for uploads
└── .shopify-token.json             # gitignored
```

---

## Script catalog

All scripts are run as `node scripts/<name>.mjs`. They use `lib.mjs` to load
credentials and call the Admin GraphQL API at version `2025-01`.

### Theme deployment

| Script | What it does |
| :--- | :--- |
| `deploy-section.mjs` | Walks **everything under `theme/`** and uploads it via `themeFilesUpsert`. Targets `Resellers WIP` by default; override with `THEME_NAME='Showcase 7.0'`. |
| `deploy-thank-you-template.mjs` | Pushes only `templates/page.download-thank-you.json`. Targets `Showcase 7.0`. |
| `deploy-landing-cta.mjs` | Pushes only `sections/landing-cta.liquid`. Targets `Showcase 7.0`. |
| `update-landing-page-custom-liquid.mjs` | Reads `data/landing-page-custom-liquid/modal-forms.html`, parses the live `templates/page.landingpage-healthcare.json`, swaps the `custom_liquid_NUPpwP` section's `settings.custom_liquid` value, and re-uploads. **Use this whenever you change the modal/tracking JS on the healthcare LP.** |

### Page + content creation

| Script | What it does |
| :--- | :--- |
| `create-download-thank-you-page.mjs` | Idempotently creates (or updates) `/pages/download-thank-you` via `pageCreate`/`pageUpdate`, assigned to the `download-thank-you` template suffix. |
| `setup-metaobject.mjs` | Creates the `reseller` metaobject **definition** (fields: name, country, logo, website). Run once before populating entries. |
| `upload-logos.mjs` | Uploads reseller logos from `assets-source/` to Shopify Files via staged uploads. Writes resulting file IDs back to `data/resellers.json`. |
| `create-entries.mjs` | Creates `reseller` metaobject entries from `data/resellers.json` (one per partner), pinned to the storefront, with logo file IDs from the previous step. |

### Marketing analytics

| Script | What it does |
| :--- | :--- |
| `sender-downloads-by-country.mjs` | Pulls subscribers from the two Sender groups (MEDIFLEX TF, ELECTRA TF), aggregates by country, writes `data/sender-downloads-by-country.json`. |
| `sender-downloaders-companies.mjs` | Pulls subscribers' company/email fields; writes `data/sender-downloaders.json`. |
| `sample-orders-by-country.mjs` | Parses `~/Desktop/orders_export_all.csv` (RFC4180-compliant), aggregates sample orders by country, writes `data/sample-orders-by-country.json`. |
| `sender-lib.mjs` | Shared Sender API helpers (loads token from `.sender-token`, handles pagination, swallows the "no active subscribers" 400 on empty groups). |
| `sender-probe.mjs` | Sanity check: lists groups, prints subscriber counts. Run when adding a new Sender group. |

### Diagnostics

| Script | What it does |
| :--- | :--- |
| `sanity-check.mjs` | Lists themes + recent files. Useful when verifying a deploy hit the right theme. |
| `inspect-theme-buttons.mjs` | Dumps the CSS rules for `.button` and `.button.alt` from the live theme — used to match exact heights when adding custom CTAs. |

---

## Common workflows

### Edit a custom section, then deploy to live

```bash
# 1. Edit the file
$EDITOR theme/sections/landing-cta.liquid

# 2. Push to the live theme
THEME_NAME='Showcase 7.0' node scripts/deploy-section.mjs
# or, for a single file:
node scripts/deploy-landing-cta.mjs
```

### Update the healthcare LP modal/tracking JS

```bash
# 1. Edit
$EDITOR data/landing-page-custom-liquid/modal-forms.html

# 2. Push (this embeds the HTML into the page template's custom-liquid setting)
node scripts/update-landing-page-custom-liquid.mjs
```

### Test on a duplicate theme first

In Shopify Admin → Online Store → Themes, duplicate the live theme and rename
the copy to something like `Resellers WIP` or `Healthcare WIP`. Then:

```bash
THEME_NAME='Healthcare WIP' node scripts/deploy-section.mjs
```

Preview in the theme editor → if good, push to `Showcase 7.0`.

### Pull current Sender + orders breakdown

```bash
node scripts/sender-downloads-by-country.mjs
node scripts/sample-orders-by-country.mjs
# results land in data/*.json
```

---

## Live resources at a glance

- **Themes:** `Showcase 7.0` is the live theme. Make WIP duplicates for risky edits.
- **Pages:**
  - `/pages/official-resellers` — uses `sections/official-resellers.liquid` + `reseller` metaobjects
  - `/pages/high-performance-upholstery-fabrics-for-medical-equipment` — healthcare LP (template `page.landingpage-healthcare.json`, modals embedded via `custom_liquid_NUPpwP` section)
  - `/pages/download-thank-you` — Sender redirect target (template `page.download-thank-you.json`)
  - `/pages/thank-you` — contact-form redirect target (pre-existing)
- **Sender forms** (IDs used in modal-forms.html):
  - `e5Prqd` — Mediflex technical file
  - `eXDvAg` — Mediflex catalogue PDF
  - `aM8KD1` — Electra technical file
  - `b2kPAz` — Electra catalogue PDF
- **GA4 property:** `524516546` (G-… measurement ID configured in GTM container `GTM-KWHH9H5K`)

---

## Maintenance notes

- **Bump `API_VERSION` in `scripts/lib.mjs`** once a year. Shopify supports the
  last 12 months of versions. Currently `2025-01`.
- **Theme renamed?** Scripts find themes by name. Either rename via Shopify
  Admin keeping the script's expectation, or pass `THEME_NAME=…` per invocation.
- **Token revoked?** Re-run `node oauth.mjs`. New token overwrites the old
  `.shopify-token.json`. Existing scope is wide enough for everything in this
  repo — no need to add scopes unless adding new capabilities.
- **OAuth client secret rotation:** rotate in Partner Dashboard → Apps → API
  credentials whenever the secret may have leaked (or every ~6 months).
- **Sender token rotation:** Sender → Settings → API Tokens. The token in
  `.sender-token` expires in year 2126 but rotate sooner if it leaks.

---

## What's NOT in this repo

- The **GTM container** itself (variables, triggers, tags) lives in the GTM web UI.
  See `briefs/Healthcare_LP_Tracking_Implementation.md` for the spec.
- The **theme code** that ships with the Shopify theme (Showcase 7.0). Only the
  custom sections we authored live here. `theme-reference/` has read-only
  snapshots of the rest for diffing.
- **`node_modules/`** — there are no npm dependencies. Scripts use only
  Node's standard library.
