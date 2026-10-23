-- signals_probes — external probes for the MF control centre (collect-health, 05:15 Lisbon).
-- One row per probe per run: site + tracking tags, sitemap, contact-to-sender Worker, Shopify Admin
-- token, Sender token, report portal, PostHog theme events (optional). Access model as Task 2/3:
-- RLS on, no policies, view security_invoker, nothing for anon/authenticated.

alter table public.signals_collector_runs drop constraint signals_collector_runs_source_check;
alter table public.signals_collector_runs
  add constraint signals_collector_runs_source_check
  check (source in ('gsc', 'shopify', 'sender', 'health'));

create table public.signals_probes (
  id          bigint generated always as identity primary key,
  probed_at   timestamptz not null default now(),
  probe       text        not null,
  target      text        not null,
  ok          boolean     not null,
  status      integer,
  latency_ms  integer,
  value       numeric,
  detail      text
);
comment on table public.signals_probes is
  'Monteiro Fabrics external health probes written by collect-health (05:15 Lisbon). Service role only.';
create index signals_probes_probe_time on public.signals_probes (probe, probed_at desc);
alter table public.signals_probes enable row level security;
revoke all on table public.signals_probes from public, anon, authenticated;

-- Latest result per probe + how many of the last 7 runs failed.
create view public.signals_probes_latest with (security_invoker = true) as
select l.probe, l.target, l.ok, l.status, l.latency_ms, l.value, l.detail, l.probed_at,
       (select count(*) filter (where not x.ok) from (
          select ok from public.signals_probes y where y.probe = l.probe order by y.probed_at desc limit 7) x) as failed_of_last_7
from (select distinct on (probe) * from public.signals_probes order by probe, probed_at desc) l
order by l.ok, l.probe;
revoke all on public.signals_probes_latest from public, anon, authenticated;

-- Collector health view now also watches collect-health (H1/H2 cover it for free).
create or replace view public.signals_collector_health with (security_invoker = true) as
with src(source) as (values ('gsc'), ('shopify'), ('sender'), ('health')),
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

-- 05:15 Lisbon, same hour guard as the collectors.
select cron.schedule('signals-collect-health', '15 4,5 * * *',
  $$ select public.signals_invoke('collect-health') where extract(hour from now() at time zone 'Europe/Lisbon') = 5 $$);
