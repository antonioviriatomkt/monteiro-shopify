-- Monteiro Fabrics — daily signal collectors (GSC, Shopify, Sender).
--
-- Project btlkcbilpsjtyiqwnsal is shared with the VA Properties portal. Everything here is NEW and
-- prefixed `signals_`; no existing table, function, policy or secret is altered.
--
-- Access model: RLS on, no policies → only service_role (Edge Functions) and postgres (pg_cron) can
-- read or write. Same pattern as public.emails_semanais.
--
-- Nothing is deleted at ingest. Rows that must not count are flagged (is_test / is_ucp /
-- is_shopify_sync). Flags are computed in SQL triggers, not in the collectors, so a rule change is a
-- function replace + `select public.signals_reflag()`.

-- ── Extensions ────────────────────────────────────────────────────────────────────────────────
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- ── GSC ───────────────────────────────────────────────────────────────────────────────────────
-- One row per date × page × query × country × device (searchType web, property
-- https://www.monteirofabrics.com/). Anonymised queries never appear at this grain, so the sum of
-- this table is below the GSC UI total — see signals_gsc_daily_totals.
create table public.signals_gsc_daily (
  date         date             not null,
  page         text             not null,
  query        text             not null,
  country      text             not null,  -- ISO 3166-1 alpha-3, lower case as GSC returns it
  device       text             not null,  -- DESKTOP | MOBILE | TABLET
  clicks       integer          not null,
  impressions  integer          not null,
  ctr          double precision not null,
  position     double precision not null,
  collected_at timestamptz      not null default now(),
  primary key (date, page, query, country, device)
);
comment on table public.signals_gsc_daily is
  'Monteiro Fabrics GSC by date×page×query×country×device. Written by Edge Function collect-gsc. Service role only.';

-- Property-level daily totals (date dimension only), which include anonymised queries and match the
-- GSC UI. One row per day; lets reports state true clicks next to the per-query breakdown.
create table public.signals_gsc_daily_totals (
  date         date             primary key,
  clicks       integer          not null,
  impressions  integer          not null,
  ctr          double precision not null,
  position     double precision not null,
  collected_at timestamptz      not null default now()
);
comment on table public.signals_gsc_daily_totals is
  'Monteiro Fabrics GSC property totals per day (match the GSC UI). Written by collect-gsc. Service role only.';

-- ── Shopify ───────────────────────────────────────────────────────────────────────────────────
create table public.signals_shopify_orders (
  order_id             bigint        primary key,          -- numeric part of gid://shopify/Order/…
  order_name           text          not null,             -- #mf1501
  created_at           timestamptz   not null,
  updated_at           timestamptz,
  cancelled_at         timestamptz,
  total                numeric(12,2) not null,
  currency             text,
  is_sample            boolean       generated always as (total = 0) stored,
  financial_status     text,
  source_name          text,
  tags                 text[]        not null default '{}',
  email                text,
  email_domain         text          generated always as (nullif(lower(split_part(email, '@', 2)), '')) stored,
  company              text,
  country              text,                               -- shipping country code, else billing
  line_items           jsonb         not null default '[]', -- [{title,quantity,sku,variant_title,product_handle,product_type,collections}]
  product_handles      text[]        not null default '{}',
  collections          text[]        not null default '{}', -- product collection handles as of collection time
  -- customerJourneySummary
  journey_ready        boolean,
  days_to_conversion   integer,
  moments_count        integer,
  first_visit_at           timestamptz,
  first_visit_source       text,
  first_visit_source_type  text,
  first_visit_landing_page text,
  first_visit_referrer_url text,
  first_visit_utm_source   text,
  first_visit_utm_medium   text,
  first_visit_utm_campaign text,
  first_visit_utm_term     text,
  first_visit_utm_content  text,
  last_visit_source        text,
  last_visit_landing_page  text,
  -- cart attributes written by snippets/posthog-events.liquid
  ph_distinct_id       text,
  ph_session_id        text,
  ph_referrer          text,
  ph_landing           text,
  ph_utm_source        text,
  ph_utm_medium        text,
  ph_utm_campaign      text,
  ph_utm_term          text,
  ph_utm_content       text,
  ph_gclid             text,
  cart_attributes      jsonb         not null default '{}', -- every custom attribute, ph_* or not
  shopify_test         boolean       not null default false,
  -- flags (set by trigger signals_flag_order)
  is_test              boolean       not null default false,
  is_ucp               boolean       not null default false,
  collected_at         timestamptz   not null default now()
);
create index signals_shopify_orders_created_at_idx on public.signals_shopify_orders (created_at);
comment on table public.signals_shopify_orders is
  'Monteiro Fabrics Shopify orders since 2025-02. Written by collect-shopify. Contains customer email: service role only.';

-- ── Sender ────────────────────────────────────────────────────────────────────────────────────
-- One row per subscriber × group: a person in both enzoW5 and dNYvDp is two lead events.
create table public.signals_sender_subscribers (
  subscriber_id   text        not null,
  group_id        text        not null check (group_id in ('enzoW5', 'dNYvDp')),
  email           text        not null,
  email_domain    text        generated always as (nullif(lower(split_part(email, '@', 2)), '')) stored,
  source          text,                    -- API | FORM | SHOPIFY | …
  created_at      timestamptz not null,
  company         text,
  country         text,
  email_status    text,
  is_test         boolean     not null default false,
  is_shopify_sync boolean     generated always as (upper(coalesce(source, '')) = 'SHOPIFY') stored,
  collected_at    timestamptz not null default now(),
  primary key (subscriber_id, group_id)
);
create index signals_sender_subscribers_created_at_idx on public.signals_sender_subscribers (created_at);
comment on table public.signals_sender_subscribers is
  'Monteiro Fabrics Sender subscribers in enzoW5 (contact form) and dNYvDp (technical file) since 2025-02. Written by collect-sender. Service role only.';

-- ── Runs ──────────────────────────────────────────────────────────────────────────────────────
create table public.signals_collector_runs (
  id          bigint generated always as identity primary key,
  source      text        not null check (source in ('gsc', 'shopify', 'sender')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  rows        integer,
  status      text        not null default 'running' check (status in ('running', 'ok', 'error')),
  error       text,
  params      jsonb       not null default '{}',  -- the exact window / query sent to the source
  details     jsonb       not null default '{}'   -- per-table counts, verification deltas
);
create index signals_collector_runs_source_started_idx on public.signals_collector_runs (source, started_at desc);
comment on table public.signals_collector_runs is
  'One row per collector invocation (Monteiro Fabrics signals). Service role only.';

-- ── Test identities ───────────────────────────────────────────────────────────────────────────
-- Values that mark a row as test data. Seeded outside this file: the repo is public and must not
-- carry email addresses.
create table public.signals_test_identities (
  kind  text not null check (kind in ('email', 'company')),
  value text not null check (value = lower(trim(value))),
  primary key (kind, value)
);
comment on table public.signals_test_identities is
  'Lower-cased emails / company names that flag signals_* rows as is_test. Service role only.';

alter table public.signals_gsc_daily          enable row level security;
alter table public.signals_gsc_daily_totals   enable row level security;
alter table public.signals_shopify_orders     enable row level security;
alter table public.signals_sender_subscribers enable row level security;
alter table public.signals_collector_runs     enable row level security;
alter table public.signals_test_identities    enable row level security;

-- ── Flags ─────────────────────────────────────────────────────────────────────────────────────
create function public.signals_is_test(p_email text, p_company text)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.signals_test_identities t
    where (t.kind = 'email'   and t.value = lower(trim(p_email)))
       or (t.kind = 'company' and t.value = lower(trim(p_company)))
  );
$$;

-- UCP / cart-link checkouts reach checkout without loading the storefront. Seen on orders as a first
-- visit that lands on a cart or checkout URL with no monteirofabrics.com referrer (#mf1504, #mf1521,
-- #mf1524 from shopify.com; #mf1506 straight onto /checkouts/cn/…), or as explicit ucp / cart_link_id
-- / /cart/<variant>:<qty> markers in the landing URL. No journey at all → not flagged (unknown).
create function public.signals_is_ucp(p_landing text, p_referrer text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(
    p_landing ~* '(ucp|cart_link_id|/cart/[0-9]+:[0-9]+)'
    or (
      p_landing ~* '^https?://[^/]+(/[a-z]{2}(-[a-z]{2})?)?/(cart/?($|\?)|checkouts/)'
      and coalesce(p_referrer, '') !~* 'monteirofabrics\.com'
    ),
    false);
$$;

create function public.signals_flag_order() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.is_test := new.shopify_test or public.signals_is_test(new.email, new.company);
  new.is_ucp  := public.signals_is_ucp(new.first_visit_landing_page, new.first_visit_referrer_url);
  return new;
end $$;

create function public.signals_flag_subscriber() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.is_test := public.signals_is_test(new.email, new.company);
  return new;
end $$;

create trigger signals_flag_order before insert or update on public.signals_shopify_orders
  for each row execute function public.signals_flag_order();
create trigger signals_flag_subscriber before insert or update on public.signals_sender_subscribers
  for each row execute function public.signals_flag_subscriber();

-- Re-apply the flag rules to every stored row (after editing a rule or signals_test_identities).
create function public.signals_reflag() returns jsonb
language plpgsql set search_path = '' as $$
declare o int; s int;
begin
  update public.signals_shopify_orders set order_id = order_id;
  get diagnostics o = row_count;
  update public.signals_sender_subscribers set subscriber_id = subscriber_id;
  get diagnostics s = row_count;
  return jsonb_build_object('orders', o, 'subscribers', s);
end $$;

-- ── Secrets ───────────────────────────────────────────────────────────────────────────────────
-- Values live only in Vault. The collectors read them through this RPC with the service-role key;
-- the allowlist keeps it from handing out any other secret in this shared project.
create function public.signals_get_secret(secret_name text)
returns text language sql stable security definer set search_path = '' as $$
  select ds.decrypted_secret
  from vault.decrypted_secrets ds
  where ds.name = secret_name
    and secret_name in (
      'gsc_service_account_json',
      'shopify_admin_token',
      'shopify_client_id',
      'shopify_client_secret',
      'sender_api_token',
      'signals_cron_key'
    );
$$;

-- Shared key between pg_cron and the Edge Functions (functions run with verify_jwt off and reject
-- any call without it). Generated here, never leaves the database.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'signals_cron_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'signals_cron_key',
      'pg_cron → collect-* Edge Functions (Monteiro Fabrics signals)');
  end if;
end $$;

-- Fire-and-forget call to one collector. The function answers 202 at once and records its own run
-- in signals_collector_runs.
create function public.signals_invoke(fn text, body jsonb default '{}')
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  key text;
begin
  if fn not in ('collect-gsc', 'collect-shopify', 'collect-sender') then
    raise exception 'unknown collector %', fn;
  end if;
  select ds.decrypted_secret into key from vault.decrypted_secrets ds where ds.name = 'signals_cron_key';
  return net.http_post(
    url := 'https://btlkcbilpsjtyiqwnsal.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-signals-key', key),
    body := body,
    timeout_milliseconds := 10000
  );
end $$;

-- Supabase grants EXECUTE on new public functions to anon/authenticated by default: take it back.
revoke all on function public.signals_is_test(text, text)      from public, anon, authenticated;
revoke all on function public.signals_is_ucp(text, text)       from public, anon, authenticated;
revoke all on function public.signals_flag_order()             from public, anon, authenticated;
revoke all on function public.signals_flag_subscriber()        from public, anon, authenticated;
revoke all on function public.signals_reflag()                 from public, anon, authenticated;
revoke all on function public.signals_get_secret(text)         from public, anon, authenticated;
revoke all on function public.signals_invoke(text, jsonb)      from public, anon, authenticated;
grant execute on function public.signals_is_test(text, text)   to service_role;
grant execute on function public.signals_is_ucp(text, text)    to service_role;
grant execute on function public.signals_reflag()              to service_role;
grant execute on function public.signals_get_secret(text)      to service_role;

-- ── Schedule: 05:00 Europe/Lisbon, all year ───────────────────────────────────────────────────
-- pg_cron runs in UTC. Firing at 04:00 and 05:00 UTC and keeping only the run whose Lisbon hour is 5
-- follows the summer/winter change without editing the jobs.
select cron.schedule('signals-collect-gsc', '0 4,5 * * *',
  $$ select public.signals_invoke('collect-gsc') where extract(hour from now() at time zone 'Europe/Lisbon') = 5 $$);
select cron.schedule('signals-collect-shopify', '5 4,5 * * *',
  $$ select public.signals_invoke('collect-shopify') where extract(hour from now() at time zone 'Europe/Lisbon') = 5 $$);
select cron.schedule('signals-collect-sender', '10 4,5 * * *',
  $$ select public.signals_invoke('collect-sender') where extract(hour from now() at time zone 'Europe/Lisbon') = 5 $$);
