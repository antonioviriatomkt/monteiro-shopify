# Monteiro Fabrics — APP

Theme source, working briefs, knowledge bundle and Admin-API scripts for
[monteirofabrics.com](https://www.monteirofabrics.com) (Shopify).

**Read [`CLAUDE.md`](CLAUDE.md) before touching the store.** It carries the routing rules, the known
state of both themes, and the gotchas that have cost time. This file is only the map.

Project status, decisions and task history live in the vault, not here:
`OneDrive-Viriato&Viriato,SA/WORK/Clients/Monteiro-Fabrics/`.

## Layout

| Path | What |
|---|---|
| `theme-live/` | Mirror of **Showcase 7.0 — MAIN, the published site** (`162670182703`) |
| `theme-sandbox/` | Mirror of CLAUDE_MF_JUNE_PROPOSTA, the unpublished redesign (`195386114425`) |
| `bin/mf` | The only sanctioned way to move theme files |
| `briefs/` | Launch runbook, working briefs, reference snippets |
| `mf-knowledge/` | OKF bundle — brand, content, website records, reporting *(product layer wound down; product facts live in the vault's `reference/knowledge/`)* |
| `scripts/` | Admin-API helpers — metafields, leads, reports |
| `data/`, `assets-source/` | ~523 MB of catalogues and imagery — **not in git**, versioned by OneDrive |

## Theme files

```bash
bash bin/mf check live        # pull to a temp dir, diff against theme-live/, change nothing
bash bin/mf pull  live        # overwrite the local mirror — then commit, then edit
bash bin/mf push  live sections/foo.liquid   # named files only, never a whole theme
```

`check` is free and safe; run it before you believe anything about the local files. `push` re-pulls
first and refuses a file whose remote moved while local has no commits of its own.

Needs `.shopify-theme-token` at the root — a **Theme Access password** from Shopify's Theme Access
app. It is the only credential that reads *and writes the live theme* non-interactively. Gitignored.

Under the hood this is the Shopify CLI, run through `npx` — nothing to install. The first call in a
fresh environment takes a minute or two; every call after is instant.

## Scripts

```bash
SHOPIFY_ADMIN_TOKEN=<token> node scripts/<name>.mjs
```

Node 18+, native `fetch`, ESM, no build step and no `node_modules`. The credential comes from the
environment — there is deliberately no token file. Most store work should go through the Shopify MCP
connector instead; see the routing table in `CLAUDE.md`.

The theme deploy/pull scripts (`deploy-files`, `deploy-section`, `deploy-landing-cta`, `pull-files`,
`deploy-thank-you-template`) are **superseded by `bin/mf`**. `MF_THEME_DIR` picks the mirror for the
rest; it defaults to `theme-sandbox`.

## Git

`origin` is **github.com/antonioviriatomkt/monteiro-shopify** (private). The working copy sits in a
OneDrive-synced folder, where git and the sync client have collided before (a stuck
`.git/index.lock`) — **push after every session** so the history is not one folder away from gone.

## Credentials

Never committed, never in a token file checked into the tree:

| File | What | Used by |
|---|---|---|
| `.shopify-theme-token` | Shopify Theme Access password | `bin/mf` |
| `.sender-token` | Sender API JWT | `scripts/sender-*.mjs` |
| `.github-token` | Fine-grained PAT, this repo only, Contents: read/write | `git push` (wired as a credential helper, so it stays out of `.git/config`) |

`.shopify-token.json` and `oauth.mjs` were **removed 2026-09-14**. The custom app behind that token
had been reduced to `read_orders` while the file still advertised `write_themes`, so it
authenticated cleanly and then failed per-resource with a different error each time. Do not
reintroduce it: a custom-app token cannot write theme files without a per-app exemption from
Shopify, which is what `bin/mf` exists to sidestep.
