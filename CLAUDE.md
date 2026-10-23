# Monteiro Fabrics — APP repo

Theme source, scripts and working briefs for **monteirofabrics.com** (Shopify).
Read this before touching anything on the store. Context, status and decisions live in the
vault: `OneDrive-Viriato&Viriato,SA/WORK/Clients/Monteiro-Fabrics/`.

## The two theme mirrors — they are not interchangeable

> **Since 2026-09-30 11:22 the redesign is the published site.** The folder names are historical:
> `theme-sandbox/` now mirrors the **live (MAIN)** theme, and `theme-live/` mirrors the old
> Showcase 7.0, kept unpublished as the rollback option.

| Folder | Theme | ID | Role |
|---|---|---|---|
| `theme-sandbox/` | **CLAUDE_MF_JUNE_PROPOSTA — the redesign** | `195386114425` | **MAIN — the published site** |
| `theme-live/` | Showcase 7.0 (pre-redesign) | `162670182703` | Unpublished — rollback only, do not edit |

The header is bound to the menu handle **`mf_june_menu`** (`config/settings_data.json`); edit it with
the Shopify MCP connector. The old `main-menu` belongs to Showcase and is not shown.

A local file is **not** the state of the theme. Always:

```bash
bash bin/mf check sandbox        # pulls to a temp dir, diffs, changes nothing
bash bin/mf pull  sandbox        # then commit, then edit
bash bin/mf push  sandbox sections/foo.liquid   # named files only, never a whole theme
```

Both targets now push with `--allow-live` (`sandbox` = MAIN since 2026-09-30). **Every
`push sandbox` goes straight to the public site — get António's OK first.**
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

The MCP connector **cannot write the live theme** (`195386114425` since 2026-09-30) — it blocks MAIN by
design. That is why `bin/mf` exists. It can still write the unpublished Showcase theme.

**Retired 2026-09-14:** `.shopify-token.json` + `oauth.mjs`. The custom app behind that token had
been cut to `read_orders` while the file still advertised `write_themes`, so scripts failed late
with a different "Access denied" each time. `scripts/lib.mjs` now takes `SHOPIFY_ADMIN_TOKEN` from
the environment and fails on line one when it is absent.

## Git remote

`origin` → **https://github.com/antonioviriatomkt/monteiro-shopify** — **public, by decision
(2026-09-14)**. Assume anything committed here is world-readable: no client credentials, no lead or
customer exports, no personal data. `data/` and `assets-source/` are already excluded. The working copy
still lives in a OneDrive-synced folder, so the sync client and git can still collide — **push after
every session**, so the history exists somewhere the sync client cannot corrupt.

Auth is a fine-grained PAT in `.github-token` (gitignored), scoped to this one repo with Contents:
read/write. It is wired in as a credential helper, so the token is **not** in `.git/config` and a
plain `git push` works. **The PAT expires ~2026-12-13** — when a push suddenly fails with a 403,
that is why; generate a new one at github.com/settings/personal-access-tokens and overwrite the file.
The token cannot change repository settings by design, only contents.

## Scripts

### B2B lead jobs

**Since 22–23/10 neither scheduled task runs these scripts.** `Daily b2b leads to notion` (06:00)
reads Sender, Shopify (orders + Shopify Forms) and PostHog through the MCP connectors and upserts the
Notion base `MF — LEADS`; `Weekly b2b leads email` (Mon 08:00) reads only that base. The prompts live
in the vault (`reporting/automacao-leads-diaria-prompt.md`, `…-semanal-prompt.md`). The scripts below
are **legacy** reference for the same two sources:

| Source | How | Script |
|---|---|---|
| Sender groups (fichas técnicas, contact form, Shopify form) | `.sender-token` | `scripts/pull-leads.mjs <start> <end>` |
| Shopify sample orders (€0.00) | Shopify MCP connector → JSON on stdin | `scripts/filter-orders.mjs <start> <end>` |

`scripts/leads-lib.mjs` holds the single free-email blocklist both paths use — change it there,
never in one script alone.

**Sample-order customers usually have no marketing opt-in, so they never appear in Sender.** A
Sender-only pull silently misses them; that is how `#mf1501` (Van der Valk Design) went unrecorded
until the 22 Sep 2026 reconciliation. `filter-orders.mjs` does not fetch — there is no Admin API
token here — the job pulls orders with the connector and pipes them in. It drops non-zero-total
orders, anything tagged `auto-cancel-personal-email`, and personal domains, reporting each in
`skipped`.

No dedupe by domain: one company legitimately appears several times (different contacts, several
orders, or a TF download *and* a sample order). Only exact re-entries of one event are skipped.

`scripts/*.mjs` are Admin-API helpers (metafields, leads, reports). The **theme deploy/pull ones
are superseded by `bin/mf`** — `deploy-files.mjs`, `deploy-section.mjs`, `deploy-landing-cta.mjs`,
`pull-files.mjs`, `deploy-thank-you-template.mjs`. `MF_THEME_DIR` selects the mirror for the rest
(default `theme-sandbox`).

## Supabase signal collectors (since 2026-10-20)

Daily snapshots of GSC, Shopify orders and Sender leads into Supabase project
**`btlkcbilpsjtyiqwnsal`** — shared with the VA Properties portal, so everything is prefixed
`signals_` and nothing else there is ours to touch.

| Piece | Where |
|---|---|
| Schema, flags, cron | `supabase/migrations/20261020142301_signals_collectors.sql` |
| Edge Functions | `supabase/functions/collect-{gsc,shopify,sender}` + `_shared/signals.ts` (deploy with `verify_jwt: false`, ship `_shared` alongside) |
| Schedule | pg_cron `signals-collect-*`, 05:00 / 05:05 / 05:10 Lisbon (04+05 UTC with an hour guard) |
| Runs, errors, deltas | `public.signals_collector_runs` |
| Secrets | Vault: `gsc_service_account_json`, `shopify_admin_token`, `sender_api_token`, `signals_cron_key` (generated) — read only via `signals_get_secret` |

- Run by hand: `select public.signals_invoke('collect-gsc', '{"backfill": true}');` — answers 202, the
  function chains itself past the 150 s wall clock and writes one row in `signals_collector_runs`.
- `is_test` / `is_ucp` are set by triggers. Test emails live in `signals_test_identities` (seeded in
  the DB, **never in this repo**); after editing a rule run `select public.signals_reflag();`.
- Shopify only returns 60 days of orders unless the token has **`read_all_orders`**.
- Sender's `/groups/{id}/subscribers` lists active subscribers only — `collect-sender` scans
  `/subscribers` and filters by tag to keep unsubscribed / bounced leads.
- **Shopify Forms (since 2026-10-23):** `collect-shopify` phase 2 scans customers tagged
  `shopify-forms-278222` (inline form on /pages/faq-s, contact-form1, ORGATEC, tradeshow) into
  `signals_shopify_form_submissions`, one row per (customer, `custom.message` updatedAt). Shopify keeps
  only the latest message. `{"phase":"forms"}` = forms only, `{"forms":false}` = orders only.
  Migration `20261023092909_signals_shopify_forms.sql`.

## Control centre + external probes (since 2026-10-23)

The **MF Central de Controlo** (Claude Dashboard artifact, António's account) reads this project live:
`signals_collector_health`, `cron.job`/`cron.job_run_details`, `signals_flags`, `signals_pulse_runs`,
`vault.secrets` (names only), `signals_leads_weekly`, `signals_gsc_totals_rolling`, `signals_leads`
(+ `signals_shopify_orders` for the cart `ph_utm_*` origin) and `signals_probes_latest`. The two
hand-kept lists there (Claude scheduled tasks, platform/credential map) are JSON files on the artifact —
update them in the session that changes a task or a credential.

| Piece | Where |
|---|---|
| Probes table + view, cron, health view with `health` | `supabase/migrations/20261023113000_signals_probes.sql` (+ `…113500_signals_invoke_health.sql`) |
| Edge Function | `supabase/functions/collect-health` — pg_cron `signals-collect-health` 05:15 Lisbon |
| Probes | site home (+ PostHog/GTM/Clarity in HTML) · `/pt` · sitemap · Worker `contact-to-sender` (OPTIONS 204) · Shopify Admin token · Sender token · portal · PostHog theme events 24 h (Vault `posthog_personal_api_key`, allowlisted in `signals_get_secret` since 23/10 — verified: pageviews 311, theme events 23) |
| Run by hand | `select public.signals_invoke('collect-health');` → `select * from public.signals_probes_latest;` |

Source `health` is now valid in `signals_collector_runs`, so H1/H2 watch it too. No H-rule reads
`signals_probes` yet: a failed probe shows on the dashboard, not in the pulse.

## Rules + daily pulse (Task 3, since 2026-10-23)

Deterministic detection on the `signals_*` tables; a Claude run only reads a payload and writes words.

| Piece | Where |
|---|---|
| Schema, rules, cron | `supabase/migrations/20261023094317_signals_rules_pulse.sql` (+ `…094350_…_revoke_tables.sql`) |
| Thresholds | `public.signals_rules` — tune with `UPDATE`, no migration; evidence in each `description` |
| Lead events | view `signals_leads` (`excluded_reason` null = corporate-domain lead). Contact form = Sender `enzoW5` source API/FORM + Shopify Forms; Sender SHOPIFY rows are always `shopify_sync` (vault decision 2026-10-23) |
| Detection | `signals_detect()` — pg_cron `signals-detect` 05:30 Lisbon → `signals_flags` (one row per episode), `signals_leads_seen` |
| Pulse | `select public.signals_pulse_prepare('daily'|'weekly')` → write ≤10 lines from the payload → deliver → `select public.signals_pulse_ack(<run_id>)`. Daily `noop: true` = send nothing |

- **Blocklist:** `FREE` in `scripts/leads-lib.mjs` is the only edited list. **After editing it, run
  `node scripts/sync-free-email-domains.mjs`** and execute the printed SQL with the connector; then
  `--fingerprint` must equal `select public.signals_free_email_domains_fingerprint();`.
- Team personal addresses → `signals_test_identities` (DB only), then `select public.signals_reflag();`.
- Health rules H1–H6 watch the collectors and `signals-*` cron jobs; G-rules use final GSC days only.

## Known state

- **2026-09-30 — redesign published.** `195386114425` is MAIN; Showcase `162670182703` unpublished
  (rollback). The ORGATEC and other notes below that say "sandbox" / "before publishing" describe the
  pre-launch situation; the sandbox **is** now the live theme.
- **About Us (2026-09-30, `8a062da`):** timeline gains 1998 · 2013 · 2019 · 2023 (translated into 5
  locales), and a new `sections/anchor.liquid` gives in-page jump targets `#history`,
  `#mission-values`, `#quality-sustainability`, `#innovation`, `#official-resellers`, used by the
  "About Us" dropdown in `mf_june_menu`.

- **The ORGATEC LP is mirrored to the sandbox (2026-09-24, `f823399`).** `collection-sheets`,
  `media-text-ctas`, `proof-strip`, `sector-tabs`, `landing-cta` (+ `assets/landing-cta.css`) and
  `templates/page.orgatec-2026.json` are on both themes; the sandbox preview's server HTML is
  identical to live apart from the asset path and the Forms app-block id. Publishing the sandbox no
  longer breaks the LP — **but the LP keeps being edited in the live theme editor** (images, widths,
  the Forms block), so run `bin/mf check live` and re-copy the template to the sandbox right before
  any publish.
- Nothing ORGATEC is pending on live: the v4/v5 copy (Electra + Laguna, Portus dropped, "Eight") has
  been live since 2026-09-14. The v1 `sections/orgatec-2026.liquid` is no longer referenced by any
  template on either theme — deletion is an open item in the vault, not done.
- `theme-sandbox/` is a clean mirror except three older local-ahead templates:
  `list-collections.json`, `page.siesta-patio.json`, `page.trade-fair-invitation.json`
  (the sandbox still uses the old `siesta-outdoor-upholstery` page handle).
- The sandbox theme carries two junk files from an interrupted push:
  `assets/styles.css.liquid.tmp.10532.*` — delete them in the theme editor.

## Gotchas that have cost time

- `bin/mf pull` overwrites **committed local-ahead** files too (e.g. the three sandbox templates
  above). After a pull, `git checkout --` whatever you did not mean to refresh, then commit.
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
