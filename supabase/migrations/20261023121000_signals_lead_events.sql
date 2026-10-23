-- signals_lead_events — leads written directly by the Cloudflare Worker contact-to-sender (v2, 23/10).
-- Replaces the Sender round-trip for the contact form: the Worker calls signals_ingest_lead() with a
-- shared key (Vault: signals_ingest_key) and the full submission + PostHog/UTM entry data. Sender keeps
-- getting a copy for marketing, but from the go-live timestamp the Sender enzoW5 'API' rows are
-- excluded in signals_leads as 'worker_mirror' so nothing is counted twice.
-- Access model as before: RLS on, no policies; the RPC is the only door (anon may EXECUTE it; the key
-- check happens inside, constant-time, and the body is capped).

create table public.signals_lead_events (
  id             bigint generated always as identity primary key,
  received_at    timestamptz not null default now(),
  kind           text        not null check (kind in ('contact_form', 'technical_file', 'other')),
  email          text        not null,
  email_domain   text        generated always as (lower(split_part(email, '@', 2))) stored,
  name           text,
  company        text,
  country        text,
  sector         text,
  phone          text,
  message        text,
  page           text,
  locale         text,
  ph_distinct_id text,
  ph_session_id  text,
  ph_utm_source  text,
  ph_utm_medium  text,
  ph_utm_campaign text,
  ph_utm_term    text,
  ph_utm_content text,
  ph_gclid       text,
  ph_referrer    text,
  ph_landing     text,
  ip_country     text,
  user_agent     text,
  raw            jsonb       not null,
  is_test        boolean     not null default false
);
comment on table public.signals_lead_events is
  'Monteiro Fabrics lead submissions received straight from the contact-to-sender Worker (contact form; technical file later). Service role only.';
create index signals_lead_events_received on public.signals_lead_events (received_at desc);
create index signals_lead_events_email on public.signals_lead_events (lower(email));
alter table public.signals_lead_events enable row level security;
revoke all on table public.signals_lead_events from public, anon, authenticated;

-- is_test like the other tables: team identities + "TEST" marker.
create or replace function public.signals_lead_events_flag() returns trigger
language plpgsql set search_path to '' as $$
begin
  new.is_test := exists (select 1 from public.signals_test_identities t
                         where lower(t.email) = lower(new.email))
                 or coalesce(new.company, '') ilike '%TEST%'
                 or coalesce(new.name, '') ilike '%TEST%';
  return new;
end $$;
create trigger signals_lead_events_flag before insert or update on public.signals_lead_events
  for each row execute function public.signals_lead_events_flag();

-- The door. Returns the new id; raises on a bad key or body.
create or replace function public.signals_ingest_lead(key text, payload jsonb)
 returns bigint language plpgsql security definer set search_path to ''
as $function$
declare
  expected text;
  v_email  text;
  v_kind   text;
  new_id   bigint;
begin
  select ds.decrypted_secret into expected from vault.decrypted_secrets ds where ds.name = 'signals_ingest_key';
  if expected is null or key is null or length(key) <> length(expected)
     or encode(extensions.digest(key, 'sha256'), 'hex') <> encode(extensions.digest(expected, 'sha256'), 'hex') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if pg_column_size(payload) > 16384 then
    raise exception 'payload too large';
  end if;
  v_email := lower(trim(payload->>'email'));
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'bad email';
  end if;
  v_kind := coalesce(payload->>'kind', 'contact_form');
  if v_kind not in ('contact_form', 'technical_file', 'other') then v_kind := 'other'; end if;

  insert into public.signals_lead_events
    (kind, email, name, company, country, sector, phone, message, page, locale,
     ph_distinct_id, ph_session_id, ph_utm_source, ph_utm_medium, ph_utm_campaign, ph_utm_term, ph_utm_content,
     ph_gclid, ph_referrer, ph_landing, ip_country, user_agent, raw)
  values
    (v_kind, v_email,
     left(payload->>'name', 120), left(payload->>'company', 200), left(payload->>'country', 100),
     left(payload->>'sector', 100), left(payload->>'phone', 40), left(payload->>'message', 4000),
     left(payload->>'page', 300), left(payload->>'locale', 10),
     left(payload->>'ph_distinct_id', 120), left(payload->>'ph_session_id', 120),
     left(payload->>'ph_utm_source', 200), left(payload->>'ph_utm_medium', 200), left(payload->>'ph_utm_campaign', 200),
     left(payload->>'ph_utm_term', 200), left(payload->>'ph_utm_content', 200), left(payload->>'ph_gclid', 200),
     left(payload->>'ph_referrer', 200), left(payload->>'ph_landing', 300),
     left(payload->>'ip_country', 8), left(payload->>'user_agent', 300),
     payload - 'user_agent')
  returning id into new_id;
  return new_id;
end $function$;
revoke all on function public.signals_ingest_lead(text, jsonb) from public;
grant execute on function public.signals_ingest_lead(text, jsonb) to anon, service_role;

-- Shared key (value read by António in Supabase → Vault, pasted as the Worker secret SUPABASE_INGEST_KEY).
select vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'signals_ingest_key',
                           'contact-to-sender Worker → signals_ingest_lead()');

-- signals_get_secret may serve it to Edge Functions too (collect-health could probe the door later).
create or replace function public.signals_get_secret(secret_name text)
 returns text language sql stable security definer set search_path to ''
as $function$
  select ds.decrypted_secret
  from vault.decrypted_secrets ds
  where ds.name = secret_name
    and secret_name in (
      'gsc_service_account_json', 'shopify_admin_token', 'shopify_client_id', 'shopify_client_secret',
      'sender_api_token', 'signals_cron_key', 'posthog_personal_api_key', 'signals_ingest_key'
    );
$function$;

-- Go-live marker for the view (set when the Worker v2 is deployed; null = Sender rows still count).
create table if not exists public.signals_settings (key text primary key, value text, updated_at timestamptz default now());
alter table public.signals_settings enable row level security;
revoke all on table public.signals_settings from public, anon, authenticated;
insert into public.signals_settings (key, value) values ('worker_v2_live_at', null) on conflict do nothing;

-- signals_leads: + Worker events; Sender enzoW5 'API' rows after go-live become 'worker_mirror'.
create or replace view public.signals_leads with (security_invoker = true) as
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
         when s.group_id = 'enzoW5' and s.source = 'API' and s.created_at >= coalesce(
                (select st.value::timestamptz from public.signals_settings st where st.key = 'worker_v2_live_at'),
                'infinity'::timestamptz)                    then 'worker_mirror'
         when public.signals_professional_domain(s.email) is null then 'free_or_invalid_email'
         when public.signals_professional_domain(s.email) in ('monteirofabrics.com', 'viriato.com.pt') then 'internal'
       end
from public.signals_sender_subscribers s
union all
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
from public.signals_shopify_form_submissions f
union all
-- Worker v2: the submission itself, with PostHog id + entry UTMs (first-touch attribution without Sender).
select 'worker:' || e.id,
       case e.kind when 'technical_file' then 'technical_file' else 'contact_form' end,
       e.received_at,
       (e.received_at at time zone 'Europe/Lisbon')::date,
       public.signals_professional_domain(e.email),
       e.email_domain,
       e.company,
       e.country,
       null, null,
       null,
       e.ph_utm_source,
       e.ph_utm_campaign,
       e.ph_landing,
       false,
       case
         when e.is_test                                     then 'test'
         when e.kind = 'contact_form' and exists (
                select 1 from public.signals_shopify_orders o
                where lower(o.email) = lower(e.email)
                  and o.created_at between e.received_at - interval '10 minutes'
                                       and e.received_at + interval '10 minutes')
                                                            then 'sample_echo'
         when public.signals_professional_domain(e.email) is null then 'free_or_invalid_email'
         when public.signals_professional_domain(e.email) in ('monteirofabrics.com', 'viriato.com.pt') then 'internal'
       end
from public.signals_lead_events e;
