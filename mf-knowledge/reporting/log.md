# Update Log

Changes to the Monteiro Fabrics **Marketing Dashboard** (the reporting app), newest first. Scope:
the dashboard app, its Supabase backend, integrations and deployment. Distinct from the
[website log](/website/log.md) (the live Shopify site) and the bundle-level [root log](/log.md).

## 2026-07-04

* **Restructure**: **Report v2** — fixed answer-first template (per the client's Notion
  "Proposta de reestruturação"): O mês num relance (6 KPIs + conclusões) → Leads e negócio →
  Como nos encontraram → Canais → Trabalho realizado → Plano → Apêndice (+ assinatura Viriato).
  Rebuilt on **shadcn/ui** (Cards/Tables/Badges; blue primary `#2F519B`, grey secondary),
  responsive; one JSON document per month (`narrative.section='v2'`); legacy layout kept as
  fallback. June loaded verbatim from the v2 Notion page (incl. Google Ads MF_S_Healthcare).
* **Historical import**: extracted the original PDF reports (three parallel agents) —
  `MONTEIROFABRICS_REPORT_MARCO_v5` (24pp), `_ABRIL` (22pp), `_MAIO_V2` (19pp) — and loaded
  **March, April, May as published v2 reports** with real KPIs, full lead lists (12/16/24),
  newsletters (Techtextil & Featured · Performance PVC · This Month in Coated Fabrics), work
  done and month plans. Source-PDF internal inconsistencies preserved as appendix notes
  (Apr: 15 vs 17 leads, two GSC figures; May: TF 11 vs 13); May carries the retroactive
  bot-traffic note from the June investigation. March GA4/GSC also backfilled via API.
* **Note**: dashboard database now runs on Supabase project `kqgaxoyivpbodbuuqcmv` (migrated by
  Antonio from the original `vqjkrtulkykiybbuhaao`, which still holds a stale copy — to delete).
* **Enhancements**: GA4 puller now excludes bot traffic (Singapore/China geos + trafficheap
  referral, env-configurable); left-rail scroll-spy index; client-facing `LeadsTable`;
  import endpoint gains `ensureMonth`/`setStatus`; `?sources=` filter on the cron pull.

## 2026-07-03

* **Creation**: Built and shipped the **v1 dashboard**. Next.js 16 (App Router) + Supabase +
  Notion, deployed to Vercel at **https://monteiro-dashboard.vercel.app** from a private repo
  (`antonioviriatomkt/monteiro-dashboard`, GitHub↔Vercel auto-deploy). New dedicated Supabase
  project `monteiro-fabrics-dashboard`. Outcome-first PT report — Hero + Website&SEO + Social +
  Leads + What's-next — with MoM deltas, trend sparklines and MF branding (brand blue `#2F519B`).
  Published months are public/shareable; leads and the admin surface are behind magic-link auth
  (allow-list `invited_users`; roles viewer/admin; RLS).
* **Schema**: Supabase schema + RLS + auth-provisioning trigger — `tenants`, `profiles`,
  `invited_users`, `months`, `metrics`, `leads`, `lead_sources`, `narrative`, `source_runs`,
  `app_secrets`. Seeded April–June 2026 (June narrative in PT). Multi-tenant-ready via `tenant_id`.
* **Integration (GA4)**: Live via a Google service account
  (`monteiro-dashboard@monteiro-fabrics-493111.iam.gserviceaccount.com`) with Viewer on GA4 property
  `524516546` — organic + total sessions, users, channel breakdown.
* **Integration (Search Console)**: Live on the verified **URL-prefix** property
  `https://www.monteirofabrics.com/` (the `monteirofabrics.com` Domain property is unverified) —
  clicks, impressions, CTR, avg position, top queries.
* **Integration (Shopify)**: Live via an **OAuth custom app** with `read_orders` (the store token
  wasn't accessible directly, so a hosted `/api/shopify/oauth/callback` completes the Authorization
  Code handshake and captures the token) — sample (€0) order counts. Store
  `monteiro-fabrics.myshopify.com`.
* **Integration (Sender)**: Live — subscriber count (2,668 at time of wiring).
* **Integration (Notion)**: Token set; per-month page id in *Gestão → Meses* syncs section headings
  → `narrative`.
* **Automation**: Monthly Vercel Cron (`0 6 1 * *`) → `/api/cron/pull`, `CRON_SECRET`-protected,
  with an optional `?sources=` filter for targeted pulls.
* **Data**: Backfilled **April–June 2026** with real GA4 + Search Console (organic sessions
  Apr 1,077 · May 1,037 · Jun 1,130), leaving the Shopify/Sender seed values for the older months
  intact (those APIs can't reconstruct history).
* **Pending**: admin-login redirect URL in Supabase Auth; Meta token; MF logo + full palette (only
  `#2F519B` known); add Ivana as a viewer.
