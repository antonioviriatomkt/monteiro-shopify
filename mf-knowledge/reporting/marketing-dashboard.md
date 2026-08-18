---
type: Initiative
title: Marketing Dashboard
description: Monteiro-branded web dashboard that replaces the hand-built monthly PDF report — Notion-authored narrative + Supabase metrics historian, rendered by Next.js and deployed on Vercel, with month-over-month trends and a de-duplicated lead list.
resource: https://monteiro-dashboard.vercel.app
tags: [reporting, dashboard, nextjs, supabase, vercel, notion, ga4, search-console, shopify, sender, leads]
timestamp: 2026-07-03T00:00:00Z
status: in-progress
visibility: private
confidence: high
---

# Overview

The Marketing Dashboard replaces the slow, hand-stitched **monthly PDF report** with a single
**Monteiro-branded web report** for Ivana (MF marketing director), in **Portuguese**, that reads
top-to-bottom as an outcome-first story led by SEO/traffic growth, with **month-over-month
comparisons and a running trend** on every metric.

Division of labour: **numbers** are auto-pulled into Supabase (so trends accumulate); the
**narrative** is authored in Notion (Antonio, Claude-assisted); the app merges the two at render
time. Leads are auto-collected and **de-duplicated by email** across Shopify + Sender. Built to the
`Monteiro-Dashboard-Developer-Brief.md` (APP root).

# Deployment

| | |
|---|---|
| Live app | **https://monteiro-dashboard.vercel.app** (redirects to the latest published month) |
| Repo | **github.com/antonioviriatomkt/monteiro-dashboard** (private) — GitHub↔Vercel auto-deploy on push to `main` |
| Host | Vercel — team *Antonio Dias' projects*, project `monteiro-dashboard` |
| Database | Supabase project `monteiro-fabrics-dashboard` (ref `vqjkrtulkykiybbuhaao`, EU-west) |
| Stack | Next.js 16 (App Router, TS, Tailwind v4) · Supabase (Postgres + Auth + RLS + Storage) · Notion API · Vercel Cron |

# Architecture

Notion is the **headless CMS** for narrative; Supabase is the **metrics historian** (one row per
metric per month); Next.js renders the client-facing report; a monthly Vercel Cron job runs the
auto-pulls. Published report data is **publicly readable** (shareable link) via a sessionless anon
client under row-level security; **leads/PII and the whole admin surface are gated** behind
magic-link auth.

# Data model (Supabase)

`tenants` · `profiles` (role + tenant, 1:1 with auth.users) · `invited_users` (email allowlist) ·
`months` (draft/published) · `metrics` (generic time-series: source · section · metric_key · value ·
unit · detail) · `leads` · `lead_sources` (one lead → many sources) · `narrative` (Notion-sourced
HTML per section) · `source_runs` (pull observability) · `app_secrets` (server-only OAuth tokens).
Multi-tenant-ready via `tenant_id`; single tenant (MF) for now.

# Data sources — status at 2026-07-03

| Source | Method | Status |
|---|---|---|
| **GA4** (property `524516546`) | Data API, service account | **Live** — sessions, organic, users, channel breakdown |
| **Search Console** (`https://www.monteirofabrics.com/`, URL-prefix) | Search Analytics API, same service account | **Live** — clicks, impressions, CTR, avg position, top queries |
| **Shopify** (`monteiro-fabrics.myshopify.com`) | Admin GraphQL, **OAuth custom app (`read_orders`)** | **Live** — sample (€0) orders |
| **Sender** | Sender API | **Live** — subscribers (2,668) |
| **Notion** | Notion API | Token set — per-month page id → narrative sync |
| **Meta** (Instagram/Facebook) | Graph API | Pending token |
| **LinkedIn / Pinterest** | Manual entry (admin form) | By design (no clean API) |
| Google Ads leads | — | Phase 2 |

# Report structure

Five sections, each showing value + MoM delta + trend sparkline + Notion commentary:
**Headline / Hero** (default: organic-search sessions) → **Website & SEO** (GA4 + Search Console,
channel breakdown) → **Social** (IG + LinkedIn) → **Leads & email** (de-duplicated list, Sender
downloads, Shopify sample orders) → **What we did & what's next**. Editorial, PT, responsive; brand
blue `#2F519B`.

# Auth & access

Supabase **magic-link** (passwordless). A DB trigger provisions a profile only for allow-listed
emails (`invited_users`), so unknown emails see nothing. Roles: `viewer` (Ivana) and `admin`
(Viriato). Admin routes: publish flow, manual social entry, lead list + CSV export, source-runs log,
per-month refresh + Notion sync. Cron writes use the Supabase service role; admin actions use the
signed-in session under RLS.

# Automation

Vercel Cron `0 6 1 * *` → `/api/cron/pull` (protected by `CRON_SECRET`, which Vercel injects as a
Bearer header). Supports `?sources=ga4,gsc` for targeted runs (e.g. historical backfill, where
Shopify's 60-day window and Sender's current-only count would otherwise corrupt older months).

# Status

- **Live & backfilled:** April–June 2026 published, all three months carrying **real GA4 + Search
  Console** data (organic sessions Apr 1,077 · May 1,037 · Jun 1,130). Shopify + Sender live; monthly
  cron scheduled.
- **Pending (needs input):** enable admin login (add `https://monteiro-dashboard.vercel.app/**` to
  Supabase → Auth → URL Configuration); Meta token; add Ivana's email to `invited_users` as viewer.
- **Known gaps:** brand kit — only brand blue `#2F519B` is confirmed; MF logo + full palette not yet
  in the bundle ([Visual identity](/brand/visual-identity.md) is a stub), so the header uses a
  wordmark placeholder. The report is currently public (MVP); enforcing viewer-login is a later
  toggle (remove the anon read policies).

# Phase 2+ (from the brief)

PDF export/archive of a published month · paid-ads module (Google Ads + Meta) · social content
calendar + approvals · website work-log + feedback (surfacing [website/](/website/index.md)) ·
year-over-year once 12+ months exist · multi-client / white-label.

# Related

- Channels reported on: [Website](/channels/website.md) · [Email](/channels/email.md) ·
  [Instagram](/channels/instagram.md) · [LinkedIn](/channels/linkedin.md) · [Pinterest](/channels/pinterest.md).
- The live site work this reports against: [Website](/website/index.md).
- Brand: [Visual identity](/brand/visual-identity.md) (stub — logo/palette gap noted above).
- Chronological detail: [reporting log](/reporting/log.md).

# Citations

[1] Live app: https://monteiro-dashboard.vercel.app
[2] Repo (private): https://github.com/antonioviriatomkt/monteiro-dashboard
[3] Internal: `Monteiro-Dashboard-Developer-Brief.md` (APP root) and the Notion "Plan" page.
