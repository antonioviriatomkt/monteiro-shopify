-- Task 3 of the Monteiro Fabrics agent system: deterministic rules + pulse.
-- APPLIED 2026-10-23 (version 20261023094317) via the Supabase connector. The applied text is this
-- file with most comments trimmed; objects and logic are identical.
--
-- Reads the Task 2 tables (signals_gsc_daily, signals_gsc_daily_totals, signals_shopify_orders,
-- signals_sender_subscribers, signals_collector_runs). Everything here is NEW and prefixed
-- `signals_`; nothing existing in project btlkcbilpsjtyiqwnsal is altered.
--
-- Shape:
--   signals_rules                 one row per rule: threshold params + severity (tune with UPDATE)
--   signals_free_email_domains    deployed copy of FREE in scripts/leads-lib.mjs (never edited here)
--   signals_leads                 one row per lead event, with the reason it does not count
--   signals_leads_daily/_weekly   counts
--   signals_gsc_totals_rolling    7-day windows vs trailing 28 days, per final GSC day
--   signals_gsc_page_movers       28 d vs prior 28 d, pages      (weekly pulse)
--   signals_gsc_query_movers      28 d vs prior 28 d, queries    (weekly pulse)
--   signals_collector_health      last run / last ok / rows per collector
--   signals_detect()              05:30 Lisbon (pg_cron): opens/updates/resolves signals_flags,
--                                 records first sight of each lead event in signals_leads_seen
--   signals_pulse_prepare(kind)   builds + stores the daily/weekly payload; noop flag for daily
--   signals_pulse_ack(run_id)     marks what that payload reported as delivered
--
-- Access model as in Task 2: RLS on, no policies, views security_invoker, EXECUTE revoked from
-- anon/authenticated → service_role (Edge Functions) and postgres (pg_cron, connector) only.

-- ── Rules ─────────────────────────────────────────────────────────────────────────────────────
-- Thresholds are data, not code: change one with an UPDATE, no migration. Justification of each
-- value (from the backfill, Feb 2025 – Oct 2026) is in the vault task note.
-- Severity decides delivery: critical/warn wake the daily pulse; info waits for the weekly one.
create table public.signals_rules (
  rule        text    primary key,
  title       text    not null,
  severity    text    not null check (severity in ('critical', 'warn', 'info')),
  params      jsonb   not null default '{}',
  enabled     boolean not null default true,
  description text    not null
);
comment on table public.signals_rules is
  'Monteiro Fabrics detection rules: thresholds + severity. Read by signals_detect / pulse. Service role only.';

insert into public.signals_rules (rule, title, severity, params, description) values
  ('L1', 'New corporate-domain lead', 'info', '{}',
   'A corporate-domain lead event seen for the first time. info = listed in the weekly pulse (the daily Notion job already lists leads); set to warn to wake the daily pulse on every lead.'),
  ('L2', 'Lead drought', 'warn', '{"days": 10}',
   'No corporate-domain lead for N days. Gap between lead days since Feb 2025 (recomputed 23/10 with the Shopify Forms branch): p95 6 d, p99 7 d, max 15 d; ≥10 d twice in 20 months (Jul 2025, Christmas 2025).'),
  ('L3', 'Lead drop, 28 days', 'warn', '{"ratio": 0.6, "baseline_days": 84}',
   'Corporate-domain leads in the last 28 d ≤ ratio × the 28-day rate of the 84 d before. Recomputed 23/10 with the Shopify Forms branch: ratio p2 = 0.38, p5 = 0.60; ≤0.6 on 26 of 515 days, all one episode (18/07–12/08/2025); 1.29 on 22/10/2026.'),
  ('L4', 'Lead source silent', 'warn', '{"sample": 12, "technical_file": 21, "contact_form": 15}',
   'No event at all (corporate or not; test/UCP/sample echoes/Shopify-sync rows ignored) from a source for N days — form or checkout possibly broken. Longest gaps: samples 15 d (once, Jul 2025), technical file 20 d. contact_form (Worker + Sender form + Shopify Forms) since Jul 2025: gap p99 11.6 d, max 14 d (once) → 15 d. Shopify Forms history is latest-message-per-customer, so past gaps are if anything overstated.'),
  ('G1', 'GSC clicks drop, 7 days', 'warn', '{"ratio": -0.25, "min_abs": 30}',
   '7-day clicks vs the average week of the 28 d before. p2 = −22 %; ≤−25 % on 4 of 217 days (Easter 2026). min_abs keeps small weeks quiet.'),
  ('G2', 'GSC impressions drop, 7 days', 'warn', '{"ratio": -0.20}',
   '7-day impressions vs the average week of the 28 d before. p2 = −16 %; never ≤−20 % since Mar 2026.'),
  ('G3', 'GSC impressions collapse, 1 day', 'critical', '{"ratio": -0.30}',
   'One final day vs the median of the same weekday over the 4 weeks before. Never below −25 % since Mar 2026: this is a breakage detector (deindexing, robots, redirect loop).'),
  ('G4', 'GSC clicks surge, 7 days', 'info', '{"ratio": 0.30}',
   '7-day clicks vs the average week of the 28 d before. p98 = +23 %.'),
  ('M1', 'Page movers', 'info', '{"min_impressions": 100, "min_abs": 100, "factor": 2}',
   'Pages whose impressions doubled or halved (and moved ≥ min_abs) 28 d vs prior 28 d. 3–9 pages per window since Jun 2026. Query-grain data: ~44 % of impressions, ~20 % of clicks.'),
  ('M2', 'Query position movers', 'info', '{"min_impressions": 50, "min_positions": 3}',
   'Queries with ≥ min_impressions in both windows whose average position moved ≥ min_positions. 2–5 per window.'),
  ('M3', 'New / lost queries', 'info', '{"min_impressions": 30}',
   'Queries with ≥ min_impressions in one window and none in the other. 0–6 new, 0–2 lost per window.'),
  ('H1', 'Collector did not run', 'critical', '{"after": "05:30"}',
   'No ok run of a collector since today 05:00 Lisbon when detect runs (05:30). Runs take 1–15 s.'),
  ('H2', 'Collector error', 'warn', '{"hours": 24}',
   'Any run with status error, or still running after 30 min, in the last N hours.'),
  ('H3', 'GSC data stale', 'warn', '{"max_lag_days": 4}',
   'Latest final GSC day older than today − N. Normal lag is 3 days.'),
  ('H4', 'Collector rows anomaly', 'warn', '{"gsc_ratio": 0.5}',
   'Sender full scan returned fewer rows than the previous ok run (rows only grow), or a scheduled GSC run returned < ratio × the median of the last 7.'),
  ('H5', 'Free-email blocklist missing', 'critical', '{"min_domains": 50}',
   'signals_free_email_domains has fewer than N rows — every free-mail lead would count. Run scripts/sync-free-email-domains.mjs.'),
  ('H6', 'pg_cron job failed', 'warn', '{"hours": 24}',
   'A signals-* pg_cron job ended failed in the last N hours.');

-- ── Free-email blocklist ─────────────────────────────────────────────────────────────────────
-- The list is owned by scripts/leads-lib.mjs (FREE). This table is its deployed copy and is only
-- ever written by signals_set_free_email_domains(), whose call is generated by
--   node scripts/sync-free-email-domains.mjs            (prints the SQL to run)
-- Drift check: `node scripts/sync-free-email-domains.mjs --fingerprint` must equal
--   select public.signals_free_email_domains_fingerprint();
-- (md5 of the sorted domains joined by "\n", byte order). The weekly pulse compares the two.
create table public.signals_free_email_domains (
  domain    text        primary key check (domain = lower(trim(domain)) and domain like '%_._%'),
  synced_at timestamptz not null default now()
);
comment on table public.signals_free_email_domains is
  'Deployed copy of FREE in scripts/leads-lib.mjs. Write only via signals_set_free_email_domains(). Service role only.';

create function public.signals_free_email_domains_fingerprint() returns text
language sql stable set search_path = '' as $$
  select md5(coalesce(string_agg(domain, E'\n' order by domain collate "C"), ''))
  from public.signals_free_email_domains;
$$;

create function public.signals_set_free_email_domains(p_domains text[]) returns jsonb
language plpgsql set search_path = '' as $$
declare n int;
begin
  if coalesce(cardinality(p_domains), 0) < 50 then
    raise exception 'refusing to replace the blocklist with % domains', coalesce(cardinality(p_domains), 0);
  end if;
  delete from public.signals_free_email_domains where true;
  insert into public.signals_free_email_domains (domain)
    select distinct lower(trim(d)) from unnest(p_domains) d where trim(d) <> '';
  get diagnostics n = row_count;
  return jsonb_build_object('domains', n, 'fingerprint', public.signals_free_email_domains_fingerprint());
end $$;

-- Same contract as professionalDomain() in leads-lib.mjs: lower/trim, text after the last '@',
-- must contain a dot, must not be on the blocklist. Returns the domain or null.
create function public.signals_professional_domain(p_email text) returns text
language sql stable set search_path = '' as $$
  select case
           when x.d like '%.%'
            and not exists (select 1 from public.signals_free_email_domains f where f.domain = x.d)
           then x.d
         end
  from (select nullif(regexp_replace(e, '^.*@', ''), e) as d
        from (select lower(trim(coalesce(p_email, ''))) as e) y) x;
$$;

-- ── Leads ─────────────────────────────────────────────────────────────────────────────────────
-- One row per lead event, counted or not. excluded_reason is null when the event counts as a
-- corporate-domain lead. This is the deterministic pre-filter only: "Qualificada" in the vault
-- (reporting/definicoes §1.3, business fit checked on the company site) stays a human/Notion call.
-- Rules = scripts/filter-orders.mjs + pull-leads.mjs + reporting/definicoes §1.1 + Task 2 flags:
--   samples       €0 order, not test, not UCP, not tagged auto-cancel-personal-email, professional
--                 domain. Cancelled orders without the tag still count (as filter-orders.mjs).
--   contact form  enzoW5, not test, NOT a sample echo, and source API (Worker contact-to-sender,
--                 contact page since 02/10) or FORM (Sender-hosted form). Every source=SHOPIFY row
--                 is excluded as shopify_sync: Shopify writes one into enzoW5 for every new Shopify
--                 customer. Review 23/10 of the 249 non-echo SHOPIFY rows: 144 are Shopify Forms
--                 app submissions (tag shopify-forms-278222, metafield custom.message — the inline
--                 form on /pages/faq-s, contact-form1, ORGATEC, tradeshow) = REAL contact forms;
--                 105 are newsletter / account registration / other = sign-ups, a lead type on hold.
--                 The Shopify Forms ones must be counted from Shopify, not from Sender (56 of 205
--                 submitters since 2025 never reached enzoW5 as SHOPIFY rows, and Sender's
--                 created_at is not the submission time): PREREQUISITE before applying = a Shopify
--                 Forms collector — DONE 23/10 (signals_shopify_form_submissions, collect-shopify
--                 phase 2) — and the third branch below (added 23/10). Known gaps: the Worker
--                 upserts (existing subscriber → missed); Shopify keeps only the latest message.
--   tech. file    dNYvDp, not test, professional domain. A TF download + a sample are two events.
--   all           internal domains (monteirofabrics.com, viriato.com.pt) never count (§1.1); team
--                 personal addresses go in signals_test_identities (DB only, never in this repo).
-- No dedupe by domain (CLAUDE.md: one company legitimately appears several times).
-- No email column: the pulse works on domain / company, which is all it needs to report.
create view public.signals_leads with (security_invoker = true) as
select 'shopify:' || o.order_id                          as event_key,
       'sample'::text                                    as source,
       o.created_at                                      as occurred_at,
       (o.created_at at time zone 'Europe/Lisbon')::date as day,
       public.signals_professional_domain(o.email)       as domain,
       o.email_domain                                    as raw_domain,
       o.company,
       o.country,
       o.order_name,
       o.collections,
       o.first_visit_source,
       o.first_visit_utm_source,
       o.first_visit_utm_campaign,
       o.first_visit_landing_page,
       o.cancelled_at is not null                        as cancelled,
       case
         when o.is_test                                     then 'test'
         when not o.is_sample                               then 'not_sample'
         when o.is_ucp                                      then 'ucp'
         when 'auto-cancel-personal-email' = any (o.tags)   then 'auto_cancel_personal_email'
         when public.signals_professional_domain(o.email) is null then 'free_or_invalid_email'
         when public.signals_professional_domain(o.email) in ('monteirofabrics.com', 'viriato.com.pt') then 'internal'
       end                                               as excluded_reason
from public.signals_shopify_orders o
union all
select 'sender:' || s.group_id || ':' || s.subscriber_id,
       case s.group_id when 'dNYvDp' then 'technical_file' else 'contact_form' end,
       s.created_at,
       (s.created_at at time zone 'Europe/Lisbon')::date,
       public.signals_professional_domain(s.email),
       s.email_domain,
       s.company,
       s.country,
       null, null, null, null, null, null,
       false,
       case
         when s.is_test                                     then 'test'
         when s.group_id = 'enzoW5' and exists (
                select 1 from public.signals_shopify_orders o
                where lower(o.email) = lower(s.email)
                  and o.created_at between s.created_at - interval '10 minutes'
                                       and s.created_at + interval '10 minutes')
                                                            then 'sample_echo'
         when s.group_id = 'enzoW5' and coalesce(s.source, '') not in ('API', 'FORM')
                                                            then 'shopify_sync'
         when public.signals_professional_domain(s.email) is null then 'free_or_invalid_email'
         when public.signals_professional_domain(s.email) in ('monteirofabrics.com', 'viriato.com.pt') then 'internal'
       end
from public.signals_sender_subscribers s
union all
-- Shopify Forms contact form, read from Shopify (signals_shopify_form_submissions, collect-shopify
-- phase 2, live 23/10). One event per (customer, message updatedAt): backfill = latest per customer.
select 'shopify_forms:' || f.customer_id || ':' || to_char(f.submitted_at at time zone 'UTC', 'YYYYMMDD"T"HH24MISS'),
       'contact_form',
       f.submitted_at,
       (f.submitted_at at time zone 'Europe/Lisbon')::date,
       public.signals_professional_domain(f.email),
       f.email_domain,
       f.company,
       f.country,
       null, null, null, null, null, null,
       false,
       case
         when f.is_test                                     then 'test'
         when public.signals_professional_domain(f.email) is null then 'free_or_invalid_email'
         when public.signals_professional_domain(f.email) in ('monteirofabrics.com', 'viriato.com.pt') then 'internal'
       end
from public.signals_shopify_form_submissions f;
comment on view public.signals_leads is
  'Monteiro Fabrics lead events (samples, contact form, technical file); excluded_reason null = corporate-domain lead.';

create view public.signals_leads_daily with (security_invoker = true) as
select day, source,
       count(*) filter (where excluded_reason is null) as corporate,
       count(*)                                        as events
from public.signals_leads
group by day, source;

-- ISO weeks (Monday), Lisbon time. by_reason shows what was dropped and why.
create view public.signals_leads_weekly with (security_invoker = true) as
with x as (
  select date_trunc('week', day)::date as week, source,
         coalesce(excluded_reason, 'counted') as reason, count(*) as n
  from public.signals_leads
  group by 1, 2, 3
)
select x.week,
       coalesce(sum(x.n) filter (where x.reason = 'counted'), 0)                              as corporate,
       coalesce(sum(x.n) filter (where x.reason = 'counted' and x.source = 'sample'), 0)         as corporate_samples,
       coalesce(sum(x.n) filter (where x.reason = 'counted' and x.source = 'technical_file'), 0) as corporate_technical_file,
       coalesce(sum(x.n) filter (where x.reason = 'counted' and x.source = 'contact_form'), 0)   as corporate_contact_form,
       sum(x.n)                                                                                 as events,
       (select jsonb_object_agg(y.reason, y.n)
        from (select x2.reason, sum(x2.n) as n from x x2
              where x2.week = x.week and x2.reason <> 'counted' group by x2.reason) y)         as by_reason
from x
group by x.week;

-- First sight of each lead event, written by signals_detect(). This — not created_at — decides
-- what is "new": Sender's created_at is the subscriber's creation, so a known contact who downloads
-- a technical file later would otherwise look old.
create table public.signals_leads_seen (
  event_key     text        primary key,
  first_seen_at timestamptz not null default now(),
  notified_at   timestamptz             -- set by signals_pulse_ack()
);
comment on table public.signals_leads_seen is
  'When signals_detect() first saw each lead event, and when a pulse reported it. Service role only.';

-- Backfill is history, not news.
insert into public.signals_leads_seen (event_key, first_seen_at, notified_at)
select event_key, now(), now() from public.signals_leads;

-- ── GSC ───────────────────────────────────────────────────────────────────────────────────────
-- Property totals (incl. anonymised queries) — the only GSC table that matches the UI. All alerts
-- on traffic level use this, never signals_gsc_daily.
create view public.signals_gsc_totals_rolling with (security_invoker = true) as
with w as (
  select t.date, t.clicks, t.impressions,
         sum(t.clicks)      over r7  as clicks_7d,
         sum(t.impressions) over r7  as impressions_7d,
         sum(t.clicks)      over b28 / 4.0 as clicks_week_base,
         sum(t.impressions) over b28 / 4.0 as impressions_week_base,
         count(*)           over r35 as days_in_window
  from public.signals_gsc_daily_totals t
  window r7  as (order by t.date range between '6 days'::interval preceding and current row),
         b28 as (order by t.date range between '34 days'::interval preceding and '7 days'::interval preceding),
         r35 as (order by t.date range between '34 days'::interval preceding and current row)
)
select w.*,
       w.clicks_7d      / nullif(w.clicks_week_base, 0)      - 1 as clicks_7d_change,
       w.impressions_7d / nullif(w.impressions_week_base, 0) - 1 as impressions_7d_change,
       wd.impressions_weekday_median,
       w.impressions / nullif(wd.impressions_weekday_median, 0) - 1 as impressions_day_change,
       w.days_in_window = 35 as complete
from w
cross join lateral (
  select percentile_cont(0.5) within group (order by p.impressions) as impressions_weekday_median
  from public.signals_gsc_daily_totals p
  where p.date in (w.date - 7, w.date - 14, w.date - 21, w.date - 28)
) wd;

-- Movers compare the 28 final days up to the latest final GSC day with the 28 before. They read the
-- query-grain table, so they describe visible queries only (~44 % of impressions, ~20 % of clicks).
create view public.signals_gsc_page_movers with (security_invoker = true) as
with a as (select max(date) as anchor from public.signals_gsc_daily_totals),
     r as (select params from public.signals_rules where rule = 'M1' and enabled),
     p as (
  select g.page,
         coalesce(sum(g.impressions) filter (where g.date >  a.anchor - 28), 0) as impressions_cur,
         coalesce(sum(g.impressions) filter (where g.date <= a.anchor - 28), 0) as impressions_prev,
         coalesce(sum(g.clicks)      filter (where g.date >  a.anchor - 28), 0) as clicks_cur,
         coalesce(sum(g.clicks)      filter (where g.date <= a.anchor - 28), 0) as clicks_prev
  from public.signals_gsc_daily g, a
  where g.date > a.anchor - 56 and g.date <= a.anchor
  group by g.page
)
select a.anchor, p.*,
       p.impressions_cur - p.impressions_prev as impressions_delta,
       case when p.impressions_prev = 0 then 'new'
            when p.impressions_cur  = 0 then 'gone'
            when p.impressions_cur > p.impressions_prev then 'up' else 'down' end as direction
from p, a, r
where greatest(p.impressions_cur, p.impressions_prev) >= (r.params->>'min_impressions')::int
  and abs(p.impressions_cur - p.impressions_prev)     >= (r.params->>'min_abs')::int
  and (p.impressions_cur >= (r.params->>'factor')::numeric * p.impressions_prev
       or p.impressions_prev >= (r.params->>'factor')::numeric * p.impressions_cur);

create view public.signals_gsc_query_movers with (security_invoker = true) as
with a  as (select max(date) as anchor from public.signals_gsc_daily_totals),
     r2 as (select params from public.signals_rules where rule = 'M2' and enabled),
     r3 as (select params from public.signals_rules where rule = 'M3' and enabled),
     q  as (
  select g.query,
         coalesce(sum(g.impressions) filter (where g.date >  a.anchor - 28), 0) as impressions_cur,
         coalesce(sum(g.impressions) filter (where g.date <= a.anchor - 28), 0) as impressions_prev,
         coalesce(sum(g.clicks)      filter (where g.date >  a.anchor - 28), 0) as clicks_cur,
         coalesce(sum(g.clicks)      filter (where g.date <= a.anchor - 28), 0) as clicks_prev,
         sum(g.position * g.impressions) filter (where g.date >  a.anchor - 28)
           / nullif(sum(g.impressions) filter (where g.date >  a.anchor - 28), 0) as position_cur,
         sum(g.position * g.impressions) filter (where g.date <= a.anchor - 28)
           / nullif(sum(g.impressions) filter (where g.date <= a.anchor - 28), 0) as position_prev
  from public.signals_gsc_daily g, a
  where g.date > a.anchor - 56 and g.date <= a.anchor
  group by g.query
)
select a.anchor, 'position'::text as kind, q.*
from q, a, r2
where least(q.impressions_cur, q.impressions_prev) >= (r2.params->>'min_impressions')::int
  and abs(q.position_cur - q.position_prev)        >= (r2.params->>'min_positions')::numeric
union all
select a.anchor, case when q.impressions_prev = 0 then 'new' else 'lost' end, q.*
from q, a, r3
where (q.impressions_prev = 0 and q.impressions_cur  >= (r3.params->>'min_impressions')::int)
   or (q.impressions_cur  = 0 and q.impressions_prev >= (r3.params->>'min_impressions')::int);

-- ── Collector health ──────────────────────────────────────────────────────────────────────────
-- Scheduled runs have params = {}; backfills and manual windows are excluded from row baselines.
create view public.signals_collector_health with (security_invoker = true) as
with src(source) as (values ('gsc'), ('shopify'), ('sender')),
     today as (select ((now() at time zone 'Europe/Lisbon')::date + time '05:00') at time zone 'Europe/Lisbon' as t0)
select s.source,
       last.started_at                                   as last_run_at,
       last.status                                       as last_status,
       last.error                                        as last_error,
       ok.started_at                                     as last_ok_at,
       ok.rows                                           as last_ok_rows,
       prev_ok.rows                                      as prev_ok_rows,
       base.median_rows_7                                as median_scheduled_rows_7,
       coalesce(ok.started_at >= today.t0, false)        as ran_today,
       round(extract(epoch from now() - ok.started_at) / 3600.0, 1) as hours_since_ok,
       (select count(*) from public.signals_collector_runs e
         where e.source = s.source and e.started_at > now() - interval '24 hours'
           and (e.status = 'error' or (e.status = 'running' and e.started_at < now() - interval '30 minutes'))
       )                                                 as problems_24h,
       case when s.source = 'gsc' then (select max(date) from public.signals_gsc_daily_totals) end
                                                         as gsc_latest_final_day
from src s
cross join today
left join lateral (select * from public.signals_collector_runs r where r.source = s.source
                   order by r.started_at desc limit 1) last on true
left join lateral (select * from public.signals_collector_runs r where r.source = s.source and r.status = 'ok'
                   order by r.started_at desc limit 1) ok on true
left join lateral (select * from public.signals_collector_runs r where r.source = s.source and r.status = 'ok'
                     and r.started_at < ok.started_at
                   order by r.started_at desc limit 1) prev_ok on true
left join lateral (select percentile_cont(0.5) within group (order by x.rows) as median_rows_7
                   from (select r.rows from public.signals_collector_runs r
                         where r.source = s.source and r.status = 'ok' and r.params = '{}'::jsonb
                         order by r.started_at desc limit 7) x) base on true;

-- ── Flags ─────────────────────────────────────────────────────────────────────────────────────
-- One row per episode: a condition opens a flag, keeps it updated while it holds, and resolves it
-- the first detect run it no longer holds. At most one open flag per (rule, subject).
create table public.signals_flags (
  id                   bigint generated always as identity primary key,
  rule                 text        not null references public.signals_rules (rule),
  subject              text        not null default '',   -- source / page / '' for property-wide
  severity             text        not null check (severity in ('critical', 'warn', 'info')),
  message              text        not null,
  metrics              jsonb       not null default '{}', -- the numbers that tripped it, latest run
  opened_at            timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  resolved_at          timestamptz,
  notified_at          timestamptz,                       -- opening reported by a pulse
  resolved_notified_at timestamptz                        -- resolution reported by a pulse
);
create unique index signals_flags_open_uidx on public.signals_flags (rule, subject) where resolved_at is null;
create index signals_flags_opened_idx on public.signals_flags (opened_at desc);
comment on table public.signals_flags is
  'Monteiro Fabrics detection episodes written by signals_detect(). Service role only.';

-- Every currently true condition, one row each. Pure read; signals_detect() persists it.
create function public.signals_conditions()
returns table (rule text, subject text, message text, metrics jsonb)
language sql stable set search_path = '' as $$
  with r as (select rule, params from public.signals_rules where enabled),
  qual as (select day from public.signals_leads where excluded_reason is null),
  today as (select (now() at time zone 'Europe/Lisbon')::date as d),
  gsc as (select * from public.signals_gsc_totals_rolling
          where date = (select max(date) from public.signals_gsc_daily_totals))
  -- L2 lead drought
  select 'L2', '', format('No corporate-domain lead for %s days (last: %s)', t.d - m.last_day, m.last_day),
         jsonb_build_object('last_day', m.last_day, 'days', t.d - m.last_day)
  from r, today t, (select max(day) as last_day from qual) m
  where r.rule = 'L2' and t.d - m.last_day >= (r.params->>'days')::int
  union all
  -- L3 28-day lead drop vs the 84 days before, scaled to 28
  select 'L3', '', format('%s corporate-domain leads in 28 days vs %s expected', c.cur, round(c.base, 1)),
         jsonb_build_object('last_28d', c.cur, 'expected_28d', round(c.base, 1), 'ratio', round(c.cur / nullif(c.base, 0), 2))
  from r cross join lateral (
         select count(*) filter (where q.day >  t.d - 28)::numeric as cur,
                count(*) filter (where q.day <= t.d - 28 and q.day > t.d - 28 - (r.params->>'baseline_days')::int)
                  * 28.0 / (r.params->>'baseline_days')::int as base
         from qual q, today t) c
  where r.rule = 'L3' and c.base > 0 and c.cur <= (r.params->>'ratio')::numeric * c.base
  union all
  -- L4 source silent (any event, corporate or not, except test / UCP / sample echo / Shopify sync)
  select 'L4', s.source, format('No %s event for %s days (last: %s)', s.source, t.d - s.last_day, s.last_day),
         jsonb_build_object('last_day', s.last_day, 'days', t.d - s.last_day)
  from r, today t,
       (select source, max(day) as last_day from public.signals_leads
        where coalesce(excluded_reason, '') not in ('test', 'ucp', 'sample_echo', 'internal', 'shopify_sync') group by source) s
  where r.rule = 'L4' and r.params ? s.source and t.d - s.last_day >= (r.params->>s.source)::int
  union all
  -- G1 / G4 clicks 7 d vs average week of the 28 d before
  select r.rule, '', format('GSC clicks %s %s%% (7 days to %s: %s vs %s/week)',
                            case when g.clicks_7d_change < 0 then 'down' else 'up' end,
                            round(abs(g.clicks_7d_change) * 100), g.date, g.clicks_7d, round(g.clicks_week_base)),
         jsonb_build_object('day', g.date, 'clicks_7d', g.clicks_7d, 'week_base', round(g.clicks_week_base, 1),
                            'change', round(g.clicks_7d_change::numeric, 3))
  from r, gsc g
  where g.complete and (
        (r.rule = 'G1' and g.clicks_7d_change <= (r.params->>'ratio')::numeric
                       and g.clicks_week_base - g.clicks_7d >= (r.params->>'min_abs')::int)
     or (r.rule = 'G4' and g.clicks_7d_change >= (r.params->>'ratio')::numeric))
  union all
  -- G2 impressions 7 d
  select 'G2', '', format('GSC impressions down %s%% (7 days to %s)', round(abs(g.impressions_7d_change) * 100), g.date),
         jsonb_build_object('day', g.date, 'impressions_7d', g.impressions_7d,
                            'week_base', round(g.impressions_week_base, 1), 'change', round(g.impressions_7d_change::numeric, 3))
  from r, gsc g
  where r.rule = 'G2' and g.complete and g.impressions_7d_change <= (r.params->>'ratio')::numeric
  union all
  -- G3 one-day impressions collapse vs same weekday
  select 'G3', '', format('GSC impressions on %s: %s vs weekday median %s', g.date, g.impressions, g.impressions_weekday_median),
         jsonb_build_object('day', g.date, 'impressions', g.impressions,
                            'weekday_median', g.impressions_weekday_median, 'change', round(g.impressions_day_change::numeric, 3))
  from r, gsc g
  where r.rule = 'G3' and g.impressions_day_change <= (r.params->>'ratio')::numeric
  union all
  -- H1 collector did not run today (only meaningful from 05:30 Lisbon)
  select 'H1', h.source, format('collect-%s has no ok run today (last ok %s)', h.source, h.last_ok_at),
         jsonb_build_object('last_ok_at', h.last_ok_at, 'last_status', h.last_status, 'last_error', h.last_error)
  from r, public.signals_collector_health h
  where r.rule = 'H1' and not h.ran_today
    and (now() at time zone 'Europe/Lisbon')::time >= (r.params->>'after')::time
  union all
  -- H2 errors / stuck runs
  select 'H2', h.source, format('collect-%s: %s failed or stuck run(s) in 24 h — %s', h.source, h.problems_24h, coalesce(h.last_error, '')),
         jsonb_build_object('problems_24h', h.problems_24h, 'last_error', h.last_error)
  from r, public.signals_collector_health h
  where r.rule = 'H2' and h.problems_24h > 0
  union all
  -- H3 GSC stale
  select 'H3', 'gsc', format('Latest final GSC day is %s (%s days old)', h.gsc_latest_final_day, t.d - h.gsc_latest_final_day),
         jsonb_build_object('latest_final_day', h.gsc_latest_final_day)
  from r, today t, public.signals_collector_health h
  where r.rule = 'H3' and h.source = 'gsc' and t.d - h.gsc_latest_final_day > (r.params->>'max_lag_days')::int
  union all
  -- H4 rows anomaly
  select 'H4', h.source, format('collect-%s returned %s rows (previous %s, median %s)', h.source, h.last_ok_rows, h.prev_ok_rows, h.median_scheduled_rows_7),
         jsonb_build_object('rows', h.last_ok_rows, 'prev_rows', h.prev_ok_rows, 'median_7', h.median_scheduled_rows_7)
  from r, public.signals_collector_health h
  where r.rule = 'H4' and (
        (h.source = 'sender' and h.last_ok_rows < h.prev_ok_rows)
     or (h.source = 'gsc' and h.last_ok_rows < (r.params->>'gsc_ratio')::numeric * h.median_scheduled_rows_7))
  union all
  -- H5 blocklist
  select 'H5', '', format('Free-email blocklist has %s domains', n.c), jsonb_build_object('domains', n.c)
  from r, (select count(*) as c from public.signals_free_email_domains) n
  where r.rule = 'H5' and n.c < (r.params->>'min_domains')::int;
$$;

-- Persist conditions as flag episodes and record first sight of lead events. Idempotent: run it
-- as often as you like. Called by pg_cron at 05:30 Lisbon, after the 05:00–05:10 collectors.
create function public.signals_detect() returns jsonb
language plpgsql set search_path = '' as $$
declare
  opened int; resolved int; seen int;
begin
  drop table if exists pg_temp._cur;  -- a second call in the same transaction
  create temp table _cur on commit drop as select * from public.signals_conditions();

  -- H6 needs the cron schema, which signals_conditions() keeps away from (it is also called by
  -- the pulse through the connector).
  insert into _cur (rule, subject, message, metrics)
  select 'H6', j.jobname, format('pg_cron %s failed: %s', j.jobname, left(d.return_message, 200)),
         jsonb_build_object('at', d.start_time)
  from cron.job_run_details d
  join cron.job j using (jobid)
  join public.signals_rules r on r.rule = 'H6' and r.enabled
  where j.jobname like 'signals-%' and d.status = 'failed'
    and d.start_time > now() - make_interval(hours => (r.params->>'hours')::int);
  -- one row per job even if it failed twice
  delete from _cur a using _cur b
  where a.rule = 'H6' and b.rule = 'H6' and a.subject = b.subject and a.ctid < b.ctid;

  insert into public.signals_flags (rule, subject, severity, message, metrics)
  select c.rule, c.subject, r.severity, c.message, c.metrics
  from _cur c join public.signals_rules r using (rule)
  on conflict (rule, subject) where resolved_at is null
  do update set severity = excluded.severity, message = excluded.message, metrics = excluded.metrics,
                last_seen_at = now();
  get diagnostics opened = row_count;

  update public.signals_flags f set resolved_at = now()
  where f.resolved_at is null
    and not exists (select 1 from _cur c where c.rule = f.rule and c.subject = f.subject);
  get diagnostics resolved = row_count;

  insert into public.signals_leads_seen (event_key)
  select event_key from public.signals_leads
  on conflict (event_key) do nothing;
  get diagnostics seen = row_count;

  return jsonb_build_object('conditions', (select count(*) from _cur), 'upserted', opened,
                            'resolved', resolved, 'new_lead_events', seen);
end $$;

-- ── Pulse ─────────────────────────────────────────────────────────────────────────────────────
-- The Claude task never computes a number: it calls signals_pulse_prepare(), writes the message
-- from the payload, delivers it, then calls signals_pulse_ack(run_id). Nothing is marked as
-- reported until the ack, so a failed delivery is retried the next day.
create table public.signals_pulse_runs (
  id           bigint generated always as identity primary key,
  kind         text        not null check (kind in ('daily', 'weekly')),
  prepared_at  timestamptz not null default now(),
  noop         boolean     not null,
  payload      jsonb       not null,
  delivered_at timestamptz,
  channel      text                     -- 'gmail' | 'none' (noop) — never an address
);
comment on table public.signals_pulse_runs is
  'Every pulse payload as prepared (reproducible record of what was reported). Service role only.';

create function public.signals_pulse_prepare(p_kind text) returns jsonb
language plpgsql set search_path = '' as $$
declare
  v_flags jsonb; v_resolved jsonb; v_leads jsonb; v_payload jsonb; v_noop boolean; v_id bigint;
  v_rank constant jsonb := '{"critical": 3, "warn": 2, "info": 1}';
  v_min int;  -- lowest severity rank that goes into this pulse
begin
  if p_kind not in ('daily', 'weekly') then raise exception 'kind must be daily or weekly'; end if;
  v_min := case p_kind when 'daily' then 2 else 1 end;

  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'rule', f.rule, 'title', r.title, 'severity', f.severity,
           'subject', f.subject, 'message', f.message, 'metrics', f.metrics, 'opened_at', f.opened_at,
           'resolved_at', f.resolved_at)   -- set when it opened and closed between two pulses
           order by (v_rank->>f.severity)::int desc, f.opened_at), '[]')
    into v_flags
  from public.signals_flags f join public.signals_rules r using (rule)
  where f.notified_at is null and (v_rank->>f.severity)::int >= v_min;

  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'rule', f.rule, 'subject', f.subject,
           'message', f.message, 'opened_at', f.opened_at, 'resolved_at', f.resolved_at) order by f.resolved_at), '[]')
    into v_resolved
  from public.signals_flags f
  where f.resolved_at is not null and f.resolved_notified_at is null and f.notified_at is not null
    and (v_rank->>f.severity)::int >= v_min;

  -- L1: new corporate-domain lead events. Only part of a pulse whose minimum severity they meet.
  select coalesce(jsonb_agg(jsonb_build_object('event_key', l.event_key, 'source', l.source, 'day', l.day,
           'domain', l.domain, 'company', l.company, 'country', l.country, 'order', l.order_name,
           'collections', l.collections, 'first_visit_source', l.first_visit_source,
           'utm_source', l.first_visit_utm_source, 'utm_campaign', l.first_visit_utm_campaign,
           'landing', l.first_visit_landing_page) order by l.occurred_at), '[]')
    into v_leads
  from public.signals_leads_seen s
  join public.signals_leads l using (event_key)
  join public.signals_rules r on r.rule = 'L1' and r.enabled
  where s.notified_at is null and l.excluded_reason is null and (v_rank->>r.severity)::int >= v_min;

  v_noop := p_kind = 'daily'
            and jsonb_array_length(v_flags) = 0 and jsonb_array_length(v_resolved) = 0
            and jsonb_array_length(v_leads) = 0;

  v_payload := jsonb_build_object(
    'kind', p_kind,
    'generated_at', now(),
    'noop', v_noop,
    'flags', v_flags,
    'resolved', v_resolved,
    'new_leads', v_leads,
    'health', (select jsonb_agg(to_jsonb(h) - 'last_error' || jsonb_build_object('last_error', left(h.last_error, 200)))
               from public.signals_collector_health h),
    'blocklist', jsonb_build_object('domains', (select count(*) from public.signals_free_email_domains),
                                    'fingerprint', public.signals_free_email_domains_fingerprint()));

  if p_kind = 'weekly' then
    v_payload := v_payload || jsonb_build_object(
      'leads_weeks', (select jsonb_agg(to_jsonb(w) order by w.week desc)
                      from (select * from public.signals_leads_weekly
                            where week >= date_trunc('week', now() at time zone 'Europe/Lisbon')::date - 63
                            order by week desc) w),
      'gsc', (select to_jsonb(g) from public.signals_gsc_totals_rolling g
              where g.date = (select max(date) from public.signals_gsc_daily_totals)),
      'open_flags', (select coalesce(jsonb_agg(jsonb_build_object('rule', f.rule, 'subject', f.subject,
                       'severity', f.severity, 'message', f.message, 'opened_at', f.opened_at)), '[]')
                     from public.signals_flags f where f.resolved_at is null),
      'page_movers', (select coalesce(jsonb_agg(to_jsonb(m) order by abs(m.impressions_delta) desc), '[]')
                      from (select * from public.signals_gsc_page_movers
                            order by abs(impressions_delta) desc limit 10) m),
      'query_movers', (select coalesce(jsonb_agg(to_jsonb(m)), '[]')
                       from (select * from public.signals_gsc_query_movers
                             order by greatest(impressions_cur, impressions_prev) desc limit 15) m));
  end if;

  insert into public.signals_pulse_runs (kind, noop, payload, delivered_at, channel)
  values (p_kind, v_noop, v_payload, case when v_noop then now() end, case when v_noop then 'none' end)
  returning id into v_id;

  return v_payload || jsonb_build_object('run_id', v_id);
end $$;

-- Mark exactly what run p_run_id reported as delivered.
create function public.signals_pulse_ack(p_run_id bigint, p_channel text default 'gmail') returns jsonb
language plpgsql set search_path = '' as $$
declare p jsonb; nf int; nr int; nl int;
begin
  update public.signals_pulse_runs set delivered_at = now(), channel = p_channel
  where id = p_run_id and delivered_at is null
  returning payload into p;
  if p is null then raise exception 'pulse run % not found or already delivered', p_run_id; end if;

  update public.signals_flags set notified_at = now()
  where notified_at is null and id in (select (e->>'id')::bigint from jsonb_array_elements(p->'flags') e);
  get diagnostics nf = row_count;

  update public.signals_flags set resolved_notified_at = now()
  where resolved_notified_at is null and id in (select (e->>'id')::bigint from jsonb_array_elements(p->'resolved') e);
  get diagnostics nr = row_count;

  update public.signals_leads_seen set notified_at = now()
  where notified_at is null and event_key in (select e->>'event_key' from jsonb_array_elements(p->'new_leads') e);
  get diagnostics nl = row_count;

  return jsonb_build_object('flags', nf, 'resolved', nr, 'leads', nl);
end $$;

-- ── Access ────────────────────────────────────────────────────────────────────────────────────
alter table public.signals_rules              enable row level security;
alter table public.signals_free_email_domains enable row level security;
alter table public.signals_leads_seen         enable row level security;
alter table public.signals_flags              enable row level security;
alter table public.signals_pulse_runs         enable row level security;

-- Supabase grants new public views and functions to anon/authenticated by default: take it back.
revoke all on public.signals_leads, public.signals_leads_daily, public.signals_leads_weekly,
              public.signals_gsc_totals_rolling, public.signals_gsc_page_movers,
              public.signals_gsc_query_movers, public.signals_collector_health
  from public, anon, authenticated;
grant select on public.signals_leads, public.signals_leads_daily, public.signals_leads_weekly,
                public.signals_gsc_totals_rolling, public.signals_gsc_page_movers,
                public.signals_gsc_query_movers, public.signals_collector_health
  to service_role;

revoke all on function public.signals_free_email_domains_fingerprint()   from public, anon, authenticated;
revoke all on function public.signals_set_free_email_domains(text[])     from public, anon, authenticated;
revoke all on function public.signals_professional_domain(text)          from public, anon, authenticated;
revoke all on function public.signals_conditions()                       from public, anon, authenticated;
revoke all on function public.signals_detect()                           from public, anon, authenticated;
revoke all on function public.signals_pulse_prepare(text)                from public, anon, authenticated;
revoke all on function public.signals_pulse_ack(bigint, text)            from public, anon, authenticated;
grant execute on function public.signals_free_email_domains_fingerprint() to service_role;
grant execute on function public.signals_professional_domain(text)        to service_role;
grant execute on function public.signals_conditions()                     to service_role;

-- ── Schedule: 05:30 Europe/Lisbon, after the collectors (05:00 / 05:05 / 05:10) ──────────────
select cron.schedule('signals-detect', '30 4,5 * * *',
  $$ select public.signals_detect() where extract(hour from now() at time zone 'Europe/Lisbon') = 5 $$);
