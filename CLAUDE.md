# Monteiro Fabrics — APP repo

Theme source, scripts and working briefs for **monteirofabrics.com** (Shopify).
Read this before touching anything on the store. Context, status and decisions live in the
vault: `OneDrive-Viriato&Viriato,SA/WORK/Clients/Monteiro-Fabrics/`.

## The two theme mirrors — they are not interchangeable

| Folder | Theme | ID |
|---|---|---|
| `theme-live/` | **Showcase 7.0 — MAIN, the published site** | `162670182703` |
| `theme-sandbox/` | CLAUDE_MF_JUNE_PROPOSTA (redesign, unpublished) | `195386114425` |

A local file is **not** the state of the theme. Always:

```bash
bash bin/mf check live        # pulls to a temp dir, diffs, changes nothing
bash bin/mf pull  live        # then commit, then edit
bash bin/mf push  live sections/foo.liquid   # named files only, never a whole theme
```

`bash bin/mf push` re-pulls first and refuses if the remote moved under a file you have no local
commits for. Do not reach past it with `MF_FORCE=1` without reading the diff.

## One credential per job

| Job | Use | Never |
|---|---|---|
| Theme files — read/write, live or sandbox | `bin/mf` (Shopify CLI + Theme Access password in `.shopify-theme-token`) | an Admin API token |
| Metafields, definitions, metaobjects | Shopify MCP connector | — |
| Products, collections, media & alt text (`fileUpdate`, 100/call) | Shopify MCP connector | — |
| Articles, pages, translations, navigation | Shopify MCP connector (`write_content`) | — |
| **URL redirects** | Shopify Admin by hand — `/store/<store>/content/redirects/new` | the connector (no `write_url_redirects`) |
| **Publishing a theme** | Shopify Admin by hand | the connector (blocked) |
| **Unpublishing a collection** | Shopify Admin by hand | — |

The MCP connector **cannot write the live theme** — it blocks MAIN by design. That is why
`bin/mf` exists.

**Retired 2026-09-14:** `.shopify-token.json` + `oauth.mjs`. The custom app behind that token had
been cut to `read_orders` while the file still advertised `write_themes`, so scripts failed late
with a different "Access denied" each time. `scripts/lib.mjs` now takes `SHOPIFY_ADMIN_TOKEN` from
the environment and fails on line one when it is absent.

## Scripts

`scripts/*.mjs` are Admin-API helpers (metafields, leads, reports). The **theme deploy/pull ones
are superseded by `bin/mf`** — `deploy-files.mjs`, `deploy-section.mjs`, `deploy-landing-cta.mjs`,
`pull-files.mjs`, `deploy-thank-you-template.mjs`. `MF_THEME_DIR` selects the mirror for the rest
(default `theme-sandbox`).

## Known state

- **The four ORGATEC sections exist on LIVE only** — `collection-sheets`, `media-text-ctas`,
  `proof-strip`, `sector-tabs`, plus `templates/page.orgatec-2026.json`. They are **not** on the
  redesign sandbox, contrary to earlier notes. **Publishing the sandbox today breaks the ORGATEC
  landing page**, which has ad spend behind it. Mirror them before any publish.
- `theme-live/sections/orgatec-2026.liquid` and `templates/page.orgatec-2026.json` carry **unpushed
  v4 edits** (Electra + Laguna added, disabled Portus dropped, composition/weight claims corrected,
  "Seven … on the stand" → "Eight"). They change technical claims — sign off before pushing.
- `theme-sandbox/` is a clean mirror except three older local-ahead templates:
  `list-collections.json`, `page.siesta-patio.json`, `page.trade-fair-invitation.json`
  (the sandbox still uses the old `siesta-outdoor-upholstery` page handle).
- The sandbox theme carries two junk files from an interrupted push:
  `assets/styles.css.liquid.tmp.10532.*` — delete them in the theme editor.

## Gotchas that have cost time

- Shopify JSON templates are **JSONC** — strip the leading `/* … */` before `json.load`.
- `assets/styles.css.liquid` is the source; Shopify serves it as `styles.css`. A local `styles.css`
  is an artifact — it was deleted 2026-09-14, do not recreate it.
- Any setting typed `richtext` in a section schema rejects bare text — wrap in `<p>…</p>`. The push
  is partial: other files land, the invalid one is rejected, and the error is in Portuguese and
  names the *setting*, not the section.
- The brand font family is exactly `KometPro`. There is no italic face.
- `grade-cards` titles are `| escape`-rendered — write a literal `&`.
- The live theme centres and recolours `h1–h3`; a light-on-dark section needs
  `text-align:left; color:inherit`.
- CDN lag after publishing content: some locales serve 404 for ~10–20 s. Wait before concluding.
- git here lives inside a synced folder — a stuck `.git/index.lock` after a sync collision is a
  known failure. Check for orphaned locks before believing "another git process is running".
