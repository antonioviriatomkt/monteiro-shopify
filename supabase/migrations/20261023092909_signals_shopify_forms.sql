-- Monteiro Fabrics — Shopify Forms contact-form submissions (Task 3 prerequisite).
--
-- The Shopify Forms app (inline block on /pages/faq-s, contact-form1, ORGATEC, tradeshow templates)
-- creates or updates a Shopify customer tagged `shopify-forms-278222` and writes the metafields
-- custom.message and custom.company. Decision 23/10: these contact forms are counted from Shopify,
-- never from the Sender mirror (enzoW5, source SHOPIFY), whose created_at is not the submission time.
--
-- Shopify keeps only the LATEST message per customer, so the key is (customer_id, submitted_at) with
-- submitted_at = custom.message.updatedAt: a new message from a known customer adds a row from the
-- next collector run on. The backfill (first run) can only see the latest submission per customer.
-- Customers with the tag but no message metafield are skipped by the collector.
--
-- Written by the second phase of Edge Function collect-shopify (same cron, same run row).
-- Everything here is NEW and prefixed `signals_`; signals_reflag() is replaced to include the table.

create table public.signals_shopify_form_submissions (
  customer_id         bigint      not null,               -- numeric part of gid://shopify/Customer/…
  submitted_at        timestamptz not null,               -- custom.message updatedAt
  email               text,
  email_domain        text        generated always as (nullif(lower(split_part(email, '@', 2)), '')) stored,
  company             text,                               -- custom.company, else default address company
  country             text,                               -- default address country code
  message             text,                               -- custom.message as of collection time
  customer_created_at timestamptz,
  tags                text[]      not null default '{}',
  is_test             boolean     not null default false, -- set by trigger signals_flag_form_submission
  collected_at        timestamptz not null default now(),
  primary key (customer_id, submitted_at)
);
create index signals_shopify_form_submissions_submitted_at_idx
  on public.signals_shopify_form_submissions (submitted_at);
comment on table public.signals_shopify_form_submissions is
  'Monteiro Fabrics Shopify Forms submissions (customers tag:shopify-forms-278222), one row per submission seen; history builds forward from 2026-10-23, backfill = latest per customer. Written by collect-shopify. Contains email and message: service role only.';

alter table public.signals_shopify_form_submissions enable row level security;
revoke all on public.signals_shopify_form_submissions from anon, authenticated;

create function public.signals_flag_form_submission() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.is_test := public.signals_is_test(new.email, new.company);
  return new;
end $$;

create trigger signals_flag_form_submission before insert or update on public.signals_shopify_form_submissions
  for each row execute function public.signals_flag_form_submission();

-- Re-apply the flag rules to every stored row (after editing a rule or signals_test_identities).
create or replace function public.signals_reflag() returns jsonb
language plpgsql set search_path = '' as $$
declare o int; s int; f int;
begin
  update public.signals_shopify_orders set order_id = order_id;
  get diagnostics o = row_count;
  update public.signals_sender_subscribers set subscriber_id = subscriber_id;
  get diagnostics s = row_count;
  update public.signals_shopify_form_submissions set customer_id = customer_id;
  get diagnostics f = row_count;
  return jsonb_build_object('orders', o, 'subscribers', s, 'form_submissions', f);
end $$;

revoke all on function public.signals_flag_form_submission() from public, anon, authenticated;
revoke all on function public.signals_reflag()               from public, anon, authenticated;
grant execute on function public.signals_reflag()            to service_role;
